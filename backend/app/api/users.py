from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.booking import ReviewListOut, ReviewOut
from app.schemas.user import UserOut, UserUpdate
from app.services import review_service

router = APIRouter(prefix="/users", tags=["users"])


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(user, key, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/{user_id}/reviews", response_model=ReviewListOut)
def list_user_reviews(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    review_service.ensure_user_exists(db, user_id)
    items, total = review_service.list_user_reviews(
        db, user_id, page=page, page_size=page_size
    )
    _, avg_rating = review_service.owner_review_stats(db, user_id)
    return ReviewListOut(
        items=[ReviewOut.model_validate(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        avg_rating=avg_rating,
    )
