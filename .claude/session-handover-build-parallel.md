# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note. While a `/build` worktree exists, the live copy is the one in it, on
the build branch, and reaches `main` at the merge (Basheer, 2026-10-17)._

## NOW (27 Nov): no build in progress
- Sales Loss Report is on `main` and Dev (merge `c4de312`, migration 0069
  applied). Its E2E is Build & Test's (message sent 27 Nov 20:44). If they
  report a fault in the build, fix it as asked.
- **Next:** Basheer names the next plan to build. **Last migration number
  chosen: 0069.**
- Tests: main's interpreter from the worktree `backend/`; frontend
  `npx --prefix sales-os-app tsc --noEmit -p sales-os-app` and
  `npm --prefix sales-os-app run lint`.

## Carried over
- Pricing build (`ebd3bdd`, on `main` and Dev): the two client scorecard
  Artifacts are republished after the pricing E2E is done (Basheer, 19 Nov);
  show him the exact diff first. Haroon's pricing sheet (step 4) waits on him.
- **MUI round 1 Part 1:** steps 1–7 done; step 8 is Build & Test's. Plan:
  `docs/MUI-Good-Practice-Implementation-Plan.md`.
- Still open from 1 Nov: check the "Me (default)" wording in Frontend
  standards and Process-Improvements (Backlog block "Found in MUI round 1
  steps 5–7").
- **To tell Plan & Chore (via Basheer):** add ◀ and "← Back" to
  `check-mui-standard.js`; add the Sales Loss Report to the screens that
  need `?` help.
