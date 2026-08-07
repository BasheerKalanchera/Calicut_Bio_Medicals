import uuid

from sqlalchemy import UUID, Boolean, CheckConstraint, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base


class Product(AuditMixin, Base):
    __tablename__ = "product"
    __table_args__ = (
        CheckConstraint(
            "product_type IN ('NEW_EQUIPMENT', 'REFURBISHED', 'ACCESSORY')",
            name="ck_product_product_type",
        ),
        Index("idx_product_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sbu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    oem_name: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    model_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # BR-CAT-02: only REFURBISHED products may be used as a Buyback line item
    # on an Opportunity (docs/Product-Lifecycle-TradeIns-Accessories-Technical-Design.md).
    product_type: Mapped[str] = mapped_column(String(20), nullable=False, server_default="NEW_EQUIPMENT")
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")

    sbu: Mapped["SBU"] = relationship(back_populates="products", lazy="joined")

    opportunity_items: Mapped[list["OpportunityItem"]] = relationship(back_populates="product", lazy="select")
    installed_assets: Mapped[list["InstalledAsset"]] = relationship(back_populates="product", lazy="select")
    documents: Mapped[list["Document"]] = relationship(back_populates="product", lazy="select")
