import re
import uuid
from datetime import datetime
from decimal import Decimal

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


class TargetPlanCreate(BaseModel):
    sbu_id: uuid.UUID
    planning_period: str
    target_amount_lakhs: Decimal = Field(..., gt=0)
    brand_splits: list[BrandSplitEntry] | None = None

    @field_validator("planning_period")
    @classmethod
    def validate_planning_period(cls, v: str) -> str:
        if not re.match(r"^\d{4}-Q[1-4]$", v):
            raise ValueError("planning_period must be in the form YYYY-Qn, e.g. 2026-Q3")
        return v


class TargetPlanUpdate(BaseModel):
    target_amount_lakhs: Decimal = Field(..., gt=0)
    brand_splits: list[BrandSplitEntry] | None = None


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
    brand_splits: list[BrandSplitResponse] = []
    created_at: datetime
    updated_at: datetime


class SBUTargetRollupResponse(BaseModel):
    sbu_id: uuid.UUID
    planning_period: str
    total_target_amount_lakhs: Decimal
    user_count: int


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
