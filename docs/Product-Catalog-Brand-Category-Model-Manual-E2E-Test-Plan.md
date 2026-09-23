# Product Catalog Brand/Category/Model — Manual E2E Test Plan

**Feature:** Signed Feature 4.1 core gap — Category/Brand as controlled
pick-lists instead of free text (see `docs/Product-Catalog-Name-Derivation-
Implementation-Plan.md`).

**Scope built:** Product's Add/Edit form now cascades SBU → Brand → Model,
with Category and the Product Name both auto-filled and read-only.
Admin/GM can add a brand-new Brand/Model/Category inline without leaving
the form. Reporting's brand-grouped view now joins the real `Brand` table
instead of normalizing free text.

**Now built (as of 2026-09-22, a parallel session, not yet committed):**
clicking a Product Performance brand card now drills into its deals, same
mechanism as the existing Product/SBU drill-downs (`list_pipeline`/
`count_pipeline` gained a `brand_id` filter,
`backend/app/domains/opportunity/repository.py`). This was previously
"not in scope" for this feature — Section J below now tests it instead of
confirming it stays non-clickable.

**Fixed by three `/code-review` passes before this pass runs (2026-09-22,
not yet committed):**
- **Migration `0050`** — Brand/Model/Category could not be viewed by a
  non-Admin/GM user browsing a product from the *other* SBU (RLS on those
  three tables was SBU-scoped, while `product` itself has always been
  company-wide readable per BR-CAT-01) — this crashed the product detail
  page. Now open-read, matching `product`'s own policy exactly. Step F19
  below is the direct regression test for this fix.
- **`reference/service.py`'s `create_model`** — now rejects a Model whose
  Brand and Category belong to different SBUs (previously silently
  accepted). Step H21 below now expects a clean rejection, not an
  undetermined outcome.
- **Migration `0049`** — added a safety check so the one-time re-seed
  script aborts instead of silently merging two products if an old product
  name ever matches more than one row (relevant when this migration is
  re-run against UAT).
- **`reference/repository.py`** — Brand/Category/Model's three duplicate
  `exists_by_name` checks now share one helper. No behavior change, not
  something to specifically re-test.
- **Migration `0051`** — the internal "Legacy Data" / "Retired /
  Unclassified" placeholder (where old, retired products landed) was
  visible as a normal, pickable Brand/Category/Model — now correctly
  hidden. New regression check added as step 8 below.
- **`reference/service.py`'s `create_brand`/`create_category`** — a
  made-up department id used to crash the server (500); now returns a
  clean "not found" (404), matching how the rest of the app already
  handles this kind of input.
- **`sales-os-app/src/screens/ProductCatalogScreen.tsx`** — the inline
  "+ Add new brand/model/category" forms failed completely silently on
  error (e.g. a duplicate name); they now show the real error message.
  Step C11 below (already in this plan) is the direct test for this.
- **`product/service.py` + migration `0051`'s widened DB trigger** — a
  product's department could drift out of sync with its own Brand/Model
  if only the department field was edited directly; now blocked both by
  the application check and by the database itself.

A third, full review covering the original build and every fix above
together came back clean (no new findings).

**Automated test coverage added, 2026-09-22:**
`backend/tests/domains/reference/test_catalog_admin_service.py` — `Catalog
AdminService` (Brand/Category/Model create) had zero test coverage until
now; 16 new tests cover the Admin/GM-only gate and every rejection path,
including the same-SBU Brand/Category check from `H21` above. (This was
flagged as belonging to a different, actively-edited session's WIP — that
was checked and was incorrect; the code lives entirely in this session's
own changes, confirmed via `git diff`, so there was no collision risk in
writing tests for it directly.)

**Test users needed:** one Admin/GM login (e.g. Haroon), one non-Admin/GM
login (e.g. Vivek or Nishad K V), ideally logins covering both Imaging and
Critical Care to check SBU scoping.

**Known state going in:** a parallel session is fixing the 5 legacy
products left deactivated by the 2026-09-21 data cutover (EDAN i15, EDAN
elite V Series, EDAN i20, ECG Cable, Siemens USG M/c) — step K below
should be (re-)checked against whatever state that thread leaves things in,
not assumed to still match the 2026-09-21 note.

---

## A — Admin/GM: catalog browsing renders correctly — PASSED live 2026-09-22

Tested live as Haroon Sidheeq (General Manager).

1. Log in as Admin/GM, open Product Catalog. — **PASS**
2. Confirm the list shows Brand, Model, and Category chips per product,
   and product names read as "Brand Model Category" for the reseeded
   catalog. — **PASS**
3. Filter by each SBU chip — confirm only that SBU's products show. —
   **PASS** (Imaging chip showed only SonoScape products; Critical Care
   showed EDAN/Aeonmed/etc.)

## B — Admin/GM: Add Product, cascading pickers — PASSED live 2026-09-22

Tested live as Haroon. Steps 4-7 initially hit a real bug (see
`ProductRepository.create()` fix above) — retested clean after the fix.

4. Click "+ Add", pick an SBU, then a Brand, then a Model. — **PASS**
5. Confirm Category fills in automatically (read-only) the moment a Model
   is picked, and confirm the old free-text Product Name field is gone
   entirely. — **PASS**
6. Save — confirm the new product appears in the list with the correct
   auto-generated name. — **PASS** ("EDAN iM90 Test Patient Monitor"
   appeared correctly after the create-path fix)
7. Try saving with no Brand/Model picked — confirm it's blocked with a
   clear message. — **PASS** ("SBU is required" / "Model is required")
8. **Direct regression test for the migration `0051` fix:** in the Brand
   dropdown, confirm "Legacy Data" does not appear as an option (Critical
   Care) — and in the Model "+ Add new model" Category dropdown, confirm
   "Retired / Unclassified" doesn't appear either. Neither should be
   offered as a real choice; before the fix, both showed up normally. —
   **PASS** (checked both dropdowns directly, neither placeholder listed)

## C — Admin/GM: inline "+ Add new brand / model / category"

9. In the Add form, use "+ Add new brand" for a brand that doesn't exist
   yet — confirm it's selectable immediately after creation. — **PASS**,
   tested live by Basheer as Admin/GM, 2026-09-23 — "E2E Test Brand"
   created and selectable immediately (permanent test row in Dev,
   deactivate after the pass)
10. Use "+ Add new model" under an existing brand, including "+ Add new
    category" from inside that same flow — confirm the new model then
    requires a category before it can be added, and behaves identically to
    a pre-existing model afterward. — **PASS**: "+ Add new model"
    confirmed live twice on 2026-09-22 (iM90 Test, iM91 Test, existing
    Category); nested "+ Add new category" path confirmed live by Basheer
    as Admin/GM, 2026-09-23 — "E2E Test Category" created from inside the
    new-model flow under "E2E Test Brand", model required a category
    before it could be added, then behaved like any existing model
    (permanent test rows in Dev, deactivate after the pass).
11. **Direct regression test for the frontend error-handling fix:** try
    adding a brand/category/model name that already exists for that
    SBU/brand — confirm a clear, visible duplicate error appears on the
    form, nothing created twice. Before the fix, this failed completely
    silently with no message at all. — **PASS**, tested live: typing
    "EDAN" into "+ Add new brand" showed "A brand named 'EDAN' already
    exists" immediately, nothing created twice.

## D — Admin/GM: Edit existing product

12. Edit a product, change its Model to a different one under the same
    Brand — confirm Category and Name both update to match. — **PASS**,
    tested live: changed the test product's Model from iM90 Test to a
    newly-added iM91 Test (Category ECG Machine) — title/Category updated
    to "EDAN iM91 Test ECG Machine" correctly, no error (also confirms
    `ProductRepository.update()`'s refresh fix works, not just `create()`).
13. Change its Brand entirely (Model resets) — confirm you must re-pick a
    Model before saving. — **PASS**, tested live by Basheer as Admin/GM,
    2026-09-23 — Model cleared on Brand change, save blocked until a new
    Model was picked. Bonus confirmation: re-picking Aeonmed 7200A (a Model
    that already has its own product) was correctly refused with "A product
    for this Model already exists in the catalog" — the migration `0052`
    one-product-per-Model guard working as designed on the Edit path.

## E — SBU scoping

14. Start an Add-Product flow for Imaging — confirm only Imaging brands
    appear. — **PASS**, tested live by Basheer as Admin/GM, 2026-09-23 —
    only Imaging brands listed, nothing saved.
15. Repeat for Critical Care — confirm only Critical Care brands appear,
    no cross-contamination either direction. — **PASS** (Critical Care
    side confirmed live during Section B/D testing — Aeonmed/AVI/EDAN/etc
    shown, no SonoScape; Imaging side now confirmed by step 14,
    2026-09-23 — full PASS both directions)

## F — Non-Admin/GM role: read-only catalog — PASSED live 2026-09-22

Tested live as Fazal (Area Manager, Kasaragod, SBU: Imaging).

16. Log in as a non-Admin/GM user, open Product Catalog — confirm
    browsing/filtering across both SBUs still works. — **PASS**
17. Open a product detail — confirm no "Edit" button, Brand/Model/Category
    still display correctly. — **PASS**
18. There should be no way to reach an Add-Product form at all for this
    role — confirm the "+ Add" button is absent. — **PASS**
19. **Direct regression test for the migration `0050` fix:** as this same
    non-Admin/GM user, open a product that belongs to the *other* SBU (the
    one you don't belong to). **Expected:** the product detail page opens
    normally, with correct Brand/Model/Category shown — before the fix,
    this crashed. This is the single most important step in this test
    plan; if it fails, stop and report it before continuing. — **PASS** —
    opened "EDAN elite V5 Patient Monitor" (Critical Care) as Fazal
    (Imaging); rendered correctly, Brand/Model/Category all shown, no
    crash.

## G — Server-side gate — PASSED live 2026-09-22

20. As the non-Admin/GM user, attempt a direct `POST /reference/brands`
    (and `/reference/categories`, `/reference/models`) via the browser's
    dev tools or an API client, using that user's own session.
    **Expected:** `403`, nothing created — confirm by re-listing
    afterward. `backend/tests/domains/reference/test_catalog_admin_service.py`
    (added 2026-09-22) now backs this gate at the unit level too — this
    manual step confirms it end-to-end through the real router. — **PASS**
    — tested live as Fazal: all three endpoints returned `403` with the
    role-gate message, and a re-list of both SBUs' brands afterward
    confirmed nothing was created.

## H — Data-integrity edge cases, now fixed — confirm the fixes hold

21. As Admin/GM, attempt to create a Model directly via the API with a
    `brand_id` from one SBU and a `category_id` from the other SBU.
    **Expected:** a clear rejection ("Category must belong to the same
    SBU as the Brand"), nothing created — `create_model` was fixed
    2026-09-22 to check this explicitly. If it's silently accepted
    instead, that's a regression, report it immediately. — **Not yet run
    live** (covered by the new automated test suite, `test_catalog_admin_service.py`'s
    `test_rejects_category_from_a_different_sbu_than_brand`) — **PASS**
    live 2026-09-23 as Haroon (GM): SonoScape (Imaging) brand + Critical
    Care category → `422` "Category must belong to the same SBU as the
    Brand"; re-list of SonoScape models confirmed nothing created.
22. As Admin/GM, attempt to create a Brand or Category via the API with a
    made-up department id. **Expected:** a clean "SBU ... not found" error
    (404), not a server crash (500). — **Not yet run live** (also covered
    by the new automated test suite's `test_rejects_nonexistent_sbu`
    tests) — **PASS** live 2026-09-23 as Haroon (GM): both
    `POST /reference/brands` and `/categories` with a made-up SBU id →
    `404` "SBU ... not found", no crash.
23. As Admin/GM, edit a product and change *only* its department (not its
    Model) via the API, to a department its current Model doesn't belong
    to. **Expected:** rejected with a clear error — before the fix, this
    silently succeeded and left the product's Brand/Model/Category pointed
    at the old department. — **PASS** live 2026-09-23 as Haroon (GM):
    `PUT /products/{id}` on "EDAN iM91 Test ECG Machine" (Critical Care)
    with only `sbu_id` = Imaging → `400` "Model ... does not belong to
    SBU ..."; re-read confirmed the product is still Critical Care.

## I — Regression: every other screen that reads a product name

24. Add a product line to an Opportunity — confirm the product picker and
    the saved line both show the correct Brand/Model/Category-based name.
    — **PASS**, tested live as Fazal on "Test opportunity": added
    "SonoScape E2 Portable USG Machine" alongside the existing "SonoScape
    HD-550 Endoscopy" line — picker was cleanly grouped by category, no
    "Legacy Data" junk shown, both lines saved and displayed correctly,
    total updated to ₹15.0L.
25. Create/review a Marketing Lead with a product field — confirm the
    same. — **PASS**, tested live by Basheer as Admin/GM, 2026-09-23 —
    product name shown correctly on the Marketing Lead.
26. Check Project Directory and Customer 360 screens wherever a product
    name shows — confirm unaffected. — **PASS**, tested live by Basheer as
    Admin/GM, 2026-09-23 — Customer 360 checked in both places it shows
    product names (Installed Base cards: name/brand/model correct; product
    picker in the installed-asset form: "Brand Model Category" names, no
    "Legacy Data"). Project Directory: N/A — it shows no product names.
27. Check Pipeline Report, Sales Report, and Product Performance Report's
    *Product*-level breakdown (not the Brand cards, covered separately in
    Section J below) — names and groupings still correct. — **PASS**,
    tested live by Basheer as Admin/GM, 2026-09-23 — product names shown
    correctly in all three reports' product views.

## J — Product Performance brand-grouped cards now drill down

Built **and already fully E2E-tested** by a parallel session, 2026-09-22 —
see `docs/Product-Performance-Brand-Drilldown-Manual-E2E-Test-Plan.md`
(all 9 steps PASS, live pass against real Dev data, no bugs found). Don't
re-run that pass here — just confirm the one thing specific to *this*
feature's own scope:

28. Confirm brand grouping reflects the real Brand table (no more "EDAN"
    vs "Edan" style duplicates) — the actual drill-down mechanics are
    already signed off in the doc above. — **PASS**, tested live by
    Basheer as Admin/GM, 2026-09-23 — one EDAN card, no case-variant
    duplicates. Side observation, not a bug: By Product showed 7 EDAN
    opportunities vs By Brand's 6 — one opportunity carries two different
    EDAN products, so it's counted once per product row but once overall
    at brand level (Basheer confirmed). Separate finding logged during
    this step: stale Pipeline drill-down filter carried across drills
    (see Progress-Archive 2026-09-23).

## K — Data cutover: the legacy deactivated products

29. Open the Opportunity / Marketing Lead / Document that each legacy
    deactivated product is still attached to — confirm each screen
    renders the old product name fine and doesn't error, even though the
    product record itself is inactive. Cross-check the actual list of
    still-deactivated products against whatever the parallel cleanup
    session leaves behind, since that list may shrink before this step
    runs. — **Not yet run.** Basheer has since manually repointed the
    opportunities on 3 of the 5 legacy products (EDAN elite V Series, ECG
    Cable, Siemens USG M/c per the original per-product reference list —
    confirm exact identities before running this step), so this step's
    scope needs re-confirming against current state before it's run: it
    may now only apply to whichever of EDAN i15 / EDAN i20 still have live
    references.
    **CLOSED 2026-09-23 (Basheer's call):** a read-only Dev check (as
    Haroon, all three RLS settings verified) found no opportunity or
    installed-asset still using any of the 5 inactive products. Only
    leftovers: two Converted Marketing Leads (Aster DM — EDAN i15 "Cochin
    Conference", EDAN i20 "Bangalore trade fair") and one product-only
    Document ("Brochure" on ECG Cable). Accepted as-is; nothing left to
    verify at the opportunity level.

## L — Regression: Collateral Links (2026-09-14 feature, same screen)

30. On a product detail page, confirm Collateral Links still show/add/
    remove exactly as before — nothing about the Brand/Model/Category
    rework should have touched that box. — **PASS**, tested live by
    Basheer as Admin/GM, 2026-09-23 — link added and removed normally
    (box rendering itself also observed during Section D on 2026-09-22).

## M — Fix found during this pass: stale search text across drill-downs

Found live 2026-09-23 during step 28 (Basheer): text typed into the Pipeline
list view's search box on one report drill-down stayed applied on the next,
unrelated drill. Fix: a new drill now clears the search box too, alongside
the Owner/Zone dropdowns it already cleared (`OpportunityPipelineScreen.tsx`).

31. Product Performance → By Brand → click an Opportunities count. In the
    Pipeline list, type "marketing" into the search box (list narrows).
    Go back, switch to By Product, click any Opportunities count.
    **Expected:** search box is empty, full drilled list shown. — **PASS**,
    tested live by Basheer as Admin/GM, 2026-09-23
32. Within a single drill, type into the search box — confirm it still
    filters normally (the fix must only clear on a *new* drill). — **PASS**,
    tested live by Basheer as Admin/GM, 2026-09-23

---

## Sign-off

**Status as of 2026-09-23 — COMPLETE, all 30 steps PASS (plus 31-32):**
- 2026-09-22: 1-8, 11, 12, 16-20, 24 (Haroon as Admin/GM; Fazal as
  non-Admin/GM), 15 Critical Care side.
- 2026-09-23: 9, 10, 13, 14 (completing 15), 25-28, 30, 31, 32 by Basheer
  live as Admin/GM; 21-23 as live API calls under Haroon's session; 29
  closed on Basheer's call after a read-only Dev check (no opportunity or
  installed asset still uses an inactive product).
- **Bugs:** two found and fixed during the 2026-09-22 part of the pass
  (see "Fixed by three `/code-review` passes" up top); one found and fixed
  2026-09-23 — stale Pipeline search text across drill-downs (`bc460a4`,
  Section M).
- **Test data left in Dev:** "E2E Test Brand", "E2E Test Category" and
  their model (and product, if one was saved), plus the "iM90 Test"/"iM91 Test" models and "EDAN
  iM91 Test ECG Machine" product — deactivate when convenient.

Record Pass/Fail per remaining step, who tested each role, and any live
findings (fixed or deferred), same format as the other 2026-09 test plans.
Feature 4.1 only flips to Done in Traceability once every section above
passes.
