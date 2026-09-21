# Product Catalog: Brand / Category / Model — Implementation Plan

**Status:** Approved design, not yet built. **Supersedes** this document's
original "Part 1" (a `GENERATED ALWAYS AS (...)` column computing `name`
from same-row free-text `oem_name`/`model_number`/`category_name`). Part 1
is **not being built as originally written** — its goal (never hand-type
`name`) is folded directly into this design instead, because Part 1's
mechanism cannot survive Brand/Model/Category becoming separate tables (a
Postgres generated column can only read columns on its own row, never
another table). Building Part 1 first, then this, would mean building the
same feature twice. **Decided in a working session with Basheer,
2026-09-20** — see that session's chat log for the full reasoning behind
each decision below; this doc records outcomes, not the debate.

**Feature:** touches Signed Feature 4.1 (Module 2, "Strict product
hierarchy: category → brand → model") — closes the row's core gap
(`docs/Signed-Requirements-to-PRD-Traceability.md`: "Category and Brand are
free-text entry — no controlled/enforced pick-list").

## Context

The Product Catalog's `name`, `oem_name` (Brand), `model_number`, and
`category_name` are all independently-typed free text today. This lets a
product's display name drift from its own Brand/Model/Category, and lets
the same real brand/category be spelled multiple inconsistent ways across
products (e.g. "EDAN" vs "Edan", ~33 of 65 products with a blank Category
found in this session's audit). It also means Product Performance's
Brand-grouped report cards have no stable id to group on — only a
normalized text string (`backend/app/domains/reporting/repository.py:337-343`)
— so that drill-down is currently non-clickable.

## Chosen design: Brand, Category, and Model each become their own table

**Why not just clean up the free text and leave it as text (rejected):**
a one-time cleanup (even using Haroon's already-corrected data) fixes
today's 65 products but does nothing to stop the next product added six
months from now from drifting again — free text has no memory of what was
typed before. That's the exact mechanism that produced "EDAN" vs "Edan" in
the first place, and Signed Feature 4.1 is tracked as a standing gap, not a
one-off data cleanup.

**Why not just restrict editing to Admin/GM and keep free text (rejected):**
restricting *who* can type something doesn't fix *what* gets typed — the
original inconsistency was almost certainly entered by someone already
trusted. Access control and data-integrity are different problems; this
gap is a data-integrity problem.

**Why three tables, not enforcing the Brand→Category rule purely in the
`product` table (rejected):** Postgres cannot write a `CHECK` constraint
that looks at another table or another row — cross-record rules can only
be enforced through foreign keys (or triggers). Since "which categories a
brand's models can belong to" is a maintained list, not a fixed rule, a
real lookup table is the only mechanism available to enforce it
declaratively. The alternative is hard-coding valid combinations into
application code, which requires a code change and deploy every time
Haroon adds a model — unworkable.

**On "isn't the very first entry of a new value still free text either
way" (yes, and that's fine):** the design doesn't make the first-ever
typing of "EDAN" error-proof — nothing can. What it changes is that "EDAN"
only needs to be typed correctly **once**, at creation, instead of once
per product forever. A mistake made at that one point is one row to
review and fix, in a list of a few dozen rows; a mistake made on free text
embedded in a product row is invisible until someone happens to compare it
against another product's spelling.

## Schema

Three new tables in the existing `reference` domain (same home/shape as
`SBU`/`Zone`):

```sql
CREATE TABLE brand (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sbu_id UUID NOT NULL REFERENCES sbu(id),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (sbu_id, name)
);

CREATE TABLE category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sbu_id UUID NOT NULL REFERENCES sbu(id),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (sbu_id, name)
);

CREATE TABLE model (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brand(id),
    category_id UUID NOT NULL REFERENCES category(id),
    -- Denormalized from brand.sbu_id, kept in sync by trigger (below) --
    -- lets RLS use the same flat sbu_id check as every other table
    -- instead of a join through brand on every row-visibility check.
    sbu_id UUID NOT NULL REFERENCES sbu(id),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (brand_id, name)
);
```

**Why `model` carries both `brand_id` and `category_id`:** a specific
model is inherently one type of product — "iM70" is always a Patient
Monitor, never sometimes an Ultrasound machine. Tying Category to Model
(not leaving Category as an independent pick on the product form) is what
actually prevents an "EDAN + Ultrasound" mismatch — EDAN's models simply
can't be tagged with a category EDAN doesn't make.

**`model.sbu_id` trigger** (`BEFORE INSERT OR UPDATE ON model`): sets
`NEW.sbu_id := (SELECT sbu_id FROM brand WHERE id = NEW.brand_id)`. Keeps
the denormalized column truthful without the app ever supplying it
directly.

**`product` changes:**
- Drop `oem_name`, `model_number`, `category_name` (free text).
- Add `model_id UUID NOT NULL REFERENCES model(id)` — the only field a
  person picks directly.
- Add `brand_id UUID NOT NULL REFERENCES brand(id)` and
  `category_id UUID NOT NULL REFERENCES category(id)` — **not picked by
  the user**, auto-copied from the chosen model (see trigger below).
  Kept as real columns (not computed at read-time via joins) so the ~20
  existing consumers of `Product.oem_name`-equivalents and the reporting
  brand drill-down can filter/join on `product.brand_id` directly, and so
  RLS keeps its existing flat-`sbu_id`-check shape.
- `name` stays a real column, populated the same way (see trigger below).

**`product` trigger** (`BEFORE INSERT OR UPDATE OF model_id ON product`):
```sql
NEW.brand_id    := (SELECT brand_id FROM model WHERE id = NEW.model_id);
NEW.category_id := (SELECT category_id FROM model WHERE id = NEW.model_id);
NEW.sbu_id      := (SELECT sbu_id FROM model WHERE id = NEW.model_id);
NEW.name        := (
    SELECT b.name || ' ' || m.name || ' ' || c.name
    FROM model m JOIN brand b ON b.id = m.brand_id
                 JOIN category c ON c.id = m.category_id
    WHERE m.id = NEW.model_id
);
```
Concatenation order **Brand + Model + Category** (e.g. "EDAN iM70 Patient
Monitoring") — confirmed by Basheer, unchanged from the original plan.

A lightweight service-layer check (does `model_id` belong to the SBU the
product is being created for) gives a friendly error message before the
trigger/FK would reject it — belt-and-suspenders, not the actual
guarantee. The guarantee is the trigger + foreign keys.

## Data cutover (blocking precondition — must happen before this ships)

Source: `docs/Product-Catalog-UAT-Export-2026-09-18 - updated.xlsx`
(Haroon's corrected list, already delivered).

1. Parse the file into distinct Brand, Category, and Model rows (Model
   rows carry their Brand + Category), per SBU. One-time seeding script —
   run once, not through the product-add screen.
2. Load `brand`, `category`, `model` from that parsed data.
3. **A second reviewer (Haroon or Basheer) spot-checks the resulting
   Brand/Category/Model lists once, before go-live** — cheap precisely
   because it's a few dozen rows, not scattered across the catalog.
4. Point the 65 existing `product` rows at the correct `model_id`,
   **matched by `id`** (not by old free text), as reviewable
   `UPDATE ... WHERE id = ...` statements shown before running, same
   discipline as any other write to the shared dev database.
5. Carried over unchanged from the original plan's resolved items:
   - Remove "Magnamed Ventmeter" (verified 2026-09-18: zero references in
     `opportunity_item`/`installed_asset`/`document` — safe to delete).
   - Merge the wall-mount-stand duplicate: keep `c9619bb5-...-0977e`, give
     it a real Brand ("Accessories" or Haroon's term)/Category ("Mounting
     Hardware")/Model; delete `88bba781-...-b2f7` (verified zero
     references).
   - Add "EDAN F9" (Maternal & Fetal Monitor) as a genuinely new product.

**Implementation note:** the backend venv doesn't currently have an xlsx
reader (`openpyxl`/`pandas`) installed — confirm during implementation
whether to add one as a dev-only dependency for this one-time script, or
have Haroon re-export as CSV.

## Backend changes

- New `reference` domain additions: `Brand`, `Category`, `Model` ORM
  models (`backend/app/domains/reference/models.py`); repository/service
  per table, mirroring `ZoneAdminService`'s existing Admin/GM-write,
  all-authenticated-read pattern; schemas; router endpoints:
  - `GET /reference/brands`, `POST /reference/brands` (Admin/GM only)
  - `GET /reference/categories`, `POST /reference/categories` (Admin/GM only)
  - `GET /reference/models?brand_id=...` (cascading list), `POST /reference/models` (Admin/GM only — body includes `brand_id` + `category_id`)
- RLS on all three new tables: same flat SBU policy shape as `product`
  (`backend/alembic/versions/0012_rls_product.py`) for **read**; **write**
  (insert/update/deactivate) restricted to Admin/GM role, matching the
  precedent already set for the (now-superseded) Target-Planning brand
  table draft.
- `product/models.py`: replace `oem_name`/`model_number`/`category_name`
  columns with `brand_id`/`model_id`/`category_id`; add the trigger above
  via migration (triggers aren't expressed in the SQLAlchemy model layer —
  document the trigger's existence in a model comment, same
  cross-reference discipline the original plan used for the generated
  column).
- `product/schemas.py`: `ProductCreate`/`ProductUpdate` take `model_id`
  only (not `brand_id`/`category_id` — those are server-derived and must
  not be client-settable). `ProductResponse`/`ProductListResponse` keep
  `name` (unchanged shape) and add `brand_id`/`model_id`/`category_id`
  (or nested `BrandNested`/`ModelNested`/`CategoryNested`, matching the
  existing `SBUNested` pattern in the same file) for display.
- `product/service.py`: `create_product`/`update_product` validate the
  supplied `model_id` resolves to a model in the caller's SBU (or
  Admin/GM's target SBU) — the friendly-error check described above.
- No changes needed in `marketing_lead/repository.py`, `opportunity/schemas.py`,
  `account/workspace_schemas.py`, `audit/repository.py` — all remain
  read-only consumers of `Product.name`.
- `reporting/repository.py:337-343`: brand grouping changes from
  `func.coalesce(func.upper(func.trim(Product.oem_name)), "UNSPECIFIED")`
  to a direct `Product.brand_id`/`Brand.name` group — this is what makes
  the Product Performance brand drill-down clickable (closes the gap
  flagged in Signed Feature 4.1's Traceability note).

## Frontend changes — `sales-os-app/src/screens/ProductCatalogScreen.tsx`

- Brand field: `Autocomplete`, options from `GET /reference/brands`
  (SBU-scoped), with an inline **"+ Add new brand"** option (Admin/GM
  only) that opens a small inline creation step (name only) without
  leaving the screen.
- Model field: `Autocomplete`, options from
  `GET /reference/models?brand_id=<selected>` — empty/disabled until a
  Brand is picked. Inline **"+ Add new model"** option asks for the
  model's name **and** its Category (the one place Category is ever
  manually chosen, and only when a model is genuinely new) — Category
  itself also offers "+ Add new category" inline if needed.
- Category: **no longer a field on the product form at all** — shown
  read-only, auto-populated the moment a Model is picked (comes from
  `model.category_id`, returned by the API alongside the model).
- Product Name field: removed entirely — displayed read-only elsewhere
  (detail header, list rows), computed server-side.
- Other consumers (`OpportunityItemAddRow.tsx`, `OpportunityItemsList.tsx`,
  `OpportunityDetailScreen.tsx`, `ProjectDirectoryScreen.tsx`,
  `Customer360Screen.tsx`, `MarketingLeadCreateModal.tsx`,
  `MarketingLeadReviewQueueScreen.tsx`, the three report screens): no
  change — all read `.name`, which keeps returning a valid computed value.

## Generated-type / schema-dump regen (same PR)

1. `sales-os-app/src/types/api.ts`: regenerate via `npm run generate:types`
   against a locally running backend with this migration applied.
2. `docs/Physical-Schema.sql`: regenerate via
   `.\scripts\regen_physical_schema.ps1` after the migration lands on Dev.

## Migrations

Hand-write (not `alembic revision --autogenerate` — doesn't reliably diff
triggers or `Computed()`-style changes). Current head: `0047`.

- **`0048_brand_category_model_tables.py`**: create `brand`, `category`,
  `model` tables; `model`'s `sbu_id`-sync trigger; RLS (read: flat SBU
  check; write: Admin/GM only) on all three.
- **`0049_product_brand_model_category_fk.py`**: add
  `brand_id`/`model_id`/`category_id` columns to `product` (nullable
  first); run the seeding + backfill from the Data Cutover section above;
  set all three `NOT NULL`; drop `oem_name`/`model_number`/`category_name`;
  drop and recreate `idx_product_name_trgm` (unchanged definition — `name`
  is still a plain indexed text column, just trigger-populated instead of
  hand-typed); add the `product` name/brand/category-sync trigger. RLS on
  `product` itself is unaffected (`0012`/`0014` key only on `sbu_id`,
  which still exists).

**downgrade() for `0049`:** drop trigger → drop
`brand_id`/`model_id`/`category_id` → re-add
`oem_name`/`model_number`/`category_name` as plain nullable text. Docstring
must state plainly that downgrading **loses** the Brand/Category/Model
linkage — there's no automatic way back to free text with the original
(pre-cutover) values once this runs forward.

## Tests to fix

- `backend/tests/domains/product/test_product_service.py`: replace
  `oem_name`/`model_number`/`category_name` fixture fields with a
  `model_id` referencing a seeded test `Model`; add coverage for the
  "model_id doesn't belong to caller's SBU" rejection path.
- New: `backend/tests/domains/reference/test_brand_service.py` /
  `test_category_service.py` / `test_model_service.py` — CRUD +
  Admin/GM-only write enforcement, mirroring existing `ZoneAdminService`
  tests.
- `test_product_router.py`: grep for any raw JSON fixtures still
  containing `oem_name`/`model_number`/`category_name` and update.

## Verification

1. `pytest backend/tests/` full suite.
2. Migration dry run on a disposable DB copy: seed → backfill → spot-check
   `SELECT name, brand_id, model_id, category_id FROM product LIMIT 10;`
   → `alembic downgrade -1` to confirm the downgrade path runs.
3. `tsc`/frontend build clean after `api.ts` regen and
   `ProductCatalogScreen.tsx` edits.
4. Manual smoke test: add a product picking an existing Brand/Model,
   confirm Category and Name appear automatically; use "+ Add new model"
   for a brand-new model and confirm it requires a Category and then
   behaves identically afterward; confirm an EDAN-branded Model cannot be
   tagged with a Category that isn't one of EDAN's real categories via
   this flow (there is no path to do so from the UI, but confirm a direct
   bad-data attempt via the API is rejected too).
5. Manual check: Product Performance's Brand-grouped view is now
   clickable/drills down correctly; one opportunity item picker shows
   correct labels.

## Required follow-up edit — already done, 2026-09-20

`docs/Brand-Level-Target-Planning-Implementation-Plan.md`'s decision
section was rewritten the same day this plan was finalized: Target
Planning now references this `brand` table directly instead of building
a separate, throwaway one. See that doc's "Decision — resolved
2026-09-20" section.

## Out of scope

- Promoting this migration to UAT (normal main → Dev pipeline; UAT picks
  it up whenever migrations are next promoted there — separate tracked
  gap).
- Any Product Performance report redesign beyond the brand drill-down fix.
