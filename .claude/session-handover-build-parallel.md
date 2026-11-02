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
  - `1c1c78c` (2 Nov) — Target vs Actuals: tab row hides while a person's
    own screen is open, back on Back. Not seen in a browser; re-check with
    Fix 4 (390/768/1280); the card may sit close to the top edge (no gap
    added). `b01dcb0` brought `main` in (Progress-Archive clash kept both).
    tsc, ESLint and MUI check clean; lint 0 errors, 135 warnings.
  - `35e9156` (2 Nov) — Sales Report: dates line beside the period box
    ("Oct–Dec 2026" / "Nov 2026" / "All time"); boxes named "Period" and
    "Group by" (§6.11 rule 7). Drill-down banners untouched. Not seen in a
    browser; re-check at 390/768/1280 (header row with the labelled box).
    Pipeline Report has the same unnamed-box gap, left alone.
- **MUI round 1 Part 1:** steps 1–7 done and pushed (last `5c26ed3`);
  step 8 (21 "after" screenshots, before-and-after page, combined E2E)
  is Build & Test's. Plan: `docs/MUI-Good-Practice-Implementation-Plan.md`.
- Checks at `22e3526`: pytest 1,508 passed, tsc clean, lint 0 errors
  (135 warnings), MUI check 0 breaches in touched files.

## Next
- **Review done (2 Nov):** medium `/code-review` of `52e8397`…`35e9156`,
  ten findings, none taken (Progress-Archive 2 Nov). Checks: pytest 1,508
  passed, tsc clean, lint 0 errors; ruff's 2 E501 errors in
  `backend/tests/domains/reporting/test_reporting_service.py` (from
  `22e3526`) fixed in `a8e971f`; docs batch `52dbf90`. Basheer said go
  (2 Nov): `main` (`7d629bd`) merged into the branch as `1748b51`
  (Progress-Archive clash kept both, main's first); pytest 1,508 passed,
  ruff and tsc clean; branch pushed to `1748b51`. **Next:** `ExitWorktree`
  keep, merge into `main`, push, then `cabio-post-commit`. No migration.
  Dev backend restart needed (Overdue `is_active`).
- Still open from 1 Nov: check the "Me (default)" wording in Frontend
  standards and Process-Improvements (Backlog block "Found in MUI round 1
  steps 5–7"). Don't edit the E2E plans (Build & Test's).
- **After that:** build whatever Build & Test sends, each fix its own
  shown-first commit.
- **Merge to `main`:** only when Basheer says go (steps above). Dev
  backend restart needed before the Planning E2E too.
- **To tell Plan & Chore (via Basheer):** add ◀ and "← Back" to
  `check-mui-standard.js`; the commit check prints "no staged .ts/.tsx
  files" even when some are staged (seen again 2 Nov on both commits).
- **After the E2Es (Build & Test's):** `cabio-post-commit` paperwork
  (Traceability, scorecard, plan Status). User manual and in-app help
  wait for the UAT move (Simpler Table D8).
- **Earlier:** hospital next-action steps 1–5 merged (`dce73f5`); step 6
  (Dev E2E) belongs to `/test`.
- Migration number last chosen: none.
