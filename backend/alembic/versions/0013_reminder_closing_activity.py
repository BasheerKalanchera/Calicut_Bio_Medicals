"""reminder closing_activity_id (BR-ACT-05)

Revision ID: 0013
Revises: 0012
Create Date: 2026-07-30

Changes:
  - reminder: add nullable closing_activity_id FK -> activity.id, indexed.
    Distinct from the existing activity_id (the *creating* activity, per
    BR-ACT-04). closing_activity_id points to a separate Activity record
    created when the reminder is completed, documenting what was actually
    done to close it out (BR-ACT-05, mirrors BR-ACT-04 in the opposite
    direction). No RLS policy change needed -- the closing Activity is an
    ordinary row, already covered by activity's existing tier-visibility
    policy via its own account_id/opportunity_id.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "reminder",
        sa.Column("closing_activity_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "reminder_closing_activity_id_fkey",
        "reminder",
        "activity",
        ["closing_activity_id"],
        ["id"],
    )
    op.create_index("idx_reminder_closing_activity_id", "reminder", ["closing_activity_id"])


def downgrade() -> None:
    op.drop_index("idx_reminder_closing_activity_id", table_name="reminder")
    op.drop_constraint("reminder_closing_activity_id_fkey", "reminder", type_="foreignkey")
    op.drop_column("reminder", "closing_activity_id")
