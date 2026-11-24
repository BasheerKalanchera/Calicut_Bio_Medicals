# Margin Report — Implementation Plan

**Status:** Approved, 2026-11-24 (Basheer).
**Traceability rows:** 4.3 Revenue per product/brand analytics (Margin
part); 11.1 Core reports: sales, pipeline, product qty/price/margin (the
Margin Report).
**Design / discussion:** `docs/Product-Pricing-And-Cost-Implementation-Plan.md`
D8–D10 and section 4; `Business-Rules.md` BR-CAT-04.

## Decisions

- D1. Where it lives: a new "Margin Report" screen under Reports, built
  like the Sales Report — not extra columns on the Product Performance
  report (which every role sees and has no period choice) — Basheer, 2026-11-24
- D2. Which Opportunities count: Won only, picked by the date they were
  closed, with the Sales Report's period choice (This Month / This Quarter
  / All Time, default This Quarter) — Basheer, 2026-11-24
- D3. How margin is worked out, per product line: what the line was sold
  for (quantity × unit price − discount) minus quantity × the product's
  cost. Margin % = margin ÷ what it was sold for — Basheer, 2026-11-24
- D4. Which cost: the cost is saved on each product line on the day the
  Opportunity is marked Won, and the report uses that saved cost — so a
  later change to Cabio's buy price doesn't change past margins. A product
  with no cost on that day saves nothing (D5 applies) — Basheer, 2026-11-24
  (changed from "today's catalog cost", 2026-11-24)
- D5. Products with no cost entered: their lines are left out of cost and
  margin, and the screen shows one line: "N lines worth ₹X L have no cost
  entered — not in the margin". Sold-for totals still include them — Basheer, 2026-11-24
- D6. Buyback (trade-in) lines: left out of the margin, since they have no
  catalog product or cost; their total is shown as one information line — Basheer, 2026-11-24
- D7. Group by: Product, Brand, SBU, Zone, Rep (the Sales Report's five),
  default Product — Basheer, 2026-11-24
- D8. Columns: Quantity, Sold for, Cost, Margin (all in ₹ Lakhs), Margin %;
  a totals row at the top — Basheer, 2026-11-24
- D9. Who sees it: General Manager and Admin only. Other roles don't see
  the menu item, and the server refuses them (BR-CAT-04) — Basheer, 2026-11-24
- D10. Clicking a row opens the Pipeline list of those Won Opportunities,
  as the Sales Report does; that list shows no cost — Basheer, 2026-11-24
- D12. Opportunities already Won before this is built: their lines are
  filled once with the catalog cost on the day the change is applied, and
  the report marks them "cost filled in later". On UAT this fill runs only
  after the price sheet is loaded there — Basheer, 2026-11-24
- D13. Products on a Won or Lost Opportunity: only the General Manager
  and Admin can change them, and each save needs a short reason (e.g. "PO
  shows 2 units, not 1"), kept with the change in the history log. Every
  other role sees no Edit / + Add, and the server refuses them with a
  plain message. On a correction, a product that stays keeps the cost
  saved on the day of the Won; a product added takes the catalog cost on
  the day of the correction — Basheer, 2026-11-24 (option C, over A "no
  one, database fix" and B "GM only, no reason"). Why: today anyone who
  can see the Opportunity can change its products (checked on Dev
  2026-11-24 as Haroon (GM) on Won "USG 2": Edit shown; an unchanged
  Save and a real change (discount 0 → 0.01, line ₹4.00 L → ₹3.99 L) were
  both saved — products save 200, value save 200; discount put back to 0.
  Basheer also changed a Won Opportunity's products as Fazal the same day.
  Code: no role check on products)
- D11. The Product Performance report stays without margin (it is open to
  every role); BR-CAT-04's mention of a margin there is reworded to point
  to this report: "Margin is shown only in the Margin Report, which is
  Admin/GM-only too. The Product Performance report shows no margin." —
  Basheer, 2026-11-24

## Figures and sources

- Sales Report period choices This Month / This Quarter / All Time,
  default This Quarter — `sales-os-app/src/screens/SalesReportScreen.tsx`
  lines 21–24, 59
- Sales Report groupings Rep, Zone, SBU, Product, Brand —
  `SalesReportScreen.tsx` lines 11–16
- Line value = quantity × unit price − discount —
  `backend/app/domains/opportunity/models.py` (`extended_value_lakhs`)
- Cost is one field per product, GM/Admin only — `Business-Rules.md`
  BR-CAT-04; `backend/app/domains/product/models.py` (`cost_lakhs`)
- Product Performance has no period filter —
  `backend/app/domains/reporting/router.py` lines 106–117
- Products on a Won Opportunity can still be edited, and a save rebuilds
  every line — `OpportunityDetailScreen.tsx` lines 438–444 (Edit always
  shown), `opportunity/service.py` `replace_items` (no Won check)
- A Won Opportunity can't be reopened — `Business-Rules.md` line 287
- How many Won Opportunities on Dev have lines with a cost — not checked
  yet (read-only Dev query, to ask first)
- SonoScape S50 Elite example figures in section 1 — made-up example

## 1. In plain terms

The General Manager and Admin get a new Margin Report under Reports. It
shows, for the Opportunities won in the chosen period, what each product
was sold for, what it cost Cabio, and the difference (the margin), in
Lakhs and as a percentage. They can group it by product, brand, SBU, zone
or rep, and click a row to see the Opportunities behind it.

Example (made-up): one SonoScape S50 Elite sold for ₹18 L with a ₹1 L
discount, catalog cost ₹12 L → sold for ₹17 L, margin ₹5 L, 29.4%.

The cost is saved on each product line on the day the Opportunity is
marked Won, so when Cabio's buy price changes later, past margins stay as
they were.

Products with no cost in the catalog can't have a margin; the report says
how many lines that is and leaves them out of the margin rather than
counting them as zero cost. Trade-ins are shown on a separate line.

Nobody else sees this screen; reps and managers never see cost or margin.

### On a phone

Each row is a block: name on top, then Sold for, Cost, Margin and Margin %
on two short lines. The totals block sits above the rows; period and
group-by boxes stack above that, as on the Sales Report.

## 2. Build order

1. Database: a saved-cost column on each Opportunity product line, filled
   on the move to Won; a one-time fill for Opportunities already Won
   (D12), and the reason column for D13. Applied to Dev; nothing on
   screen changes.
   Then: the Won/Lost products lock (D13) — server refusal plus the
   Products tab change, with tests for every role.
2. Server: the margin query and endpoint, GM/Admin only, with tests for
   every role. Nothing on screen changes yet.
3. Screen: the Margin Report and its menu item (GM/Admin), the row click
   into the Pipeline list. Checkpoint commit after each step.

## 3. What could be affected

- Marking an Opportunity Won (Opportunity page status change, and the
  close pop-up): now also saves cost on its product lines. Check before
  and after: Won still saves, revenue and closed date unchanged.
- Products tab on a Won or Lost Opportunity (Opportunity page): Edit
  hidden for everyone but GM and Admin, who must give a reason; open
  Opportunities unchanged for every role. Check before and after: a rep
  still edits an open Opportunity's products; the Won pop-up's product
  check still passes.
- The saved cost never appears in any Opportunity response (BR-CAT-04:
  Opportunity data carries no cost). The Pipeline list is opened
with the filters the Sales Report already uses (check before and after:
Sales Report row click still opens the right list).

## 4. Not in this plan (with reasons)

- Margin targets and incentives — Cabio leadership team (pricing plan D10).
- Margin on open (not yet won) Opportunities — a forecast, not a report of
  what was earned; not asked for.

## 5. Business rules and records to update

- `Business-Rules.md` BR-CAT-04: margin lives in the Margin Report (D11)
  — written 2026-11-24.
- `Business-Rules.md` BR-OP-09: products on Won/Lost — GM/Admin only,
  with a reason (D13) — written 2026-11-24; enforced once built.
- Traceability 4.3 and 11.1 once built and E2E done.

## 6. Technical addendum

- Migration: `opportunity_item.cost_at_won_lakhs NUMERIC(15,2) NULL`
  plus a marker for D12's later fill; one-time fill from
  `product.cost_lakhs` for lines on WON Opportunities.
- `opportunity/service.py`: stamp `cost_at_won_lakhs` on the first move to
  WON (next to the `closed_at` stamp). `add_item` / `delete_item` /
  `replace_items` on a terminal Opportunity: 403 unless GM/Admin, and a
  required `reason` (kept for the audit entry); `replace_items` carries
  `cost_at_won_lakhs` over by product, new lines get today's cost. Not
  added to any Opportunity schema. `ProductsTab` gets status and role to
  hide Edit and ask for the reason.
- `backend/app/domains/reporting/`: `margin_summary` in repository and
  service (Won only, `closed_at` in period, PRODUCT lines using
  `opportunity_item.cost_at_won_lakhs`; lines with NULL cost counted separately; BUYBACK
  total separately); `MarginGroupBy`, `MarginSummaryRow`,
  `MarginSummaryResponse` in schemas; `GET /reporting/margin-summary` in
  router, 403 for roles other than GM/Admin.
- Tests: `tests/domains/reporting/test_margin_summary.py` — every role,
  no-cost lines, Buyback, period bounds.
- Frontend: `MarginReportScreen.tsx` (MUI), `services/reporting.ts`,
  `types/reporting.ts`, `DemoApp.tsx` Reports menu (GM/Admin only).
