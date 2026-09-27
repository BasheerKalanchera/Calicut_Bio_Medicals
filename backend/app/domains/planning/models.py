import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import UUID, CheckConstraint, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base


class TargetPlan(AuditMixin, Base):
    __tablename__ = "target_plan"
    __table_args__ = (
        UniqueConstraint("user_id", "sbu_id", "planning_period", name="target_plan_unique"),
        CheckConstraint("planning_period ~ '^\\d{4}-Q[1-4]$'", name="ck_target_plan_planning_period"),
        CheckConstraint(
            "status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')", name="ck_target_plan_status"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False)
    sbu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=False)
    planning_period: Mapped[str] = mapped_column(String(10), nullable=False)
    target_amount_lakhs: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING_APPROVAL")
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    change_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["UserProfile"] = relationship(
        back_populates="target_plans", foreign_keys=[user_id], lazy="joined"
    )
    approver: Mapped["UserProfile | None"] = relationship(foreign_keys=[approved_by], lazy="joined")
    sbu: Mapped["SBU"] = relationship(back_populates="target_plans", lazy="joined")
    brand_splits: Mapped[list["TargetPlanBrandSplit"]] = relationship(
        back_populates="target_plan", lazy="select", cascade="all, delete-orphan"
    )
    accounts: Mapped[list["TargetPlanAccount"]] = relationship(
        back_populates="target_plan", lazy="select", cascade="all, delete-orphan"
    )


class TargetPlanBrandSplit(AuditMixin, Base):
    """Per-brand breakdown of a TargetPlan's one quarterly number
    (docs/Brand-Level-Target-Planning-Implementation-Plan.md). Rows are
    always replaced wholesale on revision, not diffed in place -- target_plan
    has no audit-trail trigger yet (BR-AUD-01), so there's no
    OpportunityRepository.replace_items-style audit-noise concern here."""

    __tablename__ = "target_plan_brand_split"
    __table_args__ = (
        UniqueConstraint("target_plan_id", "brand_id", name="uq_target_plan_brand_split"),
        CheckConstraint("split_amount_lakhs >= 0", name="ck_target_plan_brand_split_nonneg"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("target_plan.id", ondelete="CASCADE"), nullable=False
    )
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brand.id"), nullable=False)
    split_amount_lakhs: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    target_plan: Mapped["TargetPlan"] = relationship(back_populates="brand_splits", lazy="select")
    brand: Mapped["Brand"] = relationship(lazy="joined")


class TargetPlanAccount(AuditMixin, Base):
    """One hospital on a TargetPlan (docs/Hospital-Wise-Target-Planning-Implementation-Plan.md).
    The plan's target_amount_lakhs is the SUM of planned_amount_lakhs,
    enforced at the service layer. Replaced wholesale on revision, same as
    TargetPlanBrandSplit."""

    __tablename__ = "target_plan_account"
    __table_args__ = (
        UniqueConstraint("target_plan_id", "account_id", name="uq_target_plan_account"),
        CheckConstraint("planned_amount_lakhs >= 0", name="ck_target_plan_account_nonneg"),
        CheckConstraint(
            "visit_frequency IN ('WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY', 'AS_NEEDED')",
            name="ck_target_plan_account_visit_frequency",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("target_plan.id", ondelete="CASCADE"), nullable=False
    )
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("account.id"), nullable=False)
    planned_amount_lakhs: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    visit_frequency: Mapped[str] = mapped_column(String(20), nullable=False)
    strategic_objective: Mapped[str | None] = mapped_column(Text, nullable=True)

    target_plan: Mapped["TargetPlan"] = relationship(back_populates="accounts", lazy="select")
    account: Mapped["Account"] = relationship(lazy="joined")


class BrandVendorTarget(AuditMixin, Base):
    """The number a brand/vendor actually promised Cabio for a quarter --
    Admin/GM only (docs/Brand-Level-Target-Planning-Implementation-Plan.md
    decision #2). Compared against the SUM of TargetPlanBrandSplit rows for
    the same brand/period to show the committed-vs-vendor gap."""

    __tablename__ = "brand_vendor_target"
    __table_args__ = (
        UniqueConstraint("brand_id", "planning_period", name="uq_brand_vendor_target"),
        CheckConstraint("planning_period ~ '^\\d{4}-Q[1-4]$'", name="ck_brand_vendor_target_planning_period"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brand.id"), nullable=False)
    planning_period: Mapped[str] = mapped_column(String(10), nullable=False)
    vendor_target_amount_lakhs: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    brand: Mapped["Brand"] = relationship(lazy="joined")
