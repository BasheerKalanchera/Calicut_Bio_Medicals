# Product Catalog: Name Derivation — Implementation Plan

**Status:** Approved, ready to build — both open questions (Ventmeter
removal safety, wall-mount-stand duplicate) resolved and verified
2026-09-18. **Feature:** touches Signed Feature
4.1 (Module 2, "Strict product hierarchy: category → brand → model").
**Confirmed by Haroon**, 2026-09-18: stop entering a product's `name` by
hand — compute it automatically from Brand + Model + Category instead.
**Concatenation order confirmed by Basheer:** Brand + Model + Category
(e.g. "EDAN iM70 Patient Monitoring"), not Category-first.

## Context

The Product Catalog's `name` field is free text, entered independently of
`oem_name` (Brand), `model_number`, and `category_name`. This lets a
product's display name silently drift from its own Brand/Model/Category —
the root cause behind Signed Feature 4.1 sitting at Partial in
`docs/Signed-Requirements-to-PRD-Traceability.md`, and the exact
inconsistency surfaced this session comparing the current UAT catalog
against a corrected export Haroon shared (e.g. "EDAN" vs "Edan" brand
casing, ~33 of 65 products with a blank Category).

## Chosen approach: database-computed column, not column removal

Two ways exist to make `name` "always Brand+Model+Category, never
hand-typed": delete the column entirely and rebuild the text in every
place that reads it, or keep `name` as a real column but let Postgres
compute it. This plan uses the second — a `GENERATED ALWAYS AS (...)
STORED` column:

- The database physically rejects any attempt to set `name` directly on
  INSERT/UPDATE — stronger than an app-level "read-only field" convention.
- Every existing reader of `product.name` keeps working completely
  unchanged, since `name` remains a real, populated column. An inventory
  this session found **5 backend domains** (product, reporting,
  marketing_lead, opportunity, account) and **~15 frontend files**
  (reports, opportunity item pickers, Customer 360, marketing lead
  modals, audit log) reading `.name` read-only — none of them need to
  change.
- Rejected alternative (full column removal) would require rewriting the
  concatenation logic separately in all ~20 of those read sites for the
  same end result — much larger blast radius, no added benefit.

## Out of scope for this plan

- **Brand/Category free-text inconsistency itself** ("EDAN" vs "Edan",
  "SonoScape" vs "Sonoscape") is not fixed by this change. This plan stops
  a *fourth* free-text field (`name`) from independently drifting from
  Brand/Model/Category — it does not convert Brand/Category into a
  controlled list. That's a separate, larger piece of work already noted
  in `docs/Backlog.md`.
- **Promoting this migration to UAT.** This ships through the normal
  main → Dev pipeline like any other migration; UAT picks it up whenever
  migrations are next promoted there — a separate, already-tracked gap
  (see this session's UAT selective-migration discussion).

## Wall-mount-stand duplicate — resolved

Two existing UAT products were the same physical item (a monitor
wall-mount bracket) entered twice under slightly different names
("Monitor Wall mount stand" `c9619bb5-...`0977e` / "Wall- Monitor Stand"
`88bba781-...b2f7`), both with Brand, Category, and Model entirely blank.
**Decision (Basheer, 2026-09-18): keep only one.** Verified 2026-09-18
(read-only UAT check): both rows have zero references in
`opportunity_item`, `installed_asset`, and `document` — safe to delete
either with no repointing needed. Plan: keep `c9619bb5-...-0977e`
("Monitor Wall mount stand"), give it Brand = "Accessories", Category =
"Mounting Hardware" (or whatever Haroon's final term is), Model = a
real value instead of blank; delete `88bba781-...-b2f7` outright.

## Data-cleanup precondition (must land in Dev before migration 0048 runs)

Apply Haroon's corrected `category_name`/`oem_name`/`model_number` values
to the 65 existing products, **matched by `id`** (not by `name`, which is
disappearing) — generated as reviewable `UPDATE ... WHERE id = ...`
statements per product, shown before running, same as any other write to
a shared dev/UAT database. Also, per this session's confirmed decisions:

- Remove the "Magnamed Ventmeter" product (intentionally dropped, confirmed).
  Verified 2026-09-18 (read-only UAT check): zero references in
  `opportunity_item`, `installed_asset`, or `document` — safe to delete
  outright, no deal or record depends on it.
- Add "EDAN F9" (Maternal & Fetal Monitor) as a genuinely new product (confirmed).
- Drop the 5 stray blank rows and trim leading/trailing whitespace from
  Haroon's Category/Model values before using them as UPDATE source data.
- Resolve the wall-mount-stand question above.

If this data-fix runs before the schema migration, the generated `name`
values are correct from day one; if skipped, `name` computes to `''` or
an incomplete string for whichever products weren't corrected first.

## Migration `backend/alembic/versions/0048_<slug>.py`

Hand-write this migration (do not use `alembic revision --autogenerate`
— it doesn't reliably diff `Computed()` column changes on an existing
populated column). `down_revision = "0047"`.

**Expression** (Brand + Model + Category, NULL-safe — all functions used
are Postgres-immutable, legal in a generated column):

```sql
TRIM(
  COALESCE(oem_name || ' ', '') ||
  COALESCE(model_number || ' ', '') ||
  COALESCE(category_name, '')
)
```

**upgrade():**
1. `op.drop_index("idx_product_name_trgm", table_name="product")` — must precede the column drop.
2. `op.drop_column("product", "name")`.
3. `op.add_column("product", sa.Column("name", sa.String(255), sa.Computed("TRIM(COALESCE(oem_name || ' ', '') || COALESCE(model_number || ' ', '') || COALESCE(category_name, ''))", persisted=True), nullable=False))`.
4. `op.create_index("idx_product_name_trgm", "product", ["name"], postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"})` — identical definition to `0003_product_indexes.py`.
5. No RLS changes — `0012_rls_product.py`/`0014_product_rls_open_read.py` policies key only on `sbu_id`, never `name`. State this explicitly in the migration docstring so a future reader doesn't have to re-verify it.
6. Docstring must state: the data-cleanup precondition above, and that `docs/Physical-Schema.sql` needs regenerating after this runs (see below).

**downgrade():** drop index → drop generated column → re-add plain `String(255) NOT NULL` column (temporary `server_default=""`, then drop the default) → recreate index. Docstring must state plainly that downgrading **irrecoverably loses** the original free-text `name` values — they're never captured anywhere once dropped in `upgrade()`.

## Backend code changes

- **`backend/app/domains/product/models.py`** L21: change `name: Mapped[str] = mapped_column(String(255), nullable=False)` to use `Computed(...)` with the *identical* expression string used in the migration (add `Computed` to the `sqlalchemy` import on L3). Cross-reference the migration file in a comment, and vice versa — nothing else keeps the two strings in sync.
- **`backend/app/domains/product/schemas.py`**:
  - `ProductCreate` (L14-21): remove `name: str` (L15); change `oem_name`, `model_number`, `category_name` from `str | None = None` to required `str` — required going forward is the whole point of computing `name` from them. `description` stays optional.
  - `ProductUpdate` (L24-31): remove `name: str | None = None` (L25) only — leave the other three optional (partial-update semantics, unchanged).
  - `ProductListResponse` / `ProductResponse`: no change — both keep `name: str`, populated transparently from the computed column.
- **`backend/app/domains/product/service.py`** `create_product` (L46-62): remove the `name=data.name,` kwarg (L52). `update_product` needs no change — `name` can never appear in `ProductUpdate.model_dump(exclude_unset=True)` once removed from the schema.
- **`backend/app/domains/product/router.py`**: no change — validation follows automatically from the schema change.
- No changes needed in `reporting/repository.py`, `marketing_lead/repository.py`, `opportunity/schemas.py`, `account/workspace_schemas.py`, or `audit/repository.py` — all are read-only consumers of `Product.name`.

## Frontend changes — `sales-os-app/src/screens/ProductCatalogScreen.tsx` only

Every other file that displays `.name` (`OpportunityItemAddRow.tsx`, `OpportunityItemsList.tsx`, `OpportunityDetailScreen.tsx`, `ProjectDirectoryScreen.tsx`, `Customer360Screen.tsx`, `MarketingLeadCreateModal.tsx`, `MarketingLeadReviewQueueScreen.tsx`, the three report screens) needs **no change** — the API keeps returning a valid `name`.

- `EMPTY_FORM` (L33-41): remove `name: ""` (L34).
- `openEdit()` (L369-381): remove `name: product.name,` (L372).
- `buildPayload()` (L385-393): remove `name: form.name.trim(),` (L386); change `oem_name`/`model_number`/`category_name` to send trimmed required strings instead of `... || null` (L388-390), consistent with them now being required.
- `handleCreate()`/`handleUpdate()` (L402-415): replace the `if (!form.name.trim())` guards (L403, L411) with equivalent guards for `category_name`, `oem_name`, `model_number`.
- `ProductFormFields` (L629-714): delete the "Product Name *" `TextField` block (L642-651) entirely. Add ` *` to the "OEM / Brand", "Model Number", and "Category" labels (L667, L675, L683) to signal the new requirement, matching the existing "SBU *" convention — label-only, no other required-field UI pattern exists in this form to mirror.
- Detail header (L284) and catalog list rows (L556, L559): no change, pure reads.

## Generated-type / schema-dump regen (both required, same PR)

1. **`sales-os-app/src/types/api.ts`**: run `npm run generate:types` against a locally running backend that already has this migration applied — never hand-edit. Confirm `ProductCreate`/`ProductUpdate` no longer have `name` and the three fields are no longer optional.
2. **`docs/Physical-Schema.sql`**: run `.\scripts\regen_physical_schema.ps1` after the migration is applied to Dev. Confirm the `product` table DDL shows `name character varying(255) GENERATED ALWAYS AS (...) STORED NOT NULL`.

## Tests to fix

- `backend/tests/domains/product/test_product_service.py`: remove `"name": "SonoScape S50"` from `TestCreateProduct._data()`'s defaults (~L87-90, dead once `name` isn't an input field); change `ProductUpdate(name="New Name")` (L148, L160) to `ProductUpdate(category_name="New Category")` so the test still exercises a real field.
- `test_product_repository.py`'s `_make_product()` mock defaults: no change (mocks a read-only ORM attribute).
- `test_product_router.py`: check during implementation for any raw JSON request-body fixtures containing `"name"` (a `name=` grep won't catch a dict literal) and drop the key if found.

## Verification

1. `pytest backend/tests/domains/product/` plus the full suite (reporting/marketing_lead/audit tests read `Product.name` but never construct it — confirm none break).
2. Migration dry run on a disposable DB copy: `alembic upgrade head`, spot-check `SELECT name, category_name, oem_name, model_number FROM product LIMIT 10;`, then `alembic downgrade -1` to confirm the downgrade path runs.
3. `tsc`/frontend build clean after the `api.ts` regen and `ProductCatalogScreen.tsx` edits; grep `sales-os-app/src` for any other `ProductCreate`/`ProductUpdate` usage not already covered.
4. **Manual smoke test (the one real gap in automated coverage — no existing test exercises real Postgres `Computed()`/`RETURNING` behavior):** create a product supplying only Brand/Model/Category, confirm the catalog list and detail view show the correct computed name immediately after save (no `db.refresh()` needed, per SQLAlchemy's `implicit_returning` default — confirm this holds); edit an existing product's Brand and confirm the displayed name updates.
5. Manual check: one report screen (Product Performance or Pipeline Report) groups/displays correctly for both old and newly-created products; one opportunity item picker (`OpportunityItemAddRow`) shows correct labels.
6. Spot-check an audit-log entry for a product edit shows a sensible diff including the derived `name` change.
