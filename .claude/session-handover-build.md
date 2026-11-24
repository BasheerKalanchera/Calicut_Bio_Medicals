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

## NOW (24 Nov) — nothing in progress
Product Deactivate E2E finished 24 Nov: 27 of 27 Pass, fixes in `289b56f`, pushed
(archive 24 Nov). **Next:** nothing queued for this session; ask Basheer.
**For Plan & Chore (tell via Basheer):** its 4 lines sit at the end of
`docs/Progress-Archive-2026-11.md` in its own "24 Nov — Plan & Chore: UAT backup"
section, uncommitted; this session's 24 Nov section follows them.
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
