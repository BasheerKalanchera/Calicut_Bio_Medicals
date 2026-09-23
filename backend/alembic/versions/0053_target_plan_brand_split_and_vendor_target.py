"""target_plan_brand_split and brand_vendor_target tables

Revision ID: 0053
Revises: 0052
Create Date: 2026-09-23

Implements docs/Brand-Level-Target-Planning-Implementation-Plan.md (all
decisions resolved 2026-09-19/20, plan reviewed and corrected 2026-09-23).
Depends on the `brand` table from migration 0048 (Signed Feature 4.1, now
Done per Signed-Requirements-to-PRD-Traceability.md as of 2026-09-23).

  - `target_plan_brand_split`: the per-brand breakdown of a person's one
    quarterly number (decision #1 -- mandatory, must sum to the total,
    enforced at the service layer). Child of `target_plan` (ON DELETE
    CASCADE), AuditMixin columns to match its parent. RLS mirrors
    target_plan's own four live policies exactly, substituting
    `target_plan_id IN (SELECT id FROM target_plan WHERE <same predicate>)`
    for the row-ownership check -- there is no real coverage_plan_entry
    precedent to copy (that feature is still Not started per Traceability
    row 6.1), so this is built directly off target_plan itself.
  - `brand_vendor_target`: the number each brand vendor actually promised
    for a quarter (decision #2 -- Admin/GM only). AuditMixin columns; RLS
    open read (everyone should see the bar the team's aiming for),
    Admin/GM-only insert/update.
  - Both tables get RLS enabled with policies in this same migration, not a
    follow-up -- UAT's rls_auto_enable() event trigger auto-enables RLS with
    zero policies the moment a table exists (0030/0048's own docstrings
    flag this same trap, which has caused lockout incidents on this
    project before).
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0053"
down_revision = "0052"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "target_plan_brand_split",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("target_plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("brand_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("split_amount_lakhs", sa.Numeric(15, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="target_plan_brand_split_pkey"),
        sa.ForeignKeyConstraint(
            ["target_plan_id"],
            ["target_plan.id"],
            name="target_plan_brand_split_target_plan_id_fkey",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["brand_id"], ["brand.id"], name="target_plan_brand_split_brand_id_fkey"),
        sa.ForeignKeyConstraint(
            ["created_by"], ["user_profile.id"], name="target_plan_brand_split_created_by_fkey"
        ),
        sa.ForeignKeyConstraint(
            ["updated_by"], ["user_profile.id"], name="target_plan_brand_split_updated_by_fkey"
        ),
        sa.UniqueConstraint("target_plan_id", "brand_id", name="uq_target_plan_brand_split"),
        sa.CheckConstraint("split_amount_lakhs >= 0", name="ck_target_plan_brand_split_nonneg"),
    )
    op.create_index(
        "ix_target_plan_brand_split_target_plan_id", "target_plan_brand_split", ["target_plan_id"]
    )
    op.execute(
        "CREATE TRIGGER trg_updated_at BEFORE UPDATE ON target_plan_brand_split "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at();"
    )

    op.create_table(
        "brand_vendor_target",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("brand_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("planning_period", sa.String(10), nullable=False),
        sa.Column("vendor_target_amount_lakhs", sa.Numeric(15, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="brand_vendor_target_pkey"),
        sa.ForeignKeyConstraint(["brand_id"], ["brand.id"], name="brand_vendor_target_brand_id_fkey"),
        sa.ForeignKeyConstraint(
            ["created_by"], ["user_profile.id"], name="brand_vendor_target_created_by_fkey"
        ),
        sa.ForeignKeyConstraint(
            ["updated_by"], ["user_profile.id"], name="brand_vendor_target_updated_by_fkey"
        ),
        sa.UniqueConstraint("brand_id", "planning_period", name="uq_brand_vendor_target"),
        sa.CheckConstraint(
            "planning_period ~ '^\\d{4}-Q[1-4]$'", name="ck_brand_vendor_target_planning_period"
        ),
    )
    op.execute(
        "CREATE TRIGGER trg_updated_at BEFORE UPDATE ON brand_vendor_target "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at();"
    )

    # --- RLS: target_plan_brand_split (mirrors target_plan's own 4 policies) ---
    op.execute("ALTER TABLE target_plan_brand_split ENABLE ROW LEVEL SECURITY;")

    op.execute(
        """
        CREATE POLICY target_plan_brand_split_read ON target_plan_brand_split FOR SELECT USING (
            target_plan_id IN (
                SELECT id FROM target_plan WHERE
                    cabio_app_role_name() IN ('Admin', 'General Manager')
                    OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
                    OR (
                        cabio_app_role_name() = 'Area Manager'
                        AND sbu_id = cabio_app_sbu_id()
                        AND user_id IN (
                            SELECT up.id FROM user_profile up
                            JOIN user_zone uz ON uz.user_id = up.id
                            WHERE uz.zone_id IN (
                                SELECT descendant_zone_id FROM zone_closure
                                WHERE ancestor_zone_id IN (
                                    SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid()
                                )
                            )
                        )
                        OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
                    )
                    OR user_id = cabio_app_uid()
            )
        );
        """
    )

    op.execute(
        """
        CREATE POLICY target_plan_brand_split_write ON target_plan_brand_split FOR INSERT WITH CHECK (
            target_plan_id IN (SELECT id FROM target_plan WHERE user_id = cabio_app_uid())
        );
        """
    )

    op.execute(
        """
        CREATE POLICY target_plan_brand_split_update ON target_plan_brand_split FOR UPDATE
            USING (
                target_plan_id IN (
                    SELECT id FROM target_plan WHERE
                        user_id = cabio_app_uid()
                        OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
                        OR (cabio_app_role_name() IN ('Admin', 'General Manager') AND user_id != cabio_app_uid())
                )
            )
            WITH CHECK (
                target_plan_id IN (
                    SELECT id FROM target_plan WHERE
                        user_id = cabio_app_uid()
                        OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
                        OR (cabio_app_role_name() IN ('Admin', 'General Manager') AND user_id != cabio_app_uid())
                )
            );
        """
    )

    op.execute(
        """
        CREATE POLICY target_plan_brand_split_delete ON target_plan_brand_split FOR DELETE USING (
            target_plan_id IN (
                SELECT id FROM target_plan WHERE
                    user_id = cabio_app_uid() OR cabio_app_role_name() IN ('Admin', 'General Manager')
            )
        );
        """
    )

    # --- RLS: brand_vendor_target (open read, Admin/GM write) ---
    op.execute("ALTER TABLE brand_vendor_target ENABLE ROW LEVEL SECURITY;")
    op.execute("CREATE POLICY brand_vendor_target_read ON brand_vendor_target FOR SELECT USING (true);")
    op.execute(
        "CREATE POLICY brand_vendor_target_insert ON brand_vendor_target FOR INSERT WITH CHECK "
        "(cabio_app_role_name() IN ('Admin', 'General Manager'));"
    )
    op.execute(
        "CREATE POLICY brand_vendor_target_update ON brand_vendor_target FOR UPDATE "
        "USING (cabio_app_role_name() IN ('Admin', 'General Manager')) "
        "WITH CHECK (cabio_app_role_name() IN ('Admin', 'General Manager'));"
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS brand_vendor_target_update ON brand_vendor_target;")
    op.execute("DROP POLICY IF EXISTS brand_vendor_target_insert ON brand_vendor_target;")
    op.execute("DROP POLICY IF EXISTS brand_vendor_target_read ON brand_vendor_target;")
    op.execute("ALTER TABLE brand_vendor_target DISABLE ROW LEVEL SECURITY;")

    op.execute("DROP POLICY IF EXISTS target_plan_brand_split_delete ON target_plan_brand_split;")
    op.execute("DROP POLICY IF EXISTS target_plan_brand_split_update ON target_plan_brand_split;")
    op.execute("DROP POLICY IF EXISTS target_plan_brand_split_write ON target_plan_brand_split;")
    op.execute("DROP POLICY IF EXISTS target_plan_brand_split_read ON target_plan_brand_split;")
    op.execute("ALTER TABLE target_plan_brand_split DISABLE ROW LEVEL SECURITY;")

    op.drop_table("brand_vendor_target")
    op.drop_table("target_plan_brand_split")
