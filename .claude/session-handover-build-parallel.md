# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note. While a `/build` worktree exists, the live copy is the one in it, on
the build branch, and reaches `main` at the merge (Basheer, 2026-10-17)._

## State on 1 Nov: fixes pushed on `worktree-build`, NOT merged
- **Merged into `main` earlier (`515a2f2`):** Tabs screen, Target vs
  Actuals Simpler Table, hospital next-action rule. Worktree kept.
- **Pushed on the branch since, not merged (Build & Test is mid-E2E,
  17 of 41 — merge only when Basheer says go):**
  - `30766c7`, `8d0d0b3` — Planning tabs fixes D12–D16 (opening tab =
    Needs Your Approval whenever anything waits, any period/SBU).
    `/code-review` medium done 1 Nov (8 findings, 1 fixed).
  - `52e8397` — Target vs Actuals wording: SBU row named, "No approved
    plan", arrow hover text. Re-check A2, B2, B6.
  - `f2b72c6` — Target vs Actuals Fix 4: a person's own screen opens at
    the top, hides the card header, name row sticky. Re-check Fix 4 at
    390/768/1280. Not seen in a browser.
  - `22e3526` — Insights Overdue tab: headings once, block per person on
    a phone, inactive accounts marked; server `is_active` flag; `api.ts`
    regenerated; no migration. Re-check D9, D10 (390/768/1280) and the My
    Work links in D4–D6.
- **MUI round 1 Part 1:** steps 1–7 done and pushed (last `5c26ed3`);
  step 8 (21 "after" screenshots, before-and-after page, combined E2E)
  is Build & Test's. Plan: `docs/MUI-Good-Practice-Implementation-Plan.md`.
- Checks at `22e3526`: pytest 1,508 passed, tsc clean, lint 0 errors
  (135 warnings), MUI check 0 breaches in touched files.

## Next
- **Docs batch and retro done (1 Nov evening)**, committed right after
  `22e3526`: plan Status lines, Backlog, Progress-Archive-2026-11 (retro: 2
  corrections). Still open from it: check the "Me (default)" wording in
  Frontend standards and Process-Improvements (Backlog block "Found in
  MUI round 1 steps 5–7"). Don't edit the E2E plans (Build & Test's).
- **Tomorrow:** E2E testing and fixes continue; build whatever Build &
  Test sends, each fix its own shown-first commit.
- **Merge to `main`** only when Basheer says go: bring `main` in, re-run
  tests, push, `ExitWorktree` keep, merge, push, `cabio-post-commit`.
  Dev backend restart needed before the Planning E2E and for the Overdue
  `is_active` change.
- **To tell Plan & Chore (via Basheer):** add ◀ and "← Back" to
  `check-mui-standard.js`; the commit check prints "no staged .ts/.tsx
  files" even when some are staged.
- **After the E2Es (Build & Test's):** `cabio-post-commit` paperwork
  (Traceability, scorecard, plan Status). User manual and in-app help
  wait for the UAT move (Simpler Table D8).
- **Earlier:** hospital next-action steps 1–5 merged (`dce73f5`); step 6
  (Dev E2E) belongs to `/test`.
- Migration number last chosen: none.
