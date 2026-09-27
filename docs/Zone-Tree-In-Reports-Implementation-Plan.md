# Zone Tree in Reports — Implementation Plan

**Status:** Approved 2026-09-27 (Basheer); building.

## What this is (plain terms)

Today a report's Zone view lists each zone as a flat bar, counting only the
hospitals tagged with *exactly* that zone. "North Kerala" therefore leaves
out every deal in Malappuram, Kannur and the other districts inside it —
while clicking that bar opens a list that *does* include them. The bar
and its list disagree, and the bar understates the region.

After this change the Zone view is a tree, always fully shown, starting
from the top of the hierarchy:

```
Kerala                      48 deals   ₹507.0L
   North Kerala             35 deals   ₹300.0L
      Malappuram            12 deals   ₹ 90.0L
      Kannur                 8 deals   ₹ 60.0L
      North Kerala (not in a sub-zone)   2 deals ₹10.0L
   South Kerala             …
Karnataka                   …
   Bangalore                …
      Zone 1                …
```

(Numbers illustrative only.)

- Each row's count and amount **include everything beneath it**.
- If some hospitals are tagged directly to a zone that has sub-zones
  (e.g. to "North Kerala" rather than a district), they get their own
  "`<zone>` (not in a sub-zone)" line, so the lines under a parent always
  add up to the parent. The line appears only when such hospitals exist
  *and* the zone also has sub-zones with deals — if all of a zone's deals
  are tagged to it directly (Bangalore on Dev today), the line would only
  repeat the parent, so it's left out. One general rule, no zone named in
  code; the line appears by itself once a sub-zone gets a deal. *(Basheer
  confirmed, 2026-09-27, along with the "(not in a sub-zone)" wording.)*
- Only zones that actually have deals (and the zones above them) are shown.
- The top rows (Kerala, Karnataka) add up to the report's headline total.
- Clicking any row opens that zone and everything inside it — which is
  what the deal list already does, so bar and list now match. Clicking a
  "not in a sub-zone" line opens just those hospitals' deals.

**Applies everywhere Zone is offered:** Pipeline Report, Sales Report, and
the Insights Dashboard's "Pipeline by…" card (the Dashboard card has no
click-through today; not adding one).

Decisions (Basheer, 2026-09-27): start from the top (Kerala, Karnataka);
always show the full tree; "not in a sub-zone" lines so levels roll up;
all three places.

## Changes

**Backend**
- `reporting/repository.py` — `pipeline_summary` / `sales_summary` with
  `group_by="zone"` keep grouping on the account's own zone (each deal
  belongs to one zone, so nothing is double-counted); the tree is built in
  the service.
- `reporting/service.py` — new `_zone_tree_rows()`: loads the zone tree
  (`zone.parent_zone_id`), rolls each exact-zone row up to every ancestor
  (counts, value, weighted / revenue, won count), adds a "(not in a
  sub-zone)" row where a parent has hospitals tagged directly to it, drops
  zones with no deals, and returns rows in tree order (siblings in the same
  order as today — alphabetical).
- `reporting/schemas.py` — `PipelineSummaryRow` / `SalesSummaryRow` gain
  optional `depth: int` and `zone_exact: bool` (true only on the "not in a
  sub-zone" lines). Other breakdowns leave them unset — response shape
  otherwise unchanged.
- Opportunity list/count gain `zone_exact: bool` — filters on the
  account's own zone only, for the "not in a sub-zone" click. Normal zone
  filtering (zone + everything inside) is unchanged.
- Tests: roll-up sums, "not in a sub-zone" row appears only when needed,
  empty zones dropped, tree order, top rows = headline; `zone_exact`
  list filter.

**Frontend**
- `types/reporting.ts` — `depth?`, `zone_exact?` on both row types.
- `ReportingUI.tsx` `MiniBar` — optional `indent` (depth) that indents the
  label; bar widths still scale to the largest top-level row.
- `PipelineReportScreen.tsx`, `SalesReportScreen.tsx`,
  `InsightsDashboardScreen.tsx` — pass `depth` for the Zone view; the
  "not in a sub-zone" row drills with `zoneExact`; `DemoApp.tsx`,
  `OpportunityPipelineScreen.tsx`, `services/opportunities.ts` carry it →
  `zone_exact`.
- A one-line note under the Zone view: "Each zone includes the zones
  indented beneath it."

**Docs**
- `Business-Rules.md` — reporting rule: a zone's report figures include
  every zone beneath it.
- E2E test plan: `docs/Zone-Tree-In-Reports-Manual-E2E-Test-Plan.md`,
  written against Dev's real zone data (checked read-only first).

## Risks

- **Deactivated zones** (e.g. Central Kerala): shown only if deals still
  point at them — would reveal data needing a clean-up, not hide it.
- **Restricted users** (Area Manager, Sales Staff): see only their own /
  team's deals as today; parent zone names appear above their districts
  for context, with totals of only what they can see.
- **Not in the current UAT move** unless Basheer says otherwise — ships
  in the next UAT update.
