# Audit Trail Redesign — Implementation Plan

**Status:** Built and Dev-tested 2026-10-03 — commits `24f5607`, `ce56c22`, `b0ba088`, `8842d67`, `c91e51e`, `9a6d98d`, `fb5b7e6`, plus review fix `51deecc`; manual E2E 31/31 passed. Approved 2026-09-30 (Basheer). Not on UAT yet: moves with everything else pending in main in one UAT move (migration 0059 + steps 2–4), its own approval.
**Traceability rows:** beyond-signed item 13 (Audit Log screen) — wording
update only; supports BR-AUD-01.
**Design / discussion:** this plan. Trigger for it: a product switch on 3
deals in UAT on 2026-09-29 (old wall-mount stand → Equipwell Wall Mount
Stand) left only the three removals in the Audit Log; the three new lines
left no trace. Four product renames the same day were direct Supabase
edits by Basheer — correctly logged with no user, but each product's own
"last changed by" still named the last app user. Earlier design: `docs/Audit-Trail-Implementation-Plan.md`,
`docs/Audit-Trail-Extension-Implementation-Plan.md`.

## Decisions

- Lighter build (A): complete the log and fix it; no per-record History
  tab — Basheer, 2026-09-30
- Creating a new main record (deal, customer, product, …) is not logged;
  every later edit and removal is — Basheer, 2026-09-30
- Lines inside a record (deal product lines, splits, deal contacts,
  target-plan hospitals and brand splits, user zones): adding one to a
  record that already exists **is** logged, as a change to that record;
  lines saved together with a brand-new record are not — Basheer,
  2026-09-30
- Save paths that wipe and rewrite a record's lines are rewritten to save
  only what changed, so the log isn't flooded with fake remove/re-add
  pairs — Basheer, 2026-09-30
- Audit Log stays Admin/GM only — Basheer, 2026-09-30
- No automatic clean-up of old entries; the alternate-day UAT data-quality
  check reports the log's size and entry count instead — Basheer,
  2026-09-30
- A change made outside the app (direct database edit, script) clears the
  record's own "last changed by" instead of leaving the previous app
  user's name on it; the record then reads "by: unknown (direct edit)",
  matching the Audit Log. Folded into step 1's database change, no
  separate step — Basheer, 2026-09-30
- Documents are attached things, like lines: uploading one onto a
  deal, customer, project or product that already exists is logged as
  "added"; edits and deletions are logged. Replacing a brochure (delete
  old, upload new) shows as two entries side by side — separate actions,
  not one grouped entry. The log keeps the old file's name, type, size
  and uploader, not the file itself (deleting removes the stored file)
  — Basheer, 2026-09-30
- "Last changed by" and "last changed at" are ignored when deciding
  whether anything changed (today they create entries that say nothing)
  — Basheer, 2026-09-30
- When a record is deleted and its lines disappear with it, only the
  record's own removal is logged, not one entry per line — Basheer, 2026-09-30
- Tracked list, after a schema review (see section 5 table): add
  `marketing_lead`, `target_plan`, `project`, `installed_asset`, `zone`,
  `brand`, `model`, `category`, plus the line tables
  `opportunity_stakeholder`, `target_plan_account`,
  `target_plan_brand_split`, `user_zone`, `document` — Basheer, 2026-09-30
- Brand, model and category are tracked now even though the app has no
  edit screen for them yet: catalogue clean-ups happen by script and
  should leave a trace — Basheer, 2026-09-30
- Not tracked: notifications, reminders (personal to-dos; completion is
  already recorded by the closing activity), activities and comments (no
  edit or delete exists), the zone ancestry table (rebuilt automatically),
  system tables — Basheer, 2026-09-30
- Reference lists (loss/hold/gate-override reasons, lead sources, project
  statuses, deal stages/statuses), SBU, role, vendor targets: no edit
  path exists in the app today; their tracking ships with the Reference
  Data Management Screen, which already plans it — Basheer, 2026-09-30
- Audit Log screen shows the line changes made to one record in one save
  as one grouped entry (separate saves stay separate entries), and gains
  an "Added" tag (green) and a "What happened" filter (All / Changed / Removed / Added); existing tags reworded UPDATE→CHANGED, DELETE→REMOVED — Basheer, 2026-09-30
- Past history is not reconstructed; the new rules apply from the day
  each environment gets the change — Basheer, 2026-09-30
- Build starts after hospital-wise planning Part 1 step 5 is committed
  (both touch the target-plan save code) — Basheer, 2026-09-30

## 1. In plain terms

Today the Audit Log is like a CCTV camera that records things being
changed or taken away, but not things being put in — so replacing one
product on a deal with another showed only the old product vanishing.
After a direct database edit, the record itself can wrongly name the
last app user as the person who changed it. And the log doesn't watch
large parts of the system at all (target plans, marketing leads,
projects, documents, the catalogue's brands and models).

After this change:
- **Creating** something new (a deal, a customer, a product) still isn't
  logged — the record itself already says who created it and when.
- **Every change afterwards is logged**, including adding or removing a
  line or document inside a record that already exists. Swapping a
  product on a deal shows as "old stand removed, Equipwell stand added"
  on that deal, with your name — one grouped entry if done in one save.
- Many more kinds of record are watched (list in the Decisions above).
- The log stays small: only fields that actually changed are stored,
  housekeeping noise is ignored, a deleted record's lines don't each get
  their own entry, and screens that used to rewrite every line on every
  save now save only what changed. The UAT check will report the log's
  size every other day so growth is visible long before it matters.

Where it lands: built and tested on **Dev**; reaches **UAT** only in a
separate, approved move. Until then UAT keeps today's partial coverage.
Nothing that happened before the move can be recovered into the log.

Rough size of the work: 3–4 days.

## 2. Build order

1. **Database change (one migration).** New version of the audit trigger:
   logs line additions to existing records; ignores "last changed
   by/at"; skips line removals caused by their parent's deletion; works
   for the two line tables that have no id of their own. Allows "INSERT"
   as an action. Adds triggers to the newly tracked tables. Direct
   (non-app) edits clear the record's "last changed by". Apply to Dev,
   record `alembic current`, regenerate `Physical-Schema.sql`, tests.
   **Checkpoint commit.**
2. **Save only what changed.** Rewrite the three wipe-and-rewrite save
   paths (user zones, target-plan hospitals, target-plan brand splits)
   to update, add and remove individually, like Opportunity product
   lines already do. Tests per path. **Checkpoint commit.** (Opportunity
   contacts had a fourth, but it had no caller and was removed, not
   rewritten: `9a6d98d`.)
3. **Audit Log screen.** Names for the newly tracked records; "Added"
   label and filter; one grouped entry per record per save. Tests.
4. **Size watch.** Add log size and entry count to
   `scripts/uat_data_quality_check.py`.
5. Records (section 4), pytest/ruff/tsc/lint, `/code-review` high
   (migration + trigger), written E2E plan checked against live Dev data,
   E2E, commit, post-commit checklist. UAT move is its own approval.
   Before it, ask Basheer for a fresh UAT backup: migration 0059's
   downgrade deletes INSERT history, so a rollback would lose it.
   Never regenerate `api.ts` for this work (another session edits it by
   hand); hand-edit only the Audit Log types (`AuditSaveResponse`,
   `owner_*`, `action` filter).

## 3. Not in this plan (with reasons)

- **History tab on each deal/customer/product page (option B)** — deferred
  by choice; builds on this without rework. Goes to Backlog.
- **Changing a deal line's product in place on the deal screen** — the
  backend already supports it; whether the screen should offer it is a
  separate UI question. With this plan a remove-and-add is fully visible
  anyway.
- **Reference lists, SBU, role, vendor targets** — no edit path in the
  app today; tracked when the Reference Data Management Screen adds one.
- **Automatic clean-up / archiving** — not needed at current volumes
  (about 250 entries in UAT's first 3 weeks); the size watch tells us if
  that changes.
- **Rebuilding past history** — the information was never recorded.
- **Keeping old versions of replaced documents** — the log records that
  a file existed and who removed it, but the file itself is deleted.
  Document versioning would be its own feature; not requested.

## 4. Business rules and records to update

- `docs/Business-Rules.md` BR-AUD-01 — rewrite the Implementation line:
  the creation rule, line-addition rule, ignored columns, cascade rule,
  and the tracked/not-tracked list.
- `docs/ADR.md` ADR-017 — dated note recording the line-addition rule.
- `docs/Audit-Trail-Implementation-Plan.md` resolved question 1 — pointer
  that line additions are now logged (this plan).
- `docs/Signed-Requirements-to-PRD-Traceability.md` beyond-signed item 13
  — wording (coverage list; remove the "documents aren't covered" fix
  note). Client-visible: regenerate the scorecard and republish, diff
  shown first.
- `docs/Backlog.md` — close the `marketing_lead`, `target_plan` and
  `document` coverage entries; note on the Reference Data Management
  Screen entry that brand/model/category triggers already exist; add
  "Per-record History tab (audit option B)".
- `docs/Physical-Schema.sql` — regenerated in step 1.
- New `docs/Audit-Trail-Redesign-Manual-E2E-Test-Plan.md`.

## 5. Technical addendum

**Schema review (38 tables).** Write paths from the routers
(`@router.put/patch/delete` and action `post`s) decided each row.

| Table | Today | Proposed | Why |
|---|---|---|---|
| account, opportunity, product, stakeholder, user_profile | U/D | U/D | main records |
| opportunity_item, split | U/D | U/D + child I | lines of opportunity |
| opportunity_stakeholder | — | U/D + child I | lines of opportunity; no `id` column |
| user_zone | — | U/D + child I | lines of user_profile; no `id` column |
| target_plan | — | U/D | PATCH, approve/reject, DELETE |
| target_plan_account, target_plan_brand_split | — | U/D + child I | lines of target_plan |
| marketing_lead | — | U/D | discard / convert / reassign |
| project, installed_asset | — | U/D | PUT endpoints |
| document | — | U/D + child I | attached to one of account/project/opportunity/product; only DELETE exists today, U covers any future rename/replace |
| zone | — | U/D | PATCH, deactivate/reactivate |
| brand, model, category | — | U/D | no edit endpoint; script edits |
| reminder | — | — | personal to-do; PATCH only |
| activity, activity_comment, marketing_lead_comment | — | — | create-only |
| notification | — | — | mark-read only |
| zone_closure | — | — | derived; `rebuild-closure` rewrites it |
| reference lists, sbu, role, opportunity_stage/status, brand_vendor_target | — | — | no write path; Reference Data screen |
| audit_log, alembic_version | — | — | system |

**Trigger function v2** (`audit_log_row_change`), attached with trigger
arguments for line tables: `(parent_table, parent_fk[, key_col])`.
`document` has several candidate parents (`account_id`, `project_id`,
`opportunity_id`, `product_id`) — the trigger takes the one that is set.
`delete_document` (`document/service.py:111`) removes the Storage object
before the row, so `old_data` keeps the file's metadata, not its bytes.
- UPDATE: diff as today, excluding `updated_at` **and `updated_by`**.
- DELETE of a line: skip if the parent row no longer exists (cascaded
  from the parent's own delete).
- INSERT (line tables only): skip if the parent was created in the same
  transaction — `parent.created_at = now()` (`now()` is transaction start).
  **Verify first** that `created_at` is filled by the DB default, not by
  Python, on opportunity/target_plan/user_profile; if Python-side, use a
  transaction-local flag set by the create services instead. Not `xmin`:
  a parent updated in the same save (e.g. `indicative_value`) would be
  misread as new.
- `record_id` for `opportunity_stakeholder` / `user_zone` (no `id`): the
  parent id, with the other key (`stakeholder_id` / `zone_id`) kept in the
  data.
- `ck_audit_log_action` gains `'INSERT'`.

**Stale `updated_by` after direct edits.** The four UAT `product` UPDATEs
on 2026-09-29 with `changed_by = NULL` were Supabase dashboard edits
(Basheer) — correct. `update_updated_at()` (BEFORE UPDATE) refreshed
`updated_at`, but `updated_by` is only set by app services, so it kept
the last app editor's id. Fix in the step 1 migration: in
`update_updated_at()`, `IF cabio_app_uid() IS NULL THEN NEW.updated_by :=
NULL; END IF;` — applies to every table carrying that trigger (list
confirmed in step 1). Check first that no app write path runs without
RLS context, or genuine app saves would lose their editor. The Audit Log
screen's "Direct database access (no logged-in user)" label is already
right for these.

**Save paths partitioned** (pattern: `replace_items`,
`opportunity/repository.py:397`): `replace_zones`
(`organization/repository.py`), `replace_brand_splits` and
`replace_accounts` (`planning/repository.py`), built in `c91e51e`.
`replace_splits` was already keyed on `(opportunity_id, user_id)`.
The unused `replace_stakeholders` was deleted (`9a6d98d`).

**Screen grouping.** Rows from one save share `changed_at` (DB default
`now()` = transaction start); group by `(changed_at, parent)` using the
existing `_PARENT_CONTEXT_MAP` in `backend/app/domains/audit/repository.py`.
Extend `_RECORD_LABEL_RESOLVER_MAP` and the frontend `TABLE_OPTIONS` for
the new tables.

**Size watch.** `pg_total_relation_size('audit_log')` and row count by
action, in `scripts/uat_data_quality_check.py` (read-only, existing RLS
context).

**Tests.** Per new trigger: edit logged with user; child add on existing
parent logged; child rows on a new parent not logged; cascaded child
deletes not logged; `updated_by`-only change not logged. Per partitioned
save path: unchanged resubmit writes nothing.
