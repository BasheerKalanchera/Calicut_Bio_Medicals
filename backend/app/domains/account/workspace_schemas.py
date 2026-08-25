import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ZoneNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class SBUNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class ProjectStatusNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status_code: str
    status_name: str


class OwnerNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str


class ProductNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    oem_name: str | None
    model_number: str | None


class WorkspaceAccount(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    parent_account_id: uuid.UUID | None
    zone_id: uuid.UUID
    payer_behavior: str | None
    zone: ZoneNested


class WorkspaceStakeholder(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    designation: str | None
    email: str | None
    phone: str | None
    nps_score: int | None
    sentiment: str | None


class AccountNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class WorkspaceProject(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    status: ProjectStatusNested
    owner: OwnerNested
    bid_submission_date: date | None


class WorkspaceProjectWithAccount(WorkspaceProject):
    account: AccountNested


class WorkspaceInstalledAsset(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product: ProductNested | None
    is_competitor_equipment: bool
    competitor_product_name: str | None
    installation_date: date | None
    department: str | None


class OpportunityStageNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    stage_code: str
    stage_name: str


class OpportunityStatusNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status_code: str
    status_name: str


class GateOverrideReasonNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reason_name: str


class WorkspaceOpportunity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    project_id: uuid.UUID | None
    lead_source_id: uuid.UUID | None
    sbu_id: uuid.UUID
    win_probability: Decimal
    indicative_value: Decimal | None
    expected_closure_date: date | None
    demo_start_date: date | None
    demo_end_date: date | None
    po_number: str | None
    hold_reason_id: uuid.UUID | None
    reactivation_date: date | None
    loss_reason_id: uuid.UUID | None
    competitor_name: str | None
    referred_by_note: str | None
    gate_override_approver_id: uuid.UUID | None
    gate_override_reason_id: uuid.UUID | None
    gate_override_note: str | None
    stage: OpportunityStageNested
    status: OpportunityStatusNested
    owner: OwnerNested
    sbu: SBUNested
    referred_by: OwnerNested | None
    gate_override_approver: OwnerNested | None
    gate_override_reason: GateOverrideReasonNested | None


class WorkspaceResponse(BaseModel):
    account: WorkspaceAccount
    stakeholders: list[WorkspaceStakeholder]
    projects: list[WorkspaceProject]
    opportunities: list[WorkspaceOpportunity]
    installed_assets: list[WorkspaceInstalledAsset]
