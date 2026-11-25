"""opportunity_item: cost saved on the day the Opportunity is marked Won

Revision ID: 0068
Revises: 0067
Create Date: 2026-11-25

docs/Margin-Report-Implementation-Plan.md, step 1 (D4, D12; Basheer,
2026-11-24). Each product line gets room for the product's cost (INR Lakhs,
per unit) as it was on the day the Opportunity was marked Won, so a later
change to the catalog cost never changes a past margin. The cost is saved by
the server on the first move to Won (opportunity/service.py), never by this
migration for new Won Opportunities.

`cost_filled_in_later` marks the lines filled by this migration's one-time
fill for Opportunities that were already Won (D12) -- the report will say
"cost filled in later" for them. It stays false for lines stamped at a real
Won.

One-time fill (D12): for every PRODUCT line on a WON Opportunity, copy the
product's catalog cost as it is on the day this runs. A product with no cost
then leaves its line empty and unmarked. It never runs again.

The fill is a data fill, not a user edit, so the audit and last-changed
triggers on `opportunity_item` are switched off for it and back on straight
after. The whole migration is one transaction (alembic/env.py), so a failure
undoes the switch-off too, and the table is locked until it commits, so no
real save slips through unrecorded. A real Won later logs a normal "Changed"
entry on the line (Admin/GM only can read the Audit log, as for cost itself,
BR-CAT-04).

No policy change: the existing `opportunity_item_via_opportunity` policy
covers the new columns. Who may SEE the cost is decided in the server's
response schemas (BR-CAT-04): it is added to none of them. Older code on
main ignores the columns. Downgrade drops the constraint and the columns.
"""

import sqlalchemy as sa
from alembic import op

revision = "0068"
down_revision = "0067"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "opportunity_item",
        sa.Column("cost_at_won_lakhs", sa.Numeric(15, 2), nullable=True),
    )
    op.add_column(
        "opportunity_item",
        sa.Column("cost_filled_in_later", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_check_constraint(
        "ck_opportunity_item_cost_at_won_non_negative",
        "opportunity_item",
        "cost_at_won_lakhs IS NULL OR cost_at_won_lakhs >= 0",
    )

    # D12 one-time fill, with the audit and last-changed triggers paused.
    op.execute("ALTER TABLE opportunity_item DISABLE TRIGGER trg_audit_opportunity_item")
    op.execute("ALTER TABLE opportunity_item DISABLE TRIGGER trg_updated_at")
    op.execute(
        """
        UPDATE opportunity_item oi
           SET cost_at_won_lakhs = p.cost_lakhs,
               cost_filled_in_later = true
          FROM product p,
               opportunity o,
               opportunity_status os
         WHERE oi.product_id = p.id
           AND oi.opportunity_id = o.id
           AND o.status_id = os.id
           AND os.status_code = 'WON'
           AND oi.line_type = 'PRODUCT'
           AND p.cost_lakhs IS NOT NULL
        """
    )
    op.execute("ALTER TABLE opportunity_item ENABLE TRIGGER trg_updated_at")
    op.execute("ALTER TABLE opportunity_item ENABLE TRIGGER trg_audit_opportunity_item")


def downgrade() -> None:
    op.drop_constraint("ck_opportunity_item_cost_at_won_non_negative", "opportunity_item", type_="check")
    op.drop_column("opportunity_item", "cost_filled_in_later")
    op.drop_column("opportunity_item", "cost_at_won_lakhs")
