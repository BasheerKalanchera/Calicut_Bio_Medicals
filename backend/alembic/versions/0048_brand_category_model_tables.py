"""product catalog: brand/category/model reference tables

Revision ID: 0048
Revises: 0047
Create Date: 2026-09-21

Changes (docs/Product-Catalog-Name-Derivation-Implementation-Plan.md,
approved design session 2026-09-20/21): the first of two migrations
closing Signed Feature 4.1's "Category and Brand are free-text entry --
no controlled/enforced pick-list" gap. This one only adds the three new
lookup tables (brand, category, model) -- product itself is untouched
until 0049, which does the cutover.

  - Same `reference` domain home/shape as SBU/Zone -- SBU-scoped
    (uq_*_sbu_name), soft-deactivatable (is_active), no AuditMixin (matches
    Zone/LeadSource, not Product).
  - `model` carries both brand_id and category_id -- a Model is inherently
    one Brand's product of one Category ("iM70" is always an EDAN Patient
    Monitor), which is what actually prevents a brand/category mismatch;
    Category is never picked independently on the product form.
  - `model.sbu_id` is denormalized from `brand.sbu_id` via
    trg_model_sync_sbu (BEFORE INSERT OR UPDATE OF brand_id) -- lets RLS
    use the same flat sbu_id check as every other table instead of a join
    through brand on every row-visibility check. App code never sets it
    directly (reference/service.py's CatalogAdminService.create_model still
    passes it for clarity, but the trigger is the actual guarantee, same
    "belt-and-suspenders" relationship as the app-layer SBU check ahead of
    a DB constraint elsewhere in this codebase).
  - RLS: read is the same flat-SBU-check shape as product's original 0012
    policy (Admin/GM unrestricted, everyone else sbu_id = own SBU) --
    deliberately not product's later fully-open 0014 read policy, since
    catalog *reference data* visibility per SBU is what was actually
    specified in the approved design (see plan doc's Backend Changes
    section). Write (INSERT/UPDATE) is Admin/GM-only, enforced identically
    at the RLS layer and the app layer (CatalogAdminService._require_admin)
    -- no per-SBU write carve-out, unlike product itself.
  - RLS enabled with policies in this same migration, not a follow-up --
    UAT's rls_auto_enable() event trigger auto-enables RLS with zero
    policies the moment a table exists (0030's docstring flags this same
    trap), which has caused lockout incidents on this project before.
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0048"
down_revision = "0047"
branch_labels = None
depends_on = None

_READ_CHECK = "cabio_app_role_name() IN ('Admin', 'General Manager') OR sbu_id = cabio_app_sbu_id()"
_WRITE_CHECK = "cabio_app_role_name() IN ('Admin', 'General Manager')"


def _rls(table: str) -> None:
    op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
    op.execute(f"CREATE POLICY {table}_read ON {table} FOR SELECT USING ({_READ_CHECK});")
    op.execute(f"CREATE POLICY {table}_insert ON {table} FOR INSERT WITH CHECK ({_WRITE_CHECK});")
    op.execute(
        f"CREATE POLICY {table}_update ON {table} FOR UPDATE USING ({_WRITE_CHECK}) WITH CHECK ({_WRITE_CHECK});"
    )


def _drop_rls(table: str) -> None:
    op.execute(f"DROP POLICY IF EXISTS {table}_read ON {table};")
    op.execute(f"DROP POLICY IF EXISTS {table}_insert ON {table};")
    op.execute(f"DROP POLICY IF EXISTS {table}_update ON {table};")
    op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")


def upgrade() -> None:
    op.create_table(
        "brand",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("sbu_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.PrimaryKeyConstraint("id", name="brand_pkey"),
        sa.ForeignKeyConstraint(["sbu_id"], ["sbu.id"], name="brand_sbu_id_fkey"),
        sa.UniqueConstraint("sbu_id", "name", name="uq_brand_sbu_name"),
    )
    op.create_index("ix_brand_sbu_id", "brand", ["sbu_id"])

    op.create_table(
        "category",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("sbu_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.PrimaryKeyConstraint("id", name="category_pkey"),
        sa.ForeignKeyConstraint(["sbu_id"], ["sbu.id"], name="category_sbu_id_fkey"),
        sa.UniqueConstraint("sbu_id", "name", name="uq_category_sbu_name"),
    )
    op.create_index("ix_category_sbu_id", "category", ["sbu_id"])

    op.create_table(
        "model",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("brand_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sbu_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.PrimaryKeyConstraint("id", name="model_pkey"),
        sa.ForeignKeyConstraint(["brand_id"], ["brand.id"], name="model_brand_id_fkey"),
        sa.ForeignKeyConstraint(["category_id"], ["category.id"], name="model_category_id_fkey"),
        sa.ForeignKeyConstraint(["sbu_id"], ["sbu.id"], name="model_sbu_id_fkey"),
        sa.UniqueConstraint("brand_id", "name", name="uq_model_brand_name"),
    )
    op.create_index("ix_model_brand_id", "model", ["brand_id"])
    op.create_index("ix_model_category_id", "model", ["category_id"])
    op.create_index("ix_model_sbu_id", "model", ["sbu_id"])

    op.execute(
        """
        CREATE FUNCTION trg_model_sync_sbu_fn() RETURNS trigger
            LANGUAGE plpgsql
        AS $$
        BEGIN
            NEW.sbu_id := (SELECT sbu_id FROM brand WHERE id = NEW.brand_id);
            RETURN NEW;
        END;
        $$;
        """
    )
    op.execute(
        "CREATE TRIGGER trg_model_sync_sbu BEFORE INSERT OR UPDATE OF brand_id ON model "
        "FOR EACH ROW EXECUTE FUNCTION trg_model_sync_sbu_fn();"
    )

    _rls("brand")
    _rls("category")
    _rls("model")


def downgrade() -> None:
    _drop_rls("model")
    _drop_rls("category")
    _drop_rls("brand")

    op.execute("DROP TRIGGER IF EXISTS trg_model_sync_sbu ON model;")
    op.execute("DROP FUNCTION IF EXISTS trg_model_sync_sbu_fn();")

    op.drop_index("ix_model_sbu_id", table_name="model")
    op.drop_index("ix_model_category_id", table_name="model")
    op.drop_index("ix_model_brand_id", table_name="model")
    op.drop_table("model")

    op.drop_index("ix_category_sbu_id", table_name="category")
    op.drop_table("category")

    op.drop_index("ix_brand_sbu_id", table_name="brand")
    op.drop_table("brand")
