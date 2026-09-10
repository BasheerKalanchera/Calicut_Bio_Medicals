import uuid
from decimal import Decimal
from typing import ClassVar
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")


def _mock_user(role_name: str = "Admin") -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.is_active = True
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _setup_overrides(mock_db: MagicMock, role_name: str = "Admin") -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user(role_name)
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

    def test_gate_override_reasons_returns_active_rows(self, client: TestClient) -> None:
        reason = MagicMock()
        reason.id = uuid.uuid4()
        reason.reason_code = "DEMO_DECLINED"
        reason.reason_name = "Customer declined demo"
        reason.is_active = True

        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = [reason]

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/master-data/gate-override-reasons")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)
        assert body["data"][0]["reason_code"] == "DEMO_DECLINED"

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
        user_record.role.role_name = "Sales Staff"
        user_record.manager_id = None
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

    def test_non_admin_caller_still_reaches_endpoint(self, client: TestClient) -> None:
        # Filtering itself is verified at the repository level (test_organization_repository.py) --
        # this just confirms current_user now flows through service -> repository without breaking
        # the request for a restricted-visibility role.
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.all.return_value = []

        _setup_overrides(mock_db, role_name="Sales Staff")
        try:
            response = client.get("/api/v1/users")
        finally:
            _teardown_overrides()

        assert response.status_code == 200


class TestCreateUser:
    _BODY: ClassVar[dict] = {
        "id": str(uuid.uuid4()),
        "display_name": "New Rep",
        "sbu_id": str(uuid.uuid4()),
        "role_id": str(uuid.uuid4()),
    }

    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.post("/api/v1/users", json=self._BODY)
        assert response.status_code == 401

    def test_sales_staff_forbidden(self, client: TestClient) -> None:
        mock_db = MagicMock()

        _setup_overrides(mock_db, role_name="Sales Staff")
        try:
            response = client.post("/api/v1/users", json=self._BODY)
        finally:
            _teardown_overrides()

        assert response.status_code == 403

    def test_sbu_manager_forbidden(self, client: TestClient) -> None:
        mock_db = MagicMock()

        _setup_overrides(mock_db, role_name="SBU Manager")
        try:
            response = client.post("/api/v1/users", json=self._BODY)
        finally:
            _teardown_overrides()

        assert response.status_code == 403


class TestUpdateUser:
    _USER_ID = uuid.uuid4()

    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.patch(f"/api/v1/users/{self._USER_ID}", json={"display_name": "X"})
        assert response.status_code == 401

    def test_sales_staff_forbidden(self, client: TestClient) -> None:
        mock_db = MagicMock()

        _setup_overrides(mock_db, role_name="Sales Staff")
        try:
            response = client.patch(f"/api/v1/users/{self._USER_ID}", json={"display_name": "X"})
        finally:
            _teardown_overrides()

        assert response.status_code == 403

    def test_sbu_manager_forbidden(self, client: TestClient) -> None:
        mock_db = MagicMock()

        _setup_overrides(mock_db, role_name="SBU Manager")
        try:
            response = client.patch(f"/api/v1/users/{self._USER_ID}", json={"display_name": "X"})
        finally:
            _teardown_overrides()

        assert response.status_code == 403


class TestSearchZonesForHospital:
    """AddHospitalModal's ZonePicker -- found live 2026-09-08 blocking an
    SBU Manager (correctly zone-less, per _ZONE_ASSIGNMENT_EXEMPT_ROLES in
    account/service.py) from seeing any zone at all, since this endpoint's
    own _ZONE_SEARCH_UNRESTRICTED_ROLES hadn't been updated to match."""

    def test_sbu_manager_with_no_zone_gets_unrestricted_search(self, client: TestClient) -> None:
        user = _mock_user(role_name="SBU Manager")
        user.zone_id = None
        mock_db = MagicMock()
        app.dependency_overrides[get_current_user] = lambda: user
        app.dependency_overrides[get_db] = lambda: mock_db

        zone = MagicMock()
        zone.id = uuid.uuid4()
        zone.name = "North Kerala"

        try:
            with patch("app.api.routers.master_data.ZoneRepository") as MockRepo:
                repo = MockRepo.return_value
                repo.search_by_name.return_value = [zone]
                repo.build_breadcrumb.return_value = "Kerala"
                response = client.get("/api/v1/master-data/zones/search-for-hospital", params={"q": "North"})
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert len(body["data"]) == 1
        assert body["data"][0]["name"] == "North Kerala"
        # Unrestricted -- no within_zone_id kwarg, unlike a zone-scoped rep.
        repo.search_by_name.assert_called_once_with("North")

    def test_area_manager_with_no_zone_gets_empty_results(self, client: TestClient) -> None:
        user = _mock_user(role_name="Area Manager")
        user.zone_id = None
        user.zones = []
        mock_db = MagicMock()
        app.dependency_overrides[get_current_user] = lambda: user
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            with patch("app.api.routers.master_data.ZoneRepository") as MockRepo:
                repo = MockRepo.return_value
                response = client.get("/api/v1/master-data/zones/search-for-hospital", params={"q": "North"})
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        assert response.json()["data"] == []
        repo.search_by_name.assert_not_called()

    def test_rep_with_additional_zones_searches_across_all_of_them(self, client: TestClient) -> None:
        """Found live 2026-09-09: Vivek (Sales Staff) has Alappuzha as his
        primary zone plus 5 additional districts (Idukki, Kottayam,
        Pathanamthitta, Kollam, Trivandrum) via user_zone, but couldn't find
        any of the 5 additional ones in the Add Hospital picker -- it only
        ever searched his primary zone_id. Reproduced identically on Dev,
        confirming a code bug, not UAT-specific data."""
        user = _mock_user(role_name="Sales Staff")
        alappuzha_id = uuid.uuid4()
        additional_ids = [uuid.uuid4() for _ in range(5)]
        user.zone_id = alappuzha_id
        user.zones = [MagicMock(zone_id=zid) for zid in [alappuzha_id, *additional_ids]]
        mock_db = MagicMock()
        app.dependency_overrides[get_current_user] = lambda: user
        app.dependency_overrides[get_db] = lambda: mock_db

        zone = MagicMock()
        zone.id = additional_ids[2]
        zone.name = "Kollam"

        try:
            with patch("app.api.routers.master_data.ZoneRepository") as MockRepo:
                repo = MockRepo.return_value
                repo.search_by_name.return_value = [zone]
                repo.build_breadcrumb.return_value = "Kerala"
                response = client.get("/api/v1/master-data/zones/search-for-hospital", params={"q": "Kollam"})
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert len(body["data"]) == 1
        assert body["data"][0]["name"] == "Kollam"
        called_zone_ids = repo.search_by_name.call_args.kwargs["within_zone_ids"]
        assert set(called_zone_ids) == {alappuzha_id, *additional_ids}
