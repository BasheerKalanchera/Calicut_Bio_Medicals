"""cabio_app_account_last_contact(): last contact, logger and Active count per hospital

Revision ID: 0065
Revises: 0064
Create Date: 2026-11-04

docs/Exception-Report-Implementation-Plan.md (Customer with No Activity,
approved 2026-11-04), D15 and section 6.

A Sales Staff caller sees only their own, split or assigned-reminder
Opportunities (opportunity_tier_visibility), and `activity_select` follows
that, so a query under the caller's own RLS misses a colleague's visit logged
on the colleague's Opportunity -- a hospital a colleague visited last week
would wrongly show as quiet. This SECURITY DEFINER, read-only lookup returns,
for the hospitals asked about and nothing else: the last qualifying contact
date, who logged it, and the hospital's Active Opportunity count. Never an
Opportunity, its notes or its amount. Modelled on cabio_app_plan_overlap()
(migration 0055).

  - Counts as contact: an activity of one of `p_contact_types` (the caller
    passes reporting/repository.py's _CONTACT_ACTIVITY_TYPES, so the list has
    one home), dated now or earlier (D12), on the hospital itself or on one of
    its Opportunities (every activity carries account_id,
    chk_activity_account_required). An activity on an accessory-only
    Opportunity does not count (D7): at least one non-BUYBACK line and every
    such line's product is an ACCESSORY; an Opportunity with no lines yet
    counts.
  - `p_sbu_id` set: only activity logged by someone in that SBU or with no SBU
    (GM, Admin) counts, and the Active count is that SBU's (D5). `p_sbu_id`
    NULL (the all-hospitals view): anyone's activity counts and the Active
    count spans SBUs.
  - Access: Admin and General Manager may ask for any SBU or NULL; everyone
    else only for their own SBU, never NULL. Otherwise it returns no rows.
  - One row per account id passed in, even with no activity (last_contact_*
    NULL, count 0). Which hospitals to ask about (zone scope, D4) is decided
    by the caller; `account` has no RLS.

Read-only: no table, column or policy changes. Downgrade drops the function.
"""

from alembic import op

revision = "0065"
down_revision = "0064"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE FUNCTION cabio_app_account_last_contact(
            p_account_ids uuid[], p_sbu_id uuid, p_contact_types text[]
        )
        RETURNS TABLE(
            account_id uuid,
            last_contact_at timestamptz,
            last_contact_by text,
            active_opportunity_count integer
        )
        LANGUAGE sql STABLE SECURITY DEFINER
        SET search_path TO 'public'
        AS $$
            SELECT
                ids.account_id,
                lc.activity_date,
                lc.display_name::text,
                COALESCE(ao.n, 0)::integer
            FROM unnest(p_account_ids) AS ids(account_id)
            LEFT JOIN LATERAL (
                SELECT act.activity_date, up.display_name
                FROM activity act
                JOIN user_profile up ON up.id = act.user_id
                WHERE act.account_id = ids.account_id
                  AND act.activity_type = ANY (p_contact_types)
                  AND act.activity_date <= now()
                  AND (p_sbu_id IS NULL OR up.sbu_id IS NULL OR up.sbu_id = p_sbu_id)
                  AND NOT (
                      act.opportunity_id IS NOT NULL
                      AND EXISTS (
                          SELECT 1 FROM opportunity_item oi
                          WHERE oi.opportunity_id = act.opportunity_id AND oi.line_type <> 'BUYBACK'
                      )
                      AND NOT EXISTS (
                          SELECT 1 FROM opportunity_item oi
                          JOIN product p ON p.id = oi.product_id
                          WHERE oi.opportunity_id = act.opportunity_id
                            AND oi.line_type <> 'BUYBACK'
                            AND p.product_type <> 'ACCESSORY'
                      )
                  )
                ORDER BY act.activity_date DESC, act.created_at DESC
                LIMIT 1
            ) lc ON true
            LEFT JOIN LATERAL (
                SELECT count(*) AS n
                FROM opportunity o
                JOIN opportunity_status os ON os.id = o.status_id
                WHERE o.account_id = ids.account_id
                  AND os.status_code = 'ACTIVE'
                  AND (p_sbu_id IS NULL OR o.sbu_id = p_sbu_id)
            ) ao ON true
            WHERE cabio_app_role_name() IN ('Admin', 'General Manager')
               OR (p_sbu_id IS NOT NULL AND p_sbu_id = cabio_app_sbu_id())
        $$;
        """
    )


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS cabio_app_account_last_contact(uuid[], uuid, text[]);")
