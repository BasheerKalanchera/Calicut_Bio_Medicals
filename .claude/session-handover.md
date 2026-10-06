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
- Dev has a test Opportunity "Test +lead screen" linked to
  Basheer K (reassign, don't delete: it has Activity rows).
- Design review finished 2026-10-05; decisions, gap analysis and the
  revised build order are written in the plan doc (`d935ebc`). Light
  first: roster on Target vs Actuals; the Target & Coverage Planning
  screen is a separate second pass; the UAT move comes only after both are
  built and tested (Basheer, 2026-10-05).
- Split credit: question sent to Haroon, answer expected 2026-10-06.
- Steps 1–3 committed and pushed: `1821c30` (migration 0060, Dev at
  `0060 (head)`), `ebc9613` (PO date gates), `cc4eb91` (backend); detail
  in Progress-Archive-2026-10 (2026-10-05/06).
- Step 5 session retro (Progress-Archive, P21, P15) committed in the
  2026-10-06 lunch docs batch. Open from it: the rejected-revision
  display was approved as "Rejected (₹X approved)" but built as a "last
  approved" note; ask Basheer which he wants during E2E.
- Step 4 (frontend) committed and pushed 2026-10-06 as `2c189d7`
  (checkpoint, review and E2E pending; committed before the Query Load
  Fixes' Opportunity-page fix, at Basheer's go-ahead); tsc clean, lint
  0 errors (warnings only in old code). Basheer chose Option C: PO date box
  on the Opportunity page edit form + Quick Lead only; the other two create
  forms get it via the create-form merge, straight after this feature.
  Files: `api.ts` (po_date), `formatter.ts` (getTodayIso), Opportunity
  page, QuickLeadModal, planning types/service, `TargetVsActualsSection.tsx`
  (renamed from PlanVsActualSection), new `SbuTargetBox.tsx`, Insights and
  Target Planning screens.
- Doc rename decided (Basheer, 2026-10-06): at the post-commit checklist,
  rename both `Plan-vs-Actuals-Tracking-*` docs to `Target-vs-Actuals-*`
  and fix links in Business-Rules, Traceability, Insights-Dashboard plan,
  Hospital-Wise plan, Salesperson-Performance discussion, this note.
  History docs (Progress-Archive, sweep log) keep the old name.
- Step 5 review fixes committed and pushed as `eab65e3` (detail in
  Progress-Archive-2026-10).
- **Next:** write the E2E plan (Dev data in scratchpad
  `tva_e2e_data_check_out.txt`; Vivek's CC Q4 rejected-at-₹45 L / approved
  ₹30 L plan is the "last approved" case), restart the Dev backend, run E2E.
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
- Step 0 docs committed and pushed as `afa1b45` (plan, standards rule,
  Backlog, Progress-Archive, handover).
- `scripts/query_audit.py` (D4) written and tested, **not committed**
  (own commit; Basheer's yes still pending). Dev test data: Basheer added
  stakeholder "Ajmal" and a PDF to Vivek's "New USG m/c" so the Sales
  Staff view covers every part of the Opportunity page.
- Fix 1 (Opportunity page + Product documents) committed and pushed
  2026-10-06 as `90ae253`; on `main` only, not yet on UAT. Results:
  Progress-Archive-2026-10 and the plan's section 6. The Target vs
  Actuals session may now restart the Dev backend and start its E2E.
- **Next:** UAT trip 1 for `90ae253` by the hotfix route on the morning
  of Wed 2026-10-07 (Basheer's timing; own approval, plan D-list).
  Order: Claude times 3–5 busy Opportunities + one product's documents
  in Chrome on UAT (Basheer picks them), deploy, time the same pages
  again (plan step 7, before/after note). Fix 2 (Activity comments +
  Daily Report) starts on Dev after lunch 2026-10-06; if it is finished
  and checked on Dev by then, it rides in the same hotfix (D9
  exception), and trip 2's pages are timed too.

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
