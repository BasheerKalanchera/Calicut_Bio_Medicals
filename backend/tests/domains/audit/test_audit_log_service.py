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
from app.domains.audit.repository import AuditLogRepository
from app.domains.audit.service import AuditLogService

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
