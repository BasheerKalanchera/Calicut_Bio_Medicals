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
- **Next (resume here, 2026-09-28):** step 3, the frontend. First read
  `docs/Frontend-Implementation-Standards.md`, then show Basheer a
  plain-language plan and wait for approval before editing. Scope (plan
  section 8 "Frontend"): new plan dialog in `TargetPlanningScreen.tsx`
  (hospital table, live total, warnings, brand split, change note, Save
  draft / Submit), approver view showing hospitals + change note,
  team/zone view, new `RateHospitalsScreen.tsx` (Admin/GM), rating chip
  on `Customer360Screen.tsx`. MUI only.
- **API as built** (differs slightly from the plan's first draft): create/
  update body `{accounts[], brand_splits, submit, change_note}`; response
  field is `warnings` (kinds `HIGH_POTENTIAL_ZERO`, `SAME_SBU_OVERLAP`);
  new `GET /planning/targets/eligible-accounts`, `/overlaps`,
  `/zone-rollup`; `PATCH /accounts/{id}/business-potential`.
- **Known gap:** Dev Target Planning screen can't save targets until step
  3 lands (accepted by Basheer).
- **First thing next session:** confirm the stash guard-rail hook no longer
  errors after a `cd backend` (fix `89779d1` applies from session start).
