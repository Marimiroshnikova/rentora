from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict


class OwnerDashboardMonthOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    month: date
    total_bookings: int
    revenue: Decimal
    pending: int
    accepted: int
    completed: int
    cancelled: int
    expired: int


class OwnerDashboardSummaryOut(BaseModel):
    total_bookings: int
    revenue: Decimal
    pending: int
    accepted: int
    completed: int
    cancelled: int
    expired: int


class OwnerDashboardStatsOut(BaseModel):
    period: Literal['monthly']
    from_date: date | None = None
    to_date: date | None = None
    summary: OwnerDashboardSummaryOut
    months: list[OwnerDashboardMonthOut]