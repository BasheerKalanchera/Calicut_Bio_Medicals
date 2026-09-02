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
