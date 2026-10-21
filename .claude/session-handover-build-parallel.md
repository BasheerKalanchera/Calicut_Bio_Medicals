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
  `worktree-build`, no code on it yet; last commit `1340e25` (docs
  batch), pushed to `origin/worktree-build`. Migration number last chosen:
  **0062** (`main`'s latest is 0061, checked 2026-10-17).
- Frontend packages installed with `npm ci --legacy-peer-deps` (a plain
  `npm install` fails; Backlog "`sales-os-app` has a real
  `typescript`/`openapi-typescript` peer dependency conflict").
- Merge into `main`: once, at the end of the build, after Build & Test's
  Next-Action E2E (D22, section H) is done and Basheer says go (Basheer,
  2026-10-17, 2026-10-20).

## Bringing `main` in first (Plan & Chore, Basheer's yes 2026-10-21)
- On 20 Oct the approval below was written into the main-folder copy of
  this note by mistake (`92cab23`, `006f4cb`); that copy is now a frozen
  pointer. This copy was brought up to date on 21 Oct, uncommitted.
- So: commit this note on the branch first (shown to Basheer), then
  `git merge main`. It will clash on this note only — keep this copy
  (`git checkout --ours .claude/session-handover-build-parallel.md`).

## Annual Target Planning — next to build
- Plan **approved 2026-10-20** (D1–D56),
  `docs/Annual-Target-Planning-Implementation-Plan.md`. The 16 Oct
  version (D1–D22a) is superseded; build from its section 2.
- Build **Part 1 first** (steps 1–4): brand yearly figure, stretch and
  seasonal split saved as brand quarters; SBU target = brands' total
  (typed SBU target table removed, D55); Team targets panel; "Your
  target" line; month labels. Part 1 goes to UAT with the full UAT move
  (D52); Part 2 (steps 5–7) later.
- E2E test plan for Part 1: being rewritten by Plan & Chore; the E2E runs
  on Dev after the merge (Build & Test or `/test`), never alongside
  another test.
- The two step-1 proposals from 17 Oct (a removal rule on a yearly SBU
  target table, was D13; change history on that table) look moot: D13
  was withdrawn 2026-10-19 and D53/D55 make the SBU target the brands'
  total, typed by no one. Check against section 2; don't treat them as
  open or as decided — ask Basheer if the plan leaves doubt.
- **Next:** merge `main` (above), then step 1 — check in first:
  read-only Dev count of brand and SBU quarterly targets and of who
  holds the SBU Manager role, shown first; then migration 0062, written
  and tested in the worktree, applied to Dev only after the merge.
- Only file shared with Build & Test: `sales-os-app/src/types/api.ts` —
  at the merge, regenerate it, don't merge it by hand.
- api.ts guard on (`5ca17aa`, 20 Oct): each backend commit carries an
  api.ts made with
  `sh C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/.githooks/check-api-types.sh --write`.
