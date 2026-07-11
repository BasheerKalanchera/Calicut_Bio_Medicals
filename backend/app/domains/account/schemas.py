import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class PayerBehavior(StrEnum):
    GOOD = "GOOD"
    AVERAGE = "AVERAGE"
    PROBLEMATIC = "PROBLEMATIC"
    UNKNOWN = "UNKNOWN"


class CustomerType(StrEnum):
    """Institution nature — Cabio Sales OS Phase 1 PRD SS B.2.6."""

    MULTISPECIALITY_HOSPITAL = "MULTISPECIALITY_HOSPITAL"
    SPECIALTY_HOSPITAL = "SPECIALTY_HOSPITAL"
    DIAGNOSTIC_CENTER = "DIAGNOSTIC_CENTER"
    CLINIC = "CLINIC"
    DEALER = "DEALER"
    MEDICAL_COLLEGE_HOSPITAL = "MEDICAL_COLLEGE_HOSPITAL"
    GOVERNMENT_HOSPITAL = "GOVERNMENT_HOSPITAL"
    OTHER = "OTHER"


class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    parent_account_id: uuid.UUID | None = None
    zone_id: uuid.UUID
    payer_behavior: PayerBehavior | None = None
    customer_type: CustomerType | None = None


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    parent_account_id: uuid.UUID | None = None
    zone_id: uuid.UUID | None = None
    payer_behavior: PayerBehavior | None = None
    customer_type: CustomerType | None = None


class ZoneNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class AccountRef(BaseModel):
    """Minimal account reference for parent/child links — deliberately not
    self-nesting (no parent_account field) to avoid the self-referential FK
    triggering an extra lazy-load query beyond SQLAlchemy's default one-level
    eager join depth."""

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
    customer_type: str | None
    zone: ZoneNested
    parent_account: AccountRef | None = None


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    parent_account_id: uuid.UUID | None
    zone_id: uuid.UUID
    payer_behavior: str | None
    customer_type: str | None
    created_at: datetime
    updated_at: datetime
    zone: ZoneNested
    parent_account: AccountRef | None


class AccountDetailResponse(AccountResponse):
    stakeholder_count: int
    project_count: int
    opportunity_count: int
    asset_count: int
    activity_count: int
    child_accounts: list[AccountRef] = []


class AccountCountsEntry(BaseModel):
    stakeholder_count: int
    project_count: int
    opportunity_count: int
    asset_count: int
