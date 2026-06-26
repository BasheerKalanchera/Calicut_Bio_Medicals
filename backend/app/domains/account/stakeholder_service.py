import uuid

from app.core.exceptions import NotFoundError
from app.domains.account.models import Stakeholder
from app.domains.account.stakeholder_repository import StakeholderRepository
from app.domains.account.stakeholder_schemas import StakeholderCreate, StakeholderUpdate


class StakeholderService:
    def __init__(self, repository: StakeholderRepository):
        self.repository = repository

    def _require_account(self, account_id: uuid.UUID) -> None:
        if not self.repository.account_exists(account_id):
            raise NotFoundError(f"Account {account_id} not found")

    def list_stakeholders(self, account_id: uuid.UUID) -> list[Stakeholder]:
        self._require_account(account_id)
        return self.repository.list_by_account(account_id)

    def get_stakeholder(self, stakeholder_id: uuid.UUID) -> Stakeholder:
        stakeholder = self.repository.get_by_id(stakeholder_id)
        if not stakeholder:
            raise NotFoundError(f"Stakeholder {stakeholder_id} not found")
        return stakeholder

    def create_stakeholder(
        self,
        account_id: uuid.UUID,
        data: StakeholderCreate,
        *,
        created_by: uuid.UUID,
    ) -> Stakeholder:
        stakeholder = Stakeholder(
            account_id=account_id,
            name=data.name,
            designation=data.designation,
            email=data.email,
            phone=data.phone,
            nps_score=data.nps_score,
            sentiment=data.sentiment,
            created_by=created_by,
            updated_by=created_by,
        )
        return self.repository.create(stakeholder)

    def update_stakeholder(
        self,
        stakeholder_id: uuid.UUID,
        data: StakeholderUpdate,
        *,
        updated_by: uuid.UUID,
    ) -> Stakeholder:
        stakeholder = self.repository.get_for_update(stakeholder_id)
        if not stakeholder:
            raise NotFoundError(f"Stakeholder {stakeholder_id} not found")
        updates = data.model_dump(exclude_unset=True)

        for field, value in updates.items():
            setattr(stakeholder, field, value)

        stakeholder.updated_by = updated_by
        return self.repository.update(stakeholder)
