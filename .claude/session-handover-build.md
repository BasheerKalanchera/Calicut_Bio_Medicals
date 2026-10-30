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

## Now: Annual Target Part 2 E2E, sections J–L (Target vs Actuals E2E parked)
- 30 Oct: the redesign merged as `3bafbc0`; Dev at migration 0064 (head).
  Target vs Actuals E2E run 6 of 40 (P1–P5, A1 Pass) then PARKED by
  Basheer — he wants to redesign it again (boxes on top look redundant
  with the table; Quarter table should gain PO received + Likely finish,
  Company Likely finish = SBUs added up). Design not agreed; Plan & Chore.
- Uncommitted from this session (see `git status`): My Work scroll-to-top
  and D42 reset (Basheer confirmed on Fazal's login), plan D42; two-decimal
  % (`percent()`, `WonBar` widths) and the E2E plan's figures. Small-fixes
  `fix:` commit not yet proposed; the two-decimal change may be moot after
  the redesign.
- Annual Target E2E (`docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md`):
  J 11 Pass + 1 Skipped (J9), K 10 of 10 Pass (30 Oct): 21 Pass, 1 Skipped,
  of 33. **Next: L1** (phone/tablet/laptop look of Target & Coverage
  Planning); L7 (Target vs Actuals card) waits for the redesign. Load
  `cabio-e2e-testing`; Basheer signs in as each user. Dev test data left
  as found (Maquet ₹100 L; Medion ₹100 L, Oct–Dec ₹40 L, Jan–Mar 2027
  ₹10 L). K5's wording: Claude reads the cents (screen shows one decimal).
- To Plan & Chore (Backlog, 30 Oct): tab per section on Target & Coverage
  Planning (L1–L3 re-test after it); rollout of planning (pilot quarter);
  GM approval list gap. Results and findings: Progress-Archive 30 Oct.
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
