"""
Unit tests for AuditLogService.

Repository is fully mocked -- no DB required. Covers:
  - the Admin/General Manager role gate (mirrors ZoneAdminService's
    _require_admin, tests/domains/reference/test_zone_service.py)
  - filters are passed through to the repository unchanged
"""

import uuid
from datetime import datetime
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AuthorizationError
from app.domains.account.models import Account, Stakeholder
from app.domains.audit.repository import (
    _FIELD_RESOLVER_MAP,
    _MODEL_DISPLAY_ATTR,
    _PARENT_CONTEXT_MAP,
    _RECORD_LABEL_RESOLVER_MAP,
    AuditLogRepository,
)
from app.domains.audit.service import AuditLogService
from app.domains.opportunity.models import Opportunity, OpportunityItem, Split
from app.domains.organization.models import UserProfile
from app.domains.product.models import Product

ADMIN = "Admin"
GM = "General Manager"
NON_ADMIN_ROLES = ["SBU Manager", "Area Manager", "Sales Staff"]


def _make_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=AuditLogRepository)
    repo.list_filtered.return_value = ([], 0)
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


class TestAuthorizationGate:
    @pytest.mark.parametrize("role", NON_ADMIN_ROLES)
    def test_non_admin_rejected(self, role):
        service = AuditLogService(repository=_make_repo())

        with pytest.raises(AuthorizationError):
            service.list_audit_log(role_name=role)

    @pytest.mark.parametrize("role", [ADMIN, GM])
    def test_admin_and_gm_allowed(self, role):
        repo = _make_repo()
        service = AuditLogService(repository=repo)

        service.list_audit_log(role_name=role)

        repo.list_filtered.assert_called_once()


class TestFilterPassthrough:
    def test_filters_forwarded_to_repository(self):
        repo = _make_repo()
        service = AuditLogService(repository=repo)
        record_id = uuid.uuid4()
        changed_by = uuid.uuid4()
        date_from = datetime(2026, 9, 1)
        date_to = datetime(2026, 9, 2)

        service.list_audit_log(
            role_name=ADMIN,
            offset=10,
            limit=20,
            table_name="account",
            record_id=record_id,
            changed_by=changed_by,
            date_from=date_from,
            date_to=date_to,
        )

        repo.list_filtered.assert_called_once_with(
            offset=10,
            limit=20,
            table_name="account",
            record_id=record_id,
            changed_by=changed_by,
            date_from=date_from,
            date_to=date_to,
        )

    def test_result_returned_unchanged(self):
        repo = _make_repo()
        repo.list_filtered.return_value = (["row"], 1)
        service = AuditLogService(repository=repo)

        result = service.list_audit_log(role_name=ADMIN)

        assert result == (["row"], 1)


class TestAuditTrailExtensionResolverMaps:
    """Audit-Trail-Extension-Implementation-Plan.md's display-layer
    additions for stakeholder/opportunity_item/split. Static dict checks --
    the maps only feed DB-dependent query-building code (verified live
    against Dev), so this just guards against a typo'd entry or a model
    added to one map without the matching _MODEL_DISPLAY_ATTR entry it
    needs at read time."""

    def test_new_fk_field_resolvers_present(self):
        assert _FIELD_RESOLVER_MAP["opportunity_id"] is Opportunity
        assert _FIELD_RESOLVER_MAP["product_id"] is Product
        assert _FIELD_RESOLVER_MAP["user_id"] is UserProfile

    def test_stakeholder_record_label_resolver_present(self):
        assert _RECORD_LABEL_RESOLVER_MAP["stakeholder"] == (Stakeholder, "name")

    def test_opportunity_item_and_split_deliberately_have_no_record_label(self):
        assert "opportunity_item" not in _RECORD_LABEL_RESOLVER_MAP
        assert "split" not in _RECORD_LABEL_RESOLVER_MAP

    def test_every_field_resolver_model_has_a_display_attr(self):
        for model in _FIELD_RESOLVER_MAP.values():
            assert model in _MODEL_DISPLAY_ATTR, f"{model} missing from _MODEL_DISPLAY_ATTR"

    def test_every_record_label_resolver_model_has_a_display_attr(self):
        """Found live 2026-09-09: Stakeholder was added to
        _RECORD_LABEL_RESOLVER_MAP but not _MODEL_DISPLAY_ATTR, which
        crashed the whole Audit Log endpoint (KeyError, 500) the moment a
        stakeholder audit row existed -- _resolve_display_values reads
        _MODEL_DISPLAY_ATTR for every model in _RECORD_LABEL_RESOLVER_MAP,
        not just _FIELD_RESOLVER_MAP, so both maps need this check."""
        for model, _display_field in _RECORD_LABEL_RESOLVER_MAP.values():
            assert model in _MODEL_DISPLAY_ATTR, f"{model} missing from _MODEL_DISPLAY_ATTR"


class TestParentContextMap:
    """Parent-context feature (2026-09-10): shows each row's immediate
    parent -- e.g. parent_type="opportunity" on a split row,
    parent_type="account" on an opportunity/stakeholder row -- so a row
    can be placed, and clicked through to, without cross-referencing the
    DB by id. Same KeyError-class risk as TestAuditTrailExtensionResolverMaps
    above -- _resolve_parent_ids / _resolve_display_values look up every
    _PARENT_CONTEXT_MAP target model in _MODEL_DISPLAY_ATTR too."""

    def test_expected_tables_and_targets(self):
        assert _PARENT_CONTEXT_MAP["opportunity"] == (Opportunity, "account_id", Account, "account")
        assert _PARENT_CONTEXT_MAP["opportunity_item"] == (
            OpportunityItem,
            "opportunity_id",
            Opportunity,
            "opportunity",
        )
        assert _PARENT_CONTEXT_MAP["split"] == (Split, "opportunity_id", Opportunity, "opportunity")
        assert _PARENT_CONTEXT_MAP["stakeholder"] == (Stakeholder, "account_id", Account, "account")

    def test_tables_with_no_natural_parent_are_absent(self):
        for table_name in ("account", "user_profile", "product"):
            assert table_name not in _PARENT_CONTEXT_MAP

    def test_every_target_model_has_a_display_attr(self):
        for _own_model, _fk_column, target_model, _label in _PARENT_CONTEXT_MAP.values():
            assert target_model in _MODEL_DISPLAY_ATTR, f"{target_model} missing from _MODEL_DISPLAY_ATTR"
