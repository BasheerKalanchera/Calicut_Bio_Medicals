import enum
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse, PaginatedResponse
from app.db.base import ReferenceRepository
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.domains.organization.repository import UserRepository
from app.domains.organization.schemas import UserListResponse
from app.domains.organization.service import UserService
from app.domains.reference.models import (
    SBU,
    HoldReason,
    LeadSource,
    LossReason,
    OpportunityStage,
    OpportunityStatus,
    ProjectStatus,
    Zone,
)
from app.domains.reference.repository import OpportunityStageRepository
from app.domains.reference.schemas import (
    HoldReasonResponse,
    LeadSourceResponse,
    LossReasonResponse,
    OpportunityStageResponse,
    OpportunityStatusResponse,
    ProjectStatusResponse,
    SBUResponse,
    ZoneResponse,
)

router = APIRouter(tags=["Master Data & Identity"])


class MasterDataEntity(enum.StrEnum):
    STAGES = "stages"
    STATUSES = "statuses"
    PROJECT_STATUSES = "project-statuses"
    LEAD_SOURCES = "lead-sources"
    LOSS_REASONS = "loss-reasons"
    HOLD_REASONS = "hold-reasons"
    SBUS = "sbus"
    ZONES = "zones"


ENTITY_REGISTRY: dict[MasterDataEntity, tuple[type, type]] = {
    MasterDataEntity.STAGES: (OpportunityStage, OpportunityStageResponse),
    MasterDataEntity.STATUSES: (OpportunityStatus, OpportunityStatusResponse),
    MasterDataEntity.PROJECT_STATUSES: (ProjectStatus, ProjectStatusResponse),
    MasterDataEntity.LEAD_SOURCES: (LeadSource, LeadSourceResponse),
    MasterDataEntity.LOSS_REASONS: (LossReason, LossReasonResponse),
    MasterDataEntity.HOLD_REASONS: (HoldReason, HoldReasonResponse),
    MasterDataEntity.SBUS: (SBU, SBUResponse),
    MasterDataEntity.ZONES: (Zone, ZoneResponse),
}


def _fetch_entities(entity_name: MasterDataEntity, db: Session) -> list[Any]:
    if entity_name == MasterDataEntity.STAGES:
        return OpportunityStageRepository(db).list_active_ordered()

    model, _schema = ENTITY_REGISTRY[entity_name]
    return ReferenceRepository(model, db).list_active()


@router.get("/master-data/{entity_name}")
def list_master_data(
    entity_name: MasterDataEntity,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> APIResponse[list]:
    _model, schema = ENTITY_REGISTRY[entity_name]
    items = _fetch_entities(entity_name, db)
    return APIResponse(data=[schema.model_validate(item) for item in items])


# --- Users endpoint ---


def _get_user_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> UserService:
    return UserService(repository=UserRepository(db))


@router.get("/users")
def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: UserService = Depends(_get_user_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[UserListResponse]]:
    offset = (page - 1) * page_size
    users, total = service.list_active_users(offset=offset, limit=page_size)
    total_pages = (total + page_size - 1) // page_size

    return APIResponse(
        data=PaginatedResponse(
            items=[UserListResponse.model_validate(u) for u in users],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )
