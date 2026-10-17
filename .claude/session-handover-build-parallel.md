# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note, always at its main-folder path, never the worktree copy._

- Worktree: `.claude/worktrees/build` (not created yet). Branch: not
  created yet. Migration number claimed: none yet.
- Merge into `main`: once, at the end of the build, after Build & Test's
  Next-Action E2E is done and Basheer says go (Basheer, 2026-10-17).

## Annual Target Planning — next to build

- Demo to Haroon and Latheef Bhai held on Dev, 15 Oct 2026 (Basheer,
  2026-10-16). Their main ask, a yearly target layer on Brand Target
  Tracking and Target & Coverage Planning:
  `docs/Discussion-Annual-Target-Planning-2026-10.md` (all answered
  2026-10-16). Plan approved 2026-10-16:
  `docs/Annual-Target-Planning-Implementation-Plan.md` (D1–D22a — brand
  targets yearly only, yearly Target vs Actuals view, plan notifications
  on the bell; built before the next UAT move). E2E test plan written
  2026-10-16: `docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md`.
  Both committed (`1d57697`).
- Moved here from the Build & Test note 2026-10-17: built in this
  session, in parallel with the Next-Action E2E (Basheer, 2026-10-17).
  Its E2E is run by Build & Test after the Next-Action E2E.
- **Next:** step 1 (check in first). Step 1's migration (0062 in the
  plan) is written and tested in the worktree, applied to Dev only after
  the merge. A mock-up of the yearly Target vs Actuals view comes before
  step 5.
