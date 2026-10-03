"""audit trail redesign, step 1: trigger v2, more tables, direct-edit editor

Revision ID: 0059
Revises: 0058
Create Date: 2026-10-03

docs/Audit-Trail-Redesign-Implementation-Plan.md, step 1 (decisions by
Basheer, 2026-09-30). Purely forward-acting: no existing row or log entry
is touched, and past history is not reconstructed.

  - `audit_log_row_change()` v2. Called with no arguments on main records
    (as before), or with `(parent_tables, parent_fks)` on line tables --
    comma-separated, paired by position; `document` lists its four
    possible parents and the one that is set is used.
      * UPDATE: changed fields only, now ignoring `updated_by` as well as
        `updated_at` (a save that changed nothing else logs nothing).
      * DELETE of a line whose parent no longer exists (cascaded from the
        parent's own delete) is not logged; the parent's removal is.
      * INSERT (line tables only): logged as an addition to an existing
        record; skipped when the parent was created in the same
        transaction (`parent.created_at = now()`; created_at is the DB
        default `now()` = transaction start, and the API commits once per
        request, so a new record saved together with its lines logs
        nothing).
      * `record_id`: the row's own `id`, or the parent's id for the two
        line tables without one (`opportunity_stakeholder`, `user_zone`);
        the other key stays in the data.
  - `ck_audit_log_action` allows 'INSERT'.
  - New triggers: main records `target_plan`, `marketing_lead`, `project`,
    `installed_asset`, `zone`, `brand`, `model`, `category` (UPDATE,
    DELETE); line tables `opportunity_stakeholder`, `user_zone`,
    `target_plan_account`, `target_plan_brand_split`, `document` (INSERT,
    UPDATE, DELETE). `opportunity_item` and `split` gain INSERT and their
    parent arguments.
  - `update_updated_at()`: a change made without an app user (direct
    database edit, script) clears `updated_by` instead of leaving the last
    app editor's name. Every app write runs with the RLS context set
    (get_current_user -> set_rls_context, one session per request), so
    genuine app saves keep their editor. Guarded for the tables using
    this trigger that have no `updated_by` column.

Until step 2 ships, the four wipe-and-rewrite save paths (Opportunity
contacts, user zones, target-plan hospitals and brand splits) will log
remove/add pairs on Dev for unchanged lines. UAT gets this migration only
together with step 2.
"""

from alembic import op

revision = "0059"
down_revision = "0058"
branch_labels = None
depends_on = None

MAIN_TABLES = ["target_plan", "marketing_lead", "project", "installed_asset", "zone", "brand", "model", "category"]

# table -> (parent tables, parent foreign keys), comma-separated and paired by position
LINE_TABLES = {
    "opportunity_item": ("opportunity", "opportunity_id"),
    "split": ("opportunity", "opportunity_id"),
    "opportunity_stakeholder": ("opportunity", "opportunity_id"),
    "user_zone": ("user_profile", "user_id"),
    "target_plan_account": ("target_plan", "target_plan_id"),
    "target_plan_brand_split": ("target_plan", "target_plan_id"),
    "document": ("account,project,opportunity,product", "account_id,project_id,opportunity_id,product_id"),
}

AUDIT_FN_V2 = """
CREATE OR REPLACE FUNCTION audit_log_row_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
AS $$
DECLARE
    row_data jsonb;
    parent_tables text[];
    parent_fks text[];
    parent_table text;
    parent_id uuid;
    parent_created timestamptz;
    parent_rows int;
    rec_id uuid;
    diff_old jsonb;
    diff_new jsonb;
BEGIN
    row_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;

    -- Line tables: find the parent record this row belongs to.
    IF TG_NARGS >= 2 THEN
        parent_tables := string_to_array(TG_ARGV[0], ',');
        parent_fks := string_to_array(TG_ARGV[1], ',');
        FOR i IN 1 .. array_length(parent_fks, 1) LOOP
            IF row_data ->> parent_fks[i] IS NOT NULL THEN
                parent_table := parent_tables[i];
                parent_id := (row_data ->> parent_fks[i])::uuid;
                EXIT;
            END IF;
        END LOOP;
        IF parent_id IS NOT NULL THEN
            EXECUTE format('SELECT created_at FROM %I WHERE id = $1', parent_table)
                INTO parent_created USING parent_id;
            -- EXECUTE doesn't set FOUND; ROW_COUNT is the reliable check.
            GET DIAGNOSTICS parent_rows = ROW_COUNT;
            IF parent_rows = 0 THEN
                -- Parent already gone: a cascaded delete; the parent's own removal is logged.
                RETURN NULL;
            END IF;
        END IF;
    END IF;

    rec_id := COALESCE((row_data ->> 'id')::uuid, parent_id);

    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
        VALUES (TG_TABLE_NAME, rec_id, TG_OP, cabio_app_uid(), row_data, NULL);

    ELSIF TG_OP = 'INSERT' THEN
        -- Lines saved together with a brand-new parent are part of its creation.
        IF parent_created IS NOT NULL AND parent_created = now() THEN
            RETURN NULL;
        END IF;
        INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
        VALUES (TG_TABLE_NAME, rec_id, TG_OP, cabio_app_uid(), NULL, row_data);

    ELSE
        SELECT jsonb_object_agg(o.key, o.value), jsonb_object_agg(o.key, n.value)
        INTO diff_old, diff_new
        FROM jsonb_each(to_jsonb(OLD)) o
        JOIN jsonb_each(to_jsonb(NEW)) n USING (key)
        WHERE o.value IS DISTINCT FROM n.value
          AND o.key NOT IN ('updated_at', 'updated_by');

        IF diff_old IS NOT NULL THEN
            INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
            VALUES (TG_TABLE_NAME, rec_id, TG_OP, cabio_app_uid(), diff_old, diff_new);
        END IF;
    END IF;
    RETURN NULL;
END;
$$;
"""

# 0030's version, restored on downgrade.
AUDIT_FN_V1 = """
CREATE OR REPLACE FUNCTION audit_log_row_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
AS $$
DECLARE
    diff_old jsonb;
    diff_new jsonb;
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, cabio_app_uid(), to_jsonb(OLD), NULL);
        RETURN OLD;

    ELSE
        SELECT jsonb_object_agg(o.key, o.value), jsonb_object_agg(o.key, n.value)
        INTO diff_old, diff_new
        FROM jsonb_each(to_jsonb(OLD)) o
        JOIN jsonb_each(to_jsonb(NEW)) n USING (key)
        WHERE o.value IS DISTINCT FROM n.value
          AND o.key <> 'updated_at';

        IF diff_old IS NOT NULL THEN
            INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
            VALUES (TG_TABLE_NAME, NEW.id, TG_OP, cabio_app_uid(), diff_old, diff_new);
        END IF;
        RETURN NEW;
    END IF;
END;
$$;
"""

UPDATED_AT_FN_V2 = """
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    -- No app user (direct database edit or script): don't leave the last
    -- app editor's name on the record.
    IF cabio_app_uid() IS NULL AND to_jsonb(NEW) ? 'updated_by' THEN
        NEW.updated_by := NULL;
    END IF;
    RETURN NEW;
END;
$$;
"""

UPDATED_AT_FN_V1 = """
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
"""


def upgrade() -> None:
    op.execute("ALTER TABLE audit_log DROP CONSTRAINT ck_audit_log_action;")
    op.execute(
        "ALTER TABLE audit_log ADD CONSTRAINT ck_audit_log_action "
        "CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'));"
    )
    op.execute(AUDIT_FN_V2)
    op.execute(UPDATED_AT_FN_V2)

    for table in MAIN_TABLES:
        op.execute(
            f"CREATE TRIGGER trg_audit_{table} AFTER UPDATE OR DELETE ON {table} "
            "FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();"
        )
    for table, (parents, fks) in LINE_TABLES.items():
        op.execute(f"DROP TRIGGER IF EXISTS trg_audit_{table} ON {table};")
        op.execute(
            f"CREATE TRIGGER trg_audit_{table} AFTER INSERT OR UPDATE OR DELETE ON {table} "
            f"FOR EACH ROW EXECUTE FUNCTION audit_log_row_change('{parents}', '{fks}');"
        )


def downgrade() -> None:
    # WARNING: destructive. Deletes every audit_log row with action 'INSERT'
    # (permanent loss of that history) and drops the triggers on the newer
    # tables, so changes to them stop being logged. Don't run on UAT/Prod
    # without a backup of audit_log.
    for table in list(LINE_TABLES) + MAIN_TABLES:
        op.execute(f"DROP TRIGGER IF EXISTS trg_audit_{table} ON {table};")
    for table in ("opportunity_item", "split"):
        op.execute(
            f"CREATE TRIGGER trg_audit_{table} AFTER UPDATE OR DELETE ON {table} "
            "FOR EACH ROW EXECUTE FUNCTION audit_log_row_change();"
        )
    op.execute(UPDATED_AT_FN_V1)
    op.execute(AUDIT_FN_V1)
    # 'INSERT' entries can't satisfy the old constraint; they only exist since this migration.
    op.execute("DELETE FROM audit_log WHERE action = 'INSERT';")
    op.execute("ALTER TABLE audit_log DROP CONSTRAINT ck_audit_log_action;")
    op.execute(
        "ALTER TABLE audit_log ADD CONSTRAINT ck_audit_log_action CHECK (action IN ('UPDATE', 'DELETE'));"
    )
