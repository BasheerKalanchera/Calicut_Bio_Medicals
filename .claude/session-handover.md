# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._


## Hospital-wise target planning — Part 1, steps 1–2 done; step 3 next

- Plan: `docs/Hospital-Wise-Target-Planning-Implementation-Plan.md`
  (approved 2026-09-27; section 8 updated to as-built). Design:
  `docs/Discussion-Hospital-Wise-Target-Planning-2026-09.md`.
- **Deadline:** on UAT around 2 Oct 2026. **Fallback decision 29 Sep** —
  the plan says use the fallback if step 3 isn't well under way by then.
- Done: step 1 schema `e55c112` (Dev at `0055 (head)`), step 2 backend
  `04c5e87`. Both pushed. Detail: Progress-Archive 2026-09-27 "Part 1
  steps 1–2".
- **Step 3 (frontend) in progress, plan approved by Basheer 2026-09-28**,
  split into three parts (a) (b) (c):
  - (a) done, tsc clean, committed + pushed as the "step 3a" checkpoint
    (`git log --grep "step 3a"`): `types/api.ts` regenerated
    (offline from `app.openapi()`, backend wasn't running),
    `services/accounts.ts` (rating filter + `setBusinessPotential`),
    new `utils/businessPotential.ts`, `components/BusinessPotentialChip.tsx`,
    `screens/RateHospitalsScreen.tsx` (Admin/GM nav entry in `DemoApp.tsx`),
    rating chip + Admin/GM notes on `Customer360Screen.tsx`.
  - (b) done, tsc/lint clean: new `components/TargetPlanDialog.tsx`
    (hospital picker, rows, live total, High-at-₹0 + overlap warnings,
    brand split vs live total, change note, Save draft / Submit),
    `FormModal` `maxWidth` + `secondaryAction`, planning types/services,
    old single-amount dialog removed from `TargetPlanningScreen.tsx`.
  - Draft rule (Basheer, 2026-09-28): balanced brand split and total >
    ₹0 enforced on Submit only, not Save draft -- backend service + 6 tests
    (1045 pass) and the dialog both changed.
  - Screen renamed **Target & Coverage Planning** (Basheer, 2026-09-28;
    signed req. 6.1 "Basic Beat Planning" = coverage planning). Menu +
    header + dialog title done; living docs that name the *screen*
    (UI-Inventory, UAT user manual, Traceability 6.1) get updated in plan
    step 4.
  - **Next:** (c) approver expandable rows + team rows + By Zone table.
    Then plan steps 4–7.
- **API as built** (differs slightly from the plan's first draft): create/
  update body `{accounts[], brand_splits, submit, change_note}`; response
  field is `warnings` (kinds `HIGH_POTENTIAL_ZERO`, `SAME_SBU_OVERLAP`);
  new `GET /planning/targets/eligible-accounts`, `/overlaps`,
  `/zone-rollup`; `PATCH /accounts/{id}/business-potential`.
- **Known gap closed by (b):** Target Planning on Dev saves hospital-wise
  plans again (not yet clicked through; E2E is plan step 6).
- **First thing next session:** confirm the stash guard-rail hook no longer
  errors after a `cd backend` (fix `89779d1` applies from session start).

## Customer 360 open-deals filter — discussion in progress (parallel session)

- Doc: `docs/Discussion-Customer360-Open-Deals-Filter-2026-09.md` (committed `135df42`).
- Next: Basheer picks (a) decide points 1–5 himself, or (b) take 1–3 to Haroon.
  Point 3 revised to "remember while going into a deal and back, reset on
  leaving the customer". Points 4 (heading shows "3 open · 12 closed") and 5
  (empty state "No open deals — show N closed") still to be added to the doc.
