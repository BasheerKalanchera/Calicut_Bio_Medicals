import uuid
from decimal import Decimal

from sqlalchemy import UUID, Boolean, CheckConstraint, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base


class Product(AuditMixin, Base):
    __tablename__ = "product"
    __table_args__ = (
        CheckConstraint(
            "product_type IN ('NEW_EQUIPMENT', 'REFURBISHED', 'ACCESSORY')",
            name="ck_product_product_type",
        ),
        CheckConstraint(
            "(full_price_lakhs IS NULL OR full_price_lakhs >= 0)"
            " AND (rep_floor_lakhs IS NULL OR rep_floor_lakhs >= 0)"
            " AND (area_manager_floor_lakhs IS NULL OR area_manager_floor_lakhs >= 0)"
            " AND (ceo_floor_lakhs IS NULL OR ceo_floor_lakhs >= 0)"
            " AND (cost_lakhs IS NULL OR cost_lakhs >= 0)",
            name="ck_product_prices_non_negative",
        ),
        Index("idx_product_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sbu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=False, index=True)
    # Trigger-populated (migration 0049, trg_product_sync_brand_category_name)
    # as "<Brand> <Model> <Category>" -- never set directly by the app. See
    # ProductCreate/ProductUpdate (schemas.py): only model_id is client-settable.
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brand.id"), nullable=False, index=True)
    model_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("model.id"), nullable=False, index=True)
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("category.id"), nullable=False, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # BR-CAT-02: only REFURBISHED products may be used as a Buyback line item
    # on an Opportunity (docs/Product-Lifecycle-TradeIns-Accessories-Technical-Design.md).
    product_type: Mapped[str] = mapped_column(String(20), nullable=False, server_default="NEW_EQUIPMENT")
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")
    # Migration 0066 (docs/Product-Pricing-And-Cost-Implementation-Plan.md),
    # INR Lakhs, all optional. Who may see each one is decided only in
    # product/schemas.py (BR-CAT-04) -- never serialise these by hand.
    full_price_lakhs: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    rep_floor_lakhs: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    area_manager_floor_lakhs: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    ceo_floor_lakhs: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    cost_lakhs: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)

    sbu: Mapped["SBU"] = relationship(back_populates="products", lazy="joined")
    brand: Mapped["Brand"] = relationship(lazy="joined")
    model: Mapped["Model"] = relationship(back_populates="products", lazy="joined")
    category: Mapped["Category"] = relationship(lazy="joined")

    opportunity_items: Mapped[list["OpportunityItem"]] = relationship(back_populates="product", lazy="select")
    installed_assets: Mapped[list["InstalledAsset"]] = relationship(back_populates="product", lazy="select")
    documents: Mapped[list["Document"]] = relationship(back_populates="product", lazy="select")

    @property
    def oem_name(self) -> str | None:
        """Read-only compat shim for callers still reading the pre-cleanup
        free-text field name (e.g. account/workspace_schemas.py's
        ProductNested, from_attributes-populated) -- not a mapped column,
        so it can't drift or be written to. Backed by the real brand_id FK."""
        return self.brand.name if self.brand else None

    @property
    def model_number(self) -> str | None:
        """See oem_name above -- same shim, backed by the real model_id FK."""
        return self.model.name if self.model else None
