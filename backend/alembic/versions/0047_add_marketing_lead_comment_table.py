"""add marketing_lead_comment table

Revision ID: 0047
Revises: 0046
Create Date: 2026-09-18

Changes (Lead Follow-up Comments -- see
docs/Lead-Followup-Comments-Implementation-Plan.md):
  - New `marketing_lead_comment` table: a flat, append-only comment thread
    against a single marketing_lead. No `updated_at`/edited flag and no
    UPDATE/DELETE RLS policy -- post-only in v1, same immutability posture
    as `activity_comment` (migration 0040).
  - RLS: enabled, split into select/insert policies, same shape as
    `activity_comment`'s own:
      - `marketing_lead_comment_select` (FOR SELECT): inherits the parent
        marketing_lead's own visibility via the same compose-through-
        parent-table pattern as `activity_comment_select` -- Postgres
        evaluates `marketing_lead`'s own RLS (the `marketing_lead_select`
        policy from migration 0037) when resolving the subquery, so a
        comment is automatically only as visible as its parent lead, with
        no new role logic to write or keep in sync.
      - `marketing_lead_comment_insert` (FOR INSERT): same parent-visibility
        check, plus `created_by = cabio_app_uid()` so no one can post a
        comment as someone else.
    No UPDATE/DELETE policy at all -- with RLS enabled, the absence of a
    matching policy is a default deny for those commands regardless of
    role.
  - One index on `marketing_lead_id` (every read is scoped to one lead's
    thread).
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0047"
down_revision = "0046"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "marketing_lead_comment",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("marketing_lead_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="marketing_lead_comment_pkey"),
        sa.ForeignKeyConstraint(
            ["marketing_lead_id"], ["marketing_lead.id"], name="marketing_lead_comment_marketing_lead_id_fkey"
        ),
        sa.ForeignKeyConstraint(["created_by"], ["user_profile.id"], name="marketing_lead_comment_created_by_fkey"),
    )
    op.create_index("idx_marketing_lead_comment_marketing_lead_id", "marketing_lead_comment", ["marketing_lead_id"])

    op.execute("ALTER TABLE marketing_lead_comment ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY marketing_lead_comment_select ON marketing_lead_comment
        FOR SELECT USING (marketing_lead_id IN (SELECT id FROM marketing_lead));
        """
    )
    op.execute(
        """
        CREATE POLICY marketing_lead_comment_insert ON marketing_lead_comment
        FOR INSERT WITH CHECK (
            marketing_lead_id IN (SELECT id FROM marketing_lead) AND created_by = cabio_app_uid()
        );
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS marketing_lead_comment_insert ON marketing_lead_comment;")
    op.execute("DROP POLICY IF EXISTS marketing_lead_comment_select ON marketing_lead_comment;")
    op.execute("ALTER TABLE marketing_lead_comment DISABLE ROW LEVEL SECURITY;")
    op.drop_index("idx_marketing_lead_comment_marketing_lead_id", table_name="marketing_lead_comment")
    op.drop_table("marketing_lead_comment")
