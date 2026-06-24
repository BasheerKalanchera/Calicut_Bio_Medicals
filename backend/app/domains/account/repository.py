import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.account.models import Account
from app.domains.reference.models import SBU


class AccountRepository(BaseRepository[Account]):
    def __init__(self, db: Session):
        super().__init__(Account, db)

    def list_accounts(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
        zone_id: uuid.UUID | None = None,
        sbu_id: uuid.UUID | None = None,
    ) -> tuple[list[Account], int]:
        stmt = select(Account)

        if search:
            stmt = stmt.where(Account.name.ilike(f"%{search}%"))
        if sbu_id:
            stmt = stmt.where(Account.managing_sbu_id == sbu_id)

        stmt = stmt.order_by(Account.name)

        total = self.db.scalar(
            select(func.count()).select_from(stmt.subquery())
        )
        results = list(
            self.db.scalars(stmt.offset(offset).limit(limit)).unique().all()
        )
        return results, total or 0

    def exists_by_name(self, name: str, *, exclude_id: uuid.UUID | None = None) -> bool:
        stmt = select(func.count()).where(func.lower(Account.name) == func.lower(name))
        if exclude_id:
            stmt = stmt.where(Account.id != exclude_id)
        return (self.db.scalar(stmt) or 0) > 0

    def sbu_exists(self, sbu_id: uuid.UUID) -> bool:
        return self.db.get(SBU, sbu_id) is not None

    def account_exists(self, account_id: uuid.UUID) -> bool:
        return self.db.get(Account, account_id) is not None
