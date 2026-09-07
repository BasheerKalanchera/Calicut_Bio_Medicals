# Audit Trail Extension — Opportunity Item, Split, Stakeholder — Implementation Plan

**Status:** Planned, not built. **Start date: 2026-09-10** — after the
2026-09-08 UAT batch (Marketing Lead Handling, Opportunity Notes Privacy,
Audit Trail Phase 1, Manager-Attested Gate Override, Sales Development
Activities, Relationship-Support Activity, Login Reminders, Opportunity
Assignment Alerts, Near-Duplicate Hospital Warning) has had a week to
stabilize in UAT.
**Input:** this plan's scope and root-cause fix were worked out in the
2026-09-07 planning conversation that produced the UAT-signoff feature
list; see `docs/Progress-Archive-2026-09.md`'s 2026-09-07 entries for the
full reasoning trail (why `opportunity_item`/`split` needed more than just
new triggers, and the API-Catalog/ADR history behind why they were built
as bulk-replace in the first place). Mechanism (Postgres triggers +
centralized `audit_log`) is settled by ADR-017 and `docs/Audit-Trail-
Implementation-Plan.md` and not revisited here — this plan only covers
extending it to three more tables and fixing what stands in the way for
two of them.

## Scope

Add `audit_log` coverage for:
- `stakeholder` — contact details (name, designation, email, phone,
  WhatsApp) and relationship-health fields (`nps_score`, `sentiment`) for
  Account decision-makers.
- `opportunity_item` — product/quantity/price/discount lines on a deal.
- `split` — revenue/credit split between reps on a deal.

`target_plan` and `marketing_lead` are explicitly out of scope here —
`target_plan`'s audit trail is deferred until the Target Planning feature
itself is built (`docs/Backlog.md`); `marketing_lead`'s is a separately
tracked, already-documented gap (`docs/Backlog.md`, raised 2026-09-03) that
Basheer may choose to fold into a future pass but is not bundled into this
one.

## Root-cause fix required before the trigger is useful (the real work here)

`stakeholder` is edited via a genuine in-place `UPDATE`
(`account/stakeholder_service.py:49`, no delete endpoint exists) — for this
table, adding a trigger is the *entire* task, identical in shape to the
original four tables.

`opportunity_item` and `split` are not edited in place today. Both go
through a **delete-all-then-reinsert** "bulk replace" pattern
(`opportunity/repository.py:249-260` and `:292-301`, called from
`OpportunityService.replace_items`/`replace_splits`,
`opportunity/service.py:410-438`). This was a deliberate Phase 1 design
choice — documented in `docs/API-Catalog.md:105-111` ("`PUT` (bulk
replace) handles deletions inherently without needing explicit `DELETE`
endpoints") and reinforced by the SBU-grandfathering rule in
`docs/ADR.md:45` — made before ADR-017's audit trail existed, to avoid
building three separate `DELETE` endpoints. It is not a performance
optimization (checked: no latency difference at this row count either
way) — purely an endpoint-count trade-off that nobody revisited once the
audit trail came along.

**Effect if left as-is:** every edit to a line item or split — even
changing one field — looks to the trigger like the old row being deleted
and an unrelated new row appearing, instead of one row changing. The
audit log would show "row deleted" (old values, correct `changed_by`) with
no paired "here's what it became," rather than the clean
`old_data`/`new_data` diff the other four tables get. **Rejected as
insufficient** (Basheer, 2026-09-07) — "before: ₹5L → after: ₹8L" must be
a single readable entry, not a delete-and-infer-from-the-current-row
workaround.

**Fix — make identity survive a save, so a real edit is a real `UPDATE`:**

1. **`opportunity_item`:**
   - Frontend (`sales-os-app/src/screens/OpportunityDetailScreen.tsx:378-
     384`): `saveItems` currently strips `id` when building the payload —
     add `id: i.id` (existing rows) / omitted or `null` (newly added
     rows) to each item sent to `replaceOpportunityItems`.
   - Backend schema (`opportunity/schemas.py:93-99`, `OpportunityItemCreate`
     — or a new `OpportunityItemUpsert` extending it): add optional
     `id: uuid.UUID | None = None`.
   - Backend `OpportunityService.replace_items` /
     `OpportunityRepository.replace_items`: instead of unconditional
     delete-all/insert-all, partition incoming items into (a) `id` matches
     an existing row → `UPDATE` that row's fields in place, (b) existing
     row's `id` absent from the incoming list → `DELETE` (a genuine
     removal — correctly produces a DELETE audit entry), (c) no `id` →
     `INSERT` (new line, correctly produces no audit entry, per the
     original plan's INSERT-not-logged decision).
   - **Backward compatible by construction:** `id` is optional: if any
     caller (a stale cached frontend build, a future integration) omits
     it, every item falls into case (c)/(b) and the behavior is exactly
     today's delete-all/insert-all — no breaking change, just no clean
     diff for that particular save.

2. **`split`:** simpler — no frontend change needed. A split's natural key
   is `(opportunity_id, user_id)`; the UI already prevents two rows for
   the same rep on one deal (`OpportunityDetailScreen.tsx`: `editSplits`
   keyed by `user_id`, duplicate `user_id` blocked before add). Backend
   `replace_splits`/`Split` repository: upsert by `(opportunity_id,
   user_id)` — `UPDATE split_percentage` in place if that rep already has
   a row on this deal, `INSERT` if new, `DELETE` if a rep was removed from
   the list.
   **Verified 2026-09-07: zero rows exist in UAT's `split` table today** —
   no deal currently has more than one rep sharing revenue credit, so
   there is no legacy-data migration or dedup concern for this table at
   all; this is a clean, low-risk change with nothing to reconcile.

3. **Data-impact check on existing rows (confirmed 2026-09-07, UAT has 108
   opportunities):** this fix is purely forward-acting. No existing
   `opportunity_item`/`split`/`stakeholder` row is touched, migrated, or
   renumbered by shipping it — every row already has its own `id` (it
   always has; the app just wasn't sending it back). The only behavior
   change is what happens the next time an existing deal's items/splits
   are saved. No audit history is retroactively invented for edits made
   before this ships, matching the original plan's "no backfill" decision.
   **One residual integrity check before enabling the `split` upsert
   logic broadly:** confirm no deal has duplicate `(opportunity_id,
   user_id)` rows from some historical path outside today's UI constraint
   — read-only check, ask Basheer first per the standing UAT-access rule:
   `SELECT opportunity_id, user_id, count(*) FROM split GROUP BY 1,2
   HAVING count(*) > 1;`. Given zero rows exist today, this is expected to
   return nothing, but worth confirming before relying on the assumption
   in code.

## Trigger additions (no changes to the existing function)

The existing `audit_log_row_change()` function (migration `0030`) is
already fully generic — table-agnostic via `TG_TABLE_NAME`/`TG_OP`,
column-agnostic via `jsonb_each` diffing. No function change required,
only three new triggers, in a new migration (next head at implementation
time — `0039` is current head as of this plan; confirm before numbering):

```sql
CREATE TRIGGER trg_audit_stakeholder AFTER UPDATE OR DELETE ON stakeholder
FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();

CREATE TRIGGER trg_audit_opportunity_item AFTER UPDATE OR DELETE ON opportunity_item
FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();

CREATE TRIGGER trg_audit_split AFTER UPDATE OR DELETE ON split
FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();
```

`downgrade()` drops all three, mirroring `0030`'s downgrade ordering.
Adding a trigger is a metadata-only operation — no table rewrite, no lock
concern regardless of existing row count (108 opportunities' worth of
items, 134 stakeholders today).

## Display-layer additions (`backend/app/domains/audit/repository.py`)

- `_FIELD_RESOLVER_MAP` (line 38): add `"opportunity_id": Opportunity`,
  `"product_id": Product`, `"user_id": UserProfile` — new FK *names* the
  diff hasn't needed to resolve before (needed once each, reused by
  whichever table's diff contains them).
- `_RECORD_LABEL_RESOLVER_MAP` (line 62): add `"stakeholder": (Stakeholder,
  "name")` — direct column, same shape as the existing four entries.

**Decided 2026-09-07: `opportunity_item` and `split` get no
`_RECORD_LABEL_RESOLVER_MAP` entry.** Neither table has a natural
single-column label (a line item's "identity" is a product+quantity
combination, a split's is a percentage) — the resolver's existing pattern
only supports one scalar column per model. Building a synthetic label
would require a SQL view or a hybrid-property pattern not used anywhere
else in this codebase, for a cosmetic gap: the diff itself already carries
the meaningful before/after values, and a manager can cross-reference via
the parent Opportunity's own audit history. Revisit only if this proves
confusing in practice.

## Tests

`backend/tests/domains/audit/test_audit_log_service.py` — extend existing
coverage:
- `stakeholder`: UPDATE via `update_stakeholder` produces a clean diff row
  (same shape as existing account/product/opportunity tests).
- `opportunity_item`: add → no audit row; edit an existing line (id
  round-tripped) → one UPDATE diff row with only the changed field(s);
  remove a line (absent from resubmitted list) → one DELETE row with full
  old values; a no-op resave (identical list resubmitted) → zero new audit
  rows.
- `split`: same three cases (add/edit/remove), keyed by `(opportunity_id,
  user_id)` instead of a surrogate id.
- Regression: confirm a resubmitted list containing a mix of unchanged,
  edited, added, and removed lines in one save produces exactly the
  expected set of audit rows (one per changed/removed line, none for
  unchanged or added lines).

## Docs to update once built (not now)

- `docs/Business-Rules.md` / ADR-017's "Affected Modules" — add
  `stakeholder`, `opportunity_item`, `split` to the audited-table list,
  and note the delete-driven-by-design behavior for the latter two so a
  future reader isn't confused seeing DELETE rows for routine edits made
  before this fix (historical entries, if any land during a transition
  window, will look different from post-fix entries).
- `docs/Physical-Schema.sql` — regenerate after the migration is applied,
  per the standard `PDM Change → Model Update → alembic revision → Review
  → Apply → Regenerate Physical-Schema.sql` workflow
  (`Backend-Implementation-Standards.md`).

## Sequencing / scope note

Touches `OpportunityDetailScreen.tsx` (items/splits save handlers only),
`opportunity/schemas.py`, `opportunity/service.py`,
`opportunity/repository.py`, `audit/repository.py`, plus one new
migration. No overlap with the 2026-09-08 batch's files once that batch
has shipped and stabilized — this plan deliberately starts after, not
alongside, that release. Per this project's standing rule, Basheer applies
the migration himself; the implementing session produces the migration
file and updates `Physical-Schema.sql` afterward, but does not run
`alembic upgrade` against a live environment.
