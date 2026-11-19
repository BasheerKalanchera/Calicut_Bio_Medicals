# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note. While a `/build` worktree exists, the live copy is the one in it, on
the build branch, and reaches `main` at the merge (Basheer, 2026-10-17)._

## In progress (19 Nov): Product pricing and cost — merged to `main` and on Dev; E2E is Build & Test's
- Plan `docs/Product-Pricing-And-Cost-Implementation-Plan.md` (Approved,
  D1–D15; only step 4, loading Haroon's pricing sheet, waits on him).
  E2E plan: `docs/Product-Pricing-And-Cost-Manual-E2E-Test-Plan.md`
  (P4 data check still to do just before the E2E).
- Merged to `main` as `ebd3bdd` (19 Nov, pushed; branch `worktree-build` was
  at `5eea106`). Migration `0066` applied to Dev by Basheer, `alembic current`
  = `0066 (head)`; schema file `290386a`. Backend pytest 1621 pass; tsc, lint
  (0 errors), MUI check clean. The worktree `.claude/worktrees/build` is kept,
  finished; its own copy of this note is stale — this one is live.
- Paperwork committed and pushed on `main` as `43a2feb` (plan, E2E plan,
  Traceability wording, scorecard files, archive entry, this note).
- Build & Test told it landed (19 Nov, via Basheer).
- **Next:** nothing to build. The two client scorecard Artifacts are
  republished **after the pricing E2E is done** (Basheer, 19 Nov): show him
  the exact diff first, then publish. Then this session waits for the next
  approved plan; Haroon's sheet (step 4) waits on him.
- "GE LOGIQ P9" hint in `OpportunityItemAddRow.tsx` stays (Basheer, 18 Nov).
- Tests: main's interpreter from the worktree `backend/`; frontend
  `npx --prefix sales-os-app tsc --noEmit -p sales-os-app` and
  `npm --prefix sales-os-app run lint`.

## Carried over
- **MUI round 1 Part 1:** steps 1–7 done; step 8 is Build & Test's. Plan:
  `docs/MUI-Good-Practice-Implementation-Plan.md`.
- Still open from 1 Nov: check the "Me (default)" wording in Frontend
  standards and Process-Improvements (Backlog block "Found in MUI round 1
  steps 5–7").
- **To tell Plan & Chore (via Basheer):** add ◀ and "← Back" to
  `check-mui-standard.js`.
