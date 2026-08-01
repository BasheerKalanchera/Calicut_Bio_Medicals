"""add stakeholder whatsapp_number

Revision ID: 0015
Revises: 0014
Create Date: 2026-08-01

Changes:
  - stakeholder: add nullable whatsapp_number column, separate from the
    existing phone column. Deliberately not a boolean flag on phone --
    some stakeholders use a different number for WhatsApp than their
    primary phone. The frontend (Customer360Screen.tsx) mirrors phone into
    this field whenever no distinct WhatsApp number is set, and keeps it in
    sync on every phone edit -- so NULL genuinely means "no number on file
    at all", not "same as phone". Column itself carries no such convention;
    it's plain nullable data, kept in sync by the frontend, not the DB.
"""

import sqlalchemy as sa

from alembic import op

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("stakeholder", sa.Column("whatsapp_number", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column("stakeholder", "whatsapp_number")
