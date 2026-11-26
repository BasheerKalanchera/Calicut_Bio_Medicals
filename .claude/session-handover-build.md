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

## NOW (26 Nov) — date picker cut off on short laptop screens
Backlog entry "Date picker cut off on short laptop screens". Basheer parked the
Margin Report E2E for this (26 Nov). Fix made, **not committed**:
`utils/datePicker.ts` (820px), `CloseReminderModal.tsx`, `LogActivityModal.tsx`.
Reviewed; pytest 1788 / 10 skipped, ruff, tsc clean, lint 0 errors.
**Next:** E2E `docs/Date-Picker-Short-Screen-Manual-E2E-Test-Plan.md`: 6 of 10
passed (P1, P2, 1–4). Step 6 with the switch on, then restore it, then 5, 7, 8.
Then `fix:` commit (needs his yes), Backlog entry closed.
Session refresh (26 Nov evening): retro written to the archive (3 corrections);
docs commit proposed, awaiting his yes. Switch still in the code.
Scrolling finding fixed (Basheer yes): header hidden below 660px screen height
(`DATE_TIME_TOOLBAR`); diff reviewed, tsc clean, lint 0 errors; not yet seen.
**TEMPORARY SWITCH IN `utils/datePicker.ts` (Basheer yes, 26 Nov):** "before"
seen by Basheer (cut off, bug reproduced); now "after" = `(min-height: 820px)`.
Restore
`"@media (pointer: fine) and (min-height: 820px)"` and drop the TEMPORARY
comment before any commit.
Why the switch: this laptop's Chrome reports touch only even with the mouse, so
the real code always centres here. Centred box measured 587px tall.
Review points: centred box may scroll on very short screens (step 5); crossing
820 while a box is open closes it (accept); older bug, impossible date may keep
the previous one (step 7, fix separately if seen).

## PARKED (26 Nov) — Margin Report E2E, resume at step 13
Plan `docs/Margin-Report-Implementation-Plan.md` (Approved, D1–D21; build order
complete). E2E plan `docs/Margin-Report-Manual-E2E-Test-Plan.md`.
- **Pushed:** D19–D21 changes `1852540` (26 Nov; pytest 1788 passed / 10
  skipped, ruff, tsc clean, lint 0 errors). Earlier build commits: the E2E
  plan's "Built:" lines.
- **E2E:** section A done — P1–P4 and steps 1–12 (incl. 11a) Pass, 17 of 54.
  **Next: step 13** (login Basheer K, saves to Dev: Basheer clicks, Claude
  watches). Confirm the Dev backend is current before starting.
- **First seen at E2E:** the Won/Lost products screens (steps 21–26, 30–31, 35;
  also re-read the other two pop-up modes in `CloseReminderModal.tsx`) and the
  Dev cost copy on a newly Won Opportunity. Phone header and one-line totals
  card: check by eye at step 36 (may wrap; review estimate, not measured).
- **Open questions to Basheer:** (1) rows' Quantity — proposed keep in Product
  view only; (2) accept that a click may list more Opportunities than the
  figures count (rows and no-cost list), then add to D20.
- **Small-fixes batch:** Activity Note writes "₹12.00 L", screens "₹12.00L"
  (proposed, not answered).
- **After the E2E:** post-commit checklist (Backlog entry, Traceability row
  11.1, scorecard).
- **Docs commit pending** (Basheer, 26 Nov: do it at the end of the next
  Build & Test session; needs its own approval): this note, the Margin plan,
  its E2E plan and Build & Test's `docs/Progress-Archive-2026-11.md` sections.
- Leave `scripts/uat_case_study_scan.py` and the Plan & Chore note alone.

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
