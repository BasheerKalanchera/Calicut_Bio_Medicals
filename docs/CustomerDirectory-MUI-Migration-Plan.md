# CustomerDirectoryScreen MUI Migration — Implementation Plan

**Status:** Shipped, `59baa6b` (2026-08-11).
**Date:** 2026-08-11
**Prepared by:** Basheer Kalanchera (with Claude)
**Purpose:** Concrete migration plan for `CustomerDirectoryScreen.jsx`, one
of the 2 remaining files in `docs/Frontend-Implementation-Standards.md`
§9's pending list (the other is `ProjectDirectoryScreen.jsx`, out of
scope here). Follows the mandatory per-file ritual from `docs/Backlog.md`'s
MUI migration entry: convert → property-diff → triage (§6.8) → verify on
screen → guard-green → update §9 → commit.

---

## Context

`ProductCatalogScreen.tsx` (migrated 2026-08-07, `8f4526e`) is the closest
precedent — same "directory list screen with a create-modal and a
module-level SWR cache" shape. This plan follows its pattern directly
rather than inventing a new one: delete the module cache and
`isMountedRef` outright (superseded by React Query, not ported), convert
`.jsx` → `.tsx`, replace manual `.then()` chains with `useQuery`/
`useMutation`, Tailwind → MUI `sx`.

## Confirmed current state (verified directly against the codebase)

**File shape** (`sales-os-app/src/screens/CustomerDirectoryScreen.jsx`,
541 lines): module-level `accountListCache` (`Map`, 30s TTL,
stale-while-revalidate — lines 21-40), `isMountedRef` (lines 158-162),
two independent manual `.then()` chains:
1. Main list: `listAccounts(params)` → on success, `getAccountCounts(ids)`
   chained on the resolved ids (lines 189-221) — this is a genuine
   **dependent** fetch (counts needs this page's ids first), not
   parallelizable the way `ProductCatalogScreen`'s independent queries
   were — plan around this as a React Query dependent query (`enabled`
   gated on the list result), not force it into an independent-parallel
   shape that doesn't fit.
2. Parent-account search-as-you-type (lines 77-89), separately debounced
   (`debouncedParentSearch`), scoped to the create modal only.

**A real, pre-existing typing bug in `accounts.ts`, found during this
pass, not previously flagged:** every function in `sales-os-app/src/
services/accounts.ts` (`listAccounts`, `getAccountCounts`, `createAccount`,
etc.) types ids as `number` (`accountId: number`, `zone_id?: number`,
`ids: number[]`) and returns `Promise<unknown>`. **IDs in this system are
UUID strings, not numbers, everywhere else in the codebase** — this is
wrong today, just silently tolerated because nothing calling these
functions is typed strictly enough to catch it. Fixing this is in scope
for this migration (not deferred) since `CustomerDirectoryScreen.tsx`
becoming genuinely `TypeScript ✓` requires calling a correctly-typed
service, not perpetuating `Promise<unknown>` + wrong id types into a
freshly migrated file.

**No hand-written type aliases needed — unlike `ProductCatalogScreen`'s
migration, which needed 3.** `AccountListResponse`, `AccountResponse`,
and `AccountCountsEntry` all **already exist**, auto-generated in
`sales-os-app/src/types/api.ts` (lines ~1301, ~1350, ~1229) from the
backend's OpenAPI schema — `accounts.ts` just needs to import and use
them, not invent new ones.

**A real cross-file simplification, not just a same-file port — the
`accountUpdateRef` chain.** Today: `DemoApp.tsx` (line 84) owns
`customerAccountUpdateRef`, passes it into `CustomerDirectoryScreen` as
`accountUpdateRef` (line 425) and into `Customer360Screen` as
`onAccountUpdate={(a) => customerAccountUpdateRef.current?.(a)}` (line
448). `Customer360Screen.tsx`'s `handleUpdateAccount` (confirmed calls
this prop after its own `queryClient.invalidateQueries({queryKey:
["account", accountId]})`) round-trips an edited account back through this
ref chain into `CustomerDirectoryScreen.jsx`'s manual cache-patch (lines
124-134) — the only way today's Directory list picks up an edit made from
Customer 360 without a hard refresh. **Once the Directory list is a React
Query cache instead of a module-level `Map`, this whole ref chain becomes
unnecessary** — `Customer360Screen.tsx`'s `handleUpdateAccount` should
instead call `queryClient.invalidateQueries({queryKey: ["accounts",
"list"]})`, the same pattern already used everywhere else in that file for
keeping related caches in sync (projects, stakeholders, opportunities).
**This deletes real code in two other files** (`DemoApp.tsx`'s
`customerAccountUpdateRef` and the `onAccountUpdate` prop wiring;
`Customer360Screen.tsx`'s prop call) — flag this explicitly as
cross-file scope, not contained to the one file being migrated.

**`openCreateRef` is a different, unrelated mechanism — no change
needed.** It's a parent-triggered "open the create modal" call (a global
`+Customer` button in `DemoApp.tsx` invoking a child's modal), not a
cache-sync mechanism. Stays exactly as-is.

**The zone-filter `Button`+`Menu` (lines 270-288) is already MUI** —
`Button`, `Menu`, `MenuItem` are already imported from `@mui/material` and
used correctly. Not Tailwind, needs no conversion, just carries over
unchanged.

**What genuinely needs Tailwind→MUI conversion**: the search input (lines
245-269, raw `<input>`), the account list rows and their status chips
(lines 320-380, raw `<div>`s with color-coded badges for zone/parent/
payer_behavior/customer_type), pagination controls (lines 393-414), and
the entire create-modal body (lines 427-537 — raw `<input>`/`<select>`/
`<label>` inside the already-MUI `FormModal`). **Direct precedent
available for the Zone field specifically**: `Customer360Screen.tsx`'s own
account-edit form (lines 1317-1324) already has a `TextField select` for
this exact same field on this exact same entity — reuse that shape
verbatim, don't invent a new one.

**Parent-account search dropdown** (lines 457-501, a hand-rolled
absolute-positioned results list) — convert to MUI `Autocomplete`, not a
custom dropdown; this codebase already uses `Autocomplete` for other
search-as-you-type pickers elsewhere (confirm the exact precedent
component at build time before reinventing the interaction).

**`useDebouncedValue`** (`hooks/useDebouncedValue.ts`) — plain hook, no
MUI/React Query dependency, reused as-is for both `debouncedSearch` and
`debouncedParentSearch`.

**`check-no-tailwind.js`'s `GRANDFATHERED` set** (line 10) has
`"screens/CustomerDirectoryScreen.jsx"` — remove this line in the same
commit once the file has zero Tailwind `className` usages, per the
established convention (the guard script itself explains this at its own
line ~108).

## Implementation steps

### 1. `accounts.ts` — fix typing (real bug, not a stylistic nice-to-have)

- Change every `number`-typed id param (`accountId`, `zone_id`, `ids:
  number[]`) to `string`/`string[]` — these are UUIDs.
- Type `listAccounts`'s return as `Promise<{ items: AccountListResponse[];
  total: number; page: number; page_size: number; total_pages: number }>`
  (confirm the exact `PaginatedResponse` shape against `types/api.ts`'s
  `PaginatedResponse_AccountListResponse_`, don't hand-guess the field
  names).
- Type `getAccount`/`createAccount` as `Promise<AccountResponse>`.
- Type `getAccountCounts` as `Promise<Record<string, AccountCountsEntry>>`.
- Leave every other function in this file (opportunities, projects,
  stakeholders, installed assets) untouched — same pre-existing `number`/
  `unknown` issue, but out of scope for this migration (owned by whichever
  screen touches those next, per the Backlog.md item this bug feeds).

### 2. `CustomerDirectoryScreen.jsx` → `.tsx`

- Delete `accountListCache`, `getCacheKey`/`getCached`/`setCache`,
  `CACHE_TTL_MS`, and `isMountedRef` outright — not ported, superseded by
  React Query's own cache/staleness (same treatment `ProductCatalogScreen`
  got).
- **List query**:
  ```ts
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["accounts", "list", { search: debouncedSearch, zone_id: zoneFilter, page }],
    queryFn: () => listAccounts({ search: debouncedSearch || undefined, zone_id: zoneFilter || undefined, page, page_size: pageSize }),
  });
  const accounts = data?.items ?? [];
  const total = data?.total ?? 0;
  ```
- **Counts, as a dependent query** (not parallel — genuinely needs
  `accounts`' resolved ids first):
  ```ts
  const ids = accounts.map((a) => a.id);
  const { data: counts } = useQuery({
    queryKey: ["accounts", "counts", ids],
    queryFn: () => getAccountCounts(ids),
    enabled: ids.length > 0,
  });
  const rows = accounts.map((a) => ({ ...a, ...(counts?.[a.id] ?? {}) }));
  ```
  This naturally reproduces today's "list renders immediately, counts
  fill in a beat later" behavior without the manual two-step `.then()`
  chain or the background-refresh-holds-until-counts-arrive logic (lines
  193-221) — React Query's own per-query loading states replace that
  hand-rolled coordination.
- **Zones** (filter menu + create-modal dropdown):
  ```ts
  const { data: zones = [] } = useQuery({ queryKey: ["zones"], queryFn: listZones, staleTime: Infinity });
  ```
  Replaces `ensureZonesLoaded()`/`zones` state/the lazy-load-on-open
  guard entirely — React Query's own caching makes "fetch once, reuse
  everywhere" automatic, no hand-rolled guard needed.
- **Parent-account search** (create modal only):
  ```ts
  const { data: parentOptions = [] } = useQuery({
    queryKey: ["accounts", "parent-search", debouncedParentSearch],
    queryFn: () => listAccounts({ search: debouncedParentSearch, page_size: 8 }),
    enabled: showCreateModal && !formParentAccount && debouncedParentSearch.trim().length > 0,
    select: (d) => d.items,
  });
  ```
- **Create**: `useMutation({ mutationFn: createAccount, onSuccess: () =>
  { queryClient.invalidateQueries({ queryKey: ["accounts", "list"] });
  ... } })` — preserve the existing parent-account cache invalidation
  (`["account", formParentAccount.id]`) alongside it, same as today.
- Tailwind → MUI per the file-by-file conversions listed in "Confirmed
  current state" above — `TextField` for search, MUI `Box`/`Card`-based
  list rows (or reuse whatever row-shell component the app's other
  migrated directory-style lists already settled on — check
  `ProductCatalogScreen.tsx`'s own row markup first rather than inventing
  a fourth shape), `Chip` components for the zone/parent/payer_behavior/
  customer_type badges (color-coded via `sx`, matching §6.7's theme-token
  conventions, not hardcoded hex — flag any hardcoded hex found as a §6.7
  gap per `docs/Backlog.md`'s existing enforcement-gap note, don't
  silently carry it forward), MUI `Pagination` or the same manual
  Prev/Next button pattern already used elsewhere (check
  `OpportunityPipelineScreen.tsx`/`ProductCatalogScreen.tsx` for the
  established precedent, stay consistent rather than picking a third
  approach).
- Convert the create-modal body to `TextField`/`MenuItem`s inside the
  existing `FormModal`, reusing `Customer360Screen.tsx`'s Zone field
  shape (§6.8: this is "established app-wide convention," restore it, not
  MUI's bare default). Parent-account field becomes an `Autocomplete`.

### 3. `Customer360Screen.tsx` — replace the ref-chain with invalidation

In `handleUpdateAccount`, add
`queryClient.invalidateQueries({ queryKey: ["accounts", "list"] })`
alongside the existing `["account", accountId]` invalidation. Remove the
`onAccountUpdate` prop entirely (component signature + the one call site).

### 4. `DemoApp.tsx` — remove the now-dead ref wiring

Delete `customerAccountUpdateRef` (line 84), the `accountUpdateRef={...}`
prop passed to `CustomerDirectoryScreen` (line 425), and the
`onAccountUpdate={...}` prop passed to `Customer360Screen` (line 448).
**Leave `openCreateRef`/`customerCreateRef` untouched** — unrelated
mechanism (see "Confirmed current state" above).

### 5. Property-diff (mandatory, per the established ritual)

Full before/after comparison table against this file's pre-migration git
history — every visible behavior preserved: search debounce timing, zone
filter (including "All Zones" default), pagination, the exact empty-state
copy for search-vs-no-results, error+retry, all four badge types and
their color coding, create-modal validation (name + zone required,
inline `throw new Error(...)` messages), parent-account inline search
UX. Categorize any gap using §6.8: keep MUI's native ripple/focus/
elevation/Alert-icon over the Tailwind original; restore only what
carried real meaning (semantic HTML, usability, accessibility, the
`#f9fafb` input-fill convention). Evidence table, not a summary — same
standard as every prior migration in this backlog.

### 6. Guard-green

`npm run lint` clean, `npx tsc --noEmit` clean (this is the only thing
that type-checks `.tsx` files at all in this repo — `eslint.config.js`
has no `.tsx` glob).

### 7. Update tracking docs, same commit

- `docs/Frontend-Implementation-Standards.md` §9: move
  `CustomerDirectoryScreen.jsx`/`.tsx` from Pending to Fully migrated,
  with an honest per-column note (Styling ✓, React Query ✓, TypeScript ✓
  — and explicitly note the `accounts.ts` typing fix and the
  `accountUpdateRef` removal, matching how the `ProductCatalogScreen` row
  documented its own scope/decisions).
- `sales-os-app/scripts/check-no-tailwind.js`: remove
  `"screens/CustomerDirectoryScreen.jsx"` from `GRANDFATHERED`.
- `docs/Backlog.md`: while here, correct the stale MUI-migration section
  header that still lists `ProductCatalogScreen.jsx` as pending — it was
  migrated 2026-08-07 (`8f4526e`) and this was never reflected there.

## Ordering

`accounts.ts` typing fix (1) → screen conversion (2) → cross-file ref
cleanup (3, 4) → manual verification against the property-diff (5) →
guard-green (6) → tracking docs (7) → commit.

### Critical files
- sales-os-app/src/services/accounts.ts
- sales-os-app/src/screens/CustomerDirectoryScreen.jsx → .tsx
- sales-os-app/src/screens/Customer360Screen.tsx
- sales-os-app/src/DemoApp.tsx
- sales-os-app/scripts/check-no-tailwind.js
- docs/Frontend-Implementation-Standards.md
- docs/Backlog.md
