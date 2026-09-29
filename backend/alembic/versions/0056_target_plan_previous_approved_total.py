"""BR-PL-05: remember the last approved total when an approved plan is revised

Revision ID: 0056
Revises: 0055
Create Date: 2026-09-29

Step 3d of docs/Hospital-Wise-Target-Planning-Implementation-Plan.md (decided
2026-09-29). `target_plan.previous_approved_total_lakhs` holds the total the
approver last signed off, set only when an APPROVED plan is revised. Re-revising
a PENDING/REJECTED plan keeps it; approving clears it; drafts never get it.
The screen uses it to warn "below your approved target" -- a warning only,
Submit is still allowed. Nullable column, no RLS change (target_plan's
existing row policies cover it).
"""

import sqlalchemy as sa

from alembic import op

revision = "0056"
down_revision = "0055"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "target_plan",
        sa.Column("previous_approved_total_lakhs", sa.Numeric(15, 2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("target_plan", "previous_approved_total_lakhs")
