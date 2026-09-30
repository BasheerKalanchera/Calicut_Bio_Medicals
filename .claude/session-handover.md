# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._



## Deal edit from customer/project page — UAT bug, parked 2026-09-30

- Parked by Basheer (wants a break). Plan with 4 open decisions:
  `docs/Opportunity-Edit-Via-Deal-Page-Hotfix-Plan.md`; Backlog entries
  for the bug and "Front-end consistency audit". Rep has the workaround.
- **Next:** when Basheer returns to it, get the 4 decisions, then build as
  a hotfix off `origin/uat`.

## Hospital-wise target planning — Part 1, plan steps 5–7

- Plan: `docs/Hospital-Wise-Target-Planning-Implementation-Plan.md`
  (approved 2026-09-27; section 8 updated to as-built). Design:
  `docs/Discussion-Hospital-Wise-Target-Planning-2026-09.md`.
- **Decided 2026-09-29 (Basheer), in the plan's Status line:** no UAT move
  until Part 2 is also finished; By Zone table → Part 2 (`/zone-rollup`
  backend kept); "Revised" label + live hospital count; **BR-PL-05**
  (warn when a revised plan is below its last approved total).
- Done: step 1 `e55c112`, step 2 `04c5e87`, step 3a `72564dc`, step 3b
  `467dee8`, step 3 (c) + 3d checkpoint (`git log --grep "3 (c) + 3d"`).
  Migration `0056` (`target_plan.previous_approved_total_lakhs`) applied
  to Dev 2026-09-29, `alembic current` = `0056 (head)`; Physical-Schema
  regenerated. UAT gets 0055 + 0056 with the Part 1+2 move.
- ₹0 warning follow-up `bfeef46` (BR-PL-06, `RATED_POTENTIAL_ZERO`);
  BR-PL-02/03 marked replaced `6a2c9ed`. 1054 pytest pass; tsc + lint
  clean; ruff clean on changed files (62 older errors in untouched files).
- Step 4 (rules and records) done 2026-09-29: BR-PL-07/08/09 + BR-ACC-04,
  matrix, ADR-013/002 notes, EDM, UI-Inventory, Backlog + older plans'
  pointers, Traceability notes for 6.1 and 5.1. **Traceability status
  stays as is until E2E passes, then straight to Done (Basheer option a)**
  — one client republish. UAT user manual has no section for this screen;
  write one with the Part 1+2 UAT move.
- Screen not yet clicked through on Dev.
- **Step 5 done 2026-09-30:** fix list `1a4843a`; medium `/code-review`
  of it found one race, fixed with a row lock `3907b88` (both pushed).
  1069 pytest pass; ruff/tsc clean; lint 0 errors. `src/types/api.ts`
  not regenerated (Dev backend was down; screen uses its own types).
- **Step 6 — E2E plan committed** (`git log --grep "E2E test plan"`):
  `docs/Hospital-Wise-Target-Planning-Manual-E2E-Test-Plan.md`, 38 steps
  in 2026-Q4, kept as written (Basheer). Dev check found Vivek's and
  Rudrappa's areas contain 0 hospitals (filed at zone level, above their
  districts). **Next: Basheer does setup step S1 after lunch
  2026-09-30** (re-file KIMS → Trivandrum, Test hospital 2 → Kollam,
  Test hospital 3 → Kottayam, as Admin); Claude then confirms read-only
  and marks S1 in the test plan.
- UAT filing check run early (approved): 85 of 432 hospitals at region
  level; Irfan has no area. Basheer chose Option A (re-file), **held
  until he discusses it with Haroon** — Part 2 plan, step 5. Also for
  that discussion (proposed, not decided): require a district or lower
  when a hospital is added/edited, so region-level filing stops
  recurring (4th occurrence; earlier ones in Progress-Archive
  2026-08-31, 2026-09-26).
- **Then:** E2E run (restart Dev backend first) → Traceability 6.1/5.1
  straight to Done (option a) → post-commit checklist.
- **API as built:** create/update body `{accounts[], brand_splits, submit,
  change_note}`; response `warnings` (`HIGH_POTENTIAL_ZERO`,
  `SAME_SBU_OVERLAP`) and `previous_approved_total_lakhs`; `GET
  /planning/targets/eligible-accounts`, `/overlaps`, `/zone-rollup`;
  `PATCH /accounts/{id}/business-potential`.
- Proposed, not decided: a CLAUDE.md line "Backlog holds only work outside
  the Traceability matrix".

## Hospital-wise target planning — Part 2 (plan versus actual)

- Plan approved 2026-09-29: `docs/Hospital-Wise-Target-Planning-Part2-Implementation-Plan.md`
  (Lighter build, ~3 days, no DB change; new rule BR-OP-16 Closing Date
  Passed). Split-credit question sent to Haroon 2026-09-29 — doesn't block.
- **Next:** build step 1 (backend endpoint + tests) once Basheer says start;
  Part 1's steps 5–7 run in parallel in the other session.

## Audit Trail Redesign — approved, waiting (planning session)

- Plan approved 2026-09-30 (`5b3da4e`):
  `docs/Audit-Trail-Redesign-Implementation-Plan.md`. Backlog entry
  "Audit Trail Redesign".
- **Next:** start build step 1 (migration) once hospital-wise Part 1
  step 5 is committed — ask Basheer first.

## Customer 360 Active-only Opportunities filter — decided 2026-09-30

- Basheer decided all points himself (not taken to Haroon):
  `docs/Discussion-Customer360-Open-Deals-Filter-2026-09.md` section 3.
- **Next:** short build plan; build after hospital-wise Part 1 has
  committed its Customer 360 changes.

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
