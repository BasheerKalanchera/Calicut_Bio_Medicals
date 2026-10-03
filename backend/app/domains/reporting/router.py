import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.core.periods import period_bounds
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.domains.reporting.repository import ReportingRepository
from app.domains.reporting.schemas import (
    OpportunitiesOnHoldResponse,
    OverdueActionsResponse,
    PipelineGroupBy,
    PipelineSummaryResponse,
    ProductPerformanceGroupBy,
    ProductPerformanceResponse,
    RepActivityLevelResponse,
    SalesGroupBy,
    SalesHeadline,
    SalesSummaryResponse,
    StagnantDealsResponse,
)
from app.domains.reporting.service import ReportingService

router = APIRouter(prefix="/reporting", tags=["Reporting"])


def _get_service(db: Session = Depends(get_db)) -> ReportingService:
    return ReportingService(repository=ReportingRepository(db))


@router.get("/pipeline-summary")
def get_pipeline_summary(
    group_by: PipelineGroupBy = Query("stage"),
    sbu_id: uuid.UUID | None = Query(None),
    zone_id: uuid.UUID | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    current_user: UserProfile = Depends(get_current_user),
    service: ReportingService = Depends(_get_service),
) -> APIResponse[PipelineSummaryResponse]:
    return APIResponse(
        data=service.pipeline_summary(current_user, group_by, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id)
    )


@router.get("/stagnant-deals")
def get_stagnant_deals(
    threshold_days: int = Query(180, ge=1),
    sbu_id: uuid.UUID | None = Query(None),
    zone_id: uuid.UUID | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    current_user: UserProfile = Depends(get_current_user),
    service: ReportingService = Depends(_get_service),
) -> APIResponse[StagnantDealsResponse]:
    return APIResponse(
        data=service.stagnant_deals(
            current_user, threshold_days=threshold_days, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id
        )
    )


@router.get("/activity-levels")
def get_activity_levels(
    start_date: date = Query(...),
    end_date: date = Query(...),
    sbu_id: uuid.UUID | None = Query(None),
    zone_id: uuid.UUID | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    current_user: UserProfile = Depends(get_current_user),
    service: ReportingService = Depends(_get_service),
) -> APIResponse[RepActivityLevelResponse]:
    return APIResponse(
        data=service.activity_levels(
            current_user, start_date, end_date, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id
        )
    )


@router.get("/overdue-actions")
def get_overdue_actions(
    sbu_id: uuid.UUID | None = Query(None),
    zone_id: uuid.UUID | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    current_user: UserProfile = Depends(get_current_user),
    service: ReportingService = Depends(_get_service),
) -> APIResponse[OverdueActionsResponse]:
    return APIResponse(data=service.overdue_actions(current_user, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id))


@router.get("/product-performance")
def get_product_performance(
    group_by: ProductPerformanceGroupBy = Query("product"),
    sbu_id: uuid.UUID | None = Query(None),
    zone_id: uuid.UUID | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    current_user: UserProfile = Depends(get_current_user),
    service: ReportingService = Depends(_get_service),
) -> APIResponse[ProductPerformanceResponse]:
    return APIResponse(
        data=service.product_performance(current_user, group_by, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id)
    )


@router.get("/opportunities-on-hold")
def get_opportunities_on_hold(
    sbu_id: uuid.UUID | None = Query(None),
    zone_id: uuid.UUID | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    current_user: UserProfile = Depends(get_current_user),
    service: ReportingService = Depends(_get_service),
) -> APIResponse[OpportunitiesOnHoldResponse]:
    return APIResponse(
        data=service.opportunities_on_hold(current_user, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id)
    )


@router.get("/sales-headline")
def get_sales_headline(
    sbu_id: uuid.UUID | None = Query(None),
    zone_id: uuid.UUID | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    period_start: date | None = Query(None),
    period_end: date | None = Query(None, description="Inclusive"),
    current_user: UserProfile = Depends(get_current_user),
    service: ReportingService = Depends(_get_service),
) -> APIResponse[SalesHeadline]:
    start_dt, end_dt = period_bounds(period_start, period_end)
    return APIResponse(
        data=service.sales_headline(
            current_user, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id,
            period_start=start_dt, period_end=end_dt,
        )
    )


@router.get("/sales-summary")
def get_sales_summary(
    group_by: SalesGroupBy = Query("rep"),
    sbu_id: uuid.UUID | None = Query(None),
    zone_id: uuid.UUID | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    period_start: date | None = Query(None),
    period_end: date | None = Query(None, description="Inclusive"),
    current_user: UserProfile = Depends(get_current_user),
    service: ReportingService = Depends(_get_service),
) -> APIResponse[SalesSummaryResponse]:
    start_dt, end_dt = period_bounds(period_start, period_end)
    return APIResponse(
        data=service.sales_summary(
            current_user, group_by, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id,
            period_start=start_dt, period_end=end_dt,
        )
    )
