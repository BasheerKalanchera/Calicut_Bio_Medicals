"""
Router-level tests for GET/POST /marketing-leads/{lead_id}/comments. Mirrors
test_activity_router.py's TestListActivityComments/TestCreateActivityComment
pattern exactly -- drives the real repository/service against a mocked DB.
"""

import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")


def _mock_user(role_name: str = "Admin") -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.sbu_id = uuid.uuid4()
    user.zone_id = uuid.uuid4()
    user.manager_id = None
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _mock_nested(**overrides) -> MagicMock:
    obj = MagicMock()
    for k, v in overrides.items():
        setattr(obj, k, v)
    return obj


def _setup_overrides(mock_db: MagicMock, role_name: str = "Admin") -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user(role_name)
    app.dependency_overrides[get_db] = lambda: mock_db


def _teardown_overrides() -> None:
    app.dependency_overrides.clear()


class TestListMarketingLeadComments:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get(f"/api/v1/marketing-leads/{uuid.uuid4()}/comments")
        assert response.status_code == 401

    def test_missing_lead_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0  # lead_exists -> False

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/marketing-leads/{uuid.uuid4()}/comments")
        finally:
            _teardown_overrides()

        assert response.status_code == 404

    def test_returns_serialized_comments(self, client: TestClient) -> None:
        lead_id = uuid.uuid4()
        comment_id = uuid.uuid4()
        author_id = uuid.uuid4()
        comment = MagicMock()
        comment.id = comment_id
        comment.marketing_lead_id = lead_id
        comment.body = "Called, waiting on procurement sign-off"
        comment.created_at = datetime(2026, 9, 18, 8, 0, 0, tzinfo=UTC)
        comment.author = _mock_nested(id=author_id, display_name="Vivek")

        mock_db = MagicMock()
        mock_db.scalar.return_value = 1  # lead_exists -> True
        mock_db.scalars.return_value.all.return_value = [comment]

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/marketing-leads/{lead_id}/comments")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        items = response.json()["data"]
        assert len(items) == 1
        assert items[0]["body"] == "Called, waiting on procurement sign-off"
        assert items[0]["author"] == {"id": str(author_id), "display_name": "Vivek"}


class TestCreateMarketingLeadComment:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.post(f"/api/v1/marketing-leads/{uuid.uuid4()}/comments", json={"body": "Hi"})
        assert response.status_code == 401

    def test_missing_lead_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0  # lead_exists -> False

        _setup_overrides(mock_db)
        try:
            response = client.post(f"/api/v1/marketing-leads/{uuid.uuid4()}/comments", json={"body": "Hi"})
        finally:
            _teardown_overrides()

        assert response.status_code == 404

    def test_empty_body_returns_422(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1  # lead_exists -> True

        _setup_overrides(mock_db)
        try:
            response = client.post(f"/api/v1/marketing-leads/{uuid.uuid4()}/comments", json={"body": ""})
        finally:
            _teardown_overrides()

        assert response.status_code == 422
