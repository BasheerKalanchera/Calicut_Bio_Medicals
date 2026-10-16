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
- **Next:** re-check the test plan's live data on Dev (read-only, say
  first; pick the Marketing Lead for E4), have the Dev backend
  restarted, then the manual E2E (A–E, G; check in before the browser).
- Not yet scheduled (was Win Probability's next item): the other 6 rule
  gaps, Backlog "Business rules vs code — 6 gaps awaiting decision".

## Annual Target Planning — next to build

- Demo to Haroon and Latheef Bhai held on Dev, 15 Oct 2026 (Basheer,
  2026-10-16). Their main ask, a yearly target layer on Brand Target
  Tracking and Target & Coverage Planning:
  `docs/Discussion-Annual-Target-Planning-2026-10.md` (all answered
  2026-10-16). Plan approved 2026-10-16:
  `docs/Annual-Target-Planning-Implementation-Plan.md` (D1–D22a — brand
  targets yearly only, yearly Target vs Actuals view, plan notifications
  on the bell; built before the next UAT move). E2E test plan written
  2026-10-16: `docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md`.
  Both committed (`1d57697`). **Next to build, once the Next-Action
  Rules build and its E2E are done** (Basheer, 2026-10-16): step 1
  (check in first); a mock-up of the yearly Target vs Actuals view comes
  before step 5.
