"""product: only one active catalog entry per Model

Revision ID: 0052
Revises: 0051
Create Date: 2026-09-22

Found live during manual E2E testing, 2026-09-22: nothing stopped Admin/GM
from adding a brand-new Product against a Model that already had one --
the screen would happily create a second "EDAN elite V6 Patient Monitor"
row, identical name and all, no warning. Unlike Brand/Category/Model
(uq_brand_sbu_name / uq_category_sbu_name / uq_model_brand_name, migration
0048 -- all full-table unique, even across inactive rows), Product can't
use a plain full-table UNIQUE(model_id): the 5 legacy deactivated products
from the 2026-09-21 data cutover (EDAN i15, EDAN elite V Series, EDAN i20,
ECG Cable, Siemens USG M/c) all deliberately share one internal "Legacy /
Unclassified Product" placeholder Model by design -- a full-table
constraint would make that retirement pattern impossible ever again.

Scoped to active rows only instead: at most one *active* Product per
Model. A deactivated/retired product's Model becomes free again for a
fresh active Product -- matches how the rest of this app treats
deactivation as "available again", not "gone forever".
"""

from alembic import op

revision = "0052"
down_revision = "0051"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "CREATE UNIQUE INDEX uq_product_model_id_active ON product (model_id) WHERE is_active = true;"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_product_model_id_active;")
