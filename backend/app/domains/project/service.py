import uuid

from app.core.exceptions import NotFoundError
from app.domains.project.models import Project
from app.domains.project.repository import ProjectRepository
from app.domains.project.schemas import ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, repository: ProjectRepository):
        self.repository = repository

    def _require_account(self, account_id: uuid.UUID) -> None:
        if not self.repository.account_exists(account_id):
            raise NotFoundError(f"Account {account_id} not found")

    def create_project(
        self,
        account_id: uuid.UUID,
        data: ProjectCreate,
        *,
        created_by: uuid.UUID,
    ) -> Project:
        self._require_account(account_id)

        project = Project(
            account_id=account_id,
            name=data.name,
            owner_id=data.owner_id,
            status_id=data.status_id,
            bid_submission_date=data.bid_submission_date,
            created_by=created_by,
            updated_by=created_by,
        )
        return self.repository.create(project)

    def update_project(
        self,
        project_id: uuid.UUID,
        data: ProjectUpdate,
        *,
        updated_by: uuid.UUID,
    ) -> Project:
        project = self.repository.get_by_id(project_id)
        if not project:
            raise NotFoundError(f"Project {project_id} not found")

        updates = data.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(project, field, value)

        project.updated_by = updated_by
        return self.repository.update(project)
