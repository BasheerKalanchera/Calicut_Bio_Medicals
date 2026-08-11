import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

# ------------------------------------------------------------------
# Territory Admin (Zone Hierarchy) -- Admin/GM only, see reference/router.py
# ------------------------------------------------------------------

class ZoneCreate(BaseModel):
    name: str
    parent_zone_id: uuid.UUID | None = None
    zone_level: str | None = None


class ZoneUpdate(BaseModel):
    # Rename: set name. Re-parent (move): set parent_zone_id. Either or both
    # may be provided in one call -- both go through the same
    # rebuild_all_closure() afterward regardless of which changed.
    name: str | None = None
    parent_zone_id: uuid.UUID | None = None
    zone_level: str | None = None


class ZoneTreeNode(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    zone_level: str | None
    is_active: bool | None
    children: list["ZoneTreeNode"] = []


class ZoneBlastRadius(BaseModel):
    account_count: int
    user_count: int


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role_name: str
    description: str | None


class SBUResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    is_active: bool | None


class ZoneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    is_active: bool | None


class LeadSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None


class OpportunityStageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    stage_code: str
    stage_name: str
    display_order: int
    default_win_probability: Decimal


class OpportunityStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status_code: str
    status_name: str
    is_terminal: bool
    is_system_generated: bool


class ProjectStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status_code: str
    status_name: str


class LossReasonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reason_code: str
    reason_name: str


class HoldReasonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reason_code: str
    reason_name: str
