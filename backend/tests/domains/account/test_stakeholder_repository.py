import uuid
from unittest.mock import MagicMock

from app.domains.account.models import Stakeholder
from app.domains.account.stakeholder_repository import StakeholderRepository


def _make_stakeholder(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "account_id": uuid.uuid4(),
        "name": "Dr. Test",
        "nps_score": 50,
        "sentiment": "Positive",
    }
    defaults.update(overrides)
    obj = MagicMock(spec=Stakeholder)
    for k, v in defaults.items():
        setattr(obj, k, v)
    return obj


class TestStakeholderRepositoryGetById:
    def test_returns_stakeholder_when_found(self):
        stakeholder = _make_stakeholder()
        mock_db = MagicMock()
        mock_db.get.return_value = stakeholder

        repo = StakeholderRepository(mock_db)
        assert repo.get_by_id(stakeholder.id) is stakeholder

    def test_returns_none_when_not_found(self):
        mock_db = MagicMock()
        mock_db.get.return_value = None

        repo = StakeholderRepository(mock_db)
        assert repo.get_by_id(uuid.uuid4()) is None


class TestStakeholderRepositoryListByAccount:
    def test_returns_stakeholders_for_account(self):
        stakeholder = _make_stakeholder()
        mock_db = MagicMock()
        mock_db.scalars.return_value.unique.return_value.all.return_value = [stakeholder]

        repo = StakeholderRepository(mock_db)
        results = repo.list_by_account(stakeholder.account_id)

        assert len(results) == 1
        assert results[0] is stakeholder

    def test_returns_empty_when_no_stakeholders(self):
        mock_db = MagicMock()
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        repo = StakeholderRepository(mock_db)
        assert repo.list_by_account(uuid.uuid4()) == []


class TestStakeholderRepositoryCreate:
    def test_creates_and_flushes(self):
        stakeholder = _make_stakeholder()
        mock_db = MagicMock()

        repo = StakeholderRepository(mock_db)
        result = repo.create(stakeholder)

        mock_db.add.assert_called_once_with(stakeholder)
        mock_db.flush.assert_called_once()
        assert result is stakeholder


class TestStakeholderRepositoryAccountExists:
    def test_returns_true_when_account_found(self):
        mock_db = MagicMock()
        mock_db.get.return_value = MagicMock()

        repo = StakeholderRepository(mock_db)
        assert repo.account_exists(uuid.uuid4()) is True

    def test_returns_false_when_account_not_found(self):
        mock_db = MagicMock()
        mock_db.get.return_value = None

        repo = StakeholderRepository(mock_db)
        assert repo.account_exists(uuid.uuid4()) is False
