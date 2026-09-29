# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

DUE TODAY (from 2026-09-29 morning, Basheer asked): **guard-rail setup for
implementation plans**. Put it in the 'Due today' list in your first reply
and wait for Basheer's answer. Choose lighter (plan template + Decisions
section, checked by the doc tidy-up) or heavier (plus a save-time check
refusing "Approved" while any decision is "proposed"). Background:
Progress-Archive 2026-09-28 "Session retrospective (evening…)". Remove
this block once decided.

REMINDER (Basheer, 2026-09-28): **the UAT data-quality check script needs
updating.** The 2026-09-27 UAT move brought more tables that users can get
wrong; the check must also surface inconsistencies in those, alongside the
usual checks. Raise this when the UAT data-quality check next comes up as
due; before proposing changes, list which tables reached UAT in that move
(`docs/UAT-Promotion-2026-09-Plan.md`) and what the script covers today.


## Hospital-wise target planning — Part 1, step 3 (c) and 3d

- Plan: `docs/Hospital-Wise-Target-Planning-Implementation-Plan.md`
  (approved 2026-09-27; section 8 updated to as-built). Design:
  `docs/Discussion-Hospital-Wise-Target-Planning-2026-09.md`.
- **Decided 2026-09-29 (Basheer), written into the plan's Status line:**
  checkpoint on track, no fallback; **no UAT move until Part 2 is also
  finished** (team plans Oct–Dec in the brand-wise screen meanwhile); By
  Zone table → Part 2 (`/zone-rollup` backend kept as Part 2 work done
  early); keep "Revised" label + live hospital count (counted on screen,
  not stored); new rule **BR-PL-05** (option A: warn when a revised plan
  is below its last approved total, approver sees both) → step 3d.
- Done + pushed: step 1 schema `e55c112` (Dev at `0055 (head)`), step 2
  backend `04c5e87`, step 3a `72564dc`, step 3b `467dee8`.
- 29 Sep decisions committed + pushed `d200818`.
- **Next: build plan for (c) + 3d shown to Basheer 2026-09-29, awaiting his
  "start"** (paused, he's travelling to Calicut):
  - **(c)**, screen only: "Needs Your Approval" rows get a chevron →
    expanded row renders `TargetPlanDetails` (hospitals, brand split, change
    note); "Hospitals" count column (`t.accounts.length`, not stored);
    outlined "Revised" chip when `t.change_note` — **approval queue only**
    (the note persists after approval, so in the team list it would stick
    forever). Team list, quarterly view: chevron + count; annual view
    unchanged. No `getZoneRollup` query. `expanded: Set<string>` state,
    `IconButton` with `aria-expanded`, `colSpan` detail row.
  - **3d (BR-PL-05)**: migration `0056` adds
    `target_plan.previous_approved_total_lakhs NUMERIC(15,2) NULL` (Dev
    only; UAT with the Part 1+2 move). `update_target_plan`: *before*
    overwriting the total, `if status == "APPROVED"` store the old total;
    re-revising a PENDING/REJECTED plan keeps it. Approve clears it; reject
    keeps it; drafts never get it. Add to `TargetPlanResponse`, regenerate
    `types/api.ts`. 3 service tests (set on revise, kept on second revise,
    cleared on approve / kept on reject). No backend warning kind: the
    dialog computes the benchmark live (`existing.status === "APPROVED" ?
    target_amount_lakhs : previous_approved_total_lakhs`) and shows a
    yellow Alert "₹X L below your approved target of ₹Y L — add hospitals";
    Submit still allowed. Approval row shows "₹32 L (was ₹40 L)" in warning
    colour; `TargetPlanDetails` shows "Last approved target".
  - Order: 3d backend (migration applied to Dev + recorded,
    Physical-Schema regenerated, tests) → frontend (c) + 3d → pytest, ruff,
    tsc, lint → **propose checkpoint commit** → plan steps 4–7
    (`/code-review` high, E2E plan, E2E). About a day for the first three.
- **Part (c) on disk, uncommitted, reviewed 2026-09-28:** new
  `components/TargetPlanDetails.tsx` (expanded-row panel), new
  `utils/visitFrequency.ts`, `TargetPlanDialog.tsx` imports it.
  `TargetPlanningScreen.tsx` untouched. The previous session's
  `edit_part_c.py` (its scratchpad `0312416c-…`) is a reference only —
  drop its By Zone table; keep its Revised chip and count. tsc not yet
  run on the on-disk changes.
- **Part 2 note:** zone = hospital's zone (as `/zone-rollup` groups) or
  the planner's zone — decide when writing Part 2's plan.
- Proposed, not decided: a CLAUDE.md line "Backlog holds only work outside
  the Traceability matrix". Visit-compliance reports (PRD A.3.1 etc.) are
  not in Traceability → out of scope, no Backlog entry (Basheer).
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
  - **Next:** (c) and 3d — see "Next" above. Then plan steps 4–7.
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
