"""project search indexes

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-28

Changes:
  - project: GIN trigram index on name for ilike search
"""

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.create_index(
        "idx_project_name_trgm",
        "project",
        ["name"],
        postgresql_using="gin",
        postgresql_ops={"name": "gin_trgm_ops"},
    )


def downgrade() -> None:
    op.drop_index("idx_project_name_trgm", table_name="project")
