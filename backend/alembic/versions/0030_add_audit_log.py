"""add audit log

Revision ID: 0030
Revises: 0029
Create Date: 2026-09-02

Changes (docs/Audit-Trail-Implementation-Plan.md, ADR-017): a shared
`audit_log` table plus a generic trigger function that captures UPDATE/
DELETE on `account`, `user_profile`, `product`, `opportunity`. CREATE
(INSERT) is deliberately not logged -- AuditMixin's own created_by/
created_at already cover who/when for an unedited row, and a field's
original value is recoverable from the oldest UPDATE entry that ever
touched it otherwise; see the plan's resolved question 1.

  - `audit_log_row_change()` is SECURITY DEFINER + SET search_path =
    public -- without this, the trigger's own INSERT into the RLS-
    protected audit_log table would run as cabio_app (not the table
    owner) and fail RLS, rolling back every write to all 4 audited
    tables. This is the one detail the plan flags as highest-risk;
    everything else here is routine.
  - UPDATE path logs changed fields only, computed generically via
    jsonb_each(OLD) JOIN jsonb_each(NEW), excluding `updated_at` (changes
    on every UPDATE by definition) -- not a hand-maintained per-table
    column list, so it needs no update when a column is added later. A
    save where nothing but updated_at changed writes no audit row.
  - DELETE path always captures the full row (old_data = to_jsonb(OLD),
    new_data = NULL) -- the last remaining copy of that record's final
    state, and the only way ADR-017's "auditable independent of
    application logic" goal covers a direct-DB delete (none of these 4
    tables has an app-level DELETE endpoint today).
  - AFTER, not BEFORE: observes the row as finally committed, sidesteps
    any dependency on firing order against each table's existing
    trg_updated_at BEFORE UPDATE trigger.
  - RLS enabled with an explicit Admin/GM-only SELECT policy in this same
    migration (not a follow-up) -- UAT's rls_auto_enable() event trigger
    auto-enables RLS with zero policies on any newly created table the
    moment it exists, which already caused two lockout incidents this
    project has hit before (docs/Backlog.md).
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0030"
down_revision = "0029"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "audit_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("table_name", sa.Text(), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("changed_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("old_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("new_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id", name="audit_log_pkey"),
        sa.ForeignKeyConstraint(["changed_by"], ["user_profile.id"], name="audit_log_changed_by_fkey"),
        sa.CheckConstraint("action IN ('UPDATE', 'DELETE')", name="ck_audit_log_action"),
    )
    op.create_index(
        "idx_audit_log_table_record", "audit_log", ["table_name", "record_id", sa.text("changed_at DESC")]
    )
    op.create_index("idx_audit_log_changed_at", "audit_log", ["changed_at"])

    op.execute(
        """
        CREATE FUNCTION audit_log_row_change() RETURNS trigger
            LANGUAGE plpgsql SECURITY DEFINER
            SET search_path = public
        AS $$
        DECLARE
            diff_old jsonb;
            diff_new jsonb;
        BEGIN
            IF TG_OP = 'DELETE' THEN
                INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
                VALUES (TG_TABLE_NAME, OLD.id, TG_OP, cabio_app_uid(), to_jsonb(OLD), NULL);
                RETURN OLD;

            ELSE
                SELECT jsonb_object_agg(o.key, o.value), jsonb_object_agg(o.key, n.value)
                INTO diff_old, diff_new
                FROM jsonb_each(to_jsonb(OLD)) o
                JOIN jsonb_each(to_jsonb(NEW)) n USING (key)
                WHERE o.value IS DISTINCT FROM n.value
                  AND o.key <> 'updated_at';

                IF diff_old IS NOT NULL THEN
                    INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
                    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, cabio_app_uid(), diff_old, diff_new);
                END IF;
                RETURN NEW;
            END IF;
        END;
        $$;
        """
    )

    op.execute(
        "CREATE TRIGGER trg_audit_account AFTER UPDATE OR DELETE ON account "
        "FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();"
    )
    op.execute(
        "CREATE TRIGGER trg_audit_user_profile AFTER UPDATE OR DELETE ON user_profile "
        "FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();"
    )
    op.execute(
        "CREATE TRIGGER trg_audit_product AFTER UPDATE OR DELETE ON product "
        "FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();"
    )
    op.execute(
        "CREATE TRIGGER trg_audit_opportunity AFTER UPDATE OR DELETE ON opportunity "
        "FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();"
    )

    op.execute("ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY audit_log_admin_gm_read ON audit_log
        FOR SELECT USING (cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager']));
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_audit_account ON account;")
    op.execute("DROP TRIGGER IF EXISTS trg_audit_user_profile ON user_profile;")
    op.execute("DROP TRIGGER IF EXISTS trg_audit_product ON product;")
    op.execute("DROP TRIGGER IF EXISTS trg_audit_opportunity ON opportunity;")
    op.execute("DROP FUNCTION IF EXISTS audit_log_row_change();")
    op.execute("DROP POLICY IF EXISTS audit_log_admin_gm_read ON audit_log;")
    op.execute("ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;")
    op.drop_index("idx_audit_log_changed_at", table_name="audit_log")
    op.drop_index("idx_audit_log_table_record", table_name="audit_log")
    op.drop_table("audit_log")
