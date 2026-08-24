"""add notification table

Revision ID: 0024
Revises: 0023
Create Date: 2026-08-24

Changes (Opportunity-Assignment Notifications, see
docs/Opportunity-Assignment-Notifications-Implementation-Plan.md):
  - New `notification` table: a generic, recipient-scoped event log. Starts
    with `type = 'OPPORTUNITY_ASSIGNED'` (fired when an Opportunity's
    owner_id is set to someone other than the actor, on create or update),
    but `type`/`entity_type`/`entity_id` are deliberately generic so
    BR-OP-06 (Stalled-opportunity notifications, never built) can reuse the
    same table later without a schema change.
  - `is_urgent` is frozen at creation time (see
    NotificationService.notify_opportunity_assigned) -- a notification is a
    point-in-time event log entry, consistent with the rest of this table.
  - RLS: enabled, one policy (`recipient_user_id = cabio_app_uid()`) --
    every other user-scoped table in this schema carries RLS (Backend-
    Implementation-Standards.md's "RLS First"); notification rows resolve
    Opportunity/account names at read time, which is exactly the kind of
    cross-SBU-sensitive data RLS exists to protect against a future query
    that forgets its own WHERE recipient_user_id = :user_id filter.
  - Two indexes: a plain one on recipient_user_id (general lookups, mirrors
    idx_reminder_assigned_to_user_id), and a partial one on
    (recipient_user_id) WHERE read_at IS NULL -- the header-bell/urgent-
    dialog poll hits unread-count every ~60s per open session; the partial
    index keeps that query cheap regardless of how large the table grows,
    since it only ever indexes still-unread rows.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0024"
down_revision = "0023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notification",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("recipient_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("is_urgent", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="notification_pkey"),
        sa.ForeignKeyConstraint(
            ["recipient_user_id"], ["user_profile.id"], name="notification_recipient_user_id_fkey"
        ),
        sa.ForeignKeyConstraint(["created_by"], ["user_profile.id"], name="notification_created_by_fkey"),
    )
    op.create_index(
        "idx_notification_recipient_user_id", "notification", ["recipient_user_id"]
    )
    op.create_index(
        "idx_notification_recipient_unread",
        "notification",
        ["recipient_user_id"],
        postgresql_where=sa.text("read_at IS NULL"),
    )

    op.execute("ALTER TABLE notification ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY notification_own_only ON notification
        USING (recipient_user_id = cabio_app_uid());
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS notification_own_only ON notification;")
    op.execute("ALTER TABLE notification DISABLE ROW LEVEL SECURITY;")
    op.drop_index("idx_notification_recipient_unread", table_name="notification")
    op.drop_index("idx_notification_recipient_user_id", table_name="notification")
    op.drop_table("notification")
