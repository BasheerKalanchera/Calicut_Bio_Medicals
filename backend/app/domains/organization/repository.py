from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.organization.models import UserProfile


class UserRepository(BaseRepository[UserProfile]):
    def __init__(self, db: Session):
        super().__init__(UserProfile, db)

    def list_active(
        self,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[UserProfile], int]:
        stmt = select(UserProfile).where(UserProfile.is_active == True)  # noqa: E712
        total = self.db.scalar(
            select(func.count()).select_from(stmt.subquery())
        )
        results = list(
            self.db.scalars(stmt.offset(offset).limit(limit)).all()
        )
        return results, total or 0
