import uuid
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_SBU_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
TEST_ZONE_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")
TEST_ROLE_ID = uuid.UUID("44444444-4444-4444-4444-444444444444")


def _mock_user() -> MagicMock:
    role = MagicMock()
    role.role_name = "Sales Staff"

    sbu = MagicMock()
    sbu.id = TEST_SBU_ID
    sbu.name = "Imaging"

    zone = MagicMock()
    zone.id = TEST_ZONE_ID
    zone.name = "North"

    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.display_name = "Test User"
    user.is_active = True
    user.role = role
    user.role_id = TEST_ROLE_ID
    user.sbu = sbu
    user.sbu_id = TEST_SBU_ID
    user.zone = zone
    user.zone_id = TEST_ZONE_ID
    return user


class TestAuthMe:
    def test_returns_user_profile(self, client: TestClient) -> None:
        mock_user = _mock_user()
        mock_db = MagicMock()
        mock_db.scalar.return_value = 3
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: mock_db
        try:
            response = client.get("/api/v1/auth/me")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert data["id"] == str(TEST_USER_ID)
        assert data["display_name"] == "Test User"
        assert data["role_name"] == "Sales Staff"
        assert data["sbu"]["name"] == "Imaging"
        assert data["zone"]["name"] == "North"
        assert data["due_or_overdue_reminder_count"] == 3

    def test_missing_auth_returns_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_invalid_token_returns_401(self, client: TestClient) -> None:
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code == 401
