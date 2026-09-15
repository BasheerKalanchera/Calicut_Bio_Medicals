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
