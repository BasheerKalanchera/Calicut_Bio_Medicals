# Frontend Stack Migration — Impact Analysis
## MUI + React Query + TypeScript

**Prepared:** June 30, 2026
**Status:** Approved — migration to begin before Phase 1 Part 2
**Related ADRs:** ADR-031 (MUI), ADR-032 (React Query), ADR-033 (TypeScript)

---

## 1. Scope

Full migration of the `sales-os-app/` React frontend from:

| Current | Target |
|---|---|
| Tailwind CSS | Material UI (MUI) |
| Manual SWR cache (Map + useEffect) | TanStack React Query |
| JavaScript (JSX/JS) | TypeScript (TSX/TS) |

Backend, Supabase, and all API contracts are **unchanged**.

---

## 2. File Inventory

| File | Lines | MUI | React Query | TypeScript | Change Level |
|---|---|---|---|---|---|
| `package.json` | 32 | Add/remove deps | Add dep | Add deps | Infrastructure |
| `vite.config.js` | 11 | Remove Tailwind plugin | — | Rename | Infrastructure |
| `main.jsx` | ~10 | Add ThemeProvider | Add QueryClientProvider | Rename | Infrastructure |
| `src/theme/index.ts` | — (new) | Create MUI theme | — | New file | New |
| `tsconfig.json` | — (new) | — | — | New file | New |
| `src/types/api.ts` | — (generated) | — | — | Generated | New |
| `lib/api.js` | 37 | — | — | Rename + types | Low |
| `lib/supabase.js` | ~5 | — | — | Rename | Low |
| `services/auth.js` | ~20 | — | — | Rename + return types | Low |
| `services/accounts.js` | ~100 | — | — | Rename + return types | Low |
| `services/masterData.js` | ~60 | — | — | Rename + return types | Low |
| `services/products.js` | ~40 | — | — | Rename + return types | Low |
| `services/projects.js` | ~20 | — | — | Rename + return types | Low |
| `hooks/useDebouncedValue.js` | 12 | — | — | Generic `<T>` | Low |
| `components/ErrorBoundary.jsx` | ~30 | Minor | — | Rename + types | Low |
| `components/LoginScreen.jsx` | 87 | Full rewrite | — | Rename + types | Medium |
| `components/FormModal.jsx` | 95 | Full rewrite → Dialog | — | Rename + types | **High** |
| `DemoApp.jsx` | 340+ | Full rewrite | Partial | Rename + types | **High** |
| `screens/CustomerDirectoryScreen.jsx` | ~380 | Full rewrite | Full | Rename + types | **High** |
| `screens/Customer360Screen.jsx` | 1000+ | Full rewrite | Full | Rename + types | **Critical** |
| `screens/ProjectDirectoryScreen.jsx` | 812 | Full rewrite | Full | Rename + types | **High** |
| `screens/ProductCatalogScreen.jsx` | 655 | Full rewrite | Full | Rename + types | **High** |

---

## 3. React Query Migration

### What is being replaced

Every screen contains an identical hand-rolled SWR pattern. It appears in four files and totals ~150 lines of boilerplate:

```js
const CACHE_TTL_MS = 30_000;
const accountListCache = new Map();
function getCacheKey(params) { ... }
function getCached(key) { ... }
function setCache(key, data) { ... }

const isMountedRef = useRef(true);
useEffect(() => {
  isMountedRef.current = true;
  return () => { isMountedRef.current = false; };
}, []);

const fetchAccounts = useCallback((opts = {}) => {
  // 30+ lines of cache-check, loading state, background-refresh logic
}, [debouncedSearch, zoneFilter, page]);

useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
```

### What replaces it

```ts
const { data, isLoading, error } = useQuery({
  queryKey: ['accounts', { search: debouncedSearch, zone: zoneFilter, page }],
  queryFn: () => listAccounts({ search: debouncedSearch, zone_id: zoneFilter, page, page_size: 50 }),
  staleTime: 30_000,
});
```

### Screen-by-screen migration detail

**CustomerDirectoryScreen**
Two queries: items list + parallel count (ADR-029 pattern). The count `useQuery` uses `enabled: !!data?.items.length` to fire after items resolve. The `accountUpdateRef` imperative callback is replaced by `queryClient.setQueryData(...)`.

**Customer360Screen**
Six independent queries across five tabs: account detail, stakeholders, projects, opportunities, installed assets. Currently managed via `tabDataCache` keyed by `accountId:tab`. In React Query these become six `useQuery` calls each with `queryKey: ['account', accountId, tabName]`. All mutations use `useMutation` + `queryClient.invalidateQueries`.

**ProjectDirectoryScreen**
Single list query. The `refreshOppsRef` imperative callback (fired from DemoApp after Quick Lead creation) becomes `queryClient.invalidateQueries(['projects'])`, eliminating the ref entirely.

**ProductCatalogScreen**
Same parallel items + count pattern as CustomerDirectory. The `setTimeout(() => setSelectedProductId(saved.id), 0)` hack after save is replaced by a clean `useMutation` + `invalidateQueries`.

**DemoApp QuickLead modal**
Pre-fetches accounts, stages, statuses, users, products, lead sources into local state on modal open. These become `useQuery` calls with `staleTime: Infinity` — reference data loads once and stays cached for the session.

---

## 4. MUI Migration

### Package changes

**Remove:**
- `tailwindcss`
- `@tailwindcss/vite`

**Add:**
- `@mui/material`
- `@mui/icons-material`
- `@emotion/react`
- `@emotion/styled`
- `@mui/x-date-pickers`
- `dayjs`

### MUI theme — define once, all components inherit

New file `src/theme/index.ts`:

```ts
const theme = createTheme({
  palette: { primary: { main: '#2563eb' } },   // current blue preserved
  shape:   { borderRadius: 12 },                // current rounded-2xl feel preserved
  typography: { fontWeightBold: 700, fontWeightMedium: 500 },
});
```

### Component-by-component migration

**`FormModal` — migrate first, unblocks all screens**

FormModal is used by every screen. Converting it to MUI `Dialog` is the single highest-leverage step.

```jsx
// Before: ~40 lines custom overlay
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] ...">
  <form className="bg-white max-w-md w-full rounded-2xl shadow-2xl ...">

// After: MUI Dialog
<Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
  <DialogTitle>{title}</DialogTitle>
  <DialogContent>{children}</DialogContent>
  <DialogActions>
    <Button onClick={onClose} disabled={submitting}>Cancel</Button>
    <Button type="submit" variant="contained" disabled={submitting}>
      {submitting ? 'Saving...' : submitLabel}
    </Button>
  </DialogActions>
</Dialog>
```

MUI Dialog adds focus trap, scroll lock, and proper ARIA attributes missing from the current implementation.

**`DemoApp` — three distinct migration areas**

*Sidebar Drawer:* 40+ lines of custom translate-x animation → MUI `Drawer variant="temporary"`.

*Top AppBar:* Header div → MUI `AppBar` + `Toolbar`. Hamburger button → `IconButton`.

*BottomNavigation (new):* No bottom navigation exists today. Add MUI `BottomNavigation` below the main content for primary screen switching. This moves navigation from the top-left hamburger (hardest area to reach on mobile) to the bottom of the screen (thumb zone). This is the single biggest mobile UX improvement in the migration.

**`LoginScreen`**

`<input>` → `TextField`. `<button>` → `Button`. Error `<div>` → `Alert`.

**`CustomerDirectoryScreen`**

| Current | MUI replacement |
|---|---|
| Search `<input>` | `TextField` with search `InputAdornment` |
| Zone `<select>` | `Select` |
| Account list rows | `List` + `ListItemButton` |
| Zone / payer badges | `Chip` |
| Loading text | `LinearProgress` |
| Error div | `Alert` with retry action |
| Prev/Next pagination | `Pagination` |

**`Customer360Screen` — largest migration**

| Element | MUI replacement |
|---|---|
| `TABS` array | `Tabs` + `Tab` |
| `PayerBadge`, `SentimentBadge` | `Chip` |
| `NpsIndicator` | `Typography` with color prop |
| All list cards | `Card` |
| All `<select>` dropdowns | `Select` or `Autocomplete` |
| All `<input type="text">` | `TextField` |
| Edit/Add buttons | `Button` |

Five tab panels each migrated independently, reducing risk.

**`ProjectDirectoryScreen`**

Key addition: `<input type="date">` for `bid_submission_date` → **MUI `DatePicker`** from `@mui/x-date-pickers`. This is the first use of DatePicker in the codebase, with more to follow in Parts 2–4. Account picker in the create form → `Autocomplete` (account list can be large).

**`ProductCatalogScreen`**

`ProductFormModal` (the screen's own modal, separate from shared FormModal) → convert to MUI `Dialog`. SBU filter chips → `ToggleButtonGroup`. `<textarea>` → `TextField multiline`.

---

## 5. TypeScript Migration

### New infrastructure

`tsconfig.json` with `strict: true`.

Add to `package.json` scripts:
```json
"generate:types": "openapi-typescript http://localhost:8000/openapi.json -o src/types/api.ts"
```

Run after the FastAPI backend is running. All API types are generated from Pydantic models automatically. Re-run whenever backend models change.

### Service files — logic unchanged, types added

```ts
// Before
export async function listAccounts(params = {}) { ... }

// After
import type { AccountListResponse, AccountListParams } from '../types/api';
export async function listAccounts(params: AccountListParams = {}): Promise<AccountListResponse> { ... }
```

### Key domain types generated from OpenAPI spec

- `Account` (with nested `zone`, `payer_behavior`, count fields)
- `Opportunity` + `OpportunityItem` + `OpportunityStage` + `OpportunityStatus`
- `Stakeholder`
- `Project` + `ProjectStatus`
- `Product` + `SBU`
- `InstalledAsset`
- `User` + `UserProfile`
- `Zone` + `LeadSource`
- `PaginatedResponse<T>` generic

### Hook and context changes

`useDebouncedValue` → generic: `function useDebouncedValue<T>(value: T, delayMs?: number): T`

`AuthContext` → `session: Session | null`, `userProfile: UserProfile | null` with explicit return type on `useAuth()`.

---

## 6. What Does Not Change

| Area | Status |
|---|---|
| All service function logic | Unchanged — types wrapped around existing implementation |
| `lib/api.js` axios interceptor logic | Unchanged |
| `lib/supabase.js` | Unchanged |
| `AuthContext` auth logic | Unchanged |
| `useDebouncedValue` debounce logic | Unchanged |
| FastAPI backend | Zero changes |
| Supabase database and RLS | Zero changes |
| All API contracts | Zero changes |

---

## 7. Recommended Migration Sequence

This order minimises risk — each step is independently deployable before the next begins.

| Step | Files | Days | Notes |
|---|---|---|---|
| 1 | `package.json`, `vite.config.ts`, `tsconfig.json`, `theme/index.ts`, `main.tsx` | 1.5 | Zero functional change |
| 2 | `lib/api.ts`, `lib/supabase.ts`, all `services/*.ts`, `hooks/useDebouncedValue.ts` | 1.5 | Logic unchanged, types only |
| 3 | Run `generate:types` → `src/types/api.ts` | 0.5 | Automated from OpenAPI spec |
| 4 | `components/FormModal.tsx` → MUI Dialog | 1 | Unblocks all screen modals |
| 5 | `components/LoginScreen.tsx` | 1 | Isolated, low risk |
| 6 | `screens/CustomerDirectoryScreen.tsx` | 3 | MUI + React Query + TypeScript |
| 7 | `screens/ProductCatalogScreen.tsx` | 3 | MUI + React Query + TypeScript |
| 8 | `DemoApp.tsx` | 3 | Shell, Drawer, AppBar, BottomNavigation |
| 9 | `screens/ProjectDirectoryScreen.tsx` | 3.5 | First DatePicker use |
| 10 | `screens/Customer360Screen.tsx` | 5.5 | Largest file — do last |
| **Total** | | **~23 days** | |

### Recommended execution approach

Rather than a single 23-day migration block:

1. Complete Steps 1–5 immediately (5 days) — infrastructure and shared components in place.
2. Begin Part 2 development in MUI + React Query + TypeScript from day one.
3. Migrate Part 1 screens (Steps 6–10) as they are naturally touched for Part 2 features or bug fixes. Each screen migration is self-contained and does not block other work.

This means no dedicated migration sprint is required. The migration completes as a by-product of Part 2 development.

---

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `Customer360Screen` regression during migration (10+ modals, 5 tabs) | High | Migrate one tab at a time; test each tab before moving to the next |
| MUI theme inconsistency if theme is set up incorrectly | Medium | Define and validate theme before migrating any screen |
| `openapi-typescript` types diverge from backend if re-run is forgotten | Medium | Add `generate:types` to the CI pipeline |
| ADR-030 always-mounted pattern interaction with React Query | Low | React Query cache persists across mounts natively; pattern still valid |

---

## 9. Cost of Not Migrating Now

If Parts 2–4 are built in the current stack before migrating:

- Each new screen adds another ~25-line custom cache implementation
- Each new form adds native `<select>` elements requiring future replacement
- TypeScript migration on a 3× larger codebase after Part 4 is a dedicated multi-week project
- Backend Pydantic model changes surface as runtime bugs rather than compile-time errors
- Estimated migration cost after Parts 2–4: **50–60 developer days** vs. 23 days today
