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

## Now: Annual Target Planning Part 2, step 7 (pre-E2E review + E2E)
- Basheer 25 Oct (afternoon): build step 5 now, as planned (plan §6
  Part 2 "Year view" bullet holds the build notes). D80 added the same
  day: Year view leaves out the red "past closing date" note.
- Mock-up: https://claude.ai/artifact/NnyXKSzDYwoqvy6WXV4p9j (the
  untracked `target-vs-actuals-mockup.html` at the repo root is an older,
  different mock-up — not this one).
- Step 5 committed and pushed `f5d30d5` (25 Oct), checkpoint, Part 2
  partial. Main's app code now differs from UAT's: UAT fixes go by the
  hotfix route. Timing on Dev in Progress-Archive; UAT timing in Backlog.
- Docs batch held until step 7 (Basheer, 25 Oct): handover, Backlog,
  Progress-Archive-2026-10, test plan Built line. Leave out the other
  session's `session-handover-plan.md` and untracked docs.
- Step 6 (notifications D18–D21, Brands Billing to Cabio D54/D68,
  hand-typed brand quarters D70–D73) committed and pushed `99c64ad`
  (25 Oct), checkpoint, Part 2 partial. Migration 0064 applied to Dev,
  `alembic current` = 0064 (head); Physical-Schema regenerated in it.
  Plan §6 Notifications "As built" note is uncommitted (docs batch).
- Step 7 in progress (25 Oct). Pre-E2E review done. The 2 approved review
  fixes (Year view cache key; D81 Year totals unset when a quarter so far
  has no target) committed and pushed `51d4fe8` (pytest 1388 pass,
  ruff/tsc clean, lint 0 errors / 133 old warnings; api.ts unchanged).
  D81 written into the plan (uncommitted, docs batch). Post-commit
  checklist waits for the end of step 7's E2E.
- Dev check for review point 3 done (25 Oct, read-only): 8 cross-SBU
  pairs, all under a General Manager with no SBU (Haroon Sidheeq 5;
  inactive Test GM 3). GMs read every plan anyway, so nothing to fix.
  Note for Progress-Archive in the docs batch.
- E2E started 25 Oct: test plan I–K re-worded from the code. P6 found a
  phone layout bug on Brand Target Tracking; fixed and P6 passed (1 of
  41). Fix and docs batch committed at the day's end (see git log).
  Review tidy-ups → Backlog "Annual Target Part 2: code tidy-ups".
- Next: restart the Dev backend, then P7 (read-only Dev check — the
  plan of it was shown 25 Oct, not yet run; ask first), P8, then I, J,
  K. Post-commit checklist after the E2E.
- Lesson (21 Oct): he found the raw review list hard to follow — bring
  it sorted by what users would notice, screen first, from the start.

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
