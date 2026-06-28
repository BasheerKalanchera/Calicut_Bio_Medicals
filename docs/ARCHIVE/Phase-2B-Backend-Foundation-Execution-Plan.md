# Cabio Sales OS – Phase 2B Backend Foundation Execution Plan

Phase 2B should focus on establishing a **production-ready backend foundation**, not delivering business functionality.

The objective is to create a stable platform upon which all Phase 2C Business Services can be implemented consistently and rapidly.

This plan is aligned with the approved architecture:

* Python 3.13
* FastAPI
* SQLAlchemy 2.x
* Alembic
* Pydantic v2
* Supabase PostgreSQL
* Modular Monolith
* API First
* RLS First
* Repository + Service Layer Pattern

The implementation should preserve the Sales OS philosophy where business services support the planning hierarchy:

```text
Target Plan
    
Coverage Plan
    
Opportunity
    
Revenue Achievement
```

as previously established during Architecture Freeze. 

---

# 1. Backend Project Structure

## Recommended Repository Structure

```text
backend/

 app/
   
    api/
       routers/
          health.py
          version.py
          auth.py
          master_data.py
      
       dependencies.py
   
    core/
       config.py
       security.py
       logging.py
       exceptions.py
   
    db/
       base.py
       session.py
       database.py
   
    domains/
   
       reference/
       organization/
       account/
       planning/
       project/
       opportunity/
       activity/
       asset/
   
    models/
   
    repositories/
   
    services/
   
    schemas/
   
    middleware/
   
    main.py

 alembic/

 tests/

 scripts/

 .env
 .env.example
 pyproject.toml
 README.md
```

---

## Domain Internal Structure

Example:

```text
domains/opportunity/

 models.py
 schemas.py
 repository.py
 service.py
 router.py
 validators.py
```

Benefits:

* High cohesion
* Easy future modular extraction
* Clear ownership boundaries
* Supports modular monolith strategy

---

# 2. SQLAlchemy Model Generation Strategy

## SQLAlchemy Standards

Use:

```python
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
```

Avoid legacy patterns.

---

## Base Model

Create common base:

```python
id
created_at
updated_at
created_by
updated_by
```

Applicable to all transactional entities.

---

## Generation Sequence

Do not generate all 25 tables simultaneously.

Generate in dependency order.

### Wave 1 — Foundation Masters

```text
Role
SBU
Zone
LeadSource
OpportunityStage
OpportunityStatus
LossReason
HoldReason
ProjectStatus
```

Reason:

No complex dependencies.

---

### Wave 2 — Organization

```text
User
```

Depends on:

```text
Role
Zone
SBU
```

---

### Wave 3 — Product Domain

```text
Product
```

Depends on:

```text
SBU
```

---

### Wave 4 — Account Domain

```text
Account
Stakeholder
InstalledAsset
```

Core customer model. 

---

### Wave 5 — Planning Domain

```text
TargetPlan
TargetAllocation

CoveragePlan
CoveragePlanAccount
```

Supports approved Sales OS planning flow. 

---

### Wave 6 — Project Domain

```text
Project
```

Supports grouping construct:

```text
Account
    
Project
    
Opportunity
```



---

### Wave 7 — Opportunity Domain

```text
Opportunity
OpportunityContributor
OpportunityItem
```

Most relationship-heavy domain.

---

### Wave 8 — Activity Domain

```text
Activity
ActivityParticipant
```

Generate last due to dependencies.

---

## Acceptance Criteria

For every model:

* UUID PK
* FK relationships
* indexes
* unique constraints
* check constraints
* audit fields
* SQLAlchemy relationship() mappings

---

# 3. Database Infrastructure

## Configuration Layer

Create:

```text
core/config.py
```

Using:

```python
pydantic-settings
```

Example:

```python
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_JWT_SECRET
APP_ENV
```

---

## Database Engine

```python
create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)
```

---

## Session Factory

```python
SessionLocal
```

pattern:

```python
with SessionLocal() as db:
```

---

## Dependency Injection

```python
def get_db():
    yield session
```

Used by:

```python
Depends(get_db)
```

---

## Repository Injection

Example:

```python
AccountService(
    AccountRepository(db)
)
```

Avoid service locator patterns.

---

## Supabase Connectivity

Use:

```text
Direct PostgreSQL Connection
```

for application data access.

Use:

```text
Supabase Auth
```

for authentication.

Do NOT use Supabase Python SDK for CRUD.

Use SQLAlchemy exclusively.

---

# 4. Alembic Strategy

## Recommended Approach

Because schema is already approved and deployed:

Phase 2B should start with:

```text
Alembic Baseline Migration
```

not schema generation.

---

## Initial Baseline

```bash
alembic revision \
--autogenerate \
-m "baseline"
```

Validate carefully.

Then:

```bash
alembic stamp head
```

against existing database.

---

## Migration Workflow

Future changes:

```text
PDM Change
    
Model Update
    
Alembic Revision
    
Review
    
Apply
```

Never modify existing migrations.

---

## Versioning Convention

```text
001_baseline
002_add_department_to_assets
003_add_stakeholder_nps
```

Readable names.

---

## Production Process

```text
Local
    
Migration Review
    
Git Commit
    
Deploy
    
alembic upgrade head
```

No direct production schema edits.

---

# 5. Authentication Foundation

## Phase 2B Goal

Authentication only.

Authorization deferred.

---

## Authentication Flow

```text
Supabase Login
    
JWT
    
FastAPI
    
JWT Validation
    
User Lookup
    
Request Context
```

---

## Security Components

Create:

```text
core/security.py
```

Functions:

```python
validate_token()
get_current_user()
get_current_user_id()
```

---

## User Profile Resolution

After JWT validation:

```text
auth.users
        
cabio.user
```

Map:

```text
supabase_user_id
```

to:

```text
user.id
```

---

## Request User Context

Store:

```python
user_id
role_id
sbu_id
zone_id
```

Available to services.

---

## Deliverables

```text
GET /auth/me
```

Returns:

```json
{
  "id": "...",
  "name": "...",
  "role": "...",
  "sbu": "...",
  "zone": "..."
}
```

---

# 6. API Foundation

## Phase 2B APIs

### Health

```http
GET /health
```

Returns:

```json
{
  "status":"healthy"
}
```

---

### Version

```http
GET /version
```

Returns:

```json
{
  "version":"1.0.0",
  "environment":"dev"
}
```

---

### Authentication

```http
GET /auth/me
```

Authenticated endpoint.

---

### Master Data APIs

Read-only.

```http
GET /master-data/sbus
GET /master-data/zones
GET /master-data/roles
GET /master-data/stages
GET /master-data/statuses
GET /master-data/loss-reasons
GET /master-data/hold-reasons
```

---

## Implementation Sequence

### Step 1

```text
Health
Version
```

---

### Step 2

```text
Auth
```

---

### Step 3

```text
Master Data
```

---

### Step 4

```text
OpenAPI Validation
```

Ensure alignment with approved API catalog.

---

# 7. Development Roadmap

---

# Phase 2B.1 — Infrastructure Foundation

## Deliverables

* Project skeleton
* Configuration
* Database connectivity
* Session management
* Logging
* Exception handling
* Health endpoint
* Version endpoint

## Acceptance Criteria

* Application starts
* Connects to Supabase
* Health endpoint works
* OpenAPI generated

## Effort

```text
2–3 days
```

---

# Phase 2B.2 — Persistence Foundation

## Deliverables

* SQLAlchemy models
* Relationships
* Alembic baseline
* Repository layer
* Base CRUD repository

## Acceptance Criteria

* All 25 tables mapped
* Model validation completed
* Alembic baseline established

## Effort

```text
4–5 days
```

---

# Phase 2B.3 — Authentication & API Foundation

## Deliverables

* JWT validation
* User context
* Auth endpoint
* Master Data APIs
* Swagger validation

## Acceptance Criteria

* Supabase JWT validated
* User profile resolved
* Master data APIs operational

## Effort

```text
2–3 days
```

---

# Total Estimated Effort

```text
8–11 working days
```

For a single developer using Claude Code/Gemini CLI.

---

# 8. Phase 2B Review Gate

Phase 2C must NOT begin until all criteria below pass.

## Infrastructure

 Application boots successfully

 Environment configuration working

 Database connectivity verified

 Structured logging enabled

---

## Persistence

 All 25 SQLAlchemy models implemented

 Relationships validated

 Alembic baseline established

 Repository layer implemented

---

## Authentication

 Supabase JWT validation working

 User profile mapping working

 /auth/me endpoint working

---

## API Foundation

 Health endpoint operational

 Version endpoint operational

 Master Data APIs operational

 OpenAPI documentation generated

---

## Quality

 Type checking passes

 Linting passes

 Unit tests for infrastructure layer pass

 No critical architectural deviations from Architecture Freeze v1.0

---

# Recommended Execution Order for Claude Code / Gemini CLI

```text
Phase 2B.1
    
Review
    
Phase 2B.2
    
Review
    
Phase 2B.3
    
Backend Foundation Review
    
Phase 2C Business Services
```
