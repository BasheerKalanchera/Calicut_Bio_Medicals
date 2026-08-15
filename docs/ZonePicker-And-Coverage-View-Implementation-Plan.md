# Shared ZonePicker + Territory Admin Coverage View — Implementation Plan

**Status:** Built (2026-08-13) — migration 0020 applied to Dev, `tsc`/lint/
ruff clean. Manual verification in progress (checklist below). Post-build:
Territory Admin's coverage chips were cluttering the tree view by default,
so a "Show Coverage"/"Hide Coverage" toggle button was added
(`showCoverage` state, defaults to `false`, client-side only).
**Date:** 2026-08-12

## Context

Two gaps surfaced while reviewing the Territory Admin screen (built earlier this session) against the real territory data being entered:

1. **Every zone picker in the app is a flat, unsearchable `<TextField select>`** over the full zone list (`listZones()` → `/master-data/zones`), with no ordering and no hierarchy shown. As the tree grows past the original 5 flat zones into a real multi-level structure (state → cluster → district → taluk), these dropdowns become unusable, and nothing distinguishes a broad umbrella zone (Kerala) from an actual working zone (Kozhikode) in the list.
2. **There's no way to see who's actually responsible for a given zone.** Only the Area Manager tier gets a `user_zone` row today (that's the only tier `opportunity_tier_visibility` reads it for) — but field reps like Vivek or Irfan, who are the real day-to-day owners of a specific district, have no recorded assignment anywhere in the system. That fact only exists in `Zone-Hierarchy-Territory-Data-2026-08.md`, a planning doc, not as queryable data. Territory Admin needs to surface this, and reps need to actually be assigned (their assignment is a **responsibility record only** — it must not affect their RLS visibility, which stays owner-only, same as today).

This plan builds both: a single shared `ZonePicker` component (search-and-pick, not a flat list) used everywhere a zone is selected, and a coverage view on the Territory Admin tree showing who's assigned to each zone.

## Confirmed current state (verified directly, 2026-08-12)

**No trigram index exists on `zone.name`.** Confirmed absent from every migration and from `Zone.__table_args__` (`backend/app/domains/reference/models.py:34-65` has none). The precedent to replicate exactly: `Index("idx_opportunity_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"})` (`opportunity/models.py:31`, same shape in `account/models.py`, `product/models.py`, `project/models.py`).

**Flat zone pickers to replace** — all backed by the same `listZones()` call, `staleTime: Infinity`:
- `CustomerDirectoryScreen.tsx` — filter pill (~217-223) and Account create-form field (~390-396)
- `OpportunityPipelineScreen.tsx` — filter pill (345-357), feeds `listPipeline({ zone_id, ... })`
- `Customer360Screen.tsx` — Account edit form field (~1320-1325)
- `UserDirectoryScreen.tsx` — primary `zone_id` + multi-zone `zone_ids` ("+Add another zone")
- `TerritoryAdminScreen.tsx` — the flat "Parent Zone" select I put in the Add/Edit modal as a placeholder
- **`QuickLeadModal.tsx` has no zone field at all** — confirmed by direct search, nothing to touch there.

**Existing search-and-pick precedent, already proven in this codebase**: `Customer360Screen.tsx`'s Parent Customer `Autocomplete` (~1326-1336) — debounced via the existing `useDebouncedValue` hook (already imported in `CustomerDirectoryScreen.tsx` for its own parent-search). `ZonePicker` follows this exact shape, not a new pattern.

**Zone tree-building is lazy, per-node, not batched** — `ZoneRepository.get_tree()` (`reference/repository.py:39-46`) fetches roots only; `ZoneTreeNode.model_validate(z)` (`reference/router.py:29`) recursively walks `Zone.children` (`lazy="select"`), one query per node. Already accepted as fine because this endpoint is Admin-only and the tree stays small ("low hundreds of rows," per migration `0019`'s own docstring). The coverage view reuses the same tolerance rather than engineering a batched fetch for a dataset this size — one more lazy relationship per node (`Zone.user_zones`, already exists, `reference/models.py:61`), not a second code path.

**`UserZone` → `UserProfile` → `Role` is a plain attribute chain, not an explicit join anywhere in this codebase**: `manager.role.role_name` (`organization/service.py:53,86`), `current_user.role.role_name` (`organization/repository.py:79,93,97`) — `UserProfile.role` is `lazy="select"`. The coverage view reuses this exact chain (`zone.user_zones[i].user.display_name`, `.user.role.role_name`), not a hand-written SQL join.

## Design decisions

- **`ZonePicker` is one component with no internal "default" mode.** It always renders as an explicit search field. Whether a screen shows it at all (vs. silently defaulting to the current user's own zone with a "change zone" override) is each *calling screen's* decision — not baked into the component. Every one of the 5 real call sites above always shows it explicitly; none of them currently has a legitimate silent-default case, so this plan doesn't build the default/override affordance — just the picker itself.
- **`excludeIds?: string[]` (plural), not a single id.** Covers both real cases: Territory Admin excluding the zone being edited from its own parent options (`excludeIds={[editingZoneId]}`), and User Directory's multi-zone accumulation excluding already-added zones so the same zone can't be picked twice (`excludeIds={[form.zone_id, ...form.additionalZones]}`).
- **Search matches on `zone.name` only**, not the breadcrumb text — typing "Kerala" finds the Kerala node itself, not every district under it (matches how the existing Opportunity name search already behaves). Only active zones are searchable, matching the existing `list_active()` convention used everywhere else.
- **Breadcrumb is computed server-side per result**, by walking `Zone.parent` (already `lazy="joined"` one level, further hops lazy-load on demand) — cheap given results are capped at ~10 per search and the tree is shallow. Not a recursive CTE; that's overkill for a handful of small per-result walks.
- **Coverage view shows direct assignments only, not rolled up through descendants.** A zone's assignee list is exactly the `user_zone` rows pointing at *that exact node* — the tree's own nesting already shows the rollup visually (expand South Kerala, see Adarsh; expand Kottayam under it, see Vivek). Rolling up would just dump everyone in a subtree into one undifferentiated list at the top, which is less useful than seeing each person at their actual level.
- **Assignee entries show role, not just name** (`{ id, display_name, role_name }`), so the view visually distinguishes an Area Manager (real RLS visibility) from a Sales Staff assignment (responsibility record only, no visibility effect) — this distinction must stay visible, not implied.

## Files

### Backend
- **`backend/alembic/versions/00XX_zone_name_trigram_index.py`** (new; confirm actual head revision at build time — `0019` is the last one that's landed) — adds the GIN trigram index on `zone.name`, mirroring the `opportunity`/`account`/`product`/`project` precedent exactly.
- **`backend/app/domains/reference/models.py`** — add matching `Index(...)` to `Zone.__table_args__`.
- **`backend/app/domains/reference/schemas.py`** — new `ZoneSearchResult { id, name, path }`; extend `ZoneTreeNode` with `assignees: list[ZoneAssignee] = []`, new `ZoneAssignee { id, display_name, role_name }`.
- **`backend/app/domains/reference/repository.py`** (`ZoneRepository`) — `search_by_name(query, limit=10) -> list[Zone]` (trigram similarity, active-only, ordered by similarity); small helper to walk `.parent` and build a breadcrumb string per result.
- **`backend/app/api/routers/master_data.py`** — new `GET /master-data/zones/search?q=` (not admin-gated — every authenticated user uses zone pickers), sibling to the existing `/master-data/zones` route. Not routed through the generic `ENTITY_REGISTRY` dispatcher, since this needs custom query + breadcrumb logic.
- **`backend/app/domains/reference/router.py`** — `GET /admin/zones/tree`'s existing `ZoneTreeNode.model_validate(z)` call replaced with a small explicit recursive builder function (`_build_zone_tree_node(zone) -> ZoneTreeNode`) that also populates `assignees` from `zone.user_zones` — needed because `assignees` isn't a direct ORM attribute match, so plain `from_attributes` validation can't produce it.

### Frontend
- **`sales-os-app/src/services/masterData.ts`** — new `searchZones(q: string): Promise<ZoneSearchResult[]>`, same thin-wrapper shape as every other function there; `ZoneSearchResult` type declared alongside it.
- **`sales-os-app/src/components/ZonePicker.tsx`** (new) — `Autocomplete` + `useDebouncedValue`, calling `searchZones`, `enabled` only once the query is 2+ characters. Renders each option as name + muted breadcrumb subtitle; selected value displays as `"{name} ({path})"`. Props: `value: string | null`, `onChange: (zone: {id, name, path} | null) => void`, `label`, `excludeIds?: string[]`.
- **Retrofit the 5 real call sites** listed above, replacing their flat `<TextField select>` with `<ZonePicker>`. `UserDirectoryScreen.tsx`'s multi-zone case keeps its existing "+Add another zone" chip-list UI, just swaps the underlying picker.
- **`sales-os-app/src/types/territoryAdmin.ts`** — extend `ZoneTreeNode` with `assignees: { id: string; display_name: string; role_name: string }[]`.
- **`sales-os-app/src/screens/TerritoryAdminScreen.tsx`** — render each zone row's assignees as small chips (name + role) under the row; swap its own Parent Zone field to `ZonePicker` with `excludeIds={[editingZoneId]}` (only when `editingZoneId` is set).

## Verification

Manual on Dev (Basheer runs this himself). Done as of this writing:
`npx tsc --noEmit` / `npm run lint` / `ruff check` clean, migration 0020
applied (Dev confirmed at head).

### 0. Before you start
- Logged in as Admin or General Manager (Territory Admin routes are role-gated).
- Optional: DevTools Network tab open, to watch `GET /master-data/zones/search?q=...`
  fire as you type — confirms the ~300ms debounce and the 2-character minimum
  (nothing fires for a 1-character query).

### 1. Search behavior (any one of the 5 pickers)
- Type `kozh` — resolves to **Kozhikode** with a breadcrumb of its ancestors
  (e.g. `North Kerala`), not just the bare name.
- Type a single character — no request fires, no dropdown opens.
- Clear the field (✕) — selection clears cleanly, no stale value left behind.

### 2. Deprecated-zone exclusion
- Deprecate `TEST-Child` in Territory Admin (already flagged for cleanup —
  check its blast radius first, same as any deprecate).
- Search for it by name in any `ZonePicker` — it must **never** appear in
  results, even though it still exists in the DB (only `is_active=true`
  zones are searchable).

### 3. TerritoryAdminScreen — Parent Zone field + coverage view
- **Add Zone**: click ➕ on an existing zone (e.g. South Kerala) — Parent
  Zone pre-fills with South Kerala.
- **Edit Zone**: click ✏️ on a zone with a parent (e.g. Kottayam under
  South Kerala) — Parent Zone pre-fills correctly, and the zone being
  edited never appears in its own Parent Zone search results
  (`excludeIds` check — try typing its own name).
- Clear the Parent Zone field on an edit and save — zone becomes
  top-level (`parent_zone_id: null`).
- Click "Show Coverage" — chips appear per zone. Expand South Kerala →
  Kottayam — Vivek shows as an assignee chip with his role. Expand a
  zone with nobody assigned directly (e.g. the Kerala/Karnataka umbrella
  nodes) — renders cleanly, no chip row, no error/gap. Click "Hide
  Coverage" — chips disappear, toggle relabels correctly.

### 4. UserDirectoryScreen — zone_id + zone_ids
- Open an existing user (e.g. Vivek or Adarsh) — primary Zone field shows
  their current zone with the correct name (exercises the name-lookup
  fallback via `listZones()`, since the users list endpoint doesn't
  return zone names).
- **The RLS check** (worth being deliberate about): pick a **Sales
  Staff** user (not Area Manager), assign them to a leaf zone they don't
  already have via the picker, save.
  - Confirm the assignment saved (re-open the user, zone shows).
  - Confirm that user's opportunity visibility is **unchanged** — still
    owner-only. A zone assignment for this role must not grant any new
    visibility; only Area Manager reads `user_zone` for RLS.
- "+ Add another zone" — add a second zone; searching for one already
  selected excludes it from results.
- Remove an additional zone via the × button — unrelated flow still works.

### 5. Customer360Screen — Account edit Zone field
- Open any customer, Edit — Zone field pre-fills with the customer's
  current zone (via `account.zone`, no separate lookup needed).
- Change zone, save — customer's zone chip updates on the Overview tab.
- Save with zone cleared — blocked with "Zone is required".

### 6. CustomerDirectoryScreen — filter pill + create form
- **Filter**: filter the customer list to Kozhikode via the "All Zones"
  picker — list narrows correctly, same as the old Button+Menu did.
  Clear it — list returns to unfiltered. Changing the filter resets
  pagination to page 1.
- **Create form**: New Customer → Zone field works the same way,
  required validation still fires if left empty, created customer shows
  the correct zone afterward.

### 7. OpportunityPipelineScreen — zone filter
- Filter the pipeline by a zone with opportunities in it (e.g. South
  Kerala) — list/kanban narrows correctly. Clear the filter — full
  pipeline returns.

### 8. General regression pass
- Each of these screens had unrelated code sitting right next to what
  changed (owner filters, parent-customer autocomplete, additional-zone
  chips, pagination) — worth a quick look that nothing else on these five
  screens broke, even though the diffs were scoped tightly to the zone
  fields.
