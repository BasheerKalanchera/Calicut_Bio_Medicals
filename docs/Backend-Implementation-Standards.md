# Cabio Sales OS - Backend Implementation Standards v1.0

**Based on:** Architecture Freeze v1.0, Phase 2B Backend Foundation Execution Plan, API Catalog v1.0

---

## 1. Introduction

### Purpose
This document is the single authoritative reference for all backend implementation decisions. Every backend file — model, schema, repository, service, router, test — must conform to these standards. No deviation without explicit Product Owner and Architect approval.

### Scope
Covers all Python backend code under the `backend/` directory. Does not cover frontend, infrastructure provisioning, or Supabase Dashboard configuration.

### Guiding Principles
1. **One way to do everything.** No alternatives. No "you could also."
2. **Database solves it first.** Per AI Delivery Model Section 4: PostgreSQL Constraints > Views > Materialized Views > RLS Policies > FastAPI Services.
3. **Explicit over implicit.** Type every parameter. Name every constraint. Declare every dependency.
4. **Boring technology.** Standard library and approved stack only. No ORMs on top of ORMs, no middleware frameworks, no magic.
5. **Thin layers.** Routers validate input and call services. Services enforce rules and call repositories. Repositories talk to the database. Nothing else.

---

## 2. Project Structure Standards

### Folder Organization

```
backend/
    app/
        api/
            routers/
                health.py
                version.py
                auth.py
                master_data.py
                accounts.py
                stakeholders.py
                planning.py
                projects.py
                opportunities.py
                activities.py
                reminders.py
                documents.py
                assets.py
            dependencies.py
        core/
            config.py
            security.py
            logging.py
            exceptions.py
        db/
            base.py
            session.py
        domains/
            reference/
                models.py
                schemas.py
                repository.py
                service.py
            organization/
                models.py
                schemas.py
                repository.py
                service.py
            account/
                models.py
                schemas.py
                repository.py
                service.py
            planning/
                models.py
                schemas.py
                repository.py
                service.py
            project/
                models.py
                schemas.py
                repository.py
                service.py
            opportunity/
                models.py
                schemas.py
                repository.py
                service.py
                validators.py
            activity/
                models.py
                schemas.py
                repository.py
                service.py
            asset/
                models.py
                schemas.py
                repository.py
                service.py
            document/
                models.py
                schemas.py
                repository.py
                service.py
        main.py
    alembic/
        versions/
        env.py
        alembic.ini
    tests/
        conftest.py
        test_health.py
        domains/
            test_account_repository.py
            test_account_service.py
            test_account_router.py
    .env
    .env.example
    pyproject.toml
```

### Module Organization
Each domain contains exactly these files:
- `models.py` — SQLAlchemy ORM models
- `schemas.py` — Pydantic request/response schemas
- `repository.py` — Database access layer
- `service.py` — Business logic layer
- `validators.py` — Only when domain has complex validation (opportunity domain only in Phase 1)

### Domain Boundaries
- A domain may import from `core/`, `db/`, and its own files.
- A domain may import **models and schemas** from other domains for relationship resolution.
- A domain must **never** import another domain's repository or service. Cross-domain calls go through the service layer of the calling domain, which receives the dependency via constructor injection.

### Import Rules
```python
# Standard library
import uuid
from datetime import datetime

# Third-party
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# App core
from app.core.config import settings
from app.core.exceptions import NotFoundError

# App db
from app.db.session import get_db

# Domain (own)
from app.domains.account.models import Account
from app.domains.account.schemas import AccountCreate

# Domain (cross — models/schemas only)
from app.domains.organization.models import UserProfile
```

Import order: standard library, third-party, app core, app db, own domain, cross-domain. Enforced by Ruff (`I` rules).

---

## 3. Naming Conventions

### Schema Authority

`Physical-Schema.sql` is the authoritative source for all database object names — table names, column names, constraint names, index names, and trigger names. Naming conventions in this document must not override approved schema definitions. If a conflict exists between this document and `Physical-Schema.sql`, `Physical-Schema.sql` wins.

### Python Modules and Packages
- Packages: `snake_case`, singular nouns — `account`, `opportunity`, `planning`
- Modules: `snake_case` — `models.py`, `schemas.py`, `repository.py`, `service.py`

### SQLAlchemy Models
- Class name: `PascalCase`, singular — `Account`, `Opportunity`, `TargetPlan`
- Table name: `snake_case`, singular — `account`, `opportunity`, `target_plan`
- Column name: `snake_case` — `account_id`, `planning_period`, `win_probability`

| Entity | Model Class | Table Name |
|---|---|---|
| Role | `Role` | `role` |
| SBU | `SBU` | `sbu` |
| Zone | `Zone` | `zone` |
| Lead Source | `LeadSource` | `lead_source` |
| Opportunity Stage | `OpportunityStage` | `opportunity_stage` |
| Opportunity Status | `OpportunityStatus` | `opportunity_status` |
| Loss Reason | `LossReason` | `loss_reason` |
| Hold Reason | `HoldReason` | `hold_reason` |
| Project Status | `ProjectStatus` | `project_status` |
| User Profile | `UserProfile` | `user_profile` |
| Target Plan | `TargetPlan` | `target_plan` |
| Coverage Plan | `CoveragePlan` | `coverage_plan` |
| Coverage Plan Entry | `CoveragePlanEntry` | `coverage_plan_entry` |
| Product | `Product` | `product` |
| Account | `Account` | `account` |
| Stakeholder | `Stakeholder` | `stakeholder` |
| Project | `Project` | `project` |
| Opportunity | `Opportunity` | `opportunity` |
| Opportunity Stakeholder | `OpportunityStakeholder` | `opportunity_stakeholder` |
| Split | `Split` | `split` |
| Opportunity Item | `OpportunityItem` | `opportunity_item` |
| Activity | `Activity` | `activity` |
| Reminder | `Reminder` | `reminder` |
| Installed Asset | `InstalledAsset` | `installed_asset` |
| Document | `Document` | `document` |

### Pydantic Schemas
- `{Entity}Create` — POST request body
- `{Entity}Update` — PATCH request body (all fields optional)
- `{Entity}Response` — single-entity response
- `{Entity}ListResponse` — paginated list response
- `{Entity}Filter` — query parameter schema for filtering

Examples: `AccountCreate`, `AccountUpdate`, `AccountResponse`, `OpportunityFilter`

### Repositories
- Class name: `{Entity}Repository` — `AccountRepository`, `OpportunityRepository`
- One repository per aggregate root. Child entities (e.g., `OpportunityItem`) are managed through the parent repository.

### Services
- Class name: `{Entity}Service` — `AccountService`, `OpportunityService`
- One service per domain.

### Routers
- File name: `snake_case` matching API Catalog grouping — `accounts.py`, `opportunities.py`, `planning.py`
- Router variable: `router = APIRouter()`

### Enums
- Class name: `PascalCase` with descriptive suffix — `PayerBehavior`, `InfluenceLevel`
- Values: `UPPER_SNAKE_CASE` — `PayerBehavior.GOOD`, `InfluenceLevel.HIGH`

### Constants
- Module-level: `UPPER_SNAKE_CASE` — `MAX_SPLIT_PERCENTAGE = Decimal("100.00")`

---

## 4. SQLAlchemy Standards

### DeclarativeBase

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass
```

Defined once in `app/db/base.py`. All models inherit from `Base`.

### UUID Primary Keys

```python
import uuid
from sqlalchemy import UUID

id: Mapped[uuid.UUID] = mapped_column(
    UUID(as_uuid=True),
    primary_key=True,
    default=uuid.uuid4,
)
```

Every table uses UUID v4. No auto-increment integers.

### Audit Fields Mixin

```python
from datetime import datetime
from sqlalchemy import DateTime, UUID, ForeignKey, func

class AuditMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_profile.id"),
        nullable=True,
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_profile.id"),
        nullable=True,
    )
```

Applied to all transactional models. Reference/master models do not use this mixin.

**Exception:** `Activity` model uses only `created_at` and `created_by` (immutability per BR-ACT-01). `Document` model uses `uploaded_at` and `uploaded_by_user_id`.

### Relationships

```python
from sqlalchemy.orm import relationship

# Parent side (one-to-many)
stakeholders: Mapped[list["Stakeholder"]] = relationship(
    back_populates="account",
    lazy="selectin",
)

# Child side (many-to-one)
account: Mapped["Account"] = relationship(
    back_populates="stakeholders",
    lazy="joined",
)
```

- Default lazy loading: `"selectin"` for collections, `"joined"` for single references.
- Always define both sides with `back_populates`.
- Never use `backref`.

### Constraints

Name all constraints explicitly:

```python
from sqlalchemy import UniqueConstraint, CheckConstraint

__table_args__ = (
    UniqueConstraint("user_id", "sbu_id", "planning_period", name="uq_target_plan_user_sbu_period"),
    CheckConstraint("win_probability >= 0 AND win_probability <= 100", name="ck_opportunity_win_probability"),
)
```

### Naming Conventions

| Object | Pattern | Example |
|---|---|---|
| Primary Key | `pk_{table}` | `pk_opportunity` |
| Foreign Key | `fk_{table}_{column}` | `fk_opportunity_account_id` |
| Unique Constraint | `uq_{table}_{columns}` | `uq_target_plan_user_sbu_period` |
| Check Constraint | `ck_{table}_{description}` | `ck_opportunity_win_probability` |
| Index | `idx_{table}_{columns}` | `idx_opportunity_account_id` |
| Trigger | `trg_{table}_{description}` | `trg_opportunity_updated_at` |

### Enum Handling

Use Python `enum.Enum` for application-level validation. Store as `VARCHAR` in the database (matching Physical-Schema.sql). Do not use PostgreSQL ENUM types.

```python
import enum

class PayerBehavior(str, enum.Enum):
    GOOD = "GOOD"
    AVERAGE = "AVERAGE"
    PROBLEMATIC = "PROBLEMATIC"
    UNKNOWN = "UNKNOWN"
```

```python
payer_behavior: Mapped[str | None] = mapped_column(
    String(50),
    nullable=True,
)
```

Validation is done in the Pydantic schema layer, not the ORM layer.

### Soft Delete Policy

Reference/master entities use `is_active: Mapped[bool]` flag. Never issue `DELETE` on reference tables. Active filtering is encapsulated in `ReferenceRepository` (see Section 6) — service and API layers must never manually add `.where(is_active == True)`.

Transactional entities do not have soft delete. They use terminal statuses (Won/Lost for opportunities, Closed for projects) instead of deletion.

### Metadata Conventions

Map `__tablename__` explicitly on every model:

```python
class Opportunity(AuditMixin, Base):
    __tablename__ = "opportunity"
```

Never rely on automatic table name generation.

### Alembic Baseline Strategy

`Physical-Schema.sql` was deployed to the database during Phase 2A. The existing database schema already matches the SQLAlchemy models. Therefore:

**Existing Supabase environments (staging, production):**

```bash
alembic revision --autogenerate -m "001_baseline"
```

The generated migration may be empty or contain only minor diffs (e.g., naming convention differences between raw SQL and SQLAlchemy metadata). An empty baseline migration is expected behavior — it means the models match the database. Do not treat this as an error.

Then stamp the database as current:

```bash
alembic stamp head
```

This tells Alembic "the database is already at this revision" without executing any SQL.

**Fresh local developer environments:**

```bash
alembic upgrade head
```

This applies all migrations from scratch to build the local database. Alternatively, developers may run `Physical-Schema.sql` + `Seed-Data.sql` directly and then `alembic stamp head`.

**Migration workflow for future changes:**

```
PDM Change → Model Update → alembic revision --autogenerate → Review → Apply
```

Never modify existing migrations. Never run `alembic downgrade` in production.

---

## 5. Pydantic Standards

### Create Schemas

All required fields present. No `id`, no audit fields. No `from_attributes` — Create schemas are populated from request JSON, not ORM objects.

```python
from pydantic import BaseModel
from decimal import Decimal
import uuid

class TargetPlanCreate(BaseModel):
    sbu_id: uuid.UUID
    planning_period: str
    target_amount_lakhs: Decimal
```

### Update Schemas

All fields optional. Only provided fields are applied. No `from_attributes` — Update schemas are populated from request JSON, not ORM objects.

```python
class AccountUpdate(BaseModel):
    name: str | None = None
    payer_behavior: PayerBehavior | None = None
    managing_sbu_id: uuid.UUID | None = None
    parent_account_id: uuid.UUID | None = None
```

### Response Schemas

Include `id` and audit fields. Response schemas require `model_config = ConfigDict(from_attributes=True)` because they are hydrated from ORM model instances via `model_validate()`.

```python
class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    payer_behavior: str | None
    managing_sbu_id: uuid.UUID | None
    parent_account_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
```

### Pagination Schemas

One standard pagination envelope used across all list endpoints:

```python
from pydantic import BaseModel
from typing import Generic, TypeVar

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
```

### Validation Rules

- Use `Field()` for constraints: `Field(ge=0, le=100)` for percentages, `Field(max_length=255)` for strings.
- Use `field_validator` for pattern matching: planning period format `YYYY-Qn`.
- Use `model_validator` for cross-field rules: `competitor_name` required when `loss_reason` is COMPETITOR_WON.
- Do not duplicate database CHECK constraints in Pydantic unless they provide meaningful user-facing error messages.

### Field Naming

Pydantic field names must match SQLAlchemy column names exactly. No aliasing. No camelCase conversion. The API contract is `snake_case`.

---

## 6. Repository Standards

### Repository Responsibilities

Repositories do exactly one thing: translate between SQLAlchemy models and database operations. They:

- Execute queries (SELECT, INSERT, UPDATE, DELETE)
- Apply filters and pagination
- Return ORM model instances or scalar values

Repositories do NOT:

- Enforce business rules
- Raise HTTP exceptions
- Call other repositories
- Import Pydantic schemas
- Log business events

### Base Repository

```python
from typing import Generic, TypeVar, Type
from sqlalchemy.orm import Session
from sqlalchemy import select, func
import uuid

ModelType = TypeVar("ModelType")

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, id: uuid.UUID) -> ModelType | None:
        return self.db.get(self.model, id)

    def list(
        self,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[ModelType], int]:
        stmt = select(self.model)
        total = self.db.scalar(
            select(func.count()).select_from(stmt.subquery())
        )
        results = list(
            self.db.scalars(stmt.offset(offset).limit(limit)).all()
        )
        return results, total

    def create(self, obj: ModelType) -> ModelType:
        self.db.add(obj)
        self.db.flush()
        return obj

    def update(self, obj: ModelType) -> ModelType:
        self.db.flush()
        return obj

    def delete(self, obj: ModelType) -> None:
        self.db.delete(obj)
        self.db.flush()
```

### Domain Repository

Extends `BaseRepository` with domain-specific queries:

```python
class AccountRepository(BaseRepository[Account]):
    def __init__(self, db: Session):
        super().__init__(Account, db)

    def find_by_name(self, name: str) -> list[Account]:
        stmt = select(Account).where(Account.name.ilike(f"%{name}%"))
        return list(self.db.scalars(stmt).all())
```

### Reference Repository

Reference/master data tables (`opportunity_stage`, `opportunity_status`, `lead_source`, `loss_reason`, `hold_reason`, `project_status`, `sbu`, `zone`, `role`, `product`) use `is_active` soft delete. Active filtering must be encapsulated in the repository, not scattered across services or routers.

```python
class ReferenceRepository(BaseRepository[ModelType]):
    def list_active(self) -> list[ModelType]:
        stmt = select(self.model).where(self.model.is_active == True)
        return list(self.db.scalars(stmt).all())

    def get_active_by_id(self, id: uuid.UUID) -> ModelType | None:
        obj = self.db.get(self.model, id)
        if obj and not obj.is_active:
            return None
        return obj
```

All reference data repositories extend `ReferenceRepository`. Service and API layers call `list_active()` and `get_active_by_id()` instead of adding manual `is_active` filters.

### Transaction Handling

Repositories call `flush()`, not `commit()`. The `get_db` request lifecycle dependency owns commit and rollback. No other layer calls `commit()` or `rollback()`.

| Layer | Allowed | Prohibited |
|---|---|---|
| Repository | `flush()` | `commit()`, `rollback()` |
| Service | neither | `commit()`, `rollback()` |
| Router | neither | `commit()`, `rollback()` |
| `get_db` dependency | `commit()` on success, `rollback()` on exception | — |

```python
# Correct — repository flushes
def create(self, obj: ModelType) -> ModelType:
    self.db.add(obj)
    self.db.flush()
    return obj

# Wrong — repository must never commit
def create(self, obj: ModelType) -> ModelType:
    self.db.add(obj)
    self.db.commit()  # NEVER
    return obj
```

### Query Standards

- Use `select()` statement API, not the legacy `Query` API.
- Use `db.scalars()` for ORM objects, `db.execute()` for raw rows.
- **Raw SQL string interpolation is prohibited.** Never use f-strings, `%`-formatting, or string concatenation to build SQL queries. SQLAlchemy's expression API (`.where()`, `.ilike()`, `==`, etc.) is always safe — it automatically parameterizes values via bind parameters. ORM expressions like `Account.name.ilike(f"%{query}%")` are safe because SQLAlchemy sends the interpolated string as a parameterized bind value, not as raw SQL.

---

## 7. Service Layer Standards

### Business Rule Placement

Every business rule from `Business-Rule-Implementation-Matrix.md` assigned to the Service Layer is implemented in exactly one service class. The matrix mapping is authoritative:

| Service | Rules |
|---|---|
| `OpportunityService` | BR-PL-04, BR-OP-00, BR-OP-01, BR-OP-02, BR-OP-03, BR-OP-05, BR-OP-06, BR-OP-08, BR-OP-09, BR-OP-10 |
| `ProjectService` | BR-PROJ-01 |
| `SplitService` | BR-FIN-01, BR-FIN-04, BR-FIN-05 |

### Service Constructor

Services receive repositories via constructor injection:

```python
class OpportunityService:
    def __init__(
        self,
        repository: OpportunityRepository,
        split_repository: SplitRepository,
        user_id: uuid.UUID,
    ):
        self.repository = repository
        self.split_repository = split_repository
        self.user_id = user_id
```

### Validation Responsibilities

| Layer | Validates |
|---|---|
| Pydantic schema | Data types, field lengths, format patterns, required fields |
| Service | Business rules, cross-entity consistency, state transitions, authorization context |
| Repository | Nothing — it trusts upstream validation |
| Database | Constraints, FKs, CHECKs, UNIQUE — last line of defense |

### Transaction Boundaries

One request = one database transaction, managed by the `get_db` dependency. The dependency commits on successful request completion and rolls back on any unhandled exception. Services and routers never call `commit()` or `rollback()`.

```python
def create_opportunity(self, data: OpportunityCreate) -> Opportunity:
    self._validate_stage_requirements(data)

    opportunity = Opportunity(**data.model_dump(), owner_id=self.user_id)
    opportunity.status_id = self._get_active_status_id()
    self.repository.create(opportunity)

    split = Split(
        opportunity_id=opportunity.id,
        user_id=self.user_id,
        split_percentage=Decimal("100.00"),
    )
    self.split_repository.create(split)

    return opportunity
```

Both the opportunity INSERT and split INSERT are flushed within the same session. The `get_db` dependency commits the entire transaction after the router returns successfully. If the service raises, the dependency rolls back both operations.

### Exception Handling

Services raise domain exceptions (defined in `core/exceptions.py`), never HTTP exceptions:

```python
# Correct
raise BusinessRuleViolation("Split percentages must sum to 100.00%")

# Wrong
raise HTTPException(status_code=400, detail="...")
```

The router or exception handler translates domain exceptions to HTTP responses.

### Logging Expectations

Services log business events at `INFO` level:

```python
logger.info(
    "opportunity_stage_changed",
    opportunity_id=str(opportunity.id),
    from_stage=old_stage,
    to_stage=new_stage,
    user_id=str(self.user_id),
)
```

Services log validation failures at `WARNING` level. Services never log at `DEBUG` in production code (use only during development).

---

## 8. API Standards

### Router Structure

One router file per API Catalog section. Each router declares its prefix and tags:

```python
router = APIRouter(prefix="/accounts", tags=["Accounts"])
```

### Endpoint Naming

Function names describe the action:

```python
@router.get("")
async def list_accounts(...): ...

@router.post("")
async def create_account(...): ...

@router.get("/{account_id}/360")
async def get_account_360(...): ...

@router.patch("/{account_id}")
async def update_account(...): ...
```

### URL Conventions

Per API Catalog v1.0:

| Pattern | Example |
|---|---|
| Base path | `/api/v1` |
| List/Search | `GET /accounts` |
| Create | `POST /accounts` |
| Read | `GET /accounts/{id}` |
| Update | `PATCH /accounts/{id}` |
| Nested list | `GET /accounts/{id}/stakeholders` |
| Nested create | `POST /accounts/{id}/stakeholders` |
| Bulk replace | `PUT /opportunities/{id}/items` |
| Master data | `GET /master-data/{entity_name}` |

- Use plural nouns for resources.
- Use kebab-case for multi-word URL segments: `master-data`, `lead-sources`, `hold-reasons`.
- Path parameters are UUIDs: `{account_id}`, `{opportunity_id}`.

### Standard Response Envelope

Per API Catalog:

```python
class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = ""
    data: T
```

Every endpoint returns this envelope:

```python
@router.get("/{account_id}")
async def get_account(account_id: uuid.UUID, ...) -> APIResponse[AccountResponse]:
    account = service.get_by_id(account_id)
    return APIResponse(data=AccountResponse.model_validate(account))
```

### Pagination Standards

Query parameters for all list endpoints:

```python
@router.get("")
async def list_accounts(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    ...
) -> APIResponse[PaginatedResponse[AccountResponse]]:
```

### Filtering Standards

Filters are declared as explicit query parameters, not generic dictionaries:

```python
@router.get("")
async def list_opportunities(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    stage_id: uuid.UUID | None = Query(default=None),
    status_id: uuid.UUID | None = Query(default=None),
    owner_id: uuid.UUID | None = Query(default=None),
    account_id: uuid.UUID | None = Query(default=None),
    ...
):
```

### Sorting Standards

Single sort parameter with field and direction:

```python
sort_by: str = Query(default="created_at"),
sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
```

---

## 9. Authentication Standards

### Supabase JWT Validation

```python
# app/core/security.py
from jose import jwt, JWTError
from app.core.config import settings

def decode_jwt(token: str) -> dict:
    return jwt.decode(
        token,
        settings.SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        audience="authenticated",
    )
```

### Current User Dependency

```python
from fastapi import Depends, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.domains.organization.models import UserProfile

async def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> UserProfile:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        raise AuthenticationError("Invalid authentication scheme")

    payload = decode_jwt(token)
    user_id = payload.get("sub")

    user = db.get(UserProfile, user_id)
    if not user or not user.is_active:
        raise AuthenticationError("User not found or inactive")
    return user
```

### User Context

The `UserProfile` object is the user context. It carries `id`, `sbu_id`, `zone_id`, `role_id`. Pass it to services:

```python
@router.post("")
async def create_opportunity(
    data: OpportunityCreate,
    service: OpportunityService = Depends(_get_service),
) -> APIResponse[OpportunityResponse]:
    result = service.create_opportunity(data)
    return APIResponse(data=OpportunityResponse.model_validate(result))
```

### RLS Context Propagation

The architecture is RLS First (AI Delivery Model Section 4). Authenticated user identity must reach PostgreSQL so that Row Level Security policies can evaluate the current user context. This is an infrastructure-level concern — repositories and services must remain completely unaware of RLS implementation details.

**Architectural requirements:**

1. After successful JWT authentication, the database session must carry the authenticated user's identity so that PostgreSQL RLS policies can evaluate it.
2. Context propagation must be implemented within the database/session infrastructure layer (`app/db/`), not in repositories or services.
3. RLS context setup must occur automatically during request processing — no manual setup calls in business logic.
4. Repository queries must return only the rows that RLS policies permit, without any repository-level filtering for security purposes.
5. The mechanism must be transparent: removing or disabling it should not require changes to any repository, service, or router code.

**Architecture flow:**

```
Client Request
    |
    v
JWT Validation (core/security.py)
    |
    v
User Profile Resolution (get_current_user)
    |
    v
Database Session Context Setup (db/session.py)
    |
    v
PostgreSQL RLS Policy Evaluation (automatic, per-query)
    |
    v
Repository Queries (return only permitted rows)
```

**Phase 2E** will define the exact technical mechanism for context propagation. Until then, the session infrastructure must be designed with an extension point where RLS context setup can be injected without modifying existing repository or service code.

---

## 10. Exception Standards

### Exception Hierarchy

```python
# app/core/exceptions.py

class AppError(Exception):
    """Base for all application errors."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)

class NotFoundError(AppError):
    """Entity not found."""
    pass

class BusinessRuleViolation(AppError):
    """Business rule constraint violated."""
    pass

class AuthenticationError(AppError):
    """JWT validation or user resolution failed."""
    pass

class AuthorizationError(AppError):
    """User lacks permission for the requested operation."""
    pass

class ConflictError(AppError):
    """Duplicate or conflicting state."""
    pass

class ValidationError(AppError):
    """Input validation beyond Pydantic schema checks."""
    pass
```

### HTTP Status Mapping

Register exception handlers in `main.py`:

| Exception | HTTP Status | Usage |
|---|---|---|
| `NotFoundError` | 404 | Entity lookup returned None |
| `BusinessRuleViolation` | 422 | BR-OP-01 stage gates, BR-FIN-01 split sum, etc. |
| `AuthenticationError` | 401 | Invalid/expired JWT, user not found |
| `AuthorizationError` | 403 | RLS violation, role restriction |
| `ConflictError` | 409 | Duplicate unique constraint, concurrent modification |
| `ValidationError` | 400 | Cross-field validation failures |
| Unhandled `Exception` | 500 | Unexpected errors — log full stack trace |

### Error Response Schema

```python
class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: str | None = None
```

```python
# app/main.py
@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(
        status_code=404,
        content=ErrorResponse(message=exc.message).model_dump(),
    )
```

---

## 11. Logging Standards

### Structured Logging

Use `structlog` with JSON output:

```python
# app/core/logging.py
import structlog

def setup_logging():
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.JSONRenderer(),
        ],
    )

logger = structlog.get_logger()
```

### Log Levels

| Level | Usage |
|---|---|
| `ERROR` | Unhandled exceptions, database connection failures, external service failures |
| `WARNING` | Business rule violations, authentication failures, validation errors |
| `INFO` | Business events — entity created, stage changed, split updated |

### Correlation IDs

Generate a request-scoped correlation ID via middleware:

```python
import uuid
from starlette.middleware.base import BaseHTTPMiddleware

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response
```

### Sensitive Data Rules

Never log:
- JWT tokens
- Passwords
- Full request/response bodies containing financial data
- Personal contact information (email, phone)

Always log:
- Entity IDs (UUIDs)
- User ID performing the action
- Operation name
- Correlation ID

---

## 12. Configuration Standards

### Environment Variables

```python
# app/core/config.py
from typing import Literal
from pydantic import SecretStr
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    APP_ENV: Literal["development", "staging", "production"] = "development"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: SecretStr
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: SecretStr
    SUPABASE_JWT_SECRET: SecretStr

    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

settings = Settings()
```

- `SecretStr` prevents secrets from appearing in logs, tracebacks, or `.model_dump()` output. Access the raw value with `.get_secret_value()` (e.g., `settings.DATABASE_URL.get_secret_value()`).
- `Literal` on `APP_ENV` and `LOG_LEVEL` provides startup-time validation — invalid values fail fast with a clear Pydantic error.

### Secrets Handling

- All secrets are environment variables, never hardcoded.
- `.env` is in `.gitignore`. Never committed.
- `.env.example` contains all keys with empty values. Always committed.
- In production, secrets come from the hosting platform's environment variable configuration.

### Settings Access

Always import the singleton:

```python
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
```

Never read `os.environ` directly outside of `config.py`.

### CORS Configuration

CORS is configured via environment variables and applied in `main.py`. No wildcard origins in production.

Add to `Settings`:

```python
CORS_ORIGINS: list[str] = ["http://localhost:5173"]
```

Apply in `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

- **Development `.env`:** `CORS_ORIGINS=["http://localhost:5173"]`
- **Production `.env`:** `CORS_ORIGINS=["https://cabio.example.com"]` (explicit allow-list only)
- Never use `allow_origins=["*"]` in production.

---

## 13. Testing Standards

### Framework

`pytest` with `pytest-asyncio` for async endpoints.

### Unit Tests

Test services in isolation with mocked repositories:

```python
# tests/domains/test_opportunity_service.py
def test_create_opportunity_auto_creates_split():
    mock_repo = MagicMock(spec=OpportunityRepository)
    mock_split_repo = MagicMock(spec=SplitRepository)
    user_id = uuid.uuid4()

    service = OpportunityService(
        repository=mock_repo,
        split_repository=mock_split_repo,
        user_id=user_id,
    )

    data = OpportunityCreate(...)
    service.create_opportunity(data)

    mock_split_repo.create.assert_called_once()
    split_arg = mock_split_repo.create.call_args[0][0]
    assert split_arg.split_percentage == Decimal("100.00")
    assert split_arg.user_id == user_id
```

### Repository Tests

Test against a real PostgreSQL database (test container or Supabase test project):

```python
# tests/conftest.py
@pytest.fixture
def db_session():
    engine = create_engine(settings.TEST_DATABASE_URL)
    with Session(engine) as session:
        yield session
        session.rollback()
```

### API Tests

Use FastAPI's `TestClient`:

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "healthy"
```

### Naming Conventions

- Test files: `test_{domain}_{layer}.py` — `test_opportunity_service.py`, `test_account_router.py`
- Test functions: `test_{action}_{expected_outcome}` — `test_create_opportunity_auto_creates_split`, `test_stage_transition_without_required_fields_raises`
- Fixtures: descriptive nouns — `db_session`, `sample_account`, `authenticated_client`

### Coverage Requirements

Use `pytest-cov` for coverage measurement. Configure in `pyproject.toml`:

```toml
[tool.pytest.ini_options]
addopts = "--cov=app --cov-report=term-missing"
```

**Quantitative standards:**

| Scope | Minimum Coverage | Notes |
|---|---|---|
| Overall project | 80% | Measured across all `app/` code |
| Service layer (`domains/*/service.py`) | 90% | Business logic is the highest-risk layer |
| Critical business rule services (`OpportunityService`, `SplitService`) | 100% of rule execution paths | Every branch of BR-OP-01 through BR-OP-10, BR-FIN-01, BR-FIN-04, BR-FIN-05 must be exercised |
| Repository layer (`domains/*/repository.py`) | Custom query methods covered | `BaseRepository` inherited methods do not require per-domain tests |
| API layer (`api/routers/*.py`) | Happy path + error path | Each endpoint must have at least one success test and one expected-error test |

CI must fail if overall coverage drops below 80%.

---

## 14. Code Quality Standards

### Type Hints

All function parameters and return types must be annotated. No `Any` unless interfacing with untyped third-party code.

```python
# Correct
def get_by_id(self, id: uuid.UUID) -> Account | None:

# Wrong
def get_by_id(self, id):
```

### Docstrings

Do not write docstrings on:
- Models (the column definitions are self-documenting)
- Schemas (the field definitions are self-documenting)
- Routers (the OpenAPI decorator is the documentation)
- Simple CRUD methods in repositories

Write a one-line docstring only when the WHY is non-obvious:

```python
def validate_stage_requirements(self, opportunity: Opportunity, target_stage_id: uuid.UUID):
    """All preceding stage requirements must be met, not just the target stage (BR-OP-00)."""
```

### Ruff

Ruff is the sole linter and formatter. Configuration in `pyproject.toml`:

```toml
[tool.ruff]
target-version = "py313"
line-length = 120

[tool.ruff.lint]
select = [
    "E",      # pycodestyle errors
    "W",      # pycodestyle warnings
    "F",      # pyflakes
    "I",      # isort
    "UP",     # pyupgrade
    "B",      # flake8-bugbear
    "SIM",    # flake8-simplify
    "RUF",    # ruff-specific
]

[tool.ruff.lint.isort]
known-first-party = ["app"]
```

### Formatting

Ruff formatter with the configuration above. No Black. No yapf. One formatter only.

### Import Ordering

Enforced by Ruff `I` rules:
1. Standard library
2. Third-party
3. First-party (`app.*`)

---

## 15. Example Implementations

### SQLAlchemy Model

```python
# app/domains/account/models.py
import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, UUID, Boolean, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, AuditMixin


class Account(AuditMixin, Base):
    __tablename__ = "account"
    __table_args__ = (
        CheckConstraint(
            "payer_behavior IN ('GOOD', 'AVERAGE', 'PROBLEMATIC', 'UNKNOWN')",
            name="ck_account_payer_behavior",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    parent_account_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("account.id"), nullable=True
    )
    managing_sbu_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sbu.id"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    payer_behavior: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    parent_account: Mapped["Account | None"] = relationship(
        remote_side="Account.id", lazy="joined"
    )
    stakeholders: Mapped[list["Stakeholder"]] = relationship(
        back_populates="account", lazy="selectin"
    )
    projects: Mapped[list["Project"]] = relationship(
        back_populates="account", lazy="selectin"
    )
    activities: Mapped[list["Activity"]] = relationship(
        back_populates="account", lazy="selectin"
    )
```

### Pydantic Schemas

```python
# app/domains/account/schemas.py
import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AccountCreate(BaseModel):
    name: str = Field(max_length=255)
    parent_account_id: uuid.UUID | None = None
    managing_sbu_id: uuid.UUID | None = None
    payer_behavior: str | None = Field(
        default=None, pattern="^(GOOD|AVERAGE|PROBLEMATIC|UNKNOWN)$"
    )


class AccountUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    parent_account_id: uuid.UUID | None = None
    managing_sbu_id: uuid.UUID | None = None
    payer_behavior: str | None = None


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    parent_account_id: uuid.UUID | None
    managing_sbu_id: uuid.UUID | None
    payer_behavior: str | None
    created_at: datetime
    updated_at: datetime


class AccountListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    payer_behavior: str | None
    managing_sbu_id: uuid.UUID | None
```

### Repository

```python
# app/domains/account/repository.py
import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.domains.account.models import Account
from app.db.base import BaseRepository


class AccountRepository(BaseRepository[Account]):
    def __init__(self, db: Session):
        super().__init__(Account, db)

    def search_by_name(self, query: str, offset: int = 0, limit: int = 50) -> tuple[list[Account], int]:
        from sqlalchemy import func as sqlfunc

        stmt = select(Account).where(Account.name.ilike(f"%{query}%"))
        total = self.db.scalar(
            select(sqlfunc.count()).select_from(stmt.subquery())
        )
        results = list(
            self.db.scalars(stmt.offset(offset).limit(limit)).all()
        )
        return results, total

    def get_with_stakeholders(self, account_id: uuid.UUID) -> Account | None:
        stmt = select(Account).where(Account.id == account_id)
        return self.db.scalar(stmt)
```

### Service

```python
# app/domains/account/service.py
import uuid
import structlog
from app.domains.account.models import Account
from app.domains.account.schemas import AccountCreate, AccountUpdate
from app.domains.account.repository import AccountRepository
from app.core.exceptions import NotFoundError

logger = structlog.get_logger()


class AccountService:
    def __init__(self, repository: AccountRepository, user_id: uuid.UUID):
        self.repository = repository
        self.user_id = user_id

    def create_account(self, data: AccountCreate) -> Account:
        account = Account(
            **data.model_dump(),
            created_by=self.user_id,
            updated_by=self.user_id,
        )
        self.repository.create(account)

        logger.info(
            "account_created",
            account_id=str(account.id),
            name=account.name,
            user_id=str(self.user_id),
        )
        return account

    def update_account(self, account_id: uuid.UUID, data: AccountUpdate) -> Account:
        account = self.repository.get_by_id(account_id)
        if not account:
            raise NotFoundError(f"Account {account_id} not found")

        update_fields = data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(account, field, value)
        account.updated_by = self.user_id

        self.repository.update(account)

        logger.info(
            "account_updated",
            account_id=str(account_id),
            fields=list(update_fields.keys()),
            user_id=str(self.user_id),
        )
        return account

    def get_account_360(self, account_id: uuid.UUID) -> Account:
        account = self.repository.get_with_stakeholders(account_id)
        if not account:
            raise NotFoundError(f"Account {account_id} not found")
        return account

    def list_accounts(
        self,
        search: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Account], int]:
        if search:
            return self.repository.search_by_name(search, offset, limit)
        return self.repository.list(offset, limit)
```

### Router

```python
# app/api/routers/accounts.py
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.domains.organization.models import UserProfile
from app.domains.account.repository import AccountRepository
from app.domains.account.service import AccountService
from app.domains.account.schemas import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    AccountListResponse,
)
from app.api.schemas import APIResponse, PaginatedResponse

router = APIRouter(prefix="/accounts", tags=["Accounts"])


def _get_service(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AccountService:
    return AccountService(
        repository=AccountRepository(db),
        user_id=current_user.id,
    )


@router.get("")
async def list_accounts(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    search: str | None = Query(default=None),
    service: AccountService = Depends(_get_service),
) -> APIResponse[PaginatedResponse[AccountListResponse]]:
    offset = (page - 1) * page_size
    accounts, total = service.list_accounts(search=search, offset=offset, limit=page_size)
    total_pages = (total + page_size - 1) // page_size

    return APIResponse(
        data=PaginatedResponse(
            items=[AccountListResponse.model_validate(a) for a in accounts],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.post("", status_code=201)
async def create_account(
    data: AccountCreate,
    service: AccountService = Depends(_get_service),
) -> APIResponse[AccountResponse]:
    account = service.create_account(data)
    return APIResponse(
        message="Account created",
        data=AccountResponse.model_validate(account),
    )


@router.get("/{account_id}/360")
async def get_account_360(
    account_id: uuid.UUID,
    service: AccountService = Depends(_get_service),
) -> APIResponse[AccountResponse]:
    account = service.get_account_360(account_id)
    return APIResponse(data=AccountResponse.model_validate(account))


@router.patch("/{account_id}")
async def update_account(
    account_id: uuid.UUID,
    data: AccountUpdate,
    service: AccountService = Depends(_get_service),
) -> APIResponse[AccountResponse]:
    account = service.update_account(account_id, data)
    return APIResponse(
        message="Account updated",
        data=AccountResponse.model_validate(account),
    )
```

---

## Change Log

| # | Section Updated | Change Made | Reason |
|---|---|---|---|
| 1 | 6 (Repository — Transaction Handling), 7 (Service — Transaction Boundaries), 9 (Auth — User Context), 15 (Router Example) | Removed all `db.commit()` calls from router examples. Standardized transaction model: only `get_db` dependency commits/rolls back. Added explicit layer responsibility table. | Contradiction between Section 7 prose (services don't commit) and router examples (routers called `db.commit()`). |
| 2 | 4 (SQLAlchemy — new Alembic Baseline Strategy subsection) | Added guidance for baseline migration workflow on existing Supabase environments vs. fresh local environments. Documented that an empty baseline migration is expected. | Phase 2A schema already deployed; developers need clarity on how to bootstrap Alembic against an existing database. |
| 3 | 5 (Pydantic — Create Schemas, Update Schemas), 15 (Pydantic Schema Example) | Removed `model_config = ConfigDict(from_attributes=True)` from Create and Update schemas. Retained only on Response schemas. | `from_attributes=True` is for ORM-to-Pydantic hydration. Create and Update schemas are populated from request JSON, not ORM objects. |
| 4 | 4 (SQLAlchemy — Soft Delete Policy), 6 (Repository — new Reference Repository subsection) | Added `ReferenceRepository` with `list_active()` and `get_active_by_id()` methods. Updated Soft Delete Policy to reference it. | Active filtering was left to manual `.where()` calls scattered across the codebase. Encapsulating it in the repository prevents omission. |
| 5 | 12 (Configuration — new CORS Configuration subsection) | Added CORS standard with environment-driven origins, explicit allow-list requirement, and `CORSMiddleware` example. | CORS configuration was undefined. Production must not use wildcard origins. |
| 6 | 12 (Configuration — Environment Variables) | Changed `DATABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET` to `SecretStr`. Added `Literal` validation for `APP_ENV` and `LOG_LEVEL`. Added `CORS_ORIGINS` field. | Secrets were typed as plain `str`, risking exposure in logs and tracebacks. Environment values lacked startup-time validation. |
| 7 | 6 (Repository — Query Standards) | Clarified that raw SQL string interpolation is prohibited but SQLAlchemy expression API (`.where()`, `.ilike()`, `==`) is safe and acceptable. | Original wording ("Never use f-strings in SQL") could be misread as prohibiting SQLAlchemy ORM expressions that use Python f-strings for bind values. |
| 8 | 3 (Naming Conventions — new Schema Authority subsection) | Added explicit statement that `Physical-Schema.sql` is authoritative for all database object names. Conflicts resolve in favor of the schema file. | Naming conventions in this document could be interpreted as overriding approved schema definitions. |
| 9 | 12 (Configuration — Secrets Handling) | Changed "secrets come from the hosting platform's environment (Vercel, Railway, etc.)" to platform-neutral wording. | Document should not assume a specific deployment target. |
| 10 | 9 (Authentication — new RLS Context Propagation subsection) | Added architectural requirements for propagating authenticated user identity to PostgreSQL for RLS evaluation. Defined architecture flow. Deferred technical mechanism to Phase 2E. | Document declared "RLS First" but did not define how user identity reaches PostgreSQL. Repositories and services must remain RLS-unaware. |
| 11 | 13 (Testing — new Coverage Requirements subsection) | Added quantitative coverage standards: 80% overall, 90% service layer, 100% critical business rule paths. Specified `pytest-cov` as the tool with CI enforcement. | No objective coverage criteria existed for code review or CI governance. |
