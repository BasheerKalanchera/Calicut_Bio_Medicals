import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# ------------------------------------------------------------------
# Shared nested schemas
# ------------------------------------------------------------------

class SBUNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class ProductNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class StageNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    stage_code: str
    stage_name: str
    display_order: int
    default_win_probability: Decimal


class StatusNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status_code: str
    status_name: str
    is_terminal: bool


class OwnerNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str


class AccountNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class ProjectNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class LeadSourceNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


# ------------------------------------------------------------------
# Opportunity items
# ------------------------------------------------------------------

class OpportunityItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    unit_price_lakhs: Decimal = Field(..., ge=0)
    discount_lakhs: Decimal = Field(Decimal("0"), ge=0)


class OpportunityItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price_lakhs: Decimal
    discount_lakhs: Decimal
    extended_value_lakhs: Decimal
    product: ProductNested


class ItemsBulkUpdate(BaseModel):
    items: list[OpportunityItemCreate]


# ------------------------------------------------------------------
# Splits
# ------------------------------------------------------------------

class SplitCreate(BaseModel):
    user_id: uuid.UUID
    split_percentage: Decimal = Field(..., ge=0, le=100)


class SplitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    split_percentage: Decimal
    user: OwnerNested


class SplitsBulkUpdate(BaseModel):
    splits: list[SplitCreate]


# ------------------------------------------------------------------
# Opportunity stakeholders
# ------------------------------------------------------------------

class StakeholderNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class StakeholderLinkCreate(BaseModel):
    stakeholder_id: uuid.UUID
    influence_level: str | None = Field(None, pattern="^(HIGH|MEDIUM|LOW)$")
    decision_role: str | None = Field(None, max_length=100)
    notes: str | None = None


class StakeholderLinkUpdate(BaseModel):
    influence_level: str | None = Field(None, pattern="^(HIGH|MEDIUM|LOW)$")
    decision_role: str | None = Field(None, max_length=100)
    notes: str | None = None


class StakeholderLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    stakeholder_id: uuid.UUID
    influence_level: str | None
    decision_role: str | None
    notes: str | None
    stakeholder: StakeholderNested


class StakeholdersBulkUpdate(BaseModel):
    stakeholders: list[StakeholderLinkCreate]


# ------------------------------------------------------------------
# Create / Update
# ------------------------------------------------------------------

class OpportunityCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    owner_id: uuid.UUID
    stage_id: uuid.UUID
    status_id: uuid.UUID
    win_probability: Decimal = Field(..., ge=0, le=100)
    project_id: uuid.UUID | None = None
    lead_source_id: uuid.UUID | None = None
    indicative_value: Decimal | None = None
    expected_closure_date: date | None = None
    demo_start_date: date | None = None
    demo_end_date: date | None = None
    po_number: str | None = Field(None, max_length=100)
    items: list[OpportunityItemCreate] = []


class OpportunityUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    owner_id: uuid.UUID | None = None
    stage_id: uuid.UUID | None = None
    status_id: uuid.UUID | None = None
    win_probability: Decimal | None = Field(None, ge=0, le=100)
    project_id: uuid.UUID | None = None
    lead_source_id: uuid.UUID | None = None
    indicative_value: Decimal | None = None
    expected_closure_date: date | None = None
    demo_start_date: date | None = None
    demo_end_date: date | None = None
    po_number: str | None = Field(None, max_length=100)
    loss_reason_id: uuid.UUID | None = None
    loss_notes: str | None = None
    competitor_name: str | None = Field(None, max_length=255)
    hold_reason_id: uuid.UUID | None = None
    reactivation_date: date | None = None


# ------------------------------------------------------------------
# Responses
# ------------------------------------------------------------------

class OpportunityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_id: uuid.UUID
    sbu_id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    stage_id: uuid.UUID
    status_id: uuid.UUID
    win_probability: Decimal
    project_id: uuid.UUID | None
    lead_source_id: uuid.UUID | None
    indicative_value: Decimal | None
    expected_closure_date: date | None
    demo_start_date: date | None
    demo_end_date: date | None
    po_number: str | None
    loss_reason_id: uuid.UUID | None
    loss_notes: str | None
    competitor_name: str | None
    hold_reason_id: uuid.UUID | None
    reactivation_date: date | None
    created_at: datetime
    updated_at: datetime
    sbu: SBUNested


class PipelineOpportunity(BaseModel):
    """Full nested response used by GET /opportunities/pipeline (Kanban + List views)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    win_probability: Decimal
    indicative_value: Decimal | None
    expected_closure_date: date | None
    demo_start_date: date | None
    demo_end_date: date | None
    po_number: str | None
    loss_reason_id: uuid.UUID | None
    competitor_name: str | None
    hold_reason_id: uuid.UUID | None
    reactivation_date: date | None
    created_at: datetime
    updated_at: datetime
    account: AccountNested
    stage: StageNested
    status: StatusNested
    owner: OwnerNested
    sbu: SBUNested
    project: ProjectNested | None
    lead_source: LeadSourceNested | None
