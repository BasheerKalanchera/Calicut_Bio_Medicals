# Discussion: Salesperson Performance Report — 2026-10-03

**Status:** Discussion — for Haroon (and Latheef Bhai) to choose the measures
and the shape. Nothing built. Q2 answered and a Finance download asked for,
2026-10-07 — see section 7. Parked by Basheer 2026-10-07 while Target vs
Actuals is finished. **2026-10-16:** Q3 and Q4 answered; the Finance
download (7.2–7.4) parked for Phase 2 — see section 8. Still open with
Haroon: Q1, the measures. **2026-10-31:** overlap with My Work and Target
vs Actuals checked; nothing built until Q1 is answered — section 9.
**2026-11-03:** a new "Performance" tab on the Insights dashboard, shape
agreed; Q1 re-asked as four yes/no additions — section 10.
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

> **Parked for Phase 2 (Basheer, 2026-10-16)** — 7.2 to 7.4 are kept as
> written; see section 8. "Monthly" below was a drafting assumption, not
> a decision: the frequency is undecided (Basheer leans quarterly).

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

## 8. Decisions — 2026-10-16 (Basheer)

- **Q3 (lighter or fuller):** one dedicated page. *Replaced 2026-11-03 by
  a Performance tab on the Insights dashboard — section 10.*
- **Q4 (export):** an Excel download.
- **Finance incentive download (7.2–7.4):** not a signed requirement —
  parked for Phase 2. Answers so far, kept for then:
  - Cabio pays 50 % of the incentive at PO and the rest once full payment
    is received; for a retention order, the second half when the
    Opportunity is closed.
  - How often the file goes to Finance: undecided; Basheer leans
    quarterly. A question for Haroon in Phase 2.
- **Still open:** Q1, the measures — on Backlog "Waiting on people".

## 9. What we already have, now that My Work exists — 2026-10-31

Basheer asked (31 Oct): isn't this the same as My Work? Do we need
another screen?

**Not the same.** My Work is one person's to-do list for *today*: which
Opportunities to chase, which hospitals to visit, which next actions are
overdue or due this week. It doesn't look back at a past month and
doesn't put people side by side. This page is a report card for a chosen
month or quarter, people side by side.

**Already covered, measure by measure** (section 2's list against the
screens, read 31 Oct):

| Section 2 measure | Where it is today |
|---|---|
| Target, Won, % of target, per person | Target vs Actuals (Insights Dashboard), any quarter or year — its arrows step back to past ones |
| High-priority Opportunities | My Work, one person, today only |
| Overdue next actions, per person | Insights Dashboard → Overdue tab, people side by side, today only (managers) |
| Open pipeline value, weighted forecast, per person | Insights Dashboard → Pipeline tab, grouped by Rep, today only |
| Win rate, Lost count, top loss reasons, per person | nothing |
| Activities logged, per person | Insights Dashboard → Team Activity tab: one total per person, last 30 days only, not split into visits, calls and demos (managers) |
| Beat-plan compliance | partly: My Work's "My hospitals this quarter", one person |
| Any past **month** | nothing (Target vs Actuals goes by quarter and year) |

**Recommendation (Claude, agreed by Basheer 31 Oct):** build nothing now.
Once Haroon answers Q1:
- if he wants only a few measures beyond what's covered → the lighter
  option (section 4): add those columns to Target vs Actuals or the
  Sales Report, no new page;
- if he wants all four groups side by side, by month → the dedicated
  page decided on 16 Oct (section 8, Q3).

So the 16 Oct page decision is looked at again once Q1 is answered; it
stands until then — Basheer, 2026-10-31. *Looked at again 2026-11-03
before Q1: replaced by a Performance tab on the Insights dashboard —
section 10.*

**Technical addendum.** My Work: `MyWorkScreen.tsx` Summary tab (lines
331–350: My hospitals, Opportunities, Next actions groups). Target vs
Actuals: `TargetVsActualsSection.tsx:40, 109–116` (`period` state,
previous/next quarter or year arrows). Insights tabs:
`InsightsDashboardScreen.tsx:38–43` (`TABS`), Pipeline `groupBy` "rep"
(lines 27–34, 126), Team Activity `getActivityLevels` over the last 30
days (lines 153, 266), Overdue (lines 307–313).

## 10. A "Performance" tab on the Insights dashboard — 2026-11-03

Basheer (3 Nov): instead of asking Haroon what he looks at today, give
him choices. Talking it through, Basheer agreed that most of section 2
repeats what Insights already shows (section 9), and asked for the
missing parts as a new tab on the Insights dashboard. Examples below are
made up.

### 10.1 What it adds — four gaps

Insights already shows each person's target against Won, open pipeline,
overdue actions and an activity count. Missing (screens read 3 Nov):

1. **Win rate per person** — "won 3 of 5 closed, 60 %". Today there is
   one team-wide win rate only (Sales Report).
2. **Number lost and the reasons, per person** — "2 lost: Price,
   competitor". Each lost Opportunity already records one reason from a
   fixed list.
3. **A past month** — e.g. "August". Today Target vs Actuals steps by
   quarter or year; Pipeline, Overdue and Team Activity show today only.
   Pipeline and Overdue stay as they are.
4. **Activities by type, per person** — "12 visits, 8 calls, 2 demos"
   instead of one total; Team Activity today is one total, last 30 days.

All four use data the app already records; nothing new to enter.

### 10.2 Why a tab, not changes to the existing tabs

- One period box (month, quarter or year, past ones too) serves all
  four; spread over tabs, each would need its own and they could drift
  apart.
- The existing tabs don't change.
- It answers signed 11.1 "salesperson performance" where people already
  look.
- It joins the 16 Oct decision (a dedicated page) with the 31 Oct one
  (don't repeat Insights): the dedicated page, placed inside Insights.
  It replaces the 16 Oct "dedicated page" (section 8, Q3).

### 10.3 Shape — agreed by Basheer, 3 Nov ("This looks good")

- **Results on the tab too:** Target, Won and % of target sit beside the
  new columns, worked out exactly as on Target vs Actuals (split credit
  included), so the two tabs always agree.
- **Who sees it:** everyone; a salesperson sees only their own row,
  managers their team, Haroon and Admin everyone (today's access rules).
- **A single month:** Won, win rate, losses and activities, with no
  target or % — targets are set per quarter. Target and % show when a
  quarter or year is chosen.
- **A table, one row per person,** grouped and indented by who reports
  to whom, as Target vs Actuals already does; each manager's row carries
  the team total. Columns can be sorted (e.g. by win rate). On a phone
  each row becomes a card (Frontend standards §6.11). About 15 people
  (Basheer, 7 Oct) fit one laptop screen.
- **Click a figure** to see the Opportunities behind it, like the other
  reports.

Example (made up):

| Person | Target | Won | % | Win rate | Lost | Visits | Calls | Demos |
|---|---|---|---|---|---|---|---|---|
| **North Kerala — Area Manager A** | ₹160 L | ₹120 L | 75 % | 58 % | 5 | 40 | 31 | 6 |
| Rep 1 | ₹30 L | ₹24 L | 80 % | 60 % | 2 — Price 1, Competitor 1 | 12 | 8 | 2 |
| Rep 2 | ₹25 L | ₹10 L | 40 % | 33 % | 4 — mostly Price (3) | 6 | 3 | 0 |

**Lost reasons when there are several.** Each lost Opportunity has one
reason, so "several" means several losses for different reasons.
- The cell shows the number lost and the most common reason: "4 — mostly
  Price (3)"; a tie shows both: "2 — Price 1, Budget 1".
- Clicking it opens the full breakdown: each reason, its count and the
  Opportunities under it.
- One team-wide line at the top of the tab: "Team losses this quarter:
  Price 9, Competitor 4, Budget 2".

How many reasons the fixed list holds is not counted (it lives in the
Dev database; a read-only query can list them).

**Overlap:** the team-wide losses line is a small part of the signed
Competitive Loss Report (Traceability row 1.4, Not started), which also
needs losses by competitor. It doesn't close that row.

**Download:** Excel/PDF export of this tab is added only after checking
with Haroon (Basheer, 3 Nov) — question 5 in 10.4. The 16 Oct Excel
decision (section 8, Q4) waits on his answer.

### 10.4 The question for Haroon (replaces Q1)

"Here is the new Performance tab on the Insights dashboard. Which of
these do you want — yes or no for each?"

1. Win rate for each person. *Suggested: yes — Zoho, Dynamics,
   Salesforce and SAP all treat it as core (10.5).*
2. Number lost and the reasons, for each person. *Suggested: yes — it
   shows why a person is losing, not just how often.*
3. Looking back at a past month. *Suggested: yes, for Won and
   activities.*
4. Activities split by type (visits, calls, demos). *Suggested: yes,
   with the same choice of period.*
5. A download of this tab, as Excel or PDF — for review meetings,
   sharing with people who don't use the app, and keeping a record of
   how a quarter looked. *Suggested: yes, Excel.*

**Haroon's answer (via Basheer, 2026-11-07):** he wants only Wins and the
number of qualified demos conducted, per person. So 1 (win rate), 2 (lost
and reasons) and 4 (activities by type) are no. 3 (a past month) and 5
(download) dropped (Basheer, 2026-11-09). Still open, for the Cabio
leadership team (Basheer, 2026-11-09): what counts as a "qualified demo
conducted" —
the app has no Demo Activity type and no demo outcome field today; an
Opportunity records only its demo dates, entered when it moves from
Qualified to Demo (`opportunity/models.py:80-81`, BR-OP-01). Put back to
Basheer 7 Nov. **Answered (Basheer, 9–10 Nov):** a qualified demo is one
given after a qualification checklist and the manager's approval; it
becomes a column on Target vs Actuals, not a Performance tab. Detail,
decisions and the questions still open for Haroon and leadership:
`docs/Discussion-Demo-Qualification-2026-11.md`.

### 10.5 What leading products do (searched 3 Nov)

All four put three measures at the core and read them together: % of
target, win rate and average order value (total won ÷ number won). A
high win rate with small orders can still miss target.

- **Zoho CRM:** a standard "Sales Person's Performance" report (won per
  person); average size and win rate are separate custom reports;
  target-based reports need Zoho Analytics.
- **Dynamics 365:** the Sales Analytics add-on shows conversions, win
  rates, average size and revenue; a partner guide advises the typical
  (median) size, because a few big orders pull the average up.
- **Salesforce:** guides list % of target, win rate and average size as
  core, then pipeline cover, sales cycle length, activity and forecast
  accuracy.
- **SAP Sales Cloud:** four headline figures — sales by month, the same
  month last year, quota, and win rate (month by month against last
  year).

Mostly partner and blog pages, not the vendors' own manuals; SAP's page
is from an older release — the general pattern, not exact feature lists.
Sources: zoho.com/crm/help/reports;
zoho.com/analytics/blog/sales-team-analytics.html; Microsoft AppSource
"microsoftd365.salesanalytics"; randgroup.com Dynamics 365 dashboards
guide; metabase.com/integrations/dynamics-365-sales; revops.io
"measuring sales rep success"; help.sap.com (sbo92) sales performance
KPIs.

### 10.6 Technical addendum (2026-11-03)

- Insights tabs: `InsightsDashboardScreen.tsx:37–43` (`TabId`, `TABS` —
  target, pipeline, activity, overdue; activity and overdue
  `managerOnly`); Team Activity window `today.subtract(30, "day")`
  (line 134).
- Sales Report: `SalesReportScreen.tsx:20–24` (`PERIOD_OPTIONS` — this
  month, this quarter, all time); headline `win_rate` is team-wide
  (lines 108–112); per-rep rows carry revenue and `won_count` only.
- Lost reasons: `loss_reason` table (`reason_code`, `reason_name`,
  `is_active`); one `loss_reason_id` per Opportunity
  (`docs/Physical-Schema.sql`).
- Phone: shared table-or-cards component (Frontend standards §6.11).
