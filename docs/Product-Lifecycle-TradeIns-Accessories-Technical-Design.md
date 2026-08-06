# Design Note: Product Lifecycle — Trade-Ins, Refurbished Inventory, and Accessories

**Origin:** Raised by Haroon Sidheeq (GM & Sales Head), 2026-08-05, in the same
discussion as Issues 1 and 2.
**Status:** Design drafted, not yet in `docs/Backlog.md`. Convert once Section 7's open
items are resolved.
**Scope:** Backend/data model design. Not a leadership discussion paper — this is the
technical shape to review before it becomes backlog work.

---

## 1. Business context

Cabio's business includes more than new-equipment sales:

- **Trade-in / upgrade deals.** Cabio offers a customer an upgrade: buy back their old
  machine, sell a new one, net the buyback value off the deal.
- **Refurbished inventory.** Traded-in machines get refurbished and resold — primarily
  in Critical Care today, may extend to Imaging.
- **Accessories.** Sold alongside or independent of equipment — also primarily Critical
  Care today.

None of these three are representable in the system today. They share one thread —
equipment has a lifecycle beyond a single new-unit sale — so this note treats them as
one connected design rather than three separate asks.

## 2. What exists today

- **`InstalledAsset`** (`backend/app/domains/asset/models.py`) — tracks what's
  currently installed at a customer site, Cabio's own product or a competitor's
  (`is_competitor_equipment` / `competitor_product_name`). Independent of any
  Opportunity — used to know when a machine is due for upgrade, feeding Coverage
  planning. **No status/active field** — nothing marks a record as no longer current.
- **`OpportunityItem` / `BR-FIN-03`** — `Extended Value = Quantity × Unit Price –
  Discount`; `Opportunity Value = Sum of Extended Values` once items exist. This is the
  single source of truth for deal value, feeding splits (`BR-FIN-01`) and pipeline
  rollups (ADR-013).
- **`Product`** — `sbu_id`-scoped for writes (RLS: create/update/delete restricted to
  the owning SBU or Admin/GM), read open to everyone (`product_read_all USING (true)`).
  `category_name` is free text describing modality (CT, MRI, Ventilation, etc.). No
  field distinguishes equipment from accessory, or new from refurbished.

## 3. Trade-in / buyback

### 3.1 New table: `opportunity_trade_in`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `opportunity_id` | UUID FK → `opportunity` | |
| `installed_asset_id` | UUID FK → `installed_asset`, nullable | Populated when the traded-in machine was already tracked at the account; free-text fallback below if not |
| `value_lakhs` | NUMERIC(15,2) | The buyback credit |
| `description` | text, nullable | Free-text detail when there's no linked `InstalledAsset` |

`InstalledAsset` stays the standing record of what's currently installed, independent
of any Opportunity — `opportunity_trade_in` references it, not the other way around, so
a trade-in is modeled as an event that happens *to* an asset, not a property of the
asset itself.

### 3.2 `InstalledAsset.is_active`

New boolean, default `true` — the same convention already used elsewhere (`Product`,
reference tables via `ReferenceRepository.list_active()`).

**Business rule, not just schema:** creating an `opportunity_trade_in` row against a
given `installed_asset_id` sets that asset's `is_active = False` in the same
transaction. Without this, Coverage planning keeps surfacing an already-traded-in
machine as "ready for upgrade" indefinitely — the record stays for history (this
hospital had this ventilator from X to Y), but stops appearing in whatever query
currently identifies upgrade candidates.

### 3.3 `BR-FIN-03` amendment

> `Opportunity Value = Sum of Extended Values − Sum of Trade-In Values`

Keeps three numbers independently visible: gross new-equipment value, trade-in cost,
and net deal value — rather than one blended figure. Splits apply to the net value,
consistent with how item-level discounts already flow into the split base today.

## 4. Product classification — Accessories and Refurbished

### 4.1 New fields on `Product`

- `product_type`: `EQUIPMENT` | `ACCESSORY`
- `condition`: `NEW` | `REFURBISHED`

Two independent fields, not one combined enum (`NEW_EQUIPMENT`,
`REFURBISHED_EQUIPMENT`, `ACCESSORY`...) — they're orthogonal questions, and keeping
them separate lets revenue be sliced by either axis independently without losing
`category_name` (modality), which stays exactly as it is today.

### 4.2 `Product.source_installed_asset_id`

Nullable FK → `installed_asset`. Populated when a refurbished product's stock traces
back to a specific trade-in, preserving provenance ("this refurbished unit came from
Hospital X's 2026 upgrade") without forcing every refurbished item to have one — some
refurbished stock may come from other channels.

### 4.3 Worked example, real catalog

| Product | `category_name` (unchanged) | `product_type` | `condition` |
|---|---|---|---|
| 128-Slice CT Scanner | CT | Equipment | New |
| 1.5T MRI System (refurbished unit from a trade-in) | MRI | Equipment | Refurbished |
| ICU Ventilator | Ventilation | Equipment | New |
| Multi-Parameter Patient Monitor | Monitoring | Equipment | New |
| *(Critical Care's actual accessory SKUs, once catalogued)* | Ventilation / Monitoring / Infusion | Accessory | New |

## 5. Product picker UX (Opportunity → Products tab)

**Current state:** flat dropdown, up to 100 products per SBU
(`OpportunityDetailScreen.tsx`, `listProducts({ sbu_id })`), no grouping or filtering.

**Proposed:**
1. Group the picker by `category_name` — the existing modality values (CT, MRI, X-Ray,
   Ultrasound, Fluoroscopy for Imaging; Monitoring, Ventilation, Infusion for Critical
   Care), via MUI Autocomplete's `groupBy`. No new categories invented.
2. Tag each option with `product_type`/`condition` where they're not the default —
   Equipment/New stays unlabeled (the common case), a chip appears only for
   `Accessory` or `Refurbished`.
3. The same tag carries onto the `OpportunityItem` line once added, so the Products
   tab shows the deal's actual mix (new equipment / accessory / refurbished) at a
   glance.

**Deferred:** no separate filter control for now. Revisit only if the catalog grows
large enough, once real accessory SKUs are entered, that grouping alone isn't enough.

## 6. Open question — does `BR-OP-01` gate flexibility extend here?

The REPEAT_ORDER work (`docs/Discussion-FastTrack-Opportunity-Creation.md`, Option D)
already relaxes Demo Date / Expected Closure Date / Clinical Evaluation requirements
when `lead_source = REPEAT_ORDER`. Accessory sales — and likely refurbished-machine sales —
are probably similarly unlikely to need a fresh Demo/Clinical Evaluation cycle. Not
deciding this here: flagging whether `BR-OP-01`'s conditional gate should eventually
key off `product_type`/`condition` in addition to `lead_source`, once there's enough
of this business to justify it.

## 7. What's confirmed vs. what needs a decision before Backlog conversion

**Confirmed in shape** (from discussion, not yet implemented): the `opportunity_trade_in`
table, `InstalledAsset.is_active`, the `BR-FIN-03` amendment, `product_type`/`condition`
on `Product`, `source_installed_asset_id`, and the picker grouping approach.

**Still needs a decision:**

1. **Splits over net value** — confirm with Haroon that split percentages should apply
   to the post-trade-in net value, not gross (Section 3.3).
2. **GST / invoicing treatment of trade-ins** — this note assumes the buyback simply
   nets against the sale for pipeline/reporting purposes. Worth confirming with
   whoever handles Cabio's invoicing whether Indian tax treatment requires the sale and
   the buyback to be represented as two separate transactions rather than one netted
   Opportunity value — if so, `opportunity_trade_in.value_lakhs` may need to feed a
   genuinely separate accounting record, not just subtract from `Opportunity Value`.
3. **`BR-OP-01` gate extension** (Section 6) — in scope now, or deferred until volume
   justifies it?
4. **Naming** — `product_type`/`condition` value names (`EQUIPMENT`/`ACCESSORY`,
   `NEW`/`REFURBISHED`) are working names, revisitable.

## 8. Reference

- `backend/app/domains/asset/models.py` — `InstalledAsset`.
- `backend/app/domains/opportunity/models.py` — `Opportunity`, `OpportunityItem`.
- `backend/app/domains/product/models.py` — `Product`.
- `docs/Business-Rules.md` — `BR-FIN-01` (100% split rule), `BR-FIN-03` (Opportunity
  Value Calculation, amended by Section 3.3), `BR-OP-01` (Stage Transition Exit
  Criteria, referenced in Section 6).
- `docs/Physical-Schema.sql` — `product_read_all`, `product_insert_sbu_scoped`, etc.
  (existing Product RLS, confirming no change needed for SBU-scoping).
- `docs/Discussion-FastTrack-Opportunity-Creation.md` — the REPEAT_ORDER / `BR-OP-01`
  flexibility work this note's Section 6 references.
- `docs/Seed-Data-Demo.sql` — the real product catalog used in Section 4.3's example.
- `docs/Backlog.md` — where this converts to tracked items once Section 7 is resolved.
