# Audit Trail for Key Master Tables — Implementation Plan

**Status:** Planned, not built. Queued for the build session currently on
BR-ACC-03 (duplicate hospital matching).
**Input:** `docs/Audit-Trail-Implementation-Brief-2026-08-31.md` — this plan
resolves that brief's open questions and produces the concrete migration
shape. Mechanism (Postgres triggers + centralized `audit_log`) is settled
by ADR-017 and not revisited here.

## Highest-risk detail — read this first

`audit_log` needs RLS enabled with an Admin/GM-only **read** policy (open
question 2, resolved below). But the audit trigger's own `INSERT` into
`audit_log` runs *as the app's connecting role* (`cabio_app`) unless the
trigger function is declared `SECURITY DEFINER` — and `cabio_app` is not
the table owner, so it's fully subject to that same restrictive RLS policy.
**Without `SECURITY DEFINER` on the trigger function, the very first write
to `account`, `user_profile`, `product`, or `opportunity` after this ships
would fail RLS on its own audit insert and roll back the whole
transaction** — i.e. this migration would break account/user/product/
opportunity writes app-wide, not just fail to log them. This is the one
detail in this plan that must not be gotten wrong; everything else is
routine.

The fix is one line (`SECURITY DEFINER` + `SET search_path = public` on
the function), matching the pattern already established in this codebase
for `cabio_app_opportunity_in_account`/`cabio_app_account_opportunities`
(`0029_relationship_support_activity_rls.py`) — functions that need to act
with more privilege than the calling session has. It works because the
function's owner (whichever role runs the migration — same as owns
`audit_log` itself) bypasses RLS on tables it owns by default, and
`SECURITY DEFINER` makes the function execute as that owner rather than as
`cabio_app`.

## Resolved open questions (from the brief)

1. **CREATE (INSERT) — not logged, by design decision 2026-08-31
   (Basheer).** Original draft logged every INSERT with a full-row
   snapshot; dropped after review because it added no information the
   system doesn't already have another way to get to. The master row's
   own `created_by`/`created_at` (`AuditMixin`) already answers "who/when"
   for as long as the record exists untouched, and every field's current
   value **is** its original value until something actually changes it —
   at which point the changing UPDATE's own `old_data` captures exactly
   what that field was immediately before, which for a field's *first*
   edit is its original, as-created value. So a field's original state is
   always recoverable one of two ways — still live on the row if
   untouched, or preserved in the oldest UPDATE entry that ever touched
   it — with no dedicated creation snapshot required. The one edge case
   (a record deleted without ever being edited) is still covered, because
   the DELETE snapshot (point 2 below) captures the full row regardless of
   whether it was ever edited. Net effect: the trigger only needs to react
   to `UPDATE` and `DELETE`, not `INSERT` — simpler function, and no
   redundant full-row copy written for every record the day it's created.

2. **DELETE actions — capture on all four tables.** None of the four
   tables currently has an app-level DELETE endpoint (confirmed by grep —
   only `opportunity_item`, `opportunity_stakeholder`, and `document` have
   `@router.delete`), so today the app itself never deletes an
   `account`/`user_profile`/`product`/`opportunity` row. Doesn't matter:
   ADR-017's whole rationale is auditability "independent of application
   logic," and real hard deletes on these tables do happen outside the
   app — the 2026-08-29/30 duplicate-hospital directory cleanup (77 → 66
   `account` rows) was exactly this, done via direct DB access, and would
   have produced zero trail under a trigger that only watched for app-
   driven changes. A database trigger, unlike application code, is
   attached to the table itself and fires no matter what issued the
   `DELETE` — the app, a script, or a command run directly against the
   database — which is exactly why this can't be an app-level "log before
   delete" check instead. Trigger fires `AFTER UPDATE OR DELETE`, one
   definition per table, same shape as the existing `trg_updated_at`
   pattern already applied to all four tables (minus the `INSERT` case,
   per point 1).

3. **Read access to `audit_log` — RLS, Admin/General Manager only.**
   One `FOR SELECT` policy:
   ```sql
   CREATE POLICY audit_log_admin_gm_read ON audit_log
   FOR SELECT USING (cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager']));
   ```
   Exact role-name strings and `= ANY (ARRAY[...])` form match the
   existing `product_delete_sbu_scoped`/`opportunity_tier_visibility`
   policies (`Physical-Schema.sql`) — not inventing new phrasing. No
   INSERT/UPDATE/DELETE policy is added for `cabio_app` — leaving those
   with zero matching policy means Postgres default-denies them, which is
   correct: nobody should be able to write or tamper with `audit_log`
   through the app. Only the `SECURITY DEFINER` trigger writes to it.

4. **Retention/volume — explicitly deferred, not designed now.** Per
   ADR-017's own phase framing (dashboards/reporting out of scope for
   Phase 1) and the brief's own framing. Two indexes are added now
   specifically so a retention policy or reporting query can be built
   later without a further schema change:
   - `(table_name, record_id, changed_at DESC)` — the natural "history for
     this record" lookup shape.
   - `(changed_at)` — for a future age-based pruning sweep.
   Opportunity is flagged as likely-highest-volume in the brief; revisit
   once real volume is observed post-ship, not before. (Dropping the
   INSERT snapshot per point 1, plus the changed-fields-only UPDATE design
   in point 5 below, both cut the volume concern substantially versus the
   original full-row-on-everything draft — smaller than originally scoped,
   not a reason to skip planning for it eventually.)

5. **Field scope on UPDATE — changed fields only, computed automatically
   (no per-table column list).** Original draft logged the entire row on
   every UPDATE — simple, but wasteful (an edit to one field on
   `opportunity`'s 29 columns stored all 29, twice) and hard to review (a
   reader has to diff two full JSON blobs to find what actually changed).
   Fixed by having the trigger function compare `OLD`/`NEW` as generic
   key-value pairs (`jsonb_each`) and keep only the keys whose values
   differ — this is *not* a hand-maintained per-table field list (which
   would need updating every time a column is added, the exact drift risk
   that ruled out an allowlist in the first place); it's a generic
   comparison that works unchanged regardless of how many columns a table
   has. `updated_at` is explicitly excluded from that comparison — it
   changes on every single UPDATE by definition, so including it would
   make every entry "changed" in a meaningless way. If nothing survives
   that filter (a save that only touched `updated_at`), no audit row is
   written at all — a true no-op isn't worth an entry. `old_data`/
   `new_data` keep the same meaning on DELETE — the full record, since
   there's no "before"/"after" to diff against a row that's disappearing.

6. **Backfill — none.** Trail starts from the migration's apply date
   forward only, per the brief. No retroactive reconstruction attempted.

7. **Change reason — not captured, explicitly deferred (raised
   2026-09-02, Basheer).** The current design records *who* changed a
   record, *when*, and the before/after values — not *why*. Where a
   reason is already a structured field on the table itself (e.g. a
   future `lost_reason` on `opportunity`), it's captured for free, since
   it's just another column in the UPDATE diff. For edits with no
   dedicated reason field, the trail has no rationale. Not built now
   because it's real new scope, not a schema tweak — it requires the
   application to collect a reason at edit time (e.g. a "why are you
   changing this?" prompt) and thread it through, and forcing that on
   every save across all four tables would be noise for routine edits
   (fixing a typo, say) rather than signal. If a specific workflow later
   needs it (e.g. Opportunity Lost, Account deactivation), the clean
   addition is a nullable `reason text` column on `audit_log`, populated
   via a `SET LOCAL app.change_reason` session variable — the same
   pattern `changed_by` already uses via `app.current_user_id`
   (`set_rls_context()`, `db/session.py`). Revisit only when a concrete
   workflow needs it, not preemptively.

## Schema

```sql
CREATE TABLE audit_log (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name  text NOT NULL,
    record_id   uuid NOT NULL,
    action      text NOT NULL CHECK (action IN ('UPDATE', 'DELETE')),
    changed_by  uuid REFERENCES user_profile(id),
    changed_at  timestamptz NOT NULL DEFAULT now(),
    old_data    jsonb,
    new_data    jsonb
);

CREATE INDEX idx_audit_log_table_record ON audit_log (table_name, record_id, changed_at DESC);
CREATE INDEX idx_audit_log_changed_at ON audit_log (changed_at);
```

`changed_by` stays nullable (per the brief) — any write made outside a
request context (a migration, a direct DB fix) has no
`app.current_user_id` session var set, so `cabio_app_uid()` resolves to
`NULL`. FK to `user_profile.id` for referential integrity, matching
`AuditMixin`'s own `created_by`/`updated_by` convention
(`backend/app/db/base.py`) — safe because `user_profile` rows are never
hard-deleted (soft-deleted via `is_active`, confirmed by the
deactivate/reactivate feature).

**`changed_by` will read `NULL` on any direct-SQL write bypassing the app
— decided 2026-08-31 to accept this, not fix it.** In practice this only
means DELETE today, since none of the four tables has an app-level DELETE
endpoint (an UPDATE run directly via SQL would have the same gap, but
there's no reason for one to happen — the app already covers editing).
A fallback (capturing the raw database login instead, when the app-level
identity is absent) was considered and explicitly not built: direct
database access is already restricted to Admin/DBA-level people, already
rare, and a database login only identifies "came from privileged direct
access," not which specific person — not enough benefit to justify adding
it now. Revisit only if this gap actually causes a real problem in
practice, not preemptively.

## Trigger function and triggers

```sql
CREATE FUNCTION audit_log_row_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
AS $$
DECLARE
    diff_old jsonb;
    diff_new jsonb;
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, cabio_app_uid(), to_jsonb(OLD), NULL);
        RETURN OLD;

    ELSE -- UPDATE: only fields that actually changed, computed generically (no per-table field list)
        SELECT jsonb_object_agg(o.key, o.value), jsonb_object_agg(o.key, n.value)
        INTO diff_old, diff_new
        FROM jsonb_each(to_jsonb(OLD)) o
        JOIN jsonb_each(to_jsonb(NEW)) n USING (key)
        WHERE o.value IS DISTINCT FROM n.value
          AND o.key <> 'updated_at';

        IF diff_old IS NOT NULL THEN
            INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
            VALUES (TG_TABLE_NAME, NEW.id, TG_OP, cabio_app_uid(), diff_old, diff_new);
        END IF;
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER trg_audit_account   AFTER UPDATE OR DELETE ON account       FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();
CREATE TRIGGER trg_audit_user      AFTER UPDATE OR DELETE ON user_profile  FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();
CREATE TRIGGER trg_audit_product   AFTER UPDATE OR DELETE ON product       FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();
CREATE TRIGGER trg_audit_opportunity AFTER UPDATE OR DELETE ON opportunity FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();
```

One generic function shared across all four tables (per the brief's own
preference) rather than four bespoke ones — `TG_TABLE_NAME`/`TG_OP` make it
table-agnostic, and the `jsonb_each` comparison makes the UPDATE path
column-agnostic too (no hand-maintained list of which fields to compare —
works unchanged if a column is added to any of the four tables later). No
`INSERT` case, per resolved question 1 above. `AFTER`, not `BEFORE`: an
audit trigger should observe the row as finally committed within the
transaction, not race the existing `trg_updated_at BEFORE UPDATE` trigger
each of these four tables already has — `AFTER` sidesteps any dependency
on same-phase trigger firing order (Postgres fires same-phase triggers
alphabetically by name, which is not something to rely on here).

**Practical effect:** an edit to one field on a 29-column `opportunity`
row produces an entry like `old_data: {"stage_id": "..."}, new_data:
{"stage_id": "..."}` — just the changed key(s) — not all 29 columns
duplicated. Creating a record produces no audit entry at all (the master
row's own `created_by`/`created_at` already cover it). A delete still
captures the full row, since it's the last remaining copy of that record's
final state once it's gone. A save that touches only `updated_at` (no real
business-field change) also produces no audit row.

`changed_by` resolves correctly with zero new plumbing: `set_rls_context()`
(`db/session.py`) already sets `app.current_user_id` via `SET LOCAL` at the
start of every request, before any repository/service code runs, and stays
set for the rest of that transaction — the same mechanism every RLS policy
already depends on. The trigger fires within that same transaction, so
`cabio_app_uid()` sees the same value.

## RLS on `audit_log`

```sql
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_admin_gm_read ON audit_log
FOR SELECT USING (cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager']));
```

This is not optional/deferrable to a later cleanup — UAT's
`rls_auto_enable()` event trigger (standing risk item, `docs/Backlog.md`)
auto-enables RLS on any newly created table with **zero** policies the
moment it exists, which already caused two lockout incidents this project
has hit before (`user_zone`/`zone_closure`, 2026-08-21). Enabling RLS with
an explicit, correct policy in the *same* migration that creates the table
is what avoids a third occurrence, not an afterthought.

## Migration file

One migration, next available revision number at implementation time
(0029 is current head as of this plan; confirm nothing new has landed by
the concurrent BR-ACC-03 session before numbering). Structure per this
project's existing `op.execute(...)` raw-SQL convention for
functions/triggers/policies (see `0024_add_notification_table.py`,
`0029_relationship_support_activity_rls.py`) — `op.create_table` +
`op.create_index` for the table/indexes (SQLAlchemy-native, autogenerate-
friendly), `op.execute` for the function/triggers/RLS (no SQLAlchemy
equivalent exists for these).

`downgrade()` must reverse in dependency order: drop the 4 triggers, drop
the function, drop the RLS policy, disable RLS, drop the indexes, drop the
table — mirroring `0024`'s downgrade ordering.

**No SQLAlchemy model needed** — per ADR-017 and the brief's own
non-goals, `audit_log` is not modeled as an ORM entity, gets no
`schemas.py`, no `repository.py`, no `service.py`, no router. It is
reachable only via direct SQL (for now) or a future reporting endpoint,
neither of which this phase builds.

**Per this project's standing rule, Basheer applies the migration
himself** (DB-mutating changes are outside Claude Code's tool access
here) — the implementing session produces the migration file and updates
`Physical-Schema.sql` afterward per the standard workflow (`Backend-
Implementation-Standards.md`'s `PDM Change → Model Update → alembic
revision → Review → Apply → Regenerate Physical-Schema.sql`), but does not
run `alembic upgrade` against a live environment.

## Verification plan

No app-level code changes means no `pytest`/`tsc`/`lint` surface to run —
verification is direct-SQL, on Dev only, after Basheer applies the
migration:

1. Update an `account` row (or any of the 4) via the normal app flow,
   changing exactly one field; confirm exactly one `audit_log` row
   appears with `action = 'UPDATE'`, correct `changed_by` (the acting
   user, not `NULL`), and `old_data`/`new_data` each containing *only*
   that one changed field — not the whole row. Then save the same record
   with no real change (so only `updated_at` would differ) and confirm
   **no** audit row is written for that save.
2. Create a new row on each of the 4 tables via the app; confirm **zero**
   `audit_log` rows are written for the creation itself (by design — see
   resolved question 1), and that the new row's own `created_by`/
   `created_at` are set correctly.
3. Delete a row directly via SQL (simulating the kind of direct-DB cleanup
   ADR-017 exists to catch) on a table with no app-level DELETE path;
   confirm `action = 'DELETE'`, `new_data IS NULL`, `old_data` has the full
   final row state.
4. **The critical regression check:** confirm a normal app-driven write to
   each of the 4 tables still succeeds end-to-end post-migration — this is
   the check that would catch a missing `SECURITY DEFINER` immediately
   (every write would start failing, not just fail to log).
5. Log in as a non-Admin/GM role, attempt `SELECT * FROM audit_log`
   directly — confirm zero rows returned (RLS enforcing), then confirm an
   Admin or GM account sees rows.

## Sequencing / scope note

Purely additive at the DB layer — one new table, one new function, 4 new
triggers, zero touches to any existing table's columns, zero application
code changes to `account`/`user_profile`/`product`/`opportunity`'s
routers/services/repositories. No file overlap with the concurrent
BR-ACC-03 session (`account/schemas.py`, `account/repository.py`,
`account/service.py`, `duplicate_matching.py`, frontend files) or with the
queued Auth Session Resilience plan (`docs/Auth-Session-Resilience-
Implementation-Plan.md` — `AuthContext.tsx`, `main.tsx`) — safe to build
independently of both once picked up.
