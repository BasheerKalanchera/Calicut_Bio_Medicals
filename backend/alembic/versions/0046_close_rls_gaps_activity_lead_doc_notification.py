"""Close 4 RLS gaps found in a broader review, 2026-09-17

Each of these is an existing (already-shipped) policy that's weaker than it
looks -- the app's own screens happen to never exercise the risky path
today, but the database itself wouldn't stop a direct script, a future
feature reusing the table, or a mistake. None are exploited today; each is
closed here so the database is the real backstop, not just app discipline
-- same reasoning as migration 0045's target_plan_read fix.

Before writing this, confirmed against the actual routers/services which
mutation endpoints genuinely exist per table, so no real feature is broken:
  - activity: zero UPDATE/DELETE endpoints anywhere -- rows are meant to be
    immutable (CLAUDE.md), matching activity_comment's existing INSERT/
    SELECT-only precedent.
  - reminder: PATCH /reminders/{id} exists (marks is_completed) -- UPDATE
    must stay. No DELETE endpoint.
  - document: DELETE /documents/{id} exists (Admin/GM-gated in the service
    layer, product collateral only). No UPDATE (PATCH/PUT) endpoint.
  - notification: only recipient-side "mark read" exists (service layer
    scopes it to the caller's own rows already) -- no delete endpoint.

1. activity -- INSERT/UPDATE/DELETE could bypass the opportunity-visibility
   check entirely by setting user_id (the note's *subject*, not
   necessarily its author -- see models.py's own comment) to yourself,
   regardless of which opportunity_id you attach it to. Split the single
   blanket USING policy into SELECT (unchanged, keeps "always see your own
   subject rows") and INSERT (drops that unconditional bypass). No UPDATE/
   DELETE policy at all.
   **Caught in code review before this shipped:** the first draft of
   activity_insert dropped the bypass without replacing it, which broke
   BR-ACT-10 Relationship Support (migration 0029) -- that feature's whole
   point is letting someone log an activity against an opportunity outside
   their own SBU/zone, specifically because ActivityService.log_activity
   (service.py:144-154) validates it via the SECURITY DEFINER
   cabio_app_opportunity_in_account(opportunity_id, account_id), not via
   normal opportunity RLS. activity_insert now has an explicit branch for
   exactly that check, mirroring the service layer 1:1, instead of the
   broad "or it's my own subject row" shortcut that could pass for *any*
   opportunity_id.

2. marketing_lead -- the Area Manager clause in _select/_update checks only
   "is this one of my direct reports," with no sbu_id check, unlike the
   SBU Manager clause two lines above it. Same shape as the target_plan
   bug fixed this morning (migration 0045). Adds the missing sbu_id check.

3. document -- one blanket USING policy with no command restriction means
   UPDATE was technically permitted even though no UPDATE endpoint exists.
   Split into SELECT/INSERT (unchanged in content) and DELETE (now
   authorization-scoped, see below) -- no UPDATE policy.
   **A second, real gap found while tracing DELETE's actual coverage, not
   one of the original 4, fixed the same pass on Basheer's decision
   (2026-09-17):** DocumentService.delete_document (service.py:108-119)
   only role-checked Admin/GM when document.product_id was set (Product
   Catalog collateral) -- an Opportunity-linked document had no
   restriction beyond ordinary RLS visibility, so any teammate who could
   merely see the deal could delete a colleague's uploaded file. Both the
   service layer and document_delete's own RLS now require the deal's
   owner or Admin/GM for that case, matching each other exactly (see
   _DOCUMENT_DELETABLE below) rather than DELETE being backed only by
   whichever check happened to be in front of the caller.

4. reminder -- same command-scoping issue as document, one command over:
   the blanket policy technically permitted DELETE despite no DELETE
   endpoint existing. Split into SELECT/INSERT/UPDATE (all unchanged --
   UPDATE kept deliberately, PATCH /reminders/{id} really does mark
   is_completed) -- no DELETE policy.

5. notification -- the single policy's WITH CHECK includes
   created_by = cabio_app_uid(), so the sender's own grant survives into
   any later UPDATE on the recipient's copy. Split into SELECT/INSERT
   (unchanged) and UPDATE (recipient only, sender's bypass removed).

Revision ID: 0046
Revises: 0045
Create Date: 2026-09-17
"""

from alembic import op

revision = "0046"
down_revision = "0045"
branch_labels = None
depends_on = None

_ACTIVITY_TIER_EXCLUSION = """
    NOT (
        (public.cabio_app_role_name() = 'Area Manager'
         AND public.cabio_app_user_role_name(user_id) = ANY (ARRAY['SBU Manager', 'General Manager', 'Admin']))
        OR (public.cabio_app_role_name() = 'SBU Manager'
            AND public.cabio_app_user_role_name(user_id) = ANY (ARRAY['General Manager', 'Admin']))
    )
"""

_ACTIVITY_OPPORTUNITY_VISIBLE = f"""
    public.cabio_app_has_split(opportunity_id)
    OR public.cabio_app_assigned_reminder(opportunity_id)
    OR (
        opportunity_id IN (SELECT id FROM public.opportunity)
        AND {_ACTIVITY_TIER_EXCLUSION}
    )
"""

_DOCUMENT_VISIBLE = """
    (opportunity_id IS NULL)
    OR (opportunity_id IN (SELECT id FROM public.opportunity))
"""

# Resolved 2026-09-17 (Basheer, same pass as the DocumentService.delete_document
# fix): deleting a document is narrower than seeing it -- Product Catalog
# collateral stays Admin/GM-only, an Opportunity-linked document is now the
# deal's owner or Admin/GM, matching the service layer exactly rather than
# leaving DELETE only backed by app discipline.
_DOCUMENT_DELETABLE = """
    (product_id IS NOT NULL AND public.cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager']))
    OR (
        opportunity_id IS NOT NULL
        AND (
            public.cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
            OR opportunity_id IN (SELECT id FROM public.opportunity WHERE owner_id = public.cabio_app_uid())
        )
    )
"""

_REMINDER_VISIBLE = "activity_id IN (SELECT id FROM public.activity)"

_MARKETING_LEAD_AREA_MANAGER = """
    (public.cabio_app_role_name() = 'Area Manager'
     AND sbu_id = public.cabio_app_sbu_id()
     AND assigned_to_user_id IN (
         SELECT id FROM public.user_profile WHERE manager_id = public.cabio_app_uid()
     ))
"""


def upgrade() -> None:
    # 1. activity
    op.execute("DROP POLICY IF EXISTS activity_tier_visibility ON public.activity;")
    op.execute(f"""
        CREATE POLICY activity_select ON public.activity FOR SELECT USING (
            (opportunity_id IS NULL)
            OR (user_id = public.cabio_app_uid())
            OR {_ACTIVITY_OPPORTUNITY_VISIBLE}
        );
    """)
    op.execute(f"""
        CREATE POLICY activity_insert ON public.activity FOR INSERT WITH CHECK (
            (opportunity_id IS NULL)
            OR (account_id IS NOT NULL AND public.cabio_app_opportunity_in_account(opportunity_id, account_id))
            OR {_ACTIVITY_OPPORTUNITY_VISIBLE}
        );
    """)

    # 2. marketing_lead
    op.execute("DROP POLICY IF EXISTS marketing_lead_select ON public.marketing_lead;")
    op.execute(f"""
        CREATE POLICY marketing_lead_select ON public.marketing_lead FOR SELECT USING (
            (public.cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager']))
            OR (public.cabio_app_role_name() = 'SBU Manager' AND sbu_id = public.cabio_app_sbu_id())
            OR {_MARKETING_LEAD_AREA_MANAGER}
            OR (assigned_to_user_id = public.cabio_app_uid())
            OR (created_by = public.cabio_app_uid())
        );
    """)
    op.execute("DROP POLICY IF EXISTS marketing_lead_update ON public.marketing_lead;")
    op.execute(f"""
        CREATE POLICY marketing_lead_update ON public.marketing_lead FOR UPDATE USING (
            (public.cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager']))
            OR (assigned_to_user_id = public.cabio_app_uid())
            OR (public.cabio_app_role_name() = 'SBU Manager' AND sbu_id = public.cabio_app_sbu_id())
            OR {_MARKETING_LEAD_AREA_MANAGER}
        ) WITH CHECK (true);
    """)

    # 3. document
    op.execute("DROP POLICY IF EXISTS document_tier_visibility ON public.document;")
    op.execute(f"CREATE POLICY document_select ON public.document FOR SELECT USING ({_DOCUMENT_VISIBLE});")
    op.execute(f"CREATE POLICY document_insert ON public.document FOR INSERT WITH CHECK ({_DOCUMENT_VISIBLE});")
    op.execute(f"CREATE POLICY document_delete ON public.document FOR DELETE USING ({_DOCUMENT_DELETABLE});")

    # 4. reminder
    op.execute("DROP POLICY IF EXISTS reminder_via_activity ON public.reminder;")
    op.execute(f"CREATE POLICY reminder_select ON public.reminder FOR SELECT USING ({_REMINDER_VISIBLE});")
    op.execute(f"CREATE POLICY reminder_insert ON public.reminder FOR INSERT WITH CHECK ({_REMINDER_VISIBLE});")
    op.execute(
        f"CREATE POLICY reminder_update ON public.reminder FOR UPDATE "
        f"USING ({_REMINDER_VISIBLE}) WITH CHECK ({_REMINDER_VISIBLE});"
    )

    # 5. notification
    op.execute("DROP POLICY IF EXISTS notification_own_only ON public.notification;")
    op.execute("""
        CREATE POLICY notification_select ON public.notification FOR SELECT USING (
            (recipient_user_id = public.cabio_app_uid()) OR (created_by = public.cabio_app_uid())
        );
    """)
    op.execute("""
        CREATE POLICY notification_insert ON public.notification FOR INSERT WITH CHECK (
            (created_by = public.cabio_app_uid()) OR (recipient_user_id = public.cabio_app_uid())
        );
    """)
    op.execute("""
        CREATE POLICY notification_update ON public.notification FOR UPDATE
            USING (recipient_user_id = public.cabio_app_uid())
            WITH CHECK (recipient_user_id = public.cabio_app_uid());
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS notification_update ON public.notification;")
    op.execute("DROP POLICY IF EXISTS notification_insert ON public.notification;")
    op.execute("DROP POLICY IF EXISTS notification_select ON public.notification;")
    op.execute("""
        CREATE POLICY notification_own_only ON public.notification USING (
            (recipient_user_id = public.cabio_app_uid()) OR (created_by = public.cabio_app_uid())
        ) WITH CHECK (
            (created_by = public.cabio_app_uid()) OR (recipient_user_id = public.cabio_app_uid())
        );
    """)

    op.execute("DROP POLICY IF EXISTS reminder_update ON public.reminder;")
    op.execute("DROP POLICY IF EXISTS reminder_insert ON public.reminder;")
    op.execute("DROP POLICY IF EXISTS reminder_select ON public.reminder;")
    op.execute(f"CREATE POLICY reminder_via_activity ON public.reminder USING ({_REMINDER_VISIBLE});")

    op.execute("DROP POLICY IF EXISTS document_delete ON public.document;")
    op.execute("DROP POLICY IF EXISTS document_insert ON public.document;")
    op.execute("DROP POLICY IF EXISTS document_select ON public.document;")
    op.execute(f"CREATE POLICY document_tier_visibility ON public.document USING ({_DOCUMENT_VISIBLE});")

    op.execute("DROP POLICY IF EXISTS marketing_lead_update ON public.marketing_lead;")
    op.execute("""
        CREATE POLICY marketing_lead_update ON public.marketing_lead FOR UPDATE USING (
            (public.cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager']))
            OR (assigned_to_user_id = public.cabio_app_uid())
            OR (public.cabio_app_role_name() = 'SBU Manager' AND sbu_id = public.cabio_app_sbu_id())
            OR (public.cabio_app_role_name() = 'Area Manager'
                AND assigned_to_user_id IN (
                    SELECT id FROM public.user_profile WHERE manager_id = public.cabio_app_uid()
                ))
        ) WITH CHECK (true);
    """)
    op.execute("DROP POLICY IF EXISTS marketing_lead_select ON public.marketing_lead;")
    op.execute("""
        CREATE POLICY marketing_lead_select ON public.marketing_lead FOR SELECT USING (
            (public.cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager']))
            OR (public.cabio_app_role_name() = 'SBU Manager' AND sbu_id = public.cabio_app_sbu_id())
            OR (public.cabio_app_role_name() = 'Area Manager'
                AND assigned_to_user_id IN (
                    SELECT id FROM public.user_profile WHERE manager_id = public.cabio_app_uid()
                ))
            OR (assigned_to_user_id = public.cabio_app_uid())
            OR (created_by = public.cabio_app_uid())
        );
    """)

    op.execute("DROP POLICY IF EXISTS activity_insert ON public.activity;")
    op.execute("DROP POLICY IF EXISTS activity_select ON public.activity;")
    op.execute(f"""
        CREATE POLICY activity_tier_visibility ON public.activity USING (
            (opportunity_id IS NULL)
            OR (user_id = public.cabio_app_uid())
            OR {_ACTIVITY_OPPORTUNITY_VISIBLE}
        );
    """)
