"""make document.file_size_bytes nullable

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-12

Changes:
  - document: file_size_bytes NOT NULL -> nullable. Product Catalog
    collateral links (Milestone 1 gap-closure) are URL-only references,
    not real uploads, so there is no byte size to record. Real uploads,
    if built later, would still populate this column.
"""

from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("document", "file_size_bytes", nullable=True)


def downgrade() -> None:
    op.alter_column("document", "file_size_bytes", nullable=False)
