from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.db.session import get_db
from app.domains.notification.repository import NotificationRepository, NotificationRow
from app.domains.notification.schemas import (
    ActorNested,
    MarkReadRequest,
    NotificationResponse,
    UnreadCountResponse,
)
from app.domains.notification.service import NotificationService
from app.domains.organization.models import UserProfile

router = APIRouter(tags=["Notifications"])


def _get_service(db: Session = Depends(get_db)) -> NotificationService:  # noqa: B008
    return NotificationService(repository=NotificationRepository(db))


def _to_response(row: NotificationRow) -> NotificationResponse:
    notification, opportunity_name, account_name, account_id, opportunity_id = row
    return NotificationResponse(
        id=notification.id,
        type=notification.type,
        entity_type=notification.entity_type,
        entity_id=notification.entity_id,
        is_urgent=notification.is_urgent,
        created_at=notification.created_at,
        read_at=notification.read_at,
        actor=ActorNested.model_validate(notification.actor),
        opportunity_name=opportunity_name,
        account_name=account_name,
        account_id=account_id,
        opportunity_id=opportunity_id,
    )


@router.get("/notifications")
def list_notifications(
    limit: int = Query(20, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: NotificationService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[NotificationResponse]]:
    rows = service.list_for_user(current_user.id, limit=limit)
    return APIResponse(data=[_to_response(r) for r in rows])


@router.get("/notifications/unread-count")
def get_unread_count(
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: NotificationService = Depends(_get_service),  # noqa: B008
) -> APIResponse[UnreadCountResponse]:
    unread_count, urgent_unread_count = service.count_unread(current_user.id)
    return APIResponse(
        data=UnreadCountResponse(unread_count=unread_count, urgent_unread_count=urgent_unread_count)
    )


@router.get("/notifications/urgent-unread")
def list_urgent_unread(
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: NotificationService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[NotificationResponse]]:
    rows = service.list_urgent_unread(current_user.id)
    return APIResponse(data=[_to_response(r) for r in rows])


@router.post("/notifications/mark-read", status_code=204)
def mark_read(
    body: MarkReadRequest,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: NotificationService = Depends(_get_service),  # noqa: B008
) -> None:
    # For entity types with their own detail GET route (opportunity), that
    # route's own read-receipt side effect is preferred over calling this --
    # this endpoint exists for entity_type == "activity" (MANAGER_NOTE_ADDED),
    # which has no such route to piggyback on.
    service.mark_read_for_entity(current_user.id, body.entity_type, body.entity_id)
