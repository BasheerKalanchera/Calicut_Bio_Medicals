import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class PayerBehavior(StrEnum):
    GOOD = "GOOD"
    AVERAGE = "AVERAGE"
    PROBLEMATIC = "PROBLEMATIC"
    UNKNOWN = "UNKNOWN"


class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    parent_account_id: uuid.UUID | None = None
    zone_id: uuid.UUID
    payer_behavior: PayerBehavior | None = None


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    parent_account_id: uuid.UUID | None = None
    zone_id: uuid.UUID | None = None
    payer_behavior: PayerBehavior | None = None


class ZoneNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class AccountListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    parent_account_id: uuid.UUID | None
    zone_id: uuid.UUID
    payer_behavior: str | None
    zone: ZoneNested


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    parent_account_id: uuid.UUID | None
    zone_id: uuid.UUID
    payer_behavior: str | None
    created_at: datetime
    updated_at: datetime
    zone: ZoneNested
    parent_account: AccountListResponse | None


class AccountDetailResponse(AccountResponse):
    stakeholder_count: int
    project_count: int
    opportunity_count: int
    asset_count: int


class AccountCountsEntry(BaseModel):
    stakeholder_count: int
    project_count: int
    opportunity_count: int
    asset_count: int
