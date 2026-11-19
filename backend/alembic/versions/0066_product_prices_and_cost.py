"""product: full price, three lowest prices and cost (INR Lakhs)

Revision ID: 0066
Revises: 0065
Create Date: 2026-11-18

docs/Product-Pricing-And-Cost-Implementation-Plan.md, step 1 (D1, D2, D8;
Basheer, 2026-11-16 and 2026-11-18). Each product gets room for its full
(quoting) price, the lowest price a rep, an Area Manager and Haroon may
quote, and what the product costs Cabio.

All five are NUMERIC(15,2) INR Lakhs and nullable: every existing product
starts with no prices until Haroon's sheet is loaded (step 4) or a GM/Admin
types them in. A price can't be negative.

No policy change: RLS on `product` is row-level only (`product_read_all`
stays open, the existing Admin/GM write policies cover the new columns).
Who may SEE each figure is decided in the server's response schemas
(BR-CAT-04), never in the database. Older code on main ignores the columns.
Downgrade drops the constraint and the columns.
"""

import sqlalchemy as sa
from alembic import op

revision = "0066"
down_revision = "0065"
branch_labels = None
depends_on = None

_PRICE_COLUMNS = (
    "full_price_lakhs",
    "rep_floor_lakhs",
    "area_manager_floor_lakhs",
    "ceo_floor_lakhs",
    "cost_lakhs",
)


def upgrade() -> None:
    for column in _PRICE_COLUMNS:
        op.add_column("product", sa.Column(column, sa.Numeric(15, 2), nullable=True))
    op.create_check_constraint(
        "ck_product_prices_non_negative",
        "product",
        " AND ".join(f"({c} IS NULL OR {c} >= 0)" for c in _PRICE_COLUMNS),
    )


def downgrade() -> None:
    op.drop_constraint("ck_product_prices_non_negative", "product", type_="check")
    for column in reversed(_PRICE_COLUMNS):
        op.drop_column("product", column)
