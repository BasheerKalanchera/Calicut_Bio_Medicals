# Design Note: Product Lifecycle — Trade-Ins, Refurbished Inventory, and Accessories

**Origin:** Raised by Haroon Sidheeq (GM & Sales Head), 2026-08-05, in the same
discussion as Issues 1 and 2.
**Status:** Trade-in/buyback + Refurbished + Accessories mechanism **built 2026-08-07
— code-complete, all automated checks green (435 backend tests, `tsc --noEmit`, lint
incl. `check-no-tailwind.js`), not yet committed.** Awaiting Basheer's manual E2E
verification. Bundled with a prerequisite: `ProductCatalogScreen.jsx`'s full MUI/React
Query/TypeScript migration (needed to add the `product_type` field without adding more
Tailwind — see `Frontend-Implementation-Standards.md` §9). Two narrower items remain
open (§7) but didn't block the build: GST/invoicing treatment, and whether `BR-OP-01`'s
gate flexibility should extend to accessory/refurbished sales.
**Scope:** Backend/data model design. Not a leadership discussion paper — this is the
technical shape to review before it becomes backlog work.

---

## 1. Business context

Cabio's business includes more than new-equipment sales:

- **Trade-in / upgrade deals.** Cabio offers a customer an upgrade: buy back their old
  machine, sell a new one, net the buyback value off the deal.
- **Refurbished inventory.** Traded-in machines get refurbished and resold — not only
  as trade-in credit, but as a genuine standalone sale: some hospitals (e.g. for
  Thoracic/heart-lung machines) actively prefer buying refurbished units outright,
  independent of any trade-in. Primarily Critical Care today, may extend to Imaging.
- **Accessories.** Sold alongside or independent of equipment — also primarily Critical
  Care today.

Fuller lifecycle context (2026-08-07, Basheer): equipment Cabio sells becomes an
`InstalledAsset` at the customer site, goes through warranty/AMC-based servicing, and
once that runs out the customer may trade it in for newer technology — sometimes even
when the machine isn't that old, and sometimes the traded-in unit is a **competitor's**
product, not Cabio's own. The traded-in unit then gets catalogued as refurbished stock,
available to customers who can't afford new. This is real context for *why* the
business needs this feature, but **`InstalledAsset` is explicitly out of scope for this
build — see §3.4.**

## 2. What exists today

- **`InstalledAsset`** (`backend/app/domains/asset/models.py`) — tracks what's
  currently installed at a customer site, Cabio's own product or a competitor's
  (`is_competitor_equipment` / `competitor_product_name`). Independent of any
  Opportunity. **Not connected to Coverage Planning** — confirmed 2026-08-07 by reading
  `BR-PL-02` (Coverage Plans are scoped to Strategic Objectives + Target Revenue per
  account; visit-count tracking is explicitly forbidden) and by grepping
  `backend/app/domains/planning/` for any `InstalledAsset` reference (none exist). An
  earlier draft of this note incorrectly claimed `InstalledAsset` fed an
  upgrade-due-detection query for Coverage Planning — no such query exists anywhere in
  the codebase. That claim is retracted.
- **`OpportunityItem` / `BR-FIN-03`** — `Extended Value = Quantity × Unit Price –
  Discount`; `Opportunity Value = Sum of Extended Values` once items exist. This is the
  single source of truth for deal value, feeding splits (`BR-FIN-01`) and pipeline
  rollups (ADR-013).
- **`Product`** — `sbu_id`-scoped for writes (RLS: create/update/delete restricted to
  the owning SBU or Admin/GM), read open to everyone (`product_read_all USING (true)`).
  `category_name` is free text describing modality (CT, MRI, Ventilation, etc.). No
  field distinguishes equipment from accessory, or new from refurbished.

## 3. Trade-in / buyback — final design (2026-08-07)

### 3.1 `Product.product_type` — single field, three values

```
product_type: NewEquipment | Refurbished | Accessories
```

**One field, not two.** An earlier version of this note proposed two orthogonal fields
(`product_type: EQUIPMENT|ACCESSORY` and `condition: NEW|REFURBISHED`) so that a
"refurbished accessory" combination stayed representable. Collapsed to one field
2026-08-07 — cheaper to build (one migration, one column, one check in the picker's
chip logic instead of two) and Cabio's actual catalog doesn't have a refurbished-
accessory scenario (accessories are low-cost consumables, not a resale category).
**Trade-off accepted knowingly:** if a refurbished accessory ever becomes real, it
needs a 4th enum value or splitting the field back apart later — not just a data entry.

`category_name` (modality: CT, MRI, Ventilation, etc.) is unchanged and stays
orthogonal to `product_type` — a Refurbished heart-lung machine is still tagged with
whatever `category_name` that equipment type uses.

**Business rule:** a product must already exist in the catalog with
`product_type = Refurbished` before it can appear in the Buyback dropdown (§3.2).
Cataloguing happens first, as its own step — the Buyback line never creates a new
catalog entry on the fly.

### 3.2 Buyback mechanism — no new table

**Not a separate `opportunity_trade_in` table** (an earlier version of this note
proposed one, linked to `InstalledAsset` — dropped, see §3.4). Instead:

- `OpportunityItem` gains a `line_type: PRODUCT | BUYBACK` flag (working name,
  revisable).
- Same `Quantity × Unit Price − Discount` shape as any other `OpportunityItem` row —
  buyback lines carry quantity like normal lines.
- `product_id` FK (already on `OpportunityItem`) points at a `Product` row with
  `product_type = Refurbished` for buyback lines.

**`BR-FIN-03` amendment:**

> `Opportunity Value = Sum(Extended Value, line_type=PRODUCT) − Sum(Extended Value, line_type=BUYBACK)`

Splits (`BR-FIN-01`) apply to this net figure — confirmed 2026-08-07 (Basheer): "the
amount we enter there should be subtracted from the total of the new products," which
is exactly this. This also resolves §7 item 1 from the earlier draft (splits over net,
not gross).

### 3.3 UI — "Add Product" modal, three sections

1. **Add Product** — `product_type ∈ {NewEquipment, Refurbished}`, grouped by
   `category_name` (existing modality grouping, unchanged), `Refurbished` entries shown
   with a chip tag (see §5). Adds a `line_type=PRODUCT` row. This is how a refurbished
   unit gets sold outright (no trade-in involved) — e.g. a hospital buying a refurbished
   heart-lung machine directly.
2. **Add Accessory** — `product_type = Accessories` only. Adds a `line_type=PRODUCT`
   row (contributes positively, same as equipment — just filtered to the Accessories
   catalog).
3. **Buyback** — `product_type = Refurbished` only. Adds a `line_type=BUYBACK` row
   (subtracts per §3.2's formula).

A `Refurbished`-tagged catalog product is reachable from **both** section 1 (sold
outright) and section 3 (credited as a trade-in) — same catalog entry, different
transactional role depending on which section it's added from.

**Display:** single net total on the Products tab (not a three-number gross/buyback/net
breakdown). Buyback lines are visually distinct in the line list (chip/styling) so the
deal's composition is scannable at a glance — confirmed 2026-08-07, "single net total
with buyback lines visually distinct... will do for now."

### 3.4 `InstalledAsset` — explicitly out of scope, period

Confirmed 2026-08-07 (Basheer): **no `InstalledAsset` involvement anywhere in this
build.** Dropped entirely, not deferred:

- No `opportunity_trade_in` table.
- No `InstalledAsset.is_active` field.
- No `Product.source_installed_asset_id` provenance FK.

**Known future gaps, noted for the record, not being solved here:** there is currently
no mechanism that turns a Won Opportunity's sold item into an `InstalledAsset` record
(that table is only populated via its own independent CRUD today) — so the fuller
lifecycle described in §1 (sold → installed → traded in → catalogued as refurbished)
has a real gap in the middle, not just at the buyback end. Worth its own design pass
later if Cabio wants end-to-end asset traceability; out of scope for this feature.

## 4. Product picker UX (Opportunity → Products tab)

**Current state:** flat dropdown, up to 100 products per SBU
(`OpportunityDetailScreen.tsx`, `listProducts({ sbu_id })`), no grouping or filtering.

**Proposed (Add Product section only — Accessory/Buyback sections are pre-filtered by
`product_type`, no chip needed since the whole list is already one type):**
1. Group by `category_name` — the existing modality values (CT, MRI, X-Ray, Ultrasound,
   Fluoroscopy for Imaging; Monitoring, Ventilation, Infusion for Critical Care, plus
   any new categories like Perfusion/Thoracic for heart-lung machines — see §6), via MUI
   Autocomplete's `groupBy`.
2. Tag `Refurbished` entries with a chip; `NewEquipment` stays unlabeled (the common
   case). The tag carries onto the `OpportunityItem` line once added, so the Products
   tab shows the deal's actual mix (new vs. refurbished) at a glance.

**Deferred:** no separate filter control for now. Revisit only if the catalog grows
large enough that grouping alone isn't enough.

## 5. Open question — does `BR-OP-01` gate flexibility extend here?

The REPEAT_ORDER work (`docs/Discussion-FastTrack-Opportunity-Creation.md`, Option D)
already relaxes Demo Date / Expected Closure Date / Clinical Evaluation requirements
when `lead_source = REPEAT_ORDER`. Accessory sales — and likely refurbished-machine
sales — are probably similarly unlikely to need a fresh Demo/Clinical Evaluation cycle.
Not deciding this here: flagging whether `BR-OP-01`'s conditional gate should eventually
key off `product_type` in addition to `lead_source`, once there's enough of this
business to justify it. **Doesn't block building §3** — the gate can stay as-is at
launch and be revisited once real volume exists.

## 6. New catalog category needed

Heart-lung/Thoracic machines have no existing `category_name` — today's Critical Care
categories are Monitoring, Ventilation, Infusion (confirmed against
`docs/Seed-Data-Demo.sql`). A new category (e.g. `Perfusion` or `Thoracic` — naming
TBD) needs to be added when this catalog data is actually entered. No schema change
needed (`category_name` is free text), just new catalog rows.

## 7. What's confirmed vs. what's still open

**Confirmed, ready to build:** `Product.product_type` (single 3-value field),
`OpportunityItem.line_type`, the `BR-FIN-03` net-value amendment, splits over net value,
the 3-section Add Product modal, the Refurbished-catalog-first business rule, and zero
`InstalledAsset` involvement.

**Still open, but non-blocking:**

1. **GST / invoicing treatment of trade-ins.** This design nets the buyback against the
   sale for pipeline/reporting purposes — confirmed as the intended *Opportunity-screen*
   math (§3.2). Still unconfirmed whether Indian tax law requires the sale and the
   buyback to be represented as two separate transactions for invoicing/GST filing
   purposes, independent of how the Opportunity total is computed. Needs input from
   whoever handles Cabio's invoicing.
2. **`BR-OP-01` gate extension** (§5) — in scope now, or deferred until volume
   justifies it?

Naming (`product_type` values, `line_type` values) are working names, revisitable.

## 8. Reference

- `backend/app/domains/asset/models.py` — `InstalledAsset` (not used by this build,
  see §3.4).
- `backend/app/domains/opportunity/models.py` — `Opportunity`, `OpportunityItem`.
- `backend/app/domains/product/models.py` — `Product`.
- `docs/Business-Rules.md` — `BR-FIN-01` (100% split rule), `BR-FIN-03` (Opportunity
  Value Calculation, amended by §3.2), `BR-OP-01` (Stage Transition Exit Criteria,
  referenced in §5), `BR-PL-02` (Coverage Plan Strategy — confirms no `InstalledAsset`
  linkage, see §2).
- `docs/Physical-Schema.sql` — `product_read_all`, `product_insert_sbu_scoped`, etc.
  (existing Product RLS, confirming no change needed for SBU-scoping).
- `docs/Discussion-FastTrack-Opportunity-Creation.md` — the REPEAT_ORDER / `BR-OP-01`
  flexibility work §5 references.
- `docs/Seed-Data-Demo.sql` — the real product catalog referenced in §6.
- `docs/Backlog.md` — tracking entry for this item.
