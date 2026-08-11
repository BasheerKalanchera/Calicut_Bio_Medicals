# Opportunity Items Picker Unification — Implementation Plan

**Status:** Planned — pending Basheer's review, not yet started.
**Date:** 2026-08-11
**Prepared by:** Basheer Kalanchera (with Claude)
**Purpose:** Concrete, ordered implementation plan to bring the Product/Accessory/
Buyback 3-way add-mode (BR-CAT-02/BR-CAT-03) to all 4 opportunity create/edit
entry points, by extracting the picker logic into shared components instead of
copy-pasting it a 4th and 5th time.

---

## Context

`OpportunityDetailScreen.tsx`'s Products tab is the only place in the app that
lets a rep add an Accessory or Buyback line — it got the 3-way mode split during
the Product Lifecycle build (2026-08-07) and today's Buyback free-text change
(`docs/Buyback-Freetext-Implementation-Plan.md`). The other 3 of the 4 opportunity
create/edit entry points identified in `docs/Discussion-FastTrack-Opportunity-
Creation.md` (`QuickLeadModal.tsx`, `Customer360Screen.tsx`, `ProjectDirectoryScreen.jsx`)
were never touched by either build and still only support a flat Product picker.
Basheer flagged this as a gap after testing the "New Opportunity" creation modal
and not finding Accessory/Buyback there.

Rather than copy the 3-way logic into 2 more places (it's effectively already
duplicated 4 ways — see below), this plan extracts it into shared components
used by all of them.

**Backend needs zero changes.** `OpportunityCreate.items` already reuses
`OpportunityItemCreate` (confirmed during today's Buyback build), and `add_item`/
`replace_items` already carry today's fixes. This is a frontend-only refactor.

## Confirmed current state (verified directly against the codebase)

**`OpportunityDetailScreen.tsx`** (`ProductsTab`, lines ~290-620) — the only
complete 3-way implementation. Single inline editable panel (not a secondary
modal), since this screen is already a full detail tab, not a compact create
form. This is the reference implementation to extract from.

**`QuickLeadModal.tsx`** (the "New Opportunity" creation modal) — flat Product
picker only, no `line_type`/`description` at all. Two-step UX: a compact
summary row + "+ Add Products" button inside the main `FormModal`, which opens
a *secondary* `FormModal` titled "Products" containing the editable item list
and the add-row (lines ~329-477). `ProductOption` (line 25) is `{id, name}` —
no `product_type`. `handleSubmit`'s payload mapping (lines ~177-182) strips
items down to `product_id`/`quantity`/`unit_price_lakhs`/`discount_lakhs`.

**`Customer360Screen.tsx`** — has **two** call sites, both flat-only, but
already sharing one hoisted-to-module-scope component, `OppItemAddRow`
(lines 521-562) — so this file already centralized its own duplication once;
it just never got the 3-way logic.
- **New-Opportunity creation** (`newO*` state) — same 2-step UX as
  `QuickLeadModal.tsx` (summary + secondary "Products" modal, lines ~1542-1600).
  `handleCreateOpp` (line ~1156) does a one-shot `createOpportunity(...,
  {items: [...]})` call, payload stripped the same way as QuickLeadModal.
- **Existing-Opportunity edit** (`editO*` state) — same 2-step UX (lines
  ~1668-1730). Persistence is **not** a bulk replace: `handleUpdateOpp`
  (lines ~1176-1230) diffs `editOItems` against `editOOriginalItemIds`
  (snapshotted when the modal opened, line ~929) and fires individual
  `addOpportunityItem`/`deleteOpportunityItem` calls for just what changed.

**`ProjectDirectoryScreen.jsx`** — two distinct opportunity flows, only one of
which has an item picker at all:
- **"Add Opportunity" (create)** (`handleCreateOpp`, lines ~215-239) — **has no
  item picker today.** Creates the Opportunity bare; nothing about this plan
  changes that (see Open judgment call #2 below).
- **"Edit Opportunity"** (`openEditOpp`/`handleUpdateOpp`, lines ~105-198,
  item UI lines ~560-630) — same diffing-persistence pattern as Customer360's
  edit flow, but rendered in **raw Tailwind** (`<select>`, `<input>`,
  `inputClass`/`labelClass` string constants), not MUI. This file is on
  `Frontend-Implementation-Standards.md` §9's pending-migration list and is
  grandfathered file-wide in `check-no-tailwind.js` — it will not fail CI left
  as-is. But the shared components this plan builds are MUI, so this one block
  needs converting to consume them. Same partial-conversion pattern already
  used on this file's "Add Opportunity" *fields* during the Fast-Track build
  (`docs/Discussion-FastTrack-Opportunity-Creation.md`) — does not graduate the
  file off the §9 pending list, just narrows what's still Tailwind inside it.
  Fourteen `eslint-disable` suppressions are banked for this file's
  pre-migration patterns (§9) — confirm none of them cover the lines being
  touched before removing/narrowing anything; per §9, an early removal breaks
  the commit gate for the rest of the file.

**No frontend test runner exists** (`sales-os-app/package.json` has no
`test`/`vitest` script). Verification here is `tsc --noEmit` + `npm run lint`
(incl. the Tailwind guard) + Basheer's manual E2E — same as every other
frontend change in this project.

**Netting is inconsistent today, not just incomplete.** `OpportunityDetailScreen.tsx`
computes totals Buyback-aware (`signedValue` — BUYBACK subtracts). The other 4
call sites all sum plainly (`quantity * unit_price - discount`, no sign
handling) because they've never had a Buyback line to net. Once they can, this
becomes a real correctness bug if not fixed alongside the picker itself, not
just a cosmetic gap.

## Design

### New shared files

1. **`src/types/opportunityItems.ts`** — one shared draft-item type used
   everywhere a screen builds up an editable item list:
   ```ts
   export interface DraftOpportunityItem {
     id?: string;                        // present only for rows loaded from an
                                          // existing Opportunity (edit-flow diffing)
     product_id: string | null;
     description?: string | null;
     product_name?: string;
     product_type?: string;
     quantity: number;
     unit_price_lakhs: number;
     discount_lakhs: number;
     line_type: "PRODUCT" | "BUYBACK";
   }
   ```
2. **`src/utils/opportunityItems.ts`** — `signedValue(item)` and
   `itemsTotal(items)` (BR-FIN-03: Buyback nets negative), extracted from
   `OpportunityDetailScreen.tsx`'s current `signedValue`, used by every
   running-total display across all 5 call sites.
3. **`src/components/OpportunityItemAddRow.tsx`** — the 3-way add-row:
   `ToggleButtonGroup` (Product/Accessory/Buyback) + Product `Autocomplete` /
   Accessory `TextField select` / Buyback multiline free-text + Qty/Price/Disc
   fields + validation + "+ Add" button. Extracted from
   `OpportunityDetailScreen.tsx`'s current inline block (the only complete
   reference). Props: `products: ProductOption[]` (already SBU-filtered),
   `onAdd(item: DraftOpportunityItem): void`. The add-row owns its own
   transient input state internally (mode, prodId, description, qty, price,
   disc, validation error) — each screen no longer needs its own copy of
   `itemProdId`/`itemQty`/`itemPrice`/`itemDisc`/`addItemError` state
   (currently duplicated per call site, e.g. `QuickLeadModal.tsx` lines
   62-66). A screen's wiring shrinks to just the `items` array state and an
   `onAdd`/remove handler.
4. **`src/components/OpportunityItemsList.tsx`** — renders already-added
   items: name/description + Refurbished/Buyback chips + qty/price/disc +
   remove button + running total via `itemsTotal`. One component, a
   `variant="summary" | "editable"` prop rather than two — `"summary"` for the
   compact collapsed row shown in the main form (QuickLeadModal/Customer360/
   ProjectDirectoryScreen), `"editable"` for the full row-editing view (their
   secondary "Products" modal, and `OpportunityDetailScreen`'s inline panel).

### Per-screen wiring (5 call sites across 4 files)

- **`OpportunityDetailScreen.tsx`** — replace the inline add-row + item-row
  JSX in `ProductsTab` with `OpportunityItemAddRow` + `OpportunityItemsList
  variant="editable"`. Pure extraction, no behavior change — this is the
  reference implementation moving, not new logic. Do this one first and treat
  it as a regression check before touching anything else.
- **`QuickLeadModal.tsx`** — `ProductOption` gains `product_type: string`;
  swap the compact section for `OpportunityItemsList variant="summary"` and
  the secondary modal's contents for `variant="editable"` + `OpportunityItemAddRow`;
  `LineItem` replaced by the shared `DraftOpportunityItem`; `handleSubmit`'s
  payload mapping extended to pass `description`/`line_type` through.
- **`Customer360Screen.tsx`** (both call sites) — replace the existing
  `OppItemAddRow` (flat-only) with the new shared components — this actually
  *removes* one of the duplicated copies, since Customer360 had already
  centralized its own. `oppItemsData` seeding (line ~929), `handleCreateOpp`'s
  payload (line ~1156), and the `toAdd.map(addOpportunityItem(...))` diffing
  call (line ~1225) all extended to carry `description`/`line_type`/
  `product_type` through.
- **`ProjectDirectoryScreen.jsx` — Edit Opportunity flow** — convert the
  item-picker + item-list block (~lines 560-630) from raw Tailwind to the
  shared MUI components; `openEditOpp`'s item-mapping (line ~129) and
  `handleUpdateOpp`'s `addOpportunityItem` call (line ~188) extended the same
  way as Customer360's edit flow.
- **`ProjectDirectoryScreen.jsx` — Add Opportunity (create) flow — net-new
  Products section (decided below, was previously out of scope).** This flow
  has no item picker today at all — `handleCreateOpp` (lines ~215-239) never
  sends `items`. Add: `addOppItems: DraftOpportunityItem[]` state (reset in
  `openAddOpp`, line ~200); reuse the same `oppProducts` loader already used
  by the edit flow (`openAddOpp` gains the same `oppProducts.length === 0 &&
  listProducts(...)` population call `openEditOpp` already does, line ~125 —
  one shared product list for both flows, not a second copy); a Products
  section in the "Add Opportunity" `FormModal` (lines ~464+) using
  `OpportunityItemsList variant="summary"` + a secondary "Products" modal with
  `variant="editable"` + `OpportunityItemAddRow`, matching the shell every
  other create/edit modal in this plan uses (see UX shell decision below);
  `handleCreateOpp`'s payload extended to send `items` (currently omitted
  entirely) mapped the same way as the other create flows.

### Business-Rules.md / backend

No changes. BR-CAT-03 already states the rule generically ("a Buyback line
item on an Opportunity"), not scoped to one screen — just re-read it once this
ships to confirm it still reads correctly now that it's true everywhere, not
edit it preemptively.

## Resolved decisions (2026-08-11)

1. **UX shell — unify the 4 compact-modal call sites, keep
   `OpportunityDetailScreen.tsx` inline as a deliberate exception.**
   `QuickLeadModal`, both `Customer360Screen` flows, and
   `ProjectDirectoryScreen.jsx`'s create *and* edit flows (the create flow is
   net-new, see decision #2) all use the same "compact summary row +
   secondary Products modal" shell — this falls out for free from all 4
   consuming the same `OpportunityItemsList`/`OpportunityItemAddRow`
   components the same way, no extra design work needed.
   `OpportunityDetailScreen.tsx`'s Products tab stays a single inline panel,
   unchanged shell — it's a dedicated tab with no space pressure, and it's
   the highest-traffic, most-iterated-on item-management surface in the app;
   forcing it into the modal shell would add a click to the most frequent
   workflow for a purely cosmetic consistency gain, at the cost of a full
   regression pass on the screen with the most history of subtle bugs.
2. **`ProjectDirectoryScreen.jsx`'s "Add Opportunity" (create) flow gets a
   net-new Products section, built in this pass.** See the per-screen wiring
   section above — this is genuinely new functionality (the flow has none
   today), not a refactor, so it gets extra scrutiny in manual verification.
3. **Persistence mechanism stays split — not unified.** Customer360/
   ProjectDirectoryScreen's edit flows keep per-item `add_item`/`delete_item`
   diffing against an original-ID snapshot; `OpportunityDetailScreen.tsx`
   keeps its existing bulk `replace_items` call. This is a deliberate
   safety trade-off, not an inconsistency left unfixed: diffing only ever
   sends the specific add/delete operations the current user actually made,
   so a concurrent edit by someone else on the same Opportunity (a
   split participant, a manager) survives untouched. Bulk `replace_items`
   sends the entire locally-held item list as the new source of truth on
   every save, silently overwriting anything added concurrently that this
   browser tab never knew about — an existing, accepted risk on
   `OpportunityDetailScreen.tsx` today, but not one to newly introduce into
   the 2 flows that don't have it. New: `ProjectDirectoryScreen.jsx`'s
   new create-flow Products section (decision #2) is a one-shot
   `createOpportunity(..., {items})` call like the other 3 create flows —
   diffing doesn't apply there (nothing exists yet to diff against).

## Verification

No frontend test runner in this repo — `tsc --noEmit` + `npm run lint` (incl.
Tailwind guard), then Basheer's manual E2E across all 5 call sites:

1. `OpportunityDetailScreen` Products tab — unchanged behavior after the
   extraction (regression check, do first).
2. `QuickLeadModal` "New Opportunity" — create with an Accessory line, create
   with a Buyback line, confirm the total nets correctly, confirm the payload
   actually lands (`description`/`line_type` visible afterward in
   `OpportunityDetailScreen`).
3. `Customer360Screen` "New Opportunity" — same as #2, different entry point.
4. `Customer360Screen` "Edit Opportunity" — add/remove Accessory and Buyback
   lines, confirm the diffing add/delete calls fire correctly (not a bulk
   replace).
5. `ProjectDirectoryScreen` "Edit Opportunity" — same as #4, plus confirm the
   file's other (untouched) Tailwind sections still render fine.
6. `ProjectDirectoryScreen` "Add Opportunity" — net-new: confirm a Products
   section now appears at all, create with an Accessory line, create with a
   Buyback line, confirm the total nets correctly, confirm the created
   Opportunity actually has the items afterward (previously this flow sent no
   `items` whatsoever — verify the payload change actually took, not just
   that the UI renders).

## Ordering

1. Shared type + netting helper (`types/opportunityItems.ts`,
   `utils/opportunityItems.ts`)
2. `OpportunityItemAddRow.tsx` (extract from `OpportunityDetailScreen.tsx`)
3. `OpportunityItemsList.tsx` (extract from the same)
4. Refactor `OpportunityDetailScreen.tsx` to consume both — regression check
   before proceeding
5. `QuickLeadModal.tsx`
6. `Customer360Screen.tsx` (both call sites)
7. `ProjectDirectoryScreen.jsx` (partial MUI conversion of the edit-item block
   + wiring)
8. `tsc --noEmit` + lint across the whole frontend
9. Basheer's manual verification per the checklist above

### Critical files
- sales-os-app/src/types/opportunityItems.ts (new)
- sales-os-app/src/utils/opportunityItems.ts (new)
- sales-os-app/src/components/OpportunityItemAddRow.tsx (new)
- sales-os-app/src/components/OpportunityItemsList.tsx (new)
- sales-os-app/src/screens/OpportunityDetailScreen.tsx
- sales-os-app/src/components/QuickLeadModal.tsx
- sales-os-app/src/screens/Customer360Screen.tsx
- sales-os-app/src/screens/ProjectDirectoryScreen.jsx
