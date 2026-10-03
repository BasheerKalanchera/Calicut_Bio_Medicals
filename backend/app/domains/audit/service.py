import uuid
from datetime import datetime

from app.core.exceptions import AuthorizationError, ValidationError
from app.domains.audit.repository import AuditLogRepository, ResolvedAuditSave

# Mirrors reference/service.py's ZoneAdminService._require_admin -- same role
# set as the DB-level RLS policy on audit_log itself (audit_log_admin_gm_read,
# 0030_add_audit_log.py). This check is defense-in-depth on top of that RLS
# policy, not a substitute for it -- RLS is what actually protects the data
# from a direct query bypassing the app entirely.
_AUDIT_LOG_ADMIN_ROLES = {"Admin", "General Manager"}

# The Audit Log's "What happened" filter (Added / Changed / Removed).
_ACTIONS = {"INSERT", "UPDATE", "DELETE"}


class AuditLogService:
    def __init__(self, repository: AuditLogRepository):
        self.repository = repository

    def _require_admin(self, role_name: str) -> None:
        if role_name not in _AUDIT_LOG_ADMIN_ROLES:
            raise AuthorizationError("Only Admin/General Manager can view the audit log")

    def list_audit_log(
        self,
        *,
        role_name: str,
        offset: int = 0,
        limit: int = 50,
        table_name: str | None = None,
        action: str | None = None,
        record_id: uuid.UUID | None = None,
        changed_by: uuid.UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[ResolvedAuditSave], int]:
        self._require_admin(role_name)
        if action is not None and action not in _ACTIONS:
            raise ValidationError(f"action must be one of {sorted(_ACTIONS)}")
        return self.repository.list_saves(
            offset=offset,
            limit=limit,
            table_name=table_name,
            action=action,
            record_id=record_id,
            changed_by=changed_by,
            date_from=date_from,
            date_to=date_to,
        )
