import uuid

from sqlalchemy import UUID, Boolean, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base


class Product(AuditMixin, Base):
    __tablename__ = "product"
    __table_args__ = (
        Index("idx_product_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sbu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    oem_name: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    model_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")

    sbu: Mapped["SBU"] = relationship(back_populates="products", lazy="joined")

    opportunity_items: Mapped[list["OpportunityItem"]] = relationship(back_populates="product", lazy="select")
    installed_assets: Mapped[list["InstalledAsset"]] = relationship(back_populates="product", lazy="select")
    documents: Mapped[list["Document"]] = relationship(back_populates="product", lazy="select")
