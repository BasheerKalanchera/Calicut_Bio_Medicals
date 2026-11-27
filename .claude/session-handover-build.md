# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Reminders
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).
- UAT runs `0756234`, database at 0065 (moved 10 Nov, `c1d3c90`). UAT fixes
  ahead of a full promotion go by the hotfix-branch route
  (`docs/Deployment-Topology.md` "Fix to UAT ahead of a full promotion").

## UAT move, Sunday 29 Nov early morning (Basheer, 27 Nov)
- Full move, replacing the date picker hotfix (its uncommitted plan was deleted,
  Basheer yes, 27 Nov). Includes the date fix `ba67000` (E2E 13 of 13).
- He wants Margin Report and Sales Loss Report E2E finished by Saturday 28 Nov.
  **Decided (Basheer, 27 Nov):** cut-off Saturday 6 pm, a report goes only if all
  its steps pass (Sales Loss only if Margin goes: `0069` follows `0068`); Plan &
  Chore writes the move plan (Basheer pastes the request there).
  **Open:** header name `2ac7f25` on UAT or not (he asked what is wrong with it).
- Move plan must cover: price sheet load before `0068` (Margin D12); load script
  was only in an old scratchpad (`dev_price_load.py`); sheet has Cost blank.
- Order: Margin E2E, then merge `worktree-build` (conflict in the progress
  archive only, dry run 27 Nov), Basheer applies `0069` on Dev, SLR E2E (37 steps).

## NEXT — Margin Report E2E, resume at step 13
**First:** Basheer restarts the Dev backend. 37 steps left, due Saturday 6 pm.
Plan `docs/Margin-Report-Implementation-Plan.md` (Approved, D1–D21; build order
complete). E2E plan `docs/Margin-Report-Manual-E2E-Test-Plan.md`.
- **Pushed:** D19–D21 changes `1852540` (26 Nov; pytest 1788 passed / 10
  skipped, ruff, tsc clean, lint 0 errors). Earlier build commits: the E2E
  plan's "Built:" lines.
- **E2E:** section A done — P1–P4 and steps 1–12 (incl. 11a) Pass, 17 of 54.
  **Next: step 13** (login Basheer K, saves to Dev: Basheer clicks, Claude
  watches). Confirm the Dev backend is current before starting.
- **First seen at E2E:** the Won/Lost products screens (steps 21–26, 30–31, 35;
  also re-read the other two pop-up modes in `CloseReminderModal.tsx`) and the
  Dev cost copy on a newly Won Opportunity. Phone header and one-line totals
  card: check by eye at step 36 (may wrap; review estimate, not measured).
- **Open questions to Basheer:** (1) rows' Quantity — proposed keep in Product
  view only; (2) accept that a click may list more Opportunities than the
  figures count (rows and no-cost list), then add to D20.
- **Small-fixes batch:** Activity Note writes "₹12.00 L", screens "₹12.00L"
  (proposed, not answered).
- **After the E2E:** post-commit checklist (Backlog entry, Traceability row
  11.1, scorecard).
- Margin plan, E2E plan and archive sections pushed in `fe8038a` (26 Nov).
- Leave `scripts/uat_case_study_scan.py` and the Plan & Chore note alone.

**Other open:** (a) plan D11 wording (Plan & Chore's batch; the rolled-back test was
his 21 Nov choice); (b) fix E2E plan wording at 9b and step 21; (c) UAT with the
next full move (D9): needs his yes for the UAT people check, Haroon to be told
about D5, and the 13 products switched off from the screen once it is on UAT;
(d) after the pricing deploy to UAT, Basheer times `weekly-followup` in F12
Network. Backlog has "Show who a Manager Note is for", and the Dev test product
"EDAN iM91 Test ECG Machine" to deactivate when convenient (now possible).

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Other deferred items live in the Backlog.
