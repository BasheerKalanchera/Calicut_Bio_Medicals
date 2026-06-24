import uuid
from datetime import date
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.account.models import Account
from app.domains.organization.models import UserProfile
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_ACCOUNT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
TEST_SBU_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


def _mock_user() -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.is_active = True
    return user


def _mock_sbu() -> MagicMock:
    sbu = MagicMock()
    sbu.id = TEST_SBU_ID
    sbu.name = "Imaging"
    return sbu


def _mock_status() -> MagicMock:
    status = MagicMock()
    status.id = uuid.uuid4()
    status.status_code = "ACTIVE"
    status.status_name = "Active"
    return status


def _mock_owner() -> MagicMock:
    owner = MagicMock()
    owner.id = uuid.uuid4()
    owner.display_name = "Basheer"
    return owner


def _mock_product() -> MagicMock:
    product = MagicMock()
    product.id = uuid.uuid4()
    product.name = "SonoScape S50"
    product.oem_name = "SonoScape"
    product.model_number = "S50"
    return product


def _mock_stakeholder() -> MagicMock:
    obj = MagicMock()
    obj.id = uuid.uuid4()
    obj.name = "Dr. Test"
    obj.nps_score = 80
    obj.sentiment = "Positive"
    return obj


def _mock_project() -> MagicMock:
    obj = MagicMock()
    obj.id = uuid.uuid4()
    obj.name = "Hospital Expansion"
    obj.status = _mock_status()
    obj.owner = _mock_owner()
    obj.bid_submission_date = date(2026, 9, 15)
    return obj


def _mock_installed_asset() -> MagicMock:
    obj = MagicMock()
    obj.id = uuid.uuid4()
    obj.product = _mock_product()
    obj.is_competitor_equipment = False
    obj.competitor_product_name = None
    obj.installation_date = date(2025, 3, 10)
    obj.department = "Radiology"
    return obj


def _mock_account(**overrides) -> MagicMock:
    account = MagicMock(spec=Account)
    account.id = TEST_ACCOUNT_ID
    account.name = "Test Hospital"
    account.parent_account_id = None
    account.managing_sbu_id = TEST_SBU_ID
    account.payer_behavior = "GOOD"
    account.managing_sbu = _mock_sbu()
    account.stakeholders = overrides.get("stakeholders", [])
    account.projects = overrides.get("projects", [])
    account.installed_assets = overrides.get("installed_assets", [])
    return account


def _setup_overrides(mock_db: MagicMock) -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user()
    app.dependency_overrides[get_db] = lambda: mock_db


def _teardown_overrides() -> None:
    app.dependency_overrides.clear()


class TestGetWorkspace:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get(
            f"/api/v1/accounts/{TEST_ACCOUNT_ID}/workspace"
        )
        assert response.status_code == 401

    def test_returns_full_workspace(self, client: TestClient) -> None:
        account = _mock_account(
            stakeholders=[_mock_stakeholder()],
            projects=[_mock_project()],
            installed_assets=[_mock_installed_asset()],
        )
        mock_db = MagicMock()
        mock_db.get.return_value = account

        _setup_overrides(mock_db)
        try:
            response = client.get(
                f"/api/v1/accounts/{TEST_ACCOUNT_ID}/workspace"
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        data = body["data"]

        assert data["account"]["name"] == "Test Hospital"
        assert data["account"]["managing_sbu"]["name"] == "Imaging"

        assert len(data["stakeholders"]) == 1
        assert data["stakeholders"][0]["name"] == "Dr. Test"
        assert data["stakeholders"][0]["nps_score"] == 80

        assert len(data["projects"]) == 1
        assert data["projects"][0]["name"] == "Hospital Expansion"
        assert data["projects"][0]["status"]["status_name"] == "Active"
        assert data["projects"][0]["owner"]["display_name"] == "Basheer"

        assert len(data["installed_assets"]) == 1
        assert data["installed_assets"][0]["product"]["name"] == "SonoScape S50"
        assert data["installed_assets"][0]["department"] == "Radiology"

    def test_returns_empty_workspace(self, client: TestClient) -> None:
        account = _mock_account()
        mock_db = MagicMock()
        mock_db.get.return_value = account

        _setup_overrides(mock_db)
        try:
            response = client.get(
                f"/api/v1/accounts/{TEST_ACCOUNT_ID}/workspace"
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["stakeholders"] == []
        assert data["projects"] == []
        assert data["installed_assets"] == []

    def test_not_found_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.get.return_value = None

        _setup_overrides(mock_db)
        try:
            response = client.get(
                f"/api/v1/accounts/{uuid.uuid4()}/workspace"
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 404
