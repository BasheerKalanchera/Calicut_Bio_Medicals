# Target Planning — Implementation Plan

**Status:** All decisions resolved 2026-09-16 (Basheer) — building now. First Milestone 2
feature, targeted for this week's incremental deploy under the new 2-region Dev/Prod model
(`docs/Deployment-Topology.md`). Product-category splitting (PRD 6.5's other half) deferred
to Phase 2 — this pass ships the flat user/SBU/quarter design as originally scoped.

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
lineage). Originally scoped as RLS-enable-and-policy only, same category as migrations
0018–0020 (`ALTER POLICY` on live tables) — **no longer true** once the approval
workflow was decided (§ Decisions, item 4): it now also adds three real columns
(`status`, `approved_by`, `approved_at`). See Backend changes below for the combined
migration.

### Role hierarchy (confirmed from the live `opportunity_tier_visibility` policy)

Five tiers, already in use throughout RLS: **Admin, General Manager, SBU Manager, Area
Manager, Sales Staff.** (`Sales Manager` was collapsed into Area Manager — see
`Sales-Manager-Tier-Collapse-Implementation-Plan.md`.) `opportunity_tier_visibility`'s
pattern — Admin/GM unrestricted, SBU Manager sbu-scoped, Area Manager zone-scoped (via
`user_zone`/`zone_closure`) plus direct reports (`manager_id`), else `owner_id = self` —
is the template this plan reuses for `target_plan`.

## Decisions needed before building — resolved 2026-09-11 (Basheer)

1. **Who can set targets? DECIDED: everyone sets their own — not manager-assigned.**
   Reverses the original proposal. Every role, including Sales Staff, creates/edits
   their own `target_plan` row for themselves. Paired with decision 4 below — a
   self-set target isn't final until approved.
2. **"SBU Target" — computed rollup, not a stored row. DECIDED: matches the
   proposal.** `SUM(target_amount_lakhs)` across that SBU's users for the period,
   computed on read, not stored.
3. **Annual vs. quarterly. DECIDED: matches the proposal.** Annual view is `SUM` of
   the 4 quarters, computed on read — no annual storage, no new migration needed.
4. **Approval workflow. DECIDED: a real, single-hop approval step exists — not the
   plain-CRUD original proposal, and not a multi-level chain either.** A target isn't
   final until the setter's own direct manager approves it. Concretely: **Sales Staff's
   target is approved by their Area Manager; an Area Manager's own target is approved
   by GM** — there is no SBU Manager currently active in the org (the role tier exists
   in RBAC, just nobody holds it today).
   **Built generically, not hardcoded to today's two levels:** the approver for any
   target is resolved by walking the real reporting chain — `user_profile.manager_id`
   for the person who set the target, whoever that is. Nothing in the approval logic
   checks a role name (`'Area Manager'`, `'GM'`, etc.) — it just asks "who is this
   person's manager," the same lookup regardless of how many tiers exist. **This means
   if SBU Manager becomes a populated role later, the extra approval hop appears
   automatically, with zero code change** — the generic walk just finds one more link
   in the chain. Same reasoning `TEAM_SCOPE_BUILDERS`/RLS already uses `manager_id`
   for elsewhere in this codebase, applied to approval instead of visibility.
   **Resolved 2026-09-16 (Basheer):**
   - **Who approves the target of whoever sits at the very top of the chain** (today:
     GM, whose `manager_id` is `NULL`)? **DECIDED: must be a different person —
     specifically the separate Admin account, never GM themselves.** Reverses the
     proposed auto-approved default. Implemented as one small, general fix rather than
     a GM-specific special case: the existing "Admin/GM can approve anything" override
     (§ Backend changes below) gets an added `AND user_id != cabio_app_uid()` /
     `current_user.id != target_plan.user_id` condition at both the RLS and service
     layer — nobody may approve their own row, full stop. Since `get_approver_id`
     returns `NULL` for GM (no `manager_id`), and the override now excludes self, the
     only path left to approve GM's target is another Admin/GM user who isn't GM
     themselves — in practice, the separate Admin account. No hardcoded "if this is
     the GM" branch anywhere.
   - **Does a quarter-end revision (decision 5) require re-approval?** **DECIDED: yes**
     — matches the proposed default. Editing `target_amount_lakhs` after `APPROVED`
     resets `status` to `PENDING_APPROVAL` and clears `approved_by`/`approved_at`.
   - **Does a target "count" while still pending approval** — visible/usable as-is to
     anything that reads target data (e.g. the SBU rollup below, or a future
     Attainment % dashboard tile)? **DECIDED: yes, pending counts too** — reverses the
     proposed "APPROVED only" default. The rollup and any future reporting sum every
     row regardless of `status`, showing the full picture (drafts included), not just
     committed numbers.
5. **Editing after Coverage Plans exist / quarterly revision. DECIDED, and adds a
   normal-workflow detail beyond the original proposal.** No hard lock (matches the
   original proposal — Coverage Planning isn't built yet, so moot today either way).
   **New:** a quarter's plan is expected to be revised at the end of that quarter, to
   re-align with the reality of how execution actually went — this is a normal,
   expected action, not an edge case to design around defensively. See decision 4's
   open re-approval question above for how a revision interacts with an already-
   approved plan.

## Backend changes

**No longer an RLS-only migration** — the approval workflow decided above (§4) needs
real new columns, since none of `status`/`approved_by`/`approved_at` exist on
`TargetPlan` today (confirmed against `backend/app/domains/planning/models.py`).
Combine the column addition and the RLS enable into one migration rather than two.

### Migration, `backend/alembic/versions/00XX_target_plan_approval_and_rls.py`

```sql
ALTER TABLE target_plan ADD COLUMN status varchar(20) NOT NULL DEFAULT 'PENDING_APPROVAL';
ALTER TABLE target_plan ADD COLUMN approved_by uuid REFERENCES user_profile(id);
ALTER TABLE target_plan ADD COLUMN approved_at timestamptz;
ALTER TABLE target_plan ADD CONSTRAINT ck_target_plan_status
    CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED'));

ALTER TABLE target_plan ENABLE ROW LEVEL SECURITY;

-- Read: unchanged broad tier-based visibility — this part isn't affected by who's
-- allowed to write or approve.
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

-- Insert: everyone inserts only their own row — decision #1's reversal.
CREATE POLICY target_plan_write ON target_plan FOR INSERT WITH CHECK (
    user_id = cabio_app_uid()
);

-- Update: the row's own owner (revising their number — decision #5), OR that owner's
-- direct manager (approving/rejecting it — decision #4's single-hop design, resolved
-- purely via manager_id, no role name check), OR Admin/GM as the unrestricted overlay
-- tier used everywhere else in this app -- EXCEPT on their own row: nobody may
-- approve their own target, so the Admin/GM override explicitly excludes self. This
-- is what forces GM's own target through the separate Admin account (resolved
-- 2026-09-16) without a GM-specific special case: get_approver_id(GM) is NULL (no
-- manager_id), and the override now skips GM approving GM, so only another Admin/GM
-- user can act on it.
CREATE POLICY target_plan_update ON target_plan FOR UPDATE
    USING (
        user_id = cabio_app_uid()
        OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
        OR (cabio_app_role_name() IN ('Admin', 'General Manager') AND user_id != cabio_app_uid())
    )
    WITH CHECK (
        user_id = cabio_app_uid()
        OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
        OR (cabio_app_role_name() IN ('Admin', 'General Manager') AND user_id != cabio_app_uid())
    );

CREATE POLICY target_plan_delete ON target_plan FOR DELETE USING (
    user_id = cabio_app_uid() OR cabio_app_role_name() IN ('Admin', 'General Manager')
);
```

**RLS only gets you "can touch this row" — it can't tell an owner's revision apart
from a manager's approval on the same row.** Both land in the same `UPDATE` policy
above (the owner and the manager both pass the `USING`/`WITH CHECK` predicate). The
real distinction — an owner may change `target_amount_lakhs` but never `status`/
`approved_by` themselves; only the resolved approver may flip `status` to `APPROVED`/
`REJECTED` — has to be enforced at the service layer (§ below), the same "RLS is the
backstop, the service layer gives a clear error" split this doc already uses elsewhere.

**Explicit lesson from the notification-feature RLS bugs** (`docs/Progress-Archive-2026-08.md`,
2026-08-24): a `USING`-only policy implicitly reuses itself as `WITH CHECK`, which broke
every real INSERT where the actor differs from the row's subject (recipient ≠ actor
there; manager ≠ subordinate here — same shape). **Write `WITH CHECK` explicitly, don't
rely on the implicit fallback**, and separately: SQLAlchemy's read-your-write
`RETURNING` after INSERT is filtered by `USING`, not `WITH CHECK` — verify a manager can
actually read back the row they just created for a subordinate, not just that the
INSERT succeeds.

`coverage_plan`/`coverage_plan_entry` RLS is **out of scope for this pass** — same
zero-RLS gap, but no router touches them yet either, so it's deferred to the Coverage
Planning batch rather than bundled here. Flagged, not silently left.

### Domain: `backend/app/domains/planning/`

- `models.py` — **needs the three new columns** (`status`, `approved_by`,
  `approved_at`) added to `TargetPlan`, no longer "no changes needed" as originally
  scoped — that assumption predates the approval-workflow decision.
- `schemas.py` (new) — `TargetPlanCreate`, `TargetPlanUpdate`, `TargetPlanResponse`
  (include nested `user`/`sbu` per the model's `lazy="joined"` relationships, matching
  `Backend-Implementation-Standards.md`'s response-shape convention, plus `status`/
  `approved_by`/`approved_at`), a separate `TargetPlanApprovalDecision` (`status`:
  `APPROVED`|`REJECTED`, optional `note`) for the approve/reject action specifically —
  kept distinct from `TargetPlanUpdate` so the owner-editing-their-number path and the
  manager-approving path are two different request shapes, not one overloaded PATCH,
  and
  `SBUTargetRollupResponse` (`sbu_id`, `planning_period`, `total_target_amount_lakhs`,
  `user_count`) for decision #2's computed aggregate.
- `repository.py` (new) — `TargetPlanRepository(BaseRepository[TargetPlan])`:
  `list_by_user`, `list_by_sbu_and_period` (for the rollup), `get_by_user_sbu_period`
  (enforces the `UniqueConstraint` at the service layer before insert, same pattern as
  other domains' pre-insert uniqueness checks).
- `service.py` (new) — `TargetPlanService`:
  - `get_approver_id(user_id)`: the one piece of logic that makes the approval chain
    generic — just returns that user's own `user_profile.manager_id`. No role check,
    no hardcoded tier list. Whatever the org chart says today (Area Manager → GM,
    2 hops) or says later (Area Manager → SBU Manager → GM, 3 hops) falls out of this
    same one-line lookup automatically, since it's reading the real reporting line,
    not reimplementing it.
  - `create_target_plan`: any authenticated user creates their own row
    (`user_id = current_user.id`, enforced in the service even though RLS backs it up
    too) — `status` defaults to `PENDING_APPROVAL`.
  - `update_target_plan` (owner revising their number, decision #5): raise
    `AuthorizationError` unless `current_user.id == target_plan.user_id`. **Resolved:**
    if the row's current `status == 'APPROVED'`, revising `target_amount_lakhs` resets
    `status` to `PENDING_APPROVAL` and clears `approved_by`/`approved_at` — a revision
    always needs a fresh sign-off.
  - `approve_or_reject_target_plan`: raise `AuthorizationError` unless
    `current_user.id == get_approver_id(target_plan.user_id)` or (the caller is
    Admin/GM **and** `current_user.id != target_plan.user_id` — resolved 2026-09-16,
    nobody approves their own row). Sets `status`, `approved_by = current_user.id`,
    `approved_at = now()`.
  - `get_sbu_rollup(sbu_id, planning_period)`: `SUM(target_amount_lakhs)` +
    `COUNT(user_id)` for decision #2. **Resolved:** sums every row regardless of
    `status` — pending targets count too, so the rollup shows the full picture
    including drafts, not just committed numbers.
  - All three mutating methods raise a clear `AuthorizationError` on a failed check
    rather than relying on RLS alone to silently return nothing — RLS is the DB-level
    backstop, the service layer is what gives the caller a real error message instead
    of a confusing empty/404 result.
- `router.py` (new) — `GET /planning/targets` (filtered by user/sbu/period — RLS narrows
  automatically per caller), `POST /planning/targets`, `PATCH /planning/targets/{id}`,
  `POST /planning/targets/{id}/approve`, `POST /planning/targets/{id}/reject`,
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
  `createTargetPlan`, `updateTargetPlan`, `approveTargetPlan`, `rejectTargetPlan`,
  `deleteTargetPlan`, `getSBURollup`.
- `sales-os-app/src/screens/TargetPlanningScreen.tsx` (new) — **every role gets this
  screen now**, not manager-only, since everyone sets their own target (decision #1's
  reversal). What renders differs by what the caller can do, all driven by what the
  API already returns — no separate screens per role:
  - Everyone sees their own target row for the selected period (quarter picker, with
    the annual roll-up view per decision #3), with its `status` shown plainly
    (Pending Approval / Approved / Rejected), and can create/revise their own number
    via the existing `FormModal` pattern (per `Frontend-Implementation-Standards.md`).
  - Anyone who is someone else's resolved approver (i.e. appears as another user's
    `manager_id`) additionally sees a "Needs your approval" section listing their
    direct reports' pending targets, with Approve/Reject actions — this is not a
    role check in the frontend either, it's just "does the API return anything in
    that section for me," same generic-by-construction approach as the backend.
  - SBU Manager/Area Manager/Admin/GM additionally see the team table + SBU total
    banner from the rollup endpoint, scoped by whatever RLS + backend already narrow
    it to (unchanged from the original design).
- `DemoApp.tsx` nav: add under **SALES EXECUTION** (not Administration — every role
  needs this now, same reasoning as the Insights Dashboard's own nav placement),
  `{ id: "targetPlanning", label: "Target Planning", icon: "🎯" }`, no role gate on
  visibility. Simpler than the original plan's proposed `MANAGER_ROLES` gating tier —
  that's no longer needed since this isn't manager-only anymore.

## Out of scope for this pass

- Coverage Planning (next weekly batch) — including `coverage_plan`/`coverage_plan_entry`
  RLS, deferred alongside it.
- Reporting/Insights Dashboard's own Attainment %/Revenue-vs-Target tiles (Batch 2,
  separate plan) — this pass only builds Target Planning itself, including the
  Sales Staff-facing screen (no longer out of scope, see Frontend changes above).
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
  calls for, `Deployment-Topology.md`): every role logs in and creates their own
  target, confirms it reads back immediately as `PENDING_APPROVAL` (the
  `RETURNING`-vs-`WITH CHECK` lesson above); a Sales Staff's Area Manager sees it in
  their "Needs your approval" section and approves it, confirms the Sales Staff sees
  the status flip; an Area Manager's own target is approved by GM the same way;
  someone who is *not* the resolved approver (e.g. a different Area Manager, or the
  Sales Staff's own peer) attempts to approve it and gets a clean `AuthorizationError`,
  not a silent failure; each role attempts to directly edit another user's target
  amount (not just approve it) and is rejected the same way.
