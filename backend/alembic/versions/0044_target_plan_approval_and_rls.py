"""target_plan approval workflow columns + RLS

Revision ID: 0044
Revises: 0043
Create Date: 2026-09-16

Implements docs/Target-Planning-Implementation-Plan.md (all decisions
resolved 2026-09-16). target_plan already exists in the live DB (leftover
from the pre-Alembic baseline) with no RLS -- this migration adds the
approval-workflow columns and enables RLS in one pass.

  - status/approved_by/approved_at: a target isn't final until the
    setter's own direct manager approves it (single-hop, resolved
    generically via user_profile.manager_id -- no role-name check).
  - RLS: read stays broad tier-based visibility (Admin/GM unrestricted,
    SBU Manager sbu-scoped, Area Manager zone-scoped + direct reports,
    else self). Insert: everyone inserts only their own row. Update: the
    row's own owner, OR that owner's resolved manager, OR Admin/GM as the
    unrestricted overlay tier used everywhere else in this app -- EXCEPT
    on their own row (nobody may approve their own target). This is what
    forces the GM's own target through the separate Admin account without
    a GM-specific special case: get_approver_id(GM) is NULL (no
    manager_id), and the Admin/GM override now excludes self, so only
    another Admin/GM user can act on it.
  - coverage_plan/coverage_plan_entry RLS is deliberately out of scope
    here -- no router touches them yet either, deferred to the Coverage
    Planning batch.
"""

import sqlalchemy as sa

from alembic import op

revision = "0044"
down_revision = "0043"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "target_plan",
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING_APPROVAL"),
    )
    op.add_column(
        "target_plan",
        sa.Column("approved_by", sa.UUID(as_uuid=True), sa.ForeignKey("user_profile.id"), nullable=True),
    )
    op.add_column(
        "target_plan",
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_check_constraint(
        "ck_target_plan_status",
        "target_plan",
        "status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')",
    )

    op.execute("ALTER TABLE target_plan ENABLE ROW LEVEL SECURITY;")

    op.execute(
        """
        CREATE POLICY target_plan_read ON target_plan FOR SELECT USING (
            cabio_app_role_name() IN ('Admin', 'General Manager')
            OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
            OR (
                cabio_app_role_name() = 'Area Manager'
                AND sbu_id = cabio_app_sbu_id()
                AND user_id IN (
                    SELECT up.id FROM user_profile up
                    JOIN user_zone uz ON uz.user_id = up.id
                    WHERE uz.zone_id IN (
                        SELECT descendant_zone_id FROM zone_closure
                        WHERE ancestor_zone_id IN (
                            SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid()
                        )
                    )
                )
                OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
            )
            OR user_id = cabio_app_uid()
        );
        """
    )

    op.execute(
        """
        CREATE POLICY target_plan_write ON target_plan FOR INSERT WITH CHECK (
            user_id = cabio_app_uid()
        );
        """
    )

    op.execute(
        """
        CREATE POLICY target_plan_update ON target_plan FOR UPDATE
            USING (
                user_id = cabio_app_uid()
                OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
                OR (cabio_app_role_name() IN ('Admin', 'General Manager') AND user_id != cabio_app_uid())
            )
            WITH CHECK (
                user_id = cabio_app_uid()
                OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
                OR (cabio_app_role_name() IN ('Admin', 'General Manager') AND user_id != cabio_app_uid())
            );
        """
    )

    op.execute(
        """
        CREATE POLICY target_plan_delete ON target_plan FOR DELETE USING (
            user_id = cabio_app_uid() OR cabio_app_role_name() IN ('Admin', 'General Manager')
        );
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS target_plan_delete ON target_plan;")
    op.execute("DROP POLICY IF EXISTS target_plan_update ON target_plan;")
    op.execute("DROP POLICY IF EXISTS target_plan_write ON target_plan;")
    op.execute("DROP POLICY IF EXISTS target_plan_read ON target_plan;")
    op.execute("ALTER TABLE target_plan DISABLE ROW LEVEL SECURITY;")

    op.drop_constraint("ck_target_plan_status", "target_plan", type_="check")
    op.drop_column("target_plan", "approved_at")
    op.drop_column("target_plan", "approved_by")
    op.drop_column("target_plan", "status")
