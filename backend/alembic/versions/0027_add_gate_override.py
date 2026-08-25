"""add manager-attested stage-gate override

Revision ID: 0027
Revises: 0026
Create Date: 2026-08-25

Changes (docs/Manager-Attested-Gate-Override-Implementation-Plan.md, BR-OP-14):
  - gate_override_reason: new master-data table, same shape as hold_reason/
    loss_reason. Seeded with a starting strawman set of reason codes -- confirm
    final wording with Haroon before merging (see plan doc).
  - opportunity.gate_override_approver_id: FK -> user_profile.id. The approving
    manager (owner's own manager holding Area Manager, or any General Manager
    as an escalation path) -- not who set it (see gate_override_set_by below).
  - opportunity.gate_override_reason_id: FK -> gate_override_reason.id.
  - opportunity.gate_override_note: optional free-text, alongside the reason.
  - opportunity.gate_override_set_at / gate_override_set_by: captured
    automatically (who actually clicked the button and when), distinct from
    gate_override_approver_id (who approved it).
  - ck_opportunity_gate_override_reason_required: DB-level backstop mirroring
    ck_opportunity_referral_not_both's role -- schema-level model_validator is
    the primary, clean-422 enforcement; this is the last line of defense.
"""

import sqlalchemy as sa

from alembic import op

revision = "0027"
down_revision = "0026"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "gate_override_reason",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("reason_code", sa.String(50), nullable=False, unique=True),
        sa.Column("reason_name", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
    )
    op.execute(
        """
        INSERT INTO gate_override_reason (reason_code, reason_name) VALUES
            ('DEMO_DECLINED', 'Customer declined demo'),
            ('ENTERED_AFTER_THE_FACT', 'Deal closed outside normal process, entered after the fact'),
            ('OTHER', 'Other — see notes');
        """
    )

    op.add_column(
        "opportunity",
        sa.Column("gate_override_approver_id", sa.UUID(as_uuid=True), sa.ForeignKey("user_profile.id"), nullable=True),
    )
    op.add_column(
        "opportunity",
        sa.Column(
            "gate_override_reason_id", sa.UUID(as_uuid=True), sa.ForeignKey("gate_override_reason.id"), nullable=True
        ),
    )
    op.add_column("opportunity", sa.Column("gate_override_note", sa.Text(), nullable=True))
    op.add_column("opportunity", sa.Column("gate_override_set_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "opportunity",
        sa.Column("gate_override_set_by", sa.UUID(as_uuid=True), sa.ForeignKey("user_profile.id"), nullable=True),
    )
    op.create_check_constraint(
        "ck_opportunity_gate_override_reason_required",
        "opportunity",
        "gate_override_approver_id IS NULL OR gate_override_reason_id IS NOT NULL",
    )


def downgrade() -> None:
    op.drop_constraint("ck_opportunity_gate_override_reason_required", "opportunity", type_="check")
    op.drop_column("opportunity", "gate_override_set_by")
    op.drop_column("opportunity", "gate_override_set_at")
    op.drop_column("opportunity", "gate_override_note")
    op.drop_column("opportunity", "gate_override_reason_id")
    op.drop_column("opportunity", "gate_override_approver_id")
    op.drop_table("gate_override_reason")
