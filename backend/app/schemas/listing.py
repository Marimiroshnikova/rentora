from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BlockReason, Category, Condition, ListingStatus


class ListingImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    sort_order: int


class OwnerBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    avg_rating: Optional[float] = None
    review_count: int = 0


class ListingCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    category: Category
    price_per_day: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    deposit: Decimal = Field(ge=0, max_digits=10, decimal_places=2, default=Decimal("0"))
    city: str = Field(min_length=1, max_length=120)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    condition: Condition = Condition.GOOD
    status: ListingStatus = ListingStatus.ACTIVE
    image_urls: list[str] = Field(default_factory=list)


class ListingUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, min_length=10)
    category: Optional[Category] = None
    price_per_day: Optional[Decimal] = Field(default=None, gt=0)
    deposit: Optional[Decimal] = Field(default=None, ge=0)
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    condition: Optional[Condition] = None
    status: Optional[ListingStatus] = None


class ListingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    title: str
    description: str
    category: Category
    price_per_day: Decimal
    deposit: Decimal
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    condition: Condition
    status: ListingStatus
    created_at: datetime
    images: list[ListingImageOut] = []
    owner: Optional[OwnerBrief] = None
    avg_rating: Optional[float] = None
    review_count: int = 0
    times_rented: int = 0
    is_favorited: bool = False
    distance_km: Optional[float] = None


class ListingListOut(BaseModel):
    items: list[ListingOut]
    total: int
    page: int
    page_size: int


class AvailabilityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date
    reason: BlockReason


class AvailabilityUpdate(BaseModel):
    dates: list[date]
