---
name: cabio-db-and-scripting
description: Cabio Sales OS checklist for raw SQL against the Dev or UAT database (especially RLS-protected tables), writing or running an Alembic migration that deletes/retires/bulk-updates rows, analysing exported data for a migration or cutover, writing a one-off Python or PowerShell script, diagnosing a repeated failure, or explaining why a local git branch is behind its remote. Load before any of these tasks.
---

# Cabio — database, migration, scripting and git checklist

Origins of each rule: `docs/Process-Rules-History.md` (grep the date tag).

## Raw SQL against RLS-protected tables *(2026-09-22)*
- Set **all three** session settings in the same transaction before querying:
  `app.current_user_id`, `app.current_role_id`, `app.current_sbu_id` — never
  just one or two.
- Verify with `SELECT cabio_app_role_name(), cabio_app_uid(), cabio_app_sbu_id()`
  — all three must return the expected value, not NULL — before trusting any
  result. A missing setting silently returns zero or too few rows, with no error.
- For full visibility, impersonate an Admin/GM user (their id and role id; the
  SBU setting then doesn't restrict them but set it anyway). To see what a
  tier-restricted user sees, use that user's own id/role/SBU.
- Run it read-only (`SET TRANSACTION READ ONLY`) unless a write was approved.
- UAT: ask Basheer first, even read-only (see CLAUDE.md Architecture › Safety).

## Migrations that delete, retire or bulk-update rows *(2026-09-21)*
- Query `pg_constraint` for every table with a foreign key into the one being
  touched — never rely on a hand-assembled list of "tables I know reference this."

## Data analysis for a migration or cutover *(2026-09-21)*
- Before investing time in one environment's export, do a cheap check that the
  *target* environment (where it runs first) matches it. Never assume Dev
  mirrors UAT or vice versa.

## Scripts
- Throwaway scripts (one-off data matching, migration generators) go in the
  session scratchpad directory — never inside the repo (e.g. `.claude/scratch/`).
  Check the path before the first write. *(2026-09-21)*
- PowerShell 5.1: when capturing a native command's output with `2>&1` into a
  variable under `$ErrorActionPreference = "Stop"`, the first stderr line aborts
  the script before its own error checks run. Toggle to `"Continue"` around that
  call. *(2026-09-20)*
- On Basheer's machine, call `.venv/Scripts/python.exe` directly; Git Bash venv
  activation mis-resolves PATH.

## Diagnosing failures
- When something fails repeatedly for an unclear reason, isolate the variable
  with a small, fast diagnostic before retrying the big, slow operation.
  *(2026-09-20)*
- Before claiming a capability is missing (a library, a tool), check what's
  actually available, including skills and tools outside the project's own
  runtime. *(2026-09-20)*

## Git branch behind its remote *(2026-09-21)*
- Pull the actual commit list and authorship for the gap immediately
  (`git log local..origin/branch`), and lead with the concrete cause, not a
  general explanation of how git branches work.
