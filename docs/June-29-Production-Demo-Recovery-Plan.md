### Cabio Sales OS

# June 29 Production Demo Recovery Plan

## Objective

Deliver the first production-ready demonstration of Cabio Sales OS on June 29, featuring:

* Authentication
* Customer Directory
* Customer 360 Workspace
* Stakeholder Management
* Product Catalog Browser
* Live Supabase Database Connectivity

The demo must run end-to-end using:

```text
React Frontend
    ↓
FastAPI Backend
    ↓
Supabase PostgreSQL
```

---

# Current Status

## Completed

### Phase 2A – Database Foundation

* Supabase project created
* Physical schema deployed
* Seed data deployed
* Database validation completed

### Phase 2B – Backend Foundation

* FastAPI application
* SQLAlchemy ORM
* Alembic
* Configuration management
* Logging
* Health endpoint

### Phase 2B.2 – ORM Foundation

* All ORM models
* Relationship mapping
* Repository foundation
* Mapper validation

### Phase 2B.3 – Authentication Foundation

* Supabase Auth
* ES256 JWT validation
* JWKS integration
* Current user resolution
* Protected routes

### Phase 2C.1 – Identity & Reference Data

* User services
* Reference data services
* Authentication API
* Master data API

---

# Sprint Goal

## Production Demo Scope

### Customer Management

```text
Customer Directory
    ↓
Customer 360
        Overview
        Stakeholders
        Projects
        Installed Base
```

### Product Management

```text
Product Catalog
    ↓
Filter by SBU
    ↓
View Product Details
```

---

# Phase 2C.2 – Accounts & Products

## Objective

Deliver all backend services required for:

* Customer Directory
* Customer 360
* Product Catalog

---

# Work Package 1 – Account Management

## Scope

### Entity

```text
Account
```

### Deliverables

#### Repository

```text
app/domains/account/repositories/account_repository.py
```

#### Service

```text
app/domains/account/services/account_service.py
```

#### Schemas

```text
app/domains/account/schemas/account.py
```

#### Router

```text
app/domains/account/routers/account_router.py
```

### API Endpoints

```http
GET    /api/v1/accounts

GET    /api/v1/accounts/{id}

POST   /api/v1/accounts

PUT    /api/v1/accounts/{id}
```

### Directory Filters

```http
GET /accounts?search=

GET /accounts?zone_id=

GET /accounts?account_type=

GET /accounts?sbu_id=
```

### Acceptance Criteria

* Account list returns data
* Search works
* Filtering works
* Account detail loads
* Create and update work
* Tests pass

---

# Work Package 2 – Stakeholder Management

## Scope

### Entity

```text
Stakeholder
```

### Deliverables

#### Repository

```text
stakeholder_repository.py
```

#### Service

```text
stakeholder_service.py
```

#### Schemas

```text
stakeholder.py
```

### API Endpoints

```http
GET    /api/v1/accounts/{id}/stakeholders

POST   /api/v1/accounts/{id}/stakeholders

PUT    /api/v1/stakeholders/{id}
```

### Acceptance Criteria

* Stakeholders linked to account
* Create stakeholder works
* Update stakeholder works
* Tests pass

---

# Work Package 3 – Product Catalog

## Scope

### Entity

```text
Product
```

### Deliverables

#### Repository

```text
product_repository.py
```

#### Service

```text
product_service.py
```

#### Schemas

```text
product.py
```

#### Router

```text
product_router.py
```

### API Endpoints

```http
GET /api/v1/products

GET /api/v1/products/{id}

GET /api/v1/products?sbu_id=

GET /api/v1/products?brand=

GET /api/v1/products?search=
```

### Acceptance Criteria

* Product list loads
* SBU filtering works
* Product detail works
* Tests pass

---

# Work Package 4 – Customer 360 API

## Objective

Support Customer 360 screen with a single backend endpoint.

### Endpoint

```http
GET /api/v1/accounts/{id}/workspace
```

### Response Structure

```json
{
  "account": {},
  "stakeholders": [],
  "projects": [],
  "installed_assets": []
}
```

### Acceptance Criteria

Customer 360 tabs can be populated from one API call:

* Overview
* Stakeholders
* Projects
* Installed Base

---

# Phase 2D – Frontend Integration

## Architecture Decision

Preserve `App.jsx` prototype completely unchanged. Build a separate `DemoApp.jsx` using the Phase 2D.1 integration foundation. Both applications are available simultaneously via client-side routing:

```text
/prototype    →  App.jsx (original mock-data prototype, untouched)
/demo         →  DemoApp.jsx (production app, live APIs)
/             →  Redirects to /demo (authenticated) or login screen
```

### Rationale

* Prototype remains a living reference for Sprint 2+ feature development
* Zero risk of breaking prototype screens not yet API-connected (pipeline, beat planning, targets, activities)
* Trivial rollback — `/prototype` always works regardless of API state
* Clean separation enables independent iteration on production screens

---

## Phase 2D.1 – Integration Foundation (Completed)

### Deliverables

* Supabase client (`src/lib/supabase.js`)
* Axios API client with Bearer token injection (`src/lib/api.js`)
* AuthContext with session + user profile management (`src/contexts/AuthContext.jsx`)
* Login screen (`src/components/LoginScreen.jsx`)
* Service modules: `auth.js`, `accounts.js`, `products.js`
* AuthGate in `main.jsx`

### Status

```text
COMPLETE
```

---

## Phase 2D.2 – DemoApp Shell & Customer Directory

### Deliverables

#### DemoApp Shell

```text
src/DemoApp.jsx
```

Production application shell with:

* Sidebar navigation (Customer Directory, Product Catalog)
* Auth header with user profile, role, SBU, zone
* Sign out
* View routing

#### Customer Directory Screen

```text
src/screens/CustomerDirectoryScreen.jsx
```

### Features

* Search
* SBU filter
* Customer list from live API
* Click-through to Customer 360

### API Dependencies

```text
GET /accounts
GET /accounts/{id}
```

---

## Phase 2D.3 – Customer 360 Integration

### Deliverables

```text
src/screens/Customer360Screen.jsx
```

### Tabs

#### Overview

Account summary with SBU, payer behavior

#### Stakeholders

Stakeholder listing with NPS score, sentiment

#### Projects

Project listing with status, owner, bid date

#### Installed Base

Asset listing with product, department, competitor equipment

### API Dependency

```text
GET /accounts/{id}/workspace
```

---

## Phase 2D.4 – Product Catalog Integration

### Deliverables

```text
src/screens/ProductCatalogScreen.jsx
```

### Features

* Product search
* SBU filtering
* Brand filtering
* Product detail view

### API Dependencies

```text
GET /products
GET /products/{id}
```

---

## Phase 2D.5 – Route Setup & Demo Hardening

### Deliverables

#### Route Configuration

```text
src/main.jsx (updated)
```

```text
/              →  /demo (default, authenticated)
/demo          →  DemoApp.jsx with live APIs
/prototype     →  App.jsx with mock data
```

#### Demo Validation

Verify every screen in the production demo app:

* Customer Directory: search, filters, navigation
* Customer 360: overview, stakeholders, projects, installed base
* Product Catalog: search, SBU filter, detail view
* Authentication: login, session persistence, sign out
* Error handling: loading states, API failures, empty states

---

# Daily Execution Plan

## June 24 (Completed)

### Backend: Phase 2C.2

Delivered:

* WP1 – Account Management (hardened)
* WP2 – Stakeholder Management
* WP3 – Product Catalog
* WP4 – Customer 360 Workspace API

### Frontend: Phase 2D.1

Delivered:

* Integration Foundation (Supabase, Axios, AuthContext, services, login)

### Results

```text
154 backend tests passing, 99% coverage
Frontend builds successfully
```

---

## June 25

### Phase 2D.2 – DemoApp Shell & Customer Directory

Deliver:

* Route setup (`react-router-dom`)
* DemoApp.jsx shell
* CustomerDirectoryScreen.jsx
* `/prototype` and `/demo` both functional

### Exit Criteria

```text
Customer Directory loads live data from API
Prototype accessible at /prototype unchanged
```

---

## June 26

### Phase 2D.3 – Customer 360

Deliver:

* Customer360Screen.jsx
* All 4 tabs populated from workspace API

### Exit Criteria

```text
Customer 360 displays live stakeholders, projects, installed assets
```

---

## June 27

### Phase 2D.4 – Product Catalog

Deliver:

* ProductCatalogScreen.jsx
* SBU and search filtering operational

### Exit Criteria

```text
Product catalog loads and filters live data
```

---

## June 28

### Phase 2D.5 – Demo Hardening & Stabilization

Deliver:

* Loading states and error handling
* Empty state displays
* End-to-end demo walkthrough
* Bug fixes

### Exit Criteria

```text
Complete demo flow succeeds end-to-end against live Supabase
```

---

## June 29

# Production Demo

## Demonstration Flow

```text
Login (Supabase Auth)
    ↓
Customer Directory (/demo)
    ↓
Search Customer
    ↓
Open Customer 360
        Overview
        Stakeholders
        Projects
        Installed Base
    ↓
Open Product Catalog
    ↓
Filter By SBU
    ↓
View Product Details
```

## Available Routes

```text
/demo         Production demo with live APIs
/prototype    Original prototype with mock data (reference)
```

---

# Explicitly Deferred Until Sprint 2

The following are not required for the June 29 demo:

```text
Target Planning
Coverage Planning
Opportunity Management
Activity Management
Pipeline Planning
Forecasting
Performance Dashboards
Advanced RBAC
RLS Fine-Tuning
Prototype-to-Production Migration (remaining screens)
```

## Success Definition

The June 29 demo is successful if a user can:

1. Authenticate using Supabase Auth.
2. Browse and search customers.
3. Open Customer 360.
4. View stakeholders, projects, and installed assets.
5. Browse and filter products.
6. Perform all actions against the live Supabase database.
7. Access the original prototype at `/prototype` for reference.

This becomes the baseline production release from which Sprint 2 can expand into Projects, Opportunities, Activities, and eventually the full Sales OS planning capabilities.
