"""add activity_comment table

Revision ID: 0040
Revises: 0039
Create Date: 2026-09-09

Changes (Activity Inline Comments, Phase 1 -- see
docs/Activity-Comment-Implementation-Plan.md; notifications deferred to
Phase 2):
  - New `activity_comment` table: a flat, append-only comment thread
    against a single Activity. No `updated_at`/edited flag and no
    UPDATE/DELETE RLS policy -- post-only in v1, same immutability
    posture as `activity` itself (decision 3 of the plan).
  - RLS: enabled, split into two policies rather than one blanket policy
    (unlike `reminder_via_activity`'s single ALL-commands policy) --
    deliberately narrower so edit/delete is blocked at the database
    level too, not just by omitting a PATCH/DELETE endpoint:
      - `activity_comment_select` (FOR SELECT): inherits the parent
        Activity's own visibility via the same compose-through-parent-
        table pattern as `reminder_via_activity`/
        `opportunity_item_via_opportunity` -- Postgres evaluates
        `activity`'s own RLS (including the hierarchy-hide from
        migration 0039) when resolving the subquery, so a comment is
        automatically only as visible as its parent Activity, with no
        new role logic to write or keep in sync.
      - `activity_comment_insert` (FOR INSERT): same parent-visibility
        check, plus `created_by = cabio_app_uid()` so no one can post a
        comment as someone else.
    No UPDATE/DELETE policy at all -- with RLS enabled, the absence of a
    matching policy is a default deny for those commands regardless of
    role.
  - One index on `activity_id` (every read is scoped to one Activity's
    thread).
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0040"
down_revision = "0039"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "activity_comment",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("activity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="activity_comment_pkey"),
        sa.ForeignKeyConstraint(["activity_id"], ["activity.id"], name="activity_comment_activity_id_fkey"),
        sa.ForeignKeyConstraint(["created_by"], ["user_profile.id"], name="activity_comment_created_by_fkey"),
    )
    op.create_index("idx_activity_comment_activity_id", "activity_comment", ["activity_id"])

    op.execute("ALTER TABLE activity_comment ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY activity_comment_select ON activity_comment
        FOR SELECT USING (activity_id IN (SELECT id FROM activity));
        """
    )
    op.execute(
        """
        CREATE POLICY activity_comment_insert ON activity_comment
        FOR INSERT WITH CHECK (
            activity_id IN (SELECT id FROM activity) AND created_by = cabio_app_uid()
        );
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS activity_comment_insert ON activity_comment;")
    op.execute("DROP POLICY IF EXISTS activity_comment_select ON activity_comment;")
    op.execute("ALTER TABLE activity_comment DISABLE ROW LEVEL SECURITY;")
    op.drop_index("idx_activity_comment_activity_id", table_name="activity_comment")
    op.drop_table("activity_comment")
