# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- Forecast plan (untracked, other session): not in commits; at review, line 110 → BR-FIN-09.

## UAT move — approved 2026-10-24, move early Sun 25 Oct

- Move done 25 Oct; after-move work in the archive (25 Oct, "after the
  UAT move"). Both 25 Oct reports approved and moved out of drafts.
  Scripts committed in `5992936`; docs batch `b294865`; both pushed.
  Checks paused to 1 Nov: then run both scripts on UAT (ask first).
- After the move: Duplicate hospitals step 19 on UAT; Audit Trail plan
  step 5 cautions.

## My Work E2E test plan — drafted 2026-10-25

- D18 (build straight after Annual Target Part 2 E2E) in the Weekly
  Follow-up plan. Test plan `docs/Weekly-Follow-up-Daily-Hub-Manual-E2E-Test-Plan.md`
  drafted from Dev data (scratchpad session c1568b11). D19–D22 decided
  (first on menu; N or more, BR-OP-20 reworded; count-only next-action
  cards; owner-only lists) and in the test plan; archive 25 Oct. Not
  committed: docs batch at the next pause (show first). Basheer to tell
  Build & Test about D18–D22.

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
  Backlog decisions, Reference Data D5 — archive 25 Oct. Not committed.
  Every reply here closes with "Help wording: N of 30 (P %)", counted
  from section 7's "agreed" headings (Basheer, 25 Oct). **Next:** docs
  batch commit (show first), then New Stakeholder pop-up help.

## Harness Engineering

- Next weekly review 2026-10-28 (21 Oct changes in archive, `1f5b425`).
  Basheer: thorough analysis of corrections then (tracker "For the next
  review").

## Chores

- From Build & Test (archive 23 Oct, Annual Target plan D75; Basheer
  yes): UAT User Manual still says "SBU Target & Plans" (lines 206, 213,
  264, 446). That card is now three: "SBU Target" (Admin, GM, SBU
  Managers), "Team Targets", "Team Plans" (everyone), each in the
  Quarterly and Annual views. Fix once D75 is committed.
- Delete Dev test data from Duplicate hospitals Part A (five "zz Test
  duplicate guard…" hospitals, "zz Test contact") and "kims" (Rudrappa,
  Dev role check 25 Oct); read-only check first.
  Open: deactivate the test Marketing User login (2026-10-10)?
