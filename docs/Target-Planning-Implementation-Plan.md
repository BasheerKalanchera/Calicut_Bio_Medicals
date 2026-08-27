# Target Planning — Implementation Plan

**Status:** Draft — planned, not yet built. First Milestone 2 feature, targeted for this
week's incremental deploy under the new 2-region Dev/Prod model (`docs/Deployment-Topology.md`).

## Context

Milestone 2 (`docs/implementation_plan.md`) scopes three pillars — Target Planning,
Coverage Planning, Reporting/Insights — none of which are built beyond DB tables. This
plan covers the first pillar only, deliberately scoped small per the weekly-batch
philosophy just adopted.

**The `target_plan` table already exists, unprotected, in the live DB.** `backend/app/domains/planning/models.py`
defines `TargetPlan`, `CoveragePlan`, `CoveragePlanEntry`, and all three tables are
already present in `docs/Physical-Schema.sql` (confirmed via the live UAT dump) — but
**no Alembic migration created them** (`grep -rl "target_plan" backend/alembic` returns
nothing) and **none of the three have RLS enabled** (no `ENABLE ROW LEVEL SECURITY` or
`CREATE POLICY` for any of them in the schema dump). They're leftover from the
pre-Alembic baseline snapshot (git `a09794d`) referenced in `Deployment-Topology.md`.
Practical exposure today is low — no router touches these tables, so only raw DB access
can read/write them — but it's a real gap to close as part of this build, not a
pre-existing condition to work around.

**Consequence for the migration:** this is not a `create_table` migration (the table
already exists everywhere — Dev, and the future Prod, since Prod inherits Dev/UAT's
lineage). It's an RLS-enable-and-policy migration only, same category as migrations
0018–0020 (`ALTER POLICY` on live tables).

### Role hierarchy (confirmed from the live `opportunity_tier_visibility` policy)

Five tiers, already in use throughout RLS: **Admin, General Manager, SBU Manager, Area
Manager, Sales Staff.** (`Sales Manager` was collapsed into Area Manager — see
`Sales-Manager-Tier-Collapse-Implementation-Plan.md`.) `opportunity_tier_visibility`'s
pattern — Admin/GM unrestricted, SBU Manager sbu-scoped, Area Manager zone-scoped (via
`user_zone`/`zone_closure`) plus direct reports (`manager_id`), else `owner_id = self` —
is the template this plan reuses for `target_plan`.

## Decisions needed before building (Basheer's call)

1. **Who can set targets?** Proposed: SBU Manager (for users in their own SBU), Area
   Manager (for users in their assigned zone(s), within their own SBU), Admin/GM
   (unrestricted). Sales Staff is **read-only**, own row only — targets are
   manager-assigned, not self-set. Confirm this matches how Cabio actually runs target
   setting.
2. **"SBU Target" — computed rollup, not a stored row.** `implementation_plan.md`
   mentions "SBU targets" alongside rep targets, but `BR-PL-01` locks `target_plan` to
   User + SBU + Quarter — there's no schema slot for an SBU-level aggregate row.
   Proposed: an SBU total is `SUM(target_amount_lakhs)` across that SBU's users for the
   period, computed on read, not stored. Confirm this is what "SBU Targets" meant.
3. **Annual vs. quarterly.** The DB only supports quarterly rows (`CHECK` constraint on
   `planning_period` format `YYYY-Qn`). Proposed: annual view is `SUM` of the 4 quarters,
   computed on read — no annual storage, no new migration needed. Confirm.
4. **No approval workflow.** Neither `Business-Rules.md` nor the ADRs mention a
   sign-off/approval state for Target Plans — proposed as straightforward CRUD (a
   manager sets/edits a number, no draft/approved state machine). Flag if Cabio actually
   wants an approval step; that would change the schema (a `status` column) and is worth
   deciding now rather than retrofitting later.
5. **Editing after Coverage Plans exist.** `BR-PL-03` requires an approved Target Plan to
   exist before a Coverage Plan can reference it, but says nothing about locking a Target
   Plan once referenced. Proposed: no lock for this pass (Coverage Planning isn't built
   yet, so it's moot today) — revisit when Coverage Planning ships.

## Backend changes

### Migration — RLS only, `backend/alembic/versions/00XX_target_plan_rls.py`

```sql
ALTER TABLE target_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY target_plan_read ON target_plan FOR SELECT USING (
    cabio_app_role_name() IN ('Admin', 'General Manager')
    OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
    OR (
        cabio_app_role_name() = 'Area Manager'
        AND sbu_id = cabio_app_sbu_id()
        AND user_id IN (
            SELECT up.id FROM user_profile up
            JOIN user_zone uz ON uz.user_id = up.id
            WHERE uz.zone_id IN (
                SELECT descendant_zone_id FROM zone_closure
                WHERE ancestor_zone_id IN (
                    SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid()
                )
            )
        )
        OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
    )
    OR user_id = cabio_app_uid()
);

CREATE POLICY target_plan_write ON target_plan FOR INSERT WITH CHECK ( /* same predicate as target_plan_read, minus the final "OR user_id = cabio_app_uid()" branch — Sales Staff never writes */ );

CREATE POLICY target_plan_update ON target_plan FOR UPDATE
    USING (/* same predicate as target_plan_write */)
    WITH CHECK (/* same predicate as target_plan_write */);

CREATE POLICY target_plan_delete ON target_plan FOR DELETE USING (/* same predicate as target_plan_write */);
```

**Explicit lesson from the notification-feature RLS bugs** (`docs/Progress-Archive-2026-08.md`,
2026-08-24): a `USING`-only policy implicitly reuses itself as `WITH CHECK`, which broke
every real INSERT where the actor differs from the row's subject (recipient ≠ actor
there; manager ≠ subordinate here — same shape). **Write `WITH CHECK` explicitly, don't
rely on the implicit fallback**, and separately: SQLAlchemy's read-your-write
`RETURNING` after INSERT is filtered by `USING`, not `WITH CHECK` — verify a manager can
actually read back the row they just created for a subordinate, not just that the
INSERT succeeds.

Split SELECT from write (mirrors the `product` table's
`product_read_all`/`product_insert_sbu_scoped`/`product_delete_sbu_scoped` pattern)
rather than one combined policy, since Sales Staff's access is read-only-own while
managers' write access is broader than their own row — a single `USING` clause can't
express that asymmetry cleanly.

`coverage_plan`/`coverage_plan_entry` RLS is **out of scope for this pass** — same
zero-RLS gap, but no router touches them yet either, so it's deferred to the Coverage
Planning batch rather than bundled here. Flagged, not silently left.

### Domain: `backend/app/domains/planning/`

- `models.py` — already correct, no changes needed (confirmed field-for-field match
  against the live schema).
- `schemas.py` (new) — `TargetPlanCreate`, `TargetPlanUpdate`, `TargetPlanResponse`
  (include nested `user`/`sbu` per the model's `lazy="joined"` relationships, matching
  `Backend-Implementation-Standards.md`'s response-shape convention), and
  `SBUTargetRollupResponse` (`sbu_id`, `planning_period`, `total_target_amount_lakhs`,
  `user_count`) for decision #2's computed aggregate.
- `repository.py` (new) — `TargetPlanRepository(BaseRepository[TargetPlan])`:
  `list_by_user`, `list_by_sbu_and_period` (for the rollup), `get_by_user_sbu_period`
  (enforces the `UniqueConstraint` at the service layer before insert, same pattern as
  other domains' pre-insert uniqueness checks).
- `service.py` (new) — `TargetPlanService`:
  - `create_target_plan` / `update_target_plan`: explicit role check mirroring
    `OpportunityService`'s SBU-override pattern (BR-OP-12) — raise
    `AuthorizationError` if the caller's role/scope doesn't cover the target `user_id`,
    even though RLS is the DB-level backstop. Both layers matter: RLS prevents the read
    of unauthorized rows, but a clear `AuthorizationError` gives a real error message
    instead of a silent empty/404 result.
  - `get_sbu_rollup(sbu_id, planning_period)`: `SUM(target_amount_lakhs)` +
    `COUNT(user_id)` for decision #2.
- `router.py` (new) — `GET /planning/targets` (filtered by user/sbu/period — RLS narrows
  automatically per caller), `POST /planning/targets`, `PATCH /planning/targets/{id}`,
  `DELETE /planning/targets/{id}`, `GET /planning/targets/rollup` (SBU aggregate).
  Register in `app/main.py` alongside the other domain routers.
- Tests: `test_target_plan_repository.py`, `test_target_plan_service.py` — cover the
  uniqueness constraint, each role's create/update authorization boundary (including the
  negative case — Sales Staff attempting a write), and the rollup calculation. Per
  `Backend-Implementation-Standards.md`'s coverage bar (90% service layer, 100% on the
  business-rule paths — the authorization boundary is exactly that).

## Frontend changes

- `sales-os-app/src/types/targetPlanning.ts` (new) — typed shapes mirroring the backend
  schemas, following the existing pattern (`types/territoryAdmin.ts`) rather than the
  `Promise<unknown>` anti-pattern flagged elsewhere in `docs/Backlog.md`.
- `sales-os-app/src/services/targetPlanning.ts` (new) — `listTargetPlans`,
  `createTargetPlan`, `updateTargetPlan`, `deleteTargetPlan`, `getSBURollup`.
- `sales-os-app/src/screens/TargetPlanningScreen.tsx` (new) — Manager-facing screen:
  period picker (quarter, with an annual roll-up view per decision #3), a table of
  target rows scoped to what the caller's role can see (RLS + backend already narrow
  this — the screen just renders what the API returns), inline edit via the existing
  `FormModal` pattern (per `Frontend-Implementation-Standards.md`), an SBU total banner
  from the rollup endpoint.
- `DemoApp.tsx` nav: add under **ADMINISTRATION** — `{ id: "targetPlanning", label:
  "Target Planning", icon: "🎯", managerOnly: true }`. **Needs a new gating tier**:
  today's `ADMIN_ROLES = new Set(["Admin", "General Manager"])` only covers
  `adminOnly`, but Target Planning must also be visible to SBU Manager and Area
  Manager. Add `MANAGER_ROLES = new Set(["Admin", "General Manager", "SBU Manager",
  "Area Manager"])` and a parallel `managerOnly` nav-item flag, rather than loosening
  `adminOnly`'s existing meaning (User Directory/Territory Map should stay Admin/GM-only).
- Sales Staff: no nav entry for the full screen in this pass (read-only own-target
  display, e.g. on a dashboard, is Reporting-pillar territory — out of scope here, see
  below).

## Out of scope for this pass

- Coverage Planning (next weekly batch) — including `coverage_plan`/`coverage_plan_entry`
  RLS, deferred alongside it.
- Reporting/Insights Dashboard, including any rep-facing "your quota" view — Sales Staff
  gets no UI this pass, per the read-only-own decision above having no consumer yet.
- Approval/sign-off workflow (decision #4) — build as plain CRUD unless Basheer says
  otherwise before work starts.
- BR-OP-06 Stalled Opportunity Detection, Demo Outcome/Handover fields — separate
  Milestone 2 backlog items, unrelated to Target Planning.
- **Annual Development-Activity KPI (non-revenue, count-based, annual target).**
  Raised by Haroon 2026-08-27 — deliberately kept out of `target_plan`, which stays
  revenue-only and quarterly-only for this pass. Gets its own table later, once Sales
  Development Activities exists to compare against. See `docs/Backlog.md`'s "Annual
  Development-Activity KPI" entry — don't redesign this table to accommodate it.

## Verification

- Backend: `pytest` (new tests above), `ruff check app/domains/planning/`.
- Frontend: `tsc --noEmit`, `npm run lint`.
- Manual, role-by-role on Dev (the RLS/role smoke-test checklist the new deploy model
  calls for, `Deployment-Topology.md`): Admin, General Manager, SBU Manager, Area
  Manager, Sales Staff each log in and confirm read scope matches the policy; SBU
  Manager and Area Manager each create a target for an in-scope user and confirm the
  created row reads back immediately (the `RETURNING`-vs-`WITH CHECK` lesson above);
  each attempt an out-of-scope write and confirm a clean `AuthorizationError`, not a
  silent failure; Sales Staff attempts a write and is rejected.
