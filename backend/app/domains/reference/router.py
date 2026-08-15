import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.domains.reference.models import Zone
from app.domains.reference.repository import ZoneRepository
from app.domains.reference.schemas import (
    ZoneAssignee,
    ZoneBlastRadius,
    ZoneCreate,
    ZoneNameMatch,
    ZoneTreeNode,
    ZoneUpdate,
)
from app.domains.reference.service import ZoneAdminService

router = APIRouter(tags=["Territory Admin"])


def _get_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> ZoneAdminService:
    return ZoneAdminService(repository=ZoneRepository(db))


def _build_zone_tree_node(zone: Zone) -> ZoneTreeNode:
    """Explicit builder, not ZoneTreeNode.model_validate(zone) -- assignees
    isn't a direct ORM attribute match (it's derived from zone.user_zones),
    so plain from_attributes validation can't produce it."""
    return ZoneTreeNode(
        id=zone.id,
        name=zone.name,
        zone_level=zone.zone_level,
        is_active=zone.is_active,
        children=[_build_zone_tree_node(child) for child in zone.children],
        assignees=[
            ZoneAssignee(id=uz.user.id, display_name=uz.user.display_name, role_name=uz.user.role.role_name)
            for uz in zone.user_zones
        ],
    )


@router.get("/admin/zones/tree")
def get_zone_tree(
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ZoneAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[ZoneTreeNode]]:
    zones = service.get_tree(role_name=current_user.role.role_name)
    return APIResponse(data=[_build_zone_tree_node(z) for z in zones])


@router.post("/admin/zones", status_code=201)
def create_zone(
    body: ZoneCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ZoneAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ZoneTreeNode]:
    zone = service.create_zone(body, role_name=current_user.role.role_name)
    return APIResponse(data=_build_zone_tree_node(zone))


@router.patch("/admin/zones/{zone_id}")
def update_zone(
    zone_id: uuid.UUID,
    body: ZoneUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ZoneAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ZoneTreeNode]:
    zone = service.update_zone(zone_id, body, role_name=current_user.role.role_name)
    return APIResponse(data=_build_zone_tree_node(zone))


@router.post("/admin/zones/{zone_id}/deprecate")
def deprecate_zone(
    zone_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ZoneAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ZoneTreeNode]:
    zone = service.deprecate_zone(zone_id, role_name=current_user.role.role_name)
    return APIResponse(data=_build_zone_tree_node(zone))


@router.get("/admin/zones/name-check")
def check_zone_name(
    name: str,
    parent_zone_id: uuid.UUID | None = None,
    exclude_id: uuid.UUID | None = None,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ZoneAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[ZoneNameMatch]]:
    matches = service.find_name_elsewhere(
        name, parent_zone_id=parent_zone_id, exclude_id=exclude_id, role_name=current_user.role.role_name
    )
    return APIResponse(
        data=[ZoneNameMatch(id=z.id, name=z.name, parent_name=z.parent.name if z.parent else None) for z in matches]
    )


@router.get("/admin/zones/{zone_id}/blast-radius")
def get_blast_radius(
    zone_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ZoneAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ZoneBlastRadius]:
    account_count, user_count = service.blast_radius(zone_id, role_name=current_user.role.role_name)
    return APIResponse(data=ZoneBlastRadius(account_count=account_count, user_count=user_count))


@router.post("/admin/zones/rebuild-closure", status_code=204)
def rebuild_closure(
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ZoneAdminService = Depends(_get_service),  # noqa: B008
) -> None:
    service.rebuild_all_closure(role_name=current_user.role.role_name)
