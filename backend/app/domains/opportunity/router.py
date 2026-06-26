import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.db.session import get_db
from app.domains.account.workspace_schemas import WorkspaceOpportunity
from app.domains.opportunity.repository import OpportunityRepository
from app.domains.opportunity.schemas import (
    OpportunityCreate,
    OpportunityResponse,
    OpportunityUpdate,
)
from app.domains.opportunity.service import OpportunityService
from app.domains.organization.models import UserProfile

router = APIRouter(tags=["Opportunities"])


def _get_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> OpportunityService:
    return OpportunityService(repository=OpportunityRepository(db))


@router.get("/accounts/{account_id}/opportunities")
async def list_opportunities(
    account_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[WorkspaceOpportunity]]:
    opportunities = service.list_by_account(account_id)
    return APIResponse(data=[WorkspaceOpportunity.model_validate(o) for o in opportunities])


@router.post("/accounts/{account_id}/opportunities", status_code=201)
async def create_opportunity(
    account_id: uuid.UUID,
    body: OpportunityCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[OpportunityResponse]:
    opportunity = service.create_opportunity(
        account_id, body, created_by=current_user.id, sbu_id=current_user.sbu_id
    )
    return APIResponse(data=OpportunityResponse.model_validate(opportunity))


@router.put("/opportunities/{opportunity_id}")
async def update_opportunity(
    opportunity_id: uuid.UUID,
    body: OpportunityUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[OpportunityResponse]:
    opportunity = service.update_opportunity(
        opportunity_id, body, updated_by=current_user.id
    )
    return APIResponse(data=OpportunityResponse.model_validate(opportunity))
