import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    table_name: str
    record_id: uuid.UUID
    # The record's own name/display value (e.g. an Account's name) -- None
    # if it can't be resolved (an unrecognized table_name, or a deleted
    # record whose old_data snapshot happened to omit its own name field).
    record_label: str | None
    # The row's immediate parent for context and click-through -- e.g.
    # parent_type="opportunity" on a split/opportunity_item row,
    # parent_type="account" on an opportunity/stakeholder row. All three
    # are None together for tables with no natural parent (account,
    # user_profile, product) or when it can't be resolved (parent
    # deleted, or a DELETE row whose old_data snapshot happened to omit
    # the FK).
    parent_type: str | None
    parent_id: uuid.UUID | None
    parent_label: str | None
    # The record this entry is grouped under on screen: the parent for line
    # tables (an Opportunity's product lines, a target plan's hospitals),
    # the row itself for main records. owner_type is a table name.
    owner_type: str
    owner_id: uuid.UUID | None
    owner_label: str | None
    # INSERT (a line added to an existing record), UPDATE or DELETE.
    action: str
    changed_at: datetime
    # None when changed_by itself is None (a direct-DB write outside a
    # request context) or when the referenced user_profile row is gone.
    changed_by_name: str | None
    old_data: dict | None
    new_data: dict | None
    # Parallel to old_data/new_data -- only the keys whose value is a known
    # foreign-key field successfully resolved to a human label (e.g.
    # zone_id -> "North Kerala"). A field missing here (unresolvable ID, or
    # not a foreign key at all) should fall back to its raw old_data/
    # new_data value.
    old_data_display: dict[str, str]
    new_data_display: dict[str, str]


class AuditSaveResponse(BaseModel):
    """Everything one save recorded (same time, same user). The Audit Log
    pages by save, so a save is never split across pages."""

    changed_at: datetime
    # None for a direct-DB write outside the app (no logged-in user).
    changed_by_name: str | None
    entries: list[AuditLogResponse]
