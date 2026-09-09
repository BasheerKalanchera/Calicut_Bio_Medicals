import contextlib
import uuid
from dataclasses import dataclass, field
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.account.models import Account, Stakeholder
from app.domains.audit.models import AuditLog
from app.domains.opportunity.models import Opportunity, OpportunityItem, Split
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
    # Added for the Audit Trail Extension (opportunity_item/split/stakeholder,
    # Audit-Trail-Extension-Implementation-Plan.md) -- opportunity_id and
    # product_id are new FK *names* the diff hadn't needed to resolve before;
    # user_id here means split's participant (UserProfile), same target every
    # other user_id-shaped column already resolves to.
    "opportunity_id": Opportunity,
    "product_id": Product,
    "user_id": UserProfile,
}

# table_name (as stamped by TG_TABLE_NAME) -> (model, display attribute) --
# resolves a row's own record_id to its current name/label.
_RECORD_LABEL_RESOLVER_MAP: dict[str, tuple[type, str]] = {
    "account": (Account, "name"),
    "user_profile": (UserProfile, "display_name"),
    "product": (Product, "name"),
    "opportunity": (Opportunity, "name"),
    "stakeholder": (Stakeholder, "name"),
    # opportunity_item and split deliberately get no entry here -- neither
    # has a natural single-column label (a line item's identity is a
    # product+quantity combination, a split's is a percentage); the diff
    # itself already carries the meaningful before/after values. See the
    # implementation plan's "Display-layer additions" section.
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
    Stakeholder: "name",
}

# table_name -> (own model, FK column name, target model, parent type).
# Resolves each row's immediate parent for display -- e.g. "Opportunity:
# USG M/c" on a split row, "Account: Aster MIMS Calicut" on an Opportunity
# row -- so someone browsing the log can place a row (and click through
# to it) without cross-referencing the DB by id. `parent type` is a plain
# lowercase tag ("account"/"opportunity"), not a display label -- the
# frontend already owns capitalization for table_name via TABLE_OPTIONS,
# same convention here. Only tables with one natural parent get an entry;
# account/user_profile/product sit at the top of their own hierarchy
# already.
_PARENT_CONTEXT_MAP: dict[str, tuple[type, str, type, str]] = {
    "opportunity": (Opportunity, "account_id", Account, "account"),
    "opportunity_item": (OpportunityItem, "opportunity_id", Opportunity, "opportunity"),
    "split": (Split, "opportunity_id", Opportunity, "opportunity"),
    "stakeholder": (Stakeholder, "account_id", Account, "account"),
}

AuditLogRawRow = tuple[AuditLog, str | None]


@dataclass
class ResolvedAuditRow:
    entry: AuditLog
    changed_by_name: str | None
    record_label: str | None
    parent_type: str | None = None
    parent_id: uuid.UUID | None = None
    parent_label: str | None = None
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

    def _resolve_parent_ids(
        self, raw_rows: list[AuditLogRawRow]
    ) -> dict[tuple[str, uuid.UUID], uuid.UUID]:
        """Maps each row needing parent context to its parent's id --
        from old_data's full-row snapshot for a DELETE (the row itself is
        gone, nothing left to query live), or a single batched live
        lookup per table for anything else (the row still exists, and its
        parent FK almost never changes, so it's rarely present in the
        diff itself). Keyed by (table_name, record_id) rather than just
        record_id since ids aren't guaranteed unique across tables."""
        parent_ids: dict[tuple[str, uuid.UUID], uuid.UUID] = {}
        live_lookup_ids: dict[str, set[uuid.UUID]] = {}

        for entry, _ in raw_rows:
            context = _PARENT_CONTEXT_MAP.get(entry.table_name)
            if not context:
                continue
            if entry.action == "DELETE":
                _own_model, fk_column, _target_model, _label = context
                raw_val = (entry.old_data or {}).get(fk_column)
                if isinstance(raw_val, str):
                    with contextlib.suppress(ValueError):
                        parent_ids[(entry.table_name, entry.record_id)] = uuid.UUID(raw_val)
            else:
                live_lookup_ids.setdefault(entry.table_name, set()).add(entry.record_id)

        for table_name, record_ids in live_lookup_ids.items():
            own_model, fk_column, _target_model, _label = _PARENT_CONTEXT_MAP[table_name]
            fk_col = getattr(own_model, fk_column)
            rows = self.db.execute(
                select(own_model.id, fk_col).where(own_model.id.in_(record_ids))
            ).all()
            for record_id, parent_id in rows:
                if parent_id is not None:
                    parent_ids[(table_name, record_id)] = parent_id

        return parent_ids

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
        parent_ids = self._resolve_parent_ids(raw_rows)
        for (table_name, _record_id), parent_id in parent_ids.items():
            target_model = _PARENT_CONTEXT_MAP[table_name][2]
            ids_by_model.setdefault(target_model, set()).add(parent_id)

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

            parent_type = None
            parent_id_out = None
            parent_label = None
            context = _PARENT_CONTEXT_MAP.get(entry.table_name)
            if context:
                _own_model, _fk_column, target_model, ptype = context
                parent_id = parent_ids.get((entry.table_name, entry.record_id))
                if parent_id is not None:
                    parent_name = resolved.get(target_model, {}).get(parent_id)
                    if parent_name is not None:
                        parent_type = ptype
                        parent_id_out = parent_id
                        parent_label = parent_name

            result.append(
                ResolvedAuditRow(
                    entry=entry,
                    changed_by_name=changed_by_name,
                    record_label=record_label,
                    parent_type=parent_type,
                    parent_id=parent_id_out,
                    parent_label=parent_label,
                    old_data_display=self._resolve_diff_display(entry.old_data, resolved),
                    new_data_display=self._resolve_diff_display(entry.new_data, resolved),
                )
            )
        return result
