"""target_plan decision_note column + target_plan_read RLS fix

Revision ID: 0045
Revises: 0044
Create Date: 2026-09-17

Two findings from docs/Target-Planning-Code-Review-Findings-2026-09-17.md,
resolved with Basheer 2026-09-17:

  - #3: an approver's note (why they approved/rejected) was already accepted
    by the API but had nowhere to be stored. Adds target_plan.decision_note.
  - #6: 0044's target_plan_read policy's "Area Manager ... OR direct
    reports" clause parenthesized so the direct-reports half wasn't actually
    scoped to Area Manager OR to the same SBU (SQL AND binds tighter than
    OR). Basheer's call: the "any manager, any tier, sees their own direct
    reports' targets" behavior IS the intended rule (matches
    get_approver_id's own generic manager_id walk, no role-name check) --
    but it must still be scoped to the same SBU, the same backstop every
    other branch in this policy already has. The role-name check itself is
    dropped entirely since it's now redundant: the zone-descendant subquery
    and the SBU Manager/Admin-GM branches above already cover who can read
    this far, so no branch depends on the literal string 'Area Manager'
    anymore.
"""

import sqlalchemy as sa

from alembic import op

revision = "0045"
down_revision = "0044"
branch_labels = None
depends_on = None

_OLD_READ_POLICY_BODY = """
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
"""

_NEW_READ_POLICY_BODY = """
    cabio_app_role_name() IN ('Admin', 'General Manager')
    OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
    OR (
        sbu_id = cabio_app_sbu_id()
        AND (
            user_id IN (
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
    )
    OR user_id = cabio_app_uid()
"""


def upgrade() -> None:
    op.add_column("target_plan", sa.Column("decision_note", sa.Text(), nullable=True))

    op.execute("DROP POLICY IF EXISTS target_plan_read ON target_plan;")
    op.execute(f"CREATE POLICY target_plan_read ON target_plan FOR SELECT USING ({_NEW_READ_POLICY_BODY});")


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS target_plan_read ON target_plan;")
    op.execute(f"CREATE POLICY target_plan_read ON target_plan FOR SELECT USING ({_OLD_READ_POLICY_BODY});")

    op.drop_column("target_plan", "decision_note")
