import math
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse, PaginatedResponse
from app.db.session import get_db
from app.domains.account.workspace_schemas import WorkspaceOpportunity
from app.domains.opportunity.repository import OpportunityRepository
from app.domains.opportunity.schemas import (
    ItemsBulkUpdate,
    OpportunityCreate,
    OpportunityForStakeholder,
    OpportunityItemCreate,
    OpportunityItemResponse,
    OpportunityResponse,
    OpportunityUpdate,
    PipelineOpportunity,
    SplitResponse,
    SplitsBulkUpdate,
    StakeholderLinkCreate,
    StakeholderLinkResponse,
    StakeholderLinkUpdate,
    StakeholderOpportunityCountsEntry,
    StakeholdersBulkUpdate,
)
from app.domains.opportunity.service import OpportunityService
from app.domains.organization.models import UserProfile

router = APIRouter(tags=["Opportunities"])


def _get_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> OpportunityService:
    return OpportunityService(repository=OpportunityRepository(db))


# ------------------------------------------------------------------
# Pipeline (serves both Kanban and List views)
# ------------------------------------------------------------------

@router.get("/opportunities/pipeline")
def list_pipeline(
    account_id: uuid.UUID | None = Query(None),
    stage_id: uuid.UUID | None = Query(None),
    status_id: uuid.UUID | None = Query(None),
    owner_id: uuid.UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[PipelineOpportunity]]:
    items, total = service.list_pipeline(
        account_id=account_id,
        stage_id=stage_id,
        status_id=status_id,
        owner_id=owner_id,
        page=page,
        page_size=page_size,
    )
    return APIResponse(
        data=PaginatedResponse(
            items=[PipelineOpportunity.model_validate(o) for o in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        )
    )


# ------------------------------------------------------------------
# Account-scoped list (Customer 360 opportunities tab)
# ------------------------------------------------------------------

@router.get("/accounts/{account_id}/opportunities")
def list_opportunities(
    account_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[WorkspaceOpportunity]]:
    opportunities = service.list_by_account(account_id)
    return APIResponse(data=[WorkspaceOpportunity.model_validate(o) for o in opportunities])


# ------------------------------------------------------------------
# Create
# ------------------------------------------------------------------

@router.post("/accounts/{account_id}/opportunities", status_code=201)
def create_opportunity(
    account_id: uuid.UUID,
    body: OpportunityCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[OpportunityResponse]:
    opportunity = service.create_opportunity(
        account_id, body, created_by=current_user.id, sbu_id=current_user.sbu_id
    )
    return APIResponse(data=OpportunityResponse.model_validate(opportunity))


# ------------------------------------------------------------------
# Get single opportunity (opens Opportunity Detail from an entry point
# that only has an id — e.g. Reminder click-through)
# ------------------------------------------------------------------

@router.get("/opportunities/{opportunity_id}")
def get_opportunity(
    opportunity_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[PipelineOpportunity]:
    opportunity = service.get_opportunity(opportunity_id)
    return APIResponse(data=PipelineOpportunity.model_validate(opportunity))


# ------------------------------------------------------------------
# Update (PATCH — only provided fields are changed)
# ------------------------------------------------------------------

@router.patch("/opportunities/{opportunity_id}")
def update_opportunity(
    opportunity_id: uuid.UUID,
    body: OpportunityUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[OpportunityResponse]:
    opportunity = service.update_opportunity(
        opportunity_id, body, updated_by=current_user.id
    )
    return APIResponse(data=OpportunityResponse.model_validate(opportunity))


# ------------------------------------------------------------------
# Items
# ------------------------------------------------------------------

@router.get("/opportunities/{opportunity_id}/items")
def list_opportunity_items(
    opportunity_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[OpportunityItemResponse]]:
    items = service.list_items(opportunity_id)
    return APIResponse(data=[OpportunityItemResponse.model_validate(i) for i in items])


@router.put("/opportunities/{opportunity_id}/items")
def replace_opportunity_items(
    opportunity_id: uuid.UUID,
    body: ItemsBulkUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[OpportunityItemResponse]]:
    items = service.replace_items(opportunity_id, body, updated_by=current_user.id)
    return APIResponse(data=[OpportunityItemResponse.model_validate(i) for i in items])


@router.post("/opportunities/{opportunity_id}/items", status_code=201)
def add_opportunity_item(
    opportunity_id: uuid.UUID,
    body: OpportunityItemCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[OpportunityItemResponse]:
    item = service.add_item(opportunity_id, body, created_by=current_user.id)
    return APIResponse(data=OpportunityItemResponse.model_validate(item))


@router.delete("/opportunity-items/{item_id}", status_code=204)
def delete_opportunity_item(
    item_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> None:
    service.delete_item(item_id)


# ------------------------------------------------------------------
# Splits
# ------------------------------------------------------------------

@router.get("/opportunities/{opportunity_id}/splits")
def list_splits(
    opportunity_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[SplitResponse]]:
    splits = service.list_splits(opportunity_id)
    return APIResponse(data=[SplitResponse.model_validate(s) for s in splits])


@router.put("/opportunities/{opportunity_id}/splits")
def replace_splits(
    opportunity_id: uuid.UUID,
    body: SplitsBulkUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[SplitResponse]]:
    splits = service.replace_splits(opportunity_id, body, updated_by=current_user.id)
    return APIResponse(data=[SplitResponse.model_validate(s) for s in splits])


# ------------------------------------------------------------------
# Stakeholders on opportunity
# ------------------------------------------------------------------

@router.get("/opportunities/{opportunity_id}/stakeholders")
def list_opportunity_stakeholders(
    opportunity_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[StakeholderLinkResponse]]:
    links = service.list_stakeholders(opportunity_id)
    return APIResponse(data=[StakeholderLinkResponse.model_validate(lnk) for lnk in links])


@router.put("/opportunities/{opportunity_id}/stakeholders")
# Do not wire a new frontend caller to this endpoint: it deletes and
# reinserts every link on every call, stamping a fresh created_at/created_by
# on already-linked stakeholders each time — audit-trail corruption for any
# partial-update use case. Use the single-item POST/PATCH/DELETE endpoints
# below instead; this bulk endpoint has no current caller (see repository.py
# replace_stakeholders).
def replace_opportunity_stakeholders(
    opportunity_id: uuid.UUID,
    body: StakeholdersBulkUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[StakeholderLinkResponse]]:
    links = service.replace_stakeholders(opportunity_id, body, updated_by=current_user.id)
    return APIResponse(data=[StakeholderLinkResponse.model_validate(lnk) for lnk in links])


@router.post("/opportunities/{opportunity_id}/stakeholders", status_code=201)
def add_opportunity_stakeholder(
    opportunity_id: uuid.UUID,
    body: StakeholderLinkCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[StakeholderLinkResponse]:
    link = service.add_stakeholder(opportunity_id, body, created_by=current_user.id)
    return APIResponse(data=StakeholderLinkResponse.model_validate(link))


@router.delete("/opportunities/{opportunity_id}/stakeholders/{stakeholder_id}", status_code=204)
def remove_opportunity_stakeholder(
    opportunity_id: uuid.UUID,
    stakeholder_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> None:
    service.remove_stakeholder(opportunity_id, stakeholder_id)


@router.patch("/opportunities/{opportunity_id}/stakeholders/{stakeholder_id}")
def update_opportunity_stakeholder(
    opportunity_id: uuid.UUID,
    stakeholder_id: uuid.UUID,
    body: StakeholderLinkUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[StakeholderLinkResponse]:
    link = service.update_stakeholder(opportunity_id, stakeholder_id, body, updated_by=current_user.id)
    return APIResponse(data=StakeholderLinkResponse.model_validate(link))


# ------------------------------------------------------------------
# Stakeholder -> opportunities (reverse linkage, Customer 360 bridge list)
# ------------------------------------------------------------------

@router.get("/stakeholders/counts")
def get_stakeholder_opportunity_counts(
    ids: str = Query(..., description="Comma-separated stakeholder UUIDs"),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[dict[str, StakeholderOpportunityCountsEntry]]:
    stakeholder_ids = [uuid.UUID(i.strip()) for i in ids.split(",") if i.strip()]
    counts = service.get_opportunity_counts_for_stakeholders(stakeholder_ids)
    return APIResponse(
        data={
            str(sid): StakeholderOpportunityCountsEntry(opportunity_count=counts.get(sid, 0))
            for sid in stakeholder_ids
        }
    )


@router.get("/stakeholders/{stakeholder_id}/opportunities")
def list_opportunities_for_stakeholder(
    stakeholder_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: OpportunityService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[OpportunityForStakeholder]]:
    opportunities = service.list_opportunities_for_stakeholder(stakeholder_id)
    return APIResponse(data=[OpportunityForStakeholder.model_validate(o) for o in opportunities])
