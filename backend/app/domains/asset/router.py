import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.db.session import get_db
from app.domains.account.workspace_schemas import WorkspaceInstalledAsset
from app.domains.asset.repository import InstalledAssetRepository
from app.domains.asset.schemas import InstalledAssetCreate, InstalledAssetResponse, InstalledAssetUpdate
from app.domains.asset.service import InstalledAssetService
from app.domains.organization.models import UserProfile

router = APIRouter(tags=["Assets"])


def _get_service(db: Session = Depends(get_db)) -> InstalledAssetService:  # noqa: B008
    return InstalledAssetService(repository=InstalledAssetRepository(db))


@router.get("/accounts/{account_id}/installed-assets")
async def list_installed_assets(
    account_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: InstalledAssetService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[WorkspaceInstalledAsset]]:
    assets = service.list_by_account(account_id)
    return APIResponse(data=[WorkspaceInstalledAsset.model_validate(a) for a in assets])


@router.post("/accounts/{account_id}/installed-assets", status_code=201)
async def create_installed_asset(
    account_id: uuid.UUID,
    body: InstalledAssetCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: InstalledAssetService = Depends(_get_service),  # noqa: B008
) -> APIResponse[InstalledAssetResponse]:
    asset = service.create_installed_asset(account_id, body, created_by=current_user.id)
    return APIResponse(data=InstalledAssetResponse.model_validate(asset))


@router.put("/installed-assets/{asset_id}")
async def update_installed_asset(
    asset_id: uuid.UUID,
    body: InstalledAssetUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: InstalledAssetService = Depends(_get_service),  # noqa: B008
) -> APIResponse[InstalledAssetResponse]:
    asset = service.update_installed_asset(asset_id, body, updated_by=current_user.id)
    return APIResponse(data=InstalledAssetResponse.model_validate(asset))
