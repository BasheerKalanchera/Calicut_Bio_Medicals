import uuid
from datetime import datetime

from sqlalchemy import UUID, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base, CreatedAtMixin


class Activity(CreatedAtMixin, Base):
    __tablename__ = "activity"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("account.id"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("project.id"), nullable=True
    )
    opportunity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunity.id"), nullable=True, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False, index=True
    )
    activity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    activity_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    account: Mapped["Account"] = relationship(back_populates="activities", lazy="joined")
    project: Mapped["Project | None"] = relationship(back_populates="activities", lazy="joined")
    opportunity: Mapped["Opportunity | None"] = relationship(back_populates="activities", lazy="joined")
    user: Mapped["UserProfile"] = relationship(
        back_populates="activities", foreign_keys=[user_id], lazy="joined"
    )

    reminders: Mapped[list["Reminder"]] = relationship(back_populates="activity", lazy="selectin")


class Reminder(AuditMixin, Base):
    __tablename__ = "reminder"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    activity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("activity.id"), nullable=False, index=True
    )
    assigned_to_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False, index=True
    )
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    reminder_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_completed: Mapped[bool | None] = mapped_column(Boolean, server_default="false")

    activity: Mapped["Activity"] = relationship(back_populates="reminders", lazy="joined")
    assigned_to_user: Mapped["UserProfile"] = relationship(
        back_populates="assigned_reminders", foreign_keys=[assigned_to_user_id], lazy="joined"
    )
