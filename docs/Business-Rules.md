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
| **Qualified → Demo** | 1. Demo Date defined (single date or date range). |
| **Demo → Clinical Evaluation** | 1. Demo Outcome recorded.<br>2. Clinical contact identified (doctor or biomedical engineer).<br>3. Clinical evaluation start date defined. |
| **Clinical Evaluation → Negotiation** | 1. Clinical Evaluation Outcome recorded.<br>2. Expected Closure Date defined. |
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

---

# 4a. Project & Tender Rules

### BR-PROJ-01: Project Lifecycle
* **Rule:** Every Project must have a lifecycle status.
* **Suggested Statuses:** `DRAFT`, `ACTIVE`, `BID_SUBMITTED`, `AWARDED`, `LOST`, `CLOSED`
* **Validation:** Status changes must be recorded in audit history.
* **Validation:** Projects marked as `AWARDED`, `LOST`, or `CLOSED` are considered completed projects.
* **Validation:** Projects cannot move to BID_SUBMITTED unless bid_submission_date is populated.

# 4b. Financial & Revenue Split Rules

### BR-FIN-01: Contributor Split Validation (ADR-003)
*   **Rule:** Every Opportunity must have at least one assigned owner/contributor.
*   **Constraint:** The sum of `split_percentage` across all contributors for a single Opportunity **MUST EQUAL EXACTLY 100.00%**.
*   **Scope:** Splits can cross SBUs (e.g., Imaging 60%, Critical Care 40%) but the total remains 100%.

### BR-FIN-02: Value Representation
*   **Rule:** All financial fields (Opportunity Value, Quota, Target Revenue) are captured in **INR Lakhs**.
*   **Precision:** Numeric(15, 2).

### BR-FIN-03: Opportunity Value Calculation
* **Rule:** Opportunity financial value operates in dual-mode based on whether Opportunity Items have been entered.
* **Mode 1 — Indicative Value (no items present):** When no Opportunity Items exist, the `indicative_value` field (manually entered by the sales executive) serves as the working pipeline estimate.
* **Mode 2 — Calculated Value (items present):** When one or more Opportunity Items exist, the system-calculated value becomes authoritative.
  * `Extended Value = Quantity × Unit Price – Discount`
  * `Opportunity Value = Sum of Extended Values`
* **Constraint:** When Opportunity Items exist, the calculated value cannot be manually overridden. `indicative_value` is retained in the record but is not used for pipeline or forecast calculations.
* **Validation:** When items exist, Opportunity Value must equal the total value of all active Opportunity Items.
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

---

# 5. Account & Stakeholder Rules

### BR-ACC-01: Stakeholder Sentiment (ADR-007)
*   **Rule:** NPS and Sentiment are attributes of the **Stakeholder**, not the Account.
*   **Logic:** Changing a Stakeholder's sentiment does not automatically change the Account's status, but it contributes to the aggregated "Account Health" calculation.

### BR-ACC-02: Payer Behavior
*   **Rule:** `payer_behavior` is an Account-level attribute used for risk-weighting forecasts.
*   **Enums:** `GOOD`, `AVERAGE`, `PROBLEMATIC`, `UNKNOWN`.

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
