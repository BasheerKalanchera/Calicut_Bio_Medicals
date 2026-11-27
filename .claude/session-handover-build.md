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
  Header name `2ac7f25` is kept and goes to UAT (Basheer, 27 Nov; Backlog).
- Move plan must cover: price sheet load before `0068` (Margin D12); load script
  was only in an old scratchpad (`dev_price_load.py`); sheet has Cost blank.
- Order: Margin E2E, then merge `worktree-build` (conflict in the progress
  archive only, dry run 27 Nov), Basheer applies `0069` on Dev, SLR E2E (37 steps).

## NEXT — Margin Report post-commit paperwork, then Sales Loss Report
Margin Report: E2E 56 of 56 Pass (27 Nov); `7469ece` (D22–D25) and `dc9c5d8`
(D27) pushed. Qualifies for Sunday's UAT move.
- Post-commit documents updated 27 Nov (check git log for the docs commit): 4.3 and 11.1 Done,
  scorecard 40 of 49, `--check` OK. **Waiting on Basheer's yes:** republish the
  two client scorecard pages.
- **Then:** docs batch (own yes; includes the earlier date-picker retro
  addendum), merge `worktree-build`, `0069` on Dev, SLR E2E. Due Saturday 6 pm.
  Plan & Chore's move plan: `docs/UAT-Promotion-2026-11-29-Plan.md` (read it,
  don't edit).
- **Open:** sessions started by `b`/`bt`/`pc` inherit `MSYS_NO_PATHCONV=1`, so
  the api.ts commit guard fails on backend commits; worked round with
  `env -u MSYS_NO_PATHCONV git commit`. Sent to Plan & Chore to fix (Basheer,
  27 Nov); until this session restarts, keep using the work-round.
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
