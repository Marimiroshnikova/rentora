from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models import Booking, Listing, Review, User


def list_listing_reviews(
    db: Session,
    listing_id: int,
    *,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Review], int]:
    base = (
        select(Review)
        .join(Booking, Review.booking_id == Booking.id)
        .where(Booking.listing_id == listing_id)
    )
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(
            base.options(joinedload(Review.author))
            .order_by(Review.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .unique()
        .all()
    )
    return items, int(total)


def _owner_reviews_base(user_id: int):
    """Reviews left on listings owned by this user (owner reputation)."""
    return (
        select(Review)
        .join(Booking, Review.booking_id == Booking.id)
        .join(Listing, Booking.listing_id == Listing.id)
        .where(Listing.owner_id == user_id)
    )


def owner_review_stats(db: Session, user_id: int) -> tuple[int, float | None]:
    base = _owner_reviews_base(user_id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    avg = db.scalar(
        select(func.avg(Review.rating))
        .join(Booking, Review.booking_id == Booking.id)
        .join(Listing, Booking.listing_id == Listing.id)
        .where(Listing.owner_id == user_id)
    )
    return int(total), float(avg) if avg is not None else None


def list_user_reviews(
    db: Session,
    user_id: int,
    *,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Review], int]:
    base = _owner_reviews_base(user_id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(
            base.options(joinedload(Review.author))
            .order_by(Review.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .unique()
        .all()
    )
    return items, int(total)


def ensure_user_exists(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if not user:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="User not found")
    return user
