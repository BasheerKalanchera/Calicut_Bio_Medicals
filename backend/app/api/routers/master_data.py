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
from app.domains.organization.schemas import UserBlastRadius, UserCreate, UserListResponse, UserUpdate
from app.domains.organization.service import UserService
from app.domains.reference.models import (
    SBU,
    GateOverrideReason,
    HoldReason,
    LeadSource,
    LossReason,
    OpportunityStage,
    OpportunityStatus,
    ProjectStatus,
    Role,
    Zone,
)
from app.domains.reference.repository import OpportunityStageRepository, ZoneRepository
from app.domains.reference.schemas import (
    GateOverrideReasonResponse,
    HoldReasonResponse,
    LeadSourceResponse,
    LossReasonResponse,
    OpportunityStageResponse,
    OpportunityStatusResponse,
    ProjectStatusResponse,
    RoleResponse,
    SBUResponse,
    ZoneResponse,
    ZoneSearchResult,
)

router = APIRouter(tags=["Master Data & Identity"])


class MasterDataEntity(enum.StrEnum):
    STAGES = "stages"
    STATUSES = "statuses"
    PROJECT_STATUSES = "project-statuses"
    LEAD_SOURCES = "lead-sources"
    LOSS_REASONS = "loss-reasons"
    HOLD_REASONS = "hold-reasons"
    GATE_OVERRIDE_REASONS = "gate-override-reasons"
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
    MasterDataEntity.GATE_OVERRIDE_REASONS: (GateOverrideReason, GateOverrideReasonResponse),
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


# Same role-gate shape as reference/service.py's _TERRITORY_ADMIN_ROLES and
# account/service.py's _ZONE_ASSIGNMENT_EXEMPT_ROLES -- each module keeps its
# own private copy rather than sharing one, per existing convention.
_TERRITORY_ADMIN_ROLES = {"Admin", "General Manager"}


# Sibling to /master-data/zones, not routed through ENTITY_REGISTRY -- needs
# custom trigram-similarity query + breadcrumb logic. Not admin-gated: every
# authenticated user uses zone pickers, not just Territory Admin.
@router.get("/master-data/zones/search")
def search_zones(
    q: str = Query(min_length=2),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> APIResponse[list[ZoneSearchResult]]:
    repo = ZoneRepository(db)
    zones = repo.search_by_name(q)
    return APIResponse(
        data=[ZoneSearchResult(id=z.id, name=z.name, path=repo.build_breadcrumb(z)) for z in zones]
    )


# Deliberately separate from search_zones above rather than a flag on it:
# every other zone picker in the app (Territory Admin, User Directory, etc.)
# needs the unrestricted search -- only Add/Edit Hospital should be scoped to
# the rep's own territory. Same role-gate shape as AccountService's
# _ZONE_ASSIGNMENT_EXEMPT_ROLES (account/service.py) -- Admin/GM get the
# unrestricted search, everyone else is scoped to their own zone_id + every
# zone under it. A rep with no zone_id gets no results at all, matching
# AccountService.create_account's hard block for the same case.
@router.get("/master-data/zones/search-for-hospital")
def search_zones_for_hospital(
    q: str = Query(min_length=2),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> APIResponse[list[ZoneSearchResult]]:
    repo = ZoneRepository(db)
    if current_user.role.role_name in _TERRITORY_ADMIN_ROLES:
        zones = repo.search_by_name(q)
    elif current_user.zone_id is None:
        zones = []
    else:
        zones = repo.search_by_name(q, within_zone_id=current_user.zone_id)
    return APIResponse(
        data=[ZoneSearchResult(id=z.id, name=z.name, path=repo.build_breadcrumb(z)) for z in zones]
    )


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
        is_active=user.is_active,
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
    include_inactive: bool = Query(default=False),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: UserService = Depends(_get_user_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[UserListResponse]]:
    offset = (page - 1) * page_size
    users, total = service.list_active_users(
        current_user, offset=offset, limit=page_size, scope=scope, include_inactive=include_inactive
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


@router.get("/users/{user_id}/blast-radius")
def get_user_blast_radius(
    user_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: UserService = Depends(_get_user_service),  # noqa: B008
) -> APIResponse[UserBlastRadius]:
    direct_report_count, open_opportunity_count = service.user_blast_radius(
        user_id, role_name=current_user.role.role_name
    )
    return APIResponse(
        data=UserBlastRadius(
            direct_report_count=direct_report_count, open_opportunity_count=open_opportunity_count
        )
    )


@router.post("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: UserService = Depends(_get_user_service),  # noqa: B008
) -> APIResponse[UserListResponse]:
    user = service.deactivate_user(user_id, role_name=current_user.role.role_name)
    return APIResponse(data=_to_user_list_response(user))


@router.post("/users/{user_id}/reactivate")
def reactivate_user(
    user_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: UserService = Depends(_get_user_service),  # noqa: B008
) -> APIResponse[UserListResponse]:
    user = service.reactivate_user(user_id, role_name=current_user.role.role_name)
    return APIResponse(data=_to_user_list_response(user))
