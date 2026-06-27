# Cabio Sales OS - Frontend Implementation Standards v1.0

**Based on:** Architecture Freeze v1.0, ADR-029, ADR-030, Customer Directory / Customer 360 implementation (June 2026)

---

## 1. Introduction

### Purpose
This document is the single authoritative reference for all frontend implementation decisions. Every new screen, component, and service file must conform to these standards. No deviation without explicit Product Owner and Architect approval.

### Scope
Covers all React/Vite frontend code under the `sales-os-app/` directory. Does not cover backend, infrastructure, or Supabase configuration.

### Guiding Principles
1. **One way to do everything.** No alternatives. No "you could also."
2. **Perceived performance is the real metric.** The screen must appear instantly — data fills in while the user is already looking at it.
3. **Never chain fetches that can run in parallel.** If two requests don't share a data dependency, they fire simultaneously.
4. **Component state is free — network round trips are expensive.** Use local state generously; minimise sequential network calls at all costs.
5. **Build for the scale ceiling, not the current row count.** Assume 500 accounts, 50 opportunities per account. Design endpoints and queries accordingly from the start.

---

## 2. Navigation Architecture

### 2.1 Always-Mounted Pattern for List Screens (ADR-030)

List screens that are the parent in a list → detail navigation pair **must stay mounted** in the DOM. They are hidden via a Tailwind `hidden` class, not unmounted with `&&`.

**Required pattern — `DemoApp.jsx`:**
```jsx
{/* CustomerDirectory stays mounted — CSS hidden, never unmounted */}
<div className={`flex-1 overflow-hidden flex flex-col ${view === "customers" ? "" : "hidden"}`}>
  <CustomerDirectoryScreen onSelectAccount={handleSelectAccount} />
</div>

{/* Detail screen mounts fresh on navigation, receives initialData */}
{view === "customer360" && selectedAccount && (
  <Customer360Screen
    accountId={selectedAccount.id}
    initialAccount={selectedAccount}
    onBack={handleBack360}
  />
)}
```

**Rationale:** Unmounting the list screen on navigation destroys scroll position, filter state, and in-flight data. Remounting triggers a full data refetch (even with SWR cache, a cache hit still re-renders the entire list). The always-mounted pattern matches how iOS UINavigationController and Android back stack work — the parent stays in memory while the child is on screen.

**Rules:**
- Every list screen (Customer Directory, Coverage Plans, Opportunity Pipeline, Target Plans, etc.) must use this pattern.
- Detail screens (`Customer360Screen`, future detail screens) continue to conditionally mount/unmount. They receive `initialData` from the parent on mount so remount cost is negligible.
- Never use `key={selectedAccount?.id}` on a list screen to force remount — this defeats the purpose.

---

## 3. Data Fetching Architecture

### 3.1 Optimistic Initial Render via `initialData` Prop

Detail screens must render immediately using data passed from the parent list. The full detail fetch fires in the background to fill in missing fields.

**Required pattern — detail screen:**
```jsx
export default function SomeDetailScreen({ entityId, initialEntity = null, onBack }) {
  const [entity, setEntity] = useState(initialEntity);
  const [loading, setLoading] = useState(!initialEntity); // false when initialData provided

  const load = useCallback(() => {
    if (!initialEntity) setLoading(true);

    getEntity(entityId)
      .then((data) => { setEntity(data); setLoading(false); })
      .catch((err) => {
        if (!initialEntity) {
          setError(err.message || "Failed to load");
          setLoading(false);
        }
        // If initialData was provided, silently swallow the background fetch error.
        // User already sees data — don't flash an error screen.
      });
  }, [entityId, initialEntity]);
```

**Rules:**
- `useState(initialData)` — initialise state from the prop, not from `null`.
- `useState(!initialData)` — loading starts `false` when initial data is present.
- The background `getEntity` fetch always fires — it fills in fields the list row doesn't carry (e.g. full detail, counts from the detail endpoint).
- Never block render on the background fetch completing.

### 3.2 Parallel Fetch at Mount — Never Chain

When a detail screen needs N pieces of data and none of them depend on each other, fire all N fetches simultaneously at mount. Never chain `.then(() => fetch2(...))`.

**Required pattern — `Customer360Screen` mount:**
```js
const loadAll = useCallback(() => {
  // All 5 fire simultaneously — no await, no .then chaining between them
  getAccount(accountId).then(setAccount).catch(...).finally(() => setLoading(false));
  listStakeholders(accountId).then(setStakeholders).catch(() => {}).finally(() => setStakeholdersLoading(false));
  listProjects(accountId).then(setProjects).catch(() => {}).finally(() => setProjectsLoading(false));
  listOpportunities(accountId).then(setOpportunities).catch(() => {}).finally(() => setOpportunitiesLoading(false));
  listInstalledAssets(accountId).then(setInstalled).catch(() => {}).finally(() => setInstalledLoading(false));
}, [accountId]);
```

**Rules:**
- Chaining is only allowed when there is a genuine data dependency (e.g. you need the account ID from the first call to construct the URL for the second). This is rare.
- Never use `Promise.all([...]).then(([a, b]) => ...)` as a convenience wrapper — it holds back all rendering until the slowest fetch resolves. Use individual `.then()` handlers so each piece of data renders as it arrives.
- Do not `await` fetches inside a `useEffect` — always use `.then()` chains to avoid blocking the render cycle.

### 3.3 Per-Resource Loading Flags

Each independently loaded data section has its own loading flag. Never use a single shared `isLoading` flag for a screen that has multiple independent data sections.

**Required pattern:**
```jsx
const [stakeholdersLoading, setStakeholdersLoading] = useState(true);
const [projectsLoading, setProjectsLoading] = useState(true);
const [opportunitiesLoading, setOpportunitiesLoading] = useState(true);
const [installedLoading, setInstalledLoading] = useState(true);

// In JSX — each section renders independently
{activeTab === "stakeholders" && (
  stakeholdersLoading ? <LoadingDiv /> : <StakeholdersTab ... />
)}
```

**Rules:**
- One `useState(true)` per data section, set to `false` in `.finally()` of its own fetch.
- A section that has loaded data renders it immediately even if other sections are still loading.
- The header / overview section of a detail screen uses `useState(!initialData)` — it does not share a flag with the tab sections.

---

## 4. Caching Architecture

### 4.1 Stale-While-Revalidate (SWR) Cache for List Screens

List screens that are always-mounted (§2.1) must also implement a module-level SWR cache so that back-navigation shows data instantly on the same render frame — before any network response returns.

**Required pattern:**
```js
// Module-level — persists across component mounts
const CACHE_TTL_MS = 30_000;
const entityListCache = new Map(); // cacheKey → { items, total, fetchedAt }

function getCached(key) {
  const entry = entityListCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) { entityListCache.delete(key); return null; }
  return entry;
}

function setCache(key, data) {
  entityListCache.set(key, { ...data, fetchedAt: Date.now() });
}

// In fetchList():
const cached = getCached(cacheKey);
if (cached && !isBackgroundRefresh) {
  setItems(cached.items);
  setTotal(cached.total);
  setLoading(false);
  fetchList({ background: true }); // silent background refresh
  return;
}
```

**Rules:**
- Cache key = `JSON.stringify(params)` — captures all active filters and pagination.
- TTL = 30 seconds. Data older than 30 s is refetched in the foreground.
- On cache hit, serve data synchronously then kick off a silent background refresh.
- Call `entityListCache.clear()` immediately after a create/update/delete mutation so the next fetch is authoritative.
- The cache stores the merged result including lazy-loaded counts (§4.2) — counts must not be lost on background refresh.

### 4.2 Lazy Batch Aggregate Counts (ADR-029)

Aggregate counts (stakeholder count, project count, etc.) are expensive to include in the list query at scale. They must be fetched lazily via a dedicated batch endpoint after the list renders.

**Required pattern — frontend:**
```js
listEntities(params)
  .then((data) => {
    const items = data.items;
    setItems(items);           // list renders immediately — no counts yet
    setLoading(false);

    const ids = items.map((e) => e.id);
    if (ids.length === 0) { setCache(cacheKey, { items, total: data.total }); return; }

    getEntityCounts(ids)       // fires lazily after list is visible
      .then((counts) => {
        const merged = items.map((e) => ({ ...e, ...(counts[e.id] || {}) }));
        setItems(merged);      // counts populate in the background
        setCache(cacheKey, { items: merged, total: data.total });
      })
      .catch(() => {
        setCache(cacheKey, { items, total: data.total }); // counts missing — still cache the list
      });
  });
```

**Required pattern — backend (§5.1 cross-reference):**
- One dedicated `GET /entities/counts?ids=...` endpoint.
- Endpoint declared before `GET /{entity_id}` in the router to avoid route collision.
- Endpoint runs one `GROUP BY entity_id` query per child table — never correlated scalar subqueries.
- Returns `{ [entityId: string]: { child1_count, child2_count, ... } }`.

**Rules:**
- The list screen never waits for counts before rendering. Counts show as `—` or `0` while loading and populate in the background.
- The detail screen receives counts via `initialData` prop (which by the time the user taps is already merged). On detail load, the `getEntity` background fetch returns counts from the detail endpoint — these replace the `—` placeholders.
- This pattern scales to 500+ accounts because the batch endpoint's cost is O(1 scan × N child tables) regardless of page size.

---

## 5. Backend Endpoint Contract for Lazy Counts

This section defines what the frontend expects from any batch counts endpoint. Backend engineers must satisfy this contract.

| Property | Requirement |
|---|---|
| **Route** | `GET /entities/counts?ids=uuid1,uuid2,...` |
| **Auth** | Bearer token required (same as all other endpoints) |
| **Query param** | `ids` — comma-separated UUIDs. Missing `ids` param → 422. Empty string → 200 with `{}`. |
| **Response shape** | `{ "success": true, "data": { "<uuid>": { "<field>_count": int, ... } } }` |
| **Missing entity** | Account not in result → frontend defaults to `0` via `counts[e.id] \|\| {}` |
| **Implementation** | One `GROUP BY entity_id` per child table. No correlated subqueries. No ORM lazy loads. |
| **Route placement** | Must appear before `GET /{entity_id}` in the router file. |

---

## 6. Component Patterns

### 6.1 isMountedRef Guard

Every screen that fires async fetches must guard all state setters with an `isMountedRef` to prevent state updates on unmounted components.

```jsx
const isMountedRef = useRef(true);
useEffect(() => {
  isMountedRef.current = true;
  return () => { isMountedRef.current = false; };
}, []);

// In fetch callbacks:
.then((data) => {
  if (!isMountedRef.current) return;
  setState(data);
})
```

**Note:** React 18 Strict Mode double-invokes effects. The cleanup `() => { isMountedRef.current = false; }` runs between the two invocations, leaving `isMountedRef.current = false` during the second mount. The fix is to set `isMountedRef.current = true` inside the effect body (not just the cleanup), which resets it on both invocations. The pattern above already handles this correctly.

### 6.2 Form Modals

- Enter key in form modals must not submit the form. Add `onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}` to each text input or handle it at the form element level.
- Modal `onSubmit` must throw to signal failure — `FormModal` catches the error and displays it.
- Clear all form state fields before opening the modal (not after closing) so re-opening shows a blank form.

### 6.3 Optimistic Error Handling in Tab Sections

Tab fetches must never surface an error to the user. If a tab fetch fails, the tab renders empty (no data) rather than an error message. The overview/header section is the only place where a hard error state (with Retry button) is appropriate, and only when `initialData` was not provided.

```js
listChildEntities(id)
  .then(setEntities)
  .catch(() => {})           // swallow silently — tab shows empty state
  .finally(() => setLoading(false));
```

---

## 7. Service Layer (Frontend)

### 7.1 API Service Functions

All backend calls live in `sales-os-app/src/services/`. No direct `api.get(...)` calls inside components or screens.

- One file per domain: `accounts.js`, `masterData.js`, etc.
- Each function is a named export, async, returns `response.data.data` (the inner `data` field from `APIResponse`).
- No error handling inside service functions — errors propagate to the caller.

### 7.2 Counts Endpoint Service Function Pattern

```js
export async function getEntityCounts(ids) {
  const response = await api.get("/entities/counts", { params: { ids: ids.join(",") } });
  return response.data.data; // { [entityId]: { child_count, ... } }
}
```

---

## 8. Checklist — New List → Detail Screen Pair

Use this checklist when implementing any new list screen + detail screen pair:

- [ ] List screen uses always-mounted CSS hidden pattern in `DemoApp.jsx` (§2.1)
- [ ] List screen has module-level SWR cache with 30 s TTL (§4.1)
- [ ] List screen passes full entity object (not just ID) to `onSelectEntity` callback
- [ ] List screen fires lazy batch counts fetch after list renders; merges into state and cache (§4.2)
- [ ] Detail screen accepts `initialData` prop; state initialised from it (§3.1)
- [ ] Detail screen loading flag initialised as `!initialData` (§3.1)
- [ ] Detail screen fires all fetches simultaneously at mount — no chaining (§3.2)
- [ ] Detail screen has one loading flag per independent data section (§3.3)
- [ ] Backend has a `GET /entities/counts` endpoint satisfying the contract in §5 (ADR-029)
- [ ] `isMountedRef` guard on all async state setters (§6.1)
- [ ] Tab fetch errors swallowed silently — empty state, not error screen (§6.3)
- [ ] Form modals clear state on open, not on close (§6.2)
