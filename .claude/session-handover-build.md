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

## 31 OCT — small-fixes batch shipped
- `374a2a8` (My Work small fixes incl. Back to Insights bar) committed and
  pushed 31 Oct together with `0ae8e29`; main = origin/main. Detail in
  Progress-Archive 31 Oct. Docs edits (plan Status line, archive entry,
  this note) are uncommitted, for the next docs batch.
- Next: nothing queued for this session. Target vs Actuals redesign is with
  Plan & Chore; Annual Target section L and the Target vs Actuals E2E stay
  parked until then. Next-action plan (hospital, D6–D8) is `/build`'s.

## 31 OCT — three Backlog small fixes (Basheer picked 1, 2, 3)
- 1 Manager Note for managers only: DONE — `843c552` pushed, pre-E2E review
  done, E2E section G 6 of 6 Pass. Docs batch committed 31 Oct (hash in
  `git log`). Retro written (3 corrections).
- 2 "Hospital" → "Customer" wording + "deal" → "Opportunity": Basheer chose
  (31 Oct) to WAIT until `/build`'s hospital next-action rule is merged and
  tested, then sweep once (Backlog entry has the timing). Still waiting for
  his yes to the A / B / C split and the renames "Rate Customers",
  "My customers".
- 3 "Are you sure?" before file deletes (Catalogue link, Opportunity
  Documents): PARKED by Basheer (31 Oct) until `/build` merges (whole-file
  MUI migration of two screens would clash). Shared `ConfirmDialog`.
- 4 MUI round 1 fixes (MUI plan step 5, was due 1 Nov): Basheer (31 Oct,
  via Plan & Chore) — do them together with 2 and 3, after `/build`
  merges. Five findings listed in the plan's step 5 (Stakeholders card on
  a phone, Daily Activity Report filter names, Account Management zone
  filter, Log Activity contact box, typed colours in 7 screens — check
  what `843c552` already did for Log Activity). Then the 21 "after"
  screenshots and the before-and-after page.

## Now: Annual Target Part 2 E2E, sections J–L (Target vs Actuals E2E parked)
- Dev at migration 0064 (head). Target vs Actuals E2E run 6 of 40, PARKED
  (redesign with Plan & Chore). The small-fixes batch shipped `374a2a8`.
- Annual Target E2E (`docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md`):
  21 Pass, 1 Skipped of 33. **Section L (11 steps, three widths) PARKED
  30 Oct** until a few screens are redesigned; re-read against the new
  screens before running. Load `cabio-e2e-testing`; Basheer signs in as
  each user. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L,
  Oct–Dec ₹40 L, Jan–Mar 2027 ₹10 L). Detail: Progress-Archive 28–30 Oct.
- Idea from Basheer: widen Backlog "Front-end consistency audit" into a
  convention audit (expensive job — show scope/cost first).

## After the Annual Target Part 2 E2E (sections I–K done, L left)
- Part 2 screens steps 1–6 shipped (bell `5b5ad0c`); pre-E2E review fixes
  `e33f35c`, pushed 28 Oct. Migration 0064 on Dev = head. Sections I–K
  detail: Progress-Archive 28–30 Oct.
- UAT moves after the E2E (Basheer, 26 Oct, D6), then the post-commit
  checklist. Dev servers: Basheer runs them.
- Lesson (21 Oct): review lists sorted by what users notice, screen first.

## From Plan & Chore (25 Oct)
- Small-fixes Backlog adds still open: "+ Add Customer"; "deal" →
  "Opportunity" incl. "Stagnant Opportunities" (Basheer tells Haroon).

## Not yet scheduled
- The other 6 rule gaps: Backlog "Business rules vs code — 6 gaps
  awaiting decision".
- Part 1's A8 hint wording still awaiting Basheer.
