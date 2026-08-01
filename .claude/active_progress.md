# Active Progress — Cabio Sales OS
_Session: 2026-08-01_

## Current task — STOP HERE FIRST

**Since the 2026-07-31 demo, a batch of bug fixes and features landed and
shipped** (Next Actions refresh bug, click-through nav on Account 360,
Product Catalog opened company-wide, UAT manual + in-app Help system,
Stakeholder WhatsApp number, `manager_id` cross-SBU loophole fixed) — full
detail in `docs/Progress-Archive-2026-08.md`, not repeated here. All
committed and pushed to `main`.

**2026-07-31 demo:** hands-on PWA demo ran over an ngrok tunnel to the Dev
Supabase project — see `docs/PWA-Mobile-Install-Setup.md` for setup detail.
Not fully complete — a second walkthrough is booked for **Monday** with
the wider Cabio Star Sales team.

**Decided for Monday (2026-07-31, end of day):** stand up the **full UAT
environment** per `docs/Deployment-Topology.md` — separate Supabase project
+ Render-hosted backend/frontend — rather than reusing the ngrok-tunnel-to
-laptop approach again. That approach is "Dev, your laptop" by design and
proved fragile tonight (background processes got killed mid-demo, tunnel
URL had to be re-shared). Effort estimate: ~half a day, ~$7/mo
(`Deployment-Topology.md`'s cost table).

**Next, in order (none started yet):**
1. Work `Deployment-Topology.md`'s "Open Items — Phase A" checklist: create
   the UAT Supabase project, Render account/services (backend Starter +
   static frontend), per-environment secrets, run migrations there.
2. Re-create the 6-person roster (+ Basheer) in the **new** UAT Supabase
   project's Auth — same names/emails/roles/SBU/zone as tonight's Dev-project
   accounts (table is in this conversation's history / can be reconstructed
   from the live Dev DB's `user_profile` rows if needed), but these are a
   fresh set of accounts since UAT is a separate project from Dev.
3. Installation guide for end users (phone PWA install) — tonight's Phase 5
   checklist in `docs/PWA-Mobile-Install-Setup.md` is the tested basis, but
   wait until the UAT URL is stable before writing it (no point documenting
   a Render URL that doesn't exist yet).
4. ~~User manual~~ — **done**, see `docs/Progress-Archive-2026-08.md`.

## Also still open (unrelated, carried over)

The Critical Care/Imaging manager hierarchy build-out — see
`docs/Progress-Archive-2026-07.md`'s Phase 2E section for the confirmed
plan. The "create Supabase Auth accounts" blocker this was waiting on is
resolved for Dev (tonight's 6 accounts), but this item concerns the UAT/Prod
rollout more broadly — revisit once UAT is up per the current task above.

**Deliberately left unconverted, not forgotten** (Basheer's explicit scope
call, see the `@mui/x-date-pickers` archive entry): 9 date-only `type="date"`
fields in `Customer360Screen.tsx`/`OpportunityDetailScreen.tsx`, and 2 more
in `ProjectDirectoryScreen.jsx` (entangled with that file's own pending MUI
migration). Pick up only if Basheer decides to extend scope.
