import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.domains.reference.repository import ZoneRepository
from app.domains.reference.schemas import ZoneBlastRadius, ZoneCreate, ZoneTreeNode, ZoneUpdate
from app.domains.reference.service import ZoneAdminService

router = APIRouter(tags=["Territory Admin"])


def _get_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> ZoneAdminService:
    return ZoneAdminService(repository=ZoneRepository(db))


@router.get("/admin/zones/tree")
def get_zone_tree(
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ZoneAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[ZoneTreeNode]]:
    zones = service.get_tree(role_name=current_user.role.role_name)
    return APIResponse(data=[ZoneTreeNode.model_validate(z) for z in zones])


@router.post("/admin/zones", status_code=201)
def create_zone(
    body: ZoneCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ZoneAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ZoneTreeNode]:
    zone = service.create_zone(body, role_name=current_user.role.role_name)
    return APIResponse(data=ZoneTreeNode.model_validate(zone))


@router.patch("/admin/zones/{zone_id}")
def update_zone(
    zone_id: uuid.UUID,
    body: ZoneUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ZoneAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ZoneTreeNode]:
    zone = service.update_zone(zone_id, body, role_name=current_user.role.role_name)
    return APIResponse(data=ZoneTreeNode.model_validate(zone))


@router.post("/admin/zones/{zone_id}/deprecate")
def deprecate_zone(
    zone_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ZoneAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ZoneTreeNode]:
    zone = service.deprecate_zone(zone_id, role_name=current_user.role.role_name)
    return APIResponse(data=ZoneTreeNode.model_validate(zone))


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
