import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.domains.account.models import Account
from app.domains.account.workspace_schemas import WorkspaceInstalledAsset
from app.domains.asset.models import InstalledAsset
from app.domains.organization.models import UserProfile

router = APIRouter(tags=["Assets"])


@router.get("/accounts/{account_id}/installed-assets")
async def list_installed_assets(
    account_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> APIResponse[list[WorkspaceInstalledAsset]]:
    if not db.get(Account, account_id):
        raise NotFoundError(f"Account {account_id} not found")
    assets = list(
        db.scalars(
            select(InstalledAsset)
            .where(InstalledAsset.account_id == account_id)
            .order_by(InstalledAsset.installation_date)
        ).all()
    )
    return APIResponse(data=[WorkspaceInstalledAsset.model_validate(a) for a in assets])
