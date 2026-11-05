# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note. While a `/build` worktree exists, the live copy is the one in it, on
the build branch, and reaches `main` at the merge (Basheer, 2026-10-17)._

## In progress (4 Nov): Customer with No Activity — built, reviewed, not merged
- Plan `docs/Exception-Report-Implementation-Plan.md` (Approved, D1–D15).
  Commits on `worktree-build`, all pushed: step 1 `0741c02` (migration
  `0065`, report data, tests), step 2 `31747a1` (screen, Reports menu item,
  `show_zone_picker` from the server, D13, Basheer chose "server says"),
  review fix `a0c5a05` (list dims while a new Rep/Zone pick loads).
- **Pre-E2E code review done (4 Nov, medium):** 7 findings, 6 dismissed
  after reading the code, 1 fixed. pytest 1546 passed, ruff, tsc, MUI check
  clean, lint 0 errors. Not seen in a browser. Area Manager's Zone picker
  lists own zones + below only (team's zones via the Rep picker).
- **Docs batch** (plan Status, E2E plan "Built:", Progress-Archive, this
  note, retro: 0 corrections) written 4 Nov; commit hash in `git log`.
- **Migration 0065 is NOT applied** (Basheer: after the merge into `main`,
  4 Nov). Until then the function is untested against a real database: the
  E2E on Dev is its first real run. After the merge: apply to Dev, record
  `alembic current`, regenerate `docs/Physical-Schema.sql`. The Backlog entry
  "Exception report: zero lead activity over 3 months" is removed then.
- **Next:** Basheer says go for the merge (still open: bring `main`
  `70b517a`, the sign-out fix, into the branch — asked twice, unanswered).
  Then `/test` runs the 37-step E2E (its section C writes permanent test
  data on Dev, shown to Basheer first).

## Next merge to `main`
- Only when Basheer says go: bring `main` in, re-run tests, push the
  branch, `ExitWorktree` keep, merge, push, apply `0065`, then
  `cabio-post-commit`. If the main folder has an uncommitted copy of a file
  the merge changes, git refuses: ask before discarding it.
- Work in the worktree only. Don't edit the E2E plans (Build & Test's),
  except the one "Built:" line named above.
- Each fix Build & Test sends: its own shown-first commit.

## Carried over
- 3 Nov state (everything then merged into `main` `1bf0260`) and the 4 Nov
  merge of `main` `8fa30af` as `4d42087`: see Progress-Archive 2026-11.
- **MUI round 1 Part 1:** steps 1–7 done (last `5c26ed3`); step 8 (21
  "after" screenshots, before-and-after page, combined E2E) is Build &
  Test's. Plan: `docs/MUI-Good-Practice-Implementation-Plan.md`.
- Still open from 1 Nov: check the "Me (default)" wording in Frontend
  standards and Process-Improvements (Backlog block "Found in MUI round 1
  steps 5–7").
- **To tell Plan & Chore (via Basheer):** add ◀ and "← Back" to
  `check-mui-standard.js`; the commit check prints "no staged .ts/.tsx
  files" even when some are staged (seen again 4 Nov on `a0c5a05`).
- **After the E2Es (Build & Test's):** `cabio-post-commit` paperwork
  (Traceability, scorecard, plan Status). User manual and in-app help wait
  for the UAT move (Simpler Table D8).
- Migration number last chosen: 0065 (not applied).
