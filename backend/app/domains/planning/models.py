import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import UUID, CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
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
    # BR-PL-05: the approved total an in-flight revision is measured against.
    previous_approved_total_lakhs: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)

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
    saved by diff on revision (only added/changed/dropped brands are
    written), so the audit trail (BR-AUD-01) shows real changes only."""

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
    enforced at the service layer. Saved by diff on revision, same as
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


_PCT_SUM = "pct_jan_mar + pct_apr_jun + pct_jul_sep + pct_oct_dec = 100"


class BrandAnnualTarget(AuditMixin, Base):
    """A brand's own yearly figure and Cabio's stretch on it, for the brand
    year starting in start_year (docs/Annual-Target-Planning-Implementation-
    Plan.md, D23, D24, D40). The pct_* columns are the brand's own seasonal
    pattern -- all null means it follows its SBU's pattern (D25). Saving
    works out its quarters into BrandVendorTarget (D46). Admin/GM only."""

    __tablename__ = "brand_annual_target"
    __table_args__ = (
        UniqueConstraint("brand_id", "start_year", name="uq_brand_annual_target"),
        CheckConstraint("vendor_amount_lakhs >= 0", name="ck_brand_annual_target_vendor_nonneg"),
        CheckConstraint("stretch_pct >= 0", name="ck_brand_annual_target_stretch_nonneg"),
        CheckConstraint(
            "(pct_jan_mar IS NULL AND pct_apr_jun IS NULL AND pct_jul_sep IS NULL AND pct_oct_dec IS NULL) OR "
            f"(pct_jan_mar >= 0 AND pct_apr_jun >= 0 AND pct_jul_sep >= 0 AND pct_oct_dec >= 0 AND {_PCT_SUM})",
            name="ck_brand_annual_target_pattern",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brand.id"), nullable=False)
    start_year: Mapped[int] = mapped_column(Integer, nullable=False)
    vendor_amount_lakhs: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    stretch_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, server_default="0")
    pct_jan_mar: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    pct_apr_jun: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    pct_jul_sep: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    pct_oct_dec: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)


class SbuSeasonalPattern(AuditMixin, Base):
    """How an SBU's brand years spread across the calendar quarters, per
    calendar year (D25, D41). Tied to the months, not a brand's first
    quarter. Admin/GM only."""

    __tablename__ = "sbu_seasonal_pattern"
    __table_args__ = (
        UniqueConstraint("sbu_id", "year", name="uq_sbu_seasonal_pattern"),
        CheckConstraint(
            f"pct_jan_mar >= 0 AND pct_apr_jun >= 0 AND pct_jul_sep >= 0 AND pct_oct_dec >= 0 AND {_PCT_SUM}",
            name="ck_sbu_seasonal_pattern_pct",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sbu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    pct_jan_mar: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    pct_apr_jun: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    pct_jul_sep: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    pct_oct_dec: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)


class PersonQuarterTarget(AuditMixin, Base):
    """One person's target for a quarter -- an Area Manager's share of the
    SBU, or a rep's share of their Area Manager's (D30, D32, D33, D45, D57).
    Set by the person's direct manager, Admin or GM; seen by the person,
    those above them, Admin and GM (RLS, migration 0062). No delete."""

    __tablename__ = "person_quarter_target"
    __table_args__ = (
        UniqueConstraint("user_id", "sbu_id", "planning_period", name="uq_person_quarter_target"),
        CheckConstraint("planning_period ~ '^\\d{4}-Q[1-4]$'", name="ck_person_quarter_target_planning_period"),
        CheckConstraint("target_amount_lakhs >= 0", name="ck_person_quarter_target_nonneg"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False)
    sbu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=False)
    planning_period: Mapped[str] = mapped_column(String(10), nullable=False)
    target_amount_lakhs: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    set_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False)


class BrandVendorTarget(AuditMixin, Base):
    """The number a brand/vendor actually promised Cabio for a quarter --
    Admin/GM only (docs/Brand-Level-Target-Planning-Implementation-Plan.md
    decision #2; read narrowed to Admin/GM by migration 0062, D23). From
    2026-Q3 on, saved from the brand's yearly figure (BrandAnnualTarget,
    D46). Compared against the SUM of TargetPlanBrandSplit rows for the
    same brand/period to show the committed-vs-vendor gap; summed per SBU
    as the SBU target (D47, D55)."""

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
