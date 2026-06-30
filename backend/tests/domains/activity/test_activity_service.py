"""
Unit tests for ActivityService and ReminderService.

Repository is fully mocked — no DB required. Tests cover:
  - ActivityService.list_by_account: NotFoundError on missing account, pagination
  - ActivityService.log_activity: BR-ACT-01 (account exists), opportunity validation,
    user_id defaults to created_by when omitted
  - ReminderService.list_for_user: include_completed filter, pagination
  - ReminderService.create_reminder: NotFoundError on missing activity
  - ReminderService.patch_reminder: NotFoundError on missing reminder, is_completed toggle
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import NotFoundError
from app.domains.activity.models import Activity, Reminder
from app.domains.activity.repository import ActivityRepository, ReminderRepository
from app.domains.activity.schemas import ActivityCreate, ReminderCreate, ReminderUpdate
from app.domains.activity.service import ActivityService, ReminderService

# ---------------------------------------------------------------------------
# Shared test data
# ---------------------------------------------------------------------------

ACCOUNT_ID = uuid.uuid4()
OPP_ID = uuid.uuid4()
PROJECT_ID = uuid.uuid4()
USER_ID = uuid.uuid4()
ACTOR_ID = uuid.uuid4()
ACTIVITY_ID = uuid.uuid4()
REMINDER_ID = uuid.uuid4()
NOW = datetime(2026, 6, 30, 9, 0, 0, tzinfo=timezone.utc)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_activity_repo() -> MagicMock:
    repo = MagicMock(spec=ActivityRepository)
    repo.account_exists.return_value = True
    repo.opportunity_exists.return_value = True
    repo.list_by_account.return_value = []
    repo.count_by_account.return_value = 0
    return repo


def _make_reminder_repo() -> MagicMock:
    repo = MagicMock(spec=ReminderRepository)
    repo.activity_exists.return_value = True
    repo.list_for_user.return_value = []
    repo.count_for_user.return_value = 0
    return repo


def _make_activity(**overrides) -> Activity:
    a = MagicMock(spec=Activity)
    a.id = overrides.get("id", ACTIVITY_ID)
    a.account_id = overrides.get("account_id", ACCOUNT_ID)
    a.opportunity_id = overrides.get("opportunity_id", None)
    a.project_id = overrides.get("project_id", None)
    a.user_id = overrides.get("user_id", USER_ID)
    a.activity_type = overrides.get("activity_type", "VISIT")
    a.activity_date = overrides.get("activity_date", NOW)
    a.notes = overrides.get("notes", None)
    a.created_at = NOW
    return a


def _make_reminder(**overrides) -> Reminder:
    r = MagicMock(spec=Reminder)
    r.id = overrides.get("id", REMINDER_ID)
    r.activity_id = overrides.get("activity_id", ACTIVITY_ID)
    r.assigned_to_user_id = overrides.get("assigned_to_user_id", USER_ID)
    r.due_date = overrides.get("due_date", NOW)
    r.reminder_text = overrides.get("reminder_text", "Follow up")
    r.is_completed = overrides.get("is_completed", False)
    r.created_at = NOW
    r.updated_at = NOW
    return r


# ---------------------------------------------------------------------------
# ActivityService.list_by_account
# ---------------------------------------------------------------------------

class TestListByAccount:
    def test_raises_not_found_when_account_missing(self):
        repo = _make_activity_repo()
        repo.account_exists.return_value = False
        svc = ActivityService(repository=repo)

        with pytest.raises(NotFoundError):
            svc.list_by_account(ACCOUNT_ID, page=1, page_size=50)

    def test_returns_items_and_total(self):
        repo = _make_activity_repo()
        activities = [_make_activity(), _make_activity(id=uuid.uuid4())]
        repo.list_by_account.return_value = activities
        repo.count_by_account.return_value = 2
        svc = ActivityService(repository=repo)

        items, total = svc.list_by_account(ACCOUNT_ID, page=1, page_size=50)

        assert items == activities
        assert total == 2

    def test_calculates_offset_from_page(self):
        repo = _make_activity_repo()
        repo.count_by_account.return_value = 0
        svc = ActivityService(repository=repo)

        svc.list_by_account(ACCOUNT_ID, page=3, page_size=20)

        repo.list_by_account.assert_called_once_with(ACCOUNT_ID, offset=40, limit=20)

    def test_page_1_has_zero_offset(self):
        repo = _make_activity_repo()
        svc = ActivityService(repository=repo)

        svc.list_by_account(ACCOUNT_ID, page=1, page_size=10)

        repo.list_by_account.assert_called_once_with(ACCOUNT_ID, offset=0, limit=10)


# ---------------------------------------------------------------------------
# ActivityService.log_activity
# ---------------------------------------------------------------------------

class TestLogActivity:
    def _data(self, **overrides) -> ActivityCreate:
        defaults = dict(
            account_id=ACCOUNT_ID,
            opportunity_id=None,
            project_id=None,
            user_id=None,
            activity_type="VISIT",
            activity_date=NOW,
            notes=None,
        )
        defaults.update(overrides)
        return ActivityCreate(**defaults)

    def test_raises_not_found_when_account_missing(self):
        repo = _make_activity_repo()
        repo.account_exists.return_value = False
        svc = ActivityService(repository=repo)

        with pytest.raises(NotFoundError):
            svc.log_activity(self._data(), created_by=ACTOR_ID)

    def test_raises_not_found_when_opportunity_missing(self):
        repo = _make_activity_repo()
        repo.opportunity_exists.return_value = False
        svc = ActivityService(repository=repo)

        with pytest.raises(NotFoundError):
            svc.log_activity(self._data(opportunity_id=OPP_ID), created_by=ACTOR_ID)

    def test_opportunity_not_checked_when_omitted(self):
        repo = _make_activity_repo()
        repo.create.return_value = _make_activity()
        svc = ActivityService(repository=repo)

        svc.log_activity(self._data(opportunity_id=None), created_by=ACTOR_ID)

        repo.opportunity_exists.assert_not_called()

    def test_user_id_defaults_to_created_by_when_not_provided(self):
        repo = _make_activity_repo()
        created_activity = _make_activity(user_id=ACTOR_ID)
        repo.create.return_value = created_activity
        svc = ActivityService(repository=repo)

        svc.log_activity(self._data(user_id=None), created_by=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.user_id == ACTOR_ID

    def test_explicit_user_id_used_when_provided(self):
        repo = _make_activity_repo()
        explicit_user = uuid.uuid4()
        repo.create.return_value = _make_activity(user_id=explicit_user)
        svc = ActivityService(repository=repo)

        svc.log_activity(self._data(user_id=explicit_user), created_by=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.user_id == explicit_user

    def test_created_by_set_on_activity(self):
        repo = _make_activity_repo()
        repo.create.return_value = _make_activity()
        svc = ActivityService(repository=repo)

        svc.log_activity(self._data(), created_by=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.created_by == ACTOR_ID

    def test_all_fields_passed_through(self):
        repo = _make_activity_repo()
        repo.create.return_value = _make_activity()
        svc = ActivityService(repository=repo)

        svc.log_activity(
            self._data(
                opportunity_id=OPP_ID,
                project_id=PROJECT_ID,
                activity_type="EMAIL",
                notes="Met the doctor",
            ),
            created_by=ACTOR_ID,
        )

        call_args = repo.create.call_args[0][0]
        assert call_args.opportunity_id == OPP_ID
        assert call_args.project_id == PROJECT_ID
        assert call_args.activity_type == "EMAIL"
        assert call_args.notes == "Met the doctor"

    def test_returns_activity_from_repo(self):
        repo = _make_activity_repo()
        activity = _make_activity()
        repo.create.return_value = activity
        svc = ActivityService(repository=repo)

        result = svc.log_activity(self._data(), created_by=ACTOR_ID)

        assert result is activity


# ---------------------------------------------------------------------------
# ReminderService.list_for_user
# ---------------------------------------------------------------------------

class TestListForUser:
    def test_returns_items_and_total(self):
        repo = _make_reminder_repo()
        reminders = [_make_reminder()]
        repo.list_for_user.return_value = reminders
        repo.count_for_user.return_value = 1
        svc = ReminderService(repository=repo)

        items, total = svc.list_for_user(USER_ID, page=1, page_size=50)

        assert items == reminders
        assert total == 1

    def test_include_completed_false_by_default(self):
        repo = _make_reminder_repo()
        svc = ReminderService(repository=repo)

        svc.list_for_user(USER_ID, page=1, page_size=50)

        repo.list_for_user.assert_called_once_with(
            USER_ID, include_completed=False, offset=0, limit=50
        )
        repo.count_for_user.assert_called_once_with(USER_ID, include_completed=False)

    def test_include_completed_true_forwarded(self):
        repo = _make_reminder_repo()
        svc = ReminderService(repository=repo)

        svc.list_for_user(USER_ID, include_completed=True, page=1, page_size=50)

        repo.list_for_user.assert_called_once_with(
            USER_ID, include_completed=True, offset=0, limit=50
        )
        repo.count_for_user.assert_called_once_with(USER_ID, include_completed=True)

    def test_offset_calculated_from_page(self):
        repo = _make_reminder_repo()
        svc = ReminderService(repository=repo)

        svc.list_for_user(USER_ID, page=2, page_size=25)

        repo.list_for_user.assert_called_once_with(
            USER_ID, include_completed=False, offset=25, limit=25
        )


# ---------------------------------------------------------------------------
# ReminderService.create_reminder
# ---------------------------------------------------------------------------

class TestCreateReminder:
    def _data(self, **overrides) -> ReminderCreate:
        defaults = dict(
            activity_id=ACTIVITY_ID,
            assigned_to_user_id=USER_ID,
            due_date=NOW,
            reminder_text="Follow up",
        )
        defaults.update(overrides)
        return ReminderCreate(**defaults)

    def test_raises_not_found_when_activity_missing(self):
        repo = _make_reminder_repo()
        repo.activity_exists.return_value = False
        svc = ReminderService(repository=repo)

        with pytest.raises(NotFoundError):
            svc.create_reminder(self._data(), created_by=ACTOR_ID)

    def test_creates_reminder_with_is_completed_false(self):
        repo = _make_reminder_repo()
        repo.create.return_value = _make_reminder()
        svc = ReminderService(repository=repo)

        svc.create_reminder(self._data(), created_by=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.is_completed is False

    def test_created_by_and_updated_by_set(self):
        repo = _make_reminder_repo()
        repo.create.return_value = _make_reminder()
        svc = ReminderService(repository=repo)

        svc.create_reminder(self._data(), created_by=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.created_by == ACTOR_ID
        assert call_args.updated_by == ACTOR_ID

    def test_all_fields_set_correctly(self):
        repo = _make_reminder_repo()
        repo.create.return_value = _make_reminder()
        svc = ReminderService(repository=repo)

        svc.create_reminder(self._data(reminder_text="Call back tomorrow"), created_by=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.activity_id == ACTIVITY_ID
        assert call_args.assigned_to_user_id == USER_ID
        assert call_args.reminder_text == "Call back tomorrow"

    def test_returns_reminder_from_repo(self):
        repo = _make_reminder_repo()
        reminder = _make_reminder()
        repo.create.return_value = reminder
        svc = ReminderService(repository=repo)

        result = svc.create_reminder(self._data(), created_by=ACTOR_ID)

        assert result is reminder


# ---------------------------------------------------------------------------
# ReminderService.patch_reminder
# ---------------------------------------------------------------------------

class TestPatchReminder:
    def test_raises_not_found_when_reminder_missing(self):
        repo = _make_reminder_repo()
        repo.get_by_id.return_value = None
        svc = ReminderService(repository=repo)

        with pytest.raises(NotFoundError):
            svc.patch_reminder(REMINDER_ID, ReminderUpdate(is_completed=True), updated_by=ACTOR_ID)

    def test_sets_is_completed_true(self):
        repo = _make_reminder_repo()
        reminder = _make_reminder(is_completed=False)
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        svc = ReminderService(repository=repo)

        svc.patch_reminder(REMINDER_ID, ReminderUpdate(is_completed=True), updated_by=ACTOR_ID)

        assert reminder.is_completed is True

    def test_sets_is_completed_false(self):
        repo = _make_reminder_repo()
        reminder = _make_reminder(is_completed=True)
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        svc = ReminderService(repository=repo)

        svc.patch_reminder(REMINDER_ID, ReminderUpdate(is_completed=False), updated_by=ACTOR_ID)

        assert reminder.is_completed is False

    def test_sets_updated_by(self):
        repo = _make_reminder_repo()
        reminder = _make_reminder()
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        svc = ReminderService(repository=repo)

        svc.patch_reminder(REMINDER_ID, ReminderUpdate(is_completed=True), updated_by=ACTOR_ID)

        assert reminder.updated_by == ACTOR_ID

    def test_returns_updated_reminder(self):
        repo = _make_reminder_repo()
        reminder = _make_reminder()
        updated = _make_reminder(is_completed=True)
        repo.get_by_id.return_value = reminder
        repo.update.return_value = updated
        svc = ReminderService(repository=repo)

        result = svc.patch_reminder(REMINDER_ID, ReminderUpdate(is_completed=True), updated_by=ACTOR_ID)

        assert result is updated
