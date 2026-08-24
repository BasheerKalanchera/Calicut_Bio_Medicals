import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActorNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str


class NotificationResponse(BaseModel):
    id: uuid.UUID
    type: str
    entity_type: str
    entity_id: uuid.UUID
    is_urgent: bool
    created_at: datetime
    read_at: datetime | None
    actor: ActorNested
    # Resolved at read time, not denormalized onto the row -- None if the
    # referenced entity (or its account) no longer resolves.
    opportunity_name: str | None = None
    account_name: str | None = None


class UnreadCountResponse(BaseModel):
    unread_count: int
    urgent_unread_count: int
