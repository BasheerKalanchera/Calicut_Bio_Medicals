"""product search and FK indexes

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-27

Changes:
  - product: GIN trigram index on name for ilike search and sort
  - product: B-Tree index on sbu_id FK
  - product: B-Tree index on oem_name for brand filter
"""

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.create_index(
        "idx_product_name_trgm",
        "product",
        ["name"],
        postgresql_using="gin",
        postgresql_ops={"name": "gin_trgm_ops"},
    )
    op.create_index("ix_product_sbu_id", "product", ["sbu_id"])
    op.create_index("ix_product_oem_name", "product", ["oem_name"])


def downgrade() -> None:
    op.drop_index("ix_product_oem_name", table_name="product")
    op.drop_index("ix_product_sbu_id", table_name="product")
    op.drop_index("idx_product_name_trgm", table_name="product")
