import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.account.models import Account
from app.domains.organization.models import UserProfile
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_ACCOUNT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
TEST_ZONE_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")


def _mock_user() -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.is_active = True
    return user


def _mock_zone() -> MagicMock:
    zone = MagicMock()
    zone.id = TEST_ZONE_ID
    zone.name = "South Zone"
    return zone


def _mock_account(**overrides) -> MagicMock:
    now = datetime.now(UTC)
    defaults = {
        "id": TEST_ACCOUNT_ID,
        "name": "Test Hospital",
        "parent_account_id": None,
        "zone_id": TEST_ZONE_ID,
        "payer_behavior": "GOOD",
        "created_at": now,
        "updated_at": now,
        "zone": _mock_zone(),
        "parent_account": None,
    }
    defaults.update(overrides)
    account = MagicMock(spec=Account)
    for k, v in defaults.items():
        setattr(account, k, v)
    return account


def _setup_overrides(mock_db: MagicMock) -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user()
    app.dependency_overrides[get_db] = lambda: mock_db


def _teardown_overrides() -> None:
    app.dependency_overrides.clear()


class TestListAccounts:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/accounts")
        assert response.status_code == 401

    def test_returns_paginated_accounts(self, client: TestClient) -> None:
        account = _mock_account()
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.unique.return_value.all.return_value = [account]

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/accounts")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert "items" in data
        assert "total" in data
        assert data["total"] == 1
        assert data["items"][0]["name"] == "Test Hospital"

    def test_search_filter(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/accounts?search=apollo")
        finally:
            _teardown_overrides()

        assert response.status_code == 200

    def test_zone_filter(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/accounts?zone_id={TEST_ZONE_ID}")
        finally:
            _teardown_overrides()

        assert response.status_code == 200

    def test_pagination_params(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/accounts?page=2&page_size=10")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["data"]["page"] == 2
        assert body["data"]["page_size"] == 10


class TestGetAccount:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get(f"/api/v1/accounts/{TEST_ACCOUNT_ID}")
        assert response.status_code == 401

    def test_returns_account_detail(self, client: TestClient) -> None:
        account = _mock_account()
        mock_db = MagicMock()
        mock_db.scalar.return_value = account
        counts = MagicMock()
        counts.stakeholder_count = 0
        counts.project_count = 0
        counts.opportunity_count = 0
        counts.asset_count = 0
        mock_db.execute.return_value.first.return_value = counts

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/accounts/{TEST_ACCOUNT_ID}")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["data"]["id"] == str(TEST_ACCOUNT_ID)
        assert body["data"]["name"] == "Test Hospital"
        assert body["data"]["zone"]["name"] == "South Zone"

    def test_not_found_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = None

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/accounts/{uuid.uuid4()}")
        finally:
            _teardown_overrides()

        assert response.status_code == 404


class TestGetAccountCounts:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get(f"/api/v1/accounts/counts?ids={TEST_ACCOUNT_ID}")
        assert response.status_code == 401

    def test_returns_counts_for_accounts(self, client: TestClient) -> None:
        mock_db = MagicMock()

        def _row(aid, cnt):
            r = MagicMock()
            r.account_id = aid
            r.cnt = cnt
            return r

        mock_db.execute.return_value.all.side_effect = [
            [_row(TEST_ACCOUNT_ID, 3)],  # stakeholders
            [_row(TEST_ACCOUNT_ID, 2)],  # projects
            [_row(TEST_ACCOUNT_ID, 5)],  # opportunities
            [_row(TEST_ACCOUNT_ID, 1)],  # assets
        ]

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/accounts/counts?ids={TEST_ACCOUNT_ID}")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        counts = body["data"][str(TEST_ACCOUNT_ID)]
        assert counts["stakeholder_count"] == 3
        assert counts["project_count"] == 2
        assert counts["opportunity_count"] == 5
        assert counts["asset_count"] == 1

    def test_empty_ids_returns_empty(self, client: TestClient) -> None:
        _setup_overrides(MagicMock())
        try:
            response = client.get("/api/v1/accounts/counts?ids=")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        assert response.json()["data"] == {}

    def test_missing_ids_param_returns_422(self, client: TestClient) -> None:
        _setup_overrides(MagicMock())
        try:
            response = client.get("/api/v1/accounts/counts")
        finally:
            _teardown_overrides()

        assert response.status_code == 422


class TestCreateAccount:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.post("/api/v1/accounts", json={"name": "New Hospital"})
        assert response.status_code == 401

    def test_creates_account(self, client: TestClient) -> None:
        account = _mock_account(name="New Hospital")
        mock_db = MagicMock()
        mock_db.scalar.side_effect = [0, 1]  # exists_by_name=0, zone_exists=1

        def _capture_add(obj):
            for attr in ["id", "name", "parent_account_id", "zone_id",
                         "payer_behavior", "created_at", "updated_at",
                         "zone", "parent_account"]:
                if not hasattr(obj, attr) or getattr(obj, attr) is None:
                    setattr(obj, attr, getattr(account, attr))

        mock_db.add.side_effect = _capture_add

        _setup_overrides(mock_db)
        try:
            response = client.post(
                "/api/v1/accounts",
                json={"name": "New Hospital", "zone_id": str(TEST_ZONE_ID)},
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
            response = client.post("/api/v1/accounts", json={"name": ""})
        finally:
            _teardown_overrides()

        assert response.status_code == 422

    def test_duplicate_name_returns_409(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1

        _setup_overrides(mock_db)
        try:
            response = client.post(
                "/api/v1/accounts",
                json={"name": "Existing Hospital", "zone_id": str(TEST_ZONE_ID)},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 409

    def test_invalid_payer_behavior_returns_422(self, client: TestClient) -> None:
        mock_db = MagicMock()
        _setup_overrides(mock_db)
        try:
            response = client.post(
                "/api/v1/accounts",
                json={"name": "Hospital", "payer_behavior": "RANDOM_VALUE"},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 422

    def test_valid_payer_behaviors_accepted(self, client: TestClient) -> None:
        for behavior in ["GOOD", "AVERAGE", "PROBLEMATIC", "UNKNOWN"]:
            account = _mock_account(name="Hospital", payer_behavior=behavior)
            mock_db = MagicMock()
            mock_db.scalar.side_effect = [0, 1]  # exists_by_name=0, zone_exists=1

            def _capture_add(obj, _acct=account):
                for attr in ["id", "name", "parent_account_id", "zone_id",
                             "payer_behavior", "created_at", "updated_at",
                             "zone", "parent_account"]:
                    if not hasattr(obj, attr) or getattr(obj, attr) is None:
                        setattr(obj, attr, getattr(_acct, attr))

            mock_db.add.side_effect = _capture_add

            _setup_overrides(mock_db)
            try:
                response = client.post(
                    "/api/v1/accounts",
                    json={"name": "Hospital", "payer_behavior": behavior,
                          "zone_id": str(TEST_ZONE_ID)},
                )
            finally:
                _teardown_overrides()

            assert response.status_code == 201, f"Failed for {behavior}"

    def test_invalid_zone_returns_400(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.side_effect = [0, 0]  # exists_by_name=0, zone_exists=0

        _setup_overrides(mock_db)
        try:
            response = client.post(
                "/api/v1/accounts",
                json={"name": "Hospital", "zone_id": str(uuid.uuid4())},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 400

    def test_invalid_parent_account_returns_400(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.side_effect = [0, 1, 0]  # exists_by_name=0, zone_exists=1, account_exists=0

        _setup_overrides(mock_db)
        try:
            response = client.post(
                "/api/v1/accounts",
                json={"name": "Hospital", "zone_id": str(TEST_ZONE_ID),
                      "parent_account_id": str(uuid.uuid4())},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 400


class TestUpdateAccount:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.put(
            f"/api/v1/accounts/{TEST_ACCOUNT_ID}", json={"name": "Updated"}
        )
        assert response.status_code == 401

    def test_updates_account(self, client: TestClient) -> None:
        account = _mock_account()
        mock_db = MagicMock()
        # scalar calls in order: get_for_update → account, exists_by_name → 0
        mock_db.scalar.side_effect = [account, 0]

        _setup_overrides(mock_db)
        try:
            response = client.put(
                f"/api/v1/accounts/{TEST_ACCOUNT_ID}",
                json={"name": "Updated Hospital"},
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
                f"/api/v1/accounts/{uuid.uuid4()}",
                json={"name": "Updated"},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 404

    def test_self_parent_returns_400(self, client: TestClient) -> None:
        account = _mock_account()
        mock_db = MagicMock()
        # get_for_update → account; self-parent check raises before any further scalar calls
        mock_db.scalar.return_value = account

        _setup_overrides(mock_db)
        try:
            response = client.put(
                f"/api/v1/accounts/{TEST_ACCOUNT_ID}",
                json={"parent_account_id": str(TEST_ACCOUNT_ID)},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 400

    def test_invalid_payer_behavior_returns_422(self, client: TestClient) -> None:
        mock_db = MagicMock()
        _setup_overrides(mock_db)
        try:
            response = client.put(
                f"/api/v1/accounts/{TEST_ACCOUNT_ID}",
                json={"payer_behavior": "INVALID"},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 422
