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

from app.domains.activity.repository import ActivityRepository
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

    def test_area_manager_scoped_to_own_sbu_and_shared_zone_and_self(self):
        # Same shared TEAM_SCOPE_BUILDERS as organization/repository.py --
        # set-intersection over user_zone (Milestone 1), not scalar equality.
        current_user = _make_current_user("Area Manager")
        sql, _ = self._run(current_user)

        assert f"user_profile.sbu_id = '{current_user.sbu_id.hex}'" in sql
        assert "user_profile.id IN (SELECT user_zone.user_id" in sql
        assert f"user_zone.user_id = '{current_user.id.hex}'" in sql
        assert f"activity.user_id = '{current_user.id.hex}'" in sql
        assert "user_profile.zone_id" not in sql
        assert "user_profile.manager_id" not in sql

    def test_sales_manager_scoped_to_direct_reports_and_self(self):
        current_user = _make_current_user("Sales Manager")
        sql, _ = self._run(current_user)

        assert f"user_profile.manager_id = '{current_user.id.hex}'" in sql
        assert f"activity.user_id = '{current_user.id.hex}'" in sql
        assert "user_profile.sbu_id" not in sql
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
        # A Sales Manager narrowing to one report's activity should still
        # carry their own tier scope in the compiled WHERE -- narrowing
        # doesn't replace it.
        current_user = _make_current_user("Sales Manager")
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
