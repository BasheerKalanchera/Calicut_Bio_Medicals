"""brand_vendor_target.set_by_hand: a brand quarter the GM typed by hand

Revision ID: 0064
Revises: 0063
Create Date: 2026-10-25

docs/Annual-Target-Planning-Implementation-Plan.md, D70-D73 (Basheer,
2026-10-22; built in Part 2 step 6): on Brand Target Tracking the GM may
type a new target for one brand quarter. That quarter is marked "changed
by hand" and keeps its figure when the brand's yearly figure, stretch or
pattern is saved again; only the other quarters are worked out again
(D71). The mark can't be removed (D73).

Every existing row was worked out from the brand's year (or typed before
2026-Q3, which is never worked out again), so all start as false. The
older code on main ignores the column. No policy change: the existing
Admin/GM write policies cover it. Downgrade drops the column.
"""

import sqlalchemy as sa
from alembic import op

revision = "0064"
down_revision = "0063"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "brand_vendor_target",
        sa.Column("set_by_hand", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("brand_vendor_target", "set_by_hand")
