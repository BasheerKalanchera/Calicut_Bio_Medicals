"""fix notification RLS: widen USING so INSERT ... RETURNING doesn't 403 the actor

Revision ID: 0026
Revises: 0025
Create Date: 2026-08-24

0025 fixed the write side (WITH CHECK) but manual testing still failed
with the identical error (Abdul Latheef P assigning to Basheer K).
Reproduced directly against the dev DB: the plain INSERT (no RETURNING)
succeeds under 0025's WITH CHECK, but SQLAlchemy's ORM always issues
`INSERT ... RETURNING <server-generated columns>` when session.add()-ing a
row with a server_default (here, created_at) -- that's not something the
call site controls. Postgres filters RETURNING output through the table's
SELECT-applicable policy, i.e. USING, not WITH CHECK. 0025 only widened
WITH CHECK; USING was still `recipient_user_id = cabio_app_uid()` alone,
so the actor (not the recipient) can't see the row RETURNING hands back,
and Postgres raises the same "new row violates row-level security policy"
error -- despite the INSERT itself having already succeeded under the
now-correct WITH CHECK.

Fix: widen USING the same way WITH CHECK was widened -- a user can also
see (not just write) a notification they authored as its `created_by`,
not only ones where they're the recipient. This isn't a new information
leak: created_by only ever matches someone who just performed the
assignment/reassignment themselves, so they already know everything the
row contains (who they assigned, which Opportunity, when) from having
just done it -- Opportunity's own RLS already grants them that. It does
NOT relax anything list_for_user/count_unread/etc. actually return (those
still filter WHERE recipient_user_id = :user_id themselves); this only
widens the defense-in-depth safety net under them, and is what's required
to let the ORM's own read-your-write behavior succeed at all.
"""

from alembic import op

revision = "0026"
down_revision = "0025"
branch_labels = None
depends_on = None

WIDENED_EXPR = "recipient_user_id = cabio_app_uid() OR created_by = cabio_app_uid()"
NARROW_EXPR = "recipient_user_id = cabio_app_uid()"
WITH_CHECK_EXPR = "created_by = cabio_app_uid() OR recipient_user_id = cabio_app_uid()"


def upgrade() -> None:
    op.execute(
        f"ALTER POLICY notification_own_only ON notification "
        f"USING ({WIDENED_EXPR}) WITH CHECK ({WITH_CHECK_EXPR});"
    )


def downgrade() -> None:
    op.execute(
        f"ALTER POLICY notification_own_only ON notification "
        f"USING ({NARROW_EXPR}) WITH CHECK ({WITH_CHECK_EXPR});"
    )
