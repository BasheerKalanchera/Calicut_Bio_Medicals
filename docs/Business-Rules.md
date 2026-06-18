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
BR-PL-03: Coverage Plan Traceability
Rule: Every Coverage Plan must be associated with an approved Target Plan.
Constraint: Coverage Plans cannot be created unless a Target Plan exists for the same User, SBU, and Planning Period.
Purpose: Maintains the Target → Coverage → Opportunity → Revenue planning hierarchy.

---

# 3. Opportunity Management & Stage Gates

### BR-OP-01: Stage Transition Exit Criteria
Opportunities must satisfy specific "Gate" requirements before progressing to the next stage.

| Transition | Mandatory Requirements |
| :--- | :--- |
| **Lead -> Qualified** | 1. At least one **Stakeholder** linked.<br>2. **Lead Source** defined. |
| **Qualified -> Demo** | 1. **Expected Demo Period** (Start/End) defined.<br>2. **Product(s)** selected from Catalog. |
| **Demo -> Negotiation** | 1. **Demo Outcome** notes logged.<br>2. **Expected Closure Date** defined. |
| **Negotiation -> Order** | 1. **Final Value (Lakhs)** confirmed.<br>2. **PO Number** (or Reference) entered. |
| **Any -> Closed Won** | 1. **Handover Checklist** all items set to TRUE.<br>2. **Delivery Notes** mandatory. |

### BR-OP-02: "On Hold" Discipline (ADR-006)
*   **Rule:** Moving an opportunity to "On Hold" is a guarded transition.
*   **Mandatory Fields:** `hold_reason` (Enum) and `reactivation_date` (Date).
*   **Validation:** `reactivation_date` must be in the future.
*   **Logic:** When `current_date >= reactivation_date`, the system must flag the opportunity as "Reactivation Overdue" in all insights views.

---

# 4. Financial & Revenue Split Rules

### BR-FIN-01: Contributor Split Validation (ADR-003)
*   **Rule:** Every Opportunity must have at least one assigned owner/contributor.
*   **Constraint:** The sum of `split_percentage` across all contributors for a single Opportunity **MUST EQUAL EXACTLY 100.00%**.
*   **Scope:** Splits can cross SBUs (e.g., Imaging 60%, Critical Care 40%) but the total remains 100%.

### BR-FIN-02: Value Representation
*   **Rule:** All financial fields (Opportunity Value, Quota, Target Revenue) are captured in **INR Lakhs**.
*   **Precision:** Numeric(15, 2).

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

### BR-AUD-01: Immutable Stage History
*   **Rule:** Every change to an Opportunity's `stage`, `probability`, or `value_lakhs` must create an entry in the `opportunity_history` table.
*   **Fields:** `old_value`, `new_value`, `changed_by`, `timestamp`.

---

# 8. Unresolved Logic (Needs Discussion)
1.  **Split Approval:** Does a cross-SBU split require approval from both SBU managers?
2.  **Order Cancellation:** If an "Order" is cancelled, does it go back to "Negotiation" or straight to "Lost"?
3.  **Tender Timeline:** If a Project (Tender) bid deadline is missed, does the system automatically mark all linked Opportunities as "Lost"?
