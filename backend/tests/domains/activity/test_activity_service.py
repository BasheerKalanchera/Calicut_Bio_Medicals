"""
Unit tests for ActivityService and ReminderService.

Repository is fully mocked — no DB required. Tests cover:
  - ActivityService.list_by_account: NotFoundError on missing account, pagination
  - ActivityService.list_by_project: NotFoundError on missing project, pagination
  - ActivityService.log_activity: BR-ACT-01 (account exists), opportunity validation,
    user_id defaults to created_by when omitted
  - ReminderService.list_for_user: include_completed filter, pagination
  - ReminderService.list_for_opportunity: NotFoundError on missing opportunity,
    include_completed filter, pagination
  - ReminderService.create_reminder: NotFoundError on missing activity
  - ReminderService.patch_reminder: NotFoundError on missing reminder, is_completed
    toggle, BR-ACT-05 closing-Activity creation on completion
  - ReminderUpdate: BR-ACT-05 mandatory closing-activity fields when is_completed=True
"""

import uuid
from datetime import UTC, date, datetime, timedelta
from unittest.mock import MagicMock
from zoneinfo import ZoneInfo

import pydantic
import pytest

from app.core.exceptions import NotFoundError
from app.domains.activity.models import Activity, Reminder
from app.domains.activity.repository import ActivityRepository, ReminderRepository
from app.domains.activity.schemas import ActivityCreate, ReminderCreate, ReminderUpdate
from app.domains.activity.service import ActivityService, ReminderService
from app.domains.organization.models import UserProfile

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
NOW = datetime(2026, 6, 30, 9, 0, 0, tzinfo=UTC)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_activity_repo() -> MagicMock:
    repo = MagicMock(spec=ActivityRepository)
    repo.account_exists.return_value = True
    repo.opportunity_exists.return_value = True
    repo.project_exists.return_value = True
    repo.list_by_account.return_value = []
    repo.count_by_account.return_value = 0
    repo.list_by_project.return_value = []
    repo.count_by_project.return_value = 0
    repo.list_by_date.return_value = []
    repo.count_by_date.return_value = 0
    return repo


def _make_current_user(role_name: str = "Admin", **overrides) -> MagicMock:
    defaults = {"id": ACTOR_ID, "sbu_id": uuid.uuid4(), "zone_id": uuid.uuid4(), "manager_id": None}
    defaults.update(overrides)
    user = MagicMock(spec=UserProfile)
    for k, v in defaults.items():
        setattr(user, k, v)
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _make_reminder_repo() -> MagicMock:
    repo = MagicMock(spec=ReminderRepository)
    repo.activity_exists.return_value = True
    repo.opportunity_exists.return_value = True
    repo.list_for_user.return_value = []
    repo.count_for_user.return_value = 0
    repo.list_by_opportunity.return_value = []
    repo.count_by_opportunity.return_value = 0
    return repo


def _make_activity(**overrides) -> Activity:
    a = MagicMock(spec=Activity)
    a.id = overrides.get("id", ACTIVITY_ID)
    a.account_id = overrides.get("account_id", ACCOUNT_ID)
    a.opportunity_id = overrides.get("opportunity_id")
    a.project_id = overrides.get("project_id")
    a.user_id = overrides.get("user_id", USER_ID)
    a.activity_type = overrides.get("activity_type", "VISIT")
    a.activity_date = overrides.get("activity_date", NOW)
    a.notes = overrides.get("notes")
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
    # The reminder's own (creating) activity -- patch_reminder reads this to
    # inherit account/opportunity/project context for the closing Activity.
    r.activity = overrides.get("activity", _make_activity())
    return r


def _closing_data(**overrides) -> dict:
    defaults = dict(is_completed=True, activity_type="CALL", activity_date=NOW, notes="Called the customer")
    defaults.update(overrides)
    return defaults


# ---------------------------------------------------------------------------
# ActivityService.list_by_account
# ---------------------------------------------------------------------------

class TestListByAccount:
    def test_raises_not_found_when_account_missing(self):
        repo = _make_activity_repo()
        repo.account_exists.return_value = False
        svc = ActivityService(repository=repo, reminder_repository=_make_reminder_repo())

        with pytest.raises(NotFoundError):
            svc.list_by_account(ACCOUNT_ID, page=1, page_size=50)

    def test_returns_items_and_total(self):
        # total is offset + len(items) — a lower bound, not a real COUNT (see
        # list_by_account's comment). The authoritative total is
        # AccountDetailResponse.activity_count, computed alongside the account's
        # other counts in account/repository.py's get_account_with_counts.
        repo = _make_activity_repo()
        activities = [_make_activity(), _make_activity(id=uuid.uuid4())]
        repo.list_by_account.return_value = activities
        svc = ActivityService(repository=repo, reminder_repository=_make_reminder_repo())

        items, total = svc.list_by_account(ACCOUNT_ID, page=1, page_size=50)

        assert items == activities
        assert total == 2
        repo.count_by_account.assert_not_called()

    def test_calculates_offset_from_page(self):
        repo = _make_activity_repo()
        repo.count_by_account.return_value = 0
        svc = ActivityService(repository=repo, reminder_repository=_make_reminder_repo())

        svc.list_by_account(ACCOUNT_ID, page=3, page_size=20)

        repo.list_by_account.assert_called_once_with(ACCOUNT_ID, offset=40, limit=20)

    def test_page_1_has_zero_offset(self):
        repo = _make_activity_repo()
        svc = ActivityService(repository=repo, reminder_repository=_make_reminder_repo())

        svc.list_by_account(ACCOUNT_ID, page=1, page_size=10)

        repo.list_by_account.assert_called_once_with(ACCOUNT_ID, offset=0, limit=10)


# ---------------------------------------------------------------------------
# ActivityService.list_by_project
# ---------------------------------------------------------------------------

class TestListByProject:
    def test_raises_not_found_when_project_missing(self):
        repo = _make_activity_repo()
        repo.project_exists.return_value = False
        svc = ActivityService(repository=repo, reminder_repository=_make_reminder_repo())

        with pytest.raises(NotFoundError):
            svc.list_by_project(PROJECT_ID, page=1, page_size=50)

    def test_returns_items_and_total(self):
        repo = _make_activity_repo()
        activities = [_make_activity(project_id=PROJECT_ID), _make_activity(id=uuid.uuid4(), project_id=PROJECT_ID)]
        repo.list_by_project.return_value = activities
        repo.count_by_project.return_value = 2
        svc = ActivityService(repository=repo, reminder_repository=_make_reminder_repo())

        items, total = svc.list_by_project(PROJECT_ID, page=1, page_size=50)

        assert items == activities
        assert total == 2

    def test_calculates_offset_from_page(self):
        repo = _make_activity_repo()
        svc = ActivityService(repository=repo, reminder_repository=_make_reminder_repo())

        svc.list_by_project(PROJECT_ID, page=3, page_size=20)

        repo.list_by_project.assert_called_once_with(PROJECT_ID, offset=40, limit=20)

    def test_page_1_has_zero_offset(self):
        repo = _make_activity_repo()
        svc = ActivityService(repository=repo, reminder_repository=_make_reminder_repo())

        svc.list_by_project(PROJECT_ID, page=1, page_size=10)

        repo.list_by_project.assert_called_once_with(PROJECT_ID, offset=0, limit=10)


# ---------------------------------------------------------------------------
# ActivityService.list_daily_report
# ---------------------------------------------------------------------------

class TestListDailyReport:
    def test_converts_report_date_to_ist_range(self):
        repo = _make_activity_repo()
        svc = ActivityService(repository=repo, reminder_repository=_make_reminder_repo())
        current_user = _make_current_user("Admin")

        svc.list_daily_report(current_user, date(2026, 8, 6), page=1, page_size=50)

        ist = ZoneInfo("Asia/Kolkata")
        expected_start = datetime(2026, 8, 6, 0, 0, 0, tzinfo=ist)
        expected_end = expected_start + timedelta(days=1)
        repo.list_by_date.assert_called_once_with(
            current_user, expected_start, expected_end, user_id=None, offset=0, limit=50
        )
        repo.count_by_date.assert_called_once_with(
            current_user, expected_start, expected_end, user_id=None
        )

    def test_calculates_offset_from_page(self):
        repo = _make_activity_repo()
        svc = ActivityService(repository=repo, reminder_repository=_make_reminder_repo())

        svc.list_daily_report(_make_current_user("Admin"), date(2026, 8, 6), page=3, page_size=20)

        _, kwargs = repo.list_by_date.call_args
        assert kwargs["offset"] == 40
        assert kwargs["limit"] == 20

    def test_forwards_explicit_user_id_filter(self):
        repo = _make_activity_repo()
        svc = ActivityService(repository=repo, reminder_repository=_make_reminder_repo())
        target_user = uuid.uuid4()

        svc.list_daily_report(_make_current_user("Admin"), date(2026, 8, 6), user_id=target_user)

        _, kwargs = repo.list_by_date.call_args
        assert kwargs["user_id"] == target_user

    def test_returns_items_and_real_count(self):
        repo = _make_activity_repo()
        activities = [_make_activity(), _make_activity(id=uuid.uuid4())]
        repo.list_by_date.return_value = activities
        repo.count_by_date.return_value = 2
        svc = ActivityService(repository=repo, reminder_repository=_make_reminder_repo())

        items, total = svc.list_daily_report(_make_current_user("Admin"), date(2026, 8, 6))

        assert items == activities
        assert total == 2
        repo.count_by_date.assert_called_once()


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
            next_action_text="Follow up next week",
            next_action_due_date=NOW,
            next_action_owner_id=None,
        )
        defaults.update(overrides)
        return ActivityCreate(**defaults)

    def _svc(self, activity_repo=None, reminder_repo=None) -> ActivityService:
        activity_repo = activity_repo or _make_activity_repo()
        reminder_repo = reminder_repo or _make_reminder_repo()
        reminder_repo.create.return_value = _make_reminder()
        return ActivityService(repository=activity_repo, reminder_repository=reminder_repo)

    def test_raises_not_found_when_account_missing(self):
        repo = _make_activity_repo()
        repo.account_exists.return_value = False
        svc = self._svc(activity_repo=repo)

        with pytest.raises(NotFoundError):
            svc.log_activity(self._data(), created_by=ACTOR_ID)

    def test_raises_not_found_when_opportunity_missing(self):
        repo = _make_activity_repo()
        repo.opportunity_exists.return_value = False
        svc = self._svc(activity_repo=repo)

        with pytest.raises(NotFoundError):
            svc.log_activity(self._data(opportunity_id=OPP_ID), created_by=ACTOR_ID)

    def test_opportunity_not_checked_when_omitted(self):
        repo = _make_activity_repo()
        repo.create.return_value = _make_activity()
        svc = self._svc(activity_repo=repo)

        svc.log_activity(self._data(opportunity_id=None), created_by=ACTOR_ID)

        repo.opportunity_exists.assert_not_called()

    def test_user_id_defaults_to_created_by_when_not_provided(self):
        repo = _make_activity_repo()
        created_activity = _make_activity(user_id=ACTOR_ID)
        repo.create.return_value = created_activity
        svc = self._svc(activity_repo=repo)

        svc.log_activity(self._data(user_id=None), created_by=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.user_id == ACTOR_ID

    def test_explicit_user_id_used_when_provided(self):
        repo = _make_activity_repo()
        explicit_user = uuid.uuid4()
        repo.create.return_value = _make_activity(user_id=explicit_user)
        svc = self._svc(activity_repo=repo)

        svc.log_activity(self._data(user_id=explicit_user), created_by=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.user_id == explicit_user

    def test_created_by_set_on_activity(self):
        repo = _make_activity_repo()
        repo.create.return_value = _make_activity()
        svc = self._svc(activity_repo=repo)

        svc.log_activity(self._data(), created_by=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.created_by == ACTOR_ID

    def test_all_fields_passed_through(self):
        repo = _make_activity_repo()
        repo.create.return_value = _make_activity()
        svc = self._svc(activity_repo=repo)

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
        svc = self._svc(activity_repo=repo)

        result = svc.log_activity(self._data(), created_by=ACTOR_ID)

        assert result[0] is activity


# ---------------------------------------------------------------------------
# ActivityService.log_activity — BR-ACT-04 Next Action / Reminder creation
# ---------------------------------------------------------------------------

class TestLogActivityReminderCreation:
    def _data(self, **overrides) -> ActivityCreate:
        defaults = dict(
            account_id=ACCOUNT_ID,
            opportunity_id=None,
            project_id=None,
            user_id=None,
            activity_type="VISIT",
            activity_date=NOW,
            notes=None,
            next_action_text="Follow up next week",
            next_action_due_date=NOW,
            next_action_owner_id=None,
        )
        defaults.update(overrides)
        return ActivityCreate(**defaults)

    def test_creates_linked_reminder_with_activity_id(self):
        activity_repo = _make_activity_repo()
        activity = _make_activity()
        activity_repo.create.return_value = activity
        reminder_repo = _make_reminder_repo()
        reminder_repo.create.return_value = _make_reminder()
        svc = ActivityService(repository=activity_repo, reminder_repository=reminder_repo)

        svc.log_activity(self._data(), created_by=ACTOR_ID)

        call_args = reminder_repo.create.call_args[0][0]
        assert call_args.activity_id == activity.id

    def test_reminder_owner_defaults_to_activity_user_id_when_omitted(self):
        activity_repo = _make_activity_repo()
        activity_repo.create.return_value = _make_activity(user_id=USER_ID)
        reminder_repo = _make_reminder_repo()
        reminder_repo.create.return_value = _make_reminder()
        svc = ActivityService(repository=activity_repo, reminder_repository=reminder_repo)

        svc.log_activity(self._data(next_action_owner_id=None), created_by=ACTOR_ID)

        call_args = reminder_repo.create.call_args[0][0]
        assert call_args.assigned_to_user_id == USER_ID

    def test_reminder_owner_uses_explicit_next_action_owner_id_when_provided(self):
        explicit_owner = uuid.uuid4()
        activity_repo = _make_activity_repo()
        activity_repo.create.return_value = _make_activity(user_id=USER_ID)
        reminder_repo = _make_reminder_repo()
        reminder_repo.create.return_value = _make_reminder()
        svc = ActivityService(repository=activity_repo, reminder_repository=reminder_repo)

        svc.log_activity(self._data(next_action_owner_id=explicit_owner), created_by=ACTOR_ID)

        call_args = reminder_repo.create.call_args[0][0]
        assert call_args.assigned_to_user_id == explicit_owner

    def test_reminder_fields_from_next_action_data(self):
        activity_repo = _make_activity_repo()
        activity_repo.create.return_value = _make_activity()
        reminder_repo = _make_reminder_repo()
        reminder_repo.create.return_value = _make_reminder()
        svc = ActivityService(repository=activity_repo, reminder_repository=reminder_repo)

        svc.log_activity(
            self._data(next_action_text="Call the biomedical engineer", next_action_due_date=NOW),
            created_by=ACTOR_ID,
        )

        call_args = reminder_repo.create.call_args[0][0]
        assert call_args.reminder_text == "Call the biomedical engineer"
        assert call_args.due_date == NOW
        assert call_args.is_completed is False

    def test_reminder_created_by_set_to_actor(self):
        activity_repo = _make_activity_repo()
        activity_repo.create.return_value = _make_activity()
        reminder_repo = _make_reminder_repo()
        reminder_repo.create.return_value = _make_reminder()
        svc = ActivityService(repository=activity_repo, reminder_repository=reminder_repo)

        svc.log_activity(self._data(), created_by=ACTOR_ID)

        call_args = reminder_repo.create.call_args[0][0]
        assert call_args.created_by == ACTOR_ID
        assert call_args.updated_by == ACTOR_ID

    def test_manager_note_creates_no_reminder(self):
        activity_repo = _make_activity_repo()
        activity_repo.create.return_value = _make_activity(activity_type="MANAGER_NOTE")
        reminder_repo = _make_reminder_repo()
        svc = ActivityService(repository=activity_repo, reminder_repository=reminder_repo)

        result = svc.log_activity(
            self._data(
                activity_type="MANAGER_NOTE",
                next_action_text=None,
                next_action_due_date=None,
            ),
            created_by=ACTOR_ID,
        )

        reminder_repo.create.assert_not_called()
        assert result[1] is None


# ---------------------------------------------------------------------------
# ActivityCreate — BR-ACT-04 mandatory Next Action validation
# ---------------------------------------------------------------------------

class TestActivityCreateValidation:
    def _data(self, **overrides) -> dict:
        defaults = dict(
            account_id=ACCOUNT_ID,
            opportunity_id=None,
            project_id=None,
            user_id=None,
            activity_type="VISIT",
            activity_date=NOW,
            notes=None,
            next_action_text="Follow up next week",
            next_action_due_date=NOW,
            next_action_owner_id=None,
        )
        defaults.update(overrides)
        return defaults

    def test_non_manager_note_without_next_action_text_raises(self):
        with pytest.raises(pydantic.ValidationError):
            ActivityCreate(**self._data(activity_type="VISIT", next_action_text=None))

    def test_non_manager_note_without_next_action_due_date_raises(self):
        with pytest.raises(pydantic.ValidationError):
            ActivityCreate(**self._data(activity_type="CALL", next_action_due_date=None))

    def test_manager_note_without_next_action_fields_succeeds(self):
        data = ActivityCreate(
            **self._data(
                activity_type="MANAGER_NOTE",
                next_action_text=None,
                next_action_due_date=None,
            )
        )
        assert data.next_action_text is None
        assert data.next_action_due_date is None

    def test_manager_note_with_next_action_fields_also_succeeds(self):
        data = ActivityCreate(
            **self._data(
                activity_type="MANAGER_NOTE",
                next_action_text="Optional follow-up",
                next_action_due_date=NOW,
            )
        )
        assert data.next_action_text == "Optional follow-up"


# ---------------------------------------------------------------------------
# ReminderService.list_for_user
# ---------------------------------------------------------------------------

class TestListForUser:
    def test_returns_items_and_total(self):
        repo = _make_reminder_repo()
        reminders = [_make_reminder()]
        repo.list_for_user.return_value = reminders
        repo.count_for_user.return_value = 1
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        items, total = svc.list_for_user(USER_ID, page=1, page_size=50)

        assert items == reminders
        assert total == 1

    def test_include_completed_false_by_default(self):
        repo = _make_reminder_repo()
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        svc.list_for_user(USER_ID, page=1, page_size=50)

        repo.list_for_user.assert_called_once_with(
            USER_ID, include_completed=False, offset=0, limit=50
        )
        repo.count_for_user.assert_called_once_with(USER_ID, include_completed=False)

    def test_include_completed_true_forwarded(self):
        repo = _make_reminder_repo()
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        svc.list_for_user(USER_ID, include_completed=True, page=1, page_size=50)

        repo.list_for_user.assert_called_once_with(
            USER_ID, include_completed=True, offset=0, limit=50
        )
        repo.count_for_user.assert_called_once_with(USER_ID, include_completed=True)

    def test_offset_calculated_from_page(self):
        repo = _make_reminder_repo()
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        svc.list_for_user(USER_ID, page=2, page_size=25)

        repo.list_for_user.assert_called_once_with(
            USER_ID, include_completed=False, offset=25, limit=25
        )


# ---------------------------------------------------------------------------
# ReminderService.list_for_opportunity
# ---------------------------------------------------------------------------

class TestListForOpportunity:
    def test_raises_not_found_when_opportunity_missing(self):
        repo = _make_reminder_repo()
        repo.opportunity_exists.return_value = False
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        with pytest.raises(NotFoundError):
            svc.list_for_opportunity(OPP_ID, page=1, page_size=50)

    def test_returns_items_and_total(self):
        repo = _make_reminder_repo()
        reminders = [_make_reminder()]
        repo.list_by_opportunity.return_value = reminders
        repo.count_by_opportunity.return_value = 1
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        items, total = svc.list_for_opportunity(OPP_ID, page=1, page_size=50)

        assert items == reminders
        assert total == 1

    def test_include_completed_false_by_default(self):
        repo = _make_reminder_repo()
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        svc.list_for_opportunity(OPP_ID, page=1, page_size=50)

        repo.list_by_opportunity.assert_called_once_with(
            OPP_ID, include_completed=False, offset=0, limit=50
        )
        repo.count_by_opportunity.assert_called_once_with(OPP_ID, include_completed=False)

    def test_include_completed_true_forwarded(self):
        repo = _make_reminder_repo()
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        svc.list_for_opportunity(OPP_ID, include_completed=True, page=1, page_size=50)

        repo.list_by_opportunity.assert_called_once_with(
            OPP_ID, include_completed=True, offset=0, limit=50
        )
        repo.count_by_opportunity.assert_called_once_with(OPP_ID, include_completed=True)

    def test_offset_calculated_from_page(self):
        repo = _make_reminder_repo()
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        svc.list_for_opportunity(OPP_ID, page=2, page_size=25)

        repo.list_by_opportunity.assert_called_once_with(
            OPP_ID, include_completed=False, offset=25, limit=25
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
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        with pytest.raises(NotFoundError):
            svc.create_reminder(self._data(), created_by=ACTOR_ID)

    def test_creates_reminder_with_is_completed_false(self):
        repo = _make_reminder_repo()
        repo.create.return_value = _make_reminder()
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        svc.create_reminder(self._data(), created_by=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.is_completed is False

    def test_created_by_and_updated_by_set(self):
        repo = _make_reminder_repo()
        repo.create.return_value = _make_reminder()
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        svc.create_reminder(self._data(), created_by=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.created_by == ACTOR_ID
        assert call_args.updated_by == ACTOR_ID

    def test_all_fields_set_correctly(self):
        repo = _make_reminder_repo()
        repo.create.return_value = _make_reminder()
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        svc.create_reminder(self._data(reminder_text="Call back tomorrow"), created_by=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.activity_id == ACTIVITY_ID
        assert call_args.assigned_to_user_id == USER_ID
        assert call_args.reminder_text == "Call back tomorrow"

    def test_returns_reminder_from_repo(self):
        repo = _make_reminder_repo()
        reminder = _make_reminder()
        repo.create.return_value = reminder
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        result = svc.create_reminder(self._data(), created_by=ACTOR_ID)

        assert result is reminder


# ---------------------------------------------------------------------------
# ReminderService.patch_reminder
# ---------------------------------------------------------------------------

class TestPatchReminder:
    def test_raises_not_found_when_reminder_missing(self):
        repo = _make_reminder_repo()
        repo.get_by_id.return_value = None
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        with pytest.raises(NotFoundError):
            svc.patch_reminder(REMINDER_ID, ReminderUpdate(**_closing_data()), updated_by=ACTOR_ID)

    def test_sets_is_completed_true(self):
        repo = _make_reminder_repo()
        reminder = _make_reminder(is_completed=False)
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        svc.patch_reminder(REMINDER_ID, ReminderUpdate(**_closing_data()), updated_by=ACTOR_ID)

        assert reminder.is_completed is True

    def test_sets_is_completed_false(self):
        repo = _make_reminder_repo()
        reminder = _make_reminder(is_completed=True)
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        svc.patch_reminder(REMINDER_ID, ReminderUpdate(is_completed=False), updated_by=ACTOR_ID)

        assert reminder.is_completed is False

    def test_sets_updated_by(self):
        repo = _make_reminder_repo()
        reminder = _make_reminder()
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        svc.patch_reminder(REMINDER_ID, ReminderUpdate(**_closing_data()), updated_by=ACTOR_ID)

        assert reminder.updated_by == ACTOR_ID

    def test_returns_updated_reminder(self):
        repo = _make_reminder_repo()
        reminder = _make_reminder()
        updated = _make_reminder(is_completed=True)
        repo.get_by_id.return_value = reminder
        repo.update.return_value = updated
        svc = ReminderService(repository=repo, activity_repository=_make_activity_repo())

        result = svc.patch_reminder(REMINDER_ID, ReminderUpdate(**_closing_data()), updated_by=ACTOR_ID)

        assert result is updated

    def test_completing_creates_closing_activity_with_inherited_context(self):
        original = _make_activity(account_id=ACCOUNT_ID, opportunity_id=OPP_ID, project_id=PROJECT_ID)
        reminder = _make_reminder(activity=original)
        repo = _make_reminder_repo()
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        activity_repo = _make_activity_repo()
        activity_repo.create.return_value = _make_activity(id=uuid.uuid4())
        svc = ReminderService(repository=repo, activity_repository=activity_repo)

        svc.patch_reminder(REMINDER_ID, ReminderUpdate(**_closing_data()), updated_by=ACTOR_ID)

        call_args = activity_repo.create.call_args[0][0]
        assert call_args.account_id == ACCOUNT_ID
        assert call_args.opportunity_id == OPP_ID
        assert call_args.project_id == PROJECT_ID

    def test_completing_closing_activity_uses_submitted_fields_and_updated_by_as_user(self):
        reminder = _make_reminder()
        repo = _make_reminder_repo()
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        activity_repo = _make_activity_repo()
        activity_repo.create.return_value = _make_activity(id=uuid.uuid4())
        svc = ReminderService(repository=repo, activity_repository=activity_repo)

        svc.patch_reminder(
            REMINDER_ID,
            ReminderUpdate(is_completed=True, activity_type="VISIT", activity_date=NOW, notes="Visited the hospital"),
            updated_by=ACTOR_ID,
        )

        call_args = activity_repo.create.call_args[0][0]
        assert call_args.activity_type == "VISIT"
        assert call_args.activity_date == NOW
        assert call_args.notes == "Visited the hospital"
        assert call_args.user_id == ACTOR_ID
        assert call_args.created_by == ACTOR_ID

    def test_completing_sets_reminder_closing_activity_id(self):
        reminder = _make_reminder()
        repo = _make_reminder_repo()
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        activity_repo = _make_activity_repo()
        closing_activity = _make_activity(id=uuid.uuid4())
        activity_repo.create.return_value = closing_activity
        svc = ReminderService(repository=repo, activity_repository=activity_repo)

        svc.patch_reminder(REMINDER_ID, ReminderUpdate(**_closing_data()), updated_by=ACTOR_ID)

        assert reminder.closing_activity_id == closing_activity.id

    def test_reopening_does_not_create_closing_activity(self):
        reminder = _make_reminder(is_completed=True)
        repo = _make_reminder_repo()
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        activity_repo = _make_activity_repo()
        svc = ReminderService(repository=repo, activity_repository=activity_repo)

        svc.patch_reminder(REMINDER_ID, ReminderUpdate(is_completed=False), updated_by=ACTOR_ID)

        activity_repo.create.assert_not_called()

    def test_completing_without_follow_up_creates_no_new_reminder(self):
        reminder = _make_reminder()
        repo = _make_reminder_repo()
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        activity_repo = _make_activity_repo()
        activity_repo.create.return_value = _make_activity(id=uuid.uuid4())
        svc = ReminderService(repository=repo, activity_repository=activity_repo)

        svc.patch_reminder(REMINDER_ID, ReminderUpdate(**_closing_data()), updated_by=ACTOR_ID)

        repo.create.assert_not_called()

    def test_completing_with_follow_up_creates_new_reminder_linked_to_closing_activity(self):
        reminder = _make_reminder()
        repo = _make_reminder_repo()
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        activity_repo = _make_activity_repo()
        closing_activity = _make_activity(id=uuid.uuid4(), user_id=ACTOR_ID)
        activity_repo.create.return_value = closing_activity
        svc = ReminderService(repository=repo, activity_repository=activity_repo)

        svc.patch_reminder(
            REMINDER_ID,
            ReminderUpdate(**_closing_data(next_action_text="Send the quote", next_action_due_date=NOW)),
            updated_by=ACTOR_ID,
        )

        call_args = repo.create.call_args[0][0]
        assert call_args.activity_id == closing_activity.id
        assert call_args.reminder_text == "Send the quote"
        assert call_args.due_date == NOW
        assert call_args.is_completed is False

    def test_follow_up_owner_defaults_to_whoever_closed_it(self):
        reminder = _make_reminder()
        repo = _make_reminder_repo()
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        activity_repo = _make_activity_repo()
        closing_activity = _make_activity(id=uuid.uuid4(), user_id=ACTOR_ID)
        activity_repo.create.return_value = closing_activity
        svc = ReminderService(repository=repo, activity_repository=activity_repo)

        svc.patch_reminder(
            REMINDER_ID,
            ReminderUpdate(**_closing_data(next_action_text="Send the quote", next_action_due_date=NOW)),
            updated_by=ACTOR_ID,
        )

        call_args = repo.create.call_args[0][0]
        assert call_args.assigned_to_user_id == ACTOR_ID

    def test_follow_up_owner_uses_explicit_owner_when_provided(self):
        explicit_owner = uuid.uuid4()
        reminder = _make_reminder()
        repo = _make_reminder_repo()
        repo.get_by_id.return_value = reminder
        repo.update.return_value = reminder
        activity_repo = _make_activity_repo()
        activity_repo.create.return_value = _make_activity(id=uuid.uuid4(), user_id=ACTOR_ID)
        svc = ReminderService(repository=repo, activity_repository=activity_repo)

        svc.patch_reminder(
            REMINDER_ID,
            ReminderUpdate(
                **_closing_data(
                    next_action_text="Send the quote",
                    next_action_due_date=NOW,
                    next_action_owner_id=explicit_owner,
                )
            ),
            updated_by=ACTOR_ID,
        )

        call_args = repo.create.call_args[0][0]
        assert call_args.assigned_to_user_id == explicit_owner


# ---------------------------------------------------------------------------
# ReminderUpdate — BR-ACT-05 mandatory closing-activity validation
# ---------------------------------------------------------------------------

class TestReminderUpdateValidation:
    def test_completing_without_activity_type_raises(self):
        with pytest.raises(pydantic.ValidationError):
            ReminderUpdate(**{**_closing_data(), "activity_type": None})

    def test_completing_without_activity_date_raises(self):
        with pytest.raises(pydantic.ValidationError):
            ReminderUpdate(**{**_closing_data(), "activity_date": None})

    def test_completing_without_notes_raises(self):
        with pytest.raises(pydantic.ValidationError):
            ReminderUpdate(**{**_closing_data(), "notes": None})

    def test_completing_with_manager_note_type_raises(self):
        with pytest.raises(pydantic.ValidationError):
            ReminderUpdate(**{**_closing_data(), "activity_type": "MANAGER_NOTE"})

    def test_completing_with_all_fields_succeeds(self):
        data = ReminderUpdate(**_closing_data())
        assert data.is_completed is True
        assert data.notes == "Called the customer"

    def test_reopening_without_closing_fields_succeeds(self):
        data = ReminderUpdate(is_completed=False)
        assert data.is_completed is False
        assert data.activity_type is None

    def test_follow_up_text_without_due_date_raises(self):
        with pytest.raises(pydantic.ValidationError):
            ReminderUpdate(**_closing_data(next_action_text="Send the quote", next_action_due_date=None))

    def test_follow_up_due_date_without_text_raises(self):
        with pytest.raises(pydantic.ValidationError):
            ReminderUpdate(**_closing_data(next_action_due_date=NOW, next_action_text=None))

    def test_follow_up_omitted_entirely_succeeds(self):
        data = ReminderUpdate(**_closing_data())
        assert data.next_action_text is None
        assert data.next_action_due_date is None

    def test_follow_up_provided_together_succeeds(self):
        data = ReminderUpdate(**_closing_data(next_action_text="Send the quote", next_action_due_date=NOW))
        assert data.next_action_text == "Send the quote"
        assert data.next_action_due_date == NOW
