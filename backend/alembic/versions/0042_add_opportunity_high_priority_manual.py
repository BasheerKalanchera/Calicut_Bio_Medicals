"""add opportunity.high_priority_manual

Revision ID: 0042
Revises: 0041
Create Date: 2026-09-15

Changes (docs/High-Priority-Deal-Flag-Implementation-Plan.md, BR-OP-15):
  - opportunity.high_priority_manual: new manual High-Priority flag, only
    meaningful for Lead/Qualified/Demo-stage deals (display_order <= 30) --
    deals past Demo are automatically High Priority, computed at query time
    from the current stage, so that half needs no storage. Defaults false,
    not nullable.
"""

import sqlalchemy as sa

from alembic import op

revision = "0042"
down_revision = "0041"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "opportunity",
        sa.Column("high_priority_manual", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("opportunity", "high_priority_manual")
