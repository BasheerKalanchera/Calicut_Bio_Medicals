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

## NOW (18 Nov) — Customer Wording plan: steps 0–4 done, step 5 docs under way
Plan `docs/Customer-Wording-Implementation-Plan.md` (Approved 16 Nov). Step 0
(MUI restyle) committed `2d2939d`. Steps 2–3 (wording in 18 screen files, 5
server service files, 4 test files) edited, NOT committed; tsc, lint, MUI
check, ruff, pytest (1572) passed 18 Nov; pre-E2E `/code-review medium`
found nothing to fix. **E2E (step 4):** test plan
`docs/Customer-Wording-Manual-E2E-Test-Plan.md`, 36 steps; Pass 31 of 36
(18 Nov). Left: F (22–26, after the code-names commit). Basheer runs steps
as Haroon.
**Added 18 Nov (Basheer):** "Pipeline" → "Opportunity Pipeline" on menu,
screen heading and help title (`DemoApp.tsx:61,766`, `helpContent.tsx:94`);
plan decision + test step 17b (Pass).
**Parked (Basheer, 18 Nov, until he checks with Haroon):** the whole
"Account" → "Customer" entry, incl. menu name "Customers & Projects" (liked)
vs keeping "Account Management"; Backlog entry updated, uncommitted.
**Step 5 docs, edited 18 Nov, NOT committed:** UAT manual (56 edits), Audit
Trail Redesign plan (13 lines), "Stagnant Deals" → "Stagnant Opportunities"
in Business-Rules, help catch-up plan table, Report-Drilldown plan and test
plan, 2 Backlog lines, Weekly Follow-up D3a note; help plan section 7 (59
lines, plus a dated note). Traceability and scorecard: another session
already has 18 uncommitted lines each — left to Plan & Chore (Basheer yes).
My Work plan (3 lines) and test plan (1 line) also renamed.
**Next:** (1) show file list + full message for the wording commit (steps
1–6), wait for his yes; (2) step 7 code-names commit (3 screen files, shared
names, 2 server web addresses, regenerate `api.ts`, P3/P5 checks), restart
Dev backend; (3) E2E 22–26; (4) Progress-Archive entry and retro. Put
`typography` before `fontWeight` in `sx`.

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
