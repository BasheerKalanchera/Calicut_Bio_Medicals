import uuid
from types import SimpleNamespace
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
    # zones mirrors zone_id by default (a single-zone user, the common case) --
    # satisfies the SS3 primary-zone invariant for tests that don't care about
    # multi-zone specifically. Override explicitly (zones=[...]) for a test
    # that needs a genuine multi-zone or empty-zones scenario.
    if "zones" not in overrides:
        defaults["zones"] = (
            [SimpleNamespace(zone_id=defaults["zone_id"])] if defaults["zone_id"] is not None else []
        )
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
        repo.list_active.assert_called_once_with(
            caller, offset=10, limit=25, scope="scoped", include_inactive=False
        )


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

    def test_raises_validation_error_if_manager_in_different_sbu(self):
        manager = _make_user(sbu_id=uuid.uuid4())
        repo = _make_repo()
        repo.get_by_id.side_effect = lambda uid: manager if uid == manager.id else None

        service = UserService(repository=repo)
        data = self._data(manager_id=manager.id, sbu_id=uuid.uuid4())
        with pytest.raises(ValidationError, match="SBU"):
            service.create_user(data, role_name="Admin")

        repo.create.assert_not_called()

    @pytest.mark.parametrize("role_name", ["General Manager", "Admin"])
    def test_allows_admin_or_gm_manager_in_different_sbu(self, role_name):
        # Admin/GM's own sbu_id is a meaningless placeholder (not yet
        # nullable) -- the same-SBU invariant shouldn't apply when they're
        # the one being assigned as manager.
        manager = _make_user(sbu_id=uuid.uuid4())
        manager.role = SimpleNamespace(role_name=role_name)
        new_user = _make_user()
        repo = _make_repo()
        repo.get_by_id.side_effect = lambda uid: manager if uid == manager.id else None
        repo.create.return_value = new_user

        service = UserService(repository=repo)
        data = self._data(manager_id=manager.id, sbu_id=uuid.uuid4())
        result = service.create_user(data, role_name="Admin")

        assert result is new_user
        repo.create.assert_called_once()

    def test_allows_manager_in_same_sbu(self):
        shared_sbu = uuid.uuid4()
        manager = _make_user(sbu_id=shared_sbu)
        new_user = _make_user()
        repo = _make_repo()
        repo.get_by_id.side_effect = lambda uid: manager if uid == manager.id else None
        repo.create.return_value = new_user

        service = UserService(repository=repo)
        data = self._data(manager_id=manager.id, sbu_id=shared_sbu)
        result = service.create_user(data, role_name="Admin")

        assert result is new_user
        repo.create.assert_called_once()

    def test_zone_ids_persisted_via_replace_zones(self):
        zone_a, zone_b = uuid.uuid4(), uuid.uuid4()
        new_user = _make_user()
        repo = _make_repo()
        repo.get_by_id.return_value = None
        repo.create.return_value = new_user

        service = UserService(repository=repo)
        data = self._data(zone_id=zone_a, zone_ids=[zone_a, zone_b])
        service.create_user(data, role_name="Admin")

        repo.replace_zones.assert_called_once_with(new_user, [zone_a, zone_b])

    def test_raises_not_found_for_unknown_zone_in_zone_ids(self):
        unknown_zone = uuid.uuid4()
        repo = _make_repo()
        repo.get_by_id.return_value = None
        repo.zone_exists.side_effect = lambda zid: zid != unknown_zone

        service = UserService(repository=repo)
        data = self._data(zone_ids=[unknown_zone])
        with pytest.raises(NotFoundError, match="Zone"):
            service.create_user(data, role_name="Admin")

        repo.create.assert_not_called()

    def test_raises_validation_error_when_primary_zone_not_in_zone_ids(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None

        service = UserService(repository=repo)
        data = self._data(zone_id=uuid.uuid4(), zone_ids=[uuid.uuid4()])
        with pytest.raises(ValidationError, match="Primary zone_id"):
            service.create_user(data, role_name="Admin")

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

    def test_raises_validation_error_if_manager_in_different_sbu(self):
        user = _make_user(sbu_id=uuid.uuid4())
        manager = _make_user(sbu_id=uuid.uuid4())
        repo = _make_repo()
        repo.get_by_id.side_effect = lambda uid: user if uid == user.id else (manager if uid == manager.id else None)

        service = UserService(repository=repo)
        with pytest.raises(ValidationError, match="SBU"):
            service.update_user(user.id, UserUpdate(manager_id=manager.id), role_name="Admin")

        repo.update.assert_not_called()

    @pytest.mark.parametrize("role_name", ["General Manager", "Admin"])
    def test_allows_admin_or_gm_manager_in_different_sbu(self, role_name):
        user = _make_user(sbu_id=uuid.uuid4())
        manager = _make_user(sbu_id=uuid.uuid4())
        manager.role = SimpleNamespace(role_name=role_name)
        repo = _make_repo()
        repo.get_by_id.side_effect = lambda uid: user if uid == user.id else (manager if uid == manager.id else None)
        repo.update.return_value = user

        service = UserService(repository=repo)
        result = service.update_user(user.id, UserUpdate(manager_id=manager.id), role_name="Admin")

        assert result is user
        repo.update.assert_called_once()

    def test_manager_sbu_check_uses_effective_sbu_id_when_sbu_also_changing(self):
        # PATCH semantics: this update changes sbu_id in the same call, so the
        # manager's SBU should be compared against the *new* value, not the
        # user's current one.
        old_sbu = uuid.uuid4()
        new_sbu = uuid.uuid4()
        user = _make_user(sbu_id=old_sbu)
        manager = _make_user(sbu_id=new_sbu)
        repo = _make_repo()
        repo.get_by_id.side_effect = lambda uid: user if uid == user.id else (manager if uid == manager.id else None)
        repo.update.return_value = user

        service = UserService(repository=repo)
        result = service.update_user(
            user.id, UserUpdate(manager_id=manager.id, sbu_id=new_sbu), role_name="Admin"
        )

        assert result is user
        repo.update.assert_called_once()

    def test_zone_ids_omitted_from_patch_does_not_call_replace_zones(self):
        user = _make_user()
        repo = _make_repo()
        repo.get_by_id.return_value = user
        repo.update.return_value = user

        service = UserService(repository=repo)
        service.update_user(user.id, UserUpdate(display_name="Renamed"), role_name="Admin")

        repo.replace_zones.assert_not_called()

    def test_zone_ids_present_in_patch_calls_replace_zones(self):
        zone_a, zone_b = uuid.uuid4(), uuid.uuid4()
        user = _make_user(zone_id=zone_a)
        repo = _make_repo()
        repo.get_by_id.return_value = user
        repo.update.return_value = user

        service = UserService(repository=repo)
        service.update_user(user.id, UserUpdate(zone_ids=[zone_a, zone_b]), role_name="Admin")

        repo.replace_zones.assert_called_once_with(user, [zone_a, zone_b])

    def test_raises_validation_error_when_effective_primary_zone_not_in_effective_zone_ids(self):
        # zone_id omitted from this PATCH -- falls back to the user's current
        # zone_id, which isn't in the new zone_ids being set.
        current_zone = uuid.uuid4()
        other_zone = uuid.uuid4()
        user = _make_user(zone_id=current_zone)
        repo = _make_repo()
        repo.get_by_id.return_value = user

        service = UserService(repository=repo)
        with pytest.raises(ValidationError, match="Primary zone_id"):
            service.update_user(user.id, UserUpdate(zone_ids=[other_zone]), role_name="Admin")

        repo.update.assert_not_called()
        repo.replace_zones.assert_not_called()
