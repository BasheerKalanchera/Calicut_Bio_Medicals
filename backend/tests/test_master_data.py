import uuid
from decimal import Decimal
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")


def _mock_user() -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.is_active = True
    return user


def _setup_overrides(mock_db: MagicMock) -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user()
    app.dependency_overrides[get_db] = lambda: mock_db


def _teardown_overrides() -> None:
    app.dependency_overrides.clear()


class TestMasterDataEndpoint:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/master-data/stages")
        assert response.status_code == 401

    def test_invalid_entity_returns_422(self, client: TestClient) -> None:
        app.dependency_overrides[get_current_user] = lambda: _mock_user()
        try:
            response = client.get("/api/v1/master-data/invalid-entity")
        finally:
            _teardown_overrides()

        assert response.status_code == 422

    def test_stages_returns_ordered_list(self, client: TestClient) -> None:
        stage = MagicMock()
        stage.id = uuid.uuid4()
        stage.stage_code = "LEAD"
        stage.stage_name = "Lead"
        stage.display_order = 1
        stage.default_win_probability = Decimal("5.00")
        stage.is_active = True

        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = [stage]

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/master-data/stages")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)
        assert len(body["data"]) == 1
        assert body["data"][0]["stage_code"] == "LEAD"

    def test_sbus_returns_list(self, client: TestClient) -> None:
        sbu = MagicMock()
        sbu.id = uuid.uuid4()
        sbu.name = "Imaging"
        sbu.description = "Imaging SBU"
        sbu.is_active = True

        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = [sbu]

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/master-data/sbus")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)
        assert body["data"][0]["name"] == "Imaging"


class TestUsersEndpoint:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/users")
        assert response.status_code == 401

    def test_returns_paginated_users(self, client: TestClient) -> None:
        user_record = MagicMock()
        user_record.id = uuid.uuid4()
        user_record.display_name = "Sales Rep"
        user_record.sbu_id = uuid.uuid4()
        user_record.zone_id = uuid.uuid4()
        user_record.role_id = uuid.uuid4()
        user_record.is_active = True

        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.all.return_value = [user_record]

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/users")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data

    def test_pagination_params(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/users?page=2&page_size=10")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["data"]["page"] == 2
        assert body["data"]["page_size"] == 10
