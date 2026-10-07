# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

- Untracked plan docs from other sessions (Forecast, Create-Form,
  Weekly-Follow-up): leave them out of commits.

## Target vs Actuals (Plan vs Actuals Tracking, Insights Dashboard)

- Plans: `docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md` (build
  order; split credit BR-FIN-09 = step 6b) and
  `docs/Target-Coverage-Roster-Implementation-Plan.md` (step 6). Build
  history: Progress-Archive-2026-10.
- Not Done on the scorecard: E2E stopped 2026-10-04; one combined E2E
  after steps 5, 6 and 6b (Basheer, 2026-10-06).
- Step 6b + review fixes committed and pushed 2026-10-07 as `2e2e4c0`
  (checkpoint; E2E pending): pytest 1217, ruff, tsc, lint clean.
  Read-only Dev check 0 problems, no split totals ≠ 100 %, but no shared
  Opportunity on Dev is Won or late (output: session 5cef2040 scratchpad
  `split_check_out.txt`). E2E setup: Basheer gives "New USG m/c" (owner
  Fazal not in split; Basheer K 50 / Vivek 50) a past closing date →
  late on all three rows ("shared, 0 %" on Fazal's), Fazal's Area
  Manager note.
- **Next:** write the combined E2E checklist (shared-Opportunity, former-member, Annual-total
  cases) → checks, Dev backend restart → run E2E. E2E data: session
  0fa74619 scratchpad (`tva_*_out.txt`, `tp_team_out.txt`) + session
  5cef2040 scratchpad (`e2e_data_out.txt`).
- Dev test Opportunity "Test +lead screen" (Basheer K): reassign, don't
  delete (it has Activity rows).
- UAT move: after the combined E2E, together with Hospital-wise Target
  Planning (migrations 0055 + 0056, manual/help update) and hospital
  re-filing (Option A, held until Basheer talks to Haroon; plan step 5).
- Close dates for the 37 closed Opportunities: Haroon's list received
  2026-10-07 (scan in the data_consistency_reports backups folder;
  Backlog "UAT: fill in missing 'date closed'"); 3 questions sent back
  (rows 13+14, 17+18, 35). With his answers: write the UAT fill-in plan
  (fresh backup first, Basheer runs it; own approval).
- At the post-commit checklist: rename both `Plan-vs-Actuals-Tracking-*`
  docs to `Target-vs-Actuals-*` and fix links (Business-Rules,
  Traceability, Insights-Dashboard plan, Hospital-Wise plan,
  Salesperson-Performance discussion, this note); history docs keep the
  old name.
- Forecast plan (untracked, other session) line 110: update to BR-FIN-09
  at its review.

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
- Fixes 1 + 2 on UAT 2026-10-07 (merged back as `18b9148`); fix 3
  (Pipeline) on `main` 2026-10-07 (`8e8e075` + merge `f7d25b1`, pushed).
  Detail: the plan's sections 6 and 8, Progress-Archive-2026-10.
- Docs from this thread, uncommitted, for the other session's full docs
  batch (Basheer, 2026-10-07): Query-Load plan (section 6 row, section 8),
  Progress-Archive (fix 3 entry + two retros), Process-Improvements
  (P34–P37; P1/P3/P14/P21/P23/P28/P30 seen +1), Backlog (tie-breaker,
  zone picker, "deal" wording, Forecast + doc tidy-up leftovers), this
  note; tidy-up every alternate day: hook, CLAUDE.md, sweep skill,
  Sweep-Log, Process-Rules-History.
- **Next:** UAT trip 3 (Pipeline), early morning Thu 2026-10-08
  (Basheer), plan step 7, own approval: before
  timings on UAT (Pipeline as a manager), same change on `uat`, tests,
  deploy, after timings, merge `uat` back into `main`.

## Audit Trail Redesign — built and tested on Dev; UAT move waiting

- Plan: `docs/Audit-Trail-Redesign-Implementation-Plan.md`. Built, Dev
  E2E passed, review fix `51deecc`; history in Progress-Archive-2026-10
  (2026-10-03/04), tracked in Backlog.
- **Next:** the UAT move (migration 0059 + steps 2–4 together) is its own
  approval; ask UAT backup first (0059's downgrade deletes INSERT
  history). Then the post-commit checklist.
- Never `api.ts` by regenerate: another session edits it; hand-edit only
  the Audit Log types (`AuditSaveResponse`, `owner_*`, `action` filter).

