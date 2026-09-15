"""add opportunity.closed_at

Revision ID: 0043
Revises: 0042
Create Date: 2026-09-15

Changes (docs/Sales-And-Pipeline-Report-Implementation-Plan.md):
  - opportunity.closed_at: stamped automatically, exactly once, the moment
    a deal's status first becomes terminal (Won or Lost) -- see
    OpportunityService.update_opportunity. Nullable, no backfill: existing
    Won/Lost deals have no real historical close date to backfill honestly,
    so they correctly fall into "All Time" report views and are correctly
    excluded from any period-filtered view.
"""

import sqlalchemy as sa

from alembic import op

revision = "0043"
down_revision = "0042"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "opportunity",
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("opportunity", "closed_at")
