from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import (
    AvailabilityBlock,
    BlockReason,
    Booking,
    BookingStatus,
    Listing,
    ListingStatus,
    Message,
    NotificationType,
    User,
)
from app.services import notification_service


BLOCKING_STATUSES = {
    BookingStatus.PENDING,
    BookingStatus.ACCEPTED,
    BookingStatus.CONFIRMED,
    BookingStatus.ACTIVE,
}


def daterange(start: date, end: date) -> list[date]:
    """Return each date from start inclusive to end exclusive."""
    days = (end - start).days
    return [start + timedelta(days=i) for i in range(days)]


def effective_status(booking: Booking, today: date | None = None) -> BookingStatus:
    today = today or date.today()
    if booking.status == BookingStatus.CONFIRMED:
        if today > booking.end_date:
            return BookingStatus.COMPLETED
        if booking.start_date <= today <= booking.end_date:
            return BookingStatus.ACTIVE
    if booking.status == BookingStatus.ACTIVE and today > booking.end_date:
        return BookingStatus.COMPLETED
    return booking.status


def sync_booking_status(db: Session, booking: Booking) -> Booking:
    eff = effective_status(booking)
    if eff != booking.status and eff in {BookingStatus.ACTIVE, BookingStatus.COMPLETED}:
        booking.status = eff
        db.add(booking)
        db.commit()
        db.refresh(booking)
    return booking


def assert_dates_available(db: Session, listing_id: int, start: date, end: date, exclude_booking_id: int | None = None) -> None:
    if end <= start:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")
    if start < date.today():
        raise HTTPException(status_code=400, detail="start_date cannot be in the past")

    days = daterange(start, end)
    if not days:
        raise HTTPException(status_code=400, detail="Rental must be at least 1 day")

    blocked = db.scalars(
        select(AvailabilityBlock).where(
            AvailabilityBlock.listing_id == listing_id,
            AvailabilityBlock.date.in_(days),
        )
    ).all()
    if blocked:
        raise HTTPException(status_code=409, detail="Selected dates are unavailable")

    query = select(Booking).where(
        Booking.listing_id == listing_id,
        Booking.status.in_(list(BLOCKING_STATUSES)),
        Booking.start_date < end,
        Booking.end_date > start,
    )
    if exclude_booking_id:
        query = query.where(Booking.id != exclude_booking_id)
    overlap = db.scalars(query).first()
    if overlap:
        raise HTTPException(status_code=409, detail="Selected dates overlap an existing booking")


def create_booking(
    db: Session,
    *,
    listing_id: int,
    renter: User,
    start_date: date,
    end_date: date,
    message: str | None = None,
) -> Booking:
    listing = db.get(Listing, listing_id)
    if not listing or listing.status != ListingStatus.ACTIVE:
        raise HTTPException(status_code=404, detail="Listing not found or not available")
    if listing.owner_id == renter.id:
        raise HTTPException(status_code=400, detail="Cannot book your own listing")

    assert_dates_available(db, listing_id, start_date, end_date)
    days = len(daterange(start_date, end_date))
    total = (Decimal(days) * listing.price_per_day).quantize(Decimal("0.01"))

    booking = Booking(
        listing_id=listing_id,
        renter_id=renter.id,
        start_date=start_date,
        end_date=end_date,
        total_price=total,
        deposit=listing.deposit,
        status=BookingStatus.PENDING,
    )
    db.add(booking)
    db.flush()

    db.add(
        Message(
            booking_id=booking.id,
            sender_id=renter.id,
            is_system=True,
            body=(
                "Customer requested to rent this decoration.\n"
                "მომხმარებელმა მოითხოვა აღნიშნული დეკორაციის დაჯავშნა."
            ),
        )
    )
    if message:
        db.add(Message(booking_id=booking.id, sender_id=renter.id, body=message))

    notification_service.create_notification(
        db, user_id=listing.owner_id, booking=booking, type=NotificationType.BOOKING_REQUESTED
    )

    db.commit()
    return get_booking(db, booking.id)


def get_booking(db: Session, booking_id: int) -> Booking:
    booking = db.scalars(
        select(Booking)
        .options(
            joinedload(Booking.listing).joinedload(Listing.images),
            joinedload(Booking.renter),
            joinedload(Booking.messages),
        )
        .where(Booking.id == booking_id)
    ).unique().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return sync_booking_status(db, booking)


def list_bookings(db: Session, user: User, as_owner: bool) -> list[Booking]:
    if as_owner:
        query = (
            select(Booking)
            .join(Listing)
            .options(
                joinedload(Booking.listing).joinedload(Listing.images),
                joinedload(Booking.renter),
            )
            .where(Listing.owner_id == user.id)
            .order_by(Booking.created_at.desc())
        )
    else:
        query = (
            select(Booking)
            .options(
                joinedload(Booking.listing).joinedload(Listing.images),
                joinedload(Booking.renter),
            )
            .where(Booking.renter_id == user.id)
            .order_by(Booking.created_at.desc())
        )
    bookings = list(db.scalars(query).unique().all())
    return [sync_booking_status(db, b) for b in bookings]


def _assert_party(booking: Booking, user: User) -> None:
    owner_id = booking.listing.owner_id if booking.listing else None
    if user.id not in {booking.renter_id, owner_id} and user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not a participant of this booking")


def apply_action(db: Session, booking_id: int, user: User, action: str) -> Booking:
    booking = get_booking(db, booking_id)
    action = action.lower().strip()
    owner_id = booking.listing.owner_id

    notify_user_id: int | None = None
    notify_type: NotificationType | None = None

    if action == "accept":
        if user.id != owner_id:
            raise HTTPException(status_code=403, detail="Only the owner can accept")
        if booking.status != BookingStatus.PENDING:
            raise HTTPException(status_code=400, detail="Only pending bookings can be accepted")
        assert_dates_available(db, booking.listing_id, booking.start_date, booking.end_date, booking.id)
        booking.status = BookingStatus.ACCEPTED
        notify_user_id, notify_type = booking.renter_id, NotificationType.BOOKING_ACCEPTED
    elif action == "decline":
        if user.id != owner_id:
            raise HTTPException(status_code=403, detail="Only the owner can decline")
        if booking.status != BookingStatus.PENDING:
            raise HTTPException(status_code=400, detail="Only pending bookings can be declined")
        booking.status = BookingStatus.DECLINED
        notify_user_id, notify_type = booking.renter_id, NotificationType.BOOKING_DECLINED
    elif action == "cancel":
        if user.id not in {booking.renter_id, owner_id}:
            raise HTTPException(status_code=403, detail="Not allowed")
        if booking.status not in {BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.CONFIRMED}:
            raise HTTPException(status_code=400, detail="Cannot cancel this booking")
        if booking.status == BookingStatus.CONFIRMED and date.today() >= booking.start_date:
            raise HTTPException(status_code=400, detail="Cannot cancel after rental has started")
        if booking.status == BookingStatus.CONFIRMED:
            _clear_booked_blocks(db, booking)
        booking.status = BookingStatus.CANCELLED
        notify_user_id = owner_id if user.id == booking.renter_id else booking.renter_id
        notify_type = NotificationType.BOOKING_CANCELLED
    elif action == "complete":
        if user.id not in {booking.renter_id, owner_id}:
            raise HTTPException(status_code=403, detail="Not allowed")
        if effective_status(booking) not in {BookingStatus.ACTIVE, BookingStatus.CONFIRMED, BookingStatus.COMPLETED}:
            raise HTTPException(status_code=400, detail="Booking cannot be completed yet")
        booking.status = BookingStatus.COMPLETED
        notify_user_id = owner_id if user.id == booking.renter_id else booking.renter_id
        notify_type = NotificationType.BOOKING_COMPLETED
    else:
        raise HTTPException(status_code=400, detail="Unknown action")

    db.add(booking)
    db.flush()
    if notify_user_id is not None and notify_type is not None:
        notification_service.create_notification(
            db, user_id=notify_user_id, booking=booking, type=notify_type
        )
    db.commit()
    return get_booking(db, booking.id)


def demo_pay(db: Session, booking_id: int, renter: User) -> Booking:
    booking = get_booking(db, booking_id)
    if booking.renter_id != renter.id:
        raise HTTPException(status_code=403, detail="Only the renter can pay")
    if booking.status not in {BookingStatus.PENDING, BookingStatus.ACCEPTED}:
        raise HTTPException(status_code=400, detail="Booking is not awaiting payment")
    # If still pending, treat pay as accept+pay for smoother demo when owner already okay
    if booking.status == BookingStatus.PENDING:
        # Require owner accept first per plan
        raise HTTPException(status_code=400, detail="Owner must accept before payment")

    assert_dates_available(db, booking.listing_id, booking.start_date, booking.end_date, booking.id)
    booking.status = BookingStatus.CONFIRMED
    booking.paid_at = datetime.now(timezone.utc)
    for d in daterange(booking.start_date, booking.end_date):
        exists = db.scalars(
            select(AvailabilityBlock).where(
                AvailabilityBlock.listing_id == booking.listing_id,
                AvailabilityBlock.date == d,
            )
        ).first()
        if not exists:
            db.add(
                AvailabilityBlock(
                    listing_id=booking.listing_id,
                    date=d,
                    reason=BlockReason.BOOKED,
                )
            )
    db.add(booking)
    db.flush()
    notification_service.create_notification(
        db, user_id=booking.listing.owner_id, booking=booking, type=NotificationType.PAYMENT_SUCCEEDED
    )
    db.commit()
    return get_booking(db, booking.id)


def _clear_booked_blocks(db: Session, booking: Booking) -> None:
    days = daterange(booking.start_date, booking.end_date)
    blocks = db.scalars(
        select(AvailabilityBlock).where(
            AvailabilityBlock.listing_id == booking.listing_id,
            AvailabilityBlock.date.in_(days),
            AvailabilityBlock.reason == BlockReason.BOOKED,
        )
    ).all()
    for b in blocks:
        db.delete(b)


def assert_booking_party(db: Session, booking_id: int, user: User) -> Booking:
    booking = get_booking(db, booking_id)
    _assert_party(booking, user)
    return booking
