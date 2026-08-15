import uuid
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import (
    AuthorizationError,
    BusinessRuleViolation,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.domains.reference.models import Zone
from app.domains.reference.repository import ZoneRepository
from app.domains.reference.schemas import ZoneCreate, ZoneUpdate
from app.domains.reference.service import ZoneAdminService

ADMIN = "Admin"
GM = "General Manager"
NON_ADMIN_ROLES = ["SBU Manager", "Area Manager", "Sales Staff"]


def _make_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=ZoneRepository)
    repo.zone_exists.return_value = True
    repo.exists_by_name.return_value = False
    repo.create.side_effect = lambda obj: obj
    repo.update.side_effect = lambda obj: obj
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


def _make_zone(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "name": "Test Zone",
        "parent_zone_id": None,
        "zone_level": None,
        "is_active": True,
    }
    defaults.update(overrides)
    zone = MagicMock(spec=Zone)
    for k, v in defaults.items():
        setattr(zone, k, v)
    return zone


class TestAuthorizationGate:
    @pytest.mark.parametrize("role", NON_ADMIN_ROLES)
    def test_non_admin_rejected_on_every_mutating_method(self, role):
        repo = _make_repo()
        service = ZoneAdminService(repository=repo)
        zone_id = uuid.uuid4()

        with pytest.raises(AuthorizationError):
            service.get_tree(role_name=role)
        with pytest.raises(AuthorizationError):
            service.create_zone(ZoneCreate(name="X"), role_name=role)
        with pytest.raises(AuthorizationError):
            service.update_zone(zone_id, ZoneUpdate(name="X"), role_name=role)
        with pytest.raises(AuthorizationError):
            service.deprecate_zone(zone_id, role_name=role)
        with pytest.raises(AuthorizationError):
            service.blast_radius(zone_id, role_name=role)
        with pytest.raises(AuthorizationError):
            service.rebuild_all_closure(role_name=role)

    @pytest.mark.parametrize("role", [ADMIN, GM])
    def test_admin_and_gm_both_allowed(self, role):
        repo = _make_repo()
        repo.get_tree.return_value = []
        service = ZoneAdminService(repository=repo)

        result = service.get_tree(role_name=role)
        assert result == []


class TestCreateZone:
    def test_creates_top_level_zone_no_closure_issue(self):
        repo = _make_repo()
        service = ZoneAdminService(repository=repo)

        service.create_zone(ZoneCreate(name="Kerala"), role_name=ADMIN)

        repo.create.assert_called_once()
        repo.rebuild_all_closure.assert_called_once()

    def test_rejects_nonexistent_parent(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None
        service = ZoneAdminService(repository=repo)

        with pytest.raises(NotFoundError):
            service.create_zone(ZoneCreate(name="X", parent_zone_id=uuid.uuid4()), role_name=ADMIN)
        repo.create.assert_not_called()

    def test_rejects_deprecated_parent(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_zone(is_active=False)
        service = ZoneAdminService(repository=repo)

        with pytest.raises(BusinessRuleViolation, match="deprecated"):
            service.create_zone(ZoneCreate(name="X", parent_zone_id=uuid.uuid4()), role_name=ADMIN)
        repo.create.assert_not_called()

    def test_rejects_duplicate_name_under_same_parent(self):
        repo = _make_repo()
        repo.exists_by_name.return_value = True
        service = ZoneAdminService(repository=repo)

        with pytest.raises(ConflictError, match="already exists"):
            service.create_zone(ZoneCreate(name="Kozhikode"), role_name=ADMIN)
        repo.create.assert_not_called()


class TestUpdateZone:
    def test_rename_only_does_not_rebuild_closure(self):
        zone = _make_zone()
        repo = _make_repo()
        repo.get_by_id.return_value = zone
        service = ZoneAdminService(repository=repo)

        service.update_zone(zone.id, ZoneUpdate(name="Renamed"), role_name=ADMIN)

        assert zone.name == "Renamed"
        repo.rebuild_all_closure.assert_not_called()

    def test_move_rebuilds_closure(self):
        zone = _make_zone()
        new_parent_id = uuid.uuid4()
        repo = _make_repo()
        repo.get_by_id.side_effect = lambda zid: zone if zid == zone.id else _make_zone(id=new_parent_id)
        repo.get_parent_id.return_value = None  # new parent has no ancestors -- no cycle
        service = ZoneAdminService(repository=repo)

        service.update_zone(zone.id, ZoneUpdate(parent_zone_id=new_parent_id), role_name=ADMIN)

        assert zone.parent_zone_id == new_parent_id
        repo.rebuild_all_closure.assert_called_once()

    def test_rejects_nonexistent_zone(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None
        service = ZoneAdminService(repository=repo)

        with pytest.raises(NotFoundError):
            service.update_zone(uuid.uuid4(), ZoneUpdate(name="X"), role_name=ADMIN)

    def test_rejects_rename_to_duplicate_name_under_same_parent(self):
        zone = _make_zone()
        repo = _make_repo()
        repo.get_by_id.return_value = zone
        repo.exists_by_name.return_value = True
        service = ZoneAdminService(repository=repo)

        with pytest.raises(ConflictError, match="already exists"):
            service.update_zone(zone.id, ZoneUpdate(name="Kozhikode"), role_name=ADMIN)
        assert zone.name == "Test Zone"  # untouched -- rejected before mutation
        repo.update.assert_not_called()

    def test_rejects_deeper_cycle(self):
        # Mirrors AccountService's test_rejects_deeper_cycle exactly (same
        # pattern, applied to zone_id/parent_zone_id) -- proposed parent B's
        # own ancestor chain is B -> C -> zone_id, so reparenting under B
        # would loop back to the zone itself.
        zone_id = uuid.uuid4()
        b_id = uuid.uuid4()
        c_id = uuid.uuid4()
        zone = _make_zone(id=zone_id)
        new_parent = _make_zone(id=b_id)
        repo = _make_repo()
        repo.get_by_id.side_effect = lambda zid: zone if zid == zone_id else new_parent
        repo.get_parent_id.side_effect = lambda zid: {b_id: c_id, c_id: zone_id}.get(zid)
        service = ZoneAdminService(repository=repo)

        with pytest.raises(ValidationError, match="circular reference"):
            service.update_zone(zone_id, ZoneUpdate(parent_zone_id=b_id), role_name=ADMIN)
        repo.rebuild_all_closure.assert_not_called()

    def test_rejects_deprecated_new_parent(self):
        zone = _make_zone()
        deprecated_parent = _make_zone(is_active=False)
        repo = _make_repo()
        repo.get_by_id.side_effect = lambda zid: zone if zid == zone.id else deprecated_parent
        service = ZoneAdminService(repository=repo)

        with pytest.raises(BusinessRuleViolation, match="deprecated"):
            service.update_zone(zone.id, ZoneUpdate(parent_zone_id=deprecated_parent.id), role_name=ADMIN)

    def test_no_op_parent_change_is_ignored(self):
        # Setting parent_zone_id to the same value it already has should not
        # trigger a cycle check or a closure rebuild -- nothing moved.
        parent_id = uuid.uuid4()
        zone = _make_zone(parent_zone_id=parent_id)
        repo = _make_repo()
        repo.get_by_id.return_value = zone
        service = ZoneAdminService(repository=repo)

        service.update_zone(zone.id, ZoneUpdate(parent_zone_id=parent_id), role_name=ADMIN)

        repo.rebuild_all_closure.assert_not_called()
        repo.get_parent_id.assert_not_called()


class TestDeprecateZone:
    def test_sets_is_active_false_and_grandfathers_existing_visibility(self):
        """The core deprecation-visibility decision (Zone-Hierarchy-Technical-
        Design.md): deprecating must NOT delete the row, touch any existing
        account.zone_id/user_zone.zone_id row, or trigger a closure rebuild
        (which would be a no-op anyway since the zone's position in the tree
        hasn't changed -- deprecating is a status flag, not a structural
        edit). This test asserts exactly that surface: one field flipped,
        nothing else touched.
        """
        zone = _make_zone(is_active=True)
        repo = _make_repo()
        repo.get_by_id.return_value = zone
        service = ZoneAdminService(repository=repo)

        service.deprecate_zone(zone.id, role_name=ADMIN)

        assert zone.is_active is False
        repo.rebuild_all_closure.assert_not_called()
        repo.delete.assert_not_called()

    def test_rejects_nonexistent_zone(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None
        service = ZoneAdminService(repository=repo)

        with pytest.raises(NotFoundError):
            service.deprecate_zone(uuid.uuid4(), role_name=ADMIN)


class TestBlastRadius:
    def test_returns_repository_counts(self):
        repo = _make_repo()
        repo.blast_radius.return_value = (12, 3)
        service = ZoneAdminService(repository=repo)

        result = service.blast_radius(uuid.uuid4(), role_name=ADMIN)

        assert result == (12, 3)

    def test_rejects_nonexistent_zone(self):
        repo = _make_repo(zone_exists=MagicMock(return_value=False))
        service = ZoneAdminService(repository=repo)

        with pytest.raises(NotFoundError):
            service.blast_radius(uuid.uuid4(), role_name=ADMIN)
        repo.blast_radius.assert_not_called()


class TestRebuildAllClosure:
    def test_admin_can_trigger_manual_rebuild(self):
        repo = _make_repo()
        service = ZoneAdminService(repository=repo)

        service.rebuild_all_closure(role_name=ADMIN)

        repo.rebuild_all_closure.assert_called_once()
