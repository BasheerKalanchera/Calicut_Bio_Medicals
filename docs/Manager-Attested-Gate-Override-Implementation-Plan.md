# Manager-Attested Stage-Gate Override — Implementation Plan

## Context

`docs/Discussion-FastTrack-Gate-Override-2026-08.md` was decided 2026-08-25
(Basheer/Haroon). This plan turns that decision into concrete backend/frontend
changes.

**What this builds:** a per-Opportunity attestation that lets a rep skip the
Qualified→Demo (Demo Date) and Clinical Evaluation→Negotiation (Expected
Closure Date) gates from `BR-OP-01` for a first-time customer who declines a
demo — the mirror-image case to `REPEAT_ORDER` (`BR-OP-13`): fresh customer,
fresh equipment, still no demo, but for a deal-specific reason rather than a
lead-source-driven one. Unlike `REPEAT_ORDER`, this is a judgment call, so it
requires naming a real approver (the rep's immediate manager) and a reason at
the moment the rep sets it — an attestation, not a blocking approval
workflow.

**Decided (discussion paper §5, 2026-08-25):**
- Approver: the rep's immediate manager, validated against the existing
  `user_profile.manager_id` FK, and that manager must hold the `Area Manager`
  role — **or**, as an escalation path for when the manager is unavailable
  (e.g. on leave), any user holding the `General Manager` role, with no
  reporting-line check for that path.
- Reason: master-data dropdown (new `GateOverrideReason` list) + optional
  free-text note.
- No overuse safeguard at launch — reporting visibility only, monitor-then-decide.
- New rule to be recorded as `BR-OP-14` once built.

## Correction (2026-08-26) — trigger mechanism, not the gate effect

Backend (steps 1–11 below) shipped 2026-08-25 (commits `31971e4`, `cdde722`)
and is **not being reverted** — it's sound and stays as-is. What was wrong is
entirely in the frontend's trigger logic (step 12).

**What shipped:** the 4 entry points computed a `gateOverrideRelevant`
boolean from `selectedStageOrder >= Demo` (or `>= Negotiation`) **and** the
corresponding date field being blank. The Approver/Reason box appeared
automatically the moment those conditions were true — which is every
opportunity sitting at Demo stage or later with a date not yet filled in,
override or not. Basheer's manual E2E pass (2026-08-26) caught this: any
lead reached Demo stage and got shown the override box, whether or not the
rep intended to invoke one.

**Corrected design:** an explicit, always-visible checkbox (labeled
**"Fast-Track this Deal"** — see step 12 for the 2026-08-27 wording
revision) on the form is the sole trigger, replacing the stage/blank-date
inference entirely:
- **Unchecked (default):** no override UI shown at all, at any stage.
  `BR-OP-01`'s gates apply exactly as they would if this feature didn't
  exist — a rep advancing to Demo or Negotiation without the required date
  gets the normal validation error, full stop.
- **Checked:** reveals Approver/Reason/Note, same fields and same picker
  logic as today. Once Approver + Reason are filled and saved, behavior is
  unchanged from what's already built — `gate_override_approver_id` being
  non-null is still exactly what waives the Demo Date and Expected Closure
  Date gates (`validators.py`'s `is_gate_override`, untouched).

**No schema or backend change needed.** The backend never had the
stage-inference bug — it only ever checked `gate_override_approver_id is not
None`, which is already the correct signal. Checkbox state on an existing
Opportunity is simply derived on load from whether that field is already
set — no new column. This is a frontend-only fix, confined to step 12.

**Also noted during the same manual pass, resolved as tester error:** the
Approver picker appeared to only offer the escalation-path General Manager
(Haroon Sidheeq), not the owner's actual immediate manager (Fazal), for a
rep (Fahad) whose `manager_id` correctly points to Fazal (Area Manager,
active). Cause: the Opportunity Owner field hadn't actually been set to
Fahad in that test run — the manager option only populates once an owner is
selected. Not a code defect; no fix needed.

## Confirmed current state (verified directly against the codebase)

- `BR-OP-13`'s mechanism (the closest sibling): `lead_source_id` resolves to a
  name, `validate_stage_transition` (`opportunity/validators.py`) checks
  `lead_source_name == "REPEAT_ORDER"` and skips the Demo Date / Expected
  Closure Date checks. This override does the same skip, gated on a different
  condition (`gate_override_approver_id is not None` instead of lead source).
- `user_profile.manager_id` already exists (migration `0008`) and is already
  the mechanism `opportunity_tier_visibility`'s Area Manager RLS branch uses
  for "my direct reports" — no new reporting-line modeling needed.
- `Area Manager` is a real, active role (`role.role_name`) — confirmed via
  `Physical-Schema.sql` and migration `0021`'s RLS policy text. `Sales Staff`
  is the correct name for the base rep tier (not "Sales Executive" —
  corrected 2026-08-25).
- `HoldReason`/`LossReason` (`reference/models.py`) are the exact master-data
  shape to copy for `GateOverrideReason`: `id`, `reason_code`, `reason_name`,
  `is_active`, no `description` column.
- `master_data.py`'s `MasterDataEntity`/`ENTITY_REGISTRY` pattern
  (`HOLD_REASONS` → `HoldReason`/`HoldReasonResponse`) is the exact pattern to
  extend for `gate-override-reasons`.
- The 4 opportunity create/edit entry points already at Demo Date/Hold-Lost
  field parity (per `Backlog.md`'s 2026-08-05 entry, commit `6a8e841`):
  `QuickLeadModal.tsx`, `Customer360Screen.tsx`,
  `ProjectDirectoryScreen.tsx`, `OpportunityDetailScreen.tsx`.
- `opportunity/repository.py` already queries `UserProfile` directly for
  cross-domain lookups (`get_user_sbu_ids`) — importing the model (not the
  organization domain's repository/service) is the established, standards-
  compliant pattern (`Backend-Implementation-Standards.md` §2, Domain
  Boundaries) for the new manager/role lookup this needs.
- `OpportunityCreate`/`OpportunityUpdate` already carry a
  `model_validator(mode="after")` for the referral "not both" cross-field
  rule (`_check_referral_not_both`) — same shape needed here for "reason
  required whenever approver is set."
- Latest migration is `0026_fix_notification_rls_returning.py` — next number
  is `0027`. **Confirmed 2026-08-25:** this feature builds first, ahead of
  Referral Credit Part 2 (Relationship-Support Activity), which also wanted
  `0027` — that plan's migration is now `0028` instead
  (`docs/Referral-Credit-And-Relationship-Support-Implementation-Plan.md`).
  Re-check `backend/alembic/versions/` at actual build time regardless.
- No RLS change needed anywhere in this feature — these are new columns on
  `opportunity` rows a user can already see; visibility is unaffected.

## Implementation steps

### 1. Migration `0027_add_gate_override.py`

`down_revision = "0026"` (re-check head at build time).

```python
def upgrade() -> None:
    op.create_table(
        "gate_override_reason",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("reason_code", sa.String(50), nullable=False, unique=True),
        sa.Column("reason_name", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
    )
    op.execute(
        """
        INSERT INTO gate_override_reason (reason_code, reason_name) VALUES
            ('DEMO_DECLINED', 'Customer declined demo'),
            ('ENTERED_AFTER_THE_FACT', 'Deal closed outside normal process, entered after the fact'),
            ('OTHER', 'Other — see notes');
        """
    )

    op.add_column(
        "opportunity",
        sa.Column("gate_override_approver_id", sa.UUID(as_uuid=True), sa.ForeignKey("user_profile.id"), nullable=True),
    )
    op.add_column(
        "opportunity",
        sa.Column("gate_override_reason_id", sa.UUID(as_uuid=True), sa.ForeignKey("gate_override_reason.id"), nullable=True),
    )
    op.add_column("opportunity", sa.Column("gate_override_note", sa.Text(), nullable=True))
    op.add_column("opportunity", sa.Column("gate_override_set_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "opportunity",
        sa.Column("gate_override_set_by", sa.UUID(as_uuid=True), sa.ForeignKey("user_profile.id"), nullable=True),
    )
    op.create_check_constraint(
        "ck_opportunity_gate_override_reason_required",
        "opportunity",
        "gate_override_approver_id IS NULL OR gate_override_reason_id IS NOT NULL",
    )


def downgrade() -> None:
    op.drop_constraint("ck_opportunity_gate_override_reason_required", "opportunity", type_="check")
    op.drop_column("opportunity", "gate_override_set_by")
    op.drop_column("opportunity", "gate_override_set_at")
    op.drop_column("opportunity", "gate_override_note")
    op.drop_column("opportunity", "gate_override_reason_id")
    op.drop_column("opportunity", "gate_override_approver_id")
    op.drop_table("gate_override_reason")
```

Seed reason codes are a starting strawman from the discussion paper §5.3 —
confirm final wording with Haroon before merging.

### 2. `reference/models.py` + `schemas.py` — `GateOverrideReason`

Model, exact `HoldReason` shape:

```python
class GateOverrideReason(Base):
    __tablename__ = "gate_override_reason"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reason_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    reason_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")

    opportunities: Mapped[list["Opportunity"]] = relationship(back_populates="gate_override_reason", lazy="select")
```

Response schema, exact `HoldReasonResponse` shape (`id`, `reason_code`,
`reason_name`).

### 3. `master_data.py` router

- `MasterDataEntity`: add `GATE_OVERRIDE_REASONS = "gate-override-reasons"`.
- `ENTITY_REGISTRY`: add `MasterDataEntity.GATE_OVERRIDE_REASONS: (GateOverrideReason, GateOverrideReasonResponse)`.
- No change to `_fetch_entities` — `GateOverrideReason` has `is_active`, so it
  falls through to the generic `ReferenceRepository(model, db).list_active()`
  branch, same as `HoldReason`.

### 4. `opportunity/models.py`

Add after `referred_by_note` (line 80):

```python
    gate_override_approver_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=True
    )
    gate_override_reason_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("gate_override_reason.id"), nullable=True
    )
    gate_override_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    gate_override_set_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    gate_override_set_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=True
    )
```

Relationships, same `foreign_keys=` disambiguation `referred_by` already uses
(three separate FKs into `user_profile` on this one table now — `owner_id`,
`referred_by_user_id`, `gate_override_approver_id`, `gate_override_set_by`,
each needs its own `foreign_keys=`):

```python
    gate_override_approver: Mapped["UserProfile | None"] = relationship(
        foreign_keys=[gate_override_approver_id], lazy="joined"
    )
    gate_override_set_by_user: Mapped["UserProfile | None"] = relationship(
        foreign_keys=[gate_override_set_by], lazy="joined"
    )
    gate_override_reason: Mapped["GateOverrideReason | None"] = relationship(
        back_populates="opportunities", lazy="joined"
    )
```

`datetime` needs importing (`from datetime import date, datetime`, currently
just `date`).

### 5. `opportunity/schemas.py`

`OpportunityCreate` and `OpportunityUpdate` — add:

```python
    gate_override_approver_id: uuid.UUID | None = None
    gate_override_reason_id: uuid.UUID | None = None
    gate_override_note: str | None = None
```

(On `Create` too, not just `Update` — `BR-OP-00` means gates apply on
creation at a non-Lead stage, and the discussion paper's example — a referral
going straight to negotiation — is exactly a create-time case.)

Extend the existing `model_validator` (or add a second one, whichever reads
cleaner alongside `_check_referral_not_both`) on both:

```python
    @model_validator(mode="after")
    def _check_gate_override_reason_required(self) -> "OpportunityCreate":  # / Update
        if self.gate_override_approver_id is not None and self.gate_override_reason_id is None:
            raise ValueError("Gate override reason is required whenever an approver is set.")
        return self
```

`OpportunityResponse` and `PipelineOpportunity` — add
`gate_override_approver_id`, `gate_override_reason_id`, `gate_override_note`,
`gate_override_set_at`, `gate_override_set_by`, plus nested
`gate_override_approver: OwnerNested | None` (reuse the existing nested
class, same as `referred_by`) and `gate_override_reason: GateOverrideReasonNested | None`
(new small nested class, `id` + `reason_name`, same shape as other nested
reference responses in this file).

### 6. `opportunity/validators.py`

`validate_stage_transition` gets one new parameter:

```python
def validate_stage_transition(
    *,
    new_stage_order: int,
    current_stage_order: int,
    lead_source_id: uuid.UUID | None,
    lead_source_name: str | None = None,
    indicative_value: Decimal | None,
    demo_start_date: date | None,
    expected_closure_date: date | None,
    po_number: str | None,
    has_items: bool,
    gate_override_approver_id: uuid.UUID | None = None,
) -> None:
    ...
    is_repeat_order = lead_source_name == _REPEAT_ORDER_LEAD_SOURCE
    is_gate_override = gate_override_approver_id is not None
```

Both gate checks get the same `not is_gate_override` addition
`is_repeat_order` already has:

```python
    # Gate: Qualified → Demo
    if current_stage_order < _ORDER_DEMO <= new_stage_order:
        if not is_repeat_order and not is_gate_override and not demo_start_date:
            raise BusinessRuleViolation("Demo Start Date is required to advance to Demo stage.")
    ...
    # Gate: Clinical Evaluation → Negotiation
    if current_stage_order < _ORDER_NEGOTIATION <= new_stage_order:
        if not is_repeat_order and not is_gate_override and not expected_closure_date:
            raise BusinessRuleViolation("Expected Closure Date is required to advance to Negotiation stage.")
```

Negotiation→Order and Order→Delivery gates are untouched, per the discussion
paper — Order Value/Product Details/PO Number stay mandatory.

### 7. `opportunity/repository.py` — approver validation lookup

Two small methods, same directness as `get_user_sbu_ids`:

```python
def get_owner_manager_id(self, owner_id: uuid.UUID) -> uuid.UUID | None:
    return self.db.scalar(select(UserProfile.manager_id).where(UserProfile.id == owner_id))

def get_user_role_name(self, user_id: uuid.UUID) -> str | None:
    return self.db.scalar(
        select(Role.role_name).join(UserProfile, UserProfile.role_id == Role.id).where(UserProfile.id == user_id)
    )
```

`get_user_role_name` is called on the *approver* (not the owner's manager
specifically), since the service layer needs the approver's own role either
way — for the Area Manager path, to confirm the manager holds that role; for
the General Manager escalation path, to confirm the approver themselves is a
GM. Needs `from app.domains.reference.models import Role` (check whether
it's already imported for `LeadSource`/`OpportunityStage` — likely yes, from
the same module).

### 8. `opportunity/service.py`

Constants + validation helper — approver must satisfy one of two paths: the
owner's own manager (holding Area Manager), or any General Manager
(escalation, no reporting-line check):

```python
_GATE_OVERRIDE_MANAGER_ROLE = "Area Manager"
_GATE_OVERRIDE_ESCALATION_ROLE = "General Manager"

def _validate_gate_override(self, owner_id: uuid.UUID, approver_id: uuid.UUID) -> None:
    approver_role_name = self.repository.get_user_role_name(approver_id)

    if approver_role_name == _GATE_OVERRIDE_ESCALATION_ROLE:
        return  # any GM qualifies -- no reporting-line check (escalation path)

    manager_id = self.repository.get_owner_manager_id(owner_id)
    if manager_id is None or approver_id != manager_id:
        raise AuthorizationError(
            "Gate override approver must be the opportunity owner's immediate manager, or a General Manager."
        )
    if approver_role_name != _GATE_OVERRIDE_MANAGER_ROLE:
        raise AuthorizationError("Gate override approver must hold the Area Manager role.")
```

**`create_opportunity`:** call `_validate_gate_override(data.owner_id, data.gate_override_approver_id)`
when `data.gate_override_approver_id is not None`, before
`validate_stage_transition`. Pass `gate_override_approver_id=data.gate_override_approver_id`
into `validate_stage_transition`'s call. When constructing `Opportunity(...)`,
also set `gate_override_approver_id`, `gate_override_reason_id`,
`gate_override_note` from `data`, and stamp `gate_override_set_at=func.now()`
/ `gate_override_set_by=created_by` — but only when `data.gate_override_approver_id`
is set (leave all four `None` otherwise, don't stamp a no-op).

**`update_opportunity`:** after the `setattr` loop, when
`"gate_override_approver_id" in updates and opportunity.gate_override_approver_id is not None`,
call `_validate_gate_override(opportunity.owner_id, opportunity.gate_override_approver_id)`
and stamp `gate_override_set_at`/`gate_override_set_by` (only on that branch —
an update that leaves `gate_override_approver_id` untouched must not re-stamp
it). Pass `gate_override_approver_id=opportunity.gate_override_approver_id`
into the existing `validate_stage_transition` call (reads post-setattr, same
as `demo_start_date` already does).

Note on `owner_id` changing in the same request as
`gate_override_approver_id`: the setattr loop already applied `owner_id`
before this validation runs, so `_validate_gate_override` naturally checks
against the *new* owner — same "PATCH semantics compare against the new
value" precedent `BR-ORG-01` already established for `manager_id`/`sbu_id`.

### 9. `docs/Business-Rules.md` — `BR-OP-14`

New entry after `BR-OP-13`, same structure:

```
### BR-OP-14: Manager-Attested Gate Override (2026-08-25)
* **Rule:** A rep may skip the Qualified → Demo (Demo Date) and Clinical
  Evaluation → Negotiation (Expected Closure Date) gates in BR-OP-01 for a
  deal-specific reason (e.g. the customer declines a demo), distinct from
  BR-OP-13's REPEAT_ORDER exception (which is lead-source-driven, not a
  judgment call). Setting `gate_override_approver_id` requires naming either
  the opportunity owner's own immediate manager — validated against
  `user_profile.manager_id` — who must hold the Area Manager role, or (as an
  escalation path for when that manager is unavailable, e.g. on leave) any
  user holding the General Manager role, with no reporting-line check for
  that path. Plus a `gate_override_reason_id` (master data) and optional
  `gate_override_note`.
* **Effect:** Identical to BR-OP-13's — Negotiation → Order and Order →
  Delivery gates are unaffected; Order Value, Product Details, and PO Number
  remain mandatory.
* **Approver:** The rep sets the override themselves (an attestation, not a
  blocking approval workflow) but must name a real approving manager at the
  same time, creating an auditable record without a wait-for-approval step.
* **Audit:** `gate_override_set_at`/`gate_override_set_by` capture who
  actually set it and when, distinct from `gate_override_approver_id` (who
  approved it).
* **Overuse safeguard:** None at launch — monitor via reporting
  (`gate_override_approver_id`/`gate_override_reason_id` are independently
  queryable), revisit only if usage patterns suggest misuse.
* **Enforcement:** `validate_stage_transition` (`app/domains/opportunity/validators.py`).
* **Reference:** `docs/Discussion-FastTrack-Gate-Override-2026-08.md`.
```

### 10. Regenerate `docs/Physical-Schema.sql`

Per `Backend-Implementation-Standards.md` §4 — `pg_dump --schema-only`
against a fully-migrated environment, commit alongside migration `0027`.

### 11. Backend tests

- `test_opportunity_service.py` (validators are usually tested directly —
  check whether there's a `test_opportunity_validators.py`; if not, this
  repo's convention tests validators via the service layer):
  - Demo Date / Expected Closure Date gates pass when `gate_override_approver_id`
    is set and Demo Date/Expected Closure Date are empty.
  - Negotiation→Order and Order→Delivery gates still enforced with an active
    override (Order Value/PO Number still required).
  - `_validate_gate_override`: approver not the owner's manager and not a GM
    → `AuthorizationError`. Approver is the owner's manager but not Area
    Manager role → `AuthorizationError`. Correct manager + Area Manager role
    → succeeds. Approver is a General Manager but *not* the owner's manager
    → succeeds (escalation path). Approver is a General Manager *and* the
    owner's manager → succeeds either way (confirms the OR doesn't
    accidentally exclude this overlap case).
  - `gate_override_reason_id` omitted while `gate_override_approver_id` is
    set → schema-level `ValidationError` (422), not a 500.
  - `gate_override_set_at`/`gate_override_set_by` are stamped only when the
    approver is newly set, not on unrelated updates.
- `test_master_data.py`: `gate-override-reasons` entity returns active rows,
  same shape as the existing `hold-reasons` test.
- Router test: create/update an Opportunity with a valid gate override,
  happy path.

### 12. Frontend — 4 opportunity create/edit entry points (reworked 2026-08-26)

`QuickLeadModal.tsx`, `Customer360Screen.tsx`, `ProjectDirectoryScreen.tsx`,
`OpportunityDetailScreen.tsx`. Already built: the Approver/Reason/Note fields
and their picker plumbing. **What changes:** replace the stage/blank-date
`gateOverrideRelevant` inference with an explicit checkbox as the sole
trigger.

- **"Fast-Track this Deal" checkbox** (label revised 2026-08-27 — reads as
  an action for the rep rather than a compliance notice; the Approver
  field's own helper text still carries the manager-approval requirement),
  always visible on the form regardless of Stage or which date fields are
  filled — not conditionally rendered. Plain boolean UI state (e.g.
  `gateOverrideChecked`), initialized on edit from whether the Opportunity
  already has `gate_override_approver_id` set, and `false` by default on
  create.
- **Unchecked:** Approver/Reason/Note fields are not rendered at all, and
  `gate_override_*` is omitted from the payload — the existing Demo
  Date/Expected Closure Date requirements in `BR-OP-01` apply exactly as if
  this feature didn't exist.
- **Checked:** reveals Approver/Reason/Note directly — no separate heading
  message above them (an earlier draft repeated the checkbox's own label
  as a second banner inside the box; dropped 2026-08-27 as redundant). Same
  fields, same required-reason-when-approver-set validation already in
  place. No other change to how these fields behave once shown.
- **Demo Start Date / Demo End Date:** hidden immediately once the checkbox
  is checked, regardless of Stage. A skipped demo is never relevant at any
  stage — same treatment these fields already get for
  `leadSourceCode === "REPEAT_ORDER"` (`QuickLeadModal.tsx:424`,
  `leadSourceCode !== "REPEAT_ORDER"` in the render condition). Add
  `&& !gateOverrideChecked` alongside that existing exclusion at all 4 entry
  points, rather than inventing a new pattern.
- **Expected Closure Date — stage-dependent, not tied to the checkbox
  alone.** Its gate (`BR-OP-01`'s Clinical Evaluation → Negotiation) fires
  specifically when *entering* Negotiation, and the field stays meaningful
  while a deal sits in Negotiation even if Demo/Clinical Evaluation were
  skipped — a rep can still forecast when they expect to close. So: with
  the checkbox checked, **keep showing this field (optional, never
  mandatory) while Stage = Negotiation**; hide it only once **Stage = Order
  or beyond** — at that point the deal has moved past forecasting a closure
  date. Concretely: visible when `!gateOverrideChecked || selectedStageOrder
  < STAGE_ORDER_ORDER`, hidden when `gateOverrideChecked &&
  selectedStageOrder >= STAGE_ORDER_ORDER`. This is a genuine behavioral
  difference from Demo Date, not the same `&& !gateOverrideChecked` pattern
  — don't copy the Demo Date treatment here.
- **Unchecking on an edit that already has an override set** must clear
  `gate_override_approver_id`/`gate_override_reason_id`/`gate_override_note`
  to `null` in the payload (not just hide the fields client-side) — this is
  what TC-11 in the manual E2E checklist already expects, and re-enforces
  the gate once cleared.
- Approver picker — scoped to the owner's actual manager **plus all active
  General Managers** (escalation path), not a free user picker. Already
  built correctly; the owner's manager only appears once an Owner is
  selected on the form, so verify with a real manager/rep pair
  (Fahad → Fazal) with Owner explicitly set during manual E2E.
- Reason dropdown from `listGateOverrideReasons()` (already built, same
  shape as `listHoldReasons`) + optional note free-text field — unchanged.

### 13. `types/api.ts`

Regenerate via `generate:types` script once the backend schema changes land.

### 14. Approver awareness notification + audit-stamp fix (added 2026-08-27)

Raised by Basheer during manual E2E: Fazal (the named approver) had no idea
an opportunity had named him, and the Overview tab's "Approved By Fazal"
reads as a completed fact when it's actually the rep's attestation. Decision
(see `docs/Business-Rules.md`'s BR-OP-14): stay with the attestation model —
no request/approve workflow, no blocking state — but give the named manager
a passive, in-app heads-up.

- **Bug found while designing this, fixed in the same pass:**
  `OpportunityService.update_opportunity` currently re-stamps
  `gate_override_set_at`/`gate_override_set_by` (and re-runs
  `_validate_gate_override`) on **every save** that includes
  `gate_override_approver_id` in the payload — not just the save that
  actually sets it. Because the frontend always resends the field once the
  checkbox is checked (BR-OP-14's existing "always sent explicitly" pattern
  — see step 12), an unrelated edit (renaming the deal, fixing a phone
  number) silently overwrites the audit timestamp. Fix: capture
  `previous_gate_override_approver_id = opportunity.gate_override_approver_id`
  before the update loop (same pattern as the existing `previous_owner_id`
  capture just above it), and only re-stamp/re-validate when the value
  actually changed. This was already TC-19's expectation — it just wasn't
  actually enforced.
- **Notification:** `NotificationService.notify_gate_override_named()`
  (new, mirrors `notify_opportunity_assigned`) — type `GATE_OVERRIDE_NAMED`,
  `is_urgent=False` always (bell icon only, never
  `UrgentNotificationDialog`). Called from `OpportunityService` in two
  places: `create_opportunity` when `gate_override_approver_id` is set on
  creation, and `update_opportunity` only inside the "actually changed"
  branch from the bug fix above — so it fires exactly once per genuine
  approver assignment, never on a routine re-save.
- **Frontend:** `NotificationBell.tsx`'s `describe()` hardcodes "assigned
  you" text for every notification (only one type existed until now). Add a
  branch on `n.type === "GATE_OVERRIDE_NAMED"`, e.g. "{rep} named you as
  approving manager for {opportunity}." `UrgentNotificationDialog.tsx`
  needs no change — already scoped to `is_urgent` only.
- **No schema change** — `Notification.type` is a free-text column, no new
  migration, no `types/api.ts` regeneration needed for this step.

### 15. Uncheck-doesn't-retroactively-block bug (found and fixed 2026-08-27)

Found by Basheer running TC-6: unchecking the override and saving does **not**
re-block the save even when the current Stage's normal gates (Demo Date,
Expected Closure Date) are unmet — contradicting TC-6's own documented
expectation.

**Root cause:** `validate_stage_transition` (`validators.py:48`) returns
immediately when `new_stage_order <= current_stage_order` — gates only fire
on a *forward* stage move, by design, for the entire gate system (BR-OP-00/
01), not something specific to BR-OP-14. `OpportunityService.
update_opportunity` only calls the validator at all when `"stage_id" in
updates`, but the frontend always resends the current `stage_id` on every
save (`OpportunityDetailScreen.tsx:1459`, `editStageId || undefined`), so
the validator *does* run on every save — it just no-ops immediately because
the stage isn't advancing in that particular save.

**Why this is worse than "the gate doesn't re-fire":** a rep can check the
box, jump straight to Negotiation with no Closure Date, save — then uncheck
the box and save again. The override fields clear (no more named approver,
reason, or note), the deal stays at Negotiation, the Closure Date is still
blank, and save succeeds. The one audit signal that a shortcut was ever
taken (the named approver) is now gone, while the shortcut's effect (being
at Negotiation without a Closure Date) persists — worse than a gate that
simply never re-checks, because it erases the trail.

**Fix (built):** in `update_opportunity`, when this save clears the override
(`previous_gate_override_approver_id` was not null, new value is null),
re-run `validate_stage_transition` against the opportunity's *current*
effective stage as if arriving there fresh — `current_stage_order=0`, same
pattern `create_opportunity` already uses for a brand-new Opportunity
created directly at a non-Lead stage — with `gate_override_approver_id=None`
and the (possibly just-edited) current field values. If that raises, the
save is blocked with the same message the gate would show on a real forward
move, instead of silently letting the uncheck through. Scoped narrowly to
the clear-transition case only — every other save path (override staying
set, override staying unset, a genuine forward stage move) is unaffected.
3 new backend tests added (585 passing total): blocks when the date is
still blank, succeeds when the rep filled it in before unchecking, and
doesn't block when the deal never reached a gated stage in the first place.

## Ordering

**Steps 1–11 (backend) already built, applied to Dev, and shipped** —
`31971e4`/`cdde722`, 2026-08-25. Not being redone.

**Remaining scope (2026-08-26 rework):** step 12 only — replace the
stage/blank-date trigger with the explicit checkbox — across all 4 entry
points → regenerate
`types/api.ts` (13) if any type shape changed (unlikely — no schema change)
→ re-run manual verification on Dev, starting from TC-1 (checkbox now
gates whether the box appears at all) through the approver-validation cases
(TC-8/TC-9, security-relevant — don't skip) and TC-11 (uncheck clears the
override). The manual E2E checklist doc itself needs a matching revision
before that re-run — separate follow-up, not done as part of this plan
update.

**Step 14 (2026-08-27):** `notification/service.py` +
`opportunity/service.py` (audit-stamp fix + notify hooks) →
`NotificationBell.tsx` (new `describe()` branch) → manual verification of
the new TC (notification fires once, doesn't re-fire/re-stamp on an
unrelated edit) — see the E2E checklist's Section F.

**Step 15 (found and fixed 2026-08-27):** `opportunity/service.py`
(`update_opportunity`'s clear-transition re-validation) → 3 new backend
tests added to `TestUpdateOpportunityGateOverride` → re-run TC-6 on Dev to
confirm the block now fires live, not just under the mocked test suite.

### Critical files
- backend/alembic/versions/0027_add_gate_override.py
- backend/app/domains/reference/models.py
- backend/app/domains/reference/schemas.py
- backend/app/api/routers/master_data.py
- backend/app/domains/opportunity/models.py
- backend/app/domains/opportunity/schemas.py
- backend/app/domains/opportunity/validators.py
- backend/app/domains/opportunity/repository.py
- backend/app/domains/opportunity/service.py
- backend/app/domains/notification/service.py
- docs/Business-Rules.md
- docs/Physical-Schema.sql
- sales-os-app/src/components/QuickLeadModal.tsx
- sales-os-app/src/screens/Customer360Screen.tsx
- sales-os-app/src/screens/ProjectDirectoryScreen.tsx
- sales-os-app/src/screens/OpportunityDetailScreen.tsx
- sales-os-app/src/components/NotificationBell.tsx
- sales-os-app/src/services/masterData.ts
- sales-os-app/src/types/api.ts

### Manual E2E verification

14 test cases, run against Dev, checklist + results log:
`docs/Manager-Attested-Gate-Override-Manual-E2E-Verification.md`.
