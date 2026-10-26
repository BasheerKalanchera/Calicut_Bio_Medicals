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

## Now: MUI good practice plan (D8–D10, D17), then Part 2 step 7 E2E
- Part 2 steps 5–6 and review fixes pushed (`f5d30d5`, `99c64ad`,
  `51d4fe8`); migration 0064 on Dev = head. No early UAT update for the
  phone fixes (Basheer, 26 Oct, D6): UAT moves after Round 1 E2E.
- Shared parts and the 3 phone-fix screens shipped 26 Oct: `2e3ddd7`,
  `64b5fef`, both pushed; docs batch and retro (9 corrections)
  `94dc11d`, pushed (archive 26 Oct).
- For Plan & Chore, via Basheer: MUI plan Status line → commits
  `2e3ddd7`, `64b5fef`; D2/D4/D6 changes from this session.
- Stricter MUI check `eb1b2c6`, pushed 26 Oct (plain tables, style=,
  md width, rgba, helper .ts; no table exceptions — Basheer). D3
  written into the Part 2 screens plan (uncommitted, Plan & Chore's
  batch). Suggested 2 tweaks to Plan & Chore's new pre-E2E MUI item
  (hand-built phone switches; measure 768/1280) — via Basheer.
- SBU Target card (Annual view) onto TableOrCards `dce5d7d`, pushed
  26 Oct; measured on Dev at 390/768/1280, no overflow.
- Part 2 screens plan step 5 shipped `65ab36a`, pushed 27 Oct (archive
  27 Oct). TvA Quarter person table sideways scroll: Basheer says
  leave it. Plan Status line, "display pieces" rename and Backlog
  wording entry updated by this session at Basheer's request; the
  plan doc is untracked and goes in Plan & Chore's batch. Retro 27 Oct
  (5 corrections, P101) in the archive.
- Next: the bell (step 6), kept by Basheer 27 Oct (🔔 emoji stays, D3); E2E: restart the Dev backend, P7 (read-only
  Dev check; ask first), P8, I, J, K (1 of 41 done). Post-commit after.
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
