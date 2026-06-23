import uuid
from datetime import date

from sqlalchemy import UUID, Boolean, CheckConstraint, Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base


class InstalledAsset(AuditMixin, Base):
    __tablename__ = "installed_asset"
    __table_args__ = (
        CheckConstraint(
            "(is_competitor_equipment = false AND product_id IS NOT NULL) OR (is_competitor_equipment = true)",
            name="chk_competitor_equipment",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("account.id"), nullable=False, index=True
    )
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product.id"), nullable=True
    )
    is_competitor_equipment: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    competitor_product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    installation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)

    account: Mapped["Account"] = relationship(back_populates="installed_assets", lazy="joined")
    product: Mapped["Product | None"] = relationship(back_populates="installed_assets", lazy="joined")
