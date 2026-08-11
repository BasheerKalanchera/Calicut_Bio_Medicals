from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import UUID, Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base

if TYPE_CHECKING:
    from app.domains.activity.models import Activity, Reminder
    from app.domains.document.models import Document
    from app.domains.opportunity.models import Opportunity, Split
    from app.domains.planning.models import CoveragePlan, TargetPlan
    from app.domains.project.models import Project
    from app.domains.reference.models import SBU, Role, Zone


class UserProfile(AuditMixin, Base):
    __tablename__ = "user_profile"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    sbu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=False)
    zone_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("zone.id"), nullable=True)
    role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("role.id"), nullable=False)
    manager_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=True
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")

    sbu: Mapped[SBU] = relationship(back_populates="user_profiles", lazy="joined")
    zone: Mapped[Zone | None] = relationship(back_populates="user_profiles", lazy="joined")
    role: Mapped[Role] = relationship(back_populates="user_profiles", lazy="joined")

    # selectin, not select: _to_user_list_response needs this on every row of
    # every list page (one batched query), unlike this class's other
    # lazy="select" collections which aren't needed per-row.
    zones: Mapped[list[UserZone]] = relationship(
        back_populates="user", foreign_keys="[UserZone.user_id]", lazy="selectin"
    )

    target_plans: Mapped[list[TargetPlan]] = relationship(
        back_populates="user", foreign_keys="[TargetPlan.user_id]", lazy="select"
    )
    coverage_plans: Mapped[list[CoveragePlan]] = relationship(
        back_populates="user", foreign_keys="[CoveragePlan.user_id]", lazy="select"
    )
    owned_projects: Mapped[list[Project]] = relationship(
        back_populates="owner", foreign_keys="[Project.owner_id]", lazy="select"
    )
    owned_opportunities: Mapped[list[Opportunity]] = relationship(
        back_populates="owner", foreign_keys="[Opportunity.owner_id]", lazy="select"
    )
    splits: Mapped[list[Split]] = relationship(
        back_populates="user", foreign_keys="[Split.user_id]", lazy="select"
    )
    activities: Mapped[list[Activity]] = relationship(
        back_populates="user", foreign_keys="[Activity.user_id]", lazy="select"
    )
    assigned_reminders: Mapped[list[Reminder]] = relationship(
        back_populates="assigned_to_user", foreign_keys="[Reminder.assigned_to_user_id]", lazy="select"
    )
    uploaded_documents: Mapped[list[Document]] = relationship(
        back_populates="uploaded_by_user", foreign_keys="[Document.uploaded_by_user_id]", lazy="select"
    )


class UserZone(AuditMixin, Base):
    __tablename__ = "user_zone"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), primary_key=True
    )
    zone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("zone.id"), primary_key=True
    )

    user: Mapped[UserProfile] = relationship(
        back_populates="zones", foreign_keys=[user_id], lazy="joined"
    )
    zone: Mapped[Zone] = relationship(back_populates="user_zones", lazy="joined")
