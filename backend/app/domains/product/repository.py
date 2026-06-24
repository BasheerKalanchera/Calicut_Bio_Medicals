import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.product.models import Product


class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: Session):
        super().__init__(Product, db)

    def list_products(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
        sbu_id: uuid.UUID | None = None,
        brand: str | None = None,
        active_only: bool = True,
    ) -> tuple[list[Product], int]:
        stmt = select(Product)

        if active_only:
            stmt = stmt.where(Product.is_active == True)  # noqa: E712
        if search:
            stmt = stmt.where(Product.name.ilike(f"%{search}%"))
        if sbu_id:
            stmt = stmt.where(Product.sbu_id == sbu_id)
        if brand:
            stmt = stmt.where(Product.oem_name.ilike(f"%{brand}%"))

        stmt = stmt.order_by(Product.name)

        total = self.db.scalar(
            select(func.count()).select_from(stmt.subquery())
        )
        results = list(
            self.db.scalars(stmt.offset(offset).limit(limit)).unique().all()
        )
        return results, total or 0
