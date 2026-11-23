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

## NOW (23 Nov) — Manager Note privacy: built and pushed, E2E next (plan: `docs/Manager-Note-Privacy-Implementation-Plan.md`, Approved 20 Nov)
**Pushed:** `dac003f` (21 Nov, migration 0067, Dev `alembic current` = `0067 (head)`),
`d7defb0` (22 Nov, automated Dev check, `RUN_DEV_DB_TESTS=1`), `ee5be3f` (23 Nov, `fix:`
Activity Levels no longer counts Manager Notes), `320981e` (23 Nov, `test:` reminder
holder D5 and peer Area Manager). 10 passed on Dev; full pytest 1622 passed, 10 skipped;
ruff clean. Partial: E2E not run, so no post-commit checklist, Traceability or scorecard.
**Pre-E2E `/code-review` (high):** findings 1 and 6 fixed; 2, 3, 5 left; 4 is a watch
line in E2E step 8. **E2E plan** `docs/Manager-Note-Privacy-Manual-E2E-Test-Plan.md`: 27
steps, 11 logins, 1 new save (step 4, stays on Dev); counts re-checked 23 Nov, identical to
22 Nov (scratchpad `dev_mn_e2e_*_2026-11-23.txt`); Team Activity is a rolling 30 days, so
on the run day I give him the per-person list (read-only Dev query; the 31 Oct notes leave
the window 1 Dec). **Next, in order:** (a) Dev backend restart (his) for `ee5be3f`; pytest,
ruff, tsc, lint report; then the E2E with him, `cabio-e2e-testing` loaded; (b) after Plan &
Chore commits its docs batch: Backlog line under "Activity log privacy hole" option A, D11
line in the plan (the rolled-back test was his 21 Nov choice), any doc line saying Activity
Levels counts every activity type; (c) UAT with the next full move (D9), needs his yes
for the UAT people check; Haroon to be told about D5. **Retro 23 Nov written** (5);
docs batch committed `a742437` (E2E plan, this note, my archive entry), pushed 23 Nov.

## NOW (19 Nov, evening) — Product pricing E2E: 44 of 51 Pass; open: 29b–29e, 30, 31, 32
**Waiting on the leadership team's price sheet** (template is done; Basheer sends it
with the WhatsApp I drafted). **Before step 30, sync Dev's catalog to UAT** (UAT
drifted since ~27 Sep: 4 renames, 12 new products; details in Progress-Archive
19 Nov). Next, in order: (1) his yes for one more UAT read-only (brand fiscal-year
start months, descriptions of the 16); (2) show the exact list, he approves and runs
the script (`!`) — E2E plan section E2, steps 29b–29e; (3) step 30. Scratchpad has
the scripts and `uat_audit.json`. Open: `docs/Selling rates -2026 - CEO.pdf`
untracked in `docs/` (has prices): move to Desktop or `.gitignore`? He hasn't said.
Pushed (checked against git 20 Nov): `417c38e`, `db4f163`, `223c172` ("CEO's
lowest" rename). **Still uncommitted, mine:** the one Traceability line (row 1); at
the end of the E2E commit it with a regenerated scorecard (`generate_scorecard.py`,
then `--check`; never hand-edit; load `cabio-post-commit`). Pricing steps 1–3 on
`main` (`ebd3bdd`). Dev S70 holds test prices 35/33/31/29/24 until section F
overwrites them. If Build merges before the next pull, regenerate `api.ts`.
Pending for Basheer: send Plan & Chore the ask to group E2E steps by login
(wording drafted 18 Nov). "Account" → "Customer" rename parked in the Backlog
(`46c4214`). **After deploy to UAT:** Basheer times `weekly-followup` in F12 Network.

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Other deferred items live in the Backlog.
