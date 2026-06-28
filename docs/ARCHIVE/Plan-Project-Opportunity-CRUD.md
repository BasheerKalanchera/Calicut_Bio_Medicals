# Plan: Project & Opportunity CRUD

## Context

The June 29 demo currently shows read-only Project cards and no Opportunity data at all. Adding Create/Edit for both entities completes the strategic sales tracking loop: **Account → Project → Opportunity**. The Opportunity model exists in the DB but has no API layer; the Project model has a read-only workspace inclusion but no dedicated CRUD endpoints.

## What Already Exists

| Layer | Project | Opportunity |
|-------|---------|-------------|
| Model (`models.py`) | Yes | Yes |
| Workspace inclusion | Yes (read-only) | **No** |
| Schemas | **No** | **No** |
| Repository | **No** | **No** |
| Service | **No** | **No** |
| Router / Endpoints | **No** | **No** |
| Frontend service functions | **No** | **No** |
| Frontend UI (tab/modals) | Read-only tab only | **No** |

## Scope

6 backend files created, 2 backend files modified, 2 frontend files modified, 1 frontend file created (total: 11 files).

### Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/accounts/{account_id}/projects` | Create Project |
| `PUT` | `/projects/{project_id}` | Update Project |
| `POST` | `/accounts/{account_id}/opportunities` | Create Opportunity |
| `PUT` | `/opportunities/{opportunity_id}` | Update Opportunity |

### UI Forms (4 modals)

| Form | Trigger Location | Fields |
|------|-----------------|--------|
| Create Project | "+ Add" button on Projects tab header | Name (text, required), Status (dropdown — project statuses), Owner (dropdown — users), Bid Submission Date (date input, optional) |
| Edit Project | "Edit" button on each project card | Same fields, pre-populated |
| Create Opportunity | "+ Add" button on Opportunities tab header | Name (text, required), Project (optional dropdown — workspace projects), Stage (dropdown — opportunity stages), Status (dropdown — opportunity statuses), Owner (dropdown — users), Win Probability % (number 0–100), Indicative Value in Lakhs (number, optional) |
| Edit Opportunity | "Edit" button on each opportunity card | Same fields, pre-populated |

---

## Phase 1: Backend Domain Updates

### 1.1 Project Domain (new files in `backend/app/domains/project/`)

**`schemas.py`** — following `stakeholder_schemas.py` pattern:
- `ProjectCreate`: `name` (str, required), `owner_id` (UUID, required), `status_id` (UUID, required), `bid_submission_date` (date, optional)
- `ProjectUpdate`: all fields optional, uses `exclude_unset=True`
- `ProjectResponse`: full model with `id`, `account_id`, `name`, `owner_id`, `status_id`, `bid_submission_date`, `created_at`, `updated_at`

**`repository.py`** — `ProjectRepository(BaseRepository[Project])`:
- `list_by_account(account_id)` → ordered by name
- `account_exists(account_id)` → bool check

**`service.py`** — `ProjectService`:
- `create_project(account_id, data, created_by)` — validates account exists, creates Project
- `update_project(project_id, data, updated_by)` — validates project exists, applies `exclude_unset` updates

**`router.py`** — `APIRouter(tags=["Projects"])`:
- `POST /accounts/{account_id}/projects` → 201
- `PUT /projects/{project_id}` → 200

### 1.2 Opportunity Domain (new files in `backend/app/domains/opportunity/`)

**`schemas.py`**:
- `OpportunityCreate`: `name` (str, required), `owner_id` (UUID, required), `stage_id` (UUID, required), `status_id` (UUID, required), `win_probability` (Decimal 0–100, required), `project_id` (UUID, optional), `indicative_value` (Decimal, optional)
- `OpportunityUpdate`: all fields optional
- `OpportunityResponse`: full model fields + `created_at`, `updated_at`

**`repository.py`** — `OpportunityRepository(BaseRepository[Opportunity])`:
- `list_by_account(account_id)` → ordered by name
- `account_exists(account_id)` → bool check

**`service.py`** — `OpportunityService`:
- `create_opportunity(account_id, data, created_by)`
- `update_opportunity(opportunity_id, data, updated_by)`

**`router.py`** — `APIRouter(tags=["Opportunities"])`:
- `POST /accounts/{account_id}/opportunities` → 201
- `PUT /opportunities/{opportunity_id}` → 200

### 1.3 Workspace Enhancement

**`workspace_schemas.py`** — add:
- `OpportunityStageNested`: `id`, `stage_code`, `stage_name`
- `OpportunityStatusNested`: `id`, `status_code`, `status_name`
- `WorkspaceOpportunity`: `id`, `name`, `stage` (nested), `status` (nested), `owner` (nested, reuse `OwnerNested`), `project_id`, `win_probability`, `indicative_value`
- Append `opportunities: list[WorkspaceOpportunity]` to `WorkspaceResponse`

**`workspace_service.py`** — add mapping:
```python
opportunities=[
    WorkspaceOpportunity.model_validate(o)
    for o in account.opportunities
],
```

### 1.4 Router Registration

**`main.py`** — add:
```python
from app.domains.project import router as project_router
from app.domains.opportunity import router as opportunity_router
...
application.include_router(project_router.router, prefix="/api/v1")
application.include_router(opportunity_router.router, prefix="/api/v1")
```

---

## Phase 2: Frontend Data Services

### 2.1 `src/services/masterData.js` — add functions

| Function | Endpoint | Returns |
|----------|----------|---------|
| `listProjectStatuses()` | `GET /master-data/project-statuses` | array of `{ id, status_code, status_name }` |
| `listStages()` | `GET /master-data/stages` | array of `{ id, stage_code, stage_name, default_win_probability }` |
| `listStatuses()` | `GET /master-data/statuses` | array of `{ id, status_code, status_name }` |
| `listUsers()` | `GET /users?page_size=100` | array of `{ id, display_name }` |

### 2.2 `src/services/accounts.js` — add functions

| Function | Method | Endpoint |
|----------|--------|----------|
| `createProject(accountId, data)` | POST | `/accounts/{accountId}/projects` |
| `updateProject(projectId, data)` | PUT | `/projects/{projectId}` |
| `createOpportunity(accountId, data)` | POST | `/accounts/{accountId}/opportunities` |
| `updateOpportunity(oppId, data)` | PUT | `/opportunities/{oppId}` |

---

## Phase 3: Frontend UI (`Customer360Screen.jsx`)

### 3.1 Tabs & Summary Stats

- Add `{ id: "opportunities", label: "Opportunities" }` to `TABS` array
- Replace "Assets" stat card with "Opportunities" count in summary stats bar (revenue visibility over asset count)

### 3.2 Projects Tab Enhancement

- Add "+ Add" button to `ProjectsTab` header (new `onAdd` prop)
- Add "Edit" button on each project card (new `onEdit` prop)
- Create Project modal: Name, Status dropdown, Owner dropdown, Bid Date input
- Edit Project modal: same fields, pre-populated from project data

### 3.3 Opportunities Tab (new component)

- `OpportunitiesTab({ opportunities, onAdd, onEdit })` — maps opportunity cards showing: Name, Stage badge, Status badge, Owner, Win %, Indicative Value
- "+ Add" button in tab header
- "Edit" button on each opportunity card
- Create Opportunity modal: Name, Project (optional dropdown from `workspace.projects`), Stage, Status, Owner, Win Prob %, Indicative Value
- Edit Opportunity modal: same fields, pre-populated

---

## What NOT to Change

- `DemoApp.jsx` — modals live inside screens, not the shell
- `src/lib/api.js` — no changes
- `src/components/FormModal.jsx` — reuse as-is
- Existing backend models (`models.py` in both domains) — already correct
- No new npm dependencies
- No database migrations

## Intentionally Deferred Fields

The Opportunity model has additional fields not included in the demo forms: `expected_closure_date`, `lead_source_id`, `loss_reason_id`, `loss_notes`, `competitor_name`, `hold_reason_id`, `reactivation_date`, `demo_start_date`, `demo_end_date`, `po_number`. These are deferred to post-demo — the form focuses on the core sales pipeline fields only.

---

## Implementation Order

| Step | What | Est. |
|------|------|------|
| 1 | Create `project/schemas.py` | 5 min |
| 2 | Create `project/repository.py` | 5 min |
| 3 | Create `project/service.py` | 5 min |
| 4 | Create `project/router.py` | 5 min |
| 5 | Create `opportunity/schemas.py` | 5 min |
| 6 | Create `opportunity/repository.py` | 5 min |
| 7 | Create `opportunity/service.py` | 5 min |
| 8 | Create `opportunity/router.py` | 5 min |
| 9 | Update `workspace_schemas.py` + `workspace_service.py` | 10 min |
| 10 | Register routers in `main.py` | 2 min |
| 11 | Run `pytest` — verify existing 154 tests still pass | 5 min |
| 12 | Update `masterData.js` + `accounts.js` | 5 min |
| 13 | Update `Customer360Screen.jsx` — tabs, stats, ProjectsTab CRUD | 20 min |
| 14 | Add `OpportunitiesTab` + CRUD modals | 20 min |
| 15 | `npm run build` — verify 0 errors | 2 min |
| 16 | Visual test all 4 flows in browser | 15 min |
| **Total** | | **~120 min** |

---

## Verification

1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `cd sales-os-app && npm run dev`
3. Run backend tests: `cd backend && python -m pytest -q` → 154 passed
4. Test each flow:
   - Customer 360 → Projects tab → click "+ Add" → fill form → submit → new project card appears
   - Click "Edit" on project card → change status → submit → badge updates
   - Click "Opportunities" tab → click "+ Add" → fill form with win prob 60%, value 15 → submit → card appears with stage/status badges
   - Click "Edit" on opportunity → change stage → submit → badge updates
   - Verify summary stats bar shows Opportunities count
5. Verify error handling: submit empty name → error message shown in modal
6. `npm run build` — clean, 0 errors
