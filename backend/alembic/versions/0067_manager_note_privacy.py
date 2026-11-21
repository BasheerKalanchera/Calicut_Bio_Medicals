"""Manager Notes visible only to the rep, the writer and the rep's managers

Revision ID: 0067
Revises: 0066
Create Date: 2026-11-21

docs/Manager-Note-Privacy-Implementation-Plan.md (approved 2026-11-20), D1-D6, D10.

`activity_select` (migration 0046) opens every activity that has no
Opportunity to every login, and a linked one to everyone who can see that
Opportunity, including split and reminder holders. For MANAGER_NOTE only, it
is replaced by:

  - the rep it is about (user_id) or the manager who wrote it (created_by);
  - Admin and General Manager;
  - the SBU Manager of the rep's business unit, unless the note is about a
    General Manager or Admin (D6);
  - an Area Manager, unless the note is about an SBU Manager, General Manager
    or Admin (D6), who is above the rep in the reporting line, or who is in
    the rep's business unit and covers the customer's zone (D4, D10).

The same rule for a linked and an unlinked note (D3); split and reminder
holders no longer see Manager Notes on the Opportunity (D5). Every other
activity type keeps exactly the 0046 expression. Comments and reminders on an
activity follow this policy through their own policies, no change there.

`activity_insert` is untouched: INSERT ... RETURNING also applies the SELECT
policy, and the writer passes through created_by.
"""

from alembic import op

revision = "0067"
down_revision = "0066"
branch_labels = None
depends_on = None

# Same expressions as migration 0046, so every other activity type is unchanged.
_ACTIVITY_TIER_EXCLUSION = """
    NOT (
        (public.cabio_app_role_name() = 'Area Manager'
         AND public.cabio_app_user_role_name(user_id) = ANY (ARRAY['SBU Manager', 'General Manager', 'Admin']))
        OR (public.cabio_app_role_name() = 'SBU Manager'
            AND public.cabio_app_user_role_name(user_id) = ANY (ARRAY['General Manager', 'Admin']))
    )
"""

_ACTIVITY_OPPORTUNITY_VISIBLE = f"""
    public.cabio_app_has_split(opportunity_id)
    OR public.cabio_app_assigned_reminder(opportunity_id)
    OR (
        opportunity_id IN (SELECT id FROM public.opportunity)
        AND {_ACTIVITY_TIER_EXCLUSION}
    )
"""

_OTHER_TYPES_VISIBLE = f"""
    (opportunity_id IS NULL)
    OR (user_id = public.cabio_app_uid())
    OR {_ACTIVITY_OPPORTUNITY_VISIBLE}
"""

# user_profile, account, user_zone and zone_closure carry no row-level security,
# so these subqueries read the same rows for every viewer.
_MANAGER_NOTE_VISIBLE = f"""
    (user_id = public.cabio_app_uid())
    OR (created_by = public.cabio_app_uid())
    OR (public.cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager']))
    OR (
        {_ACTIVITY_TIER_EXCLUSION}
        AND (
            (public.cabio_app_role_name() = 'SBU Manager'
             AND public.cabio_app_sbu_id() = (SELECT up.sbu_id FROM public.user_profile up WHERE up.id = user_id))
            OR (
                public.cabio_app_role_name() = 'Area Manager'
                AND (
                    public.cabio_app_is_above(user_id)
                    OR (
                        public.cabio_app_sbu_id() = (SELECT up.sbu_id FROM public.user_profile up WHERE up.id = user_id)
                        AND account_id IN (
                            SELECT a.id FROM public.account a
                            WHERE a.zone_id IN (
                                SELECT zc.descendant_zone_id FROM public.zone_closure zc
                                WHERE zc.ancestor_zone_id IN (
                                    SELECT uz.zone_id FROM public.user_zone uz
                                    WHERE uz.user_id = public.cabio_app_uid()
                                )
                            )
                        )
                    )
                )
            )
        )
    )
"""


def upgrade() -> None:
    op.execute("DROP POLICY IF EXISTS activity_select ON public.activity;")
    op.execute(f"""
        CREATE POLICY activity_select ON public.activity FOR SELECT USING (
            (activity_type <> 'MANAGER_NOTE' AND ({_OTHER_TYPES_VISIBLE}))
            OR (activity_type = 'MANAGER_NOTE' AND ({_MANAGER_NOTE_VISIBLE}))
        );
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS activity_select ON public.activity;")
    op.execute(f"""
        CREATE POLICY activity_select ON public.activity FOR SELECT USING (
            {_OTHER_TYPES_VISIBLE}
        );
    """)
