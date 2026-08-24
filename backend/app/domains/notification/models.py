import uuid
from datetime import datetime

from sqlalchemy import UUID, Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Notification(Base):
    __tablename__ = "notification"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False, index=True
    )
    # Generic on purpose -- starts with 'OPPORTUNITY_ASSIGNED' only, but this
    # table is shaped to carry BR-OP-06's never-built Stalled-opportunity
    # notification later without a schema change.
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # Not a real FK: entity_type varies by notification type, so entity_id is
    # polymorphic. Callers resolve the referenced row themselves at read time
    # (repository.py joins to Opportunity/Account when entity_type == "opportunity").
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False
    )
    # Frozen at creation -- a notification is a point-in-time event log entry,
    # not a live view of the referenced entity's current urgency.
    is_urgent: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    actor: Mapped["UserProfile"] = relationship(foreign_keys=[created_by], lazy="joined")
