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

## NOW (14 Nov) — nothing in progress; waiting for Basheer's next task
Marketing Lead discard reason and "Converted by / Discarded by" lines: built,
E2E 12 of 12 Pass on Dev, pushed (`b4f6b42`, `8a59b20`). Detail:
Progress-Archive 14 Nov. The UAT manual's Discard line waits for the UAT move
(Backlog "Bring the user manual and in-app `?` help up to date").
Small batch 12 Nov (`b4f6a3b`, `4a5e767`, `4efbac6`) is pushed and waits for
a UAT deploy (Basheer's call; hotfix-branch route in Reminders).

**Finding, not this batch (step 19):** the Sales Report headline counts only
Won/Lost Opportunities that have a product line (`sales_headline`, inner
join). UAT read-only, 13 Nov: Lost 25 real, 19 shown; win rate 68.9 % shown
vs 62.7 %. Basheer decided 13 Nov: build a "Sales Loss Report" (Backlog,
Traceability 1.4). Open, not decided: count no-line Lost in the Sales
Report; ask for a product line when Lost is past Lead.

**After deploy to UAT:** Basheer times `weekly-followup` in F12 Network (the
speed check is UAT-only); the Stagnant/Sales/On Hold not-reloading risk goes
to Plan & Chore only after his yes.

Not mine: other sessions' uncommitted docs (Backlog items, plans, Plan &
Chore note, Progress-Archive-2026-08), stray `B`, `BT`, `PC` files.

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Other deferred items live in the Backlog.
