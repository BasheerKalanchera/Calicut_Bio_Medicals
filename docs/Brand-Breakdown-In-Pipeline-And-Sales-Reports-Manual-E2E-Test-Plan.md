# Brand Breakdown in Pipeline Report, Sales Report and Insights Dashboard — Manual E2E Test Plan

**Feature:** `docs/Brand-Breakdown-In-Pipeline-And-Sales-Reports-Implementation-Plan.md`
— adds **Brand** to the breakdown dropdown on Pipeline Report, Sales
Report and the Insights Dashboard's "Pipeline by…" card.

**Built:** not yet committed.

**Environment:** Dev. Read-only — no step saves anything.

**Test users:** Admin/GM (Haroon) for exact totals; one rep-level login for
the scoping check (step 12).

**Test data (Dev), checked read-only 2026-09-26 as Admin:**
- Open pipeline by brand: EDAN 6 deals / 43.00; Magnamed 1 / 0.50;
  Maquet 1 / 5.00; SonoScape 30 / 490.00; Trade-Ins / Returns 7 / −11.50.
  These add up to the open total, 38 deals / 527.00 L.
- Won (all time): one deal, SonoScape 4.00 L.
- **No deal in Dev has lines from two brands**, so the split-value case
  can't be exercised without creating test data; not tested this pass.
- Rep for step 12: Fahad (Marketing User), 8 open deals.

**Tags:** S = Simple (Basheer runs it and reports back), C = Complex
(Claude drives it in the browser).

---

## A — Pipeline Report

1. **(S)** Open Pipeline Report, open the breakdown dropdown.
   **Expected:** options are Stage, Rep, SBU, Zone, Product, **Brand**.
2. **(S)** Pick **Brand**.
   **Expected:** heading reads "Pipeline by Brand"; one bar per brand,
   each with a value and a "weighted" figure; brand names are the clean
   catalogue names (no "EDAN"/"Edan" duplicates).
3. **(C)** Add up the brand bars' values (including any "Trade-Ins /
   Returns" row).
   **Expected:** equals the "Open Pipeline Value" tile at the top, and the
   Product breakdown's total.
4. **(C)** Click a brand bar.
   **Expected:** lands on Pipeline's List view with a "Showing: `<brand>`"
   banner; every deal listed has at least one product of that brand; the
   number of open deals matches the bar's deal count.
5. **(S)** Use the banner's back arrow.
   **Expected:** returns to Pipeline Report with **Brand** still selected.
6. **(S)** If a "Trade-Ins / Returns" row shows, click it.
   **Expected:** nothing happens (not clickable).
   *Superseded mid-test — Basheer asked for this row to be clickable;
   see step 6b.*
6b. **(C)** Pipeline Report → Brand, click **Trade-Ins / Returns**; then
   the same on the **Product** breakdown.
   **Expected:** List view, banner "Showing: Trade-Ins / Returns"; the 7
   open deals with a trade-in line (ICU Monitor, New lead, Test Aug 18
   opportunity, Test buyback opportunity, Test demo lead, Test lead, USG
   M/c - Test Aug 18). Back arrow returns to the report. (Sales Report's
   trade-in row can't be exercised: Dev has no Won deal with a trade-in.)

## B — Sales Report

7. **(S)** Open Sales Report, open the breakdown dropdown.
   **Expected:** options are Rep, Zone, SBU, Product, **Brand**.
8. **(C)** Pick **Brand** with period "All".
   **Expected:** one bar per brand with revenue won; the bars (plus any
   trade-in row) add up to the Revenue headline tile.
9. **(C)** Click a brand bar.
   **Expected:** Pipeline List view, banner "Showing: `<brand>`, Won";
   every deal is Won and carries a product of that brand.
10. **(S)** Switch the period to "This Quarter" with Brand still selected.
    **Expected:** bars update to this quarter's won revenue only.

## C — Insights Dashboard

11. **(S)** Open the Insights Dashboard, "Pipeline by…" card, pick
    **Brand**.
    **Expected:** same brands and values as Pipeline Report step 2.

## A2 — Active-only re-run (added mid-test, 2026-09-26)

Pipeline Report and the Dashboard now count Active deals only (BR-OP-07).
Expected on Dev: EDAN drops from 43.00 / 6 deals to **23.00 / 5** (its
20.00 On Hold "New ICU Monitor deal" is out); others unchanged; total
**507.00 L / 37 deals**.

14. **(S)** Pipeline Report: headline shows two tiles — **Active Pipeline
    Value ₹507.0L, 37 active deals** and **Weighted Forecast** — no
    "Unweighted Forecast" tile.
15. **(S)** Pipeline Report → Brand: EDAN **₹23.0L**, SonoScape ₹490.0L,
    Maquet ₹5.0L, Magnamed ₹0.5L, Trade-Ins −₹11.5L.
16. **(C)** Click SonoScape. **Expected:** 30 deals, all Active (before the
    fix: 34, including 1 Won and 3 Lost). Click EDAN: 5 deals, no On Hold.
17. **(C)** Stage breakdown, click a stage; and Trade-Ins row. **Expected:**
    only Active deals in each list, count = bar.
18. **(S)** Insights Dashboard: same two tiles and ₹507.0L.

## B2 — Sales Report period + Product Performance label (added mid-test)

19. **(C)** Sales Report, period **This Quarter**, Brand, click a bar (if
    any). **Expected:** banner "`<brand>`, Won, This Quarter"; the request
    carries `closed_from`/`closed_to` = the quarter's dates; list = bar's
    count. With **All Time**: banner "`<brand>`, Won", no date params.
    (A real mismatch can't be shown on Dev — one Won deal only.)
20. **(S)** Product Performance: the count label reads **"All
    Opportunities"**; SonoScape still 34.

## D — Scoping and regression

12. **(C)** Log in as a rep, open Pipeline Report → Brand.
    **Expected:** only that rep's own deals are counted (totals match
    their Stage breakdown total).
13. **(S)** Pipeline Report → **Product**, click a product bar.
    **Expected:** drill-down still works as before (regression).

---

## Results

| Step | Result | Notes |
|---|---|---|
| 1 | Pass | Brand listed last in dropdown (Haroon, GM) |
| 2 | Pass | "Pipeline by Brand"; SonoScape 490, EDAN 43, Maquet 5, Magnamed 0.5, Trade-Ins row |
| 3 | Pass | Brand bars 43 + 0.5 + 5 + 490 − 11.5 = 527.0 = Open Pipeline Value tile (38 deals); weighted bars 165.2 vs tile 165.1 (display rounding) |
| 4 | Pass | EDAN → List view, "Showing: EDAN", 6 open deals = bar's count. Cards show net deal value (sum 41.5) vs bar 43.0: the 1.5 gap is 3 EDAN deals' trade-in lines, counted in the Trade-Ins row — expected |
| 5 | Pass | Back arrow returns to Pipeline Report, Brand still selected (Basheer) |
| 6 | Pass | Trade-Ins / Returns row not clickable (Basheer) |
| 6b | Pass | Trade-Ins / Returns clickable on Product and Brand breakdowns; both list exactly the 7 expected open deals; back arrow works (Claude) |
| — | Finding | Review's flagged gap confirmed (existed before this change): Pipeline Report → SonoScape bar says 30 open deals, but the drilled list shows 34 — the 30 plus 1 Won (USG 2) and 3 Lost (test Opp 3, usg, Test opportunity). The Pipeline Report drill sends no "open only" filter; the Product drill does the same. EDAN (step 4) matched only because it has no closed deals. |
| 14 | Pass | Two tiles: Active Pipeline Value ₹507.0L / 37 active deals, Weighted Forecast; no Unweighted tile (Basheer) |
| 15 | Pass | Brand: EDAN ₹23.0L, SonoScape 490, Maquet 5, Magnamed 0.5, Trade-Ins −11.5 (Basheer) |
| 16 | Pass | SonoScape → 30 deals, all Active (was 34 incl. 1 Won + 3 Lost); EDAN → 5 Active, On Hold "New ICU Monitor deal" gone (Claude) |
| 17 | Pass | Trade-Ins → 7 Active. Stage view bars 2.5 + 52 + 245.5 + 98 + 59 + 50 = 507 = tile; Negotiation ₹98.0L → 6 Active deals summing to 98.0, On Hold deal absent (Claude) |
