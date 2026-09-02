"""make marketing_lead.account_id nullable

Revision ID: 0034
Revises: 0033
Create Date: 2026-09-02

Changes (docs/Lead-Management-Implementation-Plan.md): the Marketing Lead
create form's Account field was hard-required, but Marketing User has no
Account-creation rights (an earlier explicit decision) -- if the hospital
genuinely isn't in the directory yet, there was no way to submit at all
except picking an unrelated existing account as a placeholder. Raised by
Basheer during Group B manual E2E testing, 2026-09-02.

`account_id` becomes nullable, same "Not Sure Yet" pattern already used
for `product_id`. The assigned rep resolves the real account at Convert
time instead (using AddHospitalModal.tsx's new inline "+ Add Hospital"
shortcut, or Customer Directory directly, guided by the lead's own note).
"""

from alembic import op

revision = "0034"
down_revision = "0033"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE marketing_lead ALTER COLUMN account_id DROP NOT NULL;")


def downgrade() -> None:
    # Any existing NULL account_id rows would violate the NOT NULL being
    # restored -- same caveat every nullable->required downgrade in this
    # codebase carries; not expected to be run against real data.
    op.execute("ALTER TABLE marketing_lead ALTER COLUMN account_id SET NOT NULL;")
