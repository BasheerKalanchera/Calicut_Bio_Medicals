import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentCreate(BaseModel):
    file_name: str
    # Free-form short label, not DB-enforced — frontend offers a fixed set
    # (Brochure/Video/Image/Other) for icon/display purposes only. Left
    # unconstrained so real uploads (actual MIME types) can populate it
    # later without a schema change.
    file_type: str
    # URL-only collateral link today (the pasted external URL). Real
    # uploads, if built later, would populate this with a Supabase Storage
    # path instead — same column, no schema change needed.
    storage_path: str


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_name: str
    file_type: str
    storage_path: str
    uploaded_at: datetime
