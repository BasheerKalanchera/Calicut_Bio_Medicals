import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse, PaginatedResponse
from app.db.session import get_db
from app.domains.account.repository import AccountRepository
from app.domains.account.schemas import (
    AccountCreate,
    AccountListResponse,
    AccountResponse,
    AccountUpdate,
)
from app.domains.account.service import AccountService
from app.domains.account.workspace_schemas import WorkspaceResponse
from app.domains.account.workspace_service import WorkspaceService
from app.domains.organization.models import UserProfile

router = APIRouter(prefix="/accounts", tags=["Accounts"])


def _get_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> AccountService:
    return AccountService(repository=AccountRepository(db))


def _get_workspace_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> WorkspaceService:
    return WorkspaceService(repository=AccountRepository(db))


@router.get("")
async def list_accounts(
    search: str | None = Query(None),
    zone_id: uuid.UUID | None = Query(None),  # noqa: B008
    sbu_id: uuid.UUID | None = Query(None),  # noqa: B008
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: AccountService = Depends(_get_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[AccountListResponse]]:
    offset = (page - 1) * page_size
    accounts, total = service.list_accounts(
        offset=offset,
        limit=page_size,
        search=search,
        zone_id=zone_id,
        sbu_id=sbu_id,
    )
    total_pages = (total + page_size - 1) // page_size

    return APIResponse(
        data=PaginatedResponse(
            items=[AccountListResponse.model_validate(a) for a in accounts],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.get("/{account_id}")
async def get_account(
    account_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: AccountService = Depends(_get_service),  # noqa: B008
) -> APIResponse[AccountResponse]:
    account = service.get_account(account_id)
    return APIResponse(data=AccountResponse.model_validate(account))


@router.post("", status_code=201)
async def create_account(
    body: AccountCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: AccountService = Depends(_get_service),  # noqa: B008
) -> APIResponse[AccountResponse]:
    account = service.create_account(body, created_by=current_user.id)
    return APIResponse(data=AccountResponse.model_validate(account))


@router.put("/{account_id}")
async def update_account(
    account_id: uuid.UUID,
    body: AccountUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: AccountService = Depends(_get_service),  # noqa: B008
) -> APIResponse[AccountResponse]:
    account = service.update_account(account_id, body, updated_by=current_user.id)
    return APIResponse(data=AccountResponse.model_validate(account))


@router.get("/{account_id}/workspace")
async def get_workspace(
    account_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: WorkspaceService = Depends(_get_workspace_service),  # noqa: B008
) -> APIResponse[WorkspaceResponse]:
    workspace = service.get_workspace(account_id)
    return APIResponse(data=workspace)
