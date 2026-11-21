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

## NOW (21 Nov) — Manager Note privacy: steps 2–3 built, **uncommitted** (plan: `docs/Manager-Note-Privacy-Implementation-Plan.md`, Approved 20 Nov)
Everything before this was pushed (`main` = `4e09a39`). Done 21 Nov, all
uncommitted: `backend/alembic/versions/0067_manager_note_privacy.py` **applied to
Dev** (Basheer ran it; `alembic current` = `0067 (head)`); `docs/Physical-Schema.sql`
regenerated (diff = the new rule plus header and restrict key only); plan edited
(D10 same business unit on the zone path, D11 how it is tested, sections 1, 2, 6).
**Dev read-only check done:** all 12 active users against the 24 existing Manager
Notes, 0 mismatches; 38 unlinked other activities still visible to all; no
comment visible on a hidden note. Scripts and output in the 21 Nov scratchpad
(`dev_manager_note_visibility_check.py`, `visibility_check_out.txt`,
`dev_zone_only_candidates.py`, `zone_only_out.txt`).
**Open gap (D11):** the zone-only Area Manager grant has 0 pairs on Dev; test it
in the E2E on the real screens: Haroon or Abdul logs a Manager Note about Rudrappa
(reports to Shruthi) on a Fazal-zone customer (Kannur, Kasaragod, Kozhikode,
Mangalore) and Fazal sees it; or Fahad (Fazal) on a Bangalore/Mandya customer and
Shruthi sees it; or Vivek (Arun) on a North Kerala customer and Nishad sees it.
Fallback only with his yes: one temporary note in a rolled-back transaction.
**Done 21 Nov, uncommitted:** full backend pytest 1621 passed, ruff, tsc, eslint
(0 errors, 134 known `any` warnings) all pass; his approved doc edits made in
Business-Rules BR-ACT-02, the 5 Sep Opportunity-Notes-Privacy plan, Backlog
"Activity log privacy hole", Business-Rule-Implementation-Matrix row BR-ACT-02.
**Next, in order:** (3) commit proposal for migration + schema + plan + those 4 docs
(own approval; message records "applied to Dev, `alembic current` = 0067 (head)"
and the pytest count; leave out the Traceability line, Progress-Archive and the
Plan & Chore note);
(4) E2E test plan via `cabio-e2e-testing`; (5) UAT with the next full move (D9),
needs his yes for the UAT people check. Haroon to be told about D5. **Retro for
this session not done yet.**

## NOW (19 Nov, evening) — Product pricing E2E: 44 of 51 Pass; open: 29b–29e, 30, 31, 32
**Waiting on the leadership team's price sheet** (template is done; Basheer sends it
with the WhatsApp I drafted). **Before step 30, sync Dev's catalog to UAT** (UAT
drifted since ~27 Sep: 4 renames, 12 new products; details in Progress-Archive
19 Nov). Next, in order: (1) his yes for one more UAT read-only (brand fiscal-year
start months, descriptions of the 16); (2) show the exact list, he approves and runs
the script (`!`) — E2E plan section E2, steps 29b–29e; (3) step 30. Scratchpad has
the scripts and `uat_audit.json`. Open: `docs/Selling rates -2026 - CEO.pdf`
untracked in `docs/` (has prices): move to Desktop or `.gitignore`? He hasn't said.
Pushed (checked against git 20 Nov): `417c38e`, `db4f163`, `223c172` ("CEO's
lowest" rename). **Still uncommitted, mine:** the one Traceability line (row 1); at
the end of the E2E commit it with a regenerated scorecard (`generate_scorecard.py`,
then `--check`; never hand-edit; load `cabio-post-commit`). Pricing steps 1–3 on
`main` (`ebd3bdd`). Dev S70 holds test prices 35/33/31/29/24 until section F
overwrites them. If Build merges before the next pull, regenerate `api.ts`.
Pending for Basheer: send Plan & Chore the ask to group E2E steps by login
(wording drafted 18 Nov). "Account" → "Customer" rename parked in the Backlog
(`46c4214`). **After deploy to UAT:** Basheer times `weekly-followup` in F12 Network.

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Other deferred items live in the Backlog.
