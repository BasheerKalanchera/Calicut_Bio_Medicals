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
13. **Superseded 2026-09-22** — Brand cards are no longer non-clickable.
    A `brand_id` filter was added to `list_pipeline`/`count_pipeline`,
    and By Brand now drills down the same as By Product/By SBU. See
    `docs/Product-Performance-Brand-Drilldown-Manual-E2E-Test-Plan.md`
    for this dimension's own test plan; the "no single `product_id`
    represents a brand" reasoning below no longer applies now that the
    filter joins through `Product.brand_id` directly instead of
    `product_id`.
14. Click **Opportunities** (the total count, not Won/Lost specifically)
    on any card. Added 2026-09-16, on request — was originally scoped
    as non-clickable, now drills the same as Won/Lost.
    **Expected:** lands on List view, banner reads "Showing:
    `<group>`" (no ", Won"/", Lost" suffix, since no status filter
    applies) — deals shown span every status (active pipeline, Won,
    and Lost together), and the count matches the card's own
    "Opportunities" number.

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
    filtering. This includes the Owner/Zone dropdowns: a fresh drill
    resets both to "All," even if they were manually changed during an
    earlier, unrelated visit to this screen. (Found and fixed
    2026-09-16 — see Progress-Archive.)

## D2 — Back-to-report arrow

Added 2026-09-16, mid-pass: the browser/phone's own Back button doesn't
work for returning to the report (this app has no URL routing between
screens — see `active_progress.md`), so a dedicated in-app back arrow was
added to the banner instead. `DemoApp.tsx`'s `pipelineReturnView` records
which report screen a drill came from; `OpportunityPipelineScreen.tsx`'s
banner renders a back arrow before the "Showing: X" label whenever that's
set.

18. From a drill-down on **Pipeline Report**, confirm a back arrow (←)
    appears immediately to the left of "Showing: X" in the banner.
    Click it. **Expected:** returns to Pipeline Report, not the plain
    Pipeline board — and the breakdown dropdown (Stage/Rep/SBU/Zone/
    Product) is still on whatever it was set to before the drill.
19. Repeat from a drill-down on **Sales Report** and on **Product
    Performance**. **Expected:** each returns to its own originating
    report (not Pipeline Report by default) — confirms the origin is
    remembered per drill, not hardcoded to one screen. For Sales Report,
    also confirm the period picker (This Month/Quarter/All Time) is
    still on whatever it was set to.
20. From a drilled state, click **"Clear filter"** (not the back arrow).
    **Expected:** filter clears and you stay on the Pipeline board, same
    as step 5 — "Clear filter" and the back arrow are two different
    actions, only the back arrow navigates away.
21. Open the plain Pipeline board directly from the sidebar (no drill
    involved). **Expected:** no banner, so no back arrow — the arrow
    only ever appears on a genuinely drilled-into state.

## E — Role scoping (not a new concern, confirming no bypass)

22. Log in as a Sales Person / rep-level user. Perform one drill-down
    from any report they can see.
    **Expected:** the resulting List view still only shows deals within
    their existing scope (their own deals, or their team's, per however
    that role already works elsewhere) — a drill-down must never surface
    a deal outside what that role could already see on the plain
    Pipeline board.

## F — Regression

23. Confirm the plain Pipeline board (opened directly from the sidebar,
    not via a drill-down) still works normally — Owner/Zone filters,
    search, Kanban/List toggle, no stray banner.
24. Confirm Stagnant Deals, Opportunities On Hold, and Daily Activity
    Report are unchanged — still click straight through to the
    opportunity, no new banner or filter behavior appears there.
25. Confirm the Insights Dashboard's own "Pipeline by X" tile (unrelated
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

**Live pass in progress, 2026-09-16, as Haroon (GM):**
- Steps 1–2 (Product breakdown, default view): clicked "SonoScape E2"
  (₹175.0L) → banner "Showing: SonoScape E2", 5+ deals listed; opened
  "New opportunity test" and confirmed its Products tab shows SonoScape
  E2 as the only line item (₹9.0L, Qty 1). **PASS.**
- Step 3 (Trade-Ins/Returns non-clickable on Product breakdown): no
  hover highlight, click does nothing, stays on Pipeline Report.
  **PASS.**
- Step 4 (Stage/Rep/SBU breakdowns): Stage → "Negotiation" — all
  resulting deals carry the Negotiation stage tag. Rep → "Fazal" — every
  deal owned by Fazal. SBU → "Critical Care" — opened "critical care
  icu" and confirmed its SBU field reads Critical Care. **PASS.**
  Zone breakdown not yet run (session paused to build steps 18–19
  below first).
- Steps 6–7 (Sales Report drill, All Time): clicked "Basheer K" → banner
  "Showing: Basheer K, Won", exactly one deal ("USG 2," ₹4.0L, WON
  badge), matching the report's own ₹4.0L exactly. **PASS.**
- Steps 18–19 (back-to-report arrow, built this session in response to
  this testing): confirmed from both Pipeline Report (SonoScape E2 drill
  → back arrow → returned to Pipeline Report with Product breakdown
  still selected) and Sales Report (Basheer K/Won drill → back arrow →
  returned to Sales Report with All Time still selected) — origin is
  correctly remembered per report, not hardcoded. **PASS.**

**Carried over from 2026-09-15 build-time spot-check, also as Haroon:**
- Product Performance → By Brand, clicked SonoScape's "Lost" (3) →
  banner "Showing: Siemens USG M/c, Lost" on a separate By-Product check,
  exactly one LOST deal shown; confirmed Brand-grouped Won/Lost values
  are **not** clickable (no navigation on click).
- "Clear filter" confirmed working, reverting to the full unfiltered
  pipeline.

- Step 4 continued: Zone → "Malappuram" — confirmed via the hospital's
  own Zone field (Al Shifa Hospital Perinthalmanna → Malappuram).
  **PASS.** Section A complete.
- Step 8 (Trade-Ins/Returns on Sales Report): not testable — no
  Trade-Ins/Returns row exists in this dataset's Won deals. Already
  covered structurally on Pipeline Report (step 3).
- Step 9 (period-picker interaction): not fully testable — only "All
  Time" has Won deals in this dataset; This Month/Quarter are empty.
- Steps 10–14 (Product Performance): Won (SonoScape X3) and Lost
  (Siemens USG M/c) confirmed as genuinely separate filters on
  different products (no single product had both Won≥1 and Lost≥1 in
  this dataset). By SBU (Imaging, Lost) → exactly 3 LOST deals. By
  Brand → Won/Lost non-clickable. **PASS.** (Step 14, total
  "Opportunities" count, was non-clickable at the time of this run —
  see the 2026-09-16 addendum below where it was made clickable on
  request and separately verified.)
- Steps 15–17 (banner/filter interaction): Owner dropdown composes as
  AND with a drill (no crash) — step 15 PASS. Banner + dropdown persist
  across opening/closing a deal — step 16 PASS. Two drills back-to-back
  from different reports: banner fully replaces, but a real bug
  surfaced and was fixed here (see D2 note and Progress-Archive) — step
  17 now PASS after the fix.
- Steps 20–21: "Clear filter" clears and stays on Pipeline (distinct
  from the back arrow) — PASS. A direct Pipeline visit (not via drill)
  shows no banner — PASS.

- Section F regression (23–25): plain Pipeline board (Kanban toggle,
  Owner/Zone dropdowns, search all work, no stray banner) — PASS.
  Stagnant Deals and Daily Activity Report load cleanly (no rows in
  current data, not a regression). Opportunities On Hold → clicked
  "New ICU Monitor deal," click-through straight to the opportunity, no
  new banner — PASS. Insights Dashboard's "Pipeline by Rep" tile
  renders and stays non-clickable, unaffected — PASS.

- Step 22 (role scoping, logged in as Fazal — Area Manager, Kasaragod,
  SBU Imaging, substituted for a plain Sales Person since that's who
  was available): Fazal's plain Pipeline board already shows more than
  just his own deals (his team's too, e.g. Fahad's), confirming his
  role's normal scope first. Pipeline Report itself is scoped
  accordingly (₹242.0L/15 open deals vs Haroon's ₹514.6L/37). Drilled
  Product breakdown → SonoScape E2: every resulting deal belongs to
  Fazal or Fahad, none from outside owners (Basheer K, Nishad K V,
  Shruthi, etc.) — drill-down did not bypass the role's normal scope.
  **PASS.**

All A–F test steps now run. The only two not fully exercised are data
limitations, not failures: step 8 (no Trade-Ins/Returns row exists in
Sales Report's current Won deals — already covered structurally on
Pipeline Report step 3) and step 9 (only "All Time" has Won deals in
this dataset, so the period-picker interaction couldn't be compared
across periods with real drills).

**Addendum, 2026-09-16 — Opportunities count made clickable (on
request), logged in as Fazal:** Product Performance's total
"Opportunities" metric (step 14) was extended to drill down the same
way as Won/Lost, but with no status filter — clicked SonoScape E2's
Opportunities count (7) → banner "Showing: SonoScape E2" (plain, no
status suffix), resulting deals span multiple statuses together (Order,
Negotiation, Demo, Qualified), confirming it's genuinely unfiltered by
status rather than defaulting to one. Back arrow returned correctly to
Product Performance. Cross-checked role scoping wasn't affected: one
result ("usg m/c," owned by Basheer K) was outside what Fazal normally
touches by ownership, but confirmed via search that this deal is
already visible to Fazal on his plain, undrilled Pipeline board too
(same existing zone/SBU-based visibility rule, not something this
change introduced). **PASS.**
