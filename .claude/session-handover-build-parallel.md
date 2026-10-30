# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note. While a `/build` worktree exists, the live copy is the one in it, on
the build branch, and reaches `main` at the merge (Basheer, 2026-10-17)._

## In progress — Hospital next-action rule, steps 1–3 of 6 done (30 Oct)
- Worktree `.claude/worktrees/build`, branch `worktree-build`, brought up
  to `main` `1afc50d` by fast-forward on 30 Oct. The redesign is already
  merged (`3bafbc0`); its E2E is `/test`'s, not mine.
- Plan: `docs/Hospital-Next-Action-Rule-Implementation-Plan.md`
  (Approved, D1–D11). Build order now six steps: 1 server check,
  2 Log Activity form, 3 seeing them all (D6–D8), 4 Project screen into
  tabs (D10), 5 Project Next Actions tab (D9), 6 E2E on Dev.
- **Step 1 (server) `2b5a113`, pushed** to `origin/worktree-build`
  (30 Oct): hospital and Project blocking in `log_activity`; "close
  several together" now also at hospital/Project level (same person, same
  level); new `GET /accounts/{account_id}/reminders` (`hospital_level`,
  `include_completed`, paged); plan edited for D9–D11. Checks: pytest
  1467, ruff, tsc clean; `api.ts` regenerated. No router test for the new
  route (existing router tests don't cover reminder routes). No migration.
- **Step 2 (Log Activity form) `421fc63`, pushed** (30 Oct): Log Activity
  warns and switches to the close form at hospital and Project level
  (`LogActivityModal.tsx`, new `listAccountReminders`); the close form's
  "produced a new Opportunity" box also serves Project-level next
  actions, with the Project locked on the new Opportunity (D12).
  Reminder responses now carry the Project name (`ActivityContextNested.project`);
  query-size guard join counts raised by one (7/8 pending, 13/14
  completed). pytest 1467+1, ruff, tsc clean. Project filter is
  client-side over the hospital's first 100 next actions. Dealer-partner
  tracking added to Backlog.
- **Step 3 (seeing them all) `f129bb0`, pushed** (30 Oct): the three
  reminder list calls in `activities.ts` now walk every page; new shared
  `components/NextActionsPanel.tsx` (list, Pending/Completed switch, total
  in heading, Close on own rows only) used by Opportunity Detail's tab and
  a new Customer 360 "Next Actions" tab; Next Actions screen shows the
  total. Differs from plan wording ("copy"): one shared component, so
  step 5's Project tab reuses it. tsc clean, lint 0 errors; no server
  change. Not run in a browser (E2E after merge).
- Basheer added D9–D11 mid-step (30 Oct): Project screen gets tabs and a
  Next Actions tab. The tab matches a next action when its activity's
  Project **or** its Opportunity's Project is the Project (an activity
  logged on an Opportunity carries no Project).
- **Step 4 (Project screen into tabs, D10) built, not committed** (30 Oct):
  `ProjectDirectoryScreen.tsx` `ProjectDetailView` — chip row Overview /
  Opportunities / Activity under the header; the three cards moved into
  tabs unchanged. tsc clean, lint 0 errors. Not run in a browser.
- **Next:** commit step 4 (shown to Basheer first), then step 5 (Project
  Next Actions tab, D9; server route + tab reusing `NextActionsPanel`) —
  check in first. E2E plan still needs the
  Project-screen cases (D9, D10, D12).
- Migration number last chosen: none.
