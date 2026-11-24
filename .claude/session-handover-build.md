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

## NOW (24 Nov) — nothing in progress; docs batch waiting
"First activity" keeps-typing fix pushed as `121216e`; its E2E (10 new steps, 0 Fail)
is in `docs/Why-This-Change-and-First-Activity-Keep-Typing-Manual-E2E-Test-Plan.md`
(archive 24 Nov, with the retro). The Product Catalog phone header (buttons in the
"Product Detail" row, label "Details" on a phone) got Basheer's phone look — works
fine — committed and pushed as `3c91f94`. **Uncommitted, mine:** the new E2E plan,
my archive entry + retro, this note. **Next:** docs batch (plan, archive hunks
that are mine, this note) — leave out Plan & Chore's `session-handover-plan.md`,
its archive lines and `docs/Backlog.md` (not mine). Needs his go-ahead.
**For Plan & Chore (tell via Basheer):** its lines in
`docs/Progress-Archive-2026-11.md` sit in the section "24 Nov — Plan & Chore: UAT
backup", uncommitted; my 24 Nov entries follow in the Build & Test section.
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
