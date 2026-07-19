from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import BookingStatus, ListingStatus
from app.schemas.listing import ListingOut
from app.schemas.user import UserOut


class AdminStats(BaseModel):
    users: int
    listings: int
    active_listings: int
    bookings: int
    bookings_this_month: int


class AdminListingPatch(BaseModel):
    status: ListingStatus


class AdminUsersOut(BaseModel):
    items: list[UserOut]


class AdminListingsOut(BaseModel):
    items: list[ListingOut]


class AdminBookingOut(BaseModel):
    id: int
    listing_id: int
    listing_title: str
    listing_city: str
    renter_name: str
    renter_email: str
    owner_name: str
    start_date: date
    end_date: date
    total_price: Decimal
    status: BookingStatus
    created_at: datetime


class AdminBookingsOut(BaseModel):
    items: list[AdminBookingOut]
