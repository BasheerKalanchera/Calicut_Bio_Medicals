# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Next-action rules — plan approved 2026-10-14, building
- `docs/Next-Action-Rules-Implementation-Plan.md`; E2E test plan
  `docs/Next-Action-Rules-Manual-E2E-Test-Plan.md`. Step 1 built
  2026-10-15 (`3d38e75`). Step 1's quick browser check skipped
  (Basheer, 2026-10-16: the E2E after step 5 covers it).
- Steps 2 and 3 built and pushed 2026-10-16 (step 3 `c4e1ca3`: every
  new Opportunity starts with a "First activity" pop-up; D16–D20).
  Details in the plan's Status line and Progress-Archive.
- Step 4 dropped 2026-10-16, BR-ACC-05 withdrawn (plan D21).
- Step 5 started 2026-10-16 (Basheer's go-ahead): data-quality script
  counts On Hold in "no open next action" (`f93397f`); E2E test plan
  sections D and E checked against D12–D19 and corrected (new steps
  D4a, E5).
- Pre-E2E code review done 2026-10-16; fixes pushed `4bec886`, script
  `f93397f` (Progress-Archive entry).
- Manual E2E started 2026-10-17 (re-check done, lead for E4 "New usg
  m/c needed."; A–C and G wording checked against the code; third G
  check dropped). Pre-flight 4/4, sections A and C all Pass — 12 of 32
  steps; results in the test plan (`90b7e20`). Retro 2026-10-17
  written to Progress-Archive and Process-Improvements, not committed —
  goes in the next docs batch (Basheer). Basheer K in
  Claude's tab, Haroon/Vivek in Basheer's private window; a full page
  reload is needed to see another user's save.
- Section B all Pass 2026-10-17 (B4 created "zz NA E2E – from hospital
  visit" (KIMS Hospital Trivandrum)) — 17 of 32 steps; results in the
  test plan, not committed.
- D1 Pass 2026-10-17 ("Ultrasound m/c" (KIMS Hospital Trivandrum) now
  Qualified, follow-up "zz E2E D1 follow-up call"); D2 Pass ("usg m/c"
  (aster medicity) now Qualified); D3 Pass; D4 Pass ("Ultrasound m/c"
  now Demo); D4a Pass ("usg m/c" now Demo) — 22 of 32 steps. D4/D4a
  wording now includes Demo Start Date (stage gate).
- Small-fixes batch, made 2026-10-17 (Basheer's go), not committed: pop-up
  label "Closing your/this next action (due …):" and stage-change
  follow-up hints in `CloseReminderModal.tsx` (D1, D4a findings);
  committed `06b41a0` at the day's pause (not pushed).
- D5 first try 2026-10-17 found a bug (nothing saved): On Hold follow-up
  due date started at tomorrow, not the re-activation date
  (Business-Rules BR-OP-02). Fixed in `CloseReminderModal.tsx` (Basheer's
  go), committed `856d041` (not pushed). D5 Pass on
  retry ("Imaging department refresh" (Baby Memorial Hospital) now On
  Hold); D6 Pass ("new lead" (aster medicity) now Lost) — 24 of 32
  steps. BR-OP-02 marked built, retro part 2 in Progress-Archive.
  Paused for the day 2026-10-17 (Basheer).
- **Next:** D7 (Simple: Next Actions screen, close "Meet Dr Ajmal in
  person" (aster medicity), no follow-up), D8, then E, G; progress
  line with % after each step (Basheer, 2026-10-17).
- Not yet scheduled (was Win Probability's next item): the other 6 rule
  gaps, Backlog "Business rules vs code — 6 gaps awaiting decision".

## Annual Target Planning — being built by the `/build` session

- Moved 2026-10-17 (Basheer): built in parallel in its own copy of the
  code; see `.claude/session-handover-build-parallel.md`. This session
  runs its E2E after the Next-Action E2E, once the build is merged.
