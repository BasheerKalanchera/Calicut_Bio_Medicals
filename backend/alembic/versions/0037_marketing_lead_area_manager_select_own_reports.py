"""marketing_lead_select: narrow Area Manager visibility to own reports

Revision ID: 0037
Revises: 0036
Create Date: 2026-09-03

Changes (docs/Lead-Management-Implementation-Plan.md follow-up): Area
Manager's SELECT visibility on marketing_lead was SBU-wide since the
original policy (0031_add_lead.py) -- the same as SBU Manager's. That
predates 0036's tightened UPDATE policy (Area Manager can only act on
their OWN reports' leads, via manager_id), so an Area Manager could see
-- and get an action button for -- a lead they had no rights to touch,
only to have it 403 on attempt.

Raised by Basheer 2026-09-03 live: Fazal (Area Manager) could see
Shruthi's leads under "Team Marketing Leads" despite Shruthi not
reporting to him. Confirmed via a direct UPDATE attempt (RLS context set
to Fazal) that the UPDATE policy already correctly blocks it (0 rows
affected) -- this migration aligns SELECT to match UPDATE exactly, so
visibility and action rights are the same boundary for Area Manager, the
same way they already are for SBU Manager and Admin/GM.

SBU Manager's own-SBU visibility is untouched -- this only narrows the
Area Manager clause. assigned_to_user_id = self / created_by = self stay
as separate always-on clauses (an Area Manager still sees their own
assigned/created leads regardless of this change -- covered there, not by
the manager-chain clause being narrowed here).
"""

from alembic import op

revision = "0037"
down_revision = "0036"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP POLICY IF EXISTS marketing_lead_select ON marketing_lead;")
    op.execute(
        """
        CREATE POLICY marketing_lead_select ON marketing_lead FOR SELECT USING (
            cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
            OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
            OR (
                cabio_app_role_name() = 'Area Manager'
                AND assigned_to_user_id IN (
                    SELECT id FROM user_profile WHERE manager_id = cabio_app_uid()
                )
            )
            OR assigned_to_user_id = cabio_app_uid()
            OR created_by = cabio_app_uid()
        );
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS marketing_lead_select ON marketing_lead;")
    op.execute(
        """
        CREATE POLICY marketing_lead_select ON marketing_lead FOR SELECT USING (
            cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
            OR (cabio_app_role_name() = ANY (ARRAY['SBU Manager', 'Area Manager']) AND sbu_id = cabio_app_sbu_id())
            OR assigned_to_user_id = cabio_app_uid()
            OR created_by = cabio_app_uid()
        );
        """
    )
