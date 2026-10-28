"""
GET /reporting/weekly-followup (My Work) -- query parameters reach the
service, and the response envelope. The splitting itself is covered in
test_reporting_service.py.
"""

import uuid
from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock

from app.api.dependencies import get_current_user
from app.domains.organization.models import UserProfile
from app.domains.reporting.router import _get_service
from app.domains.reporting.schemas import (
    WeeklyFollowupHospitalList,
    WeeklyFollowupNextActionList,
    WeeklyFollowupOpportunityList,
    WeeklyFollowupResponse,
)
from app.domains.reporting.service import ReportingService
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
REP_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


def _mock_user() -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.is_active = True
    return user


def _empty_response(user_id: uuid.UUID, idle_days: int) -> WeeklyFollowupResponse:
    no_opps = WeeklyFollowupOpportunityList(count=0, value_lakhs=Decimal(0), rows=[])
    no_actions = WeeklyFollowupNextActionList(count=0, rows=[])
    return WeeklyFollowupResponse(
        user_id=user_id, idle_days=idle_days, today=date(2026, 10, 28), week_end=date(2026, 11, 1),
        high_priority=no_opps, closing_date_passed=no_opps, not_visited=no_opps,
        overdue_next_actions=no_actions, next_actions_this_week=no_actions,
        planning_period="2026-Q3", planned_hospitals=WeeklyFollowupHospitalList(count=0, rows=[]),
    )


def _setup(mock_service: MagicMock) -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user()
    app.dependency_overrides[_get_service] = lambda: mock_service


class TestWeeklyFollowupEndpoint:
    def test_defaults(self, client):
        mock_service = MagicMock(spec=ReportingService)
        mock_service.weekly_followup.return_value = _empty_response(TEST_USER_ID, 30)
        _setup(mock_service)
        try:
            response = client.get("/api/v1/reporting/weekly-followup")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()["data"]
        assert body["user_id"] == str(TEST_USER_ID)
        assert body["week_end"] == "2026-11-01"
        assert body["not_visited"] == {"count": 0, "value_lakhs": "0", "rows": []}
        assert body["planning_period"] == "2026-Q3"
        assert body["planned_hospitals"] == {"count": 0, "rows": []}
        kwargs = mock_service.weekly_followup.call_args.kwargs
        assert kwargs == {"user_id": None, "idle_days": 30}

    def test_user_and_idle_days_passed_through(self, client):
        mock_service = MagicMock(spec=ReportingService)
        mock_service.weekly_followup.return_value = _empty_response(REP_ID, 45)
        _setup(mock_service)
        try:
            response = client.get(f"/api/v1/reporting/weekly-followup?user_id={REP_ID}&idle_days=45")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert mock_service.weekly_followup.call_args.kwargs == {"user_id": REP_ID, "idle_days": 45}

    def test_idle_days_below_one_rejected(self, client):
        mock_service = MagicMock(spec=ReportingService)
        _setup(mock_service)
        try:
            response = client.get("/api/v1/reporting/weekly-followup?idle_days=0")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 422
        mock_service.weekly_followup.assert_not_called()

    def test_idle_days_above_ten_years_rejected(self, client):
        mock_service = MagicMock(spec=ReportingService)
        _setup(mock_service)
        try:
            response = client.get("/api/v1/reporting/weekly-followup?idle_days=3651")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 422
        mock_service.weekly_followup.assert_not_called()

    def test_bad_user_id_rejected(self, client):
        mock_service = MagicMock(spec=ReportingService)
        _setup(mock_service)
        try:
            response = client.get("/api/v1/reporting/weekly-followup?user_id=not-a-uuid")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 422

    def test_requires_login(self, client):
        response = client.get("/api/v1/reporting/weekly-followup")
        assert response.status_code == 401
