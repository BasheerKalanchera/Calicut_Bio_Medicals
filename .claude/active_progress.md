# Active Progress — Cabio Sales OS
_Session: 2026-08-15_

## Current task — STOP HERE FIRST

**Sales Manager Tier Collapse: build done, migration `0021` applied to
Dev, about to be committed. One manual RLS check still pending.**
Full detail: `docs/Progress-Archive-2026-08.md`'s 2026-08-13/15 entry.
Plan: `docs/Sales-Manager-Tier-Collapse-Implementation-Plan.md`.

**Next step:** run the corrected manual RLS test —
1. User Directory: edit **Basheer K**, set Manager → **Fazal**, Save.
2. Log in as Fazal (Area Manager, Imaging, zones North Kerala +
   Mangalore). Opportunity Pipeline should now show "Ultrasound m/c" and
   "New USG m/c" (both at KIMS Hospital Trivandrum, South Kerala — outside
   Fazal's zone coverage) — visible only via the new `manager_id` fold.
3. Revert: edit Basheer K again, set Manager back to **Haroon Sidheeq**.
4. Also confirm "Sales Manager" no longer appears in the User Directory
   role dropdown, and spot-check an unaffected tier (SBU Manager or Sales
   Staff pipeline) looks unchanged.

If step 2 doesn't show the opportunities, that's a real bug — stop and
investigate before anything else touches `opportunity_tier_visibility`.

**All four loose ends from the Zone Hierarchy real-data review are now
resolved** — deprecating Central Kerala, confirming "Coastal Karnataka"
naming, and removing the Kasaragod duplicate were done 2026-08-15 by
Basheer building out the full real Territory map/hierarchy on Dev via the
now-verified Territory Admin screen (see `docs/Territory-Admin-Screen-
Implementation-Plan.md`'s status line and `docs/Zone-Hierarchy-Territory-
Data-2026-08.md`'s item 8); `TEST-Parent`/`TEST-Child` and their dependent
fixture rows (`Test Account`, `Test opportunity` + its one
`opportunity_item`, the `user_zone` link for the deactivated "Test - Area
Manager" user, and 3 `zone_closure` rows) were deleted directly from Dev
2026-08-16 — confirmed no real data was attached before deleting, and
confirmed gone afterward.

**Also flagged, not yet decided:** `sales-os-app/src/App.jsx` (legacy
`/prototype` route, mock data only) still references "Sales Manager" —
plan marks this out of scope pending Basheer's call on whether the
prototype route is worth touching at all.

**Worth fixing properly later, not urgent:** `npm run generate:types`
overwrites `types/api.ts` and deletes the hand-maintained convenience
type-alias block every time it's run against a live schema — either teach
the generator to preserve it, or drop the aliases and update call sites.

## Also still open (unrelated, carried over)

The Critical Care/Imaging manager hierarchy build-out — see
`docs/Progress-Archive-2026-07.md`'s Phase 2E section for the confirmed
plan. The "create Supabase Auth accounts" blocker this was waiting on is
resolved for Dev, but this item concerns the UAT/Prod rollout more
broadly — revisit once UAT is fully proven out.

**Deliberately left unconverted, not forgotten** (Basheer's explicit scope
call, see the `@mui/x-date-pickers` archive entry): 9 date-only
`type="date"` fields in `Customer360Screen.tsx`/`OpportunityDetailScreen.
tsx`, and 2 more in `ProjectDirectoryScreen.jsx` (entangled with that
file's own pending MUI migration). Pick up only if Basheer decides to
extend scope.
