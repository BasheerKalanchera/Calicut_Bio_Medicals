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
- Next: E2E — P7 (read-only Dev check; ask first), P8, I, J, K (1 of
  41 done), plus the phone/tablet/laptop step per screen. Load
  `cabio-e2e-testing` first. Dev servers: Basheer runs them (5174).
  Post-commit checklist and Part 2's UAT move after.
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
