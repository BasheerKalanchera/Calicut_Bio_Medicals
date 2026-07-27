"""phase 2E: cabio_app RLS helper functions

Revision ID: 0009
Revises: 0008
Create Date: 2026-07-27

Changes (Phase 2E Build Estimate, Task 4 — see Phase-2E-Security-Architecture.md
"RLS Helper Functions" and Opportunity-Access-Hierarchy-Technical-Design.md SS5):
  - 4 SQL helper functions in the public schema, mirroring Supabase's auth.uid()
    for direct PostgreSQL connections. Each reads back one of the 4 session
    variables set_rls_context() (app/db/session.py) stamps onto every
    authenticated request via SET LOCAL: app.current_user_id, app.current_sbu_id,
    app.current_role_id, app.current_zone_id.
  - The `true` second argument to current_setting() returns NULL instead of
    raising when a custom GUC has never been referenced in this backend at
    all. But confirmed by direct reproduction against the live dev DB: once
    a SET LOCAL transaction commits, PostgreSQL resets that placeholder GUC
    to '' (empty string), not NULL -- there is no "truly unset" state to
    revert to once a placeholder has been created, only NULL-on-first-ever-
    reference vs '' on every reset after. On a pooled connection this bites
    cabio_app_zone_id() specifically: set_rls_context() deliberately skips
    SET LOCAL when a user's zone_id is None, so a request from a no-zone
    user, reusing a connection a zoned user's request committed on, would
    read back '' and crash the ::uuid cast. NULLIF(..., '') makes "never
    set" and "reset-to-empty" both collapse to a clean NULL -- applied to
    all 4 functions uniformly, not just zone, since any of them could in
    principle be read outside the normal request path (e.g. Task 8's manual
    psql verification loop, switching context between test cases).
  - No function yet for manager_id -- Level 5's RLS policy (Task 6) reads
    user_profile.manager_id directly via a subquery against cabio_app_uid(),
    since it's per-row data, not caller identity, so it needs no session
    variable of its own.
  - Inert on its own: these functions have nothing to call them until RLS is
    enabled and policies reference them (Tasks 5-7), and the app still connects
    via the plain postgres role until Task 8's DATABASE_URL cutover.
"""

from alembic import op

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None

FUNCTIONS = {
    "cabio_app_uid": "app.current_user_id",
    "cabio_app_sbu_id": "app.current_sbu_id",
    "cabio_app_role_id": "app.current_role_id",
    "cabio_app_zone_id": "app.current_zone_id",
}


def upgrade() -> None:
    for func_name, setting_name in FUNCTIONS.items():
        op.execute(
            f"""
            CREATE OR REPLACE FUNCTION public.{func_name}()
            RETURNS uuid LANGUAGE sql STABLE
            AS $$ SELECT NULLIF(current_setting('{setting_name}', true), '')::uuid $$;
            """
        )


def downgrade() -> None:
    for func_name in FUNCTIONS:
        op.execute(f"DROP FUNCTION IF EXISTS public.{func_name}();")
