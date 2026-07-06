import uuid

from app.core.exceptions import NotFoundError
from app.domains.activity.models import Activity, Reminder
from app.domains.activity.repository import ActivityRepository, ReminderRepository
from app.domains.activity.schemas import ActivityCreate, ReminderCreate, ReminderUpdate


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
        reminder = None
        if data.next_action_text and data.next_action_due_date:
            resolved_owner = data.next_action_owner_id or activity.user_id
            reminder = Reminder(
                activity_id=activity.id,
                assigned_to_user_id=resolved_owner,
                due_date=data.next_action_due_date,
                reminder_text=data.next_action_text,
                is_completed=False,
                created_by=created_by,
                updated_by=created_by,
            )
            reminder = self.reminder_repository.create(reminder)

        return activity, reminder


class ReminderService:
    def __init__(self, repository: ReminderRepository):
        self.repository = repository

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
        return self.repository.update(reminder)
