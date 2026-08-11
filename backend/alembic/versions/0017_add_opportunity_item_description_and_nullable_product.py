"""add opportunity_item description and make product_id nullable

Revision ID: 0017
Revises: 0016
Create Date: 2026-08-11

Changes:
  - opportunity_item: add description column (nullable Text). A BUYBACK line
    now carries a free-text description of the customer's traded-in machine
    instead of pointing at a catalog Product (BR-CAT-03,
    docs/Discussion-Buyback-Freetext-And-Intake-2026-08.md) -- nobody knows
    the exact make/model/condition of a trade-in machine ahead of the deal,
    so requiring a pre-catalogued Product didn't fit how trade-ins actually
    happen.
  - opportunity_item: make product_id nullable, add a CHECK constraint that
    only relaxes the prior NOT NULL invariant (product_id IS NOT NULL OR
    line_type = 'BUYBACK') rather than tightening it -- does not require
    description IS NOT NULL at the DB level, since that's a new-write-only
    rule enforced in the Pydantic schema, not retroactive on any pre-existing
    rows. PRODUCT/ACCESSORY lines are unaffected, still require product_id.
"""

import sqlalchemy as sa

from alembic import op

revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("opportunity_item", sa.Column("description", sa.Text(), nullable=True))
    op.alter_column("opportunity_item", "product_id", nullable=True)
    op.create_check_constraint(
        "ck_opportunity_item_product_id_or_buyback",
        "opportunity_item",
        "product_id IS NOT NULL OR line_type = 'BUYBACK'",
    )


def downgrade() -> None:
    # Any real free-text Buyback row (product_id NULL) created after this
    # migration lands will violate the restored NOT NULL below -- there is no
    # safe way to backfill product_id for a row that never had a catalog
    # product. Downgrading against a DB with live free-text rows WILL fail
    # (or requires manually deleting/backfilling them first). Flag this to
    # whoever runs the downgrade rather than papering over it.
    op.drop_constraint("ck_opportunity_item_product_id_or_buyback", "opportunity_item", type_="check")
    op.alter_column("opportunity_item", "product_id", nullable=False)
    op.drop_column("opportunity_item", "description")
