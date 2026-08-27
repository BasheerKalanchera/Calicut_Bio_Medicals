"""
Router-level tests for GET /activities (Daily Activity Report). Drives the
real repository/service against a mocked DB, following
tests/domains/opportunity/test_opportunity_router.py's pattern exactly.
There's no 403/allow-deny case here -- unlike a write endpoint, every
authenticated role can call this endpoint, they just get their own tier's
scope (see test_activity_repository.py for the scoping itself).
"""

import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.activity.models import Activity
from app.domains.organization.models import UserProfile
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
ACCOUNT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")


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


def _mock_activity(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "activity_type": "VISIT",
        "activity_date": datetime(2026, 8, 6, 10, 0, 0, tzinfo=UTC),
        "notes": "Discussed pricing",
        "outcome_notes": None,
        "account": _mock_nested(id=ACCOUNT_ID, name="Test Hospital"),
        "opportunity": None,
        "project": None,
        "user": _mock_nested(id=TEST_USER_ID, display_name="Test Rep"),
    }
    defaults.update(overrides)
    activity = MagicMock(spec=Activity)
    for k, v in defaults.items():
        setattr(activity, k, v)
    return activity


def _setup_overrides(mock_db: MagicMock, role_name: str = "Admin") -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user(role_name)
    app.dependency_overrides[get_db] = lambda: mock_db


def _teardown_overrides() -> None:
    app.dependency_overrides.clear()


class TestListDailyActivityReport:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/activities", params={"report_date": "2026-08-06"})
        assert response.status_code == 401

    def test_missing_report_date_returns_422(self, client: TestClient) -> None:
        _setup_overrides(MagicMock())
        try:
            response = client.get("/api/v1/activities")
        finally:
            _teardown_overrides()

        assert response.status_code == 422

    def test_admin_sees_correctly_shaped_rows(self, client: TestClient) -> None:
        activity = _mock_activity()
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.unique.return_value.all.return_value = [activity]

        _setup_overrides(mock_db, role_name="Admin")
        try:
            response = client.get("/api/v1/activities", params={"report_date": "2026-08-06"})
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()["data"]
        assert body["total"] == 1
        item = body["items"][0]
        assert item["activity_type"] == "VISIT"
        assert item["account"] == {"id": str(ACCOUNT_ID), "name": "Test Hospital"}
        assert item["opportunity"] is None
        assert item["project"] is None
        assert item["user"] == {"id": str(TEST_USER_ID), "display_name": "Test Rep"}

    def test_sales_development_row_with_no_account_serializes(self, client: TestClient) -> None:
        # BR-ACT-09: account is genuinely null for these rows, not a mock gap.
        activity = _mock_activity(
            activity_type="CONFERENCE_EXPO",
            account=None,
            outcome_notes="Learned about the new imaging line",
        )
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.unique.return_value.all.return_value = [activity]

        _setup_overrides(mock_db, role_name="Admin")
        try:
            response = client.get("/api/v1/activities", params={"report_date": "2026-08-06"})
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        item = response.json()["data"]["items"][0]
        assert item["activity_type"] == "CONFERENCE_EXPO"
        assert item["account"] is None
        assert item["outcome_notes"] == "Learned about the new imaging line"

    def test_relationship_support_row_backfills_opportunity_name(self, client: TestClient) -> None:
        # BR-ACT-10: opportunity=None here isn't a mock gap -- it's the real
        # RLS-blocked case (Opportunity's own tier-visibility RLS, not
        # activity's), and the router should backfill the name via the same
        # unscoped lookup the picker itself uses, since the caller already
        # saw and chose this name.
        opp_id = uuid.uuid4()
        activity = _mock_activity(
            activity_type="RELATIONSHIP_SUPPORT",
            account_id=ACCOUNT_ID,
            opportunity_id=opp_id,
            opportunity=None,
            notes="Introduced the contact",
        )
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1  # count_by_date + account_exists (in the backfill)
        mock_db.scalars.return_value.unique.return_value.all.return_value = [activity]
        mock_db.execute.return_value.all.return_value = [
            _mock_nested(id=opp_id, name="A Deal Belonging To Someone Else"),
        ]

        _setup_overrides(mock_db, role_name="Sales Staff")
        try:
            response = client.get("/api/v1/activities", params={"report_date": "2026-08-06"})
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        item = response.json()["data"]["items"][0]
        assert item["opportunity"] == {"id": str(opp_id), "name": "A Deal Belonging To Someone Else"}

    def test_relationship_support_row_stays_null_when_lookup_has_no_match(self, client: TestClient) -> None:
        # Defensive: if the account's lookup somehow doesn't contain this
        # opportunity (e.g. it was deleted), don't fabricate a row -- leave
        # opportunity null rather than guessing.
        activity = _mock_activity(
            activity_type="RELATIONSHIP_SUPPORT",
            account_id=ACCOUNT_ID,
            opportunity_id=uuid.uuid4(),
            opportunity=None,
            notes="Introduced the contact",
        )
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.unique.return_value.all.return_value = [activity]
        mock_db.execute.return_value.all.return_value = []

        _setup_overrides(mock_db, role_name="Sales Staff")
        try:
            response = client.get("/api/v1/activities", params={"report_date": "2026-08-06"})
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        item = response.json()["data"]["items"][0]
        assert item["opportunity"] is None

    def test_sales_staff_can_also_call_it(self, client: TestClient) -> None:
        # No allow/deny gate -- every role is authorized, scoping happens in
        # the query itself (test_activity_repository.py covers that).
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        _setup_overrides(mock_db, role_name="Sales Staff")
        try:
            response = client.get("/api/v1/activities", params={"report_date": "2026-08-06"})
        finally:
            _teardown_overrides()

        assert response.status_code == 200

    def test_optional_user_id_and_paging_params_accepted(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get(
                "/api/v1/activities",
                params={
                    "report_date": "2026-08-06",
                    "user_id": str(uuid.uuid4()),
                    "page": 2,
                    "page_size": 25,
                },
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()["data"]
        assert body["page"] == 2
        assert body["page_size"] == 25


class TestListAccountOpportunitiesLookup:
    """
    GET /accounts/{account_id}/opportunities/lookup (BR-ACT-10) -- feeds the
    Relationship Support "Related Opportunity" picker. Deliberately unscoped
    by the caller's own SBU/zone tier; that's the entire point of the
    feature, not a bug -- see the schema's own docstring.
    """

    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get(f"/api/v1/accounts/{ACCOUNT_ID}/opportunities/lookup")
        assert response.status_code == 401

    def test_returns_id_and_name_only(self, client: TestClient) -> None:
        opp_id = uuid.uuid4()
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1  # account_exists
        mock_db.execute.return_value.all.return_value = [
            _mock_nested(id=opp_id, name="A Deal Belonging To Someone Else"),
        ]

        _setup_overrides(mock_db, role_name="Sales Staff")
        try:
            response = client.get(f"/api/v1/accounts/{ACCOUNT_ID}/opportunities/lookup")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        items = response.json()["data"]
        assert items == [{"id": str(opp_id), "name": "A Deal Belonging To Someone Else"}]

    def test_missing_account_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0  # account_exists -> False

        _setup_overrides(mock_db, role_name="Sales Staff")
        try:
            response = client.get(f"/api/v1/accounts/{uuid.uuid4()}/opportunities/lookup")
        finally:
            _teardown_overrides()

        assert response.status_code == 404
