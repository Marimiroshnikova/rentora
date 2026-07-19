from datetime import date
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.geo import coords_for_city, haversine_km
from app.models import (
    AvailabilityBlock,
    BlockReason,
    Booking,
    BookingStatus,
    Category,
    Favorite,
    Listing,
    ListingImage,
    ListingStatus,
    Review,
    User,
)
from app.services.booking_service import daterange


def enrich_listing(
    db: Session,
    listing: Listing,
    user: User | None = None,
    *,
    distance_km: float | None = None,
) -> dict:
    rating_row = db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .join(Booking, Review.booking_id == Booking.id)
        .where(Booking.listing_id == listing.id)
    ).one()
    avg_rating = float(rating_row[0]) if rating_row[0] is not None else None
    review_count = int(rating_row[1] or 0)
    is_favorited = False
    if user:
        fav = db.scalars(
            select(Favorite).where(Favorite.user_id == user.id, Favorite.listing_id == listing.id)
        ).first()
        is_favorited = fav is not None
    times_rented = (
        db.scalar(
            select(func.count())
            .select_from(Booking)
            .where(
                Booking.listing_id == listing.id,
                Booking.status == BookingStatus.COMPLETED,
            )
        )
        or 0
    )
    return {
        "avg_rating": avg_rating,
        "review_count": review_count,
        "times_rented": int(times_rented),
        "is_favorited": is_favorited,
        "distance_km": distance_km,
    }


def search_listings(
    db: Session,
    *,
    q: str | None = None,
    category: Category | None = None,
    city: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    start: date | None = None,
    end: date | None = None,
    page: int = 1,
    page_size: int = 12,
    owner_id: int | None = None,
    include_non_active: bool = False,
    user: User | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float | None = None,
    sort: str = "newest",
) -> tuple[list[tuple[Listing, float | None]], int]:
    query = select(Listing).options(
        joinedload(Listing.images),
        joinedload(Listing.owner),
    )
    if owner_id is not None:
        query = query.where(Listing.owner_id == owner_id)
    elif not include_non_active:
        query = query.where(Listing.status == ListingStatus.ACTIVE)

    if q:
        like = f"%{q.strip()}%"
        query = query.where(or_(Listing.title.ilike(like), Listing.description.ilike(like)))
    if category:
        query = query.where(Listing.category == category)
    if city:
        query = query.where(Listing.city.ilike(f"%{city.strip()}%"))
    if min_price is not None:
        query = query.where(Listing.price_per_day >= min_price)
    if max_price is not None:
        query = query.where(Listing.price_per_day <= max_price)

    if start and end and end > start:
        days = daterange(start, end)
        blocked_listing_ids = select(AvailabilityBlock.listing_id).where(AvailabilityBlock.date.in_(days))
        overlapping = select(Booking.listing_id).where(
            Booking.status.in_(
                [
                    BookingStatus.PENDING,
                    BookingStatus.ACCEPTED,
                    BookingStatus.CONFIRMED,
                    BookingStatus.ACTIVE,
                ]
            ),
            Booking.start_date < end,
            Booking.end_date > start,
        )
        query = query.where(Listing.id.not_in(blocked_listing_ids), Listing.id.not_in(overlapping))

    items = list(db.scalars(query).unique().all())

    scored: list[tuple[Listing, float | None]] = []
    if lat is not None and lng is not None:
        radius = radius_km if radius_km is not None else 50.0
        for listing in items:
            if listing.latitude is None or listing.longitude is None:
                continue
            dist = haversine_km(lat, lng, listing.latitude, listing.longitude)
            if dist <= radius:
                scored.append((listing, round(dist, 2)))
    else:
        scored = [(listing, None) for listing in items]

    if sort == "distance" or (sort == "newest" and lat is not None and lng is not None):
        scored.sort(key=lambda pair: pair[1] if pair[1] is not None else 1e9)
    elif sort == "price_asc":
        scored.sort(key=lambda pair: pair[0].price_per_day)
    elif sort == "price_desc":
        scored.sort(key=lambda pair: pair[0].price_per_day, reverse=True)
    elif sort == "rating":
        rating_map: dict[int, float] = {}
        if scored:
            ids = [listing.id for listing, _ in scored]
            rows = db.execute(
                select(Booking.listing_id, func.avg(Review.rating))
                .join(Review, Review.booking_id == Booking.id)
                .where(Booking.listing_id.in_(ids))
                .group_by(Booking.listing_id)
            ).all()
            rating_map = {int(lid): float(avg or 0) for lid, avg in rows}
        scored.sort(key=lambda pair: rating_map.get(pair[0].id, 0.0), reverse=True)
    else:
        scored.sort(key=lambda pair: pair[0].created_at, reverse=True)

    total = len(scored)
    start_idx = (page - 1) * page_size
    page_items = scored[start_idx : start_idx + page_size]
    return page_items, total


def get_listing(db: Session, listing_id: int) -> Listing:
    listing = db.scalars(
        select(Listing)
        .options(joinedload(Listing.images), joinedload(Listing.owner))
        .where(Listing.id == listing_id)
    ).unique().first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


def create_listing(db: Session, owner: User, data: dict, image_urls: list[str]) -> Listing:
    city = data["city"]
    lat = data.get("latitude")
    lng = data.get("longitude")
    if lat is None or lng is None:
        lat, lng = coords_for_city(city)
    listing = Listing(
        owner_id=owner.id,
        title=data["title"],
        description=data["description"],
        category=data["category"],
        price_per_day=data["price_per_day"],
        deposit=data.get("deposit") or Decimal("0"),
        city=city,
        latitude=lat,
        longitude=lng,
        condition=data.get("condition"),
        status=data.get("status") or ListingStatus.ACTIVE,
    )
    db.add(listing)
    db.flush()
    for i, url in enumerate(image_urls):
        db.add(ListingImage(listing_id=listing.id, url=url, sort_order=i))
    if not owner.is_owner:
        owner.is_owner = True
        db.add(owner)
    db.commit()
    return get_listing(db, listing.id)


def update_listing(db: Session, listing: Listing, data: dict) -> Listing:
    for key, value in data.items():
        if value is not None:
            setattr(listing, key, value)
    if "city" in data and data["city"] and data.get("latitude") is None and data.get("longitude") is None:
        lat, lng = coords_for_city(data["city"])
        listing.latitude = lat
        listing.longitude = lng
    db.add(listing)
    db.commit()
    return get_listing(db, listing.id)


def set_manual_availability(db: Session, listing: Listing, dates: list[date]) -> list[AvailabilityBlock]:
    existing_manual = db.scalars(
        select(AvailabilityBlock).where(
            AvailabilityBlock.listing_id == listing.id,
            AvailabilityBlock.reason == BlockReason.MANUAL,
        )
    ).all()
    for b in existing_manual:
        db.delete(b)
    db.flush()
    for d in dates:
        conflict = db.scalars(
            select(AvailabilityBlock).where(
                AvailabilityBlock.listing_id == listing.id,
                AvailabilityBlock.date == d,
            )
        ).first()
        if conflict:
            continue
        db.add(AvailabilityBlock(listing_id=listing.id, date=d, reason=BlockReason.MANUAL))
    db.commit()
    return list(
        db.scalars(select(AvailabilityBlock).where(AvailabilityBlock.listing_id == listing.id)).all()
    )
