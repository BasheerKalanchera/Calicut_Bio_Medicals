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

## NOW (18 Nov, end of day) — nothing in progress; "Why this change?" fix pushed
Haroon's "Why this change?" fix: `2ee250c` pushed, E2E 11 of 11 Pass
(Progress-Archive-2026-11, 18 Nov); its docs batch is committed (`37b5b1b`).
**Next (fresh session, `/build-and-test restarted`):** Basheer is asking the
B session to merge Product pricing steps 1–3 into `main`. Once he says it
has landed: check `git log` that it is on `main`, pull, then its E2E
(`docs/Product-Pricing-And-Cost-Manual-E2E-Test-Plan.md`) — load
`cabio-e2e-testing` first. Not merged as of the evening of 18 Nov
(`worktree-build` at `060eb3d`).
If Build merges before the next pull, `api.ts` may need regenerating
(`sh .githooks/check-api-types.sh --write`). Pending for Basheer: send Plan &
Chore the ask to group E2E steps by login (wording drafted 18 Nov).
**Added 18 Nov (Basheer):** "Pipeline" → "Opportunity Pipeline" on menu,
screen heading and help title (`DemoApp.tsx:61,766`, `helpContent.tsx:94`);
plan decision + test step 17b (Pass).
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
