# Active Progress — Cabio Sales OS
_Session: 2026-08-21 → 2026-09-02_

## Current task 0 — Audit Trail (+ Admin/GM Audit Log screen): built, fully verified, ready to commit

Migration `0030_add_audit_log.py` applied to Dev, `Physical-Schema.sql`
regenerated. Scope grew same-day to also include the Admin/GM "Audit Log"
review screen (`backend/app/domains/audit/`, `AuditLogScreen.tsx`) —
originally a deferred follow-up, picked up same session. All 5 items in
the implementation plan's verification checklist passed live against Dev,
including RLS confirmed both at the DB level and live in the app
(Shruthi's non-admin login correctly has no Audit Log nav entry). Full
narrative: `docs/Progress-Archive-2026-09.md`'s 2026-09-02 entry (top
entry).

**Next step: commit.** This unblocks Current task 3 below (Lead
Management) — it's deliberately holding off touching `backend/app/
main.py` and `docs/Physical-Schema.sql` until this commits, to avoid
stepping on this session's uncommitted changes to those same 2 files.

## Current task 1 — BR-ACC-03 (duplicate hospital): committed, manual E2E plan not yet confirmed complete

Committed `e86d49a` on 2026-08-31. Full narrative: `docs/Progress-
Archive-2026-08.md`'s 2026-08-30 and 2026-08-31 entries.

**Still open:** the full manual E2E test plan (`docs/BR-ACC-03-Manual-
E2E-Test-Plan.md`, Groups A-G) has not been explicitly confirmed
complete end to end — Basheer exercised the create/edit UI live during
the build session with no issues found, but that's not the same as a
Groups A-G sign-off. Also still open: the Option A vs. B decision itself
is Haroon's call, per `docs/Duplicate-Hospital-Decision-Brief-2026-08-
29.md`; nothing here is live for the sales team regardless.

## Current task 2 — Auth Session Resilience: committed

Part A (retry-before-signout) and Part B (60-min idle timeout), both root-
caused and fixed 2026-09-02 after the 2026-08-31 mid-debug stop point.
**Committed `1991834`** ("feat: add Auth Session Resilience (idle timeout
+ transient-failure retry)"). Full narrative: `docs/Progress-Archive-
2026-09.md`'s 2026-09-02 entry.

## Current task 3 — Lead Management for Marketing-Sourced Leads: backend+frontend built and unit-tested, blocked on shared-file wiring

Full build per `docs/Lead-Management-Implementation-Plan.md` (two open
decisions resolved 2026-09-02: no Account-creation rights for Marketing
User; assignment picker filtered by the lead's `sbu_id`). New `lead`
backend domain, migration `0031_add_lead.py` (found and fixed a real RLS
gap in the plan's original policy sketch — see the plan doc's RLS
section), notification IndiaMART-urgency removal, and the full frontend
(Lead Entry screen, Lead Review Queue, Convert/Discard flows, Marketing
User's fully restricted nav). 659/659 backend tests pass (added
`tests/domains/lead/test_lead_service.py`, 100% service coverage;
also fixed a pre-existing test-ordering fragility in
`tests/test_persistence.py` while wiring `db/registry.py`), `tsc`/lint
clean on the frontend.

**Deliberately not wired yet, per conflict-check with the parallel Audit
Trail session:** `backend/app/main.py` (leads router not registered) and
`docs/Physical-Schema.sql` — both are mid-edit in that other session
(currently doing its own manual E2E verification, not yet committed as of
2026-09-02). `sales-os-app/src/services/leads.ts` uses hand-typed
interfaces instead of generated API aliases for the same reason. Once
that session commits: register `leads_router` in `main.py`, regenerate
`Physical-Schema.sql` and frontend types, then run the manual E2E pass
already drafted at `docs/Lead-Management-Manual-E2E-Test-Plan.md`.

**Next up after that: two items now queued in `docs/Backlog.md`.**
1. **Engagement History generation** (supersedes the old "Relationship
   Notes" plan as of 2026-09-01) —
   `docs/Engagement-History-Generation-Implementation-Plan.md`. **Blocked
   on one open decision, not code-ready:** which LLM/processing approach
   to use is a data-privacy call for Basheer/leadership (§6 of the plan).
   Full narrative: `docs/Progress-Archive-2026-09.md`'s 2026-09-01 entry.
2. Milestone 2/Target Planning and the Annual Development-Activity KPI
   remain further-out candidates in `docs/Backlog.md`. The UAT
   `rls_auto_enable()` trigger remains a standing risk item, not a
   feature.

## UAT migration — status as of 2026-08-29

Both Star Sales and the extended sales team now have UAT access and have
been walked through the app. Full territory/roster detail:
`docs/Progress-Archive-2026-08.md`'s 2026-08-24 and 2026-08-29 entries;
underlying territory data: `docs/Zone-Hierarchy-Territory-Data-2026-08.md`
(now stale in two places — Bangalore's zone-tree shape, and Nagesh
Ninganoor's territory after his resignation — see the 2026-08-29 archive
entry for both).

**Known blocker, still standing:** direct DB-touching commands
(migrations, raw queries) get blocked by the Claude Code auto-mode safety
classifier regardless of chat approval. Basheer runs these himself
(`!`-prefixed or his own terminal). Read-only SQL (SELECT queries via a
python/psycopg2 script, using `.venv/Scripts/python.exe` directly — Git
Bash mis-resolves `source .venv/Scripts/activate` on this machine) runs
fine without tripping the classifier — used repeatedly this session for
UAT diagnostics with no issue.
