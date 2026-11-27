# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note. While a `/build` worktree exists, the live copy is the one in it, on
the build branch, and reaches `main` at the merge (Basheer, 2026-10-17)._

## NOW (26 Nov): Sales Loss Report — built and reviewed; merge next
- Plan `docs/Sales-Loss-Report-Implementation-Plan.md` (Approved 25 Nov,
  D1–D21, D6a).
- Pushed to `origin/worktree-build`, not merged: `e783951` (migration
  **0069**), `14789d6`, `57c7e38`, `4d60caa`, review fixes `df6b2c1`.
  pytest 1819 passed / 10 skipped; ruff, tsc: pass; lint: 0 errors. Not
  seen in a browser.
- Docs batch committed and pushed, `07c1bdb` (BR-REP-01, rule matrix, user
  manual, help text line, E2E plan with step 5b, plan, archive).
- `main` brought into the branch 26 Nov, `f3d6e19` (up to `1852540`),
  pushed. On that: pytest 1818 passed / 10 skipped (main's Margin fix
  removed one test net); ruff, tsc pass; lint 0 errors.
- **27 Nov, evening:** Margin Report E2E finished and pushed; Build & Test
  asked for the merge (mailbox, 20:24), Basheer: proceed. `main` brought in
  again up to `94772b5` (one clash, progress archive, both sides kept);
  `api.ts` rebuilt, unchanged; pytest 1818 passed / 10 skipped; ruff, tsc
  pass; lint 0 errors.
- **Next:** commit that on the branch and push, then merge into `main` and
  push (each shown to Basheer first). Don't stage, stash or discard other
  sessions' work in the main folder.
- E2E cut-off Saturday 28 Nov, 6 pm; UAT move Sunday 29 Nov.
- **After the merge:** Basheer applies 0069 on Dev at once (command in
  `cabio-db-and-scripting`; the app loads the new column with every
  Opportunity); send Build & Test the merge commit once applied; regenerate
  `docs/Physical-Schema.sql`; `cabio-post-commit`. No UAT connection, and
  Build & Test runs the E2E:
  `docs/Sales-Loss-Report-Manual-E2E-Test-Plan.md` (33 steps, none run).
  Traceability only after it passes.
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
