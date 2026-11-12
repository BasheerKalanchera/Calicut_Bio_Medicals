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

## NOW (10 Nov) — My Work Summary speed; nothing edited in code yet
Investigation only, all read-only on UAT (detail and numbers: Progress-Archive
10 Nov "Build & Test: UAT investigations"). Written up, retro included, and
pushed: `db96ca3` (this note, the never-contacted report, the archive entry).
**Exact next step:** ask Basheer for his yes on the speed fix below.
- **Waiting on Basheer's yes: the speed fix.** One edit in
  `backend/app/domains/reporting/repository.py`, `_days_since_last_contact`
  (lines 94-116): when an owner is given (My Work), build the last-contact
  step as a `MATERIALIZED` CTE instead of `.subquery()`, so it runs once, not
  once per Opportunity. No other file, no migration, no screen change. The
  Stagnant Opportunities report calls it with no owner (line 304) and stays
  exactly as it is (not tested for it). Measured on UAT: 145-200 ms against
  560-1,590 ms; full-row comparison 127 views, 737 rows, 0 mismatches.
- **After the yes:** reporting tests, then full backend tests, type check and
  lint; re-run the side-by-side comparison on Dev; time My Work on UAT (ask
  first); then propose the commit. Nothing stops working on Dev meanwhile.
  If My Work is still slow after that, splitting its one request so the
  Summary tiles fill in separately is an optional later step.
- **Chalukya hospital (waiting on Basheer):** its only Meeting is dated
  28 Nov 2026 (typed wrongly; entered 6 Nov by Ravi Kumar), so the report
  counts it as never contacted. Decide: (1) correct that one date on UAT
  (needs the real date from Ravi Kumar), and/or (2) block future dates for
  Visit, Call, Meeting and Email in the Log Activity picker and on the
  server. If (2): Business-Rules rule + Backlog entry.
- **Fahad's two Won Opportunities: Plan & Chore's, not mine.** Its UAT check
  and the one-time fix (on hold until Basheer confirms with Haroon) are in
  Progress-Archive 11 Nov "Fahad's two Won Opportunities". I only read the
  code (Won can't be reopened; rename and product edits on Won aren't
  blocked and write no timeline note). Basheer's team teaching note (generic
  names, customers change their mind, write changes on the timeline, Won =
  fully paid) is still to be drafted with Antigravity.
- **Next:** tell Plan & Chore about the not-reloading risk on Stagnant
  Opportunities, Sales Report and Opportunities On Hold (not checked), once
  Basheer says yes.
- Not mine: other sessions' uncommitted docs (Backlog, plans, scorecard,
  Plan & Chore archive entries), stray `B`, `BT`, `PC` files.

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
