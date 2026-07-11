# Cabio Sales OS - Complete Architecture Decision Register (ADR)

This document serves as the formal Architecture Decision Register for the Cabio Sales OS project, compiled from the PRD, GEMINI.md mandates, Traceability Matrix, Phase 0B prototype evolution, and Architecture Consistency Review dispositions.

**Last Updated:** July 3, 2026 — ADR-031 reconciliation note added (`Frontend-Implementation-Standards.md` and `CLAUDE.md` had drifted from the MUI/React Query/TypeScript decisions since June 30; see the note under ADR-031). Previous update: June 30, 2026 — ADR-031 through ADR-034 added (frontend stack migration to MUI + React Query + TypeScript; mobile deployment strategy).

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

### ADR-035: Account Is SBU-Agnostic — SBU Scoping Lives on Opportunity

* **Decision:** Remove any direct SBU affiliation from the Account entity. Accounts are global and zone-assigned only; SBU scoping is captured explicitly on the Opportunity entity (`sbu_id`, NOT NULL), stamped at creation from the creating user's current SBU and never auto-updated afterward.
* **Status:** Accepted (implemented in migration `0001`, 2026-06-26 — supersedes an earlier `Account.managing_sbu_id` design)
* **Rationale:** A hospital/institution (Account) commonly has activity across multiple SBUs simultaneously (e.g., both Imaging and Critical Care) — a single "owning SBU" per Account doesn't reflect that and would force artificial reclassification. The PRD itself never defines an SBU attribute on the Customer/Account entity (§B.2.6) — SBU association belongs to the User (§6.8, "Primary SBU") and the Product (§2.6), not the Account. Deriving Opportunity's SBU from the owner at query time was also rejected: if a rep changes SBU, that must not retroactively reclassify their historical opportunities, so `sbu_id` is stamped once at creation and is immutable except via explicit manager/admin override.
* **Impact:** `Account.managing_sbu_id` dropped; `Account.zone_id` added (NOT NULL FK → Zone — geographic/reporting scope only, not access control). `Opportunity.sbu_id` added (NOT NULL FK → SBU). Any query that previously scoped Accounts by SBU must be rewritten — Accounts are globally visible; SBU-based visibility applies to Opportunities/Targets beneath them, not to the Account itself. This decision was originally captured only in `docs/ARCHIVE/account_entity_restructuring_summary.md` (an implementation memo, not a numbered ADR); this entry formalizes it as the authoritative record.
* **Affected Modules:** Account Management, Opportunity Pipeline, Reporting, Security Model.

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

### ADR-036: Customer Type as Fixed Enum, Not a Master Entity

* **Decision:** Model `Account.customer_type` (institution nature — Multispeciality Hospital, Specialty Hospital, Diagnostic Center, Clinic, Dealer, Medical College Hospital, Government Hospital, Other) as a fixed, code-defined enum with a DB `CHECK` constraint, not a separate master/reference table.
* **Status:** Accepted (2026-07-11)
* **Rationale:** `Cabio Sales OS – Phase 1 - PRD.md` §B.2.6 defines a closed, specific 8-value list for institution nature, with no indication it should be admin-manageable — contrast with §6.8 ("Organization Structure Management"), which explicitly lists SBU, Zone, PIN Code mapping, and Teams as entities needing admin CRUD, and does not include Customer Type. Unlike `LeadSource` (ADR-020 above), whose values are expected to grow as new marketing/referral channels emerge without a code deploy, Customer Type is a fixed classification scheme that would only change following a deliberate product/business-rule decision — at which point a migration is the right tool anyway. Matches the existing `PayerBehavior` pattern (Good/Average/Problematic/Unknown) already used on the same entity.
* **Impact:** `Account.customer_type` is a nullable `VARCHAR(50)` with a `CHECK` constraint enumerating the 8 values (migration `0005`), backed by a Python `StrEnum` (`app/domains/account/schemas.py`). Frontend renders it as a hardcoded dropdown, same as Payer Behavior — no master-data list endpoint, no admin CRUD screen. If this ever needs to become admin-configurable, that's a new decision requiring its own ADR revision, not an assumption to build around now.
* **Affected Modules:** Account Management, Customer Directory, Customer 360.

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
*   **Status:** Accepted (Prototype Commit 4d76806) — **Superseded by ADR-031** for implementation mechanism. The mobile-first principle and tab/dropdown responsive behaviour remain in force; the Tailwind breakpoint mandate is replaced by MUI's responsive system.
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

### ADR-031: Frontend UI Framework — Material UI

* **Decision:** Migrate from Tailwind CSS to Material UI (MUI) as the sole frontend UI framework. All existing screens are rewritten using MUI components. All future screens are built in MUI from the start. A hybrid approach (Tailwind base + selective MUI) is explicitly rejected.
* **Status:** Accepted (June 30, 2026) — Supersedes the Tailwind implementation mandate in ADR-010.
* **Rationale:** Three factors drove this decision:
  * **Required components:** MUI provides four components critical for Phase 1 that would otherwise require custom implementation — `Autocomplete` (type-to-search dropdowns for accounts, products, users), `DatePicker` (demo scheduling, follow-up dates, expected close dates), `Drawer` (slide-in navigation with built-in focus trap, ARIA attributes, scroll lock), and `BottomNavigation` (permanent bottom tab bar for thumb-zone mobile navigation).
  * **Migration cost timing:** With 3 more parts remaining in Phase 1, migrating on the current ~5-screen codebase costs approximately 12–15 days. Deferring until after Parts 2–4 makes the migration 3–4× larger. The migration window is now.
  * **Hybrid rejection:** A Tailwind-base + selective MUI approach was evaluated and rejected. Two coexisting styling systems create visual inconsistency and developer context-switching that compounds with every new screen added.
* **Impact:**
  * All existing Tailwind `className`-based JSX replaced with MUI component equivalents (`Box`, `Stack`, `TextField`, `Button`, `Dialog`, `Tabs`, `Autocomplete`, `Drawer`, `BottomNavigation`, etc.).
  * A single MUI theme file is defined at application root, configured to preserve the current design language: primary blue (`#2563eb`), `borderRadius: 12`, card shadow conventions.
  * `ThemeProvider` wraps the application root.
  * `Frontend-Implementation-Standards.md` requires full revision after migration is complete.
  * Tailwind and its Vite plugin are removed from `package.json` and `vite.config.js` after migration.
* **Affected Modules:** All frontend screens and components. `DemoApp.jsx` navigation shell. `Frontend-Implementation-Standards.md`.
* **Reconciliation Note (2026-07-03):** This ADR's own Impact section required `Frontend-Implementation-Standards.md` to be revised after migration completion; that revision did not happen when it should have. Between June 30 and July 3, six further screens/components were built or extended (`Customer360Screen.tsx`, `OpportunityPipelineScreen.tsx`, `OpportunityDetailScreen.tsx`, `NextActionsScreen.tsx`, `LogActivityModal.tsx`, `ActivityTimeline.tsx`) without the MUI conversion this ADR mandates, alongside three pre-existing screens (`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`, `ProjectDirectoryScreen.jsx`) and `ErrorBoundary.jsx` that were never touched — `LoginScreen.tsx` and `FormModal.tsx` remain the only fully MUI-compliant files in the app. `CLAUDE.md`'s Architecture section independently drifted in parallel, restating "React + Vite + Tailwind" as the stack after this ADR was accepted, which reinforced the drift in every session that read it since. Both documents were reconciled on 2026-07-03: `CLAUDE.md` now points at this ADR instead of restating the stack inline, and `Frontend-Implementation-Standards.md` (bumped to v2.0) documents MUI + React Query + TypeScript as the standard, with an explicit per-file Migration Tracking table (§9) for the twelve files still pending conversion and one file (`App.jsx`, prototype-only) explicitly marked out of scope. This ADR's original decision — hybrid Tailwind+MUI approach rejected — was **re-affirmed, not revisited**, during reconciliation; full MUI conversion remains the target for every in-scope file. Screen-body migration proceeds incrementally; `Frontend-Implementation-Standards.md` §9 is the authoritative status, not this note.

### ADR-032: Frontend Data Fetching — TanStack React Query

* **Decision:** Adopt TanStack React Query (`@tanstack/react-query`) as the data fetching and server-state caching layer. All module-level SWR cache implementations and `useEffect` + `useState` fetch patterns are replaced with `useQuery` and `useMutation` hooks.
* **Status:** Accepted (June 30, 2026)
* **Rationale:** Manual SWR cache code has accumulated ~150 lines across two screens (`CustomerDirectoryScreen`, `Customer360Screen`) and already replicates React Query's core behaviours: stale-while-revalidate, background refresh, mount guards, and cache invalidation. This accumulation will continue with every new screen added. React Query provides these patterns out of the box, plus automatic retry on network failure, request deduplication, and configurable `staleTime` — all directly valuable for a mobile PWA used on hospital networks with variable connectivity. The parallel count pattern (ADR-029) and the always-mounted navigation pattern (ADR-030) both integrate cleanly with React Query's cache model.
* **Impact:**
  * Install `@tanstack/react-query`. Wrap application root in `QueryClientProvider`.
  * All module-level cache `Map` objects (`accountListCache`, `tabDataCache`, `accountDataCache`) are deleted.
  * All `useEffect` fetch logic with manual loading/error state is replaced with `useQuery`.
  * All create/update operations replace manual async handlers with `useMutation` + `queryClient.invalidateQueries`.
  * API service functions (`services/*.ts`) remain unchanged — they become the `queryFn` callables.
  * The ADR-029 parallel count pattern is implemented as a dependent `useQuery` that fires after the list query resolves, preserving the same parallel execution behaviour.
* **Affected Modules:** `CustomerDirectoryScreen`, `Customer360Screen`, `ProjectDirectoryScreen`, `ProductCatalogScreen`, `DemoApp.jsx`. All future screens.

### ADR-033: Frontend Type Safety — TypeScript and openapi-typescript

* **Decision:** Migrate the frontend codebase from JavaScript (`.jsx`/`.js`) to TypeScript (`.tsx`/`.ts`). Adopt `openapi-typescript` to auto-generate TypeScript types from the FastAPI OpenAPI specification, establishing end-to-end type coverage from backend Pydantic models to React components.
* **Status:** Accepted (June 30, 2026)
* **Rationale:** The domain model contains complex interrelated entities (Account, Opportunity, OpportunityItem, InstalledAsset, Stakeholder, Project, CoveragePlan, TargetPlan) passed between services, screens, and modals without type contracts. Without TypeScript, a backend field rename or nullability change is a silent runtime bug. Pydantic enforces types at the API boundary at runtime; TypeScript enforces types within the frontend at compile time. `openapi-typescript` closes the gap between the two: types are generated directly from FastAPI's `/openapi.json`, so any Pydantic model change immediately surfaces as a frontend compile error. The codebase is currently small enough that migration is manageable before Parts 2–4 add significant new surface area.
* **Impact:**
  * All `.jsx` files renamed to `.tsx`; all `.js` files renamed to `.ts`.
  * `tsconfig.json` added to `sales-os-app/`.
  * `openapi-typescript` installed as a dev dependency. A `generate:types` script added to `package.json` that fetches `/openapi.json` from the running backend and outputs to `src/types/api.ts`.
  * All API service functions annotated with return types derived from generated API types.
  * All component props, state variables, and hook return values typed explicitly.
* **Affected Modules:** All frontend source files. Build pipeline (`tsconfig.json`, `package.json` scripts).

### ADR-028: Opportunity Stage and Status Decoupling Model
* **Decision:** Formally adopt the decoupled architecture (Option B) where Won and Lost are operational statuses, not pipeline stages. Stages and Statuses will be implemented as reference/master data entities rather than hardcoded enums.
* **Status:** Accepted (Approved June 20, 2026 via Architecture Specification)
* **Rationale:** A decoupled model allows the stage to be permanently preserved at the point of win or loss, enabling accurate pipeline leakage analysis ("Where are we losing deals?"). Implementing these as master data allows dynamic configuration of display orders, default win probabilities, and operational flags (e.g., `is_terminal`) without schema changes. The model also encompasses the automated system-driven "Stalled" status triggered by 180 days of inactivity.
* **Impact:**
  * New master entities: `OpportunityStage` and `OpportunityStatus`.
  * `Opportunity` entity uses `stage_id` and `status_id` foreign keys.
  * Stalled background job required for 180-day inactivity detection.
* **Affected Modules:** Opportunity Pipeline, Forecasting, Reporting, Business Rules Engine.

---

## 7. Deployment Architecture

### ADR-034: Mobile Deployment Strategy — PWA Phase 1, Capacitor iOS Phase 2

* **Decision:** Phase 1: Deploy as a Progressive Web App (PWA). Phase 2: Wrap the existing React application in Capacitor for iOS distribution via TestFlight when push notifications become a business requirement. Android remains PWA permanently unless App Store presence is explicitly required.
* **Status:** Accepted (June 30, 2026)
* **Rationale:**
  * **PWA for Phase 1:** A PWA eliminates all app store overhead while delivering a near-native experience. On Android, Chrome provides a native "Install App" banner and PWA capabilities are first-class (push notifications, unrestricted storage, background sync). The single React + FastAPI + Supabase codebase serves desktop browsers, Android home screen, and iOS home screen without modification.
  * **Capacitor for iOS (Phase 2):** iOS Safari imposes hard limits on PWA capability that cannot be mitigated in application code: push notifications require iOS 16.4+ and prior home screen installation; storage is capped at ~50MB; background sync is unavailable. For a sales team operating in hospitals with variable connectivity and requiring follow-up reminders, these are real ceilings. Capacitor wraps the existing React application in a native iOS shell, resolving all limitations, while leaving the React codebase, FastAPI backend, and Supabase Auth completely unchanged. Distribution via TestFlight (not the public App Store) allows direct team distribution with no per-build review cycle after initial submission.
  * **Android stays PWA:** Android PWA support is native-quality and has none of the iOS limitations. Capacitor for Android is not built unless Play Store presence becomes a business requirement, at which point it can be added with minimal incremental effort since the Capacitor build infrastructure already exists for iOS.
* **Known iOS PWA Constraints (Phase 1):** The client must be informed of these upfront:
  * Install flow is manual (Share → Add to Home Screen); an in-app step-by-step guidance banner must be shown to iOS users on first visit.
  * Push notifications are unavailable below iOS 16.4 and require home screen installation.
  * PWA storage is capped at ~50MB (sufficient for app shell only; data requires connectivity).
  * No background sync; all data operations require the app to be in the foreground.
* **Impact:**
  * Phase 1: `vite-plugin-pwa` added to the Vite build for manifest generation, service worker (Workbox), and precaching of static assets. PWA manifest configured with `display: standalone`, theme colour, and icons at 192×192 and 512×512.
  * Phase 1: iOS install guidance banner component built to detect iOS (`navigator.userAgent`) and non-standalone mode (`navigator.standalone === false`), shown on first visit.
  * Phase 2 (iOS): Capacitor CLI and `@capacitor/ios` installed when push notification requirement is confirmed. `@capacitor/push-notifications` plugin integrated. Apple Developer Program membership ($99/year) and Mac build machine (or CI service) required.
  * No backend changes required at either phase. The same FastAPI REST APIs serve all deployment targets.
* **Affected Modules:** Frontend build pipeline (`vite.config.ts`, `package.json`). iOS native shell (Phase 2). CI/CD pipeline (Phase 2 Mac build step).
