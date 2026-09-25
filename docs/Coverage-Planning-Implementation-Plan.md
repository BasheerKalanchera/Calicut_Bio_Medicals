# Coverage Planning — Implementation Plan

**Status:** Draft — planned, not yet built. Third Milestone 2 batch — see sequencing
recommendation below.

> **Scope expanded 2026-09-24 (demo to Haroon/Latheef Bhai) — this plan needs
> revisiting before build.** Each salesperson's quarterly target is now to be
> divided among the hospitals in their coverage area by each hospital's Business
> Potential (High/Medium/Low), alongside visit frequency; hospital-wise targets
> roll up to Zone/SBU/company, with actual-vs-target shown on the Insights
> Dashboard. This plan's per-entry `target_revenue_lakhs` is the natural home for
> the hospital-wise number, but nothing here requires those entries to add up to
> the Target Plan, and the reconciliation with the brand-wise split is undecided.
> Open questions: `docs/Backlog.md`, "Hospital-wise target planning".

## Context

Third pillar of `implementation_plan.md`'s Milestone 2 scope, and the middle link in
ADR-013's Target → Coverage → Opportunity → Revenue hierarchy. Per `BR-PL-02`
("Coverage Plan Strategy — Replaces Beat Planning"), this is deliberately **not**
visit-frequency route planning — it's a rep's quarterly strategic plan: which accounts
to focus on, why (`strategic_objective`), and how much revenue each is expected to
contribute (`target_revenue_lakhs`). `ADR-002` explicitly rejected calendar-based Beat
Planning in favor of this.

Same starting condition as Target Planning: `coverage_plan`/`coverage_plan_entry` tables
already exist in the live DB (`backend/app/domains/planning/models.py`, confirmed
matching `Physical-Schema.sql`), never went through Alembic, and have **zero RLS**. No
`create_table` needed anywhere. **Originally scoped as RLS-enable-and-policy only —
no longer true** once the approval workflow was decided (see Decisions, item 1): same
correction as Target Planning's plan, this migration also adds `status`/`approved_by`/
`approved_at` columns to `coverage_plan`.

**Quarterly-only, confirmed 2026-09-11 (Basheer) — no schema change needed.**
`coverage_plan.planning_period` already carries the exact same `CHECK` constraint as
`target_plan` (`^\d{4}-Q[1-4]$`) — Coverage Planning was already quarterly-only by
construction, this just confirms it's the intended cadence, not an accident to fix.

### Key structural fact: `BR-PL-03` is already half-enforced by the schema

`BR-PL-03` ("Coverage Plans cannot be created unless a Target Plan exists for the same
User, SBU, and Planning Period") looks like it needs a service-layer existence check —
but `coverage_plan.target_plan_id` is already `NOT NULL` and FK-constrained to
`target_plan.id`. **You cannot construct a `coverage_plan` row without picking an
existing `target_plan` row at all** — the FK does that part for free. What the FK
*doesn't* guarantee: that the chosen `target_plan` actually belongs to the same
`user_id` and `planning_period` as the `coverage_plan` being created (both are
independently stored, redundantly, on `coverage_plan` itself — `user_id` and
`planning_period` columns exist there too, not just `target_plan_id`). **That
consistency check is the one real piece of `BR-PL-03` logic to write** — everything else
is already structural.

Same "approved" wording gap as flagged in Target Planning's plan: `BR-PL-03`'s Rule line
says "an *approved* Target Plan," but the Constraint line and the actual schema have no
approval/status concept. Carries the same open decision from Target Planning's plan
(#4) — resolve once, applies to both.

### `account` has no RLS and no `sbu_id` — real constraints on how territory-restriction gets built

Checked: `account` table has `zone_id` but no `sbu_id`, and **no RLS policy at all** —
accounts are globally visible to every authenticated user (visibility is enforced at
Opportunity/Activity granularity elsewhere in this app, not at Account level — an
established pattern, not new).

**Decided (Basheer, 2026-09-11): Account selection is restricted to the rep's own
territory.** This is a genuinely new precedent — the rest of the app (e.g. Opportunity
creation) never restricts Account choice by zone, so this is Coverage Planning
introducing the app's first such restriction, not fixing an inconsistency with
something else. **Only buildable via `zone_id`, not `sbu_id`** — since `account` has
no SBU of its own, "the rep's own territory" can only mean zone-based matching: the
account's `zone_id` must fall within the zones assigned to the plan's owner (via
`user_zone`/`zone_closure`, same descendant-zone lookup already used throughout this
app's RLS). Proposed to enforce this as a **service-layer check when an entry is
added** (`add_entry`, a `BusinessRuleViolation` with a clear message if the chosen
account is outside the rep's zones), not as an RLS policy on `coverage_plan_entry` —
`account` itself still has no RLS at all (unchanged, out of scope here), so a clean
error at the point of adding the entry is more useful than trying to bolt a zone check
onto a table that isn't otherwise scoped.

### `BR-PL-04` — downstream link to Opportunity Pipeline, not built here

`BR-PL-04` requires Coverage-originated Opportunities to carry `lead_source_id =
COVERAGE_PLAN`. The `LeadSource` master value already exists (confirmed in
`Business-Rules.md`'s Lead Source table). **No direct FK from Opportunity to
`coverage_plan_entry` exists in Phase 1** (explicit in the rule text) — so there's no
code change needed in the Opportunity domain for this pass; a rep just picks
`COVERAGE_PLAN` as the Lead Source manually when creating an Opportunity that came from
their coverage plan, same as any other Lead Source value today.

## Decisions needed before building — resolved 2026-09-11, one item still open

1. **Who authors a Coverage Plan? DECIDED: self-service, approved by the rep's
   manager — the same shape as Target Planning, not the "self-service + manager
   delegation" originally proposed here.** The rep creates/edits their own plan; it
   isn't final until their manager approves it. **Reuses Target Planning's exact
   mechanism, not a parallel implementation:** the same generic, no-hardcoded-role-
   name approver resolution (`get_approver_id` — whoever the plan owner's own
   `manager_id` points to) and the same `status` (`PENDING_APPROVAL`/`APPROVED`/
   `REJECTED`)/`approved_by`/`approved_at` column shape, added to `coverage_plan` this
   time. **Manager create-on-behalf-of-a-subordinate (delegation) is dropped** to
   match Target Planning's shape exactly — a manager's role here is approving, not
   authoring someone else's plan.
2. **Account selection — territory-restricted or open? DECIDED: restricted to the
   rep's own territory.** Reverses the original "leave it open" proposal. See the
   `account` has no RLS/`sbu_id` note above for how this actually gets enforced
   (zone-based, at entry-creation time, service-layer check).
3. ~~**`coverage_frequency` — free text or a controlled vocabulary?**~~ — **DECIDED:
   a fixed picklist, label set confirmed (Basheer, 2026-09-11): Weekly / Bi-weekly /
   Monthly / Quarterly / As-needed.** **Superseded by a live-editable reference table,
   not a hardcoded picklist or free-text field** — see `docs/Reference-Data-
   Management-Screen-Implementation-Plan.md`, raised the same session so Cabio staff
   can add/rename/retire these labels themselves later. `coverage_plan_entry` gets
   `coverage_frequency_id` (FK to the new `coverage_frequency` table), **not** the
   plain `string(50)` column originally proposed here — that plan's own migration
   creates and seeds the table; this plan just consumes it.
4. ~~**"Approved Target Plan" wording**~~ — **RESOLVED via Target Planning's own
   decision #4.** `target_plan` now has a real `status` column, so `BR-PL-03`'s "an
   *approved* Target Plan must exist" is a literal, checkable condition
   (`target_plan.status == 'APPROVED'`) — not just "does a row exist" as originally
   scoped. See `create_coverage_plan` below for where this gets enforced.

## Backend

**No longer an RLS-only migration** — same correction as Target Planning's plan, for
the same reason: the approval workflow (decision 1) needs real columns.

### Migration, `backend/alembic/versions/00XX_coverage_plan_approval_and_rls.py`

Both tables need policies. `coverage_plan` needs the full tier-visibility predicate
for reads (same shape as `target_plan`'s, adapted) plus the same self-insert /
owner-or-approver-update write shape Target Planning uses; `coverage_plan_entry` just
inherits through its parent, same idiom as `activity_tier_visibility`/
`document_tier_visibility` (`coverage_plan_id IN (SELECT id FROM coverage_plan)`),
since RLS on the parent already does the real filtering.

```sql
ALTER TABLE coverage_plan ADD COLUMN status varchar(20) NOT NULL DEFAULT 'PENDING_APPROVAL';
ALTER TABLE coverage_plan ADD COLUMN approved_by uuid REFERENCES user_profile(id);
ALTER TABLE coverage_plan ADD COLUMN approved_at timestamptz;
ALTER TABLE coverage_plan ADD CONSTRAINT ck_coverage_plan_status
    CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED'));

ALTER TABLE coverage_plan ENABLE ROW LEVEL SECURITY;

-- Read: unchanged broad tier-based visibility.
CREATE POLICY coverage_plan_read ON coverage_plan FOR SELECT USING (
    cabio_app_role_name() IN ('Admin', 'General Manager')
    OR user_id IN (
        SELECT id FROM user_profile WHERE
            (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
            OR (cabio_app_role_name() = 'Area Manager' AND sbu_id = cabio_app_sbu_id() AND (
                id IN (
                    SELECT uz.user_id FROM user_zone uz
                    WHERE uz.zone_id IN (
                        SELECT descendant_zone_id FROM zone_closure
                        WHERE ancestor_zone_id IN (SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid())
                    )
                )
                OR manager_id = cabio_app_uid()
            ))
    )
    OR user_id = cabio_app_uid()
);

-- Insert: everyone inserts only their own plan — decision #1's self-service half.
CREATE POLICY coverage_plan_write ON coverage_plan FOR INSERT WITH CHECK (
    user_id = cabio_app_uid()
);

-- Update: the plan's own owner (revising it) OR that owner's direct manager
-- (approving/rejecting it, resolved purely via manager_id — decision #1's approval
-- half, same mechanism as target_plan) OR Admin/GM.
CREATE POLICY coverage_plan_update ON coverage_plan FOR UPDATE
    USING (
        user_id = cabio_app_uid()
        OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
        OR cabio_app_role_name() IN ('Admin', 'General Manager')
    )
    WITH CHECK (
        user_id = cabio_app_uid()
        OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
        OR cabio_app_role_name() IN ('Admin', 'General Manager')
    );

CREATE POLICY coverage_plan_delete ON coverage_plan FOR DELETE USING (
    user_id = cabio_app_uid() OR cabio_app_role_name() IN ('Admin', 'General Manager')
);
-- Same split-role note as Target Planning: RLS can't tell an owner's revision apart
-- from a manager's approval on the same UPDATE policy — that distinction (owner may
-- change plan fields but not `status`; only the resolved approver may flip `status`)
-- is enforced at the service layer, not here. Explicit WITH CHECK on every write
-- policy, not relying on the USING fallback -- same lesson as Target Planning and the
-- notification-feature RLS bugs: a manager approving a subordinate's plan is actor !=
-- row-subject, and the read-your-write RETURNING check must be verified, not assumed.

ALTER TABLE coverage_plan_entry ENABLE ROW LEVEL SECURITY;

CREATE POLICY coverage_plan_entry_tier_visibility ON coverage_plan_entry USING (
    coverage_plan_id IN (SELECT id FROM coverage_plan)
);
-- Single combined policy (covers SELECT and all writes) -- correct here because,
-- unlike coverage_plan, entries have no independent authorization dimension beyond
-- "can I see/touch the parent plan" -- the parent's split read/write policies already
-- did the real work.
```

Note `coverage_plan` has no `sbu_id` column of its own — the tier predicate joins
through the owning `user_profile.sbu_id`, unlike `target_plan`'s direct column check.

### Domain: `backend/app/domains/planning/` (extends the module Target Planning creates)

- `models.py` — `CoveragePlan` needs the same three new columns as `TargetPlan`
  (`status`, `approved_by`, `approved_at`).
- `schemas.py` — add `CoveragePlanCreate`/`Update`/`Response` (plus `status`/
  `approved_by`/`approved_at`), a separate `CoveragePlanApprovalDecision` (mirrors
  `TargetPlanApprovalDecision`, kept distinct from `Update` for the same reason —
  owner-editing and manager-approving are different request shapes), and
  `CoveragePlanEntryCreate`/`Update`/`Response` (nested `account` and
  `coverage_frequency` per the model's `lazy="joined"` — the latter now an FK
  relationship, not a plain string field, per the Reference Data Management Screen
  plan).
- `repository.py` — add `CoveragePlanRepository`, `CoveragePlanEntryRepository`
  (one repository per aggregate root per `Backend-Implementation-Standards.md` — entry
  is a child of plan, so it's managed through `CoveragePlanRepository`, mirroring how
  `OpportunityItem` is managed through `OpportunityRepository`, not given its own
  standalone repository).
- `service.py` — add `CoveragePlanService`:
  - **Reuses `TargetPlanService.get_approver_id`** rather than reimplementing it —
    worth promoting that lookup to a shared location (e.g. `organization/service.py`,
    alongside `TEAM_SCOPE_BUILDERS`) now that a second domain needs the identical
    "who is this user's manager" resolution, instead of two copies of the same
    one-line query.
  - `create_coverage_plan`: any authenticated user creates their own plan
    (`user_id = current_user.id`, enforced in the service even though RLS backs it up
    too) — `status` defaults to `PENDING_APPROVAL`. Validates the `BR-PL-03`
    consistency check described above (`target_plan.user_id ==
    coverage_plan.user_id`, `target_plan.planning_period ==
    coverage_plan.planning_period`, **and now also `target_plan.status ==
    'APPROVED'`** per decision #4's resolution — `BusinessRuleViolation` if any of the
    three don't hold).
  - `approve_or_reject_coverage_plan`: same shape as Target Planning's
    `approve_or_reject_target_plan` — raise `AuthorizationError` unless
    `current_user.id == get_approver_id(coverage_plan.user_id)` or the caller is
    Admin/GM.
  - `add_entry`/`update_entry`/`remove_entry`: enforces `BR-PL-02`'s mandatory
    `strategic_objective` + `target_revenue_lakhs` per entry, the
    `coverage_plan_entry_unique (coverage_plan_id, account_id)` constraint (friendly
    `BusinessRuleViolation` instead of a raw DB uniqueness error, matching this
    codebase's existing pre-insert-check convention), **and decision #2's territory
    restriction** — the chosen account's `zone_id` must fall within the plan owner's
    assigned zones (`user_zone`/`zone_closure`, same descendant-zone lookup used in the
    RLS above), `BusinessRuleViolation` with a clear message if it doesn't.
- `router.py` — extend the same `planning` router Target Planning creates:
  `GET/POST /planning/coverage-plans`, `PATCH/DELETE /planning/coverage-plans/{id}`,
  `POST /planning/coverage-plans/{id}/approve`, `POST /planning/coverage-plans/{id}/reject`,
  `POST/PATCH/DELETE /planning/coverage-plans/{id}/entries/{entry_id}`.
- Tests: the `BR-PL-03` consistency check (mismatched user/period/unapproved-target all
  rejected), entry uniqueness, the territory-restriction rejection (out-of-zone account
  on `add_entry`), and the same approval-boundary test shape as Target Planning
  (self-authorship succeeds, a non-approver's approval attempt is rejected, the
  resolved approver's approval succeeds and is read back immediately).

## Frontend

- `sales-os-app/src/screens/CoveragePlanningScreen.tsx` (new) — **same
  every-role-gets-it, approval-aware shape as `TargetPlanningScreen.tsx`**, not the
  original "Sales Staff-primary, managers view/edit a subordinate's plan" design
  (delegation was dropped per decision #1):
  - Everyone sees their own plan for the selected quarter — a list of their Coverage
    Plan Entries (Account, Strategic Objective, Target Revenue, Frequency), an Account
    picker restricted to their own territory (decision #2 — reuse the existing Account
    search/picker component, e.g. `Customer360Screen.tsx`'s or
    `QuickLeadModal.tsx`'s, filtered server-side rather than building a new picker),
    inline edit via `FormModal`, and a plainly-shown `status` (Pending Approval /
    Approved / Rejected).
  - Anyone who is someone else's resolved approver sees the same "Needs your approval"
    section pattern as Target Planning, listing their direct reports' pending
    Coverage Plans with Approve/Reject actions.
- `DemoApp.tsx` nav: add under **SALES EXECUTION** — `{ id: "coveragePlanning", label:
  "Coverage Planning", icon: "🧭" }`, no role gate on visibility. Unchanged from the
  original plan on this point.
- `services/coveragePlanning.ts` — add `approveCoveragePlan`/`rejectCoveragePlan`
  alongside the existing CRUD methods, mirroring Target Planning's service shape.
- `types/coveragePlanning.ts` — typed, same convention as the other two plans.

## Out of scope for this pass

- Any change to Opportunity creation to auto-link back to a specific
  `coverage_plan_entry` — `BR-PL-04` explicitly says no such FK exists in Phase 1.
- Beat Plan Compliance / Progress reporting (PRD A.2.1/A.2.2) — this is Reporting
  Batch 2 territory (`Insights-Dashboard-Implementation-Plan.md`), consumes this
  data, doesn't need to ship alongside it.
- Manager create-on-behalf-of-a-subordinate — deliberately dropped (decision #1), not
  deferred; Coverage Plans are self-authored only, same as Target Plans.

## Verification

- Backend: `pytest`, `ruff check app/domains/planning/`.
- Frontend: `tsc --noEmit`, `npm run lint`.
- Manual, role-by-role on Dev: every role creates their own plan, confirms it reads
  back immediately as `PENDING_APPROVAL`; a Sales Staff's Area Manager sees it in
  their "Needs your approval" section and approves it; the `BR-PL-03` consistency
  check is rejected with a clear error (not a 500) for a mismatched `target_plan_id`,
  a mismatched period, *and* an unapproved `target_plan` (the newly-added third case);
  adding an entry with an out-of-territory account is rejected with a clear error
  (decision #2); each role's read scope matches the policy; someone who is *not* the
  resolved approver attempts to approve a plan and gets a clean `AuthorizationError`.

---

## Sequencing recommendation: slot 3, after Reporting Batch 1

Milestone 2 rollout order, updated from the original Target → Coverage → Reporting
sequence:

1. **Target Planning** (this week) — hard prerequisite for Coverage Planning via
   `BR-PL-03`'s FK; no dependency on anything else.
2. **Reporting Batch 1** (next week) — zero dependency on either Target or Coverage
   Planning; delivers immediate value on data already flowing in, per the adoption
   rationale already agreed.
3. **Coverage Planning** (this plan) — slots here, not before Reporting Batch 1.
4. **Reporting Batch 2** (attainment %, Pipeline Coverage Ratio, Beat Plan Compliance)
   — needs both Target *and* Coverage Planning data to exist, so it's necessarily last.

**Why Coverage Planning goes after Reporting Batch 1, not before it:** Coverage
Planning is *new data-entry work for reps* — a rep has to sit down and build a
quarterly account plan before it produces any value to anyone. That's the same
"adoption before more features" tension that motivated moving Reporting Batch 1 ahead
of Coverage Planning in the first place. Reporting Batch 1 needs zero new behavior from
the sales team and pays off immediately for Managers; Coverage Planning needs the team
to adopt a new planning habit before it pays off. Shipping the free win first, then the
adoption-dependent one, keeps the same philosophy consistent across the whole
sequence — not just applied once and abandoned for the next decision.
