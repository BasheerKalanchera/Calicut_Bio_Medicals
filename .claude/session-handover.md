# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

## Where we stopped — 2026-10-05 evening

- Due-today items all done and pushed (`9a23a4e`): UAT backup, data-quality
  and closure-date reports (PDFs in the data_consistency_reports backup
  folder), doc tidy-up.
- Untested: the new sort by Area in `scripts/uat_data_quality_check.py`;
  check it on the next run.
- Waiting on others: Fahad's and Vivek's 2026-Q2 targets (₹113.30 L and
  ₹90.60 L) still unapproved after the quarter ended.
- Offer open: build `scripts/uat_closure_date_report.py`'s comparison column
  from the previous report (repo edit; plan approval first).
- The working tree holds the old, uncommitted Target vs Actuals code
  (`repository.py`, `service.py`, `test_plan_vs_actual.py`,
  `PlanVsActualSection.tsx`), to be reworked today for the design-review
  gaps, plus three untracked plan docs from another session: leave them out
  of commits.

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
- Built but unsigned: backend `0f7d75a`, frontend `231fbd0`, review fixes
  `903ad41` (partial checkpoint). E2E stopped 2026-10-04 by Basheer ("not
  built properly"): Pre-flight and Section A passed, the rest not run; not
  Done on the scorecard. Build history, the who-is-listed failure and the
  UAT check: Progress-Archive-2026-10 (2026-10-04 entries).
- **Uncommitted** in the working tree (partial; do not commit as-is):
  `repository.py`, `service.py`, `test_plan_vs_actual.py`,
  `PlanVsActualSection.tsx`, plus E2E-plan notes. Superseded by the
  2026-10-05 design below; expect rework. Dev has a test Opportunity "Test
  +lead screen" linked to Basheer K (reassign, don't delete: it has Activity
  rows).
- Design review finished 2026-10-05; decisions, gap analysis and the
  revised build order are written in the plan doc (`d935ebc`). Light
  first: roster on Target vs Actuals; the Target & Coverage Planning
  screen is a separate second pass; the UAT move comes only after both are
  built and tested (Basheer, 2026-10-05).
- Split credit: question sent to Haroon, answer expected 2026-10-06.
- Step 1 done: migration 0060 (PO date + SBU target table) committed and
  pushed as `1821c30`; applied to Dev, `alembic current` = `0060 (head)`;
  `Physical-Schema.sql` regenerated in the same commit. Models updated; no
  code uses the new column/table yet.
- **Next:** step 2 (Opportunity side): PO date field in schemas/service,
  required at Order → Delivery in `validators.py`, audit-log-date fallback
  for older records, tests. Show the file-by-file plan for approval first.
  Then steps 3-7 per the plan doc's "Revised build order".
- Other sessions' untracked plan docs (Forecast, Opportunity-Create-Form,
  Weekly-Follow-up) are not ours; leave them out of commits.

## Query audit (lighter) — approved 2026-10-06

- Why: the Next Actions outage (fixed, live on UAT `fa61bd8`; see
  Progress-Archive-2026-10, 2026-10-06) came from chained auto-loading of
  related records. 74 such settings in 17 files (`lazy="joined"` /
  `selectin` / `subquery`); largest: opportunity models 20, activity 10,
  planning 7.
- Lighter option (Basheer): Dev only, no code change. Measure each
  screen's main list request (joins, statement size, planning time; method
  as the 2026-10-05 reminder test) and rank against Next Actions' old 110
  joins; fix proposals one approval at a time.
- **Next:** list the list endpoints and show the measuring plan first.

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
