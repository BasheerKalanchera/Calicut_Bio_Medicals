import uuid
from unittest.mock import MagicMock

from app.domains.organization.models import UserProfile
from app.domains.organization.repository import UserRepository


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


def _compiled_where(mock_db: MagicMock) -> str:
    stmt = mock_db.scalars.call_args.args[0]
    if stmt.whereclause is None:
        return ""
    return str(stmt.whereclause.compile(compile_kwargs={"literal_binds": True}))


class TestListActive:
    def _run(self, current_user: MagicMock) -> tuple[str, MagicMock]:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.all.return_value = []

        repo = UserRepository(mock_db)
        repo.list_active(current_user)

        sql = _compiled_where(mock_db)
        return sql, mock_db

    def test_admin_is_unrestricted(self):
        current_user = _make_current_user("Admin")
        sql, _ = self._run(current_user)

        assert "is_active" in sql
        assert "sbu_id" not in sql
        assert "zone_id" not in sql
        assert "manager_id" not in sql
        assert "role_id" not in sql

    def test_general_manager_is_unrestricted(self):
        current_user = _make_current_user("General Manager")
        sql, _ = self._run(current_user)

        assert "sbu_id" not in sql
        assert "zone_id" not in sql
        assert "manager_id" not in sql
        assert "role_id" not in sql

    def test_sbu_manager_scoped_to_own_sbu_and_self(self):
        current_user = _make_current_user("SBU Manager")
        sql, _ = self._run(current_user)

        assert f"user_profile.sbu_id = '{current_user.sbu_id.hex}'" in sql
        assert f"user_profile.id = '{current_user.id.hex}'" in sql
        assert "zone_id" not in sql
        assert "manager_id" not in sql
        self._assert_excludes_unrestricted_roles(sql)

    def test_area_manager_scoped_to_own_sbu_and_zone_and_self(self):
        current_user = _make_current_user("Area Manager")
        sql, _ = self._run(current_user)

        assert f"user_profile.sbu_id = '{current_user.sbu_id.hex}'" in sql
        assert f"user_profile.zone_id = '{current_user.zone_id.hex}'" in sql
        assert f"user_profile.id = '{current_user.id.hex}'" in sql
        assert "manager_id" not in sql
        self._assert_excludes_unrestricted_roles(sql)

    def test_sales_manager_scoped_to_direct_reports_and_self(self):
        current_user = _make_current_user("Sales Manager")
        sql, _ = self._run(current_user)

        assert f"user_profile.manager_id = '{current_user.id.hex}'" in sql
        assert f"user_profile.id = '{current_user.id.hex}'" in sql
        assert "sbu_id" not in sql
        assert "zone_id" not in sql
        self._assert_excludes_unrestricted_roles(sql)

    def test_sales_staff_scoped_to_self_only(self):
        current_user = _make_current_user("Sales Staff")
        sql, _ = self._run(current_user)

        assert f"user_profile.id = '{current_user.id.hex}'" in sql
        assert "sbu_id" not in sql
        assert "zone_id" not in sql
        assert "manager_id" not in sql
        self._assert_excludes_unrestricted_roles(sql)

    def test_unknown_role_scoped_to_self_only(self):
        current_user = _make_current_user("Some Future Role")
        sql, _ = self._run(current_user)

        assert f"user_profile.id = '{current_user.id.hex}'" in sql
        assert "sbu_id" not in sql
        assert "zone_id" not in sql
        assert "manager_id" not in sql
        self._assert_excludes_unrestricted_roles(sql)

    @staticmethod
    def _assert_excludes_unrestricted_roles(sql: str) -> None:
        assert "user_profile.role_id NOT IN" in sql
        assert "role.role_name IN" in sql
        assert "'Admin'" in sql
        assert "'General Manager'" in sql

    def test_returns_repository_results_and_total(self):
        current_user = _make_current_user("Admin")
        record = MagicMock()
        mock_db = MagicMock()
        mock_db.scalar.return_value = 3
        mock_db.scalars.return_value.all.return_value = [record]

        repo = UserRepository(mock_db)
        results, total = repo.list_active(current_user, offset=5, limit=10)

        assert results == [record]
        assert total == 3

    def test_scope_all_ignores_role_entirely(self):
        """Next Action assignee picker: any active user, regardless of tier."""
        current_user = _make_current_user("Sales Staff")
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.all.return_value = []

        repo = UserRepository(mock_db)
        repo.list_active(current_user, scope="all")

        sql = _compiled_where(mock_db)
        assert "is_active" in sql
        assert "sbu_id" not in sql
        assert "zone_id" not in sql
        assert "role_id" not in sql

    def test_scope_sbu_matches_caller_own_sbu_any_zone(self):
        """Split participant picker (BR-FIN-06): same SBU as the caller, any zone, any tier."""
        current_user = _make_current_user("Sales Staff")
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.all.return_value = []

        repo = UserRepository(mock_db)
        repo.list_active(current_user, scope="sbu")

        sql = _compiled_where(mock_db)
        assert f"user_profile.sbu_id = '{current_user.sbu_id.hex}'" in sql
        assert "zone_id" not in sql
        assert f"user_profile.id = '{current_user.id.hex}'" in sql
        assert "manager_id" not in sql
        self._assert_excludes_unrestricted_roles(sql)
