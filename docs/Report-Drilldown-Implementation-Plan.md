# Report Drill-down (Feature 11.2) — Implementation Plan

**Status:** Built and live-verified, 2026-09-15. **Feature:** 11.2, Module 5 → PRD 5.9
Drill-down Reporting. Builds on and generalizes
`docs/Pipeline-Product-Filter-And-Report-Drilldown-Implementation-Plan.md`
(2026-09-15, approved but never built — scoped only to Product
Performance's Won/Lost cards, written before the standalone Sales Report
and Pipeline Report existed). This plan reuses that exact mechanism and
extends it across every report screen that actually needs it.

## What this is (plain terms)

PRD 5.9 asks for click-through drill-down: Zone → Team → Individual.
Checked every report screen against that ask before scoping this plan:

- **Daily Activity Report, Stagnant Deals, Opportunities On Hold** are
  already flat lists — each row *is* one deal, and clicking a row already
  opens it. There's nothing to drill down *into* here; they're already at
  the bottom of the hierarchy. **No changes needed.**
- **Pipeline Report, Sales Report, Product Performance Report** each show
  bars or cards that sum many deals into one number (e.g. "North Kerala —
  ₹42L"), with no way today to see which deals make up that number. These
  three are what this plan builds.

**Design decisions, Basheer, 2026-09-15:**
- All three summary-style screens get drill-down, not just Product
  Performance.
- "Team" in Zone → Team → Individual means **a manager's direct reports**
  — matches how every other scoping in the app already works
  (`TEAM_SCOPE_BUILDERS`), no new grouping concept needed.
- Drill-down means exactly this and nothing more: **click a bar/card →
  see the Opportunities that make up that number.** No aggregate-only
  leaf view, no separate "both" mode.

## Mechanism: reuse the existing Pipeline board, not a new screen

Every drill-down lands on the existing Pipeline board's **List view**,
carrying a one-shot pre-filter — the same pattern already shipped for the
reminders-banner → Next Actions handoff (`nextActionsInitialDueBefore` in
`DemoApp.tsx` ~line 193, consumed via a `useEffect` in the target screen
that seeds local filter state once). No permanent new filter dropdown is
added to the Kanban/List board's own filter bar — that stays a deliberate
no, per the 2026-09-14 decision that Product filtering belongs off the
board itself.

Checked `list_pipeline`/`count_pipeline`
(`backend/app/domains/opportunity/repository.py` line 75) against every
dimension the three report screens break down by:

| Report breakdown | Maps to filter | Status |
| --- | --- | --- |
| Rep | `owner_id` | Already exists |
| Zone | `zone_id` | Already exists (zone-closure aware) |
| Stage | `stage_id` | Already exists |
| Won/Lost (Sales Report, Product Performance) | `status_id` | Already exists |
| SBU | `sbu_id` | **Needs adding** — trivial, `Opportunity.sbu_id` is a direct column, no join |
| Product | `product_id` | **Needs adding** — needs an `EXISTS` subquery (already fully designed in the shelved plan) since a plain join would duplicate a multi-product opportunity |

So the backend gap is exactly two filters, both already scoped in detail
by the shelved plan for `product_id`; `sbu_id` is new but simpler.

## Backend

1. **`backend/app/domains/opportunity/repository.py`** — `list_pipeline`
   (line 75) and `count_pipeline` (line 141) each gain:
   - `sbu_id: uuid.UUID | None = None` → `stmt.where(Opportunity.sbu_id ==
     sbu_id)` when passed, same style as the existing `stage_id`/`status_id`
     branches.
   - `product_id: uuid.UUID | None = None` → applied only when passed
     (unfiltered path stays exactly as cheap as today), using
     `Opportunity.id.in_(select(OpportunityItem.opportunity_id).where(
     OpportunityItem.product_id == product_id))` — an `EXISTS`-style
     subquery, not a join, so an opportunity with two line items (one
     matching, one not) is still returned exactly once.
2. **`backend/app/domains/opportunity/service.py`** — `list_pipeline`
   forwards both new params straight through, same pattern as every
   other filter here.
3. **`backend/app/domains/opportunity/router.py`** — `list_pipeline`
   (line 55) gains `sbu_id: uuid.UUID | None = Query(None)` and
   `product_id: uuid.UUID | None = Query(None)`, passed through to the
   service call. Same for the count endpoint if it takes filters
   independently.
4. **`sales-os-app/src/services/opportunities.ts`** — `PipelineParams`
   gains `sbu_id?: string` and `product_id?: string`, added to
   `listPipeline`'s query-param assembly, same pattern as `zone_id`.
5. **Tests** (`backend/tests/domains/opportunity/`): `sbu_id` — matching
   included, non-matching excluded (mirrors the existing `owner_id` test).
   `product_id` — matching included, non-matching excluded, and a
   two-item opportunity (one matching product, one not) returned exactly
   once — this last case is specifically what the `EXISTS` approach
   exists to protect against, and needs its own test.

## Frontend

1. **`sales-os-app/src/components/ReportingUI.tsx`** — `MiniBar` gains an
   optional `onClick?: () => void` prop. When present, the row renders
   with a pointer cursor and a subtle hover background — the only visual
   change; the bar itself doesn't move or resize.
2. **`sales-os-app/src/DemoApp.tsx`** — new state,
   `pipelineInitialFilter: { ownerId?: string; zoneId?: string; sbuId?:
   string; productId?: string; statusId?: string; stageCode?: string;
   label: string } | undefined`, mirroring `nextActionsInitialDueBefore`.
   A `handleDrillToPipeline(filter, label)` helper sets this state,
   switches `pipelineViewMode` to `"list"` (a filtered table reads better
   than a filtered Kanban board here), and calls `navigate("pipeline")`.
3. **`sales-os-app/src/screens/OpportunityPipelineScreen.tsx`** — accepts
   an optional `initialFilter` prop (the shape above). A `useEffect`
   seeds `ownerFilter`/`zoneFilter` from it once (existing state), and
   folds `sbuId`/`productId`/`statusId` directly into the `listPipeline`
   query call alongside whatever Owner/Zone state already holds. A
   `stageCode` target just switches the active stage tab (`activeStageCode`
   already exists as UI state — no need for a parallel stage filter param
   here, since Kanban/List are already stage-organized). Renders a small
   dismissible banner above the filter bar — "Showing: `<label>`" with a
   "Clear filter" action — clearing it resets `pipelineInitialFilter` in
   `DemoApp.tsx` and falls back to plain Owner/Zone state.
4. **`sales-os-app/src/screens/PipelineReportScreen.tsx`** — each
   `MiniBar` row's `onClick` maps the current `groupBy` to the right
   filter key (`rep`→`ownerId`, `zone`→`zoneId`, `sbu`→`sbuId`,
   `product`→`productId`, `stage`→`stageCode`) and calls
   `handleDrillToPipeline` (passed down as a new prop from `DemoApp.tsx`).
   The synthetic **"Trade-Ins / Returns" row stays non-clickable** — its
   `group_id` (`"trade-in"`) isn't a real product, and no single
   `product_id` represents the mix of Buyback line items it aggregates.
5. **`sales-os-app/src/screens/SalesReportScreen.tsx`** — same wiring,
   but every drill always includes the Won `status_id` (fetched once via
   the existing `listStatuses()` + `status_code === "WON"` lookup pattern
   already used elsewhere, e.g. `Customer360Screen.tsx`), so the drill
   lands on exactly the Won deals the report itself is counting — no
   "Stage" dimension here since Sales Report doesn't have one.
6. **`sales-os-app/src/screens/ProductPerformanceReportScreen.tsx`** —
   the Won/Lost `Metric` values under a **Product** or **SBU** card
   become clickable (`product_id`/`sbu_id` + the relevant Won/Lost
   `status_id`). **Brand-grouped cards stay non-clickable** — a brand
   (`product.oem_name`) spans many products, no single `product_id`
   represents it, same exclusion the shelved plan already made.

## Out of scope

- **Brand-level drill-down** — would need a new `oem_name`/brand filter
  dimension on `list_pipeline`, not built anywhere today. Flag as a
  follow-on if wanted later.
- **Stagnant Deals / Opportunities On Hold / Daily Activity Report** —
  already flat, already click-through to the individual opportunity.
- **Any permanent new filter dropdown on the Kanban/List board's own
  filter bar** — stays a one-shot pre-filter + dismissible banner,
  matching the 2026-09-14 decision on where Product/SBU filtering
  belongs.

## Sequencing

Backend (repository → service → router → tests) → `MiniBar` `onClick`
support → `DemoApp.tsx` state/handler → `OpportunityPipelineScreen`
pre-filter consumption + banner → wire up Pipeline Report, then Sales
Report, then Product Performance Report, verifying each screen's
drill-through live before moving to the next.
