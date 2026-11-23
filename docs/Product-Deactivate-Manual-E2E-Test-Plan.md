<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Product Deactivate / Reactivate — Manual E2E Test Plan

**Covers:** `docs/Product-Deactivate-Implementation-Plan.md` (Approved 23 Nov 2026, D1–D8).
**Built:** not yet — the parallel Build session builds it (started 23 Nov 2026). Commit
hashes go here after the fact.
**Where:** Dev only. Nothing here runs on UAT; switching off the 13 products on UAT is
done from the screen after the UAT move, outside this plan.

## Checked against live data

Checked read-only on Dev, 23 Nov 2026, with all three RLS settings (user, role, SBU)
set and verified (signed in as Admin Abdul Latheef P; Admin has no SBU). Re-run in
P3 just before the E2E.

- **Who sees:** Product Catalog is on the menu for every role except Marketing User
  (`DemoApp.tsx`). Test people: Haroon Sidheeq (General Manager), Abdul Latheef P
  (Admin) — the only two who may deactivate (D1); Nishad K V (Area Manager, Critical
  Care); Vivek (Sales Staff, Critical Care); Basheer K (SBU Manager, Imaging); Marketing
  Test User (Marketing User). Hide-checks: Vivek and Basheer K must see no Deactivate,
  Reactivate or "Show inactive", and no inactive product anywhere (D1, D5).
- **Who can approve:** n/a — there is no approval step; the pop-up warns and the GM
  or Admin can still go ahead (D3).
- **Who can save:** deactivate / reactivate — General Manager and Admin only
  (`CATALOG_WRITE_ROLES`, `ProductCatalogScreen.tsx:32`); Dev has one of each. The
  existing Opportunity line in step 13 — its owner, Nishad K V.
- **Existing values:** 67 products, 62 active, 5 inactive (ECG Cable, EDAN elite V
  Series, EDAN i15, EDAN i20, Siemens USG M/c). **EDAN elite V6 Patient Monitor**
  (Critical Care, model "elite V6", active) is on 3 open Opportunities, all owned by
  Nishad K V: "TEST Baseline" (EMS Hospital) Active, "ICU Monitor" (Al Shifa
  Hospital Perinthalmanna) Active, "New ICU Monitor deal" (Aster DM) On Hold; no
  marketing lead uses it. **SonoScape S50 Elite USG Machine** (Imaging, active) is on
  4 Opportunities: 1 open — "New opportunity for hospital pick" (Al Shifa Hospital
  Perinthalmanna), Active, owner Fazal — and 3 closed: "Test opportunity" (Al Shifa
  Hospital Perinthalmanna) Lost, "usg" (another hospital) Lost, "Test new fastrack
  opportunity from Project 360" (Aster MIMS Calicut) Won. **EDAN i15** and **EDAN
  i20** are both inactive, both on the model "Legacy / Unclassified Product" with no
  other active product on it; each has 1 Converted marketing lead and no
  Opportunity line. Open statuses on Dev: Active, On Hold, Stalled (`is_terminal`
  false); Won and Lost are closed. No Opportunity is Stalled. No waiting (New)
  marketing lead has a product, so P4 creates one.

Button labels and messages below come from the approved plan, because the feature
isn't built yet. **P2 corrects them from the built code before the run.**

## Figures and sources

- 67 products, 62 active, the 5 inactive by name — Dev query, 23 Nov 2026
- Test people, roles and SBUs (12 active users) — Dev query, 23 Nov 2026
- EDAN elite V6's 3 Opportunities, their hospitals, statuses and owner — Dev query,
  23 Nov 2026
- SonoScape S50 Elite's 4 Opportunities (1 Active, 2 Lost, 1 Won), hospitals and
  owners — Dev query, 23 Nov 2026
- EDAN i15 and i20: inactive, model "Legacy / Unclassified Product", 1 Converted lead
  each — Dev query, 23 Nov 2026
- Statuses Active, On Hold, Stalled open; Won, Lost closed; no Stalled Opportunity —
  Dev query, 23 Nov 2026
- 4 waiting (New) marketing leads, all Imaging, none with a product — Dev query, 23 Nov
  2026
- SonoScape S70 USG Machine active, on no Opportunity line — Dev query, 23 Nov 2026
- GM and Admin only may deactivate — plan D1; `ProductCatalogScreen.tsx:32`
- Pop-up wording, "Show inactive", "Inactive" label, refusal on reactivate — plan D3,
  D5, D6 (to be corrected from the code in P2)

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value, Basheer
runs it) or `[Complex: <reason>]`. Basheer runs Complex steps too, from these
instructions; none needs Claude in the browser. Steps are grouped by login. Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in the app.

**Phone:** step 26 is the phone, tablet and laptop look of everything this feature
adds.

**Opportunities:** every Opportunity is named with its hospital in brackets.

**Leaves Dev as it was:** every product switched off here is switched back on in
section F, and the one marketing lead created in P4 is discarded in step 27. The
lead itself stays on Dev as Discarded (leads can't be deleted).

## Pre-flight

- P1. [Simple] Dev backend restarted since the feature's last backend change. —
- P2. [Complex: read code] Claude corrects every button label, pop-up sentence and
  refusal message below from the built code (`ProductCatalogScreen.tsx`,
  `product/service.py`), and the "1 Opportunity / 1 Opportunities" wording for a
  count of one. —
- P3. [Complex: read-only Dev query] Claude re-runs the "Checked against live data"
  query: elite V6 still on the same 3 open Opportunities, S50 Elite still 1 open and
  3 closed, i15 and i20 still inactive, no other active product on "elite V6",
  "S50 Elite" or "Legacy / Unclassified Product". —
- P4. [Complex: setup save] **As Marketing Test User:** create one marketing lead —
  business unit Critical Care, hospital Aster DM, product EDAN elite V6 Patient
  Monitor, assigned to Nishad K V, note "zz E2E Deactivate — waiting lead". Basheer
  clicks, Claude watches. **Expected:** it saves as a waiting (New) lead. —

## A — Before: existing drill-downs (as Haroon Sidheeq, General Manager)

1. [Simple] Product Performance → the row for SonoScape E2 Portable USG Machine →
   open its drill-down. Write down how many Opportunities the list shows.
   **Expected:** a list opens; the count is noted here for step 24. —
2. [Simple] Pipeline Report → open any one stage's drill-down; note which one and its
   count. **Expected:** a list opens; the count is noted here for step 25. —

## B — Switching a product off (as Haroon Sidheeq)

3. [Simple] Product Catalog → open EDAN elite V6 Patient Monitor. **Expected:** a
   Deactivate button next to Edit (D1). —
4. [Simple] Click Deactivate. **Expected:** a pop-up saying "3 open Opportunities and
   1 marketing lead waiting for a decision use this product" (D3, D4: 2 Active + 1 On
   Hold; the P4 lead), with Cancel and Deactivate. —
5. [Complex: cross-screen] In the pop-up, click "3 open Opportunities".
   **Expected:** the Opportunity Pipeline list opens showing exactly 3: "TEST
   Baseline" (EMS Hospital), "ICU Monitor" (Al Shifa Hospital Perinthalmanna) and
   "New ICU Monitor deal" (Aster DM) — the On Hold one included (D4). The count
   matches the pop-up. —
6. [Simple] Go back to the product, click Deactivate again, then Cancel.
   **Expected:** nothing changes; the product is still active. —
7. [Simple] Click Deactivate, then Deactivate in the pop-up. **Expected:** success;
   the product leaves the catalog list (default view hides inactive, D5). —
8. [Simple] Product Catalog → open SonoScape S50 Elite USG Machine → Deactivate.
   **Expected:** the pop-up says "1 open Opportunity and 0 marketing leads…" — the 2
   Lost and 1 Won are **not** counted (D4). —
9. [Complex: cross-screen] Click "1 open Opportunity". **Expected:** the list shows
   only "New opportunity for hospital pick" (Al Shifa Hospital Perinthalmanna); not
   "Test opportunity" (Al Shifa), "usg" (another hospital) or "Test new fastrack
   opportunity from Project 360" (Aster MIMS Calicut). —
10. [Simple] Back to S50 Elite → Deactivate → confirm. **Expected:** success; it
    leaves the list. —
11. [Simple] Click "Show inactive". **Expected:** EDAN elite V6 and S50 Elite now
    appear dimmed with an "Inactive" label and a Reactivate button, along with the 5
    that were already inactive (7 inactive in all). —

## C — Who no longer sees it (as Nishad K V, Area Manager, Critical Care)

12. [Complex: five screens] Look for EDAN elite V6 in each place a product is
    picked: (a) "TEST Baseline" (EMS Hospital) → add a product line; (b) Quick Lead;
    (c) Customer 360 → Aster DM → wherever a product is picked; (d) Product Catalog
    list. Do not save anything. **Expected:** elite V6 appears in none of them; other
    Critical Care products (e.g. any EDAN monitor still active) still appear. —
13. [Complex: save] Open "TEST Baseline" (EMS Hospital). Its elite V6 line still
    shows name, price and quantity. Change that line's quantity by 1, save, then put
    it back and save again. Basheer clicks, Claude watches. **Expected:** both saves
    succeed; the line keeps elite V6 (D2). —
14. [Simple] Open "New ICU Monitor deal" (Aster DM). **Expected:** the elite V6 line
    still shows, unchanged (D2). —
15. [Simple] Product Catalog. **Expected:** no "Show inactive" button, no Deactivate
    button on any product (D1, D5). —

## D — Hide-checks (as Vivek, Sales Staff, Critical Care; then Basheer K, SBU Manager, Imaging)

16. [Simple] As Vivek: Product Catalog. **Expected:** no "Show inactive"; elite V6
    not listed; opening any product shows no Deactivate (D1, D5). —
17. [Simple] As Vivek: Quick Lead → product list. **Expected:** no elite V6. —
18. [Simple] As Basheer K: Product Catalog. **Expected:** no "Show inactive"; S50
    Elite not listed; opening SonoScape S70 USG Machine shows no Deactivate (D1). —
19. [Simple] As Basheer K: Quick Lead → product list. **Expected:** no S50 Elite;
    S70 still there. —

## E — Marketing lead picker (as Marketing Test User)

20. [Simple] Start a new marketing lead for Critical Care (don't save) → product
    list. **Expected:** no elite V6. Cancel. —

## F — Switching back on, and the refusal (as Abdul Latheef P, Admin)

21. [Simple] Product Catalog → "Show inactive" → EDAN i15 → Reactivate.
    **Expected:** success; i15 is active (no other active product on its model). —
22. [Simple] "Show inactive" → EDAN i20 → Reactivate. **Expected:** refused with
    the plain message that another active product already exists for the same model
    (D6); i20 stays inactive. —
23. [Simple] Open EDAN i15 → Deactivate. **Expected:** the pop-up says "0 open
    Opportunities and 0 marketing leads…" — its Converted lead is **not** counted
    (D4). Confirm. i15 is inactive again. —
24. [Simple] Reactivate SonoScape S50 Elite USG Machine and EDAN elite V6 Patient
    Monitor. Then Product Performance → SonoScape E2 drill-down. **Expected:** both
    are active again and back in the default list; the E2 count equals step 1's. —
25. [Simple] Pipeline Report → the same stage drill as step 2. **Expected:** same
    count as step 2. —

## G — Look on phone, tablet and laptop; tidy-up

26. [Complex: phone layout] At 390, 768 and 1280 px, still as Abdul Latheef P: Product
    Catalog with "Show inactive" on and off (the button wraps under the business-unit
    filters on a phone), one inactive product's page (dimmed, "Inactive" label,
    Reactivate), one active product's page (Deactivate beside Edit), and the
    Deactivate pop-up for elite V6 (switch it off, look, Cancel). Every row opened.
    **Expected:** as the plan's "On a phone" says; nothing runs past its card. —
27. [Complex: setup save] **As Nishad K V:** discard the P4 lead ("zz E2E Deactivate
    — waiting lead", Aster DM) with reason Junk. Basheer clicks, Claude watches.
    **Expected:** it leaves the waiting list. —
