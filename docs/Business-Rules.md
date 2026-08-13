# Cabio Sales OS - Business Rules Catalog (Phase 1)

**Version:** 2.0  
**Date:** June 20, 2026  
**Status:** Architecture Consistency Review Implemented  
**Previous Version:** 1.0 (Foundation Day 1 Draft — June 18, 2026)

---

# 1. Introduction
This document defines the core business logic, validation rules, and state-transition constraints for the Cabio Sales OS. These rules must be enforced by the FastAPI backend and reflected in the React frontend UI to ensure data integrity and process discipline.

---

# 2. Planning Domain Rules

### BR-PL-01: Quota Hierarchy
*   **Rule:** Target Plans must be defined at the User + SBU + Quarter level.
*   **Constraint:** A user cannot have two overlapping target plans for the same SBU in the same quarter.
*   **Planning Period Format:** Planning periods must use the `YYYY-Qn` format (e.g., `2026-Q1`). The fiscal year follows the Indian Fiscal Year (April–March): Q1 = April–June, Q2 = July–September, Q3 = October–December, Q4 = January–March.
*   **Pillar Alignment:** Target Planning.
*   **Reference:** ADR-019 (Planning Calendar Model).

### BR-PL-02: Coverage Plan Strategy (Replaces Beat Planning)
*   **Rule:** Coverage Plans focus on **Strategic Objectives** and **Target Revenue**, not visit frequency.
*   **Constraint:** The `planned_visit_count` field is strictly forbidden. 
*   **Constraint:** A Coverage Plan must map to at least one Account.
*   **Constraint:** Each account in a Coverage Plan must have a defined `strategic_objective` (text) and `target_revenue_lakhs` (numeric).

### BR-PL-03: Coverage Plan Traceability
* **Rule:** Every Coverage Plan must be associated with an approved Target Plan.
* **Constraint:** Coverage Plans cannot be created unless a Target Plan exists for the same User, SBU, and Planning Period.
* **Purpose:** Maintains the Target → Coverage → Opportunity → Revenue planning hierarchy.
* **Reference:** ADR-013 (Planning Hierarchy), ADR-019 (Planning Calendar Model).

### BR-PL-04: Opportunity Origination Classification
* **Rule:** Every Opportunity must be classified by Lead Source using the LeadSource master entity.
* **Constraint:** Coverage-originated Opportunities must have `lead_source_id` set to the `COVERAGE_PLAN` Lead Source value. A direct FK from Opportunity to Coverage Plan Entry is not implemented in Phase 1.
* **Purpose:** Maintains traceability between Coverage Planning and Pipeline Generation through the Lead Source classification model.
* **Reference:** ADR-020 (LeadSource Master Entity).

---

# 3. Opportunity Management & Stage Gates

### BR-OP-00: Opportunity Creation Flexibility
* **Rule:** Opportunities may be created at any valid pipeline stage.
* **Constraint:** When an Opportunity is created at an advanced stage, all mandatory data required for that stage and preceding stages must be present.
* **Example:** An Opportunity created directly in Negotiation must already satisfy Lead, Qualified, and Demo stage requirements.

### BR-OP-01: Stage Transition Exit Criteria

Opportunities must satisfy specific "Gate" requirements before progressing to the next stage.

| Transition | Mandatory Requirements |
| :--- | :--- |
| **Lead → Qualified** | 1. Product identified.<br>2. Budget Range defined.<br>3. Lead Source defined using values from the LeadSource master entity (see Appendix A). |
| **Qualified → Demo** | 1. Demo Date defined (single date or date range) — not required when `lead_source` = REPEAT_ORDER (BR-OP-13). |
| **Demo → Clinical Evaluation** | 1. Demo Outcome recorded.<br>2. Clinical contact identified (doctor or biomedical engineer).<br>3. Clinical evaluation start date defined. |
| **Clinical Evaluation → Negotiation** | 1. Clinical Evaluation Outcome recorded.<br>2. Expected Closure Date defined — not required when `lead_source` = REPEAT_ORDER (BR-OP-13). |
| **Negotiation → Order** | 1. Order Value confirmed.<br>2. Product Details defined.<br>3. Shared Ownership Validation completed (if applicable).<br>4. Handover Information completed. |
| **Order → Delivery & Installation** | 1. Purchase Order Number entered.<br>2. Delivery Date scheduled.<br>3. Installation Site confirmed. |

### BR-OP-02: "On-Hold" Status Discipline (ADR-005)
* **Rule:** Moving an opportunity to the "On-Hold" status is a guarded transition.
* **Mandatory Fields:** `hold_reason_id` (Master Data) and `reactivation_date` (Date).
* **Validation:** `reactivation_date` must be in the future.
* **Logic:** When `current_date >= reactivation_date`, the system must flag the opportunity as "Reactivation Overdue" in all insights views.
* **Audit Requirement:** Changes to `hold_reason_id` or `reactivation_date` must be recorded in audit history.

### BR-OP-03: Lost Status Validation
* **Rule:** Moving an Opportunity to the Lost status is a guarded transition.
* **Mandatory Fields:** `loss_reason_id` (Master Data).
* **Conditional Fields:** `competitor_name` (Free Text) is required **only** when the selected loss reason represents a competitor win. It is optional for all other loss reasons.
* **Optional Fields:** `loss_notes`
* **Validation:** Lost opportunities must retain historical stage, value, and contributor information for reporting purposes.
* **Reference:** ACR — CBR-04.

### BR-OP-04: Opportunity Project Association
* **Rule:** Opportunities may exist with or without a Project.
* **Constraint:** `project_id` is optional (nullable) on the Opportunity entity.
* **Rationale:** Not all Opportunities arise from a formal project or tender. Direct account requirements, referrals, and opportunistic deals may not be associated with a Project.
* **Reference:** ADR-014 (Account → Project → Opportunity Relationship Model).

### BR-OP-05: Status Transition Rules
* **Rule:** Status is independent of Stage. An Opportunity can transition to Won, Lost, or On-Hold from any stage.
* **Won Requirements:** To transition to Won from any stage, `PO Number` and `Product Details` must be confirmed.
* **Lost Requirements:** See BR-OP-03.
* **On-Hold Requirements:** See BR-OP-02.

### BR-OP-06: Stalled Opportunity Detection
* **Rule:** An opportunity automatically transitions to the "Stalled" status if no activity (visit, call, email, meeting, note) is recorded against it for 180 consecutive days.
* **Exit Rule:** The Stalled status automatically reverts to Active when any activity is logged.
* **Notifications:** The salesperson and their manager receive notifications when an opportunity becomes Stalled.
* **Forecasting:** Stalled opportunities are excluded from committed pipeline forecasts.
* **Implementation Note:** This rule is expected to be executed by a scheduled background process (OpportunityMonitoringJob / OpportunityLifecycleJob) rather than a user-initiated API operation.

### BR-OP-07: Forecasting & Pipeline Inclusion
* **Won:** Included as closed-won revenue.
* **Active:** Included in active pipeline and forecast calculations based on weighted probability.
* **On-Hold:** Excluded from committed pipeline/forecasts.
* **Stalled:** Excluded from committed pipeline/forecasts.
* **Lost:** Excluded entirely.

### BR-OP-08: Win Probability Rules
* Opportunity.win_probability defaults to OpportunityStage.default_win_probability when an Opportunity is created.
* Salespeople may manually override win_probability.
* Valid range is 0–100.
* Once manually overridden, subsequent Stage changes must NOT automatically overwrite the user-defined probability.
* The manually overridden value remains in effect until the user explicitly changes it again.
* Stage default probabilities remain available as guidance values and approved reporting reference data.

### BR-OP-09: Terminal Status Governance
* WON and LOST are terminal Opportunity statuses.
* Opportunities in WON or LOST status cannot be reopened.
* Opportunities in WON or LOST status cannot participate in normal Stage or Status transitions.
* Historical WON and LOST records remain immutable for:
  * Forecasting
  * Pipeline analytics
  * Conversion reporting
  * Pipeline leakage analysis
* If a previously LOST opportunity becomes active again, a new Opportunity must be created.
* Any administrative modification of a WON or LOST Opportunity must be captured in audit history.

### BR-OP-10: Default Opportunity Status
* All newly created Opportunities must default to ACTIVE status.
* Exceptions are permitted only for approved data migration or administrative import processes.
* User-facing Opportunity creation workflows must not allow direct creation of Opportunities in WON, LOST, STALLED, or ON_HOLD status.

### BR-OP-11: Opportunity Item Product SBU Eligibility (2026-08-01)
* **Rule:** A Product may only be added as an Opportunity Item if its own `sbu_id` matches the Opportunity's `sbu_id`. Enforced at the API layer (`OpportunityService._validate_item_sbus`, checked on `create_opportunity`, `add_item`, and `replace_items`) — any submission referencing a product outside the Opportunity's SBU is rejected with a `BusinessRuleViolation`.
* **No grandfathering:** Unlike BR-FIN-06's split-participant check, this validates every item on every save (not just newly-added ones) — there is no legacy cross-SBU item data this needs to tolerate.
* **Reference:** Companion to "Product Catalog Rules" below — catalog *visibility* is company-wide, but adding a product to an Opportunity remains SBU-scoped.

### BR-OP-12: Opportunity Creation SBU Override — Admin/General Manager Only (2026-08-04)
* **Rule:** Every Opportunity is created in the caller's own `sbu_id` by default — **except Admin and General Manager, who have no meaningful "own" SBU** (their `user_profile.sbu_id` is a placeholder required only by a `NOT NULL` column, not a real assignment) **and must always explicitly specify `sbu_id` on `OpportunityCreate`**, even if the value they choose happens to match their profile's placeholder. Every other role has no way to override this — the field is ignored (forced to their own `sbu_id`) even if present in the request.
* **Constraint:** Enforced at the API layer (`OpportunityService.create_opportunity`) — a non-Admin/GM caller attempting an override is rejected with an `AuthorizationError`; an Admin/GM caller who omits `sbu_id` is rejected with a `BusinessRuleViolation` (never silently defaulted to their placeholder); an override/choice referencing a nonexistent SBU is rejected with a `NotFoundError`.
* **Why:** Closes a gap between the RLS design and the application layer — `opportunity_tier_visibility` (ADR-009) already grants Admin/General Manager unrestricted read *and write* access across both SBUs at the database level, but the API never gave them a way to target a different SBU on create; every caller was silently forced into their own `sbu_id` regardless of role. Surfaced 2026-08-04 when a General Manager (whose own profile is scoped to one SBU) was unable to create an Opportunity in the other SBU during UAT.
* **Interaction with BR-OP-11:** the overridden `sbu_id` — not the caller's own — is what Opportunity Items are validated against.
* **Immutable after creation:** `sbu_id` is not on `OpportunityUpdate` — there is no way, for any role, to change an Opportunity's SBU once created. Confirmed with Basheer (2026-08-04): no business requirement for this, not an oversight.
* **Reference:** Same "same-SBU-or-reject" pattern family as BR-ORG-01, BR-FIN-06, BR-OP-11 — this is the Admin/GM override case, not a new pattern.

### BR-OP-13: REPEAT_ORDER Fast-Track (2026-08-05)
* **Rule:** An Opportunity where the customer is buying the exact same equipment they already have from Cabio — price pre-negotiated off a prior Purchase Order, no fresh demo or negotiation — is tagged with the `REPEAT_ORDER` `LeadSource` value. This is distinct from the existing `Existing Customer` value, which only describes how the lead reached Cabio (an existing relationship), not whether this specific deal is a repeat order.
* **Effect:** When `lead_source` = `REPEAT_ORDER`, the Qualified → Demo (Demo Date) and Clinical Evaluation → Negotiation (Expected Closure Date) gates in BR-OP-01 are not enforced — those pipeline stages genuinely don't occur for this deal type.
* **Unaffected:** The Negotiation → Order gate (Order Value, Product Details) and the Order → Delivery gate (PO Number) are enforced exactly as for any other Opportunity — a REPEAT_ORDER deal still requires confirmed price and product details, sourced from the prior order rather than a fresh negotiation.
* **Scope:** A single flag — no sub-classification of repeat order types. Any role may set it; there is no manager-approval or override path for this exception (considered and deliberately not built — the volume this rule addresses, ~40% of the pipeline, was judged too high for a per-deal approval workflow).
* **Enforcement:** `validate_stage_transition` (`app/domains/opportunity/validators.py`) — gated on the selected lead source's `name` equalling `REPEAT_ORDER`, looked up via `OpportunityRepository.get_lead_source`.
* **Reference:** ADR-015 (Opportunity Creation at Any Sales Stage); `docs/Discussion-FastTrack-Opportunity-Creation.md` for the full options analysis and decision record.

---

# 3a. Product Catalog Rules

### BR-CAT-01: Catalog Visibility Is Company-Wide (2026-08-01)
* **Rule:** All authenticated users may view every Product in the catalog, regardless of their own SBU. The Product Catalog screen's SBU filter buttons (Imaging / Critical Care) are available to everyone, not just Admin/General Manager.
* **Rationale:** Product records are reference data only (name, OEM, model number, category, description) — no pricing or customer-sensitive data — so there is no confidentiality reason to hide one SBU's catalog from another. Reps benefit from seeing the full company product line (cross-sell awareness, referring a lead to the other SBU) even though they can't transact against it directly — see BR-OP-11.
* **Enforcement:** `product_read_all` RLS policy (migration `0014_product_rls_open_read`) — `SELECT` is unrestricted; `INSERT`/`UPDATE`/`DELETE` remain SBU-scoped to Admin/General Manager or the product's own SBU, unchanged from the original Phase 2E policy.

### BR-CAT-02: Product Classification (2026-08-07)
* **Rule:** Every Product carries a `product_type` of `NEW_EQUIPMENT`, `REFURBISHED`, or `ACCESSORY` (default `NEW_EQUIPMENT`), independent of `category_name` (modality — CT, MRI, Ventilation, etc., unchanged).
* **Rationale:** Supports outright sale of refurbished equipment (e.g. hospitals preferring a refurbished Thoracic/heart-lung machine over new) and accessory sales as distinct catalog categories from new equipment — see `docs/Product-Lifecycle-TradeIns-Accessories-Technical-Design.md`. (Buyback line items are governed separately — see BR-CAT-03.)
* **Enforcement:** `ck_product_product_type` CHECK constraint (migration `0016`).

### BR-CAT-03: Buyback Line Items Are Free-Text (2026-08-10)
* **Rule:** A Buyback line item on an Opportunity carries a free-text `description` of the customer's traded-in machine and no catalog `product_id`. PRODUCT/ACCESSORY line items are unaffected — they still require a catalog `product_id` and carry no `description`.
* **Rationale:** Nobody knows the exact make/model/condition of a customer's used machine before the deal happens, so requiring it to be pre-catalogued as a `REFURBISHED` Product (the prior rule) didn't fit how trade-ins actually occur — see `docs/Discussion-Buyback-Freetext-2026-08.md`.
* **Enforcement:** `OpportunityItemCreate` schema `model_validator` (description required when `line_type = BUYBACK`, `product_id` required otherwise) plus the relaxed `ck_opportunity_item_product_id_or_buyback` CHECK constraint (migration `0017`) — DB-level enforcement only requires `product_id IS NOT NULL OR line_type = 'BUYBACK'`, not `description IS NOT NULL`, since that's a new-write-only rule.
* **Out of scope:** a separate post-close trade-in intake tracking workflow (refurbish / parts / discard) is still under discussion, not yet planned or built. The one settled fact so far: an intake queue row would be created only when the deal reaches Won, not when the Buyback line is added.

---

# 4a. Project & Tender Rules

### BR-PROJ-01: Project Lifecycle
* **Rule:** Every Project must have a lifecycle status.
* **Suggested Statuses:** `DRAFT`, `ACTIVE`, `BID_SUBMITTED`, `AWARDED`, `LOST`, `CLOSED`
* **Validation:** Status changes must be recorded in audit history.
* **Validation:** Projects marked as `AWARDED`, `LOST`, or `CLOSED` are considered completed projects.
* **Validation:** Projects cannot move to BID_SUBMITTED unless bid_submission_date is populated.

# 4b. Financial & Revenue Split Rules

### BR-FIN-01: Contributor Split Validation (ADR-003, scope narrowed by ADR-037)
*   **Rule:** Every Opportunity must have at least one assigned owner/contributor.
*   **Constraint:** The sum of `split_percentage` across all contributors for a single Opportunity **MUST EQUAL EXACTLY 100.00%**.
*   **Scope (superseded 2026-07-30, ADR-037):** ~~Splits can cross SBUs (e.g., Imaging 60%, Critical Care 40%)~~ — no longer applies. A single Opportunity carrying products/credit across multiple SBUs is now handled via `Project`-linked, per-SBU Opportunities instead (ADR-004), not via a cross-SBU split on one Opportunity. New split participants must belong to the same SBU as the Opportunity — see BR-FIN-06. Pre-existing cross-SBU splits from before this change remain valid and visible (not retroactively removed), just not addable-to going forward.

### BR-FIN-02: Value Representation
*   **Rule:** All financial fields (Opportunity Value, Quota, Target Revenue) are captured in **INR Lakhs**.
*   **Precision:** Numeric(15, 2).

### BR-FIN-03: Opportunity Value Calculation
* **Rule:** Opportunity financial value operates in dual-mode based on whether Opportunity Items have been entered.
* **Mode 1 — Indicative Value (no items present):** When no Opportunity Items exist, the `indicative_value` field (manually entered by the sales executive) serves as the working pipeline estimate.
* **Mode 2 — Calculated Value (items present):** When one or more Opportunity Items exist, the system-calculated value becomes authoritative.
  * `Extended Value = Quantity × Unit Price – Discount`
  * Every Opportunity Item carries a `line_type` of `PRODUCT` or `BUYBACK` (default `PRODUCT`; see BR-CAT-02). BUYBACK lines carry a free-text `description` instead of a catalog `product_id` (BR-CAT-03) — this does not change the formula below.
  * `Opportunity Value = Sum(Extended Value, line_type=PRODUCT) − Sum(Extended Value, line_type=BUYBACK)` **(amended 2026-08-07)** — a Buyback credit line nets against the gross product total rather than adding to it.
* **Constraint:** When Opportunity Items exist, the calculated value cannot be manually overridden. `indicative_value` is retained in the record but is not used for pipeline or forecast calculations.
* **Validation:** When items exist, Opportunity Value must equal the total value of all active Opportunity Items, netted per the formula above.
* **Implementation note:** this calculation is performed client-side (`OpportunityDetailScreen.tsx`'s Products tab) — there is no backend-computed or stored `Opportunity Value` field or query. (The `vw_opportunities_with_value` database view sums Extended Values but is not consumed anywhere in the backend or frontend and was not updated for the `line_type` split — an orphaned artifact, not part of this rule's enforcement.)
* **Reference:** ADR-026 (Opportunity Value Model — Dual-Mode Valuation).

### BR-FIN-04: Split Governance
* **Rule:** Contributor splits may be modified only while an Opportunity remains open.
* **Constraint:** Split changes must preserve the 100% allocation rule.
* **Audit Requirement:** All split changes must be captured in audit history.

### BR-FIN-05: Default Opportunity Split Assignment
* **Rule:** When no contributor split is explicitly entered during Opportunity creation, the system automatically creates a 100% split assigned to the opportunity creator.
* **Constraint:** The auto-created default split must comply with BR-FIN-01 (100% rule).
* **Logic:** The default split may be modified after creation, subject to BR-FIN-04 (Split Governance).
* **Reference:** ADR-003 (Multi-SBU Contributor Splits).

### BR-FIN-06: Split Participant Eligibility (ADR-037)
* **Rule:** A user may only be *newly added* as a split participant on an Opportunity if their own `sbu_id` matches the Opportunity's `sbu_id`. Enforced at the API layer (`OpportunityService.replace_splits`) — any submission introducing a participant outside the Opportunity's SBU is rejected with a `BusinessRuleViolation`.
* **Grandfathering:** `replace_splits` re-submits the full split list on every save (it is a full replace, not an append). Participants already persisted on the Opportunity before a given save are exempt from this check — only participants new to that specific save are validated against the SBU rule. This prevents a legacy cross-SBU split (see BR-FIN-01) from permanently blocking all future edits to that Opportunity's splits.
* **Picker matches the rule exactly (fixed 2026-08-07).** The "add participant" picker suggests any active user in the caller's own SBU, any zone — previously also restricted to the caller's own zone (an interim, UI-level restriction narrower than what the server actually accepted), fixed to match this rule exactly. `GET /users?scope=sbu`.
* **Reference:** ADR-037 (Split Participant SBU Restriction — Supersedes ADR-003's Cross-SBU Scope).

---

# 5. Account & Stakeholder Rules

### BR-ACC-01: Stakeholder Sentiment (ADR-007)
*   **Rule:** NPS and Sentiment are attributes of the **Stakeholder**, not the Account.
*   **Logic:** Changing a Stakeholder's sentiment does not automatically change the Account's status, but it contributes to the aggregated "Account Health" calculation.

### BR-ACC-02: Payer Behavior
*   **Rule:** `payer_behavior` is an Account-level attribute used for risk-weighting forecasts.
*   **Enums:** `GOOD`, `AVERAGE`, `PROBLEMATIC`, `UNKNOWN`.

---

# 5a. Organization & User Management Rules

### BR-ORG-01: Manager Assignment SBU Eligibility (2026-08-01)
* **Rule:** A user's `manager_id` may only point to a user in the *same* SBU. Enforced at the API layer (`UserService.create_user`/`update_user`) — any submission assigning a manager outside the user's own SBU is rejected with a `ValidationError`.
* **Why:** SBU (Imaging vs. Critical Care) is a hard RLS security boundary everywhere else in the app. The Sales Manager RLS tier grants visibility over "opportunities owned by people whose `manager_id` = me" with no SBU filter of its own — that's safe only if `manager_id` itself is always assigned within the same SBU. Without this check, an Admin/GM could (by mistake or otherwise) assign a Sales Staff person's manager to a Sales Manager in the *other* SBU, letting that manager see opportunities across the boundary.
* **PATCH semantics:** if an update changes `sbu_id` and `manager_id` in the same call, the check compares the manager's SBU against the *new* `sbu_id`, not the user's current one.
* **Reference:** Companion to BR-FIN-06 (Split Participant SBU Eligibility) and BR-OP-11 (Opportunity Item SBU Eligibility) — same "same-SBU-or-reject" pattern applied to manager assignment.

### BR-ORG-02: Multi-Zone User Assignment (Milestone 1, 2026-08-11)
* **Rule:** A user may be assigned to more than one zone via the `user_zone` join table, not just the single `user_profile.zone_id` scalar. `zone_id` remains a required "primary zone" pointer (used as the default zone for new Accounts they create, and shown in compact identity displays) — it must always be a member of that user's `zone_ids`, enforced at the API layer (`UserService.create_user`/`update_user`) with a `ValidationError` otherwise.
* **Only the Area Manager RLS tier's visibility keys off zone membership.** `opportunity_tier_visibility`'s Area Manager branch now checks set-membership against `user_zone` (a candidate Opportunity is visible if its Account's zone is *any* zone the Area Manager is assigned to, not just one). SBU Manager, Sales Manager, Sales Staff, Admin/General Manager are unaffected — none of those tiers' visibility rules reference zone at all.
* **Why:** A single Area Manager can genuinely cover more than one zone (e.g. North Kerala + Mangalore) — the prior scalar `zone_id` FK had no way to represent this, leaving such a person unable to see opportunities in their second zone at all.
* **Enforcement:** `user_zone` table (migration `0018`); `opportunity_tier_visibility` RLS policy (same migration); `TEAM_SCOPE_BUILDERS["Area Manager"]` (`organization/repository.py`) — the same set-membership generalization applied to the User Directory's own team-scoping rule, not just the Opportunity RLS policy.
* **Reference:** `docs/Multi-Zone-Assignment-Technical-Design.md`, `docs/Multi-Zone-Assignment-Milestone-1-Implementation-Plan.md`.

---

# 6. Activity & Interaction Rules

### BR-ACT-01: Activity Account Requirement (ADR-006 — clarified June 20, 2026)
* **Rule:** Every Activity must be associated with an Account. Activities may optionally be linked to a Project and/or Opportunity to provide additional business context.
* **Database Constraints:**
  * `account_id` — NOT NULL (mandatory)
  * `project_id` — nullable (optional Project linkage)
  * `opportunity_id` — nullable (optional Opportunity linkage)
* **Classification Logic:**
  * Activities linked to an Opportunity contribute to pipeline velocity and forecast confidence scores.
  * Activities linked to a Project (with no Opportunity) are classified as "Project Engagement" activities.
  * Activities linked only to an Account (with no Project or Opportunity) are classified as "Account Scanning/Profiling" and do not contribute to forecast confidence scores.
* **Constraint:** An Activity without an Account reference must be rejected at both the application layer and the database layer.

### BR-ACT-02: Manager Push (Logging)
*   **Rule:** Managers can log "Manager Notes" on any Opportunity.
*   **Visibility:** These are highlighted in the activity timeline and cannot be deleted or edited by the Sales Executive owner.

### BR-ACT-03: Activity Account Constraint — Database Enforcement
* **Rule:** The Activity Account Requirement (BR-ACT-01) must be enforced at the database level in addition to application-layer validation.
* **Constraint:** `account_id` must be defined as NOT NULL in the `activity` table physical schema. This is the authoritative database-level enforcement mechanism.
* **Nullability Summary:**

  | Column | Nullability | Purpose |
  | :--- | :--- | :--- |
  | `account_id` | NOT NULL | Mandatory. Every Activity must belong to an Account. |
  | `project_id` | NULLABLE | Optional. Provides Project context when applicable. |
  | `opportunity_id` | NULLABLE | Optional. Provides Opportunity context when applicable. |

* **Purpose:** Ensures every Activity record is always directly traceable to a customer Account. Database-level NOT NULL enforcement provides a safety net independent of application validation logic and API layer behaviour.

### BR-ACT-04: Mandatory Next Action Capture (PRD §4.3)
* **Rule:** Every logged Activity must capture a Next Action (free text),
  a Due Date, and an Owner, EXCEPT when `activity_type == MANAGER_NOTE`.
  The interaction cannot be saved without these fields for any other
  activity_type.
* **Implementation:** Enforced at the Pydantic schema layer via a
  conditional validator (`ActivityCreate.next_action_text` /
  `.next_action_due_date` are required unless `activity_type` is
  `MANAGER_NOTE`) and realized as a Reminder record auto-created in the
  same transaction as the Activity it belongs to (see ADR-023 — Reminders
  are Activity-linked, not a separate user-initiated entity in this flow).
  No Reminder is created when the exemption applies.
* **Owner default:** If no explicit owner is provided, the Next Action Owner
  defaults to the Activity's `user_id` (the person the interaction is
  logged against).
* **Scope / exemption:** Applies to all activity_type values EXCEPT
  MANAGER_NOTE. A Manager Note is internal manager-to-rep guidance
  (BR-ACT-02), not a customer interaction — it carries no follow-up
  commitment to an account, so mandatory next-action capture does not
  apply to it.
* **Purpose:** Ensures every genuine customer interaction produces a
  trackable, assigned follow-up, closing the loop between activity logging
  and the Reminders/Tasks system (§7.2 of `docs/API-Catalog.md`), without
  forcing meaningless due dates onto internal notes.

### BR-ACT-05: Mandatory Closing Activity on Reminder Completion
* **Rule:** A Reminder ("Next Action") cannot be marked complete without
  documenting what was actually done to close it — an Activity Type, a Date,
  and Notes describing what happened are all required. Reopening a Reminder
  (marking it incomplete again) requires none of this.
* **Implementation:** Enforced at the Pydantic schema layer via a conditional
  validator (`ReminderUpdate`'s `activity_type`/`activity_date`/`notes` are
  required whenever `is_completed=True`) and realized as a new Activity
  record created atomically with the completion, in `ReminderService.patch_reminder`.
  The new Activity inherits its `account_id`/`opportunity_id`/`project_id`
  from the Reminder's own (creating) Activity — same customer/deal thread —
  and is linked back via `Reminder.closing_activity_id` (distinct from
  `Reminder.activity_id`, which points to the Activity that *created* the
  Reminder, per BR-ACT-04). `MANAGER_NOTE` is not a valid closing Activity
  Type (rejected by the same validator) — it represents internal
  manager-to-rep guidance, not a customer interaction, so it can't describe
  what closed a customer follow-up.
* **Scope:** Mirrors BR-ACT-04 in the opposite direction — that rule requires
  every logged Activity to produce a Next Action; this rule requires every
  completed Next Action to produce a closing Activity. Together they close
  the loop in both directions between Activities and Reminders.
* **Optional follow-up:** `ReminderUpdate` also accepts optional
  `next_action_text`/`next_action_due_date`/`next_action_owner_id`, for when
  closing one task surfaces another (e.g. the customer asks for a quote
  while you're calling to confirm the demo date). Unlike BR-ACT-04's own
  next action, this is genuinely optional — not every closure produces a
  new task, so nothing forces it. When provided, it reuses BR-ACT-04's exact
  mechanism (an Activity may optionally carry a Reminder), attached to the
  *closing* Activity rather than the original one, since it's a fresh
  commitment made now. `next_action_text` and `next_action_due_date` must be
  given together if given at all (validator-enforced); owner defaults to
  whoever closed the reminder, same default BR-ACT-04 uses.
* **Purpose:** A "done" checkbox with no record of what happened is not
  useful for anyone reviewing the account/opportunity history later. The
  closing Activity is a normal Activity record — it appears in the Activity
  tab like any other logged interaction — and is additionally surfaced
  directly on the completed Reminder itself (Next Actions screen and the
  Opportunity Detail Next Actions tab), since duplicating the display costs
  nothing (same underlying record) but saves navigating away to find it.

### BR-ACT-06: Next Action Assignee Eligibility
* **Rule:** The Next Action Owner (BR-ACT-04) may be assigned to **any active user in the company**, regardless of SBU, zone, or reporting line — no eligibility restriction applies, unlike Split participants (BR-FIN-06) or Opportunity Owner reassignment.
* **Rationale:** A rep may need to hand a specific follow-up to someone entirely outside their own visibility scope (e.g. a cross-SBU specialist). The assignee does not need pre-existing visibility into the Opportunity to be assigned — the permanent RLS carve-out (`cabio_app_assigned_reminder()`, see `Opportunity-Access-Hierarchy-Technical-Design.md` §11 / `0011_rls_activity_document_reminder.py`) grants them visibility into that Opportunity *after* assignment, not before. Restricting the picker would silently break this workflow (confirmed as a live regression 2026-07-30 — see `active_progress.md`, Task 9 write-retest).
* **Implementation:** `GET /users?scope=all` bypasses all tier/SBU/zone filtering (`UserRepository.list_active`); used only by the Next Action assignee picker (`LogActivityModal.tsx`). Contrast with `scope=sbu` (Split picker, BR-FIN-06) and the default `scope=scoped` (Opportunity Owner picker, tier-visibility-restricted).

### BR-ACT-07: Document Visibility Follows Parent Context — No Cross-SBU Carve-Out
* **Rule:** A Document's practical visibility is gated by whichever parent context it's linked to (Account, Project, Opportunity, or Product), each already independently RLS-scoped on its own terms. There is **no** universal cross-SBU visibility carve-out for product-only documents (a Document with `opportunity_id IS NULL`, linked only to a Product).
* **Why this needed stating explicitly:** `document`'s own RLS policy (`0011_rls_activity_document_reminder.py`) technically allows a product-only document through unconditionally — but reaching it requires `GET /products/{product_id}/documents`, which gates on `product_exists(product_id)` first (`DocumentService.list_by_product`). That existence check queries the `product` table, which **is** SBU-restricted (`product_sbu_visibility`, BR/ADR from the `0012_rls_product.py` migration) — so a user outside the product's SBU gets a 404 before the document policy is ever evaluated. There is also no UI path to a product's documents other than Product Catalog → click into the product, and Product Catalog's own list is correctly SBU-filtered.
* **History:** the RLS build (2026-07-27) originally assumed product-only documents should be reachable across SBUs, so reps could answer a customer's question about the *other* SBU's equipment from its collateral. Investigated live 2026-07-30 during the manual write-retest (Basheer asked "how would a Critical Care rep even navigate to an Imaging product's documents, given Product Catalog itself is SBU-restricted?") and confirmed this intent was never actually reachable through any real UI/API path. **Decision: drop the cross-SBU intent, keep Product Catalog's own SBU restriction** — the security boundary Task 7 deliberately added takes precedence, and no code change was made to "fix" the 404.
* **Reference:** `0011_rls_activity_document_reminder.py` (document policy), `0012_rls_product.py` (product policy that this rule ultimately defers to).

### BR-ACT-08: Opportunity Document Upload — File Limits and Signed-URL Download Gating
* **Rule:** Opportunities support real file upload (not just Product Catalog's URL-only collateral links). Uploaded files are restricted to **PNG, JPEG, or PDF**, **4MB maximum**, enforced both client-side (immediate feedback) and server-side (`DocumentService.upload_document`, never trust the client alone). Download access is granted only through a short-lived signed URL (`GET /documents/{document_id}/download-url`, 5-minute expiry) — there is no other way to fetch a real upload's bytes.
* **Rationale:** File type/size limits confirmed by Basheer 2026-08-11 (tightened from an originally-proposed JPEG/PNG/HEIC + 10MB) — small enough to keep well within Supabase Storage's free-tier 1GB-per-project allocation across Dev/UAT, and restrictive enough that a rejected upload (e.g. a HEIC photo straight off an iPhone, a real case given the camera-capture flow) fails clearly rather than silently. The signed-URL indirection is what keeps Storage's own bucket-level access in sync with the `Document` row's RLS visibility (BR-ACT-07) without a second, parallel access policy to maintain — a user who can't see the row gets the same 404 any other RLS-protected read would give, before Storage is ever asked for a URL.
* **Implementation:** `app/core/storage.py` wraps Supabase Storage's REST API (private `documents` bucket, `SUPABASE_SERVICE_ROLE_KEY`) — upload and delete are proxied through the backend, never direct-to-storage from the frontend, consistent with this codebase's "backend brokers every write" pattern. `DocumentService.delete_document` deletes the Storage object before the DB row (storage-delete-fails-safe: the DB row survives and the orphan is visible/retryable). Documents with an external `storage_path` (Product Catalog's URL-only collateral links, `http(s)://...`) are a distinct case — they have no real Storage object, so both the signed-URL endpoint and delete skip the Storage call entirely for these.
* **Reference:** `docs/Opportunity-Document-Upload-Implementation-Plan.md`.

---

# 7. Audit & History Rules

### BR-AUD-01: Business Auditability
* **Rule:** The system must maintain an audit trail for all business-critical entity changes.
* **Examples:** Opportunities, Contributor Splits, Target Plans, Coverage Plans, and Projects.
* **Constraint:** Users must be able to identify who made a change and when the change occurred.
* **Constraint:** Audit history must not be editable through standard application workflows.

---

# 8. Unresolved Logic (Needs Discussion)
1.  **Split Approval:** Does a cross-SBU split require approval from both SBU managers?
2.  **Tender Timeline:** If a Project (Tender) bid deadline is missed, does the system automatically mark all linked Opportunities as "Lost"?

---

# Appendix A: Reference Data

## Lead Source Values

Lead Source values are managed in the **LeadSource master entity** (`lead_source` table) and are configurable by an administrator. The following values must be seeded on initial system setup:

| Value | Description |
| :--- | :--- |
| `COVERAGE_PLAN` | Opportunity originated from a strategic Coverage Plan account entry |
| `REFERRAL` | Referred by a doctor, partner, or professional associate |
| `EXISTING_CUSTOMER` | Originated from an existing installed base or account relationship |
| `TENDER` | Government or institutional tender / procurement program |
| `OEM_REFERRAL` | Referred by an Original Equipment Manufacturer (OEM / principal) |
| `WEBSITE` | Inbound enquiry via website or digital channel |
| `COLD_CALL` | Proactive outreach to a new prospect with no prior relationship |
| `WALK_IN` | Walk-in customer or direct in-person contact initiated by the customer |
| `OTHER` | Uncategorised or unlisted source |

> **Note:** `COVERAGE_PLAN` must be used for Coverage Plan-originated Opportunities. A direct FK from Opportunity to Coverage Plan Entry is not implemented in Phase 1 (ADR-020).

## Hold Reason Values

The system shall support the following Hold Reason values:

* CUSTOMER_DELAY
* BUDGET_PENDING
* PROCUREMENT_DELAY
* REGULATORY_APPROVAL_PENDING
* COMPETITOR_EVALUATION
* INTERNAL_RESOURCE_CONSTRAINT
* OTHER

## Loss Reason Values

The system shall support the following Loss Reason values:

* PRICE
* COMPETITOR_WON
* BUDGET_CANCELLED
* REQUIREMENT_CHANGED
* TECHNICAL_MISMATCH
* TIMING_DELAY
* NO_DECISION
* OTHER
