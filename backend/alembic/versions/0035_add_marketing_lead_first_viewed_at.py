"""add marketing_lead.first_viewed_at

Revision ID: 0035
Revises: 0034
Create Date: 2026-09-03

Changes (docs/Lead-Management-Implementation-Plan.md follow-up): the
Marketing User's own "Marketing Leads" screen showed only a bare
NEW/CONVERTED/DISCARDED pill, with no way to tell "the rep hasn't looked
yet" from "the rep looked and hasn't acted." Raised by Basheer 2026-09-03
during Group D manual E2E testing.

`first_viewed_at` is set the first time the assigned rep opens Marketing
Lead Queue while the lead is still NEW (MarketingLeadRepository.
mark_first_viewed) -- same read-receipt pattern as the notification
system's mark_read_for_type/mark_read_for_entity, not a new status value.
Deliberately NOT folded into `status` (still just NEW/CONVERTED/
DISCARDED) -- that column governs who's allowed to act
(MarketingLeadService._get_reviewable_lead's status == "NEW" gate), and
widening it for a pure visibility signal would touch that gate for no
reason. The UI shows one timestamp per lead (Created -> Seen ->
Converted/Discarded, whichever is most advanced), but created_at/
first_viewed_at/reviewed_at all stay in the row underneath for later
reporting (e.g. time-to-follow-up analysis across reps).
"""

from alembic import op

revision = "0035"
down_revision = "0034"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE marketing_lead ADD COLUMN first_viewed_at TIMESTAMPTZ NULL;")


def downgrade() -> None:
    op.execute("ALTER TABLE marketing_lead DROP COLUMN first_viewed_at;")
