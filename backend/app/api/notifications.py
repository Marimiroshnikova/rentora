from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.notification import NotificationListOut, NotificationOut, UnreadCountOut
from app.services import booking_service, notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


def to_notification_out(notification) -> NotificationOut:
    out = NotificationOut.model_validate(notification)
    if out.booking is not None:
        out.booking = out.booking.model_copy(
            update={"effective_status": booking_service.effective_status(notification.booking)}
        )
    return out


@router.get("", response_model=NotificationListOut)
def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items, total = notification_service.list_notifications(db, user, page=page, page_size=page_size)
    return NotificationListOut(
        items=[to_notification_out(n) for n in items], total=total, page=page, page_size=page_size
    )


@router.get("/unread-count", response_model=UnreadCountOut)
def get_unread_count(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return UnreadCountOut(count=notification_service.unread_count(db, user))


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    notification = notification_service.mark_read(db, user, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return to_notification_out(notification)


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    notification_service.mark_all_read(db, user)
    return {"ok": True}
