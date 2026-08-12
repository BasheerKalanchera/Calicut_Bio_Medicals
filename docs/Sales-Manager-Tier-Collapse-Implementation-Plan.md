# Collapse Sales Manager (Level 5) into Area Manager — Implementation Plan

**Status:** Draft — planned, not yet built.
**Date:** 2026-08-12

## Context

The system's documented 6-tier access hierarchy (`docs/Opportunity-Access-Hierarchy-Technical-Design.md`,
leadership-approved 2026-07-23, implemented Phase 2E) has a dedicated "Sales Manager" tier
(Level 5) whose only rule is "see your direct reports' opportunities" via `user_profile.manager_id`.

Real field data gathered this session (`docs/Zone-Hierarchy-Territory-Data-2026-08.md`) shows no
one in Cabio's actual org occupies that tier — every field rep reports directly to an Area
Manager. And now that the zone hierarchy (self-referencing tree + `zone_closure`, migration 0019)
lets an Area Manager be assigned any granularity — a whole state or a single taluk — "a team lead
with a small patch" and "a regional manager with a big patch" are the same mechanism, just pointed
at different tree nodes. There's no longer a structural reason for Sales Manager to be a separate
role.

Decision (this session, confirmed by Basheer): fold the `manager_id`-based visibility rule into
the Area Manager branch as an additional OR-condition (a safety net for account-zone/reporting-line
drift, not the primary mechanism — see rationale thread in `docs/Progress-Archive-2026-08.md`), and
retire Sales Manager as a role entirely. Sales Staff stays untouched — it's an ownership rule, not
a territorial one, and doesn't collapse into this (a separate proposal to do so was explicitly
rejected this session: peer deal visibility and account-zone completeness make it a bad fit).

**Sequencing note:** the currently in-flight Zone Hierarchy verification (`.claude/active_progress.md`
steps 5-8, commit `1e8bb5a` not yet pushed) touches the exact same `opportunity_tier_visibility`
policy and the exact same Area Manager RLS branch this plan modifies. Recommend finishing and
pushing that verification first — stacking a second live RLS rewrite on top of an unverified one
makes it harder to attribute any new visibility bug to the right change.

**Not yet reviewed by Haroon.** This reframes but doesn't reduce the leadership-approved intent
behind the 2026-07-23 proposal (regional + team-level coverage both still fully delivered, now via
one flexible mechanism instead of two role rows) — worth taking back through the same review
channel before building, same as the territory data itself.

## What changes

### 1. RLS policy — `opportunity_tier_visibility`

Single `ALTER POLICY` (same mechanism as migrations 0018/0019), migration `0020`. Only
`opportunity`'s policy needs touching — confirmed `activity`/`document`/`reminder` policies purely
join back to it (`opportunity_id IN (SELECT id FROM opportunity)`), no duplicated branch to update.

Current Area Manager + Sales Manager branches (live, confirmed 2026-08-12):
```sql
OR (
    cabio_app_role_name() = 'Area Manager'
    AND sbu_id = cabio_app_sbu_id()
    AND account_id IN (SELECT id FROM account WHERE zone_id IN (
        SELECT descendant_zone_id FROM zone_closure
        WHERE ancestor_zone_id IN (SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid())
    ))
)
OR (
    cabio_app_role_name() = 'Sales Manager'
    AND owner_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
)
```
Becomes one Area Manager branch with the manager_id check folded in as an OR inside it:
```sql
OR (
    cabio_app_role_name() = 'Area Manager'
    AND sbu_id = cabio_app_sbu_id()
    AND (
        account_id IN (SELECT id FROM account WHERE zone_id IN (
            SELECT descendant_zone_id FROM zone_closure
            WHERE ancestor_zone_id IN (SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid())
        ))
        OR owner_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
    )
)
```
All other branches (Admin/GM, SBU Manager, owner-self, split, reminder) unchanged.

### 2. Role row — hard delete, not soft-deprecate

`role` has no `is_active` column (confirmed — `app/api/routers/master_data.py:72-75` explicitly
relies on this: "Role has no is_active column... every role tier is always selectable", so
`/master-data/roles` returns every row unconditionally). Leaving the row in place would keep it
selectable in the UI's role dropdown (`sales-os-app/src/screens/UserDirectoryScreen.tsx`) even
after its RLS/scope logic is gone — a silent trap, not a safe no-op.

Unlike `Zone.deprecate_zone()` (soft-delete, because real historical account/user zone
assignments must be grandfathered), a hard delete is safe here specifically because — pending the
preflight check below — nothing real depends on this role today. Don't add an `is_active` column
to `role` just for this one case; that's infrastructure nobody else needs yet.

**Preflight (must run and confirm before writing the migration):** query live Dev for any
`user_profile` row with `role_id = '77777777-7777-7777-7777-700000000006'` (Sales Manager's real
live role_id — confirmed by direct query this session; **do not** use `docs/Seed-Data.sql`'s
`role` INSERT block as the source here, it's stale legacy data predating Phase 2E and lists a
different, wrong ID for this role). Expect to find only the "Test - Sales Manager" fixture. If
anything else turns up, stop and get it reassigned first — do not delete out from under a real
user.

**Cleanup step (explicit, not hidden inside the migration):** delete or reassign the
"Test - Sales Manager" fixture user before running the migration. The migration's `DELETE FROM
role` will fail loudly on an FK violation if this is skipped — treat that as the safety net, not
something to special-case away inside the migration script.

Migration `0020` (`down_revision = "0019"`):
- `upgrade()`: the `ALTER POLICY` above, then `DELETE FROM role WHERE id = '77777777-7777-7777-7777-700000000006'`.
- `downgrade()`: `ALTER POLICY` back to the two-branch text, then re-`INSERT` the role row. Note in
  the docstring (same honesty pattern as 0019's downgrade) that downgrade cannot restore whatever
  user_profile/manager_id state existed before — best-effort only.

### 3. Python team-scope — `organization/repository.py`

Mirror the RLS change exactly, same reasoning the existing comments already insist on (keep the
SQL and Python paths in sync). Remove the `"Sales Manager"` entry; fold its condition into
`"Area Manager"`'s builder (`or_` already imported):
```python
"Area Manager": lambda u: and_(
    UserProfile.sbu_id == u.sbu_id,
    or_(
        UserProfile.id.in_(
            select(UserZone.user_id).where(
                UserZone.zone_id.in_(
                    select(ZoneClosure.descendant_zone_id).where(
                        ZoneClosure.ancestor_zone_id.in_(
                            select(UserZone.zone_id).where(UserZone.user_id == u.id)
                        )
                    )
                )
            )
        ),
        UserProfile.manager_id == u.id,
    ),
),
```
Update the file's header comment (lines 11-16) accordingly — it currently describes Sales Manager
as its own tier.

### 4. Tests

Six files reference `"Sales Manager"` as a role-name string — each needs a look to see whether it's
testing Sales-Manager-specific behavior (rewrite against the new combined Area Manager rule) or
just using it incidentally as "some non-privileged role" (swap to `"Sales Staff"` or another
surviving role):
- `backend/tests/test_master_data.py:157`
- `backend/tests/domains/product/test_product_service.py:105,155`
- `backend/tests/domains/product/test_product_router.py:207,235`
- `backend/tests/domains/reference/test_zone_service.py:14` (`NON_ADMIN_ROLES` list)
- `backend/tests/domains/organization/test_organization_repository.py:113`
- `backend/tests/domains/activity/test_activity_repository.py:103,130,133`

Add/extend a test asserting Area Manager visibility via `manager_id` alone (account outside the
manager's zone, but owned by their direct report) — this is the one genuinely new behavior.

### 5. Docs

- `docs/Opportunity-Access-Hierarchy-Technical-Design.md` — revise the tier table to 5 levels,
  append a dated revision note (matching the doc's existing revision-note style) explaining the
  collapse and why: zone hierarchy made granularity a data question, not a role question; frame
  `manager_id` as a drift safety net, not the primary mechanism.
- `docs/ADR.md` ADR-009 — append a dated correction/amendment paragraph (same pattern ADR-009
  already uses for its own two prior corrections), not a silent rewrite — this is a leadership-
  approved, "Implemented" ADR.
- `docs/Business-Rules.md:246` — drop "Sales Manager" from the list of tiers unaffected by zone
  logic (Area Manager remains the only zone-affected tier, now also manager_id-affected).
- `docs/Seed-Data.sql:94` — remove the stale `('...002', 'Sales Manager')` row so a fresh
  environment bootstrap doesn't silently recreate the retired role. Don't attempt to reconcile the
  rest of this file's stale 4-role model (missing Area Manager/SBU Manager, still says "Sales
  Executive") — that's pre-existing, unrelated debt; worth flagging to Basheer as a separate
  backlog item rather than folding into this change.

**Out of scope, flagged not fixed:** `sales-os-app/src/App.jsx` (legacy `/prototype` route, mock
data only — not the real app, which fetches roles dynamically from `/master-data/roles` and has no
hardcoded role list) still references "Sales Manager" in several places. The real app
(`DemoApp.tsx`, `UserDirectoryScreen.tsx`) needs zero frontend changes — its role dropdown and zone
picker are already generic and driven entirely by the backend's role list. Confirm with Basheer
whether the legacy prototype route is worth touching at all before doing so.

## Verification

1. Preflight query (above) — confirm only the test fixture references the role.
2. `alembic upgrade head` against Dev; confirm no FK errors.
3. Run backend test suite (`pytest`).
4. Manual RLS check, same rigor as the Zone Hierarchy verification currently in flight:
   - Area Manager assigned a small leaf zone + a direct report (via `manager_id`) whose account
     sits in a *different* zone entirely → confirm that report's deal is now visible (new
     behavior, via the folded-in branch).
   - Area Manager with no `manager_id` reports, zone-only → confirm unchanged from before.
   - Admin/GM, SBU Manager, Sales Staff → confirm unaffected (none of these touch the changed
     branch).
   - Confirm "Sales Manager" no longer appears in the User Directory role dropdown.
5. Update `.claude/active_progress.md` to reflect this as a new, separate verification thread —
   don't conflate it with the still-open Zone Hierarchy one.
