import uuid
from decimal import Decimal

from sqlalchemy import UUID, CheckConstraint, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base


class TargetPlan(AuditMixin, Base):
    __tablename__ = "target_plan"
    __table_args__ = (
        UniqueConstraint("user_id", "sbu_id", "planning_period", name="target_plan_unique"),
        CheckConstraint("planning_period ~ '^\\d{4}-Q[1-4]$'", name="ck_target_plan_planning_period"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False)
    sbu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=False)
    planning_period: Mapped[str] = mapped_column(String(10), nullable=False)
    target_amount_lakhs: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    user: Mapped["UserProfile"] = relationship(
        back_populates="target_plans", foreign_keys=[user_id], lazy="joined"
    )
    sbu: Mapped["SBU"] = relationship(back_populates="target_plans", lazy="joined")
    coverage_plans: Mapped[list["CoveragePlan"]] = relationship(back_populates="target_plan", lazy="selectin")


class CoveragePlan(AuditMixin, Base):
    __tablename__ = "coverage_plan"
    __table_args__ = (
        UniqueConstraint("user_id", "planning_period", name="coverage_plan_unique"),
        CheckConstraint("planning_period ~ '^\\d{4}-Q[1-4]$'", name="ck_coverage_plan_planning_period"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False)
    target_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("target_plan.id"), nullable=False
    )
    planning_period: Mapped[str] = mapped_column(String(10), nullable=False)

    user: Mapped["UserProfile"] = relationship(
        back_populates="coverage_plans", foreign_keys=[user_id], lazy="joined"
    )
    target_plan: Mapped["TargetPlan"] = relationship(back_populates="coverage_plans", lazy="joined")
    entries: Mapped[list["CoveragePlanEntry"]] = relationship(back_populates="coverage_plan", lazy="selectin")


class CoveragePlanEntry(AuditMixin, Base):
    __tablename__ = "coverage_plan_entry"
    __table_args__ = (
        UniqueConstraint("coverage_plan_id", "account_id", name="coverage_plan_entry_unique"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    coverage_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coverage_plan.id"), nullable=False
    )
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("account.id"), nullable=False)
    strategic_objective: Mapped[str] = mapped_column(String, nullable=False)
    target_revenue_lakhs: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    coverage_frequency: Mapped[str | None] = mapped_column(String(50), nullable=True)

    coverage_plan: Mapped["CoveragePlan"] = relationship(back_populates="entries", lazy="joined")
    account: Mapped["Account"] = relationship(back_populates="coverage_plan_entries", lazy="joined")
