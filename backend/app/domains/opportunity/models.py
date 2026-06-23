import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import (
    UUID,
    CheckConstraint,
    Computed,
    Date,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base


class Opportunity(AuditMixin, Base):
    __tablename__ = "opportunity"
    __table_args__ = (
        CheckConstraint(
            "win_probability >= 0 AND win_probability <= 100",
            name="ck_opportunity_win_probability",
        ),
        Index(
            "idx_opportunity_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("account.id"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("project.id"), nullable=True
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False, index=True
    )
    stage_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunity_stage.id"), nullable=False, index=True
    )
    status_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunity_status.id"), nullable=False, index=True
    )
    win_probability: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    lead_source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lead_source.id"), nullable=True
    )
    indicative_value: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    expected_closure_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    loss_reason_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("loss_reason.id"), nullable=True
    )
    loss_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    competitor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hold_reason_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hold_reason.id"), nullable=True
    )
    reactivation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    demo_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    demo_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    po_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    account: Mapped["Account"] = relationship(back_populates="opportunities", lazy="joined")
    project: Mapped["Project | None"] = relationship(back_populates="opportunities", lazy="joined")
    owner: Mapped["UserProfile"] = relationship(
        back_populates="owned_opportunities", foreign_keys=[owner_id], lazy="joined"
    )
    stage: Mapped["OpportunityStage"] = relationship(back_populates="opportunities", lazy="joined")
    status: Mapped["OpportunityStatus"] = relationship(back_populates="opportunities", lazy="joined")
    lead_source: Mapped["LeadSource | None"] = relationship(back_populates="opportunities", lazy="joined")
    loss_reason: Mapped["LossReason | None"] = relationship(back_populates="opportunities", lazy="joined")
    hold_reason: Mapped["HoldReason | None"] = relationship(back_populates="opportunities", lazy="joined")

    opportunity_stakeholders: Mapped[list["OpportunityStakeholder"]] = relationship(
        back_populates="opportunity", lazy="selectin"
    )
    splits: Mapped[list["Split"]] = relationship(back_populates="opportunity", lazy="selectin")
    items: Mapped[list["OpportunityItem"]] = relationship(back_populates="opportunity", lazy="selectin")
    activities: Mapped[list["Activity"]] = relationship(back_populates="opportunity", lazy="selectin")
    documents: Mapped[list["Document"]] = relationship(back_populates="opportunity", lazy="selectin")


class OpportunityStakeholder(AuditMixin, Base):
    __tablename__ = "opportunity_stakeholder"
    __table_args__ = (
        CheckConstraint(
            "influence_level IN ('HIGH', 'MEDIUM', 'LOW')",
            name="ck_opportunity_stakeholder_influence_level",
        ),
    )

    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunity.id"), primary_key=True
    )
    stakeholder_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("stakeholder.id"), primary_key=True
    )
    influence_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    decision_role: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    opportunity: Mapped["Opportunity"] = relationship(back_populates="opportunity_stakeholders", lazy="joined")
    stakeholder: Mapped["Stakeholder"] = relationship(back_populates="opportunity_stakeholders", lazy="joined")


class Split(AuditMixin, Base):
    __tablename__ = "split"
    __table_args__ = (
        UniqueConstraint("opportunity_id", "user_id", name="split_unique"),
        CheckConstraint(
            "split_percentage >= 0 AND split_percentage <= 100",
            name="ck_split_percentage",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunity.id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False
    )
    split_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)

    opportunity: Mapped["Opportunity"] = relationship(back_populates="splits", lazy="joined")
    user: Mapped["UserProfile"] = relationship(back_populates="splits", foreign_keys=[user_id], lazy="joined")


class OpportunityItem(AuditMixin, Base):
    __tablename__ = "opportunity_item"
    __table_args__ = (
        UniqueConstraint("opportunity_id", "product_id", name="opportunity_item_unique"),
        CheckConstraint("quantity > 0", name="ck_opportunity_item_quantity"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunity.id"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product.id"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_lakhs: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    discount_lakhs: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, server_default="0")
    extended_value_lakhs: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), Computed("quantity * unit_price_lakhs - discount_lakhs", persisted=True)
    )

    opportunity: Mapped["Opportunity"] = relationship(back_populates="items", lazy="joined")
    product: Mapped["Product"] = relationship(back_populates="opportunity_items", lazy="joined")
