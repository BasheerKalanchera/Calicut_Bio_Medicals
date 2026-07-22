"""add opportunity_stakeholder stakeholder_id index

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-22

Changes:
  - opportunity_stakeholder: index on stakeholder_id. The table's PK is
    (opportunity_id, stakeholder_id), so the composite PK index only helps
    lookups that lead with opportunity_id. The new stakeholder-opportunity
    linkage feature queries by stakeholder_id alone (list opportunities for
    a stakeholder, count opportunities per stakeholder), which would
    otherwise force a full table scan.
"""

from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "idx_opportunity_stakeholder_stakeholder_id",
        "opportunity_stakeholder",
        ["stakeholder_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_opportunity_stakeholder_stakeholder_id", table_name="opportunity_stakeholder")
