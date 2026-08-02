# Active Progress — Cabio Sales OS
_Session: 2026-08-01, continued 2026-08-02_

## Current task — STOP HERE FIRST

**Standing up the full UAT environment** per `docs/Deployment-Topology.md`,
ahead of **Monday's** walkthrough with the wider Cabio Star Sales team
(decided 2026-07-31 after the ngrok-tunnel demo approach proved fragile —
see `docs/Progress-Archive-2026-08.md` for that history).

**Phase A checklist is essentially done** (UAT Supabase project, `uat`
branch, database migrated + seeded, Render backend + frontend both live and
verified) — full step-by-step detail, bugs hit, and fixes applied are all in
`docs/Deployment-Topology.md`'s "Open Items" section and `docs/Backlog.md`
(3 new entries from today: stale `Physical-Schema.sql`, a `typescript`/
`openapi-typescript` peer conflict, `npm audit` findings, JS bundle size),
not repeated here.

**Immediate next step:** re-create the 6-person roster (+ Basheer) in the
**new** UAT Supabase project's Auth — same names/emails/roles/SBU/zone as
the 2026-07-31 Dev-project accounts (reconstructable from the live Dev DB's
`user_profile` rows if the roster table itself isn't at hand), but these are
a fresh set of accounts since UAT is a separate Supabase project from Dev.
This step also doubles as the first real end-to-end proof that the deployed
Render backend can actually reach the UAT database — not yet confirmed,
since every business endpoint requires an authenticated JWT and no UAT Auth
users exist yet.

**After that, in order:**
1. Prove out RLS (Phase 2E) on UAT with the Cabio Star Sales team.
2. Installation guide for end users (phone PWA install) — `docs/PWA-Mobile-Install-Setup.md`'s
   Phase 5 checklist (from the 2026-07-31 demo) is the tested basis, but
   wait until the UAT URL is stable before writing it (it now is —
   `https://cabio-sales-os-uat-frontend.onrender.com` — so this can start
   once the roster step above is done).

**Uncommitted right now:** `active_progress.md` (this file), `docs/Backlog.md`,
`docs/Deployment-Topology.md` — doc-only updates recording today's UAT
bootstrap, not yet committed.

## Also still open (unrelated, carried over)

The Critical Care/Imaging manager hierarchy build-out — see
`docs/Progress-Archive-2026-07.md`'s Phase 2E section for the confirmed
plan. The "create Supabase Auth accounts" blocker this was waiting on is
resolved for Dev, but this item concerns the UAT/Prod rollout more broadly —
revisit once UAT is fully proven out per the current task above.

**Deliberately left unconverted, not forgotten** (Basheer's explicit scope
call, see the `@mui/x-date-pickers` archive entry): 9 date-only `type="date"`
fields in `Customer360Screen.tsx`/`OpportunityDetailScreen.tsx`, and 2 more
in `ProjectDirectoryScreen.jsx` (entangled with that file's own pending MUI
migration). Pick up only if Basheer decides to extend scope.
