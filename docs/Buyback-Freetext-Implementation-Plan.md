# Buyback Free-Text Field — Implementation Plan

**Status:** Shipped, `8ab0c4e` (2026-08-11).
**Date:** 2026-08-10
**Prepared by:** Basheer Kalanchera (with Claude)
**Purpose:** Concrete, ordered implementation plan for the free-text Buyback
change agreed in principle in
`docs/Discussion-Buyback-Freetext-2026-08.md` — that doc records
the *decision*; this doc records the *execution steps* (exact SQL, files,
tests, sequencing). The separate "trade-in intake tracking" table
(post-close refurbish/parts/discard workflow) is explicitly out of scope —
see Context below.

---

## Context

Today, a "Buyback" line item on an Opportunity (a customer's traded-in
machine, credited against the deal total) must point at an existing catalog
`Product` row tagged `product_type = REFURBISHED`, picked from a dropdown.
Per `docs/Discussion-Buyback-Freetext-2026-08.md`: nobody knows
the exact make/model/condition of a customer's used machine in advance, so
cataloguing it *before* the deal happens doesn't fit how trade-ins actually
occur. **Change agreed in principle:** the rep instead types a free-text
description of the machine — no catalog entry required at deal time.
Quantity/amount entry and the existing net-subtraction-from-deal-total
behavior stay exactly as they are.

This is independently buildable now — nothing here is blocked by the 3 of 4
open decisions still outstanding on the *separate* "trade-in intake
tracking" follow-on (post-close refurbish/parts/discard workflow). **That
follow-on is explicitly out of scope for this plan.** The one settled fact
worth carrying forward whenever it's eventually planned: the intake queue
row gets created only when the deal reaches Won, not when the Buyback line
is added (confirmed with Fazal 2026-08-10, pending Haroon). Nothing here
builds that queue or references it.

## A real bug this change would otherwise introduce (found during planning)

`_validate_item_sbus()` (`backend/app/domains/opportunity/service.py:480-
498`, BR-OP-11 — a Product must belong to the Opportunity's own SBU) is
called from three sites, each passing a `set` of `product_id`s built
straight from the incoming items:
- `create_opportunity` (line 107): `{item.product_id for item in data.items}`
- `add_item` (line 284): `{data.product_id}`
- `replace_items` (line 304): `{item.product_id for item in data.items}`

Once `product_id` becomes `Optional`, a BUYBACK item's `None` lands in that
set unfiltered. `get_product_sbu_ids()` never has an entry for `None`, so the
check fails and raises `BusinessRuleViolation("Product None is not in this
Opportunity's SBU...")` — **every Buyback add/replace would break** unless
`None`/BUYBACK entries are filtered out of that set at all three call sites.
This must land in the same change as removing the old buyback validation
(step 4 below), not as an afterthought.

## Confirmed current state (verified directly against the codebase)

**Model** (`backend/app/domains/opportunity/models.py:142-175`,
`OpportunityItem`): `product_id` is `NOT NULL` (FK to `product.id`); no
`description` column exists. `Text` is already imported in this file (used
by `loss_notes`/`notes` elsewhere) — no new import needed.

**Validation** (`service.py:500-516`, `_validate_buyback_products`, called
from `add_item` line 285 and `replace_items` line 305) — checks the
BUYBACK-referenced product is `REFURBISHED` via `repository.get_product_types()`
(`repository.py:250-256`). Grepped: `get_product_types` has no other callers
anywhere in the backend besides this one call site and its test mocks —
safe to delete outright (re-check at build time in case something else
landed in between).

**Netting math is 100% frontend-only** (`OpportunityDetailScreen.tsx` lines
374-375, 592-593) — the backend has no `Opportunity Value` computation at
all. Unaffected by this change, no backend work needed there.

**Schemas** (`backend/app/domains/opportunity/schemas.py`) — one shared
`OpportunityItemCreate` serves both PRODUCT and BUYBACK lines; `product_id`
is required, no `description` field exists. `OpportunityCreate.items` (line
209) reuses this same schema, so the create-opportunity path currently skips
the REFURBISHED check entirely today (only `add_item`/`replace_items` call
the validator) — not a regression to preserve, just confirms it's the one
path that will *gain* enforcement it never had, which is a strict
improvement, not a behavior risk.

**Real precedent for the cross-field validation shape** (verified directly,
not assumed): `InstalledAssetCreate.check_product_required`
(`backend/app/domains/asset/schemas.py:14-18`):
```python
@model_validator(mode="after")
def check_product_required(self) -> "InstalledAssetCreate":
    if not self.is_competitor_equipment and self.product_id is None:
        raise ValueError("product_id is required when not competitor equipment")
    return self
```
and `ActivityCreate._require_next_action_unless_manager_note`
(`activity/schemas.py:61-68`) — both are `@model_validator(mode="after")`
methods on a `Create` schema enforcing "field X required unless condition
Y," the exact shape needed here. (Note: `competitor_name`-required-when-
`COMPETITOR_WON` is *not* this pattern — that's enforced separately, in
`opportunity/validators.py`, as a plain function called during status
transition, not a schema `model_validator`. Follow the `asset`/`activity`
precedents above, not that one.)

**Migration numbering** — highest on disk is `0016_add_product_type_and_
line_type.py`. This feature is being built first, so it claims **`0017`**
(`down_revision = "0016"`); the separate, already-planned-but-not-yet-built
multi-zone assignment feature
(`docs/Multi-Zone-Assignment-Milestone-1-Implementation-Plan.md`) moves to
`0018` behind it. Re-check `backend/alembic/versions/` at actual build time
in case ordering has shifted.

**Business rules to amend** (`docs/Business-Rules.md`): `BR-CAT-02` (lines
160-164) bullet 2 — the whole "must be REFURBISHED to be a Buyback line"
bullet — is buyback-specific and gets removed (bullet 1, `product_type`
classification itself, and its relevance to "Add Product" selling
refurbished equipment outright, is untouched). `BR-FIN-03`'s netting formula
is unchanged; needs a note that BUYBACK lines carry `description` instead of
a catalog reference.

**Live shared Supabase dev DB safety** — `backend/.env` points at a live,
shared dev DB. The feature that introduced Buyback lines (migration `0016`,
2026-08-07) has **not yet been through Basheer's manual smoke test on Dev**
(`active_progress.md` still flags it "STOP HERE FIRST" as of 2026-08-10) —
so there's a real chance zero live BUYBACK rows exist yet, but this plan
must not assume that. Any new `CHECK` constraint must only *relax* the
existing invariant (`product_id` may be `NULL` when `line_type = 'BUYBACK'`)
rather than *tighten* it — it does **not** require `description IS NOT
NULL` at the DB level (that's a new-write-only rule, enforced in the
Pydantic schema, not retroactively on any rows that may already exist). The
existing `opportunity_item_unique (opportunity_id, product_id, line_type)`
constraint needs no change — Postgres treats each `NULL` as distinct in a
`UNIQUE` constraint, so multiple `product_id = NULL` BUYBACK rows on one
Opportunity won't collide.

**Frontend** (`sales-os-app/src/screens/OpportunityDetailScreen.tsx`,
function `ProductsTab`, lines 290-599) — the add-mode UI's `else` branch
(lines 498-528) currently serves both "accessory" and "buyback" modes via
one shared catalog `TextField select`, distinguished only by placeholder
text; this needs a genuine 3-way split. Established free-text pattern in
this codebase (`ProductCatalogScreen.tsx:698-707`'s Description field):
`<TextField multiline rows={3} fullWidth size="small" placeholder="..." />`
— no character-limit/counter convention exists anywhere in the app, don't
invent one. `openEdit` (lines 341-356) currently reads `i.product.name`/
`i.product.product_type` unconditionally — needs null-guards once `product`
can be `null`. Confirmed: `Customer360Screen.tsx`'s own opportunity-items
quick-add flow never creates BUYBACK lines — out of scope, no changes.

## Implementation steps

### 1. Migration `0017_add_opportunity_item_description_and_nullable_product.py`

`down_revision = "0016"` (re-check head at build time).

```python
def upgrade() -> None:
    op.add_column("opportunity_item", sa.Column("description", sa.Text(), nullable=True))
    op.alter_column("opportunity_item", "product_id", nullable=True)
    op.create_check_constraint(
        "ck_opportunity_item_product_id_or_buyback",
        "opportunity_item",
        "product_id IS NOT NULL OR line_type = 'BUYBACK'",
    )

def downgrade() -> None:
    # Any real free-text Buyback row (product_id NULL) created after this
    # migration lands will violate the restored NOT NULL below -- there is no
    # safe way to backfill product_id for a row that never had a catalog
    # product. Downgrading against a DB with live free-text rows WILL fail
    # (or requires manually deleting/backfilling them first). Flag this to
    # whoever runs the downgrade rather than papering over it.
    op.drop_constraint("ck_opportunity_item_product_id_or_buyback", "opportunity_item", type_="check")
    op.alter_column("opportunity_item", "product_id", nullable=False)
    op.drop_column("opportunity_item", "description")
```

### 2. Model — `opportunity/models.py:142-175`

- `product_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("product.id"), nullable=True)`
- Add `description: Mapped[str | None] = mapped_column(Text, nullable=True)`
- `product: Mapped["Product | None"] = relationship(back_populates="opportunity_items", lazy="joined")`

### 3. Schemas — `opportunity/schemas.py`

```python
from pydantic import BaseModel, ConfigDict, Field, model_validator

class OpportunityItemCreate(BaseModel):
    product_id: uuid.UUID | None = None
    description: str | None = None
    quantity: int = Field(..., gt=0)
    unit_price_lakhs: Decimal = Field(..., ge=0)
    discount_lakhs: Decimal = Field(Decimal("0"), ge=0)
    line_type: OpportunityItemLineType = OpportunityItemLineType.PRODUCT

    @model_validator(mode="after")
    def _check_product_or_description(self) -> "OpportunityItemCreate":
        # A Buyback line carries a free-text description of the traded-in
        # machine instead of a catalog Product reference; PRODUCT/ACCESSORY
        # lines still require a catalog product_id. Same shape as
        # InstalledAssetCreate.check_product_required (asset/schemas.py).
        if self.line_type == OpportunityItemLineType.BUYBACK:
            if not self.description or not self.description.strip():
                raise ValueError("A description is required for a Buyback line item.")
        elif self.product_id is None:
            raise ValueError("product_id is required for a Product line item.")
        return self

class OpportunityItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    product_id: uuid.UUID | None
    description: str | None
    quantity: int
    unit_price_lakhs: Decimal
    discount_lakhs: Decimal
    extended_value_lakhs: Decimal
    line_type: str
    product: ProductNested | None
```
`OpportunityCreate.items` reuses `OpportunityItemCreate` — picks up this
validation automatically, no separate change needed.

### 4. Service — `opportunity/service.py`

- Delete `_validate_buyback_products` entirely (lines ~500-516) and its two
  call sites (`add_item` line 285, `replace_items` line 305).
- **Fix `_validate_item_sbus` call sites** (the bug found above) at all three
  locations so a BUYBACK item's `None` product_id never reaches it:
  - `create_opportunity` (line 107): `{item.product_id for item in data.items if item.product_id is not None}`
  - `add_item` (line 284): `{data.product_id} if data.product_id is not None else set()`
  - `replace_items` (line 304): `{item.product_id for item in data.items if item.product_id is not None}`
- `_create_item` and the `OpportunityItem(...)` construction in `replace_items`
  (lines ~307-319): pass through `description=data.description` /
  `description=item.description`.

### 5. Repository — `opportunity/repository.py`

Delete `get_product_types()` (lines 250-256) once its one caller is gone —
re-grep at build time to confirm nothing else picked it up in the meantime.

### 6. Business rules — `docs/Business-Rules.md`

- `BR-CAT-02`: remove bullet 2 (the REFURBISHED-for-Buyback requirement);
  keep bullet 1 (`product_type` classification) and trim the
  Rationale/Enforcement text that referenced the Buyback picker.
- Add new rule **BR-CAT-03: Buyback Line Items Are Free-Text (2026-08-10)**:
  states a BUYBACK line requires a free-text `description` and carries no
  catalog `product_id`; PRODUCT/ACCESSORY lines unaffected; enforcement =
  the schema `model_validator` + the relaxed CHECK constraint; explicitly
  notes the intake-tracking follow-on is separate/not yet planned, with the
  one settled fact (queue row created on Won) recorded for later.
- `BR-FIN-03`: add a note after the `line_type` bullet — BUYBACK lines now
  carry `description` instead of a catalog product reference; formula
  unchanged.

### 7. Regenerate `docs/Physical-Schema.sql`

`pg_dump --schema-only` against Dev immediately after applying migration
`0017` — not batched to the end (this has gone stale before, per the Change
Log).

### 8. Backend tests — `backend/tests/domains/opportunity/test_opportunity_service.py`

- `_make_repo()` fixture (line 136/164): remove the `get_product_types`
  mock default — no longer needed.
- Replace the 4 REFURBISHED-specific tests (`test_buyback_line_constructed_
  for_refurbished_product` / `test_buyback_line_rejected_for_non_refurbished_
  product`, in both `TestReplaceItems` and `TestAddItem`, lines 793/809/833/847)
  with description-based equivalents:
  - BUYBACK + description succeeds (`line_type == "BUYBACK"`, `description`
    set, `product_id is None`).
  - BUYBACK without description raises a Pydantic `ValidationError` — this
    is now a pure schema-construction test (`OpportunityItemCreate(...)`
    directly), not a `service.replace_items(...)` call, since the check
    moved out of the service.
  - New: PRODUCT without `product_id` raises `ValidationError` — nothing
    tests this today.
- `test_line_type_defaults_to_product` (line 780) — unchanged.
- Consider whether the two pure-schema tests belong alongside any existing
  schema-level test file (check `backend/tests/domains/asset/` for how
  `InstalledAssetCreate.check_product_required` is tested, for the
  placement precedent) rather than inside the service test file.

### 9. Frontend — `OpportunityDetailScreen.tsx`, `ProductsTab`

- New state: `const [addDescription, setAddDescription] = useState("");`
- `switchAddMode`: also reset `setAddDescription("")`.
- `openEdit`: guard nullable `product` (`i.product?.name`, `i.product?.
  product_type`) and seed `description: i.description`.
- `addItem`: branch validation by mode — buyback requires non-empty
  `addDescription` instead of `addProdId`; build the pushed item with
  `description`/`line_type: "BUYBACK"` (no `product_id`) for buyback, vs.
  the existing `product_id`/`product_name`/`product_type` shape for
  product/accessory. Reset `addDescription` alongside the other fields.
- `buybackModeOptions`/`modeOptions` (lines 331-333): buyback drops out of
  this — `modeOptions` only needs to serve product/accessory now.
- Add-mode UI (lines 498-528): turn the binary `product ? Autocomplete :
  TextField select` into a genuine 3-way `product / accessory / buyback`
  ternary — accessory keeps the existing catalog `TextField select`; buyback
  gets a new multiline free-text field (`ProductCatalogScreen.tsx:698-707`
  pattern): `<TextField label="Machine description" multiline rows={3}
  fullWidth size="small" placeholder="e.g. GE LOGIQ P9 ultrasound, 2018,
  working condition" />`.
- Row-label display (edit-mode line ~444, view-mode line ~576): fallback
  chain `item.description || item.product?.name` — covers new free-text
  rows and any legacy catalog-linked BUYBACK rows gracefully (don't assume
  none exist, per the live-DB note above). Guard `item.product?.
  product_type === "REFURBISHED"` similarly (was unguarded `.product.
  product_type`).
- `saveItems` payload mapping: add `description: i.description` to the
  object sent to `replaceOpportunityItems`.
- Netting math / red styling / "Buyback" chip: unaffected, no changes.

### 10. `types/api.ts`

`npm run generate:types` only after backend changes (step 3) are running —
picks up `description`, nullable `product_id`, nullable `product`
automatically. No manual edits.

### 11. Manual verification on Dev

1. Buyback add-mode shows a multiline free-text field, no catalog dropdown.
2. Add a Buyback line with description + amount, save, reload — description
   persists and displays with the red "Buyback" styling/chip intact.
3. Opportunity total still nets the Buyback credit correctly.
4. "Add Product"/"Add Accessory" still require a catalog pick — unaffected.
5. Saving a Buyback line with empty description is blocked client-side;
   confirm the same via a raw API call (expect a 422).
6. If any pre-existing catalog-linked BUYBACK row exists on Dev (possible,
   since `0016` hasn't been smoke-tested yet) — open it in view and edit
   mode, confirm no crash, confirm it still displays via the `product?.name`
   fallback.
7. Confirm `Physical-Schema.sql` was regenerated and committed alongside
   migration `0017`.

## Ordering

Migration (1) → model (2) → schemas/validator (3) → service, including the
`_validate_item_sbus` fix (4) → repository cleanup (5) → backend tests (8),
run suite green → apply to Dev + regenerate `Physical-Schema.sql` (7) →
Business-Rules.md (6) → frontend `ProductsTab` (9) → regenerate `types/
api.ts` (10) → manual verification on Dev (11).

### Critical files
- backend/alembic/versions/0017_add_opportunity_item_description_and_nullable_product.py
- backend/app/domains/opportunity/models.py
- backend/app/domains/opportunity/schemas.py
- backend/app/domains/opportunity/service.py
- backend/app/domains/opportunity/repository.py
- backend/tests/domains/opportunity/test_opportunity_service.py
- sales-os-app/src/screens/OpportunityDetailScreen.tsx
- docs/Business-Rules.md
