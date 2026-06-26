import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class StakeholderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    designation: str | None = Field(None, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=50)
    nps_score: int | None = Field(None, ge=-100, le=100)
    sentiment: str | None = Field(None, max_length=50)


class StakeholderUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    designation: str | None = Field(None, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=50)
    nps_score: int | None = Field(None, ge=-100, le=100)
    sentiment: str | None = Field(None, max_length=50)


class StakeholderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_id: uuid.UUID
    name: str
    designation: str | None
    email: str | None
    phone: str | None
    nps_score: int | None
    sentiment: str | None
    created_at: datetime
    updated_at: datetime
