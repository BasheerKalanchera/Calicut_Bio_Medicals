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
        stmt = (
            select(Stakeholder)
            .where(Stakeholder.account_id == account_id)
            .order_by(Stakeholder.name)
        )
        return list(self.db.scalars(stmt).unique().all())

    def account_exists(self, account_id: uuid.UUID) -> bool:
        return self.db.get(Account, account_id) is not None
