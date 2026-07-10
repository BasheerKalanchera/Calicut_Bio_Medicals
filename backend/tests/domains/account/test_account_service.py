import uuid
from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError as PydanticValidationError

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.domains.account.models import Account
from app.domains.account.repository import AccountRepository
from app.domains.account.schemas import AccountCreate, AccountUpdate
from app.domains.account.service import AccountService

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_ZONE_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
TEST_PARENT_ID = uuid.UUID("44444444-4444-4444-4444-444444444444")


def _make_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=AccountRepository)
    repo.exists_by_name.return_value = False
    repo.zone_exists.return_value = True
    repo.account_exists.return_value = True
    repo.create.side_effect = lambda obj: obj
    repo.update.side_effect = lambda obj: obj
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


def _make_account(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "name": "Test Hospital",
        "parent_account_id": None,
        "zone_id": TEST_ZONE_ID,
        "payer_behavior": "GOOD",
    }
    defaults.update(overrides)
    account = MagicMock(spec=Account)
    for k, v in defaults.items():
        setattr(account, k, v)
    return account


class TestGetAccount:
    def test_returns_account(self):
        account = _make_account()
        repo = _make_repo()
        repo.get_by_id.return_value = account

        service = AccountService(repository=repo)
        assert service.get_account(account.id) is account

    def test_raises_not_found(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None

        service = AccountService(repository=repo)
        with pytest.raises(NotFoundError, match="not found"):
            service.get_account(uuid.uuid4())


class TestListAccounts:
    def test_delegates_to_repository(self):
        repo = _make_repo()
        repo.list_accounts.return_value = ([], 0)

        service = AccountService(repository=repo)
        _results, total = service.list_accounts(offset=0, limit=10, search="test")

        repo.list_accounts.assert_called_once_with(
            offset=0, limit=10, search="test", zone_id=None
        )
        assert total == 0


class TestListChildren:
    def test_delegates_to_repository(self):
        child = _make_account(name="Child Hospital")
        repo = _make_repo()
        repo.list_children.return_value = [child]

        service = AccountService(repository=repo)
        account_id = uuid.uuid4()
        results = service.list_children(account_id)

        repo.list_children.assert_called_once_with(account_id)
        assert results == [child]


class TestCreateAccount:
    def test_creates_account(self):
        repo = _make_repo()
        service = AccountService(repository=repo)

        data = AccountCreate(name="New Hospital", zone_id=TEST_ZONE_ID)
        result = service.create_account(data, created_by=TEST_USER_ID)

        assert result.name == "New Hospital"
        assert result.created_by == TEST_USER_ID

    def test_rejects_duplicate_name(self):
        repo = _make_repo()
        repo.exists_by_name.return_value = True

        service = AccountService(repository=repo)
        data = AccountCreate(name="Existing Hospital", zone_id=TEST_ZONE_ID)

        with pytest.raises(ConflictError, match="already exists"):
            service.create_account(data, created_by=TEST_USER_ID)

    def test_rejects_invalid_zone(self):
        repo = _make_repo()
        repo.zone_exists.return_value = False

        service = AccountService(repository=repo)
        data = AccountCreate(name="New Hospital", zone_id=uuid.uuid4())

        with pytest.raises(ValidationError, match=r"Zone.*does not exist"):
            service.create_account(data, created_by=TEST_USER_ID)

    def test_rejects_invalid_parent_account(self):
        repo = _make_repo()
        repo.account_exists.return_value = False

        service = AccountService(repository=repo)
        data = AccountCreate(
            name="New Hospital", zone_id=TEST_ZONE_ID, parent_account_id=uuid.uuid4()
        )

        with pytest.raises(ValidationError, match=r"Parent account.*does not exist"):
            service.create_account(data, created_by=TEST_USER_ID)

    def test_accepts_valid_payer_behavior(self):
        repo = _make_repo()
        service = AccountService(repository=repo)

        data = AccountCreate(name="New Hospital", zone_id=TEST_ZONE_ID, payer_behavior="GOOD")
        result = service.create_account(data, created_by=TEST_USER_ID)
        assert result.payer_behavior == "GOOD"

    def test_rejects_invalid_payer_behavior(self):
        with pytest.raises(PydanticValidationError):
            AccountCreate(name="New Hospital", zone_id=TEST_ZONE_ID, payer_behavior="RANDOM_VALUE")


class TestUpdateAccount:
    def test_updates_name(self):
        account = _make_account(name="Old Name")
        repo = _make_repo()
        repo.get_for_update.return_value = account

        service = AccountService(repository=repo)
        data = AccountUpdate(name="New Name")
        result = service.update_account(account.id, data, updated_by=TEST_USER_ID)

        assert result.name == "New Name"
        assert result.updated_by == TEST_USER_ID

    def test_omitted_field_unchanged(self):
        account = _make_account(
            name="Hospital",
            zone_id=TEST_ZONE_ID,
            parent_account_id=TEST_PARENT_ID,
            payer_behavior="GOOD",
        )
        repo = _make_repo()
        repo.get_for_update.return_value = account

        service = AccountService(repository=repo)
        data = AccountUpdate(name="Renamed Hospital")
        service.update_account(account.id, data, updated_by=TEST_USER_ID)

        assert account.zone_id == TEST_ZONE_ID
        assert account.parent_account_id == TEST_PARENT_ID
        assert account.payer_behavior == "GOOD"

    def test_explicit_null_clears_field(self):
        account = _make_account(
            parent_account_id=TEST_PARENT_ID,
            payer_behavior="GOOD",
        )
        repo = _make_repo()
        repo.get_for_update.return_value = account

        service = AccountService(repository=repo)
        data = AccountUpdate.model_validate(
            {"parent_account_id": None, "payer_behavior": None}
        )
        service.update_account(account.id, data, updated_by=TEST_USER_ID)

        assert account.parent_account_id is None
        assert account.payer_behavior is None

    def test_rejects_duplicate_name_on_update(self):
        account = _make_account(name="Old Name")
        repo = _make_repo()
        repo.get_for_update.return_value = account
        repo.exists_by_name.return_value = True

        service = AccountService(repository=repo)
        data = AccountUpdate(name="Taken Name")

        with pytest.raises(ConflictError, match="already exists"):
            service.update_account(account.id, data, updated_by=TEST_USER_ID)

    def test_raises_not_found(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None

        service = AccountService(repository=repo)
        data = AccountUpdate(name="New Name")

        with pytest.raises(NotFoundError):
            service.update_account(uuid.uuid4(), data, updated_by=TEST_USER_ID)

    def test_rejects_self_parent(self):
        account_id = uuid.uuid4()
        account = _make_account(id=account_id)
        repo = _make_repo()
        repo.get_for_update.return_value = account

        service = AccountService(repository=repo)
        data = AccountUpdate.model_validate({"parent_account_id": str(account_id)})

        with pytest.raises(ValidationError, match="cannot be its own parent"):
            service.update_account(account_id, data, updated_by=TEST_USER_ID)

    def test_rejects_invalid_zone_on_update(self):
        account = _make_account()
        repo = _make_repo()
        repo.get_for_update.return_value = account
        repo.zone_exists.return_value = False

        service = AccountService(repository=repo)
        data = AccountUpdate.model_validate({"zone_id": str(uuid.uuid4())})

        with pytest.raises(ValidationError, match=r"Zone.*does not exist"):
            service.update_account(account.id, data, updated_by=TEST_USER_ID)

    def test_rejects_invalid_parent_on_update(self):
        account = _make_account()
        repo = _make_repo()
        repo.get_for_update.return_value = account
        repo.account_exists.return_value = False

        service = AccountService(repository=repo)
        data = AccountUpdate.model_validate({"parent_account_id": str(uuid.uuid4())})

        with pytest.raises(ValidationError, match=r"Parent account.*does not exist"):
            service.update_account(account.id, data, updated_by=TEST_USER_ID)

    def test_rejects_invalid_payer_behavior_on_update(self):
        with pytest.raises(PydanticValidationError):
            AccountUpdate.model_validate({"payer_behavior": "RANDOM_VALUE"})
