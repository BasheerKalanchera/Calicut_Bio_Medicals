# Discussion: Salesperson Performance Report — 2026-10-03

**Status:** Discussion — for Haroon (and Latheef Bhai) to choose the measures
and the shape. Nothing decided, nothing built.
**Participants:** Basheer (decisions), Haroon / Cabio leadership (business
sign-off), Claude (options and analysis).
**Origin:** Basheer, 2026-10-03: "Is a report of a salesperson's performance
for a given month or quarter already in the requirements?"
**Signed requirement:** Traceability row 11.1, "Phase 1 analytics: conversion,
pipeline aging, salesperson performance" (Partial). The "salesperson
performance" part of that row isn't tracked in its notes today.

## 1. What the requirements actually say

The signed requirement is one line (Requirements list, Phase 1 v4):

> [Feature 11.1 Reports] Delivery of Phase 1 analytics covering conversion
> rates, pipeline aging, and **salesperson performance**.

The PRD never defines a "salesperson performance report". It maps this line to
its general reporting principles (Appendix A.1): every dashboard and report can
be filtered and grouped by **individual user** and **time period** (and SBU,
zone, team, product), and exported to Excel/PDF.

So what the report contains has to be put together from the parts of the PRD
that talk about one rep:

| Area | Where in the PRD | Measures |
|---|---|---|
| Results vs target | A.2.1 Salesperson Dashboard (also 5.3) | Revenue Target, Revenue Achieved, Achievement % |
| Conversion | Signed 11.1 (same line) | Win rate — Won against Lost |
| Pipeline health | A.2.1 | Open Pipeline Value, Weighted Forecast, High Priority Opportunities |
| Discipline | A.2.1, A.2.2 | Overdue Actions, Beat Plan Progress / Compliance |
| Effort | A.2.2 Manager Dashboard (also 5.4) | Rep / Team Activity Levels |
| Credit on shared sales | A.3.7 Revenue Attribution Report | Revenue credited by each person's split % |
| Period | A.1 | Any month or quarter |

**Out of scope for Phase 1** (kickoff meeting note): incentive calculations,
commission management and performance-based pay — future phases only.

## 2. What it would contain — a proposal

One row per rep for a chosen **month or quarter, including past ones** (e.g.
"August", "Q1 2026-27"), with click-through to the Opportunities behind each
number:

1. **Results:** target, Won revenue, achievement %, number of Opportunities
   Won, average size.
2. **Conversion:** win rate; number Lost and the top loss reasons.
3. **Pipeline:** open pipeline value, weighted forecast, new Opportunities
   created in the period.
4. **Activity and discipline:** activities logged (visits, calls, demos),
   beat-plan compliance, overdue actions.

Who sees what follows the existing access rules: a rep sees their own row; a
manager sees their team side by side; Haroon and Admin see everyone, grouped by
zone and SBU.

## 3. What exists today

- **Built:** Sales Report grouped by rep — Won revenue, number Won, win rate,
  average size; reports for activity levels and overdue actions.
- **Coming:** each rep's target against actuals — Plan vs Actuals Tracking
  (approved 2026-09-29, not built yet).
- **Missing:**
  - picking a **past** month or quarter — the Sales Report offers only "This
    Month", "This Quarter" or "All";
  - credit by split % on shared Opportunities (reports count the owner only —
    Backlog "Reports never implement split-weighted attribution");
  - beat-plan compliance per rep;
  - one page bringing the four sections together.

## 4. Two ways to deliver it

- **Lighter — extend what exists.** Add a past-period picker (any month or
  quarter) to the Sales Report and the Insights Dashboard, and show each rep's
  figures in Plan vs Actuals Tracking. Most of the value, small work; the
  measures stay spread over two or three screens.
- **Fuller — a dedicated "Salesperson Performance" page** with the four
  sections above, one row per rep, Excel export. One place to review a rep;
  more work (several days), and it depends on Plan vs Actuals for the target
  figures.

**Recommendation:** decide the measures first (section 5, Q1). Basheer prefers
the dedicated page (2026-10-03).

## 5. Questions for Haroon

1. **Which measures do you use today to judge a rep's month or quarter?** For
   example: revenue against target, number of hospitals visited, demos done,
   win rate. *Suggested: the four sections in section 2 — tell us what to drop
   or add.*
2. **Should shared Opportunities be credited by split %?** E.g. a ₹10 L sale
   split 60/40 counts ₹6 L and ₹4 L to the two reps, instead of ₹10 L to the
   owner. *Suggested: yes, for this report — it's what the PRD's Revenue
   Attribution report (A.3.7) asks for.*
3. **Lighter or fuller?** (section 4) **Basheer prefers the dedicated page
   (fuller), 2026-10-03** — Haroon to confirm. It brings the rep-level figures
   from the other reports onto one page; target figures come from Plan vs
   Actuals Tracking, so it fits best after that.
4. **Excel/PDF export needed?** A download of the same table, for monthly
   review meetings, for people who don't use the app (Latheef Bhai, Finance —
   e.g. for incentives, which stay outside the app), and to keep a record of
   how a quarter looked at the time. PRD A.1 asks for it "where applicable".
   *Suggested: Excel.*

**Note on "Won revenue":** from BR-OP-17 (payment confirmation gate, being
built), Won means **payment collected**, not PO received. A rep's "achieved"
figure will therefore count collected business. Delivered-but-unpaid business
appears as Payment Pending in their pipeline.

## 6. Technical addendum

- Existing: `backend/app/domains/reporting/repository.py` — `sales_summary`
  (group_by `rep`, `closed_at` period filter), `activity_levels`,
  `overdue_actions`; `sales-os-app/src/screens/SalesReportScreen.tsx`
  (`Period = "month" | "quarter" | "all"`, current period only).
- Past-period picker: the API already takes `period_start` / `period_end`; the
  gap is screen-only.
- Split attribution: `split` table exists; reports group by `owner_id` only
  (Backlog entry above).
- Target vs actual per rep: `docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md`.
