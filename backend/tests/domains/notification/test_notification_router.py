import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.notification.models import Notification
from app.domains.organization.models import UserProfile
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
NOTIFICATION_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
ACTOR_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


def _mock_user() -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.is_active = True
    return user


def _mock_actor(**overrides) -> MagicMock:
    actor = MagicMock()
    actor.id = ACTOR_ID
    actor.display_name = "Test Actor"
    for k, v in overrides.items():
        setattr(actor, k, v)
    return actor


def _mock_notification(**overrides) -> MagicMock:
    defaults = {
        "id": NOTIFICATION_ID,
        "type": "OPPORTUNITY_ASSIGNED",
        "entity_type": "opportunity",
        "entity_id": uuid.uuid4(),
        "is_urgent": False,
        "created_at": datetime.now(UTC),
        "read_at": None,
        "actor": _mock_actor(),
    }
    defaults.update(overrides)
    notification = MagicMock(spec=Notification)
    for k, v in defaults.items():
        setattr(notification, k, v)
    return notification


def _setup_overrides(mock_db: MagicMock) -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user()
    app.dependency_overrides[get_db] = lambda: mock_db


def _teardown_overrides() -> None:
    app.dependency_overrides.clear()


class TestListNotifications:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/notifications")
        assert response.status_code == 401

    def test_returns_serialized_list_with_resolved_names(self, client: TestClient) -> None:
        notification = _mock_notification()
        mock_db = MagicMock()
        mock_db.execute.return_value.all.return_value = [(notification, "Radiology Upgrade", "Test Hospital")]

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/notifications")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        items = response.json()["data"]
        assert len(items) == 1
        item = items[0]
        assert item["id"] == str(NOTIFICATION_ID)
        assert item["type"] == "OPPORTUNITY_ASSIGNED"
        assert item["opportunity_name"] == "Radiology Upgrade"
        assert item["account_name"] == "Test Hospital"
        assert item["actor"] == {"id": str(ACTOR_ID), "display_name": "Test Actor"}

    def test_empty_list_when_no_notifications(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.execute.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/notifications")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        assert response.json()["data"] == []

    def test_limit_query_param_is_forwarded_to_query(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.execute.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/notifications?limit=5")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        stmt = mock_db.execute.call_args.args[0]
        compiled = str(stmt.compile(compile_kwargs={"literal_binds": True}))
        assert compiled.strip().endswith("LIMIT 5")

    def test_limit_out_of_range_returns_422(self, client: TestClient) -> None:
        mock_db = MagicMock()

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/notifications?limit=0")
        finally:
            _teardown_overrides()

        assert response.status_code == 422


class TestGetUnreadCount:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/notifications/unread-count")
        assert response.status_code == 401

    def test_returns_total_and_urgent_counts(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.execute.return_value.one.return_value = (7, 2)

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/notifications/unread-count")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        assert response.json()["data"] == {"unread_count": 7, "urgent_unread_count": 2}

    def test_zero_counts_when_nothing_unread(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.execute.return_value.one.return_value = (0, 0)

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/notifications/unread-count")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        assert response.json()["data"] == {"unread_count": 0, "urgent_unread_count": 0}


class TestListUrgentUnread:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/notifications/urgent-unread")
        assert response.status_code == 401

    def test_returns_serialized_urgent_notifications(self, client: TestClient) -> None:
        notification = _mock_notification(is_urgent=True)
        mock_db = MagicMock()
        mock_db.execute.return_value.all.return_value = [(notification, None, None)]

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/notifications/urgent-unread")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        items = response.json()["data"]
        assert len(items) == 1
        assert items[0]["is_urgent"] is True
        assert items[0]["opportunity_name"] is None
        assert items[0]["account_name"] is None

    def test_empty_list_when_none_urgent(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.execute.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/notifications/urgent-unread")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        assert response.json()["data"] == []
