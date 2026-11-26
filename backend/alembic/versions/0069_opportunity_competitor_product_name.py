"""opportunity: the competitor's product on a lost Opportunity

Revision ID: 0069
Revises: 0068
Create Date: 2026-11-26

docs/Sales-Loss-Report-Implementation-Plan.md, step 1 (D8; Basheer,
2026-11-25). An optional "Competing product" next to Competitor Name when an
Opportunity is marked Lost with reason "Competitor Won" (D15, D16). Opportunities
already Lost stay empty.

Not the same as `asset.competitor_product_name` (a competitor's machine
installed at a customer).

No policy or trigger change: the existing `opportunity` policies and triggers
cover the new column. Older code ignores it. Downgrade drops the column.
"""

import sqlalchemy as sa
from alembic import op

revision = "0069"
down_revision = "0068"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "opportunity",
        sa.Column("competitor_product_name", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("opportunity", "competitor_product_name")
