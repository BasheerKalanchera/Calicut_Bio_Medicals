# Customer 360 — Progressive Loading Architecture

## Problem

The `/accounts/{id}/workspace` endpoint fires **8+ SQL queries to Supabase** in sequence:
- 1× SELECT account (with joined SBU, parent)
- Then SQLAlchemy's `lazy="selectin"` automatically fires separate queries for:
  - stakeholders, projects, opportunities, activities ← used in UI
  - installed_assets, documents, coverage_plan_entries, child_accounts ← some not used in workspace UI

Each round-trip to Supabase (AWS ap-south-1) costs ~300–500ms.
**Total: 8 × 400ms ≈ 3–4 seconds** before the Customer 360 screen shows anything.

For a field sales rep on a phone with 4G, this is unacceptable in production.

## Design Principle: Show First, Fetch Everything in Parallel

We load in two phases. Phase 1 gets the screen visible immediately. Phase 2 fires all remaining requests **simultaneously** right after — so the data arrives while the user is reading the Overview, not after they start tapping tabs.

**Phase 1 — Instant Overview** (target: <500ms)
- Fetch just `GET /accounts/{id}` — account details + 4 counts
- Render the Overview tab immediately: name, SBU, payer behavior, summary stats

**Phase 2 — Parallel Prefetch** (starts immediately after Phase 1 resolves, target: ~400ms)
- Fire all 4 sub-resource requests **at the same time** using `Promise.all`
- User reads the Overview for a few seconds → by the time they tap any tab, data is already there
- If the user taps a tab before Phase 2 completes, show a loading spinner for that tab only

```
User taps account
      ↓
Phase 1: GET /accounts/{id}               (~400ms) → Overview renders immediately
      ↓ Phase 2 starts right away, all in parallel:
         GET /accounts/{id}/stakeholders  ┐
         GET /accounts/{id}/projects      ├─ ~400ms, all running concurrently
         GET /accounts/{id}/opportunities │
         GET /accounts/{id}/installed-assets ┘
      ↓
User reads Overview for a few seconds → taps any tab → data already loaded
```

This avoids the N×400ms chain of the workspace endpoint while keeping the implementation straightforward — no per-tab lazy-load guards, no cross-tab data dependency issues.

## Open Questions

> [!IMPORTANT]
> **Q1**: Should the Overview tab show real-time counts (Stakeholders: 3, Projects: 2, Opportunities: 5)?
> Currently, the workspace returns full records just to count them. The simplest fix is to embed counts in the `GET /accounts/{id}` response. **Assumption**: Yes, counts are needed. We will add them.

> [!NOTE]
> **Q2**: The existing `/workspace` endpoint will become unused.
> **Decision**: Keep it in place (don't delete) — it's a valid API design, just not optimal for this use case. We can remove it later.

---

## Proposed Changes

### Backend

---

#### [MODIFY] [account/schemas.py](file:///c:/Users/Basheer/GitHub/Calicut_Bio_Medicals/backend/app/domains/account/schemas.py)
- Add `AccountDetailResponse` schema that extends `AccountResponse` with 4 count fields:
  `stakeholder_count`, `project_count`, `opportunity_count`, `asset_count`

#### [MODIFY] [account/repository.py](file:///c:/Users/Basheer/GitHub/Calicut_Bio_Medicals/backend/app/domains/account/repository.py)
- Add `get_account_with_counts(account_id)` method:
  - Fetches account + SBU (joined, already loaded)
  - Runs 4 `COUNT(*)` subqueries for the summary stats
  - Uses `noload()` to suppress all the heavy selectin relationships
  - Net result: 2 DB queries (account + counts in one shot with subqueries)

#### [MODIFY] [account/router.py](file:///c:/Users/Basheer/GitHub/Calicut_Bio_Medicals/backend/app/domains/account/router.py)
- Update `GET /accounts/{account_id}` to use `get_account_with_counts()` and return `AccountDetailResponse`

#### [NEW] Installed Asset GET endpoint
- Add `GET /accounts/{account_id}/installed-assets` endpoint in a new `asset/router.py`
- Register it in `main.py`
- The asset domain currently has only a model, no router

#### [MODIFY] [opportunity/router.py](file:///c:/Users/Basheer/GitHub/Calicut_Bio_Medicals/backend/app/domains/opportunity/router.py)
- Add `GET /accounts/{account_id}/opportunities` endpoint
- Returns list of opportunities with nested stage/status/owner (matching workspace schema)

#### [MODIFY] [project/router.py](file:///c:/Users/Basheer/GitHub/Calicut_Bio_Medicals/backend/app/domains/project/router.py)
- Add `GET /accounts/{account_id}/projects` endpoint
- Returns list of projects with nested status/owner

> **Note:** `GET /accounts/{account_id}/stakeholders` already exists in `stakeholder_router.py`. No backend change needed for stakeholders.

---

### Frontend

---

#### [MODIFY] [services/accounts.js](file:///c:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/services/accounts.js)
- `getAccount(accountId)` already calls `GET /accounts/{id}` — no change needed; it will automatically return counts once the backend is updated
- Add `listInstalledAssets(accountId)` — calls `GET /accounts/{id}/installed-assets`
- Add `listOpportunities(accountId)` — calls `GET /accounts/{id}/opportunities`
- Add `listProjects(accountId)` — calls `GET /accounts/{id}/projects`
- `listStakeholders(accountId)` already exists — no change needed

#### [MODIFY] [screens/Customer360Screen.jsx](file:///c:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/screens/Customer360Screen.jsx)
This is the main change. Replace the single `getWorkspace()` call with two-phase loading:

**State model:**
```
account:       null           // set after Phase 1
stakeholders:  []             // set after Phase 2
projects:      []             // set after Phase 2
opportunities: []             // set after Phase 2
installed:     []             // set after Phase 2
accountLoading:  true         // Phase 1 in flight
detailLoading:   true         // Phase 2 in flight
error:           null
```

**Loading behaviour:**
- On mount:
  1. Fetch `getAccount(id)` → on success, set `account`, set `accountLoading: false` → Overview renders
  2. Immediately after (or concurrently), kick off `Promise.all([listStakeholders, listProjects, listOpportunities, listInstalledAssets])` → on all resolved, set each list + `detailLoading: false`
- Tab content: if `detailLoading` is still true when the user taps a tab, show a small inline spinner for that tab's content area only
- After create/edit mutation: re-fetch the affected sub-resource **and** call `getAccount(id)` again to refresh the counts on the Overview

**Summary stats on Overview tab:**
- Use `account.stakeholder_count`, `account.project_count`, etc. from Phase 1 response
- After any mutation, re-fetching `getAccount(id)` keeps these counts current without a full page reload

---

## Verification Plan

### Manual
1. Click an account — Overview tab must appear in < 1 second
2. Without clicking anything, wait 2 seconds, then click Stakeholders tab — data shows instantly with no spinner
3. Click Projects tab — instant (already prefetched)
4. Click Opportunities tab — instant (already prefetched)
5. Click Installed Base tab — instant (already prefetched)
6. Click an account and immediately (within ~1 second) tap a tab — spinner appears briefly, then data loads
7. Create a Stakeholder — Stakeholders tab refreshes **and** the count on the Overview stat card updates in the same action
8. Navigate back → re-enter same account — Overview appears in < 1 second, tabs ready within ~400ms

### Automated
- Not in scope for this change — verify manually via browser test session after implementation
