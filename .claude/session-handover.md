# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._



## Deal edit from customer/project page — UAT bug, parked 2026-09-30

- Parked by Basheer (wants a break). Plan with 4 open decisions:
  `docs/Opportunity-Edit-Via-Deal-Page-Hotfix-Plan.md`; Backlog entries
  for the bug and "Front-end consistency audit". Rep has the workaround.
- **Next:** when Basheer returns to it, get the 4 decisions, then build as
  a hotfix off `origin/uat` — together with the Customer 360 Active-only
  filter (Basheer, 2026-09-30).

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

## Customer 360 Active-only Opportunities filter — decided 2026-09-30

- Plan approved 2026-09-30:
  `docs/Customer360-Active-Opportunities-Filter-Implementation-Plan.md`.
  Built with the deal-edit quick fix above, same branch, in a separate
  git worktree off `origin/uat`.
- **Next:** build waits for the quick fix's 4 decisions (Part 1's E2E
  run finished 2026-10-01); first build check is in the plan's technical addendum.

## Forecast by closing period — discussion started 2026-09-30

- Client asked (2026-09-30) to filter pipeline projections, weighted and
  unweighted, by period (this month … FY end, total) for cash flow and
  purchase-order planning. This is the unbuilt month/quarter half of
  Traceability 2.5; Part 2 (plan versus actual) doesn't cover it.
- Doc: `docs/Discussion-Forecast-By-Closing-Period-2026-09.md`, 8 questions,
  none decided.
- **Next:** go through the questions with Basheer, starting with Q2 (does
  "next quarter" mean up to 31 March or only Jan–Mar? to confirm with the
  client).
