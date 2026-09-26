# Brand Breakdown in Pipeline Report, Sales Report and Insights Dashboard — Implementation Plan

**Status:** Approved 2026-09-26, building.

## What this is (plain terms)

The Pipeline Report, the Sales Report and the Insights Dashboard's
"Pipeline by…" card each have a breakdown dropdown (Stage/Rep/SBU/Zone/
Product), but no **Brand**. Nobody decided to leave it out: these screens
were built on 2026-09-15, when a brand was still just typed text on a
product ("EDAN" vs "Edan" could split into two rows). Brand became a proper
controlled list on 2026-09-22/23, and only Product Performance got a
"By Brand" option then — the other three were never revisited.

This adds **Brand** to all three dropdowns:
- **Pipeline Report / Insights Dashboard** — open pipeline value and
  weighted forecast per brand. Clicking a brand (Pipeline Report) opens its
  open deals on the Pipeline list.
- **Sales Report** — revenue won per brand. Clicking a brand opens its Won
  deals.
- Trade-ins belong to no brand, so they stay in a separate "Trade-Ins /
  Returns" row — same as the Product option — so the brand rows add up to
  the same total as every other breakdown.
- **Added during E2E (Basheer, 2026-09-26):** that Trade-Ins / Returns row
  is now clickable on both reports' Product and Brand breakdowns — it opens
  every deal with a trade-in line (Won ones only, from the Sales Report).
  Previously non-clickable only because a trade-in line has no product to
  filter on.
- **Added during E2E (Basheer, 2026-09-26): Pipeline Report and Insights
  Dashboard count Active deals only**, per BR-OP-07 ("On-Hold: Excluded
  from committed pipeline/forecasts"), which they had been breaking since
  2026-09-15 by counting every non-closed deal. On Hold, Won and Lost are
  all out of the bars, the headline and the drilled list. The "Open
  Pipeline Value" and "Unweighted Forecast" tiles became the same number
  and were merged into one **"Active Pipeline Value"** tile. Clicking any
  Pipeline Report bar now carries the Active status, so the list matches
  the bar (previously it also showed Won/Lost deals — SonoScape bar 30,
  list 34). The PRD's "Unweighted Forecast" and "Open Pipeline Value" KPIs
  are both still shown — as this one tile, since under BR-OP-07 they are
  the same number.
- **Added during E2E (Basheer, 2026-09-26): Sales Report clicks keep the
  period.** Clicking a bar with "This Month"/"This Quarter" selected now
  lists only the Won deals closed in that period (was: all-time Won deals,
  since 2026-09-15). Found by `/code-review`; not visible on Dev (only one
  Won deal), fixed from the code.
- **Product Performance:** the "Opportunities" figure is relabelled **"All
  Opportunities"** — it counts every deal ever (Active, On Hold, Won,
  Lost), per PRD A.3.4, beside its Won/Lost counts; the old label read like
  the Pipeline Report's Active count (SonoScape 34 vs 30).
- A deal with products from two brands has its value split between the two
  brand rows line by line (same as the Product breakdown); it is counted
  once in each brand's deal count.

Lands in Dev only; reaches UAT with the next promotion after E2E passes.
No migration, no new endpoint, no RLS change.

## Changes

**Backend**
- `reporting/schemas.py` — add `"brand"` to `PipelineGroupBy` and
  `SalesGroupBy`.
- `reporting/repository.py` — `pipeline_summary` and `sales_summary` gain a
  `brand` branch: `coalesce(Brand.id / Brand.name, trade-in bucket)`, with
  outer joins `OpportunityItem → Product → Brand`, mirroring the `product`
  branch (outer so Buyback lines still reconcile to the headline totals).
- Tests in `tests/domains/reporting/test_reporting_repository.py`: brand
  grouping uses outer joins, groups on brand name, buckets NULL as
  trade-in; for both summaries.
- Opportunity list/count (`opportunity/router.py`, `service.py`,
  `repository.py`) gain `has_trade_in: bool` — an `IN (subquery)` on
  `opportunity_item.line_type = 'BUYBACK'`, same shape as `brand_id`.
  Tests in `tests/domains/opportunity/test_opportunity_repository.py`.

- `reporting/repository.py` `pipeline_summary` — whole query restricted to
  `status_code = 'ACTIVE'` (was `is_terminal = false` for count/value);
  `total_value_lakhs` now equals `unweighted_forecast_lakhs`, response
  shape unchanged.

- Opportunity list/count also gain `closed_from`/`closed_to` (dates,
  `closed_to` inclusive — same next-day upper bound as reporting's
  `_period_bounds`) → `closed_after`/`closed_before` on `closed_at`.

**Frontend**
- `types/reporting.ts` — extend both unions.
- `PipelineReportScreen.tsx`, `SalesReportScreen.tsx` — add the option, a
  `brandId` drill key; the trade-in row drills with `tradeInsOnly`.
- `services/opportunities.ts`, `DemoApp.tsx`,
  `OpportunityPipelineScreen.tsx` — carry `tradeInsOnly` → `has_trade_in`.
- `PipelineReportScreen.tsx` — every drill adds the ACTIVE `statusId`
  (looked up like `SalesReportScreen`'s `wonStatusId`); tiles merged.
- `SalesReportScreen.tsx` — every drill adds `closedFrom`/`closedTo` from
  the selected period; banner reads "`<name>`, Won, This Quarter".
- `ProductPerformanceReportScreen.tsx` — label "All Opportunities".
- `InsightsDashboardScreen.tsx` — tiles merged; add the option (that card has no
  drill-down today; not adding one).
- Drill plumbing already exists: `DemoApp.tsx`'s `pipelineInitialFilter`
  carries `brandId`, `OpportunityPipelineScreen` passes `brand_id`, and
  `opportunity/repository.py` filters on it (built for Product
  Performance's brand drill-down).

## Known consequence (not a bug)

Brand drill-down uses the same "deal has at least one line of this brand"
filter as Product Performance, so the drilled list shows the whole deal
while the bar shows only that brand's share of its value.
