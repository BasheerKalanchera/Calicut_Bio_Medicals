"""
ReportingService.overdue_actions's team-rollup gate -- the one piece of real
business logic in this domain's service layer (everything else is a thin
pass-through to ReportingRepository). Resolved 2026-08-25,
Insights-Dashboard-Implementation-Plan.md Open questions §3: an individual
contributor (no TEAM_SCOPE_BUILDERS entry, not unrestricted) already sees
their own overdue count on the login bell, so this tile is empty for them --
not a 403, just nothing to add.
"""

import uuid
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock

from app.domains.organization.models import UserProfile
from app.domains.reporting.repository import ReportingRepository
from app.domains.reporting.service import ReportingService


def _make_current_user(role_name: str) -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = uuid.uuid4()
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


class TestOverdueActionsTeamGate:
    def test_sales_staff_gets_empty_result_without_querying(self):
        mock_repo = MagicMock(spec=ReportingRepository)
        service = ReportingService(repository=mock_repo)

        result = service.overdue_actions(_make_current_user("Sales Staff"))

        assert result.rows == []
        assert result.total_overdue == 0
        mock_repo.overdue_actions.assert_not_called()

    def test_sbu_manager_gets_real_query(self):
        mock_repo = MagicMock(spec=ReportingRepository)
        mock_repo.overdue_actions.return_value = []
        service = ReportingService(repository=mock_repo)

        service.overdue_actions(_make_current_user("SBU Manager"))

        mock_repo.overdue_actions.assert_called_once()

    def test_admin_gets_real_query(self):
        mock_repo = MagicMock(spec=ReportingRepository)
        mock_repo.overdue_actions.return_value = []
        service = ReportingService(repository=mock_repo)

        service.overdue_actions(_make_current_user("Admin"))

        mock_repo.overdue_actions.assert_called_once()

    def test_total_overdue_sums_across_rows(self):
        mock_repo = MagicMock(spec=ReportingRepository)
        mock_repo.overdue_actions.return_value = [
            MagicMock(user_id=uuid.uuid4(), display_name="Rep One", overdue_count=3),
            MagicMock(user_id=uuid.uuid4(), display_name="Rep Two", overdue_count=5),
        ]
        service = ReportingService(repository=mock_repo)

        result = service.overdue_actions(_make_current_user("Admin"))

        assert result.total_overdue == 8


class TestSalesHeadlineDerivedFields:
    """win_rate and avg_deal_size_lakhs are computed here, not in SQL --
    the repository only ever hands back the raw won_count/lost_count/
    revenue_lakhs it can aggregate safely."""

    def test_win_rate_and_avg_deal_size(self):
        mock_repo = MagicMock(spec=ReportingRepository)
        mock_repo.sales_headline.return_value = MagicMock(
            revenue_lakhs=Decimal("100.00"), won_count=4, lost_count=1
        )
        service = ReportingService(repository=mock_repo)

        result = service.sales_headline(_make_current_user("Admin"))

        assert result.win_rate == Decimal("0.8")  # 4 won / (4 won + 1 lost)
        assert result.avg_deal_size_lakhs == Decimal("25.00")  # 100.00 / 4

    def test_no_closed_deals_does_not_divide_by_zero(self):
        mock_repo = MagicMock(spec=ReportingRepository)
        mock_repo.sales_headline.return_value = MagicMock(
            revenue_lakhs=Decimal("0"), won_count=0, lost_count=0
        )
        service = ReportingService(repository=mock_repo)

        result = service.sales_headline(_make_current_user("Admin"))

        assert result.win_rate == Decimal(0)
        assert result.avg_deal_size_lakhs == Decimal(0)

    def test_all_lost_no_wins(self):
        mock_repo = MagicMock(spec=ReportingRepository)
        mock_repo.sales_headline.return_value = MagicMock(
            revenue_lakhs=Decimal("0"), won_count=0, lost_count=3
        )
        service = ReportingService(repository=mock_repo)

        result = service.sales_headline(_make_current_user("Admin"))

        assert result.win_rate == Decimal(0)
        assert result.avg_deal_size_lakhs == Decimal(0)


# --- Zone tree (docs/Zone-Tree-In-Reports-Implementation-Plan.md) ---------


_KERALA, _NORTH, _SOUTH, _MALAPPURAM, _KANNUR, _ERNAKULAM, _KARNATAKA, _BANGALORE, _EMPTY = (
    uuid.uuid4() for _ in range(9)
)
_ZONES = [
    SimpleNamespace(id=_KERALA, name="Kerala", parent_zone_id=None),
    SimpleNamespace(id=_NORTH, name="North Kerala", parent_zone_id=_KERALA),
    SimpleNamespace(id=_SOUTH, name="South Kerala", parent_zone_id=_KERALA),
    SimpleNamespace(id=_MALAPPURAM, name="Malappuram", parent_zone_id=_NORTH),
    SimpleNamespace(id=_KANNUR, name="Kannur", parent_zone_id=_NORTH),
    SimpleNamespace(id=_ERNAKULAM, name="Ernakulam", parent_zone_id=_SOUTH),
    SimpleNamespace(id=_KARNATAKA, name="Karnataka", parent_zone_id=None),
    SimpleNamespace(id=_BANGALORE, name="Bangalore", parent_zone_id=_KARNATAKA),
    SimpleNamespace(id=_EMPTY, name="Cluster 1", parent_zone_id=_BANGALORE),
]


def _prow(zone_id, count, value):
    v = Decimal(value)
    return SimpleNamespace(
        group_id=str(zone_id), group_name="(ignored)", opportunity_count=count,
        total_value_lakhs=v, unweighted_forecast_lakhs=v, weighted_forecast_lakhs=v / 2,
    )


def _pipeline_zone_rows(repo_rows):
    mock_repo = MagicMock(spec=ReportingRepository)
    mock_repo.pipeline_summary.return_value = list(repo_rows)
    mock_repo.zone_tree.return_value = _ZONES
    service = ReportingService(repository=mock_repo)
    return service.pipeline_summary(_make_current_user("Admin"), "zone").rows


class TestZoneTree:
    # Mirrors Dev's shape on 2026-09-27: deals tagged to North/South Kerala
    # directly as well as to districts; Bangalore's deals all direct.
    REPO_ROWS = (
        _prow(_NORTH, 24, "263"), _prow(_MALAPPURAM, 10, "129"), _prow(_KANNUR, 1, "5"),
        _prow(_SOUTH, 2, "24"), _prow(_ERNAKULAM, 5, "7"), _prow(_BANGALORE, 6, "79"),
    )

    def _as_tuples(self, rows):
        return [(r.depth, r.group_name, r.opportunity_count, r.total_value_lakhs, bool(r.zone_exact)) for r in rows]

    def test_rolls_up_and_orders_as_a_tree(self):
        rows = _pipeline_zone_rows(self.REPO_ROWS)
        assert self._as_tuples(rows) == [
            (0, "Karnataka", 6, Decimal("79"), False),
            (1, "Bangalore", 6, Decimal("79"), False),
            (0, "Kerala", 42, Decimal("428"), False),
            (1, "North Kerala", 35, Decimal("397"), False),
            (2, "Kannur", 1, Decimal("5"), False),
            (2, "Malappuram", 10, Decimal("129"), False),
            (2, "North Kerala (not in a sub-zone)", 24, Decimal("263"), True),
            (1, "South Kerala", 7, Decimal("31"), False),
            (2, "Ernakulam", 5, Decimal("7"), False),
            (2, "South Kerala (not in a sub-zone)", 2, Decimal("24"), True),
        ]

    def test_top_level_rows_add_up_to_the_whole(self):
        rows = _pipeline_zone_rows(self.REPO_ROWS)
        top = [r for r in rows if r.depth == 0]
        assert sum(r.opportunity_count for r in top) == 48
        assert sum(r.total_value_lakhs for r in top) == Decimal("507")
        assert sum(r.weighted_forecast_lakhs for r in top) == Decimal("253.5")

    def test_not_in_sub_zone_row_keeps_the_zone_id_for_an_exact_drill(self):
        rows = _pipeline_zone_rows(self.REPO_ROWS)
        exact = [r for r in rows if r.zone_exact]
        assert {r.group_id for r in exact} == {str(_NORTH), str(_SOUTH)}

    def test_no_not_in_sub_zone_row_when_all_deals_are_direct(self):
        # Bangalore has a sub-zone (Cluster 1) but no deals there.
        rows = _pipeline_zone_rows(self.REPO_ROWS)
        assert not any(r.group_name.startswith("Bangalore (") for r in rows)
        assert not any(r.group_name == "Cluster 1" for r in rows)

    def test_other_breakdowns_untouched(self):
        mock_repo = MagicMock(spec=ReportingRepository)
        mock_repo.pipeline_summary.return_value = []
        ReportingService(repository=mock_repo).pipeline_summary(_make_current_user("Admin"), "stage")
        mock_repo.zone_tree.assert_not_called()

    def test_sales_summary_rolls_up_won_count_and_revenue(self):
        mock_repo = MagicMock(spec=ReportingRepository)
        mock_repo.sales_summary.return_value = [
            SimpleNamespace(group_id=str(_NORTH), group_name="x", revenue_lakhs=Decimal("4"), won_count=1),
        ]
        mock_repo.zone_tree.return_value = _ZONES
        rows = ReportingService(repository=mock_repo).sales_summary(_make_current_user("Admin"), "zone").rows
        assert [(r.depth, r.group_name, r.won_count, r.revenue_lakhs) for r in rows] == [
            (0, "Kerala", 1, Decimal("4")),
            (1, "North Kerala", 1, Decimal("4")),
        ]
