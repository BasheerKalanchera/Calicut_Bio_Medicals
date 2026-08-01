"""phase 2E followup: open Product Catalog read visibility company-wide

Revision ID: 0014
Revises: 0013
Create Date: 2026-08-01

Changes:
  - Business decision (2026-08-01): the Product Catalog is reference data --
    name, OEM, model number, category, description (product/models.py,
    Physical-Schema.sql) -- no pricing or customer data, so there is no
    confidentiality reason to hide one SBU's catalog from another. Reps
    benefit from seeing the full company product line (cross-sell awareness,
    referring a lead to the other SBU) even though they can't transact
    against it directly.
  - 0012_rls_product's single `product_sbu_visibility` policy governed every
    command (SELECT/INSERT/UPDATE/DELETE) with one USING clause, so it could
    not be loosened for reads alone -- Postgres policies are scoped per
    command via FOR, and a bare policy with no FOR applies to all of them.
    This migration replaces it with four narrower policies: SELECT is now
    unrestricted (USING (true)); INSERT/UPDATE/DELETE keep 0012's original
    condition unchanged (Admin/General Manager unrestricted, everyone else
    gated on sbu_id = cabio_app_sbu_id()).
  - The corresponding "a product can only be added to an Opportunity in its
    own SBU" rule moves to the application layer instead -- enforced in
    OpportunityService (mirrors the existing BR-FIN-06 split-SBU check) --
    see Business-Rules.md BR-OP-11 / "Product Catalog Rules".
"""

from alembic import op

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None

SBU_WRITE_CHECK = """
    cabio_app_role_name() IN ('Admin', 'General Manager')
    OR sbu_id = cabio_app_sbu_id()
"""

OLD_POLICY = f"""
    CREATE POLICY product_sbu_visibility ON product
    USING (
        {SBU_WRITE_CHECK}
    );
"""


def upgrade() -> None:
    op.execute("DROP POLICY IF EXISTS product_sbu_visibility ON product;")

    op.execute("""
        CREATE POLICY product_read_all ON product
        FOR SELECT
        USING (true);
    """)
    op.execute(f"""
        CREATE POLICY product_insert_sbu_scoped ON product
        FOR INSERT
        WITH CHECK ({SBU_WRITE_CHECK});
    """)
    op.execute(f"""
        CREATE POLICY product_update_sbu_scoped ON product
        FOR UPDATE
        USING ({SBU_WRITE_CHECK})
        WITH CHECK ({SBU_WRITE_CHECK});
    """)
    op.execute(f"""
        CREATE POLICY product_delete_sbu_scoped ON product
        FOR DELETE
        USING ({SBU_WRITE_CHECK});
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS product_read_all ON product;")
    op.execute("DROP POLICY IF EXISTS product_insert_sbu_scoped ON product;")
    op.execute("DROP POLICY IF EXISTS product_update_sbu_scoped ON product;")
    op.execute("DROP POLICY IF EXISTS product_delete_sbu_scoped ON product;")
    op.execute(OLD_POLICY)
