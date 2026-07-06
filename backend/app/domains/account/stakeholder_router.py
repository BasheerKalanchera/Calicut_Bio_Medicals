import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.db.session import get_db
from app.domains.account.stakeholder_repository import StakeholderRepository
from app.domains.account.stakeholder_schemas import (
    StakeholderCreate,
    StakeholderResponse,
    StakeholderUpdate,
)
from app.domains.account.stakeholder_service import StakeholderService
from app.domains.organization.models import UserProfile

router = APIRouter(tags=["Stakeholders"])


def _get_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> StakeholderService:
    return StakeholderService(repository=StakeholderRepository(db))


@router.get("/accounts/{account_id}/stakeholders")
def list_stakeholders(
    account_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: StakeholderService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[StakeholderResponse]]:
    stakeholders = service.list_stakeholders(account_id)
    return APIResponse(
        data=[StakeholderResponse.model_validate(s) for s in stakeholders]
    )


@router.post("/accounts/{account_id}/stakeholders", status_code=201)
def create_stakeholder(
    account_id: uuid.UUID,
    body: StakeholderCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: StakeholderService = Depends(_get_service),  # noqa: B008
) -> APIResponse[StakeholderResponse]:
    stakeholder = service.create_stakeholder(
        account_id, body, created_by=current_user.id
    )
    return APIResponse(data=StakeholderResponse.model_validate(stakeholder))


@router.put("/stakeholders/{stakeholder_id}")
def update_stakeholder(
    stakeholder_id: uuid.UUID,
    body: StakeholderUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: StakeholderService = Depends(_get_service),  # noqa: B008
) -> APIResponse[StakeholderResponse]:
    stakeholder = service.update_stakeholder(
        stakeholder_id, body, updated_by=current_user.id
    )
    return APIResponse(data=StakeholderResponse.model_validate(stakeholder))
