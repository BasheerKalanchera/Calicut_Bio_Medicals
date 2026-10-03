# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

## Uncommitted docs — waiting for a batch commit approval

- Payment Confirmation Gate paperwork is closed (E2E 18/18, 2026-10-03).
  Docs waiting for one batch commit (only my lines in shared files):
  `docs/Backlog.md`, `docs/Progress-Archive-2026-10.md`, this file, the E2E
  plan, the gate plan, Traceability, `docs/Discussion-Salesperson-Performance-Report-2026-10.md`.
  The other session also edits Backlog/Progress-Archive/CLAUDE.md/settings.json
  - check `git diff --cached` and leave its lines out.

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
- **Next:** build step 1 (backend endpoint + tests) once Basheer says start.

## Audit Trail Redesign — building

- Plan: `docs/Audit-Trail-Redesign-Implementation-Plan.md`. Started
  2026-10-03 ahead of Plan vs Actuals (Basheer: UAT loses history daily).
- Step 1 done: migration 0059 applied to Dev, `alembic current` = 0059
  (head), schema regenerated, 8/8 rolled-back checks on Dev; `24f5607`.
- Step 3 done: Audit Log pages by save (never splits a save), one card per
  record touched, Added/Changed/Removed tags + "What happened" filter, names
  for every tracked table; `ce56c22` + fix `b0ba088` (api.ts types were
  lost when another session rewrote the shared file mid-commit). Backend
  audit tests 17/17; read-only Dev check: 89 saves, none cut short.
- Step 4 done: size + entry count in the UAT data-quality check; `8842d67`.
- Step 2 done: user zones, target-plan splits and hospitals now save by
  diff, with tests (168 passing in organization + planning); `c91e51e`.
  Not yet run against Dev; that is part of step 5. The unused Opportunity
  contacts "replace all" save was removed instead; `9a6d98d`.
- **Next:** step 5: `/code-review high`, written E2E plan from
  `docs/templates/Manual-E2E-Test-Plan-Template.md` (guard needs the
  live-data section and Simple/Complex tags), Dev E2E ("Basheer clicks,
  Claude watches" for saves; restart the Dev backend first), final
  commit. Check Dev `alembic current` = 0059 and Physical-Schema is
  regenerated. UAT move (0059 + steps 2–4 together) is its own approval.
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

## Process changes from the 2026-10-01 retro — resolved 2026-10-03

- A (UAT connection note), B and F (shell guard), E (test-plan guard +
  template) were built directly (Basheer: fewer mistakes, self-correct on
  repeats); C dropped. D: Basheer added the two UAT check scripts to his
  personal allow list. Progress-Archive 2026-10-03. Nothing left here;
  remove this section at the next tidy-up.
