# UAT Migration — 2026-09-08

**Status: complete.** `main` promoted to `uat`, 16 migrations applied, one
live bug found and fixed, smoke-tested, team notified. Team was told to stay
off UAT beforehand (WhatsApp) and cleared to resume afterward.

---

## Scope

36 commits, 16 Alembic migrations (`0024` → `0039`), 9 user-facing features —
the last promotion was 2026-08-21 (`7a3c8d7`/`81fded7`), so three weeks of
work moved in one batch:

1. Marketing Lead Handling (conference/IndiaMART review queue, assignment
   notifications, manager Convert/Discard/Reassign rights)
2. Private Manager Notes (senior-tier Activity notes hidden from managers
   below them; Admin/GM always see everything)
3. Change History / Audit Trail (account, user_profile, product,
   opportunity — who changed what, when)
4. Manager-Approved Fast-Tracking (named approver + reason, replacing the
   old unattested checkbox)
5. New Activity Types for Team Development (training, conference,
   certification, seminar — no hospital/deal required)
6. Relationship-Support ("helped on a deal") Notes
7. Reminders on Login + Next Actions date-range filter
8. Deal Assignment Alerts
9. Duplicate Hospital Warning (near-name-match on Account create)

No backend dependency changes (`requirements.txt` untouched). Frontend
gained one devDependency (`typescript-eslint`) — no runtime effect.

## Pre-flight checks

- `git diff uat..main` confirmed a clean fast-forward (36 ahead, 0 behind).
- Diffed `backend/alembic/versions/` between `uat` and `main` to confirm the
  exact migration set (`0024`–`0039`) and read each one for new tables.
- Found in advance, not live: migration `0027` (`gate_override_reason`)
  creates a new table with no RLS policy of its own — same shape as
  `hold_reason`/`loss_reason`, which have no RLS at all on Dev. UAT carries
  a standing out-of-band Supabase trigger, `rls_auto_enable()`, that force-
  enables RLS with zero policies on *any* new table regardless of what the
  migration does (`docs/Backlog.md` has the full history — this was its
  3rd occurrence). Planned the fix ahead of time instead of waiting for a
  bug report.

## Execution log

1. **Backup.** Basheer ran `scripts\backup_uat.ps1` — fresh dated dump,
   rollback point at schema revision `0023`, before anything else touched
   UAT.
2. **Code promotion.** `git push origin main:uat` — fast-forward,
   `81fded7..dbfaea1 main -> uat`. Render auto-redeployed both
   `calicut-bio-medicals` (backend) and `cabio-sales-os-uat-frontend`
   (frontend); Basheer confirmed both Live.
3. **Migrations** — run by Basheer (DB-mutating commands are outside
   Claude Code's tool access on this project by design), from `backend/` in
   Git Bash, using `.venv/Scripts/python.exe` directly (`source
   .venv/Scripts/activate` mis-resolves PATH on this machine):
   ```bash
   set -a
   source backend/.env.uat
   set +a
   cd backend
   .venv/Scripts/python.exe -m alembic upgrade head
   ```
   **Hit and fixed:** first attempt failed before touching the database at
   all — `pydantic_settings.exceptions.SettingsError` on `CORS_ORIGINS`.
   Root cause: `CORS_ORIGINS` is typed as `list[str]`; pydantic-settings
   only accepts strict JSON for complex-typed fields when they come from a
   real OS environment variable (as opposed to the more lenient `.env`-file
   parser used for local dev), and `.env.uat`'s `CORS_ORIGINS` isn't JSON.
   Alembic never reads this setting, so the fix was simply
   `unset CORS_ORIGINS` before retrying — no file edited. Second attempt:
   `0023 -> 0039`, all 16 revisions, no errors. `alembic current` confirmed
   `0039 (head)`.
4. **`gate_override_reason` RLS fix** — confirmed the predicted gotcha via
   a read-only check, then fixed:
   ```bash
   .venv/Scripts/python.exe -c "
   import os, psycopg2
   conn = psycopg2.connect(os.environ['ADMIN_DATABASE_URL'])
   cur = conn.cursor()
   cur.execute(\"SELECT relrowsecurity FROM pg_class WHERE relname = 'gate_override_reason';\")
   print(cur.fetchone())
   "
   # -> (True,) — RLS enabled, zero policies, confirmed locked down

   .venv/Scripts/python.exe -c "
   import os, psycopg2
   conn = psycopg2.connect(os.environ['ADMIN_DATABASE_URL'])
   conn.autocommit = True
   cur = conn.cursor()
   cur.execute('ALTER TABLE gate_override_reason DISABLE ROW LEVEL SECURITY;')
   "
   ```
5. **Smoke test** — 3-login pass instead of 9 separate ones, per
   `Deployment-Topology.md`'s promotion ritual (rep/manager/admin exercising
   the batch, not a full regression pass):
   - **Rep** (`rudrappa@cabio-uat.com`, picked because a quick read-only
     query showed he had the most open reminders — see below): reminders
     popup, Next Actions date filter, duplicate hospital warning, new
     Activity types, Relationship-Support note.
   - **Manager** (`shruthi@cabio-uat.com`, Rudrappa's Area Manager):
     Marketing Lead queue Convert/Reassign, deal assignment notification,
     Gate Override reason picker (the table just fixed).
   - **GM** (`haroonsidheeq@cabio-uat.com`, briefly) + **Admin**: private
     manager note written by Haroon on a deal in Shruthi's territory,
     confirmed hidden from Shruthi, confirmed visible to Admin; Audit Log
     screen showed the session's edits.
   - Basheer confirmed the full pass clean, no issues found.
6. **Team notified** — WhatsApp announcement sent, app reopened for use.

## Reusable diagnostic

Finding which UAT user has overdue/due-today reminders (useful again for
any future Reminders-related smoke test), read-only against
`ADMIN_DATABASE_URL`:
```sql
SELECT au.email, up.display_name, COUNT(*) AS due_count
FROM reminder r
JOIN user_profile up ON up.id = r.assigned_to_user_id
JOIN auth.users au ON au.id = up.id
WHERE r.is_completed = false
  AND r.due_date::date <= (now() AT TIME ZONE 'Asia/Kolkata')::date
GROUP BY au.email, up.display_name
ORDER BY due_count DESC;
```

## Post-migration fix — missing `lead_source` row

Found later the same day, unrelated to the batch above: UAT was missing the
`INDIAMART` row entirely in `lead_source`, so it never appeared in the
Marketing Lead creation picker. Root cause: `lead_source` is reference data,
not schema — no Alembic migration creates or seeds its rows (only `0033`
*alters* an existing `INDIAMART` row's `is_marketing_source` flag, assuming
the row already exists). It was added to Dev by hand at some point outside
migration history, so promoting `main` → `uat` — which only replays
migrations — could never have carried it. **This is a standing gap, not a
one-off:** any future reference-table row added directly in Dev (not via a
migration's `op.execute(INSERT ...)`) will have the same silent gap in UAT.

Fixed via direct INSERT against UAT, matching Dev's row exactly (checked
live, read-only, against Dev first):
```sql
INSERT INTO lead_source (name, description, is_active, is_marketing_source)
SELECT 'INDIAMART', 'Indiamart opportunities', true, true
WHERE NOT EXISTS (SELECT 1 FROM lead_source WHERE name = 'INDIAMART');
```
`is_marketing_source = true` is required, not just `is_active` — that's the
flag `0033_add_lead_source_is_marketing_source.py` added to gate what shows
in the Marketing Lead creation form. Run by Basheer directly against
`ADMIN_DATABASE_URL`, per the project's UAT-safety rule. No fixed `id`
forced — nothing in UAT referenced the missing row yet, so no reason to
match Dev's UUID for it.

## Still open (tracked elsewhere, not resolved by this migration)

- **`rls_auto_enable()` permanent fix** — this was its 3rd occurrence
  (2026-08-03, 2026-08-21, 2026-09-08). Still needs a decision (remove the
  trigger vs. add a mandatory migration-checklist step) — see
  `docs/Backlog.md`.
- **Audit Trail Extension** (`opportunity_item`/`split`/`stakeholder`) —
  planned start 2026-09-10, deliberately a week after this batch, per
  `docs/Audit-Trail-Extension-Implementation-Plan.md`.

## References

- `docs/Deployment-Topology.md` — promotion flow this run followed
- `docs/Progress-Archive-2026-09.md`'s 2026-09-08 entry — session narrative
- `docs/Backlog.md` — `rls_auto_enable()` standing item, updated with this
  occurrence
