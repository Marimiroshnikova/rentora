from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BookingStatus, Category
from app.schemas.listing import ListingImageOut
from app.schemas.user import UserOut


class BookingCreate(BaseModel):
    listing_id: int
    start_date: date
    end_date: date
    message: Optional[str] = Field(default=None, max_length=2000)


class BookingAction(BaseModel):
    action: str = Field(description="accept | decline | cancel | complete")


class ListingBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    city: str
    category: Category
    price_per_day: Decimal
    images: list[ListingImageOut] = []


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    renter_id: int
    start_date: date
    end_date: date
    total_price: Decimal
    deposit: Decimal
    status: BookingStatus
    paid_at: Optional[datetime] = None
    created_at: datetime
    listing: Optional[ListingBrief] = None
    renter: Optional[UserOut] = None
    effective_status: Optional[BookingStatus] = None


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    sender_id: int
    body: str
    created_at: datetime
    sender: Optional[UserOut] = None


class UnreadSummaryOut(BaseModel):
    total: int
    by_booking: dict[int, int]


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=2000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    author_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    author: Optional[UserOut] = None


class ReviewListOut(BaseModel):
    items: list[ReviewOut]
    total: int
    page: int
    page_size: int
    avg_rating: Optional[float] = None
