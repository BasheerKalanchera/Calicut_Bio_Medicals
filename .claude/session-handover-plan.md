# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- Forecast plan (untracked, other session): not in commits; at review, line 110 → BR-FIN-09.
## MUI clean-up plan — started 26 Oct (current task)

- `docs/MUI-Good-Practice-Implementation-Plan.md` (Approved, D1–D17;
  history in the archive 26 Oct). Step 1 done and pushed (`de10903`);
  Build & Test shipped step 2 (`2e3ddd7`, `64b5fef`). Lighter review
  first, most-used phone screens (Basheer). Round 1 review done 26 Oct
  (plan step 4: findings and before-pictures folder written into step
  5) — committed and pushed `10010f2`. **Next:** Basheer passes step 5 to Build & Test (fixes by Sun 1
  Nov, then before-and-after page).

## After the UAT move (25 Oct, details in the archive)

- Checks paused to 1 Nov: then run both scripts on UAT (ask first).
  Duplicate hospitals step 19 on UAT; Audit Trail plan step 5 cautions.

## User Manual and help catch-up

- Moves a day or two after the app (User Manual plan D15). Draft PDF
  `Desktop\cabio\Cabio-Sales-OS-User-Manual.pdf`. **Next:** Basheer
  reviews it.

## In-app help (help plan step 3a) — in progress 2026-10-22

- 22 Oct: help moves to a table with an Admin/GM editor (help plan D1
  changed, D9–D13). Step 3b is Build & Test's own plan,
  `docs/In-App-Help-Editor-Implementation-Plan.md` (Approved 22 Oct,
  D1–D11) + its E2E test plan — committed and pushed in `4aadacc`.
  Basheer tells Build & Test; don't edit their note. Retro (3
  corrections) in the archive.
- Help wording screen by screen into the help plan's section 7, each
  beside its manual section; each opens with "What this page is for"
  (Basheer). Agreed so far: Account Management, Customer 360, Pipeline
  (`d5e7c97`, `0d37e1c`); 25 Oct Log Activity, Close Next Action, Why
  this change?, First activity (help plan D16: 8 pop-ups, 30 pages) —
  archive 25 Oct; committed and pushed in `c5870d2`. Basheer to tell Build & Test
  about D14 and D16. New Opportunity, Edit Opportunity agreed 25 Oct;
  Backlog decisions, Reference Data D5 — archive 25 Oct; committed and
  pushed in `393beee`. Every reply here closes with "Help wording: N of
  30 (P %)", counted from section 7's "agreed" headings (Basheer, 25
  Oct). New Stakeholder agreed 26 Oct (10 of 30) + manual A2 step —
  archive 26 Oct; committed `de10903`. New Customer agreed 26 Oct (11
  of 30; all 8 pop-ups done), manual A2 line, BR-ACC-03 fix, wording
  sweeps one pass (Basheer tells Build & Test) — committed and pushed
  `8c853d4` (with the MUI pre-E2E review item). **Next:** one pass over the 10 earlier entries for the word
  rules (help plan section 7 format notes), then the next screen.

## Harness Engineering

- Next weekly review 2026-10-28 (`1f5b425`); Basheer wants a thorough
  analysis of corrections (tracker "For the next review").

## Chores

- From Build & Test (archive 23 Oct, Annual Target plan D75; Basheer
  yes): UAT User Manual still says "SBU Target & Plans" (lines 267, 274,
  325, 507). That card is now three: "SBU Target" (Admin, GM, SBU
  Managers), "Team Targets", "Team Plans" (Admin, GM, SBU and Area
  Managers; not reps). 4 edits proposed 26 Oct; **on hold** (Basheer, 26
  Oct) until Annual Target Part 2 changes these screens — then re-read
  the screen and redo.
- Delete Dev test data from Duplicate hospitals Part A (five "zz Test
  duplicate guard…" hospitals, "zz Test contact") and "kims" (Rudrappa,
  Dev role check 25 Oct); read-only check first.
  Open: deactivate the test Marketing User login (2026-10-10)?
