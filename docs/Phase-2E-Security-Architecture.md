# Phase 2E Security Architecture

**Based on:** PH2E-SEC-01 RLS Execution Model Architecture Analysis
**Status:** Implemented — live on dev since 2026-07-27, committed `7d7155d` (2026-07-30)

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
    │  SET LOCAL app.current_zone_id = '<uuid>'  (conditional — only if user has a zone)
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

**Deployment (as actually built, Task 9, 2026-07-27):** not the single-URL swap
originally anticipated here. `alembic/env.py` and `app/db/session.py` both read
the same `settings.DATABASE_URL` — swapping it wholesale would have made every
future `alembic upgrade` run as `cabio_app`, which has no `CREATE`/`ALTER`
grants, breaking migrations permanently. The connection is split instead:
`ADMIN_DATABASE_URL` (table-owner/`postgres` connection) is a new required
config field used exclusively by `alembic/env.py` for DDL; `DATABASE_URL`
itself is repointed to `cabio_app` for the application runtime. See
`Backend-Implementation-Standards.md` for the current config shape.

---

## Session Context Propagation

Four session variables carry user identity into PostgreSQL:

| Variable | Source | Used By |
|---|---|---|
| `app.current_user_id` | `UserProfile.id` | Owner-scoped policies |
| `app.current_sbu_id` | `UserProfile.sbu_id` | SBU isolation policies |
| `app.current_role_id` | `UserProfile.role_id` | Role-based visibility policies |
| `app.current_zone_id` | `UserProfile.zone_id` | Area Manager zone scoping — set conditionally, only when the user has a zone (Admin/GM/SBU Manager/Sales Manager/Sales Staff don't) |

**As implemented in `db/session.py`:**

```python
def set_rls_context(db: Session, user: UserProfile) -> None:
    db.execute(text("SET LOCAL app.current_user_id = :uid"), {"uid": str(user.id)})
    db.execute(text("SET LOCAL app.current_sbu_id = :sid"), {"sid": str(user.sbu_id)})
    db.execute(text("SET LOCAL app.current_role_id = :rid"), {"rid": str(user.role_id)})
    if user.zone_id is not None:
        db.execute(text("SET LOCAL app.current_zone_id = :zid"), {"zid": str(user.zone_id)})
```

Signature is `(db, user: UserProfile)`, called from `get_current_user()`.

**Connection pool safety:** `SET LOCAL` is transaction-scoped. Values are automatically cleared on commit or rollback. The existing `get_db()` dependency manages this lifecycle. No cleanup code needed. No cross-request leakage.

---

## RLS Helper Functions

Custom functions replace Supabase's `auth.uid()` for direct PostgreSQL connections.

**Identity functions (`0009_cabio_app_rls_helper_functions.py`)** — one per session
variable:

```sql
CREATE OR REPLACE FUNCTION public.cabio_app_uid()
RETURNS uuid LANGUAGE sql STABLE
AS $$ SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION public.cabio_app_sbu_id()
RETURNS uuid LANGUAGE sql STABLE
AS $$ SELECT NULLIF(current_setting('app.current_sbu_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION public.cabio_app_role_id()
RETURNS uuid LANGUAGE sql STABLE
AS $$ SELECT NULLIF(current_setting('app.current_role_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION public.cabio_app_zone_id()
RETURNS uuid LANGUAGE sql STABLE
AS $$ SELECT NULLIF(current_setting('app.current_zone_id', true), '')::uuid $$;
```

The `NULLIF(..., '')` wrap is load-bearing, not defensive style: `true` on
`current_setting` returns `NULL` only the *first* time a session variable is
unset. On a pooled connection, once a `SET LOCAL` on a custom GUC has
committed at least once, Postgres resets it to `''` (empty string) on
subsequent reuse, not back to a state where `current_setting(..., true)`
returns `NULL`. A bare `::uuid` cast crashes on that empty string — this bit
`cabio_app_zone_id()` specifically (a no-zone user reusing a connection
previously used by a zoned user) and was found and fixed during Task 4's
build, before it could reach Tasks 5-7.

**Role-name function (`0010_rls_opportunity_children.py`)** — tier-visibility
policies branch on role name, not role UUID:

```sql
CREATE OR REPLACE FUNCTION public.cabio_app_role_name()
RETURNS text LANGUAGE sql STABLE
AS $$ SELECT role_name FROM role WHERE id = cabio_app_role_id() $$;
```

**Participant carve-out functions (`0011_rls_activity_document_reminder.py`)**
— `SECURITY DEFINER`, owned by the migration's own role (table owner, exempt
from RLS), so they can query `split`/`reminder`+`activity` directly without
re-entering `opportunity`'s own (still-being-evaluated) policy. Without this,
"can user X see opportunity O" would require re-evaluating "can user X see
opportunity O" as a sub-step of its own answer — a circular RLS dependency
with no base case:

```sql
CREATE OR REPLACE FUNCTION public.cabio_app_has_split(p_opportunity_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM split
        WHERE opportunity_id = p_opportunity_id
          AND user_id = cabio_app_uid()
    )
$$;

CREATE OR REPLACE FUNCTION public.cabio_app_assigned_reminder(p_opportunity_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM reminder r
        JOIN activity a ON a.id = r.activity_id
        WHERE a.opportunity_id = p_opportunity_id
          AND r.assigned_to_user_id = cabio_app_uid()
    )
$$;
```

**Why custom functions instead of `auth.uid()`:** The `auth` schema is owned by Supabase. Overriding its functions risks conflict with platform updates. Custom functions in `public` schema are fully controlled by the project.

**Policy usage — the actual `opportunity` policy** (`0010`, widened by `0011`
to add the two participant carve-outs; no `FOR` clause, so it governs
`SELECT`/`INSERT`/`UPDATE`/`DELETE` alike):

```sql
CREATE POLICY opportunity_tier_visibility ON opportunity
USING (
    cabio_app_role_name() IN ('Admin', 'General Manager')
    OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
    OR (
        cabio_app_role_name() = 'Area Manager'
        AND sbu_id = cabio_app_sbu_id()
        AND account_id IN (SELECT id FROM account WHERE zone_id = cabio_app_zone_id())
    )
    OR (
        cabio_app_role_name() = 'Sales Manager'
        AND owner_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
    )
    OR owner_id = cabio_app_uid()
    OR cabio_app_has_split(id)
    OR cabio_app_assigned_reminder(id)
);
```

`split`, `opportunity_item`, `opportunity_stakeholder`, `activity`, and
`document` (when `opportunity_id IS NOT NULL`) join back to this same policy
rather than duplicating the tier logic (`{table}_via_opportunity` policies,
`0010`/`0011`). `reminder` joins back one hop further, through `activity`.
`product` (`0012`) is a flat SBU check, no tier branching, since it has no
`owner_id`/`zone_id`/`manager_id` to branch on.

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
- Manager visibility — SBU-wide for SBU Manager, SBU+zone for Area Manager
  (via `account.zone_id`), direct-reports-only for Sales Manager (via
  `user_profile.manager_id`)
- Admin/General Manager override (full access, unrestricted)
- Participant carve-outs — split participant (`cabio_app_has_split()`) and
  assigned-reminder holder (`cabio_app_assigned_reminder()`) see a deal
  they're personally tied to regardless of tier, permanently (not
  conditioned on split-percentage or reminder completion)
- Read/write scoping per entity

The two layers are complementary. Services answer "can this user do this?" RLS answers "which rows can this user see?" Neither replaces the other.

---

## Testing Strategy

**Unit tests (service layer):** Mock repositories. RLS is invisible to services. Test business authorization logic only. This part happened as planned — the backend's pytest suite (365 tests as of 2026-07-30) never exercises RLS directly.

**As actually verified (not the automated integration suite originally
planned below — see note):**
- **Task 8 (2026-07-27):** a script-driven check against a real `cabio_app`
  connection (tenant-qualified username through the Supavisor pooler),
  independently computing expected visibility for all 6 tiers × every
  RLS-protected table — 56/56 checks passed.
- **Task 9 (2026-07-30):** an automated read-path retest re-ran Task 8's
  exact matrix through `SessionLocal` + `set_rls_context()` — the real
  production call path, pooled connections — confirming parity. The
  write-path (`INSERT`/`UPDATE`, gated by the same `USING` clause since no
  policy here has a separate `WITH CHECK`) was retested manually by Basheer:
  5 baseline checks + 4 targeted edge cases + 1 expected-to-fail check,
  across all 6 tiers, all passing. Two real regressions were found this way
  and fixed (Pipeline cache invalidation, a `/users` picker-scope
  collision) — see `docs/Progress-Archive-2026-07.md`'s Task 9 write-up.

**Automated integration test suite with `SET LOCAL` impersonation — designed,
never completed.** A `TestClient`-based transactional suite (SQLAlchemy
`join_transaction_mode="create_savepoint"`, every real code path runs but
nothing survives a forced rollback) was planned and partially scaffolded,
then paused on an open question (where to read each test account's real
password from) and superseded once Basheer's manual retest covered the same
ground. Revisit if the manual-retest division of labor stops scaling.

**CI/CD:** no RLS-specific CI step exists. The backend pytest suite (mocked
repositories, no real Postgres) runs in CI; RLS itself has only ever been
verified against the live shared dev DB, per the two bullets above — not
reproducible from a clean CI container today.

**Local development:** the app connects as `cabio_app` (`backend/.env`'s
`DATABASE_URL`, since Task 9). `alembic upgrade` and other DDL work use a
separate `ADMIN_DATABASE_URL` (table-owner connection) — see
`Backend-Implementation-Standards.md`.

---

## Phase 2E Implementation Checklist

**Status: complete, committed `7d7155d` (2026-07-30), except where noted.**

- [x] Create `cabio_app` PostgreSQL role with appropriate grants (`0008`)
- [x] Create `cabio_app_uid()`, `cabio_app_sbu_id()`, `cabio_app_role_id()`
      functions, plus `cabio_app_zone_id()`, `cabio_app_role_name()`,
      `cabio_app_has_split()`, `cabio_app_assigned_reminder()` — 4 more than
      originally scoped here (`0009`-`0011`)
- [x] Update `set_rls_context()` signature to accept `UserProfile`
- [x] Implement `SET LOCAL` statements in `set_rls_context()` (4 variables,
      not 3 — `app.current_zone_id` added, conditional on the user having a
      zone)
- [x] Update `get_current_user()` call site
- [x] Enable RLS on transactional tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) — `opportunity`, `split`, `opportunity_item`, `opportunity_stakeholder`, `activity`, `document`, `reminder`, `product`
- [x] Create RLS policies for each entity (`0010`-`0012`)
- [x] Update `DATABASE_URL` to use `cabio_app` role — as a connection split,
      not a same-URL swap; see the Database Role Strategy section above and
      `Backend-Implementation-Standards.md`
- [x] Add Alembic migration for role, grants, functions, and policies (`0008`-`0012`)
- [ ] Add integration test suite with `SET LOCAL` impersonation — **not
      built.** Designed, paused, superseded by Basheer's manual write-path
      retest (Task 9); see Testing Strategy above.
- [x] Validate connection pool behavior under concurrent requests — verified
      via the tenant-qualified `cabio_app` username through the Supavisor
      pooler (Task 8), and via the real `SessionLocal` pooled-connection path
      in Task 9's automated read-path retest
- [ ] Update `.env.example` with `cabio_app` connection string — **not done.**
      `backend/.env.example` still shows a plain `postgres` `DATABASE_URL`
      with no `ADMIN_DATABASE_URL`. Real `backend/.env` was updated directly
      (Task 9); the example file drifted. Flagged here, not fixed as part of
      this doc pass — narrow, mechanical follow-up whenever picked up.

---

## Deferred Decisions

All items originally listed here are now resolved:

| Item | Resolution |
|---|---|
| Specific RLS policies per entity | Built, `0010`-`0012` — see the `opportunity_tier_visibility` policy above and this doc's Policy usage section |
| Zone-based policy scoping | Built — Area Manager tier scopes by `account.zone_id` (`0010`) |
| `app.current_zone_id` variable | Built — set conditionally in `set_rls_context()` |
| Cross-SBU split approval policies | Superseded, not resolved as originally framed: rather than an approval workflow for cross-SBU splits (UNR-01), ADR-037/BR-FIN-06 hard-restricts *new* cross-SBU split participants outright (existing ones grandfathered) — see `docs/ADR.md` ADR-037 |

Nothing currently deferred.

---

## References

- ADR.md — ADR-009 (Strategic Isolation), ADR-028 (Stage/Status Decoupling)
- Business-Rules.md — BR enforcement layer assignments
- Backend-Implementation-Standards.md — Section 9 (RLS Context Propagation)
- PH2E-SEC-01 Architecture Analysis — Full option evaluation and rationale
