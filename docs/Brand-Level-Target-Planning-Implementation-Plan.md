# Brand-Level Target Planning — Implementation Plan

**Status:** Draft — the "where does `brand` come from" decision below is now
**resolved** (2026-09-20, superseding the recommendation this doc originally
made): this feature depends on and reuses the `brand` table being built by
`docs/Product-Catalog-Name-Derivation-Implementation-Plan.md`, not a
separate standalone one. **This feature cannot start until that Product
Catalog work ships** (Basheer's call, 2026-09-19) — **"ships" means
`Signed-Requirements-to-PRD-Traceability.md` row 4.1 (Product Catalog
Management) is marked Done, i.e. its full manual E2E pass is signed off, not
merely that the code/schema is merged and Partial** (confirmed 2026-09-23,
Basheer — that row was still Partial, E2E in progress, when this plan was
reviewed). Everything else confirmed 2026-09-19 (Basheer). Builds on top of Target Planning (`docs/Target-Planning-
Implementation-Plan.md`), already live. **Feature:** extends Module 6.4/PRD §6.5
territory — a brand-level slice of §6.5 ("Product Category Targets"), not the
full product-category split, which stays deferred to Phase 2 as originally scoped.

## Context

Raised by Haroon and Latheef, 2026-09-19: Cabio receives quarterly targets from
individual brands/vendors (the principal companies), currently for **Critical
Care only** — Imaging effectively has one brand today, so this doesn't bite
there yet, but the design should hold if that changes. Haroon currently
allocates each brand's number down the org by hand, outside the system, and
wants the system to carry a brand-level breakdown so the team's own committed
numbers can be checked against what each brand actually gave.

**Confirmed 2026-09-19 (Basheer):**
1. Every person's quarterly target must be **fully split across brands** — the
   brand breakdown always sums to exactly their one total, no unassigned
   leftover. Chosen deliberately with Critical Care's multi-brand need in mind,
   even though most Imaging users will just have one 100% row today.
2. **Only GM/Admin record the vendor's own brand target** for a quarter (the
   number the brand actually gave Cabio) — matches who receives that number
   in real life today.
3. **No top-down cascade.** This does not reverse Target Planning's existing
   self-set, bottom-up, manager-approved design (`Target-Planning-
   Implementation-Plan.md` decision #1). Each person keeps typing in their own
   number and now also tags it by brand; the system adds those up. Haroon
   compares the total against the brand's own number himself — the system
   doesn't allocate or push anything down.

## Decision — resolved 2026-09-20 (was "still open")

**Where does `brand` come from?** **Reuses the `brand` table built by
`docs/Product-Catalog-Name-Derivation-Implementation-Plan.md`** — this
doc's original recommendation (a separate, standalone, Target-Planning-only
brand list, decoupled from Product Catalog) is **rejected**. Basheer's call,
2026-09-19: fix Product Catalog's Brand/Category/Model properly first, and
have every downstream feature — including this one — consume that single
source of truth, rather than let a second, competing brand list exist.
**Consequence: this feature is blocked on that Product Catalog work
shipping first**, not independent of it as originally assumed here.

## Backend changes

### `brand` table — already exists, built by Product Catalog's plan

No new table here. `docs/Product-Catalog-Name-Derivation-Implementation-
Plan.md` already creates:

```sql
CREATE TABLE brand (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sbu_id UUID NOT NULL REFERENCES sbu(id),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (sbu_id, name)
);
```

Seeded and maintained through Product Catalog's own inline "+ Add new
brand" flow (Admin/GM only) — this feature only ever **reads** `brand`, it
does not add its own creation/maintenance path. `sbu_id` on the row already
prevents a Critical Care person from tagging a split against an
Imaging-only brand, and vice versa — no change needed here.

RLS: already open-read/Admin-GM-write per Product Catalog's plan — nothing
to add for this feature.

### `target_plan` — add the per-brand breakdown

New child table rather than changing `target_plan`'s own shape — keeps the
existing "my one number for the quarter" UX on `TargetPlan` itself intact,
with the brand split as an add-on layer underneath it:

```sql
CREATE TABLE target_plan_brand_split (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_plan_id UUID NOT NULL REFERENCES target_plan(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brand(id),
    split_amount_lakhs NUMERIC(15,2) NOT NULL CHECK (split_amount_lakhs >= 0),
    UNIQUE (target_plan_id, brand_id)
);
```

RLS: no separate policy needed if the service layer always writes/reads it
scoped through its parent `target_plan_id` — but Backend-Implementation-
Standards.md's own convention is every table gets RLS, so mirror
`target_plan`'s four policies exactly, substituting a `target_plan_id IN
(SELECT id FROM target_plan WHERE <same predicate>)` subquery for each one,
same pattern already used for `coverage_plan_entry` → `coverage_plan`.

### New table: `brand_vendor_target` — the number GM/Admin records

```sql
CREATE TABLE brand_vendor_target (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brand(id),
    planning_period VARCHAR(10) NOT NULL CHECK (planning_period ~ '^\d{4}-Q[1-4]$'),
    vendor_target_amount_lakhs NUMERIC(15,2) NOT NULL,
    UNIQUE (brand_id, planning_period)
);
```

RLS: read open to all (everyone should be able to see the bar they're
collectively aiming for); write restricted to Admin/GM (decision #2).

### Service layer

- `TargetPlanService.create_target_plan`/`update_target_plan`: accept an
  optional list of `{brand_id, split_amount_lakhs}` alongside the existing
  `target_amount_lakhs`; **validate the splits sum to exactly the total**
  (decision #1 — mandatory, no partial). Reject with a clear error otherwise,
  same "service layer gives a real error, RLS is just the backstop" pattern
  Target Planning already uses. A brand-split change on an `APPROVED` plan
  **must trigger the same `status` reset to `PENDING_APPROVAL`** (clearing
  `approved_by`/`approved_at`) that a `target_amount_lakhs` change already
  triggers (`Target-Planning-Implementation-Plan.md` decision #5) — the
  split is part of what the manager approved, so re-shuffling it without
  re-approval would let a rep quietly move credit between brands on an
  already-approved plan. Confirmed 2026-09-23 (Basheer).
- `BrandService`: **no new service** — Product Catalog's plan already builds
  CRUD for `brand`, Admin/GM only. This feature just reads from it.
- `TargetPlanService.get_brand_rollup(brand_id, planning_period)`: `SUM(
  split_amount_lakhs)` across every `target_plan_brand_split` row for that
  brand/period — the "what our people committed to" side of the comparison.
  Same computed-on-read shape as the existing SBU rollup, no new stored
  aggregate.
- `BrandVendorTargetService.set_vendor_target(brand_id, planning_period,
  amount)`: Admin/GM only, upsert semantics (a brand's number for a quarter
  can be corrected, not just entered once).

### Router

- `/reference/brands` endpoints: **already built by Product Catalog's
  plan** — this feature only calls the existing `GET`, no new endpoint.
- `POST/GET /planning/brand-vendor-targets` (Admin/GM write, everyone read).
- `GET /planning/targets/brand-rollup?brand_id=&planning_period=` → returns
  both numbers together: `{ committed_total, vendor_target, gap }` — this is
  the actual screen Haroon wants to look at, so the API should hand back the
  comparison pre-computed rather than making the frontend do the subtraction.

## Frontend changes

- `TargetPlanningScreen.tsx`: when creating/revising a target, add a
  brand-split section (brand picker + amount per row, scoped to the person's
  own `sbu_id`) that must sum to the total before save — mirrors the existing
  `FormModal` pattern, with a running "remaining to allocate" indicator like
  other multi-line forms in this app (e.g. Opportunity split editing).
- New `BrandTargetTrackingScreen.tsx` (or a section added to the existing
  rollup view) — Admin/GM only: per brand, per quarter, shows the vendor's
  number, the team's committed total, and the gap. This is the screen that
  answers Haroon's actual question.

## Out of scope for this pass

- Full product-category target split (PRD §6.5's broader ask) — stays
  deferred to Phase 2, unchanged from the original Target Planning plan.
- Any top-down push/cascade of targets down the hierarchy — deliberately not
  built; see decision #3 above.
- Reconciling the new `brand` table with Product Catalog's `oem_name` —
  separate, unrelated clean-up already tracked in `docs/Backlog.md`.
- Imaging brand splits — schema supports it, but no seeded brand list there
  yet; add rows if/when Imaging actually needs it.

## Verification

- Backend: new repository/service tests — split-sum validation (reject a
  mismatched split, accept an exact one), Admin/GM-only enforcement on brand
  and vendor-target writes, rollup arithmetic.
- Manual E2E, Critical Care roles: a Sales Staff and an Area Manager each
  split their target across 2+ brands; GM enters a vendor target for one
  brand; confirm the comparison screen shows the correct committed-vs-vendor
  gap; confirm a non-Admin/GM role cannot edit the brand list or vendor
  target (clean `AuthorizationError`, not a silent failure).
