# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._



## Hospital-wise target planning — Part 1, plan steps 4–7

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
- 1051 pytest pass; tsc + lint clean; ruff clean on changed files (62
  older errors in untouched files: old migrations, `opportunity/router.py`,
  `reporting/router.py`, `asset/service.py`, `opportunity/validators.py`).
- Screen not yet clicked through on Dev.
- **Next: plan step 4** (living docs that name the screen — UI-Inventory,
  UAT user manual, Traceability 6.1 — renamed **Target & Coverage
  Planning**; BR-PL-05 wording check), then `/code-review` high on the
  Part 1 commits, written E2E plan, E2E (restart Dev backend first).
- **API as built:** create/update body `{accounts[], brand_splits, submit,
  change_note}`; response `warnings` (`HIGH_POTENTIAL_ZERO`,
  `SAME_SBU_OVERLAP`) and `previous_approved_total_lakhs`; `GET
  /planning/targets/eligible-accounts`, `/overlaps`, `/zone-rollup`;
  `PATCH /accounts/{id}/business-potential`.
- **Part 2 note:** zone = hospital's zone (as `/zone-rollup` groups) or
  the planner's zone — decide when writing Part 2's plan.
- Proposed, not decided: a CLAUDE.md line "Backlog holds only work outside
  the Traceability matrix".

## Customer 360 open-deals filter — discussion in progress (parallel session)

- Doc: `docs/Discussion-Customer360-Open-Deals-Filter-2026-09.md` (committed `135df42`).
- Next: Basheer picks (a) decide points 1–5 himself, or (b) take 1–3 to Haroon.
  Point 3 revised to "remember while going into a deal and back, reset on
  leaving the customer". Points 4 (heading shows "3 open · 12 closed") and 5
  (empty state "No open deals — show N closed") still to be added to the doc.
