import uuid

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, joinedload

from app.db.base import BaseRepository
from app.domains.account.models import Account
from app.domains.marketing_lead.models import MarketingLead
from app.domains.organization.models import UserProfile
from app.domains.product.models import Product
from app.domains.reference.models import LeadSource

# (MarketingLead, account name, lead source name, product name) -- outer-
# joined and resolved at read time, no denormalization onto the row. Same
# pattern as NotificationRepository's NotificationRow.
MarketingLeadRow = tuple[MarketingLead, str | None, str | None, str | None]


class MarketingLeadRepository(BaseRepository[MarketingLead]):
    def __init__(self, db: Session):
        super().__init__(MarketingLead, db)

    def _enriched_select(self):
        return (
            select(MarketingLead, Account.name, LeadSource.name, Product.name)
            # outerjoin, not join -- account_id is nullable ("Not Sure Yet,"
            # 0034_make_marketing_lead_account_nullable.py). An inner join
            # here would silently drop every account_id IS NULL row from
            # every list this repository returns.
            .outerjoin(Account, Account.id == MarketingLead.account_id)
            .join(LeadSource, LeadSource.id == MarketingLead.lead_source_id)
            .outerjoin(Product, Product.id == MarketingLead.product_id)
            .options(joinedload(MarketingLead.assigned_to_user))
        )

    def list_all(self) -> list[MarketingLeadRow]:
        # No manual filtering here -- RLS (marketing_lead_select policy)
        # already restricts rows to what the caller should see, same as
        # every other repository in this codebase (Backend-Implementation-
        # Standards.md section 9, RLS Context Propagation).
        stmt = self._enriched_select().order_by(MarketingLead.created_at.desc())
        return list(self.db.execute(stmt).all())

    def get_enriched_by_id(self, lead_id: uuid.UUID) -> MarketingLeadRow | None:
        stmt = self._enriched_select().where(MarketingLead.id == lead_id)
        return self.db.execute(stmt).first()

    def mark_first_viewed(self, user_id: uuid.UUID) -> None:
        # Scoped to assigned_to_user_id=user_id -- naturally a no-op when the
        # caller is a Marketing User viewing their own created-leads list
        # (MarketingLeadEntryScreen shares this same GET endpoint), since
        # they're never the assignee of their own leads. Only fires for a
        # rep genuinely viewing their own Marketing Lead Queue.
        self.db.execute(
            update(MarketingLead)
            .where(
                MarketingLead.assigned_to_user_id == user_id,
                MarketingLead.status == "NEW",
                MarketingLead.first_viewed_at.is_(None),
            )
            .values(first_viewed_at=func.now())
        )

    def get_rep_manager_id(self, rep_user_id: uuid.UUID) -> uuid.UUID | None:
        # Mirrors OpportunityRepository.get_owner_manager_id exactly (BR-OP-14's
        # "gate override approver must be the owner's immediate manager") -- same
        # user_profile.manager_id lookup, different domain.
        return self.db.scalar(select(UserProfile.manager_id).where(UserProfile.id == rep_user_id))

    def is_valid_marketing_source(self, lead_source_id: uuid.UUID) -> bool:
        # False both when the id doesn't exist and when it exists but isn't
        # flagged -- either way the caller's answer ("can this lead_source_id
        # be used on a MarketingLead") is the same. See reference/models.py's
        # LeadSource.is_marketing_source for why this is a data flag, not a
        # hardcoded name check.
        return (
            self.db.scalar(select(LeadSource.is_marketing_source).where(LeadSource.id == lead_source_id)) is True
        )
