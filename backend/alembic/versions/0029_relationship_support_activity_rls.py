"""relationship support activity rls

Revision ID: 0029
Revises: 0028
Create Date: 2026-08-27

Changes (docs/Referral-Credit-And-Relationship-Support-Implementation-Plan.md,
BR-ACT-10): the referred_by_user_id/referred_by_note columns and
ck_opportunity_referral_not_both constraint (Part 1, BR-FIN-07) already
shipped via 0023_add_referral_credit.py -- not touched here. This migration
is Part 2 only: the narrow RLS carve-out that lets someone outside a deal's
own SBU/zone log a RELATIONSHIP_SUPPORT activity against it and read that
one row back afterward.

  - cabio_app_opportunity_in_account(opportunity_id, account_id): write-path
    check -- lets ActivityService.log_activity accept an opportunity_id the
    caller's own RLS-scoped opportunity_exists() would otherwise (correctly,
    for every other case) filter out as invisible.
  - cabio_app_account_opportunities(account_id): the lookup the "Related
    Opportunity" picker calls -- id+name only, deliberately unscoped by
    caller SBU/zone (same narrow widening as the write-path check above).
    First row-returning SECURITY DEFINER function in this codebase --
    same hardened shape (STABLE, SET search_path = public) as the existing
    boolean ones, new RETURNS TABLE shape, not assumed safe by analogy alone.
  - activity_tier_visibility gains `OR user_id = cabio_app_uid()`: without
    this, the cross-SBU logger's own just-written row would be invisible to
    them on read-back, since the policy still filters through opportunity's
    own tier-visibility otherwise.
"""

from alembic import op

revision = "0029"
down_revision = "0028"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.cabio_app_opportunity_in_account(
            p_opportunity_id uuid, p_account_id uuid
        )
        RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
        SET search_path = public
        AS $$
            SELECT EXISTS (
                SELECT 1 FROM opportunity
                WHERE id = p_opportunity_id AND account_id = p_account_id
            )
        $$;
        """
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.cabio_app_account_opportunities(p_account_id uuid)
        RETURNS TABLE(id uuid, name text)
        LANGUAGE sql STABLE SECURITY DEFINER
        SET search_path = public
        AS $$
            SELECT o.id, o.name FROM opportunity o
            WHERE o.account_id = p_account_id
            ORDER BY o.name
        $$;
        """
    )
    op.execute(
        """
        ALTER POLICY activity_tier_visibility ON activity USING (
            opportunity_id IS NULL
            OR opportunity_id IN (SELECT id FROM opportunity)
            OR user_id = cabio_app_uid()
        );
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER POLICY activity_tier_visibility ON activity USING (
            opportunity_id IS NULL
            OR opportunity_id IN (SELECT id FROM opportunity)
        );
        """
    )
    op.execute("DROP FUNCTION IF EXISTS public.cabio_app_account_opportunities(uuid);")
    op.execute("DROP FUNCTION IF EXISTS public.cabio_app_opportunity_in_account(uuid, uuid);")
