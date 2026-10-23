# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- Forecast plan (untracked, other session): not in commits; at review, line 110 → BR-FIN-09.

## Annual Target Planning — approved 2026-10-20

- Part 1 and Part 2 test sections done (`7dceac8`, `d654427`; archive).
  Nothing here until Build & Test runs Part 1's E2E; then Part 2 is
  built against those sections.

## Next full UAT move — what goes, and what must land first

- **Must land first:** User Manual and Help Catch-up plan. Draft PDF
  `Desktop\cabio\Cabio-Sales-OS-User-Manual.pdf`. **Next:** Basheer
  reviews it, then step 3 (in-app help); check in first. Open
  (unanswered): Backlog items for deletes with no "Are you sure?" and the
  Lead Source picker showing "REPEAT_ORDER"-style codes? Annual Target
  Part 1 lands first too (D52). The move plan (Build & Test) starts with
  Query Load plan section 9, steps 2–9 — Basheer, 2026-10-14.
- **Goes with it, E2E-passed on Dev:** Target vs Actuals + roster; Audit
  Trail Redesign (0059; plan step 5 cautions); Win Probability + one
  create form; Rep plan wording; Duplicate hospitals Part A (then step 19
  on UAT); My Work step 1, landing screen + new-hospital page (`508ff42`,
  My Work plan D14a, Basheer 21 Oct). Each plan's Status line has its commits.

## In-app help (help plan step 3a) — in progress 2026-10-22

- 22 Oct: help moves to a table with an Admin/GM editor (help plan D1
  changed, D9–D13). Step 3b is Build & Test's own plan,
  `docs/In-App-Help-Editor-Implementation-Plan.md` (Approved 22 Oct,
  D1–D11) + its E2E test plan — committed and pushed in `4aadacc`.
  Basheer tells Build & Test; don't edit their note. Retro (3
  corrections) in the archive.
- Help wording screen by screen into the help plan's section 7, each
  beside its manual section; each opens with "What this page is for"
  (Basheer). 22 Oct: Account Management and Customer 360 agreed, manual
  fixed beside each — committed and pushed in `d5e7c97` with the retro
  (1 correction). 23 Oct: Pipeline agreed (manager box kept), manual
  Part B "Pipeline" fixed — uncommitted, docs batch. 23 Oct: help plan
  D14 (six pop-up forms get help, 22 → 28; Basheer) written into the
  help plan, help editor plan (D5, D9b, figures, addendum) and its test
  plan (steps 24–25) — uncommitted. Basheer to tell Build & Test.
  "+ Add Hospital" checked; wording drafted (not yet agreed) for New
  Opportunity help + manual "Create an Opportunity". Open: rename
  the "New Customer" pop-up title to "New Hospital"? **Next:** Log
  Activity pop-up help.

## Harness Engineering

- Next weekly review 2026-10-28 (21 Oct changes in archive, `1f5b425`).

## Chores

- From Build & Test (archive 23 Oct, D75): UAT User Manual still says
  "SBU Target & Plans" (their lines 206, 213, 264, 446); now "Team
  Plans". Fix once their Annual Target work is committed.
- Delete Dev test data from Duplicate hospitals Part A (five "zz Test
  duplicate guard…" hospitals, "zz Test contact"); read-only check first.
  Open: deactivate the test Marketing User login (2026-10-10)?
