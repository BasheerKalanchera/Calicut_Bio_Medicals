import uuid
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_ZONE_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


def _mock_user(role_name: str) -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.is_active = True
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _setup_overrides(role_name: str, mock_db: MagicMock) -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user(role_name)
    app.dependency_overrides[get_db] = lambda: mock_db


def _teardown_overrides() -> None:
    app.dependency_overrides.clear()


class TestAuthGateAtTheHttpLayer:
    """Confirms role_name actually flows from the authenticated user through
    to the service's authorization check, at the real HTTP layer -- the
    service-level tests (test_zone_service.py) cover every business rule in
    depth; this file only proves the wiring between them is correct.
    """

    def test_non_admin_gets_403_on_tree(self, client: TestClient) -> None:
        mock_db = MagicMock()
        _setup_overrides("Sales Staff", mock_db)
        try:
            response = client.get("/api/v1/admin/zones/tree")
        finally:
            _teardown_overrides()

        assert response.status_code == 403

    def test_non_admin_gets_403_on_create(self, client: TestClient) -> None:
        mock_db = MagicMock()
        _setup_overrides("Area Manager", mock_db)
        try:
            response = client.post("/api/v1/admin/zones", json={"name": "New Zone"})
        finally:
            _teardown_overrides()

        assert response.status_code == 403

    def test_unauthenticated_gets_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/admin/zones/tree")
        assert response.status_code == 401

    def test_admin_gets_past_the_auth_gate(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = []
        _setup_overrides("Admin", mock_db)
        try:
            response = client.get("/api/v1/admin/zones/tree")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        assert response.json()["data"] == []
