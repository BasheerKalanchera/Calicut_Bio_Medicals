# Business Rule Implementation Matrix v1.0

## 1. Business Rule Implementation Matrix

| Rule ID | Rule Description | Implementation Layer | Component | Justification |
| :--- | :--- | :--- | :--- | :--- |
| BR-PL-01 | Quota Hierarchy | Database Constraint | `target_plan` table | Enforced via unique composite key (user_id, sbu_id, planning_period) and regex checks. |
| BR-PL-02 | Coverage Plan Strategy | Database Constraint | `coverage_plan_entry` table | Enforced via NOT NULL constraints on strategic objective and target revenue fields. |
| BR-PL-03 | Coverage Plan Traceability | Database Constraint | `coverage_plan` table | Enforced via NOT NULL FK to `target_plan_id`. |
| BR-PL-04 | Opportunity Origination Classification | Service Layer | `OpportunityService` | Business logic must map coverage deals to the correct `lead_source_id`. |
| BR-OP-00 | Opportunity Creation Flexibility | Service Layer | `OpportunityService` | Business logic validating historical stage requirements on creation. |
| BR-OP-01 | Stage Transition Exit Criteria | Service Layer | `OpportunityService` | Workflow logic validating payload completeness based on target stage exit criteria. |
| BR-OP-02 | "On-Hold" Status Discipline | Service Layer | `OpportunityService` | Cross-field business validation (Hold Reason, Reactivation Date) during status change. |
| BR-OP-03 | Lost Status Validation | Service Layer | `OpportunityService` | Cross-field business validation (Loss Reason, Competitor Name) during status change. |
| BR-OP-04 | Opportunity Project Association | Database Constraint | `opportunity` table | Enforced structurally by ensuring `project_id` is a nullable FK. |
| BR-OP-05 | Status Transition Rules | Service Layer | `OpportunityService` | Validates WON prerequisites (PO Number, Products) via state machine logic. |
| BR-OP-06 | Stalled Opportunity Detection | Service Layer | `OpportunityService` | Executed by OpportunityMonitoringJob (or OpportunityLifecycleJob) which periodically evaluates inactivity criteria and invokes OpportunityService. |
| BR-OP-07 | Forecasting & Pipeline Inclusion | Repository Layer | `OpportunityRepository` | Excludes LOST/ON_HOLD/STALLED via SQL query filters during retrieval. |
| BR-OP-08 | Win Probability Rules | Service Layer | `OpportunityService` | Manages default stage values versus explicit manual user overrides. |
| BR-OP-09 | Terminal Status Governance | Service Layer | `OpportunityService` | Prevents state transitions and edits on WON/LOST records. |
| BR-OP-10 | Default Opportunity Status | Service Layer | `OpportunityService` | Automates the default ACTIVE status assignment before database insertion. |
| BR-PROJ-01 | Project Lifecycle | Service Layer | `ProjectService` | Status transition constraints (e.g., bid_submission_date required for BID_SUBMITTED). |
| BR-FIN-01 | Contributor Split Validation | Service Layer | `SplitService` | Atomic transaction validation ensuring total equals exactly 100%. |
| BR-FIN-02 | Value Representation | Database Constraint | `opportunity_item` table | Structural enforcement via `NUMERIC(15,2)` precision schemas. |
| BR-FIN-03 | Opportunity Value Calculation | Database View | `vw_opportunities_with_value` | Dynamically derived based on `opportunity_item` rows per ADR-026. |
| BR-FIN-04 | Split Governance | Service Layer | `SplitService` | State-aware validation preventing updates on closed opportunities. |
| BR-FIN-05 | Default Opportunity Split Assignment | Service Layer | `SplitService` | Business logic automation auto-generating 100% split to the deal creator. |
| BR-ACC-01 | Stakeholder Sentiment | Repository Layer | `AccountRepository` | Account Health calculated dynamically via aggregated stakeholder NPS at query time. |
| BR-ACC-02 | Payer Behavior | Database Constraint | `account` table | Enforced structurally via `CHECK IN` constraint. |
| BR-ACT-01 | Activity Account Requirement | Database Constraint | `activity` table | Enforced via `account_id NOT NULL` constraint. |
| BR-ACT-02 | Manager Push (Logging) | Supabase RLS | `ActivityRLSPolicy` | Prevents Sales Executive owner from updating/deleting manager notes. |
| BR-ACT-03 | Activity Account Database Enforcement | Database Constraint | `activity` table | Redundant structural database enforcement for BR-ACT-01. |
| BR-AUD-01 | Business Auditability | Service Layer | `BaseService` | Application logic standardizing `created_by` and `updated_by` metadata population. |

---

## 2. Database Implementation Backlog

**Implemented via Constraints & Views:**
*   **BR-PL-01:** `UNIQUE (user_id, sbu_id, planning_period)` and `CHECK (planning_period ~ '^\d{4}-Q[1-4]$')` on `target_plan`
*   **BR-PL-02:** `NOT NULL` constraints on `strategic_objective` and `target_revenue_lakhs` in `coverage_plan_entry`
*   **BR-PL-03:** `NOT NULL` FK constraint on `target_plan_id` in `coverage_plan`
*   **BR-OP-04:** `NULLABLE` FK constraint on `project_id` in `opportunity`
*   **BR-FIN-02:** `NUMERIC(15,2)` precision on all financial columns
*   **BR-FIN-03:** `vw_opportunities_with_value` view
*   **BR-ACC-02:** `CHECK IN ('GOOD', 'AVERAGE', 'PROBLEMATIC', 'UNKNOWN')` on `payer_behavior` in `account`
*   **BR-ACT-01 / BR-ACT-03:** `NOT NULL` constraint on `account_id` in `activity`

---

## 3. Service Layer Implementation Backlog

**OpportunityService**
*   BR-PL-04: Opportunity Origination Classification
*   BR-OP-00: Opportunity Creation Flexibility
*   BR-OP-01: Stage Transition Exit Criteria
*   BR-OP-02: "On-Hold" Status Discipline
*   BR-OP-03: Lost Status Validation
*   BR-OP-05: Status Transition Rules
*   BR-OP-06: Stalled Opportunity Detection
*   BR-OP-08: Win Probability Rules
*   BR-OP-09: Terminal Status Governance
*   BR-OP-10: Default Opportunity Status

**ProjectService**
*   BR-PROJ-01: Project Lifecycle

**SplitService**
*   BR-FIN-01: Contributor Split Validation
*   BR-FIN-04: Split Governance
*   BR-FIN-05: Default Opportunity Split Assignment

**AccountService**
*   *(No rules assigned exclusively to Service Layer. Handled via Repository Layer logic: BR-ACC-01)*

**CoveragePlanService**
*   *(No rules assigned exclusively to Service Layer. Handled via DB constraints)*

**ActivityService**
*   *(No rules assigned exclusively to Service Layer. Handled via DB constraints & RLS)*

---

## 4. Security Implementation Backlog

**Supabase RLS & Authorization**
*   **BR-ACT-02:** `ActivityRLSPolicy` must be configured to ensure standard users cannot `UPDATE` or `DELETE` records where `activity_type = 'MANAGER_NOTE'` or similar classifications.

---

## 5. API Validation Backlog

**Pydantic / FastAPI Validations**
*   *(No complex business rules assigned purely to Pydantic schemas. Schemas will handle UUID formats, required fields, basic data types, and length constraints.)*

---

## 6. Future Business Decisions

These items were documented as future discussion items in the `Business-Rules.md` appendix. They are unresolved business decisions, not approved business rules or implementation gaps:

*   **UNR-01 (Split Approval):** Does a cross-SBU split require approval from both SBU managers?
*   **UNR-02 (Tender Timeline):** If a Project (Tender) bid deadline is missed, does the system automatically mark all linked Opportunities as "Lost"?

---

## 7. Implementation Readiness Assessment

*   **Approved Rules Reviewed:** 27
*   **Approved Rules Assigned:** 27
*   **Approved Rules Unassigned:** 0
*   **Traceability Score:** 100%
*   **Final Recommendation:** READY FOR IMPLEMENTATION
