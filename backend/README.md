# Cabio Sales OS — Backend

FastAPI + SQLAlchemy + PostgreSQL (Supabase). Python 3.13.

---

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -e ".[dev]"
```

Copy `.env.example` to `.env` and fill in your Supabase credentials.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase direct connection) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret for token validation |
| `APP_ENV` | `development`, `staging`, or `production` |
| `CORS_ORIGINS` | JSON array of allowed origins, e.g. `["http://localhost:5173"]` |
| `LOG_LEVEL` | `DEBUG`, `INFO`, `WARNING`, or `ERROR` |

Secrets (`DATABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY`) are typed
`SecretStr` — access with `.get_secret_value()`. Never read `os.environ` directly
outside `core/config.py`.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/api/v1/docs`

## Test

```bash
pytest
```

## Lint

```bash
ruff check .
ruff format .
```

---

## Domain Map

Each domain owns its models, schemas, repository, service, and router. Cross-domain
imports are limited to models and schemas — never repositories or services.

| Domain | Entities | Router |
|---|---|---|
| `reference` | Zone, SBU, OpportunityStage, OpportunityStatus, LeadSource, LossReason, HoldReason, ProjectStatus | `api/routers/master_data.py` |
| `organization` | UserProfile, Role | `api/routers/auth.py` |
| `account` | Account, Stakeholder | `account/router.py`, `account/stakeholder_router.py` |
| `opportunity` | Opportunity, OpportunityStakeholder, Split, OpportunityItem | `opportunity/router.py` |
| `project` | Project | `project/router.py` |
| `product` | Product | `product/router.py` |
| `asset` | InstalledAsset | `asset/router.py` |
| `activity` | Activity, Reminder | *(router pending)* |
| `document` | Document | *(router pending)* |
| `planning` | TargetPlan, CoveragePlan, CoveragePlanEntry | *(router pending)* |

## Directory Structure

```
backend/
  app/
    api/
      routers/          ← health, auth, master_data (reference/org endpoints)
      dependencies.py   ← get_current_user FastAPI dependency
      schemas.py        ← APIResponse, PaginatedResponse envelopes
    core/
      config.py         ← Settings (pydantic-settings, SecretStr for secrets)
      exceptions.py     ← Domain exception hierarchy
      security.py       ← JWT decode
      logging.py        ← Logging setup
    db/
      base.py           ← Base, AuditMixin, CreatedAtMixin, BaseRepository, ReferenceRepository
      session.py        ← engine, SessionLocal, get_db, warm_pool
      registry.py       ← imports all models so Alembic metadata is complete
    domains/
      {domain}/
        models.py
        schemas.py
        repository.py
        service.py
        router.py
    middleware/
      correlation_id.py
    main.py
  alembic/
    versions/
    env.py
  tests/
  pyproject.toml
  .env.example
```

---

## Layered Architecture

```
Router  →  validates input, calls service, returns APIResponse
Service →  enforces business rules, calls repository, raises domain exceptions
Repository →  executes queries, returns ORM objects or scalars, calls flush()
Database →  constraints, FKs, CHECK, UNIQUE — last line of defense
```

- Repositories never raise HTTP exceptions, never call `commit()`, never import Pydantic schemas.
- Services never call `commit()`, never raise `HTTPException`.
- Routers never write SQL.
- Only `get_db` (in `session.py`) calls `commit()` and `rollback()`.

---

## ORM Standards

### Base classes (`db/base.py`)

- **`AuditMixin`** — `created_at`, `updated_at`, `created_by`, `updated_by`. Applied to all transactional models.
- **`CreatedAtMixin`** — `created_at`, `created_by` only. Used by `Activity` (immutable per BR-ACT-01).
- Reference/master models (Zone, SBU, etc.) use neither mixin.

### UUID primary keys

```python
id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

Every table. No auto-increment integers.

### Relationships

```python
# Many-to-one scalar — always lazy="joined"
account: Mapped["Account"] = relationship(back_populates="stakeholders", lazy="joined")

# One-to-many collection — always lazy="select"
stakeholders: Mapped[list["Stakeholder"]] = relationship(back_populates="account", lazy="select")
```

**Rule:** Model-level collection relationships default to `lazy="select"`. Use explicit
`selectinload()` in repository queries that genuinely need the collections. Never use
`lazy="selectin"` on models — it fires automatically when the parent lands in the
SQLAlchemy session regardless of whether the attribute is accessed, causing cascade
queries across the entire object graph.

Always define both sides with `back_populates`. Never use `backref`.

### Constraints

Name all constraints explicitly:

```python
__table_args__ = (
    UniqueConstraint("user_id", "sbu_id", "planning_period", name="target_plan_unique"),
    CheckConstraint("win_probability >= 0 AND win_probability <= 100", name="ck_opportunity_win_probability"),
    Index("idx_account_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}),
)
```

Naming pattern: `{type}_{table}_{description}` — e.g. `ck_opportunity_win_probability`, `idx_account_name_trgm`.

### Soft delete

Reference entities have `is_active: bool`. Never issue `DELETE` on reference tables.
Use `ReferenceRepository` which encapsulates active filtering in `list_active()` and
`get_active_by_id()` — service and router layers must never add manual `.where(is_active == True)`.

Transactional entities use terminal statuses (Won/Lost/Closed) instead of deletion.

### Enum handling

Use Python `str, enum.Enum` for application-level validation. Store as `VARCHAR` in the
database. Do not use PostgreSQL `ENUM` types. Validation lives in the Pydantic schema
layer, not the ORM layer.

---

## Repository Standards

### Base classes

`BaseRepository[T]` in `db/base.py` provides `get_by_id`, `list`, `create`, `update`, `delete`.
`ReferenceRepository[T]` extends it with `list_active()` and `get_active_by_id()`.

Only create a named subclass when adding domain-specific query methods:

```python
# Good — no behaviour to add, use base directly
repo = BaseRepository(Zone, db)

# Good — adds domain queries
class AccountRepository(BaseRepository[Account]):
    def list_accounts(self, *, offset, limit, search, zone_id): ...
```

### Loading strategy

**List queries** — suppress unused collections with `noload()`:

```python
stmt = select(Account).options(
    noload(Account.stakeholders),
    noload(Account.projects),
    noload(Account.opportunities),
    # ... all collections on Account
)
```

**Detail / workspace queries** — use explicit `selectinload()` for collections needed:

```python
stmt = select(Account).where(Account.id == account_id).options(
    selectinload(Account.stakeholders),
    selectinload(Account.projects),
    noload(Account.activities),
    noload(Account.documents),
)
```

### Count queries

```python
# Preferred — direct count on the table with filters
total = self.db.scalar(select(func.count(Product.id)).where(*filters))

# Use subquery wrapping when counting a filtered select
total = self.db.scalar(select(func.count()).select_from(stmt.subquery()))
```

### Aggregate counts for list screens

When a list screen needs counts across related entities (e.g., project count per account),
run one `GROUP BY` query per entity rather than correlated subqueries or selectin loading.
Serve via a dedicated endpoint and fire it from the frontend after the list renders:

```python
# In repository — one query per entity type
pr_map = {
    r.account_id: r.cnt
    for r in self.db.execute(
        select(Project.account_id, func.count().label("cnt"))
        .where(Project.account_id.in_(account_ids))
        .group_by(Project.account_id)
    ).all()
}
```

### Transaction handling

| Layer | Allowed | Prohibited |
|---|---|---|
| Repository | `flush()` | `commit()`, `rollback()` |
| Service | — | `commit()`, `rollback()` |
| Router | — | `commit()`, `rollback()` |
| `get_db` | `commit()` on success, `rollback()` on exception | — |

### Query API

Use the `select()` statement API — not the legacy `db.query()` API.
Use `db.scalars()` for ORM objects, `db.execute()` for raw rows/tuples.
Never interpolate user input into SQL strings — use SQLAlchemy's expression API.

---

## Schema Standards

### Three schema types per entity

| Schema | `from_attributes` | Purpose |
|---|---|---|
| `{Entity}Create` | No | POST body — required fields, no id or audit fields |
| `{Entity}Update` | No | PUT/PATCH body — all fields optional |
| `{Entity}Response` | Yes | API response — hydrated from ORM via `model_validate()` |
| `{Entity}ListResponse` | Yes | Leaner response for list endpoints |

`ConfigDict(from_attributes=True)` belongs only on Response schemas.
Create and Update schemas receive JSON, not ORM objects.

### Pagination

All list endpoints:

```python
page: int = Query(default=1, ge=1)
page_size: int = Query(default=50, ge=1, le=100)
```

**`page_size` cap is `le=100`.** Never raise this limit — frontend dropdowns silently
fail with a 422 if they pass a higher value.

### Field naming

Snake_case everywhere. No aliasing. No camelCase. The API contract is snake_case.

---

## Service Standards

### Exception types (`core/exceptions.py`)

Services raise domain exceptions; routers translate them to HTTP:

| Exception | HTTP | When |
|---|---|---|
| `NotFoundError` | 404 | Entity lookup returned `None` |
| `ConflictError` | 409 | Duplicate name, unique constraint |
| `ValidationError` | 400 | Cross-field validation failure |
| `BusinessRuleViolation` | 422 | Stage gate, split sum, state transition |
| `AuthenticationError` | 401 | Invalid JWT, inactive user |
| `AuthorizationError` | 403 | Permission denied |

Never raise `HTTPException` from a service.

### Business rule ownership

The authoritative mapping of business rules to services is in
`docs/Business-Rule-Implementation-Matrix.md`. Check the matrix before implementing a rule.

---

## Router Standards

### Response envelope

Every endpoint returns `APIResponse[T]` from `api/schemas.py`:

```python
return APIResponse(data=AccountResponse.model_validate(account))
```

### Dependency injection

```python
def _get_service(db: Session = Depends(get_db)) -> AccountService:
    return AccountService(repository=AccountRepository(db))

@router.get("")
async def list_accounts(service: AccountService = Depends(_get_service)) -> ...:
```

### URL conventions

| Action | Method + Path |
|---|---|
| List | `GET /accounts` |
| Create | `POST /accounts` |
| Read | `GET /accounts/{account_id}` |
| Update | `PUT /accounts/{account_id}` |
| Nested list | `GET /accounts/{account_id}/stakeholders` |
| Batch read | `GET /accounts/counts?ids=...` |

Declare fixed-path routes (e.g. `/counts`) before parameterised routes
(`/{account_id}`) to avoid route collisions.

Plural nouns. UUID path params. kebab-case multi-word segments (`master-data`).

---

## Migrations

```bash
# After changing a model
alembic revision --autogenerate -m "short_description"

# Review the generated file in alembic/versions/ before applying
alembic upgrade head
```

Never modify existing migrations. Never run `alembic downgrade` in production.

Fresh local environment: `alembic upgrade head` builds the schema from scratch.
Existing Supabase environment already at a known state: `alembic stamp head`
marks it current without running SQL.

---

## Adding a New Domain

1. Create `app/domains/{domain}/` with `models.py`, `schemas.py`, `repository.py`, `service.py`, `router.py`.
2. Import all new models in `app/db/registry.py` so Alembic picks them up.
3. Register the router in `app/main.py`.
4. Run `alembic revision --autogenerate -m "{domain}_tables"` and review the output before applying.
5. Collection relationships on the new model use `lazy="select"`.
   Add `noload()` in list repository queries. Add explicit `selectinload()` in detail queries that need collections.
