"""target_plan_brand_split_read RLS fix -- cross-SBU leak reintroduced by 0053

Revision ID: 0054
Revises: 0053
Create Date: 2026-09-23

0053's target_plan_brand_split_read policy was written from 0044's original
policy body instead of 0045's fix (0045, 2026-09-17, closed the exact same
bug on target_plan_read: "AND binds tighter than OR" meant the direct-
reports clause wasn't actually scoped to the same SBU as the rest of the
branch). 0053 copied the pre-0045 shape verbatim onto the new child table,
reopening the identical leak one layer down -- any user who is someone's
manager_id, in any role, in any SBU, could read that person's brand-split
rows across SBU boundaries. Found by /code-review (high effort) on the
Brand-Level Target Planning feature commits, confirmed by diffing 0053's
policy text against 0045's own _OLD_READ_POLICY_BODY / _NEW_READ_POLICY_BODY
constants -- 0053 is a byte-for-byte match to the rejected old version.

Same fix as 0045: drop the redundant 'Area Manager' role-name check (the
zone-descendant subquery and the SBU Manager/Admin-GM branches above already
cover who can read this far) and nest the direct-reports clause inside
`sbu_id = cabio_app_sbu_id() AND (...)` so it can't fire outside the row's
own SBU.
"""

from alembic import op

revision = "0054"
down_revision = "0053"
branch_labels = None
depends_on = None

_OLD_READ_POLICY_BODY = """
    target_plan_id IN (
        SELECT id FROM target_plan WHERE
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
    )
"""

_NEW_READ_POLICY_BODY = """
    target_plan_id IN (
        SELECT id FROM target_plan WHERE
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
    )
"""


def upgrade() -> None:
    op.execute("DROP POLICY IF EXISTS target_plan_brand_split_read ON target_plan_brand_split;")
    op.execute(
        f"CREATE POLICY target_plan_brand_split_read ON target_plan_brand_split "
        f"FOR SELECT USING ({_NEW_READ_POLICY_BODY});"
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS target_plan_brand_split_read ON target_plan_brand_split;")
    op.execute(
        f"CREATE POLICY target_plan_brand_split_read ON target_plan_brand_split "
        f"FOR SELECT USING ({_OLD_READ_POLICY_BODY});"
    )
