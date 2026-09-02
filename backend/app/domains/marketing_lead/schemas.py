import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MarketingLeadCreate(BaseModel):
    account_id: uuid.UUID | None = None
    sbu_id: uuid.UUID
    lead_source_id: uuid.UUID
    event_name: str | None = Field(default=None, max_length=255)
    raw_interest_note: str | None = None
    product_id: uuid.UUID | None = None
    assigned_to_user_id: uuid.UUID


class MarketingLeadDiscard(BaseModel):
    discard_reason: str = Field(pattern="^(DUPLICATE|NOT_INTERESTED|UNABLE_TO_CONTACT|JUNK)$")
    discard_note: str | None = None


class MarketingLeadMarkConverted(BaseModel):
    converted_opportunity_id: uuid.UUID


class AssignedToNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str


class MarketingLeadResponse(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID | None
    sbu_id: uuid.UUID
    lead_source_id: uuid.UUID
    event_name: str | None
    raw_interest_note: str | None
    product_id: uuid.UUID | None
    assigned_to_user_id: uuid.UUID
    assigned_to_user: AssignedToNested
    status: str
    discard_reason: str | None
    discard_note: str | None
    converted_opportunity_id: uuid.UUID | None
    created_by: uuid.UUID | None
    created_at: datetime
    reviewed_by: uuid.UUID | None
    reviewed_at: datetime | None
    # Resolved at read time, not denormalized onto the row -- same pattern as
    # NotificationResponse's opportunity_name/account_name.
    account_name: str | None = None
    lead_source_name: str | None = None
    product_name: str | None = None
