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

## NOW (19 Nov, evening) — Product pricing E2E: 44 of 51 Pass; open: 29b–29e, 30, 31, 32
**Waiting on the leadership team's price sheet.** Template (Basheer's Desktop,
`Desktop\Cabio\Cabio-Product-Price-Template.xlsx`, never in the repo) is done; he
sends it with a WhatsApp I drafted. **Before step 30, sync Dev's catalog to UAT**
(UAT drifted since ~27 Sep: 4 renames, 12 new products; list agreed, details in
Progress-Archive 19 Nov). Next, in order: (1) Basheer's yes for one more UAT
read-only (brand fiscal-year start months, descriptions of the 16); (2) show the
exact list again, he approves, he runs the script (`!`); the E2E plan has it as
section E2, steps 29b–29e (added 19 Nov); (3) step 30. Open: `docs/Selling rates -2026 - CEO.pdf` untracked in `docs/`
(has prices): move to Desktop or `.gitignore`? He hasn't said. Scratchpad has the
scripts and `uat_audit.json`. Retro written (2 corrections, archive 19 Nov). Docs batch committed 19 Nov (see
`git log`: handover, my archive section, E2E plan). **Still uncommitted, for the
end-of-E2E `fix:` batch:** the "CEO's lowest" code (`service.py`, product tests,
`ProductCatalogScreen.tsx`, `productPrices.ts`) and its wording in Business-Rules,
pricing plan, Traceability (then regenerate the scorecard). Older detail below.
Pricing steps 1–3 on `main` (`ebd3bdd`; schema `290386a`); Dev `alembic current`
= 0066 (head). Pre-E2E review done, no fix needed; P1–P4 done (24d–24f use
existing data, see the E2E plan). `db4f163` (my docs batch) local, not pushed.
Dev S70 holds test prices 35/33/31/29/24 until section F overwrites them.
**Rename, Basheer 19 Nov:** "Haroon's lowest" → "CEO's lowest" everywhere (label,
messages, tests, Business-Rules, plans, Traceability line); column stays
`ceo_floor_lakhs`. Product tests 84, ruff, tsc, eslint pass; steps 1, 5, 8d–8f
re-checked Pass. **UNCOMMITTED** — goes in the end-of-E2E `fix:` batch (full
pytest first) with: E2E plan results, pricing plan step 4 line, archive entry
(19 Nov Build & Test section, under Plan & Chore's lines — leave theirs out),
this note. Traceability line changed, so regenerate the scorecard (load
`cabio-post-commit`; never hand-edit it).
**All steps except 29b–29e and 30–32 are Pass** (E2E plan has the tags). Both wait on the sheet.
Test run: 44 of 51 (86 %).
If Build merges before the next pull, `api.ts` may need regenerating
(`sh .githooks/check-api-types.sh --write`). Pending for Basheer: send Plan &
Chore the ask to group E2E steps by login (wording drafted 18 Nov).
**Parked (Basheer, 18 Nov, until he checks with Haroon):** the whole
"Account" → "Customer" entry, incl. menu name "Customers & Projects" (liked)
vs keeping "Account Management"; Backlog entry in `46c4214`.
Traceability and scorecard (18 uncommitted lines each, another session's)
left to Plan & Chore. Plan & Chore's 18 Nov UAT-backup line in
Progress-Archive-2026-11 stays uncommitted (not mine).
Put `typography` before `fontWeight` in `sx`.

Earlier: Marketing Lead discard work pushed (`b4f6b42`, `8a59b20`), E2E 12 of 12
(Progress-Archive 14 Nov). Small batch 12 Nov (`b4f6a3b`, `4a5e767`, `4efbac6`)
pushed; waits for a UAT deploy (Basheer's call).

**Finding, not this batch:** the Sales Report headline counts only Won/Lost
Opportunities that have a product line (`sales_headline`, inner join). UAT
read-only, 13 Nov: Lost 25 real, 19 shown. Basheer decided 13 Nov: build a
"Sales Loss Report" (Backlog, Traceability 1.4).

**After deploy to UAT:** Basheer times `weekly-followup` in F12 Network (the
speed check is UAT-only).

Not mine: other sessions' uncommitted docs (Backlog items, plans, Plan &
Chore note, Progress-Archive-2026-08), stray `B`, `BT`, `PC` files.

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Other deferred items live in the Backlog.
