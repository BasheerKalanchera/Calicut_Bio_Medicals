"""
Unit tests for ActivityRepository.list_by_date / count_by_date -- the Daily
Activity Report's tier-scoping. Repository is exercised against a mocked DB
(no real SQL execution); the generated WHERE clause is compiled to a SQL
string and asserted against, mirroring
tests/domains/organization/test_organization_repository.py's TestListActive
pattern exactly, since this reuses that same scoping logic
(UNRESTRICTED_ROLES / TEAM_SCOPE_BUILDERS) applied to who logged the
activity rather than to user_profile rows directly.
"""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

from sqlalchemy.dialects import postgresql

from app.domains.activity.repository import (
    ActivityCommentRepository,
    ActivityRepository,
    ReminderRepository,
)
from app.domains.organization.models import UserProfile

START = datetime(2026, 8, 6, 0, 0, 0, tzinfo=UTC)
END = START + timedelta(days=1)


def _make_current_user(role_name: str, **overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "sbu_id": uuid.uuid4(),
        "zone_id": uuid.uuid4(),
        "manager_id": None,
    }
    defaults.update(overrides)
    user = MagicMock(spec=UserProfile)
    for k, v in defaults.items():
        setattr(user, k, v)
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _compiled_where(stmt) -> str:
    if stmt.whereclause is None:
        return ""
    return str(stmt.whereclause.compile(compile_kwargs={"literal_binds": True}))


class TestListByDate:
    def _run(self, current_user: MagicMock, **kwargs) -> tuple[str, MagicMock]:
        mock_db = MagicMock()
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        repo = ActivityRepository(mock_db)
        repo.list_by_date(current_user, START, END, **kwargs)

        stmt = mock_db.scalars.call_args.args[0]
        return _compiled_where(stmt), mock_db

    def test_date_range_always_applied(self):
        current_user = _make_current_user("Admin")
        sql, _ = self._run(current_user)

        assert "activity.activity_date >=" in sql
        assert "activity.activity_date <" in sql

    def test_admin_is_unrestricted(self):
        current_user = _make_current_user("Admin")
        sql, _ = self._run(current_user)

        assert "user_profile.sbu_id" not in sql
        assert "user_profile.zone_id" not in sql
        assert "user_profile.manager_id" not in sql

    def test_general_manager_is_unrestricted(self):
        current_user = _make_current_user("General Manager")
        sql, _ = self._run(current_user)

        assert "user_profile.sbu_id" not in sql
        assert "user_profile.zone_id" not in sql
        assert "user_profile.manager_id" not in sql

    def test_sbu_manager_scoped_to_own_sbu_and_self(self):
        current_user = _make_current_user("SBU Manager")
        sql, _ = self._run(current_user)

        assert f"user_profile.sbu_id = '{current_user.sbu_id.hex}'" in sql
        assert f"activity.user_id = '{current_user.id.hex}'" in sql
        assert "user_profile.zone_id" not in sql
        assert "user_profile.manager_id" not in sql

    def test_area_manager_scoped_to_own_sbu_and_shared_zone_or_direct_reports_and_self(self):
        # Same shared TEAM_SCOPE_BUILDERS as organization/repository.py --
        # set-intersection over user_zone (Milestone 1), not scalar equality.
        # manager_id folded in (migration 0021, retired Sales Manager tier) as
        # an OR alongside the zone check -- a safety net for account-zone/
        # reporting-line drift, not the primary mechanism.
        current_user = _make_current_user("Area Manager")
        sql, _ = self._run(current_user)

        assert f"user_profile.sbu_id = '{current_user.sbu_id.hex}'" in sql
        assert "user_profile.id IN (SELECT user_zone.user_id" in sql
        assert f"user_zone.user_id = '{current_user.id.hex}'" in sql
        assert f"user_profile.manager_id = '{current_user.id.hex}'" in sql
        assert f"activity.user_id = '{current_user.id.hex}'" in sql
        assert "user_profile.zone_id" not in sql

    def test_sales_staff_scoped_to_self_only(self):
        # No scope builder entry for "Sales Staff" -- falls back to self-only,
        # same as UserRepository.list_active's fallback for an unmapped tier.
        current_user = _make_current_user("Sales Staff")
        sql, _ = self._run(current_user)

        assert f"activity.user_id = '{current_user.id.hex}'" in sql
        assert "user_profile.sbu_id" not in sql
        assert "user_profile.zone_id" not in sql
        assert "user_profile.manager_id" not in sql

    def test_explicit_user_id_narrows_further(self):
        current_user = _make_current_user("Admin")
        target_user = uuid.uuid4()
        sql, _ = self._run(current_user, user_id=target_user)

        assert f"activity.user_id = '{target_user.hex}'" in sql

    def test_explicit_user_id_applies_on_top_of_tier_scope(self):
        # An Area Manager narrowing to one report's activity should still
        # carry their own tier scope (including the folded-in manager_id
        # check) in the compiled WHERE -- narrowing doesn't replace it.
        current_user = _make_current_user("Area Manager")
        target_user = uuid.uuid4()
        sql, _ = self._run(current_user, user_id=target_user)

        assert f"user_profile.manager_id = '{current_user.id.hex}'" in sql
        assert f"activity.user_id = '{target_user.hex}'" in sql

    def test_offset_and_limit_applied(self):
        current_user = _make_current_user("Admin")
        mock_db = MagicMock()
        mock_db.scalars.return_value.unique.return_value.all.return_value = []
        repo = ActivityRepository(mock_db)

        repo.list_by_date(current_user, START, END, offset=20, limit=10)

        stmt = mock_db.scalars.call_args.args[0]
        assert stmt._offset_clause is not None
        assert stmt._limit_clause is not None


class TestCountByDate:
    def _run(self, current_user: MagicMock, **kwargs) -> str:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0

        repo = ActivityRepository(mock_db)
        repo.count_by_date(current_user, START, END, **kwargs)

        stmt = mock_db.scalar.call_args.args[0]
        return _compiled_where(stmt)

    def test_admin_is_unrestricted(self):
        sql = self._run(_make_current_user("Admin"))
        assert "user_profile.sbu_id" not in sql

    def test_sbu_manager_scoped_to_own_sbu(self):
        current_user = _make_current_user("SBU Manager")
        sql = self._run(current_user)
        assert f"user_profile.sbu_id = '{current_user.sbu_id.hex}'" in sql

    def test_returns_scalar_result(self):
        current_user = _make_current_user("Admin")
        mock_db = MagicMock()
        mock_db.scalar.return_value = 7
        repo = ActivityRepository(mock_db)

        total = repo.count_by_date(current_user, START, END)

        assert total == 7

    def test_none_scalar_defaults_to_zero(self):
        current_user = _make_current_user("Admin")
        mock_db = MagicMock()
        mock_db.scalar.return_value = None
        repo = ActivityRepository(mock_db)

        total = repo.count_by_date(current_user, START, END)

        assert total == 0


class TestListByAccountCommentCount:
    """docs/Activity-Comment-Implementation-Plan.md's comment_count addition
    -- one extra correlated-subquery column, not a separate per-row fetch."""

    def _make_activity(self) -> MagicMock:
        return MagicMock(id=uuid.uuid4())

    def test_query_selects_comment_count_subquery(self):
        mock_db = MagicMock()
        mock_db.execute.return_value.unique.return_value.all.return_value = []
        repo = ActivityRepository(mock_db)

        repo.list_by_account(uuid.uuid4())

        stmt = mock_db.execute.call_args.args[0]
        compiled = str(stmt.compile(compile_kwargs={"literal_binds": True}))
        assert "count(activity_comment.id)" in compiled.lower()
        assert "activity_comment.activity_id = activity.id" in compiled.lower()

    def test_comment_count_attached_to_returned_activity(self):
        mock_db = MagicMock()
        activity = self._make_activity()
        mock_db.execute.return_value.unique.return_value.all.return_value = [(activity, 3)]
        repo = ActivityRepository(mock_db)

        result = repo.list_by_account(uuid.uuid4())

        assert result == [activity]
        assert activity.comment_count == 3


class TestReminderListQuerySize:
    """UAT outage 2026-10-05: the Next Actions list joined ~118 tables because
    every nested relationship loaded eagerly. Both reminder list queries must
    now join only what ReminderResponse shows."""

    def _compiled(self, call) -> str:
        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = []
        call(ReminderRepository(mock_db))
        stmt = mock_db.scalars.call_args.args[0]
        return str(stmt.compile(dialect=postgresql.dialect())).lower()

    def _assert_only_displayed_tables(self, sql: str) -> None:
        # Shown on screen: account, opportunity, project (tells a Project-level
        # next action from a hospital-level one) and people's names.
        for table in ("account", "opportunity", "project", "user_profile"):
            assert f"join {table} " in sql
        # Never shown: the user's SBU/role/zone chain.
        for table in ("sbu", "role", "zone"):
            assert f"join {table} " not in sql

    def _order_by(self, sql: str) -> str:
        return sql.split("order by", 1)[1].split("limit", 1)[0].replace("\n", " ")

    def _assert_stable_order(self, sql: str) -> None:
        clause = self._order_by(sql)
        due = clause.index("reminder.due_date")
        created = clause.index("reminder.created_at")
        row_id = clause.index("reminder.id")
        assert due < created < row_id
        assert "desc" not in clause

    def test_list_for_user_order_is_due_date_then_logged_then_id(self):
        self._assert_stable_order(self._compiled(lambda repo: repo.list_for_user(uuid.uuid4())))

    def test_list_by_opportunity_order_is_due_date_then_logged_then_id(self):
        self._assert_stable_order(
            self._compiled(lambda repo: repo.list_by_opportunity(uuid.uuid4()))
        )

    # Pending list: the closing activity is a separate lookup (no joins of
    # its own in the main statement). list_by_opportunity has one extra join
    # for its own Activity filter.
    def test_list_for_user_pending_has_seven_joins(self):
        sql = self._compiled(lambda repo: repo.list_for_user(uuid.uuid4()))
        self._assert_only_displayed_tables(sql)
        assert sql.count(" join ") == 7

    def test_list_by_opportunity_pending_has_eight_joins(self):
        sql = self._compiled(lambda repo: repo.list_by_opportunity(uuid.uuid4()))
        self._assert_only_displayed_tables(sql)
        assert sql.count(" join ") == 8

    # Completed list: every row has a closing activity the screen shows, so
    # it joins in the same statement (6 more joins).
    def test_list_for_user_completed_joins_closing_activity(self):
        sql = self._compiled(lambda repo: repo.list_for_user(uuid.uuid4(), include_completed=True))
        self._assert_only_displayed_tables(sql)
        assert sql.count(" join ") == 13

    def test_list_by_opportunity_completed_joins_closing_activity(self):
        sql = self._compiled(
            lambda repo: repo.list_by_opportunity(uuid.uuid4(), include_completed=True)
        )
        self._assert_only_displayed_tables(sql)
        assert sql.count(" join ") == 14


class TestDailyReportAndCommentQuerySize:
    """docs/Query-Load-Fixes-Implementation-Plan.md, fix 2: the Daily Activity
    Report joined 57 tables and a comment thread 61, through the models'
    lazy="joined" chains. Each now joins only the names its screen shows."""

    def _sql(self, stmt) -> str:
        return str(stmt.compile(dialect=postgresql.dialect())).lower()

    def _daily_report_sql(self, current_user: MagicMock) -> str:
        mock_db = MagicMock()
        mock_db.scalars.return_value.unique.return_value.all.return_value = []
        ActivityRepository(mock_db).list_by_date(current_user, START, END)
        return self._sql(mock_db.scalars.call_args.args[0])

    def _assert_daily_report_joins(self, sql: str) -> None:
        for table in ("account", "opportunity", "project", "user_profile"):
            assert f"join {table} " in sql
        for table in ("sbu", "role", "zone", "reminder"):
            assert f"join {table} " not in sql
        # Scope join on user_profile + account, opportunity, project, user,
        # created-by user.
        assert sql.count(" join ") == 6

    def test_daily_report_joins_only_displayed_names_admin(self):
        self._assert_daily_report_joins(self._daily_report_sql(_make_current_user("Admin")))

    def test_daily_report_joins_only_displayed_names_manager(self):
        # Scoped tier: the scope is a WHERE condition, not extra joins.
        self._assert_daily_report_joins(self._daily_report_sql(_make_current_user("SBU Manager")))

    def test_comment_thread_joins_only_the_author(self):
        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = []
        ActivityCommentRepository(mock_db).list_for_activity(uuid.uuid4())
        sql = self._sql(mock_db.scalars.call_args.args[0])

        assert "join user_profile " in sql
        assert sql.count(" join ") == 1


class TestNextActionRuleQueries:
    """Next-action rules plan, step 1: the three lookups behind BR-ACT-11
    and the BR-ACT-05 change, compiled and checked for their filters."""

    def _sql(self, call) -> tuple[str, MagicMock]:
        mock_db = MagicMock()
        mock_db.scalar.return_value = None
        call(ReminderRepository(mock_db))
        stmt = mock_db.scalar.call_args.args[0]
        return str(stmt.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True})).lower(), mock_db

    def test_has_open_for_user_on_opportunity_filters_owner_opportunity_and_open(self):
        opp_id, user_id = uuid.uuid4(), uuid.uuid4()
        sql, _ = self._sql(lambda repo: repo.has_open_for_user_on_opportunity(opp_id, user_id))

        assert "join activity on reminder.activity_id = activity.id" in sql
        assert f"activity.opportunity_id = '{opp_id}'" in sql
        assert f"reminder.assigned_to_user_id = '{user_id}'" in sql
        assert "reminder.is_completed = false" in sql

    def test_has_open_for_user_on_opportunity_true_when_row_found(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        assert ReminderRepository(mock_db).has_open_for_user_on_opportunity(uuid.uuid4(), uuid.uuid4()) is True

    def test_has_open_for_user_on_account_level_filters_hospital_only_owner_and_open(self):
        account_id, user_id = uuid.uuid4(), uuid.uuid4()
        sql, _ = self._sql(lambda repo: repo.has_open_for_user_on_account_level(account_id, user_id))

        assert "join activity on reminder.activity_id = activity.id" in sql
        assert f"activity.account_id = '{account_id}'" in sql
        assert "activity.opportunity_id is null" in sql
        assert "activity.project_id is null" in sql
        assert f"reminder.assigned_to_user_id = '{user_id}'" in sql
        assert "reminder.is_completed = false" in sql

    def test_has_open_for_user_on_project_filters_project_without_opportunity_owner_and_open(self):
        project_id, user_id = uuid.uuid4(), uuid.uuid4()
        sql, _ = self._sql(lambda repo: repo.has_open_for_user_on_project(project_id, user_id))

        assert f"activity.project_id = '{project_id}'" in sql
        assert "activity.opportunity_id is null" in sql
        assert "activity.account_id" not in sql
        assert f"reminder.assigned_to_user_id = '{user_id}'" in sql
        assert "reminder.is_completed = false" in sql

    def test_has_open_on_account_level_and_project_true_when_row_found(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        repo = ReminderRepository(mock_db)
        assert repo.has_open_for_user_on_account_level(uuid.uuid4(), uuid.uuid4()) is True
        assert repo.has_open_for_user_on_project(uuid.uuid4(), uuid.uuid4()) is True

    def _list_sql(self, call) -> str:
        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = []
        call(ReminderRepository(mock_db))
        stmt = mock_db.scalars.call_args.args[0]
        return str(stmt.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True})).lower()

    def test_list_by_account_covers_every_level_unless_hospital_only(self):
        account_id = uuid.uuid4()
        sql = self._list_sql(lambda repo: repo.list_by_account(account_id))

        assert f"activity.account_id = '{account_id}'" in sql
        assert "reminder.is_completed = false" in sql
        assert "activity.opportunity_id is null" not in sql
        assert "activity.project_id is null" not in sql

    def test_list_by_account_hospital_only_drops_opportunity_and_project_rows(self):
        sql = self._list_sql(lambda repo: repo.list_by_account(uuid.uuid4(), hospital_level_only=True))

        assert "activity.opportunity_id is null" in sql
        assert "activity.project_id is null" in sql

    def test_list_by_account_completed_flag_and_paging(self):
        sql = self._list_sql(
            lambda repo: repo.list_by_account(uuid.uuid4(), include_completed=True, offset=100, limit=25)
        )

        assert "reminder.is_completed = true" in sql
        assert "limit 25 offset 100" in sql

    def test_count_by_account_filters_like_the_list(self):
        account_id = uuid.uuid4()
        mock_db = MagicMock()
        mock_db.scalar.return_value = 7
        repo = ReminderRepository(mock_db)

        assert repo.count_by_account(account_id, hospital_level_only=True) == 7
        sql = str(
            mock_db.scalar.call_args.args[0].compile(
                dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}
            )
        ).lower()
        assert f"activity.account_id = '{account_id}'" in sql
        assert "activity.opportunity_id is null" in sql
        assert "activity.project_id is null" in sql

    def test_get_opportunity_status_code_joins_status(self):
        opp_id = uuid.uuid4()
        sql, _ = self._sql(lambda repo: repo.get_opportunity_status_code(opp_id))

        assert "select opportunity_status.status_code" in sql
        assert f"opportunity.id = '{opp_id}'" in sql

    def test_opportunity_created_on_account_since_filters_account_and_date(self):
        opp_id, account_id, closer_id = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
        sql, _ = self._sql(
            lambda repo: repo.opportunity_created_on_account_since(opp_id, account_id, START, created_by=closer_id)
        )

        assert f"opportunity.id = '{opp_id}'" in sql
        assert f"opportunity.account_id = '{account_id}'" in sql
        assert "opportunity.created_at >=" in sql
        assert f"opportunity.created_by = '{closer_id}'" in sql
