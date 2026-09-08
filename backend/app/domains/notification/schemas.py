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
    # Only populated for entity_type == "activity" (MANAGER_NOTE_ADDED) --
    # entity_id there is the Activity id, which has no detail screen of its
    # own, so the frontend needs these to know which screen to open:
    # Opportunity's own screen when opportunity_id is set, else Customer 360
    # via account_id.
    account_id: uuid.UUID | None = None
    opportunity_id: uuid.UUID | None = None


class UnreadCountResponse(BaseModel):
    unread_count: int
    urgent_unread_count: int


class MarkReadRequest(BaseModel):
    # entity_type == "activity" (MANAGER_NOTE_ADDED) has no single-entity GET
    # route to piggyback a read-receipt on the way OPPORTUNITY_ASSIGNED does
    # off GET /opportunities/{id} -- the frontend calls this explicitly
    # instead when the recipient opens the notification.
    entity_type: str
    entity_id: uuid.UUID
