"""add lead

Revision ID: 0031
Revises: 0030
Create Date: 2026-09-02

Changes (docs/Lead-Management-Implementation-Plan.md): new `lead` table for
Marketing-User-entered conference/IndiaMART leads, reviewed (Convert/
Discard) by the assigned rep before anything becomes a real Opportunity.
New "Marketing User" role seeded here too (create-and-assign only, zero
pipeline visibility). The "CONFERENCE" `lead_source` value already exists
(0028_add_sales_development_activities.py) -- nothing to seed there.

NOTE (build-order risk, not a design change): this migration chains onto
0030 (Audit Trail), which was still uncommitted/in-progress in a parallel
session as this was written. If 0030's final shape changes before this is
applied, `down_revision` below may need renumbering -- confirm 0030 is
stable before running this.

RLS design deviates from the plan doc's original two-policy sketch (open
question raised and fixed here, plan doc updated to match): the plan wrote
one un-scoped `lead_visibility` policy (no FOR clause = applies to ALL
commands) plus a separate `lead_insert FOR INSERT` policy expecting the
latter to gate INSERT to Marketing User/Admin/GM. Under Postgres RLS,
multiple permissive policies for the same command are OR'd together --
since `lead_visibility` has no explicit WITH CHECK, Postgres reuses its
USING clause as an implicit WITH CHECK for INSERT too, and that clause is
satisfied by `created_by = cabio_app_uid()`, which is true for literally
every INSERT the app performs (the service always sets created_by to the
acting user). OR'd with `lead_insert`'s role check, this would make the
role gate meaningless -- any authenticated role could insert a lead.
Fixed by scoping the visibility policy to `FOR SELECT` explicitly, and
adding a dedicated `FOR UPDATE` policy for the Convert/Discard review
action (assigned rep, or Admin/GM) -- so each command has exactly the
policies intended, no accidental OR-widening. No DELETE policy: the app
never deletes a lead row (Discard is a status, not a delete), so default-
deny is correct there.
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0031"
down_revision = "0030"
branch_labels = None
depends_on = None

# Fixed UUID literal, same convention as prior role seeds (0008, 0021) --
# addressable in a future migration/rollback without a lookup.
_MARKETING_USER_ROLE_ID = "7a2f9e10-6b3d-4c1a-9e5f-1d8c7b4a2f60"


def upgrade() -> None:
    op.execute(
        f"INSERT INTO role (id, role_name, description) VALUES "
        f"('{_MARKETING_USER_ROLE_ID}', 'Marketing User', "
        f"'Enters conference/IndiaMART leads and assigns them to a rep -- no pipeline visibility.');"
    )

    op.create_table(
        "lead",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sbu_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lead_source_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_name", sa.String(length=255), nullable=True),
        sa.Column("raw_interest_note", sa.Text(), nullable=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("assigned_to_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="NEW", nullable=False),
        sa.Column("discard_reason", sa.String(length=20), nullable=True),
        sa.Column("discard_note", sa.Text(), nullable=True),
        sa.Column("converted_opportunity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="lead_pkey"),
        sa.ForeignKeyConstraint(["account_id"], ["account.id"], name="lead_account_id_fkey"),
        sa.ForeignKeyConstraint(["sbu_id"], ["sbu.id"], name="lead_sbu_id_fkey"),
        sa.ForeignKeyConstraint(["lead_source_id"], ["lead_source.id"], name="lead_lead_source_id_fkey"),
        sa.ForeignKeyConstraint(["product_id"], ["product.id"], name="lead_product_id_fkey"),
        sa.ForeignKeyConstraint(["assigned_to_user_id"], ["user_profile.id"], name="lead_assigned_to_user_id_fkey"),
        sa.ForeignKeyConstraint(
            ["converted_opportunity_id"], ["opportunity.id"], name="lead_converted_opportunity_id_fkey"
        ),
        sa.ForeignKeyConstraint(["created_by"], ["user_profile.id"], name="lead_created_by_fkey"),
        sa.ForeignKeyConstraint(["reviewed_by"], ["user_profile.id"], name="lead_reviewed_by_fkey"),
        sa.CheckConstraint("status IN ('NEW', 'CONVERTED', 'DISCARDED')", name="ck_lead_status"),
        sa.CheckConstraint(
            "discard_reason IS NULL OR discard_reason IN "
            "('DUPLICATE', 'NOT_INTERESTED', 'UNABLE_TO_CONTACT', 'JUNK')",
            name="ck_lead_discard_reason",
        ),
    )
    op.create_index("idx_lead_assigned_to_user_id", "lead", ["assigned_to_user_id"])
    op.create_index(
        "idx_lead_assigned_pending",
        "lead",
        ["assigned_to_user_id"],
        postgresql_where=sa.text("status = 'NEW'"),
    )

    op.execute("ALTER TABLE lead ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY lead_select ON lead FOR SELECT USING (
            cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
            OR (cabio_app_role_name() = ANY (ARRAY['SBU Manager', 'Area Manager']) AND sbu_id = cabio_app_sbu_id())
            OR assigned_to_user_id = cabio_app_uid()
            OR created_by = cabio_app_uid()
        );
        """
    )
    op.execute(
        """
        CREATE POLICY lead_insert ON lead FOR INSERT WITH CHECK (
            cabio_app_role_name() = ANY (ARRAY['Marketing User', 'Admin', 'General Manager'])
        );
        """
    )
    op.execute(
        """
        CREATE POLICY lead_update ON lead FOR UPDATE USING (
            cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
            OR assigned_to_user_id = cabio_app_uid()
        ) WITH CHECK (
            cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
            OR assigned_to_user_id = cabio_app_uid()
        );
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS lead_update ON lead;")
    op.execute("DROP POLICY IF EXISTS lead_insert ON lead;")
    op.execute("DROP POLICY IF EXISTS lead_select ON lead;")
    op.execute("ALTER TABLE lead DISABLE ROW LEVEL SECURITY;")
    op.drop_index("idx_lead_assigned_pending", table_name="lead")
    op.drop_index("idx_lead_assigned_to_user_id", table_name="lead")
    op.drop_table("lead")
    op.execute(f"DELETE FROM role WHERE id = '{_MARKETING_USER_ROLE_ID}';")
