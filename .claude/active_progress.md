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
  Committed on `main` (`1d2f090`), plus a Malayalam translation of the PWA
  UAT setup doc (`a8a69e0`) — both docs-only, not yet merged to `uat`, no
  special verification needed when they are.
- **3 issues from the Cabio Star Sales team's UAT orientation session,
  investigated 2026-08-04 and logged to `docs/Backlog.md`** (end of
  "Deferred / undecided items"): (1) Customer 360's "Add Opportunity" form
  is missing Demo Date/Expected Closure Date/PO Number, so creating directly
  at an advanced stage trips a BR-OP-00 gate the form never surfaces —
  3 fix options logged, awaiting Basheer's call; (2) Split picker's
  same-zone restriction is UI-only and safe to loosen, but cross-SBU splits
  are correctly blocked per ADR-037 (2026-07-30) — needs Basheer to confirm
  which behavior the team actually wants; (3) **Admin/General Manager
  (Haroon) couldn't create opportunities outside their home SBU — RESOLVED
  2026-08-04**, see below.

**Just implemented and verified on Dev by Basheer, not yet committed:**
- **Issue 3 fix (BR-OP-12, `docs/Business-Rules.md`): Admin/General Manager
  can now create an Opportunity in a different SBU than their own, and must
  always explicitly choose one** via a required "SBU *" dropdown on both
  create entry points. Full detail in `docs/Progress-Archive-2026-08.md`'s
  2026-08-04 entry.
- **"Add Product" sub-dialog losing input focus after every keystroke** —
  two stacked bugs, both fixed: (1) MUI nested-dialog focus-trap conflict
  (`FormModal.tsx`'s new `disableEnforceFocus` prop), affecting all 3
  Opportunity-create/edit→Products dialog pairs; (2) `Customer360Screen.tsx`
  only — `OppItemAddRow` was defined inline inside the parent's render body,
  causing a remount-on-every-keystroke independent of the dialog fix; fixed
  by hoisting it to module scope. Full detail in the same archive entry.
  **Confirmed working by Basheer on both entry points ("+ Lead" and
  Customer 360's "+ Add").**

**Immediate next step:** commit both fixes and merge to `uat`; then move to
issue 1 or issue 2 from the UAT-orientation list (Basheer's call which).
Otherwise continue triaging any further issues the Cabio Star Sales team
hits during UAT smoke testing.

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
