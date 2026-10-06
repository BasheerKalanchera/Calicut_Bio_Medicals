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
- Redesign decisions and build order in the plan doc (`d935ebc`); UAT
  move only after steps 5 and 6 are both built and tested. Split credit
  question with Haroon (answer expected 2026-10-06).
- Committed and pushed (detail in Progress-Archive-2026-10): `1821c30`
  (migration 0060, Dev at `0060 (head)`), `ebc9613` (PO date gates),
  `cc4eb91` (backend), `2c189d7` (frontend: PO date box on the
  Opportunity edit form + Quick Lead only, Option C).
- Open for E2E: the rejected-revision display was approved as "Rejected
  (₹X approved)" but built as a "last approved" note; ask Basheer which.
- Doc rename decided (Basheer, 2026-10-06): at the post-commit checklist,
  rename both `Plan-vs-Actuals-Tracking-*` docs to `Target-vs-Actuals-*`
  and fix links in Business-Rules, Traceability, Insights-Dashboard plan,
  Hospital-Wise plan, Salesperson-Performance discussion, this note.
  History docs (Progress-Archive, sweep log) keep the old name.
- Step 5 review fixes committed and pushed as `eab65e3` (detail in
  Progress-Archive-2026-10).
- Step 5's manual E2E deferred (Basheer, 2026-10-06): one combined E2E
  after step 6; roster on the Quarter view only (plan doc, steps 5–6).
- Step 6 plan approved 2026-10-06 (Basheer):
  `docs/Target-Coverage-Roster-Implementation-Plan.md` (shared roster
  list for both screens).
- Step 6 part 1 (backend) committed and pushed 2026-10-06 as `0b503ad`
  (checkpoint): new `GET /planning/targets/roster`, shared
  `_build_roster` (the card uses it too), 5 new tests; pytest 1201, ruff
  clean. **Next:** step 2 (frontend: Target Planning Quarter team table
  from `/roster`, "N of M haven't submitted", "Pending Approval" on the
  card; ask Basheer about removing the then-unused `/rollup`). E2E data:
  session 0fa74619 scratchpad (`tva_views_out.txt`, `tp_team_out.txt`,
  `tva_mgr_out.txt`, `tva_elig_out.txt`, `tva_bk_out.txt`).

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
- `scripts/query_audit.py` (D4) committed 2026-10-06 as `b06a043`. Dev test data: Basheer added
  stakeholder "Ajmal" and a PDF to Fazal's "New USG m/c" (aster medicity) so the Sales
  Staff view covers every part of the Opportunity page.
- Fix 1 (Opportunity page + Product documents) committed and pushed
  2026-10-06 as `90ae253`; on `main` only, not yet on UAT. Results:
  Progress-Archive-2026-10 and the plan's section 6. The Target vs
  Actuals session may now restart the Dev backend and start its E2E.
- **Next:** UAT trip 1 for `90ae253` by the hotfix route on the morning
  of Wed 2026-10-07 (Basheer's timing; own approval, plan D-list).
  Order: Claude times 3–5 busy Opportunities + one product's documents
  in Chrome on UAT (Basheer picks them), deploy, time the same pages
  again (plan step 7, before/after note). If fix 2 is committed and
  checked on Dev by then, it rides in the same hotfix (D9 exception),
  and trip 2's pages are timed too.
- Fix 2 (Activity comments + Daily Report) built and checked on Dev
  2026-10-06; committed and pushed as `bc09b28` (main only, not UAT):
  activity `repository.py`, `schemas.py`, `test_activity_repository.py`.
  Old-vs-fixed run done as Haroon: same screens/data, Daily Report 57 → 6
  joins (72 → 4.7 ms), comments 61 → 5 (42 → 1.1 ms). Detail:
  Progress-Archive-2026-10 and the plan's section 6.
  **Next:** rides UAT trip 1 on 2026-10-07 morning (D9); time trip 2 pages too.
- Regression check of fixes 1 + 2 on Dev done 2026-10-06 as Haroon (plan
  section 7, every entry point): 17 Pass, 3 not run with reasons (no data
  on Dev), 0 fail. Detail: Progress-Archive-2026-10.
- **Next:** Fix 3 (Pipeline): measure first with `query_audit.py --only
  /opportunities/pipeline --save-responses <scratchpad>`, then fix,
  compare, tests, code-review, old-vs-fixed run, `fix:` commit.

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
