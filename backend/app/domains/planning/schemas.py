import re
import uuid
from datetime import datetime
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
    split_amount_lakhs: Decimal = Field(..., ge=0)


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
    planned_amount_lakhs: Decimal = Field(..., ge=0)
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
    status: str
    note: str | None = None

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


class SBUTargetRollupResponse(BaseModel):
    sbu_id: uuid.UUID
    planning_period: str
    total_target_amount_lakhs: Decimal
    user_count: int


class ZoneRollupEntry(BaseModel):
    """Planned amounts summed by each hospital's ZONE-level ancestor. A
    hospital filed above zone level (e.g. at bare "Kerala") has no such
    ancestor -- zone_id/zone_name are None for that bucket."""

    zone_id: uuid.UUID | None
    zone_name: str | None
    planned_amount_lakhs: Decimal
    hospital_count: int
    person_count: int


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
