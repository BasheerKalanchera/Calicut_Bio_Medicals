"""phase 2E: manager_id, role tier rename/expansion, cabio_app role+grants

Revision ID: 0008
Revises: 0007
Create Date: 2026-07-26

Changes (Phase 2E Build Estimate, Task 1 — see docs/Phase-2E-Build-Estimate.md
and docs/Opportunity-Access-Hierarchy-Technical-Design.md):
  - user_profile: add nullable, self-referencing manager_id column
    (Technical Design SS6) — Level 5's "direct reports" RLS rule needs this
    relationship. Nullable means no backfill required here; real staff get
    assigned per-person in Task 2, not this migration. Indexed, since the
    RLS policy looks up "everyone whose manager_id = me" — a new query
    direction on this table with no existing index to cover it.
  - role: rename existing rows to their new tier names (data-only, no FK
    churn -- confirmed role_name is used as a security check in exactly one
    place, the Catalog write-gate, which references neither renamed value)
    and add 2 new rows for the previously-unpopulated tiers (Technical
    Design SS1/SS2, Decisions Log #9):
      Sales Executive -> Sales Staff   (Level 6, id unchanged)
      Sales Manager   -> SBU Manager   (Level 3, id unchanged)
      + Area Manager                    (Level 4, new row)
      + Sales Manager (new meaning)     (Level 5, new row -- distinct id
        from the old "Sales Manager" row, which is now SBU Manager)
  - cabio_app: new least-privilege Postgres role the application will
    connect as once RLS is enabled (Phase-2E-Security-Architecture.md).
    Inert until Task 8's DATABASE_URL cutover -- creating it now does not
    enable RLS or change what the app can see today. Password is read from
    the CABIO_APP_DB_PASSWORD setting (backend/.env, same mechanism as
    DATABASE_URL/SUPABASE_ANON_KEY -- app/core/config.py) at migration-run
    time, never hardcoded, since this file is committed to git. Postgres's
    CREATE ROLE ... PASSWORD clause does not accept a bind parameter (it's
    a plain string literal in the grammar, not an expression), so the value
    is inlined with quotes escaped rather than passed as a query param.
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.core.config import settings

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None

SALES_STAFF_ID = "77777777-7777-7777-7777-700000000001"  # was "Sales Executive"
SBU_MANAGER_ID = "77777777-7777-7777-7777-700000000002"  # was "Sales Manager"
AREA_MANAGER_ID = "77777777-7777-7777-7777-700000000005"  # new
SALES_MANAGER_ID = "77777777-7777-7777-7777-700000000006"  # new, different meaning than the old row at ...002


def upgrade() -> None:
    conn = op.get_bind()

    # --- user_profile.manager_id -------------------------------------
    op.add_column(
        "user_profile",
        sa.Column("manager_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "user_profile_manager_id_fkey",
        "user_profile",
        "user_profile",
        ["manager_id"],
        ["id"],
    )
    op.create_index("idx_user_profile_manager_id", "user_profile", ["manager_id"])

    # --- role: rename existing tiers, add the 2 new ones --------------
    conn.execute(
        sa.text("UPDATE role SET role_name = 'Sales Staff' WHERE id = :id"),
        {"id": SALES_STAFF_ID},
    )
    conn.execute(
        sa.text("UPDATE role SET role_name = 'SBU Manager' WHERE id = :id"),
        {"id": SBU_MANAGER_ID},
    )
    conn.execute(
        sa.text(
            "INSERT INTO role (id, role_name) VALUES (:id, 'Area Manager') "
            "ON CONFLICT (role_name) DO NOTHING"
        ),
        {"id": AREA_MANAGER_ID},
    )
    conn.execute(
        sa.text(
            "INSERT INTO role (id, role_name) VALUES (:id, 'Sales Manager') "
            "ON CONFLICT (role_name) DO NOTHING"
        ),
        {"id": SALES_MANAGER_ID},
    )

    # --- cabio_app role + grants ---------------------------------------
    if settings.CABIO_APP_DB_PASSWORD is None:
        raise RuntimeError(
            "CABIO_APP_DB_PASSWORD must be set in backend/.env before running this "
            "migration -- it becomes the cabio_app Postgres role's login password "
            "(Phase-2E-Security-Architecture.md)."
        )
    password = settings.CABIO_APP_DB_PASSWORD.get_secret_value()
    escaped_password = password.replace("'", "''")
    conn.execute(
        sa.text(f"CREATE ROLE cabio_app WITH LOGIN PASSWORD '{escaped_password}' NOINHERIT")
    )
    conn.execute(sa.text("GRANT USAGE ON SCHEMA public TO cabio_app"))
    conn.execute(sa.text("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cabio_app"))
    conn.execute(sa.text("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cabio_app"))
    conn.execute(
        sa.text(
            "ALTER DEFAULT PRIVILEGES IN SCHEMA public "
            "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cabio_app"
        )
    )


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(
        sa.text(
            "ALTER DEFAULT PRIVILEGES IN SCHEMA public "
            "REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM cabio_app"
        )
    )
    conn.execute(sa.text("REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM cabio_app"))
    conn.execute(sa.text("REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM cabio_app"))
    conn.execute(sa.text("REVOKE USAGE ON SCHEMA public FROM cabio_app"))
    conn.execute(sa.text("DROP ROLE IF EXISTS cabio_app"))

    conn.execute(
        sa.text("DELETE FROM role WHERE id IN (:a, :b)"),
        {"a": AREA_MANAGER_ID, "b": SALES_MANAGER_ID},
    )
    conn.execute(
        sa.text("UPDATE role SET role_name = 'Sales Manager' WHERE id = :id"),
        {"id": SBU_MANAGER_ID},
    )
    conn.execute(
        sa.text("UPDATE role SET role_name = 'Sales Executive' WHERE id = :id"),
        {"id": SALES_STAFF_ID},
    )

    op.drop_index("idx_user_profile_manager_id", table_name="user_profile")
    op.drop_constraint("user_profile_manager_id_fkey", "user_profile", type_="foreignkey")
    op.drop_column("user_profile", "manager_id")
