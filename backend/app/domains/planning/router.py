import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.domains.planning.repository import BrandVendorTargetRepository, TargetPlanRepository
from app.domains.planning.schemas import (
    BrandRollupResponse,
    BrandVendorTargetResponse,
    BrandVendorTargetSet,
    SBUTargetRollupResponse,
    TargetPlanApprovalDecision,
    TargetPlanCreate,
    TargetPlanResponse,
    TargetPlanUpdate,
)
from app.domains.planning.service import BrandVendorTargetService, TargetPlanService

router = APIRouter(prefix="/planning/targets", tags=["Target Planning"])
brand_vendor_router = APIRouter(prefix="/planning/brand-vendor-targets", tags=["Target Planning"])


def _get_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> TargetPlanService:
    return TargetPlanService(repository=TargetPlanRepository(db))


def _get_brand_vendor_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> BrandVendorTargetService:
    return BrandVendorTargetService(repository=BrandVendorTargetRepository(db))


@router.get("")
def list_target_plans(
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: TargetPlanService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[TargetPlanResponse]]:
    """Every role gets their own target(s) here -- RLS narrows further rows
    (a manager's reports, an SBU's targets) automatically per caller."""
    target_plans = service.list_by_user(current_user.id)
    return APIResponse(data=[TargetPlanResponse.model_validate(t) for t in target_plans])


@router.get("/pending-approval")
def list_pending_approval(
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: TargetPlanService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[TargetPlanResponse]]:
    """The "Needs your approval" section -- empty for anyone who isn't
    currently someone's resolved approver, no role check involved."""
    target_plans = service.list_pending_approval_for_approver(current_user)
    return APIResponse(data=[TargetPlanResponse.model_validate(t) for t in target_plans])


@router.get("/team")
def list_team_targets(
    sbu_id: uuid.UUID = Query(...),  # noqa: B008
    planning_period: str = Query(...),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: TargetPlanService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[TargetPlanResponse]]:
    """Per-person breakdown behind the rollup banner -- RLS narrows this to
    whatever the caller is actually allowed to see (own SBU, own reports, or
    unrestricted for Admin/GM), same as every other list endpoint here."""
    target_plans = service.list_team_targets(sbu_id, planning_period)
    return APIResponse(data=[TargetPlanResponse.model_validate(t) for t in target_plans])


@router.get("/rollup")
def get_sbu_rollup(
    sbu_id: uuid.UUID = Query(...),  # noqa: B008
    planning_period: str = Query(...),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: TargetPlanService = Depends(_get_service),  # noqa: B008
) -> APIResponse[SBUTargetRollupResponse]:
    total, count = service.get_sbu_rollup(sbu_id, planning_period)
    return APIResponse(
        data=SBUTargetRollupResponse(
            sbu_id=sbu_id,
            planning_period=planning_period,
            total_target_amount_lakhs=total,
            user_count=count,
        )
    )


@router.post("", status_code=201)
def create_target_plan(
    body: TargetPlanCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: TargetPlanService = Depends(_get_service),  # noqa: B008
) -> APIResponse[TargetPlanResponse]:
    target_plan = service.create_target_plan(body, current_user=current_user)
    return APIResponse(data=TargetPlanResponse.model_validate(target_plan))


@router.patch("/{target_plan_id}")
def update_target_plan(
    target_plan_id: uuid.UUID,
    body: TargetPlanUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: TargetPlanService = Depends(_get_service),  # noqa: B008
) -> APIResponse[TargetPlanResponse]:
    target_plan = service.update_target_plan(target_plan_id, body, current_user=current_user)
    return APIResponse(data=TargetPlanResponse.model_validate(target_plan))


@router.post("/{target_plan_id}/approve")
def approve_target_plan(
    target_plan_id: uuid.UUID,
    body: TargetPlanApprovalDecision,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: TargetPlanService = Depends(_get_service),  # noqa: B008
) -> APIResponse[TargetPlanResponse]:
    target_plan = service.approve_or_reject_target_plan(
        target_plan_id, status="APPROVED", current_user=current_user, note=body.note
    )
    return APIResponse(data=TargetPlanResponse.model_validate(target_plan))


@router.post("/{target_plan_id}/reject")
def reject_target_plan(
    target_plan_id: uuid.UUID,
    body: TargetPlanApprovalDecision,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: TargetPlanService = Depends(_get_service),  # noqa: B008
) -> APIResponse[TargetPlanResponse]:
    target_plan = service.approve_or_reject_target_plan(
        target_plan_id, status="REJECTED", current_user=current_user, note=body.note
    )
    return APIResponse(data=TargetPlanResponse.model_validate(target_plan))


@router.delete("/{target_plan_id}", status_code=204)
def delete_target_plan(
    target_plan_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: TargetPlanService = Depends(_get_service),  # noqa: B008
) -> None:
    service.delete_target_plan(target_plan_id, current_user=current_user)


@router.get("/brand-rollup")
def get_brand_rollup(
    brand_id: uuid.UUID = Query(...),  # noqa: B008
    planning_period: str = Query(...),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: TargetPlanService = Depends(_get_service),  # noqa: B008
    vendor_service: BrandVendorTargetService = Depends(_get_brand_vendor_service),  # noqa: B008
) -> APIResponse[BrandRollupResponse]:
    """The screen Haroon actually wants: the team's committed total next to
    what the brand vendor promised, gap pre-computed server-side."""
    committed_total = service.get_brand_rollup(brand_id, planning_period)
    vendor_target = vendor_service.repository.get_by_brand_period(brand_id, planning_period)
    vendor_amount = vendor_target.vendor_target_amount_lakhs if vendor_target else None
    gap = (vendor_amount - committed_total) if vendor_amount is not None else None
    return APIResponse(
        data=BrandRollupResponse(
            brand_id=brand_id,
            planning_period=planning_period,
            committed_total=committed_total,
            vendor_target=vendor_amount,
            gap=gap,
        )
    )


@brand_vendor_router.get("")
def list_brand_vendor_targets(
    planning_period: str = Query(...),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: BrandVendorTargetService = Depends(_get_brand_vendor_service),  # noqa: B008
) -> APIResponse[list[BrandVendorTargetResponse]]:
    """Open read -- everyone should see the bar the team's collectively
    aiming for (decision #2)."""
    vendor_targets = service.list_by_period(planning_period)
    return APIResponse(data=[BrandVendorTargetResponse.model_validate(v) for v in vendor_targets])


@brand_vendor_router.post("", status_code=201)
def set_brand_vendor_target(
    body: BrandVendorTargetSet,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: BrandVendorTargetService = Depends(_get_brand_vendor_service),  # noqa: B008
) -> APIResponse[BrandVendorTargetResponse]:
    vendor_target = service.set_vendor_target(body, current_user=current_user)
    return APIResponse(data=BrandVendorTargetResponse.model_validate(vendor_target))
