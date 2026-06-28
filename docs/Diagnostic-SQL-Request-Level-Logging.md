# Diagnostic: Request-Level SQL Logging Filter

**Purpose:** Suppress SQL console output for Account/Project requests, keep it for Product Catalog requests only.  
**Status:** Not yet applied — implement when diagnosing product catalog performance tomorrow.  
**Remove after:** Once the lazy-loading fix (see `Performance-Fix-SQLAlchemy-Lazy-Loading.md`) is verified.

---

## Approach

Use a Python `ContextVar` to carry a "log SQL?" flag from the HTTP middleware layer down to the SQLAlchemy event listener. Each HTTP request gets its own copy of the flag — no cross-request contamination.

---

## Changes

### 1. `backend/app/db/session.py`

Add the `ContextVar` and check it in `_before`:

```python
from contextvars import ContextVar

_log_sql: ContextVar[bool] = ContextVar('log_sql', default=False)

# TEMPORARY diagnostic listener
from sqlalchemy import event as _sa_event
import time as _time
_t = {}

@_sa_event.listens_for(engine, "before_cursor_execute")
def _before(conn, cursor, stmt, params, ctx, many):
    if not _log_sql.get():
        return                          # silent for non-product requests
    _t[id(cursor)] = _time.monotonic()
    print(f"[SQL] {stmt.split()[0]} {stmt.split('FROM')[-1].split()[0] if 'FROM' in stmt else ''}"[:80])

@_sa_event.listens_for(engine, "after_cursor_execute")
def _after(conn, cursor, stmt, params, ctx, many):
    start = _t.pop(id(cursor), None)
    if start is None:
        return                          # was not logged
    ms = (_time.monotonic() - start) * 1000
    print(f"      → {ms:.0f}ms")
```

### 2. `backend/app/main.py`

Add a middleware that sets the flag based on the request URL. Import `_log_sql` from session:

```python
from app.db.session import _log_sql

@app.middleware("http")
async def sql_log_middleware(request: Request, call_next):
    token = _log_sql.set("/products" in request.url.path)
    try:
        return await call_next(request)
    finally:
        _log_sql.reset(token)
```

---

## What Gets Logged

| Request | Logged? |
|---------|---------|
| GET /api/v1/products | YES — user_profile auth query + product query |
| GET /api/v1/products/count | YES — user_profile auth query + count query |
| GET /api/v1/accounts | NO |
| GET /api/v1/projects | NO |
| GET /api/v1/auth/me | NO |
| GET /api/v1/accounts/counts | NO |

The `user_profile` (auth) query inside a `/products` request IS logged because it runs in the same request context — that timing is part of the product endpoint's total latency and useful to see.

---

## Why ContextVar (not a global flag)

A plain global `bool` would be shared across all concurrent requests and would produce race conditions (one request turning logging off while another product request is mid-flight). `ContextVar` gives each async task / thread its own isolated copy, reset automatically at the end of each request via `token = .set(...)` / `.reset(token)`.
