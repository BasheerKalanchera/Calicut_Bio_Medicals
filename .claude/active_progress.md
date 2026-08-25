# Active Progress — Cabio Sales OS
_Session: 2026-08-21 → 2026-08-25_

## Current task — Manager-Attested Gate Override, build done; manual E2E next

**Built and applied to Dev** (13-step plan, `docs/Manager-Attested-Gate-
Override-Implementation-Plan.md`; decision record `docs/Discussion-FastTrack-
Gate-Override-2026-08.md`, DECIDED 2026-08-25). Migration `0027` applied.
Backend (model/schema/validators/repository/service, `BR-OP-14` in
`Business-Rules.md`, `Physical-Schema.sql` regenerated) plus 17 new backend
tests (575 passing total). Frontend done across all 4 opportunity entry
points (QuickLeadModal, Customer360Screen create+edit, ProjectDirectoryScreen
create+edit, OpportunityDetailScreen) + `types/api.ts` regenerated; `tsc`/lint
clean. Approver is the rep's immediate manager (Area Manager role, via
`manager_id`) or any General Manager as an escalation path.

**Backend gap found mid-build, now fixed:** `WorkspaceOpportunity`
(`backend/app/domains/account/workspace_schemas.py`) — the schema Customer
360's and Project Directory's opportunity lists actually use — wasn't in the
original plan's backend scope and was missing the gate-override fields
entirely; without it those two screens' edit forms couldn't prefill an
existing override.

**Staged for commit, not yet committed** — Basheer is committing this one
himself. **Not yet done: manual E2E on Dev.** 14-case checklist prepared:
`docs/Manager-Attested-Gate-Override-Manual-E2E-Verification.md` — log
results in that file's results table as each case runs.

**Resolved this session:** Opportunity-Assignment Notifications +
Reminders-on-Login manual E2E, both fully done (five bugs found and fixed,
verified live). Commits `e47ccc9`, `a6fbf0a`. Full detail:
`docs/Progress-Archive-2026-08.md`'s 2026-08-25 entry, not repeated here.

## UAT migration — status as of 2026-08-24

**Done:** Karnataka zone tree (Karnataka → District flat, except
Bangalore keeps its cluster node + Zone 1-6), Fazal's and Shruthi's
district-level assignments. Full narrative:
`docs/Progress-Archive-2026-08.md`'s 2026-08-21 and 2026-08-24 entries;
underlying territory data: `docs/Zone-Hierarchy-Territory-Data-2026-08.md`.

**Staged rollout is on track and unchanged in shape:** only the Star
Sales team has been given UAT access so far, and they are currently
testing. **The extended sales team has NOT been rolled out or started
testing** — that step, and Monday-style training for them, is still
gated behind explicit Star Sales sign-off, which has not been received
yet. Don't assume the extended team has any access until that sign-off
lands and the next rollout step actually happens.

**Known blocker, still standing:** direct DB-touching commands
(migrations, raw queries) get blocked by the Claude Code auto-mode
safety classifier regardless of chat approval. Basheer runs these
himself (`!`-prefixed or his own terminal). **Partial nuance,
2026-08-23:** read-only SQL (SELECT queries via a python/psycopg2
script) ran fine without tripping the classifier — the blocker may be
scoped to writes/DDL specifically, not tested further.

## Next up, once the Gate Override build lands

**Referral Credit Part 2 — Relationship-Support Activity.** Fully
scoped and ready to build — see `docs/Backlog.md`, not repeated here.
Gate Override's migration (`0027`) takes the slot Referral Credit Part 2
also wanted; that plan's migration is `0028` instead.
