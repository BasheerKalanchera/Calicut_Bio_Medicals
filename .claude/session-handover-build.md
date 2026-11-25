# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Reminders
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).
- UAT runs `0756234`, database at 0065 (moved 10 Nov, `c1d3c90`). UAT fixes
  ahead of a full promotion go by the hotfix-branch route
  (`docs/Deployment-Topology.md` "Fix to UAT ahead of a full promotion").

## NOW (24 Nov, evening) — Margin Report: read-only checks only, nothing edited
Basheer told this session to build `docs/Margin-Report-Implementation-Plan.md`
(Approved, D1–D13; build order in its section 2, check in before each step). So
far only reading: no migration written, nothing on Dev changed. E2E plan written
ahead: `docs/Margin-Report-Manual-E2E-Test-Plan.md` — its **P0 must run before
Basheer applies the migration** (test costs in the catalog, so the one-time fill
has something to copy); correct its labels from the code in P2.
- **25 Nov:** Plan & Chore decided D13a–e (reason = Activity-tab Note, reason-only
  "Why this change?" pop-up), D14 (Margin % over costed lines), D15, D16.
  **Step 1 done and pushed (25 Nov, `18ae6c3`, checkpoint, partial):** 0068
  applied to Dev (`alembic current` = 0068 head; 4 Won lines filled, 2 left
  empty: X3, E1), schema regenerated, model + Won stamp
  (`stamp_cost_at_won`, `service.py` after `repository.update`) + tests,
  pytest 1682 passed / 10 skipped. Real Dev copy on a new Won not yet seen
  working — E2E steps cover it.
- **D16 pushed (25 Nov, `0084a92`):** first catalog cost fills a product's empty
  Won lines (`ProductRepository.fill_empty_won_costs`); 1692 passed.
- **Part B1 (server) committed and pushed (25 Nov, `595241e`, checkpoint, partial):** `opportunity/service.py`
  (`_product_edit_refusal`, `can_edit_products`, `replace_items` takes `role_name`
  + `data.reason`, `_replace_closed_items` writes one Note via
  `log_stage_change_note` with no next action; `add_item`/`delete_item` refused
  for everyone on Won/Lost), `repository.py` (`stamp_cost_at_won(line_ids=)`,
  `get_product_names`, swapped product clears its cost), `schemas.py`
  (`reason`, `ItemEditPermission`), `router.py` (`GET .../items/can-edit`),
  api.ts regenerated. pytest 1741 passed / 10 skipped, ruff clean. `main` in
  sync with `origin/main`; B2 screen pending.
  **Until B2 lands on Dev:** a GM/Admin Save on a Won/Lost Opportunity's products
  is refused (old screen sends no reason); reps see Edit but are refused on save.
- **B2 (screen) committed and pushed 25 Nov (`36a931a`, checkpoint, partial),
  NOT yet seen in a browser — Basheer chose to leave it to the full E2E
  (steps 21–26, 30–31, 35):**
  `opportunities.ts` (`canEditOpportunityItems`, `reason` on replace),
  `api-aliases.ts`, `CloseReminderModal.tsx` (`productChange` reason-only mode),
  `OpportunityDetailScreen.tsx` (`ProductsTab`: Edit/+ Add via can-edit; Won/Lost
  Save = unchanged → nothing, changed → pop-up). `tsc` clean, eslint 0 errors.
  Still to do: re-read the other two pop-up modes' code for regressions
  (pre-E2E review). Swapped-product cost rule agreed by Basheer and written
  into the plan as D13f + section 6 (25 Nov, uncommitted, docs batch); the E2E
  plan has no swap step yet — offer to add one.
- **Next:** plan step 2 (margin query/endpoint, GM/Admin only, nothing on
  screen changes) — check in first; then step 3 (screen).
  Add the swapped-product cost rule to the plan addendum (section 6).
  Open ask from Plan & Chore (not yet approved by Basheer): E2E plan pre-flight —
  step 23 needs Haroon to have an open next action on that Opportunity (show
  wording first). Retro for 25 Nov is already in Progress-Archive.
- Last session's work: "First activity" `121216e`, Product Catalog header
  `3c91f94`, docs batch `fa9a65c`, all pushed.
**Other open:** (a) plan D11 wording (Plan & Chore's batch; the rolled-back test was
his 21 Nov choice); (b) fix E2E plan wording at 9b and step 21; (c) UAT with the
next full move (D9): needs his yes for the UAT people check, Haroon to be told
about D5, and the 13 products switched off from the screen once it is on UAT;
(d) after the pricing deploy to UAT, Basheer times `weekly-followup` in F12
Network. Backlog has "Show who a Manager Note is for", and the Dev test product
"EDAN iM91 Test ECG Machine" to deactivate when convenient (now possible).

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Other deferred items live in the Backlog.
