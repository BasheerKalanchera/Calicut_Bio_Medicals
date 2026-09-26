# UAT Disaster Recovery Runbook

Authoritative process for recovering the UAT database from backup. Follow
this document during an actual incident — don't improvise steps from
memory. If this document and practice ever diverge, fix this document.

Validated by a full restore drill on 2026-09-20 (see
`docs/Progress-Archive-2026-09.md`, "First UAT restore/disaster-recovery
drill" entry, for the detailed findings behind the design choices below).

## When to use this

The UAT database (the Supabase project referenced by `backend/.env.uat`)
is corrupted, has bad/lost data, or the Supabase project itself is gone,
and it needs to be replaced from a backup rather than fixed another way.

## Before you start: know what you'll lose

A restore brings the database back to exactly the moment the backup was
taken — nothing more recent. Anything entered into UAT *after* that
backup's timestamp is gone for good. Check the filename of the backup
you're about to use (`cabio_uat_<date>.dump`) and confirm with the team
whether that gap is acceptable before proceeding.

## Where backups live

- **Primary:** `C:\Backups\CabioUAT\DB_Backups` on Basheer's laptop — the 14 newest
  dumps, produced by `scripts/backup_uat.ps1`.
  Taken daily, prompted by the Claude session-start reminder
  (`.claude/hooks/session-start.sh`) whenever no dump is dated today
  (since 2026-09-24).
  The script keeps the 14 newest `cabio_uat_*.dump` files and deletes the
  rest — count-based since 2026-09-25 (was a 14-day window), so missed days
  never shrink the set. Hand-saved snapshots (e.g. `…-pre-migration
  snapshot.dump`) count toward the 14 and are pruned like any other dump;
  Basheer keeps those in Google Drive and declined a script change
  (2026-09-24). Before each run, list the whole folder and tell him
  exactly which files the prune will remove.
- **Secondary (offsite):** Basheer's Google Drive, updated manually and
  irregularly as of 2026-09-20 (the backup script's own Google Drive
  step is disabled pending Google Drive for Desktop setup). Use this
  only if the laptop itself is unavailable.

## Step-by-step process

### 1. Confirm recovery is actually needed
Rule out a simpler fix first. A restore is disruptive and loses any data
added since the backup — don't reach for it as a first response to every
anomaly.

### 2. Choose the backup to restore
Pick the most recent dump file from `C:\Backups\CabioUAT\DB_Backups` (or Google
Drive, if the laptop is the thing that's down). Note its date — this is
the exact point in time you're restoring to.

### 3. Make sure there's a target database
- **UAT project still exists, just broken/corrupted data:** restore into
  that same project — no setup needed, `backend/.env.uat` already points
  at it.
- **UAT project itself is destroyed:** create a new empty Supabase
  project first, then update `backend/.env.uat` with its new
  `ADMIN_DATABASE_URL` before restoring into it.

### 4. Run the restore script against the real target
```
powershell -ExecutionPolicy Bypass -File "scripts\restore_uat.ps1" -TargetEnvFile "backend\.env.uat"
```
What happens, in order:
1. Starts Docker if it isn't already running (automatic, ~10–20s).
2. Reads the real UAT connection details from `backend\.env.uat` — no
   credentials typed by hand.
3. Prints a yellow warning naming exactly which database is about to be
   written to.
4. **Stops and waits for you to type `RESTORE` (capital letters) to
   confirm.** Anything else cancels — nothing is touched.
5. Once confirmed: restores the backup's data, re-enables the `pg_trgm`
   Postgres feature the schema's search indexes need (a gap found during
   the 2026-09-20 drill — a fresh/empty target doesn't have this on by
   default), and prints back table/row counts as immediate proof of what
   landed.
6. Everything is logged to `C:\Backups\CabioUAT\DB_Backups\restore_log.txt`.

To specify a particular backup file instead of the newest one, add
`-DumpFile "C:\Backups\CabioUAT\DB_Backups\cabio_uat_<date>.dump"`.

**If Claude Code is running this on Basheer's behalf:** the interactive
`Type RESTORE` prompt can't be answered through that tool. Only after
Basheer has explicitly told Claude, in chat, to proceed with that
specific restore, add `-Force` to skip the prompt (the warning still
prints and still gets logged either way). Never pass `-Force` as a
default or convenience — it removes the last safety check before a
destructive action.

### 5. Verify the result
Log into the Supabase dashboard for that project → **Database → Tables**
for a quick table count, and **Table Editor** to spot-check a few real
records (an account, an opportunity) look right — the same cross-check
done during the 2026-09-20 drill.

### 6. Communicate and record
Tell anyone affected the system is back. Log to the current
`docs/Progress-Archive-<year>-<month>.md`: what caused the incident, the
timestamp of the backup used, how much data (if any) was lost, and
anything that didn't go per this runbook — update this document if the
process needs to change as a result.

## Known limitations (not yet addressed)

- **Single point of failure:** primary backups live only on Basheer's
  laptop; the offsite (Google Drive) copy is manual and irregular. If the
  laptop is lost at the same time as UAT, the most recent usable backup
  may be much older than the newest local one.
- **Local-only retention:** only the 14 newest dumps are kept locally, so
  an older backup only survives if it was separately copied to Google
  Drive before it was pruned.
