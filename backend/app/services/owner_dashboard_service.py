from datetime import date
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models import Booking, BookingStatus, Listing, User
from app.schemas.owner_dashboard import (
    OwnerDashboardMonthOut,
    OwnerDashboardStatsOut,
    OwnerDashboardSummaryOut,
)


def _month_start(value: date) -> date:
    return date(value.year, value.month, 1)


def _next_month(value: date) -> date:
    if value.month == 12:
        return date(value.year + 1, 1, 1)
    return date(value.year, value.month + 1, 1)


def _decimal(value: object) -> Decimal:
    return Decimal(str(value or 0))


def get_owner_stats(
    db: Session,
    *,
    owner: User,
    period: str = 'monthly',
    from_date: date | None = None,
    to_date: date | None = None,
) -> OwnerDashboardStatsOut:
    if period != 'monthly':
        raise HTTPException(status_code=400, detail='Only monthly period is supported')
    if from_date and to_date and from_date > to_date:
        raise HTTPException(status_code=400, detail='from must be before to')

    revenue_statuses = {BookingStatus.CONFIRMED, BookingStatus.COMPLETED}

    year_expr = func.extract('year', Booking.start_date).label('year')
    month_expr = func.extract('month', Booking.start_date).label('month')

    query = (
        select(
            year_expr,
            month_expr,
            func.count(Booking.id).label('total_bookings'),
            func.coalesce(
                func.sum(
                    case((Booking.status.in_(revenue_statuses), Booking.total_price), else_=0)
                ),
                0,
            ).label('revenue'),
            func.coalesce(func.sum(case((Booking.status == BookingStatus.PENDING, 1), else_=0)), 0).label(
                'pending'
            ),
            func.coalesce(func.sum(case((Booking.status == BookingStatus.ACCEPTED, 1), else_=0)), 0).label(
                'accepted'
            ),
            func.coalesce(func.sum(case((Booking.status == BookingStatus.COMPLETED, 1), else_=0)), 0).label(
                'completed'
            ),
            func.coalesce(func.sum(case((Booking.status == BookingStatus.CANCELLED, 1), else_=0)), 0).label(
                'cancelled'
            ),
            func.coalesce(func.sum(case((Booking.status == BookingStatus.EXPIRED, 1), else_=0)), 0).label(
                'expired'
            ),
        )
        .join(Listing, Booking.listing_id == Listing.id)
        .where(Listing.owner_id == owner.id)
    )

    if from_date is not None:
        query = query.where(Booking.start_date >= from_date)
    if to_date is not None:
        query = query.where(Booking.start_date <= to_date)

    rows = db.execute(query.group_by(year_expr, month_expr).order_by(year_expr, month_expr)).all()
    row_map = {(int(row.year), int(row.month)): row for row in rows}

    if from_date is not None:
        range_start = _month_start(from_date)
    elif rows:
        first = rows[0]
        range_start = date(int(first.year), int(first.month), 1)
    else:
        range_start = None

    if to_date is not None:
        range_end = _month_start(to_date)
    elif rows:
        last = rows[-1]
        range_end = date(int(last.year), int(last.month), 1)
    else:
        range_end = None

    months: list[OwnerDashboardMonthOut] = []
    if range_start and range_end:
        current = range_start
        while current <= range_end:
            row = row_map.get((current.year, current.month))
            months.append(
                OwnerDashboardMonthOut(
                    month=current,
                    total_bookings=int(getattr(row, 'total_bookings', 0) or 0),
                    revenue=_decimal(getattr(row, 'revenue', 0)),
                    pending=int(getattr(row, 'pending', 0) or 0),
                    accepted=int(getattr(row, 'accepted', 0) or 0),
                    completed=int(getattr(row, 'completed', 0) or 0),
                    cancelled=int(getattr(row, 'cancelled', 0) or 0),
                    expired=int(getattr(row, 'expired', 0) or 0),
                )
            )
            current = _next_month(current)

    summary = OwnerDashboardSummaryOut(
        total_bookings=sum(month.total_bookings for month in months),
        revenue=sum((month.revenue for month in months), Decimal('0')),
        pending=sum(month.pending for month in months),
        accepted=sum(month.accepted for month in months),
        completed=sum(month.completed for month in months),
        cancelled=sum(month.cancelled for month in months),
        expired=sum(month.expired for month in months),
    )

    return OwnerDashboardStatsOut(
        period='monthly',
        from_date=from_date,
        to_date=to_date,
        summary=summary,
        months=months,
    )