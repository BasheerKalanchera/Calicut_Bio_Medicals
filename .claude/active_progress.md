# Active Progress — Cabio Sales OS
_Session: 2026-08-21 → 2026-08-31_

## Current task — BR-ACC-03 prototype + two follow-on fixes built, none manually tested or committed yet

Full build (backend + frontend, end-to-end): the Option B near-duplicate
warning on hospital creation (BR-ACC-03), a zone-branch lookup bug fix
(a hospital filed at a bare state zone like "Kerala" got no duplicate
check at all), and a new rep-territory-scoped zone picker for Add/Edit
Hospital (reps see only their own zone; Admin/GM unrestricted; a
zone-less rep is hard-blocked from adding a hospital, backend + frontend).
Backend 638/638 passing, frontend `tsc`/`lint` clean. Full narrative:
`docs/Progress-Archive-2026-08.md`'s 2026-08-30 and 2026-08-31 entries.

**Next step: manual browser pass, then commit.** None of this has been
exercised in the browser yet, and nothing is staged/committed — this is
~1000 lines uncommitted across backend + frontend. Also still open: the
Option A vs. B decision itself is Haroon's call, per
`docs/Duplicate-Hospital-Decision-Brief-2026-08-29.md`; nothing here is
live for the sales team regardless.

**Next up:** nothing picked yet. See `docs/Backlog.md` for candidates —
Milestone 2 / Target Planning (5 open decisions pending Basheer before it
can start) and the Annual Development-Activity KPI (sequenced after Target
Planning). The UAT `rls_auto_enable()` trigger is a standing risk item, not
a feature, worth a look regardless of what's picked next.

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
