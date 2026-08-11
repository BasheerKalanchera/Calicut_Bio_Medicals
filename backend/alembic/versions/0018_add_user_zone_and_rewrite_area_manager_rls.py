"""add user_zone join table and rewrite Area Manager RLS to set-membership

Revision ID: 0018
Revises: 0017
Create Date: 2026-08-11

Changes:
  - New user_zone table (composite PK user_id+zone_id, AuditMixin columns) --
    a person can now be assigned to more than one zone (Fazal: North Kerala +
    Mangalore), which user_profile.zone_id (a single scalar FK) can't
    represent. No RLS on this table itself -- it isn't in the RLS-protected
    set (user_profile isn't either); access is gated at the application
    layer (Admin/GM only, User Directory), same as user_profile.
  - Backfill: every existing non-null user_profile.zone_id gets exactly one
    corresponding user_zone row.
  - opportunity_tier_visibility policy: Area Manager branch rewritten from
    scalar zone equality (account.zone_id = cabio_app_zone_id()) to
    set-membership over user_zone. Confirmed by grep (Milestone 1 design
    doc) that cabio_app_zone_id()/app.current_zone_id is used in exactly
    this one place in the entire schema -- no other policy needs a parallel
    change.
  - cabio_app_zone_id() dropped -- dead after the rewrite, since the new
    policy reads user_zone directly via cabio_app_uid() (already in session
    context) instead of a scalar session GUC. Postgres session vars can't
    hold a set, so the replacement doesn't push zone into session context
    at all -- see the paired change in app/db/session.py.

Downgrade note: this migration's downgrade only reverts to the
scalar-equality version of the policy (recreating cabio_app_zone_id() first
so the reverted policy compiles). It does NOT revert app/db/session.py's
removal of the SET LOCAL app.current_zone_id block -- that must be rolled
back in the same deploy as this migration's downgrade, or the reverted
policy silently breaks (cabio_app_zone_id() would exist but always return
NULL, since nothing ever sets the session var again), rather than actually
restoring pre-Milestone-1 behavior.
"""

import sqlalchemy as sa

from alembic import op

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_zone",
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("user_profile.id"), primary_key=True),
        sa.Column("zone_id", sa.UUID(as_uuid=True), sa.ForeignKey("zone.id"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", sa.UUID(as_uuid=True), sa.ForeignKey("user_profile.id"), nullable=True),
        sa.Column("updated_by", sa.UUID(as_uuid=True), sa.ForeignKey("user_profile.id"), nullable=True),
    )
    op.create_index("idx_user_zone_zone_id", "user_zone", ["zone_id"])
    op.execute(
        "CREATE TRIGGER trg_updated_at BEFORE UPDATE ON user_zone "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at();"
    )

    op.execute(
        "INSERT INTO user_zone (user_id, zone_id) "
        "SELECT id, zone_id FROM user_profile WHERE zone_id IS NOT NULL "
        "ON CONFLICT DO NOTHING;"
    )

    op.execute(
        """
        ALTER POLICY opportunity_tier_visibility ON opportunity USING (
            cabio_app_role_name() = ANY (ARRAY['Admin','General Manager'])
            OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
            OR (
                cabio_app_role_name() = 'Area Manager'
                AND sbu_id = cabio_app_sbu_id()
                AND account_id IN (
                    SELECT id FROM account
                    WHERE zone_id IN (SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid())
                )
            )
            OR (
                cabio_app_role_name() = 'Sales Manager'
                AND owner_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
            )
            OR owner_id = cabio_app_uid()
            OR cabio_app_has_split(id)
            OR cabio_app_assigned_reminder(id)
        );
        """
    )

    op.execute("DROP FUNCTION IF EXISTS public.cabio_app_zone_id();")


def downgrade() -> None:
    op.execute(
        """
        CREATE FUNCTION public.cabio_app_zone_id() RETURNS uuid
            LANGUAGE sql STABLE
            AS $$ SELECT NULLIF(current_setting('app.current_zone_id', true), '')::uuid $$;
        """
    )

    op.execute(
        """
        ALTER POLICY opportunity_tier_visibility ON opportunity USING (
            cabio_app_role_name() = ANY (ARRAY['Admin','General Manager'])
            OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
            OR (
                cabio_app_role_name() = 'Area Manager'
                AND sbu_id = cabio_app_sbu_id()
                AND account_id IN (SELECT id FROM account WHERE zone_id = cabio_app_zone_id())
            )
            OR (
                cabio_app_role_name() = 'Sales Manager'
                AND owner_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
            )
            OR owner_id = cabio_app_uid()
            OR cabio_app_has_split(id)
            OR cabio_app_assigned_reminder(id)
        );
        """
    )

    op.drop_index("idx_user_zone_zone_id", table_name="user_zone")
    op.drop_table("user_zone")
