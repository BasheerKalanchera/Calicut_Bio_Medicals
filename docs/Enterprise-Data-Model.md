# Cabio Sales OS - Enterprise Data Model (Phase 1)

**Version:** 3.0  
**Role:** Chief Data Architect  
**Status:** Architecture Consistency Review Implemented (June 20, 2026)  
**Previous Version:** 2.0 (Baseline — derived from ADR.md and GEMINI.md, June 18, 2026)

---

# 1. Purpose
The Enterprise Data Model (EDM) serves as the structural foundation for the Cabio Sales OS. It translates the "Operating System" philosophy into a formal entity architecture, ensuring that every piece of data captured supports the ultimate goal: **Quota Achievement via disciplined Pipeline Execution.** It standardizes terminology across the frontend (React), backend (FastAPI), and database (PostgreSQL/Supabase).

---

# 2. Design Principles

1.  **Planning Hierarchy (ADR-001/ADR-013):** Data must flow from Quota Targets to Coverage Strategy, then to Opportunity leads, and finally to Revenue.
2.  **Strategic Isolation (ADR-009):** The model must support Row-Level Security (RLS) to isolate SBU data while enabling organizational rollups.
3. **Project-Centric Opportunity Grouping (ADR-004):** Projects serve as the primary business grouping mechanism for Opportunities. Tenders are modeled using Projects rather than introducing a separate Tender entity.
4.  **Influence Mapping (ADR-007):** Sentiment (NPS) is tracked at the stakeholder level to provide a granular view of account dynamics.
5.  **Auditability (ADR-017):** Transactional states (Stage, Probability, Value) must be historically traceable.
6.  **Activity Context (ADR-006):** Every Activity must be associated with an Account. Activities may optionally be linked to a Project and/or Opportunity to provide additional business context. Orphaned activities are not permitted.

---

## 3. Core Business Domains

1.  **Planning:** Quota management and strategic account coverage.
2.  **Organization & Reference:** SBU structure, zone assignment, and master data (LeadSource).
3.  **Account Management:** Hospital hierarchies and demographic profiles.
4.  **Stakeholder Management:** Influence mapping and relationship health.
5.  **Project Management:** Tenders and expansion initiative tracking.
6.  **Opportunity Management:** Pipeline execution and contributor splits.
7.  **Product Management:** Equipment catalog and technical collaterals.
8.  **Activity Management:** Interaction logs and support task tracking.
9.  **Document Management:** Regulatory and sales document storage.
10. **Identity & Access:** Organizational structure and SBU assignments.

---

# 4. Conceptual Data Model

| Business Entity | Description | Business Owner |
| :--- | :--- | :--- |
| **SBU** | Strategic Business Unit — owns Products, Target Plans, and defines the security boundary. | Admin |
| **Zone** | Geographic or organisational zone used for reporting and security scoping. Not used for target allocation. | Admin |
| **LeadSource** | Master list of opportunity origination channels (e.g., Coverage Plan, Referral, Tender). | Admin |
| **OpportunityStage** | Master list of approved pipeline stages (Lead to Delivery). | Admin |
| **OpportunityStatus** | Master list of operational states (Active, Won, Lost, etc.). | Admin |
| **LossReason** | Categorized reasons for why an Opportunity was lost. | Admin |
| **HoldReason** | Categorized reasons for placing an Opportunity On-Hold. | Admin |
| **ProjectStatus** | Master list of operational states for a Project. | Admin |
| **Target Plan** | Annual/Quarterly revenue quotas assigned to a user and SBU. | General Manager |
| **Coverage Plan** | Quarterly strategic mapping of accounts to a sales executive. | Sales Manager |
| **Coverage Plan Entry** | Strategic account-level coverage objectives and revenue targets within a Coverage Plan. | Sales Manager |
| **Account** | The hospital or medical institution entity. Supports hierarchy. | Admin |
| **Stakeholder** | A key individual within an account (Doctor, Purchase, Biomed). | Sales Manager |
| **Installed Asset** | Equipment installed at a hospital, including competitor equipment. | Sales Executive |
| **Project** | A Tender or major Expansion initiative at an account. | Sales Manager |
| **Opportunity** | A specific revenue lead for medical equipment. | Sales Executive |
| **OpportunityStakeholder** | Junction entity mapping Stakeholders to Opportunities with influence level and decision role. | Sales Executive |
| **Opportunity Item** | Product-level line items associated with an Opportunity. | Sales Executive |
| **Split** | The percentage of revenue credit shared across users/SBUs for a deal. | General Manager |
| **Product** | Medical machine specifications and collaterals. | Admin |
| **Document** | File metadata and references associated with Accounts, Projects, Opportunities, or Products. | Sales Executive |
| **Activity** | A logged interaction (Call, Visit, Demo) associated with an Account, Project, or Opportunity. | Sales Executive |
| **Reminder** | Follow-ups and tasks linked to an Activity and assigned to a user. | Sales Executive |
| **User** | System user with assigned SBU, Zone, and Role. | Admin |
| **Role** | Defines permissions and responsibilities within the system. | Admin |

---

# 5. Logical Data Model

### 5.1 Planning Entities

* **Target Plan**
  * *Description:* High-level quota definition for a user, SBU, and planning period.
  * *Relationships:* User (Many:1), SBU (Many:1).
  * *Key Attributes:* `target_amount_lakhs`, `sbu_id` (FK → SBU), `planning_period` (VARCHAR, YYYY-Qn format, e.g., `2026-Q1`).
  * *Cardinality:* 1 User has M Target Plans across SBUs and planning periods. A user cannot have two overlapping target plans for the same SBU in the same planning period.
  * *Reference:* ADR-018 (Organizational Structure Entities), ADR-019 (Planning Calendar Model).

* **Coverage Plan**
  * *Description:* The quarterly strategy for which accounts to "cover."
  * *Relationships:* User (Many:1), Target Plan (Many:1), Coverage Plan Entries (1:Many).
  * *Key Attributes:* `target_plan_id` (FK → Target Plan), `planning_period` (VARCHAR, YYYY-Qn).
  * *Cardinality:* 1 User has M Coverage Plans; 1 Coverage Plan contains M Coverage Plan Entries. Every Coverage Plan must trace back to a Target Plan.
  * *Reference:* ADR-013 (Planning Hierarchy), BR-PL-03 (Coverage Plan Traceability).

* **Coverage Plan Entry**
  * *Description:* Coverage assignment for a specific Account within a Coverage Plan.
  * *Relationships:* Coverage Plan (Many:1), Account (Many:1).
  * *Attributes:* Coverage Frequency, Strategic Objective, Target Revenue (Lakhs).
  * *Cardinality:* 1 Coverage Plan Entry belongs to 1 Coverage Plan and references 1 Account.

---

### 5.2 Organizational & Reference Entities

* **SBU** *(Strategic Business Unit)*
  * *Description:* The primary organizational division driving product ownership, quota planning, and data security boundaries.
  * *Relationships:* Product (1:Many), Target Plan (1:Many), User (1:Many).
  * *Key Attributes:* `sbu_id`, `name`, `description`.
  * *Cardinality:* 1 SBU owns M Products. 1 SBU has M Target Plans. 1 SBU has M Users.
  * *Reference:* ADR-018 (Organizational Structure Entities), ADR-016 (Product Category Simplification).

* **Zone**
  * *Description:* Geographic or organisational zone. Used for reporting and security scoping only. Not used for target allocation.
  * *Relationships:* User (1:Many).
  * *Key Attributes:* `zone_id`, `name`, `description`.
  * *Cardinality:* 1 Zone has M Users. 1 User belongs to 1 Zone.
  * *Reference:* ADR-018 (Organizational Structure Entities).

* **LeadSource**
  * *Description:* Master reference entity defining the origination channels for Opportunities. Managed by Admin. Values are configurable without schema changes.
  * *Relationships:* Opportunity (1:Many).
  * *Key Attributes:* `lead_source_id`, `name`, `description`, `is_active` (Boolean).
  * *Seed Values:* `COVERAGE_PLAN`, `REFERRAL`, `EXISTING_CUSTOMER`, `TENDER`, `OEM_REFERRAL`, `WEBSITE`, `COLD_CALL`, `WALK_IN`, `OTHER`.
  * *Cardinality:* 1 LeadSource value is referenced by M Opportunities.
  * *Reference:* ADR-020 (LeadSource Master Entity).

* **OpportunityStage**
  * *Description:* Master reference entity defining the formal pipeline stages.
  * *Relationships:* Opportunity (1:Many).
  * *Key Attributes:* `stage_id`, `stage_code`, `stage_name`, `display_order` (Integer), `default_win_probability` (Numeric), `is_active` (Boolean).
  * *Seed Values:* LEAD (5%), QUALIFIED (20%), DEMO (35%), CLINICAL_EVALUATION (55%), NEGOTIATION (70%), ORDER (90%), DELIVERY_INSTALLATION (95%).
  * *Cardinality:* 1 OpportunityStage value is referenced by M Opportunities.
  * *Reference:* ADR-028 (Opportunity Stage and Status Decoupling Model).

* **OpportunityStatus**
  * *Description:* Master reference entity defining the operational state of a deal.
  * *Relationships:* Opportunity (1:Many).
  * *Key Attributes:* `status_id`, `status_code`, `status_name`, `is_terminal` (Boolean), `is_system_generated` (Boolean), `is_active` (Boolean).
  * *Seed Values:*
    
    | Status  | is_terminal | is_system_generated |
    | ------- | ----------- | ------------------- |
    | ACTIVE  | FALSE       | FALSE               |
    | ON_HOLD | FALSE       | FALSE               |
    | STALLED | FALSE       | TRUE                |
    | WON     | TRUE        | FALSE               |
    | LOST    | TRUE        | FALSE               |
    
    *Note:*
    * STALLED is system-generated based on inactivity rules.
    * WON and LOST are terminal statuses and cannot be reopened in Phase 1.
  * *Cardinality:* 1 OpportunityStatus value is referenced by M Opportunities.
  * *Reference:* ADR-028 (Opportunity Stage and Status Decoupling Model).

* **LossReason**
  * *Description:* Master reference entity categorizing why a deal was lost.
  * *Relationships:* Opportunity (1:Many).
  * *Key Attributes:* `loss_reason_id`, `reason_code`, `reason_name`, `is_active` (Boolean).
  * *Cardinality:* 1 LossReason value is referenced by M Opportunities.
  * *Reference:* BR-OP-03 (Lost Status Validation).

* **HoldReason**
  * *Description:* Master reference entity categorizing why an Opportunity is placed On-Hold.
  * *Relationships:* Opportunity (1:Many).
  * *Key Attributes:* `hold_reason_id`, `reason_code`, `reason_name`, `is_active` (Boolean).
  * *Seed Values:* CUSTOMER_DELAY, BUDGET_PENDING, PROCUREMENT_DELAY, REGULATORY_APPROVAL_PENDING, COMPETITOR_EVALUATION, INTERNAL_RESOURCE_CONSTRAINT, OTHER.
  * *Cardinality:* 1 HoldReason value is referenced by M Opportunities.

* **ProjectStatus**
  * *Description:* Master reference entity defining the lifecycle status of a Project.
  * *Relationships:* Project (1:Many).
  * *Key Attributes:* `status_id`, `status_code`, `status_name`, `is_active` (Boolean).
  * *Seed Values:* DRAFT, ACTIVE, BID_SUBMITTED, AWARDED, LOST, CLOSED.
  * *Cardinality:* 1 ProjectStatus value is referenced by M Projects.

* **Product**
  * *Description:* Represents a sellable medical equipment product offered by Cabio.
  * *Relationships:* SBU (Many:1), Opportunity Item (1:Many), Installed Asset (1:Many).
  * *Key Attributes:* `product_id`, `sbu_id` (FK → SBU), `name`, `oem_name` (Text), `model_number` (Text), `category_name` (Text), `description` (Text), `is_active` (Boolean).
  * *Note:* `category_name` supports basic reporting (e.g., Ultrasound, Ventilator) without introducing a complex category hierarchy, adhering to Phase 1 constraints.

---

### 5.3 Execution Entities

* **Account**
  * *Description:* Central entity for all sales activity.
  * *Relationships:* Parent Account (Many:1), Stakeholders (1:Many), Projects (1:Many), Activities (1:Many), Installed Assets (1:Many), Managing SBU (Many:1).
  * *Key Attributes:* `managing_sbu_id` (FK → SBU, nullable).
  * *Security Note:* While Accounts are globally visible, `managing_sbu_id` explicitly designates the SBU holding edit rights, fulfilling ADR-009 "SBU Scoped (Edit)" without relying on audit metadata such as `created_by`.

* **Stakeholder**
  * *Description:* Holds individual NPS and Decision roles. Sentiment tracked at stakeholder level, not account level.
  * *Relationships:* Account (Many:1), Opportunities (Many:Many via OpportunityStakeholder).

* **Project**
  * *Description:* The Tender vehicle or strategic expansion initiative.
  * *Relationships:* Account (Many:1), Opportunities (1:Many), Owner/User (Many:1), Activities (1:Many), ProjectStatus (Many:1).
  * *Key Attributes:* `owner_id` (FK → User, NOT NULL), `status_id` (FK → ProjectStatus, NOT NULL). Default owner is the record creator.
  * *Reference:* ADR-022 (Project Ownership Model).

* **Opportunity**
  * *Description:* The core revenue vehicle.
  * *Relationships:* Account (Many:1), Project (Many:1, **nullable**), Opportunity Items (1:Many), Splits (1:Many), Activities (1:Many), LeadSource (Many:1), Stakeholders (Many:Many via OpportunityStakeholder).
  * *Key Attributes:*
    * `stage_id` (FK → OpportunityStage, NOT NULL)
    * `status_id` (FK → OpportunityStatus, NOT NULL)
    * `win_probability` (Numeric, defaults to Stage probability, may be overridden)
    * `loss_reason_id` (FK → LossReason, nullable, required if Status = LOST)
    * `loss_notes` (Text, nullable)
    * `competitor_name` (Text, nullable, free text, required if loss reason = COMPETITOR_WON)
    * `lead_source_id` (FK → LeadSource, nullable)
    * `indicative_value` (Numeric 15,2, nullable — used when no Opportunity Items exist)
    * `hold_reason_id` (FK → HoldReason, nullable, required when Status = ON_HOLD)
    * `reactivation_date` (Date — required when status = ON_HOLD)
    * `project_id` (FK → Project, **nullable** — Opportunities may exist without a Project)
  * *Value Logic:* When Opportunity Items exist, calculated value is authoritative. When no items exist, `indicative_value` is used. See BR-FIN-03.
  * *Reference:* ADR-014 (Account→Project→Opportunity), ADR-020 (LeadSource), ADR-026 (Dual-Mode Valuation), ADR-028 (Stage/Status Decoupling).

* **OpportunityStakeholder** *(Junction Entity)*
  * *Description:* Maps Stakeholders to Opportunities at the deal level, with influence and role attributes specific to that Opportunity.
  * *Relationships:* Opportunity (Many:1), Stakeholder (Many:1).
  * *Key Attributes:*
    * `opportunity_id` (FK → Opportunity, NOT NULL)
    * `stakeholder_id` (FK → Stakeholder, NOT NULL)
    * `influence_level` (Enum: HIGH, MEDIUM, LOW — differentiates stakeholder impact on the specific opportunity)
    * `decision_role` (Text — e.g., Decision Maker, Influencer, End User, Gatekeeper)
    * `notes` (Text, nullable)
  * *Cardinality:* 1 Opportunity can have M Stakeholders; 1 Stakeholder can be linked to M Opportunities via this junction.
  * *Reference:* ADR-021 (OpportunityStakeholder Junction Entity).

* **Split**
  * *Description:* Revenue attribution logic.
  * *Relationships:* Opportunity (Many:1), User (Many:1).

* **Opportunity Item**
  * *Description:* A product-level line item associated with an Opportunity.
  * *Relationships:* Opportunity (Many:1), Product (Many:1).
  * *Attributes:* Quantity, Unit Price, Discount, Extended Value.
  * *Cardinality:* 1 Opportunity has M Opportunity Items.

* **Activity**
  * *Description:* A logged interaction (Call, Visit, Demo, Email) that must be associated with an Account. Activities may optionally be linked to a Project and/or Opportunity to provide additional business context. (Immutable entity — cannot be edited or deleted).
  * *Relationships:* Account (Many:1, **mandatory**), Project (Many:1, **nullable**), Opportunity (Many:1, **nullable**), User/Owner (Many:1).
  * *Key Attributes:* `account_id` (FK → Account, **NOT NULL**), `project_id` (FK → Project, nullable), `opportunity_id` (FK → Opportunity, nullable), `activity_type`, `activity_date`, `notes`.
  * *Database Constraint:* `account_id NOT NULL`. No OR-based CHECK constraint is required. Project and Opportunity linkages are optional and enforced at the application layer.
  * *Cardinality:* 1 Account has M Activities. 1 Project has M Activities (optional linkage). 1 Opportunity has M Activities (optional linkage).
  * *Reference:* ADR-006 (Activity Account Requirement), BR-ACT-01, BR-ACT-03.

* **Reminder**
  * *Description:* Follow-up actions and user tasks linked to an Activity. Inherits business context (Account, Project, Opportunity) from the parent Activity.
  * *Relationships:* Activity (Many:1), User/Assignee (Many:1).
  * *Key Attributes:* `activity_id` (FK → Activity, NOT NULL), `assigned_to_user_id` (FK → User, NOT NULL), `due_date`, `reminder_text`, `is_completed`.
  * *Cardinality:* 1 Activity can have M Reminders. 1 User can have M Reminders assigned.
  * *Note:* Polymorphic reminder relationships (direct FK to Account, Project, or Opportunity) are not implemented in Phase 1. Context is resolved through the parent Activity.
  * *Reference:* ADR-023 (Reminder Context Model).

* **Installed Asset**
  * *Description:* Equipment installed at an Account, including both Cabio-sold and competitor equipment.
  * *Relationships:* Account (Many:1), Product (Many:1, **nullable**).
  * *Key Attributes:*
    * `product_id` (FK → Product, **nullable** — may be null for competitor equipment)
    * `is_competitor_equipment` (Boolean, default FALSE)
    * `competitor_product_name` (Text, nullable — populated when `is_competitor_equipment = TRUE`)
    * `installation_date`, `department`
  * *Application Constraint:* When `is_competitor_equipment = TRUE`, `product_id` may be NULL; `competitor_product_name` should be populated.
  * *Cardinality:* 1 Account has M Installed Assets.
  * *Reference:* ADR-027 (Installed Asset Competitor Equipment Model).

* **Document**
  * *Description:* File metadata and references. Actual files are stored in Supabase Storage; this entity stores metadata only.
  * *Relationships:* Account (Many:1, nullable), Project (Many:1, nullable), Opportunity (Many:1, nullable), Product (Many:1, nullable), Uploaded-by User (Many:1).
  * *Key Attributes:* `document_id`, `file_name`, `file_type`, `file_size_bytes`, `storage_path` (Supabase Storage reference), `account_id` (nullable FK), `project_id` (nullable FK), `opportunity_id` (nullable FK), `product_id` (nullable FK), `uploaded_by_user_id` FK, `uploaded_at`.
  * *Constraint:* At least one entity FK (`account_id`, `project_id`, `opportunity_id`, or `product_id`) must be non-null.
  * *Cardinality:* Business entities may have M Documents attached.
  * *Reference:* ADR-025 (Document Storage Architecture).

---

# 6. Entity Relationship Summary (Matrix)

| Source Entity | Relationship | Target Entity | Logic |
| :--- | :--- | :--- | :--- |
| **SBU** | 1 : M | **Product** | Products belong to exactly one SBU. |
| **SBU** | 1 : M | **Target Plan** | Target Plans are scoped to a User + SBU. |
| **SBU** | 1 : M | **User** | Users are assigned to one SBU. |
| **Zone** | 1 : M | **User** | Users are assigned to one Zone for reporting. |
| **User** | 1 : M | **Target Plan** | 1 User has separate quotas per SBU per quarter. |
| **User** | 1 : M | **Coverage Plan** | 1 User submits 1 coverage plan per quarter. |
| **Target Plan** | 1 : M | **Coverage Plan** | Every Coverage Plan traces back to a Target Plan. |
| **Coverage Plan** | 1 : M | **Coverage Plan Entry** | One coverage plan contains multiple account coverage entries. |
| **Coverage Plan Entry** | M : 1 | **Account** | Multiple coverage plan entries may reference the same account. |
| **Account** | 1 : M | **Stakeholder** | A hospital has many key contacts. |
| **Account** | 1 : M | **Project** | A hospital has many expansion/tender projects. |
| **Account** | 1 : M | **Installed Asset** | A hospital has many installed equipment records. |
| **Account** | 1 : M | **Activity** | Account is the mandatory context for all Activities. |
| **Account** | 1 : M | **Account** | Supports Parent/Child hierarchy (e.g., Hospital Chain). |
| **Project** | 1 : M | **Opportunity** | A tender can contain multiple machine leads. |
| **Project** | 1 : M | **Activity** | Activities can be linked to a Project. |
| **User** | M : 1 | **Project** | Every Project has one owner (User). |
| **Opportunity** | 1 : M | **Split** | One deal can be shared by multiple reps. |
| **Opportunity** | 1 : M | **Activity** | Many interactions drive one deal. |
| **Opportunity** | 1 : M | **Opportunity Item** | An opportunity contains product line items. |
| **Opportunity** | M : M | **Stakeholder** | Stakeholders are mapped to Opportunities via OpportunityStakeholder. |
| **LeadSource** | 1 : M | **Opportunity** | Each Opportunity has one Lead Source. |
| **OpportunityStage** | 1 : M | **Opportunity** | Opportunities exist at a single stage. |
| **OpportunityStatus** | 1 : M | **Opportunity** | Opportunities have a single operational status. |
| **LossReason** | 1 : M | **Opportunity** | Lost opportunities must specify a reason. |
| **HoldReason** | 1 : M | **Opportunity** | On-Hold opportunities must specify a Hold Reason. |
| **Activity** | 1 : M | **Reminder** | Reminders inherit context from their parent Activity. |

---

# 7. Master Data vs Transaction Data

| Master Data (Static/Reference) | Transaction Data (Dynamic/Volatile) |
| :--- | :--- |
| **SBU** (Business Unit Definitions) | **Opportunities** (Deals) |
| **Zone** (Geographic/Org Zones) | **Opportunity Items** (Deal Line Items) |
| **LeadSource** (Origination Channels) | **Target Plans** (Quotas) |
| **OpportunityStage** (Pipeline Stages) | **Coverage Plans** (Quarterly Strategies) |
| **OpportunityStatus** (Operational States) | **Coverage Plan Entries** (Account Coverage Strategy) |
| **LossReason** (Loss Categories) | **Activities** (Interaction Logs) |
| **HoldReason** (Hold Categories) | |
| **Accounts** (Hospital Profiles) | **Splits** (Attribution Records) |
| **Stakeholders** (Contacts) | **Coverage Plan Entries** (Account Coverage Strategy) |
| **Products** (Equipment Catalog) | **Activities** (Interaction Logs) |
| **Installed Assets** (Installed Equipment) | **Splits** (Attribution Records) |
| **Users** (Employee Directory) | **Projects** (Tender Lifecycles) |
| **Roles** (Security Definitions) | **Documents** (Attachments) |
| | **Reminders** (Tasks & Follow-ups) |
| | **OpportunityStakeholder** (Deal-Level Influence Mapping) |

---

# 8. Security Classification (ADR-009)

| Entity | Scoping Logic | Visibility Level |
| :--- | :--- | :--- |
| **SBU** | Organizational Reference | **Global** (Read) / **Admin** (Edit) |
| **Zone** | Organizational Reference | **Global** (Read) / **Admin** (Edit) |
| **LeadSource** | Reference Data | **Global** (Read) / **Admin** (Edit) |
| **Accounts** | Shared Reference | **Global** (Read) / **SBU Scoped** (Edit) |
| **Target Plans** | Individual Quota | **User Scoped** (Owner) / **Global** (GM Rollup) |
| **Coverage Plans** | Territory Specific | **User Scoped** (Owner) / **SBU Scoped** (Manager) |
| **Opportunities** | Revenue Sensitive | **User Scoped** (Owner/Split) / **SBU Scoped** (Manager) |
| **Projects** | Tender Specific | **SBU Scoped** |
| **Activities** | Personal Logs | **User Scoped** (Owner) / **SBU Scoped** (Manager) |
| **Products** | Reference Data | **Global** |

---

# 9. Audit Requirements

Based on the requirement for pipeline discipline and accountability, the following entities require immutable history logging:

1.  **Opportunities:** Track `Stage`, `Status`, `Win Probability`, `Expected Value`, and `Expected Closure Date`.
2.  **Splits:** Track any changes to revenue attribution percentage.
3.  **Target Plans:** Track changes to quotas post-approval.
4.  **Coverage Plans:** Track strategic objective shifts.
5.  **Projects:** Track `Tender Deadline` and `Bid Status` changes.

---

# 10. Future Extension Points

1.  **Financial Module:** `Invoices`, `Payments`, and `Outstanding` linked to Opportunities.
2.  **Service Module:** `AMC/CMC Contracts`, `Service Tickets`, and Service History.
3.  **Competitor Module:** `Competitor Brands` and `Market Share` analysis. The `competitor_product_name` field on Installed Asset provides the Phase 1 foundation.
4.  **Marketing Module:** `Campaign ROI` and `Lead Source` attribution analysis. The LeadSource master entity provides the Phase 1 foundation.
5.  **Product Hierarchy:** Sub-categories within SBUs may be introduced in a future phase if required.

---

# 11. Conflicts & Assumptions

### 🚩 Resolved Conflicts (Architecture Consistency Review — June 20, 2026)
The following conflicts identified in v2.0 have been resolved:

* **Opportunity Value (CBR-01):** Resolved via dual-mode valuation (indicative_value + calculated value). See ADR-026 and BR-FIN-03.
* **Opportunity Project Relationship (CBR-02):** Confirmed. `project_id` is nullable on Opportunity. Opportunities may exist without Projects.
* **Activity Context (CBR-03):** Resolved. Every Activity must be associated with an Account. Activities may optionally be linked to a Project and/or Opportunity to provide additional business context. `account_id` is NOT NULL; `project_id` and `opportunity_id` are nullable. Documentation clarified June 20, 2026 to correct an inconsistency between the OR-based CHECK constraint (CBR-03 disposition language) and the intended domain model (Account always mandatory).
* **Closed Lost Competitor Rule (CBR-04):** Resolved. `competitor_name` required only when `loss_reason = COMPETITOR_WON`.
* **ARCH-001 / MA-03 — Opportunity Stage vs. Status Model:** Resolved. The architecture for Won/Lost state management is finalized. The system adopts Option B: "Won" and "Lost" are Operational Statuses, not Pipeline Stages. Stage and Status are fully decoupled into separate master entities (`OpportunityStage`, `OpportunityStatus`). Approved on June 20, 2026.

### 🚩 Active Conflicts
*   **Planning Terminology:** The PRD uses "Beat Planning" and "Visit Counts". This model **strictly follows ADR-002 and GEMINI.md**, implementing "Coverage Planning" without visit scheduling.
*   **Project Scope:** The PRD identifies Projects as "out of scope" for Phase 1. This model **follows GEMINI.md and the Prototype**, treating Projects (Tenders) as a core functional entity.

### ⏳ Pending Decisions
* (None)

### 📝 Assumptions
1.  **Shared Accounts:** It is assumed that Accounts (Hospitals) are shared across SBUs, but the *Opportunities* within them are isolated by SBU.
2.  **Currency:** All financial values are modeled as Decimal/Numeric to avoid floating-point errors, specifically in INR Lakhs.
3.  **NPS Aggregation:** The system will eventually require an algorithm to aggregate Stakeholder NPS into an "Account Health" score (to be defined in Business Logic).
4.  **Planning Period:** Planning periods follow the Indian Fiscal Year (April–March) in `YYYY-Qn` format.
5.  **Zone Allocation:** Zone assignment is informational and does not drive target allocation in Phase 1.
6.  **Document Context:** Every Document must be attached to at least one business entity (Account, Project, Opportunity, or Product). Unattached documents are not permitted.
