# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._



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
- **Step 5 — fix list agreed 2026-09-30, not yet built.** `/code-review`
  high ran 2026-09-29. Basheer answered all 4 questions; the agreed fixes
  (no database change) are in the plan's section 4, step 5, and its
  Decisions list. Deferred items went to Backlog. **Parked 2026-09-30
  for an emergency UAT fix — Basheer still has to say "go" before any
  code edits.**
- **After fixes:** pytest/ruff/tsc/lint → propose commit → written E2E plan
  (checked against live Dev data, Simple/Complex tags) → E2E (restart Dev
  backend first) → Traceability 6.1/5.1 straight to Done (option a) →
  post-commit checklist.
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

## Customer 360 open-deals filter — discussion in progress (parallel session)

- Doc: `docs/Discussion-Customer360-Open-Deals-Filter-2026-09.md` (committed `135df42`).
- Next: Basheer picks (a) decide points 1–5 himself, or (b) take 1–3 to Haroon.
  Point 3 revised to "remember while going into a deal and back, reset on
  leaving the customer". Points 4 (heading shows "3 open · 12 closed") and 5
  (empty state "No open deals — show N closed") still to be added to the doc.
