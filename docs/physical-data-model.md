# Cabio Sales OS - Physical Data Model (Phase 1)

This document translates the approved Enterprise Data Model (EDM) into a concrete Physical Data Model (PDM) tailored for PostgreSQL and Supabase.

---

## 1. Database Design Decisions

### 1.1 Index Strategy
- **Primary Keys:** UUID v4 for all entities to ensure globally unique identifiers and prevent ID enumeration.
- **Foreign Keys:** B-Tree indexes created on all Foreign Keys to optimize joins and enforce referential integrity efficiently.
- **Text Search:** `pg_trgm` indexes for high-frequency search fields (e.g., `account.name`, `opportunity.name`).
- **Date Filtering:** B-Tree indexes on commonly queried dates (`activity.activity_date`, `opportunity.expected_closure_date`, `reminder.due_date`).

### 1.2 Audit Strategy
- **Mechanism:** Operational auditing is delegated to Supabase native auditing and PostgreSQL logging.
- **Metadata Fields:** Standard `created_at`, `created_by`, `updated_at`, and `updated_by` metadata columns are leveraged on transaction entities for business traceability.
- **Scope:** Custom `audit_log` tables and triggers are intentionally omitted from Phase 1.

### 1.3 Soft Delete Strategy
- **Master Data:** Soft delete applied (`is_active` boolean) to all reference data (`opportunity_stage`, `opportunity_status`, `lead_source`, `loss_reason`, `hold_reason`, `product`) to preserve historical associations in old records.
- **Transactional Data:** Hard deletes for transactional data (e.g., `activity`, `opportunity_item`, `reminder`) unless specifically prohibited by audit requirements. Opportunities, Projects, and Accounts are strictly restricted from deletion in user-facing flows (handled via terminal statuses instead).

### 1.4 Seed / Reference Data Strategy
- Reference entities use static seeded records for Phase 1. 
- Primary Keys for seed data are fixed UUIDs defined in migration scripts to ensure consistency across local, staging, and production environments.

---

## 2. Physical Data Model (Tables)

### 2.1 Identity & Access
Supabase natively handles authentication via `auth.users`. We extend this with business attributes.

#### `user_profile`
*   `id` (UUID) - **PK**, FK `auth.users.id`
*   `sbu_id` (UUID) - FK `sbu.id`, NOT NULL
*   `zone_id` (UUID) - FK `zone.id`, NULLABLE
*   `role_id` (UUID) - FK `role.id`, NOT NULL
*   `display_name` (VARCHAR 255), NOT NULL
*   `is_active` (BOOLEAN), DEFAULT TRUE

#### `role`
*   `id` (UUID) - **PK**
*   `role_name` (VARCHAR 50), NOT NULL, UNIQUE
*   `description` (TEXT)

---

### 2.2 Organizational & Reference (Master Data)

#### `sbu`
*   `id` (UUID) - **PK**
*   `name` (VARCHAR 100), NOT NULL, UNIQUE
*   `description` (TEXT)

#### `zone`
*   `id` (UUID) - **PK**
*   `name` (VARCHAR 100), NOT NULL, UNIQUE
*   `description` (TEXT)

#### `lead_source`
*   `id` (UUID) - **PK**
*   `name` (VARCHAR 100), NOT NULL, UNIQUE
*   `description` (TEXT)
*   `is_active` (BOOLEAN), DEFAULT TRUE

#### `opportunity_stage`
*   `id` (UUID) - **PK**
*   `stage_code` (VARCHAR 50), NOT NULL, UNIQUE
*   `stage_name` (VARCHAR 100), NOT NULL
*   `display_order` (INTEGER), NOT NULL, UNIQUE
*   `default_win_probability` (NUMERIC 5,2), NOT NULL, CHECK (0-100)
*   `is_active` (BOOLEAN), DEFAULT TRUE

#### `opportunity_status`
*   `id` (UUID) - **PK**
*   `status_code` (VARCHAR 50), NOT NULL, UNIQUE
*   `status_name` (VARCHAR 100), NOT NULL
*   `is_terminal` (BOOLEAN), NOT NULL, DEFAULT FALSE
*   `is_system_generated` (BOOLEAN), NOT NULL, DEFAULT FALSE
*   `is_active` (BOOLEAN), DEFAULT TRUE

#### `loss_reason` / `hold_reason`
*(Identical structures)*
*   `id` (UUID) - **PK**
*   `reason_code` (VARCHAR 50), NOT NULL, UNIQUE
*   `reason_name` (VARCHAR 100), NOT NULL
*   `is_active` (BOOLEAN), DEFAULT TRUE

---

### 2.3 Planning Entities

#### `target_plan`
*   `id` (UUID) - **PK**
*   `user_id` (UUID) - FK `user_profile.id`, NOT NULL
*   `sbu_id` (UUID) - FK `sbu.id`, NOT NULL
*   `planning_period` (VARCHAR 10), NOT NULL (e.g., '2026-Q1')
*   `target_amount_lakhs` (NUMERIC 15,2), NOT NULL
*   **Unique Constraint:** `(user_id, sbu_id, planning_period)`

#### `coverage_plan`
*   `id` (UUID) - **PK**
*   `user_id` (UUID) - FK `user_profile.id`, NOT NULL
*   `target_plan_id` (UUID) - FK `target_plan.id`, NOT NULL
*   `planning_period` (VARCHAR 10), NOT NULL
*   **Unique Constraint:** `(user_id, planning_period)`

#### `coverage_plan_entry`
*   `id` (UUID) - **PK**
*   `coverage_plan_id` (UUID) - FK `coverage_plan.id`, NOT NULL
*   `account_id` (UUID) - FK `account.id`, NOT NULL
*   `strategic_objective` (TEXT), NOT NULL
*   `target_revenue_lakhs` (NUMERIC 15,2), NOT NULL
*   `coverage_frequency` (VARCHAR 50), NULLABLE
*   **Unique Constraint:** `(coverage_plan_id, account_id)`

---

### 2.4 Execution Entities

#### `account`
*   `id` (UUID) - **PK**
*   `parent_account_id` (UUID) - FK `account.id`, NULLABLE
*   `name` (VARCHAR 255), NOT NULL
*   `payer_behavior` (VARCHAR 50), NULLABLE, CHECK IN ('GOOD', 'AVERAGE', 'PROBLEMATIC', 'UNKNOWN')

#### `stakeholder`
*   `id` (UUID) - **PK**
*   `account_id` (UUID) - FK `account.id`, NOT NULL
*   `name` (VARCHAR 255), NOT NULL
*   `nps_score` (INTEGER), NULLABLE, CHECK (-100 to 100)
*   `sentiment` (VARCHAR 50), NULLABLE

#### `project`
*   `id` (UUID) - **PK**
*   `account_id` (UUID) - FK `account.id`, NOT NULL
*   `owner_id` (UUID) - FK `user_profile.id`, NOT NULL
*   `name` (VARCHAR 255), NOT NULL
*   `status` (VARCHAR 50), NOT NULL, CHECK IN ('DRAFT', 'ACTIVE', 'BID_SUBMITTED', 'AWARDED', 'LOST', 'CLOSED')
*   `bid_submission_date` (DATE), NULLABLE
*   `created_at` (TIMESTAMPTZ), DEFAULT NOW()

#### `opportunity`
*   `id` (UUID) - **PK**
*   `name` (VARCHAR 255), NOT NULL
*   `account_id` (UUID) - FK `account.id`, NOT NULL
*   `project_id` (UUID) - FK `project.id`, NULLABLE
*   `owner_id` (UUID) - FK `user_profile.id`, NOT NULL
*   `stage_id` (UUID) - FK `opportunity_stage.id`, NOT NULL
*   `status_id` (UUID) - FK `opportunity_status.id`, NOT NULL
*   `win_probability` (NUMERIC 5,2), NOT NULL, CHECK (0-100)
*   `lead_source_id` (UUID) - FK `lead_source.id`, NULLABLE
*   `indicative_value` (NUMERIC 15,2), NULLABLE
*   `expected_closure_date` (DATE), NULLABLE
*   `loss_reason_id` (UUID) - FK `loss_reason.id`, NULLABLE
*   `competitor_name` (VARCHAR 255), NULLABLE
*   `hold_reason_id` (UUID) - FK `hold_reason.id`, NULLABLE
*   `reactivation_date` (DATE), NULLABLE
*   `demo_start_date` (DATE), NULLABLE
*   `demo_end_date` (DATE), NULLABLE
*   `po_number` (VARCHAR 100), NULLABLE
*   `created_at` (TIMESTAMPTZ), DEFAULT NOW()
*   **Check Constraints:** 
    * `loss_reason_id IS NOT NULL` enforced functionally when status is LOST (can be a trigger or app constraint; DB constraints checking other tables are complex).
    * `hold_reason_id IS NOT NULL AND reactivation_date IS NOT NULL` functionally enforced when status is ON_HOLD.

#### `opportunity_stakeholder`
*   `opportunity_id` (UUID) - **PK**, FK `opportunity.id`
*   `stakeholder_id` (UUID) - **PK**, FK `stakeholder.id`
*   `influence_level` (VARCHAR 50), NULLABLE, CHECK IN ('HIGH', 'MEDIUM', 'LOW')
*   `decision_role` (VARCHAR 100), NULLABLE
*   `notes` (TEXT), NULLABLE

#### `split`
*   `id` (UUID) - **PK**
*   `opportunity_id` (UUID) - FK `opportunity.id`, NOT NULL
*   `user_id` (UUID) - FK `user_profile.id`, NOT NULL
*   `split_percentage` (NUMERIC 5,2), NOT NULL, CHECK (0-100)
*   **Unique Constraint:** `(opportunity_id, user_id)`

#### `activity`
*   `id` (UUID) - **PK**
*   `account_id` (UUID) - FK `account.id`, NOT NULL
*   `project_id` (UUID) - FK `project.id`, NULLABLE
*   `opportunity_id` (UUID) - FK `opportunity.id`, NULLABLE
*   `user_id` (UUID) - FK `user_profile.id`, NOT NULL
*   `activity_type` (VARCHAR 50), NOT NULL
*   `activity_date` (TIMESTAMPTZ), NOT NULL
*   `notes` (TEXT), NULLABLE

#### `reminder`
*   `id` (UUID) - **PK**
*   `activity_id` (UUID) - FK `activity.id`, NOT NULL
*   `assigned_to_user_id` (UUID) - FK `user_profile.id`, NOT NULL
*   `due_date` (TIMESTAMPTZ), NOT NULL
*   `reminder_text` (TEXT), NOT NULL
*   `is_completed` (BOOLEAN), DEFAULT FALSE

#### `product`
*   `id` (UUID) - **PK**
*   `sbu_id` (UUID) - FK `sbu.id`, NOT NULL
*   `name` (VARCHAR 255), NOT NULL
*   `description` (TEXT)
*   `is_active` (BOOLEAN), DEFAULT TRUE

#### `opportunity_item`
*   `id` (UUID) - **PK**
*   `opportunity_id` (UUID) - FK `opportunity.id`, NOT NULL
*   `product_id` (UUID) - FK `product.id`, NOT NULL
*   `quantity` (INTEGER), NOT NULL, CHECK (> 0)
*   `unit_price_lakhs` (NUMERIC 15,2), NOT NULL
*   `discount_lakhs` (NUMERIC 15,2), NOT NULL, DEFAULT 0
*   `extended_value_lakhs` (NUMERIC 15,2), GENERATED ALWAYS AS (quantity * unit_price_lakhs - discount_lakhs) STORED
*   **Unique Constraint:** `(opportunity_id, product_id)` (Prevents duplicate product rows on one deal)

#### `installed_asset`
*   `id` (UUID) - **PK**
*   `account_id` (UUID) - FK `account.id`, NOT NULL
*   `product_id` (UUID) - FK `product.id`, NULLABLE
*   `is_competitor_equipment` (BOOLEAN), NOT NULL, DEFAULT FALSE
*   `competitor_product_name` (VARCHAR 255), NULLABLE
*   `installation_date` (DATE), NULLABLE
*   `department` (VARCHAR 100), NULLABLE
*   **Check Constraint:** `(is_competitor_equipment = false AND product_id IS NOT NULL) OR (is_competitor_equipment = true)`

#### `document`
*   `id` (UUID) - **PK**
*   `file_name` (VARCHAR 255), NOT NULL
*   `file_type` (VARCHAR 100), NOT NULL
*   `file_size_bytes` (INTEGER), NOT NULL
*   `storage_path` (VARCHAR 500), NOT NULL
*   `account_id` (UUID) - FK `account.id`, NULLABLE
*   `project_id` (UUID) - FK `project.id`, NULLABLE
*   `opportunity_id` (UUID) - FK `opportunity.id`, NULLABLE
*   `product_id` (UUID) - FK `product.id`, NULLABLE
*   `uploaded_by_user_id` (UUID) - FK `user_profile.id`, NOT NULL
*   `uploaded_at` (TIMESTAMPTZ), NOT NULL, DEFAULT NOW()
*   **Check Constraint:** `account_id IS NOT NULL OR project_id IS NOT NULL OR opportunity_id IS NOT NULL OR product_id IS NOT NULL`

---

## 3. Validation Review & Recommendations

During the translation from EDM to PDM, the following nuances and implementation concerns were discovered. **Confirmation is requested before generating SQL schema.**

### 3.1 Complex Cross-Table Validations
- **Issue:** BR-OP-03 (Lost requires Loss Reason) and BR-OP-02 (On-Hold requires Hold Reason) depend on comparing the current row's `status_id` against the `opportunity_status` master table. Standard PostgreSQL `CHECK` constraints cannot perform cross-table lookups efficiently without breaking referential integrity standards.
- **Resolution Recommendation:** Enforce these conditional constraints within the application logic (FastAPI) rather than database-level checks. The database will define the attributes as `NULLABLE`, trusting the backend to enforce the schema completeness before INSERT/UPDATE.

### 3.2 Stage Gate Constraints
- **Issue:** BR-OP-01 dictates strict Stage Gates (e.g., Demo date required for the Demo stage). Like status conditions, applying these dynamically via database constraints is incredibly rigid and brittle.
- **Resolution Recommendation:** Implement Stage Gates entirely in the Business Logic layer (FastAPI validation schemas). Do not build complex PostgreSQL triggers for process flow validation.

### 3.3 The 100% Split Rule (BR-FIN-01)
- **Issue:** Database triggers validating that `SUM(split_percentage) = 100` are notoriously difficult due to transaction concurrency and "chicken-and-egg" inserts (you can't insert the first 50% split if the trigger demands it be 100%).
- **Resolution Recommendation:** Let FastAPI manage split validation in a single atomic transaction. Do not use PostgreSQL triggers to enforce the 100% rule. 

### 3.4 Opportunity Value Calculation
- **Issue:** `extended_value_lakhs` can easily use `GENERATED ALWAYS AS`. However, automatically calculating `Opportunity.calculated_value` based on the sum of `opportunity_item` requires a complex trigger or materialized view.
- **Resolution Recommendation:** Avoid storing the `calculated_value` directly on the `opportunity` table to prevent synchronization bugs. Instead, compute this sum dynamically via a database View (`vw_opportunities_with_value`) or let the application sum the items during retrieval.

### 3.5 Period Format String
- **Issue:** `planning_period` is stored as `VARCHAR(10)` (e.g., '2026-Q1').
- **Resolution Recommendation:** We should add a standard `CHECK (planning_period ~ '^\d{4}-Q[1-4]$')` regex validation to the database to ensure no malformed inputs are inserted.
