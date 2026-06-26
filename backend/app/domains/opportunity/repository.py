import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, noload

from app.db.base import BaseRepository
from app.domains.account.models import Account
from app.domains.opportunity.models import Opportunity


class OpportunityRepository(BaseRepository[Opportunity]):
    def __init__(self, db: Session):
        super().__init__(Opportunity, db)

    def list_by_account(self, account_id: uuid.UUID) -> list[Opportunity]:
        stmt = (
            select(Opportunity)
            .where(Opportunity.account_id == account_id)
            .options(
                noload(Opportunity.account),
                noload(Opportunity.opportunity_stakeholders),
                noload(Opportunity.splits),
                noload(Opportunity.items),
                noload(Opportunity.activities),
                noload(Opportunity.documents),
            )
            .order_by(Opportunity.name)
        )
        return list(self.db.scalars(stmt).unique().all())

    def account_exists(self, account_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Account.id == account_id)) or 0) > 0
