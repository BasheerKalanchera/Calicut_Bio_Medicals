# Phase 2E Security Architecture

**Based on:** PH2E-SEC-01 RLS Execution Model Architecture Analysis
**Status:** Approved

---

## Purpose

This document defines the approved security architecture for implementing PostgreSQL Row Level Security (RLS) in Cabio Sales OS. It specifies how authenticated user context flows from FastAPI through SQLAlchemy to PostgreSQL, and how RLS policies enforce data access scoping.

This is the implementation reference for Phase 2E. All decisions documented here are final and approved.

---

## Scope

**In Scope:**

- PostgreSQL RLS strategy
- Database role strategy
- Session context propagation
- RLS helper functions
- RLS testing strategy

**Out of Scope:**

- Business authorization rules (Phase 2C — service layer)
- RBAC implementation details
- API endpoint security
- JWT validation implementation (Phase 2B.3 — complete)

**References:**

- ADR.md
- Backend-Implementation-Standards.md (Section 9 — RLS Context Propagation)
- Phase 2B.3 Authentication Foundation (approved)
- PH2E-SEC-01 Architecture Analysis (approved)

---

## Approved Decisions

| Decision Area | Approved Approach |
|---|---|
| Database Role | Dedicated application role (`cabio_app`) |
| Authorization Model | Hybrid — service layer + PostgreSQL RLS |
| Session Context | `SET LOCAL app.*` variables |
| Role Switching | None — single role, session variables for identity |
| User Context Function | `cabio_app_uid()` (custom, in `public` schema) |
| Testing Strategy | Integration tests with real RLS enforcement |

---

## Target Security Architecture

```
Client Request
    │
    ▼
FastAPI Authentication
    │  JWT validation → user ID extraction
    ▼
UserProfile Resolution
    │  db.get(UserProfile, user_id) → is_active check
    ▼
RLS Context Setup (db/session.py)
    │  SET LOCAL app.current_user_id = '<uuid>'
    │  SET LOCAL app.current_sbu_id  = '<uuid>'
    │  SET LOCAL app.current_role_id = '<uuid>'
    ▼
Service Layer
    │  Business rules, state transitions, workflow validation
    ▼
Repository Layer
    │  Standard SQLAlchemy queries — no security filtering
    ▼
PostgreSQL RLS (cabio_app role)
    │  Policies evaluate cabio_app_uid() / cabio_app_sbu_id()
    │  Rows filtered automatically
    ▼
Data Access
```

**Layer responsibilities:**

- **FastAPI Authentication** — validates JWT, resolves identity. Rejects unauthenticated requests with 401.
- **RLS Context Setup** — propagates user identity into PostgreSQL session variables. Transparent to all layers above and below.
- **Service Layer** — enforces business authorization ("can this user perform this action?"). Raises domain exceptions.
- **Repository Layer** — executes queries without security awareness. RLS is invisible.
- **PostgreSQL RLS** — enforces data scoping ("which rows can this user see?"). Unforgeable from the application layer.

---

## Database Role Strategy

The application connects as `cabio_app`, a dedicated non-superuser PostgreSQL role.

**Why not `postgres`:** PostgreSQL superusers bypass all RLS policies unconditionally. No policy enforcement is possible regardless of how policies are written.

**Why not `authenticated`:** This role is managed by Supabase for PostgREST. Its grants may change during platform upgrades. Using it couples the backend to Supabase internals not designed for direct connection pools.

**Why `cabio_app`:** Least privilege. RLS applies automatically to non-superuser, non-owner roles. Grants are scoped to exactly what the application needs. No conflict with Supabase's internal role management.

Setup:

```sql
CREATE ROLE cabio_app WITH LOGIN PASSWORD '...' NOINHERIT;
GRANT USAGE ON SCHEMA public TO cabio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cabio_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cabio_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cabio_app;
```

Deployment: change `DATABASE_URL` from `postgres:password@host` to `cabio_app:password@host`. No application code changes required.

---

## Session Context Propagation

Three session variables carry user identity into PostgreSQL:

| Variable | Source | Used By |
|---|---|---|
| `app.current_user_id` | `UserProfile.id` | Owner-scoped policies |
| `app.current_sbu_id` | `UserProfile.sbu_id` | SBU isolation policies |
| `app.current_role_id` | `UserProfile.role_id` | Role-based visibility policies |

**Phase 2E implementation in `db/session.py`:**

```python
def set_rls_context(db: Session, user: UserProfile) -> None:
    db.execute(text("SET LOCAL app.current_user_id = :uid"), {"uid": str(user.id)})
    db.execute(text("SET LOCAL app.current_sbu_id = :sid"), {"sid": str(user.sbu_id)})
    db.execute(text("SET LOCAL app.current_role_id = :rid"), {"rid": str(user.role_id)})
```

**Signature change required:** Current `(db, user_id: UUID)` becomes `(db, user: UserProfile)`. One-line change in `get_current_user()` call site.

**Connection pool safety:** `SET LOCAL` is transaction-scoped. Values are automatically cleared on commit or rollback. The existing `get_db()` dependency manages this lifecycle. No cleanup code needed. No cross-request leakage.

---

## RLS Helper Functions

Custom functions replace Supabase's `auth.uid()` for direct PostgreSQL connections.

```sql
CREATE OR REPLACE FUNCTION public.cabio_app_uid()
RETURNS uuid LANGUAGE sql STABLE
AS $$ SELECT current_setting('app.current_user_id', true)::uuid $$;

CREATE OR REPLACE FUNCTION public.cabio_app_sbu_id()
RETURNS uuid LANGUAGE sql STABLE
AS $$ SELECT current_setting('app.current_sbu_id', true)::uuid $$;

CREATE OR REPLACE FUNCTION public.cabio_app_role_id()
RETURNS uuid LANGUAGE sql STABLE
AS $$ SELECT current_setting('app.current_role_id', true)::uuid $$;
```

The `true` parameter returns `NULL` instead of raising an error when the variable is unset — required for migrations, admin queries, and test setup that run without a user context.

**Why custom functions instead of `auth.uid()`:** The `auth` schema is owned by Supabase. Overriding its functions risks conflict with platform updates. Custom functions in `public` schema are fully controlled by the project.

**Policy usage:**

```sql
CREATE POLICY opportunity_owner_isolation ON opportunity
    USING (owner_id = cabio_app_uid());

CREATE POLICY opportunity_sbu_isolation ON opportunity
    USING (account_id IN (
        SELECT id FROM account WHERE managing_sbu_id = cabio_app_sbu_id()
    ));
```

---

## Authorization Model

### Service Layer Responsibilities

- Business rules (BR-OP-01 through BR-FIN-05)
- State transition validation (stage gates, status changes)
- Cross-entity consistency (split sum = 100%)
- Ownership verification for mutations
- Role-based action authorization

### RLS Responsibilities

- Row visibility scoping (SBU isolation)
- Owner-scoped data access (user sees own opportunities)
- Manager visibility (SBU-wide access for managers)
- Admin override (full access for admin role)
- Read/write scoping per entity

The two layers are complementary. Services answer "can this user do this?" RLS answers "which rows can this user see?" Neither replaces the other.

---

## Testing Strategy

**Unit tests (service layer):** Mock repositories. RLS is invisible to services. Test business authorization logic only.

**Integration tests (repository + RLS):** Use a real PostgreSQL instance with RLS policies applied. Per test, call `SET LOCAL` to impersonate a specific user, run queries, assert only permitted rows are returned.

| Test Case | Context | Expected |
|---|---|---|
| SBU isolation | User in Imaging SBU | Only Imaging opportunities returned |
| Owner scoping | Sales Executive A | Only A's opportunities returned |
| Manager visibility | Sales Manager | All opportunities in their SBU |
| Cross-SBU block | User in Imaging | Cannot access Critical Care opportunity |
| Admin override | Admin role | All opportunities across SBUs |

**CI/CD:** PostgreSQL test container per CI run. Alembic applies all migrations including role and policies. CI fails if any RLS test fails.

**Local development:** Developers connect as `cabio_app` (same as staging/production). A separate `postgres` connection is available for migrations and debugging.

---

## Phase 2E Implementation Checklist

- [ ] Create `cabio_app` PostgreSQL role with appropriate grants
- [ ] Create `cabio_app_uid()`, `cabio_app_sbu_id()`, `cabio_app_role_id()` functions
- [ ] Update `set_rls_context()` signature to accept `UserProfile`
- [ ] Implement `SET LOCAL` statements in `set_rls_context()`
- [ ] Update `get_current_user()` call site
- [ ] Enable RLS on transactional tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Create RLS policies for each entity per security classification (EDM Section 8)
- [ ] Update `DATABASE_URL` to use `cabio_app` role
- [ ] Add Alembic migration for role, grants, functions, and policies
- [ ] Add integration test suite with `SET LOCAL` impersonation
- [ ] Validate connection pool behavior under concurrent requests
- [ ] Update `.env.example` with `cabio_app` connection string

---

## Deferred Decisions

| Item | Reason |
|---|---|
| Specific RLS policies per entity | Requires business authorization rules to be finalized (Phase 2C) |
| Zone-based policy scoping | Zone is informational in Phase 1 (EDM assumption #5); may be added later |
| `app.current_zone_id` variable | Deferred until zone-based policies are needed |
| Cross-SBU split approval policies | Depends on UNR-01 resolution (Phase 2C) |

---

## References

- ADR.md — ADR-009 (Strategic Isolation), ADR-028 (Stage/Status Decoupling)
- Business-Rules.md — BR enforcement layer assignments
- Backend-Implementation-Standards.md — Section 9 (RLS Context Propagation)
- PH2E-SEC-01 Architecture Analysis — Full option evaluation and rationale
