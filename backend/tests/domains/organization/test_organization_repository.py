import uuid
from unittest.mock import MagicMock

from app.domains.organization.models import UserProfile, UserZone
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

    def test_area_manager_scoped_to_own_sbu_and_shared_zone_and_self(self):
        # Set-intersection over user_zone (Milestone 1), not scalar zone_id
        # equality: a candidate is in scope if they share at least one zone
        # with the caller. Still holds unchanged after the closure-based
        # rewrite (Zone Hierarchy, migration 0019) -- see the dedicated
        # closure test below for what actually changed.
        current_user = _make_current_user("Area Manager")
        sql, _ = self._run(current_user)

        assert f"user_profile.sbu_id = '{current_user.sbu_id.hex}'" in sql
        assert "user_profile.id IN (SELECT user_zone.user_id" in sql
        assert "FROM user_zone" in sql
        assert f"user_zone.user_id = '{current_user.id.hex}'" in sql
        assert f"user_profile.id = '{current_user.id.hex}'" in sql
        assert "user_profile.zone_id" not in sql
        assert "manager_id" not in sql
        self._assert_excludes_unrestricted_roles(sql)

    def test_area_manager_scope_routes_through_zone_closure(self):
        # Proves the rewrite genuinely happened -- a candidate's own zone
        # must be a *descendant* (via zone_closure) of any zone the caller
        # is responsible for, not just a scalar/flat match. This is what
        # lets a caller assigned to a State-level zone see candidates in a
        # District several levels down; zone_closure includes a self-row
        # per zone, so a childless zone still matches exactly as before --
        # a strict superset, not a divergent code path (Zone-Hierarchy-
        # Technical-Design.md SS4). Can't prove the multi-level semantics
        # end-to-end here (that needs real zone_closure rows against a real
        # Postgres connection -- manual verification's job, same caveat as
        # every RLS-adjacent test this session); this just confirms the
        # query shape actually routes through the table, not a coincidence.
        current_user = _make_current_user("Area Manager")
        sql, _ = self._run(current_user)

        assert "zone_closure" in sql
        assert "ancestor_zone_id" in sql
        assert "descendant_zone_id" in sql
        assert "user_zone.zone_id IN (SELECT zone_closure.descendant_zone_id" in sql

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

    def test_scope_sbu_ignores_admin_placeholder_sbu(self):
        """Admin/GM's own sbu_id is a NOT-NULL placeholder, not a real SBU
        membership -- comparing candidates against it would wrongly restrict
        the split-participant picker to whichever SBU happens to be on the
        caller's placeholder row. BR-FIN-06 is enforced server-side against
        the opportunity's sbu_id in replace_splits, not the caller's."""
        current_user = _make_current_user("Admin")
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.all.return_value = []

        repo = UserRepository(mock_db)
        repo.list_active(current_user, scope="sbu")

        sql = _compiled_where(mock_db)
        assert f"user_profile.sbu_id = '{current_user.sbu_id.hex}'" not in sql
        assert f"user_profile.id = '{current_user.id.hex}'" not in sql
        self._assert_excludes_unrestricted_roles(sql)


class TestReplaceZones:
    """Mirrors how OpportunityRepository.replace_splits's delete-then-reinsert
    shape is exercised: mocked db, assert the delete/add/flush sequence and
    the re-query used to build the returned list."""

    def test_deletes_then_reinserts_and_returns_fresh_rows(self):
        user = MagicMock(spec=UserProfile)
        user.id = uuid.uuid4()
        zone_a, zone_b = uuid.uuid4(), uuid.uuid4()
        fresh_rows = [MagicMock(spec=UserZone), MagicMock(spec=UserZone)]

        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = fresh_rows

        repo = UserRepository(mock_db)
        result = repo.replace_zones(user, [zone_a, zone_b])

        # delete-then-reinsert: one DELETE, one add() per new zone_id
        delete_stmt = mock_db.execute.call_args.args[0]
        assert str(delete_stmt.table) == "user_zone"
        assert mock_db.add.call_count == 2
        added = [call.args[0] for call in mock_db.add.call_args_list]
        assert {row.zone_id for row in added} == {zone_a, zone_b}
        assert all(row.user_id == user.id for row in added)

        mock_db.flush.assert_called_once()
        # Stale-collection guard: the already-loaded (selectin) user.zones
        # must be expired, not left holding pre-replace data.
        mock_db.expire.assert_called_once_with(user, ["zones"])

        assert result == fresh_rows

    def test_empty_zone_ids_clears_all_assignments(self):
        user = MagicMock(spec=UserProfile)
        user.id = uuid.uuid4()

        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = []

        repo = UserRepository(mock_db)
        result = repo.replace_zones(user, [])

        mock_db.add.assert_not_called()
        mock_db.flush.assert_called_once()
        assert result == []
