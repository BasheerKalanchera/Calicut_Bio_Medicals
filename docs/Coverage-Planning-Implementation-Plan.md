# Coverage Planning — Implementation Plan

**Status:** Draft — planned, not yet built. Third Milestone 2 batch — see sequencing
recommendation below.

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
matching `Physical-Schema.sql`), never went through Alembic, and have **zero RLS**. This
plan's migration is RLS-enable-and-policy only, same as Target Planning's — no
`create_table` needed anywhere.

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

### `account` has no RLS and no `sbu_id` — a real design constraint, not an oversight

Checked: `account` table has `zone_id` but no `sbu_id`, and **no RLS policy at all** —
accounts are globally visible to every authenticated user (visibility is enforced at
Opportunity/Activity granularity elsewhere in this app, not at Account level — an
established pattern, not new). Consequence: nothing in the data model stops a rep from
adding an out-of-territory account to their Coverage Plan. Flagged as a design question
below rather than inventing a new restriction unilaterally — the rest of the app doesn't
restrict Account selection by zone either (e.g. Opportunity creation), so adding one here
would be a new precedent, not a consistency fix.

### `BR-PL-04` — downstream link to Opportunity Pipeline, not built here

`BR-PL-04` requires Coverage-originated Opportunities to carry `lead_source_id =
COVERAGE_PLAN`. The `LeadSource` master value already exists (confirmed in
`Business-Rules.md`'s Lead Source table). **No direct FK from Opportunity to
`coverage_plan_entry` exists in Phase 1** (explicit in the rule text) — so there's no
code change needed in the Opportunity domain for this pass; a rep just picks
`COVERAGE_PLAN` as the Lead Source manually when creating an Opportunity that came from
their coverage plan, same as any other Lead Source value today.

## Decisions needed before building (Basheer's call)

1. **Who authors a Coverage Plan?** Proposed: **self-service** — the owning Sales Staff
   rep creates/edits their own plan (opposite of Target Planning, where Sales Staff is
   read-only and a manager sets the number). Managers (SBU Manager, Area Manager,
   Admin/GM) can also create/edit on a subordinate's behalf (oversight/delegation), but
   the default flow is the rep planning their own quarter against the target their
   manager already set. Confirm this matches intent — it's the natural reading of
   "planning" as a rep activity, but worth stating explicitly since it's the reverse
   permission shape from Target Planning.
2. **Account selection — territory-restricted or open?** Per the note above, nothing
   else in the app restricts Account choice by zone/SBU. Proposed: leave it open (any
   account the rep can see — which today is all of them) for this pass, rather than
   inventing a new zone-matching rule with no precedent elsewhere. Flag if Cabio
   actually wants coverage entries constrained to the rep's assigned zone(s).
3. **`coverage_frequency` — free text or a controlled vocabulary?** `BR-PL-02` forbids
   a numeric visit-count field but allows this nullable string(50). Proposed: a small
   fixed picklist (e.g. Weekly / Bi-weekly / Monthly / Quarterly / As-needed) rather
   than free text, for reporting consistency (Batch 2's Beat Plan Compliance metric
   would otherwise have to parse free text). Confirm the exact label set with Basheer.
4. **"Approved Target Plan" wording** — same open item as Target Planning's plan #4;
   resolving that also resolves this one.

## Backend

### Migration — RLS only, `backend/alembic/versions/00XX_coverage_plan_rls.py`

Both tables need policies. `coverage_plan` needs the full tier-visibility predicate
(same shape as `target_plan`'s, adapted — see below); `coverage_plan_entry` just
inherits through its parent, same idiom as `activity_tier_visibility`/
`document_tier_visibility` (`coverage_plan_id IN (SELECT id FROM coverage_plan)`),
since RLS on the parent already does the real filtering.

```sql
ALTER TABLE coverage_plan ENABLE ROW LEVEL SECURITY;

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

-- Write policies (INSERT/UPDATE/DELETE): same predicate, but the final
-- "OR user_id = cabio_app_uid()" branch stays IN (unlike target_plan) --
-- self-authorship is the whole point of decision #1 above. Explicit WITH CHECK
-- on every write policy, not relying on the USING fallback -- same lesson as
-- Target Planning and the notification-feature RLS bugs: a manager creating a
-- plan for a subordinate is actor != row-subject, and the read-your-write
-- RETURNING check must be verified, not assumed.

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

- `schemas.py` — add `CoveragePlanCreate`/`Update`/`Response`,
  `CoveragePlanEntryCreate`/`Update`/`Response` (nested `account` per the model's
  `lazy="joined"`).
- `repository.py` — add `CoveragePlanRepository`, `CoveragePlanEntryRepository`
  (one repository per aggregate root per `Backend-Implementation-Standards.md` — entry
  is a child of plan, so it's managed through `CoveragePlanRepository`, mirroring how
  `OpportunityItem` is managed through `OpportunityRepository`, not given its own
  standalone repository).
- `service.py` — add `CoveragePlanService`:
  - `create_coverage_plan`: validates the `BR-PL-03` consistency check described above
    (`target_plan.user_id == coverage_plan.user_id` and
    `target_plan.planning_period == coverage_plan.planning_period` for the referenced
    `target_plan_id` — `BusinessRuleViolation` if mismatched), plus the same
    role/scope authorization check pattern as `OpportunityService` (BR-OP-12) for the
    self-vs-delegate authorship question (decision #1).
  - `add_entry`/`update_entry`/`remove_entry`: enforces `BR-PL-02`'s mandatory
    `strategic_objective` + `target_revenue_lakhs` per entry, and the
    `coverage_plan_entry_unique (coverage_plan_id, account_id)` constraint (friendly
    `BusinessRuleViolation` instead of a raw DB uniqueness error, matching this
    codebase's existing pre-insert-check convention).
- `router.py` — extend the same `planning` router Target Planning creates:
  `GET/POST /planning/coverage-plans`, `PATCH/DELETE /planning/coverage-plans/{id}`,
  `POST/PATCH/DELETE /planning/coverage-plans/{id}/entries/{entry_id}`.
- Tests: the `BR-PL-03` consistency check (mismatched user/period rejected), entry
  uniqueness, and the same role-boundary test shape as Target Planning — including the
  self-authorship path this time (Sales Staff creating their *own* plan should
  succeed, unlike Target Planning where that path is explicitly forbidden).

## Frontend

- `sales-os-app/src/screens/CoveragePlanningScreen.tsx` (new) — Sales Staff-primary
  screen (unlike Target Planning's manager-only gate): period picker, a list of the
  rep's Coverage Plan Entries (Account, Strategic Objective, Target Revenue,
  Frequency), an Account picker to add entries (reuse the existing Account
  search/picker component already used elsewhere — check `Customer360Screen.tsx`'s
  or `QuickLeadModal.tsx`'s Account picker before building a new one), inline edit via
  `FormModal`. Managers viewing a subordinate's plan get the same screen in read view
  (or edit, if decision #1 confirms delegation) with a rep selector, mirroring
  Target Planning's manager-vs-rep view split.
- `DemoApp.tsx` nav: add under **SALES EXECUTION** (self-service, not admin-gated) —
  `{ id: "coveragePlanning", label: "Coverage Planning", icon: "🧭" }`. No new
  gating tier needed (unlike Target Planning) — every role already has appropriate
  RLS-scoped access, same reasoning as the Insights Dashboard nav placement.
- `services/coveragePlanning.ts`, `types/coveragePlanning.ts` — typed, same convention
  as the other two plans.

## Out of scope for this pass

- Any change to Opportunity creation to auto-link back to a specific
  `coverage_plan_entry` — `BR-PL-04` explicitly says no such FK exists in Phase 1.
- Beat Plan Compliance / Progress reporting (PRD A.2.1/A.2.2) — this is Reporting
  Batch 2 territory (`Insights-Dashboard-Implementation-Plan.md`), consumes this
  data, doesn't need to ship alongside it.
- Approval/status workflow — same open item as Target Planning, resolve once.

## Verification

- Backend: `pytest`, `ruff check app/domains/planning/`.
- Frontend: `tsc --noEmit`, `npm run lint`.
- Manual, role-by-role on Dev: Sales Staff creates and edits their own plan
  successfully; the `BR-PL-03` mismatch case is rejected with a clear error, not a
  500; a manager's delegate-create (if decision #1 confirms it) reads back
  immediately (the `RETURNING`-vs-`WITH CHECK` check again); each role's read scope
  matches the policy.

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
