# Product Pricing Sheet and Product Cost — Implementation Plan

**Status:** Approved 2026-11-16 (Basheer). Haroon asked for it on priority
(phone call to Basheer, 16 Nov). Steps 1–3 are built without waiting for
Haroon's pricing sheet (D14, 18 Nov); only step 4 (loading it) waits.
**Progress (19 Nov 2026):** steps 1–3 built, pre-E2E review done and its
fixes in; merged to `main` (`ebd3bdd`, 19 Nov); migration 0066 applied to Dev
19 Nov (`alembic current` = 0066; schema file `290386a`). E2E pending:
`docs/Product-Pricing-And-Cost-Manual-E2E-Test-Plan.md`.
**Traceability rows:** 4.3 Revenue per product/brand analytics (Margin
part), 11.1 Core reports (Margin Report); beyond-contract row 1 (pricing
ladder, parked for Phase 2 on 16 Oct — this plan takes only a first slice
of it).
**Design / discussion:** `docs/Discussion-Pricing-Discount-Authority-2026-09.md`
(parked); `docs/Business-Rules.md` BR-CAT-04; Progress-Archive-2026-11, 7 and
9 Nov entries.

## Decisions

- D1. Shape: price fields on each product (Basheer's 7 Nov idea), not an
  uploaded copy of Haroon's sheet — Basheer, 2026-11-16
- D2. Price levels stored per product: full (quoting) price, rep's lowest,
  Area Manager's lowest, CEO's lowest — Basheer, 2026-11-16 (label changed from "Haroon's lowest" to "CEO's lowest", Basheer, 2026-11-19)
- D3. Who sees which price: each person sees the full price and only their
  own lowest; SBU Manager sees the Area Manager's lowest; Haroon, GM and
  Admin see all four — Basheer, 2026-11-16. Confirmed 2026-11-18: the SBU
  Manager sees the Area Manager's lowest for now (Cabio has no SBU Manager
  at present); an own SBU Manager level can be added later as one more
  price column
- D4. Where prices are shown: on the Opportunity, when a product is added
  or edited on a line, and on the Product Catalog's product page when one
  product is opened — one product at a time, never in the catalog list
  (so a rep can answer a customer before any Opportunity exists) —
  Basheer, 2026-11-16 (changed the same day from "Opportunity only")
- D13. No record of who opened a product's prices for now; can be added
  later, recording only from the day it is switched on — Basheer,
  2026-11-16
- D5. Show only, no block: a price below the person's lowest is still
  saved; the line shows a warning — Basheer, 2026-11-16
- D6. Who edits prices: GM and Admin only, on the Product Catalog's
  product pop-up — Basheer, 2026-11-16. The same price boxes are on the
  Add Product pop-up too, so a new product can be priced when it is added
  — Basheer, 2026-11-18
- D7. First load: Claude loads Haroon's sheet once, from the file he
  sends, Dev first, then UAT after Basheer's yes — Basheer, 2026-11-16
- D8. Product cost: one cost field per product, seen and edited by GM and
  Admin only (BR-CAT-04, Haroon 14 Sep), built in the same feature —
  Basheer, 2026-11-16
- D9. Cost screen: GM and Admin see cost, not margin, on the Product Catalog.
  A margin on the full price is only a best case; the real margin is the
  price quoted on the Opportunity line minus cost, which belongs to the
  separate later Margin Report plan — Basheer, 2026-11-18 (changed from
  "cost and margin (full price minus cost)", 2026-11-16)
- D10. Margin targets and incentives stay with the Cabio leadership team;
  this plan doesn't wait for them — Basheer, 2026-11-16
- D11. Time-bound special prices (Latheef Bhai, 14 Sep) not in this plan —
  Basheer, 2026-11-16
- D12. Latheef Bhai sees the plan before it is approved (his leak concern,
  pricing paper section 2) — Basheer, 2026-11-16
- D14. Steps 1–3 start now, in the Build session, without waiting for the
  sheet: the four levels were confirmed twice by Latheef Bhai (pricing
  paper sections 1 and 5), and UAT's catalog has one entry per model with
  no probes, so one price set per product fits; probes priced separately
  would only add accessory products. Only step 4 waits on the sheet —
  Basheer, 2026-11-18
- D15. Price order, checked on save (Add and Edit): Full price ≥ Rep's
  lowest ≥ Area Manager's lowest ≥ CEO's lowest ≥ Cost. Equal is allowed.
  The three lowest prices are all-or-none (all entered or all blank), and
  the Full price is required whenever they are entered; Full price may
  stand alone. Cost is optional; when entered it is compared with the
  nearest entered price above it. A save that breaks the order is refused
  with a plain message.
  Lines on an Opportunity stay warning-only (D5), so a rep can still type
  a price below the lowest or below cost; the catalog levels themselves can
  never sit below cost — Basheer, 2026-11-18 (found in the pre-E2E review;
  two Admins saving the same product at the same moment can overwrite each
  other's prices — accepted for now, Backlog)

## Figures and sources

- Four price levels (quoting, Staff, Manager, CEO), plus discretionary
  pricing below the CEO level — Latheef Bhai, pricing paper section 1
  (Sep 2026)
- Full price, rep's lowest, Area Manager's lowest, CEO's lowest, edited
  by GM and Admin only — Basheer, 7 Nov (Progress-Archive-2026-11)
- "Only Haroon's pricing sheet goes into the Product Catalog; reps,
  managers and the CEO see the lowest price they may quote on the
  Opportunity" — Haroon via Basheer, 9 Nov (BR-CAT-04)
- Product cost Admin/GM only, margin too — Haroon and Basheer, 14 Sep
  (BR-CAT-04)
- No price or cost field on products today — `docs/Physical-Schema.sql`
  `product` table and `backend` product model, read 16 Nov
- Opportunity line already holds Qty, Price ₹L, Disc ₹L —
  `OpportunityItemAddRow.tsx:139-141`, read 16 Nov
- SonoScape S70 at ₹35L full price, ₹33L rep's lowest, ₹31L Area
  Manager's lowest, ₹29L CEO's lowest, ₹24L cost — made-up example
- Number of products to price — not counted (needs a Dev query; will ask
  first)
- Haroon's sheet columns — not known; sheet not yet received
- UAT catalog: 73 products (71 active), one entry per model, machine
  versions as separate entries, no probes or transducers, no Imaging
  accessories — UAT read-only query, 18 Nov 2026 (Progress-Archive-2026-11)

## 1. In plain terms

Today a rep who wants to know how low they can go on a price has to phone
their manager. The paper "Controlled Copy" sheet is the only record.

**What changes:** each product gets its prices stored in the app — the
full price and the lowest price each level may quote. When a rep adds a
product to an Opportunity, the app shows them, for that one product, the
full price and their own lowest. It does not show anyone else's lowest. If
they type a price below their lowest, the app still saves it but shows a
warning, so they know to get their manager's say-so. Area Managers see
their own lowest the same way, and the CEO sees theirs.

**Before there is an Opportunity.** A doctor or biomedical engineer may
ask the price on a first visit. So the same two figures (full price and
the person's own lowest) also show when a rep opens one product on the
Product Catalog.

**No price list to browse.** The Product Catalog list itself shows no
prices to reps and managers — only the one product they open. That is
Latheef Bhai's leak concern from September: a full list, on paper or on
screen, leaks all at once.

**Product cost.** Each product also gets what it costs Cabio. Only the
General Manager and Admin ever see it — the app never sends it to anyone
else. On the Product Catalog they see the cost next to each product. Margin
is not shown here: a margin on the full price is only a best case, and the
real margin (quoted price minus cost) comes with the Margin Report (D9).

**Who keeps prices up to date:** GM and Admin, on the Product Catalog's
product pop-up. The first load comes from Haroon's sheet: Claude loads it
once, on Dev first, then on UAT after Basheer says yes.

**Example (made-up figures):** SonoScape S70, full price ₹35L. A rep
adding it sees "Full ₹35L · your lowest ₹33L". If they type ₹32L, the line
shows "Below your lowest (₹33L) — get your Area Manager's approval". The
Area Manager sees "your lowest ₹31L". The GM, on the Product Catalog, sees
all four prices and the cost, ₹24L.

**A lighter option:** just upload Haroon's sheet as a file on the Product
Catalog that everyone can open. Far less work, but it puts the whole price
list in every rep's hands, which is the leak Latheef Bhai wants to stop,
and it can't hide the Area Manager's or CEO's lowest from reps. Not
recommended (D1).

### On a phone

- **Opportunity, product line:** under the product picker, one grey line:
  "Full ₹35L · your lowest ₹33L". A price below the lowest shows an orange
  warning line under the Price box.
- **Product Catalog, one product's page (everyone):** under the product
  name, one line: "Full ₹35L · your lowest ₹33L" (each person's own
  lowest; Haroon, GM and Admin see all four). The catalog list shows no
  prices except the GM/Admin line below.
- **Product Catalog, Add Product and Edit Product pop-ups (GM and Admin
  only):** a "Prices"
  section, one box per row: Full price, Rep's lowest, Area Manager's
  lowest, CEO's lowest, Cost. No margin shown (D9).
- **Product Catalog list (GM and Admin only):** each product block gains
  one line: "Full ₹35L · Cost ₹24L". Other roles see no change.

## 2. Build order

All on Dev; UAT only at the UAT move, plus step 4's UAT load after
Basheer's yes.

1. **Price and cost fields on products** (one migration, Dev). The server
   sends each role only the prices it may see (D3, D8). Tests for every
   role. Checkpoint commit. Nothing visible changes on Dev yet.
   *Built: `ed987f4` (migration 0066, applied to Dev 19 Nov).*
2. **GM/Admin editing and the cost line on the Product Catalog**
   (D6, D9). Checkpoint commit. Prices can be typed in, but nobody sees
   them on Opportunities yet.
   *Built: `060eb3d` (Add and Edit Product pop-ups, list line).*
3. **Price line on one product's catalog page, and price line plus
   below-lowest warning on the Opportunity** (D4, D5). Checkpoint commit.
   Feature complete except the data.
   *Built: `8ff9e20` (Prices card on one product's page; line and warning on
   Opportunity lines and in the New Opportunity pop-up, which opens from five
   places). Pre-E2E review fixes: `82cafba` (price order checked on save, D15),
   `b52c881` (product names bold again on the edit-products list).*
4. **Load Haroon's sheet** (D7): a one-off script, run on Dev first, shown
   to Basheer; UAT only after his yes (UAT rule). Waits on the sheet.
   The script must apply the same price-order rule as D15 to every row and
   report the rows that break it, instead of loading them: a product saved
   with prices out of order can't be edited in the catalog until they are
   fixed, because every edit re-checks the order (Basheer, 2026-11-19, from
   the pre-E2E review).

Before step 1: nothing further — steps 1–3 no longer wait for the sheet
(D14, 18 Nov). Before step 4: Haroon's sheet is in hand. D12 is met: the summary went to the Cabio leadership team's
WhatsApp group, Latheef Bhai included, on 16 Nov (Basheer).

## 3. What could be affected

Code search, 16 Nov. The risk is the opposite of a broken screen: a screen
that starts *receiving* cost or someone else's lowest price. Each item is
checked as a rep, an Area Manager and the GM, before and after.

- (a) Screens that load products directly (`services/products.ts` users):
  Product Catalog, Opportunity detail (line add/edit), Quick Lead pop-up,
  Marketing Lead create pop-up, Customer 360.
- (b) Reports or links that open those screens with a filter: none found
  by search for the product list; reports read Opportunity lines, not
  product prices.
- (c) Other places that carry product details inside their own data:
  Opportunity data (`opportunity/schemas.py`) and the Customer workspace
  (`account/workspace_schemas.py`) both nest product details — must not
  start carrying prices or cost.

## 4. Not in this plan (with reasons)

- **Margin Report, and any margin figure** — a report of its own; separate
  plan once cost exists. It will work margin on the quoted price on the
  Opportunity line, not on the full price (D9).
- **Selling to a set margin, incentives** — Cabio leadership team to
  decide first (D10).
- **Time-bound special prices** — Latheef Bhai's second problem; needs its
  own design (D11).
- **Blocking a price below the lowest, or a manager approval step** —
  the warning comes first; a block can follow if reps ignore it (D5).
- **Per-zone or per-customer prices** — nothing asked for it.
- **A record of who opened a product's prices** — not needed now; can be
  added later (D13).

## 5. Business rules and records to update

- BR-CAT-04: add the price levels and who sees which. *(done 18 Nov)*
- BR-CAT-01: the "no pricing" premise now carries price fields too. *(done 18 Nov)*
- New BR for the below-lowest warning (BR-CAT-05) and for the price order
  (BR-CAT-06, D15). *(done 18 Nov)*
- Traceability rows 4.3, 11.1 and beyond-contract row 1.
- Backlog "Waiting on people": the leadership margin line stays; remove
  "lowest price shown on the Opportunity" once this plan is approved.
- Pricing paper: note that this plan takes the first slice.

## 6. Technical addendum

- `product` table: new NUMERIC(15,2) columns, INR Lakhs, nullable —
  `full_price_lakhs`, `rep_floor_lakhs`, `area_manager_floor_lakhs`,
  `ceo_floor_lakhs`, `cost_lakhs` (names proposed; one migration).
- Field-level hiding in the product schemas by role, never a
  frontend-only hide (BR-CAT-04 Enforcement; pricing paper section 4.1).
- Prices go only in the single-product response (`GET /products/{id}`,
  used by the catalog's product page); the list response
  (`GET /products`) carries none for non-GM/Admin roles (D4). The
  catalog's product page already uses the single-product call
  (`ProductCatalogScreen.tsx:256`); the Opportunity line today uses the
  list call (`OpportunityDetailScreen.tsx:329`), so it gains a
  single-product call when a product is picked.
- Warning compares `unit_price_lakhs - discount_lakhs / quantity` with the
  caller's lowest. Decided 2026-11-18 (Basheer, my recommendation
  accepted): the lowest is compared after the line's discount, because that
  is what the customer pays.
- One-off load script from Haroon's sheet; Dev, then UAT after Basheer's
  yes (UAT rule).
