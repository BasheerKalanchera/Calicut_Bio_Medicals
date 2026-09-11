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
