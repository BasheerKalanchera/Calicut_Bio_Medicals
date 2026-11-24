<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Product Pricing and Cost — Manual E2E Test Plan

**Covers:** `docs/Product-Pricing-And-Cost-Implementation-Plan.md`.
**Built:** steps 1–3 (Build session, 18 Nov 2026; merged to `main` as `ebd3bdd`, 19 Nov):
`ed987f4` (server side), `060eb3d` (Add/Edit Product pop-ups and the list
line), `8ff9e20` (price line and warning on Opportunity lines and in the New
Opportunity pop-up; Prices card on one product's page). Pre-E2E review fixes:
`82cafba` (price order checked on save, plan D15) and `b52c881` (product names
bold again on the Opportunity edit-products list). Step 4 (loading Haroon's
sheet, section F) is not built; it waits for the sheet. **On Dev since 19 Nov:**
merged to `main` and migration 0066 applied (`alembic current` = 0066), so
prices can be typed in; none are set yet.
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
  (`ProductCatalogScreen.tsx:32`); Dev has one of each, Haroon Sidheeq and
  Abdul Latheef P. Opportunity lines — the owner: Fahad owns 6 open
  Imaging Opportunities, Fazal 8.
- **Existing values:** no product has a price or cost field yet (migration
  0066 not applied to Dev). SonoScape S70 USG Machine is on no open
  Opportunity line. "Test one more direct Opportunity" (EMS Hospital), owner
  Fahad: Negotiation, Active, one line — SonoScape E2 Portable USG Machine ×1
  at ₹3.00L, discount 0. "New USG msg" (Aster MIMS Calicut), owner Fazal:
  Lead, Active, one line — SonoScape HD-550 Endoscopy ×1 at ₹20.00L.
- **P4 (Dev, read-only, 19 Nov 2026, same RLS check):** EMS Hospital has no
  project at all, Fahad has no unconverted Marketing Lead, and his 3 open next
  actions all sit on an Opportunity. Steps 24d–24f therefore use existing data
  and other logins (Basheer, 19 Nov): 24d — Fahad opens "Test Project"
  ("another hospital", Active, owner Basheer K; Fahad can open 20 projects); 24e —
  Fazal's own unconverted lead (hospital "aster", note "Testing unviewed
  Marketing leads by SBU manager…"; the Convert button shows only on leads
  assigned to the person signed in, `MarketingLeadReviewQueueScreen.tsx:67`);
  24f — Basheer K's open next action "zz E2E HR A4 follow-up" (Aster MIMS
  Calicut, no project, no Opportunity). Nothing is created. S70 still active,
  on no line, all 67 products without prices; the EMS and Aster Opportunities
  unchanged since 18 Nov.

Button labels, messages and the order of checks below were corrected from the
built code on 18 Nov 2026 (P3 done).

## Figures and sources

- Test people, roles, SBUs, managers — Dev query, 18 Nov 2026
- 19 active Imaging products of 20; 43 active Critical Care of 47 — Dev
  query, 18 Nov 2026
- 19 SonoScape products, all Imaging, all active — Dev query, 18 Nov 2026
- Fahad owns 6 open Opportunities, Fazal 8 — Dev query, 18 Nov 2026,
  counted from its output
- "Test one more direct Opportunity" (EMS Hospital) and "New USG msg"
  (Aster MIMS Calicut), their stages and lines — Dev query, 18 Nov 2026
- 20 projects Fahad can open, "Test Project" ("another hospital"), the 4
  unconverted Marketing Leads (Fazal, Basheer K, Shruthi, Rudrappa), Basheer
  K's next action "zz E2E HR A4 follow-up" (no project, no Opportunity), 0 of
  67 products priced — Dev query (P4), 19 Nov 2026, counted from its output
- Who can edit the catalog (General Manager, Admin) —
  `ProductCatalogScreen.tsx:30`, read 18 Nov 2026
- Product Catalog's menu place per role; Marketing User has none —
  `DemoApp.tsx:50-125`, read 18 Nov 2026
- Opportunity line boxes "Qty", "Price ₹L", "Disc ₹L" and "+ Add Product";
  the price line and warning sit under that row — `OpportunityItemAddRow.tsx`
  and `OpportunityItemsList.tsx`, read 18 Nov 2026
- SonoScape S70 prices typed in for the test: full ₹35L, rep's lowest
  ₹33L, Area Manager's lowest ₹31L, CEO's lowest ₹29L, cost ₹24L —
  made-up example (the plan's own)
- Typed prices ₹34L, ₹32L, ₹30L, ₹28L, ₹36L and discount ₹2L — made-up test
  values
- Wording on screen: "Full ₹35L · your lowest ₹33L" (General Manager and Admin:
  "Full ₹35L · lowest ₹29L"; Basheer K: "Full ₹35L · Area Manager's lowest
  ₹31L"); orange warning "Below your lowest (₹33L)" (General Manager and Admin: "Below
  the lowest (₹29L)"); list line "Full ₹35L · Cost ₹24L"; Prices card rows —
  `ProductPriceNote.tsx`, `productPrices.ts`, `ProductCatalogScreen.tsx`, read
  18 Nov 2026. No margin and no "approval" text are shown anywhere (plan D9
  and D5, Basheer 18 Nov).
- Price-order refusal messages — `backend/app/domains/product/service.py` and
  `checkPrices` in `ProductCatalogScreen.tsx`, read 18 Nov 2026 (plan D15)
- The five places that open the New Opportunity pop-up: header "+ Lead"
  (`DemoApp.tsx`), Customer 360 → Opportunities tab → "+ Add"
  (`Customer360Screen.tsx`), a project's page → Opportunities tab → "+ Add"
  (`ProjectDirectoryScreen.tsx`), Marketing Lead Queue → "Convert"
  (`MarketingLeadReviewQueueScreen.tsx`), and the Close Reminder pop-up's
  "This visit produced a new Opportunity" tick-box
  (`CloseReminderModal.tsx`) — read 18 Nov 2026

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]`. Basheer runs Complex steps too,
from exact instructions; a step Claude drives in the browser says so —
`[Complex: Claude — <reason>]` — only where the screen can't show the
answer (what the server sends). Saves to Dev are "Basheer clicks, Claude
watches"; Claude reads the record back in the app.

**Phone:** every screen, card and pop-up the feature changes has its own
`[Complex: phone layout]` step, run by Basheer at 390, 768 and 1280 px.

**Opportunities:** every step that names an Opportunity puts its hospital
beside it in brackets. This test saves no new Opportunity: the steps that
open the New Opportunity pop-up (24b–24f) close it without saving.

## Pre-flight

- P1. [Simple] Dev backend restarted since the feature's last backend change. — Done 19 Nov 2026 (Build session; result written in 23 Nov, Basheer).
- P2. [Simple] Basheer runs `! cmd //c "cd /d C:\Users\Basheer\GitHub\Calicut_Bio_Medicals\backend && .venv\Scripts\alembic.exe current"`. **Expected:** the pricing migration's number (0066) with `(head)`; `docs/Physical-Schema.sql` regenerated since it (Claude checks git). — Done 19 Nov 2026 (Build session: `alembic current` = 0066, schema file `290386a`; result written in 23 Nov, Basheer).
- P3. [Complex: re-read the built code] Done 18 Nov 2026 (Build session): box and card names, the price line and warning wording, the empty list line, the discount rule (step 22 settled) and the five New Opportunity entry points are taken from the built code below. —
- P4. [Complex: Dev check, announced first] Claude re-runs the read-only Dev check: Fahad still Sales Staff under Fazal; SonoScape S70 USG Machine still active and on no Opportunity line; "Test one more direct Opportunity" (EMS Hospital) still open with its one E2 line at ₹3.00L. Also finds, for steps 24d–24f: a project Fahad can open, an unconverted Marketing Lead and an open next action with no Opportunity. Claude names each; if one is missing, that step is blocked and Basheer decides (Claude creates no data). **Done 19 Nov 2026:** all checks as expected except the three records above, which were missing for Fahad at EMS Hospital; Basheer approved the substitutes named under "Checked against live data". —
- P5. [Simple] Basheer can sign in on Dev as Haroon Sidheeq, Abdul Latheef P, Fahad, Fazal, Basheer K and Marketing Test User, one at a time. — Done 19 Nov 2026 (Build session; result written in 23 Nov, Basheer).

## A — GM and Admin type in prices (Product Catalog)

1. [Simple] As Haroon Sidheeq: Product Catalog → SonoScape S70 USG Machine → Edit. **Expected:** the "Edit Product" pop-up has a "Prices" section ("In ₹ Lakhs, up to 2 decimals. Leave a box empty if not set.") with five boxes — Full price, Rep's lowest, Area Manager's lowest, CEO's lowest, Cost — and no Margin anywhere in the pop-up. — **Pass** (Basheer, 19 Nov, on the old label "Haroon's lowest"; renamed "CEO's lowest" 19 Nov; re-check **Pass**, Basheer, 19 Nov)
1b. [Simple] Still as Haroon, close that pop-up without saving. On the Product Catalog list press "+ Add" (the "Add Product" pop-up). **Expected:** the same "Prices" section with the same five empty boxes. Close without adding a product. — **Pass** (Basheer, 19 Nov)
2. [Complex: save to Dev — Basheer clicks, Claude watches] Reopen S70 → Edit. Type 35, 33, 31, 29 and 24 in those five boxes. Save, then open Edit again. **Expected:** all five values kept. — **Pass** (Basheer, 19 Nov; read back by reopening Edit)
3. [Simple] Still as Haroon, back on the Product Catalog list. **Expected:** the S70 block shows "Full ₹35L · Cost ₹24L" and no margin. — **Pass** (Basheer, 19 Nov)
4. [Simple] Same list, the SonoScape S80 USG Machine block (no prices typed). **Expected:** no price line under it; no error. — **Pass** (Basheer, 19 Nov)
5. [Simple] Still as Haroon, open the S70 product page (not the pop-up). **Expected:** a "Prices" card (between Product Details and Collateral Links) with five rows — Full price ₹35L, Rep's lowest ₹33L, Area Manager's lowest ₹31L, CEO's lowest ₹29L, Cost ₹24L. — **Pass** (Basheer, 19 Nov, on the old label "Haroon's lowest"; renamed "CEO's lowest" 19 Nov; re-check **Pass**, Basheer, 19 Nov)
6. [Complex: cross-role] Sign in as Abdul Latheef P (Admin). Product Catalog → S70 → Edit. **Expected:** the same "Prices" section with the five values, editable. Close without saving. The list shows the same S70 line as step 3. — **Pass** (Basheer, 19 Nov)
7. [Complex: phone layout] As Haroon, phone width: Product Catalog → S70 → Edit, scroll the whole pop-up; then the "+ Add" pop-up. **Expected:** one box per row in "Prices"; nothing runs past the pop-up; Save reachable. — **Pass** (Basheer, 19 Nov)
8. [Complex: phone layout] As Haroon, phone width: the Product Catalog list, S70 block, and the S70 page's "Prices" card. **Expected:** "Full ₹35L · Cost ₹24L" fits on the card (wraps, never runs past it); the "Prices" card fits the screen. — **Pass** (Basheer, 19 Nov)
8b. [Simple] As Haroon: S70 → Edit. Type 36 in Rep's lowest (more than Full price 35). Save. **Expected:** refused in the pop-up with "Rep's lowest can't be more than Full price"; nothing saved. Close the pop-up. — **Pass** (Basheer, 19 Nov)
8c. [Simple] S70 → Edit. Type 34 in Area Manager's lowest (more than Rep's 33). Save. **Expected:** refused with "Area Manager's lowest can't be more than Rep's lowest". Close. — **Pass** (Basheer, 19 Nov)
8d. [Simple] S70 → Edit. Type 32 in CEO's lowest (more than Area Manager's 31). Save. **Expected:** refused with "CEO's lowest can't be more than Area Manager's lowest". Close. — **Pass** (Basheer, 19 Nov, on the old wording "Haroon's lowest"; renamed 19 Nov; re-run **Pass**, Basheer, 19 Nov)
8e. [Simple] S70 → Edit. Type 30 in Cost (more than the CEO's 29). Save. **Expected:** refused with "Cost can't be more than CEO's lowest". Close. — **Pass** (Basheer, 19 Nov, on the old wording "Haroon's lowest"; renamed 19 Nov; re-run **Pass**, Basheer, 19 Nov)
8f. [Simple] S70 → Edit. Empty only the Rep's lowest box. Save. **Expected:** refused with "Enter all three lowest prices (Rep's, Area Manager's and CEO's), or leave all three blank". Close. — **Pass** (Basheer, 19 Nov, on the old wording "Haroon's"; renamed 19 Nov; re-run **Pass**, Basheer, 19 Nov)
8g. [Simple] S70 → Edit. Empty only the Full price box. Save. **Expected:** refused with "Enter the Full price too, the lowest prices need it". Close. — **Pass** (Basheer, 19 Nov)
8h. [Complex: save to Dev — Basheer clicks, Claude watches] S70 → Edit. Type 29 in Cost (equal to the CEO's lowest 29). Save. **Expected:** saved (equal is allowed). Edit again, put Cost back to 24, save. **Expected:** the S70 page shows Cost ₹24L. — **Pass** (Basheer, 19 Nov)
8i. [Complex: Claude — reading what the server sends] After 8b–8g Claude reads S70 as Haroon. **Expected:** still 35 / 33 / 31 / 29 / 24 — none of the refused saves changed anything. — **Pass** (Claude, 19 Nov, read-only through `scripts/query_audit.py` as Haroon Sidheeq: 35.00 / 33.00 / 31.00 / 29.00 / 24.00)

## B — What each person sees on one product's page

9. [Simple] Sign in as Fahad. Product Catalog (under Sales Execution). **Expected:** no prices anywhere on the list, including the S70 block. — **Pass** (Basheer, 19 Nov)
10. [Simple] Fahad opens SonoScape S70 USG Machine. **Expected:** a "Prices" card (between Product Details and Collateral Links) with two rows — Full price ₹35L and Your lowest ₹33L; no Edit button. — **Pass** (Basheer, 19 Nov)
11. [Simple] Hide check, same page as Fahad. **Expected:** ₹31L, ₹29L and ₹24L appear nowhere; no word "Cost" or "Margin". — **Pass** (Basheer, 19 Nov)
12. [Simple] Sign in as Fazal, open S70. **Expected:** the "Prices" card shows Full price ₹35L and Your lowest ₹31L; ₹33L, ₹29L and ₹24L nowhere. — **Pass** (Basheer, 19 Nov)
13. [Simple] Sign in as Basheer K (SBU Manager), open S70. **Expected:** the "Prices" card shows Full price ₹35L and Area Manager's lowest ₹31L (D3); ₹33L, ₹29L and ₹24L nowhere. — **Pass** (Basheer, 19 Nov)
14. [Complex: Claude — reading what the server sends] As Fahad, Claude reads what the server sends for the catalog list and for the S70 page. **Expected:** the list carries no price or cost for any product; the S70 page carries only the full price and the rep's lowest — no Area Manager's or CEO's lowest, no cost. Repeat as Fazal: only full price and Area Manager's lowest. — **Pass** (Claude, 19 Nov, read-only through `scripts/query_audit.py`: first 50 products and S70's own list row carry `prices` = null for both; S70 page — Fahad 35.00 / 33.00 only, Fazal 35.00 / 31.00 only)
15. [Complex: phone layout] As Fahad, phone width: Product Catalog → S70 page. **Expected:** the "Prices" card fits the screen. — **Pass** (Basheer, 19 Nov)

## C — The price line on an Opportunity

16. [Simple] As Fahad: Opportunity Pipeline → "Test one more direct Opportunity" (EMS Hospital) → edit its products. In the add row, pick SonoScape S70 USG Machine. **Expected:** under the Qty / Price ₹L / Disc ₹L row, the grey line "Full ₹35L · your lowest ₹33L"; the existing E2 line at ₹3L unchanged. — **Pass** (Basheer, 19 Nov)
17. [Simple] Type 34 in "Price ₹L". **Expected:** no warning. — **Pass** (Basheer, 19 Nov)
18. [Simple] Change it to 32. **Expected:** an orange warning under the same row: "Below your lowest (₹33L)" (no word about approval). — **Pass** (Basheer, 19 Nov)
19. [Complex: save to Dev — Basheer clicks, Claude watches] With 32 still typed, click "+ Add Product", then save the Opportunity. **Expected:** saved, no block; reopening shows the S70 line at ₹32L and the Opportunity's value now includes both lines (₹3L + ₹32L). — **Pass** (Basheer saved, 19 Nov; Claude read it back as Fahad, read-only: S70 line 32.00, E2 line 3.00, value 35.00)
20. [Complex: multi-step] Edit the products again; on the saved S70 line, look under its Qty / Price / Disc row. **Expected:** the same grey line and orange warning as steps 16 and 18 (D4: shown when a line is edited); the product name on the line is bold. Change the price to 33. **Expected:** the warning goes. Cancel without saving. — **Pass** (Basheer, 19 Nov)
21. [Simple] Hide check, whole Opportunity screen as Fahad. **Expected:** ₹31L, ₹29L and ₹24L appear nowhere; no "Cost" or "Margin". — **Pass** (Basheer, 19 Nov)
22. [Complex: discount rule] Edit the S70 line: price 34, discount 2. **Expected:** the warning shows (the lowest is compared after the discount: 34 − 2 = ₹32L, below ₹33L; settled 18 Nov, Basheer). Cancel without saving. — **Pass** (Basheer, 19 Nov)
23. [Complex: cross-role] Sign in as Fazal: "New USG msg" (Aster MIMS Calicut) → edit its products → pick S70. **Expected:** "Full ₹35L · your lowest ₹31L". Type 32: no warning. Type 30: "Below your lowest (₹31L)". Cancel; nothing saved. — **Pass** (Basheer, 19 Nov)
23b. [Complex: cross-role] Sign in as Haroon Sidheeq: "New USG msg" (Aster MIMS Calicut) → edit its products → pick S70. **Expected:** "Full ₹35L · lowest ₹29L" (he is warned against the smallest lowest price). Type 30: no warning. Type 28: "Below the lowest (₹29L)". Cancel; nothing saved. — **Pass** (Basheer, 19 Nov)
24. [Complex: phone layout] As Fahad, phone width: "Test one more direct Opportunity" (EMS Hospital) → edit products → pick S70 and type 32. **Expected:** the grey line and the orange warning under the Qty / Price ₹L / Disc ₹L row both fit; the row itself still on one line or wrapped cleanly. — **Pass** (Basheer, 19 Nov)

### The New Opportunity pop-up, from each of its five places

Each step opens the pop-up from a different place, adds products through
"+ Add Products" (the "Products" pop-up), picks S70 and checks the same three
things: the grey line "Full ₹35L · your lowest ₹33L", no warning at 34, the
orange "Below your lowest (₹33L)" at 32. Each closes everything without
saving. 24b–24d as Fahad; 24e as Fazal; 24f as Basheer K (P4, 19 Nov).

24b. [Simple] As Fahad, header "+ Lead" (any screen) → New Opportunity pop-up → "+ Add Products" → pick S70 → the three checks. Close without saving. — **Pass** (Basheer, 19 Nov)
24c. [Simple] Customer 360 for EMS Hospital → Opportunities tab → "+ Add" → New Opportunity pop-up (EMS Hospital already filled in) → "+ Add Products" → pick S70 → the three checks. Close without saving. — **Pass** (Basheer, 19 Nov)
24d. [Simple] As Fahad: the project "Test Project" (another hospital) → its Opportunities tab → "+ Add" → New Opportunity pop-up (hospital and project filled in) → "+ Add Products" → pick S70 → the three checks. Close without saving. — **Pass** (Basheer, 19 Nov)
24e. [Simple] **As Fazal** (the lead is his; wording "Full ₹35L · your lowest ₹31L", no warning at 32, orange "Below your lowest (₹31L)" at 30 — as step 23): Marketing Lead Queue → his lead (hospital "aster", "Testing unviewed Marketing leads by SBU manager…") → "Convert" → New Opportunity pop-up → "+ Add Products" → pick S70 → the three checks. Close without saving. **Expected:** the lead stays unconverted. Best run right after step 23. — **Pass** (Basheer, 19 Nov)
24f. [Complex: multi-step] **As Basheer K** (wording "Full ₹35L · Area Manager's lowest ₹31L"; the warning level is his Area Manager's lowest ₹31L as in step 13 — Basheer reports exactly what shows): his open next action "zz E2E HR A4 follow-up" (Aster MIMS Calicut, no project, no Opportunity) → close it: fill Date and Notes, open the follow-up tab, tick "This visit produced a new Opportunity", press Complete → New Opportunity pop-up → "+ Add Products" → pick S70 → the grey line. Close the pop-up without saving. **Expected:** back on the follow-up tab with "No new Opportunity was saved, so add a follow-up next action to close this one."; the next action stays open (nothing is saved until the Opportunity is saved — `CloseReminderModal.tsx:433-440`, `463-470`). Best run right after step 13. — **Pass** (Basheer, 19 Nov; the warning he saw reads "Below the Area Manager's lowest (₹31L)")

## D — Screens that must not start showing prices

25. [Simple] As Fahad, open the New Opportunity pop-up ("+ Lead") → "+ Add Products" and open the product picker's list. **Expected:** product names only, no prices in the list itself (the grey line appears only after one is picked, step 24b). Close without saving. — **Pass** (Basheer, 19 Nov)
26. [Simple] Sign in as Marketing Test User. **Expected:** no Product Catalog on the menu. Open the Marketing Lead create pop-up's product picker. **Expected:** no prices. Close without saving. — **Pass** (Basheer, 19 Nov)
27. [Simple] As Fahad: Customer 360 for EMS Hospital — the Opportunity card and the installed-equipment product picker. **Expected:** no prices or cost anywhere. — **Pass** (Basheer, 19 Nov)
28. [Complex: Claude — reading what the server sends] As Fahad, Claude reads what the server sends for "Test one more direct Opportunity" (EMS Hospital) — which now holds the S70 line — and for EMS Hospital's customer page. **Expected:** the product details inside carry no price or cost fields. — **Pass** (Claude, 19 Nov, read-only through `scripts/query_audit.py` as Fahad: 17 responses for the Opportunity and EMS Hospital's page, no price, cost, floor or margin field, and no 31.00 / 29.00 / 24.00 anywhere)

## E — Clean-up

29. [Complex: save to Dev — Basheer clicks, Claude watches] As Fahad: "Test one more direct Opportunity" (EMS Hospital) → edit products → remove the S70 line → save. **Expected:** only the E2 line at ₹3L left; value back to ₹3L. The S70 test prices stay until section F overwrites them. — **Pass** (Basheer saved, 19 Nov; Claude read it back as Fahad, read-only: one line, E2 3.00, value 3.00)

## E2 — Bring Dev's catalog in line with UAT (do this once the leadership team's sheet arrives, before step 30)

Why: the price template carries UAT's 71 active product names, and the load matches by exact name. Dev has 55 of them; UAT's catalog changed after about 27 Sep (UAT audit-log read and Dev read, 19 Nov; list and findings in Progress-Archive-2026-11, 19 Nov).

29b. [Complex: UAT read, ask first] Claude reads UAT's brand fiscal-year start months and the descriptions of the 16 changed products, after Basheer's yes. **Expected:** the exact list for the script. — **Pass, 23 Nov 2026** (Plan & Chore; Basheer's yes; one read-only transaction as Admin Abdul Latheef P, settings verified at start and end, rolled back; UAT at 0065). UAT: 73 products (71 active), 17 brands, 27 categories, 73 models. Brands starting their year in April: Aeonmed and AVI Health care (all others January). Of the 12 new products, all have no description; Datascope CS300, Gentherm Hemotherm® CE and Stockert S5 are Refurbished, the other 9 New Equipment. iV15's description is "Modular monitor with 15.6'". UAT still has an unused model "IV6" (no product on it) — not copied to Dev.
29c. [Complex: script on Dev, shown first] Claude shows the exact list: 4 renames, 5 brands, 6 categories, 12 models with their products, the iV15 description and the brand months. Basheer approves and runs it with `!`. **Expected:** Dev has 74 active products and 71 match UAT's names exactly. The 3 Dev-only products and the "E2E Test Brand" stay. — **Pass, 23 Nov 2026** (Basheer ran the dry run, then `--apply`; Problems 0, committed). Also by Basheer's 23 Nov decision: SE-1515 made an Accessory, UAT's descriptions copied onto CX10, BREATHE - i, Servo i and P25 elite CV; Medion's April year start left as is (a Dev test target depends on it); UAT's empty brands We Make and L741 not copied. The script rebuilt the 4 product names itself, because renaming a model or category doesn't rename its products.
29d. [Complex: Claude reads Dev back] Claude re-compares the Dev and UAT names. **Expected:** 71 names match; nothing differs in brand, category, model or type; every product's Opportunity line count is unchanged; "zz NoActivity accessory opp"" (Test customer 3) still has its line. — **Pass, 23 Nov 2026** (fresh read-only Dev read as Admin, rolled back): 74 active, 71 match UAT exactly with no difference in brand, category, model, type or description; products used on Opportunity lines and leads, and their counts, unchanged; the zz product still has its 1 line. Remaining differences are only the agreed ones (Dev's test items, Medion's month, UAT's empty brands and unused IV6 model, inactive legacy products).
29e. [Simple] As Haroon: on the Product Catalog, open EDAN iV15 Patient Monitor, Equipwell Rolling Monitor Stand and Stockert S5 Heart-Lung Machine. **Expected:** each shows the right brand and name, and iV15 shows its description. — **Pass, 23 Nov 2026** (Basheer).

## F — Loading Haroon's sheet (after the sheet arrives)

30. [Complex: script run on Dev, shown first] Claude shows what the one-off load will change — how many products get prices, and every sheet row that matches no product — and waits for Basheer's yes before it runs on Dev. After E2 the sheet's 71 names should all match; any unmatched row is listed. **Expected:** products priced = matched sheet rows; unmatched rows listed, none loaded. — **Pass, 23 Nov 2026** (read-only preview shown; Basheer's yes; Basheer ran `--apply`). Sheet "Cabio Product prices corrected.xlsx": 71 rows, all matched, 0 unmatched; 58 priced, 13 blank left unpriced; S70's E2E test prices replaced by the sheet's; 9 values rounded as D16; Cost untouched; Problems 0; every price read back; Dev now has 58 active products with a full price.
31. [Simple] As Haroon: open three products Basheer picks from the paper sheet. **Expected:** all four prices on each page match the sheet. — **Pass, 23 Nov 2026** (Basheer; SonoScape S70, Aeonmed 7200A, Equipwell Rolling Monitor Stand with the D16 rounding).
32. [Simple] As Fahad: open one of those three. **Expected:** the full price and the rep's lowest match the sheet; nothing else. — **Pass, 23 Nov 2026** (Basheer; SonoScape S70: ₹48L full, ₹37L lowest, nothing else shown).
