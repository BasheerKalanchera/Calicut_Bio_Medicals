# Reference Data Management Screen — Implementation Plan

**Status:** Draft — planned, not yet built. Raised 2026-09-11 while scoping Coverage
Planning's `coverage_frequency` picklist; grew into its own standalone feature since
the need (a live-editable label list, no deploy required) applies to several existing
tables, not just the new one.

## Context

**The problem this solves:** several short, fixed-choice lists already exist in the
app today (Hold Reasons, Loss Reasons, Fast-Track Override Reasons, Lead Sources,
Project Statuses) — every one of them is real database data (a
`ReferenceRepository`-backed table, per `Backend-Implementation-Standards.md` §6), not
hardcoded into the application code. But **nothing in the app today lets anyone edit
that data through a screen.** Changing one of these lists currently means a direct
data change, request-driven. Raised because the same need just came up for the new
`coverage_frequency` list (`docs/Coverage-Planning-Implementation-Plan.md`, decision
#3) — Basheer wants Cabio staff to add/update these lists themselves going forward,
not just this one.

### Scope decision — resolved 2026-09-11 (Basheer): label-only lists, stages/statuses excluded

Checked every existing reference table's actual columns (`Physical-Schema.sql`).
**Included, genuinely simple label lists:**

| List | Table | Shape |
|---|---|---|
| Hold Reasons | `hold_reason` | `reason_code`, `reason_name`, `is_active` |
| Loss Reasons | `loss_reason` | `reason_code`, `reason_name`, `is_active` |
| Fast-Track Override Reasons | `gate_override_reason` | `reason_code`, `reason_name`, `is_active` |
| Lead Sources | `lead_source` | `name`, `description`, `is_active`, `is_marketing_source` |
| Project Statuses | `project_status` | `status_code`, `status_name`, `is_active` |
| Coverage Frequency (new) | `coverage_frequency` | `code`, `name`, `display_order`, `is_active` — see below |

**Deliberately excluded — decided, not deferred by accident:**
- **`opportunity_stage` / `opportunity_status`** — these aren't plain labels. Every
  Stage carries `default_win_probability`, which feeds directly into the Insights
  Dashboard's Weighted Forecast tile; every Status carries `is_terminal`, which drives
  the entire Won/Lost decoupling model (`ADR-028`). A generic rename/retire screen is
  the wrong tool for fields with live behavioral weight — these need their own
  dedicated, careful treatment if Cabio ever wants them editable, not to share this
  screen's generic mechanism.
- **`zone`** — already has its own dedicated screen (Territory Map), a much richer
  hierarchy editor than this screen's flat-list shape.
- **`sbu` / `product` / `role`** — structural entities with many fields and real
  relationships, not short label lists. `role` additionally has no `is_active` column
  at all (`Backend-Implementation-Standards.md` §6's explicit note) and touches
  security directly — out of scope on every count.

### `coverage_frequency` becomes a real reference table, not a free-text field

**Supersedes Coverage Planning's plan (decision #3):** that plan proposed
`coverage_frequency` as a plain nullable `string(50)` column on `coverage_plan_entry`
with an application-level picklist. Once this screen exists, that's the wrong shape —
a free-text column can't be "managed" by this screen at all. **Correct shape: a real
`coverage_frequency` table** (same as the other five), with
`coverage_plan_entry.coverage_frequency_id` as an FK instead of a raw string column.
Seeded with the five agreed labels (Weekly / Bi-weekly / Monthly / Quarterly /
As-needed), editable here afterward. **`docs/Coverage-Planning-Implementation-Plan.md`
needs a matching correction** — its `schemas.py`/model bullets should reference
`coverage_frequency_id`, not a string field.

### Audit gap this screen would otherwise silently continue

**Checked: none of the six included tables are covered by the existing `audit_log`
trigger** (`ADR-017` Phase 1 only covers `account`/`opportunity`/`opportunity_item`/
`product`/`split`/`stakeholder`/`user_profile` — confirmed by grepping every
`trg_audit_*` trigger in `Physical-Schema.sql`). Building a real edit screen for these
lists without also closing this gap means a mistaken rename or retirement would be
completely untraceable — worse than today's no-screen-at-all state, where at least a
direct data change leaves whoever made it accountable by virtue of being the one who
touched the database. **This build extends the same generic `audit_log_row_change()`
trigger function** (already proven, already generic — no new mechanism, just six more
`CREATE TRIGGER trg_audit_<table>` statements) to all six in-scope tables.

## Decisions — resolved 2026-09-11 (Basheer)

1. **Which role(s) get this screen? DECIDED: Admin/GM only**, matching the existing
   precedent for system-configuration screens (Territory Map, User Directory, Audit
   Log). No split by list — one flat gate for all six.
2. **Deactivation — DECIDED: not built at all, not even scoped for later.** Reverses
   the original proposal (which was "allow deactivating even while in use, no guard
   needed"). **This screen only supports Add and Rename** — no deactivate/reactivate
   action anywhere in it. Matches the original ask precisely ("add/update to this
   list"), which never mentioned retiring an option. **Worth being explicit about the
   consequence, not just silently building it:** once someone adds an option through
   this screen, there's no way to retire it *through this screen* — every `is_active`
   column stays exactly as it is today (still real, still present, just not exposed
   here). If Cabio later wants to retire something, that's still possible the same way
   it's possible today — a direct data change — just not self-service through this UI.
   Flagging this now so it's a known, deliberate limitation, not a surprise later.
3. **Does `coverage_frequency` need `display_order`? DECIDED: yes.** Order matters for
   a frequency list (Weekly through As-needed reads
   naturally top-to-bottom) in a way it doesn't for e.g. Loss Reasons. A per-table
   optional field, not a shape every list must have.

## Backend

### Migration, `backend/alembic/versions/00XX_reference_data_screen.py`

```sql
CREATE TABLE coverage_frequency (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL UNIQUE,
    name varchar(100) NOT NULL,
    display_order integer,
    is_active boolean DEFAULT true
);
-- Seed: Weekly / Bi-weekly / Monthly / Quarterly / As-needed, display_order 1-5.

ALTER TABLE coverage_plan_entry ADD COLUMN coverage_frequency_id uuid
    REFERENCES coverage_frequency(id);
-- Replaces the plain-string field originally proposed in Coverage Planning's own plan.

CREATE TRIGGER trg_audit_hold_reason AFTER DELETE OR UPDATE ON hold_reason
    FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();
CREATE TRIGGER trg_audit_loss_reason AFTER DELETE OR UPDATE ON loss_reason
    FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();
CREATE TRIGGER trg_audit_gate_override_reason AFTER DELETE OR UPDATE ON gate_override_reason
    FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();
CREATE TRIGGER trg_audit_lead_source AFTER DELETE OR UPDATE ON lead_source
    FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();
CREATE TRIGGER trg_audit_project_status AFTER DELETE OR UPDATE ON project_status
    FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();
CREATE TRIGGER trg_audit_coverage_frequency AFTER DELETE OR UPDATE ON coverage_frequency
    FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();
-- Reuses the existing ADR-017 trigger function unchanged -- no new audit mechanism.
```

`coverage_frequency` doesn't need its own RLS policy for read (same as the other five
— reference data is globally readable, same precedent as `product`/`lead_source`
today). Write access is gated at the API layer by role (decision #1), same pattern
Territory Map already uses for `zone` rather than RLS INSERT/UPDATE policies.

### Domain: `backend/app/domains/reference/` (extends the existing domain)

- **Config-driven, not six near-duplicate implementations.** The six tables share
  almost the same shape (code/label/active, `lead_source` and `coverage_frequency`
  each with one extra field) — a small registry (`REFERENCE_LIST_REGISTRY: dict[str,
  ReferenceListConfig]`, one entry per list, naming its model/code-field/label-field/
  extra-fields) drives one generic set of endpoints, rather than repeating CRUD five
  or six times. Matches this codebase's existing bias toward reuse
  (`TEAM_SCOPE_BUILDERS`, `ReferenceRepository` itself).
- `router.py` — add under `/reference-data/`: `GET /reference-data/lists` (returns the
  registry's keys + display names, for the screen's picker — an explicit allow-list,
  never a raw table name from the client), `GET /reference-data/lists/{list_key}/items`,
  `POST /reference-data/lists/{list_key}/items`,
  `PATCH /reference-data/lists/{list_key}/items/{id}`. **That's the whole surface —
  no deactivate/reactivate endpoints** (decision #2), and **never a hard `DELETE`**
  either way — matches the existing, explicit "never issue DELETE on reference
  tables" rule (`Backend-Implementation-Standards.md` §4). Add and Rename only.
- `service.py` — `ReferenceDataService`: role check (decision #1) on every write;
  duplicate-`code` check before insert, friendly `BusinessRuleViolation` instead of a
  raw DB uniqueness error (matching this codebase's existing pre-insert-check
  convention).
- Tests: registry-driven parametrized tests (one test body, run against all six
  `list_key`s) for create/update and the duplicate-code rejection, plus the
  role-boundary negative case (non-Admin/GM attempts a write).

## Frontend

- `sales-os-app/src/screens/ReferenceDataScreen.tsx` (new) — a list picker (the six
  names from `GET /reference-data/lists`) alongside a simple editable table for
  whichever list is selected: code, label, an "Add" row, inline edit via the existing
  `FormModal` pattern. **No active/inactive toggle in this screen** (decision #2) —
  just code and label. One screen, not six.
- `DemoApp.tsx` nav: add under **ADMINISTRATION** (Admin/GM-gated per decision #1,
  same `ADMIN_ROLES` check already used for User Directory/Territory Map/Audit Log) —
  `{ id: "referenceData", label: "Reference Data", icon: "🗂️", adminOnly: true }`.
- `services/referenceData.ts`, `types/referenceData.ts` — typed, generic over
  `list_key` rather than one service file per list.

## Out of scope for this pass

- `opportunity_stage` / `opportunity_status` / `zone` / `sbu` / `product` / `role` —
  deliberately excluded (see Scope decision above), not a follow-on batch by default;
  revisit only if a specific one is raised again with its own dedicated design.
- Per-list custom validation beyond uniqueness (e.g. `lead_source`'s
  `is_marketing_source` flag interacting with the IndiaMART SLA elsewhere) — the
  screen edits raw field values; any cross-field business meaning stays whatever it
  already is today, this doesn't add new rules.

## Verification

- Backend: `pytest` (registry-parametrized tests above), `ruff check
  app/domains/reference/`.
- Frontend: `tsc --noEmit`, `npm run lint`.
- Manual on Dev: Admin/GM adds and renames an item in each of the six lists; confirms
  a rename immediately reflects everywhere that item is referenced (e.g. a renamed
  Loss Reason shows its new label on old Opportunities that used it); confirms each
  change shows up in the Audit Log screen with the correct actor/timestamp; a
  non-Admin/GM role attempts a write and gets a clean `AuthorizationError`, not a
  silent failure.

## Reference

- `docs/Coverage-Planning-Implementation-Plan.md` — decision #3, superseded by this
  plan's `coverage_frequency` table design (needs a matching correction there).
- `docs/Backend-Implementation-Standards.md` §4 (never-DELETE reference data), §6
  (`ReferenceRepository`, the existing pattern this screen manages through the UI for
  the first time).
- `docs/Audit-Trail-Implementation-Plan.md`, `docs/Audit-Trail-Extension-Implementation-Plan.md`
  — the existing generic audit trigger this plan extends to six more tables.
- `docs/ADR.md` — `ADR-017` (Audit Trail), `ADR-028` (Stage/Status decoupling — why
  those two tables are excluded here).
