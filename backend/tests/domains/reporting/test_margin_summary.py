"""
Margin Report (docs/Margin-Report-Implementation-Plan.md): who may see it
(D9), how the figures are worked out (D3, D6, D15, D20), the period
bounds, and what the three queries read. The worked figures are the E2E
plan's section A (made-up test costs).
"""

import uuid
from datetime import date, datetime
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.api.dependencies import get_current_user
from app.core.exceptions import AuthorizationError
from app.core.periods import IST
from app.domains.organization.models import UserProfile
from app.domains.reporting.repository import ReportingRepository
from app.domains.reporting.router import _get_service
from app.domains.reporting.service import ReportingService
from app.main import app

ALLOWED_ROLES = ["General Manager", "Admin"]
REFUSED_ROLES = ["SBU Manager", "Area Manager", "Sales Staff", "Marketing User"]


def _user(role_name: str) -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = uuid.uuid4()
    user.is_active = True
    user.sbu_id = uuid.uuid4()
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _group(name, *, lines, quantity, sold, cost, filled=0, group_id=None):
    return SimpleNamespace(
        group_id=group_id or name, group_name=name, line_count=lines, quantity=quantity,
        sold_for_lakhs=Decimal(sold), cost_lakhs=Decimal(cost), filled_later_line_count=filled,
    )


E2 = _group("E2", lines=3, quantity=3, sold="19", cost="15", filled=3)
S50 = _group("S50", lines=1, quantity=1, sold="29", cost="20", filled=1)


def _repo(rows=(), missing=(), trade_in="0") -> MagicMock:
    repo = MagicMock(spec=ReportingRepository)
    repo.margin_summary.return_value = list(rows)
    repo.margin_missing_cost.return_value = list(missing)
    repo.margin_trade_in_total.return_value = Decimal(trade_in)
    return repo


def _summary(repo, group_by="product", role="General Manager", **kwargs):
    return ReportingService(repository=repo).margin_summary(_user(role), group_by, **kwargs)


def _figures(r):
    return (r.quantity, r.sold_for_lakhs, r.cost_lakhs, r.margin_lakhs, r.margin_percent)


class TestWhoMaySee:
    @pytest.mark.parametrize("role", ALLOWED_ROLES)
    def test_gm_and_admin_get_the_report(self, role):
        assert _summary(_repo([E2]), role=role).rows

    @pytest.mark.parametrize("role", REFUSED_ROLES)
    def test_every_other_role_is_refused_before_any_query(self, role):
        repo = _repo([E2])
        with pytest.raises(AuthorizationError, match="General Manager and Admin"):
            _summary(repo, role=role)
        assert repo.method_calls == []


class TestFigures:
    def test_rows(self):
        rows = _summary(_repo([E2, S50])).rows
        assert _figures(rows[0]) == (3, Decimal(19), Decimal(15), Decimal(4), Decimal("21.1"))
        assert _figures(rows[1]) == (1, Decimal(29), Decimal(20), Decimal(9), Decimal("31.0"))
        assert rows[1].filled_later_line_count == 1

    def test_totals_add_up_the_rows(self):
        totals = _summary(_repo([E2, S50])).totals
        assert _figures(totals) == (4, Decimal(48), Decimal(35), Decimal(13), Decimal("27.1"))
        assert totals.filled_later_line_count == 4

    def test_sold_below_cost_is_a_negative_margin(self):
        loss = _group("X", lines=1, quantity=1, sold="8", cost="10")
        row = _summary(_repo([loss])).rows[0]
        assert (row.margin_lakhs, row.margin_percent) == (Decimal(-2), Decimal("-25.0"))

    def test_sold_for_nothing_has_a_margin_but_no_percent(self):
        free = _group("X", lines=1, quantity=1, sold="0", cost="3")
        row = _summary(_repo([free])).rows[0]
        assert (row.margin_lakhs, row.margin_percent) == (Decimal(-3), None)

    def test_nothing_won_gives_empty_rows_and_zero_totals(self):
        report = _summary(_repo())
        assert report.rows == []
        assert report.missing_cost == []
        assert _figures(report.totals) == (0, Decimal(0), Decimal(0), Decimal(0), None)
        assert report.trade_in_lakhs == Decimal(0)

    def test_missing_cost_list_and_trade_ins_are_passed_through(self):
        missing = SimpleNamespace(
            product_id=uuid.uuid4(), product_name="E1", sale_count=1, sold_for_lakhs=Decimal(5)
        )
        report = _summary(_repo([E2], missing=[missing], trade_in="2"))
        assert [(m.product_name, m.sale_count, m.sold_for_lakhs) for m in report.missing_cost] == [
            ("E1", 1, Decimal(5))
        ]
        assert report.trade_in_lakhs == Decimal(2)
        # D6, D20: trade-ins and sales without a cost stay out of the totals.
        assert report.totals.sold_for_lakhs == Decimal(19)

    def test_zone_rows_roll_up_and_totals_are_not_double_counted(self):
        kerala, north = uuid.uuid4(), uuid.uuid4()
        repo = _repo([
            _group("North Kerala", group_id=str(north), lines=1, quantity=1, sold="29", cost="20"),
        ])
        repo.zone_tree.return_value = [
            SimpleNamespace(id=kerala, name="Kerala", parent_zone_id=None),
            SimpleNamespace(id=north, name="North Kerala", parent_zone_id=kerala),
        ]
        report = _summary(repo, "zone")
        assert [(r.depth, r.group_name, r.quantity, r.margin_lakhs) for r in report.rows] == [
            (0, "Kerala", 1, Decimal(9)),
            (1, "North Kerala", 1, Decimal(9)),
        ]
        assert _figures(report.totals) == (1, Decimal(29), Decimal(20), Decimal(9), Decimal("31.0"))

    def test_filters_reach_all_three_queries(self):
        repo = _repo()
        filters = {
            "sbu_id": uuid.uuid4(), "zone_id": uuid.uuid4(), "user_id": uuid.uuid4(),
            "period_start": datetime(2026, 10, 1, tzinfo=IST), "period_end": datetime(2027, 1, 1, tzinfo=IST),
        }
        _summary(repo, **filters)
        for query in (repo.margin_summary, repo.margin_missing_cost, repo.margin_trade_in_total):
            assert query.call_args.kwargs == filters


def _statement(method: str, *args, **kwargs) -> str:
    db = MagicMock()
    getattr(ReportingRepository(db), method)(_user("Admin"), *args, **kwargs)
    return str(db.execute.call_args.args[0].compile(compile_kwargs={"literal_binds": True}))


QUERIES = [("margin_summary", ("product",)), ("margin_missing_cost", ()), ("margin_trade_in_total", ())]


class TestQueries:
    @pytest.mark.parametrize(("method", "args"), QUERIES)
    def test_won_only_and_closed_date_inside_the_period(self, method, args):
        sql = _statement(
            method, *args,
            period_start=datetime(2026, 10, 1, tzinfo=IST), period_end=datetime(2027, 1, 1, tzinfo=IST),
        )
        assert "status_code = 'WON'" in sql
        assert "opportunity.closed_at >= '2026-10-01" in sql
        assert "opportunity.closed_at < '2027-01-01" in sql

    @pytest.mark.parametrize(("method", "args"), QUERIES)
    def test_all_time_has_no_date_filter(self, method, args):
        sql = _statement(method, *args)
        assert "closed_at >=" not in sql
        assert "closed_at <" not in sql

    def test_summary_reads_the_saved_cost_not_the_catalog_cost(self):
        sql = _statement("margin_summary", "product")
        assert "opportunity_item.cost_at_won_lakhs" in sql
        assert "product.cost_lakhs" not in sql
        assert "line_type = 'PRODUCT'" in sql

    def test_summary_counts_only_lines_with_a_saved_cost(self):
        sql = _statement("margin_summary", "product")
        assert "opportunity_item.cost_at_won_lakhs IS NOT NULL" in sql

    @pytest.mark.parametrize("group_by", ["product", "brand", "sbu", "zone", "rep"])
    def test_every_grouping_builds(self, group_by):
        assert "GROUP BY" in _statement("margin_summary", group_by)

    def test_missing_cost_lists_only_uncosted_product_lines(self):
        sql = _statement("margin_missing_cost")
        assert "opportunity_item.cost_at_won_lakhs IS NULL" in sql
        assert "line_type = 'PRODUCT'" in sql

    def test_trade_in_total_reads_only_buyback_lines(self):
        assert "line_type = 'BUYBACK'" in _statement("margin_trade_in_total")


class TestEndpoint:
    def _get(self, client, role, repo, query=""):
        app.dependency_overrides[get_current_user] = lambda: _user(role)
        app.dependency_overrides[_get_service] = lambda: ReportingService(repository=repo)
        try:
            return client.get(f"/api/v1/reporting/margin-summary{query}")
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.parametrize("role", REFUSED_ROLES)
    def test_refused_roles_get_403_and_no_figures(self, client, role):
        response = self._get(client, role, _repo([E2]))
        assert response.status_code == 403
        assert "cost_lakhs" not in response.text

    def test_default_grouping_and_period_bounds(self, client):
        repo = _repo([E2])
        response = self._get(
            client, "Admin", repo,
            f"?period_start={date(2026, 10, 1)}&period_end={date(2026, 12, 31)}",
        )
        assert response.status_code == 200
        body = response.json()["data"]
        assert body["group_by"] == "product"
        assert body["rows"][0]["margin_percent"] == "21.1"
        kwargs = repo.margin_summary.call_args.kwargs
        # period_end is inclusive: the bound is the next IST midnight.
        assert kwargs["period_start"] == datetime(2026, 10, 1, tzinfo=IST)
        assert kwargs["period_end"] == datetime(2027, 1, 1, tzinfo=IST)

    def test_unknown_grouping_rejected(self, client):
        assert self._get(client, "Admin", _repo(), "?group_by=stage").status_code == 422

    def test_requires_login(self, client):
        assert client.get("/api/v1/reporting/margin-summary").status_code == 401
