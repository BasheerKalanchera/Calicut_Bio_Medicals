import uuid
from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError as PydanticValidationError

from app.core.exceptions import NotFoundError
from app.domains.account.models import Stakeholder
from app.domains.account.stakeholder_repository import StakeholderRepository
from app.domains.account.stakeholder_schemas import StakeholderCreate, StakeholderUpdate
from app.domains.account.stakeholder_service import StakeholderService

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_ACCOUNT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")


def _make_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=StakeholderRepository)
    repo.account_exists.return_value = True
    repo.create.side_effect = lambda obj: obj
    repo.update.side_effect = lambda obj: obj
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


def _make_stakeholder(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "account_id": TEST_ACCOUNT_ID,
        "name": "Dr. Test",
        "designation": None,
        "email": None,
        "phone": None,
        "nps_score": 50,
        "sentiment": "Positive",
    }
    defaults.update(overrides)
    obj = MagicMock(spec=Stakeholder)
    for k, v in defaults.items():
        setattr(obj, k, v)
    return obj


class TestListStakeholders:
    def test_returns_stakeholders(self):
        stakeholder = _make_stakeholder()
        repo = _make_repo()
        repo.list_by_account.return_value = [stakeholder]

        service = StakeholderService(repository=repo)
        results = service.list_stakeholders(TEST_ACCOUNT_ID)

        assert len(results) == 1
        repo.list_by_account.assert_called_once_with(TEST_ACCOUNT_ID)

    def test_raises_not_found_for_invalid_account(self):
        repo = _make_repo()
        repo.account_exists.return_value = False

        service = StakeholderService(repository=repo)
        with pytest.raises(NotFoundError, match="Account"):
            service.list_stakeholders(uuid.uuid4())


class TestGetStakeholder:
    def test_returns_stakeholder(self):
        stakeholder = _make_stakeholder()
        repo = _make_repo()
        repo.get_for_update.return_value = stakeholder

        service = StakeholderService(repository=repo)
        assert service.get_stakeholder(stakeholder.id) is stakeholder

    def test_raises_not_found(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None

        service = StakeholderService(repository=repo)
        with pytest.raises(NotFoundError, match="Stakeholder"):
            service.get_stakeholder(uuid.uuid4())


class TestCreateStakeholder:
    def test_creates_stakeholder(self):
        repo = _make_repo()
        service = StakeholderService(repository=repo)

        data = StakeholderCreate(
            name="Dr. New",
            designation="Chief Radiologist",
            email="dr.new@hospital.com",
            phone="+91-9876543210",
            nps_score=80,
            sentiment="Positive",
        )
        result = service.create_stakeholder(
            TEST_ACCOUNT_ID, data, created_by=TEST_USER_ID
        )

        assert result.name == "Dr. New"
        assert result.designation == "Chief Radiologist"
        assert result.email == "dr.new@hospital.com"
        assert result.phone == "+91-9876543210"
        assert result.nps_score == 80
        assert result.account_id == TEST_ACCOUNT_ID
        assert result.created_by == TEST_USER_ID

    def test_raises_not_found_for_invalid_account(self):
        repo = _make_repo()
        repo.account_exists.return_value = False

        service = StakeholderService(repository=repo)
        data = StakeholderCreate(name="Dr. New")

        with pytest.raises(NotFoundError, match="Account"):
            service.create_stakeholder(uuid.uuid4(), data, created_by=TEST_USER_ID)

    def test_creates_with_minimal_data(self):
        repo = _make_repo()
        service = StakeholderService(repository=repo)

        data = StakeholderCreate(name="Dr. Minimal")
        result = service.create_stakeholder(
            TEST_ACCOUNT_ID, data, created_by=TEST_USER_ID
        )

        assert result.name == "Dr. Minimal"
        assert result.nps_score is None
        assert result.sentiment is None


class TestUpdateStakeholder:
    def test_updates_name(self):
        stakeholder = _make_stakeholder()
        repo = _make_repo()
        repo.get_for_update.return_value = stakeholder

        service = StakeholderService(repository=repo)
        data = StakeholderUpdate(name="Dr. Updated")
        result = service.update_stakeholder(
            stakeholder.id, data, updated_by=TEST_USER_ID
        )

        assert result.name == "Dr. Updated"
        assert result.updated_by == TEST_USER_ID

    def test_omitted_field_unchanged(self):
        stakeholder = _make_stakeholder(
            name="Dr. Original", nps_score=70, sentiment="Positive"
        )
        repo = _make_repo()
        repo.get_for_update.return_value = stakeholder

        service = StakeholderService(repository=repo)
        data = StakeholderUpdate(name="Dr. Renamed")
        service.update_stakeholder(stakeholder.id, data, updated_by=TEST_USER_ID)

        assert stakeholder.nps_score == 70
        assert stakeholder.sentiment == "Positive"

    def test_explicit_null_clears_field(self):
        stakeholder = _make_stakeholder(nps_score=70, sentiment="Positive")
        repo = _make_repo()
        repo.get_for_update.return_value = stakeholder

        service = StakeholderService(repository=repo)
        data = StakeholderUpdate.model_validate(
            {"nps_score": None, "sentiment": None}
        )
        service.update_stakeholder(stakeholder.id, data, updated_by=TEST_USER_ID)

        assert stakeholder.nps_score is None
        assert stakeholder.sentiment is None

    def test_raises_not_found(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None

        service = StakeholderService(repository=repo)
        data = StakeholderUpdate(name="Dr. Updated")

        with pytest.raises(NotFoundError, match="Stakeholder"):
            service.update_stakeholder(uuid.uuid4(), data, updated_by=TEST_USER_ID)

    def test_nps_score_above_max_rejected(self):
        with pytest.raises(PydanticValidationError):
            StakeholderCreate(name="Dr. Test", nps_score=101)

    def test_nps_score_below_min_rejected(self):
        with pytest.raises(PydanticValidationError):
            StakeholderCreate(name="Dr. Test", nps_score=-101)
