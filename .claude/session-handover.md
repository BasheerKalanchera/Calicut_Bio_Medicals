# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

- Untracked plan docs from other sessions (Forecast, Create-Form,
  Weekly-Follow-up): leave them out of commits.

## Process consolidation — plan approved 2026-10-08, building

- Plan: `docs/Process-Consolidation-Implementation-Plan.md`. Steps 1–3
  done 2026-10-08 (uncommitted until the docs batch): 3 skills created;
  CLAUDE.md sections moved to skills/template; 18 items folded in;
  tracker 45 → 25 open.
- **Next (2026-10-09):** review the 9 drops with Basheer (P18, P26, P27,
  P34, P35, P37, P38, P42, P44) → 16 open; then the top 10 in Pareto
  order, from P1.
- Still to write, shown first: paperwork check in `cabio-post-commit`
  (feat/fix only, all living docs + handover); retro + daily review
  procedure in `process-review` (incl. which pack was missed, for which
  job).

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
- E2E run 2026-10-09: P1–P3, A1–A3 Pass (recorded in the test plan).
  At A3 Basheer split "target" (GM's SBU target) from "plan" (reps'
  plans) on the card and added a "Plans vs SBU target" column: committed
  and pushed as `cf64cd4` (partial; E2E in progress). Scope re-check
  output: session 10b0c4a6 scratchpad `e2e_data3_out.txt`.
- A3b–C3 Pass 2026-10-09. During the run: zone label "Not attached to a
  zone" `142b6fb`; Insights Dashboard tabs + menu renamed "Insights
  Dashboard" `2fdac69` (both pushed). The card is on the first tab, so
  the remaining steps are unchanged.
- **Next:** D1. Basheer runs the Simple steps himself.
- Dev test Opportunity "Test +lead screen" (Basheer K): reassign, don't
  delete (it has Activity rows).
- UAT move: after the combined E2E, together with Hospital-wise Target
  Planning (migrations 0055 + 0056, manual/help update) and hospital
  re-filing (Option A, held until Basheer talks to Haroon; plan step 5).
- Close dates: Haroon answered all 3 questions 2026-10-08 (Backlog "UAT:
  fill in missing 'date closed'"; row 35 dropped — Life Line duplicate,
  credit question waits on Haroon). **Next:** write the UAT fill-in plan
  for the other 36 (fresh backup first, Basheer runs it; own approval).
- At the post-commit checklist: rename both `Plan-vs-Actuals-Tracking-*`
  docs to `Target-vs-Actuals-*` and fix links (Business-Rules,
  Traceability, Insights-Dashboard plan, Hospital-Wise plan,
  Salesperson-Performance discussion, this note); history docs keep the
  old name.
- Forecast plan (untracked, other session) line 110: update to BR-FIN-09
  at its review.

## Duplicate hospitals — fix plan drafted 2026-10-08, awaiting Basheer

- Plan: `docs/Duplicate-Hospital-Prevention-Implementation-Plan.md`
  (Draft); its proposed decisions wait on Basheer.
- **Next:** decisions marked → Part A on `hotfix/create-anyway-guard`
  from `uat`, starting with the plan's "What could be affected" list.

## Query load fixes — approved 2026-10-06, fix 4 due Mon 2026-10-12

- Plan: `docs/Query-Load-Fixes-Implementation-Plan.md`; history in its
  sections 6–8 and Progress-Archive-2026-10. Fixes 1–3 on UAT; fix 4
  goes with the next full promotion (D9).
- The other session owns Target vs Actuals files: check `git status`
  before every save and commit.
- **Next:** plan section 9 from step 2, through step 9 (merge `uat`
  back into `main`, remove the `uat-fix3` worktree).
- **Then:** fix 4 on Dev, starting with its "What could be affected"
  list for approval; approach in the plan's technical addendum. Due
  committed on `main` by Mon 2026-10-12 (Basheer, 2026-10-09).

## Audit Trail Redesign — built and tested on Dev; UAT move waiting

- Plan: `docs/Audit-Trail-Redesign-Implementation-Plan.md`; history in
  Progress-Archive-2026-10, tracked in Backlog.
- **Next:** UAT move (migration 0059 + steps 2–4), own approval; the
  plan's step 5 has the pre-move cautions. Then the post-commit
  checklist.

## Opportunity chance rules + one create form — plan drafted 2026-10-09

- Plan: `docs/Opportunity-Chance-And-Create-Form-Implementation-Plan.md`
  (Draft). D1–D6 decided (Basheer, 2026-10-09): BR-OP-19 (chance ≥ 50 %
  before Negotiation needs an Expected Closure Date) and the BR-OP-08
  note are in Business-Rules + Matrix; Backlog rule gaps 7 → 6 (BR-OP-08
  now tracked by the plan). UAT with the next full promotion.
- Waiting on Basheer: D7–D13 (shown in chat 2026-10-09 with a
  recommendation each) and deleting the other session's untracked
  `Opportunity-Create-Form-Unification-Implementation-Plan.md`.
- **Next:** decisions marked → fill the plan's "What could be affected"
  from a code search → approval → build step 1.
- Then the other 6 rule gaps one by one: BR-FIN-05 (verify in code
  first), BR-ACT-02, BR-PROJ-01, BR-OP-06, BR-ACC-01, BR-ACT-07.

