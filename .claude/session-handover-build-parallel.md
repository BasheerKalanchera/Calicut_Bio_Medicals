# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note. While a `/build` worktree exists, the live copy is the one in it, on
the build branch, and reaches `main` at the merge (Basheer, 2026-10-17)._

## In progress — Target vs Actuals redesign, steps 1 and 2 done, step 3 next
- Worktree `.claude/worktrees/build`, branch `worktree-build`. My Work
  (previous build) is already merged into `main`; the branch was
  fast-forwarded to `main` `f404ab4` on 2026-10-29.
- Plan: `docs/Target-vs-Actuals-Redesign-Implementation-Plan.md` (Approved
  29 Oct). Three steps: 1 server, 2 screens, 3 docs and pre-E2E review.
- **Step 1 (server) `76ef5ab`, pushed** (2026-10-29): Year endpoint returns
  target so far, Won so far and Won % per person, plus SBU/Company/Team
  rows and a not-started answer (D2, D6); Quarter drops the late list
  (D5); Overdue adds each person's past-closing count and ₹ value and
  lists only people with a count above zero (D5, D11). No migration.
- **Step 2 (screens) `d623d33`, pushed** to `origin/worktree-build`
  (2026-10-29): Year view (three boxes, one table, not-started line),
  Quarter view (four boxes, Won/Likely finish bar table, person's own
  screen on a name click), Overdue tab renamed, its two counts open My
  Work at the matching list (new `startRequest` prop, DemoApp holds it),
  phone layout. `tsc` clean; lint 0 errors (133 old warnings). **Not seen
  in a browser** — Basheer runs the phone/tablet/laptop look at E2E.
- Basheer's rulings 29 Oct: Quarter person % = won ÷ their plan, labelled
  "of plan"; Company/SBU/Team rows = won ÷ target, "of target", Likely
  finish a dash. Year person % = won ÷ target so far. Year names stay
  plain text (links "later if required").
- **Step 3 done (29 Oct).** Small fix `161fb15` (unused `headCellSx`
  removed) and docs batch `2fcd8fc`, both pushed to `origin/worktree-build`
  (not merged to `main`). Business-Rules
  (BR-OP-16 Where shown + Forecast effect, new Year view line under
  BR-PL-12), rule matrix (BR-OP-16, BR-FIN-09 rows), a "replaced in part"
  note in the Plan-vs-Actuals-Tracking plan. Checks green: pytest 1441,
  ruff, tsc, lint 0 errors. `/code-review` medium on `76ef5ab..d623d33`
  done: only fix needed was removing unused `headCellSx` (done). Basheer
  ruled a missing quarter row in the Year view stays as is (late joiners).
  User manual deferred to the UAT move (D8); in-app help has no Insights
  topic. Phone/MUI read of new screens done: no finding.
- **Next:** nothing left to build. Wait for Build & Test's Part 2 E2E to
  finish, then, on Basheer's go, the merge (bring `main` in, re-run
  tests, `ExitWorktree` keep, merge, push, rebuild `api.ts`,
  `cabio-post-commit`). The redesign's own E2E (A–F) is run by `/test`
  after the merge. Retro for this session already in Progress-Archive.
- Migration number last chosen: none.
