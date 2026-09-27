# Brand Breakdown in Pipeline Report, Sales Report and Insights Dashboard — Manual E2E Test Plan

**Feature:** `docs/Brand-Breakdown-In-Pipeline-And-Sales-Reports-Implementation-Plan.md`
— adds **Brand** to the breakdown dropdown on Pipeline Report, Sales
Report and the Insights Dashboard's "Pipeline by…" card.

**Built:** `b4d6f18` (2026-09-26) + `ae248f8` (2026-09-27). E2E complete, all 24 steps passed.

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

## E — Deal counts and "No products yet" (scope addition, 2026-09-27)

21. **(S)** Pipeline Report, as Haroon: every bar shows "N deals" under
    its name; the top tile's deal count now includes Active deals with no
    products (so it can rise above 37). Click a Stage bar and a Brand bar.
    **Expected:** the banner reads "Showing: `<name>` · N deals" and N
    equals the bar's count.
22. **(S)** Sales Report, All Time, Brand: SonoScape shows "1 deal"; click
    it. **Expected:** banner "Showing: SonoScape, Won · 1 deal".
23. **(S)** Pipeline Report → Brand (and Product): a **"No products yet"**
    row with ₹0 and a deal count; click it. **Expected:** the list shows
    only Active deals with no products, count = the row's. As Rudrappa:
    the tile reads 1 active deal, ₹0, and Brand shows only "No products
    yet — 1 deal".
24. **(S)** Click any Pipeline Report bar, then a Sales Report bar.
    **Expected:** the banner's "· N deals" appears at once (the bar's
    count), not after the list loads; it stays the same once the list
    appears.

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
| 18 | Pass | Insights Dashboard: two tiles, Active Pipeline Value ₹507.0L and Weighted Forecast; no Unweighted tile (Basheer) |
| 7 | Pass | Sales Report dropdown: Rep, Zone, SBU, Product, Brand (Basheer) |
| 10 | Pass | Brand + This Quarter: no bars; SonoScape shows only under All Time (Basheer). Checked read-only on Dev: the only Won deal, "USG 2" (created 2026-06-28), has `closed_at` NULL — Won before `0043` added the column, no backfill by design — so it belongs in All Time only. Dev has no deal Won since `0043`, so "a recent win appears in This Quarter" can't be shown here (same limit as step 19) |
| 20 | Pass | Product Performance label reads "All Opportunities"; SonoScape 34 (Basheer) |
| 8 | Pass | Sales Report, All Time, Brand: one bar SonoScape ₹4.0L = Revenue tile ₹4.0L (Basheer) |
| 9 | Pass | SonoScape bar → banner "Showing: SonoScape, Won"; one deal, "USG 2", Won (Basheer) |
| 11 | Pass | Dashboard "Pipeline by…" → Brand: EDAN 23.0, SonoScape 490.0, Maquet 5.0, Magnamed 0.5, Trade-Ins −11.5 — matches Pipeline Report (Basheer) |
| 13 | Pass | Pipeline Report → Product, bar click opens List view with "Showing: `<product>`" banner (Basheer). Count not checkable by eye — neither the bar nor the list shows a deal count; fixed by the deal-count scope addition (steps 21–22) |
| 12 | Pass | Plan's rep (Fahad) is a Marketing User, not a rep — replaced. Rudrappa (Sales Staff): nothing from other owners shows; his only Active deal has no product lines so the report is empty (see finding below). Fazal (Area Manager): ₹247L, 15 SonoScape deals (his 8 + Fahad's 7, team scope); Brand bars total = Stage bars total = tile (Basheer). Brand and Stage share one scoping path (`reporting/repository.py` `_apply_owner_scope`), so no role change needed |
| — | Finding | A deal with no product lines is left out of the Pipeline Report entirely (tile count and every bar) — the report's inner join on line items drops it. Existed before this change. Basheer's call 2026-09-27: count it (tile + Stage/Rep/SBU/Zone) and add a clickable "No products yet" row to Product/Brand — built as a scope addition with the deal counts |
| 19 | Pass (partial) | All Time half only: Sales Report → Brand → SonoScape, banner "Showing: SonoScape, Won" (Basheer, as Haroon). Request capture missed (Claude's recording tab didn't see the click); "no date params on All Time" confirmed from code instead — `SalesReportScreen.tsx:28` returns no period for "all", `services/opportunities.ts:44-45` only sends `closed_from`/`closed_to` when set. This Quarter half not exercisable on Dev: no deal Won since `0043`, so no bar to click |
| 21 | Pass | Tile now 48 active deals (was 37): +11 Active deals with no products (Rudrappa 1, Fazal 1, Nishad 1, Shruthi 4, Basheer K 4 — matches the 2026-09-27 read-only owner query). Stage bars' counts add up to 48; banner "· N deals" matches the bar on Stage and Brand drills (Basheer). Banner count appears when the list finishes loading — it comes from the list's own response |
| 22 | Pass | Sales Report, All Time, Brand: SonoScape "1 deal"; banner "Showing: SonoScape, Won · 1 deal" (Basheer) |
| 23 | Pass | "No products yet" row on Brand and Product, ₹0, drills to only product-less deals, count matches; Rudrappa: 1 active deal ₹0, Brand shows only "No products yet — 1 deal" (Basheer) |
| 24 | Pass | Banner "· N deals" appears at once on Pipeline Report and Sales Report drills and stays the same once the list loads (Basheer) |
