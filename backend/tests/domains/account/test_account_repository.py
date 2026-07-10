import uuid
from unittest.mock import MagicMock

from app.domains.account.models import Account
from app.domains.account.repository import AccountRepository


def _make_account(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "name": "Test Hospital",
        "parent_account_id": None,
        "zone_id": None,
        "payer_behavior": None,
    }
    defaults.update(overrides)
    account = MagicMock(spec=Account)
    for k, v in defaults.items():
        setattr(account, k, v)
    return account


class TestAccountRepositoryGetById:
    def test_returns_account_when_found(self):
        account = _make_account()
        mock_db = MagicMock()
        mock_db.get.return_value = account

        repo = AccountRepository(mock_db)
        result = repo.get_by_id(account.id)

        assert result is account
        mock_db.get.assert_called_once_with(Account, account.id)

    def test_returns_none_when_not_found(self):
        mock_db = MagicMock()
        mock_db.get.return_value = None

        repo = AccountRepository(mock_db)
        result = repo.get_by_id(uuid.uuid4())

        assert result is None


class TestAccountRepositoryListAccounts:
    def test_returns_accounts_and_total(self):
        account = _make_account()
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.unique.return_value.all.return_value = [account]

        repo = AccountRepository(mock_db)
        results, total = repo.list_accounts()

        assert total == 1
        assert len(results) == 1
        assert results[0] is account

    def test_returns_empty_when_no_accounts(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        repo = AccountRepository(mock_db)
        results, total = repo.list_accounts()

        assert total == 0
        assert results == []

    def test_applies_pagination(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        repo = AccountRepository(mock_db)
        repo.list_accounts(offset=10, limit=5)

        mock_db.scalars.assert_called_once()


class TestAccountRepositoryListChildren:
    def test_returns_children(self):
        child = _make_account(name="Child Hospital")
        mock_db = MagicMock()
        mock_db.scalars.return_value.unique.return_value.all.return_value = [child]

        repo = AccountRepository(mock_db)
        results = repo.list_children(uuid.uuid4())

        assert results == [child]

    def test_returns_empty_when_no_children(self):
        mock_db = MagicMock()
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        repo = AccountRepository(mock_db)
        results = repo.list_children(uuid.uuid4())

        assert results == []


class TestAccountRepositoryCreate:
    def test_creates_and_flushes(self):
        account = _make_account()
        mock_db = MagicMock()

        repo = AccountRepository(mock_db)
        result = repo.create(account)

        mock_db.add.assert_called_once_with(account)
        mock_db.flush.assert_called_once()
        assert result is account


class TestAccountRepositoryExistsByName:
    def test_returns_true_when_exists(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1

        repo = AccountRepository(mock_db)
        assert repo.exists_by_name("Test Hospital") is True

    def test_returns_false_when_not_exists(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0

        repo = AccountRepository(mock_db)
        assert repo.exists_by_name("Nonexistent") is False


class TestAccountRepositoryZoneExists:
    def test_returns_true_when_zone_found(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1

        repo = AccountRepository(mock_db)
        assert repo.zone_exists(uuid.uuid4()) is True

    def test_returns_false_when_zone_not_found(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0

        repo = AccountRepository(mock_db)
        assert repo.zone_exists(uuid.uuid4()) is False


class TestAccountRepositoryAccountExists:
    def test_returns_true_when_account_found(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1

        repo = AccountRepository(mock_db)
        assert repo.account_exists(uuid.uuid4()) is True

    def test_returns_false_when_account_not_found(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0

        repo = AccountRepository(mock_db)
        assert repo.account_exists(uuid.uuid4()) is False
