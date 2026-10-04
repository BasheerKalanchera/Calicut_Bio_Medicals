import contextlib
import uuid
from dataclasses import dataclass, field
from datetime import datetime

from sqlalchemy import func, inspect, select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.account.models import Account, Stakeholder
from app.domains.asset.models import InstalledAsset
from app.domains.audit.models import AuditLog
from app.domains.document.models import Document
from app.domains.marketing_lead.models import MarketingLead
from app.domains.opportunity.models import Opportunity, OpportunityItem, OpportunityStakeholder, Split
from app.domains.organization.models import UserProfile, UserZone
from app.domains.planning.models import TargetPlan, TargetPlanAccount, TargetPlanBrandSplit
from app.domains.product.models import Product
from app.domains.project.models import Project
from app.domains.reference.models import (
    SBU,
    Brand,
    Category,
    GateOverrideReason,
    HoldReason,
    LeadSource,
    LossReason,
    Model,
    OpportunityStage,
    OpportunityStatus,
    ProjectStatus,
    Role,
    Zone,
)

# field name -> target model. Deliberately keyed by column *name*, not
# (table, column) -- nearly every FK column name in this schema points at
# the same target on every table (every zone_id means zone.id; every
# created_by/updated_by means user_profile.id). The one clash is status_id
# (project vs opportunity), handled by _FIELD_RESOLVER_OVERRIDES. A display-
# layer concern only -- the trigger itself stays generic; a new FK *name*
# shows its raw id until it gets an entry here.
_FIELD_RESOLVER_MAP: dict[str, type] = {
    "zone_id": Zone,
    "parent_zone_id": Zone,
    "sbu_id": SBU,
    "role_id": Role,
    "created_by": UserProfile,
    "updated_by": UserProfile,
    "manager_id": UserProfile,
    "owner_id": UserProfile,
    "referred_by_user_id": UserProfile,
    "gate_override_approver_id": UserProfile,
    "gate_override_set_by": UserProfile,
    "full_payment_confirmed_by": UserProfile,
    "assigned_to_user_id": UserProfile,
    "approved_by": UserProfile,
    "reviewed_by": UserProfile,
    "uploaded_by_user_id": UserProfile,
    "user_id": UserProfile,
    "account_id": Account,
    "parent_account_id": Account,
    "project_id": Project,
    "stage_id": OpportunityStage,
    "status_id": OpportunityStatus,
    "lead_source_id": LeadSource,
    "loss_reason_id": LossReason,
    "hold_reason_id": HoldReason,
    "gate_override_reason_id": GateOverrideReason,
    "opportunity_id": Opportunity,
    "converted_opportunity_id": Opportunity,
    "product_id": Product,
    "stakeholder_id": Stakeholder,
    "brand_id": Brand,
    "model_id": Model,
    "category_id": Category,
}

# (table, field) pairs whose target differs from _FIELD_RESOLVER_MAP's.
_FIELD_RESOLVER_OVERRIDES: dict[tuple[str, str], type] = {
    ("project", "status_id"): ProjectStatus,
}

# model -> its display attribute. One lookup query per referenced model per
# page, whichever field pointed at it.
_MODEL_DISPLAY_ATTR: dict[type, str] = {
    Zone: "name",
    SBU: "name",
    Role: "role_name",
    UserProfile: "display_name",
    Account: "name",
    Project: "name",
    OpportunityStage: "stage_name",
    OpportunityStatus: "status_name",
    ProjectStatus: "status_name",
    LeadSource: "name",
    LossReason: "reason_name",
    HoldReason: "reason_name",
    GateOverrideReason: "reason_name",
    Product: "name",
    Opportunity: "name",
    Stakeholder: "name",
    Brand: "name",
    Model: "name",
    Category: "name",
}


@dataclass(frozen=True)
class _Parent:
    fk: str  # column on the row holding the parent's id
    table: str  # parent's table name, also its owner/parent type tag


@dataclass(frozen=True)
class _TableSpec:
    model: type
    # Label parts, joined with " · " (empties skipped): ("attr", column) uses
    # the row's own value; ("fk", column) the referenced record's name.
    label: tuple[tuple[str, str], ...] = ()
    # Candidate parents; the first whose FK is set is used (document has four).
    parents: tuple[_Parent, ...] = ()
    # Line tables: entries are grouped under their parent on the screen.
    is_line: bool = False
    # Line tables without an id column: the trigger stores the parent's id
    # as record_id (migration 0059).
    has_id: bool = True


_ACCOUNT = _Parent("account_id", "account")
_OPPORTUNITY = _Parent("opportunity_id", "opportunity")
_TARGET_PLAN = _Parent("target_plan_id", "target_plan")

# Every table the audit trigger watches (migrations 0030, 0041, 0059).
_TABLE_SPECS: dict[str, _TableSpec] = {
    "account": _TableSpec(Account, label=(("attr", "name"),)),
    "user_profile": _TableSpec(UserProfile, label=(("attr", "display_name"),)),
    "product": _TableSpec(Product, label=(("attr", "name"),)),
    "opportunity": _TableSpec(Opportunity, label=(("attr", "name"),), parents=(_ACCOUNT,)),
    "stakeholder": _TableSpec(Stakeholder, label=(("attr", "name"),), parents=(_ACCOUNT,)),
    "project": _TableSpec(Project, label=(("attr", "name"),), parents=(_ACCOUNT,)),
    "installed_asset": _TableSpec(
        InstalledAsset, label=(("fk", "product_id"), ("attr", "competitor_product_name")), parents=(_ACCOUNT,)
    ),
    "marketing_lead": _TableSpec(
        MarketingLead, label=(("attr", "event_name"), ("fk", "account_id")), parents=(_ACCOUNT,)
    ),
    "target_plan": _TableSpec(TargetPlan, label=(("fk", "user_id"), ("attr", "planning_period"))),
    "zone": _TableSpec(Zone, label=(("attr", "name"),)),
    "brand": _TableSpec(Brand, label=(("attr", "name"),)),
    "model": _TableSpec(Model, label=(("attr", "name"),)),
    "category": _TableSpec(Category, label=(("attr", "name"),)),
    "opportunity_item": _TableSpec(
        OpportunityItem,
        label=(("fk", "product_id"), ("attr", "description")),
        parents=(_OPPORTUNITY,),
        is_line=True,
    ),
    "split": _TableSpec(Split, label=(("fk", "user_id"),), parents=(_OPPORTUNITY,), is_line=True),
    "opportunity_stakeholder": _TableSpec(
        OpportunityStakeholder,
        label=(("fk", "stakeholder_id"),),
        parents=(_OPPORTUNITY,),
        is_line=True,
        has_id=False,
    ),
    "user_zone": _TableSpec(
        UserZone, label=(("fk", "zone_id"),), parents=(_Parent("user_id", "user_profile"),), is_line=True, has_id=False
    ),
    "target_plan_account": _TableSpec(
        TargetPlanAccount, label=(("fk", "account_id"),), parents=(_TARGET_PLAN,), is_line=True
    ),
    "target_plan_brand_split": _TableSpec(
        TargetPlanBrandSplit, label=(("fk", "brand_id"),), parents=(_TARGET_PLAN,), is_line=True
    ),
    "document": _TableSpec(
        Document,
        label=(("attr", "file_name"),),
        parents=(_ACCOUNT, _Parent("project_id", "project"), _OPPORTUNITY, _Parent("product_id", "product")),
        is_line=True,
    ),
}

AuditLogRawRow = tuple[AuditLog, str | None]
Snapshot = dict[str, object]


@dataclass
class ResolvedAuditRow:
    entry: AuditLog
    changed_by_name: str | None
    record_label: str | None
    # The row's immediate parent, for context and click-through (an
    # Opportunity's account, a line's Opportunity or target plan).
    parent_type: str | None = None
    parent_id: uuid.UUID | None = None
    parent_label: str | None = None
    # The record this entry is grouped under on screen: the parent for line
    # tables, the row itself for main records.
    owner_type: str = ""
    owner_id: uuid.UUID | None = None
    owner_label: str | None = None
    old_data_display: dict[str, str] = field(default_factory=dict)
    new_data_display: dict[str, str] = field(default_factory=dict)


@dataclass
class ResolvedAuditSave:
    """Everything recorded by one save: same transaction start time
    (`changed_at` defaults to now()) and same user."""

    changed_at: datetime
    changed_by_name: str | None
    rows: list[ResolvedAuditRow]


def _as_uuid(val: object) -> uuid.UUID | None:
    if isinstance(val, uuid.UUID):
        return val
    if isinstance(val, str):
        with contextlib.suppress(ValueError):
            return uuid.UUID(val)
    return None


def _field_model(table_name: str, field_name: str) -> type | None:
    return _FIELD_RESOLVER_OVERRIDES.get((table_name, field_name)) or _FIELD_RESOLVER_MAP.get(field_name)


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(AuditLog, db)

    def _conditions(
        self,
        *,
        table_name: str | None,
        action: str | None,
        record_id: uuid.UUID | None,
        changed_by: uuid.UUID | None,
        date_from: datetime | None,
        date_to: datetime | None,
    ) -> list:
        conds = []
        if table_name is not None:
            conds.append(AuditLog.table_name == table_name)
        if action is not None:
            conds.append(AuditLog.action == action)
        if record_id is not None:
            conds.append(AuditLog.record_id == record_id)
        if changed_by is not None:
            conds.append(AuditLog.changed_by == changed_by)
        if date_from is not None:
            conds.append(AuditLog.changed_at >= date_from)
        if date_to is not None:
            conds.append(AuditLog.changed_at <= date_to)
        return conds

    def list_saves(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
        table_name: str | None = None,
        action: str | None = None,
        record_id: uuid.UUID | None = None,
        changed_by: uuid.UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[ResolvedAuditSave], int]:
        """Pages by save, not by log row, so one save is never split across
        pages: first the page's (changed_at, changed_by) pairs, then every
        matching row of those saves."""
        conds = self._conditions(
            table_name=table_name,
            action=action,
            record_id=record_id,
            changed_by=changed_by,
            date_from=date_from,
            date_to=date_to,
        )
        keys_stmt = (
            select(AuditLog.changed_at, AuditLog.changed_by)
            .where(*conds)
            .group_by(AuditLog.changed_at, AuditLog.changed_by)
        )
        total = self.db.scalar(select(func.count()).select_from(keys_stmt.subquery())) or 0
        keys = [
            (k[0], k[1])
            for k in self.db.execute(
                # changed_by breaks ties so saves sharing a timestamp page in a stable order.
                keys_stmt.order_by(AuditLog.changed_at.desc(), AuditLog.changed_by).offset(offset).limit(limit)
            ).all()
        ]
        if not keys:
            return [], total

        key_set = set(keys)
        raw_rows: list[AuditLogRawRow] = [
            (entry, name)
            for entry, name in self.db.execute(
                select(AuditLog, UserProfile.display_name)
                .outerjoin(UserProfile, UserProfile.id == AuditLog.changed_by)
                .where(*conds, AuditLog.changed_at.in_([k[0] for k in keys]))
                .order_by(AuditLog.changed_at.desc(), AuditLog.table_name, AuditLog.id)
            ).all()
            if (entry.changed_at, entry.changed_by) in key_set
        ]
        resolved = self._resolve_display_values(raw_rows)

        by_key: dict[tuple, list[ResolvedAuditRow]] = {k: [] for k in keys}
        for row in resolved:
            by_key[(row.entry.changed_at, row.entry.changed_by)].append(row)
        saves = [
            ResolvedAuditSave(changed_at=k[0], changed_by_name=rows[0].changed_by_name, rows=rows)
            for k, rows in by_key.items()
            if rows
        ]
        return saves, total

    # --- display resolution -------------------------------------------------

    def _live_rows(self, model: type, ids: set[uuid.UUID]) -> dict[uuid.UUID, Snapshot]:
        if not ids:
            return {}
        columns = [c.key for c in inspect(model).column_attrs]
        objs = self.db.execute(select(model).where(model.id.in_(ids))).scalars().all()
        return {obj.id: {c: getattr(obj, c) for c in columns} for obj in objs}

    def _snapshots(self, raw_rows: list[AuditLogRawRow]) -> list[Snapshot]:
        """A best-effort full view of each logged row: the stored full row
        for INSERT/DELETE; the live row overlaid with the logged new values
        for UPDATE."""
        live_ids: dict[str, set[uuid.UUID]] = {}
        for entry, _ in raw_rows:
            spec = _TABLE_SPECS.get(entry.table_name)
            if spec and spec.has_id and entry.action == "UPDATE":
                live_ids.setdefault(entry.table_name, set()).add(entry.record_id)
        live = {t: self._live_rows(_TABLE_SPECS[t].model, ids) for t, ids in live_ids.items()}

        snapshots: list[Snapshot] = []
        for entry, _ in raw_rows:
            spec = _TABLE_SPECS.get(entry.table_name)
            if entry.action == "DELETE":
                snap: Snapshot = dict(entry.old_data or {})
            elif entry.action == "INSERT":
                snap = dict(entry.new_data or {})
            else:
                snap = {**live.get(entry.table_name, {}).get(entry.record_id, {}), **(entry.new_data or {})}
            if spec and not spec.has_id and spec.parents:
                snap.setdefault(spec.parents[0].fk, entry.record_id)
            snapshots.append(snap)
        return snapshots

    @staticmethod
    def _parent_of(spec: _TableSpec | None, snap: Snapshot) -> tuple[str, uuid.UUID] | None:
        if not spec:
            return None
        for parent in spec.parents:
            pid = _as_uuid(snap.get(parent.fk))
            if pid is not None:
                return parent.table, pid
        return None

    @staticmethod
    def _label_fk_ids(spec: _TableSpec, snap: Snapshot, ids_by_model: dict[type, set[uuid.UUID]], table: str):
        for kind, col in spec.label:
            if kind == "fk":
                model = _field_model(table, col)
                val = _as_uuid(snap.get(col))
                if model and val:
                    ids_by_model.setdefault(model, set()).add(val)

    @staticmethod
    def _label(spec: _TableSpec | None, snap: Snapshot, names: dict[type, dict[uuid.UUID, str]], table: str):
        if not spec:
            return None
        parts: list[str] = []
        for kind, col in spec.label:
            if kind == "attr":
                val = snap.get(col)
                if val not in (None, ""):
                    parts.append(str(val))
            else:
                model = _field_model(table, col)
                val = _as_uuid(snap.get(col))
                name = names.get(model, {}).get(val) if model and val else None
                if name:
                    parts.append(name)
        return " · ".join(parts) or None

    def _resolve_display_values(self, raw_rows: list[AuditLogRawRow]) -> list[ResolvedAuditRow]:
        snapshots = self._snapshots(raw_rows)
        parents = [
            self._parent_of(_TABLE_SPECS.get(entry.table_name), snap)
            for (entry, _), snap in zip(raw_rows, snapshots, strict=True)
        ]

        # Live parent rows, so a parent's label can be built like any record's.
        parent_ids: dict[str, set[uuid.UUID]] = {}
        for p in parents:
            if p:
                parent_ids.setdefault(p[0], set()).add(p[1])
        parent_rows = {t: self._live_rows(_TABLE_SPECS[t].model, ids) for t, ids in parent_ids.items()}

        # Every referenced name, one SELECT per model for the whole page.
        ids_by_model: dict[type, set[uuid.UUID]] = {}
        for (entry, _), snap in zip(raw_rows, snapshots, strict=True):
            spec = _TABLE_SPECS.get(entry.table_name)
            if spec:
                self._label_fk_ids(spec, snap, ids_by_model, entry.table_name)
            for data in (entry.old_data, entry.new_data):
                for field_name, val in (data or {}).items():
                    model = _field_model(entry.table_name, field_name)
                    vid = _as_uuid(val)
                    if model and vid:
                        ids_by_model.setdefault(model, set()).add(vid)
        for table, rows in parent_rows.items():
            for snap in rows.values():
                self._label_fk_ids(_TABLE_SPECS[table], snap, ids_by_model, table)

        names: dict[type, dict[uuid.UUID, str]] = {}
        for model, ids in ids_by_model.items():
            attr_col = getattr(model, _MODEL_DISPLAY_ATTR[model])
            names[model] = dict(self.db.execute(select(model.id, attr_col).where(model.id.in_(ids))).all())

        result: list[ResolvedAuditRow] = []
        for (entry, changed_by_name), snap, parent in zip(raw_rows, snapshots, parents, strict=True):
            spec = _TABLE_SPECS.get(entry.table_name)
            record_label = self._label(spec, snap, names, entry.table_name)
            parent_type = parent_id = parent_label = None
            if parent:
                parent_snap = parent_rows.get(parent[0], {}).get(parent[1])
                if parent_snap is not None:
                    parent_type, parent_id = parent
                    parent_label = self._label(_TABLE_SPECS[parent[0]], parent_snap, names, parent[0])
            if spec and spec.is_line and parent_id is not None:
                owner = (parent_type or "", parent_id, parent_label)
            else:
                owner = (entry.table_name, entry.record_id, record_label)
            result.append(
                ResolvedAuditRow(
                    entry=entry,
                    changed_by_name=changed_by_name,
                    record_label=record_label,
                    parent_type=parent_type,
                    parent_id=parent_id,
                    parent_label=parent_label,
                    owner_type=owner[0],
                    owner_id=owner[1],
                    owner_label=owner[2],
                    old_data_display=self._diff_display(entry.table_name, entry.old_data, names),
                    new_data_display=self._diff_display(entry.table_name, entry.new_data, names),
                )
            )
        return result

    @staticmethod
    def _diff_display(table: str, data: dict | None, names: dict[type, dict[uuid.UUID, str]]) -> dict[str, str]:
        display: dict[str, str] = {}
        for field_name, val in (data or {}).items():
            model = _field_model(table, field_name)
            vid = _as_uuid(val)
            label = names.get(model, {}).get(vid) if model and vid else None
            if label is not None:
                display[field_name] = label
        return display
