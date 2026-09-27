# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

## Brand option in Pipeline/Sales Report + Dashboard — E2E paused (2026-09-26)

- Plan: `docs/Brand-Breakdown-In-Pipeline-And-Sales-Reports-Implementation-Plan.md`;
  test plan `…-Manual-E2E-Test-Plan.md` (results table there). Partial
  checkpoint committed `b4d6f18` (2026-09-26).
- Scope grew mid-E2E on Basheer's calls: Trade-Ins row clickable;
  Pipeline Report + Dashboard Active-only (BR-OP-07), tiles merged; Sales
  Report clicks keep the period; Product Performance "All Opportunities".
  4 `/code-review` passes, no findings; pytest 978 pass, tsc/lint clean.
- Passed: 1–6, 6b, 14–17. **Next:** Basheer runs 18, 7, 10, 20; Claude
  runs 8, 9, 19, 11–13 (12 = Fahad login). Then post-commit checklist.
- **Open question for Basheer:** park in Backlog (Claude recommends) two
  gaps that existed before this change: Zone bar click includes sub-zone deals;
  Sales period cut-off uses server clock, not IST (Progress-Archive
  2026-09-26).

## UAT promotion (main → uat) — plan drafted (2026-09-26)

- Plan: `docs/UAT-Promotion-2026-09-Plan.md` (`a8ee2d9`). Basheer
  cleared everything demoed 2026-09-24 for UAT. UAT at `0041`; runs
  `0042`–`0054`. Read-only product check 2026-09-26 clean → no rehearsal.
- **Next:** date not final, most likely Sunday 2026-09-27; Claude writes
  the step-6 post-move check script in advance.
- Then run the SonoScape vendor report (UAT read — ask Basheer first):
  `python scripts/vendor_pipeline_report.py --brand SonoScape` (writes to
  the Desktop; includes the Sales Owner column). The 2026-09-26
  Imaging trial was NOT sent — Basheer sends Haroon the SonoScape version
  after the move, with the gap note drafted in chat. Findings:
  Progress-Archive 2026-09-26 "Vendor pipeline report: trial run".

## Hospital-wise target planning — plan approved (2026-09-27)

- Discussion doc: `docs/Discussion-Hospital-Wise-Target-Planning-2026-09.md`
  (Design C; all open questions answered 2026-09-27, section 5).
- Plan: `docs/Hospital-Wise-Target-Planning-Implementation-Plan.md`
  (approved 2026-09-27, choices answered in section 3).
- **Deadline:** on UAT around 2 Oct 2026; fallback decision around 29 Sep.
- **Next:** build Part 1 (plan section 4 order) — only after the main → UAT
  move and the Product Catalog clean-up (Basheer, 2026-09-27).
