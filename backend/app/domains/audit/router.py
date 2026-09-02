import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse, PaginatedResponse
from app.db.session import get_db
from app.domains.audit.repository import AuditLogRepository, ResolvedAuditRow
from app.domains.audit.schemas import AuditLogResponse
from app.domains.audit.service import AuditLogService
from app.domains.organization.models import UserProfile

router = APIRouter(tags=["Audit Log"])


def _get_service(db: Session = Depends(get_db)) -> AuditLogService:  # noqa: B008
    return AuditLogService(repository=AuditLogRepository(db))


def _to_response(row: ResolvedAuditRow) -> AuditLogResponse:
    return AuditLogResponse(
        id=row.entry.id,
        table_name=row.entry.table_name,
        record_id=row.entry.record_id,
        record_label=row.record_label,
        action=row.entry.action,
        changed_at=row.entry.changed_at,
        changed_by_name=row.changed_by_name,
        old_data=row.entry.old_data,
        new_data=row.entry.new_data,
        old_data_display=row.old_data_display,
        new_data_display=row.new_data_display,
    )


@router.get("/admin/audit-log")
def list_audit_log(
    table_name: str | None = Query(None),
    record_id: uuid.UUID | None = Query(None),  # noqa: B008
    changed_by: uuid.UUID | None = Query(None),  # noqa: B008
    date_from: datetime | None = Query(None),  # noqa: B008
    date_to: datetime | None = Query(None),  # noqa: B008
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: AuditLogService = Depends(_get_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[AuditLogResponse]]:
    offset = (page - 1) * page_size
    rows, total = service.list_audit_log(
        role_name=current_user.role.role_name,
        offset=offset,
        limit=page_size,
        table_name=table_name,
        record_id=record_id,
        changed_by=changed_by,
        date_from=date_from,
        date_to=date_to,
    )
    total_pages = (total + page_size - 1) // page_size

    return APIResponse(
        data=PaginatedResponse(
            items=[_to_response(r) for r in rows],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )
