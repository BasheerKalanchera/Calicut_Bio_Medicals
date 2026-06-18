# Cabio Sales OS - Complete Architecture Decision Register (ADR)

This document serves as the formal Architecture Decision Register for the Cabio Sales OS project, compiled from the PRD, GEMINI.md mandates, Traceability Matrix, and Phase 0B prototype evolution. 

---

## 1. Product Architecture

### ADR-001: Sales Operating System Paradigm
*   **Decision:** The system is explicitly designed as a "Sales Operating System" rather than a traditional CRM.
*   **Status:** Accepted (Mandated by GEMINI.md)
*   **Rationale:** The focus is on quota achievement, workflow standardization, and pipeline execution rather than generic contact management. It enforces a strict planning hierarchy: Target -> Coverage -> Opportunity -> Revenue.
*   **Impact:** Terminology replaces "Customer 360" with "Account Management". Feature prioritization heavily favors performance insights and pipeline velocity over generic data entry.
*   **Affected Modules:** Global System Terminology, Core Navigation.

### ADR-013: Target → Coverage → Opportunity → Revenue Planning Hierarchy

* **Decision:** Establish the primary Sales Operating Model hierarchy as Target Planning → Coverage Planning → Opportunity Planning → Revenue Achievement.
* **Status:** Accepted (Mandated by GEMINI.md)
* **Rationale:** Revenue outcomes should be driven by planned targets and strategic account coverage rather than reactive opportunity management. This hierarchy aligns sales execution activities with business growth objectives.
* **Impact:** Coverage Plans must be traceable to Targets. Opportunities must be traceable to Coverage Plans. Revenue performance must be traceable to Opportunities. Dashboards, forecasts, and management reviews must align with this hierarchy.
* **Affected Modules:** Target Planning, Coverage Planning, Opportunity Pipeline, Reporting, Forecasting, Performance Insights.

---

## 2. Business Architecture

### ADR-002: Strategic Coverage Planning over Visit Scheduling
*   **Decision:** Implement Quarterly Account Coverage Planning based on strategic objectives and revenue targets, explicitly rejecting daily/weekly route mapping ("Beat Planning").
*   **Status:** Accepted (Mandated by GEMINI.md)
*   **Rationale:** Capital equipment sales cycles are long and strategic. Counting daily visits creates false productivity metrics. The focus must remain on strategic account penetration.
*   **Impact:** Removes `plannedVisitCount` and calendar routing logic. Replaces with `target_revenue` and `strategic_objective` mapping at the account level.
*   **Affected Modules:** Sales Planning, Account Management.

### ADR-003: Multi-SBU Contributor Splits (100% Rule)
*   **Decision:** Opportunities support shared ownership across Strategic Business Units (SBUs) via a strict 100% split model.
*   **Status:** Accepted (Implemented in Prototype App.jsx)
*   **Rationale:** High-value hospital setups require cross-collaboration (e.g., Imaging + Critical Care). A unified Opportunity with split credit prevents "double-counting" in organizational rollups.
*   **Impact:** Revenue rollups must calculate `Value * Split%`. SBU isolation logic must allow cross-SBU read access for shared deals.
*   **Affected Modules:** Opportunity Pipeline, Target Planning, Insights.

### ADR-004: Tender Consolidation within Projects
*   **Decision:** Model tenders using the `Project` entity rather than introducing a separate `Tender` entity.
*   **Status:** Accepted (Mandated by GEMINI.md)
*   **Rationale:** Tenders share the same lifecycle, document requirements, and account relationships as major hospital expansion projects. Consolidating them avoids entity bloat.
*   **Impact:** Projects become the primary business grouping mechanism for both strategic initiatives and tender-driven pursuits. Tender-specific attributes will only be introduced when supported by approved business requirements.
*   **Affected Modules:** Account Management, Opportunity Pipeline.

### ADR-005: Forced Pipeline Reactivation Discipline
*   **Decision:** Moving an opportunity to "On Hold" strictly requires a `hold_reason` and a `reactivation_date`.
*   **Status:** Accepted (Implemented in Prototype App.jsx / PRD 2.7)
*   **Rationale:** Prevents "parking" dead deals in the pipeline to artificially inflate forecasts. Forces a systematic review of stagnant deals.
*   **Impact:** Pipeline state machine requires multi-field validation. Requires dashboard alerts for overdue hold reactivations.
*   **Affected Modules:** Opportunity Pipeline, Action Reminders.

### ADR-006: Hierarchical Activity Support Flow
*   **Decision:** Activities and Interactions exist to support either Opportunity Progression or Strategic Account Development.
*   **Status:** Accepted (Mandated by GEMINI.md)
*   **Rationale:** Activities should support either: Opportunity Progression OR Strategic Account Development. Activities may exist before an Opportunity is created.
Examples include relationship building, prospecting, installed base reviews, and account development activities.
*   **Impact:** `opportunity_id` is a primary linkage for interaction logs, tying daily effort directly to pipeline progression.
*   **Affected Modules:** Sales Execution, Activity Timelines.

### ADR-014: Account → Project → Opportunity Relationship Model

* **Decision:** Use Projects as the primary business grouping mechanism between Accounts and Opportunities.
* **Status:** Accepted (PRD, GEMINI.md, Prototype Evolution)
* **Rationale:** Medical equipment sales are frequently driven by expansion programs, modernization initiatives, tender programs, and capital expenditure projects. Grouping Opportunities under Projects provides business context and improves reporting.
* **Impact:** Opportunities may optionally belong to Projects. Project-level forecasting, stakeholder engagement tracking, activity tracking, and reporting become possible. Government tender scenarios will be modeled using the same relationship structure.
* **Affected Modules:** Account Management, Project Management, Opportunity Pipeline, Reporting, Stakeholder Management.

### ADR-015: Opportunity Creation at Any Sales Stage

* **Decision:** Opportunities may be created at any stage of the sales lifecycle and are not required to originate as Leads.
* **Status:** Accepted (Prototype Behavior & Business Requirement)
* **Rationale:** Medical equipment sales do not always follow a traditional lead-to-order journey. Opportunities frequently enter the system at different stages based on field intelligence, tenders, referrals, or direct customer engagement.
* **Impact:** Opportunity creation workflows, APIs, and validation logic must support creation at any stage. Pipeline reports and conversion metrics must not assume Lead-originated opportunities.
* **Affected Modules:** Opportunity Pipeline, Forecasting, Reporting, Business Rules Engine, API Layer.

---

## 3. Data Architecture

### ADR-007: Stakeholder-Centric Sentiment Modeling
*   **Decision:** Track NPS (Net Promoter Score) and Sentiment at the `Stakeholder` (Contact) level rather than the `Account` level.
*   **Status:** Accepted (Prototype Commit 0584715)
*   **Rationale:** Medical sales involves diverse stakeholders (HODs, Purchase, Biomed) with conflicting views. Individual tracking allows for precise influence mapping.
*   **Impact:** 1:M relationship for sentiments. Enables algorithmic calculation of overall Account Health based on aggregated stakeholder sentiment and influence levels.
*   **Affected Modules:** Account Management, Stakeholder Matrix.

### ADR-008: Period-Based Event Tracking
*   **Decision:** Transition from single-date tracking to period-based tracking for multi-day events (e.g., `demo_start_date` and `demo_end_date`).
*   **Status:** Accepted (Prototype Commit 0584715)
*   **Rationale:** Medical equipment evaluations (demos) are multi-day trials. Single dates fail to capture the resource allocation window.
*   **Impact:** Data models require date ranges. UI necessitates range pickers and overlap validation.
*   **Affected Modules:** Opportunity Pipeline, Product Catalog.

### ADR-016: Product Category Simplification for Phase 1

* **Decision:** For Phase 1, Product Category shall be represented directly by Strategic Business Unit (SBU).
* **Status:** Accepted (Mandated by GEMINI.md)
* **Rationale:** The current business operates through two primary SBUs (Imaging and Critical Care). Introducing additional product hierarchy levels would increase complexity without providing immediate business value.
* **Impact:** Product records belong to a single SBU. Reporting, target allocation, coverage planning, and visibility rules leverage the SBU structure directly. Additional hierarchy levels may be introduced in future phases if required.
* **Affected Modules:** Product Catalog, Opportunity Pipeline, Reporting, Target Planning, Coverage Planning, Security Model.

---

## 4. Security Architecture

### ADR-009: SBU-Level Data Isolation via RLS
*   **Decision:** Implement Row-Level Security (RLS) to restrict Sales Executives to data strictly within their assigned SBU (Imaging vs. Critical Care), while allowing Managers/GMs rollup visibility.
*   **Status:** Accepted (Implementation Plan & PRD)
*   **Rationale:** Prevents data clutter and competitive conflicts between SBUs while maintaining a single source of truth for the enterprise.
*   **Impact:** Supabase/PostgreSQL schema must heavily utilize RLS policies based on the authenticated user's SBU token claims.
*   **Affected Modules:** Database Infrastructure, Auth Context, All Queries.

---

## 5. UX Architecture

### ADR-010: Mobile-First Responsive State Navigation
*   **Decision:** Utilize dynamic UI components that switch from horizontal tabs to vertical dropdowns based on viewport width.
*   **Status:** Accepted (Prototype Commit 4d76806)
*   **Rationale:** Sales Executives primarily interact with the system on mobile devices while in the field. Dropdowns prevent horizontal scrolling in deep-nested views.
*   **Impact:** Strict CSS/Tailwind breakpoint rules for component rendering.
*   **Affected Modules:** UI Framework, Global Navigation.

### ADR-011: Unified Chronological Timelines with Client-Side Search
*   **Decision:** All activity histories (Customer, Opportunity, Project) render as reverse-chronological timelines equipped with real-time text filtering.
*   **Status:** Accepted (Prototype Commit bd66aca)
*   **Rationale:** Users need to quickly locate specific historical interactions (e.g., "when did we discuss pricing?") without paginating through complex logs.
*   **Impact:** Frontend requires robust state management for instantaneous filtering across nested activity objects.
*   **Affected Modules:** Activity Timeline, Interaction History.

---

## 6. Technical Architecture

### ADR-012: React + FastAPI + PostgreSQL (Supabase) Stack
*   **Decision:** The application will be built using a React (Vite) frontend, interacting with FastAPI endpoints, backed by a Supabase (PostgreSQL) database.
*   **Status:** Accepted (Traceability Matrix & Implementation Plan)
*   **Rationale:** Combines the rapid UI development of React, the robust data typing and async capabilities of FastAPI for complex business logic, and the BaaS speed/security (RLS) of Supabase for the data layer.
*   **Impact:** Defines the CI/CD pipeline, developer local setup, and repository structure for the upcoming Foundation period.
*   **Affected Modules:** Full System Stack.


### ADR-017: Phase 1 Audit Logging Strategy

* **Decision:** Implement centralized database-level audit logging for business-critical entities while deferring dedicated audit management screens to future phases. Audit logging is a technical infrastructure capability and does not introduce an Audit Log business entity into the Enterprise Data Model.
* **Status:** Accepted (Foundation Architecture Decision)
* **Rationale:** The system requires traceability and accountability for critical business changes without introducing unnecessary Phase 1 complexity. Audit history is an implementation concern rather than a business domain concept. The EDM defines what must be auditable; the Physical Data Model defines how auditability is implemented.
* **Impact:** PostgreSQL triggers and a centralized audit_log table will capture changes to critical business entities. The audit_log table is a technical implementation artifact and must not be modeled as an EDM business entity. Dedicated audit dashboards, audit search screens, and audit reports remain out of scope for Phase 1.
* **Affected Modules:** Database Infrastructure, Security Architecture, User Management, Product Management, Account Management, Opportunity Pipeline, Target Planning, Coverage Planning.
