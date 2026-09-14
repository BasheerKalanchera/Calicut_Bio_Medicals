# Product Catalog Collateral Security — Manual E2E Test Plan

**Feature:** Signed Feature 4.1 (Collateral Security), PRD 7 → Collateral Security.
**Scope built:** on a product's Collateral Links box (brochures/videos/photos),
*viewing and opening* an existing link stays open to every logged-in role —
reps need the brochures to actually sell — but *adding or removing* a link is
Admin/General Manager only, on screen and on the server directly. Catalog
*browsing* (product name/brand/model/SBU) also stays open to every role,
preserving the 2026-08-01 decision to let reps see the full company product
line for cross-referral. Product record add/edit was already Admin/GM-only
since 2026-08-07 and is not part of this pass.

**Scope correction, 2026-09-14 (live, mid-test):** the first build fully hid
the Collateral Links box from non-Admin/GM roles (matching the signed
requirement's literal text, "access restricted to managers/authorized
staff"). Basheer caught this live while testing as Vivek (Sales Staff) — reps
need to see and open existing brochures to actually use them with customers,
they just shouldn't be able to add or remove one. Rebuilt to the scope above
before continuing the pass.

**Not in scope for this pass:** hiding the catalog itself from non-Admin/GM
roles, or hiding the Collateral Links box's existence/contents from them —
both explicitly ruled out.

**Test users needed:** one Admin or General Manager login, and at least one
non-Admin/GM login (e.g. Sales Staff, Area Manager, or SBU Manager — any role
outside Admin/GM proves the gate; you don't need to test every role
individually since they all hit the same check).

**Setup:** pick one existing product that already has at least one Collateral
Link on it (so the "link exists" cases have something to see), and one that
has none.

---

## A — Admin/GM role (everything should work as before) — PASSED live 2026-09-14

Tested live as Haroon Sidheeq (General Manager), product **EDAN elite V5**.

1. Log in as Admin or General Manager.
2. Open Product Catalog → open a product that already has a Collateral Link.
   **Expected:** the "Collateral Links" box is visible, existing link(s) show
   and are clickable (open in a new tab). — **PASS**
3. Click "+ Add Link", fill in Label/Type/URL, submit.
   **Expected:** link is added, appears in the list. — **PASS** (confirmed
   with a real link, EDAN's own elite V5 product page,
   `https://edanusa.com/product/elite-v5-modular-patient-monitor/`, verified
   it actually opens the real EDAN page)
4. Remove a link (✕ button).
   **Expected:** link disappears immediately. — **PASS**
5. Open a product with zero links.
   **Expected:** box still shows, with "No collateral links yet." and the
   "+ Add Link" control still available. — **PASS**

## B — Non-Admin/GM role (the actual gate) — PASSED live 2026-09-14

Tested live as Vivek (Sales Staff, Alappuzha, Critical Care), after the scope
correction above.

6. Log in as a non-Admin/GM user (Sales Staff / Area Manager / SBU Manager).
7. Open Product Catalog → open the same product used in step 2 (the one with
   an existing link).
   **Expected:** the Collateral Links box is visible, the existing link shows
   and is clickable (opens the real target in a new tab), but there is no
   "+ Add Link" button and no ✕ delete button on the link row. Product Detail
   fields still show normally, no "Edit" button on the product itself
   (unchanged, pre-existing behavior). — **PASS** (also independently
   confirmed on a second, real pre-existing product, "ECG Cable" → its
   "Brochure" link, same result)
8. Open a product with zero links, same non-Admin/GM login.
   **Expected:** box shows "No collateral links yet.", no "+ Add Link"
   button, no error. — **PASS**

## C — Server-side gate (not just a hidden button) — covered by automated tests, not re-run live

`backend/tests/domains/document/test_document_router.py` exercises the real
route → service → exception-handler chain (not mocked at the HTTP boundary)
for exactly this scenario:
- `TestListProductDocuments::test_non_catalog_role_can_still_view` — a
  non-catalog role gets `200` with the data (view is open).
- `TestCreateProductDocument::test_non_catalog_role_returns_403` — `403`,
  nothing created.
- `TestDeleteDocument::test_non_catalog_role_blocked_for_product_scoped_document`
  — `403`, nothing deleted.
- `TestDeleteDocument::test_non_catalog_role_allowed_for_opportunity_scoped_document`
  — `204`, proving the block is product-scoped only.

796/796 backend tests passing as of this build. Basheer confirmed this is
sufficient and declined a live raw-API repeat (would have required reading
Vivek's session token out of browser storage).

## D — Regression: Opportunity documents must be unaffected — PASSED live 2026-09-14

Tested live as Vivek, Opportunity "New USG m/c" (aster medicity).

12. Log in as the same non-Admin/GM user from part B.
13. Open any Opportunity you're allowed to see, go to its Documents section,
    upload a file (PDF/JPEG/PNG under 4MB).
    **Expected:** works exactly as before. — **PASS** (uploaded a real
    test PDF, appeared immediately with view/delete controls)
14. Delete that same Opportunity document.
    **Expected:** works normally, no 403. — **PASS**

## E — Regression: catalog browsing stays open — PASSED live 2026-09-14

15. Log in as a non-Admin/GM user from one SBU (Vivek: Critical Care).
16. Open Product Catalog — both "Imaging" and "Critical Care" filter chips
    present, products from both SBUs listed and openable.
    **Expected:** browsing/searching the full catalog across both SBUs is
    unchanged; only add/edit on collateral (and the product record itself)
    is gated. — **PASS**

---

## Sign-off

All of A-E passed live on 2026-09-14 (Haroon as GM, Vivek as Sales Staff),
with the scope corrected mid-pass per Basheer's live call. Feature 4.1's row
(Module 6b, `docs/Signed-Requirements-to-PRD-Traceability.md` and
`docs/Phase1-Delivery-Scorecard.md`) is ready to flip from **Partial** to
**Done** — do that, and log the pass in
`docs/Progress-Archive-2026-09.md`.
