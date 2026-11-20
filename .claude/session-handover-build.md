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

## NEXT (20 Nov) — Manager Note visibility fix: write-up with Plan & Chore
Haroon (via Basheer): only Manager Notes become private (rep + their managers);
visits, calls, notes unchanged. Cause: `activity_select` (migration 0046) opens
every activity with no Opportunity to all logins. Basheer said yes to: linked
Manager Notes follow the same rule (split / reminder holders lose sight of
them). Write-up shown in chat 20 Nov and pasted to Plan & Chore for review;
**open:** unlinked notes use the reporting line (simple) or the same zone and
business-unit managers as Opportunities (consistent, my lean; needs one
read-only look at Dev's reporting lines, announce first); UAT hotfix or wait.
Nothing edited, no plan file yet. When settled: plan from the template, then
one migration (Basheer runs `alembic upgrade head` himself), BR-ACT-02, tests,
schema regen. Also check other readers (`cabio_app_account_last_contact`,
note comment threads). No UAT connection without his yes.

## Done 20 Nov: final-newline hook (P108), uncommitted
`.claude/hooks/docs-final-newline.sh` + one entry in `.claude/settings.json`;
seen firing on the Backlog edit. Commit-msg line-ending entry closed (Backlog).
Rides in the next docs batch with the P108 tracker row and my archive section.

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
scripts and `uat_audit.json`. Retro written (2 corrections, archive 19 Nov).
Committed and pushed (checked against git 20 Nov): docs batch `417c38e`, my
earlier docs batch `db4f163`, and the "CEO's lowest" rename `223c172`
(Basheer 19 Nov: label, messages, tests, Business-Rules, pricing plan; column
stays `ceo_floor_lakhs`; full pytest 1621, ruff, tsc, eslint pass). **Still
uncommitted, mine:** the one Traceability line (row 1) with "CEO's lowest"; at
the end of the E2E commit it with a regenerated scorecard
(`generate_scorecard.py`, then `--check`; never hand-edit; load
`cabio-post-commit`). Scorecard has no uncommitted change today.
Pricing steps 1–3 on `main` (`ebd3bdd`; schema `290386a`); Dev `alembic current`
= 0066 (head). Pre-E2E review done, no fix needed; P1–P4 done (24d–24f use
existing data, see the E2E plan). Dev S70 holds test prices 35/33/31/29/24
until section F overwrites them.
**All steps except 29b–29e and 30–32 are Pass** (E2E plan has the tags). Both wait on the sheet.
Test run: 44 of 51 (86 %).
If Build merges before the next pull, `api.ts` may need regenerating
(`sh .githooks/check-api-types.sh --write`). Pending for Basheer: send Plan &
Chore the ask to group E2E steps by login (wording drafted 18 Nov).
**Parked (Basheer, 18 Nov, until he checks with Haroon):** the whole
"Account" → "Customer" entry, incl. menu name "Customers & Projects" (liked)
vs keeping "Account Management"; Backlog entry in `46c4214`.
Put `typography` before `fontWeight` in `sx`.

**After deploy to UAT:** Basheer times `weekly-followup` in F12 Network (the
speed check is UAT-only).

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Other deferred items live in the Backlog.
