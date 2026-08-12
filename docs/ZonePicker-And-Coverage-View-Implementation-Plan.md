# Shared ZonePicker + Territory Admin Coverage View — Implementation Plan

**Status:** Draft — planned, not yet built.
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

1. `npx tsc --noEmit` / `npm run lint` clean, per the repo's standard gate.
2. Manual on Dev: search "kozh" in each retrofitted picker, confirm it resolves to Kozhikode with the correct breadcrumb; confirm a deprecated zone never appears in search results; confirm Territory Admin's Edit form can't select the zone being edited as its own parent.
3. User Directory: assign a Sales Staff person (not Area Manager) to a leaf zone via the retrofitted picker, confirm it saves; confirm their opportunity visibility is *unchanged* (still owner-only) — this is the one case worth double-checking explicitly, since it's easy to assume a zone assignment does something to RLS when for this role it deliberately doesn't.
4. Territory Admin: confirm that zone now shows the newly-assigned person as an assignee chip with their correct role label.
5. Confirm a zone with zero direct assignees (e.g. the "Kerala"/"Karnataka" umbrella nodes, where nobody is assigned to the state-level row itself) renders cleanly with no assignee chips, not an error or empty-looking gap.
