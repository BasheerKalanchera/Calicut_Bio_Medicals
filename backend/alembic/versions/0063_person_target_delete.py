"""person_quarter_target: the people who may set a target may also remove it

Revision ID: 0063
Revises: 0062
Create Date: 2026-10-22

docs/Annual-Target-Planning-Implementation-Plan.md, D74 (Basheer,
2026-10-22, at Part 1 E2E C4): a person's quarterly target can be taken
back to "Not set". 0062 left out a delete policy ("corrected, not
removed"), so a figure given by mistake -- e.g. to the SBU Manager, which
would count Shruthi's share twice (D57) -- could only be set to 0. The
delete policy uses the same expression as update: the person's direct
manager, Admin or GM. The audit trigger already records deletes.

No data change. Downgrade drops the policy.
"""

from alembic import op

revision = "0063"
down_revision = "0062"
branch_labels = None
depends_on = None

_PERSON_WRITE = (
    "user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid()) "
    "OR cabio_app_role_name() IN ('Admin', 'General Manager')"
)


def upgrade() -> None:
    op.execute(
        f"CREATE POLICY person_quarter_target_delete ON person_quarter_target FOR DELETE USING ({_PERSON_WRITE});"
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS person_quarter_target_delete ON person_quarter_target;")
