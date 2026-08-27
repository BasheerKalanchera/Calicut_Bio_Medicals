import math
import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse, PaginatedResponse
from app.db.session import get_db
from app.domains.activity.repository import ActivityRepository, ReminderRepository
from app.domains.activity.schemas import (
    ActivityCreate,
    ActivityReportRow,
    ActivityResponse,
    OpportunityLookup,
    OpportunityNested,
    ReminderCreate,
    ReminderResponse,
    ReminderUpdate,
)
from app.domains.activity.service import ActivityService, ReminderService
from app.domains.organization.models import UserProfile

router = APIRouter(tags=["Activities & Reminders"])


def _get_activity_service(db: Session = Depends(get_db)) -> ActivityService:  # noqa: B008
    return ActivityService(
        repository=ActivityRepository(db),
        reminder_repository=ReminderRepository(db),
    )


def _get_reminder_service(db: Session = Depends(get_db)) -> ReminderService:  # noqa: B008
    return ReminderService(
        repository=ReminderRepository(db),
        activity_repository=ActivityRepository(db),
    )


# ------------------------------------------------------------------
# Activities
# ------------------------------------------------------------------

@router.get("/accounts/{account_id}/activities")
def list_activities(
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


@router.get("/accounts/{account_id}/opportunities/lookup")
def list_account_opportunities_lookup(
    account_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ActivityService = Depends(_get_activity_service),  # noqa: B008
) -> APIResponse[list[OpportunityLookup]]:
    # BR-ACT-10: deliberately unscoped by the caller's own SBU/zone tier --
    # see cabio_app_account_opportunities() and the schema's own docstring
    # for why this is a narrow, conscious exception, not a bug.
    items = service.list_account_opportunities_lookup(account_id)
    return APIResponse(data=[OpportunityLookup(id=i, name=n) for i, n in items])


@router.get("/opportunities/{opportunity_id}/activities")
def list_opportunity_activities(
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


@router.get("/projects/{project_id}/activities")
def list_project_activities(
    project_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ActivityService = Depends(_get_activity_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[ActivityResponse]]:
    items, total = service.list_by_project(project_id, page=page, page_size=page_size)
    return APIResponse(
        data=PaginatedResponse(
            items=[ActivityResponse.model_validate(a) for a in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        )
    )


@router.get("/activities")
def list_daily_activity_report(
    report_date: date = Query(...),
    user_id: uuid.UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ActivityService = Depends(_get_activity_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[ActivityReportRow]]:
    items, total = service.list_daily_report(
        current_user, report_date, user_id=user_id, page=page, page_size=page_size
    )
    rows = [ActivityReportRow.model_validate(a) for a in items]
    # BR-ACT-10: a cross-SBU Relationship Support logger's own row has
    # opportunity=None -- the nested relationship load goes through
    # Opportunity's own tier-visibility RLS, which they still fail, even on
    # their own logged activity. Not a leak to plug: they already saw and
    # picked this exact name from the "Related Opportunity" picker (same
    # unscoped lookup), so redisplaying it here reveals nothing new. One
    # lookup per distinct account among the affected rows, not per row.
    lookups_by_account: dict[uuid.UUID, list[tuple[uuid.UUID, str]]] = {}
    for row, activity in zip(rows, items, strict=True):
        if row.activity_type == "RELATIONSHIP_SUPPORT" and row.opportunity is None and activity.opportunity_id:
            if activity.account_id not in lookups_by_account:
                lookups_by_account[activity.account_id] = service.list_account_opportunities_lookup(
                    activity.account_id
                )
            match = next(
                (t for t in lookups_by_account[activity.account_id] if t[0] == activity.opportunity_id), None
            )
            if match:
                row.opportunity = OpportunityNested(id=match[0], name=match[1])
    return APIResponse(
        data=PaginatedResponse(
            items=rows,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        )
    )


@router.post("/activities", status_code=201)
def log_activity(
    body: ActivityCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ActivityService = Depends(_get_activity_service),  # noqa: B008
) -> APIResponse[ActivityResponse]:
    activity, reminder = service.log_activity(body, created_by=current_user.id)
    response = ActivityResponse.model_validate(activity)
    response.next_action_reminder_id = reminder.id if reminder else None
    return APIResponse(data=response)


# ------------------------------------------------------------------
# Reminders
# ------------------------------------------------------------------

@router.get("/reminders")
def list_reminders(
    include_completed: bool = Query(False),
    due_after: datetime | None = Query(None),
    due_before: datetime | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ReminderService = Depends(_get_reminder_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[ReminderResponse]]:
    items, total = service.list_for_user(
        current_user.id,
        include_completed=include_completed,
        due_after=due_after,
        due_before=due_before,
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


@router.get("/opportunities/{opportunity_id}/reminders")
def list_opportunity_reminders(
    opportunity_id: uuid.UUID,
    include_completed: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ReminderService = Depends(_get_reminder_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[ReminderResponse]]:
    items, total = service.list_for_opportunity(
        opportunity_id,
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
def create_reminder(
    body: ReminderCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ReminderService = Depends(_get_reminder_service),  # noqa: B008
) -> APIResponse[ReminderResponse]:
    reminder = service.create_reminder(body, created_by=current_user.id)
    return APIResponse(data=ReminderResponse.model_validate(reminder))


@router.patch("/reminders/{reminder_id}")
def patch_reminder(
    reminder_id: uuid.UUID,
    body: ReminderUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ReminderService = Depends(_get_reminder_service),  # noqa: B008
) -> APIResponse[ReminderResponse]:
    reminder = service.patch_reminder(reminder_id, body, updated_by=current_user.id)
    return APIResponse(data=ReminderResponse.model_validate(reminder))
