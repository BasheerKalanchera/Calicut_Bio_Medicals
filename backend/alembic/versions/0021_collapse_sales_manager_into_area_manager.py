"""Collapse Sales Manager (Level 5) into Area Manager

Revision ID: 0021
Revises: 0020
Create Date: 2026-08-15

Changes (docs/Sales-Manager-Tier-Collapse-Implementation-Plan.md):

  - `opportunity_tier_visibility`'s Sales Manager branch (owner_id IN
    (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())) is
    folded into the Area Manager branch as an additional OR-condition, and
    Sales Manager is dropped as a standalone branch. Real field data shows
    no one occupies that tier -- every rep reports directly to an Area
    Manager -- and the zone hierarchy (migration 0019) already lets an Area
    Manager cover any granularity, so a dedicated "team lead" role is no
    longer structurally distinct from "regional manager." manager_id stays
    as a safety net for account-zone/reporting-line drift, not the primary
    mechanism.

  - `role` row for Sales Manager (id 77777777-7777-7777-7777-700000000006)
    hard-deleted -- `role` has no `is_active` column, so leaving the row in
    place would keep it selectable in the User Directory role dropdown with
    no RLS/scope logic behind it. Preflight (2026-08-15, against live Dev)
    confirmed only a test fixture referenced this role_id, and that fixture
    has since been reassigned to Area Manager -- this DELETE is expected to
    affect 0 rows against Dev (already cleared by hand), but is included
    for every other environment (fresh bootstrap, UAT, Prod) where the
    fixture may still exist.

  organization/repository.py's TEAM_SCOPE_BUILDERS gets the same fold,
  Sales Manager entry removed -- Python-level change, not part of this
  migration.

Downgrade note: same honesty pattern as migration 0018/0019's downgrades --
reverting the policy and re-inserting the role row cannot restore whatever
role_id/manager_id state existed on real user_profile rows before this
migration ran. Best-effort only.
"""

from alembic import op

revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None

SALES_MANAGER_ROLE_ID = "77777777-7777-7777-7777-700000000006"

COLLAPSED_OPPORTUNITY_USING = """
    cabio_app_role_name() = ANY (ARRAY['Admin','General Manager'])
    OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
    OR (
        cabio_app_role_name() = 'Area Manager'
        AND sbu_id = cabio_app_sbu_id()
        AND (
            account_id IN (
                SELECT id FROM account
                WHERE zone_id IN (
                    SELECT descendant_zone_id FROM zone_closure
                    WHERE ancestor_zone_id IN (
                        SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid()
                    )
                )
            )
            OR owner_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
        )
    )
    OR owner_id = cabio_app_uid()
    OR cabio_app_has_split(id)
    OR cabio_app_assigned_reminder(id)
"""

PRE_COLLAPSE_OPPORTUNITY_USING = """
    cabio_app_role_name() = ANY (ARRAY['Admin','General Manager'])
    OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
    OR (
        cabio_app_role_name() = 'Area Manager'
        AND sbu_id = cabio_app_sbu_id()
        AND account_id IN (
            SELECT id FROM account
            WHERE zone_id IN (
                SELECT descendant_zone_id FROM zone_closure
                WHERE ancestor_zone_id IN (
                    SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid()
                )
            )
        )
    )
    OR (
        cabio_app_role_name() = 'Sales Manager'
        AND owner_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
    )
    OR owner_id = cabio_app_uid()
    OR cabio_app_has_split(id)
    OR cabio_app_assigned_reminder(id)
"""


def upgrade() -> None:
    op.execute(f"ALTER POLICY opportunity_tier_visibility ON opportunity USING ({COLLAPSED_OPPORTUNITY_USING});")
    op.execute(f"DELETE FROM role WHERE id = '{SALES_MANAGER_ROLE_ID}';")


def downgrade() -> None:
    op.execute(f"ALTER POLICY opportunity_tier_visibility ON opportunity USING ({PRE_COLLAPSE_OPPORTUNITY_USING});")
    op.execute(f"INSERT INTO role (id, role_name) VALUES ('{SALES_MANAGER_ROLE_ID}', 'Sales Manager');")
