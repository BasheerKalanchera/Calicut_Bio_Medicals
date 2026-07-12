import uuid
from datetime import datetime

from sqlalchemy import UUID, CheckConstraint, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Document(Base):
    __tablename__ = "document"
    __table_args__ = (
        CheckConstraint(
            "account_id IS NOT NULL OR project_id IS NOT NULL OR opportunity_id IS NOT NULL OR product_id IS NOT NULL",
            name="chk_document_context",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # Nullable: URL-only collateral links (Product Catalog) have no real file
    # to size. Real uploads, if built later, would still populate this.
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    account_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("account.id"), nullable=True, index=True
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("project.id"), nullable=True
    )
    opportunity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunity.id"), nullable=True, index=True
    )
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product.id"), nullable=True
    )
    uploaded_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False
    )
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    account: Mapped["Account | None"] = relationship(back_populates="documents", lazy="joined")
    project: Mapped["Project | None"] = relationship(back_populates="documents", lazy="joined")
    opportunity: Mapped["Opportunity | None"] = relationship(back_populates="documents", lazy="joined")
    product: Mapped["Product | None"] = relationship(back_populates="documents", lazy="joined")
    uploaded_by_user: Mapped["UserProfile"] = relationship(back_populates="uploaded_documents", lazy="joined")
