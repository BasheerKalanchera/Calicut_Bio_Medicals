# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note, always at its main-folder path, never the worktree copy._

- Worktree: `.claude/worktrees/build`, branch `worktree-build` at
  `1340e25` (main merged in up to `107bccc`; merge main again before
  building). Migration number claimed: 0062 (Annual Target Planning).
- Merge into `main`: once, at the end of the build, after Build & Test's
  Next-Action E2E is done and Basheer says go (Basheer, 2026-10-17).

## Annual Target Planning — next to build

_Section rewritten by Plan & Chore with Basheer's yes, 2026-10-20._
- The 17 Oct stop is over: plan replanned and **approved 2026-10-20**
  (D1–D56), `docs/Annual-Target-Planning-Implementation-Plan.md`. The
  16 Oct version (D1–D22a) is superseded; build from its section 2.
- Build **Part 1 first** (steps 1–4): brand yearly figure, stretch and
  seasonal split saved as brand quarters; SBU target = brands' total
  (typed SBU target table removed, D55); Team targets panel; "Your
  target" line; month labels. Part 1 goes to UAT with the full UAT move
  (D52); Part 2 (steps 5–7) later.
- Built in this session, in parallel (Basheer, 2026-10-17). E2E test
  plan being rewritten for Part 1 by Plan & Chore (2026-10-20).
- **Next:** step 1 (check in first): read-only Dev count of brand and
  SBU quarterly targets and of who holds the SBU Manager role, shown
  first; then migration 0062, written and tested in the worktree,
  applied to Dev only after the merge.
- Order (Basheer, 2026-10-20): take in `main` once Plan & Chore's 20 Oct
  docs commit is pushed. Only file shared with Build & Test:
  `sales-os-app/src/types/api.ts` — at the merge, regenerate it, don't
  merge it by hand. Once Plan & Chore's `api.ts` commit guard is on,
  commits that change routers or schemas must carry a fresh `api.ts`.
