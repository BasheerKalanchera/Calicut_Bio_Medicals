"""product catalog: legacy placeholder visibility + product sbu trigger gap

Revision ID: 0051
Revises: 0050
Create Date: 2026-09-22

Two fixes found by a full /code-review (high effort, 463e964..working
tree) covering commit cd0d8ab plus its follow-up fixes as one feature:

1. Migration 0049's "Legacy Data" / "Retired / Unclassified" / "Legacy /
   Unclassified Product" placeholder rows were inserted without
   is_active=false, contradicting that migration's own docstring ("never
   shown in any picker"). 0049 itself is corrected at the source for any
   future fresh run (e.g. UAT), but it already ran on Dev, so this
   migration deactivates the same 3 rows there directly.

2. trg_product_sync_brand_category_name (0049) only fires "BEFORE UPDATE
   OF model_id" -- an UPDATE that changes only product.sbu_id (exposed
   independently on ProductUpdate) doesn't re-derive brand_id/category_id/
   sbu_id/name from the product's actual model, unlike Model's own
   trg_model_sync_sbu, which is the real guarantee for the equivalent
   Brand->Model relationship. Widened to also fire "OF sbu_id" so the
   database, not just the app-layer check in product/service.py, prevents
   a product's sbu_id from drifting away from its model's true SBU --
   same "trigger is the actual guarantee" posture used everywhere else in
   this feature.
"""

from alembic import op

revision = "0051"
down_revision = "0050"
branch_labels = None
depends_on = None

_LEGACY_BRAND_ID = "4a3ead75-882f-4e88-90d7-078351697f7e"
_LEGACY_CATEGORY_ID = "b76b8956-f2c6-46e5-8956-eb707b4413e6"
_LEGACY_MODEL_ID = "86808779-3278-4cf6-9f94-fe2572282be7"


def upgrade() -> None:
    op.execute(f"UPDATE brand SET is_active = false WHERE id = '{_LEGACY_BRAND_ID}';")
    op.execute(f"UPDATE category SET is_active = false WHERE id = '{_LEGACY_CATEGORY_ID}';")
    op.execute(f"UPDATE model SET is_active = false WHERE id = '{_LEGACY_MODEL_ID}';")

    op.execute("DROP TRIGGER IF EXISTS trg_product_sync_brand_category_name ON product;")
    op.execute(
        "CREATE TRIGGER trg_product_sync_brand_category_name BEFORE INSERT OR UPDATE OF model_id, sbu_id ON product "
        "FOR EACH ROW EXECUTE FUNCTION trg_product_sync_brand_category_name_fn();"
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_product_sync_brand_category_name ON product;")
    op.execute(
        "CREATE TRIGGER trg_product_sync_brand_category_name BEFORE INSERT OR UPDATE OF model_id ON product "
        "FOR EACH ROW EXECUTE FUNCTION trg_product_sync_brand_category_name_fn();"
    )

    op.execute(f"UPDATE brand SET is_active = true WHERE id = '{_LEGACY_BRAND_ID}';")
    op.execute(f"UPDATE category SET is_active = true WHERE id = '{_LEGACY_CATEGORY_ID}';")
    op.execute(f"UPDATE model SET is_active = true WHERE id = '{_LEGACY_MODEL_ID}';")
