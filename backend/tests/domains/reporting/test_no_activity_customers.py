"""
Customer with No Activity (docs/Exception-Report-Implementation-Plan.md, D1-D15).

No real database here (none locally; the SQL function of migration 0065 is
only run on Dev after the merge -- that is the E2E's job). So:
  - the repository is run against a mocked DB and its statements asserted on
    (scope by role, zone filter, SBU handed to the function, empty results);
  - the service's 90-day rule, ordering and counts run on fed-in rows;
  - the migration's SQL text is checked for the rules it must carry (the real
    run happens at E2E).
"""

import uuid
from datetime import UTC, date, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.api.dependencies import get_current_user
from app.domains.organization.models import UserProfile
from app.domains.reporting.repository import _CONTACT_ACTIVITY_TYPES, ReportingRepository
from app.domains.reporting.router import _get_service
from app.domains.reporting.schemas import NoActivityCustomersResponse
from app.domains.reporting.service import ReportingService
from app.main import app

MIGRATION = (
    Path(__file__).resolve().parents[3] / "alembic" / "versions" / "0065_account_last_contact_lookup.py"
)


def _make_user(role_name: str, **overrides) -> MagicMock:
    defaults = {"id": uuid.uuid4(), "sbu_id": uuid.uuid4(), "zone_id": uuid.uuid4(), "manager_id": None}
    defaults.update(overrides)
    user = MagicMock(spec=UserProfile)
    for k, v in defaults.items():
        setattr(user, k, v)
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _compiled(stmt) -> str:
    return str(stmt.compile(compile_kwargs={"literal_binds": True}))


def _account(name: str, zone: str = "North Kerala", assets: int = 0) -> SimpleNamespace:
    return SimpleNamespace(
        account_id=uuid.uuid4(), account_name=name, zone_name=zone, installed_asset_count=assets
    )


def _lookup_row(account: SimpleNamespace, last_at=None, by=None, active=0) -> SimpleNamespace:
    return SimpleNamespace(
        account_id=account.account_id, last_contact_at=last_at, last_contact_by=by, active_opportunity_count=active
    )


def _run(current_user, accounts, lookup, **kwargs):
    """Returns (result rows, db mock). First execute = account list, second = the SQL function."""
    mock_db = MagicMock()
    mock_db.execute.side_effect = [
        MagicMock(all=MagicMock(return_value=accounts)),
        MagicMock(all=MagicMock(return_value=lookup)),
    ]
    rows = ReportingRepository(mock_db).no_activity_customers(current_user, **kwargs)
    return rows, mock_db


class TestRepositoryScope:
    def test_admin_sees_every_zone_and_counts_anyones_activity(self):
        acc = _account("Hospital A")
        _, db = _run(_make_user("Admin"), [acc], [_lookup_row(acc)])
        sql = _compiled(db.execute.call_args_list[0].args[0])
        assert "user_zone" not in sql
        assert db.execute.call_args_list[1].args[1]["sbu_id"] is None

    def test_general_manager_sees_every_zone(self):
        acc = _account("Hospital A")
        _, db = _run(_make_user("General Manager"), [acc], [_lookup_row(acc)])
        assert "user_zone" not in _compiled(db.execute.call_args_list[0].args[0])
        assert db.execute.call_args_list[1].args[1]["sbu_id"] is None

    def test_sbu_manager_sees_every_zone_but_counts_own_sbu(self):
        user = _make_user("SBU Manager")
        acc = _account("Hospital A")
        _, db = _run(user, [acc], [_lookup_row(acc)])
        assert "user_zone" not in _compiled(db.execute.call_args_list[0].args[0])
        assert db.execute.call_args_list[1].args[1]["sbu_id"] == str(user.sbu_id)

    def test_sales_staff_limited_to_own_zones_and_the_zones_below(self):
        user = _make_user("Sales Staff")
        acc = _account("Hospital A")
        _, db = _run(user, [acc], [_lookup_row(acc)])
        sql = _compiled(db.execute.call_args_list[0].args[0])
        assert "user_zone" in sql
        assert "zone_closure.descendant_zone_id" in sql
        assert user.id.hex in sql
        assert "manager_id" not in sql

    def test_area_manager_adds_the_teams_zones(self):
        user = _make_user("Area Manager")
        acc = _account("Hospital A")
        _, db = _run(user, [acc], [_lookup_row(acc)])
        sql = _compiled(db.execute.call_args_list[0].args[0])
        assert "user_zone" in sql
        assert "manager_id" in sql  # TEAM_SCOPE_BUILDERS["Area Manager"] reused for the team
        assert db.execute.call_args_list[1].args[1]["sbu_id"] == str(user.sbu_id)

    def test_zone_filter_narrows_to_that_zones_subtree(self):
        zone_id = uuid.uuid4()
        acc = _account("Hospital A")
        _, db = _run(_make_user("Admin"), [acc], [_lookup_row(acc)], zone_id=zone_id)
        sql = _compiled(db.execute.call_args_list[0].args[0])
        assert f"zone_closure.ancestor_zone_id = '{zone_id.hex}'" in sql

    def test_no_customer_type_filter_so_dealers_are_included(self):
        acc = _account("Dealer A")
        _, db = _run(_make_user("Admin"), [acc], [_lookup_row(acc)])
        assert "customer_type" not in _compiled(db.execute.call_args_list[0].args[0])

    def test_every_branch_is_its_own_line(self):
        # D11: no roll-up to the parent account -- the list is per account row.
        main, branch = _account("Aster Medcity"), _account("Aster Medcity - Branch")
        rows, db = _run(_make_user("Admin"), [main, branch], [_lookup_row(main), _lookup_row(branch)])
        assert "parent_account" not in _compiled(db.execute.call_args_list[0].args[0])
        assert [r["account_id"] for r in rows] == [main.account_id, branch.account_id]

    def test_installed_assets_counted_with_competitor_equipment(self):
        # D9: no is_competitor_equipment filter on the asset count.
        acc = _account("Hospital A")
        _, db = _run(_make_user("Admin"), [acc], [_lookup_row(acc)])
        sql = _compiled(db.execute.call_args_list[0].args[0])
        assert "installed_asset" in sql
        assert "is_competitor_equipment" not in sql


class TestRepositoryFunctionCall:
    def test_function_gets_the_contact_types_and_account_ids(self):
        acc = _account("Hospital A")
        _, db = _run(_make_user("Admin"), [acc], [_lookup_row(acc)])
        sql, params = db.execute.call_args_list[1].args
        assert "cabio_app_account_last_contact" in str(sql)
        assert params["types"] == list(_CONTACT_ACTIVITY_TYPES) == ["VISIT", "CALL", "MEETING", "EMAIL"]
        assert params["ids"] == [str(acc.account_id)]

    def test_merges_function_result_into_each_row(self):
        acc = _account("Hospital A", assets=3)
        last = datetime(2026, 7, 1, tzinfo=UTC)
        rows, _ = _run(_make_user("Admin"), [acc], [_lookup_row(acc, last, "Anil", active=2)])
        assert rows == [
            {
                "account_id": acc.account_id,
                "account_name": "Hospital A",
                "zone_name": "North Kerala",
                "installed_asset_count": 3,
                "last_contact_at": last,
                "last_contact_by": "Anil",
                "active_opportunity_count": 2,
            }
        ]

    def test_function_returning_nothing_gives_an_empty_list_not_all_never_contacted(self):
        acc = _account("Hospital A")
        rows, _ = _run(_make_user("Sales Staff"), [acc], [])
        assert rows == []

    def test_no_hospitals_in_scope_does_not_call_the_function(self):
        mock_db = MagicMock()
        mock_db.execute.return_value.all.return_value = []
        assert ReportingRepository(mock_db).no_activity_customers(_make_user("Sales Staff")) == []
        assert mock_db.execute.call_count == 1

    def test_rep_without_an_sbu_gets_nothing_and_no_query(self):
        mock_db = MagicMock()
        rows = ReportingRepository(mock_db).no_activity_customers(_make_user("Sales Staff", sbu_id=None))
        assert rows == []
        mock_db.execute.assert_not_called()


class TestRepositoryViewAs:
    def test_user_outside_the_viewers_team_gives_empty_list_without_listing_hospitals(self):
        mock_db = MagicMock()
        mock_db.scalars.return_value.first.return_value = None
        viewer = _make_user("Area Manager")
        rows = ReportingRepository(mock_db).no_activity_customers(viewer, user_id=uuid.uuid4())
        assert rows == []
        mock_db.execute.assert_not_called()
        # the lookup was fenced to the viewer's team
        sql = _compiled(mock_db.scalars.call_args.args[0])
        assert "manager_id" in sql

    def test_user_in_the_team_uses_that_persons_zones_and_sbu(self):
        rep = _make_user("Sales Staff")
        mock_db = MagicMock()
        mock_db.scalars.return_value.first.return_value = rep
        acc = _account("Hospital A")
        mock_db.execute.side_effect = [
            MagicMock(all=MagicMock(return_value=[acc])),
            MagicMock(all=MagicMock(return_value=[_lookup_row(acc)])),
        ]
        ReportingRepository(mock_db).no_activity_customers(_make_user("SBU Manager"), user_id=rep.id)
        sql = _compiled(mock_db.execute.call_args_list[0].args[0])
        assert "user_zone" in sql and rep.id.hex in sql
        assert mock_db.execute.call_args_list[1].args[1]["sbu_id"] == str(rep.sbu_id)

    def test_own_user_id_is_not_a_team_lookup(self):
        viewer = _make_user("Sales Staff")
        acc = _account("Hospital A")
        _, db = _run(viewer, [acc], [_lookup_row(acc)], user_id=viewer.id)
        db.scalars.assert_not_called()


class TestServiceRules:
    TODAY = date(2026, 11, 4)

    def _service(self, rows: list[dict], show_zone_picker: bool = False) -> ReportingService:
        repo = MagicMock()
        repo.no_activity_customers.return_value = rows
        repo.show_no_activity_zone_picker.return_value = show_zone_picker
        repo.no_activity_caption.return_value = {"sbu_name": "Imaging", "counts_all_sbus": False}
        return ReportingService(repository=repo)

    @staticmethod
    def _row(name: str, last_at: datetime | None, **kw) -> dict:
        return {
            "account_id": uuid.uuid4(),
            "account_name": name,
            "zone_name": "North Kerala",
            "installed_asset_count": kw.get("assets", 0),
            "last_contact_at": last_at,
            "last_contact_by": "Anil" if last_at else None,
            "active_opportunity_count": kw.get("active", 0),
        }

    def _call(self, rows: list[dict]):
        with patch("app.domains.reporting.service.today_ist", return_value=self.TODAY):
            return self._service(rows).no_activity_customers(_make_user("Admin"))

    def test_90_days_is_quiet_89_is_not(self):
        rows = [
            self._row("Exactly 90", datetime(2026, 8, 6, 6, 0, tzinfo=UTC)),  # 6 Aug IST -> 90 days
            self._row("Only 89", datetime(2026, 8, 7, 6, 0, tzinfo=UTC)),
        ]
        result = self._call(rows)
        assert [r.account_name for r in result.rows] == ["Exactly 90"]
        assert result.rows[0].days_silent == 90
        assert result.threshold_days == 90

    def test_days_are_counted_on_the_ist_calendar_day(self):
        # 19:00 UTC on 6 Aug is 00:30 IST on 7 Aug -> 89 days, not quiet.
        result = self._call([self._row("Late evening", datetime(2026, 8, 6, 19, 0, tzinfo=UTC))])
        assert result.rows == []

    def test_gone_quiet_longest_first_then_never_contacted(self):
        rows = [
            self._row("Never B", None),
            self._row("Quiet 100", datetime(2026, 7, 27, tzinfo=UTC)),
            self._row("Never A", None),
            self._row("Quiet 200", datetime(2026, 4, 18, tzinfo=UTC)),
            self._row("Recent", datetime(2026, 10, 30, tzinfo=UTC)),
        ]
        result = self._call(rows)
        assert [r.account_name for r in result.rows] == ["Quiet 200", "Quiet 100", "Never A", "Never B"]
        assert result.gone_quiet_count == 2
        assert result.never_contacted_count == 2

    def test_never_contacted_row_has_no_date_who_or_days(self):
        result = self._call([self._row("Never", None, assets=4, active=1)])
        row = result.rows[0]
        assert (row.last_contact_date, row.last_contact_by, row.days_silent) == (None, None, None)
        assert (row.installed_asset_count, row.active_opportunity_count) == (4, 1)

    def test_last_contact_date_is_the_ist_day(self):
        result = self._call([self._row("Quiet", datetime(2026, 7, 1, 20, 0, tzinfo=UTC))])  # 2 Jul 01:30 IST
        assert result.rows[0].last_contact_date == date(2026, 7, 2)

    def test_empty_when_repository_has_nothing(self):
        result = self._call([])
        assert (result.rows, result.gone_quiet_count, result.never_contacted_count) == ([], 0, 0)

    def test_zone_picker_flag_comes_from_the_repository_for_the_viewer(self):
        viewer = _make_user("Sales Staff")
        for flag in (True, False):
            service = self._service([], show_zone_picker=flag)
            assert service.no_activity_customers(viewer).show_zone_picker is flag
            service.repository.show_no_activity_zone_picker.assert_called_once_with(viewer)


class TestCaption:
    """D16: the line above the tiles -- hospitals in view, whose contacts count,
    which zones the viewer's list covers."""

    @staticmethod
    def _repo_caption(subject_role: str, *, sbu_name="Imaging", sbu_id="keep", picked=False):
        subject = _make_user(subject_role)
        if sbu_id is None:
            subject.sbu_id = None
        subject.sbu = SimpleNamespace(name=sbu_name) if sbu_name else None
        mock_db = MagicMock()
        mock_db.scalars.return_value.first.return_value = subject
        viewer = subject if not picked else _make_user("General Manager")
        return ReportingRepository(mock_db).no_activity_caption(viewer, subject.id if picked else None)

    def test_hospitals_in_view_counts_every_hospital_not_just_the_quiet_ones(self):
        rows = [TestServiceRules._row(f"H{i}", datetime(2026, 11, 1, tzinfo=UTC)) for i in range(3)]
        rows.append(TestServiceRules._row("Quiet", datetime(2026, 1, 1, tzinfo=UTC)))
        rows.append(TestServiceRules._row("Never", None))
        with patch("app.domains.reporting.service.today_ist", return_value=date(2026, 11, 4)):
            result = TestServiceRules()._service(rows).no_activity_customers(_make_user("Sales Staff"))
        assert result.hospitals_in_view == 5
        assert (result.gone_quiet_count, result.never_contacted_count) == (1, 1)

    def test_zone_scope_follows_the_viewers_role(self):
        expected = {
            "Admin": "all",
            "General Manager": "all",
            "SBU Manager": "all",
            "Area Manager": "own_and_team",
            "Sales Staff": "own",
        }
        for role, scope in expected.items():
            result = TestServiceRules()._service([]).no_activity_customers(_make_user(role))
            assert result.zone_scope == scope, role

    def test_caption_fields_come_from_the_repository_for_the_viewer_and_pick(self):
        viewer, picked = _make_user("General Manager"), uuid.uuid4()
        service = TestServiceRules()._service([])
        result = service.no_activity_customers(viewer, user_id=picked)
        assert (result.sbu_name, result.counts_all_sbus) == ("Imaging", False)
        service.repository.no_activity_caption.assert_called_once_with(viewer, picked)

    def test_sbu_manager_and_sales_staff_name_their_own_sbu(self):
        for role in ("SBU Manager", "Area Manager", "Sales Staff"):
            assert self._repo_caption(role) == {"sbu_name": "Imaging", "counts_all_sbus": False}, role

    def test_admin_and_gm_count_anyones_contact(self):
        for role in ("Admin", "General Manager"):
            assert self._repo_caption(role) == {"sbu_name": None, "counts_all_sbus": True}, role

    def test_gm_picking_a_rep_names_the_reps_sbu_not_all_sbus(self):
        assert self._repo_caption("Sales Staff", picked=True) == {"sbu_name": "Imaging", "counts_all_sbus": False}

    def test_refused_pick_gets_no_caption(self):
        mock_db = MagicMock()
        mock_db.scalars.return_value.first.return_value = None
        caption = ReportingRepository(mock_db).no_activity_caption(_make_user("Area Manager"), uuid.uuid4())
        assert caption == {"sbu_name": None, "counts_all_sbus": False}

    def test_user_without_an_sbu_gets_no_caption(self):
        assert self._repo_caption("Sales Staff", sbu_id=None) == {"sbu_name": None, "counts_all_sbus": False}


class TestZonePickerFlag:
    """D13: shown to anyone holding more than one zone, counting the zones below."""

    @staticmethod
    def _flag(user, zone_count):
        mock_db = MagicMock()
        mock_db.scalar.return_value = zone_count
        return ReportingRepository(mock_db).show_no_activity_zone_picker(user), mock_db

    def test_admin_gm_and_sbu_manager_always_get_it(self):
        for role in ("Admin", "General Manager", "SBU Manager"):
            flag, db = self._flag(_make_user(role), 0)
            assert flag is True
            db.scalar.assert_not_called()

    def test_one_zone_with_nothing_below_does_not(self):
        # e.g. someone holding only Mangalore, which has no zones below it
        assert self._flag(_make_user("Sales Staff"), 1)[0] is False

    def test_one_held_zone_with_zones_below_does(self):
        # e.g. someone holding only North Kerala: it plus its districts
        assert self._flag(_make_user("Sales Staff"), 6)[0] is True

    def test_no_zones_at_all_does_not(self):
        assert self._flag(_make_user("Sales Staff"), 0)[0] is False
        assert self._flag(_make_user("Sales Staff"), None)[0] is False

    def test_counts_the_viewers_own_zones_and_those_below_not_the_teams(self):
        user = _make_user("Area Manager")
        _, db = self._flag(user, 2)
        sql = _compiled(db.scalar.call_args.args[0])
        assert "user_zone" in sql
        assert "zone_closure.descendant_zone_id" in sql
        assert user.id.hex in sql
        assert "manager_id" not in sql


class TestZoneSearch:
    """The Zone picker once a Rep is picked: zones in the picked person's scope."""

    @staticmethod
    def _zone(name: str) -> SimpleNamespace:
        return SimpleNamespace(id=uuid.uuid4(), name=name)

    def _search(self, viewer, subject, scope_zone_ids=None, user_id=None):
        """subject None = the pick was refused. Returns (result, db, zone repo mock)."""
        mock_db = MagicMock()
        mock_db.scalars.side_effect = [
            MagicMock(first=MagicMock(return_value=subject)),
            MagicMock(all=MagicMock(return_value=scope_zone_ids or [])),
        ]
        with patch("app.domains.reporting.repository.ZoneRepository") as mock_zone_repo:
            repo = mock_zone_repo.return_value
            repo.search_by_name.return_value = [self._zone("Kollam")]
            repo.build_breadcrumb.return_value = "Kerala"
            result = ReportingRepository(mock_db).no_activity_zone_search(viewer, user_id or uuid.uuid4(), "Kol")
        return result, mock_db, repo

    def test_pick_outside_the_viewers_team_gets_nothing_and_searches_nothing(self):
        result, _, repo = self._search(_make_user("Area Manager"), None)
        assert result == []
        repo.search_by_name.assert_not_called()

    def test_picked_rep_searches_only_inside_their_zones(self):
        rep = _make_user("Sales Staff")
        held = [uuid.uuid4(), uuid.uuid4()]
        result, db, repo = self._search(_make_user("SBU Manager"), rep, scope_zone_ids=held, user_id=rep.id)
        assert repo.search_by_name.call_args.kwargs["within_zone_ids"] == held
        assert result[0]["name"] == "Kollam" and result[0]["path"] == "Kerala"
        # the scope is the picked person's, not the viewer's
        assert rep.id.hex in _compiled(db.scalars.call_args_list[1].args[0])

    def test_picked_area_manager_includes_their_team_zones(self):
        am = _make_user("Area Manager")
        _, db, _ = self._search(_make_user("General Manager"), am, scope_zone_ids=[uuid.uuid4()], user_id=am.id)
        sql = _compiled(db.scalars.call_args_list[1].args[0])
        assert "manager_id" in sql

    def test_picked_person_who_holds_every_zone_searches_all_zones(self):
        sbu_manager = _make_user("SBU Manager")
        _, _, repo = self._search(_make_user("Admin"), sbu_manager, user_id=sbu_manager.id)
        repo.search_by_name.assert_called_once_with("Kol")

    def test_picked_rep_with_no_zones_gets_nothing(self):
        rep = _make_user("Sales Staff")
        result, _, repo = self._search(_make_user("SBU Manager"), rep, scope_zone_ids=[], user_id=rep.id)
        assert result == []
        repo.search_by_name.assert_not_called()

    def test_service_returns_zone_search_results(self):
        zone_id = uuid.uuid4()
        repo = MagicMock(spec=ReportingRepository)
        repo.no_activity_zone_search.return_value = [{"id": zone_id, "name": "Kollam", "path": "Kerala"}]
        out = ReportingService(repository=repo).no_activity_zone_search(_make_user("Admin"), uuid.uuid4(), "Kol")
        assert [(z.id, z.name, z.path) for z in out] == [(zone_id, "Kollam", "Kerala")]


class TestEndpoint:
    def test_zone_search_params_reach_the_service(self):
        user_id, zone_id = uuid.uuid4(), uuid.uuid4()
        mock_service = MagicMock(spec=ReportingService)
        mock_service.no_activity_zone_search.return_value = [
            {"id": zone_id, "name": "Kollam", "path": "Kerala"}
        ]
        viewer = _make_user("Admin", is_active=True)
        app.dependency_overrides[get_current_user] = lambda: viewer
        app.dependency_overrides[_get_service] = lambda: mock_service
        from fastapi.testclient import TestClient

        try:
            response = TestClient(app).get(
                "/api/v1/reporting/no-activity-customers/zones", params={"q": "Kol", "user_id": str(user_id)}
            )
            too_short = TestClient(app).get(
                "/api/v1/reporting/no-activity-customers/zones", params={"q": "K", "user_id": str(user_id)}
            )
            no_user = TestClient(app).get("/api/v1/reporting/no-activity-customers/zones", params={"q": "Kol"})
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["data"] == [{"id": str(zone_id), "name": "Kollam", "path": "Kerala"}]
        assert mock_service.no_activity_zone_search.call_args.args[1:] == (user_id, "Kol")
        assert too_short.status_code == 422
        assert no_user.status_code == 422  # the person is always named; no silent "yourself"

    def test_query_params_reach_the_service(self):
        zone_id, user_id = uuid.uuid4(), uuid.uuid4()
        mock_service = MagicMock(spec=ReportingService)
        mock_service.no_activity_customers.return_value = NoActivityCustomersResponse(
            threshold_days=90,
            gone_quiet_count=0,
            never_contacted_count=0,
            show_zone_picker=True,
            hospitals_in_view=0,
            sbu_name="Imaging",
            counts_all_sbus=False,
            zone_scope="all",
            rows=[],
        )
        viewer = _make_user("Admin", is_active=True)
        app.dependency_overrides[get_current_user] = lambda: viewer
        app.dependency_overrides[_get_service] = lambda: mock_service
        from fastapi.testclient import TestClient

        try:
            response = TestClient(app).get(
                "/api/v1/reporting/no-activity-customers", params={"zone_id": str(zone_id), "user_id": str(user_id)}
            )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["data"] == {
            "threshold_days": 90, "gone_quiet_count": 0, "never_contacted_count": 0,
            "show_zone_picker": True, "hospitals_in_view": 0, "sbu_name": "Imaging",
            "counts_all_sbus": False, "zone_scope": "all", "rows": [],
        }
        assert mock_service.no_activity_customers.call_args.kwargs == {"zone_id": zone_id, "user_id": user_id}


class TestMigrationSqlText:
    """The rules the SQL function must carry; the real run is the E2E on Dev."""

    sql = MIGRATION.read_text(encoding="utf-8")

    def test_security_definer_read_only_with_fixed_search_path(self):
        assert "SECURITY DEFINER" in self.sql and "STABLE" in self.sql
        assert "SET search_path TO 'public'" in self.sql
        assert "INSERT" not in self.sql.upper().split("$$")[1]

    def test_future_dated_activity_does_not_count(self):  # D12
        assert "act.activity_date <= now()" in self.sql

    def test_activity_types_come_from_the_caller(self):  # D2
        assert "act.activity_type = ANY (p_contact_types)" in self.sql

    def test_accessory_only_opportunity_is_skipped_but_empty_one_counts(self):  # D7
        assert "p.product_type <> 'ACCESSORY'" in self.sql
        assert "oi.line_type <> 'BUYBACK'" in self.sql
        assert "act.opportunity_id IS NOT NULL" in self.sql

    def test_logger_must_be_in_the_sbu_or_have_none(self):  # D5
        assert "p_sbu_id IS NULL OR up.sbu_id IS NULL OR up.sbu_id = p_sbu_id" in self.sql

    def test_only_active_opportunities_counted_in_the_sbu(self):
        assert "os.status_code = 'ACTIVE'" in self.sql
        assert "p_sbu_id IS NULL OR o.sbu_id = p_sbu_id" in self.sql

    def test_sbu_gate_admin_gm_any_everyone_else_own_sbu_only(self):  # D15
        assert "cabio_app_role_name() IN ('Admin', 'General Manager')" in self.sql
        assert "p_sbu_id IS NOT NULL AND p_sbu_id = cabio_app_sbu_id()" in self.sql

    def test_downgrade_drops_the_function(self):
        assert "DROP FUNCTION IF EXISTS cabio_app_account_last_contact(uuid[], uuid, text[])" in self.sql
