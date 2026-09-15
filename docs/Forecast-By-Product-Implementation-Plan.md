# Forecast Broken Down by Product — Implementation Plan

**Status:** Built, unit-tested, and manually E2E-verified live, 2026-09-15 —
`docs/Forecast-By-Product-Manual-E2E-Test-Plan.md`'s full pass, across
Admin/GM (Haroon), Area Manager (Nishad K V), and Sales Staff (Vivek). Two
real bugs were caught and fixed live during that pass — see "Bugs found and
fixed" below, both since re-verified. **Feature:** 2.5, Module 5 → PRD 5.1 Forecasting (product half only —
the month/quarter half is separately blocked on Target Management, per
`docs/Phase1-Completion-Sprint-Plan.md`'s next-week item 2). Picked as this
week's lowest-effort remaining item: the aggregation engine behind the
Insights Dashboard's Pipeline/Forecast tile already computes value from each
deal's line items, it just never offered Product as a breakdown dimension
alongside Stage/Rep/SBU/Zone.

**No file overlap with the in-flight High Priority Deal Flag build** —
checked directly against that work's diff (`opportunity/models.py`,
`schemas.py`, `service.py`, its migration and tests). This work is entirely
in the `reporting` domain, a different module untouched by that build.

## What this is (plain terms)

The Insights Dashboard already has a dropdown that reslices the pipeline
value / forecast numbers by Stage, Rep, SBU, or Zone. This adds "Product" as
a fifth option in that same dropdown — so a manager can see, for example,
"₹40L forecast tied to Product X, ₹15L to Product Y" instead of only seeing
totals sliced by who owns the deal or what stage it's in.

## The design decision worth recording (revised live during testing)

Buyback line items (trade-ins/returns netted against a sale, BR-FIN-03) carry
no `product_id` — the schema requires a free-text description instead. The
first build joined `Product` with a plain INNER JOIN when `group_by ==
"product"`, dropping Buyback lines from that breakdown entirely — mirroring
`ProductPerformanceReportScreen`'s existing precedent. **Basheer caught,
live testing, that this meant the Product view's rows didn't add back up to
the page's own headline total** (₹526.1L summed across product bars vs. the
true ₹514.6L) — a real, visible discrepancy, not just an internal
inconsistency. Revised to an **OUTER JOIN** instead, with a `coalesce(...)`
that buckets any Buyback line (`product_id IS NULL`) under a synthetic
**"Trade-Ins / Returns"** row (same "no natural id" idea as
`product_performance`'s brand grouping, which already coalesces to
"UNSPECIFIED"). The by-product rows now reconcile exactly to the same total
every other breakdown already produces.

## What was built

1. **`backend/app/domains/reporting/schemas.py`**:
   - `PipelineGroupBy` widened from `Literal["stage", "rep", "sbu", "zone"]`
     to include `"product"`.
   - `PipelineSummaryRow.group_id` widened from `uuid.UUID` to `str` — needed
     once "Trade-Ins / Returns" (a synthetic bucket, no real row) became a
     possible value; same reasoning as `ProductPerformanceRow.group_id`.
2. **`backend/app/domains/reporting/repository.py`**:
   - `_GROUP_BY_COLUMNS`'s four existing entries now `cast(..., String)`
     their id column (was a live bug, see below), plus two module constants,
     `_TRADE_IN_GROUP_ID`/`_TRADE_IN_GROUP_NAME`.
   - `pipeline_summary`'s `group_by == "product"` branch builds its
     `group_id`/`group_name` via `coalesce(cast(Product.id, String),
     "trade-in")` / `coalesce(Product.name, "Trade-Ins / Returns")`, and
     `outerjoin`s `Product` (not `join`) only for that branch — every other
     breakdown's SQL is otherwise byte-for-byte unchanged, verified by a test
     asserting no `Product` join appears for `group_by="stage"`.
3. **`backend/tests/domains/reporting/test_reporting_repository.py`** — four
   tests in `TestPipelineSummary` covering: grouping by product joins
   `Product` and groups on `product.name`; the join is OUTER not INNER;
   the coalesce literals for the Trade-Ins bucket are present; grouping by
   stage still doesn't join `Product` at all.
4. **`sales-os-app/src/types/reporting.ts`** — `PipelineGroupBy` widened to
   match (hand-maintained file, not the generated `types/api.ts`).
5. **`sales-os-app/src/screens/InsightsDashboardScreen.tsx`**:
   - `GROUP_BY_OPTIONS` gained `{ value: "product", label: "Product" }`.
   - A second query, `headlineQuery`, fixed to `group_by: "stage"`
     regardless of the dropdown, now feeds the three top `StatTile`s (see
     "Bugs found and fixed" below) — shares its cache with `pipelineQuery`
     when Stage is the selected breakdown, so no duplicate request in the
     common case.
   - Each `MiniBar` row now also passes `secondaryValue={weighted_forecast_lakhs}`
     — a Basheer follow-on request once live testing showed the per-row list
     only ever surfaced one figure (pipeline value) despite the API already
     returning the weighted forecast per row too.
   - `LoadingOrEmpty`'s `emptyText` is now role-aware: "You don't own any
     open deals yet." for a self-scoped viewer (Sales Staff) vs. the
     original "No open pipeline." for manager-tier roles — Vivek's live test
     surfaced a real deal existing (visible to him on the Pipeline board)
     while his own Insights view correctly showed zero, and the generic
     copy read as a contradiction rather than "this is scoped to you."
6. **`sales-os-app/src/components/ReportingUI.tsx`** — `MiniBar` gained
   optional `secondaryValue`/`secondaryLabel` props, rendered as a smaller
   second line under the primary figure. Shared by all five breakdowns, not
   Product-specific.

**Router unchanged** — `GET /reporting/pipeline-summary`'s `group_by: Query`
param is typed directly as `PipelineGroupBy`, so it picked up the new value
automatically.

## Bugs found and fixed during manual E2E (2026-09-15)

1. **Headline totals double-counted once "Product" was selectable.** The
   three top `StatTile`s (and the "N open deals" count) were derived by
   summing whatever rows `pipelineQuery` currently held — safe for
   Stage/Rep/SBU/Zone (1:1 with `Opportunity`) but wrong for Product (1:many
   via `OpportunityItem`): a deal with 2 different products got counted
   twice. Live symptom: 37→44 open deals, ₹514.6L→₹526.1L, purely from
   switching the dropdown, no data changed. Fixed by the `headlineQuery`
   decoupling in item 5 above — the headline no longer depends on which
   breakdown is selected.
2. **Widening `group_id` to `str` broke every other breakdown, not just
   Product.** The four pre-existing `_GROUP_BY_COLUMNS` entries returned raw
   UUID objects from the database; Pydantic's `str` field rejects a UUID
   object outright (doesn't auto-stringify it), so Stage/Rep/SBU/Zone all
   started 500ing the instant `group_id` became `str`-typed — caught
   immediately live (backend console traceback), fixed by casting all four
   id columns to `String` in SQL, not just Product's.

Both fixes verified against real Dev data (not just mocked-DB unit tests,
which never exercise actual Pydantic serialization): all five breakdowns'
values now sum to the identical ₹514.6L, and Stage/Rep/SBU/Zone's deal
counts all correctly total 37 while Product's per-row counts (not
summed anywhere in the UI) legitimately exceed that for multi-product deals.

## Verified

- Full backend suite: 813/813 passing (grew by 2 as the reconciliation/
  outer-join tests were added).
- `ruff check` clean on every file actually touched (pre-existing `B008`
  findings elsewhere in `reporting/router.py` are unrelated, not introduced
  by this change).
- Frontend `tsc --noEmit` clean.
- Manual E2E: full pass, `docs/Forecast-By-Product-Manual-E2E-Test-Plan.md`
  Groups A-E, across Haroon (Admin/GM), Nishad K V (Area Manager), and
  Vivek (Sales Staff, zero-deals edge case).

## Out of scope for this plan

- **Month/quarter forecast breakdown** — separate half of Feature 2.5,
  blocked on Target Management (next week per the Sprint Plan).
- **Product Performance drill-down / Pipeline product filter** — a related
  but separate piece of work, planned in
  `docs/Pipeline-Product-Filter-And-Report-Drilldown-Implementation-Plan.md`.
  That plan touches the *opportunity* domain's `list_pipeline`; this one
  touches the *reporting* domain's `pipeline_summary` — different queries,
  no shared code, despite both being "product" filters conceptually.
