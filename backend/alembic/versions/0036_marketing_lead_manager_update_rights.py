"""marketing_lead_update: let SBU Manager / the rep's Area Manager act too

Revision ID: 0036
Revises: 0035
Create Date: 2026-09-03

Changes (docs/Lead-Management-Implementation-Plan.md follow-up): Convert/
Discard was Admin/GM or the assigned rep only -- a lead assigned to a rep
on leave had nobody who could act on it besides Admin/GM. Raised by
Basheer 2026-09-03 during Group F manual E2E testing (the same session
that found `marketing_lead_select`'s manager-chain visibility had no UI
surfacing it at all -- see MarketingLeadReviewQueueScreen.tsx's new "Team
Marketing Leads" section).

Two roles added, deliberately scoped differently:
- SBU Manager: any lead in their own SBU (sbu_id match) -- matches the
  select policy's own SBU Manager clause exactly.
- Area Manager: only leads assigned to reps who are actually THEIR OWN
  reports (user_profile.manager_id = the caller) -- narrower than the
  select policy's SBU-wide Area Manager clause. Mirrors BR-OP-14's
  existing "gate override approver must be the owner's immediate manager"
  precedent (opportunity/service.py's get_owner_manager_id), not the
  looser SBU-wide visibility grant. An Area Manager can therefore *see*
  (via marketing_lead_select) a lead belonging to a rep outside their own
  team, but cannot act on it -- same "visibility != action rights"
  principle the original select/update split was built on.
"""

from alembic import op

revision = "0036"
down_revision = "0035"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP POLICY IF EXISTS marketing_lead_update ON marketing_lead;")
    op.execute(
        """
        CREATE POLICY marketing_lead_update ON marketing_lead FOR UPDATE USING (
            cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
            OR assigned_to_user_id = cabio_app_uid()
            OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
            OR (
                cabio_app_role_name() = 'Area Manager'
                AND assigned_to_user_id IN (
                    SELECT id FROM user_profile WHERE manager_id = cabio_app_uid()
                )
            )
        ) WITH CHECK (
            cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
            OR assigned_to_user_id = cabio_app_uid()
            OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
            OR (
                cabio_app_role_name() = 'Area Manager'
                AND assigned_to_user_id IN (
                    SELECT id FROM user_profile WHERE manager_id = cabio_app_uid()
                )
            )
        );
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS marketing_lead_update ON marketing_lead;")
    op.execute(
        """
        CREATE POLICY marketing_lead_update ON marketing_lead FOR UPDATE USING (
            cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
            OR assigned_to_user_id = cabio_app_uid()
        ) WITH CHECK (
            cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
            OR assigned_to_user_id = cabio_app_uid()
        );
        """
    )
