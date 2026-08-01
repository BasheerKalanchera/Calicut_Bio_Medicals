import uuid
from typing import TYPE_CHECKING

from sqlalchemy import UUID, CheckConstraint, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base

if TYPE_CHECKING:
    from app.domains.activity.models import Activity
    from app.domains.asset.models import InstalledAsset
    from app.domains.document.models import Document
    from app.domains.opportunity.models import Opportunity, OpportunityStakeholder
    from app.domains.planning.models import CoveragePlanEntry
    from app.domains.project.models import Project
    from app.domains.reference.models import Zone


class Account(AuditMixin, Base):
    __tablename__ = "account"
    __table_args__ = (
        CheckConstraint(
            "payer_behavior IN ('GOOD', 'AVERAGE', 'PROBLEMATIC', 'UNKNOWN')",
            name="ck_account_payer_behavior",
        ),
        CheckConstraint(
            "customer_type IN ('MULTISPECIALITY_HOSPITAL', 'SPECIALTY_HOSPITAL', "
            "'DIAGNOSTIC_CENTER', 'CLINIC', 'DEALER', 'MEDICAL_COLLEGE_HOSPITAL', "
            "'GOVERNMENT_HOSPITAL', 'OTHER')",
            name="ck_account_customer_type",
        ),
        Index("idx_account_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_account_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("account.id"), nullable=True
    )
    zone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("zone.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    payer_behavior: Mapped[str | None] = mapped_column(String(50), nullable=True)
    customer_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    parent_account: Mapped["Account | None"] = relationship(
        back_populates="child_accounts", remote_side="Account.id", lazy="joined"
    )
    child_accounts: Mapped[list["Account"]] = relationship(back_populates="parent_account", lazy="select")
    zone: Mapped["Zone"] = relationship(back_populates="accounts", lazy="joined")

    stakeholders: Mapped[list["Stakeholder"]] = relationship(back_populates="account", lazy="select")
    projects: Mapped[list["Project"]] = relationship(back_populates="account", lazy="select")
    opportunities: Mapped[list["Opportunity"]] = relationship(back_populates="account", lazy="select")
    activities: Mapped[list["Activity"]] = relationship(back_populates="account", lazy="select")
    installed_assets: Mapped[list["InstalledAsset"]] = relationship(back_populates="account", lazy="select")
    documents: Mapped[list["Document"]] = relationship(back_populates="account", lazy="select")
    coverage_plan_entries: Mapped[list["CoveragePlanEntry"]] = relationship(back_populates="account", lazy="select")


class Stakeholder(AuditMixin, Base):
    __tablename__ = "stakeholder"
    __table_args__ = (
        CheckConstraint("nps_score >= -100 AND nps_score <= 100", name="ck_stakeholder_nps_score"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("account.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Frontend (Customer360Screen.tsx) mirrors `phone` into this field whenever
    # the stakeholder doesn't have a distinct WhatsApp number, so it's always
    # populated when phone is -- NULL genuinely means no number on file at all,
    # not "same as phone". See migration 0015.
    whatsapp_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    nps_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sentiment: Mapped[str | None] = mapped_column(String(50), nullable=True)

    account: Mapped["Account"] = relationship(back_populates="stakeholders", lazy="joined")
    opportunity_stakeholders: Mapped[list["OpportunityStakeholder"]] = relationship(
        back_populates="stakeholder", lazy="select"
    )
