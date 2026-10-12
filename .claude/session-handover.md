# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

- Untracked plan doc from another session (Forecast): leave it out of commits.
  At its review, update its line 110 to BR-FIN-09.

## UAT data-quality check 2026-10-11 — drafts awaiting Basheer

- Both 11 Oct drafts in `C:\Backups\CabioUAT\data_consistency_reports\drafts\`.
  **Next:** on approval, move them up and add the result to the
  Progress-Archive 2026-10-11 entry (script fix `738829e`).

## Process consolidation — plan approved 2026-10-08, building

- Plan: `docs/Process-Consolidation-Implementation-Plan.md`. Steps 1–3
  done 2026-10-08 (`baf56b4`).
- 2026-10-10: 9 drops done; new watch list in `docs/Process-Improvements.md`
  (seen-once slips, deleted after 7 days with no repeat); retro rules in
  `process-review` (repeat = +1, watch list, cap of 10). Open list 40 → 13
  items in 11 jobs (top 10 + P47); 16 on the watch list.
- **Next:** job 1 (P1, numbers and examples correct and sourced), then
  the rest of the top 10 in Pareto order.
- Still to write, shown first: paperwork check in `cabio-post-commit`
  (feat/fix only, all living docs + handover); daily review procedure
  and right-pack check in `process-review`.

## Target vs Actuals (Plan vs Actuals Tracking, Insights Dashboard)

- Plans: `docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md` and
  `docs/Target-Coverage-Roster-Implementation-Plan.md`; test plan
  `docs/Plan-vs-Actuals-Tracking-Manual-E2E-Test-Plan.md` (results per
  step). History: Progress-Archive-2026-10; follow-ups: Backlog "Target
  vs Actuals: follow-ups after the combined E2E".
- Combined E2E on Dev: P1–J6 done except J1, J2, J5 and section K. Last
  fix `24c05d5` (I2, pushed 2026-10-12). **Next:** J1 as Rudrappa, then
  J2 (Fahad), J5 (Basheer K), then section K.

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

## Opportunity chance rules + one create form — plan approved 2026-10-10

- Plan: `docs/Opportunity-Chance-And-Create-Form-Implementation-Plan.md`
  — Approved 2026-10-10, D1–D17 all decided (history: Progress-Archive
  2026-10-09 and 2026-10-10). BR-OP-19 (Active Opportunity, chance ≥ 50 %
  before Negotiation, needs an Expected Closure Date) in Business-Rules +
  Matrix. UAT with the next full promotion.
- **Next:** build step 1 (server check + Opportunity page fix); check in
  before starting it.
- Then the other 6 rule gaps one by one: BR-FIN-05 (verify in code
  first), BR-ACT-02, BR-PROJ-01, BR-OP-06, BR-ACC-01, BR-ACT-07.

- Marketing User with no SBU: done 2026-10-10 (history in
  Progress-Archive). Open: Basheer to decide whether to deactivate the
  test Marketing User login from the browser check.

## Weekly Follow-up / My Work — plan drafted 2026-10-11
- `docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md`; D2 (My Work) and D6 (30 days) decided `8f781dc`. **Next:** BR-OP-20 / BR-OP-06 wording shown to Basheer first, then the other proposed decisions.
## Next-action rules — all questions answered 2026-10-12
- `docs/Discussion-Next-Action-Driven-Activity-Logging-2026-10.md` section 5a; rules in Business-Rules (BR-OP-21, BR-OP-22, BR-ACT-11, BR-ACT-05 change); separate plan chosen (Q11). Q10: a Note carries a new hospital's first next action. **Next:** write the plan (own approval).
