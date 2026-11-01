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

## Done 31 Oct (detail: Progress-Archive)
- Hospital next-action E2E 37 of 37 recorded; fix `268570f`; docs `c9c44f5`.
- Target vs Actuals and Annual Target L stay parked (Plan & Chore).

## 1 NOV — MUI round 1 "Part 1" APPROVED by Basheer, in progress
- Scope (Basheer, 1 Nov): restyle + file-delete "Are you sure?" ONLY, one
  commit per screen, no wording changes. The "hospital"/"deal" wording
  sweep is Part 2, separate, AFTER Part 1 and after `/build`'s current
  plans (Target vs Actuals table, Target & Coverage tabs) merge — they
  edit DemoApp, My Work, Target screens (clash). A/B/C split, "Rate
  Customers", "My customers" still unanswered; ask at Part 2.
- Order: 1 `ConfirmDialog` + 2 Customer 360 — DONE, committed and pushed
  1 Nov as `6a417cb` (tab move, colours/sizes onto theme names 165 → 0
  breaches, Stakeholders card and account-load-error Back fit a phone;
  ConfirmDialog not used yet; not yet seen in a browser — phone check is
  in the combined E2E); 3 Opportunity Detail
  + file-delete question — DONE, committed and pushed 1 Nov as `f8c61b3`
  (172 → 0 breaches, colours round-trip identical; Documents tab "×" asks
  via ConfirmDialog; not seen in a browser). NEXT: step 4; 4 Product Catalogue + file-delete question;
  5 Account Management (zone filter name); 6 Daily Activity Report
  (filter names); 7 Close Next Action, Next Actions (Log Activity shows 0
  breaches now — contact-box name still to check); 8 21 "after"
  screenshots + before-and-after page + one E2E (MUI plan step 5).
- Check report 1 Nov: 33 files / 862 lines; round 1 files ≈ 452.

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

## From Plan & Chore (25 Oct)
- Small-fixes Backlog adds still open: "+ Add Customer"; "deal" →
  "Opportunity" incl. "Stagnant Opportunities" (Basheer tells Haroon).

## Not yet scheduled
- The other 6 rule gaps: Backlog "Business rules vs code — 6 gaps
  awaiting decision".
- Part 1's A8 hint wording still awaiting Basheer.
