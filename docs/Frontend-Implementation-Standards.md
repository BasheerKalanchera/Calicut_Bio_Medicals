# Cabio Sales OS - Frontend Implementation Standards v2.0

**Based on:** Architecture Freeze v1.0, ADR-029, ADR-030, ADR-031, ADR-032, ADR-033, Customer Directory / Customer 360 implementation (June 2026), MUI + React Query + TypeScript migration reconciliation (July 3, 2026).

---

> ## Standard, as of 2026-07-03
> **MUI is the sole UI framework** (ADR-031). **TypeScript is required** for all new files (ADR-033). **TanStack React Query is required** for all data fetching and mutation — no manual `.then()` fetch chains, no module-level cache `Map` objects (ADR-032).
>
> **Tailwind CSS is prohibited in new components** and is being removed from the codebase file by file. Seven screens/components still use Tailwind and/or the pre-React-Query manual fetch pattern — see **[§9 Migration Tracking](#9-migration-tracking)** for the authoritative, per-file list and status. Do not treat a Tailwind `className` you find in an existing file as a pattern to copy — check §9 first. If the file is listed as pending, it is *known debt*, not the standard.
>
> This revision reconciles the doc with ADR-031/032/033 (accepted 2026-06-30, never reflected here until now — see the dated reconciliation note on ADR-031 in `docs/ADR.md`). Sections below that describe the pre-migration Tailwind/manual-fetch pattern are marked **Superseded**; they are kept only so pending files in §9 can be recognized for what they are.

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

List screens that are the parent in a list → detail navigation pair **must stay mounted** in the DOM. They are hidden via an MUI `sx` display toggle, not unmounted with `&&`.

**Required pattern — `DemoApp.tsx`:**
```tsx
{/* CustomerDirectory stays mounted — CSS hidden via sx display, never unmounted */}
<Box sx={{ flex: 1, overflow: "hidden", display: view === "customers" ? "flex" : "none", flexDirection: "column" }}>
  <CustomerDirectoryScreen onSelectAccount={handleSelectAccount} />
</Box>

{/* Detail screen mounts fresh on navigation, receives initialData */}
{view === "customer360" && selectedAccount && (
  <Customer360Screen
    accountId={selectedAccount.id}
    initialAccount={selectedAccount}
    onBack={handleBack360}
  />
)}
```

**Rationale:** Unmounting the list screen on navigation destroys scroll position, filter state, and in-flight data. Remounting triggers a full data refetch (even with a React Query cache hit, a remount still re-renders the entire list). The always-mounted pattern matches how iOS UINavigationController and Android back stack work — the parent stays in memory while the child is on screen.

**Rules:**
- Every list screen (Customer Directory, Coverage Plans, Opportunity Pipeline, Target Plans, etc.) must use this pattern.
- Detail screens (`Customer360Screen`, future detail screens) continue to conditionally mount/unmount. They receive `initialData` from the parent on mount so remount cost is negligible.
- Never use `key={selectedAccount?.id}` on a list screen to force remount — this defeats the purpose.
- **Superseded:** `DemoApp.jsx` no longer exists — the shell is `DemoApp.tsx`. The Tailwind `className` toggle shown in v1.0 (`` `${view === "x" ? "" : "hidden"}` ``) is prohibited in new code; `DemoApp.tsx` itself still uses it today and is tracked as pending in §9.

---

## 3. Data Fetching Architecture (React Query — ADR-032)

### 3.1 `useQuery` Per Resource — Required Pattern

Every independently-loaded piece of data on a screen gets its own `useQuery` call. Each call carries its own `data`/`isLoading`/`isError` — this replaces the v1.0 manual per-resource loading-flag pattern automatically; React Query does it natively, nothing to hand-roll.

**Required pattern — `OpportunityDetailScreen.tsx`:**
```tsx
function ProductsTab({ opportunityId }: { opportunityId: string }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ["opp-items", opportunityId],
    queryFn: () => listOpportunityItems(opportunityId),
  });
  // ...
}
```

**Rules:**
- `queryKey` is an array: a string tag plus every parameter the query depends on (e.g. `["opp-items", opportunityId]`). Two queries with different keys are cached independently.
- Independent `useQuery` calls on the same screen fire in parallel automatically — this is the point of Guiding Principle 3. There is no manual orchestration to write; do not wrap multiple `useQuery` calls in `Promise.all` or chain them, unless one query's `queryFn` genuinely needs another query's result (use `enabled: !!parentData` for that case only).
- Never reach for `useEffect` + `useState` + manual fetch for anything a `useQuery` call already covers.

### 3.2 `useMutation` + `invalidateQueries` — Required Pattern for Writes

**Required pattern — inline handler (`OpportunityDetailScreen.tsx`):**
```tsx
const queryClient = useQueryClient();
// ...
await updateOpportunityItems(opportunityId, payload);
await queryClient.invalidateQueries({ queryKey: ["opp-items", opportunityId] });
```

**Required pattern — `useMutation` (`NextActionsScreen.tsx`):**
```tsx
const completeMutation = useMutation({
  mutationFn: (id: string) => patchReminder(id, true),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
});
```

**Rules:**
- After any create/update/delete, invalidate every `queryKey` whose data the mutation could have changed. This replaces the v1.0 `entityListCache.clear()` call.
- Prefer `useMutation` when the write is triggered directly from a form/button. A plain `async` handler with `await ...; await queryClient.invalidateQueries(...)` is acceptable for inline tab-edit flows (see `OpportunityDetailScreen.tsx`) — both are current, real patterns in this codebase.

### 3.3 Fast Back-Navigation for Always-Mounted Lists

ADR-030 requires list screens to stay mounted so back-navigation is instant. React Query's cache (§4.1) already serves this: a `useQuery` call with the same `queryKey` returns cached data synchronously on re-render if within `staleTime` (30 s, configured once in `main.tsx`), with a silent background refetch. This replaces the v1.0 hand-rolled module-level `Map` cache (§4.1) entirely — **do not add a new one.**

If a future detail screen needs to seed a query from data the parent list already has (avoiding a loading flash on first navigate), use `useQuery`'s `initialData` option. **No screen in this codebase does this yet** — when one does, replace this paragraph with the verified pattern from that file rather than an invented example.

### 3.4 Per-Resource Loading Flags — Superseded

The v1.0 pattern below (one manual `useState(true)` per data section) is superseded. Every `useQuery` call already returns its own `isLoading` — do not add a parallel manual flag.

```jsx
// Superseded — do not write new code like this.
const [stakeholdersLoading, setStakeholdersLoading] = useState(true);
listStakeholders(accountId).then(setStakeholders).catch(() => {}).finally(() => setStakeholdersLoading(false));
```

---

## 4. Caching Architecture (React Query — ADR-032)

### 4.1 QueryClient Cache — Supersedes Manual SWR Cache

The v1.0 hand-rolled module-level SWR `Map` cache (shown below) is **prohibited in new code**. `QueryClientProvider` (configured once in `main.tsx`: `staleTime: 30_000`, `retry: 1`) is now the single cache layer for all list and detail data. Do not add a second cache on top of it.

```js
// Superseded — do not write new code like this. QueryClientProvider replaces this entirely.
const CACHE_TTL_MS = 30_000;
const entityListCache = new Map();
```

### 4.2 Lazy Batch Aggregate Counts (ADR-029)

The backend contract (§5) is unchanged — aggregate counts are still fetched via a dedicated batch endpoint after the list renders. The frontend implementation becomes a second, dependent `useQuery`:

```tsx
const { data: items } = useQuery({ queryKey: ["accounts", params], queryFn: () => listAccounts(params) });
const ids = items?.map((a) => a.id) ?? [];
const { data: counts } = useQuery({
  queryKey: ["account-counts", ids],
  queryFn: () => getAccountCounts(ids),
  enabled: ids.length > 0,
});
```

**No screen in this codebase implements this yet** — the three directory screens that use the counts pattern today (`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`, `ProjectDirectoryScreen.jsx`) are all pre-migration (§9). Verify this example against the real implementation the first time one of them migrates, and update it here.

**Rules (unchanged from v1.0):**
- The list screen never waits for counts before rendering. Counts show as `—` or `0` while loading and populate in the background.
- This pattern scales to 500+ accounts because the batch endpoint's cost is O(1 scan × N child tables) regardless of page size.

---

## 5. Backend Endpoint Contract for Lazy Counts

This section defines what the frontend expects from any batch counts endpoint. Backend engineers must satisfy this contract. Unaffected by the MUI/React Query/TypeScript migration.

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

### 6.1 `isMountedRef` Guard — Superseded by React Query

The v1.0 guard below is unnecessary for any fetch done via `useQuery`/`useMutation` — React Query already discards results from unmounted components internally. Only relevant if a screen still has a raw `useEffect` + manual fetch outside React Query, which should not occur in new code.

```jsx
// Superseded for React Query fetches — kept for historical reference only.
const isMountedRef = useRef(true);
useEffect(() => {
  isMountedRef.current = true;
  return () => { isMountedRef.current = false; };
}, []);
```

### 6.2 Form Modals

- Enter key in form modals must not submit the form. Add `onKeyDown` handling at the `<form>` element (see `FormModal.tsx`), not per-input.
- Modal `onSubmit` must throw to signal failure — `FormModal` catches the error and displays it via MUI `Alert`.
- Clear all form state fields before opening the modal (not after closing) so re-opening shows a blank form.

### 6.3 Optimistic Error Handling in Tab Sections

Tab fetches must never surface an error to the user. If a tab's `useQuery` fails, the tab renders empty (no data) rather than an error message. The overview/header section is the only place where a hard error state (with Retry button) is appropriate, and only when `initialData` was not provided.

### 6.4 MUI Styling — Reference Pattern (ADR-031)

`LoginScreen.tsx` and `FormModal.tsx` are the only two files in the codebase that are fully MUI-compliant — zero Tailwind. Use them as source of truth for "what correct looks like," not any Tailwind-styled screen you may come across (check §9 first).

```tsx
<Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
  <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth size="small" />
  <Button type="submit" variant="contained" fullWidth size="large">Sign In</Button>
</Box>
```

**Rules:**
- Style via the `sx` prop, not `className`. `className` should not appear anywhere in new component code.
- Reuse the theme (`src/theme/index.ts`) for brand color/radius rather than hardcoding hex values inline where the theme already defines them.
- Dialogs use MUI `Dialog` / `DialogTitle` / `DialogContent` / `DialogActions` (see `FormModal.tsx`) — do not hand-roll a modal with a Tailwind `fixed inset-0` overlay.

### 6.5 Status Colors (target — pending, see §9 migration)

Semantic status colors (success/warning/error/etc.) will be defined once in `src/theme/statusColors.ts` and imported, never hardcoded per file. The app's established hex values are authoritative, not MUI palette defaults. Until the migration completes, screens carry inline hex; the shared module is created as a single post-migration pass.

### 6.6 MUI Gotchas & Reusable Patterns (found during migration)

Things that behave differently from a native element or from older MUI docs/examples, discovered while migrating screens. Check this list before writing a new `TextField`, button-based card, scrollable pill/tab bar, or layout component. Items tied to a specific library version are marked — re-verify them after any MUI/React/TS upgrade.

1. **A `select` field defaulting to an empty value must show its placeholder text, not render blank.** MUI hides the selected text whenever the value is `""`, even if a matching `MenuItem value=""` exists with visible text (e.g. "All Owners", "Select account") — unlike a native `<select>`, which always shows it. Required fix for every such field: add `slotProps={{ select: { displayEmpty: true } }}`.
   - If the field's `MenuItem value=""` text already explains the field on its own (e.g. "Select account", "Me (default)"), **don't also give it a `label`** — a label plus `displayEmpty` overlap, because the label only auto-shrinks (moves out of the way, onto the border) when there's a value or focus, and `displayEmpty` shows text without either. Pick one: no label (placeholder text stands alone, as done in `OpportunityPipelineScreen.tsx`'s Owner filter and `LogActivityModal.tsx`'s Account/Assigned To/Next Action Owner fields), or keep the label and force it to sit shrunk regardless of value via `slotProps={{ inputLabel: { shrink: true } }}` alongside `displayEmpty`.
2. **A button containing several stacked lines of text needs `alignItems: "stretch"`.** MUI's button components (`Button`, `ButtonBase`) default to centering their contents horizontally. If you stack multiple full-width rows inside one (like a card built from a button), every row will shrink to its own width and center itself unless you override this.
3. **Scrolling the active pill/tab into view in a horizontally-scrolling bar is not automatic — copy the existing recipe.** `Customer360Screen.tsx`'s `handleTabChange` has a working version: give the scroll container a ref, tag each pill with a `data-*` attribute, look it up, compute its centered scroll position from `offsetLeft`/`offsetWidth`, and call `container.scrollTo(...)` inside a short `setTimeout`. Reuse this exact approach rather than writing new scroll logic per screen.
4. **Don't use MUI's `Stack` component.** It causes a TypeScript compile error in this project's specific combination of library versions (MUI 9.1.2 / React 19.2.5 / TS 6.0.3) — not a mistake in how it's used, just broken here. Use `Box` with flex `sx` properties instead, which is what every migrated file already does. *(Version-bound — recheck on upgrade.)*
5. **`InputLabelProps` no longer exists in this MUI version.** Older examples use it to control a field's label (e.g. keeping a datetime field's label shrunk). Use `slotProps={{ inputLabel: {...} }}` instead. *(Version-bound.)*
6. **Disabled contained-primary overrides need the `ownerState` function form.** This MUI version dropped the combined `containedPrimary` class key from `MuiButton` `styleOverrides`, so a theme-level rule for "disabled + contained + primary" (see `src/theme/index.ts`) has to be written as a function reading `ownerState.variant`/`ownerState.color`, not a static `containedPrimary` key. *(Version-bound.)*
7. **Circular back button: `IconButton` + `ArrowBackIcon` (not a chevron).** `ArrowBackIcon` is the platform-standard back affordance and reads correctly on mobile without a label; a chevron reads as collapse/previous, not navigate-back. Currently inlined in `OpportunityDetailScreen.tsx` (`sx={{ width: 40, height: 40, color: "#4b5563", "&:hover": { bgcolor: "#e5e7eb" } }}`, icon `sx={{ fontSize: 20 }}`) — but this identical control appears on all four 360/detail screens (Customer, Product, Opportunity, Project), which per §6.7's logic makes it an app-wide convention, not a per-file style choice. Extracting it into a shared `BackButton` component is banked (see `active_progress.md` Deferred section) rather than built now — inline it identically until then; do not re-derive the styling per file once it exists.

### 6.7 Theme is the source of truth for visual defaults

`src/theme/index.ts` is the single authoritative source for app-wide visual
defaults — input styling, button states, border radius, palette. Do not set
these per-component when the theme defines them; add or change them in the theme
so every screen inherits consistently.

- App-wide conventions (e.g. the `#f9fafb` input fill, disabled-button color)
  are theme defaults, never per-field props.
- Setting a visual default per-component is how conventions get applied to some
  screens and missed on others. If it should be true everywhere, it goes in the theme.

### 6.8 Migration fidelity — what to match, what to let go

When migrating a screen from Tailwind to MUI, fidelity means equivalent
**meaning, usability, accessibility, and app-wide conventions** — not
pixel-identical replication of the Tailwind version.

**Keep MUI's native version** (do not restore the Tailwind equivalent):
- Ripple on click (not `scale-[0.98]`)
- Focus via border-thicken (not a glow ring)
- `elevation` shadows (not exact `shadow-2xl` replication)
- `Alert` with its built-in icon (not a plain colored div)
- Neutral button shadow (not a colored glow)

**Restore the Tailwind behavior** only when it carried something MUI's default drops:
- Semantic HTML — real heading tags (`component="h1"`), etc.
- Usability — placeholders, readable disabled/loading states
- Accessibility
- Established app-wide conventions (the `#f9fafb` input fill)

**Tiebreaker:** match states the user actively watches (loading, error, focus).
Don't chase one-time decorations. When a gap fits none of these rules, flag it
for human review rather than guessing.

---

## 7. Service Layer (Frontend)

### 7.1 API Service Functions

All backend calls live in `sales-os-app/src/services/`. No direct `api.get(...)` calls inside components or screens.

- One file per domain: `accounts.ts`, `masterData.ts`, etc. — `.ts`, not `.js` (ADR-033).
- Each function is a named export, async, returns `response.data.data` (the inner `data` field from `APIResponse`), typed against `src/types/api.ts` (generated via `npm run generate:types`).
- No error handling inside service functions — errors propagate to the caller (a `useQuery`/`useMutation` `queryFn`/`mutationFn`, or a caught `await` in a handler).

### 7.2 Counts Endpoint Service Function Pattern

```ts
export async function getEntityCounts(ids: string[]): Promise<Record<string, { child_count: number }>> {
  const response = await api.get("/entities/counts", { params: { ids: ids.join(",") } });
  return response.data.data;
}
```

---

## 8. Checklist — New List → Detail Screen Pair

Use this checklist when implementing any new list screen + detail screen pair:

- [ ] File is `.tsx`/`.ts`, not `.jsx`/`.js` (ADR-033)
- [ ] No `className` prop used anywhere in the file — styling is via MUI `sx` (§6.4, ADR-031)
- [ ] List screen uses always-mounted `sx` display-toggle pattern in `DemoApp.tsx` (§2.1)
- [ ] All data fetching via `useQuery`; all writes via `useMutation` or `await` + `invalidateQueries` — no manual `.then()` fetch chains, no module-level cache (§3, §4.1, ADR-032)
- [ ] List screen passes full entity object (not just ID) to `onSelectEntity` callback
- [ ] List screen fires lazy batch counts fetch as a dependent `useQuery` after the list renders (§4.2)
- [ ] Detail screen accepts `initialData` prop; state initialised from it (§3.3)
- [ ] Backend has a `GET /entities/counts` endpoint satisfying the contract in §5 (ADR-029)
- [ ] Tab fetch errors swallowed silently — empty state, not error screen (§6.3)
- [ ] Form modals clear state on open, not on close (§6.2)

---

## 9. Migration Tracking

Authoritative, per-file status for the MUI + React Query + TypeScript migration (ADR-031/032/033). Update this table in the same commit that migrates a file. Do not mark a file "Migrated" until it has zero `className` usages, all data fetching is via React Query, and it is `.tsx`/`.ts`.

**These are not violations.** The banner above says Tailwind is prohibited *in new code* — every file listed below predates ADR-031/032/033 reconciliation (2026-07-03) and is grandfathered until converted. Converting a file off this list *is* the migration; a file sitting on this list is expected, tracked debt, not a rule someone broke. If banner and table ever seem to disagree, this paragraph governs: new/edited code follows the banner, files named here are pending by design until their row is deleted.

**Fully migrated (source of truth for new code):**

| File | Path |
|---|---|
| `LoginScreen.tsx` | `src/components/LoginScreen.tsx` |
| `FormModal.tsx` | `src/components/FormModal.tsx` |
| `main.tsx` | `src/main.tsx` |
| `ActivityTimeline.tsx` | `src/components/ActivityTimeline.tsx` |
| `NextActionsScreen.tsx` | `src/screens/NextActionsScreen.tsx` |
| `LogActivityModal.tsx` | `src/components/LogActivityModal.tsx` |
| `OpportunityPipelineScreen.tsx` | `src/screens/OpportunityPipelineScreen.tsx` |
| `QuickLeadModal.tsx` | `src/components/QuickLeadModal.tsx` |
| `OpportunityDetailScreen.tsx` | `src/screens/OpportunityDetailScreen.tsx` |

**Column legend — what a ✓ actually certifies** (added after `OpportunityDetailScreen.tsx`'s
Commit A/B split surfaced that these were asserting more than they checked):
- **Styling ✓** — zero Tailwind `className` in the file. Mechanically checked by `check-no-tailwind.js`.
- **React Query ✓** — zero manual `.then()` fetch chains; all data fetching via `useQuery`/`useMutation`.
  Self-reported today, not mechanically checked (see the enforcement-gap note in the Deferred section
  of `active_progress.md` — a grep-for-`.then(` guard is banked, not built).
  A row is not marked ✓ here until that's actually true — a file can be Styling ✓ while this column
  is still Pending.
- **TypeScript ✓** — file is `.tsx`/`.ts` and compiles under `tsc --noEmit`. Does **not** certify the
  absence of `any` — a file can be TypeScript ✓ and still be `any[]`-typed throughout. Called out
  explicitly per-row only when verified during that file's migration; unverified rows keep the bare ✓.

**Pending:**

| File | Path | Styling | React Query | TypeScript |
|---|---|---|---|---|
| `Customer360Screen.tsx` | `src/screens/` | Tailwind (pending) | Pending — manual `.then()` | ✓ |
| `DemoApp.tsx` | `src/` | Tailwind (pending) | N/A (shell, local state) | ✓ |
| `CustomerDirectoryScreen.jsx` | `src/screens/` | Tailwind (pending) | Pending — manual `.then()` + SWR cache | `.jsx` (pending) |
| `ProductCatalogScreen.jsx` | `src/screens/` | Tailwind (pending) | Pending — manual `.then()` + SWR cache | `.jsx` (pending) |
| `ProjectDirectoryScreen.jsx` | `src/screens/` | Tailwind (pending) | Pending — manual `.then()` + SWR cache | `.jsx` (pending) |
| `ErrorBoundary.jsx` | `src/components/` | Tailwind (pending) | N/A (no fetching) | `.jsx` (pending) |

**Out of scope — do not migrate:**

| File | Path | Reason |
|---|---|---|
| `App.jsx` | `src/App.jsx` | Prototype only, mounted at `/prototype`, mock data, not reachable by an authenticated user. Not part of the production app. |

**Totals:** 9 fully migrated · 6 pending · 1 explicitly out of scope.

`OpportunityDetailScreen.tsx` moved to the fully-migrated table above once its React Query commit
landed (all 6 manual `.then()` chains converted to `useQuery`, gated by `enabled` on the state that
used to trigger each fetch — `editing`/`showAdd`/`showEditOpp` — so behavior is unchanged, just
cached and parallelized). Its master-data lookups (stages/statuses/users/products/stakeholders) got
local stopgap types (`StageOption`/`StatusOption`/`UserOption`/`ProductOption`/`StakeholderOption`)
in place of `any[]`; the transient edit-buffer state (`editItems`/`editSplits`) and a few pre-existing
`as any` ID casts remain untyped — not a claim of "no `any` anywhere in the file."

### Post-migration cleanup (do this when the table above reaches 0 pending)

The "Superseded" code blocks left inline in §2.1, §3.4, §4.1, and §6.1 exist only so a pending file's old pattern is still recognizable during the migration. They are traceability aids with a deliberate expiry, not permanent documentation — once every file above is migrated:
- Delete every block and paragraph marked **Superseded** in this document (§2.1's `DemoApp.jsx` note, §3.4, §4.1's `Map` cache block, §6.1's `isMountedRef` block).
- Delete this Migration Tracking section (§9) entirely, or collapse it to a single line recording the migration's completion date.
- Bump the doc to v3.0 and drop the "Based on" line's migration-reconciliation mention — at that point MUI/React Query/TypeScript are just the standard, not a standard being migrated to.
- Remove the top banner's grandfathering language, since there will be nothing left to grandfather.

Leaving superseded content in place past this point is how the doc drifts back into the exact staleness this reconciliation was fixing — a doc with dead alternatives in it is noise a future session has to read past, not signal.
