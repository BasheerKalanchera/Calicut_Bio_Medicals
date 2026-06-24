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
    managing_sbu_id: uuid.UUID | None = None
    payer_behavior: PayerBehavior | None = None


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    parent_account_id: uuid.UUID | None = None
    managing_sbu_id: uuid.UUID | None = None
    payer_behavior: PayerBehavior | None = None


class SBUNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class AccountListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    parent_account_id: uuid.UUID | None
    managing_sbu_id: uuid.UUID | None
    payer_behavior: str | None
    managing_sbu: SBUNested | None


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    parent_account_id: uuid.UUID | None
    managing_sbu_id: uuid.UUID | None
    payer_behavior: str | None
    created_at: datetime
    updated_at: datetime
    managing_sbu: SBUNested | None
    parent_account: AccountListResponse | None
