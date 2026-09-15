# Report Drill-down (Feature 11.2) — Manual E2E Test Plan

**Feature:** 11.2, Module 5 → PRD 5.9 Drill-down Reporting. Full design/
build reasoning is in `docs/Report-Drilldown-Implementation-Plan.md`.

**Scope built:**
- **Pipeline Report**, **Sales Report**, and **Product Performance
  Report** — every bar/card that summarizes many deals into one number
  is now clickable. Clicking one lands on the Pipeline board's **List**
  view, pre-filtered to exactly the deals behind that number, shown via
  a dismissible "Showing: `<label>` — Clear filter" banner. No permanent
  new filter dropdown was added to the Kanban/List board itself.
- Two new backend filters (`sbu_id`, `product_id`) on
  `GET /opportunities/pipeline` power this; every other dimension
  (Rep/Zone/Stage/Won-Lost) reuses filters that already existed.
- Deliberately **not clickable**: the synthetic "Trade-Ins / Returns"
  bucket (Pipeline Report and Sales Report's Product breakdown) and
  Brand-grouped cards (Product Performance) — neither maps to a single
  real product.

**Not in scope for this pass:** Stagnant Deals, Opportunities On Hold,
and Daily Activity Report — these were already flat deal lists with
click-through to the individual opportunity before this feature, and
weren't touched by it.

**Test users needed:**
- Admin/GM login (Haroon) — full visibility, for exact-count
  cross-checks.
- At least one Sales Person / rep-level login — to confirm a drill-down
  result never shows deals outside that rep's own scope (same
  role-scoping the Pipeline board already enforces everywhere else —
  this pass is confirming drill-down doesn't bypass it, not testing
  scoping itself from scratch).

**Setup:** Ideally have, across the test data:
- At least one product/rep/zone/SBU with more than one matching deal
  (to confirm the *set*, not just a lucky single match).
- At least one deal with a Buyback/Trade-In line item, so the
  Trade-Ins/Returns bucket actually appears and can be confirmed
  non-clickable.
- At least one Won and one Lost deal for the same product/SBU, so
  Product Performance's Won and Lost columns can each be drilled
  separately and checked against each other.

---

## A — Pipeline Report drill-down

1. Open Pipeline Report. On the default breakdown, click any bar.
   **Expected:** navigates to Pipeline (List view), banner reads
   "Showing: `<bar's label>`", and every deal shown genuinely has that
   dimension's value (open one deal, confirm e.g. its Owner/Zone/Stage
   matches).
2. Switch the breakdown dropdown to **Product**, click a product bar
   with more than one deal behind it.
   **Expected:** all deals shown carry that product as one of their line
   items (open at least one and check its Products tab) — deal count
   here should be less than or equal to the report's own headline
   "N open deals," never more.
3. On the **Product** breakdown, confirm the **"Trade-Ins / Returns"**
   row is **not clickable** (no hover highlight, no cursor change,
   clicking does nothing).
4. Switch to **Stage**, **Rep**, **SBU**, **Zone** breakdowns in turn,
   clicking one bar from each.
   **Expected:** each lands on the correctly filtered List view; the
   banner label matches the bar clicked each time.
5. Click "Clear filter" on the banner.
   **Expected:** banner disappears, List view reverts to the full
   unfiltered pipeline (matches the total open-deal count shown
   elsewhere, e.g. Insights Dashboard or the Kanban stage-chip sum).

## B — Sales Report drill-down

6. Open Sales Report (All Time, so there's data to click). Switch
   through Rep/Zone/SBU/Product breakdowns, clicking one bar each time.
   **Expected:** each drill lands on Pipeline's List view showing
   **only Won deals** — every deal's status badge reads WON, and the
   banner label ends in ", Won" (e.g. "Showing: North Kerala, Won").
7. Cross-check one drill's total revenue: sum the `₹` values shown on
   each resulting deal card (or open them) and confirm it reconciles to
   the bar's own value in the Sales Report.
8. On the **Product** breakdown, confirm the Trade-Ins/Returns row (if
   present) is non-clickable, same as step 3.
9. Switch the period picker (This Month/This Quarter/All Time) and
   repeat one drill.
   **Expected:** the drilled deals still land correctly — the period
   picker only affects what Sales Report itself displays, not the
   drill-down's own filtering (a drilled Won deal is a specific,
   already-closed deal, not date-scoped further by the click).

## C — Product Performance drill-down

10. Open Product Performance, default **By Product** grouping. Click a
    product's **Won** count (must be ≥1 for this test).
    **Expected:** lands on List view, banner reads "Showing:
    `<product>`, Won", every deal shown is WON and carries that product.
11. Click the same product's **Lost** count.
    **Expected:** same product, but every deal shown is LOST instead —
    confirms Won and Lost are genuinely separate filters, not the same
    result relabeled.
12. Switch to **By SBU** grouping, click a Won or Lost count.
    **Expected:** lands correctly filtered by SBU + status; deals shown
    may span multiple products, all within that one SBU.
13. Switch to **By Brand** grouping.
    **Expected:** Won/Lost values show no hover highlight or cursor
    change, and clicking them does nothing — brand cards stay
    non-clickable (confirmed structurally: no single `product_id`
    represents a brand).
14. Click **Opportunities** (the total count, not Won/Lost specifically)
    on any card.
    **Expected:** not clickable — only the Won/Lost metrics drill down,
    per the plan's scope.

## D — Banner and filter interaction

15. From any drilled state, manually change the **Owner** or **Zone**
    dropdown on the Pipeline board.
    **Expected:** no crash; confirm what actually happens (the drill
    filter and the dropdown filter may compose as AND, or the dropdown
    may take over) and that the result makes sense for whichever
    behavior it turns out to be — flag if it's confusing.
16. From a drilled state, navigate to a different screen (e.g. click
    into a deal, then Back) and return to Pipeline.
    **Expected:** the "Showing: X" banner and its filter persist across
    opening/closing a deal (matches the existing reminders-banner
    pre-filter behavior), and only clears via "Clear filter" or a fresh
    drill-down from a report.
17. Trigger two different drills back-to-back from two different reports
    (e.g. Pipeline Report → Product X, then without clearing, Sales
    Report → Rep Y).
    **Expected:** the second drill fully replaces the first — banner
    and results reflect only the most recent click, no leftover mixed
    filtering.

## E — Role scoping (not a new concern, confirming no bypass)

18. Log in as a Sales Person / rep-level user. Perform one drill-down
    from any report they can see.
    **Expected:** the resulting List view still only shows deals within
    their existing scope (their own deals, or their team's, per however
    that role already works elsewhere) — a drill-down must never surface
    a deal outside what that role could already see on the plain
    Pipeline board.

## F — Regression

19. Confirm the plain Pipeline board (opened directly from the sidebar,
    not via a drill-down) still works normally — Owner/Zone filters,
    search, Kanban/List toggle, no stray banner.
20. Confirm Stagnant Deals, Opportunities On Hold, and Daily Activity
    Report are unchanged — still click straight through to the
    opportunity, no new banner or filter behavior appears there.
21. Confirm the Insights Dashboard's own "Pipeline by X" tile (unrelated
    to this feature) still renders and behaves as before.

---

## Sign-off

**Partial spot-check already done live during build, 2026-09-15, as
Haroon (GM):**
- Pipeline Report → clicked "SonoScape E2" (Product breakdown, ₹175.0L)
  → landed on List view, banner "Showing: SonoScape E2", opened one
  resulting deal ("Test opportunity") and confirmed its Products tab
  shows SonoScape E2 as its only line item.
- Sales Report → clicked "Basheer K" (Rep breakdown, All Time) → banner
  "Showing: Basheer K, Won", exactly one deal shown ("USG 2," ₹4.0L,
  WON badge), matching the report's own ₹4.0L exactly.
- Product Performance → By Brand, clicked SonoScape's "Lost" (3) →
  banner "Showing: Siemens USG M/c, Lost" on a separate By-Product check,
  exactly one LOST deal shown; confirmed Brand-grouped Won/Lost values
  are **not** clickable (no navigation on click).
- "Clear filter" confirmed working, reverting to the full unfiltered
  pipeline.

**Not yet run:** the full A–F pass above, including Stage/Zone/SBU
breakdown drills, Trade-Ins/Returns non-clickability, the period-picker
interaction (B9), banner/filter composition (D15–D17), and role-scoping
as a Sales Person (E18). Fill in after a complete live pass.
