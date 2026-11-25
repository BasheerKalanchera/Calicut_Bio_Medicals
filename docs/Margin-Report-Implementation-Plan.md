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
  (the line becomes a list of products, D15; Margin % base, D14)
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
  shows 2 units, not 1"), kept as a Note on the Activity tab (D13a). Every
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
  - D13a. Where the reason is kept: as a Note on the Opportunity's
    Activity tab (who and when shown, like stage and status reasons), not
    new fields on the Opportunity; Activity notes can't be deleted, so a
    wrong reason is corrected by a new note — Basheer, 2026-11-25 (option
    A, over B "reason and date fields on the Opportunity").
  - D13b. A Save on a Won or Lost Opportunity's products that changes
    nothing asks for no reason and saves nothing — Basheer, 2026-11-25
    (Dev 2026-11-24: an unchanged Save on Won "USG 2" was saved).
  - D13c. How the reason is typed: the "Why this change?" pop-up in a
    reason-only mode — it opens when a GM or Admin presses Save on a Won
    or Lost Opportunity's products and something changed; one reason box,
    prompt "Who asked for this change, and why?", no next-action
    questions; date and Note type filled in. One Save = one pop-up = one
    Note, which also lists the changes on its own (made-up example:
    "Products corrected: SonoScape S50 Elite, 1 → 2 units. Reason: Fahad
    — PO shows 2 units, not 1"). Why the pop-up: the same "explain a
    change" step users already know, over a separate reason box on the
    Products tab — Basheer, 2026-11-25.
  - D13d. The reason Note is never refused because the GM or Admin has an
    open next action of their own on that Opportunity, and it neither
    closes nor creates a next action (unlike stage and status reasons,
    BR-OP-22): a correction someone asked for is not a sales step —
    Basheer, 2026-11-25.
  - D13e. Open Opportunities stay as today: no pop-up, no reason, for
    every role. Considered and dropped: a reason on every product change,
    open ones included — it would add a pop-up and a note to each quote
    revision during negotiation — Basheer, 2026-11-25.
  - Related gap, not in this plan: other Won/Lost edits (Overview value,
    PO, owner, dates; Stakeholders; Documents) need no reason and only
    Splits are locked — Backlog "Won/Lost Opportunity: lock Overview and
    other edits too?" (Basheer, 2026-11-25).
- D14. Margin % when some lines have no cost: margin ÷ what the lines
  with a cost were sold for — not ÷ all sold-for, which would pull the
  percentage down for every missing cost though no money was lost
  (E2E plan section A, made-up test costs: ₹13.00 L ÷ ₹48.00 L = 27.1%
  this way, ÷ ₹53.00 L = 24.5% the other) — Basheer, 2026-11-25
  (option A, over B "÷ all sold-for").
- D15. The no-cost line (D5) becomes a short list of the products missing
  a cost: product, number of sales, value sold (made-up example:
  "SonoScape E1 — 1 sale, ₹5.00 L, no cost entered"), so the GM knows
  which costs to enter in the catalog — Basheer, 2026-11-25.
- D16. When a product's cost is first entered in the catalog (empty → a
  value), it is copied onto that product's Won sales that still have no
  saved cost, marked "cost filled in later" as in D12. Sales with a saved
  cost (Won day or the D12 fill) are never touched, and changing an
  existing cost (e.g. ₹20.00 L → ₹22.00 L when procurement gets dearer)
  changes no past sale — only sales Won afterwards take the new cost
  (D4). Why: under D4 alone, a product Won before its cost was entered
  would stay out of the margin for good; empty sales can only build up
  while a product has no cost, so filling them at its first cost covers
  every case (made-up example: E1 gets ₹5.00 L on 5 Dec → its three empty
  Won sales get ₹5.00 L; changed to ₹6.00 L on 20 Dec → nothing past
  changes; Won on 2 Jan → saves ₹6.00 L) — Basheer, 2026-11-25.
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

Products with no cost in the catalog can't have a margin; the report lists
them (product, number of sales, value sold) and leaves them out of the
margin rather than counting them as zero cost. When the GM enters a
product's first cost, its Won sales without a cost pick it up, marked
"cost filled in later". Trade-ins are shown on a separate line.

Nobody else sees this screen; reps and managers never see cost or margin.

### On a phone

Each row is a block: name on top, then Sold for, Cost, Margin and Margin %
on two short lines. The totals block sits above the rows; period and
group-by boxes stack above that, as on the Sales Report.

## 2. Build order

1. Database: a saved-cost column on each Opportunity product line, filled
   on the move to Won; a one-time fill for Opportunities already Won
   (D12). No reason column (D13a). Applied to Dev; nothing on screen
   changes.
   Then: the catalog's first-cost fill (D16) — on a product's cost going
   from empty to a value, its empty Won sales take it, marked "filled in
   later"; tests for first cost, changed cost and no Won sales.
   Then: the Won/Lost products lock (D13) — server refusal, the reason
   Note (D13a–D13d) and the Products tab change with the reason-only
   pop-up, with tests for every role; the stage-change and first-activity
   modes of the same pop-up re-tested.
2. Server: the margin query and endpoint, GM/Admin only, with tests for
   every role. Nothing on screen changes yet.
3. Screen: the Margin Report and its menu item (GM/Admin), the row click
   into the Pipeline list. Checkpoint commit after each step.

## 3. What could be affected

- Marking an Opportunity Won (Opportunity page status change, and the
  close pop-up): now also saves cost on its product lines. Check before
  and after: Won still saves, revenue and closed date unchanged.
- Product Catalog cost Save (GM/Admin): a product's first cost now also
  fills its empty Won sales (D16). Check before and after: the catalog
  still saves cost and prices as today; a changed cost touches no sale.
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
  plus a marker for D12's later fill (D16 sets the same marker from
  `ProductService.update_product`, and `create_product` needs nothing —
  a new product has no Won sales — when `cost_lakhs` goes NULL → value:
  one UPDATE of `opportunity_item` lines for that product on WON
  Opportunities where `cost_at_won_lakhs IS NULL`); one-time fill from
  `product.cost_lakhs` for lines on WON Opportunities.
- `opportunity/service.py`: stamp `cost_at_won_lakhs` on the first move to
  WON (next to the `closed_at` stamp). `add_item` / `delete_item` /
  `replace_items` on a terminal Opportunity: 403 unless GM/Admin, and a
  required `reason`, saved as a NOTE activity with a generated change
  list (D13a, D13c) through its own route — not `_record_change_note`,
  whose open-own-next-action refusal (service.py:619) must not apply
  (D13d); no next-action fields; an unchanged `replace_items` saves
  nothing and needs no reason (D13b). `replace_items` carries
  `cost_at_won_lakhs` over by product, new lines get today's cost. Not
  added to any Opportunity schema. `ProductsTab` gets status and role to
  hide Edit; `CloseReminderModal` gets a reason-only mode (next to
  `stageChange` / `firstActivity`) opened from its Save.
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
