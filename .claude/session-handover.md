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
- **Next:** restart the Dev backend (confirm P1), then run the E2E from
  pre-flight: "Basheer clicks, Claude watches" for saves, Pass/Fail recorded
  per step. After: BR-PL rule, Traceability, UI-Inventory, scorecard
  regenerate + `--check`, post-commit checklist.
- Other sessions' untracked plan docs (Forecast, Opportunity-Create-Form,
  Weekly-Follow-up) are not ours; leave them out of commits.

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

## Doc tidy-up 2026-10-04 — committed `7e2e9b9`; open leftovers

- ZonePicker plan: Status needs a check against code and records; plan untouched until then.
- Pipeline product-filter half: Backlog entry, or ask Latheef Bhai? (Basheer decides.)
- Phase-2E-Task9 scratch doc: delete or keep? (Basheer decides.)
- Doc-integrity-sweep skill still says "six checks" in a few places: fix wording?
- Traceability item 13 ("Commitment beyond contract") wording + scorecard republish: with the UAT move; show the diff first.
- Untracked docs not from this thread: Forecast-By-Closing-Period plan, Opportunity-Create-Form-Unification plan, Plan-vs-Actuals E2E plan, Weekly-Follow-up-Report plan (confirm who owns the last).
