"""Zone hierarchy: self-referencing tree + closure table + RLS generalization

Revision ID: 0019
Revises: 0018
Create Date: 2026-08-11

Changes (docs/Zone-Hierarchy-Implementation-Plan.md step 1):

  - `zone` gains `parent_zone_id` (self-referencing, nullable -- existing
    5 zones stay top-level until a later seeding step assigns real parents)
    and `zone_level` (nullable, purely advisory -- STATE/ZONE/DISTRICT/
    TALUK/CLUSTER, not structurally enforced).

  - `zone.name`'s global UNIQUE constraint (`zone_name_key`) relaxed to
    per-parent uniqueness. Two different branches may legitimately share a
    place name once districts/taluks are real (confirmed real Kerala/
    Karnataka geography data already gathered this session has no such
    collision today, but the constraint should reflect the tree's actual
    shape, not accidentally forbid it later). Postgres treats each NULL as
    distinct for UNIQUE purposes, so a composite (parent_zone_id, name)
    constraint alone would NOT catch two *top-level* zones sharing a name
    (both have parent_zone_id IS NULL) -- a separate partial unique index
    covers that one case.

  - New `zone_closure` table (ancestor_zone_id, descendant_zone_id,
    composite PK) -- the "coverage binder" from Discussion-Zone-Hierarchy-
    2026-08.md. Includes a self-row per zone. Seeded here as pure self-rows
    only (every existing zone is its own ancestor/descendant at distance
    zero) -- real hierarchy content is a separate, later seeding step, not
    this migration.

  - `opportunity_tier_visibility`'s Area Manager branch rewritten a SECOND
    time: migration 0018 already took it from scalar `cabio_app_zone_id()`
    equality to flat `user_zone` set-membership; this generalizes that to
    closure-based tree membership. Because zone_closure includes a self-row
    per zone, a zone with no children behaves identically to 0018's flat
    version -- this is a strict superset, not a divergent code path.
    Exact pre-migration text reconfirmed directly against
    docs/Physical-Schema.sql (not assumed) before writing this.

  organization/repository.py's TEAM_SCOPE_BUILDERS["Area Manager"] gets the
  same closure-based generalization, but that's a Python-level change, not
  part of this migration.
"""

import sqlalchemy as sa

from alembic import op

revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None

FLAT_OPPORTUNITY_USING = """
    cabio_app_role_name() = ANY (ARRAY['Admin','General Manager'])
    OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
    OR (
        cabio_app_role_name() = 'Area Manager'
        AND sbu_id = cabio_app_sbu_id()
        AND account_id IN (
            SELECT id FROM account WHERE zone_id IN (
                SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid()
            )
        )
    )
    OR (
        cabio_app_role_name() = 'Sales Manager'
        AND owner_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
    )
    OR owner_id = cabio_app_uid()
    OR cabio_app_has_split(id)
    OR cabio_app_assigned_reminder(id)
"""

CLOSURE_OPPORTUNITY_USING = """
    cabio_app_role_name() = ANY (ARRAY['Admin','General Manager'])
    OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
    OR (
        cabio_app_role_name() = 'Area Manager'
        AND sbu_id = cabio_app_sbu_id()
        AND account_id IN (
            SELECT id FROM account WHERE zone_id IN (
                SELECT descendant_zone_id FROM zone_closure
                WHERE ancestor_zone_id IN (SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid())
            )
        )
    )
    OR (
        cabio_app_role_name() = 'Sales Manager'
        AND owner_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
    )
    OR owner_id = cabio_app_uid()
    OR cabio_app_has_split(id)
    OR cabio_app_assigned_reminder(id)
"""


def upgrade() -> None:
    op.add_column("zone", sa.Column("parent_zone_id", sa.UUID(as_uuid=True), sa.ForeignKey("zone.id"), nullable=True))
    op.add_column("zone", sa.Column("zone_level", sa.String(20), nullable=True))

    op.drop_constraint("zone_name_key", "zone", type_="unique")
    op.create_unique_constraint("uq_zone_parent_name", "zone", ["parent_zone_id", "name"])
    op.create_index(
        "uq_zone_root_name",
        "zone",
        ["name"],
        unique=True,
        postgresql_where=sa.text("parent_zone_id IS NULL"),
    )

    op.create_table(
        "zone_closure",
        sa.Column("ancestor_zone_id", sa.UUID(as_uuid=True), sa.ForeignKey("zone.id"), primary_key=True),
        sa.Column("descendant_zone_id", sa.UUID(as_uuid=True), sa.ForeignKey("zone.id"), primary_key=True),
    )
    op.create_index("idx_zone_closure_descendant", "zone_closure", ["descendant_zone_id"])

    op.execute("INSERT INTO zone_closure (ancestor_zone_id, descendant_zone_id) SELECT id, id FROM zone;")

    op.execute(f"ALTER POLICY opportunity_tier_visibility ON opportunity USING ({CLOSURE_OPPORTUNITY_USING});")


def downgrade() -> None:
    op.execute(f"ALTER POLICY opportunity_tier_visibility ON opportunity USING ({FLAT_OPPORTUNITY_USING});")

    op.drop_index("idx_zone_closure_descendant", table_name="zone_closure")
    op.drop_table("zone_closure")

    op.drop_index("uq_zone_root_name", table_name="zone")
    op.drop_constraint("uq_zone_parent_name", "zone", type_="unique")
    # Only safe if no per-parent duplicate names exist yet -- if this
    # downgrade runs after real tree content/seeding landed, resolve any
    # duplicates first or this will fail loudly (correctly).
    op.create_unique_constraint("zone_name_key", "zone", ["name"])

    op.drop_column("zone", "zone_level")
    op.drop_column("zone", "parent_zone_id")
