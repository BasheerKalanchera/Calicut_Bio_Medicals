# Pipeline Product Filter + Product Performance Drill-down — Implementation Plan

**Status:** Approved, ready to build. **Features:** 2.2's Pipeline product
filter (Module 3 → PRD 3.8, `docs/Backlog.md`'s "Account Directory / Pipeline
filters" entry, decided 2026-09-14) and 11.2 Drill-down Reporting (Module 5 →
PRD 5.9), scoped down to its first concrete case: Product Performance Report.
Pulled forward from next week's "Sales Report + Pipeline Report" item onto
this week's Sprint Plan, on Basheer's call, 2026-09-15 — same underlying
capability serves both, no point building it twice on two different weeks.

**No file overlap with the in-flight High Priority Deal Flag build** —
checked directly against that work's diff (`models.py`/`schemas.py`/
`service.py`'s `create_opportunity`, `PipelineOpportunity.is_high_priority`):
this plan only touches `list_pipeline`/`count_pipeline` and the router query
params, none of which that work modifies.

## What this is (plain terms)

Today, `ProductPerformanceReportScreen` shows cards like "Product X — 8 Won,
4 Lost" with no way to see which 8 deals those are — the numbers are a dead
end. Separately, the Pipeline board can already be filtered by Owner and
Zone, but not by Product; per the 2026-09-14 decision, a Product filter will
not be added as a dropdown on the Kanban board itself — it belongs on a
future standalone Pipeline Report instead, so the two won/lost lists sitting
behind a Product Performance card aren't duplicated as a separate filter UI.

This plan builds the one shared piece both of those need: teaching the
existing opportunity-list engine (the same one behind the Kanban/List views)
to filter by product. Then Product Performance's "Won"/"Lost" numbers become
clickable, landing on the existing Pipeline List view pre-filtered to that
product and status — with no new filter dropdown added to the board itself,
just a dismissible "Showing: <Product>, Won" banner, the same pattern already
used for the Next Actions screen's "due today" pre-filter from the reminders
banner.

## Out of scope for this plan

- **Kanban/List filter bar UI** — no Product dropdown is added next to the
  existing Owner/Zone selects. That stays a deliberate no per the 2026-09-14
  decision.
- **Brand-level drill-down** — Product Performance's "By Brand" grouping
  doesn't map to a single `product_id` (a brand spans many products), so its
  cards stay non-clickable for now. Flag as a follow-on if wanted.
- **The standalone Pipeline Report itself** — still next week's item; this
  plan only builds the filter capability it will also depend on, not the
  report screen.
- **Drill-down for Stagnant Deals / Opportunities On Hold** — those report
  rows are already close to record-level (worth checking separately whether
  they already link to the opportunity, or need their own small follow-on).

## Backend

1. **`backend/app/domains/opportunity/repository.py`** — `list_pipeline`
   (~line 69) and `count_pipeline` (~line 118) gain a `product_id:
   uuid.UUID | None = None` parameter. **Cannot be a plain join** like
   `zone_id`'s account join: an opportunity can have multiple
   `OpportunityItem` rows, so joining `OpportunityItem` directly would
   duplicate the parent `Opportunity` row once per matching line item. Use
   an `EXISTS`/`.in_(select(...))` subquery instead — `Opportunity.id.in_(
   select(OpportunityItem.opportunity_id).where(OpportunityItem.product_id
   == product_id))` — applied only when `product_id` is passed, so the
   unfiltered path stays exactly as cheap as today, matching the existing
   comment style on the `zone_id` branch.
2. **`backend/app/domains/opportunity/service.py`** — `list_pipeline`
   (~line 45) forwards the new `product_id` straight through to the
   repository, same pattern as every other filter param here.
3. **`backend/app/domains/opportunity/router.py`** — `list_pipeline`
   (~line 55) gains `product_id: uuid.UUID | None = Query(None)`, passed
   through to the service call.
4. **`sales-os-app/src/services/opportunities.ts`** — `PipelineParams`
   gains `product_id?: string`, added to `listPipeline`'s query-param
   assembly (~line 31), same pattern as `zone_id`.
5. **Tests** (`backend/tests/domains/opportunity/`): a deal with a matching
   `OpportunityItem.product_id` is included; a deal with only a *different*
   product is excluded; a deal with two items (one matching, one not) is
   returned exactly once, not duplicated — this last case is the one the
   `EXISTS` approach exists to protect against, so it needs its own test.

## Frontend

1. **`sales-os-app/src/DemoApp.tsx`** — add a small piece of app-level
   state to carry the drill-down target across screens, mirroring the
   existing `nextActionsInitialDueBefore` pattern (~line 189): e.g.
   `pipelineInitialFilter: { productId: string; productName: string;
   statusId?: string; statusLabel?: string } | undefined`. Set it when a
   Product Performance metric is clicked, pass it into
   `OpportunityPipelineScreen`, and clear it the same way
   `nextActionsInitialDueBefore` is consumed-then-reset today so a later
   plain visit to Pipeline doesn't stay stuck filtered.
2. **`sales-os-app/src/screens/OpportunityPipelineScreen.tsx`**:
   - Accept an optional `initialFilter` prop (the shape above). When
     present, merge `product_id` (and `status_id`, if a status was also
     clicked) into the `listPipeline` call (~line 238) alongside whatever
     Owner/Zone state already holds.
   - Switch `pipelineViewMode` to `"list"` when arriving with an
     `initialFilter` — a filtered table reads better than a filtered
     Kanban board here.
   - Render a small dismissible banner above the existing filter bar —
     "Showing: <Product Name>, Won" with a "Clear filter" action — instead
     of adding Product as a third dropdown next to Owner/Zone. Clearing it
     resets `pipelineInitialFilter` in `DemoApp.tsx` and falls back to the
     screen's normal Owner/Zone state.
3. **`sales-os-app/src/screens/ProductPerformanceReportScreen.tsx`**:
   - The `Metric` component (~line 15) for "Won" and "Lost" (and
     optionally "Opportunities" for the unfiltered-by-status full list)
     becomes clickable when `groupBy === "product"` (per the brand
     exclusion above), calling a new `onDrillDown(row, status)` prop wired
     up in `DemoApp.tsx` to navigate to Pipeline with the state from step 1.
   - No visible change for `groupBy === "brand"`/`"sbu"` metrics beyond
     `"sbu"` optionally reusing the *existing* `zone_id`-adjacent `sbu`
     scoping already available server-side — worth a quick look, but not
     required for this plan to ship.

## Sequencing

Backend-only, additive, no migration, no schema field, no touch to any file
currently in flight for the High Priority build. Directly unblocks next
week's Pipeline Report (reuses the same `product_id` filter) instead of that
report needing to invent its own filtering path later.
