"""make user_profile.sbu_id nullable for Admin/General Manager

Revision ID: 0022
Revises: 0021
Create Date: 2026-08-17

Changes (docs/Admin-GM-SBU-Agnostic-Implementation-Plan.md):
  - user_profile.sbu_id: NOT NULL -> nullable. Admin/General Manager are an
    unrestricted overlay tier, not members of any SBU -- the column was a
    meaningless placeholder for them, not real membership. Confirmed by a
    full audit (see the plan doc) that every RLS policy referencing sbu_id
    gates Admin/GM on role name alone, never evaluating cabio_app_sbu_id()
    for them -- this migration changes nothing at the RLS layer.
  - Backfill: existing Admin/GM rows' sbu_id set to NULL, by role_name (not
    hardcoded user ids -- applies identically to Dev/UAT/Prod/fresh
    bootstrap, same reasoning as 0021's role-id-constant pattern, just
    keyed off role_name here since there's no small fixed set of ids to
    enumerate up front).

Downgrade note: backfilling a real sbu_id back onto a downgraded row isn't
possible in general (no record of what it "should" be) -- downgrade only
restores the NOT NULL constraint, and will fail if any Admin/GM row is
genuinely NULL at that point. Same honesty pattern as 0018/0019/0021's
downgrades.
"""

import sqlalchemy as sa

from alembic import op

revision = "0022"
down_revision = "0021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("user_profile", "sbu_id", existing_type=sa.UUID(), nullable=True)
    op.execute(
        """
        UPDATE user_profile
        SET sbu_id = NULL
        WHERE role_id IN (SELECT id FROM role WHERE role_name IN ('Admin', 'General Manager'));
        """
    )


def downgrade() -> None:
    op.alter_column("user_profile", "sbu_id", existing_type=sa.UUID(), nullable=False)
