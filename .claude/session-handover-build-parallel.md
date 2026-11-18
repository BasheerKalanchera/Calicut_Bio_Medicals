# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note. While a `/build` worktree exists, the live copy is the one in it, on
the build branch, and reaches `main` at the merge (Basheer, 2026-10-17)._

## In progress (18 Nov): Product pricing and cost — built, reviewed, docs batch waiting for his yes
- Plan `docs/Product-Pricing-And-Cost-Implementation-Plan.md` (Approved,
  D1–D15; only step 4, loading Haroon's pricing sheet, waits on him).
  E2E plan: `docs/Product-Pricing-And-Cost-Manual-E2E-Test-Plan.md`
  (P3 done; P4 data check still to do just before the E2E).
- Branch `worktree-build`, pushed to `b52c881`: steps 1–3 (`ed987f4`,
  `060eb3d`, `8ff9e20`), price-order check (`82cafba`, D15), bold fix
  (`b52c881`), MUI hook fix (`2dd873d`). Backend pytest 1621 pass; ruff,
  tsc, lint clean. Migration `0066` written, not applied (0065 is the head
  on `main`); apply to Dev only after the merge.
- **Docs batch written, not committed (18 Nov):** E2E plan, plan, Business-Rules
  (BR-CAT-01/04/05/06), matrix, Backlog (four follow-ups), Process-Improvements
  P106, Progress-Archive entry, this note. Still to do: show the retro in chat,
  write it to the archive, then show the commit (file list + message) and wait
  for his yes. Traceability rows 4.3, 11.1 and beyond-contract row 1 are
  client-visible: diff shown first, `cabio-post-commit` loaded first.
- **Open to ask Basheer:** the competitor placeholder "GE LOGIQ P9" in
  `OpportunityItemAddRow.tsx` (~line 131) breaks the SonoScape example rule.
- **Next, only on Basheer's go:** merge. Bring `main` in (expect clashes in
  `api-aliases.ts` and the archive; `176ec74` touches
  `OpportunityDetailScreen.tsx`, `QuickLeadModal.tsx`), rebuild `api.ts`,
  re-run tests, push, `ExitWorktree` with `keep`, merge to `main`, apply
  `0066` to Dev, regenerate `docs/Physical-Schema.sql`, `cabio-post-commit`.
  Then `/test` runs the E2E.
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
