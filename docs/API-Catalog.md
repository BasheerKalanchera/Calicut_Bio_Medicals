# Cabio Sales OS - API Catalog (v1.0)
**Based on Architecture Freeze v1.0 (Commit 8fe6385)**

## Global Standards
- **Base Path:** `/api/v1`
- **Authentication:** Bearer token (JWT via Supabase Auth)
- **Content Type:** `application/json`
- **Standard Response Envelope:** `{ "success": true, "message": "...", "data": { ... } }`

---

## 1. Master Data & Identity API

### 1.1 Get Reference Data
**Purpose:** Fetch master lookup lists for UI dropdowns.
- **Endpoint:** `GET /master-data/{entity_name}`
- **Path Parameters:** `stages`, `statuses`, `project-statuses`, `lead-sources`, `loss-reasons`, `hold-reasons`, `sbus`, `zones`.
- **Justification:** Required for Phase 1. `project-statuses` added to the path list to support Project creation.

### 1.2 List Users
**Purpose:** Fetch active users for assignment dropdowns (e.g., Target Plans, Opportunity Owners).
- **Endpoint:** `GET /users`
- **Justification:** Required for Phase 1. Users must be selected to assign deals and splits. Full CRUD is deferred to Admin portal; read-only is sufficient for core workflows.

---

## 2. Accounts & Stakeholders API

### 2.1 Manage Accounts
**Purpose:** Core CRM directory and Customer 360 Workspace.
- **Endpoints:**
  - `GET /accounts` (List/Search)
  - `POST /accounts` (Create)
  - `GET /accounts/{id}/360` (Deep read including related nested entities)
  - `PATCH /accounts/{id}` (Update attributes)
- **Justification:** Required for Phase 1. Full lifecycle management of the anchor entity.

### 2.2 Manage Stakeholders
**Purpose:** Track people within accounts and their sentiment.
- **Endpoints:**
  - `GET /accounts/{id}/stakeholders`
  - `POST /accounts/{id}/stakeholders`
  - `PATCH /stakeholders/{id}`
- **Justification:** Required for Phase 1 to track NPS and relationship health.

### 2.3 Manage Installed Assets
**Purpose:** Track installed equipment (Cabio & Competitor) at accounts.
- **Endpoints:**
  - `POST /accounts/{id}/assets`
  - `PATCH /assets/{id}`
- **Justification:** Required for Phase 1 Customer 360 Workspace. Delete is omitted as assets rarely disappear; they are replaced.

---

## 3. Planning API

### 3.1 Target Plans
**Purpose:** Manage revenue quotas.
- **Endpoints:**
  - `GET /planning/targets`
  - `POST /planning/targets`
  - `PATCH /planning/targets/{id}`
- **Justification:** Required for Phase 1. Needed to anchor Coverage Plans. `DELETE` omitted as targets are historical audit records once set.

### 3.2 Coverage Plans
**Purpose:** Manage strategic account coverage.
- **Endpoints:**
  - `GET /planning/coverage`
  - `POST /planning/coverage`
- **Justification:** Required for Phase 1. Replaces Beat Planning. Entries are handled via nested payload in `POST`.

---

## 4. Product Catalog API

### 4.1 Browse Products
**Purpose:** Fetch equipment catalog for browsing and quoting.
- **Endpoints:** `GET /products`
- **Justification:** Required for Phase 1. Enables salespeople to browse collaterals and add items to opportunities. Admin-level POST/PATCH is out of scope for the sales UI.

---

## 5. Projects & Tenders API

### 5.1 Manage Projects
**Purpose:** Group opportunities under tenders or expansion initiatives.
- **Endpoints:**
  - `GET /projects`
  - `POST /projects`
  - `PATCH /projects/{id}`
- **Justification:** Required for Phase 1. Implements ADR-014.

---

## 6. Opportunity API

### 6.1 Manage Opportunities
**Purpose:** Pipeline execution.
- **Endpoints:**
  - `GET /opportunities/pipeline` (Kanban aggregation)
  - `POST /opportunities`
  - `PATCH /opportunities/{id}` (Stage gates, status updates)
- **Justification:** Required for Phase 1. Core revenue tracking.

### 6.2 Manage Deal Composition (Items, Splits, Stakeholders)
**Purpose:** Manage the sub-components of a deal.
- **Endpoints:**
  - `PUT /opportunities/{id}/items` (Bulk replace items)
  - `PUT /opportunities/{id}/splits` (Bulk replace splits - validates to 100%)
  - `PUT /opportunities/{id}/stakeholders` (Bulk map stakeholders to deal)
- **Justification:** Required for Phase 1. `OpportunityStakeholder` requires influence mapping per ADR-021. `PUT` (bulk replace) handles deletions inherently without needing explicit `DELETE` endpoints.

---

## 7. Activities & Tasks API

### 7.1 Activities
**Purpose:** Immutable interaction logs.
- **Endpoints:**
  - `GET /accounts/{id}/activities`
  - `POST /activities`
- **Justification:** Required for Phase 1. `PATCH` and `DELETE` explicitly omitted to enforce BR-ACT-01 (Activity Immutability).

### 7.2 Reminders (Tasks)
**Purpose:** Follow-ups derived from activities.
- **Endpoints:**
  - `GET /reminders` (User's task list)
  - `POST /reminders`
  - `PATCH /reminders/{id}` (To mark `is_completed=true`)
- **Justification:** Required for Phase 1. Completes the Activity loop. `DELETE` omitted as users should mark tasks complete rather than delete them.

---

## 8. Document API

### 8.1 Documents
**Purpose:** Attach specifications and POs to records.
- **Endpoints:**
  - `GET /documents` (Query by `account_id`, `project_id`, `opportunity_id`, etc.)
  - `POST /documents` (Saves metadata pointing to Supabase Storage bucket)
- **Justification:** Required for Phase 1. Supports document retrieval for tenders and negotiations.
