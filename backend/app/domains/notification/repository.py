import uuid

from sqlalchemy import and_, case, func, select, update
from sqlalchemy.orm import Session, joinedload

from app.db.base import BaseRepository
from app.domains.account.models import Account
from app.domains.marketing_lead.models import MarketingLead
from app.domains.notification.models import Notification
from app.domains.opportunity.models import Opportunity

# (Notification, opportunity name, account name) -- account/opportunity are
# outer-joined and resolved at read time (no denormalization onto the row),
# same pattern as ReminderRepository's activity/account context. account name
# is resolved from whichever polymorphic entity_type the row actually has
# (opportunity's account, or a marketing_lead's account) -- see
# _enriched_select's coalesce.
NotificationRow = tuple[Notification, str | None, str | None]


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: Session):
        super().__init__(Notification, db)

    def _enriched_select(self):
        marketing_lead_account = Account.__table__.alias("marketing_lead_account")
        return (
            select(
                Notification,
                Opportunity.name,
                case(
                    (Notification.entity_type == "opportunity", Account.name),
                    (Notification.entity_type == "marketing_lead", marketing_lead_account.c.name),
                ),
            )
            .outerjoin(
                Opportunity,
                and_(
                    Notification.entity_type == "opportunity",
                    Opportunity.id == Notification.entity_id,
                ),
            )
            .outerjoin(Account, Account.id == Opportunity.account_id)
            .outerjoin(
                MarketingLead,
                and_(
                    Notification.entity_type == "marketing_lead",
                    MarketingLead.id == Notification.entity_id,
                ),
            )
            .outerjoin(marketing_lead_account, marketing_lead_account.c.id == MarketingLead.account_id)
            .options(joinedload(Notification.actor))
        )

    def list_for_user(self, user_id: uuid.UUID, *, limit: int = 20) -> list[NotificationRow]:
        stmt = (
            self._enriched_select()
            .where(Notification.recipient_user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return list(self.db.execute(stmt).all())

    def list_urgent_unread(self, user_id: uuid.UUID) -> list[NotificationRow]:
        stmt = (
            self._enriched_select()
            .where(
                Notification.recipient_user_id == user_id,
                Notification.is_urgent == True,  # noqa: E712
                Notification.read_at.is_(None),
            )
            .order_by(Notification.created_at.desc())
        )
        return list(self.db.execute(stmt).all())

    def count_unread(self, user_id: uuid.UUID) -> tuple[int, int]:
        total, urgent = self.db.execute(
            select(
                func.count(Notification.id),
                func.count(Notification.id).filter(Notification.is_urgent == True),  # noqa: E712
            ).where(Notification.recipient_user_id == user_id, Notification.read_at.is_(None))
        ).one()
        return total or 0, urgent or 0

    def mark_read_for_entity(self, user_id: uuid.UUID, entity_type: str, entity_id: uuid.UUID) -> None:
        self.db.execute(
            update(Notification)
            .where(
                Notification.recipient_user_id == user_id,
                Notification.entity_type == entity_type,
                Notification.entity_id == entity_id,
                Notification.read_at.is_(None),
            )
            .values(read_at=func.now())
        )

    def mark_read_for_type(self, user_id: uuid.UUID, entity_type: str) -> None:
        # Bulk variant of mark_read_for_entity -- marketing_lead has no
        # single-item detail screen to hang a per-entity "opening it marks it
        # read" receipt off of (unlike Opportunity's GET /opportunities/{id}).
        # Viewing the Marketing Lead Queue itself is the read receipt instead.
        self.db.execute(
            update(Notification)
            .where(
                Notification.recipient_user_id == user_id,
                Notification.entity_type == entity_type,
                Notification.read_at.is_(None),
            )
            .values(read_at=func.now())
        )
