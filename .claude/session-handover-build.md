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

## Now: My Work E2E (Weekly Follow-up plan, steps 2–5) — before Part 2
- Basheer put it ahead of Part 2 (28 Oct). Merged into main by the Build
  session (`b704b56`); no migration. Pre-E2E checks run 28 Oct on `b704b56`:
  pytest 1429, ruff, tsc, lint all clean; `/code-review` medium gave 9 points.
- Review fixes committed and pushed as `048c741` (28 Oct): one person's
  lists read only that person's Opportunities; days since contact floored
  at 0; days boxes capped at 3650 (My Work + Stagnant). Backend 1432 pass.
  Not fixed (Basheer): India-time on My Work — browser time is the app
  convention (`formatter.ts:20`), reverted. Left as is: picker cap of 100,
  client-side 70 %+ total, hand-typed contact types (→ Plan & Chore: activity-type
  table with flags), unscoped-user_id returns empty 200.
- G1 passed 28 Oct (390/768/1280 px, as Fazal; both My Work and the
  Stagnant report). Found on the way: Stagnant report returned 500 (date
  with a time vs plain-date field, from `d7a0e6f`). Fixed and pushed as
  `4deb68c` (1434 pass, ruff clean, Dev API 200 at 30/90/180 days);
  fix re-read, no problems. Test run: 1 of 49 (G1).
- Next: P1 (Dev backend already reloaded it), P3/P4 (exact labels from
  code; re-run the 25 Oct data checks, announced first), then A–F; other
  users' sign-ins need Basheer. Test plan: `docs/Weekly-Follow-up-Daily-Hub-Manual-E2E-Test-Plan.md`.
  Ask Basheer before browser checks. Layout problems go to Build as fixes.
- Idea raised by Basheer: widen Backlog "Front-end consistency audit" into a
  convention audit (expensive job — show scope/cost first).

## Paused: Part 2 step 7 E2E (Annual Target plan step 7)
- Part 2 screens plan steps 1–6 shipped; step 6 (bell) `5b5ad0c`,
  pushed 27 Oct (archive 27 Oct evening). Migration 0064 on Dev = head.
- UAT moves after this E2E (Basheer, 26 Oct, D6).
- 28 Oct: pre-E2E review of the 6 commits since 25 Oct (10 points).
  Fixes 1, 2 (A), 3, 4, 6, 7, 9 committed `e33f35c` (pushed 28 Oct);
  fix 5 closed, no change (Basheer). Archive entry written.
  After-push checkpoint for `e33f35c` done 28 Oct (session start).
- E2E PAUSED 28 Oct (Basheer) until Plan & Chore fixes the test plan
  (`docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md`, committed and
  pushed 28 Oct as `111c399`; findings and retro (6 corrections) in
  Progress-Archive, pushed as `e131fe2`: section L added, K10 reworded, P7/P8 recorded, I1–I7 recorded,
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
