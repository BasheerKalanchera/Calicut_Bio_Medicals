"""add stakeholder contact details

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-26

Changes:
  - stakeholder: add nullable columns designation, email, phone
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("stakeholder", sa.Column("designation", sa.String(100), nullable=True))
    op.add_column("stakeholder", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("stakeholder", sa.Column("phone", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column("stakeholder", "phone")
    op.drop_column("stakeholder", "email")
    op.drop_column("stakeholder", "designation")
