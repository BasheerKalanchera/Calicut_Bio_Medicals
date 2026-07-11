"""add account customer_type

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-11

Changes:
  - account: add nullable customer_type column + CHECK constraint
    (institution nature, "Cabio Sales OS - Phase 1 - PRD.md" SS B.2.6)
"""

from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None

CUSTOMER_TYPES = (
    "MULTISPECIALITY_HOSPITAL",
    "SPECIALTY_HOSPITAL",
    "DIAGNOSTIC_CENTER",
    "CLINIC",
    "DEALER",
    "MEDICAL_COLLEGE_HOSPITAL",
    "GOVERNMENT_HOSPITAL",
    "OTHER",
)


def upgrade() -> None:
    op.add_column("account", sa.Column("customer_type", sa.String(50), nullable=True))
    op.create_check_constraint(
        "ck_account_customer_type",
        "account",
        "customer_type IN ({})".format(", ".join(f"'{v}'" for v in CUSTOMER_TYPES)),
    )


def downgrade() -> None:
    op.drop_constraint("ck_account_customer_type", "account", type_="checkconstraint")
    op.drop_column("account", "customer_type")
