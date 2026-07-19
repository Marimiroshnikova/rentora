from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import BookingStatus, Message, Review, User
from app.rate_limit import client_ip, message_limiter
from app.schemas.booking import (
    BookingAction,
    BookingCreate,
    BookingOut,
    MessageCreate,
    MessageOut,
    ReviewCreate,
    ReviewOut,
    UnreadSummaryOut,
)
from app.services import booking_service, message_service

router = APIRouter(prefix="/bookings", tags=["bookings"])


def to_booking_out(booking) -> BookingOut:
    out = BookingOut.model_validate(booking)
    return out.model_copy(update={"effective_status": booking_service.effective_status(booking)})


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    booking = booking_service.create_booking(
        db,
        listing_id=payload.listing_id,
        renter=user,
        start_date=payload.start_date,
        end_date=payload.end_date,
        message=payload.message,
    )
    return to_booking_out(booking)


@router.get("", response_model=list[BookingOut])
def list_bookings(
    as_role: str = Query("renter", alias="as", pattern="^(renter|owner)$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bookings = booking_service.list_bookings(db, user, as_owner=(as_role == "owner"))
    return [to_booking_out(b) for b in bookings]


@router.get("/unread-summary", response_model=UnreadSummaryOut)
def get_unread_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return UnreadSummaryOut(**message_service.unread_summary(db, user))


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    booking = booking_service.assert_booking_party(db, booking_id, user)
    return to_booking_out(booking)


@router.patch("/{booking_id}", response_model=BookingOut)
def patch_booking(
    booking_id: int,
    payload: BookingAction,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    booking = booking_service.apply_action(db, booking_id, user, payload.action)
    return to_booking_out(booking)


@router.post("/{booking_id}/pay", response_model=BookingOut)
def pay_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    booking = booking_service.demo_pay(db, booking_id, user)
    return to_booking_out(booking)


@router.get("/{booking_id}/messages", response_model=list[MessageOut])
def get_messages(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    booking_service.assert_booking_party(db, booking_id, user)
    messages = (
        db.scalars(
            select(Message)
            .options(joinedload(Message.sender))
            .where(Message.booking_id == booking_id)
            .order_by(Message.created_at.asc())
        )
        .unique()
        .all()
    )
    message_service.mark_thread_read(db, booking_id, user)
    return [MessageOut.model_validate(m) for m in messages]


@router.post("/{booking_id}/messages/read", response_model=UnreadSummaryOut)
def mark_messages_read(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    booking_service.assert_booking_party(db, booking_id, user)
    message_service.mark_thread_read(db, booking_id, user)
    return UnreadSummaryOut(**message_service.unread_summary(db, user))


@router.post("/{booking_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def post_message(
    booking_id: int,
    payload: MessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    message_limiter.check(f"msg:{user.id}:{client_ip(request)}")
    booking = booking_service.assert_booking_party(db, booking_id, user)
    msg = message_service.create_message(db, booking, user, payload.body.strip())
    return MessageOut.model_validate(msg)


@router.post("/{booking_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def post_review(
    booking_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    booking = booking_service.assert_booking_party(db, booking_id, user)
    if user.id != booking.renter_id:
        raise HTTPException(status_code=403, detail="Only the renter can leave a review")
    eff = booking_service.effective_status(booking)
    if eff != BookingStatus.COMPLETED and booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only review completed bookings")
    existing = db.scalars(
        select(Review).where(Review.booking_id == booking_id, Review.author_id == user.id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this booking")
    if booking.status != BookingStatus.COMPLETED:
        booking.status = BookingStatus.COMPLETED
        db.add(booking)
    review = Review(
        booking_id=booking_id,
        author_id=user.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    review = (
        db.scalars(select(Review).options(joinedload(Review.author)).where(Review.id == review.id))
        .unique()
        .first()
    )
    return ReviewOut.model_validate(review)
