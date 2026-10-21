import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.domains.planning.repository import (
    AnnualTargetRepository,
    BrandVendorTargetRepository,
    PersonQuarterTargetRepository,
    TargetPlanRepository,
    TargetVsActualRepository,
)
from app.domains.planning.schemas import (
    BrandAnnualTargetRow,
    BrandAnnualTargetSet,
    BrandRollupResponse,
    BrandVendorTargetResponse,
    BrandVendorTargetSet,
    BrandYearStartSet,
    EligibleAccountResponse,
    PersonQuarterTargetResponse,
    PersonQuarterTargetSet,
    PlanWarning,
    SbuSeasonalPatternResponse,
    SbuSeasonalPatternSet,
    SbuTargetResponse,
    TargetPlanApprovalDecision,
    TargetPlanCreate,
    TargetPlanResponse,
    TargetPlanUpdate,
    TargetRosterResponse,
    TargetVsActualResponse,
    TeamTargetsResponse,
)
from app.domains.planning.service import (
    AnnualTargetService,
    BrandVendorTargetService,
    PersonTargetService,
    SbuTargetService,
    TargetPlanService,
    TargetVsActualService,
)
from app.domains.reference.repository import BrandRepository
from app.domains.reference.schemas import BrandResponse

router = APIRouter(prefix="/planning/targets", tags=["Target Planning"])
brand_vendor_router = APIRouter(prefix="/planning/brand-vendor-targets", tags=["Target Planning"])
sbu_target_router = APIRouter(prefix="/planning/sbu-targets", tags=["Target Planning"])
# Annual Target Planning Part 1: brand years, seasonal patterns, person targets.
annual_target_router = APIRouter(prefix="/planning", tags=["Target Planning"])


def _get_service(
    db: Session = Depends(get_db),
) -> TargetPlanService:
    return TargetPlanService(repository=TargetPlanRepository(db), brand_repository=BrandRepository(db))


def _get_brand_vendor_service(
    db: Session = Depends(get_db),
) -> BrandVendorTargetService:
    return BrandVendorTargetService(repository=BrandVendorTargetRepository(db))


def _get_target_vs_actual_service(
    db: Session = Depends(get_db),
) -> TargetVsActualService:
    return TargetVsActualService(repository=TargetVsActualRepository(db))


def _get_sbu_target_service(
    db: Session = Depends(get_db),
) -> SbuTargetService:
    return SbuTargetService(repository=TargetVsActualRepository(db))


def _get_annual_target_service(
    db: Session = Depends(get_db),
) -> AnnualTargetService:
    return AnnualTargetService(repository=AnnualTargetRepository(db))


def _get_person_target_service(
    db: Session = Depends(get_db),
) -> PersonTargetService:
    return PersonTargetService(
        repository=PersonQuarterTargetRepository(db), sbu_target_repository=TargetVsActualRepository(db)
    )


@router.get("")
def list_target_plans(
    current_user: UserProfile = Depends(get_current_user),
    service: TargetPlanService = Depends(_get_service),
) -> APIResponse[list[TargetPlanResponse]]:
    """Every role gets their own target(s) here -- RLS narrows further rows
    (a manager's reports, an SBU's targets) automatically per caller."""
    target_plans = service.list_by_user(current_user.id)
    return APIResponse(data=[TargetPlanResponse.model_validate(t) for t in target_plans])


@router.get("/pending-approval")
def list_pending_approval(
    current_user: UserProfile = Depends(get_current_user),
    service: TargetPlanService = Depends(_get_service),
) -> APIResponse[list[TargetPlanResponse]]:
    """The "Needs your approval" section -- empty for anyone who isn't
    currently someone's resolved approver, no role check involved."""
    target_plans = service.list_pending_approval_for_approver(current_user)
    return APIResponse(data=[TargetPlanResponse.model_validate(t) for t in target_plans])


@router.get("/team")
def list_team_targets(
    sbu_id: uuid.UUID = Query(...),
    planning_period: str = Query(...),
    current_user: UserProfile = Depends(get_current_user),
    service: TargetPlanService = Depends(_get_service),
) -> APIResponse[list[TargetPlanResponse]]:
    """Per-person breakdown behind the rollup banner -- RLS narrows this to
    whatever the caller is actually allowed to see (own SBU, own reports, or
    unrestricted for Admin/GM), same as every other list endpoint here."""
    target_plans = service.list_team_targets(sbu_id, planning_period, current_user=current_user)
    return APIResponse(data=[TargetPlanResponse.model_validate(t) for t in target_plans])


@router.get("/target-vs-actuals")
def get_target_vs_actual(
    sbu_id: uuid.UUID = Query(...),
    planning_period: str = Query(..., pattern=r"^\d{4}-Q[1-4]$"),
    current_user: UserProfile = Depends(get_current_user),
    service: TargetVsActualService = Depends(_get_target_vs_actual_service),
) -> APIResponse[TargetVsActualResponse]:
    """Target vs Actuals for one quarter (Insights Dashboard): roster rows,
    PO received, Won (paid), Expected; SBU and company rows by role. Read-only."""
    return APIResponse(data=service.get_target_vs_actual(sbu_id, planning_period, current_user=current_user))


@router.get("/roster")
def get_target_roster(
    sbu_id: uuid.UUID = Query(...),
    planning_period: str = Query(..., pattern=r"^\d{4}-Q[1-4]$"),
    current_user: UserProfile = Depends(get_current_user),
    service: TargetVsActualService = Depends(_get_target_vs_actual_service),
) -> APIResponse[TargetRosterResponse]:
    """Target Planning's quarter roster: everyone in the caller's scope with
    their plan status, and the total Target vs Actuals counts. Read-only."""
    return APIResponse(data=service.get_roster(sbu_id, planning_period, current_user=current_user))


@router.get("/eligible-accounts")
def list_eligible_accounts(
    search: str | None = Query(None),
    current_user: UserProfile = Depends(get_current_user),
    service: TargetPlanService = Depends(_get_service),
) -> APIResponse[list[EligibleAccountResponse]]:
    """The plan dialog's hospital picker -- only hospitals in the caller's
    own territory (Admin/GM/SBU Manager: any hospital)."""
    accounts = service.list_eligible_accounts(search, current_user=current_user)
    return APIResponse(data=[EligibleAccountResponse.model_validate(a) for a in accounts])


@router.get("/overlaps")
def check_overlaps(
    sbu_id: uuid.UUID = Query(...),
    planning_period: str = Query(...),
    account_ids: list[uuid.UUID] = Query(...),
    current_user: UserProfile = Depends(get_current_user),
    service: TargetPlanService = Depends(_get_service),
) -> APIResponse[list[PlanWarning]]:
    """Live same-SBU overlap warnings while the plan is being edited."""
    return APIResponse(
        data=service.check_overlaps(account_ids, sbu_id, planning_period, current_user=current_user)
    )


@router.post("", status_code=201)
def create_target_plan(
    body: TargetPlanCreate,
    current_user: UserProfile = Depends(get_current_user),
    service: TargetPlanService = Depends(_get_service),
) -> APIResponse[TargetPlanResponse]:
    target_plan, warnings = service.create_target_plan(body, current_user=current_user)
    response = TargetPlanResponse.model_validate(target_plan)
    response.warnings = warnings
    return APIResponse(data=response)


@router.patch("/{target_plan_id}")
def update_target_plan(
    target_plan_id: uuid.UUID,
    body: TargetPlanUpdate,
    current_user: UserProfile = Depends(get_current_user),
    service: TargetPlanService = Depends(_get_service),
) -> APIResponse[TargetPlanResponse]:
    target_plan, warnings = service.update_target_plan(target_plan_id, body, current_user=current_user)
    response = TargetPlanResponse.model_validate(target_plan)
    response.warnings = warnings
    return APIResponse(data=response)


@router.post("/{target_plan_id}/approve")
def approve_target_plan(
    target_plan_id: uuid.UUID,
    body: TargetPlanApprovalDecision,
    current_user: UserProfile = Depends(get_current_user),
    service: TargetPlanService = Depends(_get_service),
) -> APIResponse[TargetPlanResponse]:
    target_plan = service.approve_or_reject_target_plan(
        target_plan_id,
        status="APPROVED",
        current_user=current_user,
        expected_updated_at=body.expected_updated_at,
        note=body.note,
    )
    return APIResponse(data=TargetPlanResponse.model_validate(target_plan))


@router.post("/{target_plan_id}/reject")
def reject_target_plan(
    target_plan_id: uuid.UUID,
    body: TargetPlanApprovalDecision,
    current_user: UserProfile = Depends(get_current_user),
    service: TargetPlanService = Depends(_get_service),
) -> APIResponse[TargetPlanResponse]:
    target_plan = service.approve_or_reject_target_plan(
        target_plan_id,
        status="REJECTED",
        current_user=current_user,
        expected_updated_at=body.expected_updated_at,
        note=body.note,
    )
    return APIResponse(data=TargetPlanResponse.model_validate(target_plan))


@router.delete("/{target_plan_id}", status_code=204)
def delete_target_plan(
    target_plan_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: TargetPlanService = Depends(_get_service),
) -> None:
    service.delete_target_plan(target_plan_id, current_user=current_user)


@router.get("/brand-rollups")
def get_brand_rollups(
    brand_ids: list[uuid.UUID] = Query(...),
    planning_period: str = Query(...),
    current_user: UserProfile = Depends(get_current_user),
    service: TargetPlanService = Depends(_get_service),
    vendor_service: BrandVendorTargetService = Depends(_get_brand_vendor_service),
) -> APIResponse[list[BrandRollupResponse]]:
    """The screen Haroon actually wants: every brand's committed total next
    to what its vendor promised, gap pre-computed server-side. One batched
    call for every brand at once (/code-review 2026-09-23), not one round
    trip per brand -- Admin/GM only, enforced in the service layer."""
    committed_totals = service.get_brand_rollups(brand_ids, planning_period, current_user=current_user)
    vendor_targets_by_brand = {
        v.brand_id: v.vendor_target_amount_lakhs for v in vendor_service.list_by_period(planning_period)
    }
    rollups = []
    for brand_id in brand_ids:
        committed_total = committed_totals.get(brand_id, Decimal("0"))
        vendor_amount = vendor_targets_by_brand.get(brand_id)
        gap = (vendor_amount - committed_total) if vendor_amount is not None else None
        rollups.append(
            BrandRollupResponse(
                brand_id=brand_id,
                planning_period=planning_period,
                committed_total=committed_total,
                vendor_target=vendor_amount,
                gap=gap,
            )
        )
    return APIResponse(data=rollups)


@brand_vendor_router.get("")
def list_brand_vendor_targets(
    planning_period: str = Query(...),
    current_user: UserProfile = Depends(get_current_user),
    service: BrandVendorTargetService = Depends(_get_brand_vendor_service),
) -> APIResponse[list[BrandVendorTargetResponse]]:
    """Open read -- everyone should see the bar the team's collectively
    aiming for (decision #2)."""
    vendor_targets = service.list_by_period(planning_period)
    return APIResponse(data=[BrandVendorTargetResponse.model_validate(v) for v in vendor_targets])


@brand_vendor_router.post("", status_code=201)
def set_brand_vendor_target(
    body: BrandVendorTargetSet,
    current_user: UserProfile = Depends(get_current_user),
    service: BrandVendorTargetService = Depends(_get_brand_vendor_service),
) -> APIResponse[BrandVendorTargetResponse]:
    vendor_target = service.set_vendor_target(body, current_user=current_user)
    return APIResponse(data=BrandVendorTargetResponse.model_validate(vendor_target))


@sbu_target_router.get("")
def list_sbu_targets(
    planning_period: str = Query(..., pattern=r"^\d{4}-Q[1-4]$"),
    current_user: UserProfile = Depends(get_current_user),
    service: SbuTargetService = Depends(_get_sbu_target_service),
) -> APIResponse[list[SbuTargetResponse]]:
    """Admin and GM see every SBU; an SBU Manager their own. Read-only: the
    figure is the SBU's brands' total (Annual Target Planning D47, D55)."""
    return APIResponse(data=service.list_by_period(planning_period, current_user=current_user))


@annual_target_router.put("/brands/{brand_id}/year-start")
def set_brand_year_start(
    brand_id: uuid.UUID,
    body: BrandYearStartSet,
    current_user: UserProfile = Depends(get_current_user),
    service: AnnualTargetService = Depends(_get_annual_target_service),
) -> APIResponse[BrandResponse]:
    """Admin/GM. Refused once the brand has a yearly figure."""
    brand = service.set_year_start(brand_id, body.year_start_month, current_user=current_user)
    return APIResponse(data=BrandResponse.model_validate(brand))


@annual_target_router.get("/brand-annual-targets")
def list_brand_annual_targets(
    sbu_id: uuid.UUID = Query(...),
    calendar_year: int = Query(..., ge=2000, le=2100),
    current_user: UserProfile = Depends(get_current_user),
    service: AnnualTargetService = Depends(_get_annual_target_service),
) -> APIResponse[list[BrandAnnualTargetRow]]:
    """Admin/GM. Each active brand's year starting in calendar_year (D43)."""
    return APIResponse(data=service.list_annual(sbu_id, calendar_year, current_user=current_user))


@annual_target_router.put("/brand-annual-targets")
def set_brand_annual_target(
    body: BrandAnnualTargetSet,
    current_user: UserProfile = Depends(get_current_user),
    service: AnnualTargetService = Depends(_get_annual_target_service),
) -> APIResponse[BrandAnnualTargetRow]:
    """Admin/GM upsert; also saves the brand's quarterly targets (D46)."""
    return APIResponse(data=service.set_annual(body, current_user=current_user))


@annual_target_router.get("/seasonal-patterns")
def get_seasonal_pattern(
    sbu_id: uuid.UUID = Query(...),
    year: int = Query(..., ge=2000, le=2100),
    current_user: UserProfile = Depends(get_current_user),
    service: AnnualTargetService = Depends(_get_annual_target_service),
) -> APIResponse[SbuSeasonalPatternResponse | None]:
    """Admin/GM. None until the GM sets the SBU's pattern for that year."""
    pattern = service.get_pattern(sbu_id, year, current_user=current_user)
    return APIResponse(data=SbuSeasonalPatternResponse.model_validate(pattern) if pattern else None)


@annual_target_router.put("/seasonal-patterns")
def set_seasonal_pattern(
    body: SbuSeasonalPatternSet,
    current_user: UserProfile = Depends(get_current_user),
    service: AnnualTargetService = Depends(_get_annual_target_service),
) -> APIResponse[SbuSeasonalPatternResponse]:
    """Admin/GM upsert; brands following the SBU's pattern are saved again (D50)."""
    pattern = service.set_pattern(body, current_user=current_user)
    return APIResponse(data=SbuSeasonalPatternResponse.model_validate(pattern))


@annual_target_router.get("/person-targets")
def get_team_targets(
    sbu_id: uuid.UUID = Query(...),
    planning_period: str = Query(..., pattern=r"^\d{4}-Q[1-4]$"),
    current_user: UserProfile = Depends(get_current_user),
    service: PersonTargetService = Depends(_get_person_target_service),
) -> APIResponse[TeamTargetsResponse]:
    """The caller's own target and their direct reports' (D33, D57)."""
    return APIResponse(data=service.get_team_targets(sbu_id, planning_period, current_user=current_user))


@annual_target_router.put("/person-targets")
def set_person_target(
    body: PersonQuarterTargetSet,
    current_user: UserProfile = Depends(get_current_user),
    service: PersonTargetService = Depends(_get_person_target_service),
) -> APIResponse[PersonQuarterTargetResponse]:
    """The person's manager, Admin or GM; upsert, no delete (D45)."""
    target = service.set_target(body, current_user=current_user)
    return APIResponse(data=PersonQuarterTargetResponse.model_validate(target))
