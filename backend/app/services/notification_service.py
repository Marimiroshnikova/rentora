from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models import Booking, Listing, Notification, NotificationType, User


def create_notification(
    db: Session, *, user_id: int, booking: Booking, type: NotificationType
) -> Notification:
    notification = Notification(user_id=user_id, booking_id=booking.id, type=type)
    db.add(notification)
    db.flush()
    return notification


def _base_query():
    return select(Notification).options(
        joinedload(Notification.booking).joinedload(Booking.listing).joinedload(Listing.images),
        joinedload(Notification.booking).joinedload(Booking.renter),
    )


def list_notifications(
    db: Session, user: User, *, page: int = 1, page_size: int = 20
) -> tuple[list[Notification], int]:
    total = int(
        db.scalar(
            select(func.count()).select_from(Notification).where(Notification.user_id == user.id)
        )
        or 0
    )
    items = (
        db.scalars(
            _base_query()
            .where(Notification.user_id == user.id)
            .order_by(Notification.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .unique()
        .all()
    )
    return list(items), total


def unread_count(db: Session, user: User) -> int:
    return int(
        db.scalar(
            select(func.count()).select_from(Notification).where(
                Notification.user_id == user.id, Notification.is_read.is_(False)
            )
        )
        or 0
    )


def mark_read(db: Session, user: User, notification_id: int) -> Notification | None:
    notification = db.scalars(
        _base_query().where(Notification.id == notification_id, Notification.user_id == user.id)
    ).unique().first()
    if not notification:
        return None
    if not notification.is_read:
        notification.is_read = True
        db.add(notification)
        db.commit()
        db.refresh(notification)
    return notification


def mark_all_read(db: Session, user: User) -> None:
    db.query(Notification).filter(
        Notification.user_id == user.id, Notification.is_read.is_(False)
    ).update({"is_read": True})
    db.commit()
