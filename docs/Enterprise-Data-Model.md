# Cabio Sales OS - Enterprise Data Model (Phase 1)

**Version:** 2.0  
**Role:** Chief Data Architect  
**Status:** Baseline (Derived from ADR.md and GEMINI.md)

---

# 1. Purpose
The Enterprise Data Model (EDM) serves as the structural foundation for the Cabio Sales OS. It translates the "Operating System" philosophy into a formal entity architecture, ensuring that every piece of data captured supports the ultimate goal: **Quota Achievement via disciplined Pipeline Execution.** It standardizes terminology across the frontend (React), backend (FastAPI), and database (PostgreSQL/Supabase).

---

# 2. Design Principles

1.  **Planning Hierarchy (ADR-001/002):** Data must flow from Quota Targets to Coverage Strategy, then to Opportunity leads, and finally to Revenue.
2.  **Strategic Isolation (ADR-009):** The model must support Row-Level Security (RLS) to isolate SBU data while enabling organizational rollups.
3. **Project-Centric Opportunity Grouping (ADR-004):** Projects serve as the primary business grouping mechanism for Opportunities. Tenders are modeled using Projects rather than introducing a separate Tender entity.
4.  **Influence Mapping (ADR-007):** Sentiment (NPS) is tracked at the stakeholder level to provide a granular view of account dynamics.
5.  **Auditability:** Transactional states (Stage, Probability, Value) must be historically traceable.

---

## 3. Core Business Domains

1.  **Planning:** Quota management and strategic account coverage.
2.  **Account Management:** Hospital hierarchies and demographic profiles.
3.  **Stakeholder Management:** Influence mapping and relationship health.
4.  **Project Management:** Tenders and expansion initiative tracking.
5.  **Opportunity Management:** Pipeline execution and contributor splits.
6.  **Product Management:** Equipment catalog and technical collaterals.
7.  **Activity Management:** Interaction logs and support task tracking.
8.  **Document Management:** Regulatory and sales document storage.
9.  **Identity & Access:** Organizational structure and SBU assignments.

---

# 4. Conceptual Data Model

| Business Entity | Description | Business Owner |
| :--- | :--- | :--- |
| **Target Plan** | Annual/Quarterly revenue quotas assigned to a user and SBU. | General Manager |
| **Coverage Plan** | Quarterly strategic mapping of accounts to a sales executive. | Sales Manager |
| **Coverage Plan Entry** | Strategic account-level coverage objectives and revenue targets within a Coverage Plan. | Sales Manager |
| **Account** | The hospital or medical institution entity. Supports hierarchy. | Admin |
| **Stakeholder** | A key individual within an account (Doctor, Purchase, Biomed). | Sales Manager |
| **Installed Asset** | Equipment installed at a hospital, including competitor equipment. | Sales Executive |
| **Project** | A Tender or major Expansion initiative at an account. | Sales Manager |
| **Opportunity** | A specific revenue lead for medical equipment. | Sales Executive |
| **Opportunity Item** | Product-level line items associated with an Opportunity. | Sales Executive |
| **Split** | The percentage of revenue credit shared across users/SBUs for a deal. | General Manager |
| **Product** | Medical machine specifications and collaterals. | Admin |
| **Document** | File metadata and references associated with Accounts, Projects, Opportunities, or Products. | Sales Executive |
| **Activity** | A logged interaction (Call, Visit, Demo) supporting an opportunity. | Sales Executive |
| **Reminder** | Follow-ups, tasks, and reactivation reminders assigned to users. | Sales Executive |
| **User** | System user with assigned SBU, Zone, and Role. | Admin |
| **Role** | Defines permissions and responsibilities within the system. | Admin |
| **SBU** | Strategic Business Unit used for ownership, reporting, and security. | Admin |

---

# 5. Logical Data Model

### 5.1 Planning Entities
*   **Target Plan**
    *   *Description:* High-level quota definition.
    *   *Relationships:* User (Many:1).
    *   *Cardinality:* 1 User has M Target Plans.
**Coverage Plan**
    *Description:* The quarterly strategy for which accounts to "cover."
    *Relationships:* User (Many:1), Coverage Plan Entries (1:Many).
    *Cardinality:* 1 User has M Coverage Plans; 1 Coverage Plan contains M Coverage Plan Entries.

**Coverage Plan Entry**
    *Description:* Coverage assignment for a specific Account within a Coverage Plan.
    *Relationships:* Coverage Plan (Many:1), Account (Many:1).
    *Attributes:* Coverage Frequency, Strategic Objective, Target Revenue (Lakhs).
    *Cardinality:* 1 Coverage Plan Entry belongs to 1 Coverage Plan and references 1 Account.


### 5.2 Execution Entities
*   **Account**
    *   *Description:* Central entity for all sales activity.
    *   *Relationships:* Parent Account (Many:1), Stakeholders (1:Many), Projects (1:Many).
*   **Stakeholder**
    *   *Description:* Holds individual NPS and Decision roles.
    *   *Relationships:* Account (Many:1).
*   **Project**
    *   *Description:* The Tender vehicle.
    *   *Relationships:* Account (Many:1), Opportunities (1:Many).
*   **Opportunity**
    *   *Description:* The core revenue vehicle.
    *   *Relationships:* Account (Many:1), Project (Many:1), Opportunity Items (1:Many), Splits (1:Many), Activities (1:Many).

*   **Split**
    *   *Description:* Revenue attribution logic.
    *   *Relationships:* Opportunity (Many:1), User (Many:1).
* **Installed Asset**

  * *Description:* Equipment installed at an Account, including both Cabio and competitor products.
  * *Relationships:* Account (Many:1), Product (Many:1).
  * *Cardinality:* 1 Account has M Installed Assets.

* **Opportunity Item**

  * *Description:* A product-level line item associated with an Opportunity.
  * *Relationships:* Opportunity (Many:1), Product (Many:1).
  * *Attributes:* Quantity, Unit Price, Discount, Extended Value.
  * *Cardinality:* 1 Opportunity has M Opportunity Items.

* **Reminder**

  * *Description:* Follow-up actions and user tasks.
  * *Relationships:* User (Many:1)
  * *Cardinality:* 1 User can have M Reminders.

* **Document**

  * *Description:* File metadata and references associated with business entities.
  * *Relationships:* Account (Many:1), Project (Many:1), Opportunity (Many:1), Product (Many:1).
  * *Cardinality:* Business entities may have M Documents attached.
---

# 6. Entity Relationship Summary (Matrix)

| Source Entity | Relationship | Target Entity | Logic |
| :--- | :--- | :--- | :--- |
| **User** | 1 : M | **Target Plan** | 1 User has separate quotas per quarter. |
| **User** | 1 : M | **Coverage Plan** | 1 User submits 1 plan per quarter. |
| **Coverage Plan** | 1 : M | **Coverage Plan Entry** | One coverage plan contains multiple account coverage entries. |
| **Coverage Plan Entry** | M : 1 | **Account** | Multiple coverage plan entries may reference the same account.|
| **Account** | 1 : M | **Stakeholder** | A hospital has many key contacts. |
| **Account** | 1 : M | **Project** | A hospital has many expansion/tender projects. |
| **Project** | 1 : M | **Opportunity** | A tender can contain multiple machine leads. |
| **Opportunity** | 1 : M | **Split** | One deal can be shared by multiple reps. |
| **Opportunity** | 1 : M | **Activity** | Many interactions drive one deal. |
| **Account** | 1 : M | **Account** | Supports Parent/Child (e.g., Hospital Chain). |

---

# 7. Master Data vs Transaction Data

| Master Data (Static/Reference) | Transaction Data (Dynamic/Volatile) |
| :--- | :--- |
| **Accounts** (Hospital Profiles) | **Opportunities** (Deals) |
| **Stakeholders** (Contacts) | **Opportunity Items** (Deal Line Items) |
| **Products** (Equipment Catalog) | **Target Plans** (Quotas) |
| **Installed Assets** (Installed Equipment) | **Coverage Plans** (Quarterly Strategies) |
| **Users** (Employee Directory) | **Coverage Plan Entries** (Account Coverage Strategy) |
| **Roles** (Security Definitions) | **Activities** (Interaction Logs) |
| **SBUs** (Business Structure) | **Splits** (Attribution Records) |
| | **Projects** (Tender Lifecycles) |
| | **Documents** (Attachments) |
| | **Reminders** (Tasks & Follow-ups) |

---

# 8. Security Classification (ADR-009)

| Entity | Scoping Logic | Visibility Level |
| :--- | :--- | :--- |
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

1.  **Opportunities:** Track `Stage`, `Win Probability`, `Expected Value`, and `Expected Closure Date`.
2.  **Splits:** Track any changes to revenue attribution percentage.
3.  **Target Plans:** Track changes to quotas post-approval.
4.  **Coverage Plans:** Track strategic objective shifts.
5.  **Projects:** Track `Tender Deadline` and `Bid Status` changes.

---

# 10. Future Extension Points

1.  **Financial Module:** `Invoices`, `Payments`, and `Outstanding` linked to Opportunities.
2.  **Service Module:** `AMC/CMC Contracts`, `Service Tickets`, and Service History.
3.  **Competitor Module:** `Competitor Brands` and `Market Share` analysis.
4.  **Marketing Module:** `Campaign ROI` and `Lead Source` attribution analysis.

---

# 11. Conflicts & Assumptions

### 🚩 Flagged Conflicts
*   **Planning Terminology:** The PRD uses "Beat Planning" and "Visit Counts". This model **strictly follows ADR-002 and GEMINI.md**, implementing "Coverage Planning" without visit scheduling.
*   **Project Scope:** The PRD identifies Projects as "out of scope" for Phase 1. This model **follows GEMINI.md and the Prototype**, treating Projects (Tenders) as a core functional entity.

### 📝 Assumptions
1.  **Shared Accounts:** It is assumed that Accounts (Hospitals) are shared across SBUs, but the *Opportunities* within them are isolated by SBU.
2.  **Currency:** All financial values are modeled as Decimal/Numeric to avoid floating-point errors, specifically in INR Lakhs.
3.  **NPS Aggregation:** The system will eventually require an algorithm to aggregate Stakeholder NPS into an "Account Health" score (to be defined in Business Logic).
