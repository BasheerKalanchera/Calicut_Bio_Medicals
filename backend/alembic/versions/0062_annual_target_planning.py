"""Annual Target Planning Part 1: brand years, seasonal patterns, person targets

Revision ID: 0062
Revises: 0061
Create Date: 2026-10-21

docs/Annual-Target-Planning-Implementation-Plan.md, Part 1, build step 1
(built together with step 2, D58).

  - `brand.year_start_month`: the month a brand's own year starts in --
    January, April, July or October only, so each brand quarter is exactly
    one Cabio quarter (D40). Existing brands default to January.
  - `brand_annual_target`: the brand's own yearly figure and Cabio's stretch
    on it, for the year starting in `start_year` (D23, D24, D40). The four
    `pct_*` columns are a brand's own seasonal pattern (D25): all set or all
    null (null = follow the SBU's pattern). The app works out the quarters
    and saves them into brand_vendor_target (D46).
  - `sbu_seasonal_pattern`: one seasonal pattern per SBU per calendar year,
    tied to the months (D25, D41).
  - `person_quarter_target`: one quarterly figure per person (Area Manager
    or rep, D30, D32, D33, D45, D57). Read: the person, anyone above them on
    the manager line, Admin, GM. Write: the person's direct manager, Admin,
    GM. No delete policy -- a wrong figure is corrected, not removed.
  - `cabio_app_is_above(p_user_id)`: SECURITY DEFINER walk up
    user_profile.manager_id (user_profile has no RLS, but a definer function
    keeps the policy independent of that). UNION stops on a cycle.
  - `cabio_app_sbu_targets(p_period)`: every active SBU with the total of
    its brands' quarterly figures (D47, D53, D55). Brand figures become
    Admin/GM-only below (D23), so the SBU Manager's own-SBU total (D26) has
    to come through a definer function that returns the total only, and
    only to Admin, GM or that SBU's SBU Manager (everyone else gets NULL).
  - `brand_vendor_target_read` narrowed from everyone to Admin/GM (D23).
  - `sbu_target` removed (D55). Its rows are deleted first so the audit
    trigger records each one in audit_log (a DROP logs nothing); 0060 never
    reached UAT. Checked before writing: no foreign key points into it.

RLS is enabled with policies in this same migration -- UAT's rls_auto_enable()
event trigger turns RLS on with zero policies the moment a table exists (see
0053's docstring).

Downgrade drops the three new tables and their figures, the brand year-start
setting and both functions, restores everyone's read on brand_vendor_target,
and recreates sbu_target empty with 0060's triggers and 0061's policies.
Brand quarterly figures saved by the app stay as they are.
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0062"
down_revision = "0061"
branch_labels = None
depends_on = None

_ADMIN_GM = "cabio_app_role_name() IN ('Admin', 'General Manager')"
_PCT_COLUMNS = ("pct_jan_mar", "pct_apr_jun", "pct_jul_sep", "pct_oct_dec")
_PCT_SUM = " + ".join(_PCT_COLUMNS) + " = 100"


def _audit_columns(table: str) -> list:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["user_profile.id"], name=f"{table}_created_by_fkey"),
        sa.ForeignKeyConstraint(["updated_by"], ["user_profile.id"], name=f"{table}_updated_by_fkey"),
    ]


def _id_column() -> sa.Column:
    return sa.Column(
        "id",
        postgresql.UUID(as_uuid=True),
        server_default=sa.text("gen_random_uuid()"),
        nullable=False,
    )


def _triggers(table: str) -> None:
    op.execute(
        f"CREATE TRIGGER trg_updated_at BEFORE UPDATE ON {table} FOR EACH ROW EXECUTE FUNCTION update_updated_at();"
    )
    op.execute(
        f"CREATE TRIGGER trg_audit_{table} AFTER UPDATE OR DELETE ON {table} "
        "FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();"
    )


def _admin_gm_policies(table: str) -> None:
    op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
    op.execute(f"CREATE POLICY {table}_read ON {table} FOR SELECT USING ({_ADMIN_GM});")
    op.execute(f"CREATE POLICY {table}_insert ON {table} FOR INSERT WITH CHECK ({_ADMIN_GM});")
    op.execute(f"CREATE POLICY {table}_update ON {table} FOR UPDATE USING ({_ADMIN_GM}) WITH CHECK ({_ADMIN_GM});")


def upgrade() -> None:
    # --- Brand year start (D40) ---
    op.add_column(
        "brand",
        sa.Column("year_start_month", sa.SmallInteger(), server_default=sa.text("1"), nullable=False),
    )
    op.create_check_constraint("ck_brand_year_start_month", "brand", "year_start_month IN (1, 4, 7, 10)")

    # --- Brand yearly figure and stretch (D23, D24, D25) ---
    op.create_table(
        "brand_annual_target",
        _id_column(),
        sa.Column("brand_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("start_year", sa.Integer(), nullable=False),
        sa.Column("vendor_amount_lakhs", sa.Numeric(15, 2), nullable=False),
        sa.Column("stretch_pct", sa.Numeric(5, 2), server_default=sa.text("0"), nullable=False),
        *[sa.Column(c, sa.Numeric(5, 2), nullable=True) for c in _PCT_COLUMNS],
        *_audit_columns("brand_annual_target"),
        sa.PrimaryKeyConstraint("id", name="brand_annual_target_pkey"),
        sa.ForeignKeyConstraint(["brand_id"], ["brand.id"], name="brand_annual_target_brand_id_fkey"),
        sa.UniqueConstraint("brand_id", "start_year", name="uq_brand_annual_target"),
        sa.CheckConstraint("vendor_amount_lakhs >= 0", name="ck_brand_annual_target_vendor_nonneg"),
        sa.CheckConstraint("stretch_pct >= 0", name="ck_brand_annual_target_stretch_nonneg"),
        sa.CheckConstraint(
            "(" + " AND ".join(f"{c} IS NULL" for c in _PCT_COLUMNS) + ") OR ("
            + " AND ".join(f"{c} >= 0" for c in _PCT_COLUMNS)
            + f" AND {_PCT_SUM})",
            name="ck_brand_annual_target_pattern",
        ),
    )
    _triggers("brand_annual_target")
    _admin_gm_policies("brand_annual_target")

    # --- SBU seasonal pattern (D25, D41) ---
    op.create_table(
        "sbu_seasonal_pattern",
        _id_column(),
        sa.Column("sbu_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        *[sa.Column(c, sa.Numeric(5, 2), nullable=False) for c in _PCT_COLUMNS],
        *_audit_columns("sbu_seasonal_pattern"),
        sa.PrimaryKeyConstraint("id", name="sbu_seasonal_pattern_pkey"),
        sa.ForeignKeyConstraint(["sbu_id"], ["sbu.id"], name="sbu_seasonal_pattern_sbu_id_fkey"),
        sa.UniqueConstraint("sbu_id", "year", name="uq_sbu_seasonal_pattern"),
        sa.CheckConstraint(
            " AND ".join(f"{c} >= 0" for c in _PCT_COLUMNS) + f" AND {_PCT_SUM}",
            name="ck_sbu_seasonal_pattern_pct",
        ),
    )
    _triggers("sbu_seasonal_pattern")
    _admin_gm_policies("sbu_seasonal_pattern")

    # --- Per-person quarterly target (D30, D33, D45) ---
    op.execute(
        """
        CREATE FUNCTION cabio_app_is_above(p_user_id uuid)
        RETURNS boolean
        LANGUAGE sql STABLE SECURITY DEFINER
        SET search_path TO 'public'
        AS $$
            WITH RECURSIVE chain(id) AS (
                SELECT manager_id FROM user_profile
                WHERE id = p_user_id AND manager_id IS NOT NULL
                UNION
                SELECT up.manager_id FROM user_profile up
                JOIN chain c ON up.id = c.id
                WHERE up.manager_id IS NOT NULL
            )
            SELECT EXISTS (SELECT 1 FROM chain WHERE id = cabio_app_uid())
        $$;
        """
    )
    op.create_table(
        "person_quarter_target",
        _id_column(),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sbu_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("planning_period", sa.String(10), nullable=False),
        sa.Column("target_amount_lakhs", sa.Numeric(15, 2), nullable=False),
        sa.Column("set_by", postgresql.UUID(as_uuid=True), nullable=False),
        *_audit_columns("person_quarter_target"),
        sa.PrimaryKeyConstraint("id", name="person_quarter_target_pkey"),
        sa.ForeignKeyConstraint(["user_id"], ["user_profile.id"], name="person_quarter_target_user_id_fkey"),
        sa.ForeignKeyConstraint(["sbu_id"], ["sbu.id"], name="person_quarter_target_sbu_id_fkey"),
        sa.ForeignKeyConstraint(["set_by"], ["user_profile.id"], name="person_quarter_target_set_by_fkey"),
        sa.UniqueConstraint("user_id", "sbu_id", "planning_period", name="uq_person_quarter_target"),
        sa.CheckConstraint("planning_period ~ '^\\d{4}-Q[1-4]$'", name="ck_person_quarter_target_planning_period"),
        sa.CheckConstraint("target_amount_lakhs >= 0", name="ck_person_quarter_target_nonneg"),
    )
    _triggers("person_quarter_target")
    _person_write = f"user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid()) OR {_ADMIN_GM}"
    op.execute("ALTER TABLE person_quarter_target ENABLE ROW LEVEL SECURITY;")
    op.execute(
        "CREATE POLICY person_quarter_target_read ON person_quarter_target FOR SELECT USING ("
        f"user_id = cabio_app_uid() OR cabio_app_is_above(user_id) OR {_ADMIN_GM});"
    )
    op.execute(
        f"CREATE POLICY person_quarter_target_insert ON person_quarter_target FOR INSERT WITH CHECK ({_person_write});"
    )
    op.execute(
        "CREATE POLICY person_quarter_target_update ON person_quarter_target FOR UPDATE "
        f"USING ({_person_write}) WITH CHECK ({_person_write});"
    )

    # --- Brand figures: Admin/GM only (D23) ---
    op.execute("DROP POLICY IF EXISTS brand_vendor_target_read ON brand_vendor_target;")
    op.execute(f"CREATE POLICY brand_vendor_target_read ON brand_vendor_target FOR SELECT USING ({_ADMIN_GM});")

    # --- SBU target = the brands' quarterly total (D26, D47, D53, D55) ---
    op.execute(
        """
        CREATE FUNCTION cabio_app_sbu_targets(p_period text)
        RETURNS TABLE(sbu_id uuid, target_amount_lakhs numeric)
        LANGUAGE sql STABLE SECURITY DEFINER
        SET search_path TO 'public'
        AS $$
            SELECT s.id,
                   CASE
                       WHEN cabio_app_role_name() IN ('Admin', 'General Manager')
                         OR (cabio_app_role_name() = 'SBU Manager' AND s.id = cabio_app_sbu_id())
                       THEN (
                           SELECT sum(bvt.vendor_target_amount_lakhs)
                           FROM brand_vendor_target bvt
                           JOIN brand b ON b.id = bvt.brand_id
                           WHERE b.sbu_id = s.id AND bvt.planning_period = p_period
                       )
                   END
            FROM sbu s
            WHERE s.is_active IS NOT false
        $$;
        """
    )

    # --- Remove the typed SBU target (D55) ---
    op.execute("DELETE FROM sbu_target;")  # audit trigger logs each row
    op.execute("DROP TRIGGER IF EXISTS trg_audit_sbu_target ON sbu_target;")
    for policy in ("update", "insert", "read"):
        op.execute(f"DROP POLICY IF EXISTS sbu_target_{policy} ON sbu_target;")
    op.drop_table("sbu_target")


def downgrade() -> None:
    # --- Recreate sbu_target empty (0060's shape, 0061's read policy) ---
    op.create_table(
        "sbu_target",
        _id_column(),
        sa.Column("sbu_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("planning_period", sa.String(10), nullable=False),
        sa.Column("target_amount_lakhs", sa.Numeric(15, 2), nullable=False),
        *_audit_columns("sbu_target"),
        sa.PrimaryKeyConstraint("id", name="sbu_target_pkey"),
        sa.ForeignKeyConstraint(["sbu_id"], ["sbu.id"], name="sbu_target_sbu_id_fkey"),
        sa.UniqueConstraint("sbu_id", "planning_period", name="uq_sbu_target"),
        sa.CheckConstraint("planning_period ~ '^\\d{4}-Q[1-4]$'", name="ck_sbu_target_planning_period"),
        sa.CheckConstraint("target_amount_lakhs >= 0", name="ck_sbu_target_nonneg"),
    )
    _triggers("sbu_target")
    op.execute("ALTER TABLE sbu_target ENABLE ROW LEVEL SECURITY;")
    op.execute(
        "CREATE POLICY sbu_target_read ON sbu_target FOR SELECT USING ("
        f"{_ADMIN_GM} "
        "OR (cabio_app_role_name() IN ('SBU Manager', 'Area Manager') AND sbu_id = cabio_app_sbu_id()));"
    )
    op.execute(f"CREATE POLICY sbu_target_insert ON sbu_target FOR INSERT WITH CHECK ({_ADMIN_GM});")
    op.execute(
        f"CREATE POLICY sbu_target_update ON sbu_target FOR UPDATE USING ({_ADMIN_GM}) WITH CHECK ({_ADMIN_GM});"
    )

    op.execute("DROP FUNCTION IF EXISTS cabio_app_sbu_targets(text);")

    op.execute("DROP POLICY IF EXISTS brand_vendor_target_read ON brand_vendor_target;")
    op.execute("CREATE POLICY brand_vendor_target_read ON brand_vendor_target FOR SELECT USING (true);")

    for table in ("person_quarter_target", "sbu_seasonal_pattern", "brand_annual_target"):
        for policy in ("update", "insert", "read"):
            op.execute(f"DROP POLICY IF EXISTS {table}_{policy} ON {table};")
        op.execute(f"DROP TRIGGER IF EXISTS trg_audit_{table} ON {table};")
        op.drop_table(table)
    op.execute("DROP FUNCTION IF EXISTS cabio_app_is_above(uuid);")

    op.drop_constraint("ck_brand_year_start_month", "brand", type_="check")
    op.drop_column("brand", "year_start_month")
