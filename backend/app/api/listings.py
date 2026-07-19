import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user, get_current_user_optional, require_owner
from app.models import AvailabilityBlock, Category, Listing, ListingImage, ListingStatus, User
from app.schemas.booking import ReviewListOut, ReviewOut
from app.schemas.listing import (
    AvailabilityOut,
    AvailabilityUpdate,
    ListingCreate,
    ListingListOut,
    ListingOut,
    ListingUpdate,
)
from app.services import listing_service, review_service
from app.upload_utils import read_and_validate_image

router = APIRouter(prefix="/listings", tags=["listings"])
settings = get_settings()


def to_listing_out(
    db: Session,
    listing: Listing,
    user: User | None = None,
    *,
    distance_km: float | None = None,
) -> ListingOut:
    extra = listing_service.enrich_listing(db, listing, user, distance_km=distance_km)
    base = ListingOut.model_validate(listing)
    if base.owner is not None:
        owner_count, owner_avg = review_service.owner_review_stats(db, listing.owner_id)
        extra = {
            **extra,
            "owner": base.owner.model_copy(
                update={"avg_rating": owner_avg, "review_count": owner_count}
            ),
        }
    return base.model_copy(update=extra)


@router.get("", response_model=ListingListOut)
def list_listings(
    q: str | None = None,
    category: Category | None = None,
    city: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    start: date | None = None,
    end: date | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float | None = Query(default=None, ge=1, le=500),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    sort: str | None = Query(
        default="newest",
        pattern="^(newest|price_asc|price_desc|rating|distance)$",
    ),
    owner_id: int | None = None,
    mine: bool = False,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    oid = owner_id
    include_non_active = False
    if mine:
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        oid = user.id
        include_non_active = True
    pairs, total = listing_service.search_listings(
        db,
        q=q,
        category=category,
        city=city,
        min_price=min_price,
        max_price=max_price,
        start=start,
        end=end,
        page=page,
        page_size=page_size,
        owner_id=oid,
        include_non_active=include_non_active,
        sort=sort or "newest",
        user=user,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
    )
    return ListingListOut(
        items=[to_listing_out(db, listing, user, distance_km=dist) for listing, dist in pairs],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{listing_id}", response_model=ListingOut)
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    listing = listing_service.get_listing(db, listing_id)
    if listing.status == ListingStatus.HIDDEN and (not user or (user.id != listing.owner_id and user.role.value != "ADMIN")):
        raise HTTPException(status_code=404, detail="Listing not found")
    return to_listing_out(db, listing, user)


@router.get("/{listing_id}/reviews", response_model=ReviewListOut)
def list_listing_reviews(
    listing_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    listing = listing_service.get_listing(db, listing_id)
    if listing.status == ListingStatus.HIDDEN and (
        not user or (user.id != listing.owner_id and user.role.value != "ADMIN")
    ):
        raise HTTPException(status_code=404, detail="Listing not found")
    items, total = review_service.list_listing_reviews(
        db, listing_id, page=page, page_size=page_size
    )
    return ReviewListOut(
        items=[ReviewOut.model_validate(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=ListingOut, status_code=status.HTTP_201_CREATED)
def create_listing(
    payload: ListingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    image_urls = data.pop("image_urls", [])
    listing = listing_service.create_listing(db, user, data, image_urls)
    return to_listing_out(db, listing, user)


@router.patch("/{listing_id}", response_model=ListingOut)
def update_listing(
    listing_id: int,
    payload: ListingUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    listing = listing_service.get_listing(db, listing_id)
    if listing.owner_id != user.id and user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not your listing")
    listing = listing_service.update_listing(db, listing, payload.model_dump(exclude_unset=True))
    return to_listing_out(db, listing, user)


@router.delete("/{listing_id}", response_model=ListingOut)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    listing = listing_service.get_listing(db, listing_id)
    if listing.owner_id != user.id and user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not your listing")
    listing = listing_service.update_listing(db, listing, {"status": ListingStatus.PAUSED})
    return to_listing_out(db, listing, user)


@router.post("/{listing_id}/images", response_model=ListingOut)
async def upload_images(
    listing_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_owner),
):
    listing = listing_service.get_listing(db, listing_id)
    if listing.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
    current_max = max((img.sort_order for img in listing.images), default=-1)
    for i, file in enumerate(files):
        content, out_ext = await read_and_validate_image(file)
        name = f"{uuid.uuid4().hex}{out_ext}"
        dest = settings.upload_path / name
        dest.write_bytes(content)
        db.add(
            ListingImage(
                listing_id=listing.id,
                url=f"/uploads/{name}",
                sort_order=current_max + 1 + i,
            )
        )
    db.commit()
    listing = listing_service.get_listing(db, listing_id)
    return to_listing_out(db, listing, user)


@router.get("/{listing_id}/availability", response_model=list[AvailabilityOut])
def get_availability(listing_id: int, db: Session = Depends(get_db)):
    listing_service.get_listing(db, listing_id)
    blocks = db.scalars(
        select(AvailabilityBlock).where(AvailabilityBlock.listing_id == listing_id)
    ).all()
    return [AvailabilityOut.model_validate(b) for b in blocks]


@router.put("/{listing_id}/availability", response_model=list[AvailabilityOut])
def put_availability(
    listing_id: int,
    payload: AvailabilityUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_owner),
):
    listing = listing_service.get_listing(db, listing_id)
    if listing.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
    blocks = listing_service.set_manual_availability(db, listing, payload.dates)
    return [AvailabilityOut.model_validate(b) for b in blocks]
