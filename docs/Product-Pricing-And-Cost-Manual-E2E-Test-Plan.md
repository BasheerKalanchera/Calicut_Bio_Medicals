<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Product Pricing and Cost — Manual E2E Test Plan

**Covers:** `docs/Product-Pricing-And-Cost-Implementation-Plan.md`.
**Built:** not built yet — this plan was written ahead of the build (Plan &
Chore, 18 Nov 2026). Commit hashes are filled in after the build.
**Where:** Dev. Section F (loading Haroon's sheet) runs on Dev only; the UAT
load is a separate step with its own yes (UAT rule).

## Checked against live data

Checked read-only on Dev, 18 Nov 2026, with all three RLS settings (user,
role, SBU) set and verified (signed in as Admin Abdul Latheef P; Admin has
no SBU). Re-run in P4 just before the E2E.

- **Who sees:** Product Catalog is on the menu for every role except
  Marketing User (Admin/GM under Administration, everyone else under Sales
  Execution — `DemoApp.tsx`). Test people: Fahad (Sales Staff, Imaging,
  Mangalore, manager Fazal); Fazal (Area Manager, Imaging, manager Haroon
  Sidheeq); Basheer K (SBU Manager, Imaging); Haroon Sidheeq (General
  Manager); Abdul Latheef P (Admin); Marketing Test User (Marketing User).
  Imaging has 19 active products of 20; all 19 SonoScape products are
  Imaging and active.
- **Who can approve:** n/a — there is no approval step; a price below the
  lowest shows a warning and still saves (D5).
- **Who can save:** prices and cost — General Manager and Admin only
  (`ProductCatalogScreen.tsx:30`); Dev has one of each, Haroon Sidheeq and
  Abdul Latheef P. Opportunity lines — the owner: Fahad owns 6 open
  Imaging Opportunities, Fazal 8.
- **Existing values:** no product has a price or cost field yet (feature
  not built). SonoScape S70 USG Machine is on no open Opportunity line.
  "Test one more direct Opportunity" (EMS Hospital), owner Fahad:
  Negotiation, Active, one line — SonoScape E2 Portable USG Machine ×1 at
  ₹3.00L, discount 0. "New USG msg" (Aster MIMS Calicut), owner Fazal:
  Lead, Active, one line — SonoScape HD-550 Endoscopy ×1 at ₹20.00L.

Button labels, messages and the order of checks below come from the plan's
wording, because the code doesn't exist yet. P3 re-reads the built code and
corrects every **Expected** before the first step runs.

## Figures and sources

- Test people, roles, SBUs, managers — Dev query, 18 Nov 2026
- 19 active Imaging products of 20; 43 active Critical Care of 47 — Dev
  query, 18 Nov 2026
- 19 SonoScape products, all Imaging, all active — Dev query, 18 Nov 2026
- Fahad owns 6 open Opportunities, Fazal 8 — Dev query, 18 Nov 2026,
  counted from its output
- "Test one more direct Opportunity" (EMS Hospital) and "New USG msg"
  (Aster MIMS Calicut), their stages and lines — Dev query, 18 Nov 2026
- Who can edit the catalog (General Manager, Admin) —
  `ProductCatalogScreen.tsx:30`, read 18 Nov 2026
- Product Catalog's menu place per role; Marketing User has none —
  `DemoApp.tsx:50-125`, read 18 Nov 2026
- Opportunity line boxes "Qty", "Price ₹L", "Disc ₹L" and "+ Add Product" —
  `OpportunityItemAddRow.tsx:139-158`, read 18 Nov 2026
- SonoScape S70 prices typed in for the test: full ₹35L, rep's lowest
  ₹33L, Area Manager's lowest ₹31L, Haroon's lowest ₹29L, cost ₹24L,
  margin ₹11L — made-up example (the plan's own)
- Typed prices ₹34L, ₹32L, ₹30L and discount ₹2L — made-up test values
- Wording "Full ₹35L · your lowest ₹33L", "Below your lowest (₹33L) — get
  your Area Manager's approval", "Full ₹35L · Cost ₹24L · Margin ₹11L" —
  the plan, section 1 (to be checked against the code in P3)

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]`. Basheer runs Complex steps too,
from exact instructions; a step Claude drives in the browser says so —
`[Complex: Claude — <reason>]` — only where the screen can't show the
answer (what the server sends). Saves to Dev are "Basheer clicks, Claude
watches"; Claude reads the record back in the app.

**Phone:** every screen, card and pop-up the feature changes has its own
`[Complex: phone layout]` step, run by Basheer at 390, 768 and 1280 px.

**Opportunities:** every step that names an Opportunity puts its hospital
beside it in brackets. This test creates no Opportunity.

## Pre-flight

- P1. [Simple] Dev backend restarted since the feature's last backend change. —
- P2. [Simple] Basheer runs `! cmd //c "cd /d C:\Users\Basheer\GitHub\Calicut_Bio_Medicals\backend && .venv\Scripts\alembic.exe current"`. **Expected:** the pricing migration's number with `(head)`; `docs/Physical-Schema.sql` regenerated since it (Claude checks git). —
- P3. [Complex: re-read the built code] Claude reads the built screens and server code and corrects every **Expected** below: section and box names in the pop-up, the price line and warning wording, what shows for a product with no prices, and the answer to the plan's open question (is the lowest compared before or after the line's discount — step 22). —
- P4. [Complex: Dev check, announced first] Claude re-runs the read-only Dev check: Fahad still Sales Staff under Fazal; SonoScape S70 USG Machine still active and on no Opportunity line; "Test one more direct Opportunity" (EMS Hospital) still open with its one E2 line at ₹3.00L. —
- P5. [Simple] Basheer can sign in on Dev as Haroon Sidheeq, Abdul Latheef P, Fahad, Fazal, Basheer K and Marketing Test User, one at a time. —

## A — GM and Admin type in prices (Product Catalog)

1. [Simple] As Haroon Sidheeq: Product Catalog → SonoScape S70 USG Machine → Edit. **Expected:** the "Edit Product" pop-up has a "Prices" section with five boxes — Full price, Rep's lowest, Area Manager's lowest, Haroon's lowest, Cost — and Margin under Cost, read only. —
2. [Complex: save to Dev — Basheer clicks, Claude watches] Type 35, 33, 31, 29 and 24 in those five boxes. **Expected:** Margin shows ₹11L before saving. Save, then open Edit again. **Expected:** all five values kept, Margin ₹11L. —
3. [Simple] Still as Haroon, back on the Product Catalog list. **Expected:** the S70 block shows "Full ₹35L · Cost ₹24L · Margin ₹11L". —
4. [Simple] Same list, the SonoScape S80 USG Machine block (no prices typed). **Expected:** no price line, or the empty form P3 found in the code; no error. —
5. [Simple] Still as Haroon, open the S70 product page (not the pop-up). **Expected:** full price and all four lowest prices (₹35L, ₹33L, ₹31L, ₹29L). —
6. [Complex: cross-role] Sign in as Abdul Latheef P (Admin). Product Catalog → S70 → Edit. **Expected:** the same "Prices" section with the five values, editable. Close without saving. The list shows the same S70 line as step 3. —
7. [Complex: phone layout] As Haroon, phone width: Product Catalog → S70 → Edit, scroll the whole pop-up. **Expected:** one box per row in "Prices", Margin under Cost; nothing runs past the pop-up; Save reachable. —
8. [Complex: phone layout] As Haroon, phone width: the Product Catalog list, S70 block. **Expected:** "Full ₹35L · Cost ₹24L · Margin ₹11L" fits on the card (wraps, never runs past it). —

## B — What each person sees on one product's page

9. [Simple] Sign in as Fahad. Product Catalog (under Sales Execution). **Expected:** no prices anywhere on the list, including the S70 block. —
10. [Simple] Fahad opens SonoScape S70 USG Machine. **Expected:** under the name, "Full ₹35L · your lowest ₹33L"; no Edit button. —
11. [Simple] Hide check, same page as Fahad. **Expected:** ₹31L, ₹29L and ₹24L appear nowhere; no word "Cost" or "Margin". —
12. [Simple] Sign in as Fazal, open S70. **Expected:** "Full ₹35L · your lowest ₹31L"; ₹33L, ₹29L and ₹24L nowhere. —
13. [Simple] Sign in as Basheer K (SBU Manager), open S70. **Expected:** "Full ₹35L" with the Area Manager's lowest ₹31L (D3); ₹33L, ₹29L and ₹24L nowhere. —
14. [Complex: Claude — reading what the server sends] As Fahad, Claude reads what the server sends for the catalog list and for the S70 page. **Expected:** the list carries no price or cost for any product; the S70 page carries only the full price and the rep's lowest — no Area Manager's or Haroon's lowest, no cost. Repeat as Fazal: only full price and Area Manager's lowest. —
15. [Complex: phone layout] As Fahad, phone width: Product Catalog → S70 page. **Expected:** the price line sits under the product name and fits on the screen. —

## C — The price line on an Opportunity

16. [Simple] As Fahad: Opportunity Pipeline → "Test one more direct Opportunity" (EMS Hospital) → edit its products. In the add row, pick SonoScape S70 USG Machine. **Expected:** under the product picker, the grey line "Full ₹35L · your lowest ₹33L"; the existing E2 line at ₹3L unchanged. —
17. [Simple] Type 34 in "Price ₹L". **Expected:** no warning. —
18. [Simple] Change it to 32. **Expected:** an orange line under the Price box: "Below your lowest (₹33L) — get your Area Manager's approval". —
19. [Complex: save to Dev — Basheer clicks, Claude watches] With 32 still typed, click "+ Add Product", then save the Opportunity. **Expected:** saved, no block; reopening shows the S70 line at ₹32L and the Opportunity's value now includes both lines (₹3L + ₹32L). —
20. [Complex: multi-step] Edit the products again; on the saved S70 line, look at its price. **Expected:** the same grey line and orange warning as steps 16 and 18 (D4: shown when a line is edited). Change the price to 33. **Expected:** the warning goes. Cancel without saving. —
21. [Simple] Hide check, whole Opportunity screen as Fahad. **Expected:** ₹31L, ₹29L and ₹24L appear nowhere; no "Cost" or "Margin". —
22. [Complex: discount rule] Edit the S70 line: price 34, discount 2. **Expected:** warning shown or not as P3 found (the plan's addendum compares 34 − 2 = ₹32L, below ₹33L, so a warning). Cancel without saving. —
23. [Complex: cross-role] Sign in as Fazal: "New USG msg" (Aster MIMS Calicut) → edit its products → pick S70. **Expected:** "Full ₹35L · your lowest ₹31L". Type 32: no warning. Type 30: a warning naming ₹31L (wording from P3). Cancel; nothing saved. —
24. [Complex: phone layout] As Fahad, phone width: "Test one more direct Opportunity" (EMS Hospital) → edit products → pick S70 and type 32. **Expected:** the grey line under the picker and the orange warning under the Price box both fit; Qty, Price ₹L and Disc ₹L still on one row or wrapped cleanly. —

## D — Screens that must not start showing prices

25. [Simple] As Fahad, open the Quick Lead pop-up and its product picker. **Expected:** product names only, no prices. Close without saving. —
26. [Simple] Sign in as Marketing Test User. **Expected:** no Product Catalog on the menu. Open the Marketing Lead create pop-up's product picker. **Expected:** no prices. Close without saving. —
27. [Simple] As Fahad: Customer 360 for EMS Hospital — the Opportunity card and the installed-equipment product picker. **Expected:** no prices or cost anywhere. —
28. [Complex: Claude — reading what the server sends] As Fahad, Claude reads what the server sends for "Test one more direct Opportunity" (EMS Hospital) — which now holds the S70 line — and for EMS Hospital's customer page. **Expected:** the product details inside carry no price or cost fields. —

## E — Clean-up

29. [Complex: save to Dev — Basheer clicks, Claude watches] As Fahad: "Test one more direct Opportunity" (EMS Hospital) → edit products → remove the S70 line → save. **Expected:** only the E2 line at ₹3L left; value back to ₹3L. The S70 test prices stay until section F overwrites them. —

## F — Loading Haroon's sheet (after the sheet arrives)

30. [Complex: script run on Dev, shown first] Claude shows what the one-off load will change — how many products get prices, and every sheet row that matches no product — and waits for Basheer's yes before it runs on Dev. **Expected:** products priced = matched sheet rows; unmatched rows listed, none loaded. —
31. [Simple] As Haroon: open three products Basheer picks from the paper sheet. **Expected:** all four prices on each page match the sheet. —
32. [Simple] As Fahad: open one of those three. **Expected:** the full price and the rep's lowest match the sheet; nothing else. —
