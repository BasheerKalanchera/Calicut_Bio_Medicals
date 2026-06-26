import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, noload

from app.db.base import BaseRepository
from app.domains.account.models import Account
from app.domains.project.models import Project


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, db: Session):
        super().__init__(Project, db)

    def list_by_account(self, account_id: uuid.UUID) -> list[Project]:
        stmt = (
            select(Project)
            .where(Project.account_id == account_id)
            .options(
                noload(Project.account),
                noload(Project.opportunities),
                noload(Project.activities),
                noload(Project.documents),
            )
            .order_by(Project.name)
        )
        return list(self.db.scalars(stmt).unique().all())

    def get_for_update(self, project_id: uuid.UUID) -> "Project | None":
        return self.db.scalar(
            select(Project)
            .where(Project.id == project_id)
            .options(
                noload(Project.account),
                noload(Project.opportunities),
                noload(Project.activities),
                noload(Project.documents),
            )
        )

    def account_exists(self, account_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Account.id == account_id)) or 0) > 0
