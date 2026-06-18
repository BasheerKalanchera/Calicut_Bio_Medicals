# Cabio Sales OS - Business Rules Catalog (Phase 1)

**Version:** 1.0  
**Date:** June 18, 2026  
**Status:** Foundation Day 1 Draft

---

# 1. Introduction
This document defines the core business logic, validation rules, and state-transition constraints for the Cabio Sales OS. These rules must be enforced by the FastAPI backend and reflected in the React frontend UI to ensure data integrity and process discipline.

---

# 2. Planning Domain Rules

### BR-PL-01: Quota Hierarchy
*   **Rule:** Target Plans must be defined at the User + SBU + Quarter level.
*   **Constraint:** A user cannot have two overlapping target plans for the same SBU in the same quarter.
*   **Pillar Alignment:** Target Planning.

### BR-PL-02: Coverage Plan Strategy (Replaces Beat Planning)
*   **Rule:** Coverage Plans focus on **Strategic Objectives** and **Target Revenue**, not visit frequency.
*   **Constraint:** The `planned_visit_count` field is strictly forbidden. 
*   **Constraint:** A Coverage Plan must map to at least one Account.
*   **Constraint:** Each account in a Coverage Plan must have a defined `strategic_objective` (text) and `target_revenue_lakhs` (numeric).

### BR-PL-03: Coverage Plan Traceability
* **Rule:** Every Coverage Plan must be associated with an approved Target Plan.
* **Constraint:** Coverage Plans cannot be created unless a Target Plan exists for the same User, SBU, and Planning Period.
* **Purpose:** Maintains the Target → Coverage → Opportunity → Revenue planning hierarchy.

### BR-PL-04: Opportunity Origination Classification
* **Rule:** Every Opportunity must be classified as either:
  * Coverage Plan Originated
  * Opportunistic
* **Constraint:** Coverage-originated Opportunities must reference the Coverage Plan Entry that initiated the opportunity.
* **Purpose:** Maintains traceability between Coverage Planning and Pipeline Generation.

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
| **Lead → Qualified** | 1. Product identified.<br>2. Budget Range defined.<br>3. Lead Source defined using values from Appendix A. |
| **Qualified → Demo** | 1. Demo Date defined (single date or date range). |
| **Demo → Negotiation** | 1. Demo Outcome recorded.<br>2. Expected Closure Date defined. |
| **Negotiation → Order** | 1. Order Value confirmed.<br>2. Product Details defined.<br>3. Shared Ownership Validation completed (if applicable).<br>4. Handover Information completed. |
| **Order → Closed Won** | 1. Purchase Order Number entered.<br>2. Product Details confirmed. |
| **Any Stage → Closed Lost** | 1. Loss Reason defined using values from Appendix A.<br>2. Competitor Information recorded. |

### BR-OP-02: "On Hold" Discipline (ADR-005)
* **Rule:** Moving an opportunity to "On Hold" is a guarded transition.
* **Mandatory Fields:** `hold_reason` (Enum) and `reactivation_date` (Date).
* **Validation:** `reactivation_date` must be in the future.
* **Logic:** When `current_date >= reactivation_date`, the system must flag the opportunity as "Reactivation Overdue" in all insights views.
* **Audit Requirement:** Changes to `hold_reason` or `reactivation_date` must be recorded in audit history.

### BR-OP-03: Closed Lost Validation
* **Rule:** Moving an Opportunity to Closed Lost is a guarded transition.
* **Mandatory Fields:** `loss_reason`
* **Optional Fields:** `loss_notes`, `competitor_name`
* **Validation:** Closed Lost opportunities must retain historical stage, value, and contributor information for reporting purposes.

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
* **Rule:** Opportunity financial value is derived from associated Opportunity Items.
* **Calculation:**
  * `Extended Value = Quantity × Unit Price – Discount`
  * `Opportunity Value = Sum of Extended Values`
* **Constraint:** Opportunity Value is system-calculated and cannot be manually overridden.
* **Validation:** Opportunity Value must equal the total value of all active Opportunity Items.

### BR-FIN-04: Split Governance
* **Rule:** Contributor splits may be modified only while an Opportunity remains open.
* **Constraint:** Split changes must preserve the 100% allocation rule.
* **Audit Requirement:** All split changes must be captured in audit history.
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

### BR-ACT-01: Opportunity Support (ADR-006)
*   **Rule:** Every interaction (Activity) should ideally be linked to an **Opportunity** to count towards pipeline velocity.
*   **Logic:** Activities linked only to an Account (with no Opportunity) are classified as "Account Scanning/Profiling" and do not contribute to forecast confidence scores.

### BR-ACT-02: Manager Push (Logging)
*   **Rule:** Managers can log "Manager Notes" on any Opportunity.
*   **Visibility:** These are highlighted in the activity timeline and cannot be deleted or edited by the Sales Executive owner.

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
2.  **Order Cancellation:** If an "Order" is cancelled, does it go back to "Negotiation" or straight to "Lost"?
3.  **Tender Timeline:** If a Project (Tender) bid deadline is missed, does the system automatically mark all linked Opportunities as "Lost"?

---

# Appendix A: Reference Data

## Lead Source Values

The system shall support the following Lead Source values:

* WEBSITE
* REFERRAL
* EXISTING_CUSTOMER
* PRINCIPAL
* DISTRIBUTOR
* TENDER
* EVENT
* COLD_OUTREACH
* OTHER

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

