# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- Untracked plan doc from another session (Forecast): leave it out of commits.
  At its review, update its line 110 to BR-FIN-09.

## Annual Target Planning — being replanned (calendar-year brand targets)

- 2026-10-17 (`107bccc`, pushed): plan and E2E plan on hold; D23–D28 (D8, D12,
  D12a, D14 withdrawn). 19 Oct: Haroon and Latheef Bhai chose Option 3
  (quarterly, Apr–Mar running total) — D29; reps get quarterly targets from
  their Area Manager (D30); D31–D44 (starts Oct–Dec 2026; brand years
  vary; two parts, D44). **Next:** rewrite plan sections 1–6 as Part 1 /
  Part 2 and the E2E plan, for approval. Hold line for the `/build` note:
  only with Basheer's yes.

## Next full UAT move — what goes, and what must land first

- **Must land first:** User Manual and Help Catch-up plan. Steps 1–2 done
  2026-10-15 (`docs/UAT-User-Manual.md` rewritten). Draft PDF:
  `Desktop\cabio\Cabio-Sales-OS-User-Manual.pdf` (11 pages). **Next:**
  Basheer reviews the PDF, then step 3 (in-app help); check in first.
  Open (unanswered): Backlog items for deletes with no "Are you sure?"
  (Opportunity documents, stakeholder links) and the Lead Source picker
  showing "REPEAT_ORDER"-style codes?
- **Must land first, too:** Annual Target Planning (D17) — replan above.
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

## Harness Engineering — plan approved 2026-10-08, building

- Plan: `docs/Harness-Engineering-Implementation-Plan.md`; tracker
  `docs/Process-Improvements.md`, open list 30 (counted 2026-10-19 after
  the session retro added P89).
- 2026-10-19 review: built P24, P77, P72 and the P16 quiet-commit fix
  (`806aec1`, pushed; the P16 fix fired live on it). **Next review
  2026-10-21:** P88, P87, P89 first. P15 hits the 7-day skip limit 2026-10-24;
  ten watch-list lines too.
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
- **Open question for Basheer (14 Oct, unanswered):** Keep the
  pre-fill in all four close forms, or Log Activity only?
