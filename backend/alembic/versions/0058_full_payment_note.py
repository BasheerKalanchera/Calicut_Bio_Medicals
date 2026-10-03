"""BR-OP-17: optional note with the full-payment confirmation

Revision ID: 0058
Revises: 0057
Create Date: 2026-10-03

docs/Payment-Confirmation-Gate-Implementation-Plan.md (Basheer, 2026-10-03):
an optional free-text note entered with the "full payment received" tick
(e.g. "Final payment by cheque no. 1234"). Optional, like loss_notes and
gate_override_note; one column per event rather than a shared notes table
(Basheer, 2026-10-03). Covered by the existing opportunity audit trigger.
"""

import sqlalchemy as sa

from alembic import op

revision = "0058"
down_revision = "0057"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("opportunity", sa.Column("full_payment_note", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("opportunity", "full_payment_note")
