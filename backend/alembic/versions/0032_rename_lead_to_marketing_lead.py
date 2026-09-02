"""rename lead to marketing_lead

Revision ID: 0032
Revises: 0031
Create Date: 2026-09-02

Changes: pure rename, no structural change. `lead` collides with the
existing Opportunity Stage "Lead" (`opportunity_stage.stage_code =
'LEAD'`) -- a real, already-owned pipeline record, conceptually different
from this table's rows (unqualified, unreviewed inbound inquiries). Found
during Group A manual E2E testing, 2026-09-02 (docs/Progress-
Archive-2026-09.md). Renamed to `marketing_lead` -- pairs with the
already-seeded "Marketing User" role name, unambiguous against the
pipeline's own "Lead" stage. 0031 is already applied to Dev and must never
be edited (Backend-Implementation-Standards.md) -- this is a follow-up
migration, not a fix to that one.

Table RENAME alone leaves constraint/index/policy names on their old
`lead_*` spelling (Postgres doesn't cascade-rename those) -- each is
renamed explicitly here too, so every object matches this project's
`{table}_{...}` naming convention.
"""

from alembic import op

revision = "0032"
down_revision = "0031"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE lead RENAME TO marketing_lead;")

    op.execute("ALTER TABLE marketing_lead RENAME CONSTRAINT lead_pkey TO marketing_lead_pkey;")
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT lead_account_id_fkey TO marketing_lead_account_id_fkey;"
    )
    op.execute("ALTER TABLE marketing_lead RENAME CONSTRAINT lead_sbu_id_fkey TO marketing_lead_sbu_id_fkey;")
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT lead_lead_source_id_fkey "
        "TO marketing_lead_lead_source_id_fkey;"
    )
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT lead_product_id_fkey TO marketing_lead_product_id_fkey;"
    )
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT lead_assigned_to_user_id_fkey "
        "TO marketing_lead_assigned_to_user_id_fkey;"
    )
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT lead_converted_opportunity_id_fkey "
        "TO marketing_lead_converted_opportunity_id_fkey;"
    )
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT lead_created_by_fkey TO marketing_lead_created_by_fkey;"
    )
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT lead_reviewed_by_fkey TO marketing_lead_reviewed_by_fkey;"
    )
    op.execute("ALTER TABLE marketing_lead RENAME CONSTRAINT ck_lead_status TO ck_marketing_lead_status;")
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT ck_lead_discard_reason TO ck_marketing_lead_discard_reason;"
    )

    op.execute("ALTER INDEX idx_lead_assigned_to_user_id RENAME TO idx_marketing_lead_assigned_to_user_id;")
    op.execute("ALTER INDEX idx_lead_assigned_pending RENAME TO idx_marketing_lead_assigned_pending;")

    op.execute("ALTER POLICY lead_select ON marketing_lead RENAME TO marketing_lead_select;")
    op.execute("ALTER POLICY lead_insert ON marketing_lead RENAME TO marketing_lead_insert;")
    op.execute("ALTER POLICY lead_update ON marketing_lead RENAME TO marketing_lead_update;")


def downgrade() -> None:
    op.execute("ALTER POLICY marketing_lead_update ON marketing_lead RENAME TO lead_update;")
    op.execute("ALTER POLICY marketing_lead_insert ON marketing_lead RENAME TO lead_insert;")
    op.execute("ALTER POLICY marketing_lead_select ON marketing_lead RENAME TO lead_select;")

    op.execute("ALTER INDEX idx_marketing_lead_assigned_pending RENAME TO idx_lead_assigned_pending;")
    op.execute("ALTER INDEX idx_marketing_lead_assigned_to_user_id RENAME TO idx_lead_assigned_to_user_id;")

    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT ck_marketing_lead_discard_reason TO ck_lead_discard_reason;"
    )
    op.execute("ALTER TABLE marketing_lead RENAME CONSTRAINT ck_marketing_lead_status TO ck_lead_status;")
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT marketing_lead_reviewed_by_fkey TO lead_reviewed_by_fkey;"
    )
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT marketing_lead_created_by_fkey TO lead_created_by_fkey;"
    )
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT marketing_lead_converted_opportunity_id_fkey "
        "TO lead_converted_opportunity_id_fkey;"
    )
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT marketing_lead_assigned_to_user_id_fkey "
        "TO lead_assigned_to_user_id_fkey;"
    )
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT marketing_lead_product_id_fkey TO lead_product_id_fkey;"
    )
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT marketing_lead_lead_source_id_fkey "
        "TO lead_lead_source_id_fkey;"
    )
    op.execute("ALTER TABLE marketing_lead RENAME CONSTRAINT marketing_lead_sbu_id_fkey TO lead_sbu_id_fkey;")
    op.execute(
        "ALTER TABLE marketing_lead RENAME CONSTRAINT marketing_lead_account_id_fkey TO lead_account_id_fkey;"
    )
    op.execute("ALTER TABLE marketing_lead RENAME CONSTRAINT marketing_lead_pkey TO lead_pkey;")

    op.execute("ALTER TABLE marketing_lead RENAME TO lead;")
