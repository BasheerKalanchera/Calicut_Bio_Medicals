"""phase 2E: RLS policies for opportunity + its clean join-back children

Revision ID: 0010
Revises: 0009
Create Date: 2026-07-27

Changes (Phase 2E Build Estimate, Task 4 -- see Phase-2E-Build-Estimate.md SS1a
and Opportunity-Access-Hierarchy-Technical-Design.md SS1/SS5/SS6):
  - New helper function public.cabio_app_role_name(), mirroring the 4 identity
    functions in 0009 -- resolves the caller's role_id (via
    cabio_app_role_id()) to its role_name once, so the tier checks below don't
    repeat the same subquery per branch.
  - RLS enabled + one combined policy on `opportunity`, encoding all 6 tiers
    from the Technical Design doc as OR'd branches:
      Admin / General Manager  -> unrestricted
      SBU Manager              -> sbu_id = caller's sbu
      Area Manager             -> SBU Manager's check AND the opportunity's
                                  account is in the caller's zone (joins via
                                  account.zone_id, NOT the owner's zone_id --
                                  Technical Design SS5, same frozen-attribution
                                  reasoning as SS8's sbu_id fix: the account's
                                  zone is the stable customer-location fact,
                                  a staff member's assigned zone isn't)
      Sales Manager             -> owner reports directly to the caller
                                  (owner_id's user_profile.manager_id = caller),
                                  gated on role_name so this branch can never
                                  fire for a non-Sales-Manager caller even if a
                                  future data-entry mistake ever pointed some
                                  other role's manager_id at them
      Sales Staff (and, harmlessly, every other tier too) -> owner_id = caller.
                                  Left unconditional / not role-gated: it never
                                  grants more than "your own rows," which every
                                  tier above already includes, so gating it
                                  would be a no-op -- see Technical Design SS6
                                  Decision #13 for why Levels 5/6 need no
                                  independent SBU/zone check of their own
                                  (SBU containment is already guaranteed by the
                                  creation-time sbu_id stamp, ADR-035/SS7).
  - RLS enabled + a join-back policy on `split`, `opportunity_item`,
    `opportunity_stakeholder` (Build Estimate SS1a's "clean" bucket): each has
    no independent account/project context, so each policy is simply
    `opportunity_id IN (SELECT id FROM opportunity)` -- Postgres re-applies
    `opportunity`'s own policy to that subquery automatically, so the tier
    logic lives in exactly one place, not four.
  - No FOR clause on any CREATE POLICY -- defaults to ALL commands (SELECT,
    INSERT, UPDATE, DELETE), matching Phase-2E-Security-Architecture.md's own
    sample policy. Service-layer authorization (BR checks, role gates on
    writes) is unchanged and unaffected; this is a second, independent layer.
  - Inert on its own, same as 0008/0009: the app still connects via the plain
    postgres role (table owner), which Postgres exempts from RLS by default
    regardless of ENABLE ROW LEVEL SECURITY -- no behavior change until the
    DATABASE_URL cutover to `cabio_app`. The full role-by-role verification
    pass (all 6 tiers, side psql session) is deliberately deferred until the
    `activity`/`document`/`reminder` and `product` policies exist too, per
    Phase-2E-Build-Estimate.md SS5's discipline -- not numbered here since
    the build-estimate doc's own task numbers and active_progress.md's
    tracking numbers have diverged (an inserted task shifted the latter by
    one) and a bare number would drift out of sync with one or the other.
"""

from alembic import op

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None

JOIN_BACK_TABLES = ["split", "opportunity_item", "opportunity_stakeholder"]

OPPORTUNITY_POLICY = """
    CREATE POLICY opportunity_tier_visibility ON opportunity
    USING (
        cabio_app_role_name() IN ('Admin', 'General Manager')
        OR (
            cabio_app_role_name() = 'SBU Manager'
            AND sbu_id = cabio_app_sbu_id()
        )
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
    );
"""


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.cabio_app_role_name()
        RETURNS text LANGUAGE sql STABLE
        AS $$ SELECT role_name FROM role WHERE id = cabio_app_role_id() $$;
        """
    )

    op.execute("ALTER TABLE opportunity ENABLE ROW LEVEL SECURITY;")
    op.execute(OPPORTUNITY_POLICY)

    for table in JOIN_BACK_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        op.execute(
            f"""
            CREATE POLICY {table}_via_opportunity ON {table}
            USING (opportunity_id IN (SELECT id FROM opportunity));
            """
        )


def downgrade() -> None:
    for table in JOIN_BACK_TABLES:
        op.execute(f"DROP POLICY IF EXISTS {table}_via_opportunity ON {table};")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")

    op.execute("DROP POLICY IF EXISTS opportunity_tier_visibility ON opportunity;")
    op.execute("ALTER TABLE opportunity DISABLE ROW LEVEL SECURITY;")

    op.execute("DROP FUNCTION IF EXISTS public.cabio_app_role_name();")
