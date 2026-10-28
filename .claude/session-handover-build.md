# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Reminders
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).
- UAT runs `8b2ec8a` (moved 25 Oct, `b294865`). Until the first Part 2
  commit, main's app code = UAT's; after it, UAT fixes go by the
  hotfix-branch route (`docs/Deployment-Topology.md` "Fix to UAT ahead
  of a full promotion").

## Now: Part 2 step 7 E2E (Annual Target plan step 7)
- Part 2 screens plan steps 1–6 shipped; step 6 (bell) `5b5ad0c`,
  pushed 27 Oct (archive 27 Oct evening). Migration 0064 on Dev = head.
- UAT moves after this E2E (Basheer, 26 Oct, D6).
- 28 Oct: pre-E2E review of the 6 commits since 25 Oct (10 points).
  Fixes 1, 2 (A), 3, 4, 6, 7, 9 committed `e33f35c` (pushed 28 Oct);
  fix 5 closed, no change (Basheer). Archive entry written.
  After-push checkpoint for `e33f35c` done 28 Oct (session start).
- E2E PAUSED 28 Oct (Basheer) until Plan & Chore fixes the test plan
  (`docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md`, committed and
  pushed 28 Oct as `111c399`: section L added, K10 reworded, P7/P8 recorded, I1–I7 recorded,
  I2–I5 and I7 reworded). Run so far: 11 of 52 (P6–P8, I1–I7); I8
  open (upcoming year shows no SBU/Company row — design silent; the
  plan says to keep or show "Target not set"). Mismatches handed to
  Plan & Chore: I2–I5, I7 wording, I8 design gap, line 100 stale
  Basheer K figure, I4 has no per-quarter Team plans line.
- Resume at I9 (as Fazal, Basheer signs in), then J, K (1 of 10 done),
  L. Load `cabio-e2e-testing` first. Dev servers: Basheer runs them
  (app on 5173 as of 28 Oct). Re-read the plan before resuming — it
  will have changed. Post-commit checklist and Part 2's UAT move after.
- Lesson (21 Oct): review lists sorted by what users notice, screen first.

## From Plan & Chore (added 25 Oct at Basheer's request, `393beee`)
- My Work: D18–D22 decided (Weekly Follow-up plan); D18 = build it
  straight after Part 2's E2E. Test plan written ahead of the build.
- Small-fixes batch adds (Backlog): "+ Add Customer", "Are you sure?"
  before file deletes, "deal" → "Opportunity" incl. "Stagnant
  Opportunities" (Basheer tells Haroon).
- Manager Note for managers only (BR-ACT-02, Backlog): decided, its own
  `fix:` commit, no plan needed.

## Not yet scheduled
- The other 6 rule gaps: Backlog "Business rules vs code — 6 gaps
  awaiting decision".
- Part 1's A8 hint wording still awaiting Basheer.
