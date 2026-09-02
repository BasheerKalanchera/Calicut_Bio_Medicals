import uuid
from datetime import datetime

from sqlalchemy import UUID, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    """Maps the existing `audit_log` table (backend/alembic/versions/
    0030_add_audit_log.py) -- no migration here, this is a read model only.
    Rows are written exclusively by the DB trigger audit_log_row_change(),
    never by application code."""

    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_name: Mapped[str] = mapped_column(String, nullable=False)
    record_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)
    changed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=True
    )
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    old_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    new_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
