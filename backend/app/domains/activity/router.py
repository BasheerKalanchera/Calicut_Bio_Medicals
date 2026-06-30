import math
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse, PaginatedResponse
from app.db.session import get_db
from app.domains.activity.repository import ActivityRepository, ReminderRepository
from app.domains.activity.schemas import (
    ActivityCreate,
    ActivityResponse,
    ReminderCreate,
    ReminderResponse,
    ReminderUpdate,
)
from app.domains.activity.service import ActivityService, ReminderService
from app.domains.organization.models import UserProfile

router = APIRouter(tags=["Activities & Reminders"])


def _get_activity_service(db: Session = Depends(get_db)) -> ActivityService:  # noqa: B008
    return ActivityService(repository=ActivityRepository(db))


def _get_reminder_service(db: Session = Depends(get_db)) -> ReminderService:  # noqa: B008
    return ReminderService(repository=ReminderRepository(db))


# ------------------------------------------------------------------
# Activities
# ------------------------------------------------------------------

@router.get("/accounts/{account_id}/activities")
async def list_activities(
    account_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ActivityService = Depends(_get_activity_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[ActivityResponse]]:
    items, total = service.list_by_account(account_id, page=page, page_size=page_size)
    return APIResponse(
        data=PaginatedResponse(
            items=[ActivityResponse.model_validate(a) for a in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        )
    )


@router.get("/opportunities/{opportunity_id}/activities")
async def list_opportunity_activities(
    opportunity_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ActivityService = Depends(_get_activity_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[ActivityResponse]]:
    items, total = service.list_by_opportunity(opportunity_id, page=page, page_size=page_size)
    return APIResponse(
        data=PaginatedResponse(
            items=[ActivityResponse.model_validate(a) for a in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        )
    )


@router.post("/activities", status_code=201)
async def log_activity(
    body: ActivityCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ActivityService = Depends(_get_activity_service),  # noqa: B008
) -> APIResponse[ActivityResponse]:
    activity = service.log_activity(body, created_by=current_user.id)
    return APIResponse(data=ActivityResponse.model_validate(activity))


# ------------------------------------------------------------------
# Reminders
# ------------------------------------------------------------------

@router.get("/reminders")
async def list_reminders(
    include_completed: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ReminderService = Depends(_get_reminder_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[ReminderResponse]]:
    items, total = service.list_for_user(
        current_user.id,
        include_completed=include_completed,
        page=page,
        page_size=page_size,
    )
    return APIResponse(
        data=PaginatedResponse(
            items=[ReminderResponse.model_validate(r) for r in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        )
    )


@router.post("/reminders", status_code=201)
async def create_reminder(
    body: ReminderCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ReminderService = Depends(_get_reminder_service),  # noqa: B008
) -> APIResponse[ReminderResponse]:
    reminder = service.create_reminder(body, created_by=current_user.id)
    return APIResponse(data=ReminderResponse.model_validate(reminder))


@router.patch("/reminders/{reminder_id}")
async def patch_reminder(
    reminder_id: uuid.UUID,
    body: ReminderUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ReminderService = Depends(_get_reminder_service),  # noqa: B008
) -> APIResponse[ReminderResponse]:
    reminder = service.patch_reminder(reminder_id, body, updated_by=current_user.id)
    return APIResponse(data=ReminderResponse.model_validate(reminder))
