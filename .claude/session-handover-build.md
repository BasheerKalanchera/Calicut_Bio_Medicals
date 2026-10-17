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
  steps; results in the test plan (not yet committed). Basheer K in
  Claude's tab, Haroon/Vivek in Basheer's private window; a full page
  reload is needed to see another user's save.
- **Next:** B1 (Simple, as Basheer K), then B2–B5, D, E, G; progress
  line with % after each step (Basheer, 2026-10-17).
- Not yet scheduled (was Win Probability's next item): the other 6 rule
  gaps, Backlog "Business rules vs code — 6 gaps awaiting decision".

## Annual Target Planning — being built by the `/build` session

- Moved 2026-10-17 (Basheer): built in parallel in its own copy of the
  code; see `.claude/session-handover-build-parallel.md`. This session
  runs its E2E after the Next-Action E2E, once the build is merged.
