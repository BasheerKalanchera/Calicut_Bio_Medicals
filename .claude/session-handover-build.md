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

## Now: phone layout fixes (26 Oct), then Part 2 step 7 E2E
- Part 2 steps 5–6 and review fixes pushed (`f5d30d5`, `99c64ad`,
  `51d4fe8`); migration 0064 on Dev = head. Main's app code is ahead of
  UAT: UAT fixes go by the hotfix route.
- Built on Dev 25 Oct, uncommitted: `src/theme/phoneTable.ts` (rows
  become labelled blocks on a phone), applied to Target & Coverage
  Planning's 5 tables and Rate Hospitals. Measured at 390 px: fits.
- Basheer's check found 3 more; plan explained 25 Oct, his go-ahead
  still needed (he stopped for the night): (a) Team Plans — keep the
  push-in under each manager on a phone (row-level `& > td` pl by
  depth); (b) Rate Hospitals — search on its own line, Zone picker on
  line 2 beside the rating filter; (c) Brand Target Tracking — brand
  row as a block (351 px table in a 283 px card; Part 2 only, stays
  off UAT).
- Then: measure all three at 390 px with rows opened, screenshots →
  Basheer checks on his phone → `fix:` commit (own approval) →
  `hotfix/phone-layout` from `origin/uat` with the Target & Coverage
  and Rate Hospitals parts → deploy with approval → merge `uat` → main.
- Then: full phone check of every screen on Dev (Haroon, Fahad,
  marketing user), results per screen with proposed fixes.
- Then E2E: restart the Dev backend, P7 (read-only Dev check; ask
  first), P8, I, J, K (1 of 41 done). Post-commit checklist after it.
- Lesson (21 Oct): bring review lists sorted by what users would
  notice, screen first.

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
