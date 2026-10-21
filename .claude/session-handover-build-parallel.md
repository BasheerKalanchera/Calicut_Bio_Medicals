# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note. While a `/build` worktree exists, the live copy is the one in it, on
the build branch, and reaches `main` at the merge (Basheer, 2026-10-17)._

## Idle — no `/build` session running
- `/build` closed 2026-10-21 (Basheer). Its branch `worktree-build` (docs
  only, no code) was merged into `main` by Plan & Chore; the worktree
  `.claude/worktrees/build` and the branch are removed after Basheer's yes.
- Annual Target Planning Part 1 went to **Build & Test** (Basheer,
  2026-10-21); nothing of it was built here.
- **Next `/build`:** start a fresh worktree from `origin/main`. Install the
  frontend packages with `npm ci --legacy-peer-deps` (a plain
  `npm install` fails; Backlog "`sales-os-app` has a real
  `typescript`/`openapi-typescript` peer dependency conflict").
