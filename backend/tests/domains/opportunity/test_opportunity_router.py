import uuid
from datetime import UTC, date, datetime
from decimal import Decimal
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.opportunity.models import Opportunity
from app.domains.organization.models import UserProfile
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
OPP_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")


def _mock_user() -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.is_active = True
    return user


def _mock_nested(**overrides) -> MagicMock:
    obj = MagicMock()
    for k, v in overrides.items():
        setattr(obj, k, v)
    return obj


def _mock_opportunity(**overrides) -> MagicMock:
    now = datetime.now(UTC)
    defaults = {
        "id": OPP_ID,
        "name": "Test Opportunity",
        "win_probability": Decimal("50.00"),
        "indicative_value": None,
        "expected_closure_date": None,
        "demo_start_date": None,
        "demo_end_date": None,
        "po_number": None,
        "loss_reason_id": None,
        "competitor_name": None,
        "hold_reason_id": None,
        "reactivation_date": None,
        "created_at": now,
        "updated_at": now,
        "account": _mock_nested(id=uuid.uuid4(), name="Test Hospital"),
        "stage": _mock_nested(
            id=uuid.uuid4(),
            stage_code="LEAD",
            stage_name="Lead",
            display_order=10,
            default_win_probability=Decimal("5.00"),
        ),
        "status": _mock_nested(id=uuid.uuid4(), status_code="ACTIVE", status_name="Active", is_terminal=False),
        "owner": _mock_nested(id=uuid.uuid4(), display_name="Test Rep"),
        "sbu": _mock_nested(id=uuid.uuid4(), name="Imaging"),
        "project": None,
        "lead_source": None,
    }
    defaults.update(overrides)
    opp = MagicMock(spec=Opportunity)
    for k, v in defaults.items():
        setattr(opp, k, v)
    return opp


def _setup_overrides(mock_db: MagicMock) -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user()
    app.dependency_overrides[get_db] = lambda: mock_db


def _teardown_overrides() -> None:
    app.dependency_overrides.clear()


class TestListPipeline:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/opportunities/pipeline")
        assert response.status_code == 401

    def test_project_and_lead_source_null_when_unset(self, client: TestClient) -> None:
        opp = _mock_opportunity()
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.unique.return_value.all.return_value = [opp]

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/opportunities/pipeline")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        item = response.json()["data"]["items"][0]
        assert item["project"] is None
        assert item["lead_source"] is None

    def test_project_and_lead_source_serialize_when_set(self, client: TestClient) -> None:
        project_id = uuid.uuid4()
        lead_source_id = uuid.uuid4()
        opp = _mock_opportunity(
            project=_mock_nested(id=project_id, name="Radiology Upgrade"),
            lead_source=_mock_nested(id=lead_source_id, name="Referral"),
        )
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.unique.return_value.all.return_value = [opp]

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/opportunities/pipeline")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        item = response.json()["data"]["items"][0]
        assert item["project"] == {"id": str(project_id), "name": "Radiology Upgrade"}
        assert item["lead_source"] == {"id": str(lead_source_id), "name": "Referral"}

    def test_demo_end_date_serializes(self, client: TestClient) -> None:
        opp = _mock_opportunity(demo_end_date=date(2026, 8, 1))
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.unique.return_value.all.return_value = [opp]

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/opportunities/pipeline")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        item = response.json()["data"]["items"][0]
        assert item["demo_end_date"] == "2026-08-01"


class TestGetOpportunity:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get(f"/api/v1/opportunities/{OPP_ID}")
        assert response.status_code == 401

    def test_not_found_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = None

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/opportunities/{OPP_ID}")
        finally:
            _teardown_overrides()

        assert response.status_code == 404

    def test_found_serializes_full_shape(self, client: TestClient) -> None:
        project_id = uuid.uuid4()
        lead_source_id = uuid.uuid4()
        opp = _mock_opportunity(
            project=_mock_nested(id=project_id, name="Radiology Upgrade"),
            lead_source=_mock_nested(id=lead_source_id, name="Referral"),
        )
        mock_db = MagicMock()
        mock_db.scalar.return_value = opp

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/opportunities/{OPP_ID}")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        item = response.json()["data"]
        assert item["id"] == str(OPP_ID)
        assert item["project"] == {"id": str(project_id), "name": "Radiology Upgrade"}
        assert item["lead_source"] == {"id": str(lead_source_id), "name": "Referral"}

    def test_project_and_lead_source_null_when_unset(self, client: TestClient) -> None:
        opp = _mock_opportunity()
        mock_db = MagicMock()
        mock_db.scalar.return_value = opp

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/opportunities/{OPP_ID}")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        item = response.json()["data"]
        assert item["project"] is None
        assert item["lead_source"] is None


class TestListOpportunitiesForStakeholder:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get(f"/api/v1/stakeholders/{uuid.uuid4()}/opportunities")
        assert response.status_code == 401

    def test_returns_empty_list_when_no_links(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/stakeholders/{uuid.uuid4()}/opportunities")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        assert response.json()["data"] == []

    def test_serializes_linked_opportunity(self, client: TestClient) -> None:
        opp = _mock_opportunity()
        mock_db = MagicMock()
        mock_db.scalars.return_value.unique.return_value.all.return_value = [opp]

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/stakeholders/{uuid.uuid4()}/opportunities")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        item = response.json()["data"][0]
        assert item["id"] == str(OPP_ID)
        assert item["stage"]["stage_code"] == "LEAD"
        assert item["status"]["status_code"] == "ACTIVE"


class TestGetStakeholderOpportunityCounts:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get(f"/api/v1/stakeholders/counts?ids={uuid.uuid4()}")
        assert response.status_code == 401

    def test_returns_zero_for_stakeholder_with_no_links(self, client: TestClient) -> None:
        stakeholder_id = uuid.uuid4()
        mock_db = MagicMock()
        mock_db.execute.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/stakeholders/counts?ids={stakeholder_id}")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        assert response.json()["data"] == {str(stakeholder_id): {"opportunity_count": 0}}

    def test_returns_count_for_linked_stakeholder(self, client: TestClient) -> None:
        stakeholder_id = uuid.uuid4()
        row = _mock_nested(stakeholder_id=stakeholder_id, cnt=3)
        mock_db = MagicMock()
        mock_db.execute.return_value.all.return_value = [row]

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/stakeholders/counts?ids={stakeholder_id}")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        assert response.json()["data"] == {str(stakeholder_id): {"opportunity_count": 3}}
