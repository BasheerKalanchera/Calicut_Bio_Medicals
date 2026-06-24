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

## Objective

Connect existing React prototype to production APIs.

---

## Screen 1 – Customer Directory

### Features

* Search
* Zone filter
* Account Type filter
* SBU filter
* Customer list
* Customer navigation

### API Dependencies

```text
GET /accounts
GET /accounts/{id}
```

---

## Screen 2 – Customer 360 Workspace

### Tabs

#### Overview

Account summary

#### Stakeholders

Stakeholder listing

#### Projects

Project listing

#### Installed Base

Asset listing

### API Dependency

```text
GET /accounts/{id}/workspace
```

---

## Screen 3 – Product Catalog

### Features

* Product search
* SBU filtering
* Product detail view

### API Dependencies

```text
GET /products
GET /products/{id}
```

---

# Daily Execution Plan

## June 24

### Account Management

Deliver:

* Account Repository
* Account Service
* Account Schemas
* Account Router
* Repository Tests
* Service Tests
* API Tests

### Exit Criteria

```text
Customer Directory APIs operational
```

---

## June 25

### Stakeholder Management

Deliver:

* Stakeholder Repository
* Stakeholder Service
* Stakeholder Schemas
* Stakeholder APIs
* Tests

### Exit Criteria

```text
Stakeholder management operational
```

---

## June 26

### Product Catalog

Deliver:

* Product Repository
* Product Service
* Product Schemas
* Product Router
* Tests

### Exit Criteria

```text
Product catalog operational
```

---

## June 27

### Customer 360

Deliver:

* Workspace endpoint
* Aggregation service
* Integration tests

### Exit Criteria

```text
Customer 360 API operational
```

---

## June 28

### Frontend Integration & Stabilization

Deliver:

* Customer Directory connected
* Customer 360 connected
* Product Catalog connected
* Bug fixes
* Demo validation

### Exit Criteria

```text
End-to-end demo walkthrough succeeds
```

---

## June 29

# Production Demo

## Demonstration Flow

```text
Login
    ↓
Customer Directory
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
```

## Success Definition

The June 29 demo is successful if a user can:

1. Authenticate using Supabase Auth.
2. Browse and search customers.
3. Open Customer 360.
4. View stakeholders, projects, and installed assets.
5. Browse and filter products.
6. Perform all actions against the live Supabase database.

This becomes the baseline production release from which Sprint 2 can expand into Projects, Opportunities, Activities, and eventually the full Sales OS planning capabilities.
