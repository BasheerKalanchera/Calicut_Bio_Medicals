# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Reminders
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).
  No api.ts change expected for this batch; run the check before committing.
- UAT runs `0756234`, database at 0065 (moved 10 Nov, `c1d3c90`). UAT fixes
  ahead of a full promotion go by the hotfix-branch route
  (`docs/Deployment-Topology.md` "Fix to UAT ahead of a full promotion").

## NOW (13 Nov) — small batch E2E done, 28 of 29 (step 11 skipped by Basheer)
Result and findings: `docs/Small-Batch-12-Nov-Manual-E2E-Test-Plan.md`
(uncommitted; sign-off filled in) and Progress-Archive 13 Nov "Build & Test:
small batch E2E". Done 13 Nov: sign-off written; tsc and lint re-run clean on
`ZonePicker.tsx`; `fix:` commit `4a5e767` (zone box follow-up, `ZonePicker.tsx`
only; no api.ts change) committed AND pushed to main. **Next:** docs batch,
own approval (list below). Add `4a5e767` to the E2E plan's "Built:" line.

Built in checkpoint commit `b4f6a3b` (pushed 12 Nov): My Work speed fix
(`reporting/repository.py`, MATERIALIZED CTE; median 875 → 434 ms on UAT
data), zone box message (`ZonePicker.tsx`, 8 screens), Pipeline card order
(`opportunity/repository.py`, id as last sort key), Sales Report fixed
header (`SalesReportScreen.tsx`). Code review found 1 bug, fixed in
`ZonePicker.tsx` (`debouncedSearch`), committed in `4a5e767`. E2E needed no other fix.

**Finding, not this batch (step 19):** the Sales Report headline counts only
Won/Lost Opportunities that have a product line (`sales_headline`, inner
join). UAT read-only, 13 Nov: Lost 25 real, 19 shown (6 have no line); win
rate 68.9 % shown vs 62.7 %; Won 42 of 42. Basheer decided 13 Nov: build a
"Sales Loss Report" with a Loss Reason filter (in Backlog and Traceability
1.4, uncommitted). Open, not decided: count no-line Lost in the Sales
Report; ask for a product line when Lost is past Lead.

**Docs batch (one approval):** Backlog: move "Pipeline zone filter shows No
options" and "cards with the same priority and chance can swap places" to
done; file the next-actions entry (Option 1 about 24 % on that lookup,
Option 2 rule rewrite; numbers in the 12 Nov archive) and the Sales Report
no-line Lost undercount; note on `Kanban-Priority-Sort-Manual-E2E-Test-Plan.md`
lines 12–13; E2E plan: add the fix commit to "Built:", correct steps 4/5
(board also shows Won/Lost/On Hold), step 8 (Active-only counts), step 26
(ran as Haroon, not Basheer K).

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
