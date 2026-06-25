# Demo Readiness Test Plan — June 29

## Scope

Minimum testing required to confidently execute the June 29 customer demo. Prioritizes risk reduction over coverage percentage and end-to-end validation over component-level testing.

### Demo Script (5 workflows)

```
1. Login          — /demo route, Supabase auth, profile fetch
2. Customer Directory  — search, browse, click-through
3. Customer 360        — overview, stakeholders, projects, installed base tabs
4. Product Catalog     — search, brand filter, detail view
5. Logout              — sign out, session cleared
```

### Demo-Critical Endpoints (5 total)

```
GET /api/v1/auth/me                    → AuthContext on login
GET /api/v1/accounts                   → CustomerDirectoryScreen
GET /api/v1/accounts/{id}/workspace    → Customer360Screen
GET /api/v1/products                   → ProductCatalogScreen
GET /api/v1/products/{id}              → ProductDetail (inline in ProductCatalogScreen)
```

### NOT In Scope Before June 29

```
- GET /accounts/{id} (single account — not called by any demo screen)
- POST/PUT endpoints (demo is read-only browsing)
- Component-level unit tests (Vitest + RTL)
- Error state / edge case automation
- Pagination boundary testing
- Multi-browser testing
- Performance / load testing
```

---

## Section 1 — Manual Validation Checklist

Safety net. If automation is not ready, run this checklist manually against the deployed environment. Takes ~10 minutes.

### Prerequisites

```
[ ] Backend deployed and healthy (GET /api/v1/health returns 200)
[ ] Frontend deployed and accessible at /demo
[ ] Seed data loaded (accounts, stakeholders, products, projects, assets)
[ ] Test user credentials available
```

### Checklist

```
LOGIN
[ ] Navigate to /demo — login form visible ("Cabio Sales OS" heading)
[ ] Enter valid email + password, click "Sign In"
[ ] Redirected to demo app — "Customer Directory" heading visible
[ ] Header shows Cabio logo and "Sign Out" button

CUSTOMER DIRECTORY
[ ] Account cards load (not stuck on "Loading customers...")
[ ] At least 2 accounts visible
[ ] Each card shows: name, SBU badge (Imaging/other), payer behavior badge
[ ] Type in "Search customers..." input — list filters after ~300ms debounce
[ ] Clear search — full list restores
[ ] Click an account card — view switches to Customer 360

CUSTOMER 360
[ ] "Customer 360" label and account name in header
[ ] SBU badge and payer behavior badge in header
[ ] Summary stats bar shows 3 cards: Stakeholders count, Projects count, Assets count
[ ] Overview tab (default) — "Account Details" section with name, SBU, payer behavior
[ ] Click "Stakeholders" tab — stakeholder cards with NPS score and sentiment badge
[ ] Click "Projects" tab — project cards with status badge, owner, bid date
[ ] Click "Installed Base" tab — asset cards; competitor items have red border + "COMPETITOR" badge
[ ] Click "← Back" — returns to Customer Directory

PRODUCT CATALOG
[ ] Click hamburger (☰) button → sidebar opens
[ ] Click "Product Catalog" in sidebar → "Product Catalog" heading visible
[ ] Product cards load (not stuck on "Loading products...")
[ ] Each card shows: name, SBU badge, OEM name, model number
[ ] Type in "Search products..." input — list filters
[ ] Type in "Filter by brand..." input — list filters
[ ] Click a product card — "Product Detail" heading visible with all fields
[ ] Click "← Back" — returns to product list

LOGOUT
[ ] Click "Sign Out" in header
[ ] Login form visible ("Cabio Sales OS" heading)
[ ] Navigate to /demo — login form shows (not auto-logged in)

SESSION PERSISTENCE
[ ] Login again
[ ] Refresh the browser (F5)
[ ] Still on demo app (Supabase session survived refresh)
```

---

## Section 2 — Playwright Smoke Suite

Single file. Mirrors the exact demo script. If this passes, the demo is safe.

### Setup

```bash
cd sales-os-app
npm install -D @playwright/test
npx playwright install chromium
```

### Configuration

```ts
// sales-os-app/playwright.config.ts

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
});
```

### Environment Variables

```env
# .env.test (or set in shell before running)
TEST_USER_EMAIL=<supabase-test-user-email>
TEST_USER_PASSWORD=<supabase-test-user-password>
```

### Test File

```
sales-os-app/e2e/demo-smoke.spec.ts
```

### Test Steps (16 assertions, 1 sequential flow)

| # | Step | Action | Assertion |
|---|------|--------|-----------|
| 1 | Login page loads | `goto('/demo')` | Input `[type="email"]` and `[type="password"]` visible |
| 2 | Login succeeds | Fill credentials, click button with text "Sign In" | Text "Customer Directory" visible |
| 3 | Directory loads data | Wait for network idle | At least 1 `div` with account name text visible (cursor-pointer card) |
| 4 | Search filters | Type in `placeholder="Search customers..."` input, wait 400ms | Card count changes or "No customers match your search." appears |
| 5 | Clear search restores | Clear input, wait 400ms | Original card count restored |
| 6 | Click account → 360 | Click first account card | Text "Customer 360" visible |
| 7 | 360 header + stats | Check header and stats bar | Account name text, "Stakeholders", "Projects", "Assets" labels present |
| 8 | Overview tab default | Check content area | "Account Details" text present |
| 9 | Stakeholders tab | Click button with text "Stakeholders" | Stakeholder card or "No stakeholders found" visible |
| 10 | Projects tab | Click button with text "Projects" | Project card or "No projects found" visible |
| 11 | Installed Base tab | Click button with text "Installed Base" | Asset card or "No installed assets found" visible |
| 12 | Back to directory | Click button with text "Back" | "Customer Directory" text visible |
| 13 | Navigate to catalog | Click hamburger button (☰), then click "Product Catalog" in sidebar | "Product Catalog" heading visible |
| 14 | Products load + search | Wait for cards, type in search input | Product list filters |
| 15 | Product detail + back | Click first product card, verify "Product Detail" text, click "Back" | Product list visible again |
| 16 | Sign out | Click "Sign Out" | Login form visible (`[type="email"]` input present) |

### Selector Notes

These selectors are derived from the actual component source code:

```
Login form        → input[type="email"], input[type="password"], button:has-text("Sign In")
Customer Directory heading → text "Customer Directory"
Customer 360 label → text "Customer 360"
Account Details   → text "Account Details"
Tab buttons       → buttons with exact text: "Overview", "Stakeholders", "Projects", "Installed Base"
Back button       → button:has-text("Back")
Hamburger button  → button with text "☰"
Sidebar nav       → button:has-text("Product Catalog")
Product Catalog   → text "Product Catalog"
Product Detail    → text "Product Detail"
Sign Out          → button:has-text("Sign Out")
Search inputs     → placeholder="Search customers...", placeholder="Search products..."
Brand filter      → placeholder="Filter by brand..."
```

### Run Command

```bash
cd sales-os-app && npx playwright test
```

### Pass Criteria

```
1 file, 16 assertions, 0 failures
```

---

## Section 3 — API Integration Suite

Validates that every endpoint the frontend calls returns the correct response shape with real data. Catches ORM serialization bugs, missing eager loads, and broken FK joins.

### Scope — Demo-Critical Endpoints Only

```
GET /api/v1/auth/me              → AuthContext on login
GET /api/v1/accounts             → CustomerDirectoryScreen
GET /api/v1/accounts/{id}/workspace → Customer360Screen
GET /api/v1/products             → ProductCatalogScreen
GET /api/v1/products/{id}        → ProductDetail
```

### Response Wrapper

All endpoints return `APIResponse`:

```json
{ "success": true, "message": "", "data": <payload> }
```

Paginated endpoints return `PaginatedResponse` inside `data`:

```json
{ "success": true, "data": { "items": [...], "total": N, "page": N, "page_size": N, "total_pages": N } }
```

All assertions below reference fields inside the `data` wrapper.

### Setup

```
File: backend/tests/integration/conftest.py

Fixtures:
  - base_url        → http://localhost:8000/api/v1
  - auth_headers    → {"Authorization": "Bearer <real_supabase_jwt>"}
  - seed_account_id → UUID of a known account with stakeholders, projects, assets
  - seed_product_id → UUID of a known product
  - seed_sbu_id     → UUID of a known SBU
  - known_brand     → OEM name of a known product (e.g. "GE Healthcare")
```

### Test File

```
backend/tests/integration/test_demo_api.py
```

### Tests (12 total)

#### Auth (2 tests)

| # | Test | Request | Assertion |
|---|------|---------|-----------|
| 1 | Auth returns user profile | `GET /auth/me` with valid token | 200; `data` has `id`, `display_name`, `role_name`, `sbu.id`, `sbu.name` |
| 2 | Missing auth returns 401 | `GET /auth/me` without header | 401 |

#### Accounts (3 tests)

| # | Test | Request | Assertion |
|---|------|---------|-----------|
| 3 | List accounts | `GET /accounts` | 200; `data.items` is array, `data.total` >= 1; first item has `id`, `name`, `managing_sbu.name` |
| 4 | Search accounts | `GET /accounts?search=<known_name>` | 200; all returned items contain search term in `name` |
| 5 | SBU filter | `GET /accounts?sbu_id=<seed_sbu_id>` | 200; all items have `managing_sbu.id` == seed_sbu_id |

#### Workspace (3 tests)

| # | Test | Request | Assertion |
|---|------|---------|-----------|
| 6 | Full workspace shape | `GET /accounts/<seed_id>/workspace` | 200; `data` has `account`, `stakeholders[]`, `projects[]`, `installed_assets[]` |
| 7 | Workspace nested shapes | Same as above | `account` has `managing_sbu`; each stakeholder has `nps_score`, `sentiment`; each project has `status.status_name`, `owner.display_name`; each asset has `is_competitor_equipment`, `department` |
| 8 | Workspace not found | `GET /accounts/<random_uuid>/workspace` | 404 |

#### Products (4 tests)

| # | Test | Request | Assertion |
|---|------|---------|-----------|
| 9 | List products | `GET /products` | 200; `data.items` array, `data.total` >= 1; first item has `id`, `name`, `sbu.name`, `oem_name` |
| 10 | Search products | `GET /products?search=<term>` | 200; filtered results |
| 11 | Brand filter | `GET /products?brand=<known_brand>` | 200; all items have matching `oem_name` |
| 12 | Product detail | `GET /products/<seed_id>` | 200; `data` has `name`, `description`, `oem_name`, `model_number`, `category_name`, `sbu.name` |

### Run Command

```bash
cd backend && python -m pytest tests/integration/ -v
```

### Pass Criteria

```
12 passed, 0 failed
```

---

## Section 4 — Post-Demo Test Backlog

Everything below is valuable but deferred until after June 29. Prioritized by ROI.

### Tier A — First Week After Demo

**Frontend Component Tests (Vitest + React Testing Library)**

```
Install: vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom

Suites:
  CustomerDirectoryScreen.test.jsx  — loading, empty, error, retry, debounce, pagination
  Customer360Screen.test.jsx        — tabs, NPS colors, empty states, competitor highlighting
  ProductCatalogScreen.test.jsx     — debounce, detail view, error/retry, empty states
  DemoApp.test.jsx                  — navigation, sidebar, ErrorBoundary
  Total: ~45 tests
```

**API Write Endpoint Tests**

```
  POST /accounts              — create, duplicate name (409), invalid SBU, invalid parent
  PUT  /accounts/{id}         — update, exclude_unset, self-parent rejection
  POST /accounts/{id}/stakeholders — create, NPS out of range (422), invalid account
  PUT  /stakeholders/{id}     — update, not found
  Total: ~12 tests
```

**Single Account Endpoint Tests (not used by demo)**

```
  GET /accounts/{id}          — success, not found (404)
  Total: 2 tests
```

### Tier B — Second Week After Demo

**Expanded API Coverage**

```
  Auth edge cases: expired token, invalid signature, malformed Bearer scheme
  Pagination boundary tests: page_size=1, last page, page beyond total
  Master data endpoints: GET /master-data/sbus, /master-data/stages, /users
  Total: ~15 tests
```

**Error Resilience Tests (Playwright)**

```
  API down → error state with "Retry" button visible
  Slow API → "Loading..." state appears
  401 during session → auto-redirect to login (api.js interceptor)
  Total: ~5 tests
```

### Tier C — Ongoing

```
  Multi-browser Playwright (Firefox, WebKit)
  Mobile viewport Playwright tests
  Visual regression snapshots
  Performance baseline (Lighthouse CI)
  Load testing (API endpoints under concurrent users)
```

---

## Section 5 — Execution Order & Time Estimates

### Day 1 (June 25) — Foundation

| # | Task | Time | Deliverable |
|---|------|------|-------------|
| 1 | Verify seed data in database | 30 min | SQL verification query passes, known IDs documented |
| 2 | Run existing backend tests | 10 min | `pytest` — 154 passed, 0 failed |
| 3 | Install Playwright + write config | 20 min | `playwright.config.ts` committed |
| 4 | Write `demo-smoke.spec.ts` (steps 1-12) | 2 hr | Login → Directory → 360 → Back working |

**Day 1 gate: Playwright runs Login → Customer Directory → Customer 360 → Back**

### Day 2 (June 26) — Complete Automation

| # | Task | Time | Deliverable |
|---|------|------|-------------|
| 5 | Finish `demo-smoke.spec.ts` (steps 13-16) | 1 hr | Product Catalog + Logout passing |
| 6 | Write API integration conftest + fixtures | 30 min | `tests/integration/conftest.py` with auth headers, seed IDs |
| 7 | Write `test_demo_api.py` (12 tests) | 1.5 hr | All 12 API integration tests passing |
| 8 | `npm run build` — verify clean | 5 min | Build succeeds, 0 errors |

**Day 2 gate: Full Playwright smoke (16 steps) + all 12 API tests green**

### Day 3 (June 27) — Stabilize

| # | Task | Time | Deliverable |
|---|------|------|-------------|
| 9 | Fix any failures from Day 1-2 | 1-2 hr | All tests green |
| 10 | Run full release candidate checklist | 15 min | All 4 steps pass |
| 11 | Deploy to staging | 30 min | Staging environment live |
| 12 | Run Playwright against staging URL | 15 min | `TEST_BASE_URL=<staging> npx playwright test` passes |

**Day 3 gate: All tests pass on staging**

### Day 4 (June 28) — Rehearsal

| # | Task | Time | Deliverable |
|---|------|------|-------------|
| 13 | Manual validation checklist (Section 1) | 10 min | All checkboxes ticked |
| 14 | Demo rehearsal with real narration | 20 min | Smooth walkthrough, no surprises |
| 15 | Fix any last issues | as needed | Clean |

**Day 4 gate: Manual checklist clean, demo rehearsed**

### Day 5 (June 29) — Demo Day

```
Morning pre-flight:
  pytest                            — 154 passed
  pytest tests/integration/         —  12 passed
  npm run build                     — clean
  npx playwright test               —  16 passed

ALL PASS → DEMO IS GO
ANY FAIL → STOP AND FIX BEFORE PRESENTING
```

---

## Release Candidate Checklist

Run before every deployment:

```
Step 1: Backend unit tests
  cd backend && python -m pytest -q
  Pass: 154 passed, 0 failed

Step 2: API integration tests
  cd backend && python -m pytest tests/integration/ -q
  Pass: 12 passed, 0 failed

Step 3: Frontend build
  cd sales-os-app && npm run build
  Pass: Build succeeds, 0 errors

Step 4: Playwright smoke
  cd sales-os-app && npx playwright test
  Pass: 16 assertions, 0 failures

ALL PASS → SAFE TO DEPLOY
ANY FAIL → STOP AND FIX
```

---

## Test Count Summary

| Suite | Tests | Infra Required | Run Time | Status |
|-------|-------|---------------|----------|--------|
| Backend unit (existing) | 154 | None | ~10s | Done |
| API integration (new) | 12 | Backend + DB | ~10s | Build by June 26 |
| Playwright smoke (new) | 16 | Full stack | ~25s | Build by June 26 |
| **Pre-demo total** | **182** | | **~45s** | |
| Frontend component (deferred) | ~45 | None | ~5s | Post-demo Tier A |
| Expanded API (deferred) | ~34 | Backend + DB | ~15s | Post-demo Tier A-B |

---

## Seed Data Requirements

### Minimum for Tests to Pass

```
1  Supabase auth user         — credentials in env vars
1  UserProfile                — linked to auth user, with role + SBU + zone
2  SBUs                       — e.g. "Imaging", "Critical Care"
3+ Accounts                   — with managing_sbu and payer_behavior set
2+ Stakeholders               — under a known account, with nps_score + sentiment
1+ Project                    — under a known account, with status + owner
1+ Installed Asset (own)      — under a known account, with product FK
1+ Installed Asset (competitor) — under a known account, is_competitor_equipment=true
5+ Products                   — across both SBUs, with oem_name + model_number
```

### Verification Query

```sql
SELECT 'accounts' AS entity, count(*) FROM account
UNION ALL SELECT 'stakeholders', count(*) FROM stakeholder
UNION ALL SELECT 'products', count(*) FROM product
UNION ALL SELECT 'projects', count(*) FROM project
UNION ALL SELECT 'installed_assets', count(*) FROM installed_asset
UNION ALL SELECT 'users', count(*) FROM user_profile;
```

All counts >= 1 before running API integration or Playwright tests.
