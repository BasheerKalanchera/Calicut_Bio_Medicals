"""
Sales Loss Report (docs/Sales-Loss-Report-Implementation-Plan.md).

As the other report tests do, the repository is run against a mocked DB and
the statement it builds is compiled to SQL text and checked; the service's
summaries run on fed-in rows. The query itself first runs on a real database
at the E2E.
"""

import uuid
from datetime import UTC, date, datetime
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.api.dependencies import get_current_user
from app.domains.organization.models import UserProfile
from app.domains.reporting.repository import ReportingRepository
from app.domains.reporting.router import _get_service
from app.domains.reporting.schemas import SalesLossResponse
from app.domains.reporting.service import ReportingService
from app.main import app


def _make_user(role_name: str) -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = uuid.uuid4()
    user.sbu_id = uuid.uuid4()
    user.manager_id = None
    user.is_active = True
    user.role = MagicMock(role_name=role_name)
    return user


def _sql(current_user: MagicMock, **kwargs) -> str:
    mock_db = MagicMock()
    mock_db.execute.return_value.all.return_value = []
    ReportingRepository(mock_db).sales_loss_report(current_user, **kwargs)
    stmt = mock_db.execute.call_args.args[0]
    return str(stmt.compile(compile_kwargs={"literal_binds": True}))


def _where(sql: str) -> str:
    return sql.rsplit("WHERE opportunity_status.status_code", 1)[1]


class TestWhoSeesWhat:
    @pytest.mark.parametrize("role", ["Admin", "General Manager"])
    def test_admin_and_general_manager_are_unrestricted(self, role):
        where = _where(_sql(_make_user(role)))
        assert "user_profile" not in where

    def test_sbu_manager_sees_own_sbu_and_self(self):
        user = _make_user("SBU Manager")
        where = _where(_sql(user))
        assert "user_profile.sbu_id" in where
        assert user.sbu_id.hex in where
        assert user.id.hex in where

    def test_area_manager_sees_team_and_self(self):
        user = _make_user("Area Manager")
        where = _where(_sql(user))
        assert "user_zone" in where
        assert "user_profile.manager_id" in where
        assert user.id.hex in where

    def test_rep_sees_only_their_own(self):
        user = _make_user("Sales Staff")
        where = _where(_sql(user))
        assert f"user_profile.id = '{user.id.hex}'" in where
        assert "user_profile.sbu_id" not in where
        assert "user_zone" not in where

    def test_owner_filter_narrows_the_scope(self):
        picked = uuid.uuid4()
        user = _make_user("Sales Staff")
        where = _where(_sql(user, user_id=picked))
        # Both: the rep's own scope still applies on top of the pick.
        assert user.id.hex in where
        assert picked.hex in where


class TestWhichOpportunities:
    def test_lost_only(self):
        assert "status_code = 'LOST'" in _sql(_make_user("Admin"))

    def test_opportunity_without_product_line_stays_listed(self):
        sql = _sql(_make_user("Admin"))
        assert "LEFT OUTER JOIN (SELECT opportunity_item.opportunity_id" in sql
        assert "LEFT OUTER JOIN loss_reason" in sql

    def test_value_is_product_lines_else_indicative_value(self):
        # D7, including its middle case: no product line, a typed value.
        sql = _sql(_make_user("Admin"))
        assert "coalesce(line_totals.total_lakhs, opportunity.indicative_value) AS value_lakhs" in sql
        assert "opportunity_item.line_type != 'BUYBACK'" in sql

    def test_newest_closed_first(self):
        assert "ORDER BY opportunity.closed_at DESC NULLS LAST" in _sql(_make_user("Admin"))


class TestFilters:
    def test_no_filters_by_default(self):
        where = _where(_sql(_make_user("Admin")))
        for column in ("closed_at >=", "closed_at <", "sbu_id =", "zone_id", "loss_reason_id ="):
            assert column not in where

    def test_period_is_by_closed_date(self):
        where = _where(
            _sql(
                _make_user("Admin"),
                period_start=datetime(2026, 10, 1, tzinfo=UTC),
                period_end=datetime(2027, 1, 1, tzinfo=UTC),
            )
        )
        assert "opportunity.closed_at >=" in where
        assert "opportunity.closed_at <" in where

    def test_zone_includes_the_zones_under_it(self):
        zone_id = uuid.uuid4()
        where = _where(_sql(_make_user("Admin"), zone_id=zone_id))
        assert "zone_closure.descendant_zone_id" in where
        assert f"zone_closure.ancestor_zone_id = '{zone_id.hex}'" in where

    def test_sbu_and_loss_reason(self):
        sbu_id, reason_id = uuid.uuid4(), uuid.uuid4()
        where = _where(_sql(_make_user("Admin"), sbu_id=sbu_id, loss_reason_id=reason_id))
        assert f"opportunity.sbu_id = '{sbu_id.hex}'" in where
        assert f"opportunity.loss_reason_id = '{reason_id.hex}'" in where


_PRICE, _COMPETITOR = uuid.uuid4(), uuid.uuid4()


def _row(reason_id=_PRICE, reason="Price", competitor=None, value="10.00", closed=None) -> SimpleNamespace:
    return SimpleNamespace(
        opportunity_id=uuid.uuid4(),
        opportunity_name="Ultrasound",
        account_name="Test Hospital",
        owner_name="Test Rep",
        stage_name="Negotiation",
        loss_reason_id=reason_id,
        loss_reason=reason,
        competitor_name=competitor,
        competitor_product_name=None,
        value_lakhs=None if value is None else Decimal(value),
        closed_date=closed or datetime(2026, 11, 20, 6, 0, tzinfo=UTC),
    )


def _lost_to(competitor: str) -> SimpleNamespace:
    return _row(reason_id=_COMPETITOR, reason="Competitor Won", competitor=competitor)


def _report(rows) -> SalesLossResponse:
    repository = MagicMock(spec=ReportingRepository)
    repository.sales_loss_report.return_value = rows
    return ReportingService(repository=repository).sales_loss_report(_make_user("Admin"))


class TestSummaries:
    def test_empty(self):
        result = _report([])
        assert (result.rows, result.by_loss_reason, result.by_competitor) == ([], [], [])

    def test_count_and_value_by_loss_reason_most_losses_first(self):
        result = _report([_lost_to("SonoScape"), _row(value="5.00"), _row(value=None)])
        assert [(s.loss_reason, s.opportunity_count, s.value_lakhs) for s in result.by_loss_reason] == [
            ("Price", 2, Decimal("5.00")),
            ("Competitor Won", 1, Decimal("10.00")),
        ]

    def test_no_value_at_all_is_not_shown_as_zero(self):
        result = _report([_row(value=None)])
        assert result.rows[0].value_lakhs is None
        assert result.by_loss_reason[0].value_lakhs is None

    def test_lost_without_a_reason_is_still_counted(self):
        result = _report([_row(reason_id=None, reason=None)])
        assert result.by_loss_reason[0].loss_reason is None
        assert result.by_loss_reason[0].opportunity_count == 1

    def test_competitor_names_grouped_ignoring_capitals_and_spaces(self):
        names = ["sonoscape ", "SonoScape  India", "SonoScape", " SONOSCAPE", "SonoScape"]
        result = _report([_lost_to(name) for name in names])
        assert [(s.competitor_name, s.opportunity_count, s.value_lakhs) for s in result.by_competitor] == [
            ("SonoScape", 4, Decimal("40.00")),
            ("SonoScape India", 1, Decimal("10.00")),
        ]
        assert [r.competitor_key for r in result.rows] == [
            "sonoscape", "sonoscape india", "sonoscape", "sonoscape", "sonoscape",
        ]

    def test_only_named_competitors_are_listed(self):
        result = _report([_row(), _row(competitor="   ")])
        assert result.by_competitor == []
        assert [r.competitor_key for r in result.rows] == [None, None]

    def test_closed_date_is_the_ist_day(self):
        result = _report([_row(closed=datetime(2026, 11, 20, 20, 0, tzinfo=UTC))])
        assert result.rows[0].closed_date == date(2026, 11, 21)


class TestSalesLossEndpoint:
    def _get(self, client, query: str) -> MagicMock:
        service = MagicMock(spec=ReportingService)
        service.sales_loss_report.return_value = SalesLossResponse(by_loss_reason=[], by_competitor=[], rows=[])
        app.dependency_overrides[get_current_user] = lambda: _make_user("Admin")
        app.dependency_overrides[_get_service] = lambda: service
        try:
            response = client.get(f"/api/v1/reporting/sales-loss{query}")
        finally:
            app.dependency_overrides.clear()
        assert response.status_code == 200
        assert response.json()["data"] == {"by_loss_reason": [], "by_competitor": [], "rows": []}
        return service.sales_loss_report

    def test_defaults_to_no_filters(self, client):
        called = self._get(client, "")
        assert set(called.call_args.kwargs.values()) == {None}

    def test_filters_reach_the_service_with_the_last_day_included(self, client):
        ids = {k: uuid.uuid4() for k in ("sbu_id", "zone_id", "user_id", "loss_reason_id")}
        query = "&".join(f"{k}={v}" for k, v in ids.items())
        called = self._get(client, f"?{query}&period_start=2026-10-01&period_end=2026-12-31")
        kwargs = called.call_args.kwargs
        assert {k: kwargs[k] for k in ids} == ids
        assert kwargs["period_start"].isoformat() == "2026-10-01T00:00:00+05:30"
        assert kwargs["period_end"].isoformat() == "2027-01-01T00:00:00+05:30"
