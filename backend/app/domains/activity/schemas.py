import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

# Approved activity types (BR-ACT-02 adds MANAGER_NOTE; BR-ACT-09 adds the six
# Sales Development Activity types)
ActivityType = Literal[
    "VISIT", "CALL", "EMAIL", "MEETING", "NOTE", "MANAGER_NOTE",
    "CONFERENCE_EXPO", "OEM_PRODUCT_TRAINING", "CERTIFICATION",
    "SALES_TRAINING", "SEMINAR_TRADE_SHOW", "OTHER_DEVELOPMENT",
]

# BR-ACT-09: no Account required, no mandatory next action (BR-ACT-04), not a
# valid Reminder-closing activity type (BR-ACT-05). Shared here so the three
# call sites (this file, service.py, LogActivityModal.tsx) can't drift apart
# the way MANAGER_NOTE's single-site exemption previously invited.
SALES_DEVELOPMENT_ACTIVITY_TYPES: frozenset[str] = frozenset({
    "CONFERENCE_EXPO", "OEM_PRODUCT_TRAINING", "CERTIFICATION",
    "SALES_TRAINING", "SEMINAR_TRADE_SHOW", "OTHER_DEVELOPMENT",
})


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


class ProjectNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


# ------------------------------------------------------------------
# Activity
# ------------------------------------------------------------------

class ActivityCreate(BaseModel):
    account_id: uuid.UUID | None = None
    opportunity_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None  # defaults to the authenticated user if omitted
    activity_type: ActivityType
    activity_date: datetime
    notes: str | None = None
    # BR-ACT-09: required only for the six Sales Development Activity types.
    outcome_notes: str | None = None
    # BR-ACT-04: mandatory for every activity_type except MANAGER_NOTE and the
    # Sales Development Activity types (neither is a customer interaction, so
    # neither carries a follow-up commitment).
    next_action_text: str | None = Field(default=None, min_length=1)
    next_action_due_date: datetime | None = None
    next_action_owner_id: uuid.UUID | None = None  # defaults to Activity.user_id

    @model_validator(mode="after")
    def _require_next_action_unless_exempt(self) -> "ActivityCreate":
        if self.activity_type != "MANAGER_NOTE" and self.activity_type not in SALES_DEVELOPMENT_ACTIVITY_TYPES:
            if not self.next_action_text:
                raise ValueError("Next Action is required to log this activity.")
            if not self.next_action_due_date:
                raise ValueError("Next Action Due Date is required to log this activity.")
        return self

    @model_validator(mode="after")
    def _require_account_unless_sales_development(self) -> "ActivityCreate":
        # BR-ACT-01/BR-ACT-09: every activity_type requires an Account except
        # the six Sales Development Activity types, which are deliberately
        # unattached.
        if self.activity_type not in SALES_DEVELOPMENT_ACTIVITY_TYPES and not self.account_id:
            raise ValueError("Account is required to log this activity.")
        return self

    @model_validator(mode="after")
    def _require_outcome_notes_for_sales_development(self) -> "ActivityCreate":
        # BR-ACT-09: the "what did you get out of it" field is the one thing
        # required of these otherwise-lightweight entries.
        if self.activity_type in SALES_DEVELOPMENT_ACTIVITY_TYPES and not self.outcome_notes:
            raise ValueError("Outcome/Learning is required to log this activity.")
        return self

    @model_validator(mode="after")
    def _require_notes_for_other_development(self) -> "ActivityCreate":
        # BR-ACT-09, decision #4a: OTHER_DEVELOPMENT is the only Sales
        # Development type whose label carries no information about what
        # actually happened -- the other five name themselves.
        if self.activity_type == "OTHER_DEVELOPMENT" and not self.notes:
            raise ValueError("Description is required for Other Development.")
        return self


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_id: uuid.UUID | None
    opportunity_id: uuid.UUID | None
    project_id: uuid.UUID | None
    user_id: uuid.UUID
    activity_type: ActivityType
    activity_date: datetime
    notes: str | None
    outcome_notes: str | None
    created_at: datetime
    user: UserNested
    next_action_reminder_id: uuid.UUID | None = None


class ActivityReportRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    activity_type: ActivityType
    activity_date: datetime
    notes: str | None
    outcome_notes: str | None
    account: AccountNested | None
    opportunity: OpportunityNested | None
    project: ProjectNested | None
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
    # BR-ACT-05: required when completing a reminder (is_completed=True) --
    # mirrors BR-ACT-04's own strictness in the opposite direction (Activity
    # -> mandatory Next Action, atomic). Not required when reopening
    # (is_completed=False).
    activity_type: ActivityType | None = None
    activity_date: datetime | None = None
    notes: str | None = Field(default=None, min_length=1)
    # Optional follow-up discovered while closing this reminder -- same
    # BR-ACT-04 mechanism (Activity -> optional Reminder), just optional
    # here rather than mandatory: not every closure produces a new task.
    next_action_text: str | None = Field(default=None, min_length=1)
    next_action_due_date: datetime | None = None
    next_action_owner_id: uuid.UUID | None = None  # defaults to whoever closed it

    @model_validator(mode="after")
    def _require_closing_activity_when_completing(self) -> "ReminderUpdate":
        if self.is_completed:
            if not self.activity_type:
                raise ValueError("Activity type is required to close a Next Action.")
            if self.activity_type == "MANAGER_NOTE":
                raise ValueError("Manager Note is not a valid closing activity type.")
            if self.activity_type in SALES_DEVELOPMENT_ACTIVITY_TYPES:
                raise ValueError("Sales Development activities are not a valid closing activity type.")
            if not self.activity_date:
                raise ValueError("Activity date is required to close a Next Action.")
            if not self.notes:
                raise ValueError("Notes describing what was done are required to close a Next Action.")
        if bool(self.next_action_text) != bool(self.next_action_due_date):
            raise ValueError("Next Action and Next Action Due Date must be provided together.")
        return self


class ActivityContextNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    activity_type: ActivityType
    activity_date: datetime
    notes: str | None
    outcome_notes: str | None
    account: AccountNested | None
    opportunity: OpportunityNested | None
    user: UserNested


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
    # BR-ACT-05: the Activity created when this reminder was completed,
    # documenting what was done. None until completed.
    closing_activity: ActivityContextNested | None = None
