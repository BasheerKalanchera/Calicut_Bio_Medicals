import uuid

from pydantic import BaseModel, ConfigDict


class SBUNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class ZoneNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class UserMeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str
    is_active: bool | None
    role_name: str
    sbu: SBUNested | None
    zone: ZoneNested | None


class UserListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str
    is_active: bool | None
    sbu_id: uuid.UUID | None
    zone_id: uuid.UUID | None
    zone_ids: list[uuid.UUID]
    role_id: uuid.UUID
    role_name: str
    manager_id: uuid.UUID | None


class UserBlastRadius(BaseModel):
    """Backs the Deactivate confirmation -- informational only, same as
    ZoneBlastRadius; deactivating is grandfathered, so neither count blocks
    the action."""

    direct_report_count: int
    open_opportunity_count: int


class UserCreate(BaseModel):
    id: uuid.UUID
    display_name: str
    sbu_id: uuid.UUID | None = None
    role_id: uuid.UUID
    zone_id: uuid.UUID | None = None
    zone_ids: list[uuid.UUID] = []
    manager_id: uuid.UUID | None = None


class UserUpdate(BaseModel):
    display_name: str | None = None
    sbu_id: uuid.UUID | None = None
    role_id: uuid.UUID | None = None
    zone_id: uuid.UUID | None = None
    zone_ids: list[uuid.UUID] | None = None
    manager_id: uuid.UUID | None = None
