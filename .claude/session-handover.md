# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._



## UAT hotfix: Opportunity edit via its own page + Customer 360 Active-only filter — push in the morning

- Plans: `docs/Opportunity-Edit-Via-Deal-Page-Hotfix-Plan.md`,
  `docs/Customer360-Active-Opportunities-Filter-Implementation-Plan.md`.
  Test plan: `docs/Opportunity-Edit-Hotfix-and-Active-Filter-Manual-E2E-Test-Plan.md`
  — Dev steps 1–16 pass 2026-10-01.
- Committed `a430152` on branch `hotfix/opportunity-edit-via-deal-page`
  (worktree `.claude/worktrees/hotfix`, off `origin/uat` `143c78e`; its
  `sales-os-app/node_modules` is a junction to main's, `.env` copied).
  Safety copy pushed to GitHub under its own branch name 2026-10-01 (not
  `uat`). **Not on UAT:** Basheer wants it there in the quiet morning hours.
- **Next (2026-10-02 morning, ask first):** `git fetch`; confirm
  `origin/uat` is still `143c78e`; `git push origin
  hotfix/opportunity-edit-via-deal-page:uat` (fast-forward; host
  redeploys UAT) → Basheer runs step 17 on UAT → merge `uat` into `main`
  (expect conflicts in `Customer360Screen.tsx`), re-check on Dev, push →
  post-commit checklist (filter: leadership "Requested" item 2 → built,
  scorecard regen + republish; Backlog entries for both close) → remove
  the worktree. Each commit/push its own approval.

## Session retro 2026-10-01 + structural fixes — parked by Basheer

- Retro drafted in chat 2026-10-01, **not yet approved or saved**. Main
  points: hospital-wise Part 1 done; UAT hotfix built and Dev-tested; most
  mistakes broke existing CLAUDE.md rules (test-plan live-data check,
  Simple/Complex tagging, "Basheer clicks" for Dev writes, verify before
  claiming); only the no-`cd` hook actually stopped a mistake.
- **Next (2026-10-02):** re-show the retro for approval, then build the
  fixes in Backlog "Structural guards for repeated test-plan mistakes"
  (Basheer: tomorrow, instead of adding more CLAUDE.md text).

## Hospital-wise target planning — Part 2 (plan versus actual)

- Part 1 finished 2026-10-01 (E2E 38/38, scorecard Done; Progress-Archive
  2026-10). UAT move waits for Part 2: migrations 0055 + 0056, plus the
  manual/help update (Backlog). Hospital
  re-filing on UAT (Option A) held until Basheer talks
  to Haroon — Part 2 plan, step 5.
- Close dates for the 37 deals closed before 27 Sep: proposed dates sent
  to Haroon 2026-10-01 (Backlog "UAT: fill in missing 'date closed'").
  Apply his answers, then fill in on UAT with or before the Part 1+2 move
  (UAT write: own approval, Basheer runs it).
- Plan approved 2026-09-29: `docs/Hospital-Wise-Target-Planning-Part2-Implementation-Plan.md`
  (Lighter build, ~3 days, no DB change; new rule BR-OP-16 Closing Date
  Passed). Split-credit question sent to Haroon 2026-09-29 — doesn't block.
- **Next:** build step 1 (backend endpoint + tests) once Basheer says start.

## Audit Trail Redesign — approved, waiting (planning session)

- Plan approved 2026-09-30 (`5b3da4e`):
  `docs/Audit-Trail-Redesign-Implementation-Plan.md`. Backlog entry
  "Audit Trail Redesign".
- **Next:** start build step 1 (migration) — unblocked (hospital-wise
  Part 1 finished 2026-10-01); ask Basheer first.

## Forecast by closing period — questions answered 2026-10-01

- Latheef Bhai's request (Traceability 2.5, month/quarter half):
  `docs/Discussion-Forecast-By-Closing-Period-2026-09.md` — all questions
  decided except Q4, parked until reps correct Expected Closure Dates
  (only 3 of 112 open Opportunities had a future date). Common
  Opportunity filter, lighter option; rule in both standards docs.
- Date catch-up: `scripts/uat_closure_date_report.py`, run with the
  data-quality check; first report sent to leadership 2026-10-01.
- **Next:** write the implementation plan when Basheer says; watch the
  closure report's progress.
