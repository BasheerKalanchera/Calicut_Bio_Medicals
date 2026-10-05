# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

## Session retro 2026-10-01 + structural fixes — parked by Basheer

- Retro drafted in chat 2026-10-01, **not yet approved or saved**. Main
  points: hospital-wise Part 1 done; UAT hotfix built and Dev-tested; most
  mistakes broke existing CLAUDE.md rules (test-plan live-data check,
  Simple/Complex tagging, "Basheer clicks" for Dev writes, verify before
  claiming); only the no-`cd` hook actually stopped a mistake.
- 2026-10-03: the structural fixes were built (shell guard, test-plan guard
  + template, UAT-connection note; Progress-Archive 2026-10-03). Only the
  retro text itself is still unsaved.
- **Next:** re-show the retro for approval when Basheer chooses.

## Plan vs Actuals Tracking (Insights Dashboard)

- Renamed 2026-10-02 (Basheer) from "Hospital-wise target planning Part 2".
- Hospital-wise Target Planning finished 2026-10-01 (E2E 38/38, scorecard
  Done; Progress-Archive 2026-10). Its UAT move waits for this feature: migrations 0055 + 0056, plus the
  manual/help update (Backlog). Hospital
  re-filing on UAT (Option A) held until Basheer talks
  to Haroon — Plan vs Actuals Tracking plan, step 5.
- Close dates for the 37 deals closed before 27 Sep: proposed dates sent
  to Haroon 2026-10-01 (Backlog "UAT: fill in missing 'date closed'").
  Apply his answers, then fill in on UAT with or before the combined UAT move
  (UAT write: own approval, Basheer runs it).
- Plan approved 2026-09-29: `docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md`
  (Lighter build, ~3 days, no DB change; new rule BR-OP-16 Closing Date
  Passed). Split-credit question sent to Haroon 2026-09-29 — doesn't block.
- Built: backend `0f7d75a`, frontend + legacy-plan fix `231fbd0` (pushed,
  partial checkpoint). E2E plan written, untracked:
  `docs/Plan-vs-Actuals-Tracking-Manual-E2E-Test-Plan.md`.
- Code review fixes committed and pushed 2026-10-04 as `903ad41` (partial
  checkpoint, E2E pending): plans visible only within the viewer's owner scope
  (colleagues hidden), "Total (your view)" label, numeric empty check,
  `/zone-rollup` retired. pytest 1124, ruff, tsc, lint clean. E2E plan revised
  against live Dev data re-checked 2026-10-04 (hide-colleagues cases R1-R6,
  corrected figures) and committed in the same commit.
- **E2E STOPPED 2026-10-04 by Basheer: "this feature is not built properly."**
  Done: Pre-flight and Section A (Imaging and Critical Care as Haroon) Pass;
  A3 re-check Pass for Basheer K hidden in all quarters. Sections S, W, C, L,
  E, R not run. Not Done on the scorecard; no E2E sign-off.
- What went wrong in the build (details in Progress-Archive retro): the
  who-is-shown rule was changed twice mid-E2E. First fix hid everyone with no
  plan (wrong); second fix hid only people outside the SBU (Basheer-approved).
  Then Basheer found Vivek (Critical Care, Sales Staff, no Opportunities;
  plans Q2 approved, Q3 pending, Q4 rejected) shows only in Q2/Q3. Cause: the
  list is built only from plans/wins/expected/late Opportunities
  (`service.py` `people` dict), so an SBU member with no activity never gets
  a row. Basheer's expectation: the GM sees **every** SBU member, every quarter.
- **Uncommitted** in the working tree (partial; do not commit as-is):
  `repository.py` (`home_sbu_by_user`), `service.py` (home-SBU filter),
  `test_plan_vs_actual.py` (3 tests), `PlanVsActualSection.tsx` ("No submitted
  plan" line), plus E2E-plan and Progress-Archive notes. pytest 146 planning,
  ruff, tsc, lint clean. Dev has a test Opportunity "Test +lead screen"
  linked to Basheer K.
- UAT check 2026-10-04 (read-only, Basheer approved): 160 Opportunities;
  none owned by someone whose home SBU differs from the Opportunity's SBU
  (so Basheer K's Dev case can't occur there). Only Haroon Sidheeq (GM, no
  home SBU) owns Opportunities outside a home SBU: 29 Critical Care, 13
  Imaging. Basheer: Haroon is GM **and** sells on the ground in both SBUs.
  So the built rule is wrong for him: no plan = no row, yet his wins count in
  the totals. Proposed rule (not approved): show a person if home SBU =
  viewed SBU, **or** a submitted plan there, **or** they own Opportunities
  there (Won/Expected/late). Dev's test Opportunity "Test +lead screen" would
  make Basheer K appear: reassign or retire it first (has Activity rows,
  so reassign rather than delete).
- Design review finished 2026-10-05; decisions agreed in chat, NOT yet
  written to the plan doc:
  - Full rename to "Target vs Actuals" (screen, docs, file and code names).
  - Roster: every active SBU member except Admin gets a row every quarter
    on both Target Planning and Target vs Actuals, within the viewer's
    scope; statuses Not started/Draft/Waiting/Approved/Rejected; "N of M
    haven't submitted" line; managers see only "Draft". Haroon is on both
    SBU rosters and counts as not submitted when planless.
  - Q3: show the revised figure with a "was ₹X approved" note.
  - Q4: Won counts at full payment (BR-OP-17); % of target uses Won only.
  - Q5: a manager's row = own plan and wins only.
  - Visibility: staff own row; Area Manager + team; SBU Manager + SBU vs
    SBU target; GM all SBUs + company; Admin = GM view, no own row.
  - PO: separate "PO received" and "Won (paid)" columns, each in its own
    quarter; new "PO date" box next to PO number (required at
    Order → Delivery); older records fall back to the audit-log date.
  - SBU target: one figure per SBU per quarter, GM enters it in SBU Target
    Rollup, separate register table, visible SBU Manager and above;
    company = sum of SBUs.
  - Wording: "no expected closure date". Split credit: owner gets full
    credit, waiting on Haroon (UAT: 5 shared Opportunities, Haroon in 4).
  - All in Part 1, one migration (PO date + SBU target), one UAT move.
- Plan doc section 2 "No database change" is now wrong; revise it.
- **Next:** show the Decisions text for the plan doc, the split note and
  the Haroon message (redraft all three) → gap analysis → fix plan →
  build → new E2E plan → E2E.
- Other sessions' untracked plan docs (Forecast, Opportunity-Create-Form,
  Weekly-Follow-up) are not ours; leave them out of commits.

## UAT outage 2026-10-05 — app restored; real fix awaiting go-ahead

- Slow from ~2 pm, froze ~3:50 pm. Cause: the Next Actions screen loads
  each reminder with ~100 linked lookups across ~12 tables in one query,
  which exhausted memory on UAT's free Nano database. Basheer restarted
  the Supabase project, then Render; app back.
- Guard rail: Basheer set Render DB_POOL_SIZE=5, DB_MAX_OVERFLOW=5
  (single worker, max 10 connections) and redeployed.
- **Next:** Part A fix (Next Actions query loads only the names it shows;
  no model/DB/frontend change): measure on Dev before/after (announce
  first), test that the response is unchanged, /code-review, Dev check,
  UAT move with its own approval. Then add a pool/Production sizing note
  to Deployment-Topology.md (Production on paid Supabase next month).
- Open: did a UAT backup run 3:30–4:00 pm?

## Audit Trail Redesign — built and tested on Dev; UAT move waiting

- Plan: `docs/Audit-Trail-Redesign-Implementation-Plan.md`; E2E plan:
  `docs/Audit-Trail-Redesign-Manual-E2E-Test-Plan.md`. Steps 1–4 and the
  review fix are committed (`24f5607` … `fb5b7e6`). Dev E2E finished
  2026-10-03: all steps Pass; pytest 1120, ruff, tsc and lint clean.
- Code review redone 2026-10-04: one real finding, fixed in `51deecc` (stable paging order). Payment-note-dropped-on-non-Won-save left as designed unless Basheer wants it rejected.
- **Next:** the UAT move (migration 0059 + steps 2–4 together) (migration 0059 + steps 2–4 together) is its own approval; ask UAT backup first (0059's downgrade deletes INSERT history). Then the post-commit checklist.
- Never `api.ts` by regenerate: another session edits it; hand-edit only
  the Audit Log types (`AuditSaveResponse`, `owner_*`, `action` filter).

## Forecast by closing period — questions answered 2026-10-01

- Latheef Bhai's request (Traceability 2.5, month/quarter half):
  `docs/Discussion-Forecast-By-Closing-Period-2026-09.md` — all questions
  decided except Q4, parked until reps correct Expected Closure Dates
  (only 3 of 112 open Opportunities had a future date). Common
  Opportunity filter, lighter option; rule in both standards docs.
- Date catch-up: `scripts/uat_closure_date_report.py`, run with the
  data-quality check; first report sent to leadership 2026-10-01.
- **Next:** write the implementation plan when Basheer says; watch the
  closure report's progress.

## Doc tidy-up 2026-10-04 — closed in `7e2e9b9` + `58063fb`; two items left

- Traceability item 13 ("Commitment beyond contract") wording + scorecard republish: with the UAT move (Basheer, 2026-10-04); show the diff first.
- Antigravity plans (Forecast-By-Closing-Period, Opportunity-Create-Form-Unification, Weekly-Follow-up-Report): untracked, not ours, leave out of commits. **Next:** fix them per the 2026-10-04 review, each edit shown before/after first. Order: Weekly, Forecast, Create-Form, after the Plan vs Actuals E2E.
