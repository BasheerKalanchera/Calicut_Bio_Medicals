# Sales Loss Report — Implementation Plan

**Status:** Approved 2026-11-25 (Basheer). Built by Build & Test or Build,
whichever has room (Basheer, 2026-11-25).
**Progress:** built on the Build branch 26 Nov (`e783951`, `14789d6`,
`57c7e38`, `4d60caa`), pre-E2E review fixes `df6b2c1`; merged into `main`
27 Nov, `c4de312`; migration 0069 applied to Dev 27 Nov; manual E2E pending.
**Traceability rows:** 1.4 Competitive Loss Report (Not started); 1.4 Lost
deal intelligence — the missing competing-product field (Partial).
**Design / discussion:** Backlog "Sales Loss Report — why Cabio loses
business"; Progress-Archive-2026-11, 13 Nov (Build & Test) and 25 Nov
(midday, later).

## Decisions

- D1. The signed Competitive Loss Report is built as the **Sales Loss
  Report**, with Loss Reason as one of its filters — Basheer, 2026-11-13
- D2. It lists every Lost Opportunity, including those with no product
  line (6 of 25 on UAT, 13 Nov), so it reads the Opportunity, not its
  product lines — Basheer, 2026-11-25
- D3. Who sees what: the same as the other reports — a rep sees their own
  Lost Opportunities, an Area Manager their team's, SBU Manager, General
  Manager and Admin everyone's in their reach — Basheer, 2026-11-25
- D4. Filters: period by the date the Opportunity was closed (This Month /
  This Quarter / All Time, same box as the Sales Report, This Quarter
  first), SBU, zone, owner, Loss Reason — Basheer, 2026-11-25
- D5. Top of the screen: two short summaries, **by Loss Reason** and **by
  Competitor** (count and value each); pressing a row filters the list
  below to it — Basheer, 2026-11-25
- D6. The list, one row per Lost Opportunity: Opportunity name, customer,
  owner, stage it was lost at, Loss Reason, competitor, competing product,
  value, closed date — on one line; no loss notes column (the rep's words
  on a loss are the "Why this change?" note on the Opportunity's Activity
  tab; the app has no loss-notes box); newest first; pressing a row opens the
  Opportunity — Basheer, 2026-11-25 (notes left out to fit one row)
- D6a. Phone card without the loss notes too (same as the computer list)
  — Basheer, 2026-11-25
- D7. Value: the total of its product lines when it has any, otherwise its
  indicative value, otherwise "—" — Basheer, 2026-11-25
- D8. New optional **"Competing product"** box in the Lost pop-up, next to
  Competitor Name (e.g. "N6"); shown on the Opportunity's Overview and in
  the report. Optional because the rep often doesn't know which product
  the competitor offered — Basheer, 2026-11-25
- D9. Competitor Name stays typed text (lighter option); the "by
  Competitor" summary groups names ignoring capitals and extra spaces. The
  heavier option — a fixed list of competitors to pick from, plus a
  one-off clean-up of names already typed — is not in this plan — Basheer,
  2026-11-25
- D10. The two open Sales Report questions from 13 Nov stay outside this
  plan (in the Backlog entry): counting Lost with no product line in the
  Sales Report's win rate, and asking for a product line when an
  Opportunity past Lead is marked Lost — Basheer, 2026-11-25
- D11. Built and tested on Dev; reaches UAT with the next UAT release, like
  any other feature — Basheer, 2026-11-25
- D12. Keep the existing "Sales Report" name (not "Sales Won Report") —
  Basheer, 2026-11-25
- D13. The zone filter includes every zone under the one picked — "North
  Kerala" includes Malappuram — as the No-activity customers report does
  and as the Sales Report's zone figures do. Not the On Hold report's exact
  match (its screen has no zone filter, so that code is never used) —
  Basheer, 2026-11-25
- D14. The "by Competitor" summary lists only Lost Opportunities with a
  competitor named; no "No competitor" row (the "by Loss Reason" summary
  already counts every loss) — Basheer, 2026-11-25
- D15. The "Competing product" box (D8) shows only when the Loss Reason is
  "Competitor Won", beside Competitor Name, as Competitor Name does today
  — Basheer, 2026-11-25
- D16. Saving a Lost Opportunity with any Loss Reason other than
  "Competitor Won" clears both the competitor name and the competing
  product, so a hidden box never keeps a competitor against, say, a
  "Price" loss. An emptied "Competing product" box is saved as empty —
  Basheer, 2026-11-26
- D17. The report shows a competitor and competing product (and counts the
  competitor in "by Competitor") only when the Loss Reason is "Competitor
  Won", so older Lost Opportunities with a name saved against another reason
  don't count against that competitor — Basheer, 2026-11-26
- D18. The phone card also shows the competing product, next to the
  competitor — Basheer, 2026-11-26
- D19. On a phone the report keeps its "Filters" button; no other report
  has one today — Basheer, 2026-11-26
- D20. The Owner box lists deactivated owners too, their names in red under
  an "Inactive Owners" heading, as on the Pipeline screen — Basheer,
  2026-11-26
- D21. A Lost Opportunity whose only lines are trade-ins shows "—" as its
  value, not a figure made from the trade-ins — Basheer, 2026-11-26

## Figures and sources

- 25 Lost Opportunities on UAT, 6 with no product line; Sales Report counts
  19 Lost (68.9 % vs 62.7 % win rate) — UAT read-only check, 13 Nov
  (Progress-Archive-2026-11, 13 Nov, Build & Test)
- 5 real Lost Opportunities on Dev, 4 shown by the Sales Report — Dev
  check, 13 Nov (same entry)
- "P9 Elite lost to a Mindray N6" — one of the six UAT Lost with no
  product line, 13 Nov (same entry); used as the competing-product example
- Loss Reasons: Price, Competitor Won, Budget Cancelled, Requirement
  Changed, Technical Mismatch, Timing Delay, No Decision, Other —
  `docs/Business-Rules.md` "Loss Reason Values" (the live list not
  re-queried)
- Competitor Name is free text and required only for "Competitor Won" —
  `opportunity/validators.py:202`, `OpportunityDetailScreen.tsx:2044`
- A Lost Opportunity gets a closed date when it is closed —
  `opportunity/service.py:277, 546`
- Reports menu today: Daily Activity, Stagnant, No-activity customers,
  Opportunities On Hold, Product Performance, Pipeline, Sales —
  `sales-os-app/src/DemoApp.tsx:76–85`

## 1. In plain terms

A new screen, **Sales Loss Report**, in the Reports menu. It answers "why
are we losing business, and to whom?".

- At the top, two short tables. **By Loss Reason**: how many Opportunities
  were lost for each reason, and their value. **By Competitor**: the same
  for each competitor named. Pressing a row (say "Price") shows only those
  Opportunities in the list below.
- Below, the list of Lost Opportunities: name, customer, owner, the stage
  it was at when lost, the reason, competitor, competing product, value
  and closed date, on one line. The rep's own words on why it was lost
  are not in the list; pressing a row opens the Opportunity, where they
  are the "Why this change?" note on its Activity tab.
- Filters at the top, as on the other reports: period (by the closed date),
  SBU, zone, owner, Loss Reason. Picking a zone includes the zones under
  it ("North Kerala" includes Malappuram, D13).
- It shows every Lost Opportunity, including those where the rep never
  added a product. The value then comes from the Opportunity's own
  estimated value.
- **One small change for reps:** when marking an Opportunity Lost, a new
  optional box "Competing product" sits next to Competitor Name, so the
  rep can record that the customer bought, say, a Mindray N6, not just
  "Mindray". Old Lost Opportunities show it blank.
- Who sees what is unchanged: reps see their own, managers their team's.

**Lighter vs heavier (D9).** Competitor names are typed by hand today, so
"Mindray" and "mindray " would show as two competitors. The lighter option
treats those as one (ignoring capitals and spaces) but can't merge real
spelling differences. The heavier option replaces typing with a list to
pick from and cleans up names already typed — more work, and a change to
how reps mark Lost. Recommended: lighter now; heavier only if the summary
shows the names are messy.

### On a phone

- The two summary tables are one block each: reason (or competitor), then
  count and value on one line.
- Each Lost Opportunity is a card: Opportunity name; customer and owner;
  reason, competitor and competing product (D18); value, stage lost at and
  closed date (no loss notes, D6a). Pressing the card opens that Opportunity's screen;
  Back returns to the report with its filters as they were.
- The filters fold behind a "Filters" button (D19).
- Lost pop-up: "Competing product" sits under Competitor Name, full width.

## 2. Build order

1. Database: a "competing product" column on the Opportunity (one
   migration), the Lost pop-up box and the Overview field. Checkpoint
   commit. Nothing stops working on Dev.
2. Server: the report's data (summary and list), with the same "who sees
   what" as the other reports; tests per role.
3. Screen: Sales Loss Report in the Reports menu, desktop and phone.
   Checkpoint commit, then pre-E2E review and the manual E2E on Dev.

## 3. What could be affected

Code search for `competitor_name` / `competitorName`, 25 Nov (backend,
`sales-os-app/src`, `scripts`; tests left out):
- (a) Opportunity screen — the Lost pop-up and the Overview card are the
  only screens that show or save it (`OpportunityDetailScreen.tsx:248,
  1457, 1553, 1629`). Check: Lost saves with and without a competing
  product; "Competitor Won" still needs Competitor Name; the Overview shows
  both fields.
- (b) Server save path — `opportunity/schemas.py:339` (update), `:394`,
  `:437` (responses), `service.py:523` (Lost check, unchanged). Check: On
  Hold and Won saves unchanged (server tests).
- (c) Customer 360 — the customer's Opportunity data carries
  `competitor_name` (`account/workspace_schemas.py:142`) but no screen
  there shows it; the new field is not added there. No browser check.
- Not reached: `scripts/vendor_pipeline_report.py` reads `competitor_name`
  for open Opportunities only (UAT export); Pipeline list, Kanban and the
  other reports don't read it. The Reports menu gets one new entry; check
  the other entries still open.
- Name clash to avoid: installed equipment already has
  `asset.competitor_product_name` (a competitor's machine at a customer,
  shown on Customer 360). The new Opportunity column has the same name on
  a different table — fine for the database, but labels and code must not
  mix the two.

## 4. Not in this plan (with reasons)

- A fixed list of competitors (D9) — heavier; only if the names prove
  messy.
- Sales Report counting Lost with no product line, and requiring a product
  line when Lost past Lead (D10) — separate decisions already in the
  Backlog; they change the Sales Report and the Lost rule, not this report.
- Charts — the two summary tables carry the same numbers; a chart can
  follow if the leadership team asks.
- Competitive Loss on the GM Dashboard (PRD 5.5) — the report comes first.
- Adding the competitor's machine to the customer's installed equipment
  when an Opportunity is lost to a competitor — a separate idea (installed
  equipment already records competitor machines); not asked for.

## 5. Business rules and records to update

- BR-OP-03 (Lost Status Validation): add `competitor_product_name` as an
  optional field; both competitor fields kept only for "Competitor Won"
  (D16).
- New BR-REP rule for the Sales Loss Report: who sees what, value rule.
- Traceability rows 1.4 (both) once built and E2E-passed.
- Backlog "Sales Loss Report": point to this plan.

## 6. Technical addendum

- Migration: `opportunity.competitor_product_name VARCHAR(255) NULL`;
  regenerate `docs/Physical-Schema.sql`.
- Backend: `opportunity` model, schemas, update path beside
  `competitor_name`; `reporting/repository.py` new `sales_loss_report`
  modelled on `opportunities_on_hold` (`:616`) — `_apply_owner_scope`,
  SBU/owner filters, zone through `ZoneClosure` descendants as in
  `no_activity_customers` (`:795`, D13; not On Hold's exact
  `Account.zone_id == zone_id`), `closed_at` period, `loss_reason_id` filter;
  value = `SUM(opportunity_item.extended_value_lakhs)` excluding BUYBACK when
  the Opportunity has any line (NULL if only trade-ins, D21), else
  `indicative_value`, via an outer-joined subquery so no-line Opportunities
  stay; competitor grouping on `lower(trim(competitor_name))`.
  Router `GET /reporting/sales-loss`. Tests per role and for no-line Lost.
- Frontend: `SalesLossReportScreen.tsx` (MUI only), `services/reporting.ts`,
  `types/reporting.ts`, menu entry in `DemoApp.tsx` `REPORTS_SECTION`;
  period box reuses `getFiscalQuarterBounds` as in `SalesReportScreen.tsx`.
- E2E: `docs/Sales-Loss-Report-Manual-E2E-Test-Plan.md` (4 pre-flight, 33
  steps; Dev has 6 Lost, 25 Nov, and the plan adds three). D7's middle case
  (no product line, typed value) can't be made from today's screens — the
  value box shows only from Qualified or once a product is added — so the
  builder's automated test covers it (26 Nov).
