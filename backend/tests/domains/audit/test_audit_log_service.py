"""
Unit tests for the Audit Log service and its display maps.

Repository is mocked for the service tests -- no DB required. Covers:
  - the Admin/General Manager role gate (mirrors ZoneAdminService's
    _require_admin, tests/domains/reference/test_zone_service.py)
  - filters (incl. the "What happened" action filter) passed through
  - _TABLE_SPECS covers every audited table and only uses models the
    name lookup can resolve (a missing _MODEL_DISPLAY_ATTR entry crashed
    the whole endpoint once, 2026-09-09)
  - _resolve_display_values on stub rows: owner grouping for line tables,
    record labels built from FK names, parent context
"""

import uuid
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AuthorizationError, ValidationError
from app.domains.audit.repository import (
    _FIELD_RESOLVER_MAP,
    _FIELD_RESOLVER_OVERRIDES,
    _MODEL_DISPLAY_ATTR,
    _TABLE_SPECS,
    AuditLogRepository,
)
from app.domains.audit.service import AuditLogService

ADMIN = "Admin"
GM = "General Manager"
NON_ADMIN_ROLES = ["SBU Manager", "Area Manager", "Sales Staff"]

# Every table with an audit trigger (migrations 0030, 0041, 0059).
AUDITED_TABLES = {
    "account",
    "user_profile",
    "product",
    "opportunity",
    "stakeholder",
    "opportunity_item",
    "split",
    "target_plan",
    "marketing_lead",
    "project",
    "installed_asset",
    "zone",
    "brand",
    "model",
    "category",
    "opportunity_stakeholder",
    "user_zone",
    "target_plan_account",
    "target_plan_brand_split",
    "document",
}
LINE_TABLES = {
    "opportunity_item",
    "split",
    "opportunity_stakeholder",
    "user_zone",
    "target_plan_account",
    "target_plan_brand_split",
    "document",
}


def _make_repo() -> MagicMock:
    repo = MagicMock(spec=AuditLogRepository)
    repo.list_saves.return_value = ([], 0)
    return repo


class TestAuthorizationGate:
    @pytest.mark.parametrize("role", NON_ADMIN_ROLES)
    def test_non_admin_rejected(self, role):
        with pytest.raises(AuthorizationError):
            AuditLogService(repository=_make_repo()).list_audit_log(role_name=role)

    @pytest.mark.parametrize("role", [ADMIN, GM])
    def test_admin_and_gm_allowed(self, role):
        repo = _make_repo()
        AuditLogService(repository=repo).list_audit_log(role_name=role)
        repo.list_saves.assert_called_once()


class TestFilterPassthrough:
    def test_filters_forwarded_to_repository(self):
        repo = _make_repo()
        record_id, changed_by = uuid.uuid4(), uuid.uuid4()
        date_from, date_to = datetime(2026, 9, 1), datetime(2026, 9, 2)

        AuditLogService(repository=repo).list_audit_log(
            role_name=ADMIN,
            offset=10,
            limit=20,
            table_name="account",
            action="INSERT",
            record_id=record_id,
            changed_by=changed_by,
            date_from=date_from,
            date_to=date_to,
        )

        repo.list_saves.assert_called_once_with(
            offset=10,
            limit=20,
            table_name="account",
            action="INSERT",
            record_id=record_id,
            changed_by=changed_by,
            date_from=date_from,
            date_to=date_to,
        )

    def test_unknown_action_rejected(self):
        with pytest.raises(ValidationError):
            AuditLogService(repository=_make_repo()).list_audit_log(role_name=ADMIN, action="CREATE")

    def test_result_returned_unchanged(self):
        repo = _make_repo()
        repo.list_saves.return_value = (["save"], 1)
        assert AuditLogService(repository=repo).list_audit_log(role_name=ADMIN) == (["save"], 1)


class TestTableSpecs:
    def test_every_audited_table_has_a_spec(self):
        assert set(_TABLE_SPECS) == AUDITED_TABLES

    def test_line_tables_flagged(self):
        assert {t for t, s in _TABLE_SPECS.items() if s.is_line} == LINE_TABLES

    def test_tables_without_id_take_parent_id(self):
        assert {t for t, s in _TABLE_SPECS.items() if not s.has_id} == {"opportunity_stakeholder", "user_zone"}

    def test_every_parent_is_itself_specced(self):
        for table, spec in _TABLE_SPECS.items():
            for parent in spec.parents:
                assert parent.table in _TABLE_SPECS, f"{table}: parent {parent.table} has no spec"

    def test_every_fk_label_part_resolves_to_a_named_model(self):
        for table, spec in _TABLE_SPECS.items():
            for kind, col in spec.label:
                if kind == "fk":
                    model = _FIELD_RESOLVER_OVERRIDES.get((table, col)) or _FIELD_RESOLVER_MAP.get(col)
                    assert model in _MODEL_DISPLAY_ATTR, f"{table}.{col} can't be named"

    def test_every_field_resolver_model_has_a_display_attr(self):
        for model in list(_FIELD_RESOLVER_MAP.values()) + list(_FIELD_RESOLVER_OVERRIDES.values()):
            assert model in _MODEL_DISPLAY_ATTR, f"{model} missing from _MODEL_DISPLAY_ATTR"


def _entry(table, action, record_id, old=None, new=None, changed_by=None):
    return SimpleNamespace(
        id=uuid.uuid4(),
        table_name=table,
        record_id=record_id,
        action=action,
        changed_at=datetime(2026, 10, 3, 10, 0, tzinfo=UTC),
        changed_by=changed_by,
        old_data=old,
        new_data=new,
    )


class TestResolveDisplayValues:
    """Stubs the two DB reads (_live_rows and the per-model name query) so
    the grouping and labelling logic runs without a database."""

    def _repo(self, live: dict, names: dict) -> AuditLogRepository:
        repo = AuditLogRepository(MagicMock())

        def live_rows(model, ids):
            return {i: live[i] for i in ids if i in live}

        repo._live_rows = live_rows  # type: ignore[method-assign]

        # The name query returns (id, name) pairs; returning every known name
        # for any model is fine, since lookups are by id.
        def execute(_stmt):
            result = MagicMock()
            result.all.return_value = list(names.items())
            return result

        repo.db.execute.side_effect = execute
        return repo

    def test_product_swap_on_opportunity_grouped_under_the_opportunity(self):
        opp_id, old_prod, new_prod, item1, item2 = (uuid.uuid4() for _ in range(5))
        account_id = uuid.uuid4()
        live = {opp_id: {"id": opp_id, "name": "Aster stands", "account_id": account_id}}
        names = {old_prod: "Wall-mount stand", new_prod: "Equipwell stand", account_id: "Aster MIMS"}
        repo = self._repo(live, names)
        rows = [
            (
                _entry(
                    "opportunity_item",
                    "DELETE",
                    item1,
                    old={"id": str(item1), "opportunity_id": str(opp_id), "product_id": str(old_prod)},
                ),
                "Haroon",
            ),
            (
                _entry(
                    "opportunity_item",
                    "INSERT",
                    item2,
                    new={"id": str(item2), "opportunity_id": str(opp_id), "product_id": str(new_prod)},
                ),
                "Haroon",
            ),
        ]

        resolved = repo._resolve_display_values(rows)

        assert [r.owner_type for r in resolved] == ["opportunity", "opportunity"]
        assert {r.owner_id for r in resolved} == {opp_id}
        assert resolved[0].owner_label == "Aster stands"
        assert [r.record_label for r in resolved] == ["Wall-mount stand", "Equipwell stand"]

    def test_contact_without_id_grouped_under_its_opportunity(self):
        opp_id, stakeholder_id = uuid.uuid4(), uuid.uuid4()
        live = {opp_id: {"id": opp_id, "name": "ICU monitors", "account_id": None}}
        repo = self._repo(live, {stakeholder_id: "Dr. Varsa"})
        rows = [
            (
                _entry(
                    "opportunity_stakeholder",
                    "INSERT",
                    opp_id,
                    new={"opportunity_id": str(opp_id), "stakeholder_id": str(stakeholder_id)},
                ),
                None,
            )
        ]

        (row,) = repo._resolve_display_values(rows)

        assert (row.owner_type, row.owner_id, row.owner_label) == ("opportunity", opp_id, "ICU monitors")
        assert row.record_label == "Dr. Varsa"

    def test_main_record_is_its_own_owner_with_parent_context(self):
        opp_id, account_id = uuid.uuid4(), uuid.uuid4()
        live = {
            opp_id: {"id": opp_id, "name": "USG", "account_id": account_id},
            account_id: {"id": account_id, "name": "KIMS"},
        }
        repo = self._repo(live, {})
        rows = [
            (_entry("opportunity", "UPDATE", opp_id, old={"indicative_value": 1}, new={"indicative_value": 2}), "A")
        ]

        (row,) = repo._resolve_display_values(rows)

        assert (row.owner_type, row.owner_id, row.owner_label) == ("opportunity", opp_id, "USG")
        assert (row.parent_type, row.parent_id, row.parent_label) == ("account", account_id, "KIMS")
