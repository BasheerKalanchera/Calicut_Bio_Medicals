# Discussion: Salesperson Performance Report — 2026-10-03

**Status:** Discussion — for Haroon (and Latheef Bhai) to choose the measures
and the shape. Nothing built. Q2 answered and a Finance download asked for,
2026-10-07 — see section 7. Parked by Basheer 2026-10-07 while Target vs
Actuals is finished.
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
2. **Should shared Opportunities be credited by split %?** *Answered — see
   7.1.* E.g. a ₹10 L sale
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

## 6. Technical addendum (2026-10-03)

- Existing: `backend/app/domains/reporting/repository.py` — `sales_summary`
  (group_by `rep`, `closed_at` period filter), `activity_levels`,
  `overdue_actions`; `sales-os-app/src/screens/SalesReportScreen.tsx`
  (`Period = "month" | "quarter" | "all"`, current period only).
- Past-period picker: the API already takes `period_start` / `period_end`; the
  gap is screen-only.
- Split attribution: `split` table exists; reports group by `owner_id` only
  (Backlog entry above).
- Target vs actual per rep: `docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md`.

## 7. Updates — 2026-10-07 (Basheer and Claude)

Parked by Basheer on 2026-10-07 while Target vs Actuals is finished. This
section records the whole discussion, so it can be picked up again without
the chat.

### 7.1 Q2 answered: shared Opportunities are credited by split %

- **Answer:** each person on a shared Opportunity is credited by their
  split %. E.g. Fazal owns a ₹10 L Opportunity and Fahad has a 40 % split,
  so Fazal is credited ₹6 L and Fahad ₹4 L. Answer passed on by Basheer,
  2026-10-07.
- **What industry tools do:** Salesforce (Opportunity Splits), Microsoft
  Dynamics 365 (Opportunity Split) and Zoho (Team Selling / Deal Split)
  all offer "revenue splits" that must total 100 %, the same as Cabio's
  splits (BR-FIN-01). The split credit feeds each person's forecast and
  their target-achievement views. Their standard reports otherwise stay
  owner-based.
- **Why owner-only isn't enough at Cabio (Basheer):** if the Sales Report
  shows the full value under the owner, anyone using it for incentives
  would overpay the owner and pay the split partner nothing. Every screen
  must give the same answer to "how much did Fahad win?"
- **The general rule (direction agreed by Basheer, 2026-10-07):**
  - **Figures about one person use their split share.** That covers the
    Target vs Actuals person rows, the Sales Report's "by salesperson"
    view, the per-person views of the Pipeline Report and Product
    Performance, and the click-through lists behind them. Clicking Fahad's
    ₹4 L lists that Opportunity with his 40 % share.
  - **Figures about a group count each Opportunity once.** Zone, SBU,
    company, brand, product and stage totals don't change.
  - So only the per-person breakdowns move.
- **Phasing (direction agreed):**
  - Target vs Actuals first, in its current build.
  - The other reports' per-person views straight after, with their own
    short plan.
  - Both go to UAT together, so the screens never disagree there.
  - The decision record lives in the Target vs Actuals plan and
    Business-Rules.
- **Likely exceptions, to settle in that plan:**
  - Stagnant and On-Hold are lists, not money totals, so they probably
    stay owner-based.
  - Older splits that cross SBUs (made before ADR-037) count only in the
    Opportunity's own SBU.

### 7.2 Incentives: a report Cabio can send to Finance

- **Today (Basheer):** Finance works out incentives from Haroon's inputs,
  because no system shows what each person should get.
- **Need (Basheer):** from next month, Cabio should have a report it can
  send to Finance for the incentive calculation.
- **Scope:** Sales OS gives Finance the inputs, and Finance still
  calculates the rupee incentive. The signed PRD keeps incentive and
  commission calculations outside Phase 1 (PRD line 423 and the kickoff
  meeting note). This report's home is signed row 11.1 ("salesperson
  performance"), so it stays inside Phase 1.
- **Two options considered:**
  - **Lighter (the chosen direction):** inputs only, meaning what each
    person was credited. Finance uses it for its own calculation.
  - **Heavier:** Sales OS also calculates the incentive using Cabio's
    rules (slabs, target achievement and so on). This is outside Phase 1
    and needs Finance's rules written down first, so it comes later, if
    wanted at all.
- **No separate report (Basheer):** the Finance report is this report's
  download, not a report of its own. An earlier suggestion of a separate
  "incentive report" was dropped because it would duplicate this one.
- **Lightweight, one line per person (Basheer):** Finance doesn't need
  the full report. One line per person for the sales team of about 15,
  showing what each person did, downloaded and sent to Finance.

### 7.3 The Finance download: suggested columns

For the chosen month, one row per person. Haroon to confirm or trim the
columns.

| Person | SBU | Target | Won (paid, by share) | Achieved % | Opportunities won | PO received (by share) |
|---|---|---|---|---|---|---|
| e.g. Fahad | Critical Care | ₹30 L (Q3) | ₹4 L | 13 % | 1 | ₹4 L |

- **Won (paid, by share):** the person's share of Opportunities Won in the
  month. Won means full payment confirmed (BR-OP-17).
- **PO received (by share):** the person's share of Opportunities whose PO
  date falls in the month.
- **What's behind each figure:** the Opportunities that make up a figure
  stay one click away in the app, not in the download. If Finance later
  wants them in the file, the option discussed is a second sheet with one
  line per person per Opportunity: hospital, PO number, date won, full
  value, share % and amount credited.
- **Format and sending:** the recommendation is an Excel download that
  Haroon (or Admin) emails to Finance, rather than automatic emails. Who
  may download it: Admin and the GM (Haroon), still to confirm.
- **For Finance's need alone,** the report's "Results" section (with split
  credit) and this download are enough. The Conversion, Pipeline and
  Activity sections can follow later.

### 7.4 Open questions (added 2026-10-07)

1. **Monthly report, quarterly targets.** Targets are set per quarter, but
   the report is monthly. E.g. Fazal's Q3 target is ₹30 L and he wins ₹8 L
   in November. Should his line show:
   - (a) the quarter so far: ₹8 L of ₹30 L, which is 27 %, with November's
     ₹8 L as its own column; or
   - (b) a monthly slice of the target: ₹10 L a month, so 80 %? That
     assumes sales come evenly each month, which they rarely do.

   *Suggested: (a), because targets are judged by the quarter at Cabio.*
2. **When does a sale count for incentive?** E.g. Fahad's ₹30 L
   Opportunity at Al Shifa gets its PO in October and full payment in
   December. Does it count in October's report or December's?
   *Suggested: December, when full payment is confirmed. That is when
   Sales OS treats it as Won (BR-OP-17). Haroon to confirm this matches
   how incentives work at Cabio.*
3. **Does the incentive depend on reaching the target?** If yes, the
   download needs the Target and Achieved % columns. If it's a flat % of
   sales, the Won column alone would do. *Suggested: keep both columns
   either way.*
4. **Which columns does Finance actually need?** Haroon knows how
   incentives are worked out today, so he should confirm or trim the
   table in 7.3.
5. **First report:** October's figures (sent early November) or
   November's (sent early December)? *Suggested: November's.* October's
   would need everything on UAT within about 3 weeks, alongside the Query
   Load Fixes (deadline 11 Oct). These UAT gaps would also have to be
   closed first:
   - close dates on the 37 Opportunities closed before 27 Sep (Haroon's
     answers are in, with 3 follow-ups open);
   - "Won only at full payment" (BR-OP-17), which isn't on UAT yet;
   - PO dates, which are new and on Dev only so far.

### 7.5 Where it runs

The report runs on the current UAT system, which Cabio already uses with
real data and which becomes the live (Prod) system
(`docs/Deployment-Topology.md`). It is built and tested on Dev first, then
moved to UAT before the first report is due.

### 7.6 Technical addendum (2026-10-07)

- Owner-only joins today (`Opportunity.owner_id == UserProfile.id`) are in
  `backend/app/domains/reporting/repository.py`: `pipeline_summary`,
  `sales_headline`, `sales_summary`, `stagnant_deals`,
  `product_performance` and `opportunities_on_hold`.
  - Per-person groupings would weight values by
    `split.split_percentage / 100` through a join on `split`.
  - Group-level groupings stay one row per Opportunity.
  - Opportunities with no split rows count 100 % to the owner.
- The drill-down "strict attribution" mode (Traceability 11.2) would
  change for person drills only: it would include split participants and
  show the share.
- Finance download:
  - It uses the same per-person calculation as Target vs Actuals (target
    from `target_plan`; Won and PO by split share), grouped by month.
  - Won is dated by `full_payment_confirmed_at` / `closed_at`; PO by
    `po_date` (migration 0060).
  - It is an Excel export of the summary table only, with one row per
    active SBU member except Admin.
- UAT dependencies:
  - BR-OP-17 is not on UAT (`30d545f` worked around it).
  - 37 Won rows are missing `closed_at` (Backlog "UAT: fill in missing
    'date closed'").
  - `po_date` is on Dev only.
  - UAT has 5 shared Opportunities, with Haroon on 4 of them.
