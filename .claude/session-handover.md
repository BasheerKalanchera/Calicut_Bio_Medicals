# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

- Build & Test session: ignore due-today reminders; the planning and
  chores session handles them (Basheer, 2026-10-13).
- Untracked plan doc from another session (Forecast): leave it out of commits.
  At its review, update its line 110 to BR-FIN-09.

## Next full UAT move — what goes, and what must land first

- **Must land first:** User Manual and Help Catch-up plan. Steps 1–2 done
  2026-10-15 (`docs/UAT-User-Manual.md` rewritten). Draft PDF:
  `Desktop\cabio\Cabio-Sales-OS-User-Manual.pdf` (11 pages). **Next:**
  Basheer reviews the PDF, then step 3 (in-app help); check in first.
  Open (unanswered): Backlog items for deletes with no "Are you sure?"
  (Opportunity documents, stakeholder links) and the Lead Source picker
  showing "REPEAT_ORDER"-style codes?
- **The move plan** (to write, own approval) starts with Query Load plan
  section 9, steps 2–9 (UAT's fix 3 copy into `main`, remove `uat-fix3`)
  — Basheer, 2026-10-14.
- **Goes with it, all built and E2E-passed on Dev:** Target vs Actuals +
  Target & Coverage roster; Audit Trail Redesign (migration 0059 + its
  plan's steps 2–4; step 5 has the pre-move cautions); Win Probability +
  one create form; Rep plan wording; Duplicate hospitals Part A (then its
  test plan step 19 on UAT). Each plan's Status line has its commits.
- After the move: Target vs Actuals card redesign (roster plan step 6d),
  shaped by the sales team's feedback on UAT (plan step 7).

## Annual targets — feedback from the 15 Oct demo

- Demo to Haroon and Latheef Bhai held on Dev, 15 Oct 2026 (Basheer,
  2026-10-16). Their main ask, a yearly target layer on Brand Target
  Tracking and Target & Coverage Planning:
  `docs/Discussion-Annual-Target-Planning-2026-10.md` (all answered
  2026-10-16). Plan drafted 2026-10-16:
  `docs/Annual-Target-Planning-Implementation-Plan.md` (Draft; D1–D10
  decided, D11–D17 proposed). **Next:** Basheer answers D11–D17; then
  the E2E test plan. Build after the UAT move above.

## Harness Engineering — plan approved 2026-10-08, building

- Plan: `docs/Harness-Engineering-Implementation-Plan.md`; tracker
  `docs/Process-Improvements.md`, open list 22 (counted 2026-10-16).
- **Next:** the rest of the top 10 in Pareto order (P15, reminder after
  each finished file, is next).
- Still to write, shown first: paperwork check in `cabio-post-commit`
  (feat/fix only, all living docs + handover); right-pack check in
  `harness-engineering` (its review steps written 2026-10-15).

## Chores left to the planning and chores session

- Delete the Dev test data from Duplicate hospitals Part A: five "zz Test
  duplicate guard…" hospitals and the "zz Test contact" stakeholder
  (Basheer, 2026-10-14; read-only check shown first; load
  `cabio-db-and-scripting`).
- Open: Basheer to decide whether to deactivate the test Marketing User
  login from the 2026-10-10 browser check.

## Weekly Follow-up / My Work — plan drafted 2026-10-11, decisions in progress
- `docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md`. Decided
  2026-10-14 (Basheer): D1 (opens on own work; managers get a "Showing:
  Me ▾" switch), D3 (four sections; PRD's high-priority and 70 %+ lists
  merged), D3a, D4 (a) and (b), D6–D6d, D11 (pre-fill moved to the
  Next-Action plan), D12, D13 (step 3 kept, reduced: uses the Next-Action
  plan's step 1, built first; My Work's E2E tests it through My Work's
  buttons). BR-OP-20 and BR-OP-06 (switched off) saved in Business-Rules.
- **Next (Plan & Chore session):** last round, proposed D5, D7, D8, D9b,
  D10, D14; then the plan's "what could be affected" pass and approval.
- **Open questions for Basheer (14 Oct, unanswered):** republish the
  client scorecard (13.2 client line changed in `4c6f168`)? Keep the
  pre-fill in all four close forms, or Log Activity only? Write handover
  and archive notes without asking first (CLAUDE.md says show first)?

## Next-action rules — plan approved 2026-10-14, building
- `docs/Next-Action-Rules-Implementation-Plan.md`; E2E test plan
  `docs/Next-Action-Rules-Manual-E2E-Test-Plan.md`. Step 1 built
  2026-10-15 (`3d38e75`). Step 1's quick browser check skipped
  (Basheer, 2026-10-16: the E2E after step 5 covers it).
- Steps 2 and 3 built and pushed 2026-10-16 (step 3 `c4e1ca3`: every
  new Opportunity starts with a "First activity" pop-up; D16–D20).
  Details in the plan's Status line and Progress-Archive.
- **Next:** step 4 of the plan. Check in first.
- Also before the E2E: check the E2E test plan's section C against
  D12–D15.
- Not yet scheduled (was Win Probability's next item): the other 6 rule
  gaps, Backlog "Business rules vs code — 6 gaps awaiting decision".
