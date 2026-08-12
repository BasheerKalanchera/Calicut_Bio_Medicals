# Territory Admin Screen — Frontend Implementation Plan

**Status:** Draft — planned, not yet built.
**Date:** 2026-08-12

## Context

The Zone Hierarchy backend (self-referencing `zone.parent_zone_id` tree +
`zone_closure` table for RLS) shipped and passed its six-tier manual
verification this session (commit `1e8bb5a`, pushed). The full admin CRUD
surface for managing that tree is already live on the backend — six
endpoints in `backend/app/domains/reference/router.py`, all Admin/GM-gated
— but nothing in the frontend calls them yet. This plan builds the UI that
makes zone hierarchy entry/edit actually usable: a new Territory Admin
screen with a tree view and inline add/rename/move/deprecate actions.

**Scope note:** this covers `docs/Zone-Hierarchy-Implementation-Plan.md`
§7 (Territory Admin screen) only — not §6 (generalizing the flat zone
pickers already used on `CustomerDirectoryScreen`, `OpportunityPipelineScreen`,
`Customer360Screen`, `UserDirectoryScreen` into a shared, hierarchy-aware
`ZonePicker`). That's separate, larger, touches five existing screens, and
wasn't what was asked for this round — deliberately deferred, not
forgotten.

## Confirmed backend contract (verified directly, 2026-08-12)

All wrapped in `APIResponse[T]` (unwrap via `response.data.data`, same as
every other service function in `masterData.ts`):

- `GET /admin/zones/tree` → `list[ZoneTreeNode]` (root zones; **nested**
  `children: ZoneTreeNode[]`, not flat with parent pointers)
- `POST /admin/zones` (201), body `ZoneCreate` → `ZoneTreeNode`
- `PATCH /admin/zones/{zone_id}`, body `ZoneUpdate` → `ZoneTreeNode`
  (`name`/`parent_zone_id`/`zone_level` all independently optional — one
  call covers rename + move + relabel at once, no need for three separate
  UI actions)
- `POST /admin/zones/{zone_id}/deprecate` (no body) → `ZoneTreeNode`
  (**one-way** — no un-deprecate endpoint exists; confirmation copy must
  say so plainly)
- `GET /admin/zones/{zone_id}/blast-radius` → `ZoneBlastRadius {account_count, user_count}`
- `POST /admin/zones/rebuild-closure` (204, no body/response) — manual
  safety-net action, idempotent by design

```python
class ZoneTreeNode(BaseModel):
    id: uuid.UUID
    name: str
    zone_level: str | None
    is_active: bool | None
    children: list["ZoneTreeNode"] = []
```

**`npm run generate:types` has not been run since these endpoints
landed** — `types/api.ts` has no `ZoneTreeNode`/`ZoneCreate`/etc. Hand-write
matching interfaces now (exact shape above); note as a follow-up to
regenerate once convenient, same "no manual edits after that" pattern used
elsewhere.

## Design decisions

- **No new tree-view library.** No `@mui/x-tree-view` dependency exists,
  and none is needed — the tree stays shallow (state → district → taluk,
  "low hundreds of rows even fully built out pan-India" per the backend's
  own docstring). Build a small recursive row component using existing
  `List`/`ListItemButton`/`Collapse` from `@mui/material` (already used
  this way in `UserDirectoryScreen.tsx`), inline in the same file rather
  than a separate component — consistent with how other screens in this
  codebase are structured.
- **Reuse `FormModal` for everything, including the deprecate
  confirmation — no new dialog component.** `FormModal`'s contract
  (`isOpen`, `onClose`, `title`, `onSubmit: () => Promise<void>`,
  `children: ReactNode`, built-in error `Alert` on throw) already fits a
  confirm-style flow: for deprecate, `children` is just the blast-radius
  count + grandfathering explanation (no form fields), `onSubmit` calls
  `deprecateZone(id)` directly. Confirmed no confirm-dialog precedent
  exists anywhere else in the active app — this is the first one, and
  `FormModal` covers it without inventing a second component.
- **One "Edit Zone" modal, not three separate inline mechanisms.**
  Matches the backend's own `ZoneUpdate` shape (name/parent/level all
  optional in one PATCH) — an edit icon per row opens one `FormModal` with
  Name, Zone Level, and Parent fields together, covering rename+move+relabel
  in a single save. Simpler than inventing separate inline-rename text
  editing and a standalone move picker.
- **Parent picker is a plain `TextField select` over the flattened tree**,
  same shape as every other picker in `UserDirectoryScreen.tsx` — not the
  future shared `ZonePicker` (out of scope, see above). Flatten the
  already-fetched tree client-side rather than a second API call.
- **Move's cycle guard is server-side only** (`AccountService._creates_cycle`-style
  check already exists in the backend's `move_zone`) — don't duplicate it
  client-side; a bad move just surfaces through `FormModal`'s existing
  error `Alert`.
- **Deprecated zones stay visible in the tree, de-emphasized (greyed
  text + a "Deprecated" chip), not hidden.** The admin needs to see the
  full structure including grandfathered nodes. Their Deprecate action is
  disabled (one-way, already deprecated).

## Files

- **`sales-os-app/src/types/territoryAdmin.ts`** (new) — hand-written
  `ZoneTreeNode`, `ZoneCreate`, `ZoneUpdate`, `ZoneBlastRadius`, matching
  the backend shapes above exactly.
- **`sales-os-app/src/services/territoryAdmin.ts`** (new) — `getZoneTree()`,
  `createZone(data)`, `updateZone(zoneId, data)`, `deprecateZone(zoneId)`,
  `getBlastRadius(zoneId)`, `rebuildClosure()`. Same thin-wrapper pattern
  as every function in `services/masterData.ts` (`api.get/post/patch` from
  `lib/api.ts`, return `response.data.data`).
- **`sales-os-app/src/screens/TerritoryAdminScreen.tsx`** (new):
  - `useQuery(["zone-tree"], getZoneTree)` for the tree.
  - Recursive row rendering (expand/collapse via `Collapse`), each row
    showing name, `zone_level` chip if set, deprecated styling if
    `!is_active`, and three icon actions: Add child, Edit, Deprecate
    (disabled if already deprecated).
  - Top-level "+ Add Zone" button (root create, no `parent_zone_id`).
  - "Rebuild Closure" utility button (no confirmation needed — idempotent
    by design per the backend docstring) with a simple inline success
    message on completion.
  - Add/Edit use one shared `FormModal`-backed form (Name, Zone Level,
    Parent-select); Deprecate uses `FormModal` with blast-radius copy per
    the design decision above. All mutations follow `UserDirectoryScreen.tsx`'s
    plain-async-handler-plus-manual-invalidate pattern (not `useMutation`
    wrappers — matches the closer structural precedent), invalidating
    `["zone-tree"]` on success.
- **`sales-os-app/src/DemoApp.tsx`** — add
  `{ id: "territories", label: "Territory Map", icon: "🗺️", adminOnly: true }`
  to the `ADMINISTRATION` section's `items` (alongside `users`/`catalog`),
  and one more always-mounted `<Box display={view === "territories" ? "flex" : "none"}>`
  wrapper rendering `<TerritoryAdminScreen />`, mirroring the existing
  `users` → `UserDirectoryScreen` wiring exactly (same file, ~line 503-505).

## Verification

1. `npx tsc --noEmit` and `npm run lint` clean (repo's standard guard-green
   gate for every migrated/new file).
2. Manual E2E on Dev, logged in as Admin/GM:
   - Create a new zone as a child of an existing top-level zone (e.g.
     under `TEST-Parent`) — confirm it appears correctly nested after
     refetch.
   - Edit it: rename, change zone level, move it to a different parent —
     confirm all three land in one save.
   - Check blast-radius on a zone with real assignments (`TEST-Parent`/
     `TEST-Child` have the test Area Manager and test Account/Opportunity
     from the backend verification) — confirm the count matches.
   - Deprecate a zone that has a live Area Manager assigned via `user_zone`
     with an Opportunity underneath it — confirm that Area Manager can
     *still* see that Opportunity afterward (RLS grandfathering holds, per
     the still-open item #6 from `Zone-Hierarchy-Implementation-Plan.md`'s
     own manual-verification list), and confirm the deprecated zone no
     longer appears in the parent picker for a *new* zone/assignment.
   - Run "Rebuild Closure" — confirm it's a no-op against current state
     (nothing visibly changes).
3. Confirm the "Territory Map" nav entry is hidden for a non-Admin/GM role
   (e.g. log in as Sales Staff, confirm it's absent from Administration).
4. Note for later, not blocking this pass: run `npm run generate:types`
   once convenient and swap the hand-written `types/territoryAdmin.ts`
   interfaces for the generated ones.
