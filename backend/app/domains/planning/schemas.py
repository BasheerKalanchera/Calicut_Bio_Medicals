import re
import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str


class SBUNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class BrandNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class BrandSplitEntry(BaseModel):
    brand_id: uuid.UUID
    split_amount_lakhs: Decimal = Field(..., ge=0, decimal_places=2)


class BrandSplitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    brand_id: uuid.UUID
    brand: BrandNested
    split_amount_lakhs: Decimal


class VisitFrequency(StrEnum):
    """Fixed list (Hospital-Wise Target Planning plan, choice 2 = lighter).
    Changing it means a code release plus a migration to the CHECK in 0055."""

    WEEKLY = "WEEKLY"
    BI_WEEKLY = "BI_WEEKLY"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    AS_NEEDED = "AS_NEEDED"


class PlanAccountEntry(BaseModel):
    account_id: uuid.UUID
    # >= 0: a hospital may be on the plan for visits only (plan section 3).
    planned_amount_lakhs: Decimal = Field(..., ge=0, decimal_places=2)
    visit_frequency: VisitFrequency
    strategic_objective: str | None = Field(None, max_length=1000)


class PlanAccountZoneNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class PlanAccountAccountNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    business_potential: str
    zone: PlanAccountZoneNested


class PlanAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_id: uuid.UUID
    account: PlanAccountAccountNested
    planned_amount_lakhs: Decimal
    visit_frequency: str
    strategic_objective: str | None


class PlanWarningKind(StrEnum):
    HIGH_POTENTIAL_ZERO = "HIGH_POTENTIAL_ZERO"
    # BR-PL-06: Medium/Low hospital at zero -- a milder warning than High.
    RATED_POTENTIAL_ZERO = "RATED_POTENTIAL_ZERO"
    SAME_SBU_OVERLAP = "SAME_SBU_OVERLAP"


class PlanWarning(BaseModel):
    """Non-blocking -- shown to the planner, never stops a save."""

    kind: PlanWarningKind
    account_id: uuid.UUID
    account_name: str
    colleague_name: str | None = None


class TargetPlanCreate(BaseModel):
    """The target amount isn't sent -- it's the SUM of the hospitals'
    planned amounts, computed server-side (TargetPlanService._apply_accounts).
    `submit=False` saves a DRAFT visible only to its owner."""

    sbu_id: uuid.UUID
    planning_period: str
    accounts: list[PlanAccountEntry] = Field(..., min_length=1)
    brand_splits: list[BrandSplitEntry] | None = None
    submit: bool = True

    @field_validator("planning_period")
    @classmethod
    def validate_planning_period(cls, v: str) -> str:
        if not re.match(r"^\d{4}-Q[1-4]$", v):
            raise ValueError("planning_period must be in the form YYYY-Qn, e.g. 2026-Q3")
        return v


class TargetPlanUpdate(BaseModel):
    """`change_note` is required once the plan has left DRAFT (enforced in
    TargetPlanService.update_target_plan, which knows the current status)."""

    accounts: list[PlanAccountEntry] = Field(..., min_length=1)
    brand_splits: list[BrandSplitEntry] | None = None
    change_note: str | None = Field(None, max_length=2000)
    submit: bool = True


class TargetPlanApprovalDecision(BaseModel):
    """`expected_updated_at` is the plan's updated_at as the approver's
    screen showed it -- a mismatch means the rep saved since (409)."""

    status: str
    note: str | None = None
    expected_updated_at: datetime

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("APPROVED", "REJECTED"):
            raise ValueError("status must be APPROVED or REJECTED")
        return v


class TargetPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    user: UserNested
    sbu_id: uuid.UUID
    sbu: SBUNested
    planning_period: str
    target_amount_lakhs: Decimal
    status: str
    approved_by: uuid.UUID | None
    approver: UserNested | None
    approved_at: datetime | None
    decision_note: str | None
    change_note: str | None = None
    previous_approved_total_lakhs: Decimal | None = None
    brand_splits: list[BrandSplitResponse] = []
    accounts: list[PlanAccountResponse] = []
    # Filled only on create/update responses (and the overlap check endpoint);
    # list endpoints leave it empty rather than run the lookup per row.
    warnings: list[PlanWarning] = []
    created_at: datetime
    updated_at: datetime


class EligibleAccountResponse(BaseModel):
    """One row of the plan dialog's hospital picker."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    business_potential: str
    zone: PlanAccountZoneNested


class BrandVendorTargetSet(BaseModel):
    brand_id: uuid.UUID
    planning_period: str
    vendor_target_amount_lakhs: Decimal = Field(..., ge=0)

    @field_validator("planning_period")
    @classmethod
    def validate_planning_period(cls, v: str) -> str:
        if not re.match(r"^\d{4}-Q[1-4]$", v):
            raise ValueError("planning_period must be in the form YYYY-Qn, e.g. 2026-Q3")
        return v


class BrandVendorTargetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    brand_id: uuid.UUID
    brand: BrandNested
    planning_period: str
    vendor_target_amount_lakhs: Decimal


class BrandRollupResponse(BaseModel):
    brand_id: uuid.UUID
    planning_period: str
    committed_total: Decimal
    vendor_target: Decimal | None
    gap: Decimal | None


class QuarterState(StrEnum):
    CURRENT = "CURRENT"
    PAST = "PAST"
    FUTURE = "FUTURE"


class RosterStatus(StrEnum):
    """A roster member's plan for the quarter, as Target vs Actuals and the
    Target Planning roster show it."""

    NOT_STARTED = "NOT_STARTED"
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class TargetVsActualLateOpportunity(BaseModel):
    """BR-OP-16: still open past its expected closing date. Flag only.
    Listed on every split participant's row (BR-FIN-09)."""

    opportunity_id: uuid.UUID
    name: str
    account_id: uuid.UUID
    account_name: str
    expected_closure_date: date
    value_lakhs: Decimal  # the Opportunity's full net value
    share_percentage: Decimal  # this person's share (100 when not shared)
    share_lakhs: Decimal
    # The owner, when this row's person isn't them; else None.
    owner_name: str | None = None


class TargetVsActualHospital(BaseModel):
    """One line per hospital on the person's plan; wins at hospitals that
    aren't on the plan share a single line with account_id=None
    ("Unplanned")."""

    account_id: uuid.UUID | None
    account_name: str
    planned_lakhs: Decimal
    won_lakhs: Decimal


class TargetVsActualBrand(BaseModel):
    brand_id: uuid.UUID
    brand_name: str
    planned_lakhs: Decimal
    won_lakhs: Decimal


class TargetVsActualPerson(BaseModel):
    user_id: uuid.UUID
    display_name: str
    # Only waiting and approved plans count towards planned; a draft or
    # rejected plan shows its status with no figures.
    plan_status: RosterStatus
    # BR-PL-05: set while a revision of an approved plan is in flight --
    # the screen notes "was ₹X approved" beside the revised figure.
    previous_approved_total_lakhs: Decimal | None
    planned_lakhs: Decimal
    # Opportunities whose PO date falls in the quarter, whatever their status
    # now (Lost excluded); counted separately from Won.
    po_received_lakhs: Decimal
    # BR-OP-17: Won is reached only at full payment.
    won_lakhs: Decimal
    # None for a past quarter (nothing left to expect).
    expected_lakhs: Decimal | None
    likely_finish_lakhs: Decimal
    # Won only; None when planned is 0 -- the screen shows a dash.
    percent_of_target: Decimal | None
    undated_opportunity_count: int
    no_po_date_count: int
    late_opportunities: list[TargetVsActualLateOpportunity]
    hospitals: list[TargetVsActualHospital]
    brands: list[TargetVsActualBrand]


class TargetVsActualZone(BaseModel):
    """Grouped by the hospital's zone, not the planner's. zone_id=None is
    the bucket for hospitals filed above zone level."""

    zone_id: uuid.UUID | None
    zone_name: str | None
    planned_lakhs: Decimal
    won_lakhs: Decimal


class TargetVsActualSummaryRow(BaseModel):
    """The SBU row (SBU Manager and above), the company row (Admin/GM) or
    the team row (Area Manager: their team's totals against their SBU's
    target), measured against the GM-entered SBU target(s). target_lakhs is
    None until a target is entered (for the company row: until every SBU
    has one)."""

    target_lakhs: Decimal | None
    planned_lakhs: Decimal
    po_received_lakhs: Decimal
    won_lakhs: Decimal
    percent_of_target: Decimal | None


class TargetVsActualResponse(BaseModel):
    sbu_id: uuid.UUID
    planning_period: str
    quarter_state: QuarterState
    as_of: date
    planned_lakhs: Decimal
    po_received_lakhs: Decimal
    won_lakhs: Decimal
    expected_lakhs: Decimal | None
    likely_finish_lakhs: Decimal
    percent_of_target: Decimal | None
    no_po_date_count: int
    # "N of M haven't submitted": M = roster_count.
    roster_count: int
    not_submitted_count: int
    sbu_row: TargetVsActualSummaryRow | None
    company_row: TargetVsActualSummaryRow | None
    team_row: TargetVsActualSummaryRow | None
    people: list[TargetVsActualPerson]
    zones: list[TargetVsActualZone]
    brands: list[TargetVsActualBrand]


class TargetRosterPerson(BaseModel):
    """One row of the Target Planning roster (Target-Coverage-Roster plan)."""

    user_id: uuid.UUID
    display_name: str
    # False: a plan owner no longer on the team (moved SBU, deactivated) --
    # their plan still counts in the total; not part of "N of M".
    on_team: bool
    plan_status: RosterStatus
    # What counts towards the total: the plan's total while waiting or
    # approved, the last approved total for a rejected revision (BR-PL-05),
    # else 0.
    counted_lakhs: Decimal
    previous_approved_total_lakhs: Decimal | None
    # None when there is no plan, or it is someone else's draft (status only).
    plan: TargetPlanResponse | None


class TargetRosterResponse(BaseModel):
    sbu_id: uuid.UUID
    planning_period: str
    # Same figure as Target vs Actuals' "Planned": includes plans by owners
    # with no row (e.g. since deactivated), as the card's totals do.
    total_lakhs: Decimal
    roster_count: int
    not_submitted_count: int
    people: list[TargetRosterPerson]


class SbuTargetSet(BaseModel):
    sbu_id: uuid.UUID
    planning_period: str
    target_amount_lakhs: Decimal = Field(..., ge=0)

    @field_validator("planning_period")
    @classmethod
    def validate_planning_period(cls, v: str) -> str:
        if not re.match(r"^\d{4}-Q[1-4]$", v):
            raise ValueError("planning_period must be in the form YYYY-Qn, e.g. 2026-Q3")
        return v


class SbuTargetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sbu_id: uuid.UUID
    planning_period: str
    target_amount_lakhs: Decimal
