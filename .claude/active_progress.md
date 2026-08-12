# Active Progress — Cabio Sales OS
_Session: 2026-08-12_

## Current task — STOP HERE FIRST

**Zone Hierarchy rollout, mid-flight.** Backend verified and pushed
(`1e8bb5a`, `c6c287f`, `aca2e9c`). Territory Admin screen v1 built, not
yet manually verified. Real zone data entry started. ZonePicker +
coverage-view plan approved, not built.

**Tomorrow, in this order:**

1. **Manually verify Territory Admin on Dev** — checklist in
   `docs/Territory-Admin-Screen-Implementation-Plan.md`'s Verification
   section (create/edit/blast-radius/deprecate-grandfathering/rebuild-noop/
   nav-gating).
2. **Three loose ends from the real-data review**, none actioned yet:
   - Deprecate Central Kerala (check its blast radius first) — Kerala
     runs North+South only going forward, per Basheer's standing call.
   - Confirm "Coastal Karnataka" vs. the territory doc's "Karnataka
     Coastal" naming is intentional, or rename to match.
   - Clean up `TEST-Parent`/`TEST-Child` — RLS-verification fixtures, no
     longer needed now that verification has passed.
3. **Build ZonePicker + coverage-view** — plan approved, not started:
   `docs/ZonePicker-And-Coverage-View-Implementation-Plan.md`.

**Still separately open, not urgent:** Sales Manager Tier Collapse
(`docs/Sales-Manager-Tier-Collapse-Implementation-Plan.md`) is planned
only — needs a Haroon review before any build, since it revises a
leadership-approved ADR (ADR-009).

**`docs/Backlog.md` still has an uncommitted diff mixing content from
different sessions** (a pre-existing note from earlier this session, still
true) — review before committing, don't blind `git add`.

Full narrative for everything above: `docs/Progress-Archive-2026-08.md`'s
2026-08-12 (later) entry.

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
