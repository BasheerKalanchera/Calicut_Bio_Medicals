import contextlib
import uuid
from dataclasses import dataclass, field
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.account.models import Account
from app.domains.audit.models import AuditLog
from app.domains.opportunity.models import Opportunity
from app.domains.organization.models import UserProfile
from app.domains.product.models import Product
from app.domains.project.models import Project
from app.domains.reference.models import (
    SBU,
    GateOverrideReason,
    HoldReason,
    LeadSource,
    LossReason,
    OpportunityStage,
    OpportunityStatus,
    Role,
    Zone,
)

# field name -> (target model, display attribute). Deliberately keyed by
# column *name*, not (table, column) -- every FK column in this schema that
# shares a name points at the same target across all 4 audited tables (every
# zone_id means zone.id, whether on account or user_profile; every
# created_by/updated_by means user_profile.id). This is real, bounded
# maintenance scope, but it's a display-layer concern only -- the trigger
# itself (0030_add_audit_log.py) stays fully generic and needs no change
# when a column is added; only this map would need a new entry, and only
# for a genuinely new FK *name* the diff hasn't seen before, not for every
# new column in general.
_FIELD_RESOLVER_MAP: dict[str, type] = {
    "zone_id": Zone,
    "sbu_id": SBU,
    "role_id": Role,
    "created_by": UserProfile,
    "updated_by": UserProfile,
    "manager_id": UserProfile,
    "owner_id": UserProfile,
    "referred_by_user_id": UserProfile,
    "gate_override_approver_id": UserProfile,
    "gate_override_set_by": UserProfile,
    "account_id": Account,
    "parent_account_id": Account,
    "project_id": Project,
    "stage_id": OpportunityStage,
    "status_id": OpportunityStatus,
    "lead_source_id": LeadSource,
    "loss_reason_id": LossReason,
    "hold_reason_id": HoldReason,
    "gate_override_reason_id": GateOverrideReason,
}

# table_name (as stamped by TG_TABLE_NAME) -> (model, display attribute) --
# resolves a row's own record_id to its current name/label.
_RECORD_LABEL_RESOLVER_MAP: dict[str, tuple[type, str]] = {
    "account": (Account, "name"),
    "user_profile": (UserProfile, "display_name"),
    "product": (Product, "name"),
    "opportunity": (Opportunity, "name"),
}

# model -> its display attribute name. Consistent per model across both maps
# above (e.g. UserProfile is always "display_name"), so one lookup query per
# referenced model per page is enough regardless of which field pointed at it.
_MODEL_DISPLAY_ATTR: dict[type, str] = {
    Zone: "name",
    SBU: "name",
    Role: "role_name",
    UserProfile: "display_name",
    Account: "name",
    Project: "name",
    OpportunityStage: "stage_name",
    OpportunityStatus: "status_name",
    LeadSource: "name",
    LossReason: "reason_name",
    HoldReason: "reason_name",
    GateOverrideReason: "reason_name",
    Product: "name",
    Opportunity: "name",
}

AuditLogRawRow = tuple[AuditLog, str | None]


@dataclass
class ResolvedAuditRow:
    entry: AuditLog
    changed_by_name: str | None
    record_label: str | None
    old_data_display: dict[str, str] = field(default_factory=dict)
    new_data_display: dict[str, str] = field(default_factory=dict)


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(AuditLog, db)

    def _filtered_select(
        self,
        *,
        table_name: str | None,
        record_id: uuid.UUID | None,
        changed_by: uuid.UUID | None,
        date_from: datetime | None,
        date_to: datetime | None,
    ):
        stmt = select(AuditLog, UserProfile.display_name).outerjoin(
            UserProfile, UserProfile.id == AuditLog.changed_by
        )
        if table_name is not None:
            stmt = stmt.where(AuditLog.table_name == table_name)
        if record_id is not None:
            stmt = stmt.where(AuditLog.record_id == record_id)
        if changed_by is not None:
            stmt = stmt.where(AuditLog.changed_by == changed_by)
        if date_from is not None:
            stmt = stmt.where(AuditLog.changed_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(AuditLog.changed_at <= date_to)
        return stmt

    def list_filtered(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
        table_name: str | None = None,
        record_id: uuid.UUID | None = None,
        changed_by: uuid.UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[ResolvedAuditRow], int]:
        stmt = self._filtered_select(
            table_name=table_name,
            record_id=record_id,
            changed_by=changed_by,
            date_from=date_from,
            date_to=date_to,
        )
        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        raw_rows: list[AuditLogRawRow] = list(
            self.db.execute(stmt.order_by(AuditLog.changed_at.desc()).offset(offset).limit(limit)).all()
        )
        return self._resolve_display_values(raw_rows), total

    def _collect_ids_by_model(self, raw_rows: list[AuditLogRawRow]) -> dict[type, set[uuid.UUID]]:
        ids_by_model: dict[type, set[uuid.UUID]] = {}
        for entry, _ in raw_rows:
            record_resolver = _RECORD_LABEL_RESOLVER_MAP.get(entry.table_name)
            if record_resolver:
                ids_by_model.setdefault(record_resolver[0], set()).add(entry.record_id)
            for data in (entry.old_data, entry.new_data):
                if not data:
                    continue
                for field_name, val in data.items():
                    model = _FIELD_RESOLVER_MAP.get(field_name)
                    if model and isinstance(val, str):
                        with contextlib.suppress(ValueError):
                            ids_by_model.setdefault(model, set()).add(uuid.UUID(val))
        return ids_by_model

    def _resolve_diff_display(
        self, data: dict | None, resolved: dict[type, dict[uuid.UUID, str]]
    ) -> dict[str, str]:
        if not data:
            return {}
        display: dict[str, str] = {}
        for field_name, val in data.items():
            model = _FIELD_RESOLVER_MAP.get(field_name)
            if not model or not isinstance(val, str):
                continue
            try:
                label = resolved.get(model, {}).get(uuid.UUID(val))
            except ValueError:
                continue
            if label is not None:
                display[field_name] = label
        return display

    def _resolve_display_values(self, raw_rows: list[AuditLogRawRow]) -> list[ResolvedAuditRow]:
        ids_by_model = self._collect_ids_by_model(raw_rows)

        # One SELECT per referenced model for the whole page, not per row.
        resolved: dict[type, dict[uuid.UUID, str]] = {}
        for model, ids in ids_by_model.items():
            if not ids:
                continue
            attr_col = getattr(model, _MODEL_DISPLAY_ATTR[model])
            rows = self.db.execute(select(model.id, attr_col).where(model.id.in_(ids))).all()
            resolved[model] = dict(rows)

        result: list[ResolvedAuditRow] = []
        for entry, changed_by_name in raw_rows:
            record_label = None
            record_resolver = _RECORD_LABEL_RESOLVER_MAP.get(entry.table_name)
            if record_resolver:
                model, display_field = record_resolver
                record_label = resolved.get(model, {}).get(entry.record_id)
                # DELETE: the row no longer exists in its live table -- fall
                # back to the full-row snapshot captured in old_data itself.
                if record_label is None and entry.old_data:
                    record_label = entry.old_data.get(display_field)

            result.append(
                ResolvedAuditRow(
                    entry=entry,
                    changed_by_name=changed_by_name,
                    record_label=record_label,
                    old_data_display=self._resolve_diff_display(entry.old_data, resolved),
                    new_data_display=self._resolve_diff_display(entry.new_data, resolved),
                )
            )
        return result
