# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note. It lives in the worktree, on the build branch, and reaches `main` at
the merge (Basheer, 2026-10-17)._

- Worktree: `.claude/worktrees/build`, created 2026-10-17 from
  `origin/main`; `main` merged in up to `107bccc` the same day. Branch:
  `worktree-build`, no code on it yet. Migration number last chosen:
  **0062** (`main`'s latest is 0061, checked 2026-10-17).
- Frontend packages installed with `npm ci --legacy-peer-deps` (a plain
  `npm install` fails; Backlog "`sales-os-app` has a real
  `typescript`/`openapi-typescript` peer dependency conflict").
- Merge into `main`: once, at the end of a build, after the E2E running
  at the time is done and Basheer says go (Basheer, 2026-10-17).

## Nothing lined up to build

- Annual Target Planning was next, but its plan is **being replanned —
  do not build** (`docs/Annual-Target-Planning-Implementation-Plan.md`
  Status, `107bccc`, 2026-10-17: calendar-year brand targets, D23
  onwards). Basheer, 2026-10-17: a few planning points are still not
  decided. Step 1 not started; the read-only Dev count of existing brand
  and SBU targets not run.
- Waiting on Basheer, once the replan is approved — both proposed
  2026-10-17 for step 1's migration, unanswered, and to be checked
  against the replanned plan first:
  - a removal rule (Admin and GM) on the yearly SBU target table only, so
    the GM can clear the company's own figure (was D13); neither existing
    target table allows removal today;
  - change history (audit trigger) on the yearly SBU target table, as the
    quarterly `sbu_target` has; none on the brand yearly table, as today.
- **Next:** wait for Plan & Chore to finish the replan and Basheer to name
  what this session builds; then read the plan again and check in before
  step 1.
