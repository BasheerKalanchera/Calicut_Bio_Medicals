import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


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
    managing_sbu_id: uuid.UUID | None
    payer_behavior: str | None
    managing_sbu: SBUNested | None


class WorkspaceStakeholder(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    nps_score: int | None
    sentiment: str | None


class WorkspaceProject(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    status: ProjectStatusNested
    owner: OwnerNested
    bid_submission_date: date | None


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


class WorkspaceOpportunity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    project_id: uuid.UUID | None
    win_probability: Decimal
    indicative_value: Decimal | None
    stage: OpportunityStageNested
    status: OpportunityStatusNested
    owner: OwnerNested


class WorkspaceResponse(BaseModel):
    account: WorkspaceAccount
    stakeholders: list[WorkspaceStakeholder]
    projects: list[WorkspaceProject]
    opportunities: list[WorkspaceOpportunity]
    installed_assets: list[WorkspaceInstalledAsset]
