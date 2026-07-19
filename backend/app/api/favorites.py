from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import Favorite, Listing, User
from app.schemas.listing import ListingOut
from app.api.listings import to_listing_out
from app.services import listing_service

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[ListingOut])
def list_favorites(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    favs = db.scalars(
        select(Favorite)
        .options(joinedload(Favorite.listing).joinedload(Listing.images), joinedload(Favorite.listing).joinedload(Listing.owner))
        .where(Favorite.user_id == user.id)
    ).unique().all()
    return [to_listing_out(db, f.listing, user) for f in favs if f.listing]


@router.post("/{listing_id}", response_model=dict)
def toggle_favorite(
    listing_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    listing_service.get_listing(db, listing_id)
    existing = db.scalars(
        select(Favorite).where(Favorite.user_id == user.id, Favorite.listing_id == listing_id)
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"favorited": False}
    db.add(Favorite(user_id=user.id, listing_id=listing_id))
    db.commit()
    return {"favorited": True}
