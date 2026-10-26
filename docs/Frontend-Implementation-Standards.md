# Cabio Sales OS - Frontend Implementation Standards v3.0

**Based on:** Architecture Freeze v1.0, ADR-029, ADR-030, ADR-031, ADR-032, ADR-033, Customer Directory / Customer 360 implementation (June 2026).

---

> ## Standard, as of 2026-08-18
> **MUI is the sole UI framework** (ADR-031). **TypeScript is required** for all files (ADR-033). **TanStack React Query is required** for all data fetching and mutation — no manual `.then()` fetch chains, no module-level cache `Map` objects (ADR-032). **Tailwind CSS is prohibited.**
>
> The codebase-wide migration to this standard completed 2026-08-18 — every screen and component now conforms. Full migration history (per-file conversion notes, decisions, bugs found) is preserved in `docs/Progress-Archive-2026-08.md`, not here; this document describes only the current standard.

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

ADR-030 requires list screens to stay mounted so back-navigation is instant. React Query's cache (§4.1) already serves this: a `useQuery` call with the same `queryKey` returns cached data synchronously on re-render if within `staleTime` (30 s, configured once in `main.tsx`), with a silent background refetch. A hand-rolled module-level `Map` cache (§4.1) is not needed for this — **do not add one.**

If a future detail screen needs to seed a query from data the parent list already has (avoiding a loading flash on first navigate), use `useQuery`'s `initialData` option. **First implemented in `Customer360Screen.tsx`** (`initialAccount` prop → the account query's `initialData`) — Directory-list navigation seeds it from already-fetched row data; Parent/Child account links currently only have a minimal `{id, name}` to seed with (see the `Backlog.md` item on richer parent/child `initialData` if that gap is ever closed).

The ref-guarded seeding subtlety this pattern needs when the seed data is a *draft buffer*, not a direct render of query data: seed it in a `useEffect` guarded by a ref (seed once per record id, reset the guard on close) rather than directly, when the seed query is only fetched on demand and isn't available the instant the modal opens. (The original example, `Customer360Screen.tsx`'s Edit Opportunity modal, was removed in the 2026-10-03 UAT hotfix — editing an Opportunity now happens only on `OpportunityDetailScreen.tsx`.)

**Query-key reuse across screens** (avoid duplicate fetches for the same data — same principle `OpportunityDetailScreen.tsx`'s Commit B applies to stages/statuses/users):

| Data | `queryKey` | Shared with |
|---|---|---|
| Account | `["account", accountId]` | — (screen-local) |
| Account counts | `["account-counts", accountId]` | — |
| Stakeholders (tab) | `["stakeholders", "byAccount", accountId]` | `OpportunityDetailScreen.tsx`'s stakeholder-link picker |
| Projects (tab) | `["projects", "byAccount", accountId]` | `QuickLeadModal.tsx`'s project picker |
| Opportunities (tab) | `["opportunities", "byAccount", accountId]` | — |
| Installed assets (tab) | `["installed-assets", "byAccount", accountId]` | — |
| Zones | `["zones"]`, `staleTime: Infinity` | — |
| Project statuses | `["project-statuses"]`, `staleTime: Infinity` | — |
| Stages / Opp statuses / Lead sources | `["stages"]` / `["statuses"]` / `["leadSources"]`, `staleTime: Infinity` | `OpportunityDetailScreen.tsx`, `OpportunityPipelineScreen.tsx`, `QuickLeadModal.tsx` |
| Hold / Loss reasons | `["holdReasons"]` / `["lossReasons"]`, `staleTime: Infinity` | `OpportunityDetailScreen.tsx` (both screens' Edit Opportunity modal + Overview display) |
| Opportunity Owner picker (tier-scoped) | `["users", "all"]` | `QuickLeadModal.tsx`, `OpportunityDetailScreen.tsx`'s Edit Opportunity modal, `OpportunityPipelineScreen.tsx`'s owner filter. `Customer360Screen.tsx` and `ProjectDirectoryScreen.tsx` read the same key only for their project create/edit forms (their own Opportunity create forms were removed 2026-10-14, §6.2) |
| Split participant picker (`scope=sbu`, BR-FIN-06) | `["users", "sbu"]` | `OpportunityDetailScreen.tsx`'s Splits tab |
| Next Action assignee picker (`scope=all`, BR-ACT-06) | `["users", "assignable"]` | `LogActivityModal.tsx` |
| Products | `["products", "picker", sbuId]` | `QuickLeadModal.tsx`, `OpportunityDetailScreen.tsx` |
| Opportunity items | `["opp-items", <opportunityId>]` | `OpportunityDetailScreen.tsx`'s Products tab, same opportunity |

**Caution:** the three `users` keys above return different data depending on `scope` (see `GET /users?scope=` in `API-Catalog.md`) — never reuse one of these three keys for a picker with different eligibility needs than the one it was introduced for, even if it seems convenient. That exact collision (all pickers sharing one `["users", "all"]` key despite needing different scopes) was a real regression, fixed 2026-07-30.

---

## 4. Caching Architecture (React Query — ADR-032)

### 4.1 QueryClient Cache

`QueryClientProvider` (configured once in `main.tsx`: `staleTime: 30_000`, `retry: 1`) is the single cache layer for all list and detail data. A hand-rolled module-level cache (a `Map` with a manual TTL) is prohibited — do not add a second cache on top of `QueryClientProvider`.

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

Verified against the real implementation in `ProductCatalogScreen.tsx` and `CustomerDirectoryScreen.tsx` — both match this shape exactly, including `enabled: ids.length > 0` gating the dependent query.

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

### 6.1 Pinned Search/Filter Bar (added 2026-09-30)

Every list or dashboard screen keeps its search box, filters and period/SBU
pickers fixed at the top; only the content below scrolls. Reference:
`CustomerDirectoryScreen.tsx`.

- Outer `Box`: `height: "100%"` (or `flex: 1`), `display: "flex"`,
  `flexDirection: "column"`, `overflow: "hidden"`.
- Filter bar `Box`: `flexShrink: 0`.
- Content `Box`: `flex: 1`, `overflowY: "auto"`, `minHeight: 0` (without
  `minHeight: 0` the flex child grows instead of scrolling).
- A long table inside the content box also gets `<Table stickyHeader>` so
  its column headings stay visible.
- Never put `overflow: "auto"` on the outer `Box` — the filters then scroll
  away with the list (Rate Hospitals, Target & Coverage Planning and Brand
  Target Tracking all shipped this way; fixed 2026-09-30).

### 6.2 Form Modals

- Enter key in form modals must not submit the form. Add `onKeyDown` handling at the `<form>` element (see `FormModal.tsx`), not per-input.
- Modal `onSubmit` must throw to signal failure — `FormModal` catches the error and displays it via MUI `Alert`.
- Clear all form state fields before opening the modal (not after closing) so re-opening shows a blank form.
- **One Opportunity create form (D12, built 2026-10-14).** Every way of
  creating an Opportunity opens `QuickLeadModal.tsx`; no screen keeps its
  own inline create form. Opened from a hospital or project page, it gets
  `lockAccount` / `lockProject`, so that hospital (and project) shows as a
  fixed name. Today's callers: top-bar "+ Lead" (`DemoApp.tsx`), Customer
  360's Opportunities tab, the Project Directory, and Marketing Lead
  "Convert" (`MarketingLeadReviewQueueScreen.tsx`). A new create rule goes
  into this one form only. Origin:
  `docs/Win-Probability-Rule-and-One-Create-Form-Implementation-Plan.md`.

### 6.3 Optimistic Error Handling in Tab Sections

Tab fetches must never surface an error to the user. If a tab's `useQuery` fails, the tab renders empty (no data) rather than an error message. The overview/header section is the only place where a hard error state (with Retry button) is appropriate, and only when `initialData` was not provided.

### 6.4 MUI Styling — Reference Pattern (ADR-031)

`LoginScreen.tsx` and `FormModal.tsx` are the smallest, clearest reference examples of a fully MUI-compliant file — zero Tailwind. Use them as source of truth for "what correct looks like."

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

### 6.5 Status Colors (target — not yet built)

Semantic status colors (success/warning/error/etc.) will be defined once in `src/theme/statusColors.ts` and imported, never hardcoded per file. The app's established hex values are authoritative, not MUI palette defaults. Screens currently carry inline hex; consolidating them into the shared module is a tracked Backlog item (`docs/Backlog.md`), not yet done.

### 6.6 MUI Gotchas & Reusable Patterns (found during migration)

Things that behave differently from a native element or from older MUI docs/examples, discovered while migrating screens. Check this list before writing a new `TextField`, button-based card, scrollable pill/tab bar, or layout component. Items tied to a specific library version are marked — re-verify them after any MUI/React/TS upgrade.

1. **A `select` field defaulting to an empty value must show its placeholder text, not render blank.** MUI hides the selected text whenever the value is `""`, even if a matching `MenuItem value=""` exists with visible text (e.g. "All Owners", "Select account") — unlike a native `<select>`, which always shows it. Required fix for every such field: add `slotProps={{ select: { displayEmpty: true } }}`.
   - If the field's `MenuItem value=""` text already explains the field on its own (e.g. "Select account", "Me (default)"), **don't also give it a `label`** — a label plus `displayEmpty` overlap, because the label only auto-shrinks (moves out of the way, onto the border) when there's a value or focus, and `displayEmpty` shows text without either. Pick one: no label (placeholder text stands alone, as done in `OpportunityPipelineScreen.tsx`'s Owner filter and `LogActivityModal.tsx`'s Account/Assigned To/Next Action Owner fields), or keep the label and force it to sit shrunk regardless of value via `slotProps={{ inputLabel: { shrink: true } }}` alongside `displayEmpty`.
2. **A button containing several stacked lines of text needs `alignItems: "stretch"`.** MUI's button components (`Button`, `ButtonBase`) default to centering their contents horizontally. If you stack multiple full-width rows inside one (like a card built from a button), every row will shrink to its own width and center itself unless you override this.
   - The same default hits a **single label that wraps onto two lines**: `justifyContent: "flex-start"` only moves the text block left; the wrapped lines inside it are still centred. Any left-aligned button whose label could wrap (menu items, list-row buttons) also needs `textAlign: "left"`. Found 2026-09-30 on the side menu's "Target & Coverage Planning" (`DemoApp.tsx`).
3. **Scrolling the active pill/tab into view in a horizontally-scrolling bar is not automatic — copy the existing recipe.** `Customer360Screen.tsx`'s `handleTabChange` has a working version: give the scroll container a ref, tag each pill with a `data-*` attribute, look it up, compute its centered scroll position from `offsetLeft`/`offsetWidth`, and call `container.scrollTo(...)` inside a short `setTimeout`. Reuse this exact approach rather than writing new scroll logic per screen.
4. **Don't use MUI's `Stack` component.** It causes a TypeScript compile error in this project's specific combination of library versions (MUI 9.1.2 / React 19.2.5 / TS 6.0.3) — not a mistake in how it's used, just broken here. Use `Box` with flex `sx` properties instead, which is what every migrated file already does. *(Version-bound — recheck on upgrade.)*
5. **`InputLabelProps` no longer exists in this MUI version.** Older examples use it to control a field's label (e.g. keeping a datetime field's label shrunk). Use `slotProps={{ inputLabel: {...} }}` instead. *(Version-bound.)*
6. **Disabled contained-primary overrides need the `ownerState` function form.** This MUI version dropped the combined `containedPrimary` class key from `MuiButton` `styleOverrides`, so a theme-level rule for "disabled + contained + primary" (see `src/theme/index.ts`) has to be written as a function reading `ownerState.variant`/`ownerState.color`, not a static `containedPrimary` key. *(Version-bound.)*
7. **Circular back button: `IconButton` + `ArrowBackIcon` (not a chevron).** `ArrowBackIcon` is the platform-standard back affordance and reads correctly on mobile without a label; a chevron reads as collapse/previous, not navigate-back. Currently inlined in `OpportunityDetailScreen.tsx` (`sx={{ width: 40, height: 40, color: "#4b5563", "&:hover": { bgcolor: "#e5e7eb" } }}`, icon `sx={{ fontSize: 20 }}`) — but this identical control appears on all four 360/detail screens (Customer, Product, Opportunity, Project), which per §6.7's logic makes it an app-wide convention, not a per-file style choice. Extracting it into a shared `BackButton` component is banked (see `docs/Backlog.md`) rather than built now — inline it identically until then; do not re-derive the styling per file once it exists.
8. **Tailwind responsive prefixes (`sm:hidden`, `hidden sm:block`) become `sx`'s breakpoint-object syntax**, e.g. `sx={{ display: { xs: "none", sm: "block" } }}` — not a media-query string. First needed in `DemoApp.tsx` (Sign Out label/icon swap, the "Sales OS" header title). For a one-off custom breakpoint that isn't one of MUI's standard values (e.g. the 896px width `DemoApp.tsx`'s sidebar centers under, matching the app shell's `max-w-4xl`/56rem), fall back to a literal `"@media (min-width:896px)": { ... }` key inside `sx` instead of `theme.breakpoints`.
9. **An outlined field with a label needs room above it at the top of a scrolling area.** The label sits on the field's top border, about half of it above the box. When the field is the first thing inside a container that scrolls (`overflowY: "auto"`) or hides overflow, and that container has no top padding, the top of the label is cut off. Give the field `mt: 1` (or give the container top padding). Found 2026-10-24 on Target & Coverage Planning's SBU picker, which Admin and GM see first (`TargetPlanningScreen.tsx`, Annual Target E2E step C7).
10. **A table on a card must fit a phone screen.** How: §6.11 (tables become cards through the shared table-or-cards component; the hand-written stacking CSS in `src/theme/phoneTable.ts` is retired, 2026-10-26). This is a phone app (PWA): every screen is built to fit a phone from the start, not fixed afterwards. Each plan says how each screen it adds or changes looks on a phone ("On a phone" in the plan template), Claude checks each one at phone width before handing the build over (`cabio-e2e-testing` skill), and every E2E test plan has a `[Complex: phone layout]` step per screen (refused on save without one). Found seven times in four days (22–25 Oct 2026), the last four also on 25 Oct: Brand Target Tracking's opened row at Annual Target E2E step P6 (`19c2593`), Target & Coverage Planning's Team Plans still too wide on UAT, Rate Hospitals' table (found by a code scan the same evening), and Brand Target Tracking's brand row itself — the P6 fix covered only the opened quarters and was not measured across the whole card. When stacking rows on a phone, keep any indent that shows who reports to whom. Earlier finds: Brand Target Tracking's "Set target" (`c2f025d`, 2026-10-23), Target & Coverage Planning's Needs Your Approval and Team Plans cards, and Insights Dashboard Target vs Actuals' person rows (both 2026-10-24, Annual Target E2E sections F–G).

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

### 6.9 Common Opportunity filter (decided 2026-10-01, not yet built)

Any screen that filters or totals Opportunities (Pipeline list/Kanban,
Insights, Pipeline/Sales/Product Performance reports, drill-down lists) uses
the one shared Opportunity filter bar and passes its values unchanged to the
server. Never build a screen's own filter boxes or date logic, even when
it would be quicker: the Opportunity edit form copied four times (2026-09-30) is
what this prevents. Period picks follow the forecast decisions: a dropdown
with FY quarters (2026-Q3 = Oct–Dec) and a custom from/to range. Built
first for the forecast-by-closing-period work
(`docs/Discussion-Forecast-By-Closing-Period-2026-09.md`); existing screens
move over when next touched (Backlog "Move remaining Opportunity screens to
the common filter"). Server half: Backend standards, "Filtering Standards".

### 6.10 Words: "target" vs "plan" (decided 2026-10-09, built 2026-10-14)

**Target** means only a figure set from the top: a brand's target (Brand
Target Tracking), the SBU target (its brands' total), or a person's
quarterly target set by the person they report to ("Your target", "Team
Targets"; Annual Target Planning, 2026-10-21). **Plan** means a rep's own
bottom-up figure, built from their hospitals ("My Plan", "Team Plans",
"Plan total", "Last approved plan", "Approve Vivek's plan?"). Any new
label, message or help text follows this, including server refusal
messages. Names that hold both keep "Target": the menu "Target & Coverage
Planning". (The heading "SBU Target & Plans" was split into the "SBU
Target", "Team Targets" and "Team Plans" cards, Annual Target Planning
D75, 2026-10-23.) Code identifiers (`target_plan`,
`target_amount_lakhs`) are not renamed. Origin:
`docs/Rep-Plan-Wording-Implementation-Plan.md`.

### 6.11 Phone, tablet and laptop — the MUI way (decided 2026-10-26)

Applies to every commit that changes a screen, from 2026-10-26; the whole
changed file must follow it, not just the changed lines. Rules a machine
can spot are enforced by `npm run lint`; the rest are checked at the
pre-E2E code review; layout is checked in E2E. Urgent bug fixes are
exempt until 1 Nov 2026. Origin:
`docs/MUI-Good-Practice-Implementation-Plan.md`.

1. **Widths.** Phone is below 600 px (`theme.breakpoints.down("sm")`, or
   `xs` in `sx`) — Google's Material Design width classes put 99.96 % of
   upright phones under 600; anything wider uses the laptop layout. Each
   changed screen is checked at 390, 768 and 1280 px.
2. **Tables on a phone become cards.** Every table uses the shared
   table-or-cards component, however few columns it has, so a table that
   grows later still turns into cards on a phone (Basheer, 2026-10-26: no
   exceptions). Never reshape a table with CSS (no `display: block` on
   rows, `data-label`, hiding classes, or MUI internal class names).
3. **Pop-up forms always use `FormModal`**, which fills the screen on a
   phone. A separate `Dialog` is only for a short confirmation, message
   or list, and stays a floating box on a phone.
4. **Colours come from the theme**: `theme.palette`, `statusColors.ts`,
   or theme shorthands in `sx` (`"text.secondary"`, `"divider"`,
   `"background.paper"`). Never hex in a screen.
5. **Text and icon sizes come from the theme.** Text uses Typography
   `variant`, never a typed `fontSize`; icons use
   `fontSize="small" | "medium" | "inherit"`.
6. **Styling goes through `sx` only**; no `className`.
7. **Filters and search boxes.** Every filter has its name above it
   ("Zone"), with "All …" inside the box (`displayEmpty`, §6.6 item 1).
   A search box starts with a magnifying glass and gets an ✕ clear
   button once typed in.

---

## 7. Service Layer (Frontend)

### 7.1 API Service Functions

All backend calls live in `sales-os-app/src/services/`. No direct `api.get(...)` calls inside components or screens.

- One file per domain: `accounts.ts`, `masterData.ts`, etc. — `.ts`, not `.js` (ADR-033).
- Each function is a named export, async, returns `response.data.data` (the inner `data` field from `APIResponse`), typed against `src/types/api.ts` (generated via `npm run generate:types`).
  - **When:** in the same commit as any change under `backend/app/`. The command builds from the backend code on disk (`scripts/export_openapi.py` → `sales-os-app/scripts/generate-types.js`), so no running server is needed; it works the same in a git worktree. `.githooks/check-api-types.sh` refuses a commit whose staged backend doesn't match its staged `api.ts`, comparing against the commit's staged copy so another session's uncommitted changes never count; `sh .githooks/check-api-types.sh --write` writes and stages the matching file (Basheer, 2026-10-20: refuse, not warn; staged copy). It runs from `.githooks/pre-commit` (on since 2026-10-20), in every worktree.
- No error handling inside service functions — errors propagate to the caller (a `useQuery`/`useMutation` `queryFn`/`mutationFn`, or a caught `await` in a handler).
- **Named type imports come from `src/types/api-aliases.ts`, never directly from `src/types/api.ts`.** `api.ts` is fully overwritten by `npm run generate:types` (raw `openapi-typescript` output — no named exports, only the `components`/`operations` structure). `api-aliases.ts` is a small hand-maintained file, untouched by that command, holding `export type X = components["schemas"]["X"];` for every schema the app needs a plain name for. When a new endpoint/schema needs a named type, add the alias there (not in `api.ts`) and import from `"../types/api-aliases"`. This used to be a comment at the bottom of `api.ts` warning "re-add these after a regen" — that comment itself got wiped by the next regen, so the aliases kept vanishing. Splitting the file removed the failure mode instead of relying on someone remembering.
  - Enforced by lint, not just convention: `eslint.config.js`'s `no-restricted-imports` rule fails `npm run lint` on any `**/types/api` import outside `api-aliases.ts` itself. (2026-08-24: turning this on required first adding `.ts`/`.tsx` coverage to ESLint at all — see "TypeScript Lint Coverage" below.)

### 7.1a TypeScript Lint Coverage (added 2026-08-24)

`eslint.config.js` previously had no `files` block matching `.ts`/`.tsx` at all — on a directory-wide `eslint .` run, ESLint silently skips unmatched files (no warning), so essentially the entire app (ADR-033: `.ts`/`.tsx`, not `.js`/`.jsx`) was never actually linted, despite `npm run lint` reporting success. `typescript-eslint` is now installed and configured with its own `**/*.{ts,tsx}` block (`react-hooks`/`react-refresh` apply here too now).

Turning this on for the first time surfaced 228 pre-existing findings across the app (213 `@typescript-eslint/no-explicit-any`, 6 `react-hooks/refs`, 4 `react-hooks/set-state-in-effect`, 3 `react-refresh/only-export-components`, 1 `no-empty` in `OpportunityDetailScreen.tsx`). None were fixed as part of adding the linter that same day — deliberately deferred rather than rushed right before the UAT sign-off window.

**Update (2026-08-24, once the sign-off window passed):** `react-hooks/refs` (6), `react-hooks/set-state-in-effect` (grew to 10 once the full app was scanned, not just the original 4), and `no-empty` (1) were closed out:
- `no-empty` (`OpportunityDetailScreen.tsx`'s `handleUnlink`): was silently swallowing errors when removing a stakeholder link. Fixed for real — now surfaces the failure via the same `linkError`/`<Alert>` pattern `handleLink` already uses.
- `react-hooks/refs` (6, across `DemoApp.tsx`, `CustomerDirectoryScreen.tsx`, `ProjectDirectoryScreen.tsx` ×4): all the same pattern — a ref assigned during render (`if (someRef) someRef.current = fn`) so a parent could call a child's function imperatively (the "+ Add" trigger wiring). Fixed for real by moving each assignment into a `useEffect` — since these refs are only ever invoked later from a click handler, never read during render, the timing change is unobservable. Two of these fixes exposed their own `react-hooks/exhaustive-deps` warning (the assigned function wasn't stable across renders) — resolved by wrapping `openCreateModal`/`openCreateProject` in `useCallback`, not by fudging the dependency array.
- `react-hooks/set-state-in-effect` (10 total once the whole app was scanned, not just the original 4 — 4 in `QuickLeadModal`/`LogActivityModal`/`CloseReminderModal`, 3 more in `ProjectDirectoryScreen.tsx`'s Add/Edit Opportunity sub-form, and 3 more from the search above): all the "reset/derive form fields" pattern. **Not refactored** — the real fix (consolidating each modal's fields, or remounting via `key`) would touch the exact forms under active UAT/training use for a benefit that's mostly cosmetic (React 18 already batches these into one re-render). Each is suppressed individually with `// eslint-disable-next-line react-hooks/set-state-in-effect` plus a one-line reason, not a blanket rule-level demotion — so a *different*, unreviewed instance elsewhere still fails lint.

All three rules are back at their default `'error'` severity in `eslint.config.js` — only `@typescript-eslint/no-explicit-any` (214) and `react-refresh/only-export-components` (3, dev-only Fast Refresh concern, zero production impact) remain as explicit warnings, with a comment in the config explaining why. The `any` cleanup is real, multi-day work — do it incrementally, file-by-file, same discipline as the MUI migration (property-diff, honest tracker), starting with `AuthContext.tsx` (`session: any`, `userProfile: any`) as the highest-value target since it's the most central file. Re-promote it to `'error'` once that backlog is actually cleared.

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
- [ ] Search/filter bar stays pinned; only the list scrolls (§6.1)
- [ ] All data fetching via `useQuery`; all writes via `useMutation` or `await` + `invalidateQueries` — no manual `.then()` fetch chains, no module-level cache (§3, §4.1, ADR-032)
- [ ] List screen passes full entity object (not just ID) to `onSelectEntity` callback
- [ ] List screen fires lazy batch counts fetch as a dependent `useQuery` after the list renders (§4.2)
- [ ] Detail screen accepts `initialData` prop; state initialised from it (§3.3)
- [ ] Backend has a `GET /entities/counts` endpoint satisfying the contract in §5 (ADR-029)
- [ ] Tab fetch errors swallowed silently — empty state, not error screen (§6.3)
- [ ] Form modals clear state on open, not on close (§6.2)

---

## 9. Migration Tracking

The MUI + React Query + TypeScript migration (ADR-031/032/033) completed 2026-08-18 — every screen and component in `sales-os-app/src/` conforms to this document's standard. Per-file conversion history, decisions made along the way, and bugs found during the migration are preserved in `docs/Progress-Archive-2026-08.md`, not tracked here.
