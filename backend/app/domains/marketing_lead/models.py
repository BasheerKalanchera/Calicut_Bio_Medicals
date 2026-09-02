import uuid
from datetime import datetime

from sqlalchemy import UUID, CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MarketingLead(Base):
    __tablename__ = "marketing_lead"
    __table_args__ = (
        CheckConstraint("status IN ('NEW', 'CONVERTED', 'DISCARDED')", name="ck_marketing_lead_status"),
        CheckConstraint(
            "discard_reason IS NULL OR discard_reason IN "
            "('DUPLICATE', 'NOT_INTERESTED', 'UNABLE_TO_CONTACT', 'JUNK')",
            name="ck_marketing_lead_discard_reason",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Nullable -- Marketing User has no Account-creation rights (an earlier
    # explicit decision), so if the hospital isn't in the directory yet
    # there must be a way to submit without one ("Not Sure Yet," same
    # pattern as product_id below). The assigned rep resolves the real
    # account at Convert time instead. (0034_make_marketing_lead_account_
    # nullable.py.)
    account_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("account.id"), nullable=True)
    sbu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=False)
    lead_source_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lead_source.id"), nullable=False
    )
    event_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_interest_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Nullable -- usually unknown at entry (raw conference/IndiaMART interest,
    # not a scoped deal yet). See docs/Lead-Management-Implementation-Plan.md.
    product_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("product.id"), nullable=True)
    assigned_to_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="NEW")
    discard_reason: Mapped[str | None] = mapped_column(String(20), nullable=True)
    discard_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    converted_opportunity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunity.id"), nullable=True
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("user_profile.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("user_profile.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # One-directional only (no back_populates on Account/SBU/LeadSource/Product/
    # UserProfile) -- same choice as Notification.actor. Keeps this domain from
    # touching five existing domains' models.py just for a relationship the
    # repository's enriched joins (see repository.py) don't actually need.
    assigned_to_user: Mapped["UserProfile"] = relationship(
        foreign_keys=[assigned_to_user_id], lazy="joined"
    )
