# Cabio Sales OS — Frontend

React 19 + Vite + Tailwind CSS 4. Communicates with the FastAPI backend over REST.
Auth is handled by Supabase; all other data goes through the backend API.

---

## Setup

```bash
npm install
cp .env.example .env   # fill in Supabase credentials
npm run dev            # http://localhost:5173
```

```bash
npm run build          # production build → dist/
npm run lint           # ESLint
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_API_BASE_URL` | Backend base URL (e.g. `http://localhost:8000/api/v1`) |

---

## Directory Structure

```
src/
  screens/        ← Full-page views (one file per screen)
  components/     ← Shared UI components (FormModal, ErrorBoundary, LoginScreen)
  services/       ← API call functions, one file per domain
  contexts/       ← React contexts (AuthContext)
  hooks/          ← Custom hooks (useDebouncedValue)
  lib/            ← Low-level clients (api.js — Axios instance, supabase.js)
  DemoApp.jsx     ← Root navigation shell
  App.jsx         ← Auth gate; renders LoginScreen or DemoApp
  main.jsx        ← Vite entry point
```

### Screens

| Screen | File | Description |
|---|---|---|
| Customer Directory | `CustomerDirectoryScreen.jsx` | Account list with search, zone filter, count badges |
| Customer 360 | `Customer360Screen.jsx` | Account detail workspace — stakeholders, projects, opportunities, assets |
| Project Directory | `ProjectDirectoryScreen.jsx` | Cross-account project list |
| Product Catalog | `ProductCatalogScreen.jsx` | Product list with SBU/brand filter and inline edit |

### Services

One file per domain. Each function is a named export that returns `response.data.data`
(the inner payload of the `APIResponse` envelope). No error handling inside service
functions — errors propagate to the caller.

```
services/
  accounts.js     ← listAccounts, getAccount, getAccountCounts, createAccount, updateAccount
  projects.js     ← listProjects
  products.js     ← listProducts, countProducts, getProduct, createProduct, updateProduct
  masterData.js   ← listZones, listSbus, ...
  auth.js         ← signIn, signOut, getSession
```

---

## Key Patterns

These are the non-obvious decisions every screen must follow. The full rationale is
in `docs/Frontend-Implementation-Standards.md`.

### 1. Always-mounted list screens

List screens **never unmount** when the user navigates to a detail screen. They hide
behind a Tailwind `hidden` class. This preserves scroll position, filter state, and
the in-memory SWR cache across back-navigation.

```jsx
// DemoApp.jsx — correct
<div className={`flex-1 overflow-hidden flex flex-col ${view === "customers" ? "" : "hidden"}`}>
  <CustomerDirectoryScreen onSelectAccount={handleSelectAccount} />
</div>

// Wrong — unmounts on navigation, destroys all state
{view === "customers" && <CustomerDirectoryScreen />}
```

Detail screens conditionally mount — they receive `initialData` from the parent so
first render is instant.

### 2. Module-level SWR cache

List screens keep a module-level `Map` cache (not component state) so the cache
survives component re-renders and delivers data synchronously on back-navigation.
TTL is 30 seconds. Clear with `cache.clear()` after any mutation.

```js
const CACHE_TTL_MS = 30_000;
const entityListCache = new Map(); // lives outside the component
```

### 3. Parallel fetches — never chain

When a screen needs multiple independent pieces of data, fire all fetches
simultaneously. Never `.then(() => fetch2())`.

```js
// Correct — both fire at the same time
getAccount(id).then(setAccount);
listStakeholders(id).then(setStakeholders);

// Wrong — stakeholders wait for account to resolve first
getAccount(id).then((account) => {
  setAccount(account);
  return listStakeholders(id);
}).then(setStakeholders);
```

### 4. Lazy batch counts

Aggregate counts (project count, opportunity count, etc.) are fetched via a
dedicated batch endpoint **after** the list renders. The list shows immediately;
counts populate in the background and merge into the SWR cache.

```js
listAccounts(params).then((data) => {
  setAccounts(data.items);   // list visible immediately
  setLoading(false);
  getAccountCounts(ids).then((counts) => {
    setAccounts(items.map((a) => ({ ...a, ...(counts[a.id] || {}) })));
  });
});
```

### 5. Per-section loading flags

Detail screens have one loading flag per independent data section, not one shared
flag. Each section renders as soon as its own data arrives.

```js
const [stakeholdersLoading, setStakeholdersLoading] = useState(true);
const [projectsLoading, setProjectsLoading] = useState(true);
// Each resolves independently — no waiting for others
```

### 6. isMountedRef guard

Every screen that fires async fetches guards all state setters with `isMountedRef`
to prevent updates after unmount.

```js
const isMountedRef = useRef(true);
useEffect(() => {
  isMountedRef.current = true;
  return () => { isMountedRef.current = false; };
}, []);

fetch().then((data) => {
  if (!isMountedRef.current) return;
  setState(data);
});
```

---

## Adding a New Screen

Checklist for any new list → detail screen pair:

- [ ] List screen uses always-mounted `hidden` pattern in `DemoApp.jsx`
- [ ] List screen has module-level SWR cache with 30 s TTL
- [ ] List screen fires lazy batch counts after list renders; merges into cache
- [ ] List screen passes full entity object (not just ID) to the navigation callback
- [ ] Detail screen accepts `initialData` prop; state initialised from it
- [ ] Detail screen loading flag starts as `!initialData`
- [ ] Detail screen fires all independent fetches in parallel at mount
- [ ] Detail screen has one loading flag per data section
- [ ] `isMountedRef` guard on all async state setters
- [ ] Tab fetch errors swallowed silently — empty state, not error screen
- [ ] Service functions added to `src/services/{domain}.js`
- [ ] Backend has a `GET /{entities}/counts?ids=...` endpoint (see `backend/README.md`)
