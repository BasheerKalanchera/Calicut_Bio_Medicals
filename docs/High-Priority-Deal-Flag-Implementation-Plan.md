# High Priority Deal Flag — Implementation Plan

**Status:** Approved, ready to build. **Feature:** 2.2 (Module 3 → PRD 3.9
Deal Prioritization). **Rule confirmed:** Haroon, 2026-09-14 —
`Business-Rules.md`'s **BR-OP-15**, replacing an earlier proposed
value/closure-date threshold (see `docs/Backlog.md`'s "Auto-computed 'High
Priority' deal flag" entry for that superseded derivation). Pulled into this
week's Sprint Plan on Basheer's call, 2026-09-14, so next week's
Kanban-priority-sort item has something to build on.

## The rule (BR-OP-15)

An Opportunity is High Priority in one of two ways:

1. **Automatic:** any Opportunity past the Demo stage — Clinical Evaluation,
   Negotiation, Order, or Delivery & Installation
   (`opportunity_stage.display_order > 30`) — is automatically High
   Priority. Computed at query time from the current stage; **no stored
   field, nothing to keep in sync.**
2. **Manual:** an Opportunity still in Lead, Qualified, or Demo stage
   (`display_order` 10/20/30) does not qualify automatically, but can be
   marked High Priority by hand via a flag a person sets explicitly. **This
   half needs a new field** — the only schema change this plan makes.

Effective status is always `stage.display_order > 30 OR high_priority_manual`
— the two halves aren't mutually exclusive gates a caller has to reason
about. A deal that's naturally past Demo stays "High Priority" regardless of
what the manual flag happens to hold; unsetting the manual flag on an
already-automatic deal has no visible effect. No stage-based validation is
needed on the manual flag itself — it's just inert once the automatic half
takes over.

## Out of scope for this plan

- **Kanban priority-sort** (Feature 2.2's other row) — explicitly next
  week's item in `docs/Phase1-Completion-Sprint-Plan.md`, blocked on this
  flag existing first. This plan surfaces the flag (badge + manual toggle)
  but does not reorder any list.
- **Insights Dashboard's "High-Priority Deals" tile** — a separate,
  not-yet-scoped row (Insights-Dashboard-Implementation-Plan.md's Batch 1
  deferred list). `is_high_priority` will be available on `PipelineOpportunity`
  for that tile to consume later, but building the tile itself is a
  different piece of work.
- **Weekly Follow-up Report** — still unbuilt, unrelated to this plan beyond
  eventually reading the same computed field.

## Backend

1. **`backend/alembic/versions/0042_add_opportunity_high_priority_manual.py`**
   (new, head is currently `0041`) — `ALTER TABLE opportunity ADD COLUMN
   high_priority_manual BOOLEAN NOT NULL DEFAULT false`. Only the manual
   half needs storage; the automatic half is read-only derived data, never
   migrated.
2. **`backend/app/domains/opportunity/models.py`** — `Opportunity` gains
   `high_priority_manual: Mapped[bool] = mapped_column(Boolean, nullable=False,
   server_default="false")`.
3. **`backend/app/domains/opportunity/schemas.py`**:
   - `OpportunityCreate` — add `high_priority_manual: bool = False`.
   - `OpportunityUpdate` — add `high_priority_manual: bool | None = None`
     (existing generic `exclude_unset` update loop in
     `service.py::update_opportunity` already applies it — no service code
     change needed for the update path).
   - `PipelineOpportunity` — add `high_priority_manual: bool`, plus a
     `@computed_field` property `is_high_priority: bool` returning
     `self.stage.display_order > _HIGH_PRIORITY_STAGE_THRESHOLD or
     self.high_priority_manual`, where `_HIGH_PRIORITY_STAGE_THRESHOLD = 30`
     is a module-level constant with a comment cross-referencing
     `validators.py`'s `_ORDER_DEMO = 30` (same threshold, kept as two
     separate constants per each module's existing convention of local,
     underscore-prefixed thresholds rather than a shared import). This is
     the schema that matters most: `GET /opportunities/pipeline` (Kanban/List)
     **and** `GET /opportunities/{id}` (Detail screen) both already return
     `PipelineOpportunity`, and it already carries the full `stage` object
     needed for the computation — no new join, no extra query.
   - `OpportunityResponse` (create/update echo only, not what the Detail
     screen renders) — add `high_priority_manual: bool` for consistency; no
     computed field needed here since nothing reads it from this schema.
4. **`backend/app/domains/opportunity/service.py`** — `create_opportunity`'s
   explicit `Opportunity(...)` constructor call gets
   `high_priority_manual=data.high_priority_manual` added alongside the
   other fields.
5. **`docs/Business-Rules.md`** — BR-OP-15's "Enforcement" bullet updated
   from "Not yet built" to the actual migration/field/computed-field
   references once merged.
6. **Tests** (`backend/tests/domains/opportunity/`) — cover:
   - `is_high_priority` computed field: false for Lead/Qualified/Demo with
     `high_priority_manual=False`; true for the same three stages when
     `high_priority_manual=True`; true for each of Clinical
     Evaluation/Negotiation/Order/Delivery & Installation regardless of
     `high_priority_manual`.
   - `create_opportunity` persists `high_priority_manual` from
     `OpportunityCreate` (defaults to `False` when omitted).
   - `update_opportunity` can flip `high_priority_manual` via the generic
     update path (proves the existing `exclude_unset` loop handles it, no
     regression).

**Your side (direct-DB actions, blocked for me under the auto-mode safety
classifier):**
- Apply migration `0042` to Dev.
- Regenerate `Physical-Schema.sql` via `pg_dump --schema-only` per
  `Backend-Implementation-Standards.md`'s migration workflow, same commit as
  the migration.

## Frontend

1. **Regenerate `sales-os-app/src/types/api.ts`** (`npm run generate:types`,
   dev server running) once the backend schema change is in place, before
   touching any frontend file — every step below depends on
   `PipelineOpportunity` carrying `is_high_priority`/`high_priority_manual`.
2. **`sales-os-app/src/screens/OpportunityPipelineScreen.tsx`** — a "High
   Priority" badge, same visual pattern as the existing "Reactivation
   Overdue" badge (`isReactivationOverdue(...)` conditional chip, red
   border/background):
   - `DealCard` (Kanban card, ~line 107) — add `opp.is_high_priority &&
     <Box component="span" ...>High Priority</Box>` alongside the existing
     Reactivation Overdue chip.
   - `ListRow` (List view, ~line 202) — same chip, same position in that
     row's badge cluster (stage/status/reactivation/value).
3. **`sales-os-app/src/screens/OpportunityDetailScreen.tsx`**:
   - Header badge row (~line 1602-1610, alongside `StageBadge`/`StatusBadge`/
     Reactivation Overdue) — add the same High Priority chip when
     `opp.is_high_priority`.
   - Edit form — add a `FormControlLabel`/`Checkbox` for
     `high_priority_manual`, same pattern as the existing gate-override
     checkbox (~line 1793) and external-referrer checkbox (~line 1753).
     Shown only when the currently-selected edit stage's `display_order <=
     30` (Lead/Qualified/Demo — reuse the screen's own existing
     `editStageOrder` derived value, ~line 1554); once the stage is past
     Demo, hide the checkbox and instead show a small note ("Automatically
     High Priority — this deal is past Demo stage") so it's clear the flag
     isn't just silently ignored.
   - Wire `high_priority_manual` into the edit-save payload (`editStageId
     || undefined` etc., ~line 1468) and the local `opp` merge-on-save
     (~line 1543), matching the existing field-update pattern.
4. **Badge component reuse check** — before adding a fourth near-identical
   inline chip `Box`, consider whether a small shared `Chip`-style helper is
   warranted (Reactivation Overdue already appears 3x with copy-pasted sx).
   Not required for this plan, but worth a look while touching all three
   sites in one pass — extract only if it turns out to be a clean, low-risk
   lift, not as a prerequisite.

## Sequencing

Small, self-contained — one new column, one computed field, badges in three
existing locations, one checkbox in an existing edit form. No overlap with
anything currently in flight. Directly unblocks next week's "Kanban sorted
by priority" Sprint Plan item, which depends on `is_high_priority` existing
on `PipelineOpportunity`.
