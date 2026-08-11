import uuid
from decimal import Decimal

from sqlalchemy import UUID, Boolean, CheckConstraint, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Role(Base):
    __tablename__ = "role"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    user_profiles: Mapped[list["UserProfile"]] = relationship(back_populates="role", lazy="select")


class SBU(Base):
    __tablename__ = "sbu"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")

    user_profiles: Mapped[list["UserProfile"]] = relationship(back_populates="sbu", lazy="select")
    products: Mapped[list["Product"]] = relationship(back_populates="sbu", lazy="select")
    target_plans: Mapped[list["TargetPlan"]] = relationship(back_populates="sbu", lazy="select")
    opportunities: Mapped[list["Opportunity"]] = relationship(back_populates="sbu", lazy="select")


class Zone(Base):
    __tablename__ = "zone"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # NOT globally unique anymore as of migration 0019 -- see that migration's
    # docstring. Uniqueness is now per-parent (uq_zone_parent_name) plus a
    # partial index for the root case (uq_zone_root_name), not this column
    # constraint alone.
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")
    # Self-referencing tree (migration 0019) -- arbitrary depth, no fixed
    # levels. Existing 5 zones stay parent_zone_id=NULL (top-level) until a
    # later seeding step gives them real State-level parents (Kerala,
    # Karnataka). Same remote_side pattern as Account.parent_account_id
    # (account/models.py) -- already-proven shape, not a new one.
    parent_zone_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("zone.id"), nullable=True
    )
    # Purely advisory (STATE/ZONE/DISTRICT/TALUK/CLUSTER) -- not structurally
    # enforced, since depth alone doesn't say what *kind* of node something
    # is (a Bangalore numbered zone and a Kerala taluk can sit at the same
    # tree depth but mean different things). Useful for UI/reporting only.
    zone_level: Mapped[str | None] = mapped_column(String(20), nullable=True)

    user_profiles: Mapped[list["UserProfile"]] = relationship(back_populates="zone", lazy="select")
    accounts: Mapped[list["Account"]] = relationship(back_populates="zone", lazy="select")
    user_zones: Mapped[list["UserZone"]] = relationship(back_populates="zone", lazy="select")
    parent: Mapped["Zone | None"] = relationship(
        back_populates="children", remote_side="Zone.id", lazy="joined"
    )
    children: Mapped[list["Zone"]] = relationship(back_populates="parent", lazy="select")


class ZoneClosure(Base):
    """The territory tree's "coverage binder" (Discussion-Zone-Hierarchy-2026-08.md).

    Precomputed ancestor/descendant pairs for every zone, including a
    self-row per zone (a zone is its own ancestor/descendant at distance
    zero). Purely derived/computed -- no audit columns, not directly
    user-editable. Rebuilt in full on every zone create/rename/move/
    deprecate (reference/repository.py's rebuild_all_closure()) rather than
    incrementally patched -- see that method's own docstring for why.
    """

    __tablename__ = "zone_closure"

    ancestor_zone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("zone.id"), primary_key=True
    )
    descendant_zone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("zone.id"), primary_key=True
    )


class LeadSource(Base):
    __tablename__ = "lead_source"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")

    opportunities: Mapped[list["Opportunity"]] = relationship(back_populates="lead_source", lazy="select")


class OpportunityStage(Base):
    __tablename__ = "opportunity_stage"
    __table_args__ = (
        CheckConstraint(
            "default_win_probability >= 0 AND default_win_probability <= 100",
            name="ck_opportunity_stage_win_probability",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stage_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    stage_name: Mapped[str] = mapped_column(String(100), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    default_win_probability: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")

    opportunities: Mapped[list["Opportunity"]] = relationship(back_populates="stage", lazy="select")


class OpportunityStatus(Base):
    __tablename__ = "opportunity_status"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    status_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_terminal: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    is_system_generated: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")

    opportunities: Mapped[list["Opportunity"]] = relationship(back_populates="status", lazy="select")


class ProjectStatus(Base):
    __tablename__ = "project_status"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    status_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")

    projects: Mapped[list["Project"]] = relationship(back_populates="status", lazy="select")


class LossReason(Base):
    __tablename__ = "loss_reason"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reason_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    reason_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")

    opportunities: Mapped[list["Opportunity"]] = relationship(back_populates="loss_reason", lazy="select")


class HoldReason(Base):
    __tablename__ = "hold_reason"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reason_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    reason_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")

    opportunities: Mapped[list["Opportunity"]] = relationship(back_populates="hold_reason", lazy="select")
