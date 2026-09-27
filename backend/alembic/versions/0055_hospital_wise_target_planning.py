"""Hospital-wise target planning: Business Potential, target_plan_account, drafts

Revision ID: 0055
Revises: 0054
Create Date: 2026-09-27

Implements section 8 of docs/Hospital-Wise-Target-Planning-Implementation-Plan.md
(approved 2026-09-27; design in docs/Discussion-Hospital-Wise-Target-Planning-2026-09.md).

  - `account`: Business Potential rating (HIGH / MEDIUM / LOW / NOT_CLASSIFIED,
    default NOT_CLASSIFIED) plus Admin/GM-only notes and set-by/set-at stamps.
    `account` has no RLS; note visibility is enforced in the response schema.
  - `target_plan`: `change_note` (why a plan was revised) and a `DRAFT` status
    (plan choice 1 = fuller). Drafts never reach the approver.
  - `target_plan_account`: one row per hospital on a plan -- visit frequency
    (fixed list of five, plan choice 2 = lighter), planned amount (>= 0; a
    hospital may be on the plan for visits only), optional objective. RLS is
    copied from target_plan_brand_split as fixed in 0054 (not 0053's original
    read policy, which leaked across SBUs), same four policies.
  - `cabio_app_plan_overlap()`: SECURITY DEFINER lookup for the same-SBU
    overlap warning. target_plan RLS hides colleagues' plans from Sales Staff,
    so the warning can't be computed under the caller's own RLS. Returns only
    (account_id, display_name) for OTHER users' non-draft plans in the same
    SBU and period, and only for the caller's own session SBU unless Admin/GM.
  - Drops `coverage_plan_entry` and `coverage_plan`: never used by any screen
    or API. Checked on Dev 2026-09-27 before writing this: both empty, and the
    only FK into either is coverage_plan_entry -> coverage_plan (pg_constraint).
    Downgrade recreates them empty.

RLS is enabled with policies in this same migration -- UAT's rls_auto_enable()
event trigger turns RLS on with zero policies the moment a table exists (see
0053's docstring).
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0055"
down_revision = "0054"
branch_labels = None
depends_on = None

# Same predicate as target_plan_brand_split_read after 0054's fix.
_PLAN_READ_PREDICATE = """
    target_plan_id IN (
        SELECT id FROM target_plan WHERE
            cabio_app_role_name() IN ('Admin', 'General Manager')
            OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
            OR (
                sbu_id = cabio_app_sbu_id()
                AND (
                    user_id IN (
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
            )
            OR user_id = cabio_app_uid()
    )
"""

_PLAN_UPDATE_PREDICATE = """
    target_plan_id IN (
        SELECT id FROM target_plan WHERE
            user_id = cabio_app_uid()
            OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
            OR (cabio_app_role_name() IN ('Admin', 'General Manager') AND user_id != cabio_app_uid())
    )
"""


def upgrade() -> None:
    # --- account: Business Potential ---
    op.add_column(
        "account",
        sa.Column("business_potential", sa.String(20), nullable=False, server_default="NOT_CLASSIFIED"),
    )
    op.add_column("account", sa.Column("business_potential_notes", sa.Text(), nullable=True))
    op.add_column("account", sa.Column("business_potential_set_by", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column(
        "account", sa.Column("business_potential_set_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.create_check_constraint(
        "ck_account_business_potential",
        "account",
        "business_potential IN ('HIGH', 'MEDIUM', 'LOW', 'NOT_CLASSIFIED')",
    )
    op.create_foreign_key(
        "account_business_potential_set_by_fkey",
        "account",
        "user_profile",
        ["business_potential_set_by"],
        ["id"],
    )

    # --- target_plan: change note + DRAFT status ---
    op.add_column("target_plan", sa.Column("change_note", sa.Text(), nullable=True))
    op.drop_constraint("ck_target_plan_status", "target_plan", type_="check")
    op.create_check_constraint(
        "ck_target_plan_status",
        "target_plan",
        "status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')",
    )

    # --- target_plan_account ---
    op.create_table(
        "target_plan_account",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("target_plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("planned_amount_lakhs", sa.Numeric(15, 2), nullable=False),
        sa.Column("visit_frequency", sa.String(20), nullable=False),
        sa.Column("strategic_objective", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="target_plan_account_pkey"),
        sa.ForeignKeyConstraint(
            ["target_plan_id"],
            ["target_plan.id"],
            name="target_plan_account_target_plan_id_fkey",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["account_id"], ["account.id"], name="target_plan_account_account_id_fkey"),
        sa.ForeignKeyConstraint(["created_by"], ["user_profile.id"], name="target_plan_account_created_by_fkey"),
        sa.ForeignKeyConstraint(["updated_by"], ["user_profile.id"], name="target_plan_account_updated_by_fkey"),
        sa.UniqueConstraint("target_plan_id", "account_id", name="uq_target_plan_account"),
        sa.CheckConstraint("planned_amount_lakhs >= 0", name="ck_target_plan_account_nonneg"),
        sa.CheckConstraint(
            "visit_frequency IN ('WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY', 'AS_NEEDED')",
            name="ck_target_plan_account_visit_frequency",
        ),
    )
    op.create_index("ix_target_plan_account_target_plan_id", "target_plan_account", ["target_plan_id"])
    op.create_index("ix_target_plan_account_account_id", "target_plan_account", ["account_id"])
    op.execute(
        "CREATE TRIGGER trg_updated_at BEFORE UPDATE ON target_plan_account "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at();"
    )

    # --- RLS: target_plan_account (mirrors target_plan_brand_split after 0054) ---
    op.execute("ALTER TABLE target_plan_account ENABLE ROW LEVEL SECURITY;")
    op.execute(
        f"CREATE POLICY target_plan_account_read ON target_plan_account "
        f"FOR SELECT USING ({_PLAN_READ_PREDICATE});"
    )
    op.execute(
        """
        CREATE POLICY target_plan_account_write ON target_plan_account FOR INSERT WITH CHECK (
            target_plan_id IN (SELECT id FROM target_plan WHERE user_id = cabio_app_uid())
        );
        """
    )
    op.execute(
        f"CREATE POLICY target_plan_account_update ON target_plan_account FOR UPDATE "
        f"USING ({_PLAN_UPDATE_PREDICATE}) WITH CHECK ({_PLAN_UPDATE_PREDICATE});"
    )
    op.execute(
        """
        CREATE POLICY target_plan_account_delete ON target_plan_account FOR DELETE USING (
            target_plan_id IN (
                SELECT id FROM target_plan WHERE
                    user_id = cabio_app_uid() OR cabio_app_role_name() IN ('Admin', 'General Manager')
            )
        );
        """
    )

    # --- Overlap lookup (same-SBU warning) ---
    op.execute(
        """
        CREATE FUNCTION cabio_app_plan_overlap(p_account_ids uuid[], p_sbu_id uuid, p_period text)
        RETURNS TABLE(account_id uuid, display_name text)
        LANGUAGE sql STABLE SECURITY DEFINER
        SET search_path TO 'public'
        AS $$
            SELECT tpa.account_id, up.display_name::text
            FROM target_plan_account tpa
            JOIN target_plan tp ON tp.id = tpa.target_plan_id
            JOIN user_profile up ON up.id = tp.user_id
            WHERE tpa.account_id = ANY (p_account_ids)
              AND tp.sbu_id = p_sbu_id
              AND tp.planning_period = p_period
              AND tp.status <> 'DRAFT'
              AND tp.user_id <> cabio_app_uid()
              AND (
                  p_sbu_id = cabio_app_sbu_id()
                  OR cabio_app_role_name() IN ('Admin', 'General Manager')
              )
            ORDER BY up.display_name
        $$;
        """
    )

    # --- Drop the never-used coverage-plan tables ---
    op.drop_table("coverage_plan_entry")
    op.drop_table("coverage_plan")


def downgrade() -> None:
    conn = op.get_bind()
    drafts = conn.execute(sa.text("SELECT count(*) FROM target_plan WHERE status = 'DRAFT'")).scalar()
    if drafts:
        raise RuntimeError(
            f"{drafts} DRAFT target_plan row(s) exist; the pre-0055 status check can't hold them. "
            "Submit or delete them before downgrading."
        )

    op.execute(
        """
        CREATE TABLE coverage_plan (
            id uuid DEFAULT gen_random_uuid() NOT NULL,
            user_id uuid NOT NULL,
            target_plan_id uuid NOT NULL,
            planning_period character varying(10) NOT NULL,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            created_by uuid,
            updated_by uuid,
            CONSTRAINT coverage_plan_pkey PRIMARY KEY (id),
            CONSTRAINT coverage_plan_unique UNIQUE (user_id, planning_period),
            CONSTRAINT coverage_plan_planning_period_check CHECK (planning_period ~ '^\\d{4}-Q[1-4]$'),
            CONSTRAINT coverage_plan_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profile(id),
            CONSTRAINT coverage_plan_target_plan_id_fkey FOREIGN KEY (target_plan_id) REFERENCES target_plan(id),
            CONSTRAINT coverage_plan_created_by_fkey FOREIGN KEY (created_by) REFERENCES user_profile(id),
            CONSTRAINT coverage_plan_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES user_profile(id)
        );
        CREATE TABLE coverage_plan_entry (
            id uuid DEFAULT gen_random_uuid() NOT NULL,
            coverage_plan_id uuid NOT NULL,
            account_id uuid NOT NULL,
            strategic_objective text NOT NULL,
            target_revenue_lakhs numeric(15,2) NOT NULL,
            coverage_frequency character varying(50),
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            created_by uuid,
            updated_by uuid,
            CONSTRAINT coverage_plan_entry_pkey PRIMARY KEY (id),
            CONSTRAINT coverage_plan_entry_unique UNIQUE (coverage_plan_id, account_id),
            CONSTRAINT coverage_plan_entry_coverage_plan_id_fkey
                FOREIGN KEY (coverage_plan_id) REFERENCES coverage_plan(id),
            CONSTRAINT coverage_plan_entry_account_id_fkey FOREIGN KEY (account_id) REFERENCES account(id),
            CONSTRAINT coverage_plan_entry_created_by_fkey FOREIGN KEY (created_by) REFERENCES user_profile(id),
            CONSTRAINT coverage_plan_entry_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES user_profile(id)
        );
        CREATE TRIGGER trg_updated_at BEFORE UPDATE ON coverage_plan
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        CREATE TRIGGER trg_updated_at BEFORE UPDATE ON coverage_plan_entry
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        """
    )

    op.execute("DROP FUNCTION IF EXISTS cabio_app_plan_overlap(uuid[], uuid, text);")

    for policy in ("delete", "update", "write", "read"):
        op.execute(f"DROP POLICY IF EXISTS target_plan_account_{policy} ON target_plan_account;")
    op.drop_table("target_plan_account")

    op.drop_constraint("ck_target_plan_status", "target_plan", type_="check")
    op.create_check_constraint(
        "ck_target_plan_status",
        "target_plan",
        "status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')",
    )
    op.drop_column("target_plan", "change_note")

    op.drop_constraint("account_business_potential_set_by_fkey", "account", type_="foreignkey")
    op.drop_constraint("ck_account_business_potential", "account", type_="check")
    op.drop_column("account", "business_potential_set_at")
    op.drop_column("account", "business_potential_set_by")
    op.drop_column("account", "business_potential_notes")
    op.drop_column("account", "business_potential")
