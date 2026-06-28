# Performance Fix: SQLAlchemy Lazy Loading Cascade

**Status:** Ready to implement  
**Priority:** High — blocks Product Catalog and Project Directory load speed  
**Estimated impact:** Project Directory 2000ms → ~50ms. Product Catalog perceived wait ~2200ms → ~200ms.

---

## Root Cause Summary

### Problem 1 — `lazy="selectin"` cascade on Account and Opportunity

`lazy="selectin"` fires automatically whenever the parent object lands in the SQLAlchemy session — regardless of whether any code accesses the attribute. Account has 7 such relationships; Opportunity has 5.

When the Project Directory list runs, it JOINs Account (Project.account is `lazy="joined"`). This loads 50 Account objects into the session, which triggers 7 automatic selectin queries. The Opportunity selectin then loads ~100+ Opportunity objects, which triggers 5 more selectin queries. Stakeholder objects load and fire another selectin. Total: **25+ sequential DB queries on a single HTTP request** instead of 2.

Each query costs ~60-250ms (Supabase round-trip latency). The project list endpoint takes **2+ seconds** instead of ~50ms.

### Problem 2 — Browser HTTP connection starvation

Browsers limit to 6 concurrent HTTP connections per host:port. At app boot, all always-mounted screens fire simultaneously:

```
auth/me × 8+ requests
GET /api/v1/accounts
GET /api/v1/projects       ← holds connection for 2+ seconds (cascade)
GET /api/v1/products
GET /api/v1/accounts/counts
```

12+ requests compete for 6 browser connections. The `/projects` endpoint holds its HTTP connection open for 2+ seconds while the DB cascade runs. The `/products` request sits in the browser queue behind it.

**Result:** Product Catalog waits ~2.2 seconds for a browser connection, then returns in 78ms. Customer Directory gets a connection in the first wave and returns in ~265ms. This is the 8–10× perceived gap the user measures.

After the fix, `/projects` returns in ~50ms, releases its connection immediately, and `/products` fires in the first wave.

### Why Customer Directory is NOT affected

`account/repository.py` → `list_accounts()` already applies `noload()` to all 8 Account collections. It fires 2 queries (count + select) and is fast. The cascade only fires from the **Project** list, which JOINs Account without suppressing Account's selectin relationships.

---

## Affected Models

### `lazy="selectin"` relationships to change → `lazy="select"`

| Model | Relationship | File |
|-------|-------------|------|
| Account | child_accounts | account/models.py |
| Account | stakeholders | account/models.py |
| Account | projects | account/models.py |
| Account | opportunities | account/models.py |
| Account | activities | account/models.py |
| Account | installed_assets | account/models.py |
| Account | documents | account/models.py |
| Account | coverage_plan_entries | account/models.py |
| Stakeholder | opportunity_stakeholders | account/models.py |
| Opportunity | opportunity_stakeholders | opportunity/models.py |
| Opportunity | splits | opportunity/models.py |
| Opportunity | items | opportunity/models.py |
| Opportunity | activities | opportunity/models.py |
| Opportunity | documents | opportunity/models.py |
| Activity | reminders | activity/models.py |
| TargetPlan | coverage_plans | planning/models.py |
| CoveragePlan | entries | planning/models.py |

**Rule going forward:** Model-level collection relationships default to `lazy="select"`. Use explicit `selectinload()` in repository queries that genuinely need the collections.

---

## Impact Analysis

**Hard breaks (errors or wrong data): ZERO**

All active list/get/update endpoints already use `noload()` on the affected collections. No Pydantic schema accessed via `model_validate()` includes list fields from these relationships.

### Soft impact: `account/repository.py` → `get_for_workspace()`

This method powers the Customer360 workspace screen. It currently omits `noload()` for `stakeholders`, `projects`, `opportunities`, `installed_assets` — relying on selectin to auto-load them.

After the change, those 4 collections will lazy-load (`lazy="select"`) when `workspace_service.py` iterates them. The session is open during the request so no error, no wrong data. However, add explicit `selectinload()` for self-documenting intent:

```python
# account/repository.py — get_for_workspace() — AFTER fix
from sqlalchemy.orm import selectinload, noload

return self.db.scalar(
    select(Account)
    .where(Account.id == account_id)
    .options(
        selectinload(Account.stakeholders),
        selectinload(Account.projects),
        selectinload(Account.opportunities),
        selectinload(Account.installed_assets),
        noload(Account.activities),
        noload(Account.documents),
        noload(Account.coverage_plan_entries),
        noload(Account.child_accounts),
    )
)
```

### Latent risk: `BaseRepository.get_by_id()`

Generic base method, no `noload()`. Not connected to any router endpoint today. If wired to an Account/Opportunity endpoint in the future, collections will lazy-load on attribute access. Note for future work.

### Safe by absence

`Activity.reminders`, `TargetPlan.coverage_plans`, `CoveragePlan.entries` — no API endpoints for these domains yet. Safe to change now.

---

## Files to Change

| File | Change |
|------|--------|
| `backend/app/domains/account/models.py` | 8 Account + 1 Stakeholder → `lazy="select"` |
| `backend/app/domains/opportunity/models.py` | 5 Opportunity → `lazy="select"` |
| `backend/app/domains/activity/models.py` | Activity.reminders → `lazy="select"` |
| `backend/app/domains/planning/models.py` | TargetPlan.coverage_plans, CoveragePlan.entries → `lazy="select"` |
| `backend/app/domains/account/repository.py` | `get_for_workspace()` — add explicit `selectinload()` for 4 workspace collections |

No schema changes. No Alembic migration needed (ORM-level only). No frontend changes.

---

## Also: Remove SQL Diagnostic Listener

After verifying the fix, remove the temporary SQL event listener from `backend/app/db/session.py` (lines 18–31 — the `_before` / `_after` cursor execute hooks and the `_t` dict). It was added to diagnose the slowness and must not stay in production code.

---

## Expected Query Counts After Fix

| Endpoint | Before | After |
|----------|--------|-------|
| GET /projects (list all) | 25+ queries, ~2000ms | 3 queries (count + select + joined account), ~50ms |
| GET /products (list) | 1 query, ~78ms | 1 query, ~78ms (unchanged) |
| GET /accounts (list) | 2 queries, ~265ms | 2 queries, ~265ms (unchanged, already correct) |
| GET /accounts/{id}/workspace | 5 queries (1 + 4 selectin) | 5 queries (1 + 4 explicit selectin) — identical |
