"""marketing_lead_update: relax WITH CHECK, fixes Reassign 500

Revision ID: 0038
Revises: 0037
Create Date: 2026-09-03

Bug found live 2026-09-03: Reassign threw a 500
(psycopg2.errors.InsufficientPrivilege: "new row violates row-level
security policy") the moment the new assignee wasn't also the actor
themselves or (for Area Manager) one of the actor's own reports -- e.g.
Fazal (Area Manager, self-delegating a lead assigned to himself)
reassigning to Shruthi, who isn't his report.

Root cause: 0036 gave marketing_lead_update an identical USING and WITH
CHECK clause. For Postgres UPDATE policies, USING is evaluated against
the row as it exists BEFORE the update (deciding whether the actor may
touch it at all); WITH CHECK is evaluated against the row AFTER --
i.e. with the new assigned_to_user_id already in place. Two of the four
clauses (assigned_to_user_id = self; Area Manager's own-reports subquery)
are themselves keyed on assigned_to_user_id -- fine for Convert/Discard
(never change that column, so old and new values are identical), but
Reassign's entire purpose is to change it, so the post-update row almost
never satisfies "the new assignee is the actor, or the actor's own
report" -- nothing in the design ever required that; only the *previous*
assignee/SBU relationship matters for whether the actor may act at all.

Fix: WITH CHECK (true) -- USING (evaluated against the pre-image, unaffected
by this change) remains the sole authorization gate for this policy, same
principle Postgres's own docs describe for UPDATE policies whose USING
predicate references a column the action itself may modify. The Python
service layer (_actor_manages / is_self_delegation) is the actual
authorization logic; RLS is the belt-and-suspenders backstop, not expected
to re-derive it per-column.
"""

from alembic import op

revision = "0038"
down_revision = "0037"
branch_labels = None
depends_on = None

_USING_CLAUSE = """
    cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
    OR assigned_to_user_id = cabio_app_uid()
    OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
    OR (
        cabio_app_role_name() = 'Area Manager'
        AND assigned_to_user_id IN (
            SELECT id FROM user_profile WHERE manager_id = cabio_app_uid()
        )
    )
"""


def upgrade() -> None:
    op.execute("DROP POLICY IF EXISTS marketing_lead_update ON marketing_lead;")
    op.execute(
        f"""
        CREATE POLICY marketing_lead_update ON marketing_lead FOR UPDATE USING (
            {_USING_CLAUSE}
        ) WITH CHECK (true);
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS marketing_lead_update ON marketing_lead;")
    op.execute(
        f"""
        CREATE POLICY marketing_lead_update ON marketing_lead FOR UPDATE USING (
            {_USING_CLAUSE}
        ) WITH CHECK (
            {_USING_CLAUSE}
        );
        """
    )
