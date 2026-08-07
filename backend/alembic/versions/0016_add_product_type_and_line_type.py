"""add product_type and opportunity_item line_type

Revision ID: 0016
Revises: 0015
Create Date: 2026-08-07

Changes:
  - product: add product_type column (NOT NULL, default 'NEW_EQUIPMENT') + CHECK
    constraint. Drives the Buyback/Add-Accessory picker filters and BR-CAT-02
    (docs/Product-Lifecycle-TradeIns-Accessories-Technical-Design.md). NOT NULL with
    a default, unlike account.customer_type's nullable precedent (0005) -- this field
    is load-bearing for filtering logic and must never be null; defaulting existing
    rows to NEW_EQUIPMENT matches business reality (nothing in the catalog today is
    refurbished/accessory).
  - opportunity_item: add line_type column (NOT NULL, default 'PRODUCT') + CHECK
    constraint. Widen opportunity_item_unique from (opportunity_id, product_id) to
    (opportunity_id, product_id, line_type) so the same catalog product can appear as
    both a normal sale line and a Buyback credit line on one Opportunity.
"""

import sqlalchemy as sa

from alembic import op

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None

PRODUCT_TYPES = ("NEW_EQUIPMENT", "REFURBISHED", "ACCESSORY")
LINE_TYPES = ("PRODUCT", "BUYBACK")


def upgrade() -> None:
    op.add_column(
        "product",
        sa.Column("product_type", sa.String(20), nullable=False, server_default="NEW_EQUIPMENT"),
    )
    op.create_check_constraint(
        "ck_product_product_type",
        "product",
        "product_type IN ({})".format(", ".join(f"'{v}'" for v in PRODUCT_TYPES)),
    )

    op.add_column(
        "opportunity_item",
        sa.Column("line_type", sa.String(20), nullable=False, server_default="PRODUCT"),
    )
    op.create_check_constraint(
        "ck_opportunity_item_line_type",
        "opportunity_item",
        "line_type IN ({})".format(", ".join(f"'{v}'" for v in LINE_TYPES)),
    )

    op.drop_constraint("opportunity_item_unique", "opportunity_item", type_="unique")
    op.create_unique_constraint(
        "opportunity_item_unique",
        "opportunity_item",
        ["opportunity_id", "product_id", "line_type"],
    )


def downgrade() -> None:
    op.drop_constraint("opportunity_item_unique", "opportunity_item", type_="unique")
    op.create_unique_constraint(
        "opportunity_item_unique",
        "opportunity_item",
        ["opportunity_id", "product_id"],
    )

    op.drop_constraint("ck_opportunity_item_line_type", "opportunity_item", type_="checkconstraint")
    op.drop_column("opportunity_item", "line_type")

    op.drop_constraint("ck_product_product_type", "product", type_="checkconstraint")
    op.drop_column("product", "product_type")
