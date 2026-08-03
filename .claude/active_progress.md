# Active Progress — Cabio Sales OS
_Session: 2026-08-01, continued 2026-08-02_

## Current task — STOP HERE FIRST

**UAT smoke testing is underway with the Cabio Star Sales team.** Orientation
setup (roster, seed data, keep-alive, PWA install doc) is done — full detail
in `docs/Progress-Archive-2026-08.md`.

**Just resolved:**
- Pipeline screen not auto-refreshing after opportunity create/edit — a
  React Query cache-invalidation gap, fixed at 4 call sites
  (`Customer360Screen.tsx`, `OpportunityDetailScreen.tsx`), merged
  `main` → `uat` (`7bdafae`), verified live on UAT by Basheer, no issues.
  Full writeup in `docs/Progress-Archive-2026-08.md`'s 2026-08-03 entry. A
  5th site with the same root cause (`ProjectDirectoryScreen.jsx`) was
  deferred to `docs/Backlog.md` rather than bundled in.
- `docs/Physical-Schema.sql` regenerated (was stale across 6 migrations),
  plus the process gap that caused the drift closed in
  `Backend-Implementation-Standards.md`'s migration workflow. Found and
  corrected a stale `CLAUDE.md` line along the way (said Postgres 16; both
  Dev and UAT are actually on 17.6 — no real environment mismatch, just an
  outdated doc). Full writeup in the same archive file's 2026-08-03 entries.
  Not yet committed — this is docs-only and inert to the running app, so
  once committed on `main` it can merge to `uat` with no special
  verification needed.

**Immediate next step:** continue triaging any further issues the Cabio Star
Sales team hits during UAT smoke testing.

**After that:** revisit the Critical Care/Imaging manager hierarchy
build-out (see "Also still open" below) once UAT smoke testing wraps up.

## Also still open (unrelated, carried over)

The Critical Care/Imaging manager hierarchy build-out — see
`docs/Progress-Archive-2026-07.md`'s Phase 2E section for the confirmed
plan. The "create Supabase Auth accounts" blocker this was waiting on is
resolved for Dev, but this item concerns the UAT/Prod rollout more broadly —
revisit once UAT is fully proven out per the current task above.

**Deliberately left unconverted, not forgotten** (Basheer's explicit scope
call, see the `@mui/x-date-pickers` archive entry): 9 date-only `type="date"`
fields in `Customer360Screen.tsx`/`OpportunityDetailScreen.tsx`, and 2 more
in `ProjectDirectoryScreen.jsx` (entangled with that file's own pending MUI
migration). Pick up only if Basheer decides to extend scope.
