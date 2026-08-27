# Active Progress — Cabio Sales OS
_Session: 2026-08-21 → 2026-08-27_

## Current task — none in flight; all recent work committed and verified

Three features landed and closed out this session, in order:

1. **Manager-Attested Gate Override (BR-OP-14)** — checkbox rework,
   approver notification, two audit-integrity bugs found and fixed, manual
   E2E complete (20 Pass / 2 Skipped). Committed `9043a50`, `a7fb786`.
2. **Sales Development Activities (BR-ACT-09)** — six new unattached
   activity types. Manual E2E complete (17/17 Pass). Committed `ac587a3`.
3. **Referral Credit Part 2 / Relationship-Support Activity (BR-ACT-10)** —
   cross-SBU logging carve-out. Manual E2E complete, including the
   cross-SBU security flow (16/16 Pass). Committed `4e1f4c8`.

Full build narrative, bugs found, and design decisions for all three:
`docs/Progress-Archive-2026-08.md`'s 2026-08-26/27 entries. Not repeated
here.

**Next up:** nothing picked yet. See `docs/Backlog.md` for candidates —
Referral Credit Part 2 was the last "next up" item and is now done, so this
needs a fresh call. Two ready-to-build contenders as of 2026-08-27: Milestone
2 / Target Planning (5 open decisions pending Basheer before it can start)
and the Annual Development-Activity KPI (sequenced after both Sales
Development Activities and Target Planning — only the first prerequisite is
met so far). The UAT `rls_auto_enable()` trigger is a standing risk item, not
a feature, worth a look regardless of what's picked next.

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
