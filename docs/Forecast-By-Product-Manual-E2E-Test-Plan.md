# Forecast Broken Down by Product — Manual E2E Test Plan

**Feature:** 2.5 (product half), Module 5 → PRD 5.1 Forecasting. Build detail:
`docs/Forecast-By-Product-Implementation-Plan.md`. **Full pass completed
live, 2026-09-15** — Haroon (Admin/GM), Nishad K V (Area Manager), Vivek
(Sales Staff). Two real bugs were found and fixed mid-pass (headline totals
double-counting once Product was selectable; a follow-on `group_id` type fix
that briefly broke every other breakdown) — both re-verified after the fix,
see the implementation plan's "Bugs found and fixed" section for detail.
Two small polish items were also added on Basheer's request during the pass:
each row now also shows its weighted forecast, not just pipeline value; the
empty-state message is now role-aware ("You don't own any open deals yet."
for a self-scoped viewer instead of the generic, misleading "No open
pipeline.").

**What changed, in one line:** the Insights Dashboard's "Pipeline by
&lt;X&gt;" dropdown gets a fifth option, **Product**, alongside the existing
Stage/Rep/SBU/Zone — same tile, same chart, same scoping rules, one more way
to slice it.

**Where to look:** Insights Dashboard (left nav), the "Pipeline by ..."
card — it's the second card down, right under the three top-line stat tiles
(Open Pipeline Value / Unweighted Forecast / Weighted Forecast).

**Test users** (same roster as `BR-ACC-03-Manual-E2E-Test-Plan.md`):
- Admin/GM (sees everyone): Basheer K, Abdul Latheef P, Haroon Sidheeq
- A team-tier manager if one is available (SBU Manager/Area Manager — sees
  their team only)
- A rep (sees only their own deals): e.g. Vivek (Alappuzha), Nishad K V
  (North Kerala)

**Setup:** no data setup needed — this reads existing open/active
opportunities, whatever's already in Dev. Useful to first jot down, from the
Product Catalog or a Product Performance Report look, one product you know
has 2-3 open deals against it, so you have something concrete to
cross-check the numbers against in Group B.

---

## Group A — The new option shows up and switches cleanly — PASSED live 2026-09-15

Tested live as Haroon Sidheeq (General Manager).

1. Log in as any role. Open Insights Dashboard.
2. Open the "Pipeline by ..." card's dropdown (top-right of that card).
   **Expect:** five options now — Stage, Rep, SBU, Zone, **Product** (new).
   — **PASS**
3. Select **Product**.
   **Expect:** card title changes to "Pipeline by Product"; the list below
   re-renders as one bar per product name, no error, no blank/frozen state.
   — **PASS**
4. Switch back and forth between Product and any other option a couple of
   times.
   **Expect:** each switch reflows cleanly, no leftover bars from the
   previous selection, no console errors. — **PASS**

## Group B — The numbers are actually right — bug found, fixed, re-verified

5. With **Product** selected, pick one bar for a product you know has a
   couple of open deals.
   **Expect:** the bar's value looks like a plausible sum of that product's
   *open* deals' line-item values. — **PASS**
6. Note the three top stat tiles with **Stage** selected, then switch to
   **Product**.
   **Found live:** headline flipped from ₹514.6L/37 deals to
   ₹526.1L/44 deals purely from switching the dropdown — a real bug (the
   totals were being re-derived from whichever breakdown's rows happened to
   be loaded, which double-counts a deal that spans more than one product).
   **Fixed:** headline now comes from its own fixed, Stage-grouped query,
   independent of the dropdown. **Re-verified: PASS** — ₹514.6L/37 deals,
   unchanged across all five dropdown options.
7. Network tab check on `pipeline-summary?group_by=product`.
   **Expect:** each row carries real `unweighted_forecast_lakhs`/
   `weighted_forecast_lakhs`, not just the visualized pipeline value.
   — **PASS** (confirmed via fetch in DevTools console, e.g. EDAN elite V6:
   ₹25.0L value / ₹14.25L weighted)

## Group C — Reconciliation, not exclusion (design revised live)

Originally planned as "confirm Buyback lines are deliberately excluded";
revised mid-test.

8. **Basheer's call, live:** excluding Buyback lines from the Product view
   entirely meant its rows didn't add up to the page's own total — visible,
   not just theoretical (₹526.1L summed across products vs. the true
   ₹514.6L). Rebuilt to bucket Buyback lines under a new **"Trade-Ins /
   Returns"** row instead of dropping them.
   **Expect after fix:** adding up every bar in the Product view, including
   Trade-Ins/Returns, equals the page's own ₹514.6L total exactly.
   — **PASS**, confirmed both by direct calculation
   (0.6+5+13+25+0.5+2+175+86+179+40+0−11.5 = 514.6) and by eye in the UI.
9. Weighted-forecast column reconciliation (added once Group B's secondary
   figure existed): sum of every row's weighted figure, including
   Trade-Ins/Returns' −₹0.9L to −₹2.5L depending on role scope, also equals
   the page's own Weighted Forecast total. — **PASS**

## Group D — Role-based scoping still works for the new option — PASSED live

10. As a rep (Vivek, Sales Staff): selected Product.
    **Expect:** bars reflect only that rep's own deals.
    **Found:** Vivek owns zero open deals currently (the deals he can see on
    the Pipeline board belong to other reps) — page correctly showed
    ₹0.0L/0 deals and "No open pipeline." for the empty state.
    **Basheer flagged:** that message reads as a contradiction when the
    viewer can plainly see deals elsewhere in the app (Pipeline board shows
    everyone's deals; Insights is self-scoped for a rep). **Fixed:** empty
    state now shows "You don't own any open deals yet." for a self-scoped
    viewer, the original generic text kept for manager-tier roles where
    "no pipeline" is actually accurate. — **PASS** after fix.
11. As Nishad K V (Area Manager, North Kerala, Critical Care): selected
    Product. **Expect:** bars reflect his own scope (his data showed only
    himself — no other North Kerala Critical Care rep currently under him
    in Dev, not a scoping bug). Headline stayed fixed (₹37.6L/6 deals)
    across the dropdown; product bars (0.6+5+8+25+0.5−1.5) and weighted
    column both reconciled exactly to his own headline totals. — **PASS**
12. As Haroon (Admin/GM): bars reflect every deal, unrestricted.
    — **PASS** (this was the primary role Groups A/B/C ran under)

## Group E — Regression: existing breakdowns untouched — PASSED live

13. Cycled through Stage, Rep, SBU, Zone as Haroon.
    **Expect:** all four look exactly as before, headline unchanged
    throughout. — **PASS**: Stage (52+238.6+118+56+50=514.6), SBU
    (42.6+472.0=514.6), Zone (94+7+126.5+263.1+24=514.6), Rep (matches the
    per-rep breakdown seen throughout) — all reconcile, all unchanged by the
    Product addition.

---

## Sign-off

All groups (A, B, C, D, E) passed live on 2026-09-15 across three roles
(Haroon/Admin/GM, Nishad K V/Area Manager, Vivek/Sales Staff), with two real
bugs and two polish requests handled mid-pass — see
`docs/Forecast-By-Product-Implementation-Plan.md` for full detail. Feature
2.5's product half is flipped from **Partial** to include this scope in
`Signed-Requirements-to-PRD-Traceability.md` and
`Phase1-Delivery-Scorecard.md` (the row stays **Partial** overall — the
month/quarter half is still not started). Logged in
`docs/Progress-Archive-2026-09.md`.
