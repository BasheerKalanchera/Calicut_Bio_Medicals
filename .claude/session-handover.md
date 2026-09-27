# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

## Zone tree in reports — plan drafted (2026-09-27)

- Plan: `docs/Zone-Tree-In-Reports-Implementation-Plan.md` (draft, not yet
  approved). Basheer's decisions: tree from Kerala/Karnataka down, always
  shown, "not in a sub-zone" lines so levels roll up, Pipeline Report +
  Sales Report + Dashboard.
- **Next:** Basheer approves the plan; Claude checks Dev zone data
  read-only, writes the E2E test plan, builds. Not in the current UAT move
  unless Basheer says so.

## UAT promotion (main → uat) — starts today ~3 pm (2026-09-27)

- Plan: `docs/UAT-Promotion-2026-09-Plan.md`, revised 2026-09-27; its
  after-move record is added once the move is done. Moves UAT to `143c78e`
  only (Brand-report work stays behind); runs `0042`–`0054`; both Render
  services suspended for the whole move; team told 1 hour.
- Check scripts (read, catalog CSV export added): old session scratchpad
  folder b77f7022-d573-40ab-afa8-9c35d7c41815 (full path in the
  plan, section 4).
- **Next:** at ~3 pm, follow section 4's table exactly — step 1 (Basheer
  tells team), step 2 (Basheer suspends both services), then step 3.
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
  move, which includes the catalog clean-up (Basheer, 2026-09-27).
