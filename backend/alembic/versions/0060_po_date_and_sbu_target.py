"""po_date on opportunity; sbu_target table

Revision ID: 0060
Revises: 0059
Create Date: 2026-10-05

docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md, redesign of 2026-10-05
(Basheer).

  - `opportunity.po_date`: the date the PO was received. Nullable: older
    records have none (the app falls back to the audit-log date), and
    "required at Order -> Delivery" is enforced in the service, like
    po_number. Covered by the existing generic opportunity audit trigger.
  - `sbu_target`: one GM-entered figure per SBU per quarter. AuditMixin
    columns, audit trigger like target_plan, no delete policy (a wrong figure
    is corrected by editing it). RLS in this same migration, not a follow-up
    -- UAT's rls_auto_enable() event trigger auto-enables RLS with zero
    policies the moment a table exists (see 0053): SBU Manager (own SBU) and
    above can read; Admin/GM insert and update.

Downgrade deletes every PO date and SBU target entered since the upgrade --
back UAT up first.
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0060"
down_revision = "0059"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("opportunity", sa.Column("po_date", sa.Date(), nullable=True))

    op.create_table(
        "sbu_target",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("sbu_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("planning_period", sa.String(10), nullable=False),
        sa.Column("target_amount_lakhs", sa.Numeric(15, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="sbu_target_pkey"),
        sa.ForeignKeyConstraint(["sbu_id"], ["sbu.id"], name="sbu_target_sbu_id_fkey"),
        sa.ForeignKeyConstraint(["created_by"], ["user_profile.id"], name="sbu_target_created_by_fkey"),
        sa.ForeignKeyConstraint(["updated_by"], ["user_profile.id"], name="sbu_target_updated_by_fkey"),
        sa.UniqueConstraint("sbu_id", "planning_period", name="uq_sbu_target"),
        sa.CheckConstraint("planning_period ~ '^\\d{4}-Q[1-4]$'", name="ck_sbu_target_planning_period"),
        sa.CheckConstraint("target_amount_lakhs >= 0", name="ck_sbu_target_nonneg"),
    )
    op.execute(
        "CREATE TRIGGER trg_updated_at BEFORE UPDATE ON sbu_target "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at();"
    )
    op.execute(
        "CREATE TRIGGER trg_audit_sbu_target AFTER UPDATE OR DELETE ON sbu_target "
        "FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();"
    )

    op.execute("ALTER TABLE sbu_target ENABLE ROW LEVEL SECURITY;")
    op.execute(
        "CREATE POLICY sbu_target_read ON sbu_target FOR SELECT USING ("
        "cabio_app_role_name() IN ('Admin', 'General Manager') "
        "OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id()));"
    )
    op.execute(
        "CREATE POLICY sbu_target_insert ON sbu_target FOR INSERT WITH CHECK "
        "(cabio_app_role_name() IN ('Admin', 'General Manager'));"
    )
    op.execute(
        "CREATE POLICY sbu_target_update ON sbu_target FOR UPDATE "
        "USING (cabio_app_role_name() IN ('Admin', 'General Manager')) "
        "WITH CHECK (cabio_app_role_name() IN ('Admin', 'General Manager'));"
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS sbu_target_update ON sbu_target;")
    op.execute("DROP POLICY IF EXISTS sbu_target_insert ON sbu_target;")
    op.execute("DROP POLICY IF EXISTS sbu_target_read ON sbu_target;")
    op.execute("ALTER TABLE sbu_target DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP TRIGGER IF EXISTS trg_audit_sbu_target ON sbu_target;")
    op.drop_table("sbu_target")
    op.drop_column("opportunity", "po_date")
