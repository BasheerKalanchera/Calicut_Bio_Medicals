import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.account.models import Account, Stakeholder


class StakeholderRepository(BaseRepository[Stakeholder]):
    def __init__(self, db: Session):
        super().__init__(Stakeholder, db)

    def list_by_account(
        self,
        account_id: uuid.UUID,
    ) -> list[Stakeholder]:
        from sqlalchemy.orm import noload
        stmt = (
            select(Stakeholder)
            .where(Stakeholder.account_id == account_id)
            .options(
                noload(Stakeholder.account),
                noload(Stakeholder.opportunity_stakeholders),
            )
            .order_by(Stakeholder.name)
        )
        return list(self.db.scalars(stmt).unique().all())

    def get_for_update(self, stakeholder_id: uuid.UUID) -> "Stakeholder | None":
        from sqlalchemy.orm import noload
        return self.db.scalar(
            select(Stakeholder)
            .where(Stakeholder.id == stakeholder_id)
            .options(
                noload(Stakeholder.account),
                noload(Stakeholder.opportunity_stakeholders),
            )
        )

    def account_exists(self, account_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Account.id == account_id)) or 0) > 0
