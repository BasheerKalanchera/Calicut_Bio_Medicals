import uuid
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.domains.organization.models import UserProfile
from app.domains.organization.repository import UserRepository
from app.domains.organization.schemas import UserCreate, UserUpdate
from app.domains.organization.service import UserService


def _make_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=UserRepository)
    repo.sbu_exists.return_value = True
    repo.role_exists.return_value = True
    repo.zone_exists.return_value = True
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


def _make_user(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "display_name": "Sales Rep",
        "sbu_id": uuid.uuid4(),
        "zone_id": uuid.uuid4(),
        "role_id": uuid.uuid4(),
        "manager_id": None,
        "is_active": True,
    }
    defaults.update(overrides)
    obj = MagicMock(spec=UserProfile)
    for k, v in defaults.items():
        setattr(obj, k, v)
    return obj


class TestListActiveUsers:
    def test_forwards_current_user_and_pagination_to_repository(self):
        caller = _make_user()
        repo = _make_repo()
        repo.list_active.return_value = ([caller], 1)

        service = UserService(repository=repo)
        result = service.list_active_users(caller, offset=10, limit=25)

        assert result == ([caller], 1)
        repo.list_active.assert_called_once_with(caller, offset=10, limit=25)


class TestCreateUser:
    def _data(self, **overrides) -> UserCreate:
        defaults = {
            "id": uuid.uuid4(),
            "display_name": "New Rep",
            "sbu_id": uuid.uuid4(),
            "role_id": uuid.uuid4(),
        }
        defaults.update(overrides)
        return UserCreate(**defaults)

    @pytest.mark.parametrize("role_name", ["General Manager", "Admin"])
    def test_allowed_roles_can_create(self, role_name):
        user = _make_user()
        repo = _make_repo()
        repo.get_by_id.return_value = None  # no existing row at this id
        repo.create.return_value = user

        service = UserService(repository=repo)
        result = service.create_user(self._data(), role_name=role_name)

        assert result is user
        repo.create.assert_called_once()

    @pytest.mark.parametrize("role_name", ["Sales Staff", "SBU Manager"])
    def test_disallowed_roles_raise_authorization_error(self, role_name):
        repo = _make_repo()

        service = UserService(repository=repo)
        with pytest.raises(AuthorizationError):
            service.create_user(self._data(), role_name=role_name)

        repo.get_by_id.assert_not_called()
        repo.create.assert_not_called()

    def test_raises_conflict_if_id_already_exists(self):
        existing = _make_user()
        repo = _make_repo()
        repo.get_by_id.return_value = existing

        service = UserService(repository=repo)
        with pytest.raises(ConflictError):
            service.create_user(self._data(id=existing.id), role_name="Admin")

        repo.create.assert_not_called()

    def test_raises_not_found_if_sbu_missing(self):
        repo = _make_repo(sbu_exists=MagicMock(return_value=False))
        repo.get_by_id.return_value = None

        service = UserService(repository=repo)
        with pytest.raises(NotFoundError, match="SBU"):
            service.create_user(self._data(), role_name="Admin")

        repo.create.assert_not_called()

    def test_raises_not_found_if_role_missing(self):
        repo = _make_repo(role_exists=MagicMock(return_value=False))
        repo.get_by_id.return_value = None

        service = UserService(repository=repo)
        with pytest.raises(NotFoundError, match="Role"):
            service.create_user(self._data(), role_name="Admin")

        repo.create.assert_not_called()

    def test_raises_not_found_if_manager_missing(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None  # neither the new id nor the manager id exist

        service = UserService(repository=repo)
        with pytest.raises(NotFoundError, match="Manager"):
            service.create_user(self._data(manager_id=uuid.uuid4()), role_name="Admin")

        repo.create.assert_not_called()


class TestUpdateUser:
    @pytest.mark.parametrize("role_name", ["General Manager", "Admin"])
    def test_allowed_roles_can_update(self, role_name):
        user = _make_user()
        repo = _make_repo()
        repo.get_by_id.return_value = user
        repo.update.return_value = user

        service = UserService(repository=repo)
        result = service.update_user(user.id, UserUpdate(display_name="Renamed"), role_name=role_name)

        assert result is user
        repo.update.assert_called_once()

    @pytest.mark.parametrize("role_name", ["Sales Staff", "SBU Manager"])
    def test_disallowed_roles_raise_authorization_error(self, role_name):
        repo = _make_repo()

        service = UserService(repository=repo)
        with pytest.raises(AuthorizationError):
            service.update_user(uuid.uuid4(), UserUpdate(display_name="Renamed"), role_name=role_name)

        repo.get_by_id.assert_not_called()
        repo.update.assert_not_called()

    def test_raises_not_found_if_user_missing(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None

        service = UserService(repository=repo)
        with pytest.raises(NotFoundError, match="User"):
            service.update_user(uuid.uuid4(), UserUpdate(display_name="Renamed"), role_name="Admin")

        repo.update.assert_not_called()

    def test_raises_validation_error_if_self_manager(self):
        user = _make_user()
        repo = _make_repo()
        repo.get_by_id.return_value = user

        service = UserService(repository=repo)
        with pytest.raises(ValidationError):
            service.update_user(user.id, UserUpdate(manager_id=user.id), role_name="Admin")

        repo.update.assert_not_called()

    def test_raises_not_found_if_manager_missing(self):
        user = _make_user()
        manager_id = uuid.uuid4()
        repo = _make_repo()
        repo.get_by_id.side_effect = lambda uid: user if uid == user.id else None

        service = UserService(repository=repo)
        with pytest.raises(NotFoundError, match="Manager"):
            service.update_user(user.id, UserUpdate(manager_id=manager_id), role_name="Admin")

        repo.update.assert_not_called()
