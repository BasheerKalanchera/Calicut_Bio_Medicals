"""sbu_target: Area Manager may read their own SBU's target

Revision ID: 0061
Revises: 0060
Create Date: 2026-10-09

docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md, step 6c (Basheer,
2026-10-09, at E2E D6): an Area Manager sees their own SBU's target,
read-only, against their team's own totals. Only the read policy changes;
insert and update stay Admin/GM.

No data change. Downgrade restores 0060's read policy.
"""

from alembic import op

revision = "0061"
down_revision = "0060"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP POLICY IF EXISTS sbu_target_read ON sbu_target;")
    op.execute(
        "CREATE POLICY sbu_target_read ON sbu_target FOR SELECT USING ("
        "cabio_app_role_name() IN ('Admin', 'General Manager') "
        "OR (cabio_app_role_name() IN ('SBU Manager', 'Area Manager') AND sbu_id = cabio_app_sbu_id()));"
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS sbu_target_read ON sbu_target;")
    op.execute(
        "CREATE POLICY sbu_target_read ON sbu_target FOR SELECT USING ("
        "cabio_app_role_name() IN ('Admin', 'General Manager') "
        "OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id()));"
    )
