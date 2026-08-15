"""zone name trigram index for search

Revision ID: 0020
Revises: 0019
Create Date: 2026-08-13

Changes (docs/ZonePicker-And-Coverage-View-Implementation-Plan.md):
  - zone: GIN trigram index on name, for the new /master-data/zones/search
    endpoint. Mirrors idx_opportunity_name_trgm / idx_account_name_trgm /
    idx_product_name_trgm / idx_project_name_trgm exactly -- pg_trgm was
    already enabled by migration 0003, not re-created here.
"""

from alembic import op

revision = "0020"
down_revision = "0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "idx_zone_name_trgm",
        "zone",
        ["name"],
        postgresql_using="gin",
        postgresql_ops={"name": "gin_trgm_ops"},
    )


def downgrade() -> None:
    op.drop_index("idx_zone_name_trgm", table_name="zone")
