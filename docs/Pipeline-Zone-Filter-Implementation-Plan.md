# Pipeline Screen Zone Filter — Implementation Plan

**Status:** BUILT 2026-08-11 — steps 1-7 done as planned (repository join,
service/router pass-through, frontend service param, Zone select). Two
deviations from the plan, both found during manual verification, not before:
(1) a pre-existing, unrelated bug in `index.html` (`<script src="/src/main.jsx">`
pointing at a file that no longer exists after an earlier `.jsx`→`.tsx`
entry-point migration) was causing a duplicate `createRoot()` mount and a
"removeChild" crash — fixed, since it was blocking this feature from being
testable at all, not something this plan introduced. (2) The Owner+Zone
selects truncated their "All Owners"/"All Zones" labels at the
`Mobile-Demo.html` phone-frame width once both sat in the same row as the
Kanban/List toggle (the exact risk step 5 flagged as a build-time check) —
resolved by moving the Kanban/List toggle out of `OpportunityPipelineScreen.tsx`
entirely and into `DemoApp.tsx`'s header row next to the "Pipeline" title,
freeing the filter row for the two selects alone. `viewMode` state was
lifted from `OpportunityPipelineScreen` into `DemoApp.tsx` accordingly
(the screen now takes `viewMode` as a prop instead of owning it).
`tsc --noEmit`, lint, and `npm run build` all clean.
**Date:** 2026-08-11
**Prepared by:** Basheer Kalanchera (with Claude)
**Purpose:** Concrete, ordered implementation plan for the Pipeline zone
filter proposed in `docs/Backlog.md` ("Pipeline screen zone filter" entry,
2026-08-07) — fully decided, no open product questions, independent of
Multi-Zone Assignment (that feature changes *who* can see which zones;
this one just adds a filter control to narrow what a user with multi-zone
visibility is already allowed to see).

---

## Context

`CustomerDirectoryScreen.jsx` already has a zone-filter pill (shipped
`8aff9cd`, 2026-08-07). `OpportunityPipelineScreen.tsx` has no equivalent —
today it only filters by Owner. Anyone who already sees opportunities across
multiple zones under today's RLS (SBU Manager, General Manager, Admin, and
after Multi-Zone Assignment ships, an Area Manager covering more than one
zone) has no way to narrow the Kanban/List view down to a single zone.

This is a genuinely smaller lift than the Account Directory version in one
sense (no create/edit form to thread a zone picker into — filter-only) but a
larger one in another: `Opportunity` has no `zone_id` column of its own —
zone is one hop away via `account_id → account.zone_id`. The existing
`owner_id` filter is a direct column match; this one needs a join.

## Confirmed current state (verified directly against the codebase)

**Repository** (`backend/app/domains/opportunity/repository.py:50-102`,
`list_pipeline`/`count_pipeline`): both take `account_id`/`stage_id`/
`status_id`/`owner_id` as direct `Opportunity` column filters — no join
anywhere in either method today. `Account` is already imported at the top of
this file (line 7, used by `account_exists`) — no new import needed, just a
`.join(Account, Opportunity.account_id == Account.id)` conditionally applied
only when `zone_id` is passed (keeps the unfiltered case exactly as cheap as
it is today — no unconditional join).

**Router** (`opportunity/router.py:45-72`, `list_pipeline`): `Query(None)`
params for `account_id`/`stage_id`/`status_id`/`owner_id`, passed straight
through to the service. `zone_id: uuid.UUID | None = Query(None)` follows
the exact same shape.

**Service** (`opportunity/service.py:37-62`, `list_pipeline`): pure
pass-through, no business logic — `zone_id` just joins the existing
parameter list in `list_pipeline`/`count_pipeline` calls, no new validation
(no `zone_exists` check exists for any of the other filter params either;
consistent to not add one here — an unknown `zone_id` just yields zero
results, same as an unknown `owner_id` would today).

**No RLS interaction** — this is a pure narrowing filter on top of whatever
RLS already permits. A user who can't see a zone's opportunities today still
can't after this ships; the filter can only ever narrow an already-visible
set, never widen it. No security review needed, unlike the Multi-Zone
Assignment work.

**Frontend filter bar** (`sales-os-app/src/screens/OpportunityPipelineScreen.
tsx:223-338`): Owner filter is a `TextField select` (lines 326-338) sitting
next to the Kanban/List `ToggleButtonGroup`. Zone filter follows the same
`TextField select` shape, placed alongside it. `listZones()`
(`services/masterData.ts:9-12`) already exists and is already used by
`CustomerDirectoryScreen.jsx` — no new service function needed for the
options list itself.

**Service layer** (`sales-os-app/src/services/opportunities.ts:12-32`,
`PipelineParams`/`listPipeline`): add `zone_id?: string` to the
`PipelineParams` interface and thread it into the `params` object the same
way `owner_id` already is (lines 16, 29).

**Query key** (`OpportunityPipelineScreen.tsx:233-236`): currently
`["pipeline", ownerFilter]` — must become `["pipeline", ownerFilter,
zoneFilter]`, or the zone filter will silently serve stale/wrong cached
results when only the zone changes (same bug class already fixed once this
session in a different screen — the `OpportunityDetailScreen.tsx` `users`
query-key collision found while planning the referral-credit feature).

**Test coverage gap, pre-existing, not introduced by this change**: neither
`test_opportunity_repository.py` nor `test_opportunity_router.py` actually
exercises `list_pipeline`/`count_pipeline`'s filter *logic* today — both
mock the DB session entirely (`mock_db.scalars.return_value...`), so the
existing `owner_id` filter's `WHERE` clause has never been asserted against
real SQL execution, only that the endpoint wires a param through and
serializes correctly. The new `zone_id` join deserves a genuine correctness
check, but it can't reasonably be the first thing in this file to break that
pattern — recommend a manual Dev check (below) as the real verification,
consistent with how `owner_id` was verified, rather than inventing a new
test infrastructure pattern for one filter.

## Implementation steps

### 1. Repository — `opportunity/repository.py`

```python
def list_pipeline(
    self,
    *,
    account_id: uuid.UUID | None = None,
    stage_id: uuid.UUID | None = None,
    status_id: uuid.UUID | None = None,
    owner_id: uuid.UUID | None = None,
    zone_id: uuid.UUID | None = None,
    offset: int = 0,
    limit: int = 50,
) -> list[Opportunity]:
    stmt = select(Opportunity).options(...)  # unchanged
    if zone_id:
        stmt = stmt.join(Account, Opportunity.account_id == Account.id).where(Account.zone_id == zone_id)
    if account_id:
        ...  # unchanged, rest of the existing filters
```
Same addition to `count_pipeline`. Order the `zone_id` join first (or
anywhere before `.order_by()`/`.offset()`/`.limit()`) — doesn't matter
relative to the other `if` blocks since they're independent `WHERE`
predicates, not chained joins.

### 2. Service — `opportunity/service.py`

Add `zone_id: uuid.UUID | None = None` to `list_pipeline`'s signature, pass
through to both repository calls — pure plumbing, mirrors `owner_id` exactly.

### 3. Router — `opportunity/router.py`

Add `zone_id: uuid.UUID | None = Query(None)` to `list_pipeline`, pass to
`service.list_pipeline(..., zone_id=zone_id)`.

### 4. Frontend service — `sales-os-app/src/services/opportunities.ts`

- `PipelineParams`: add `zone_id?: string`.
- `listPipeline`: `if (params.zone_id) p.zone_id = params.zone_id;`

### 5. Frontend screen — `OpportunityPipelineScreen.tsx`

- New state: `const [zoneFilter, setZoneFilter] = useState<string>("");`
- New query: `listZones()` — mirror the `users`/`stages` queries already in
  this file (`staleTime: Infinity`, since zones are static reference data).
- `queryKey: ["pipeline", ownerFilter, zoneFilter]`; `queryFn` passes
  `zone_id: zoneFilter || undefined` alongside the existing `owner_id`.
- New `TextField select` next to the existing Owner filter (lines 326-338),
  same shape: `<MenuItem value="">All Zones</MenuItem>` + one `MenuItem` per
  zone. Consider `sx={{ flex: 1 }}` on both Owner and Zone selects (currently
  Owner alone gets `flex: 1`) so they share the row evenly rather than Zone
  cramming in at its natural width — check the rendered layout on both
  desktop and the `Mobile-Demo.html` viewport before finalizing.

### 6. `types/api.ts`

No change needed — `zone_id` is a plain query param, not part of any
response shape.

### 7. Manual verification on Dev

1. As a role that sees multiple zones today (SBU Manager, GM, or Admin):
   confirm the Zone filter narrows both Kanban and List views correctly,
   and that switching zones (not just toggling on/off) re-fetches rather
   than showing stale results (the query-key fix from step 5).
2. Combine Zone + Owner filters together — confirm both apply (AND, not
   OR — matches how the existing filters already compose).
3. As a role scoped to one zone only (e.g. Area Manager, pre-Multi-Zone):
   confirm the filter still renders (harmless no-op, since RLS already
   limits them to one zone) rather than erroring.
4. Confirm search (`searchQuery`, client-side, unaffected by this change)
   still works correctly on top of a zone-filtered result set.

## Ordering

Repository (1) → service (2) → router (3) → manual smoke of the raw API
(`GET /opportunities/pipeline?zone_id=...`) before touching the frontend →
frontend service (4) → frontend screen (5) → manual verification on Dev (7).

### Critical files
- backend/app/domains/opportunity/repository.py
- backend/app/domains/opportunity/service.py
- backend/app/domains/opportunity/router.py
- sales-os-app/src/services/opportunities.ts
- sales-os-app/src/screens/OpportunityPipelineScreen.tsx
