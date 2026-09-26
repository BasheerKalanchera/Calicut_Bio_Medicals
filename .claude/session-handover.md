# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

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

## Hospital-wise target planning — design in discussion (2026-09-25)

- Discussion doc: `docs/Discussion-Hospital-Wise-Target-Planning-2026-09.md`.
  Design C chosen (hospital amounts add up to the quarterly target, brand
  split on top, one approval); decisions 1–6 recorded there.
- **Deadline:** roll out Target + Coverage Planning to UAT around 2 Oct 2026
  so Oct–Dec (2026-Q3) planning happens in the system. Fallback decision
  point around 29 Sep (see doc section 6).
- **Next:** Basheer answers the 6 open questions in section 5 (who rates
  Business Potential is the most urgent), then write
  `docs/Hospital-Wise-Target-Planning-Implementation-Plan.md`.
