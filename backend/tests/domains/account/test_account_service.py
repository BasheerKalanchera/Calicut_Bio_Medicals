import uuid
from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError as PydanticValidationError

from app.core.config import settings
from app.core.exceptions import (
    BusinessRuleViolation,
    ConflictError,
    NotFoundError,
    PossibleDuplicateError,
    ValidationError,
)
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
    repo.find_similar_by_name.return_value = []
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
        result = service.create_account(data, created_by=TEST_USER_ID, role_name="Admin")

        assert result.name == "New Hospital"
        assert result.created_by == TEST_USER_ID

    def test_rejects_duplicate_name(self):
        repo = _make_repo()
        repo.exists_by_name.return_value = True

        service = AccountService(repository=repo)
        data = AccountCreate(name="Existing Hospital", zone_id=TEST_ZONE_ID)

        with pytest.raises(ConflictError, match="already exists"):
            service.create_account(data, created_by=TEST_USER_ID, role_name="Admin")

    def test_rejects_invalid_zone(self):
        repo = _make_repo()
        repo.zone_exists.return_value = False

        service = AccountService(repository=repo)
        data = AccountCreate(name="New Hospital", zone_id=uuid.uuid4())

        with pytest.raises(ValidationError, match=r"Zone.*does not exist"):
            service.create_account(data, created_by=TEST_USER_ID, role_name="Admin")

    def test_warns_on_near_duplicate_name(self):
        near_match = _make_account(name="EMS cooperative hospital Cherpulassery")
        repo = _make_repo()
        repo.find_similar_by_name.return_value = [near_match]

        service = AccountService(repository=repo)
        data = AccountCreate(name="Cooperative hos Cherpulassery", zone_id=TEST_ZONE_ID)

        with pytest.raises(PossibleDuplicateError) as exc_info:
            service.create_account(data, created_by=TEST_USER_ID, role_name="Admin")
        assert exc_info.value.candidates == [
            {"id": str(near_match.id), "name": near_match.name}
        ]
        repo.create.assert_not_called()

    def test_warns_with_every_returned_candidate_not_just_the_closest(self):
        first = _make_account(name="EMS cooperative hospital Cherpulassery")
        second = _make_account(name="EMS Coperative Hospital Perambra")
        repo = _make_repo()
        repo.find_similar_by_name.return_value = [first, second]

        service = AccountService(repository=repo)
        data = AccountCreate(name="Cooperative hos Cherpulassery", zone_id=TEST_ZONE_ID)

        with pytest.raises(PossibleDuplicateError) as exc_info:
            service.create_account(data, created_by=TEST_USER_ID, role_name="Admin")
        assert exc_info.value.candidates == [
            {"id": str(first.id), "name": first.name},
            {"id": str(second.id), "name": second.name},
        ]

    def test_passes_configured_threshold_to_repository(self):
        repo = _make_repo()
        service = AccountService(repository=repo)
        data = AccountCreate(name="New Hospital", zone_id=TEST_ZONE_ID)

        service.create_account(data, created_by=TEST_USER_ID, role_name="Admin")

        repo.find_similar_by_name.assert_called_once_with(
            "New Hospital",
            zone_id=TEST_ZONE_ID,
            threshold=settings.ACCOUNT_DUPLICATE_SIMILARITY_THRESHOLD,
        )

    def test_force_create_bypasses_near_duplicate_check(self):
        near_match = _make_account(name="EMS cooperative hospital Cherpulassery")
        repo = _make_repo()
        repo.find_similar_by_name.return_value = [near_match]

        service = AccountService(repository=repo)
        data = AccountCreate(
            name="Cooperative hos Cherpulassery", zone_id=TEST_ZONE_ID, force_create=True
        )

        result = service.create_account(data, created_by=TEST_USER_ID, role_name="Admin")
        assert result.name == "Cooperative hos Cherpulassery"
        repo.find_similar_by_name.assert_not_called()

    def test_rejects_invalid_parent_account(self):
        repo = _make_repo()
        repo.account_exists.return_value = False

        service = AccountService(repository=repo)
        data = AccountCreate(
            name="New Hospital", zone_id=TEST_ZONE_ID, parent_account_id=uuid.uuid4()
        )

        with pytest.raises(ValidationError, match=r"Parent account.*does not exist"):
            service.create_account(data, created_by=TEST_USER_ID, role_name="Admin")

    def test_accepts_valid_payer_behavior(self):
        repo = _make_repo()
        service = AccountService(repository=repo)

        data = AccountCreate(name="New Hospital", zone_id=TEST_ZONE_ID, payer_behavior="GOOD")
        result = service.create_account(data, created_by=TEST_USER_ID, role_name="Admin")
        assert result.payer_behavior == "GOOD"

    def test_falls_back_to_default_zone_id_when_data_zone_id_missing(self):
        # AccountBase.zone_id is Pydantic-required today, so this path isn't
        # reachable via the live /accounts endpoint as things stand -- but the
        # service method itself still carries the fallback (Milestone 1's
        # design doc SS3: current_user.zone_id stays the correct default even
        # for multi-zone users), so it's pinned here at the service layer,
        # independent of whether the schema ever relaxes zone_id to optional.
        repo = _make_repo()
        service = AccountService(repository=repo)

        data = AccountCreate.model_construct(name="New Hospital", zone_id=None)
        result = service.create_account(
            data, created_by=TEST_USER_ID, role_name="Admin", default_zone_id=TEST_ZONE_ID
        )

        assert result.zone_id == TEST_ZONE_ID

    def test_raises_when_neither_zone_id_nor_default_zone_id_present(self):
        # role_name="Admin" here specifically, so this pins the pre-existing
        # "Zone is required" check, not the newer zone-assignment block below
        # (TestZoneAssignmentRequired), which only applies to non-exempt roles.
        repo = _make_repo()
        service = AccountService(repository=repo)

        data = AccountCreate.model_construct(name="New Hospital", zone_id=None)

        with pytest.raises(ValidationError, match="Zone is required"):
            service.create_account(data, created_by=TEST_USER_ID, role_name="Admin", default_zone_id=None)

    def test_rejects_invalid_payer_behavior(self):
        with pytest.raises(PydanticValidationError):
            AccountCreate(name="New Hospital", zone_id=TEST_ZONE_ID, payer_behavior="RANDOM_VALUE")

    def test_accepts_valid_customer_type(self):
        repo = _make_repo()
        service = AccountService(repository=repo)

        data = AccountCreate(name="New Hospital", zone_id=TEST_ZONE_ID, customer_type="DIAGNOSTIC_CENTER")
        result = service.create_account(data, created_by=TEST_USER_ID, role_name="Admin")
        assert result.customer_type == "DIAGNOSTIC_CENTER"

    def test_rejects_invalid_customer_type(self):
        with pytest.raises(PydanticValidationError):
            AccountCreate(name="New Hospital", zone_id=TEST_ZONE_ID, customer_type="RANDOM_VALUE")


class TestZoneAssignmentRequired:
    """A rep with no territory on file can't add a hospital at all, regardless
    of what zone_id they'd otherwise submit -- see AccountService.create_account's
    _ZONE_ASSIGNMENT_EXEMPT_ROLES check."""

    def test_rejects_non_admin_with_no_zone_assigned(self):
        repo = _make_repo()
        service = AccountService(repository=repo)
        data = AccountCreate(name="New Hospital", zone_id=TEST_ZONE_ID)

        with pytest.raises(BusinessRuleViolation, match="territory assigned"):
            service.create_account(
                data, created_by=TEST_USER_ID, role_name="Area Manager", default_zone_id=None
            )
        repo.create.assert_not_called()

    def test_allows_non_admin_with_zone_assigned(self):
        repo = _make_repo()
        service = AccountService(repository=repo)
        data = AccountCreate(name="New Hospital", zone_id=TEST_ZONE_ID)

        result = service.create_account(
            data, created_by=TEST_USER_ID, role_name="Area Manager", default_zone_id=TEST_ZONE_ID
        )
        assert result.name == "New Hospital"

    def test_admin_exempt_even_with_no_zone_assigned(self):
        repo = _make_repo()
        service = AccountService(repository=repo)
        data = AccountCreate(name="New Hospital", zone_id=TEST_ZONE_ID)

        result = service.create_account(
            data, created_by=TEST_USER_ID, role_name="Admin", default_zone_id=None
        )
        assert result.name == "New Hospital"

    def test_general_manager_exempt_even_with_no_zone_assigned(self):
        repo = _make_repo()
        service = AccountService(repository=repo)
        data = AccountCreate(name="New Hospital", zone_id=TEST_ZONE_ID)

        result = service.create_account(
            data, created_by=TEST_USER_ID, role_name="General Manager", default_zone_id=None
        )
        assert result.name == "New Hospital"


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

    def test_updates_customer_type(self):
        account = _make_account(customer_type=None)
        repo = _make_repo()
        repo.get_for_update.return_value = account

        service = AccountService(repository=repo)
        data = AccountUpdate.model_validate({"customer_type": "CLINIC"})
        result = service.update_account(account.id, data, updated_by=TEST_USER_ID)

        assert result.customer_type == "CLINIC"

    def test_rejects_invalid_customer_type_on_update(self):
        with pytest.raises(PydanticValidationError):
            AccountUpdate.model_validate({"customer_type": "RANDOM_VALUE"})

    def test_rejects_deeper_cycle(self):
        account_id = uuid.uuid4()
        b_id = uuid.uuid4()
        c_id = uuid.uuid4()
        account = _make_account(id=account_id)
        repo = _make_repo()
        repo.get_for_update.return_value = account
        # Proposed parent B's own ancestor chain is B -> C -> account_id,
        # i.e. reparenting under B would loop back to the account itself.
        repo.get_parent_id.side_effect = lambda aid: {b_id: c_id, c_id: account_id}.get(aid)

        service = AccountService(repository=repo)
        data = AccountUpdate.model_validate({"parent_account_id": str(b_id)})

        with pytest.raises(ValidationError, match="circular reference"):
            service.update_account(account_id, data, updated_by=TEST_USER_ID)

    def test_accepts_legitimate_reparent(self):
        account_id = uuid.uuid4()
        new_parent_id = uuid.uuid4()
        unrelated_ancestor_id = uuid.uuid4()
        account = _make_account(id=account_id)
        repo = _make_repo()
        repo.get_for_update.return_value = account
        # new_parent_id's ancestor chain never loops back to account_id.
        repo.get_parent_id.side_effect = lambda aid: {new_parent_id: unrelated_ancestor_id}.get(aid)

        service = AccountService(repository=repo)
        data = AccountUpdate.model_validate({"parent_account_id": str(new_parent_id)})
        result = service.update_account(account_id, data, updated_by=TEST_USER_ID)

        assert result.parent_account_id == new_parent_id


class TestUpdateAccountNearDuplicateCheck:
    """Same BR-ACC-03 warning as TestCreateAccount's, applied to a rename --
    see update_account's is_rename branch."""

    def test_warns_on_rename_to_near_duplicate_name(self):
        account = _make_account(name="Old Name")
        near_match = _make_account(name="EMS cooperative hospital Cherpulassery")
        repo = _make_repo()
        repo.get_for_update.return_value = account
        repo.find_similar_by_name.return_value = [near_match]

        service = AccountService(repository=repo)
        data = AccountUpdate(name="Cooperative hos Cherpulassery")

        with pytest.raises(PossibleDuplicateError) as exc_info:
            service.update_account(account.id, data, updated_by=TEST_USER_ID)
        assert exc_info.value.candidates == [
            {"id": str(near_match.id), "name": near_match.name}
        ]
        repo.update.assert_not_called()

    def test_excludes_the_account_itself_from_candidates(self):
        account = _make_account(name="Old Name")
        repo = _make_repo()
        repo.get_for_update.return_value = account

        service = AccountService(repository=repo)
        data = AccountUpdate(name="New Name")
        service.update_account(account.id, data, updated_by=TEST_USER_ID)

        repo.find_similar_by_name.assert_called_once_with(
            "New Name",
            zone_id=account.zone_id,
            threshold=settings.ACCOUNT_DUPLICATE_SIMILARITY_THRESHOLD,
            exclude_id=account.id,
        )

    def test_force_create_bypasses_near_duplicate_check_on_rename(self):
        account = _make_account(name="Old Name")
        near_match = _make_account(name="EMS cooperative hospital Cherpulassery")
        repo = _make_repo()
        repo.get_for_update.return_value = account
        repo.find_similar_by_name.return_value = [near_match]

        service = AccountService(repository=repo)
        data = AccountUpdate(name="Cooperative hos Cherpulassery", force_create=True)
        result = service.update_account(account.id, data, updated_by=TEST_USER_ID)

        assert result.name == "Cooperative hos Cherpulassery"
        repo.find_similar_by_name.assert_not_called()

    def test_does_not_check_when_name_unchanged(self):
        account = _make_account(name="Same Name")
        repo = _make_repo()
        repo.get_for_update.return_value = account

        service = AccountService(repository=repo)
        data = AccountUpdate(name="Same Name", payer_behavior="GOOD")
        service.update_account(account.id, data, updated_by=TEST_USER_ID)

        repo.find_similar_by_name.assert_not_called()

    def test_does_not_check_when_name_not_in_update(self):
        account = _make_account(name="Existing Name")
        repo = _make_repo()
        repo.get_for_update.return_value = account

        service = AccountService(repository=repo)
        data = AccountUpdate.model_validate({"payer_behavior": "GOOD"})
        service.update_account(account.id, data, updated_by=TEST_USER_ID)

        repo.find_similar_by_name.assert_not_called()

    def test_uses_new_zone_id_when_zone_also_changes(self):
        account = _make_account(name="Old Name", zone_id=TEST_ZONE_ID)
        new_zone_id = uuid.uuid4()
        repo = _make_repo()
        repo.get_for_update.return_value = account

        service = AccountService(repository=repo)
        data = AccountUpdate.model_validate({"name": "New Name", "zone_id": str(new_zone_id)})
        service.update_account(account.id, data, updated_by=TEST_USER_ID)

        repo.find_similar_by_name.assert_called_once_with(
            "New Name",
            zone_id=new_zone_id,
            threshold=settings.ACCOUNT_DUPLICATE_SIMILARITY_THRESHOLD,
            exclude_id=account.id,
        )
