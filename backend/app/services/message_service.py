from datetime import datetime, timezone

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models import Booking, BookingRead, Listing, Message, NotificationType, User
from app.services import notification_service


def create_message(db: Session, booking: Booking, sender: User, body: str) -> Message:
    message = Message(booking_id=booking.id, sender_id=sender.id, body=body)
    db.add(message)
    db.flush()

    owner_id = booking.listing.owner_id
    recipient_id = owner_id if sender.id == booking.renter_id else booking.renter_id
    notification_service.create_notification(
        db, user_id=recipient_id, booking=booking, type=NotificationType.NEW_MESSAGE
    )

    db.commit()
    return (
        db.scalars(select(Message).options(joinedload(Message.sender)).where(Message.id == message.id))
        .unique()
        .first()
    )


def mark_thread_read(db: Session, booking_id: int, user: User) -> BookingRead:
    now = datetime.now(timezone.utc)
    row = db.scalars(
        select(BookingRead).where(
            BookingRead.booking_id == booking_id,
            BookingRead.user_id == user.id,
        )
    ).first()
    if row:
        row.last_read_at = now
        db.add(row)
    else:
        row = BookingRead(booking_id=booking_id, user_id=user.id, last_read_at=now)
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


def unread_summary(db: Session, user: User) -> dict:
    """Return total unread + per-booking counts for threads the user is in."""
    party_bookings = db.scalars(
        select(Booking)
        .join(Listing, Booking.listing_id == Listing.id)
        .where(or_(Booking.renter_id == user.id, Listing.owner_id == user.id))
    ).all()
    by_booking: dict[int, int] = {}
    total = 0
    for booking in party_bookings:
        count = unread_for_booking(db, booking.id, user)
        if count:
            by_booking[booking.id] = count
            total += count
    return {"total": total, "by_booking": by_booking}


def unread_for_booking(db: Session, booking_id: int, user: User) -> int:
    watermark = db.scalars(
        select(BookingRead).where(
            BookingRead.booking_id == booking_id,
            BookingRead.user_id == user.id,
        )
    ).first()
    filters = [
        Message.booking_id == booking_id,
        Message.sender_id != user.id,
    ]
    if watermark:
        filters.append(Message.created_at > watermark.last_read_at)
    return int(
        db.scalar(select(func.count()).select_from(Message).where(and_(*filters))) or 0
    )
