# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note. While a `/build` worktree exists, the live copy is the one in it, on
the build branch, and reaches `main` at the merge (Basheer, 2026-10-17)._

## In progress — Hospital next-action rule, steps 1–5 of 6 built (31 Oct)
- Worktree `.claude/worktrees/build`, branch `worktree-build`. On 31 Oct it
  was 2 commits behind `main` (`0ae8e29`, `374a2a8`: My Work small fixes,
  Build & Test docs). Basheer chose to merge `main` in at the end, not now.
  The redesign is already merged (`3bafbc0`); its E2E is `/test`'s.
- Plan: `docs/Hospital-Next-Action-Rule-Implementation-Plan.md`
  (Approved, D1–D12). Steps: 1 server check, 2 Log Activity form,
  3 seeing them all (D6–D8), 4 Project screen into tabs (D10), 5 Project
  Next Actions tab (D9), 6 E2E on Dev.
- **Built and pushed to `origin/worktree-build`:** step 1 `2b5a113`,
  step 2 `421fc63`, step 3 `f129bb0`, step 4 `0e99f99`, **step 5
  `406adcd` (31 Oct)**. Step detail is in the Progress-Archive entry of
  30 Oct and the commit messages.
- **Step 5 (Project Next Actions tab, D9) `406adcd`, pushed:** new
  `GET /projects/{project_id}/reminders` (`project_exists`,
  `list_by_project`, `count_by_project` with a shared `_on_project`
  filter: activity's Project OR an Opportunity under it, the second half a
  subquery so the join counts stay 8 pending / 14 completed);
  `ReminderService.list_for_project`; `listProjectReminders`; fourth chip
  "Next Actions" on `ProjectDetailView` using `NextActionsPanel`; close and
  Log Activity forms refresh `["project-reminders"]`; `api.ts`
  regenerated. Checks: pytest 1478 passed (10 new), ruff, tsc clean, lint
  0 errors. Not run in a browser (E2E after merge). No migration.
- **Next:** docs batch for steps 4–5 (this note, plan Status/progress,
  Progress-Archive entry, and the E2E plan's Project-screen cases for
  D9, D10, D12 — load `cabio-e2e-testing` before touching the test plan),
  shown to Basheer before committing. Then step 6: check in before it; the
  E2E itself runs after the merge (`/test`, or Build & Test).
- Merge, when Basheer says go: bring `main` into the branch, settle shared
  docs (Backlog, Progress-Archive: keep both sides), rebuild `api.ts`,
  re-run tests, then merge into `main`; no migration to apply.
- Migration number last chosen: none.
