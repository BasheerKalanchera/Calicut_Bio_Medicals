"""add opportunity referral credit fields

Revision ID: 0023
Revises: 0022
Create Date: 2026-08-18

Changes (docs/Referral-Credit-And-Relationship-Support-Implementation-Plan.md,
Part 1 -- Referral Credit only; Part 2, Relationship-Support Activity, is a
separate later migration):
  - opportunity.referred_by_user_id: new nullable FK -> user_profile.id.
    Credits a Cabio colleague (any SBU/zone) with the referral, when
    lead_source resolves to "Referral". Pure credit record -- no split-
    percentage impact, no RLS visibility grant (BR-FIN-07).
  - opportunity.referred_by_note: new nullable free-text column, for a
    referral from a non-Cabio person (a customer contact).
  - ck_opportunity_referral_not_both: DB-level backstop ensuring only one of
    the two is ever set -- schema-level model_validator is the primary,
    clean-422 enforcement; this is the last line of defense.
"""

import sqlalchemy as sa

from alembic import op

revision = "0023"
down_revision = "0022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "opportunity",
        sa.Column("referred_by_user_id", sa.UUID(as_uuid=True), sa.ForeignKey("user_profile.id"), nullable=True),
    )
    op.add_column("opportunity", sa.Column("referred_by_note", sa.Text(), nullable=True))
    op.create_check_constraint(
        "ck_opportunity_referral_not_both",
        "opportunity",
        "NOT (referred_by_user_id IS NOT NULL AND referred_by_note IS NOT NULL)",
    )


def downgrade() -> None:
    op.drop_constraint("ck_opportunity_referral_not_both", "opportunity", type_="check")
    op.drop_column("opportunity", "referred_by_note")
    op.drop_column("opportunity", "referred_by_user_id")
