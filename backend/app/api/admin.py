from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session, joinedload

from app.api.listings import to_listing_out
from app.database import get_db
from app.deps import require_admin
from app.models import Booking, Listing, ListingStatus, User
from app.schemas.admin import (
    AdminBookingOut,
    AdminBookingsOut,
    AdminListingPatch,
    AdminListingsOut,
    AdminStats,
    AdminUsersOut,
)
from app.schemas.listing import ListingOut
from app.schemas.user import UserOut
from app.services import listing_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    users = db.scalar(select(func.count()).select_from(User)) or 0
    listings = db.scalar(select(func.count()).select_from(Listing)) or 0
    active_listings = (
        db.scalar(select(func.count()).select_from(Listing).where(Listing.status == ListingStatus.ACTIVE)) or 0
    )
    bookings = db.scalar(select(func.count()).select_from(Booking)) or 0
    bookings_this_month = (
        db.scalar(
            select(func.count())
            .select_from(Booking)
            .where(
                extract("year", Booking.created_at) == now.year,
                extract("month", Booking.created_at) == now.month,
            )
        )
        or 0
    )
    return AdminStats(
        users=users,
        listings=listings,
        active_listings=active_listings,
        bookings=bookings,
        bookings_this_month=bookings_this_month,
    )


@router.get("/users", response_model=AdminUsersOut)
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return AdminUsersOut(items=[UserOut.model_validate(u) for u in users])


@router.get("/listings", response_model=AdminListingsOut)
def list_listings(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    items = db.scalars(
        select(Listing).options(joinedload(Listing.images), joinedload(Listing.owner)).order_by(Listing.created_at.desc())
    ).unique().all()
    return AdminListingsOut(items=[to_listing_out(db, i, admin) for i in items])


@router.patch("/listings/{listing_id}", response_model=ListingOut)
def patch_listing(
    listing_id: int,
    payload: AdminListingPatch,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    listing = listing_service.get_listing(db, listing_id)
    if payload.status not in {ListingStatus.HIDDEN, ListingStatus.ACTIVE, ListingStatus.PAUSED}:
        raise HTTPException(status_code=400, detail="Invalid status")
    listing = listing_service.update_listing(db, listing, {"status": payload.status})
    return to_listing_out(db, listing, admin)


@router.get("/bookings", response_model=AdminBookingsOut)
def list_bookings(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = (
        db.scalars(
            select(Booking)
            .options(
                joinedload(Booking.listing).joinedload(Listing.owner),
                joinedload(Booking.renter),
            )
            .order_by(Booking.created_at.desc())
        )
        .unique()
        .all()
    )
    items = [
        AdminBookingOut(
            id=b.id,
            listing_id=b.listing_id,
            listing_title=b.listing.title if b.listing else f"#{b.listing_id}",
            listing_city=b.listing.city if b.listing else "",
            renter_name=b.renter.full_name if b.renter else "",
            renter_email=b.renter.email if b.renter else "",
            owner_name=b.listing.owner.full_name if b.listing and b.listing.owner else "",
            start_date=b.start_date,
            end_date=b.end_date,
            total_price=b.total_price,
            status=b.status,
            created_at=b.created_at,
        )
        for b in rows
    ]
    return AdminBookingsOut(items=items)
