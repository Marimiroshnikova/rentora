from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_owner
from app.models import User
from app.schemas.owner_dashboard import OwnerDashboardStatsOut
from app.services import owner_dashboard_service

router = APIRouter(prefix='/owner', tags=['owner'])


@router.get('/stats', response_model=OwnerDashboardStatsOut)
def get_owner_stats(
    period: Literal['monthly'] = Query('monthly'),
    from_date: date | None = Query(None, alias='from'),
    to_date: date | None = Query(None, alias='to'),
    db: Session = Depends(get_db),
    user: User = Depends(require_owner),
) -> OwnerDashboardStatsOut:
    return owner_dashboard_service.get_owner_stats(
        db,
        owner=user,
        period=period,
        from_date=from_date,
        to_date=to_date,
    )