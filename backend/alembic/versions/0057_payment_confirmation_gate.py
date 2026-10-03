"""BR-OP-17: payment confirmation before Won -- new last stage + who/when fields

Revision ID: 0057
Revises: 0056
Create Date: 2026-10-03

Step 1 of docs/Payment-Confirmation-Gate-Implementation-Plan.md (decided
2026-10-03). Won is allowed only from the new last stage, after full payment
is confirmed in the same save (enforced in the service layer).

Changes:
  - opportunity_stage: new row PAYMENT_PENDING after Delivery & Installation
    (display_order 80, default win probability 98). stage_name is the working
    name "Payment Pending" -- Haroon/Latheef Bhai confirm the final name; it's
    data, so renaming later is a one-row update.
  - opportunity.full_payment_confirmed_at / full_payment_confirmed_by: set
    automatically when an Opportunity is marked Won (who ticked "full payment
    received", and when). Same shape as gate_override_set_at/_by (0027).
    Covered by the existing opportunity audit trigger.
  - ck_opportunity_full_payment_confirmed_pair: both set or both empty -- a
    last line of defence; the service sets them together.
Existing Won Opportunities keep both fields empty (forwards-only, decided).
"""

import sqlalchemy as sa

from alembic import op

revision = "0057"
down_revision = "0056"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO opportunity_stage (id, stage_code, stage_name, display_order, default_win_probability)
        VALUES ('11111111-1111-1111-1111-100000000008', 'PAYMENT_PENDING', 'Payment Pending', 80, 98.00)
        ON CONFLICT (stage_code) DO NOTHING;
        """
    )
    op.add_column(
        "opportunity",
        sa.Column("full_payment_confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "opportunity",
        sa.Column("full_payment_confirmed_by", sa.UUID(as_uuid=True), sa.ForeignKey("user_profile.id"), nullable=True),
    )
    op.create_check_constraint(
        "ck_opportunity_full_payment_confirmed_pair",
        "opportunity",
        "(full_payment_confirmed_at IS NULL) = (full_payment_confirmed_by IS NULL)",
    )


def downgrade() -> None:
    op.drop_constraint("ck_opportunity_full_payment_confirmed_pair", "opportunity", type_="check")
    op.drop_column("opportunity", "full_payment_confirmed_by")
    op.drop_column("opportunity", "full_payment_confirmed_at")
    # Fails (FK) if any Opportunity is still at this stage -- move them back first.
    op.execute("DELETE FROM opportunity_stage WHERE stage_code = 'PAYMENT_PENDING';")
