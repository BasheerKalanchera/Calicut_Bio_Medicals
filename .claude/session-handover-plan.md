# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- Forecast plan (untracked, other session): not in commits; at review, line 110 → BR-FIN-09.

## Annual Target Planning — approved 2026-10-20 (D1–D56)

- Plan approved by Basheer 2026-10-20 (archive 20 Oct entry); `/build`
  note updated with his yes (Part 1, steps 1–4). In `92cab23` + repair
  `006f4cb`, both pushed 2026-10-20 — `/build` can take in `main` now.
- **Next:** Part 1 E2E plan rewrite
  (`docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md`, old on-hold
  version). First a read-only Dev check (users, roles, SBU, managers,
  brands, brand/SBU quarter targets, 2026-Q3/Q4), shown first, three RLS
  settings as Haroon (`cabio-db-and-scripting`). Then write, show before
  saving: hide-checks with real people, labels as descriptions until the
  code exists, Opportunity (hospital), saves "Basheer clicks, Claude
  watches", SBU-total checks on Target vs Actuals.

## Order agreed for the three sessions (Basheer asked, 2026-10-20)

- Plan & Chore: docs batch (lets `/build` start) → `api.ts` chore (build
  and test the guard, not switched on) → Dev check + Part 1 E2E plan →
  switch the guard on after Build & Test's two commits.
- Build & Test: D22 review + E2E → `fix:` commit → `api.ts` refresh
  commit → UAT move plan, which must now include Part 1 and 0062 (D52).
  **Open:** Basheer to say whether Plan & Chore adds that line to its note.
- `/build`: merge main → step 1 check-in → build in worktree → merge
  once after Build & Test's D22 E2E and Basheer's go; 0062 applied to Dev
  then. Only shared file: `src/types/api.ts` (regenerate, don't merge).

## Next full UAT move — what goes, and what must land first

- **Must land first:** User Manual and Help Catch-up plan. Draft PDF
  `Desktop\cabio\Cabio-Sales-OS-User-Manual.pdf`. **Next:** Basheer
  reviews it, then step 3 (in-app help); check in first. Open
  (unanswered): Backlog items for deletes with no "Are you sure?" and the
  Lead Source picker showing "REPEAT_ORDER"-style codes? Annual Target
  Part 1 lands first too (D52). The move plan (Build & Test) starts with
  Query Load plan section 9, steps 2–9 — Basheer, 2026-10-14.
- **Goes with it, E2E-passed on Dev:** Target vs Actuals + roster; Audit
  Trail Redesign (0059; plan step 5 cautions); Win Probability + one
  create form; Rep plan wording; Duplicate hospitals Part A (then step 19
  on UAT). Each plan's Status line has its commits.

## Harness Engineering

- Tracker `docs/Process-Improvements.md`; open list count in the 20 Oct
  Plan & Chore retro (Progress-Archive-2026-10). **Next review
  2026-10-21:** P88, P87, P89 first. P15 hits the 7-day skip limit
  2026-10-24; ten watch-list lines too.
- Still to write, shown first: paperwork check (`cabio-post-commit`),
  right-pack check (`harness-engineering`).

## Chores

- Delete Dev test data from Duplicate hospitals Part A (five "zz Test
  duplicate guard…" hospitals, "zz Test contact"); read-only check first.
  Open: deactivate the test Marketing User login (2026-10-10)?

## Weekly Follow-up / My Work — decisions in progress
- `docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md`; decided so far
  listed in its Decisions. **Next:** last round, proposed D5, D7, D8, D9b,
  D10, D14; then "what could be affected" pass and approval.
- **Open (14 Oct):** pre-fill in all four close forms, or Log Activity only?
