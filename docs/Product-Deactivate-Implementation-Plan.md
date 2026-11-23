# Product Deactivate / Reactivate — Implementation Plan

**Status:** Approved, 2026-11-23 (Basheer).
**Traceability rows:** none — catalog upkeep, not a signed-requirement row (D8).
**Design / discussion:** Plan & Chore, 23 Nov 2026 (Progress-Archive 23 Nov). Modelled on
the User Directory's Deactivate (`backend/app/domains/organization/service.py:167–190`)
and `docs/Zone-Deactivate-Reactivate-Implementation-Plan.md` (built `b0b4109`).

## Decisions

- D1. Only the GM and Admin can deactivate or reactivate a product — the same people who can add and edit products today — Basheer, 2026-11-23
- D2. Deactivating only takes the product out of the pickers for **new** lines and leads. Existing Opportunity lines, leads, installed equipment and documents keep it, unchanged — Basheer, 2026-11-23
- D3. Before confirming, the pop-up shows "N open Opportunities and N marketing leads waiting for a decision use this product". It doesn't stop the deactivation. The Opportunity count is a link that opens the Opportunity Pipeline list showing those Opportunities; marketing leads stay a count — Basheer, 2026-11-23
- D4. Counted and listed: every Opportunity not Won or Lost (Active and On Hold today; Stalled too if it's switched on — On Hold is a planned pause and will restart, so it needs the product swapped too). Needs a new "open only" option on the Pipeline drill-down. A lead "waiting" means status New — Basheer, 2026-11-23
- D5. The Product Catalog gets a "Show inactive" button (GM and Admin only). Inactive products show dimmed with an "Inactive" label and a Reactivate button. Everyone else never sees inactive products — Basheer, 2026-11-23
- D6. Reactivating is refused, with a plain message, when another active product already exists for the same model (the catalog allows one active product per model) — Basheer, 2026-11-23
- D7. No database change: the product's Active field already exists — Basheer, 2026-11-23
- D8. No Traceability row; recorded as a new business rule BR-CAT-07 — Basheer, 2026-11-23

## Figures and sources

- 13 products Cabio doesn't sell; 11 used nowhere, elite V6 on 1 Opportunity line, SE-1202E on 1 marketing lead — UAT read-only checks, 23 Nov 2026 (Progress-Archive 23 Nov)
- elite V6: Opportunity "Complete hospital equipment", KPU LLP-ZYRA HEALTH Hospital Koppam, owner Haroon, Lead stage, qty 10 — same UAT check
- Dev test products waiting to be switched off ("EDAN iM91 Test ECG Machine" etc.) — `docs/Backlog.md`
- One active product per model — index `uq_product_model_id_active`, `docs/Physical-Schema.sql`
- Lead statuses New / Converted / Discarded — `ck_marketing_lead_status`, `docs/Physical-Schema.sql`
- On Hold needs a reason and a future restart date — BR-OP-02, `docs/Business-Rules.md`; Stalled switched off 2026-10-11 — BR-OP-06
- Pipeline drill takes one status today (Pipeline Report passes ACTIVE) — `PipelineReportScreen.tsx:45, 110–113`
- Five product pickers (Opportunity lines, Quick Lead, marketing lead, Customer 360, catalog) — code search, 23 Nov 2026

## 1. In plain terms

Today a product can't be switched off from the app. The only way is a database change.
This adds a Deactivate button to each product on the **Product Catalog** screen, for the
GM and Admin.

When the GM presses it, a pop-up says how many open Opportunities and waiting marketing
leads still use the product. For example, for elite V6 it would say "1 open Opportunity
and 0 marketing leads use this product". Clicking "1 open Opportunity" opens the
Opportunity Pipeline list showing just that Opportunity, the same way the Product
Performance report's drill-downs work. The GM can still go ahead. Nothing on those
Opportunities changes: the line keeps its product, price and quantity. The product
simply stops appearing when anyone adds a new line or a new lead. If the line needs
changing, the owner does it with the Opportunity's normal edit, as today.

Active and On Hold Opportunities are counted and listed. On Hold is a planned pause
with a date to restart, so it needs the product swapped like an Active one. Won and
Lost Opportunities aren't counted. They're history and stay as they are.

A "Show inactive" button on the catalog lets the GM see switched-off products and
switch one back on. If a new product has since been added for the same model, the app
refuses and says so, because the catalog keeps one active product per model.

All of this lands on Dev first and reaches UAT with the next UAT move. Then the GM or
Admin switches off the 13 products on UAT from the screen, with no database change.

### On a phone

- Product Catalog: each product's block gets a small Deactivate button (Reactivate on
  inactive ones), next to Edit, GM and Admin only. Inactive products are dimmed and
  labelled "Inactive".
- "Show inactive" sits with the SBU filter buttons at the top, and wraps under them on
  a narrow screen.
- The pop-up is the usual full-width dialog: the count sentence, one info line, and
  Cancel / Deactivate.

## 2. Build order

One build, one `feat:` commit. Nothing on Dev stops working at any point.

1. Backend: deactivate, reactivate and usage-count endpoints; an "include inactive"
   option on the product list for GM/Admin; tests.
2. Frontend: the Product Catalog buttons, the pop-up, "Show inactive"; help text.
3. Pre-E2E review, then a short manual E2E on Dev (Dev test products only).

## 3. What could be affected

Who reads the product list and could start or stop seeing a product:
- (a) Product pickers: Opportunity line add (`OpportunityDetailScreen.tsx:329`,
  `OpportunityItemAddRow.tsx`), Quick Lead (`QuickLeadModal.tsx:209`), marketing lead
  create (`MarketingLeadCreateModal.tsx:77`), Customer 360 (`Customer360Screen.tsx:803`).
  They already hide inactive products; check that a deactivated product disappears from
  each, and an active one still appears.
- (b) Product Catalog list and product detail (`ProductCatalogScreen.tsx:329, 445`):
  inactive hidden by default; shown with "Show inactive" for GM/Admin only.
- (b2) Opportunity Pipeline drill-downs (`OpportunityPipelineScreen.tsx:36–53, 307–330`,
  `DemoApp.tsx:335`; used by Pipeline Report and Product Performance): the new "open
  only" option must not change existing drills — check one Pipeline Report and one
  Product Performance drill before and after; check the new drill's list count matches
  the pop-up's count with an Active and an On Hold Opportunity on the product.
- (c) Existing Opportunity lines (`OpportunityDetailScreen.tsx:453`) and the price note
  (`ProductPriceNote.tsx:29`): check a line with a deactivated product still shows its
  name and price, and still saves when edited.

## 4. Not in this plan (with reasons)

- Forcing the affected Opportunities to be fixed before deactivating: it happens a
  few times a year and today's case is 1 Opportunity and 1 lead, both known (Basheer
  chose the smaller version, 23 Nov).
- A drill-down for marketing leads: no existing "leads for this product" list to
  reuse, and the count is usually 0 (1 on UAT today).
- Deleting products: lines, leads and assets point at them, and history must stay.
- A migration to switch off the 13 products now: the GM does it from the screen after
  the UAT move.

## 5. Business rules and records to update

- `docs/Business-Rules.md`: new BR-CAT-07 "Deactivating a product" (D1–D6).
- `docs/Business-Rule-Implementation-Matrix.md`: BR-CAT-07 row.
- In-app help, Product Catalog: one line on Deactivate and Show inactive.
- `docs/Backlog.md`: the Dev test products line points to this feature.

## 6. Technical addendum

- `product/schemas.py`: `ProductUsageResponse(open_opportunity_count, waiting_lead_count)`;
  `is_active` on the response if not already there.
- `product/repository.py`: `usage_counts(product_id)` — distinct Opportunities with an
  `opportunity_item` on the product and `opportunity_status.is_terminal = false`;
  `marketing_lead` with `status = 'NEW'`. Expose `active_only` through `list_products`
  / `count_products` in the service.
- `product/service.py`: `deactivate_product`, `reactivate_product` (`_CATALOG_WRITE_ROLES`;
  reactivate checks `active_product_exists_for_model` → `ConflictError`); list with
  `include_inactive=True` allowed only for GM/Admin, otherwise ignored.
- `product/router.py`: `POST /{id}/deactivate`, `POST /{id}/reactivate`,
  `GET /{id}/usage`, `include_inactive` query on `GET ""` and `GET /count`.
- Opportunity save (`opportunity/service.py:906–921`) checks only the SBU, so existing
  lines on an inactive product still save. Keep it that way (D2); a test pins it.
- Pipeline drill (D3, D4): `open_only: bool` query on the pipeline list
  (`opportunity/router.py:89–104`), joining `opportunity_status.is_terminal = false` in
  `list_pipeline`; `openOnly` on `initialFilter` and `listPipeline`. Pop-up link calls
  `handleDrillToPipeline({ productId, openOnly: true, expectedCount }, productName)`.
  Confirm which statuses have `is_terminal = false` with a read-only Dev query at build.
- Frontend: `services/masterData.ts` calls; `ProductCatalogScreen.tsx` button, `FormModal`
  pop-up and "Show inactive" toggle, copying `UserDirectoryScreen.tsx:158–431`.
- Tests: role checks (403 for others), count excludes Won/Lost and Converted/Discarded,
  reactivate conflict, inactive hidden from the default list, existing line still saves.
- No migration.
