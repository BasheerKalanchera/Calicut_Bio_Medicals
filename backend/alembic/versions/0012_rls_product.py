"""phase 2E: RLS policy for product (flat SBU check)

Revision ID: 0012
Revises: 0011
Create Date: 2026-07-27

Changes (Phase 2E Build Estimate, Task 6 -- see Phase-2E-Build-Estimate.md SS1c):
  - RLS enabled + one policy on `product`. Unlike opportunity/activity/document/
    reminder, `product` has no owner_id, zone_id, or manager_id -- just a
    non-nullable sbu_id (product/models.py:16, already indexed). Every non-
    Admin/GM tier collapses to the same check, so this is a flat two-branch
    policy, not a per-tier one: Admin/General Manager unrestricted, everyone
    else gated on sbu_id = cabio_app_sbu_id(). Reuses cabio_app_role_name()/
    cabio_app_sbu_id() from 0009/0010 -- no new helper functions needed.
  - Real behavior change this enforces (confirmed in Build Estimate SS1c):
    `GET /products` today takes sbu_id as an optional, client-supplied query
    filter (product/router.py:26, repository.py:38-39) -- nothing stops a
    client from omitting it or passing the other SBU's id. RLS makes this
    enforced and unforgeable instead of advisory. Inert until the `cabio_app`
    cutover (Task 8), same as 0008-0011 -- the app's own DATABASE_URL still
    connects as the table owner (postgres), exempt from RLS by default.
"""

from alembic import op

revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None

PRODUCT_POLICY = """
    CREATE POLICY product_sbu_visibility ON product
    USING (
        cabio_app_role_name() IN ('Admin', 'General Manager')
        OR sbu_id = cabio_app_sbu_id()
    );
"""


def upgrade() -> None:
    op.execute("ALTER TABLE product ENABLE ROW LEVEL SECURITY;")
    op.execute(PRODUCT_POLICY)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS product_sbu_visibility ON product;")
    op.execute("ALTER TABLE product DISABLE ROW LEVEL SECURITY;")
