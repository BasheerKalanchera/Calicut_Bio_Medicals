import re
import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator


class UserNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str


class SBUNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class TargetPlanCreate(BaseModel):
    sbu_id: uuid.UUID
    planning_period: str
    target_amount_lakhs: Decimal

    @field_validator("planning_period")
    @classmethod
    def validate_planning_period(cls, v: str) -> str:
        if not re.match(r"^\d{4}-Q[1-4]$", v):
            raise ValueError("planning_period must be in the form YYYY-Qn, e.g. 2026-Q3")
        return v


class TargetPlanUpdate(BaseModel):
    target_amount_lakhs: Decimal


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
    created_at: datetime
    updated_at: datetime


class SBUTargetRollupResponse(BaseModel):
    sbu_id: uuid.UUID
    planning_period: str
    total_target_amount_lakhs: Decimal
    user_count: int
