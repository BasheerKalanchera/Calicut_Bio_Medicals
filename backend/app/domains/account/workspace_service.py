import uuid

from app.core.exceptions import NotFoundError
from app.domains.account.repository import AccountRepository
from app.domains.account.workspace_schemas import (
    WorkspaceAccount,
    WorkspaceInstalledAsset,
    WorkspaceProject,
    WorkspaceResponse,
    WorkspaceStakeholder,
)


class WorkspaceService:
    def __init__(self, repository: AccountRepository):
        self.repository = repository

    def get_workspace(self, account_id: uuid.UUID) -> WorkspaceResponse:
        account = self.repository.get_by_id(account_id)
        if not account:
            raise NotFoundError(f"Account {account_id} not found")

        return WorkspaceResponse(
            account=WorkspaceAccount.model_validate(account),
            stakeholders=[
                WorkspaceStakeholder.model_validate(s)
                for s in account.stakeholders
            ],
            projects=[
                WorkspaceProject.model_validate(p)
                for p in account.projects
            ],
            installed_assets=[
                WorkspaceInstalledAsset.model_validate(a)
                for a in account.installed_assets
            ],
        )
