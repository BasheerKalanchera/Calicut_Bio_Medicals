# Hybrid Testing Strategy
## Product-Catalog-Brand-Category-Model-Manual-E2E-Test-Plan.md

> **Note:** `Product-Performance-Brand-Drilldown-Manual-E2E-Test-Plan.md` is already  
> **fully signed off** (all 9 steps PASS, per the sign-off section). Skip it entirely.  
> Only the 30-step Product Catalog plan remains.

---

## Summary Split

| Mode | Steps | Count |
|---|---|---|
| ✋ You do it manually | A1–3, B4–6, D12–13, E14–15, F16–18, I24–27, J28, L30 | **18 steps** |
| 🤖 Claude browser testing | B7–8, C9–11, F19, G20, H21–23, K29 | **9 steps** |
| ✅ Already done | Section J drill-down (all 9) | **skip** |

---

## ✋ Do Yourself — Fast, Visual, No Token Cost

### Section A — Admin/GM: catalog browsing (Steps 1–3)
**Why manual:** Pure visual checks. You open the page, you see it.
- Step 1: Log in as Admin/GM, open Product Catalog → *just look at it*
- Step 2: Confirm Brand, Model, Category chips show per product → *30-second scan*
- Step 3: Filter by SBU chip → *two clicks, obviously visible*

**Time: ~2 min**

---

### Section B — Add Product, cascading pickers (Steps 4–6)
**Why manual:** Happy-path form fill. You've done this a hundred times.
- Step 4: Click "+ Add", pick SBU → Brand → Model → *normal form interaction*
- Step 5: Confirm Category auto-fills and old free-text field is gone → *you'll see it instantly*
- Step 6: Save and confirm it appears in list → *visible in 5 seconds*

**Time: ~3 min**

---

### Section D — Edit existing product (Steps 12–13)
**Why manual:** Simple edit flow. Two interactions, immediately visible.
- Step 12: Edit a product, change Model, confirm Category and Name update
- Step 13: Change Brand entirely, confirm Model resets and save is blocked until re-picked

**Time: ~2 min**

---

### Section E — SBU scoping (Steps 14–15)
**Why manual:** Dropdown content is visually obvious to check.
- Step 14: Add-Product for Imaging → confirm only Imaging brands appear
- Step 15: Repeat for Critical Care → confirm no cross-contamination

**Time: ~2 min**

---

### Section F — Non-Admin/GM: read-only catalog (Steps 16–18)
**Why manual:** Role UI check — presence/absence of buttons is instantly visible.
- Step 16: Log in as non-Admin/GM, browse catalog → *just look*
- Step 17: Open product detail → confirm no Edit button
- Step 18: Confirm "+ Add" button is absent entirely

**Time: ~2 min** *(already logged in from Section E, just switch users)*

---

### Section I — Regression: other screens using product names (Steps 24–27)
**Why manual:** You're navigating screens you use every day.
- Step 24: Add product to Opportunity → confirm correct name shows
- Step 25: Check Marketing Lead with product field
- Step 26: Project Directory and Customer 360 — quick scan
- Step 27: Pipeline Report, Sales Report, Product Performance Product-level breakdown

**Time: ~5 min** *(you're just checking names look right — you'll spot any anomaly)*

---

### Section J — Brand grouping check (Step 28)
**Why manual:** Visual check, one glance.
- Step 28: Confirm brand grouping has no "EDAN" vs "Edan" duplicates in Product Performance

**Time: ~30 seconds**

---

### Section L — Collateral Links regression (Step 30)
**Why manual:** Collateral links are a simple UI check you can do in 30 seconds.
- Step 30: On a product detail page, confirm Collateral Links still show/add/remove

**Time: ~1 min**

---

## 🤖 Use Claude Browser Testing — Complex, Tedious, or Risky Steps

### Section B — Validation edge cases (Steps 7–8)
**Why Claude:** Error state testing is tedious and easy to miss manually.
- Step 7: Try saving with no Brand/Model → confirm blocked with clear message
- Step 8 (**regression for migration 0051 fix**): Confirm "Legacy Data" NOT in Brand dropdown, "Retired/Unclassified" NOT in Category dropdown inside "+ Add new model"

> 💡 **Prompt to use:**
> ```
> Test two things on the Add Product form (logged in as Haroon):
> 1. Try to save without picking Brand or Model — confirm a clear validation 
>    message appears, nothing is saved.
> 2. Open the Brand dropdown — confirm "Legacy Data" does NOT appear as an option.
>    Then open "+ Add new model", open its Category picker — confirm "Retired / 
>    Unclassified" does NOT appear. Stop after confirming both. Don't do anything else.
> ```

---

### Section C — Inline "+ Add new" flows (Steps 9–11)
**Why Claude:** Multi-step inline creation flows with nested modals are exactly what 
Claude handles better than humans doing tedious form sequences.
- Step 9: "+ Add new brand" for a non-existent brand → confirm selectable immediately
- Step 10: "+ Add new model" with "+ Add new category" nested inside → confirm behavior
- Step 11 (**regression for frontend error-handling fix**): Duplicate name → confirm visible error, not silent failure

> 💡 **Prompt to use:**
> ```
> On the Add Product form (Admin/GM logged in), test the inline creation flows:
> 1. Use "+ Add new brand" to create a brand that doesn't exist yet. Confirm it 
>    appears as a selectable option immediately after.
> 2. Under an existing brand, use "+ Add new model" and also add a new category 
>    from inside that flow. Confirm model requires category before it can be added.
> 3. Try adding a brand name that ALREADY EXISTS for that SBU. Confirm a visible 
>    duplicate error message appears — before a fix this failed silently with NO message.
> Stop after these 3 checks. Don't navigate elsewhere.
> ```

---

### Section F — Critical regression test (Step 19)
**Why Claude:** This is the **single most important step** in the plan (per the test plan itself). 
Cross-SBU product detail crash regression — must be tested thoroughly.
- Step 19: As non-Admin/GM user, open a product from the OTHER SBU they don't belong to → confirm page opens normally, not crash

> 💡 **Prompt to use:**
> ```
> Log in as Vivek (or Nishad K V — non-Admin/GM, Critical Care SBU).
> Navigate to Product Catalog. Find and open a product that belongs to the 
> IMAGING SBU (not Critical Care).
> Expected: product detail page opens normally, Brand/Model/Category display correctly.
> Before a fix (migration 0050), this page crashed. Confirm it does NOT crash.
> This is the highest-priority check in this test run. Report result immediately.
> Stop after this one check.
> ```

---

### Section G — Server-side API gate (Step 20)
**Why Claude:** API testing via browser dev tools or direct HTTP call — perfect for Claude, 
tedious and error-prone for humans to do manually.
- Step 20: As non-Admin/GM, attempt direct POST to `/reference/brands`, `/reference/categories`, `/reference/models` → expect 403

> 💡 **Prompt to use:**
> ```
> While logged in as Vivek (non-Admin/GM user), use the browser's fetch API 
> in the console to POST to:
> - /reference/brands
> - /reference/categories  
> - /reference/models
> For each, use a simple test body. Expected result: 403 Forbidden, nothing created.
> Confirm by listing brands/categories/models afterward to verify no new records appeared.
> ```

---

### Section H — Data integrity edge cases (Steps 21–23)
**Why Claude:** These are API-level data integrity checks requiring specific crafted payloads. 
Boring and precise — ideal for Claude.
- Step 21: Create Model via API with Brand from one SBU + Category from another → expect rejection
- Step 22: Create Brand/Category via API with made-up department id → expect 404 not 500
- Step 23: Edit product via API changing only department to one its Model doesn't belong to → expect rejection

> 💡 **Prompt to use:**
> ```
> Using the browser console while logged in as Haroon (Admin/GM), test 3 data 
> integrity checks via direct API calls:
> 1. POST /reference/models with brand_id from Imaging and category_id from 
>    Critical Care — expect a clear rejection message ("Category must belong to 
>    same SBU as Brand"), nothing created.
> 2. POST /reference/brands with a made-up department id (e.g. "99999") — 
>    expect a 404 "not found" response, NOT a 500 server crash.
> 3. PATCH an existing product changing only its department to one that 
>    doesn't match its current Model's SBU — expect rejection with clear error.
> Report pass/fail for each. Stop after these 3 checks.
> ```

---

### Section K — Legacy deactivated products (Step 29)
**Why Claude:** Requires opening multiple screens with old product references — 
multi-step navigation Claude can do faster without boring you.
- Step 29: Open Opportunity/Lead/Document linked to each legacy deactivated product → confirm renders fine

> 💡 **Prompt to use:**
> ```
> Check that deactivated legacy products still render correctly in linked screens.
> Find Opportunities or Marketing Leads that reference these legacy products:
> EDAN i15, EDAN elite V Series, EDAN i20, ECG Cable, Siemens USG M/c.
> For each one found, open the linked record and confirm the screen renders without 
> error even though the product is inactive. Report any screen that errors.
> Stop after checking all five.
> ```

---

## Recommended Execution Order

```
Phase 1 — You (20 min total, no Claude needed):
  A (1-3) → D (12-13) → E (14-15) → F (16-18) → B happy path (4-6) 
  → I (24-27) → J (28) → L (30)

Phase 2 — Claude browser testing (targeted, scoped prompts):
  F19 first (highest priority, stop if it fails)
  → B7-8 → C9-11 → G20 → H21-23 → K29

Total Claude sessions needed: 2-3 short focused sessions (not one long one)
```

---

## Token Savings Estimate

| Old approach | New approach |
|---|---|
| Claude tests all 30 steps | Claude tests only 9 steps |
| Long exploratory session | 2-3 short focused sessions |
| ~30 browser interactions | ~9 targeted interactions |
| **Estimated 70% token reduction** | ✅ |
