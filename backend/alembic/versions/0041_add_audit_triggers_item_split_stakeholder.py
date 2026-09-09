"""add audit triggers for stakeholder, opportunity_item, split

Revision ID: 0041
Revises: 0040
Create Date: 2026-09-09

Changes (docs/Audit-Trail-Extension-Implementation-Plan.md): extends the
existing audit_log_row_change() trigger (0030) to three more tables. No
function change -- it's already fully generic via TG_TABLE_NAME/TG_OP and
jsonb_each diffing.

  - `stakeholder`: already edited via a genuine in-place UPDATE
    (account/stakeholder_service.py) -- the trigger alone is the whole
    task here, identical in shape to the original four tables.
  - `opportunity_item` / `split`: were edited via a delete-all-then-
    reinsert bulk-replace pattern, which the trigger would have seen as
    unrelated DELETE+INSERT pairs instead of a clean UPDATE diff. Fixed in
    application code first (OpportunityRepository.replace_items/
    replace_splits now partition into real UPDATE/DELETE/INSERT, threading
    each row's own id (items) or (opportunity_id, user_id) (splits)
    through the save path) -- this migration is safe to apply on its own
    right after that code ships, no ordering dependency the other
    direction (a trigger with no matching code change would just be
    inert until the code catches up, not harmful).
  - Purely forward-acting: no backfill, no existing row touched, renumbered,
    or migrated by this change -- confirmed 2026-09-07 against live UAT
    (108 opportunities; `split` had zero rows, so no legacy-dedup risk).
"""

from alembic import op

revision = "0041"
down_revision = "0040"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "CREATE TRIGGER trg_audit_stakeholder AFTER UPDATE OR DELETE ON stakeholder "
        "FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();"
    )
    op.execute(
        "CREATE TRIGGER trg_audit_opportunity_item AFTER UPDATE OR DELETE ON opportunity_item "
        "FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();"
    )
    op.execute(
        "CREATE TRIGGER trg_audit_split AFTER UPDATE OR DELETE ON split "
        "FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();"
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_audit_stakeholder ON stakeholder;")
    op.execute("DROP TRIGGER IF EXISTS trg_audit_opportunity_item ON opportunity_item;")
    op.execute("DROP TRIGGER IF EXISTS trg_audit_split ON split;")
