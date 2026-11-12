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

## NOW (12 Nov, end of day) — small batch built, committed and pushed
Basheer stopped for the day; code review is tomorrow. Detail, numbers and
retro: Progress-Archive 12 Nov "Build & Test: small batch built". All the
code below is in checkpoint commit `b4f6a3b` (one commit, pushed to
origin/main 12 Nov; partial: review, Dev restart and E2E still to do).
- **Step 0 My Work speed fix:** `backend/app/domains/reporting/repository.py`
  (`_days_since_last_contact`, MATERIALIZED CTE when an owner is given) and
  `backend/tests/domains/reporting/test_reporting_repository.py` (2 tests).
  Measured on Dev and UAT: same data, My Work request median 875 → 434 ms.
- **Step 1 zone box:** `sales-os-app/src/components/ZonePicker.tsx`
  (`noOptionsText`, 8 screens).
- **Step 2 Pipeline card order:** `backend/app/domains/opportunity/repository.py`
  (id as last sort key) and its test file (1 new test).
- **Step 3 Sales Report fixed header:** `sales-os-app/src/screens/SalesReportScreen.tsx`.
  Opportunities On Hold stays as it is (Basheer).
- Checks before the commit: full backend tests 1,565 passed, ruff clean,
  tsc and lint 0 errors (135 old warnings), api.ts guard clean.
- **Exact next step (tomorrow):** (1) `/code-review` medium on `b4f6a3b`
  (`git show b4f6a3b`), fix findings; (2) Dev backend restart; (3) load
  `cabio-e2e-testing`, write
  `docs/Small-Batch-12-Nov-Manual-E2E-Test-Plan.md` (Simple/Complex tags,
  `[Complex: phone layout]` per screen incl. the Sales Report 390 px risk,
  hospital in brackets beside any Opportunity name, regression steps from
  the Report-Drilldown, Sales-And-Pipeline-Report and Kanban-Priority-Sort
  plans); (4) run it; (5) any fix from the review or E2E is proposed as a
  commit with file list and message shown first (small wording fixes may
  batch, per CLAUDE.md).
- **Docs after the review:** one batch. Backlog: move "Pipeline zone filter
  shows No options" and "Pipeline: cards with the same priority and chance
  can swap places" to done; file the next-actions entry (Option 1 about
  24 % on that lookup, Option 2 rule rewrite, numbers in the archive);
  note on `Kanban-Priority-Sort-Manual-E2E-Test-Plan.md` lines 12–13.
- **After deploy to UAT:** Basheer times `weekly-followup` in F12 Network
  (Option B) and the Stagnant/Sales/On Hold not-reloading risk goes to Plan
  & Chore only after his yes.
- **Chalukya hospital (parked, waiting on Basheer):** its only Meeting is
  dated 28 Nov 2026 (entered 6 Nov by Ravi Kumar), so it counts as never
  contacted. He discusses it with Haroon and Shruthi first. Options: correct
  the date on UAT, and/or block future dates for Visit, Call, Meeting, Email
  (then a Business-Rules rule + Backlog entry).
- **Fahad's two Won Opportunities: done by Plan & Chore on UAT, 12 Nov**
  (Progress-Archive 12 Nov "leadership answers"). Not mine.
- Not mine: other sessions' uncommitted docs (Backlog, plans, Plan & Chore
  note, Progress-Archive-2026-08), stray `B`, `BT`, `PC` files.

## Earlier results (detail: Progress-Archive 2–10 Nov)
- Customer with No Activity E2E 39 of 39; Target vs Actuals E2E 41 of 41;
  Tabs E2E done; about 24 TvA steps not re-run for the wider regression
  (estimate, not counted). Search box (D17) `28d1516`.
- MUI round 1 Part 1: steps 1-7 in main, step 8 closed (pictures 26 of 26,
  combined E2E 7 of 7, paperwork done by Plan & Chore 9 Nov). Part 2 (wording
  sweep) comes later; check report 1 Nov: 33 files / 862 lines.

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Other deferred items live in the Backlog (6 rule gaps, small fixes,
  convention audit idea, shared search box proposal).
