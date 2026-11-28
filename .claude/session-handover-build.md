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
  Header name `2ac7f25` is kept and goes to UAT (Basheer, 27 Nov).
- Move plan must cover: price sheet load before `0068` (Margin D12); load script
  was only in an old scratchpad (`dev_price_load.py`); sheet has Cost blank.

## NEXT — Sales Loss Report (due Saturday 28 Nov, 6 pm)
Margin Report is finished and qualifies for Sunday's move (56 of 56; docs batch
`37eaf93` pushed 27 Nov).
- Merged and pushed (`c4de312`); `0069` applied to Dev and
  `Physical-Schema.sql` regenerated (`cd65a5b`, 27 Nov). Seen in git 28 Nov.
- E2E (`docs/Sales-Loss-Report-Manual-E2E-Test-Plan.md`) parked 28 Nov 11:25 at
  32 of 37 (steps 1–27 pass; pytest 1818 passed, 10 skipped; ruff, tsc clean;
  lint 0 errors).
- Step 1 done: step-9 fixes (D22, D23) committed and pushed, `bcdc054`, 28 Nov
  (pytest 1818 passed, 10 skipped; ruff, tsc clean; lint 0 errors). Hidden SBU
  box not yet checked (steps 29, 30).
- Step 2 done: tabs and tighter layout (D24–D27) committed and pushed,
  `fc47b6d`, 28 Nov (tsc clean; lint 0 errors). Basheer looked on Dev and
  liked it. Plan updated (not committed).
- Step 3 done: test plan rewritten for the tabs and layout, "First activity"
  pop-up added to steps 1, 5, 8 (28 of 37 pass; not committed).
- **Step 4 done:** E2E **38 of 38 pass**, 28 Nov (step 32 corrected: a
  Marketing User has no Reports menu). Sales Loss Report qualifies for Sunday.
- Pushed 28 Nov 16:36: `b783977` (Total line, D28) and `09860bf` (small
  fixes). Before them: pytest 1818 passed, 10 skipped; ruff, tsc clean;
  lint 0 errors. Zone zoom: left as is, in Backlog.
- Post-commit done 18:15: both 1.4 rows Done (Basheer yes), scorecard
  regenerated, `--check` OK (42/6/1); Product view in Backlog; message to Plan
  & Chore sent. Client pages: republish after Sunday's move (UAT plan D9),
  diff shown first.
- **Now:** docs batch waiting for Basheer's yes — this note, Sales Loss plan
  and test plan, Progress-Archive, Backlog, Process-Improvements (P114),
  Traceability, Scorecard, two `.scratch` scorecard pages. Check shared files'
  staged content first. Retro written about 11:25; add an addendum.
- Plan & Chore's move plan: `docs/UAT-Promotion-2026-11-29-Plan.md` (read it,
  don't edit).
- `b`/`bt`/`pc` no longer set `MSYS_NO_PATHCONV` (seen in the files, 27 Nov); a
  session started before that still needs `env -u MSYS_NO_PATHCONV git commit`.
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
