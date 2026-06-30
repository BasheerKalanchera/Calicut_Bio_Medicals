import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Approved activity types (BR-ACT-02 adds MANAGER_NOTE)
ActivityType = Literal["VISIT", "CALL", "EMAIL", "MEETING", "NOTE", "MANAGER_NOTE"]


# ------------------------------------------------------------------
# Shared nested
# ------------------------------------------------------------------

class UserNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str


# ------------------------------------------------------------------
# Activity
# ------------------------------------------------------------------

class ActivityCreate(BaseModel):
    account_id: uuid.UUID
    opportunity_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None  # defaults to the authenticated user if omitted
    activity_type: ActivityType
    activity_date: datetime
    notes: str | None = None


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_id: uuid.UUID
    opportunity_id: uuid.UUID | None
    project_id: uuid.UUID | None
    user_id: uuid.UUID
    activity_type: str
    activity_date: datetime
    notes: str | None
    created_at: datetime
    user: UserNested


# ------------------------------------------------------------------
# Reminder
# ------------------------------------------------------------------

class ReminderCreate(BaseModel):
    activity_id: uuid.UUID
    assigned_to_user_id: uuid.UUID
    due_date: datetime
    reminder_text: str = Field(..., min_length=1)


class ReminderUpdate(BaseModel):
    is_completed: bool


class ReminderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    activity_id: uuid.UUID
    assigned_to_user_id: uuid.UUID
    due_date: datetime
    reminder_text: str
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    assigned_to_user: UserNested
