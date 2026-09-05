"""hide senior-tier activity notes from Area Manager / SBU Manager

Revision ID: 0039
Revises: 0038
Create Date: 2026-09-05

Implements docs/Opportunity-Notes-Privacy-Implementation-Plan.md (Haroon
agreed 2026-09-05, discussion brief docs/Opportunity-Notes-Privacy-
Discussion-Brief-2026-09-04.md). Haroon logs Activity notes directly like
any rep; today's zone/SBU-scoped opportunity_tier_visibility (ADR-009)
means Area Manager/SBU Manager can read those notes on any deal in their
territory/SBU regardless of the note owner's own rank. Hiding the whole
opportunity was ruled out (removes the only existing safeguard against
duplicate outreach to the same hospital) -- this hides only the notes.

  - cabio_app_user_role_name(p_user_id): new helper, resolves an
    arbitrary user's role_name (existing cabio_app_role_name() only
    resolves the caller's own). No SECURITY DEFINER needed -- role/
    user_profile carry no RLS.
  - activity_tier_visibility gains a role-hierarchy hide: Area Manager
    can't see notes logged by SBU Manager/General Manager/Admin; SBU
    Manager can't see General Manager/Admin notes. Admin/GM and Sales
    Staff unaffected. A viewer already holding a split or assigned
    reminder on the opportunity (cabio_app_has_split /
    cabio_app_assigned_reminder, the same opportunity-level carve-out
    functions) sees the note regardless of rank -- a deliberate
    "looped in" exception, not a gap.
  - document_tier_visibility and reminder_via_activity are untouched
    (documents stay out of scope; reminder_via_activity already derives
    from activity visibility, so it inherits this change for free).
"""

from alembic import op

revision = "0039"
down_revision = "0038"
branch_labels = None
depends_on = None

_OLD_ACTIVITY_TIER_VISIBILITY = """
    opportunity_id IS NULL
    OR opportunity_id IN (SELECT id FROM opportunity)
    OR user_id = cabio_app_uid()
"""

_NEW_ACTIVITY_TIER_VISIBILITY = """
    opportunity_id IS NULL
    OR user_id = cabio_app_uid()
    OR cabio_app_has_split(opportunity_id)
    OR cabio_app_assigned_reminder(opportunity_id)
    OR (
        opportunity_id IN (SELECT id FROM opportunity)
        AND NOT (
            (cabio_app_role_name() = 'Area Manager'
             AND cabio_app_user_role_name(user_id) = ANY (ARRAY['SBU Manager','General Manager','Admin']))
            OR
            (cabio_app_role_name() = 'SBU Manager'
             AND cabio_app_user_role_name(user_id) = ANY (ARRAY['General Manager','Admin']))
        )
    )
"""


def upgrade() -> None:
    op.execute(
        """
        CREATE FUNCTION public.cabio_app_user_role_name(p_user_id uuid)
        RETURNS text LANGUAGE sql STABLE
        AS $$
            SELECT r.role_name FROM user_profile up
            JOIN role r ON r.id = up.role_id
            WHERE up.id = p_user_id
        $$;
        """
    )
    op.execute(f"ALTER POLICY activity_tier_visibility ON activity USING ({_NEW_ACTIVITY_TIER_VISIBILITY});")


def downgrade() -> None:
    op.execute(f"ALTER POLICY activity_tier_visibility ON activity USING ({_OLD_ACTIVITY_TIER_VISIBILITY});")
    op.execute("DROP FUNCTION IF EXISTS public.cabio_app_user_role_name(uuid);")
