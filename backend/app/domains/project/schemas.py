import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    owner_id: uuid.UUID
    status_id: uuid.UUID
    bid_submission_date: date | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    owner_id: uuid.UUID | None = None
    status_id: uuid.UUID | None = None
    bid_submission_date: date | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    status_id: uuid.UUID
    bid_submission_date: date | None
    created_at: datetime
    updated_at: datetime
