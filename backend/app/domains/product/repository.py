import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, noload

from app.db.base import BaseRepository
from app.domains.product.models import Product


class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: Session):
        super().__init__(Product, db)

    def sbu_exists(self, sbu_id: uuid.UUID) -> bool:
        from app.domains.reference.models import SBU
        return self.db.get(SBU, sbu_id) is not None

    def _filters(
        self,
        *,
        search: str | None,
        sbu_id: uuid.UUID | None,
        active_only: bool,
    ) -> list:
        f = []
        if active_only:
            f.append(Product.is_active == True)  # noqa: E712
        if search:
            from app.domains.reference.models import SBU
            sbu_match = select(SBU.id).where(SBU.name.ilike(f"%{search}%")).scalar_subquery()
            f.append(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.oem_name.ilike(f"%{search}%"),
                    Product.sbu_id.in_(sbu_match),
                )
            )
        if sbu_id:
            f.append(Product.sbu_id == sbu_id)
        return f

    def count_products(
        self,
        *,
        search: str | None = None,
        sbu_id: uuid.UUID | None = None,
        active_only: bool = True,
    ) -> int:
        filters = self._filters(search=search, sbu_id=sbu_id, active_only=active_only)
        return self.db.scalar(select(func.count(Product.id)).where(*filters)) or 0

    def list_products(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
        sbu_id: uuid.UUID | None = None,
        active_only: bool = True,
        include_count: bool = True,
    ) -> tuple[list[Product], int]:
        filters = self._filters(search=search, sbu_id=sbu_id, active_only=active_only)

        total = self.count_products(search=search, sbu_id=sbu_id, active_only=active_only) if include_count else 0

        stmt = (
            select(Product)
            .options(
                noload(Product.opportunity_items),
                noload(Product.installed_assets),
                noload(Product.documents),
            )
            .where(*filters)
            .order_by(Product.name)
        )
        results = list(
            self.db.scalars(stmt.offset(offset).limit(limit)).unique().all()
        )
        return results, total
