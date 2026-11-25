import uuid
from decimal import Decimal

from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, noload

from app.db.base import BaseRepository
from app.domains.product.models import Product


class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: Session):
        super().__init__(Product, db)

    def create(self, obj: Product) -> Product:
        """Overrides BaseRepository.create -- brand_id/category_id/name are
        set server-side by trg_product_sync_brand_category_name (migration
        0049), not by the app, so the in-memory object is stale after a
        plain flush() and fails ProductResponse validation (found live,
        2026-09-22). refresh() re-reads the trigger-computed values."""
        self.db.add(obj)
        self.db.flush()
        self.db.refresh(obj)
        return obj

    def update(self, obj: Product) -> Product:
        """Same reason as create() above -- an update touching model_id or
        sbu_id re-runs the same trigger."""
        self.db.flush()
        self.db.refresh(obj)
        return obj

    def sbu_exists(self, sbu_id: uuid.UUID) -> bool:
        from app.domains.reference.models import SBU
        return self.db.get(SBU, sbu_id) is not None

    def active_product_exists_for_model(self, model_id: uuid.UUID, *, exclude_id: uuid.UUID | None = None) -> bool:
        """Backs the uq_product_model_id_active partial index (migration
        0052) with a friendly pre-check -- found live, 2026-09-22: nothing
        stopped a second active catalog entry for the same Model."""
        stmt = select(func.count()).where(Product.model_id == model_id, Product.is_active == True)  # noqa: E712
        if exclude_id is not None:
            stmt = stmt.where(Product.id != exclude_id)
        return (self.db.scalar(stmt) or 0) > 0

    def usage_counts(self, product_id: uuid.UUID) -> tuple[int, int]:
        """(open Opportunities, marketing leads waiting for a decision) that use
        the product -- Product Deactivate plan D3/D4. "Open" means the status
        is not terminal (Active, On Hold, and Stalled if it is switched on);
        "waiting" means lead status NEW."""
        from app.domains.marketing_lead.models import MarketingLead
        from app.domains.opportunity.models import Opportunity, OpportunityItem
        from app.domains.reference.models import OpportunityStatus

        open_statuses = select(OpportunityStatus.id).where(OpportunityStatus.is_terminal == False)  # noqa: E712
        open_opportunities = self.db.scalar(
            select(func.count(Opportunity.id)).where(
                Opportunity.status_id.in_(open_statuses),
                Opportunity.id.in_(
                    select(OpportunityItem.opportunity_id).where(OpportunityItem.product_id == product_id)
                ),
            )
        )
        waiting_leads = self.db.scalar(
            select(func.count(MarketingLead.id)).where(
                MarketingLead.product_id == product_id, MarketingLead.status == "NEW"
            )
        )
        return open_opportunities or 0, waiting_leads or 0

    def fill_empty_won_costs(self, product_id: uuid.UUID, cost_lakhs: Decimal) -> None:
        """Margin Report plan D16: copy a product's first catalog cost onto its
        Won product lines that have no saved cost, marked "filled in later".
        Lines that already have a saved cost are never touched."""
        from app.domains.opportunity.models import Opportunity, OpportunityItem
        from app.domains.reference.models import OpportunityStatus

        won_opportunities = (
            select(Opportunity.id)
            .join(OpportunityStatus, OpportunityStatus.id == Opportunity.status_id)
            .where(OpportunityStatus.status_code == "WON")
        )
        self.db.execute(
            update(OpportunityItem)
            .where(
                OpportunityItem.product_id == product_id,
                OpportunityItem.line_type == "PRODUCT",
                OpportunityItem.cost_at_won_lakhs.is_(None),
                OpportunityItem.opportunity_id.in_(won_opportunities),
            )
            .values(cost_at_won_lakhs=cost_lakhs, cost_filled_in_later=True)
            .execution_options(synchronize_session=False)
        )

    def get_model_sbu_id(self, model_id: uuid.UUID) -> uuid.UUID | None:
        from app.domains.reference.models import Model
        return self.db.scalar(select(Model.sbu_id).where(Model.id == model_id))

    def _filters(
        self,
        *,
        search: str | None,
        sbu_id: uuid.UUID | None,
        active_only: bool,
    ) -> list:
        f = []
        if active_only:
            # NULL counts as active, like the column's server default (true).
            f.append(Product.is_active.is_not(False))
        if search:
            from app.domains.reference.models import SBU, Brand
            sbu_match = select(SBU.id).where(SBU.name.ilike(f"%{search}%")).scalar_subquery()
            # Brand is no longer free text on product itself -- match via
            # brand_id, same as name (which already embeds the brand name,
            # trigger-computed) doubling the brand-name search.
            brand_match = select(Brand.id).where(Brand.name.ilike(f"%{search}%")).scalar_subquery()
            f.append(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.brand_id.in_(brand_match),
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
