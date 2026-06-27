# Cabio Sales OS - Complete Architecture Decision Register (ADR)

This document serves as the formal Architecture Decision Register for the Cabio Sales OS project, compiled from the PRD, GEMINI.md mandates, Traceability Matrix, Phase 0B prototype evolution, and Architecture Consistency Review dispositions.

**Last Updated:** June 27, 2026 — ADR-029 and ADR-030 added (frontend performance architecture decisions from Customer Directory and Customer 360 implementation).

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
* **Status:** Accepted (Mandated by GEMINI.md; updated by ACR — MFK-02)
* **Rationale:** Revenue outcomes should be driven by planned targets and strategic account coverage rather than reactive opportunity management. This hierarchy aligns sales execution activities with business growth objectives.
* **Impact:** Coverage Plans must carry a `target_plan_id` FK to link back to the originating Target Plan, enforcing the Target → Coverage traceability. Opportunity traceability to Coverage Plans is maintained through the Lead Source classification model (ADR-020). Revenue performance must be traceable to Opportunities. Dashboards, forecasts, and management reviews must align with this hierarchy.
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
*   **Status:** Accepted (Implemented in Prototype App.jsx; updated by ACR — MA-07)
*   **Rationale:** High-value hospital setups require cross-collaboration (e.g., Imaging + Critical Care). A unified Opportunity with split credit prevents "double-counting" in organizational rollups.
*   **Impact:** Revenue rollups must calculate `Value × Split%`. SBU isolation logic must allow cross-SBU read access for shared deals. When no split is explicitly entered during Opportunity creation, the system automatically creates a 100% split assigned to the opportunity creator, ensuring the 100% allocation rule is always satisfied from the point of creation.
*   **Affected Modules:** Opportunity Pipeline, Target Planning, Insights.

### ADR-004: Tender Consolidation within Projects
*   **Decision:** Model tenders using the `Project` entity rather than introducing a separate `Tender` entity.
*   **Status:** Accepted (Mandated by GEMINI.md)
*   **Rationale:** Tenders share the same lifecycle, document requirements, and account relationships as major hospital expansion projects. Consolidating them avoids entity bloat.
*   **Impact:** Projects become the primary business grouping mechanism for both strategic initiatives and tender-driven pursuits. Tender-specific attributes will only be introduced when supported by approved business requirements.
*   **Affected Modules:** Account Management, Opportunity Pipeline.

### ADR-005: Forced Pipeline Reactivation Discipline
*   **Decision:** Moving an opportunity to the "On-Hold" status strictly requires a `hold_reason_id` and a `reactivation_date`.
*   **Status:** Accepted (Implemented in Prototype App.jsx / PRD 2.7; Updated via Architecture Review for Status decoupling)
*   **Rationale:** Prevents "parking" dead deals in the pipeline to artificially inflate forecasts. Forces a systematic review of stagnant deals.
*   **Impact:** Status transition rules require multi-field validation. Requires dashboard alerts for overdue hold reactivations.
*   **Affected Modules:** Opportunity Pipeline, Action Reminders.

### ADR-006: Hierarchical Activity Support Flow
*   **Decision:** Every Activity must be associated with an Account. Activities may optionally be linked to a Project and/or Opportunity to provide additional business context. Activities exist to support Opportunity Progression, Project-Level Engagement, or Strategic Account Development — and may be created before an Opportunity exists.
*   **Status:** Accepted (Mandated by GEMINI.md; updated by ACR — CBR-03, ADD-06; documentation clarified June 20, 2026)
*   **Rationale:** In Cabio's medical equipment sales domain, all interactions occur with or at a customer account. Account is therefore the mandatory anchor for every Activity. Project and Opportunity linkages provide optional additional business context that supports pipeline velocity tracking, project engagement reporting, and activity classification. Requiring Account prevents orphaned activity records and ensures all activity history is always directly accessible from the Account view without requiring joins through Project or Opportunity.
*   **Impact:** Activity entity: `account_id` FK (**NOT NULL** — mandatory), `project_id` FK (nullable — optional Project linkage), `opportunity_id` FK (nullable — optional Opportunity linkage). The database-level enforcement is `account_id NOT NULL`. No OR-based CHECK constraint is required.
*   **Affected Modules:** Sales Execution, Activity Timelines, Business Rules Engine, Database Infrastructure.

### ADR-014: Account → Project → Opportunity Relationship Model

* **Decision:** Use Projects as the primary business grouping mechanism between Accounts and Opportunities.
* **Status:** Accepted (PRD, GEMINI.md, Prototype Evolution)
* **Rationale:** Medical equipment sales are frequently driven by expansion programs, modernization initiatives, tender programs, and capital expenditure projects. Grouping Opportunities under Projects provides business context and improves reporting.
* **Impact:** Opportunities may optionally belong to Projects. `project_id` is nullable on the Opportunity entity. Project-level forecasting, stakeholder engagement tracking, activity tracking, and reporting become possible. Government tender scenarios will be modeled using the same relationship structure.
* **Affected Modules:** Account Management, Project Management, Opportunity Pipeline, Reporting, Stakeholder Management.

### ADR-015: Opportunity Creation at Any Sales Stage

* **Decision:** Opportunities may be created at any stage of the sales lifecycle and are not required to originate as Leads.
* **Status:** Accepted (Prototype Behavior & Business Requirement)
* **Rationale:** Medical equipment sales do not always follow a traditional lead-to-order journey. Opportunities frequently enter the system at different stages based on field intelligence, tenders, referrals, or direct customer engagement.
* **Impact:** Opportunity creation workflows, APIs, and validation logic must support creation at any stage. Pipeline reports and conversion metrics must not assume Lead-originated opportunities.
* **Affected Modules:** Opportunity Pipeline, Forecasting, Reporting, Business Rules Engine, API Layer.

### ADR-018: Organizational Structure Entities — SBU and Zone

* **Decision:** Formally model Strategic Business Unit (SBU) and Zone as first-class database entities with defined attributes and relationships.
* **Status:** Accepted (ACR — ME-01, ME-02)
* **Rationale:** SBUs are referenced throughout the data model (Products, Target Plans, Coverage Plans, Users, Security). Zone is used for reporting and organizational structure. Both require formal entity representation to support consistent FK references, RLS policy evaluation, and administrative management without hardcoding values.
* **Impact:**
  * **SBU entity:** `sbu_id`, `name`, `description`. Relationships: Product (1:M), Target Plan (1:M), User (M:1).
  * **Zone entity:** `zone_id`, `name`, `description`. Relationships: User (M:1).
  * Zone is **not** used for target allocation. Zone is used for reporting and security scoping only.
* **Affected Modules:** Product Catalog, Target Planning, Coverage Planning, Security Model, Reporting, User Management.

### ADR-019: Planning Calendar Model — Period Format and Fiscal Year

* **Decision:** Standardize the planning period format as `YYYY-Qn`. Define the fiscal year as the Indian Fiscal Year (April–March).
* **Status:** Accepted (ACR — MA-01, MA-02)
* **Rationale:** An undefined planning period format creates inconsistency across Target Plans, Coverage Plans, and reporting. The Indian Fiscal Year (April–March) aligns with the customer's business calendar and standard accounting practices in India.
* **Impact:**
  * Planning period stored as `VARCHAR` in `YYYY-Qn` format (e.g., `2026-Q1`).
  * Fiscal quarter mapping: Q1 = April–June, Q2 = July–September, Q3 = October–December, Q4 = January–March.
  * All fiscal period references across the system must follow this convention.
* **Affected Modules:** Target Planning, Coverage Planning, Reporting, Forecasting.

### ADR-022: Project Ownership Model

* **Decision:** Every Project must have an `owner_id` FK referencing the User entity. The default owner is the record creator. Ownership may be reassigned by a manager.
* **Status:** Accepted (ACR — MR-02, ADD-05)
* **Rationale:** Projects (including tenders) require clear ownership for accountability, pipeline reporting, and security scoping. Without an owner, project-level forecasting and performance metrics cannot be attributed to a responsible user.
* **Impact:** Project entity gains `owner_id` FK (→ User, NOT NULL). The application layer sets `owner_id` to the creator's user ID on record creation. Ownership reassignment requires manager-level permission. RLS policies on Project may use `owner_id` for user-scoped access.
* **Affected Modules:** Project Management, Account Management, Reporting, Security Model.

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

### ADR-020: LeadSource Master Entity

* **Decision:** Introduce a LeadSource master entity. Add a `lead_source_id` FK to the Opportunity entity. Coverage Plan traceability is represented through a `COVERAGE_PLAN` Lead Source value — not through a direct FK from Opportunity to Coverage Plan Entry.
* **Status:** Accepted (ACR — MFK-04, ADD-01, ADD-02)
* **Rationale:** Tracking the origin of Opportunities is critical for pipeline analytics and coverage plan effectiveness measurement. A master entity allows Lead Source values to be managed without schema changes. Coverage Plan traceability is maintained through the `COVERAGE_PLAN` Lead Source value without introducing a brittle FK that couples Opportunity to a specific Coverage Plan Entry record.
* **Impact:**
  * LeadSource entity: `lead_source_id`, `name`, `description`, `is_active`.
  * Opportunity entity gains `lead_source_id` FK (→ LeadSource, nullable).
  * Initial seed values: `COVERAGE_PLAN`, `REFERRAL`, `EXISTING_CUSTOMER`, `TENDER`, `OEM_REFERRAL`, `WEBSITE`, `COLD_CALL`, `WALK_IN`, `OTHER`.
* **Affected Modules:** Opportunity Pipeline, Coverage Planning, Reporting, Lead Source Analytics.

### ADR-021: OpportunityStakeholder Junction Entity

* **Decision:** Add an OpportunityStakeholder junction entity linking Opportunities to Stakeholders, with influence-level and role attributes at the Opportunity level.
* **Status:** Accepted (ACR — MR-04, ADD-03)
* **Rationale:** Stakeholders influence Opportunities differently from their general relationship with an Account. Opportunity-level stakeholder mapping enables influence tracking, execution planning, and relationship intelligence at the deal level. A junction entity supports M:M cardinality and allows rich attributes on the relationship itself.
* **Impact:**
  * OpportunityStakeholder entity: `opportunity_id` FK, `stakeholder_id` FK, `influence_level` (Enum: HIGH, MEDIUM, LOW), `decision_role` (Text), `notes` (Text).
  * Relationship: Opportunity ↔ Stakeholder is M:M via this junction.
* **Affected Modules:** Opportunity Pipeline, Stakeholder Management, Account Management.

### ADR-023: Reminder Context Model — Activity-Linked Reminders

* **Decision:** Reminders are linked to Activities via an `activity_id` FK. Reminders inherit business context (Account, Project, Opportunity) from the parent Activity. Polymorphic Reminder relationships are not implemented in Phase 1.
* **Status:** Accepted (ACR — MFK-06, ADD-04)
* **Rationale:** Polymorphic relationships (where a FK can reference multiple different tables) require complex application logic and cannot be enforced by standard referential integrity constraints. Routing Reminder context through Activity is simpler, consistent, and sufficient for Phase 1 requirements.
* **Impact:** Reminder entity carries `activity_id` FK (→ Activity) and `assigned_to_user_id` FK (→ User). Reminder does not carry direct FKs to Account, Project, or Opportunity. Business context is resolved by traversing the parent Activity record.
* **Affected Modules:** Activity Management, Action Reminders, Notifications.

### ADR-026: Opportunity Value Model — Dual-Mode Valuation

* **Decision:** Support dual-mode Opportunity valuation. When no Opportunity Items exist, `indicative_value` (manually entered) serves as the working pipeline estimate. When Opportunity Items are added, the system-calculated value (sum of line item extended values) becomes authoritative and overrides `indicative_value` for all pipeline and forecast calculations.
* **Status:** Accepted (ACR — CBR-01)
* **Rationale:** Early-stage opportunities frequently lack product-level detail. Forcing line item entry before products are confirmed blocks pipeline creation and reduces adoption. `indicative_value` allows pipeline planning without premature product commitment. Once items are added, the system enforces calculated accuracy.
* **Impact:** Opportunity entity gains `indicative_value` (Numeric 15,2, nullable). Application logic: if Opportunity Items exist → use calculated value; if no items exist → use `indicative_value`. BR-FIN-03 updated accordingly.
* **Affected Modules:** Opportunity Pipeline, Financial Reporting, Forecasting.

### ADR-027: Installed Asset Competitor Equipment Model

* **Decision:** Extend the Installed Asset entity to support competitor equipment. `product_id` becomes nullable. Add `is_competitor_equipment` (Boolean) and `competitor_product_name` (Text) attributes.
* **Status:** Accepted (ACR — MA-04)
* **Rationale:** Salespeople need to track competitor equipment installed at accounts for competitive analysis and replacement opportunity identification. A nullable `product_id` with competitor flags avoids the need for a separate competitor product catalog in Phase 1.
* **Impact:** Installed Asset: `product_id` nullable. `is_competitor_equipment` (Boolean, default FALSE). `competitor_product_name` (Text, nullable). Application constraint: when `is_competitor_equipment = TRUE`, `product_id` may be NULL and `competitor_product_name` should be populated.
* **Affected Modules:** Account Management, Installed Asset Tracking, Opportunity Pipeline.

---

## 4. Security Architecture

### ADR-009: SBU-Level Data Isolation via RLS
*   **Decision:** Implement Row-Level Security (RLS) to restrict Sales Executives to data strictly within their assigned SBU (Imaging vs. Critical Care), while allowing Managers/GMs rollup visibility.
*   **Status:** Accepted (Implementation Plan & PRD)
*   **Rationale:** Prevents data clutter and competitive conflicts between SBUs while maintaining a single source of truth for the enterprise.
*   **Impact:** Supabase/PostgreSQL schema must heavily utilize RLS policies based on the authenticated user's SBU token claims.
*   **Affected Modules:** Database Infrastructure, Auth Context, All Queries.

### ADR-024: Authentication Strategy — Supabase auth.users and user_profiles

* **Decision:** Use Supabase `auth.users` as the identity provider, combined with a `public.user_profiles` extension table for all business-specific user attributes.
* **Status:** Accepted (ACR — MA-06)
* **Rationale:** Supabase `auth.users` handles authentication and session management. Business attributes (SBU assignment, Zone, Role) must be stored separately to allow RLS policy evaluation without modifying the auth schema, which is owned and managed by Supabase.
* **Impact:** `auth.users` stores identity and credentials. `user_profiles` stores `sbu_id`, `zone_id`, `role_id`, display name, and other business attributes. RLS policies reference `user_profiles` for data scoping decisions. The `user_profiles` table uses the same UUID primary key as `auth.users`.
* **Affected Modules:** Identity & Access, Database Infrastructure, Security Architecture, All Modules using Auth Context.

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

* **Decision:** Use PostgreSQL audit logging mechanisms and database triggers to capture changes to business-critical entities.
* **Status:** Accepted (Foundation Architecture Decision)
* **Rationale:** Provides immutable server-side auditability independent of application logic.
* **Impact:** PostgreSQL triggers and a centralized audit_log table will capture changes to critical business entities. The audit_log table is a technical implementation artifact and must not be modeled as an EDM business entity. Dedicated audit dashboards, audit search screens, and audit reports remain out of scope for Phase 1.
* **Consequences:** Audit history will be generated automatically by the database and exposed through reporting APIs when required.
* **Affected Modules:** Database Infrastructure, Security Architecture, User Management, Product Management, Account Management, Opportunity Pipeline, Target Planning, Coverage Planning.

### ADR-025: Document Storage Architecture — Supabase Storage with Metadata Entity

* **Decision:** Store document files in Supabase Storage. The Document entity in the relational database stores metadata only (file name, type, size, storage path, and linked entity references).
* **Status:** Accepted (ACR — MA-05, ADD-07)
* **Rationale:** Storing binary files in the relational database increases backup size, query latency, and operational complexity. Supabase Storage provides scalable, cost-effective object storage with access control integrated with Supabase Auth.
* **Impact:**
  * Document entity attributes: `document_id`, `file_name`, `file_type`, `file_size_bytes`, `storage_path`, `account_id` (nullable FK), `project_id` (nullable FK), `opportunity_id` (nullable FK), `product_id` (nullable FK), `uploaded_by_user_id` FK, `uploaded_at`.
  * At least one entity FK (`account_id`, `project_id`, `opportunity_id`, or `product_id`) must be non-null.
  * Application-level constraint enforces document context; no polymorphic FK used.
* **Affected Modules:** Document Management, Account Management, Project Management, Opportunity Pipeline, Product Catalog.

### ADR-029: Lazy Batch COUNT Endpoint for Aggregate Metrics

* **Decision:** Aggregate counts per account (stakeholder, project, opportunity, asset) are served by a dedicated `GET /accounts/counts?ids=...` endpoint using 4 batch `GROUP BY account_id` queries. The frontend fires this endpoint lazily — after the list renders — and merges the results into account state.
* **Status:** Accepted (June 27, 2026)
* **Rationale:** Two alternatives were explicitly evaluated and rejected:
  * *Correlated scalar subqueries in the list query* — executes N × 4 index lookups per list page (N = page size). At 500 accounts with 50 opportunities each, this adds O(N × 4) database operations to every directory load. Rejected for scale.
  * *Counts embedded in `AccountListResponse`* — permanently couples list endpoint latency to count query performance. Rejected because counts are secondary context that do not block the directory render and should not delay it.
  * *Chosen approach* — a dedicated batch endpoint runs 4 `GROUP BY` queries, each scanning indexed rows for all requested IDs in a single pass. Cost is O(1 scan × 4) regardless of page size. The frontend fires it in the background after the directory list renders; results merge into account state and the SWR cache so that subsequent back-navigations return counts instantly.
* **Impact:** New `GET /accounts/counts` endpoint in the account router. Must be declared before `GET /{account_id}` to avoid route collision. Frontend `CustomerDirectoryScreen` fires the counts request in the background after the list renders. Merged results stored in the module-level SWR cache. `Customer360Screen` receives counts via `initialAccount` prop on navigation.
* **Affected Modules:** Account Management (backend router, repository, service), Customer Directory Screen, Customer 360 Screen.

### ADR-030: CSS-Hidden Always-Mounted Screens for Back-Navigation

* **Decision:** Screens the user navigates back to (screens that are the "parent" in a list → detail navigation flow) stay mounted in the DOM behind a Tailwind `hidden` class. They are never unmounted on navigation.
* **Status:** Accepted (June 27, 2026)
* **Rationale:** The rejected alternative — conditional `&&` rendering — unmounts the component on navigation to a child screen and remounts it on return. This resets all component state (scroll position, filter values, search input, in-flight data) and triggers a full data refetch. Stale-While-Revalidate caching partially mitigates the refetch cost, but scroll position and UI state cannot be recovered from a cache. The chosen approach matches the pattern used by all production mobile navigation frameworks (iOS `UINavigationController`, Android back stack, React Navigation Stack Navigator): the parent screen stays in memory while the child is on top.
* **Impact:** In `DemoApp.jsx`, list/directory screens are wrapped in a div that is always rendered but toggled between `""` and `"hidden"` class. Detail screens (`Customer360Screen`) continue to conditionally mount/unmount — they receive full `initialData` from the parent on mount, so remount cost is negligible. This pattern must be applied to all future list → detail navigation pairs in the application.
* **Affected Modules:** `DemoApp.jsx`, all future list screens (Coverage Plans, Opportunities pipeline, Target Plans). Does not affect modal dialogs or overlays.

### ADR-028: Opportunity Stage and Status Decoupling Model
* **Decision:** Formally adopt the decoupled architecture (Option B) where Won and Lost are operational statuses, not pipeline stages. Stages and Statuses will be implemented as reference/master data entities rather than hardcoded enums.
* **Status:** Accepted (Approved June 20, 2026 via Architecture Specification)
* **Rationale:** A decoupled model allows the stage to be permanently preserved at the point of win or loss, enabling accurate pipeline leakage analysis ("Where are we losing deals?"). Implementing these as master data allows dynamic configuration of display orders, default win probabilities, and operational flags (e.g., `is_terminal`) without schema changes. The model also encompasses the automated system-driven "Stalled" status triggered by 180 days of inactivity.
* **Impact:**
  * New master entities: `OpportunityStage` and `OpportunityStatus`.
  * `Opportunity` entity uses `stage_id` and `status_id` foreign keys.
  * Stalled background job required for 180-day inactivity detection.
* **Affected Modules:** Opportunity Pipeline, Forecasting, Reporting, Business Rules Engine.
