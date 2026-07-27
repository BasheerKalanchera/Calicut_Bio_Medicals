"""phase 2E: RLS for activity/document/reminder + participant visibility on opportunity

Revision ID: 0011
Revises: 0010
Create Date: 2026-07-27

Changes (Phase 2E Build Estimate, Task 5 -- see Phase-2E-Build-Estimate.md SS1b,
and business decisions from the Task 5/6 migration reviews, 2026-07-27):

  - Two new SECURITY DEFINER helper functions, cabio_app_has_split() and
    cabio_app_assigned_reminder(). Each answers one narrow yes/no question
    ("does the calling user have a split / an assigned reminder on this
    opportunity") by reading `split` / `reminder`+`activity` directly,
    bypassing those tables' own RLS policies.

    Why bypass is required, not just convenient: 0010's opportunity policy
    is about to gain two new OR-branches -- "you can see a deal you have a
    split on" and "you can see a deal you have an assigned follow-up task
    on." Both branches need to query `split` / `reminder`+`activity`. But
    this migration also enables RLS on `activity`/`reminder`, and their own
    policies (below) are defined in terms of "can you see the parent
    opportunity." If opportunity's policy queried those tables through their
    normal RLS-filtered view, evaluating "can user X see opportunity O" would
    require re-evaluating "can user X see opportunity O" as a sub-step of
    its own answer -- a circular policy dependency between two RLS-protected
    tables, with no natural base case. SECURITY DEFINER functions owned by
    the migration's own role (table owner, RLS-exempt by default, same
    reasoning Phase-2E-Security-Architecture.md gives for why `postgres`
    bypasses RLS) break the cycle: the function computes its one narrow fact
    against the raw table, never re-entering opportunity's policy.
    `SET search_path = public` pins the resolution path against search-path
    hijacking, standard hardening for any SECURITY DEFINER function.

  - opportunity_tier_visibility (0010) widened via ALTER POLICY ... USING
    (not dropped/recreated) to add:
      OR cabio_app_has_split(id)
      OR cabio_app_assigned_reminder(id)
    Both intentionally permanent, not conditioned on split-percentage>0 or
    reminder.is_completed -- once genuinely involved in a deal (given a cut
    of it, or handed a task on it), that access doesn't expire when the task
    is marked done or specifics change. Both are, like the pre-existing
    `owner_id = cabio_app_uid()` branch, deliberately un-gated by role_name:
    they never grant more than "a deal you're personally tied to," which
    every tier already implies access to one way or another.
    ALTER POLICY leaves WITH CHECK untouched -- 0010 never specified one, so
    it still falls back to (the now-wider) USING dynamically; no separate
    update needed for INSERT/UPDATE gating.

  - RLS enabled + policy on `activity` and `document`: both carry nullable
    account_id/project_id/opportunity_id (document also has product_id,
    confirmed in document/models.py -- not in the Build Estimate's original
    3-column description, corrected here). Confirmed with Basheer
    (2026-07-27): a row scoped only to account/project/product context
    (opportunity_id IS NULL) stays universally visible -- unchanged from
    today for account/project-scoped rows, and explicitly extended to
    product-only rows (product-catalog collateral needs to stay visible
    across SBUs so a rep can answer a customer's question about the other
    SBU's equipment). A row with opportunity_id IS NOT NULL is gated by
    opportunity's own (now-widened) policy via the same join-back trick as
    0010's clean bucket.

  - RLS enabled + policy on `reminder`: points only at activity_id (one hop,
    not two, unlike the Build Estimate's original description) --
    `activity_id IN (SELECT id FROM activity)` re-applies activity's own
    (already opportunity-aware) policy automatically. Reminder needed no
    separate assignee carve-out of its own: cabio_app_assigned_reminder()
    already widened the *opportunity* itself, so both the activity and the
    reminder become visible through the ordinary join-back chain -- solving
    this once, at the top, per Opportunity-Access-Hierarchy-Technical-Design.md
    SS11's "one place, not one per screen" principle.
"""

from alembic import op

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None

ORIGINAL_OPPORTUNITY_USING = """
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
"""

WIDENED_OPPORTUNITY_USING = (
    ORIGINAL_OPPORTUNITY_USING
    + """
    OR cabio_app_has_split(id)
    OR cabio_app_assigned_reminder(id)
"""
)

OPPORTUNITY_ID_NULL_OR_VISIBLE = """
    opportunity_id IS NULL
    OR opportunity_id IN (SELECT id FROM opportunity)
"""


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.cabio_app_has_split(p_opportunity_id uuid)
        RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
        SET search_path = public
        AS $$
            SELECT EXISTS (
                SELECT 1 FROM split
                WHERE opportunity_id = p_opportunity_id
                  AND user_id = cabio_app_uid()
            )
        $$;
        """
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.cabio_app_assigned_reminder(p_opportunity_id uuid)
        RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
        SET search_path = public
        AS $$
            SELECT EXISTS (
                SELECT 1 FROM reminder r
                JOIN activity a ON a.id = r.activity_id
                WHERE a.opportunity_id = p_opportunity_id
                  AND r.assigned_to_user_id = cabio_app_uid()
            )
        $$;
        """
    )

    op.execute(f"ALTER POLICY opportunity_tier_visibility ON opportunity USING ({WIDENED_OPPORTUNITY_USING});")

    for table in ["activity", "document"]:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        op.execute(
            f"""
            CREATE POLICY {table}_tier_visibility ON {table}
            USING ({OPPORTUNITY_ID_NULL_OR_VISIBLE});
            """
        )

    op.execute("ALTER TABLE reminder ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY reminder_via_activity ON reminder
        USING (activity_id IN (SELECT id FROM activity));
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS reminder_via_activity ON reminder;")
    op.execute("ALTER TABLE reminder DISABLE ROW LEVEL SECURITY;")

    for table in ["document", "activity"]:
        op.execute(f"DROP POLICY IF EXISTS {table}_tier_visibility ON {table};")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")

    op.execute(f"ALTER POLICY opportunity_tier_visibility ON opportunity USING ({ORIGINAL_OPPORTUNITY_USING});")

    op.execute("DROP FUNCTION IF EXISTS public.cabio_app_assigned_reminder(uuid);")
    op.execute("DROP FUNCTION IF EXISTS public.cabio_app_has_split(uuid);")
