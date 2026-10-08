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
  `split_check_out.txt`).
- Combined E2E test plan written 2026-10-07:
  `docs/Plan-vs-Actuals-Tracking-Manual-E2E-Test-Plan.md` (A–J in
  2026-Q3, K = 38-step Hospital-Wise re-run + step 39 in 2027-Q1). Live
  data: session 1e7c86e6 scratchpad `e2e_data2_out.txt`.
- **Next:** Basheer restarts the Dev backend (P1) → Claude re-runs the
  read-only scope check (P3) → E2E from step A1.
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
  route (own approval); 3 trips. Fix 4 has no trip: it goes to UAT with
  the next full promotion (plan D9, changed 2026-10-07).
- The other session owns Target vs Actuals (planning files + the PO date
  box on the Opportunity page): check `git status` before every save and
  commit; stay out of their files.
- Fixes 1 + 2 on UAT 2026-10-07 (merged back as `18b9148`); fix 3
  (Pipeline) on `main` 2026-10-07 (`8e8e075` + merge `f7d25b1`, pushed).
  Detail: the plan's sections 6 and 8, Progress-Archive-2026-10.
- Fix 3 on UAT 2026-10-08 as `569209f` (pushed to `uat`, deployed).
  Only the plain Pipeline was timed (plan section 6), so Basheer asked
  for the full old-vs-fixed comparison on Dev before closing it.
- **Next:** plan section 9 checklist, from step 2 (list approved
  2026-10-08). Read-only on Dev; the Dev server is not restarted. Any
  UAT rollback/correction waits for an early-morning window.
- Still open from trip 3: `uat` not yet merged back into `main`; the
  worktree `.claude/worktrees/uat-fix3` (local branch `uat`) stays until
  that merge (section 9 step 9).
- **Then:** build and test fix 4 on Dev, starting with its "What could
  be affected" list (plan step 7, step 0) for approval before any edit.
  Approach (agreed in outline 2026-10-07; confirm before editing):
  zone tree loads all zones + assignees in a couple of queries
  (`reference/repository.py:192`); Audit Log `_live_rows`
  (`audit/repository.py:327`) stops pulling linked records
  (`lazyload("*")`); delete the unused `/accounts/{id}/workspace` route,
  `WorkspaceService`, `get_for_workspace`, its two test files and
  `getWorkspace` in `accounts.ts` (keep the shared Workspace* schemas;
  leave `api.ts`). Deadline Sun 2026-10-11 for fix 4 = committed on `main`
  (Basheer, 2026-10-07).

## Audit Trail Redesign — built and tested on Dev; UAT move waiting

- Plan: `docs/Audit-Trail-Redesign-Implementation-Plan.md`. Built, Dev
  E2E passed, review fix `51deecc`; history in Progress-Archive-2026-10
  (2026-10-03/04), tracked in Backlog.
- **Next:** the UAT move (migration 0059 + steps 2–4 together) is its own
  approval; ask UAT backup first (0059's downgrade deletes INSERT
  history). Then the post-commit checklist.
- Never `api.ts` by regenerate: another session edits it; hand-edit only
  the Audit Log types (`AuditSaveResponse`, `owner_*`, `action` filter).

