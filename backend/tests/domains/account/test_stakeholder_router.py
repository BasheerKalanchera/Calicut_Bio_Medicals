import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.account.models import Stakeholder
from app.domains.organization.models import UserProfile
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_ACCOUNT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
TEST_STAKEHOLDER_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


def _mock_user() -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.is_active = True
    return user


def _mock_stakeholder(**overrides) -> MagicMock:
    now = datetime.now(UTC)
    defaults = {
        "id": TEST_STAKEHOLDER_ID,
        "account_id": TEST_ACCOUNT_ID,
        "name": "Dr. Test",
        "designation": None,
        "email": None,
        "phone": None,
        "whatsapp_number": None,
        "nps_score": 50,
        "sentiment": "Positive",
        "created_at": now,
        "updated_at": now,
    }
    defaults.update(overrides)
    obj = MagicMock(spec=Stakeholder)
    for k, v in defaults.items():
        setattr(obj, k, v)
    return obj


def _setup_overrides(mock_db: MagicMock) -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user()
    app.dependency_overrides[get_db] = lambda: mock_db


def _teardown_overrides() -> None:
    app.dependency_overrides.clear()


class TestListStakeholders:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get(f"/api/v1/accounts/{TEST_ACCOUNT_ID}/stakeholders")
        assert response.status_code == 401

    def test_returns_stakeholders(self, client: TestClient) -> None:
        stakeholder = _mock_stakeholder()
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.unique.return_value.all.return_value = [
            stakeholder
        ]

        _setup_overrides(mock_db)
        try:
            response = client.get(
                f"/api/v1/accounts/{TEST_ACCOUNT_ID}/stakeholders"
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert len(body["data"]) == 1
        assert body["data"][0]["name"] == "Dr. Test"
        assert body["data"][0]["nps_score"] == 50

    def test_invalid_account_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = None

        _setup_overrides(mock_db)
        try:
            response = client.get(
                f"/api/v1/accounts/{uuid.uuid4()}/stakeholders"
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 404


class TestCreateStakeholder:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.post(
            f"/api/v1/accounts/{TEST_ACCOUNT_ID}/stakeholders",
            json={"name": "Dr. New"},
        )
        assert response.status_code == 401

    def test_creates_stakeholder(self, client: TestClient) -> None:
        stakeholder = _mock_stakeholder(name="Dr. New")
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1

        def _capture_add(obj):
            for attr in ["id", "account_id", "name", "designation", "email", "phone",
                         "nps_score", "sentiment", "created_at", "updated_at"]:
                if not hasattr(obj, attr) or getattr(obj, attr) is None:
                    setattr(obj, attr, getattr(stakeholder, attr))

        mock_db.add.side_effect = _capture_add

        _setup_overrides(mock_db)
        try:
            response = client.post(
                f"/api/v1/accounts/{TEST_ACCOUNT_ID}/stakeholders",
                json={"name": "Dr. New", "nps_score": 80},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 201
        body = response.json()
        assert body["success"] is True

    def test_empty_name_returns_422(self, client: TestClient) -> None:
        mock_db = MagicMock()
        _setup_overrides(mock_db)
        try:
            response = client.post(
                f"/api/v1/accounts/{TEST_ACCOUNT_ID}/stakeholders",
                json={"name": ""},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 422

    def test_invalid_account_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = None

        _setup_overrides(mock_db)
        try:
            response = client.post(
                f"/api/v1/accounts/{uuid.uuid4()}/stakeholders",
                json={"name": "Dr. New"},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 404

    def test_nps_score_out_of_range_returns_422(self, client: TestClient) -> None:
        mock_db = MagicMock()
        _setup_overrides(mock_db)
        try:
            response = client.post(
                f"/api/v1/accounts/{TEST_ACCOUNT_ID}/stakeholders",
                json={"name": "Dr. Test", "nps_score": 101},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 422


class TestUpdateStakeholder:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.put(
            f"/api/v1/stakeholders/{TEST_STAKEHOLDER_ID}",
            json={"name": "Updated"},
        )
        assert response.status_code == 401

    def test_updates_stakeholder(self, client: TestClient) -> None:
        stakeholder = _mock_stakeholder()
        mock_db = MagicMock()
        # get_for_update uses db.scalar
        mock_db.scalar.return_value = stakeholder

        _setup_overrides(mock_db)
        try:
            response = client.put(
                f"/api/v1/stakeholders/{TEST_STAKEHOLDER_ID}",
                json={"name": "Dr. Updated", "nps_score": 90},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True

    def test_not_found_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        # get_for_update returns None → NotFoundError → 404
        mock_db.scalar.return_value = None

        _setup_overrides(mock_db)
        try:
            response = client.put(
                f"/api/v1/stakeholders/{uuid.uuid4()}",
                json={"name": "Updated"},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 404

    def test_invalid_nps_score_returns_422(self, client: TestClient) -> None:
        mock_db = MagicMock()
        _setup_overrides(mock_db)
        try:
            response = client.put(
                f"/api/v1/stakeholders/{TEST_STAKEHOLDER_ID}",
                json={"nps_score": 999},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 422
