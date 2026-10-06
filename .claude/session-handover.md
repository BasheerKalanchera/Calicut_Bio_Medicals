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
- Untracked plan docs from other sessions (Forecast, Create-Form,
  Weekly-Follow-up): leave them out of commits.

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
- Still uncommitted: `PlanVsActualSection.tsx` (old 2-line change; rework
  in step 4). Dev has a test Opportunity "Test +lead screen" linked to
  Basheer K (reassign, don't delete: it has Activity rows).
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
- Step 2 (Opportunity side) committed and pushed 2026-10-06 as `ebc9613`
  (checkpoint, frontend pending): PO date
  required at Order → Delivery and at Won, never in the future; no
  audit-log fallback (Basheer: keep it simple; older records get a "no PO
  date" note in step 3). pytest 1145, ruff clean. Also fixed the table and
  relationship counts in `test_persistence.py` that step 1 left stale.
- Step 3 (Target vs Actuals backend) committed and pushed 2026-10-06 as
  `cc4eb91` (checkpoint, frontend pending): roster rows, drafts private,
  PO received, SBU/company rows, `/planning/sbu-targets`; endpoint renamed
  to `/planning/targets/target-vs-actuals`. pytest 1168, ruff clean.
  Detail: Progress-Archive-2026-10 (2026-10-06).
- **Next:** step 4 (frontend) per the plan doc's "Revised build order":
  rewire the card to the new endpoint (`targetPlanning.ts:59`, hand-edit
  types, never regenerate `api.ts`), roster/status/PO columns, SBU target
  entry, and the PO date box on the Opportunity stage move. Until then on
  Dev the Target vs Actuals card errors and nobody can move an Opportunity
  to Delivery from the screen.
- Other sessions' untracked plan docs (Forecast, Opportunity-Create-Form,
  Weekly-Follow-up) are not ours; leave them out of commits.

## Query load fixes — approved 2026-10-06, deadline Sun 2026-10-11

- Plan: `docs/Query-Load-Fixes-Implementation-Plan.md` (priority list,
  D1–D9, progress table); Backlog entry tracks it to closure. Audit
  results: Progress-Archive-2026-10 (2026-10-06).
- Order: Opportunity page (open + save, with Product documents) → Activity
  comments + Daily Report → Pipeline → Audit Log + zone tree + remove
  workspace request. Each: fix on `main` (own commit) → UAT by hotfix
  route (own approval); 4 trips.
- The other session owns Target vs Actuals (planning files + the PO date
  box on the Opportunity page): check `git status` before every save and
  commit; stay out of their files.
- **Next:** step 0 commits (plan; then standards rule, Backlog, archive,
  handover, `scripts/query_audit.py`), then measure and fix the
  Opportunity page.

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
