import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

# Approved activity types (BR-ACT-02 adds MANAGER_NOTE)
ActivityType = Literal["VISIT", "CALL", "EMAIL", "MEETING", "NOTE", "MANAGER_NOTE"]


# ------------------------------------------------------------------
# Shared nested
# ------------------------------------------------------------------

class UserNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str


class AccountNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class OpportunityNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


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
    # BR-ACT-04: mandatory for every activity_type except MANAGER_NOTE
    # (internal manager-to-rep guidance carries no follow-up commitment).
    next_action_text: str | None = Field(default=None, min_length=1)
    next_action_due_date: datetime | None = None
    next_action_owner_id: uuid.UUID | None = None  # defaults to Activity.user_id

    @model_validator(mode="after")
    def _require_next_action_unless_manager_note(self) -> "ActivityCreate":
        if self.activity_type != "MANAGER_NOTE":
            if not self.next_action_text:
                raise ValueError("Next Action is required to log this activity.")
            if not self.next_action_due_date:
                raise ValueError("Next Action Due Date is required to log this activity.")
        return self


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_id: uuid.UUID
    opportunity_id: uuid.UUID | None
    project_id: uuid.UUID | None
    user_id: uuid.UUID
    activity_type: ActivityType
    activity_date: datetime
    notes: str | None
    created_at: datetime
    user: UserNested
    next_action_reminder_id: uuid.UUID | None = None


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


class ActivityContextNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    activity_type: ActivityType
    activity_date: datetime
    account: AccountNested
    opportunity: OpportunityNested | None


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
    activity: ActivityContextNested
