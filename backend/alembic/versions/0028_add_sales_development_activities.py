"""add sales development activities

Revision ID: 0028
Revises: 0027
Create Date: 2026-08-27

Changes (docs/Sales-Development-Activities-Implementation-Plan.md, BR-ACT-09):
  - activity.account_id: NOT NULL dropped. BR-ACT-01/BR-ACT-03's guarantee is
    preserved for every existing activity_type via a CHECK constraint instead
    of a blanket relaxation -- only the six new Sales Development Activity
    types may omit an account.
  - chk_activity_account_required: the CHECK constraint above.
  - activity.outcome_notes: new nullable column, required at the app layer
    (Pydantic) for the six new types -- distinct from the existing free-text
    `notes` field (BR-ACT-09, decision #4).
  - lead_source: seeded with a 'Conference' row -- confirmed missing from the
    live dropdown 2026-08-27 (Basheer). Lets a rep tag a new Lead's source as
    "Conference" per the feature's draft reply to Haroon; independent of the
    activity log entry itself.
"""

import sqlalchemy as sa

from alembic import op

revision = "0028"
down_revision = "0027"
branch_labels = None
depends_on = None

SALES_DEVELOPMENT_ACTIVITY_TYPES = (
    "CONFERENCE_EXPO",
    "OEM_PRODUCT_TRAINING",
    "CERTIFICATION",
    "SALES_TRAINING",
    "SEMINAR_TRADE_SHOW",
    "OTHER_DEVELOPMENT",
)


def upgrade() -> None:
    op.alter_column("activity", "account_id", nullable=True)

    type_list = ", ".join(f"'{t}'" for t in SALES_DEVELOPMENT_ACTIVITY_TYPES)
    op.create_check_constraint(
        "chk_activity_account_required",
        "activity",
        f"account_id IS NOT NULL OR activity_type IN ({type_list})",
    )

    op.add_column("activity", sa.Column("outcome_notes", sa.Text(), nullable=True))

    # Naming matches the live table's existing convention (ALL_CAPS_WITH_UNDERSCORES,
    # e.g. COLD_CALL, WEBSITE -- confirmed via a read-only query, 2026-08-27),
    # not the "Conference" title-case wording used loosely in the discussion docs.
    op.execute(
        """
        INSERT INTO lead_source (name, description, is_active)
        VALUES ('CONFERENCE', 'Contact picked up at a conference/expo/trade show', true);
        """
    )


def downgrade() -> None:
    op.execute("DELETE FROM lead_source WHERE name = 'CONFERENCE';")
    op.drop_column("activity", "outcome_notes")
    op.drop_constraint("chk_activity_account_required", "activity", type_="check")
    op.alter_column("activity", "account_id", nullable=False)
