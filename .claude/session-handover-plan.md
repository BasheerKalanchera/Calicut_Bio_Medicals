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

## UAT move — approved 2026-10-24, move early Sun 25 Oct

- `docs/UAT-Promotion-2026-10-Plan.md` Approved (D1–D11; uncommitted);
  it lists what goes. Before-the-day step 1 done 24 Oct: Pipeline
  comparison 92/92 identical, fix 3 closed (Basheer); merge `2547a0f`
  pushed; `uat-fix3` removed; tool change `0854766` pushed. **Next:**
  docs batch (retro first); then before-the-day steps 3–6
  (fresh-install check, Dev role smoke test, D6 UAT check — ask first,
  after-move script + team message).
- 24 Oct: UAT backup done (`cabio_uat_2026-10-24_1039.dump`); doc
  tidy-up done (Annual Target plan Status, log line; uncommitted).
  Passed to Basheer for Build & Test: Dev is at 0063, not 0062.
- After the move: Duplicate hospitals step 19 on UAT; Audit Trail plan
  step 5 cautions.

## User Manual and help catch-up

- Moves a day or two after the app (User Manual plan D15). Draft PDF
  `Desktop\cabio\Cabio-Sales-OS-User-Manual.pdf`. **Next:** Basheer
  reviews it, then step 3 (in-app help); check in first. Open
  (unanswered): Backlog items for deletes with no "Are you sure?" and the
  Lead Source picker showing "REPEAT_ORDER"-style codes?

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
  Part B "Pipeline" fixed. 23 Oct: help plan D14 (six pop-up forms get
  help, 22 → 28; Basheer) written into the help plan, help editor plan
  (D5, D9b, section 3 a2, addendum) and its test plan (steps 24–25) —
  both committed and pushed in `0d37e1c` with the retro (6
  corrections). Basheer to tell Build & Test. Doc tidy-up: tomorrow.
  "+ Add Hospital" checked; wording drafted (not yet agreed) for New
  Opportunity help + manual "Create an Opportunity". Open: rename
  the "New Customer" pop-up title to "New Hospital"? **Next:** Log
  Activity pop-up help.

## Harness Engineering

- Next weekly review 2026-10-28 (21 Oct changes in archive, `1f5b425`).

## Chores

- From Build & Test (archive 23 Oct, Annual Target plan D75; Basheer
  yes): UAT User Manual still says "SBU Target & Plans" (lines 206, 213,
  264, 446). That card is now three: "SBU Target" (Admin, GM, SBU
  Managers), "Team Targets", "Team Plans" (everyone), each in the
  Quarterly and Annual views. Fix once D75 is committed.
- Delete Dev test data from Duplicate hospitals Part A (five "zz Test
  duplicate guard…" hospitals, "zz Test contact"); read-only check first.
  Open: deactivate the test Marketing User login (2026-10-10)?
