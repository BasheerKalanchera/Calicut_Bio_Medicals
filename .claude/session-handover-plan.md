# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- Forecast plan (untracked, other session): not in commits; at review, line 110 → BR-FIN-09.

## Annual Target Planning — approved 2026-10-20 (D1–D56)

- Plan approved by Basheer 2026-10-20 (archive 20 Oct entry); `/build`
  note updated with his yes (Part 1, steps 1–4). In `92cab23` + repair
  `006f4cb`, both pushed 2026-10-20 — `/build` can take in `main` now.
- 21 Oct: Part 1 E2E plan written (sections A–H, uncommitted) and D57
  added to the plan (SBU Manager gets one figure from Haroon, divides it
  among their Area Managers) — Basheer's yes. Committed and pushed in
  `7dceac8` with the retro. Part 1 is now built by Build & Test, not
  `/build` (Basheer, 21 Oct).
- **Next (Basheer, 22 Oct, via Build & Test):** write the Part 2 E2E test
  sections (plan steps 5–7: Year view, plan notifications, Brands
  Billing to Cabio). Build & Test builds Part 2 after Part 1's E2E.
  22 Oct: D66–D73 + D62 amendment written; Part 2 test sections
  (P6–P8, I–K) saved in the test plan; Backlog "Reporting line when
  Haroon moves to CEO". Committed and pushed in `d654427` with the
  retro (8 corrections). Next: nothing here until Build & Test runs Part
  1's E2E; then Part 2 is built against these sections.

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

- Basheer, 22 Oct: help moves to a table with an Admin/GM editor (plan
  D1 changed, D9–D13; uncommitted). Step 3b (table + editor) is Build &
  Test's — tell Basheer, don't edit their note.
- 22 Oct: Basheer asked for a proper plan + test plan for Build & Test:
  `docs/In-App-Help-Editor-Implementation-Plan.md` (Approved 22 Oct,
  D1–D11; Basheer tells Build & Test) and
  `docs/In-App-Help-Editor-Manual-E2E-Test-Plan.md` (uncommitted).
- **Then:** help wording screen by screen into the help plan's section
  7, each beside its manual section. First screen: Account Management.

## Harness Engineering

- 21 Oct: exercise cut down (Basheer) — weekly review, retro = count of
  his corrections; 31 judgement items accepted, open 9 (Reviews line in
  the tracker; archive 21 Oct entry). Committed with the doc tidy-up in
  `1f5b425`, pushed. Next review 2026-10-28. 21 Oct retros (archive):
  2 corrections, then 3 in the second session (`f469db6`, pushed, with
  the My Work plan approval).
  The paperwork and right-pack checks are dropped with it.

## Chores

- Delete Dev test data from Duplicate hospitals Part A (five "zz Test
  duplicate guard…" hospitals, "zz Test contact"); read-only check first.
  Open: deactivate the test Marketing User login (2026-10-10)?
