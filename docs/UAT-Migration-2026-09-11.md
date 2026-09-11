# UAT Migration — 2026-09-11

**Status: complete.** `main` promoted to `uat`, 2 migrations applied, smoke-
tested (UI-only, no test data written to live UAT), no issues found.

---

## Scope

10 commits, 2 Alembic migrations (`0040` → `0041`) — the last promotion was
2026-09-09 (`dbfaea1`..`643256f`), this batch covers everything merged to
`main` since:

1. **Activity Inline Comments** (Phase 1 + Phase 2) — two-way comment
   thread under each Activity card, with notifications to thread
   participants. New `activity_comment` table (migration `0040`).
2. **Audit Trail Extension** — `stakeholder`/`opportunity_item`/`split`
   changes now captured in the Audit Log, matching the original four
   tables (migration `0041`).
3. Activity comment/manager-note notifications now deep-link to the exact
   Activity, not just the deal's Activity tab.
4. `_TERRITORY_ADMIN_ROLES` naming-clash rename (`_TERRITORY_MAP_ADMIN_
   ROLES` / `_ZONE_SEARCH_UNRESTRICTED_ROLES`) — refactor only, no
   behavior change.
5. UAT backup script's Docker-shutdown bug fix (`scripts/backup_uat.ps1`
   now also stops `com.docker.*` backend processes, not just the tray
   frontend).
6. Doc/handover-only commits (UAT promotion close-out, Audit Trail
   Extension close-out).

No new backend dependencies. No frontend dependency changes.

## Pre-flight checks

- `git rev-list --left-right --count origin/uat...origin/main` confirmed a
  clean fast-forward (0 ahead on `uat`, 10 ahead on `main`).
- Diffed `backend/alembic/versions/` between `uat` and `main` to confirm
  the exact migration set (`0040`–`0041`); read both — both purely
  additive (one new table, three new triggers), no backfill, no existing
  row touched.
- No RLS-trigger gotcha this time: UAT's `rls_auto_enable()` event trigger
  (the cause of the 2026-08-03/08-21/09-08 near-misses) was permanently
  removed 2026-09-10 — one fewer risk to check for on this promotion.

## Execution log

1. **Backup.** Basheer ran `scripts\backup_uat.ps1` —
   `cabio_uat_2026-09-11.dump` (302,957 bytes), `pg_restore --list`
   verified 361 TOC entries. Minor blemish, not a blocker: Docker
   Desktop's graceful shutdown timed out after 30s and had to be
   force-stopped — same script, worth a look if it recurs, not urgent.
2. **Code promotion.** `git push origin main:uat` — fast-forward,
   `643256f..a28ac61 main -> uat`. Render auto-redeployed both
   `Calicut_Bio_Medicals` (backend, 58.7s) and `cabio-sales-os-uat-
   frontend` (19.2s); both confirmed **Live** on `a28ac61` via the Render
   dashboard.
3. **Migrations** — run by Basheer (DB-mutating commands are outside
   Claude Code's tool access on this project by design), from `backend/`
   in Git Bash:
   ```bash
   set -a; source backend/.env.uat; set +a
   cd backend
   unset CORS_ORIGINS
   .venv/Scripts/python.exe -m alembic upgrade head
   ```
   `0039 -> 0040 -> 0041`, no errors.
4. **Smoke test — deliberately UI-only, no test data written.** Logged
   into `/demo`, opened an Opportunity, confirmed the Activity tab
   renders with no errors. Basheer confirmed live on a real Activity card
   that the new "Add comment" control appears directly under the
   Activity text, as designed. **Did not post a comment or log a test
   Activity** — Activity and comment rows are immutable on this project
   (no DELETE endpoint), so any test write would be permanent; actual
   posting/notification behavior and the Audit Log's new trigger coverage
   are left for Haroon to exercise, since he's the one who requested the
   comments feature.
5. **Team notification / further verification:** pending Haroon's own
   pass over the comments feature.

## Still open (tracked elsewhere, not resolved by this migration)

- Haroon to verify Activity comment posting + notifications live.
- Docker Desktop's graceful-shutdown timeout in `backup_uat.ps1` (step 1
  above) — cosmetic so far, flagged for a look if it keeps happening.

## References

- `docs/Deployment-Topology.md` — promotion flow this run followed
- `docs/UAT-Migration-2026-09-08.md` — prior promotion, same runbook
- `docs/Progress-Archive-2026-09.md` — 2026-09-11 entry, session narrative
  (also covers the same day's UAT login-outage incident, a separate,
  already-resolved issue preceding this promotion)
