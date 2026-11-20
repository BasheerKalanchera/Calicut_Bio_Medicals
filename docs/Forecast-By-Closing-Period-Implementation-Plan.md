# Forecast by Closing Period — Implementation Plan

**Status:** Draft, 2026-10-04.
**Traceability rows:** Row 2.5 ("Weighted/unweighted forecasting by month/quarter/product; <3x-target low-pipeline alert" — month/quarter half)
**Design / discussion:** `docs/Discussion-Forecast-By-Closing-Period-2026-09.md` (decided 2026-10-01 by Basheer, except Q4)

## Decisions

Every choice this plan depends on, one line each. Choices decided on 2026-10-01 in `Discussion-Forecast-By-Closing-Period-2026-09.md` are referenced; choices framed for this implementation end in `— proposed` until confirmed.

- Filter locations (Q1): Connect a common period filter to the Insights Dashboard, Pipeline Report (with drill-down click-through), and Product Performance; other screens follow later — Basheer, 2026-10-01
- Period filter options (Q2 & Q3): Single "Expected by" selector supporting quick FY quarter/month picks (This Month, This Quarter, Next Quarter, Until FY End 31 Mar, All Time) plus Custom Date Range — Basheer, 2026-10-01
- Passed closing dates (Q5 / BR-OP-16): Overdue open deals whose Expected Closure Date has passed are counted in the active period as due now, and flagged with a "Closing date passed" warning badge — Basheer, 2026-10-01
- Machine/item units (Q6): In Product and Brand breakdowns, compute and display machine units (`total_units` and estimated `weighted_units` from `OpportunityItem.quantity`) alongside financial values — Basheer, 2026-10-01
- Drill-down sorting (Q7): Clicking through to the Opportunity drill-down list sorts deals with highest win probability first ("most solid"), then earliest Expected Closure Date — Basheer, 2026-10-01
- Metric terminology (Q8): Forecast values are explicitly labeled "Expected orders by Expected Closure Date" to distinguish expected won deals from cash collections — Basheer, 2026-10-01
- Deals with no closing date (Q4 resolution): When a specific date filter is active, exclude deals lacking an Expected Closure Date from the date-bounded total, but display an explicit summary card/badge ("X deals, ₹Y L without closing date") with direct click-through so no pipeline is silently dropped — proposed
- Backend filter parameters: Use standard `period_start` and `period_end` query parameters matching the existing `sales-summary` pattern, evaluated against `Opportunity.expected_closure_date` — proposed
- Period calculation utility: Reuse `getFiscalQuarterBounds()` and Indian FY calendar definitions (`YYYY-Qn`, April–March) from `src/utils/formatter.ts` across all frontend period controls — proposed

## 1. In plain terms

Cabio leadership (Latheef Bhai and Haroon) needs to project incoming business across specific time horizons to support two operational decisions:
1. **Cash Flow Planning:** Viewing total and weighted expected orders by a specific milestone (e.g. this month, this quarter, next 6 months, or fiscal year end), and drilling down to see which high-probability deals are solid.
2. **Purchase Order Planning:** Knowing which specific equipment models and how many machine units are expected to sell over the coming quarter or six months, so Cabio can place accurate bulk orders with vendors like SonoScape and EDAN.

Currently, the Pipeline Report and Insights Dashboard display all open deals regardless of timeline. This feature adds an "Expected by" period filter to the pipeline. When a period is selected (e.g. "2026-Q3" or "Until 31 Mar"), all totals, weighted forecasts, and breakdowns (by Stage, Rep, Zone, SBU, Product, and Brand) recalculate immediately. In product breakdowns, machine quantities (total and weighted units) appear alongside revenue figures. Clicking any row opens the exact underlying deals, pre-sorted with the highest-probability, soonest-closing deals at the top.

## 2. Build order

### Step 1: Backend Pipeline Summary Query Extension
- Update `backend/app/domains/reporting/router.py`:
  - Extend `get_pipeline_summary` with `period_start: date | None = None` and `period_end: date | None = None`.
- Update `backend/app/domains/reporting/repository.py`:
  - In `pipeline_summary`:
    - Add unit aggregations: sum of `OpportunityItem.quantity` (for `SALE` line types) as `total_units`, and `quantity * Opportunity.win_probability / 100` as `weighted_units`.
    - Apply `expected_closure_date` filtering:
      - When `period_start` / `period_end` are supplied, filter where `Opportunity.expected_closure_date >= period_start` and `Opportunity.expected_closure_date <= period_end`.
      - Enforce BR-OP-16: If `period_start <= current_date`, include open deals where `Opportunity.expected_closure_date < current_date` (overdue closing dates count as due now).
    - Query count and value of open deals where `expected_closure_date IS NULL` so they can be surfaced in the response without distorting date-bounded numbers.
- Update `backend/app/domains/reporting/schemas.py`:
  - Add `total_units: int = 0` and `weighted_units: Decimal = Decimal("0.00")` to `PipelineSummaryRow`.
  - Add `no_closure_date_count: int = 0` and `no_closure_date_value_lakhs: Decimal = Decimal("0.00")` to `PipelineSummaryResponse`.
- Add/update pytest tests in `backend/tests/domains/reporting/test_reporting_service.py` verifying date bounds, BR-OP-16 overdue inclusion, and unit sums.
- *Checkpoint commit:* `feat(backend): add date range and unit metrics to pipeline summary reporting`

### Step 2: Frontend Types & Period Utilities
- Update `sales-os-app/src/types/reporting.ts`:
  - Add `total_units` and `weighted_units` to `PipelineSummaryRow`.
  - Add `no_closure_date_count` and `no_closure_date_value_lakhs` to `PipelineSummaryResponse`.
- In `sales-os-app/src/utils/formatter.ts`:
  - Add helper `getForecastPeriodBounds(periodKey: string)` returning ISO start/end date strings for:
    - `"month"`: Current calendar month start to end.
    - `"this_quarter"`: Current FY quarter (e.g. 2026-Q3).
    - `"next_quarter"`: Upcoming FY quarter (e.g. 2026-Q4).
    - `"fy_end"`: Today through March 31 of current Indian FY.
    - `"all"`: Unbounded (null / null).
- *Checkpoint commit:* `feat(frontend): add forecast period calculation utilities and reporting types`

### Step 3: Pipeline Report Screen Enhancement
- Update `sales-os-app/src/screens/PipelineReportScreen.tsx`:
  - Add the "Expected by" period selector dropdown in the filter bar with options:
    - `All Open Deals`
    - `This Month`
    - `This Quarter (YYYY-Qn)`
    - `Next Quarter (YYYY-Qn)`
    - `Until FY End (31 Mar)`
    - `Custom Range...` (revealing start/end date inputs).
  - Pass the active `period_start` and `period_end` into both `headlineQuery` and `breakdownQuery`.
  - Update headline stat card label: `"Expected orders by Expected Closure Date"`.
  - In `Product` and `Brand` breakdown rows, display units (`total_units` and `≈ weighted_units`) alongside revenue.
  - If date filtering is active and `no_closure_date_count > 0`, render an informational alert tile:
    - `"⚠️ X open deals (₹Y L) have no Expected Closure Date and are excluded from this period view."` with a click-through button to view them.
  - Pass `closureFrom` and `closureTo` (plus `noClosureDateOnly` if clicked from the warning tile) into `onDrillToPipeline`.
- *Checkpoint commit:* `feat(frontend): add period selector, units display, and date drill-down to Pipeline Report`

### Step 4: Opportunity Pipeline Drill-Down & Sorting
- Update `sales-os-app/src/screens/OpportunityPipelineScreen.tsx`:
  - Accept `closureFrom?: string`, `closureTo?: string`, and `noClosureDateOnly?: boolean` in incoming drill filters.
  - Filter deal cards/rows according to the date parameters.
  - Implement Q7 sorting rule: when drilled from a forecast period, sort deals by `win_probability DESC, expected_closure_date ASC`.
  - Display the BR-OP-16 "Closing date passed" chip on deals whose `expected_closure_date < today`.
- *Checkpoint commit:* `feat(frontend): apply forecast period filtering, overdue badge, and probability sorting to pipeline drill`

### Step 5: Insights Dashboard Integration
- Update `sales-os-app/src/screens/InsightsDashboardScreen.tsx`:
  - Add the "Expected by" period selector to the Pipeline section header.
  - Pass period bounds into `pipelineQuery` and `headlineQuery`.
  - Update tile labels to `"Expected orders by Expected Closure Date"`.
  - Add a direct link button `"Open Full Forecast Report →"` navigating to `PipelineReportScreen` with the selected period pre-applied.
- *Checkpoint commit:* `feat(frontend): connect period forecast filter to Insights Dashboard`

### Step 6: Testing & Quality Verification
- Run backend pytest: `pytest backend/tests/domains/reporting/`.
- Run frontend type check and linter: `npx tsc --noEmit` and `npm run lint`.
- Execute manual E2E test pass covering:
  1. Period switching (This Quarter vs Next Quarter vs Until FY End) on Pipeline Report.
  2. Reconciling product/brand units with line-item quantities.
  3. Clicking a product bar to verify drilled deals match the period and are sorted highest probability first.
  4. Verifying overdue deals carry the BR-OP-16 badge and are included in current period.
  5. Verifying deals with no date are flagged in the alert card rather than silently lost.

## 3. Not in this plan (with reasons)

- **Making Expected Closure Date mandatory across all early stages:**
  - *Reason:* Addressed by leadership data-cleansing policy (`scripts/uat_closure_date_report.py`) rather than hard code blocks, per Basheer's decision on 2026-10-01 ("patience over enforcement").
- **Cash collection / payment instalment forecasting:**
  - *Reason:* A closing date represents when an order is won, not when payment instalments are received. Payment tracking belongs to the Payment Confirmation Gate and accounts receivable modules.
- **Split-shared revenue breakdown by period:**
  - *Reason:* Split credit allocation rules remain an open discussion with Haroon; pipeline reports attribute strictly by deal owner.
- **Low-pipeline alert (<3x target):**
  - *Reason:* The other half of Traceability row 2.5; will be addressed as a dedicated dashboard alert widget once Target vs Actuals tracking is completed.

## 4. Business rules and records to update

- **`docs/Business-Rules.md`:** Reference BR-OP-16 (Closing Date Passed) application in reporting queries.
- **`docs/Frontend-Implementation-Standards.md`:** Update §6.9 "Common Opportunity Filtering" with the standard period selector pattern.
- **`docs/Signed-Requirements-to-PRD-Traceability.md`:** Move Row 2.5 status from `Partial` to `Done` once verified.
- **`docs/UI-Inventory.md`:** Document the period filter addition to Pipeline Report and Insights Dashboard.

## 5. Technical addendum

### Endpoint schema changes:
```python
# GET /reporting/pipeline-summary
Query Parameters:
  group_by: "stage" | "rep" | "sbu" | "zone" | "product" | "brand"
  sbu_id?: UUID
  zone_id?: UUID
  user_id?: UUID
  period_start?: date  # Inclusive start of Expected Closure Date
  period_end?: date    # Inclusive end of Expected Closure Date

Response Data:
  group_by: str
  no_closure_date_count: int
  no_closure_date_value_lakhs: Decimal
  rows: list[{
    group_id: str,
    group_name: str,
    opportunity_count: int,
    total_value_lakhs: Decimal,
    unweighted_forecast_lakhs: Decimal,
    weighted_forecast_lakhs: Decimal,
    total_units: int,
    weighted_units: Decimal,
    depth?: int,
    zone_exact?: bool
  }]
```

### Key SQL logic for BR-OP-16 and Date Bounds:
```sql
-- When period_start and period_end are provided:
WHERE OpportunityStatus.status_code = 'ACTIVE'
  AND (
    -- Normal in-range closing date
    (Opportunity.expected_closure_date >= :period_start AND Opportunity.expected_closure_date <= :period_end)
    OR
    -- BR-OP-16: If selected period covers current date, include past-due open deals
    (:period_start <= CURRENT_DATE AND Opportunity.expected_closure_date < CURRENT_DATE)
  )
```
