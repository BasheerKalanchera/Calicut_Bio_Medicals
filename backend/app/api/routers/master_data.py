import enum
import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse, PaginatedResponse
from app.db.base import ReferenceRepository
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.domains.organization.repository import UserRepository
from app.domains.organization.schemas import UserCreate, UserListResponse, UserUpdate
from app.domains.organization.service import UserService
from app.domains.reference.models import (
    SBU,
    HoldReason,
    LeadSource,
    LossReason,
    OpportunityStage,
    OpportunityStatus,
    ProjectStatus,
    Role,
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
    RoleResponse,
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
    ROLES = "roles"


ENTITY_REGISTRY: dict[MasterDataEntity, tuple[type, type]] = {
    MasterDataEntity.STAGES: (OpportunityStage, OpportunityStageResponse),
    MasterDataEntity.STATUSES: (OpportunityStatus, OpportunityStatusResponse),
    MasterDataEntity.PROJECT_STATUSES: (ProjectStatus, ProjectStatusResponse),
    MasterDataEntity.LEAD_SOURCES: (LeadSource, LeadSourceResponse),
    MasterDataEntity.LOSS_REASONS: (LossReason, LossReasonResponse),
    MasterDataEntity.HOLD_REASONS: (HoldReason, HoldReasonResponse),
    MasterDataEntity.SBUS: (SBU, SBUResponse),
    MasterDataEntity.ZONES: (Zone, ZoneResponse),
    MasterDataEntity.ROLES: (Role, RoleResponse),
}


def _fetch_entities(entity_name: MasterDataEntity, db: Session) -> list[Any]:
    if entity_name == MasterDataEntity.STAGES:
        return OpportunityStageRepository(db).list_active_ordered()
    if entity_name == MasterDataEntity.ROLES:
        # Role has no is_active column (unlike SBU/Zone/etc.) -- every role tier
        # is always selectable, so this can't reuse ReferenceRepository.list_active().
        return list(db.scalars(select(Role).order_by(Role.role_name)).all())

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


def _to_user_list_response(user: UserProfile) -> UserListResponse:
    # role_name isn't a plain column -- built manually rather than via
    # model_validate(from_attributes=True), same reason auth.py's /auth/me
    # constructs UserMeResponse by hand instead of validating the ORM object.
    return UserListResponse(
        id=user.id,
        display_name=user.display_name,
        sbu_id=user.sbu_id,
        zone_id=user.zone_id,
        zone_ids=[uz.zone_id for uz in user.zones],
        role_id=user.role_id,
        role_name=user.role.role_name,
        manager_id=user.manager_id,
    )


@router.get("/users")
def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    scope: str = Query(default="scoped", pattern="^(scoped|sbu|all)$"),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: UserService = Depends(_get_user_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[UserListResponse]]:
    offset = (page - 1) * page_size
    users, total = service.list_active_users(
        current_user, offset=offset, limit=page_size, scope=scope
    )
    total_pages = (total + page_size - 1) // page_size

    return APIResponse(
        data=PaginatedResponse(
            items=[_to_user_list_response(u) for u in users],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.post("/users", status_code=201)
def create_user(
    body: UserCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: UserService = Depends(_get_user_service),  # noqa: B008
) -> APIResponse[UserListResponse]:
    user = service.create_user(body, role_name=current_user.role.role_name)
    return APIResponse(data=_to_user_list_response(user))


@router.patch("/users/{user_id}")
def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: UserService = Depends(_get_user_service),  # noqa: B008
) -> APIResponse[UserListResponse]:
    user = service.update_user(user_id, body, role_name=current_user.role.role_name)
    return APIResponse(data=_to_user_list_response(user))
