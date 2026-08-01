# Active Progress — Cabio Sales OS
_Session: 2026-08-01_

## Since last session (done, committed & pushed — 2026-08-01)

Bug fixes and one UX/business-rule change found/requested during and after
the 2026-07-31 demo, all committed and pushed to `main`:
- Next Actions tab on Opportunity 360 not refreshing after logging an
  activity or completing a reminder (`507685f`).
- Opportunity/Project cards on Account 360's tabs were Edit-only, no
  click-through to full detail — now whole-card-clickable (`7ccc258`).
- Product Catalog was silently RLS-blocked cross-SBU ("No products found"
  for another SBU, not a real empty state) — opened catalog **read** access
  to everyone; added a new backend guard (BR-OP-11) so a product can still
  only be *added to an Opportunity* within its own SBU. Migration `0014`
  applied to the live Dev Supabase project. (`1d4ce86`)
- **User manual done — supersedes "Next" item 4 below, decision changed
  from Google Doc to Markdown + in-app help.** `docs/UAT-User-Manual.md`
  written, then reviewed against actual screen/tab/business-rule behavior
  (stage list, tab lists, mandatory Next Action / closing-note rules, live
  search) and corrected. Generalized into an in-app contextual Help system
  (`HelpDrawer.tsx` + `helpContent.tsx`, `[?]` button keyed by current
  screen) covering all 7 screens + Project 360. While writing Project 360's
  help entry, found its Opportunities section had dead create-opportunity
  code (`openAddOpp`/`handleCreateOpp`) never wired to a button — fixed
  that too, so the docs describe real behavior.

Root-cause detail for any of the above: `git log` those commits, or ask —
not duplicated here.

## Current task — STOP HERE FIRST

**2026-07-31 demo (done, partial):** hands-on PWA demo ran tonight over an
ngrok tunnel to the Dev Supabase project — see
`docs/PWA-Mobile-Install-Setup.md` for the full setup detail and
`docs/Backlog.md` for a real gap found while explaining RLS post-demo
(`manager_id` cross-SBU loophole, not yet fixed). Not fully complete — a
second walkthrough is booked for **Monday** with the wider Cabio Star Sales
team.

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
4. ~~User manual~~ — **done, see "Since last session" above.** Ended up as
   `docs/UAT-User-Manual.md` (Markdown, not Google Docs) plus an in-app
   `[?]` Help system, not a standalone doc alone — video walkthroughs still
   deferred until the app UI stabilizes (MUI migration, RLS fix pending),
   per the 2026-08-01 decision.

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
