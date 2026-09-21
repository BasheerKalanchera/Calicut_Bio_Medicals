import uuid
from decimal import Decimal

from sqlalchemy import (
    UUID,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
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
    __table_args__ = (
        Index("idx_zone_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}),
    )

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
    children: Mapped[list["Zone"]] = relationship(
        back_populates="parent", lazy="select", order_by="Zone.name"
    )


class ZoneClosure(Base):
    """The territory tree's "coverage binder" (Discussion-Zone-Hierarchy-2026-08.md).

    Precomputed ancestor/descendant pairs for every zone, including a
    self-row per zone (a zone is its own ancestor/descendant at distance
    zero). Purely derived/computed -- no audit columns, not directly
    user-editable. Rebuilt in full on every zone create/rename/move/
    deactivate (reference/repository.py's rebuild_all_closure()) rather than
    incrementally patched -- see that method's own docstring for why.
    """

    __tablename__ = "zone_closure"

    ancestor_zone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("zone.id"), primary_key=True
    )
    descendant_zone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("zone.id"), primary_key=True
    )


class Brand(Base):
    """Product Catalog hierarchy (docs/Product-Catalog-Name-Derivation-
    Implementation-Plan.md). SBU-scoped -- a brand belongs to exactly one
    SBU's catalog, same as Product itself."""

    __tablename__ = "brand"
    __table_args__ = (UniqueConstraint("sbu_id", "name", name="uq_brand_sbu_name"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sbu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    models: Mapped[list["Model"]] = relationship(back_populates="brand", lazy="select")


class Category(Base):
    """Product Catalog hierarchy -- see Brand above. SBU-scoped for the same
    reason (a Category name like "Ultrasound" is meaningful per-SBU, not a
    single company-wide list)."""

    __tablename__ = "category"
    __table_args__ = (UniqueConstraint("sbu_id", "name", name="uq_category_sbu_name"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sbu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    models: Mapped[list["Model"]] = relationship(back_populates="category", lazy="select")


class Model(Base):
    """Product Catalog hierarchy -- see Brand above. A Model is inherently
    one Brand's product of one Category (e.g. "iM70" is always an EDAN
    Patient Monitor) -- tying Category to Model, not to Product directly,
    is what prevents a "EDAN + Ultrasound" mismatch.

    `sbu_id` is denormalized from `brand.sbu_id`, kept in sync by a
    database trigger (migration 0048, trg_model_sync_sbu) -- lets RLS use
    the same flat sbu_id check as every other table instead of a join
    through brand on every row-visibility check.
    """

    __tablename__ = "model"
    __table_args__ = (UniqueConstraint("brand_id", "name", name="uq_model_brand_name"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brand.id"), nullable=False, index=True)
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("category.id"), nullable=False, index=True
    )
    sbu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    brand: Mapped["Brand"] = relationship(back_populates="models", lazy="joined")
    category: Mapped["Category"] = relationship(back_populates="models", lazy="joined")
    products: Mapped[list["Product"]] = relationship(back_populates="model", lazy="select")


class LeadSource(Base):
    __tablename__ = "lead_source"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")
    # Which sources a Marketing User may pick when logging a MarketingLead
    # (docs/Lead-Management-Implementation-Plan.md) -- data-driven, not a
    # hardcoded name match in code, so a rename or a future marketing-
    # relevant source is a data change, not a code change. Seeded true for
    # CONFERENCE/INDIAMART only (0033_add_lead_source_is_marketing_source.py).
    is_marketing_source: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=False)

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


class GateOverrideReason(Base):
    __tablename__ = "gate_override_reason"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reason_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    reason_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")

    opportunities: Mapped[list["Opportunity"]] = relationship(
        back_populates="gate_override_reason", lazy="select"
    )
