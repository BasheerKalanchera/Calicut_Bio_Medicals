import uuid
from datetime import datetime

from sqlalchemy import UUID, Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base, CreatedAtMixin


class Activity(CreatedAtMixin, Base):
    __tablename__ = "activity"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # BR-ACT-01/BR-ACT-03: NOT NULL for every activity_type except the six
    # Sales Development Activity types (BR-ACT-09) -- enforced at the
    # database level via chk_activity_account_required, not by this column's
    # own nullability alone.
    account_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("account.id"), nullable=True, index=True
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
    # BR-ACT-09: required (at the app layer) for the six Sales Development
    # Activity types, distinct from the general-purpose `notes` above.
    outcome_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    account: Mapped["Account | None"] = relationship(back_populates="activities", lazy="joined")
    project: Mapped["Project | None"] = relationship(back_populates="activities", lazy="joined")
    opportunity: Mapped["Opportunity | None"] = relationship(back_populates="activities", lazy="joined")
    user: Mapped["UserProfile"] = relationship(
        back_populates="activities", foreign_keys=[user_id], lazy="joined"
    )
    # Who actually logged this Activity, as opposed to `user` above (who it's
    # logged against, BR-ACT-04) -- the two are the same person for every
    # activity type except MANAGER_NOTE, where they're deliberately
    # different. Nullable because `created_by` (CreatedAtMixin) predates this
    # relationship and is itself nullable.
    created_by_user: Mapped["UserProfile | None"] = relationship(
        foreign_keys="Activity.created_by", lazy="joined"
    )

    reminders: Mapped[list["Reminder"]] = relationship(
        back_populates="activity", foreign_keys="Reminder.activity_id", lazy="select"
    )
    comments: Mapped[list["ActivityComment"]] = relationship(
        back_populates="activity", foreign_keys="ActivityComment.activity_id", lazy="select"
    )


class ActivityComment(Base):
    __tablename__ = "activity_comment"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    activity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("activity.id"), nullable=False, index=True
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # No updated_at/edited flag -- post-only in v1, same immutability posture as
    # Activity itself (see docs/Activity-Comment-Implementation-Plan.md, decision 3).
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False
    )

    activity: Mapped["Activity"] = relationship(back_populates="comments", foreign_keys=[activity_id], lazy="joined")
    # Aliased to `author` (not `created_by_user`, unlike Activity's own field) --
    # a comment has no "who it's about" distinction the way MANAGER_NOTE does,
    # so there's only ever one person to name here.
    author: Mapped["UserProfile"] = relationship(foreign_keys=[created_by], lazy="joined")


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
    # BR-ACT-05: nullable pointer to the Activity created when this reminder
    # is completed, documenting what was actually done to close it out.
    # Distinct from activity_id above (the *creating* activity, BR-ACT-04).
    closing_activity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("activity.id"), nullable=True, index=True
    )

    activity: Mapped["Activity"] = relationship(
        back_populates="reminders", foreign_keys=[activity_id], lazy="joined"
    )
    closing_activity: Mapped["Activity | None"] = relationship(
        foreign_keys=[closing_activity_id], lazy="joined"
    )
    assigned_to_user: Mapped["UserProfile"] = relationship(
        back_populates="assigned_reminders", foreign_keys=[assigned_to_user_id], lazy="joined"
    )
