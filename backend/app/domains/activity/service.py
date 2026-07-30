import uuid
from datetime import datetime

from app.core.exceptions import NotFoundError
from app.domains.activity.models import Activity, Reminder
from app.domains.activity.repository import ActivityRepository, ReminderRepository
from app.domains.activity.schemas import ActivityCreate, ReminderCreate, ReminderUpdate


def _maybe_create_next_action_reminder(
    reminder_repository: ReminderRepository,
    *,
    activity: Activity,
    next_action_text: str | None,
    next_action_due_date: datetime | None,
    next_action_owner_id: uuid.UUID | None,
    created_by: uuid.UUID,
) -> Reminder | None:
    # BR-ACT-04: shared by ActivityService.log_activity (mandatory unless
    # MANAGER_NOTE) and ReminderService.patch_reminder (optional follow-up
    # when closing a reminder, BR-ACT-05) -- same "given an Activity, maybe
    # attach a Reminder" logic either way.
    if not (next_action_text and next_action_due_date):
        return None
    resolved_owner = next_action_owner_id or activity.user_id
    reminder = Reminder(
        activity_id=activity.id,
        assigned_to_user_id=resolved_owner,
        due_date=next_action_due_date,
        reminder_text=next_action_text,
        is_completed=False,
        created_by=created_by,
        updated_by=created_by,
    )
    return reminder_repository.create(reminder)


class ActivityService:
    def __init__(self, repository: ActivityRepository, reminder_repository: ReminderRepository):
        self.repository = repository
        self.reminder_repository = reminder_repository

    def list_by_account(
        self,
        account_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Activity], int]:
        if not self.repository.account_exists(account_id):
            raise NotFoundError(f"Account {account_id} not found")
        offset = (page - 1) * page_size
        items = self.repository.list_by_account(account_id, offset=offset, limit=page_size)
        # No separate COUNT round-trip here (unlike list_by_opportunity below) — the
        # authoritative total now comes for free from AccountDetailResponse.activity_count
        # (account/repository.py's get_account_with_counts), computed alongside the
        # account's other counts in one query. This total is a lower bound only, used
        # by callers that don't have the account response on hand.
        total = offset + len(items)
        return items, total

    def list_by_opportunity(
        self,
        opportunity_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Activity], int]:
        if not self.repository.opportunity_exists(opportunity_id):
            raise NotFoundError(f"Opportunity {opportunity_id} not found")
        offset = (page - 1) * page_size
        items = self.repository.list_by_opportunity(opportunity_id, offset=offset, limit=page_size)
        total = self.repository.count_by_opportunity(opportunity_id)
        return items, total

    def list_by_project(
        self,
        project_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Activity], int]:
        if not self.repository.project_exists(project_id):
            raise NotFoundError(f"Project {project_id} not found")
        offset = (page - 1) * page_size
        items = self.repository.list_by_project(project_id, offset=offset, limit=page_size)
        total = self.repository.count_by_project(project_id)
        return items, total

    def log_activity(
        self,
        data: ActivityCreate,
        *,
        created_by: uuid.UUID,
    ) -> tuple[Activity, Reminder | None]:
        # BR-ACT-01: account must exist
        if not self.repository.account_exists(data.account_id):
            raise NotFoundError(f"Account {data.account_id} not found")

        if data.opportunity_id and not self.repository.opportunity_exists(data.opportunity_id):
            raise NotFoundError(f"Opportunity {data.opportunity_id} not found")

        activity = Activity(
            account_id=data.account_id,
            opportunity_id=data.opportunity_id,
            project_id=data.project_id,
            user_id=data.user_id if data.user_id is not None else created_by,
            activity_type=data.activity_type,
            activity_date=data.activity_date,
            notes=data.notes,
            created_by=created_by,
        )
        activity = self.repository.create(activity)

        # BR-ACT-04: next-action fields are absent only for MANAGER_NOTE
        # (schema validator enforces this) - no Reminder for those.
        reminder = _maybe_create_next_action_reminder(
            self.reminder_repository,
            activity=activity,
            next_action_text=data.next_action_text,
            next_action_due_date=data.next_action_due_date,
            next_action_owner_id=data.next_action_owner_id,
            created_by=created_by,
        )

        return activity, reminder


class ReminderService:
    def __init__(self, repository: ReminderRepository, activity_repository: ActivityRepository):
        self.repository = repository
        self.activity_repository = activity_repository

    def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        include_completed: bool = False,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Reminder], int]:
        offset = (page - 1) * page_size
        items = self.repository.list_for_user(
            user_id,
            include_completed=include_completed,
            offset=offset,
            limit=page_size,
        )
        total = self.repository.count_for_user(user_id, include_completed=include_completed)
        return items, total

    def list_for_opportunity(
        self,
        opportunity_id: uuid.UUID,
        *,
        include_completed: bool = False,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Reminder], int]:
        if not self.repository.opportunity_exists(opportunity_id):
            raise NotFoundError(f"Opportunity {opportunity_id} not found")
        offset = (page - 1) * page_size
        items = self.repository.list_by_opportunity(
            opportunity_id,
            include_completed=include_completed,
            offset=offset,
            limit=page_size,
        )
        total = self.repository.count_by_opportunity(opportunity_id, include_completed=include_completed)
        return items, total

    def create_reminder(
        self,
        data: ReminderCreate,
        *,
        created_by: uuid.UUID,
    ) -> Reminder:
        if not self.repository.activity_exists(data.activity_id):
            raise NotFoundError(f"Activity {data.activity_id} not found")

        reminder = Reminder(
            activity_id=data.activity_id,
            assigned_to_user_id=data.assigned_to_user_id,
            due_date=data.due_date,
            reminder_text=data.reminder_text,
            is_completed=False,
            created_by=created_by,
            updated_by=created_by,
        )
        return self.repository.create(reminder)

    def patch_reminder(
        self,
        reminder_id: uuid.UUID,
        data: ReminderUpdate,
        *,
        updated_by: uuid.UUID,
    ) -> Reminder:
        reminder = self.repository.get_by_id(reminder_id)
        if not reminder:
            raise NotFoundError(f"Reminder {reminder_id} not found")

        reminder.is_completed = data.is_completed
        reminder.updated_by = updated_by

        # BR-ACT-05: completing a reminder requires documenting what was done
        # -- the schema validator guarantees activity_type/activity_date/notes
        # are all present whenever is_completed=True. The closing Activity
        # inherits its account/opportunity/project context from the
        # reminder's own (creating) activity, since it's the same
        # customer/deal thread; the loop mirrors BR-ACT-04 in reverse
        # (Activity -> mandatory Reminder becomes Reminder completion ->
        # mandatory Activity), both created atomically with the state change
        # they accompany.
        if data.is_completed:
            original = reminder.activity
            closing_activity = Activity(
                account_id=original.account_id,
                opportunity_id=original.opportunity_id,
                project_id=original.project_id,
                user_id=updated_by,
                activity_type=data.activity_type,
                activity_date=data.activity_date,
                notes=data.notes,
                created_by=updated_by,
            )
            closing_activity = self.activity_repository.create(closing_activity)
            reminder.closing_activity_id = closing_activity.id

            # Optional follow-up discovered while closing this one out --
            # same BR-ACT-04 mechanism as any other Activity, just optional
            # here rather than mandatory (not every closure needs a new
            # task). Linked to the closing Activity, not the original one,
            # since it's a fresh commitment made now, not part of the
            # original interaction.
            _maybe_create_next_action_reminder(
                self.repository,
                activity=closing_activity,
                next_action_text=data.next_action_text,
                next_action_due_date=data.next_action_due_date,
                next_action_owner_id=data.next_action_owner_id,
                created_by=updated_by,
            )

        return self.repository.update(reminder)
