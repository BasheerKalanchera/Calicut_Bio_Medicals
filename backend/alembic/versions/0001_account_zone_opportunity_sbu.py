"""account zone_id + opportunity sbu_id

Revision ID: 0001
Revises:
Create Date: 2026-06-26

Changes:
  - account: drop managing_sbu_id FK/column; add zone_id NOT NULL FK to zone
  - opportunity: add sbu_id NOT NULL FK to sbu
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. account: drop managing_sbu_id
    # ------------------------------------------------------------------
    op.drop_constraint("account_managing_sbu_id_fkey", "account", type_="foreignkey")
    op.drop_column("account", "managing_sbu_id")

    # ------------------------------------------------------------------
    # 2. account: add zone_id (nullable first so existing rows are valid,
    #    then backfill, then enforce NOT NULL)
    # ------------------------------------------------------------------
    op.add_column(
        "account",
        sa.Column("zone_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    # Backfill: assign every existing account to the first active zone.
    # In a production migration with real data, replace this with a
    # targeted UPDATE that maps accounts to the correct zone.
    op.execute(
        """
        UPDATE account
        SET zone_id = (SELECT id FROM zone WHERE is_active = true ORDER BY name LIMIT 1)
        WHERE zone_id IS NULL
        """
    )

    op.alter_column("account", "zone_id", nullable=False)
    op.create_foreign_key(
        "account_zone_id_fkey",
        "account",
        "zone",
        ["zone_id"],
        ["id"],
    )
    op.create_index("idx_account_zone_id", "account", ["zone_id"])

    # ------------------------------------------------------------------
    # 3. opportunity: add sbu_id (nullable first, backfill, then NOT NULL)
    # ------------------------------------------------------------------
    op.add_column(
        "opportunity",
        sa.Column("sbu_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    # Backfill: derive sbu_id from the opportunity owner's current SBU.
    # This is semantically correct for existing rows since we cannot know
    # the original SBU at the time of creation.
    op.execute(
        """
        UPDATE opportunity o
        SET sbu_id = u.sbu_id
        FROM user_profile u
        WHERE o.owner_id = u.id
        """
    )

    op.alter_column("opportunity", "sbu_id", nullable=False)
    op.create_foreign_key(
        "opportunity_sbu_id_fkey",
        "opportunity",
        "sbu",
        ["sbu_id"],
        ["id"],
    )
    op.create_index("idx_opportunity_sbu_id", "opportunity", ["sbu_id"])


def downgrade() -> None:
    # opportunity: drop sbu_id
    op.drop_index("idx_opportunity_sbu_id", table_name="opportunity")
    op.drop_constraint("opportunity_sbu_id_fkey", "opportunity", type_="foreignkey")
    op.drop_column("opportunity", "sbu_id")

    # account: drop zone_id
    op.drop_index("idx_account_zone_id", table_name="account")
    op.drop_constraint("account_zone_id_fkey", "account", type_="foreignkey")
    op.drop_column("account", "zone_id")

    # account: restore managing_sbu_id
    op.add_column(
        "account",
        sa.Column("managing_sbu_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "account_managing_sbu_id_fkey",
        "account",
        "sbu",
        ["managing_sbu_id"],
        ["id"],
    )
