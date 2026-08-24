"""fix notification RLS: separate WITH CHECK from USING

Revision ID: 0025
Revises: 0024
Create Date: 2026-08-24

Bug found in manual testing (Abdul Latheef assigning an Opportunity to
Basheer K -> 500, psycopg2.errors.InsufficientPrivilege on INSERT INTO
notification):

  0024's policy specified only USING (recipient_user_id = cabio_app_uid()),
  no WITH CHECK. Postgres reuses USING as the write-check whenever WITH
  CHECK is omitted -- so an INSERT was only permitted when the actor
  (cabio_app_uid(), whoever's making the request) equals the recipient.
  That's backwards for this feature: every real assignment notification is
  written by the actor *for someone else* (the new owner), so recipient_user_id
  never equals the actor's own id on create. Every assignment hit this.

  Fix: explicit WITH CHECK allowing a row where the writer is honestly
  recorded as either the actor (created_by -- covers create_opportunity/
  update_opportunity's INSERT) or the recipient (covers
  mark_read_for_entity's UPDATE, where the recipient marks their own
  notification read; recipient_user_id is unchanged by that UPDATE, so it
  still satisfies USING's row-visibility check too). USING itself is
  untouched -- reads/updates/deletes stay scoped to "your own notifications
  as recipient", exactly as before.
"""

from alembic import op

revision = "0025"
down_revision = "0024"
branch_labels = None
depends_on = None

USING_EXPR = "recipient_user_id = cabio_app_uid()"
WITH_CHECK_EXPR = "created_by = cabio_app_uid() OR recipient_user_id = cabio_app_uid()"


def upgrade() -> None:
    op.execute(
        f"ALTER POLICY notification_own_only ON notification "
        f"USING ({USING_EXPR}) WITH CHECK ({WITH_CHECK_EXPR});"
    )


def downgrade() -> None:
    op.execute(f"ALTER POLICY notification_own_only ON notification USING ({USING_EXPR});")
