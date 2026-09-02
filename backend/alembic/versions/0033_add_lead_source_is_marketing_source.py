"""add lead_source.is_marketing_source

Revision ID: 0033
Revises: 0032
Create Date: 2026-09-02

Changes (docs/Lead-Management-Implementation-Plan.md): the Marketing Lead
creation form was showing all 12 `lead_source` values, most of which only
make sense for a rep creating an Opportunity directly (REFERRAL, TENDER,
COLD_CALL, ...) -- not for a Marketing User logging a conference/IndiaMART
inquiry. Raised by Basheer during Group B manual E2E testing, 2026-09-02.

Data-driven flag, not a hardcoded name match in code (which would break
silently on a rename and isn't enforceable server-side) -- new
`is_marketing_source` boolean, seeded true for CONFERENCE and INDIAMART
only. Both the frontend picker (MarketingLeadCreateModal.tsx) and the
backend (MarketingLeadService.create_lead) read this same flag, so a
future marketing-relevant source (or a rename) is a data change, not a
code change.
"""

import sqlalchemy as sa

from alembic import op

revision = "0033"
down_revision = "0032"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "lead_source",
        sa.Column("is_marketing_source", sa.Boolean(), server_default="false", nullable=False),
    )
    op.execute(
        "UPDATE lead_source SET is_marketing_source = true WHERE name IN ('CONFERENCE', 'INDIAMART');"
    )


def downgrade() -> None:
    op.drop_column("lead_source", "is_marketing_source")
