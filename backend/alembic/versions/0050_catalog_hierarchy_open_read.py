"""product catalog: open Brand/Category/Model read visibility company-wide

Revision ID: 0050
Revises: 0049
Create Date: 2026-09-22

Changes (found by /code-review medium on commit cd0d8ab, confirmed with
Basheer 2026-09-22): 0048 gave brand/category/model an SBU-scoped SELECT
policy ("read is the same flat-SBU-check shape as product's original 0012
policy"), but BR-CAT-01 already makes the `product` table itself fully
open to read for every role (0014_product_rls_open_read) -- "reps benefit
from seeing the full company product line ... even though they can't
transact against it directly."

Product.brand/model/category are `lazy="joined"` relationships
(product/models.py) and ProductResponse/ProductListResponse require them
non-optional (product/schemas.py). Under 0048's SBU-scoped read policy, a
non-Admin/GM user opening a product from the *other* SBU gets those joined
rows silently filtered to NULL by RLS -- the LEFT JOIN succeeds at the SQL
level, but Pydantic then fails to populate a required nested field. Same
mechanism silently drops cross-SBU rows from Product Performance's brand
grouping (reporting/repository.py) for any role whose team could otherwise
see them -- in practice not reachable there, since BR-OP-11 already
guarantees an Opportunity Item's product always shares its Opportunity's
own SBU, so this fix has no observable effect on that report; it only
fixes catalog *browsing*.

This migration reverses 0048's read-policy choice, not its write policy:
SELECT becomes unrestricted (USING (true)), matching product_read_all
exactly. INSERT/UPDATE stay Admin/GM-only, unchanged.
"""

from alembic import op

revision = "0050"
down_revision = "0049"
branch_labels = None
depends_on = None

_OLD_READ_CHECK = "cabio_app_role_name() IN ('Admin', 'General Manager') OR sbu_id = cabio_app_sbu_id()"

_TABLES = ("brand", "category", "model")


def upgrade() -> None:
    for table in _TABLES:
        op.execute(f"DROP POLICY IF EXISTS {table}_read ON {table};")
        op.execute(f"CREATE POLICY {table}_read ON {table} FOR SELECT USING (true);")


def downgrade() -> None:
    for table in _TABLES:
        op.execute(f"DROP POLICY IF EXISTS {table}_read ON {table};")
        op.execute(f"CREATE POLICY {table}_read ON {table} FOR SELECT USING ({_OLD_READ_CHECK});")
