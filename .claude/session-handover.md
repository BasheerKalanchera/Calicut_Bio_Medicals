# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

- Build & Test session: ignore due-today reminders; the planning and
  chores session handles them (Basheer, 2026-10-13).
- Untracked plan doc from another session (Forecast): leave it out of commits.
  At its review, update its line 110 to BR-FIN-09.

## Payment collection and cycle time — paper drafted 2026-10-13

- Latheef Bhai's 13 Oct ask: `docs/Discussion-Collections-and-Cycle-Time-2026-10.md`
  (Draft; Q1–Q6 proposed). Traceability beyond-contract "Requested" row 3
  + notes on 11.1 and 13.2. **Next:** Basheer answers Q1–Q6 (some go to
  Haroon / Latheef Bhai).

## Before the next UAT move

- User Manual and Help Catch-up plan (approved 2026-10-01, not started)
  must land first; it now follows the "plan" wording (Frontend Standards
  6.10). Rep plan wording (`25fbeab`, `af4b4e9`, E2E Pass 2026-10-14;
  history in Progress-Archive) goes with that move.

## Process consolidation — plan approved 2026-10-08, building

- Plan: `docs/Process-Consolidation-Implementation-Plan.md`. Steps 1–3
  done 2026-10-08 (`baf56b4`).
- 2026-10-14 weekly review: built P72, P1, P3, P14 (`858b4dc`, not
  pushed). The per-message reminder, the figures-and-sources check and
  the loosened folder guard are live.
- 2026-10-14 retro done; open list now 19 (P74 new). **Uncommitted, for
  the next docs batch (own approval):** retro in Progress-Archive-2026-10
  (the Rep plan wording entry above it is the other session's), tracker
  counts/P74/watch-list line in `docs/Process-Improvements.md`,
  Process Consolidation plan "Most-repeated mistakes" line fixed, and
  this handover update.
- **Next:** the rest of the top 10 in Pareto order (P15, reminder after
  each finished file, is next).
- Still to write, shown first: paperwork check in `cabio-post-commit`
  (feat/fix only, all living docs + handover); daily review procedure
  and right-pack check in `process-review`.

## Target vs Actuals (Plan vs Actuals Tracking, Insights Dashboard)

- Plans: `docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md` and
  `docs/Target-Coverage-Roster-Implementation-Plan.md`; test plan
  `docs/Plan-vs-Actuals-Tracking-Manual-E2E-Test-Plan.md` (results per
  step). History: Progress-Archive-2026-10; follow-ups: Backlog "Target
  vs Actuals: follow-ups after the combined E2E".
- Combined E2E on Dev finished 2026-10-13: P1–K39 all Pass (Progress-
  Archive 2026-10-13). Order decided 2026-10-13 (plan step 7): demo to
  Haroon and Latheef Bhai on Dev → UAT move (promotion plan to write,
  own approval) → card redesign 6d after sales-team feedback.
  Demo script: `docs/Demo-2026-10-Haroon-Latheef.md` (its date line:
  Basheer updates). Demo on 15 Oct 2026; deck
  https://claude.ai/artifact/J3TSFdTxVoxnHJVD1hSxYH (private; share
  before sending). **Next:** Basheer's full review of the deck (14 Oct),
  editing it himself; changes from Claude only if he asks.
- The UAT move plan starts with Query Load plan section 9, steps 2–9
  (UAT's fix 3 copy into `main`, remove `uat-fix3`) — Basheer, 2026-10-14.

## Build & Test — next items (2026-10-14)

- Duplicate hospitals Part A: done on Dev (`f04d309`); to UAT with the
  next full move, then test plan step 19. **Next:** delete the test data
  from Dev, namely five "zz Test duplicate guard…" hospitals and the "zz Test
  contact" stakeholder (Basheer, 2026-10-14; read-only check shown
  first; load `cabio-db-and-scripting`). Left to the planning and
  chores session (Basheer, 2026-10-14).
- Then: (3) the whole Win Probability plan, steps 1–3 (in progress, see
  its section); (4) next-action
  rules plan (approved 2026-10-14). All go to UAT with the next full
  move. Check in before each.
- **Overlap:** the whole next-action build starts only after the form
  merge (Win Probability step 2) — Basheer, 2026-10-14, plan D7.

## Audit Trail Redesign — built and tested on Dev; UAT move waiting

- Plan: `docs/Audit-Trail-Redesign-Implementation-Plan.md`; history in
  Progress-Archive-2026-10, tracked in Backlog.
- **Next:** UAT move (migration 0059 + steps 2–4), own approval; the
  plan's step 5 has the pre-move cautions. Then the post-commit
  checklist.

## Win Probability rule + one create form — plan approved 2026-10-10

- Plan: `docs/Win-Probability-Rule-and-One-Create-Form-Implementation-Plan.md`
  — Approved 2026-10-10, D1–D17 all decided (history: Progress-Archive
  2026-10-09 and 2026-10-10). BR-OP-19 (Active Opportunity, chance ≥ 50 %
  before Negotiation, needs an Expected Closure Date) in Business-Rules +
  Matrix. UAT with the next full promotion.
- Order changed 2026-10-14 (Basheer, plan D5): step 2 (form merge)
  first, then steps 1 and 3 together in one commit. Form comparison done:
  nothing lost; Project Directory's pre-filled Name carried over.
- Step 2 code done and pushed (`a76b02d`, `86dd1a3`); regression
  section E added to the test plan (history in Progress-Archive).
- **Next:** D12 rule in Frontend Standards and UI-Inventory, then check
  in before steps 1 + 3.
- Then the other 6 rule gaps one by one: BR-FIN-05 (verify in code
  first), BR-ACT-02, BR-PROJ-01, BR-OP-06, BR-ACC-01, BR-ACT-07.

- Marketing User with no SBU: done 2026-10-10 (history in
  Progress-Archive). Open: Basheer to decide whether to deactivate the
  test Marketing User login from the browser check.

## Weekly Follow-up / My Work — plan drafted 2026-10-11, decisions in progress
- `docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md`. Decided
  2026-10-14 (Basheer): D1 (opens on own work; managers get a "Showing:
  Me ▾" switch), D3 (four sections; PRD's high-priority and 70 %+ lists
  merged), D3a, D4 (a) and (b), D6–D6d, D11 (pre-fill moved to the
  Next-Action plan), D12, D13 (step 3 kept, reduced: uses the Next-Action
  plan's step 1, built first; My Work's E2E tests it through My Work's
  buttons). BR-OP-20 and BR-OP-06 (switched off) saved in Business-Rules.
- **Next (Plan & Chore session, 15 Oct morning):** last round, proposed
  D5, D7, D8, D9b, D10, D14; then the plan's "what could be affected"
  pass and approval.
## Next-action rules — plan approved 2026-10-14
- `docs/Next-Action-Rules-Implementation-Plan.md` — Approved 2026-10-14
  (D1–D9 Basheer's); BR-ACC-05 added to Business-Rules. E2E test plan
  `docs/Next-Action-Rules-Manual-E2E-Test-Plan.md` (Won checked on Dev
  via a fast-track Opportunity, step D8 — Basheer). Both committed
  `d0e1f1e`. Added 2026-10-14 after approval: D10 pre-fill
  in step 1 (from the My Work plan) and pre-fill checks in E2E steps A3,
  B2, C3, D2. **Next:** build step 1, after Win Probability
  step 2; check in first.
