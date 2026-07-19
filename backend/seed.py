"""Load sample users, listings, and demo bookings into the database."""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select, text

from app.database import Base, SessionLocal, engine
from app.geo import coords_for_city
from app.models import (
    AvailabilityBlock,
    BlockReason,
    Booking,
    BookingStatus,
    Category,
    Condition,
    Listing,
    ListingImage,
    ListingStatus,
    Message,
    Review,
    User,
    UserRole,
)
from app.security import hash_password

DEMO_PASSWORD = "Demo1234!"

LISTINGS = [
    {
        "title": "Blush Balloon Arch Kit",
        "description": "Reusable blush and cream balloon arch perfect for birthdays and baby showers.",
        "category": Category.BALLOONS,
        "price_per_day": Decimal("45.00"),
        "deposit": Decimal("30.00"),
        "city": "Tbilisi",
        "condition": Condition.GOOD,
        "offset": (0.01, 0.01),
        "images": ["https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80"],
    },
    {
        "title": "Velvet Photo Backdrop",
        "description": "Deep emerald velvet backdrop ideal for portraits and cake tables.",
        "category": Category.BACKDROPS,
        "price_per_day": Decimal("60.00"),
        "deposit": Decimal("50.00"),
        "city": "Tbilisi",
        "condition": Condition.NEW,
        "offset": (-0.012, 0.018),
        "images": ["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&q=80"],
    },
    {
        "title": "Gold Rim Tableware Set",
        "description": "Elegant plates and flatware for twenty guests.",
        "category": Category.TABLEWARE,
        "price_per_day": Decimal("35.00"),
        "deposit": Decimal("40.00"),
        "city": "Batumi",
        "condition": Condition.GOOD,
        "offset": (0.008, -0.01),
        "images": ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80"],
    },
    {
        "title": "Warm Fairy Light Canopy",
        "description": "Soft warm LED string lights for ceilings or garden tents.",
        "category": Category.LIGHTING,
        "price_per_day": Decimal("28.00"),
        "deposit": Decimal("25.00"),
        "city": "Tbilisi",
        "condition": Condition.GOOD,
        "offset": (0.02, -0.015),
        "images": ["https://images.unsplash.com/photo-1513151233558-d860c5398176?w=900&q=80"],
    },
    {
        "title": "Neon Happy Birthday Sign",
        "description": "Soft pink neon style sign for dessert tables.",
        "category": Category.PROPS,
        "price_per_day": Decimal("40.00"),
        "deposit": Decimal("35.00"),
        "city": "Kutaisi",
        "condition": Condition.NEW,
        "offset": (0.01, 0.012),
        "images": ["https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=900&q=80"],
    },
    {
        "title": "Faux Eucalyptus Centerpieces",
        "description": "Realistic faux greenery arrangements in glass vases.",
        "category": Category.FLORAL,
        "price_per_day": Decimal("32.00"),
        "deposit": Decimal("20.00"),
        "city": "Tbilisi",
        "condition": Condition.GOOD,
        "offset": (-0.018, -0.008),
        "images": ["https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900&q=80"],
    },
    {
        "title": "Kids Party Teepee Set",
        "description": "Three canvas teepees with rugs and pillows for birthday corners.",
        "category": Category.KIDS,
        "price_per_day": Decimal("55.00"),
        "deposit": Decimal("45.00"),
        "city": "Tbilisi",
        "condition": Condition.GOOD,
        "offset": (0.015, 0.022),
        "images": ["https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=80"],
    },
    {
        "title": "Studio Seamless Backdrop",
        "description": "Photography seamless backdrop stand with paper rolls.",
        "category": Category.PHOTOSHOOT,
        "price_per_day": Decimal("50.00"),
        "deposit": Decimal("60.00"),
        "city": "Batumi",
        "condition": Condition.NEW,
        "offset": (-0.01, 0.015),
        "images": ["https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=80"],
    },
    {
        "title": "Chrome Cake Stand Trio",
        "description": "Three mirrored cake stands for dessert displays.",
        "category": Category.TABLEWARE,
        "price_per_day": Decimal("22.00"),
        "deposit": Decimal("30.00"),
        "city": "Tbilisi",
        "condition": Condition.GOOD,
        "offset": (0.006, -0.02),
        "images": ["https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=900&q=80"],
    },
    {
        "title": "Boho Macramé Backdrop",
        "description": "Hand-knotted macramé wall hanging for outdoor ceremonies.",
        "category": Category.BACKDROPS,
        "price_per_day": Decimal("38.00"),
        "deposit": Decimal("25.00"),
        "city": "Kutaisi",
        "condition": Condition.GOOD,
        "offset": (-0.012, -0.01),
        "images": ["https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=900&q=80"],
    },
    {
        "title": "Confetti Cannon Bundle",
        "description": "Biodegradable confetti cannons for grand entrances.",
        "category": Category.PROPS,
        "price_per_day": Decimal("18.00"),
        "deposit": Decimal("15.00"),
        "city": "Tbilisi",
        "condition": Condition.NEW,
        "offset": (0.025, 0.005),
        "images": ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80"],
    },
    {
        "title": "Uplighting Light Set",
        "description": "RGB uplights to wash walls in custom party colors.",
        "category": Category.LIGHTING,
        "price_per_day": Decimal("70.00"),
        "deposit": Decimal("80.00"),
        "city": "Batumi",
        "condition": Condition.GOOD,
        "offset": (0.014, 0.008),
        "images": ["https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80"],
    },
    {
        "title": "Pastel Balloon Garland Kit",
        "description": "Pre-sorted pastel balloons with strip and glue dots.",
        "category": Category.BALLOONS,
        "price_per_day": Decimal("30.00"),
        "deposit": Decimal("20.00"),
        "city": "Tbilisi",
        "condition": Condition.NEW,
        "offset": (-0.008, 0.025),
        "images": ["https://images.unsplash.com/photo-1527529485562-3053d314bcb0?w=900&q=80"],
    },
    {
        "title": "Vintage Suitcase Prop Stack",
        "description": "Three stacked vintage-style suitcases for photoshoots.",
        "category": Category.PHOTOSHOOT,
        "price_per_day": Decimal("25.00"),
        "deposit": Decimal("35.00"),
        "city": "Tbilisi",
        "condition": Condition.FAIR,
        "offset": (0.004, -0.028),
        "images": ["https://images.unsplash.com/photo-1566576721346-d77f162ed284?w=900&q=80"],
    },
    {
        "title": "White Chair Cover Set",
        "description": "Stretch covers with optional sashes for thirty chairs.",
        "category": Category.OTHER,
        "price_per_day": Decimal("40.00"),
        "deposit": Decimal("50.00"),
        "city": "Tbilisi",
        "condition": Condition.GOOD,
        "offset": (-0.022, 0.012),
        "images": ["https://images.unsplash.com/photo-1519167758481-83f150364342?w=900&q=80"],
    },
]


def ensure_geo_columns() -> None:
    with engine.begin() as conn:
        cols = {row[1] for row in conn.execute(text("PRAGMA table_info(listings)")).fetchall()}
        if "latitude" not in cols:
            conn.execute(text("ALTER TABLE listings ADD COLUMN latitude FLOAT"))
        if "longitude" not in cols:
            conn.execute(text("ALTER TABLE listings ADD COLUMN longitude FLOAT"))


def _listing_coords(item: dict) -> tuple[float, float]:
    base_lat, base_lng = coords_for_city(item["city"])
    dlat, dlng = item.get("offset", (0.0, 0.0))
    return base_lat + dlat, base_lng + dlng


def _refresh_listings(db, owner: User) -> None:
    existing = list(db.scalars(select(Listing).where(Listing.owner_id == owner.id).order_by(Listing.id)).all())
    for idx, item in enumerate(LISTINGS):
        lat, lng = _listing_coords(item)
        data = {k: v for k, v in item.items() if k not in {"images", "offset"}}
        if idx < len(existing):
            listing = existing[idx]
            for key, value in data.items():
                setattr(listing, key, value)
            listing.latitude = lat
            listing.longitude = lng
            listing.status = ListingStatus.ACTIVE
            for img in list(listing.images):
                db.delete(img)
            db.flush()
        else:
            listing = Listing(
                owner_id=owner.id,
                status=ListingStatus.ACTIVE,
                latitude=lat,
                longitude=lng,
                **data,
            )
            db.add(listing)
            db.flush()
        for i, url in enumerate(item["images"]):
            db.add(ListingImage(listing_id=listing.id, url=url, sort_order=i))
    db.commit()
    print("Listings refreshed with photos and map coordinates.")


def _seed_bookings(db, owner: User, renter: User) -> None:
    listings = list(
        db.scalars(select(Listing).where(Listing.owner_id == owner.id).order_by(Listing.id)).all()
    )
    if len(listings) < 3:
        print("Not enough listings for demo bookings.")
        return

    today = date.today()
    samples = [
        (listings[0], today + timedelta(days=10), today + timedelta(days=12), BookingStatus.PENDING, None, None),
        (listings[1], today + timedelta(days=5), today + timedelta(days=6), BookingStatus.ACCEPTED, None, None),
        (
            listings[2],
            today + timedelta(days=2),
            today + timedelta(days=3),
            BookingStatus.CONFIRMED,
            datetime.now(timezone.utc),
            None,
        ),
        (
            listings[0],
            today - timedelta(days=20),
            today - timedelta(days=18),
            BookingStatus.COMPLETED,
            datetime.now(timezone.utc) - timedelta(days=20),
            (5, "Beautiful arch. Easy pickup and looked perfect in photos."),
        ),
        (
            listings[1],
            today - timedelta(days=14),
            today - timedelta(days=13),
            BookingStatus.COMPLETED,
            datetime.now(timezone.utc) - timedelta(days=14),
            (4, "Great backdrop quality. Owner was quick to reply."),
        ),
    ]
    created = 0
    reviews_created = 0
    for listing, start, end, status, paid_at, review in samples:
        already = db.scalars(
            select(Booking).where(
                Booking.listing_id == listing.id,
                Booking.renter_id == renter.id,
                Booking.status == status,
                Booking.start_date == start,
            )
        ).first()
        if already:
            booking = already
        else:
            days = max((end - start).days + 1, 1)
            total = Decimal(listing.price_per_day) * days
            booking = Booking(
                listing_id=listing.id,
                renter_id=renter.id,
                start_date=start,
                end_date=end,
                total_price=total,
                deposit=listing.deposit,
                status=status,
                paid_at=paid_at,
            )
            db.add(booking)
            db.flush()
            created += 1
        if review:
            rating, comment = review
            existing_review = db.scalars(
                select(Review).where(
                    Review.booking_id == booking.id,
                    Review.author_id == renter.id,
                )
            ).first()
            if not existing_review:
                db.add(
                    Review(
                        booking_id=booking.id,
                        author_id=renter.id,
                        rating=rating,
                        comment=comment,
                    )
                )
                reviews_created += 1
            else:
                existing_review.rating = rating
                existing_review.comment = comment
                db.add(existing_review)
    db.commit()
    if created:
        print(f"Demo bookings added: {created}.")
    else:
        print("Demo bookings already present.")
    if reviews_created:
        print(f"Demo reviews added: {reviews_created}.")

    # Block a few future dates on the first listing for demo conflict UX
    block_days = [today + timedelta(days=3), today + timedelta(days=4)]
    blocks_added = 0
    for d in block_days:
        exists = db.scalars(
            select(AvailabilityBlock).where(
                AvailabilityBlock.listing_id == listings[0].id,
                AvailabilityBlock.date == d,
            )
        ).first()
        if not exists:
            db.add(
                AvailabilityBlock(
                    listing_id=listings[0].id,
                    date=d,
                    reason=BlockReason.MANUAL,
                )
            )
            blocks_added += 1
    # Seed a chat message on the accepted booking
    accepted = db.scalars(
        select(Booking).where(
            Booking.renter_id == renter.id,
            Booking.status == BookingStatus.ACCEPTED,
        )
    ).first()
    msgs_added = 0
    if accepted:
        has_msg = db.scalars(select(Message).where(Message.booking_id == accepted.id)).first()
        if not has_msg:
            db.add(
                Message(
                    booking_id=accepted.id,
                    sender_id=owner.id,
                    body="Hi! Pickup works anytime after 10:00 near Vake.",
                )
            )
            msgs_added += 1
    db.commit()
    if blocks_added:
        print(f"Availability blocks added: {blocks_added}.")
    if msgs_added:
        print(f"Demo chat messages added: {msgs_added}.")


def _seed_admin_reputation(db, admin: User, renter: User) -> None:
    """Give the admin account a small listing + completed review for profile demos."""
    listing = db.scalars(select(Listing).where(Listing.owner_id == admin.id)).first()
    if not listing:
        lat, lng = coords_for_city("Tbilisi")
        listing = Listing(
            owner_id=admin.id,
            title="Gold Candle Holder Set",
            description="Set of 12 gold candle holders for dinner tables and ceremonies.",
            category=Category.TABLEWARE,
            price_per_day=Decimal("28.00"),
            deposit=Decimal("20.00"),
            city="Tbilisi",
            condition=Condition.GOOD,
            status=ListingStatus.ACTIVE,
            latitude=lat + 0.008,
            longitude=lng - 0.006,
        )
        db.add(listing)
        db.flush()
        db.add(
            ListingImage(
                listing_id=listing.id,
                url="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=80",
                sort_order=0,
            )
        )

    today = date.today()
    start = today - timedelta(days=28)
    end = today - timedelta(days=27)
    booking = db.scalars(
        select(Booking).where(
            Booking.listing_id == listing.id,
            Booking.renter_id == renter.id,
            Booking.status == BookingStatus.COMPLETED,
        )
    ).first()
    if not booking:
        booking = Booking(
            listing_id=listing.id,
            renter_id=renter.id,
            start_date=start,
            end_date=end,
            total_price=Decimal("56.00"),
            deposit=listing.deposit,
            status=BookingStatus.COMPLETED,
            paid_at=datetime.now(timezone.utc) - timedelta(days=28),
        )
        db.add(booking)
        db.flush()

    review_comment = "Reliable host. Items arrived clean and on time."
    review = db.scalars(
        select(Review).where(Review.booking_id == booking.id, Review.author_id == renter.id)
    ).first()
    if not review:
        db.add(
            Review(
                booking_id=booking.id,
                author_id=renter.id,
                rating=5,
                comment=review_comment,
            )
        )
    else:
        review.rating = 5
        review.comment = review_comment
        db.add(review)
    admin.bio = admin.bio or "Helping hosts and renters keep celebrations beautiful."
    db.commit()
    print("Admin reputation sample ready.")


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_geo_columns()
    db = SessionLocal()
    try:
        admin = db.scalars(select(User).where(User.email == "admin@rentora.demo")).first()
        owner = db.scalars(select(User).where(User.email == "owner@rentora.demo")).first()
        renter = db.scalars(select(User).where(User.email == "renter@rentora.demo")).first()
        if owner and renter:
            _refresh_listings(db, owner)
            _seed_bookings(db, owner, renter)
            if admin:
                _seed_admin_reputation(db, admin, renter)
            print("Users already seeded - listings/bookings/reviews refreshed.")
            print(f"  Admin panel: admin@rentora.demo / {DEMO_PASSWORD}")
            print(f"  Logged-in view: renter@rentora.demo / {DEMO_PASSWORD}")
            return

        admin = User(
            email="admin@rentora.demo",
            password_hash=hash_password(DEMO_PASSWORD),
            full_name="მარიამ მ.",
            city="Tbilisi",
            role=UserRole.ADMIN,
            is_owner=True,
            bio="Helping hosts and renters keep celebrations beautiful.",
        )
        owner = User(
            email="owner@rentora.demo",
            password_hash=hash_password(DEMO_PASSWORD),
            full_name="ნინო დეკორი",
            city="Tbilisi",
            role=UserRole.USER,
            is_owner=True,
            bio="Event stylist sharing party decor across Georgia.",
        )
        renter = User(
            email="renter@rentora.demo",
            password_hash=hash_password(DEMO_PASSWORD),
            full_name="გიორგი გ.",
            city="Batumi",
            role=UserRole.USER,
            is_owner=False,
            bio="Hosting birthdays and photoshoots.",
        )
        db.add_all([admin, owner, renter])
        db.flush()
        _refresh_listings(db, owner)
        _seed_bookings(db, owner, renter)
        _seed_admin_reputation(db, admin, renter)
        print("Seed complete.")
        print(f"  Admin panel: admin@rentora.demo / {DEMO_PASSWORD}")
        print(f"  Logged-in view: renter@rentora.demo / {DEMO_PASSWORD}")
        print(f"  Owner (listings): owner@rentora.demo / {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
