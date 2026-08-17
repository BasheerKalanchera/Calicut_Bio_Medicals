# Cabio Sales OS — Progress Archive (2026-08)

Session narrative moved out of `.claude/active_progress.md` as work
completes, per CLAUDE.md's Session Handoff rule — this file is
reference-only, not read at session start. Everything below was already
resolved/shipped by the time it was written here; nothing here is open
work. See git log / commit messages for full technical detail on anything
committed.

---

## 2026-08-01 — bug-fix batch + UAT prep work

Bug fixes and feature work found/requested during and after the
2026-07-31 demo, in the order they landed:

- **Next Actions tab on Opportunity 360 not refreshing** after logging an
  activity or completing a reminder. Root cause: `LogActivityModal.tsx`
  and `CloseReminderModal.tsx` only invalidated the global `reminders`
  React Query cache, never the opportunity-scoped `opp-reminders` cache
  the Opportunity 360 Next Actions tab actually reads from. (`507685f`)
- **Opportunity/Project cards on Account 360's tabs were Edit-only** —
  no click-through to full detail. Made whole-card-clickable (Edit
  button stops propagation) on both Customer 360's Opportunities/Projects
  tabs and, once the underlying Project 360 navigation plumbing was
  built, Project 360 too. Along the way, fixed a real crash: Project
  360's Next Actions/Opportunities navigation initially passed only a
  minimal `{id, name}` object into `ProjectDetailView`, which assumes a
  full record including `account` — caused a blank screen on click.
  (`7ccc258`)
- **Product Catalog was silently RLS-blocked cross-SBU** — clicking a
  filter for another SBU showed a misleading "No products found" instead
  of surfacing that it was an access restriction. Business decision: open
  catalog **read** access to everyone (products are reference data, no
  pricing/customer sensitivity), since there's no confidentiality reason
  to hide one SBU's catalog from another. Split the RLS policy
  (`product_read_all` for SELECT, unrestricted; existing SBU-scoped
  policy kept for INSERT/UPDATE/DELETE) — migration `0014`, applied live.
  Added a new backend guard (`BR-OP-11`) so a product can still only be
  *added to an Opportunity* within its own SBU, since RLS no longer
  covers that. (`1d4ce86`)
- **User manual + in-app contextual Help system.** Decision changed from
  the original "Google Doc" plan to a Markdown manual
  (`docs/UAT-User-Manual.md`) plus an in-app `[?]` Help drawer — cheaper
  to keep in sync while the UI is still moving (MUI migration, RLS work
  ongoing) than either a video walkthrough or a full role-aware
  content-authoring system (considered and explicitly rejected as
  premature investment for a 6-7 person pilot). The manual was reviewed
  against actual screen/tab/business-rule behavior and corrected (wrong
  Pipeline stage list — 7 stages not 5, missing Customer 360 tabs, missing
  Opportunity Detail tabs, undocumented mandatory-field rules). Generalized
  into `HelpDrawer.tsx` + `helpContent.tsx`, keyed by current screen,
  covering all 7 screens plus Project 360. While writing Project 360's
  help entry, found its Opportunities section had dead create-opportunity
  code (`openAddOpp`/`handleCreateOpp`) never wired to a button — fixed
  that too, so the docs describe real behavior, not a workaround.
  (`3cfa132`)
- **Stakeholder gets a `whatsapp_number` field** (migration `0015`,
  applied live). Design decision: rather than a boolean flag on the
  existing `phone` field (can't represent a genuinely different WhatsApp
  number) or a second field left blank/NULL by convention (requires every
  future reader to know a fallback rule), the frontend mirrors `phone`
  into `whatsapp_number` on every save unless a "Different WhatsApp
  number?" checkbox is checked — auto-propagates on phone edits too,
  since phone is only ever edited through this same form. Found and fixed
  8 pre-existing Pyrefly "could not find name" warnings in
  `account/models.py` along the way (missing `TYPE_CHECKING` imports for
  cross-domain relationship types, unlike `organization/models.py`'s
  pattern) — unrelated to the feature, just discovered while touching the
  file. (`c051279`)
- **`manager_id` cross-SBU visibility loophole — fixed.** Surfaced
  2026-07-31 while explaining the Sales Manager RLS tier post-demo:
  `UserService.create_user`/`update_user` never checked that a
  `manager_id` assignment stayed within the same SBU, so an Admin/GM
  could (by mistake or otherwise) assign a Sales Staff person's manager
  to a Sales Manager in the *other* SBU, letting that manager see
  opportunities across the SBU boundary via the Sales Manager RLS tier.
  Fixed with a same-SBU check (`ValidationError` on mismatch), correctly
  comparing against the *effective* SBU when both `sbu_id` and
  `manager_id` change in the same PATCH. Documented as `BR-ORG-01`.
  Manually verified by Basheer via User Directory. Also corrected a
  stale backlog item in the same commit: `account.zone_id` already had
  an index (migration `0001`, confirmed live) — only the SQLAlchemy
  model's `index=True` documentation was missing; no DB change needed.
  (`926469d`)

All of the above committed and pushed to `main`.

---

## 2026-08-03 — UAT keep-alive monitor + 6-person roster + RLS lockout bug

**UptimeRobot keep-alive monitor set up and verified.** Free-plan HTTP
monitor, `GET /api/v1/health` on `https://calicut-bio-medicals.onrender.com`,
5-min interval, email alerting on. Mitigates Render free-tier's ~15-min idle
spin-down only — not a general uptime guarantee, and (as the RLS bug below
proved) doesn't by itself mean the site is usable.

**6-person roster + Basheer re-created in UAT Supabase Auth,** reconstructed
by reading the live Dev DB's `user_profile`/`auth.users` (read-only query,
no writes to Dev) rather than from a written-down roster, which didn't
exist. The 7 real (non-"Test -") Dev accounts, created 2026-06-24 through
2026-07-31, matched exactly the "6-person roster + Basheer" framing in
`active_progress.md`: Haroon Sidheeq (GM), Abdul Latheef P (Admin), Arun
Adarsh / Fazal / Nishad K V / Shruthi (all Area Manager), Basheer K.

Basheer's UAT identity deliberately diverges from Dev's, his own call:
email domain `@cabio-UAT.com` (not `@cabio-demo.com`) for all 7 accounts
distinguishing UAT from Dev at a glance; his own account promoted
Sales Staff → **Admin** (so he can manage the UAT roster himself going
forward without needing SQL); SBU changed Imaging → **Critical Care**, Zone
North Kerala → **South Kerala**; manager left **blank** (Dev's value,
`Test - Sales Manager`, doesn't exist in the fresh UAT roster and wasn't
worth recreating just for this). The other 6 kept Dev's role/SBU/zone/
manager-chain unchanged, reporting to Haroon Sidheeq.

Mechanics: Basheer created the 7 Supabase Auth users himself via the UAT
dashboard (Auto Confirm ticked, passwords his choice — a human, not Claude,
handles real people's credentials); Claude then queried `auth.users` by
email to get the resulting UUIDs (no manual UUID copy-paste needed) and
wrote a single SQL script inserting all 7 `user_profile` rows in one pass
via `ADMIN_DATABASE_URL`, ordering GM/Admin rows (no manager dependency)
before the Area Manager rows that reference Haroon Sidheeq as manager —
same bootstrap pattern `docs/Seed-Data-Demo.sql` itself uses for exactly
this chicken-and-egg problem (no user_profile row exists yet, so the
Admin-gated "Add User" UI screen has no one who can use it).

**Bug found and fixed: UAT-wide RLS lockout.** First login attempt
(`basheer@cabio-uat.com`) failed on the Account Management landing screen
with `User <uuid> not found` — traced to `app/api/dependencies.py`'s
`get_current_user`, the shared auth dependency every authenticated endpoint
calls before any domain logic runs (explains why it surfaced on whatever
screen happened to be first, not something specific to Account Management).
`db.get(UserProfile, user_id)` returned `None` despite the row provably
existing (confirmed via a direct `ADMIN_DATABASE_URL` query) — the
signature of RLS silently filtering all rows for a non-bypass role, not a
real "missing row."

Root cause, confirmed by auditing every `public` table's
`pg_class.relrowsecurity` + `pg_policies` count in UAT against Dev: **18
tables** had RLS enabled with **zero policies** in UAT (`account`,
`alembic_version`, `coverage_plan`, `coverage_plan_entry`, `hold_reason`,
`installed_asset`, `lead_source`, `loss_reason`, `opportunity_stage`,
`opportunity_status`, `project`, `project_status`, `role`, `sbu`,
`stakeholder`, `target_plan`, `user_profile`, `zone`) — all RLS-disabled in
Dev, none touched by any Alembic migration (the 0009-0012 Phase 2E
migrations only ever targeted the 8 tables that actually got policies:
`activity`, `document`, `opportunity`, `opportunity_item`,
`opportunity_stakeholder`, `product`, `reminder`, `split`). RLS enabled +
no policy = default-deny for any role without `BYPASSRLS` (`cabio_app`
lacks it; `postgres`, used for direct admin queries, has it — which is why
the lockout was invisible to every diagnostic query run as `postgres` and
only showed up through the app's own `cabio_app` connection). Basheer
identified the likely trigger himself: a Supabase dashboard prompt to
"enable RLS for the whole database" during UAT project setup, which flips
RLS on project-wide regardless of which tables have real policies behind
them.

Fix: `ALTER TABLE ... DISABLE ROW LEVEL SECURITY;` on exactly those 18
tables, restoring UAT to Dev's proven-working configuration. No data
changes, the 8 Phase-2E-covered tables untouched. Verified by re-querying
`pg_class`/`pg_policies` for full parity with Dev, then a real login —
`basheer@cabio-uat.com` now authenticates successfully with no error. This
also stands as the first confirmed proof the deployed Render backend can
reach the UAT database end-to-end through a real authenticated request, not
just a direct DB connection.

**Trap for Prod (Phase B) setup:** Supabase's "enable RLS for the whole
database" project-setup prompt is a footgun for this app's RLS design,
which deliberately scopes RLS to only 8 tables via Alembic migrations, not
project-wide. When creating the Prod Supabase project, decline that prompt
(or repeat this same 18-table audit-and-disable pass immediately after
migrating) before assuming Prod is usable.

**UAT populated with real accounts + full product catalog for tonight's
orientation**, sourced from Dev rather than the stale `Seed-Data-Demo.sql`
(dated June 29, predates Opportunity/Phase 2E — has no Opportunity seed
data at all, and its Projects section references a `user_profile` UUID
that doesn't even match its own User Profiles section, a pre-existing bug
in the file). Dev's `account`/`product` tables have no `user_profile`
dependency (`account`: `zone_id` only; `product`: `sbu_id` only), so this
was a straightforward copy, not a remap.

**Products:** all 26 real OEM entries (EDAN, Magnamed, SonoScape) copied
as-is; excluded 1 junk row (`Sonoscape Test`).

**Accounts:** 18 in Dev, narrowed to 11 with Basheer reviewing the
borderline ones directly — the 5 obvious `Test *` rows and "New hospital in
Areekode" excluded outright; "another hospital" (generic, lowercase)
excluded; "aster medicity" (lowercase but a real Aster-group entry) kept.
Also surfaced and fixed a **pre-existing Dev data quality issue** while
reviewing parent-account links: `KIMS Hospital Trivandrum.parent_account_id`
pointed at `Aster DM`, and `Al Shifa Hospital.parent_account_id` pointed at
`KIMS Hospital Trivandrum` — both unrelated hospital groups, almost
certainly accidental clicks while testing the parent/child account feature
rather than real corporate relationships. Basheer confirmed both should be
cleared; UAT's copies have `parent_account_id = NULL` for both, while
`aster medicity` → `Aster DM` and `Aster MIMS Calicut` → `Aster DM` (both
genuine) were preserved. **Not yet fixed in Dev itself** — same bad links
still live there; worth a cleanup pass separately, not urgent since Dev has
no real users depending on that hierarchy today.

**Opportunities deliberately left unseeded — Basheer's call.** No seed data
exists for Opportunities anywhere (confirmed above), and manual entry by
the Cabio Star Sales team was already the plan independent of this gap —
tonight's orientation doubles as that first live-entry session, which also
naturally exercises RLS with real, varied ownership instead of synthetic
data. Any account gaps the team hits can be entered live too, same as
Opportunities.

**New doc: `docs/PWA-UAT-MobileLaptop-Setup.md`,** written to replace the
old ngrok-based `docs/PWA-Mobile-Install-Setup.md` for tonight — that doc's
Phase 5 ("Install and verify on phone") was tied to a dev-machine ngrok
tunnel with a rotating URL, the exact fragility that motivated standing up
UAT in the first place. Confirmed the PWA build already deployed to UAT
(commit `9c88b28`, merged into `uat`, live on Render) doesn't need any of
that: `curl` checks against `https://cabio-sales-os-uat-frontend.onrender.com`
confirmed the manifest, all 3 icons, and the service worker are all
correctly served from the stable URL. New doc covers Laptop, Android
(Chrome), and iPhone (Safari), each with install steps.

Revised twice after Basheer clarified the actual distribution plan:
Google Meet for the live session, URL + credentials sent via WhatsApp text,
this document sent as a WhatsApp attachment. That made the in-app-browser
problem (tapping a link inside WhatsApp opens its own webview, which is
missing the Install/Add-to-Home-Screen option in both Chrome and Safari)
the *expected* case, not a hypothetical — reworded both mobile sections
from "if you received this via..." to definitive framing, and added a note
on opening the document itself from inside WhatsApp. Also incorporated an
external review's other 3 suggestions: bolded "Scroll down" in the iPhone
steps (easy to miss, hidden below the fold in Safari's Share sheet), and
added a stale-cache note ("swipe away and reopen" if the installed app
looks outdated). Skipped the review's QR-code suggestion — doc is being
shared as a link/attachment, not printed, so it wouldn't get used.

**Converted to PDF for the actual WhatsApp send** — raw `.md` renders as
literal `**`/`#` syntax when opened as a generic file on a phone. No
pandoc/wkhtmltopdf/weasyprint available on the machine; used `mistune`
(already installed) to render the markdown to styled HTML, then headless
Chrome (`--print-to-pdf`) to produce `docs/PWA-UAT-MobileLaptop-Setup.pdf`.
`.md` is the source of truth for future edits, the `.pdf` is what actually
gets attached in WhatsApp.

---

## 2026-08-03 — Pipeline screen stale-after-create bug, fixed and merged to UAT

**Bug (found by Basheer during UAT smoke testing):** adding an Opportunity
from an Account's Opportunity tab made it appear immediately in that tab,
but not on the Pipeline screen — only a hard refresh (full page reload)
made it show up there.

**Root cause: a React Query cache-invalidation gap, not a missing
auto-refresh feature.** The Pipeline screen reads `["pipeline",
ownerFilter]` (`OpportunityPipelineScreen.tsx`), cached under `main.tsx`'s
global 30s `staleTime`. That key was only ever invalidated by one call
site — `QuickLeadModal`'s create flow, wired up in `DemoApp.tsx`. Every
other opportunity create/update path never invalidated it, so Pipeline kept
serving its stale cached list until something forced a full cache wipe
(hard refresh) or the 30s staleTime happened to line up with a remount/
refocus.

**Confirmed missing at 4 sites**, all now fixed by adding
`queryClient.invalidateQueries({ queryKey: ["pipeline"] })` (commit
`7bdafae`):
- `Customer360Screen.tsx` `handleCreateOpp` — the exact path Basheer hit
- `Customer360Screen.tsx` `handleUpdateOpp`
- `OpportunityDetailScreen.tsx` `handleUpdateOpp` (main edit form)
- `OpportunityDetailScreen.tsx`'s item-save indicative-value auto-sync

**A 5th site with the same root cause, `ProjectDirectoryScreen.jsx`'s
create/update, was deferred rather than bundled in** — that file doesn't
use React Query at all yet, so fixing it properly is a bigger lift; logged
to `docs/Backlog.md` instead.

**Verification, each of the 4 sites checked manually against Dev by
Basheer** before merge: create from Account 360 (Basheer), then edit from
Account 360, edit from the Opportunity Detail form, and an item-save
indicative-value change (Basheer, all 3 confirmed) — Pipeline updated
without a hard refresh in every case.

**Branch process:** since Milestone 2 work hadn't started on `main` yet,
`main` and `uat` had no unreleased divergence to protect against (the
documented hotfix-off-`uat` flow in `Deployment-Topology.md` assumes
`main` may be ahead with unreleased work) — so the fix was committed
directly on `main`, verified, then fast-forward merged `main` → `uat`
(`73c824d..7bdafae`) and pushed, letting Render redeploy UAT. That merge
also carried the `alembic/env.py` `%`-escaping fix (`0996e3c`) into the
`uat` branch's code for the first time — it had been applied to the UAT
database by hand during the 2026-08-02 bootstrap but was never actually
merged into `uat` until now. Re-verified live on UAT afterward (same
create/edit checks) — no issues.

---

## 2026-08-03 — Physical-Schema.sql regenerated; Postgres 16→17 doc correction

**`docs/Physical-Schema.sql` regenerated for real**, closing the Backlog
item surfaced 2026-08-02 (missing migrations 0002/0003/0004/0007/0013-0015).
No `pg_dump`/`psql` client existed anywhere on the machine, so used Docker
(Docker Desktop wasn't running — started it, waited for the daemon) to run
a version-matched `pg_dump --schema-only --no-owner --no-privileges
--schema=public` against the **UAT** database's `ADMIN_DATABASE_URL`, not
Dev — UAT was deliberately chosen since it was bootstrapped clean from
`alembic upgrade head` just two days prior with no accumulated manual
drift, unlike Dev which is routinely hand-poked for testing per
`CLAUDE.md`'s Safety note.

**Postgres version finding:** first `pg_dump` attempt used a `postgres:16`
image and failed outright — `pg_dump: error: aborting because of server
version mismatch: server version: 17.6; pg_dump version: 16.14` — revealing
the live UAT database is actually **Postgres 17.6**, not 16 as `CLAUDE.md`
stated. Re-ran with `postgres:17` successfully (2006 lines). Checked
whether this meant Dev needed a version upgrade to match — queried Dev's
`ADMIN_DATABASE_URL` directly (`SELECT version()`) and found **Dev is also
already on 17.6**. So there was no actual environment mismatch to fix, just
a stale doc — `CLAUDE.md`'s "PostgreSQL 16" line was corrected to "PostgreSQL
17" (Basheer confirmed this was almost certainly leftover from the original
planning-stage writeup, not a real drift).

**Output verified before replacing the file:** confirmed all previously-missing
objects are present (`stakeholder.whatsapp_number`, `reminder.closing_activity_id`
+ its index/FK, `alembic_version` table) and that RLS is `ENABLE`d with real
policies on exactly the 8 Phase-2E tables (`activity`, `document`, `opportunity`,
`opportunity_item`, `opportunity_stakeholder`, `product`, `reminder`, `split`)
and nowhere else — confirming the 2026-08-03 RLS-lockout fix held.

**File replaced, not merged by hand:** stripped the `\restrict`/`\unrestrict`
lines `pg_dump` 17 now emits by default (psql-session replay safety
scaffolding, not schema content — irrelevant for a reference-only doc) and
prepended a new machine-generated header documenting the regen command and
source, replacing the old "Architecture Freeze v1.0" hand-written header.

**Root-cause (not just symptom) fix landed alongside:**
`Backend-Implementation-Standards.md`'s "Migration workflow for future
changes" (previously a 5-step chain ending at "Apply") had no step telling
anyone to touch `Physical-Schema.sql` — which is exactly why 6 migrations'
worth of real schema changes never made it into the file despite everyone
following the documented process correctly. Added "Regenerate
Physical-Schema.sql" as an explicit 6th step, with a short explanatory note,
so this can't silently recur on migration 0016 onward.

---

## 2026-08-04 — BR-OP-12 (Admin/GM SBU override) and Add-Product focus-loss fix

**BR-OP-12 implemented:** Admin/General Manager can now create an
Opportunity in a different SBU than their own, and must always explicitly
choose one via a required "SBU *" dropdown — never silently defaulted to
their placeholder `sbu_id`. Backend: `OpportunityCreate.sbu_id` (gated to
Admin/GM; `BusinessRuleViolation` if omitted by Admin/GM,
`AuthorizationError` if a non-privileged role attempts an override,
`NotFoundError` for a bogus SBU) → `OpportunityService.create_opportunity`
(BR-OP-11 item-SBU check now validates against the chosen SBU, not the
caller's own) → `router.py` passes `role_name` through. Frontend: the SBU
dropdown on both create entry points — `Customer360Screen.tsx`'s "Add
Opportunity" modal and the global "+ Lead" `QuickLeadModal.tsx` — each also
re-filters its Products picker by the chosen SBU. Sidebar's "SBU: {name}"
placeholder chip (`DemoApp.tsx`) hidden for Admin/GM for the same
meaningless-placeholder reason. Rejected giving Admin/GM a real
`SBU = "Corporate"` DB row instead — would leak into every other
SBU-scoped picker/report (same objection as a 2026-07-28 finding). 9
new/updated backend unit tests, 397/397 backend suite passing, `npx tsc
--noEmit` and `npm run lint` both clean. Full rule text in
`docs/Business-Rules.md`'s BR-OP-12. **Verified end-to-end by Basheer on
Dev via both entry points, no issues.**

**Unrelated fix bundled into the same session: "Add Product" sub-dialog
losing input focus after every keystroke** (Qty/Price/Disc fields),
reported by Basheer. Two independent bugs were stacked on top of each
other here — both had to be fixed before either "New Opportunity" flow
worked correctly:

1. **MUI nested-dialog focus-trap conflict** (affected both flows equally).
   `FormModal.tsx` wraps MUI `Dialog`; the "New/Edit Opportunity" outer
   dialog stays open underneath the "Products" sub-dialog while adding a
   line item, so two MUI `Dialog`s are open simultaneously, each installing
   its own focus trap. Since they render into separate `body` portals
   (siblings, not DOM descendants), the outer dialog's trap doesn't
   recognize focus living in the inner one and yanks it back on every
   re-render — MUI's own documented nested-modal caveat. Fixed with MUI's
   documented remedy: `FormModal` gained an optional `disableEnforceFocus`
   prop, passed by the *outer* dialog only while its nested Products
   sub-dialog is open, in all 3 affected pairs: `Customer360Screen.tsx`'s
   "New Opportunity"→Products and "Edit Opportunity"→Products, and
   `QuickLeadModal.tsx`'s "New Opportunity"→Products.
   (`OpportunityDetailScreen.tsx`'s item editing is inline, not a nested
   dialog — unaffected.)

2. **Component-identity remount, `Customer360Screen.tsx` only** — the
   reason the `disableEnforceFocus` fix alone made `QuickLeadModal.tsx`'s
   flow work but *not* `Customer360Screen.tsx`'s. `OppItemAddRow` (the
   Add-Product row markup) was defined as a `const` arrow-function
   component *inside* `Customer360Screen`'s render body, so React treated
   it as a brand-new component type on every render of the parent —
   reconciliation by type identity meant the previous `TextField`s were
   unmounted and fresh ones mounted on every keystroke, dropping focus
   regardless of any dialog-level fix. `QuickLeadModal.tsx` never had this
   problem because its equivalent markup was always inline JSX, not
   factored into its own component. Fixed by hoisting `OppItemAddRow` to
   module scope (alongside the file's other tab components) and passing
   `products` in as an explicit prop, since it's no longer reachable via
   closure from module scope.

`npx tsc --noEmit` and `npm run lint` clean after both fixes; no backend
change, no new tests needed (pure UI fixes). **Verified by Basheer on Dev
via both entry points ("+ Lead" and Customer 360's "+ Add"), no issues.**

---

## 2026-08-05 — BR-OP-12 merged to UAT; PWA stale-cache diagnosis; fast-track stage-gate discussion paper

**Merge timing checked before pushing, not assumed safe.** Before merging
`main` → `uat` (which triggers a Render redeploy that briefly disrupts
anyone using UAT), queried the live UAT database read-only
(`ADMIN_DATABASE_URL`, session set read-only) for signs of active use:
`pg_stat_activity` for recent connections/commits, and `max(created_at)`/
`max(updated_at)` across `opportunity`, `opportunity_item`, `activity`,
`reminder`. Found real writes and live connections as recently as minutes
before each check on 2026-08-04, so held off twice. Re-checked the morning
of 2026-08-05: last write ~9.5 hours prior, all connections idle since —
confirmed quiet, proceeded.

**Merged and pushed:** `main` (`3c81e23`, containing BR-OP-12's Admin/GM
SBU override and the Add-Product focus-loss fix) → `uat`, fast-forward
`7bdafae..3c81e23`. Local `active_progress.md` edit was stashed before the
branch switch (would have blocked `git checkout uat`) and popped back
after returning to `main`.

**Deploy verified directly, not assumed from a green push:** fetched the
live UAT backend's `/api/v1/openapi.json` and confirmed `OpportunityCreate`
already has the new `sbu_id` field; fetched the UAT frontend's `index.html`
and `sw.js` and confirmed a fresh `last-modified` timestamp and new JS
bundle hash matching the push time. Both redeployed correctly.

**Bug found: Admin's SBU dropdown missing on the installed PWA (mobile),
present on laptop.** Root cause was client-side caching, not a bad deploy —
already partially anticipated by the existing "stale cache" note in
`docs/PWA-UAT-MobileLaptop-Setup.md`, but that note alone wasn't enough
here: logging out and back in doesn't force a re-fetch of the JS bundle,
since it's purely an in-app session change. What actually worked: tapping
the original WhatsApp install link forced a fresh navigation, which is
what a service worker needs to detect and activate a new version (this
app's Workbox config already uses `skipWaiting` + `clientsClaim`, so it
activates immediately once it *does* see a new version — the missing piece
was triggering that check at all). A further wrinkle specific to this
distribution channel: tapping a link directly from WhatsApp opens
WhatsApp's own in-app browser, not Chrome/Safari — a separate storage
context from the one the installed home-screen icon actually runs on, so
that step alone can silently fail to update anything if the user doesn't
also explicitly choose "Open in Chrome"/"Open in Safari" first (already
documented for the *install* flow, but not previously connected to the
*update* flow).

**Fix, doc-only:** added a new bullet to `docs/PWA-UAT-MobileLaptop-Setup.md`'s
Notes (and its Malayalam translation) covering this fallback explicitly —
close app → tap the original link → route through the real browser via
Open in Chrome/Safari → close that tab → reopen from the home screen icon.
Framed to reassure users this is a refresh, not a reinstall (same login,
same icon). Drafted a WhatsApp broadcast message (English + Malayalam) for
Basheer to send the Cabio Star Sales team so they pick up the update
without hitting the same confusion. `.html`/`.pdf` renders of both setup
docs are now stale relative to the `.md` source — not regenerated yet,
flagged to Basheer, his call on whether that's needed.

**Haroon Sidheeq (GM & Sales Head) raised a bigger question during Issue 1
triage:** should reps be able to skip Demo Date/Expected Closure Date
entirely for fast-tracked deals, not just get a form that lets them enter
those fields when creating directly at Order stage? Analysis: creating
directly at Order stage is already accepted architecture (ADR-015,
BR-OP-00, already implemented in `create_opportunity`) — the only real
open question is whether the two exit-criteria fields (BR-OP-01) should
ever be waivable, and if so, under what control. Identified a specific,
non-obvious risk: `validate_stage_transition` only re-checks a gate when
*advancing past* its threshold, so a field left blank at creation is
permanently blank — there's no later point in the record's lifecycle that
asks for it again. Wrote `docs/Discussion-FastTrack-Opportunity-Creation.md`
(plus a presentation-ready Artifact version) laying out three options —
keep required (Option A, happening regardless as a form fix), make fully
optional (Option B), or a scoped/audited override restricted to Admin/GM
with a recorded reason (Option C, recommended, mirrors BR-OP-12's
never-silent pattern) — for Basheer to take to Haroon and the Cabio
leadership team. Not yet decided; see `docs/Backlog.md`'s Issue 1 entry
for status.

## 2026-08-11 (later, again) — Multi-Zone Milestone 1 six-tier verification passed; real Admin/GM bug found and fixed; frontend built

Basheer ran the six-tier manual verification live on Dev (checklist:
`docs/Multi-Zone-Assignment-Milestone-1-Implementation-Plan.md` step 11),
including assigning Fazal his real second zone (Mangalore) via the actual
`UserService.update_user()` code path and creating a genuine Mangalore/
Imaging test opportunity to exercise it against.

**Real bug found during step 9 (split/reminder carve-out check):** Basheer,
logged in as an Admin account whose own `sbu_id` was Critical Care, could
not add Fazal (Imaging) as a split participant on a Bangalore/Central
Kerala (Imaging) opportunity. Root cause, confirmed directly against the
DB and the code: `UserRepository.list_active()`'s `scope="sbu"` branch
(`organization/repository.py`, the Split-participant picker's candidate
query) filtered candidates against the **caller's own** `sbu_id` — for
Admin/GM that's a meaningless NOT-NULL placeholder, not a real SBU
membership. The `scoped` branch (Owner reassignment) already special-cased
`role_name not in UNRESTRICTED_ROLES` before applying any tier filter; the
`sbu` branch never got that same carve-out — an oversight from when the
zone-restriction was dropped (commit `bc49eba`, 2026-08-07), not a
deliberate design choice. Confirmed this wasn't a symptom of anything built
this session: BR-FIN-06 itself is enforced correctly server-side in
`replace_splits` against the *opportunity's* `sbu_id`, never the caller's —
only the picker's candidate-list query had the caller/opportunity mixup.

**Fix**: `scope="sbu"` now skips the `same_sbu` comparison entirely when
the caller is Admin/GM, returning all active non-unrestricted users —
matching how the `scoped` branch and BR-FIN-06 itself already treat
Admin/GM as unrestricted. New regression test
`test_scope_sbu_ignores_admin_placeholder_sbu`. 444/444 backend tests
passing, ruff clean.

**Full codebase audit performed** (Basheer asked directly: "are there any
other places where Admin/GM's SBU is checked and restricted?") — every RLS
policy (migrations 0010/0011/0012/0014/0018) and every application-layer
scoping site was checked. Findings: `opportunity_tier_visibility` and
everything joining back to it (activity/document/reminder/split/
opportunity_item/opportunity_stakeholder) already unconditionally
unrestrict Admin/GM; `product` reads are fully open to every role; `account`
has no RLS at all (global data, only ever narrowed by an explicit opt-in UI
filter); `activity/repository.py`'s Daily Report scoping and
`opportunity/service.py`'s `create_opportunity` (BR-OP-12) both already had
the correct Admin/GM carve-out; the zone/SBU filters in
`account/repository.py`, `opportunity/repository.py` (Pipeline Zone Filter),
and `product/repository.py` are all explicit opt-in query params, not
implicitly keyed to the caller. One latent (not currently reachable) item
noted for later: `account/router.py`'s `default_zone_id=current_user.zone_id`
fallback would reproduce this same bug class for Admin/GM account creation
if `AccountCreate.zone_id` is ever relaxed from required to optional — not
actionable now, since it's schema-blocked today.

**Frontend built** (`docs/Multi-Zone-Assignment-Milestone-1-Implementation-Plan.md`
§12): `npm run generate:types` regenerated against a live backend (had to
work around a stale process already squatting on port 8000 from earlier in
the session, and a stuck-socket Windows quirk where `netstat`/`Get-Process`/
`taskkill` disagreed about whether the old PIDs still existed — resolved by
running the temporary verification backend/frontend pair on ports 8010/5180
instead of fighting the stuck socket). `types/api.ts`'s hand-written-aliases
block (wiped by every regen per its own header comment) was re-added.
`UserDirectoryScreen.tsx`: the existing single "Zone" select stays exactly
as-is (still `zone_id`, the primary zone); a new "+ Add another zone" link
reveals a picker to add more zones into a local `additionalZones: string[]`
array, rendered as a removable list (mirrors the Splits-tab's add-row + `×`
remove precedent in `OpportunityDetailScreen.tsx`). `zone_ids` sent to the
backend is `[zone_id, ...additionalZones]`, deduped; `openEdit` seeds
`additionalZones` from `zone_ids` minus `zone_id`; the list-row secondary
text now joins all assigned zone names, not just the primary. `tsc --noEmit`
and `npm run lint` both clean.

**Not manually verified in-browser** — the app requires Supabase login
credentials, which per policy aren't typed in even with permission; per
established practice this session, automated checks (typecheck/lint) are
mine to run, live/manual verification in the browser is Basheer's own step.
Isolated verification backend/frontend instances (ports 8010/5180) were
torn down after the types regen; one unintended side effect during cleanup,
disclosed to Basheer at the time: the process-kill filter matched on the
port number as a substring and also caught an unrelated Antigravity IDE
Chromium utility subprocess (not the main IDE process) — Electron apps
normally respawn those on demand, flagged rather than assumed harmless.

**Correction, added when archiving 2026-08-11 (late): committed as `ce61dc2`
"feat: add multi-zone user assignment (Milestone 1)".** Manual in-browser
verification of the multi-zone UI also passed (add/remove additional zone
confirmed on both Create and Edit) — one detour along the way: the local
backend on port 8000 kept serving stale code across restarts, root-caused
to a broken Git Bash venv activation on Basheer's machine (`source
.venv/Scripts/activate` mis-resolves PATH to a stray global Python install
instead of the venv — start uvicorn via `.venv/Scripts/python.exe -m
uvicorn ...` directly instead, going forward).

---

## 2026-08-07 — Product Lifecycle (trade-ins, refurbished inventory, accessories) — shipped

Full design in `docs/Product-Lifecycle-TradeIns-Accessories-Technical-
Design.md`. Three commits on `main` (pushed, reached `uat` along with the
rest of that week's work):
- `8f4526e` — `ProductCatalogScreen.jsx` → `.tsx` MUI/React Query/
  TypeScript migration (prerequisite, needed to add `product_type` without
  adding more Tailwind). `Frontend-Implementation-Standards.md` §9 and
  `check-no-tailwind.js` updated.
- `781aa07` — the feature itself: `Product.product_type` +
  `OpportunityItem.line_type` columns, migration `0016` (applied to Dev,
  verified, `Physical-Schema.sql` regenerated), `BR-CAT-02` (new) +
  `BR-FIN-03` (amended) in `Business-Rules.md`, service-layer buyback
  validation, `OpportunityDetailScreen.tsx`'s Products tab rebuilt with 3
  add-modes (Add Product / Add Accessory / Buyback). 435 backend tests
  passing (7 new).
- `9d4f041` — cross-screen list-row consistency fix (border-radius,
  shadow, avatar size/shape/hover unified across Pipeline/Product
  Catalog/Account Management/Project Directory) plus a real bug fix:
  Tailwind v4 gates `hover:`/`group-hover:` behind `@media (hover:
  hover)`, which silently disabled every Tailwind hover effect app-wide on
  Basheer's touch-capable Windows laptop (Chrome reports `hover: none`
  there even under mouse use) while MUI's ungated `sx` hover rules kept
  working. Fixed via `@custom-variant hover (&:hover)` in `index.css`.

**Side finding, not acted on at the time:** regenerating `Physical-
Schema.sql` from Dev revealed Dev is missing `rls_auto_enable()` — an
event trigger UAT has that auto-enables RLS on new tables, added
out-of-band, not present in the Alembic migration chain. Flagged to
Basheer; reconciliation still open.

**2026-08-07 — new zone `Mangalore` added to Dev and UAT `zone` tables**
(plain lookup-table insert, same precedent as the `REPEAT_ORDER` rename —
no schema/code change). Reference docs synced: `CLAUDE.md`'s zone list,
`docs/Seed-Data.sql`, staleness notes added to two dated design docs that
cited "4 zones." Confirmed not the JV-partner-geography question flagged
at the 2026-08-05 leadership meeting — a plain direct-sales zone, same
model as the existing 4.

---

## 2026-08-06/07 — Issue 1 (REPEAT_ORDER fast-track), Kanban centering fix, Daily Activity Report, tzdata fix

**Issue 1 — Fast-track opportunity creation (REPEAT_ORDER) — `32c94ad`,
merged to `uat`.** New `REPEAT_ORDER` lead-source value relaxes Demo
Date/Expected Closure Date/Clinical Evaluation (`BR-OP-13`); Order
Value/Product Details stay required. All 4 opportunity create/edit entry
points brought to field parity — found and fixed a pre-existing gap in
Project Detail's edit modal along the way. Full summary in
`docs/Discussion-FastTrack-Opportunity-Creation.md`. Renamed lead source
`REORDER` → `REPEAT_ORDER` in the same commit (Star Sales team feedback);
pure data rename, both Dev and UAT rows confirmed correct. UAT smoke test
passed. Opportunity cloning was considered and deliberately deferred
(logged to `Backlog.md`).

**Kanban pill/column centering fix — `ef9bc96`, on `main` and `uat`.**
Found during the UAT smoke test above: clicking a stage pill on a
laptop-width screen scrolled the wrong column into view. Root cause:
`scrollToStage()` centered columns using `offsetLeft`, relative to the
nearest *positioned* ancestor, not the scroll container — picked up
`DemoApp`'s centered max-width layout margin and overshot. Fixed by
replacing the math with a shared `getBoundingClientRect()`-based helper.
Verified on Dev and UAT, laptop and mobile.

**Daily Activity Report — `8fd7ff4`.** New cross-team screen (`GET
/activities`) so a manager can see who logged what activity on a given day
without opening every account/opportunity individually — Haroon's ask.
Access scoped via the existing 6-tier role hierarchy (`organization/
repository.py`'s `UNRESTRICTED_ROLES`/`TEAM_SCOPE_BUILDERS`, promoted from
private to shared). Full design in `docs/Daily-Activity-Report-Technical-
Design.md`. 428 tests passing (23 new). Found and fixed a live-refresh gap
during manual verification: `LogActivityModal`/`CloseReminderModal`
weren't invalidating the report's query.
**tzdata fix — `7a3c8d7`.** Basheer hit `ZoneInfoNotFoundError` running the
backend locally — `zoneinfo` (added for this report's IST handling) needs
the OS's IANA tz database, which Windows doesn't ship. Added
`tzdata>=2024.1; sys_platform == 'win32'` to `pyproject.toml`; confirmed
no-op on UAT/Prod (Linux, already has its own tz database).
**Considered and deferred:** a date-range view (vs. single-day) — backend's
`[start, end)` window already supports extending later without a
rearchitecture; deferred until real usage shows it's wanted.

---

## 2026-08-05 — Issue 2 (Split participant / cross-SBU) decided

Full record in `docs/Discussion-SplitParticipant-SBU-Scope.md` (v6). Three
parts: (1) Split stays same-SBU-any-zone — shipped as part of `bc49eba`.
(2) Referral credit — new field, any SBU/zone, one-time, no revenue impact
— design later folded into the Referral Credit & Relationship-Support plan
below. (3) Relationship-support activity — self-reported `Activity`
logged against the Account with a structured `opportunity_id` link — same
plan.

---

## 2026-08-10/11 — Buyback free-text + Opportunity Items Picker Unification — shipped, `8ab0c4e`

**Buyback free-text field.** `docs/Buyback-Freetext-Implementation-Plan.md`
— dropped the requirement that a Buyback line point at a catalog Product;
added a free-text `description` field instead. Migration `0017`
(`opportunity_item.description` + `product_id` made nullable, relaxed
CHECK constraint, additive-only, live-DB-safe) applied to Dev and
verified. Real bug caught during planning and fixed before it shipped:
`_validate_item_sbus`'s three call sites would have rejected every Buyback
add/replace once `product_id` can be `None`, unless filtered.
`Business-Rules.md` amended (BR-CAT-02 trimmed, new BR-CAT-03).

**Opportunity Items Picker Unification.** Raised by Basheer testing
Buyback free-text and finding Accessory/Buyback only worked from
`OpportunityDetailScreen.tsx`, not the other 3 opportunity create/edit
entry points. Unified all 4 compact-modal call sites on one shell (kept
`OpportunityDetailScreen.tsx`'s Products tab inline as a deliberate
exception); built a net-new Products section for `ProjectDirectoryScreen.
jsx`'s "Add Opportunity" flow (had none before). No backend changes needed.
New shared frontend files: `types/opportunityItems.ts`, `utils/
opportunityItems.ts`, `components/OpportunityItemAddRow.tsx`,
`components/OpportunityItemsList.tsx`. Wired into `OpportunityDetailScreen.
tsx`, `QuickLeadModal.tsx`, `Customer360Screen.tsx`, and
`ProjectDirectoryScreen.jsx` (edit flow converted from raw Tailwind to MUI
to consume the shared components — partial conversion, doesn't graduate
the file off §9's pending list). Preserved the "drop `id` on quantity/
price/disc edit" technique in both diffing edit-flows (forces
`handleUpdateOpp` to treat an edited row as delete-old + add-new, since
there's no single-item PATCH endpoint).

Both verified together by Basheer on Dev (his own call — tested as one
combined pass, not incrementally), `tsc --noEmit`/lint/build all clean,
committed together as `8ab0c4e`.

---

## 2026-08-11 — Pipeline screen zone filter — shipped, `2739bb0`

`docs/Pipeline-Zone-Filter-Implementation-Plan.md` — Zone filter added to
`OpportunityPipelineScreen.tsx` next to the existing Owner filter, for
anyone who already sees multiple zones under RLS. Pure narrowing filter,
no RLS/security interaction. Needed a repository join (`Opportunity` has
no `zone_id` of its own, one hop via `account_id → account.zone_id`).
Query-key correctly includes both `ownerFilter` and `zoneFilter`. Also
found and fixed a real, unrelated bug during manual testing: `index.html`
still pointed `<script src="/src/main.jsx">` at a file renamed to
`main.tsx` in an earlier migration — Vite resolved it as a second
independent module, so `createRoot()` ran twice on `#root` and eventually
crashed. Also moved the Kanban/List toggle out of
`OpportunityPipelineScreen.tsx` into `DemoApp.tsx`'s header row (filter
labels were truncating to "All ..." at phone width once sharing a row with
the toggle).

---

## 2026-08-11 — CustomerDirectoryScreen MUI migration — shipped, `59baa6b`, pushed

`docs/CustomerDirectory-MUI-Migration-Plan.md` — `CustomerDirectoryScreen.
jsx` → `.tsx`: module-level `accountListCache` (SWR) and `isMountedRef`
deleted outright, superseded by React Query. Fixed a real pre-existing bug
in `services/accounts.ts` along the way: `listAccounts`/`getAccount`/
`getAccountCounts`/`createAccount` were typed with `number` ids and
`Promise<unknown>` returns despite this app's ids being UUID strings
everywhere else — retyped against `AccountListResponse`/`AccountResponse`/
`AccountCountsEntry` (already existed in `types/api.ts`, zero new aliases
needed). Real cross-file simplification: the `accountUpdateRef`/
`onAccountUpdate` prop chain (`DemoApp.tsx` → `Customer360Screen.tsx`)
existed only to patch this screen's now-deleted module cache — replaced by
one `queryClient.invalidateQueries({queryKey:["accounts","list"]})` call,
whole ref/prop chain removed from both files. Parent-account search
upgraded to MUI `Autocomplete`, matching `Customer360Screen.tsx`'s own
precedent. One property-diff gap found, dropped, then restored after
Basheer questioned the call: scrolling the list to top after a successful
create — first judged a decoration, on review it's real usability
(prevents the user being stranded mid-scroll), restored. §9 updated (14
fully migrated · 1 pending — only `ProjectDirectoryScreen.jsx` left · 1 out
of scope), `Backlog.md`'s stale "3 files remain" note corrected. Verified
manually by Basheer, committed `59baa6b` (8 files, explicitly staged), then
pushed to `origin/main`.

---

## 2026-08-11 — Opportunity Document Upload — shipped, `49c4c1d`, pushed

From `Backlog.md`'s "Document/photo upload on Opportunity" entry (sales
staff feedback). Full plan in `docs/Opportunity-Document-Upload-
Implementation-Plan.md`. Real file upload (PNG/JPEG/PDF, 4MB max) to a
private Supabase Storage bucket — proxied through the backend (consistent
with this codebase's "backend brokers every write" pattern), downloads via
backend-issued short-lived signed URLs gated by the same RLS-scoped read.
`Document` model needed zero schema changes (already forward-compatible).
New `app/core/storage.py` (thin Supabase Storage REST wrapper),
`document/repository.py`/`schemas.py`/`service.py`/`router.py` extended.
`SUPABASE_SERVICE_ROLE_KEY` added to config; `httpx` + `python-multipart`
promoted to runtime dependencies. File limits tightened from the
originally-proposed JPEG/PNG/HEIC+10MB to PNG/JPEG/PDF+4MB per Basheer's
call. Real bug caught and fixed during build: extending `delete_document`
to also delete the Storage object would have broken deleting Product
Catalog's URL-only collateral links — fixed by skipping the Storage call
when `storage_path` is an external URL. 472/472 backend tests passing (18
new). `Business-Rules.md` (new `BR-ACT-08`) and `Deployment-Topology.md`
updated.

Bucket had to be recreated lowercase `documents` (bucket names are
case-sensitive). Verified against live Dev/Storage via a service-layer
script first; **real bug found only once Basheer tried the actual UI**:
`uploadOpportunityDocument` (`services/documents.ts`) sent `FormData`
through the shared `api` axios instance, which defaults to `Content-Type:
application/json` — axios's `transformRequest` JSON-stringifies `FormData`
whenever the configured Content-Type contains `application/json`, so the
backend received no real `file` field. Fixed by explicitly overriding
`headers: {"Content-Type": "multipart/form-data"}` on that one call — a
bug class the service-layer verification script structurally couldn't
have caught. In-app document preview added afterward, not in the original
plan (Basheer's UI feedback: viewing forced a download) —
`DocumentPreviewModal` (PDF in an `<iframe>`, images in an `<img>`, both on
the signed URL, explicit in-modal Download button).

Manual testing was paused mid-checklist by a different, concurrent
session's Zone Hierarchy work leaving Dev in a broken transitional state
(`Zone` model expecting columns migration `0019` hadn't applied yet) — no
actual file collision between the two sessions' own code, confirmed. Once
migration `0019` landed, the rest of the checklist (rejection cases, phone
camera capture, delete, cross-tier visibility, Product Catalog regression,
multi-doc ordering) was confirmed by Basheer through the real UI.
Committed `49c4c1d` (16 files, explicitly staged — the shared working tree
also held the other session's uncommitted Zone Hierarchy files and
`Backlog.md`'s mixed diff, none swept in), pushed to `origin/main`
(`59baa6b..49c4c1d`).

---

## 2026-08-10/11 — Zone Hierarchy: territory data gathering, design, and backend build — shipped, `1e8bb5a`

**Territory data gathering** — `docs/Zone-Hierarchy-Territory-Data-
2026-08.md`, kept separate from the design doc since it churns
independently. Gathered from Adarsh (South Kerala, incl. Vivek reporting
to him), Shruthi (Bangalore + wider Karnataka), and Fahad/Fazal (North
Kerala, Karnataka Coastal). Several real corrections made along the way:
Idukki/Alappuzha needed a 4th tree level (Zone → District → Taluk) to
represent the Adarsh/Vivek split, validating the flexible-depth design;
"Fahad" and "Fazal" were initially wrongly read as the same person (they
aren't — Fahad reports to Fazal), corrected across every section that had
propagated the error; the Coorg/Kodagu district was claimed by two
different managers' data, resolved to Fahad/Fazal's Karnataka Coastal
cluster per Basheer's call; two informal cluster names settled ("Karnataka
South" for Nagesh Ninganoor's grouping, "Karnataka Central" for
Ravikumar's). Kerala confirmed as North + South zones only for now —
Central Kerala dropped from the working table, its live zone row's fate
(deprecate vs. leave dormant) left as an open question. 13 open questions
logged, 5 resolved by end of gathering; not yet reviewed by Haroon.

**Design** — `docs/Discussion-Zone-Hierarchy-2026-08.md` and `docs/
Zone-Hierarchy-Technical-Design.md`. Self-referencing tree (`zone.
parent_zone_id`, table keeps its name, not renamed to `territory`) +
advisory `zone_level`; `zone_closure` "coverage binder" table,
app-recomputed; RLS Area Manager branch rewritten a second time (Multi-
Zone Milestone 1 took it scalar→flat set-membership, this takes it
flat→closure-based tree-membership); shared zone picker (default-to-own-
zone, type-ahead override) planned to eventually replace the flat picker
across Account create/edit, User Directory, Pipeline Zone filter, and
Customer Directory; Admin Territory Management screen designed
(add/rename/re-parent/deprecate, blast-radius shown before a move).
Basheer's framing shift mid-design: plan on the assumption territory
groupings will keep changing, with the Admin edit screen as the mechanism
that absorbs that, rather than blocking on full stakeholder review first.
**Two real gaps found in review and fixed, not just noted**: (1)
deprecated-zone RLS visibility was left implicit — now explicit and
deliberate: deprecating a zone grandfathers existing `user_zone`/
`account.zone_id` visibility, revokes nothing, blocks only new
assignments (mirrors `BR-FIN-06`'s split grandfathering). (2) the
closure-table maintenance algorithm was simplified from an incremental
"recompute just the affected subtree" variant to one always-correct full
rebuild — the incremental version was judged exactly the kind of logic
where an off-by-one silently mis-grants RLS visibility, a security risk
not worth accepting for a performance gain nobody needs at this scale.

**Backend build** — `docs/Zone-Hierarchy-Implementation-Plan.md`. Built
deliberately in parallel with the concurrent Document Upload session, file
overlap checked repeatedly and confirmed zero conflict throughout (this
build only ever touched `reference/*`, `organization/repository.py`,
`main.py`, `alembic/versions/0019_*`, and their tests). Migration `0019`
applied to the live Dev DB by Basheer directly (two of my own attempts were
blocked by the Claude Code auto-mode safety classifier, which chat
approval alone doesn't satisfy) and independently verified against it —
`zone` gained `parent_zone_id`/`zone_level`; `zone.name`'s global unique
constraint relaxed to per-parent (`uq_zone_parent_name`) + a partial index
for the root case (`uq_zone_root_name`); new `zone_closure` table seeded
with exactly 5 self-rows; `opportunity_tier_visibility`'s Area Manager
branch confirmed rewritten to route through `zone_closure` via
`pg_get_expr` against the live policy. `docs/Physical-Schema.sql`
regenerated and diff-reviewed line by line. `ZoneRepository.
rebuild_all_closure()` built as the *only* closure-maintenance method (no
incremental variant), single recursive-CTE rebuild. `deprecate_zone` flips
`is_active=False` only, touches nothing else, matching the grandfathering
design. New `reference/service.py`/`router.py` (6 endpoints under
`/admin/zones/*`, Admin/GM-gated). `TEAM_SCOPE_BUILDERS["Area Manager"]`
(`organization/repository.py`) rewritten to the same closure-based logic.
38 new/updated tests, 505/505 backend tests passing, ruff clean.

**Real bug found during manual live verification, not by any automated
test**: `rebuild_all_closure()` used `TRUNCATE zone_closure`, but the
app's actual runtime DB role (`cabio_app`) is only granted DELETE/INSERT/
SELECT/UPDATE on that table, not TRUNCATE — confirmed via `information_
schema.role_table_grants` after the real endpoint code path failed with
`InsufficientPrivilege` while creating two isolated test zones
(`TEST-Parent`/`TEST-Child`) for manual RLS verification. This would have
made `create_zone`/`update_zone`(re-parent)/`rebuild-closure` fail in
production, not just in the verification script. Fixed to `DELETE FROM
zone_closure` (functionally identical here — no sequence to reset, table
stays tiny) — the matching repository test updated, full suite re-verified
green, and the fix confirmed working live against Dev before proceeding.

Committed `1e8bb5a` (19 files, staged explicitly — `active_progress.md`
and `Backlog.md` deliberately excluded, their working-tree diffs mixing
content from this and the concurrent Document Upload session). **Not yet
pushed** — Basheer's six-tier manual RLS verification (steps 1-4 backend/
RLS-layer, steps 5-8 broader spot-checks) still in progress; see
`active_progress.md`'s current task for status.

## 2026-08-12 — Zone Hierarchy territory data: SBU (Imaging/Critical Care) split added

Data-gathering only, no code — `docs/Zone-Hierarchy-Territory-Data-2026-
08.md` updated. Basheer relayed new field input from two more managers,
Nishad and Adydev, for North Kerala. Clarifying back-and-forth surfaced
that territory coverage in this doc had never tracked **SBU** (Imaging vs
Critical Care — an existing RLS security boundary in the live system,
just not previously a dimension of this doc) as its own axis, and that it
needed to be.

Confirmed by Basheer: **Nishad** holds the North Kerala Critical Care SBU
charge directly for Kozhikode, Malappuram, and Wayanad; **Adydev** reports
to Nishad within Critical Care and handles Kannur and Kasaragod. This also
surfaced, as a side effect, that **Fahad** (previously only on record for
the Karnataka Coastal cluster) holds the North Kerala **Imaging** SBU
charge directly — confirming a standing open question in that doc's North
Kerala section that had been open since the 2026-08-11 Fahad/Fazal
correction. Also confirmed: **Shruthi's entire cluster (Bangalore + wider
Karnataka) is Imaging**; **Adarsh's entire cluster (South Kerala) is
Critical Care**.

Added an SBU column to the doc's consolidated table (all ~36 rows,
including 5 new rows for the Nishad/Adydev Critical Care assignments),
updated the North Kerala tree diagram to show separate Imaging/Critical
Care branches, and logged new open questions rather than guessing past
the actual gaps. Both single-SBU states initially looked like data gaps
(a missing counterpart manager not yet identified) but turned out, on the
same day, to be business scope instead: **Karnataka sells Imaging
products only** (confirmed directly by Shruthi for her whole cluster, and
by Basheer that the same holds for Fazal's Karnataka Coastal territory —
which also retired the ⚠-inferred SBU flags on those Karnataka Coastal
rows), and **South Kerala sells Critical Care products only** (confirmed
by Basheer). No open SBU coverage gaps remain; Kerala (via its North/
South split) is the only state confirmed to run both SBUs side by side.
Remaining open questions, none of them coverage gaps:
- Whether Nishad reports to Fazal (North Kerala's established Area
  Manager) the way Fahad's Imaging line is presumed to.
- Whether Fazal is still a single cross-SBU North Kerala Area Manager
  above both Fahad and Nishad, or whether the SBU split runs all the way
  to the top with no shared manager.
- Whether the Critical Care and Imaging district lists matching exactly
  (same five North Kerala districts on both sides) is deliberate or
  coincidental.

Existing Imaging-side data (Irfan, "Staff New", Fazal) left untouched,
just relabeled as presumed-Imaging (⚠) rather than overwritten — matching
this doc's established practice of recording new information as an
addition or explicit correction, never a silent overwrite, when it
doesn't cleanly resolve an existing row (same pattern as the Fahad/Fazal
correction). Feeds open decision #2 in `docs/Discussion-Zone-Hierarchy-
2026-08.md`, same as the rest of this doc. Purely a data/planning
artifact — no schema, model, or RLS impact; the live `zone`/`zone_closure`
tables and `opportunity_tier_visibility` policy from the 2026-08-10/11
build above are unaffected.

## 2026-08-12 (later) — Zone Hierarchy verification completed, pushed; SBU
manager-SBU fix; Territory Admin screen built; ZonePicker + coverage-view
planned

**Backend verification (steps 5-8) completed, all three commits pushed.**
Step 5's cross-zone isolation check surfaced a real finding, root-caused
live against Dev: the Test Area Manager (scoped to North Kerala +
TEST-Parent) could see an unrelated real opportunity ("usg m/c" /
"aster medicity," Central Kerala). Traced by evaluating each OR-branch of
`opportunity_tier_visibility` individually against that user+opportunity —
the closure-based Area Manager branch correctly excluded it; the actual
cause was `cabio_app_assigned_reminder()`, a pre-existing, deliberate
carve-out from migration `0011` (2026-07-27, predates this session's work
entirely) firing on a stray leftover reminder from an earlier RLS-testing
round that reused the same test user. Not a Zone Hierarchy bug. Steps 6-8
(control zone, unaffected-tier spot-check, Activities/Documents/Reminders
regression) passed clean. Pushed as three commits: `1e8bb5a` (Zone
Hierarchy backend), `c6c287f` (default landing screen to Pipeline, a small
unrelated backlog item picked up the same session), `aca2e9c` (see next).

**Admin/GM manager-SBU match bug found and fixed, `aca2e9c`.** Surfaced
live: assigning a different SBU to a user via User Directory failed with
"Manager must belong to the same SBU as the user" whenever the manager was
Admin/GM. Root cause: `organization/service.py`'s `create_user`/
`update_user` compared `manager.sbu_id` against the target's SBU
unconditionally — but Admin/GM's own `sbu_id` is a real column value
(not yet nullable, separate open Backlog item) that's a meaningless
placeholder, not real membership. Fixed by exempting managers whose role
is in `_USER_WRITE_ROLES` from the same-SBU check, in both functions.
Two new parametrized regression tests
(`test_allows_admin_or_gm_manager_in_different_sbu`). Full 509-test suite
green. (A separate, deliberately out-of-scope UX gap was found in the same
investigation: the frontend always resends a user's existing `manager_id`
on every save, even when untouched, so moving a user with a *normal*
manager to a new SBU still fails today — left as a known, named gap, not
fixed this session.)

**Territory Admin screen built and committed, `f6a2a11`** (`docs/Territory-
Admin-Screen-Implementation-Plan.md`) — new `TerritoryAdminScreen.tsx`,
tree view with inline Add/Edit/Deprecate actions and a "Refresh Territory
Visibility" button (renamed from "Rebuild Closure" for plain-language
clarity), new Admin/GM-gated nav entry. No new frontend dependency — a
small recursive component over existing `List`/`Collapse`, not
`@mui/x-tree-view`. Reuses `FormModal` for the deprecate confirmation too
(blast-radius count + grandfathering copy as plain children, no new dialog
component). `tsc`/lint/`build` all clean. **Committed and pushed; not yet
manually verified on Dev by Basheer.**

**Real zone data entry started** — Karnataka and Kerala created as new
top-level states; Bangalore and a new "Coastal Karnataka" zone placed
under Karnataka (Mangalore under Coastal Karnataka); North/South/Central
Kerala placed under Kerala. Verified live: `zone_closure` correctly
propagates two levels deep (Karnataka's descendant set already includes
Mangalore through Coastal Karnataka). **Three open action items from this
review, not yet actioned:**
1. Central Kerala is active under Kerala — per Basheer's standing decision
   (Kerala runs North+South only going forward), it should be deprecated
   once its blast radius is checked, not left active indefinitely.
2. Naming: built as "Coastal Karnataka," but `Zone-Hierarchy-Territory-
   Data-2026-08.md` settled on "Karnataka Coastal" — worth confirming
   intentional, since that doc flagged this exact name as needing
   confirmation from Shruthi/Fahad directly.
3. `TEST-Parent`/`TEST-Child` (the RLS-verification fixtures) are still
   live on Dev and should be cleaned up now that verification has passed.

**Design correction: zone assignment isn't Area-Manager-only after all —
Territory Admin needs a coverage view, not an optional one.** Working
through how the real territory hierarchy (State → Zone/Cluster → District
→ Taluk) actually gets built surfaced that only the Area Manager tier
gets a `user_zone` row today (the only tier `opportunity_tier_visibility`
reads it for). But individual field reps (Vivek, Irfan, etc.) — the real
day-to-day owners of a specific district — have no recorded assignment
anywhere in the live system; that fact exists only in the territory
planning doc, not as queryable data. Resolved: `user_zone` assignment was
never actually role-restricted at the API layer (`replace_zones()` already
runs unconditionally regardless of role) — Sales Staff should be assigned
to their leaf zones too, purely as a **responsibility record**, explicitly
inert for RLS (their visibility stays owner-only, unchanged — this is not
a reopening of the earlier-rejected "make Sales Staff zone-aware for
visibility" idea). This makes a "who's assigned to this zone" view on
Territory Admin a required part of the feature, not deferred as originally
scoped.

**ZonePicker + coverage-view plan written, approved, and committed**
(`docs/ZonePicker-And-Coverage-View-Implementation-Plan.md`, part of
`719b83b`), **the feature itself not yet built.** Consolidates two decisions made this session: (1) one shared
`ZonePicker` component (MUI `Autocomplete`, search-and-resolve with a
server-computed breadcrumb path, same proven pattern as `Customer360Screen`'s
Parent Customer field) used at all real zone-picking call sites —
including Territory Admin's own Parent Zone field, not a separate flat
picker there — rather than the originally-scoped five-screen list; (2) the
coverage view itself, extending `GET /admin/zones/tree`'s response with
each node's *direct* assignees (not rolled up through descendants — the
tree's own nesting already shows that), labeled with role so an Area
Manager's real-visibility assignment stays visually distinct from a Sales
Staff responsibility record. Needs a new backend trigram search endpoint
(`zone.name` has no GIN index yet, unlike `opportunity`/`account`/
`product`/`project`) plus a small tree-serialization change (the existing
`ZoneTreeNode.model_validate(z)` recursive-Pydantic call can't produce the
new `assignees` field without an explicit builder function). Confirmed
`QuickLeadModal.tsx` has no zone field at all, one fewer call site than
assumed.

**Sales Manager Tier Collapse** (`docs/Sales-Manager-Tier-Collapse-
Implementation-Plan.md`, from earlier this session, committed as part of
`719b83b`) remains planned only, deliberately not started — needs a
Haroon review first, since it revises a leadership-approved ADR (ADR-009),
not just an engineering cleanup.

**Session wrap-up, all pushed to `origin/main`:** `f6a2a11` (Territory
Admin screen), `719b83b` (Sales Manager Tier Collapse + ZonePicker/
coverage-view plans), `a10168e` (this file + `active_progress.md`'s
handover update). One more small addition after that, still uncommitted:
`docs/Backlog.md` gained an entry for the `UserDirectoryScreen.tsx`
stale-`manager_id`-resend bug (found earlier this session, see above) —
riding along with that file's existing, already-flagged mixed diff until
it gets its own clean review and commit.

---

## 2026-08-06 — Leadership strategic growth discussion (retroactive entry, written 2026-08-13)

Written up in `docs/Discussion-Strategic-Growth-Topics-2026-08.md` at the time
but never given an archive entry — the gap is likely why `docs/Backlog.md`'s
Cardiology item went stale (still read "not yet conceptualized" as of
2026-08-13) and why a later session summary repeated that stale framing
instead of the actual resolution below. Fixed same day: `Backlog.md`'s entry
corrected, and the doc itself gained one addition (see below).

**Four topics from the 2026-08-05 leadership meeting, worked through
2026-08-06:**

1. **Cardiology/Thoracic SBU question — resolved, confirmed with Haroon.** Not
   a new SBU: Haroon sells it himself today, no dedicated team, so no case for
   SBU-level infrastructure (own targets/RLS tier/management chain).
   Cardiology equipment sells under whichever existing SBU (Imaging or
   Critical Care) each product's technology fits. No new tracking field
   either — `category_name` isn't being repurposed (confirmed dead/unused
   anywhere in the codebase or `Business-Rules.md`). Cutover plan for
   whenever Cardiology does graduate to its own SBU is written up (no
   retroactive reclassification; splitting/crediting across the transition
   uses Referral, not Splits) but not needed yet.
   **Addition, 2026-08-13:** confirmed current Cardiology inventory is
   entirely refurbished stock — ties this directly to topic 4 below.
2. **Account Manager concept, tied to incentives — still fully open.** Already
   specified in the PRD (§6.3/§6.3A) as a "Primary Account Manager" per
   account, distinct from `Opportunity.owner_id`. Reframed by the incentives
   angle: the data model (an `account_manager_id` field) is the easy part —
   the hard part is the compensation formula (percentage, cap, additive vs.
   taken from the closer's split), which is a Finance/leadership decision
   that should be settled before any schema work starts. Noted coupling: if
   an Account Manager should own the whole relationship including a future
   Cardiology line, that cuts against Cardiology staying a hard-walled SBU —
   the two decisions need to be made together.
3. **JV geography expansion — narrowed, not resolved.** Confirmed the JV is a
   genuinely separate legal entity needing real data isolation, ruling out
   the "just a new Zone" shortcut. Four candidate legal structures laid out
   (franchise / distributor / sales agency / equity JV), each implying a
   different system pattern (from no shared system at all, to a full Partner
   Portal / PRM-style scoped-login model). "Commission on each machine sold"
   points toward sales agency + Partner Portal, but needs legal/tax
   confirmation before committing — still open, next thing to resolve.
4. **Surfacing buyback/refurbished inventory to reps in the field — still
   fully open.** Distinct from the trade-in data model
   (`Product-Lifecycle-TradeIns-Accessories-Technical-Design.md`, which
   covers recording a buyback): this is the *resale* side — a refurbished
   unit is unit-level (serialized asset, not a SKU), needs a "reserve this
   unit" mechanism to prevent two reps pitching the same physical machine,
   and needs to be findable on mobile in the field. Ties to the open GST/
   invoicing question from the trade-in design. Natural Phase 2 of the
   trade-in work once GST is answered, not designed separately.

**Not yet touched anywhere:** Account Manager compensation formula and the
buyback/refurbished-inventory field-discovery design — both need Finance/
leadership input before any design work starts.

## 2026-08-13/15 — ZonePicker + Territory Admin coverage view; User Deactivate/Reactivate; Sales Manager Tier Collapse

**ZonePicker + Territory Admin coverage view — shipped, `4f814e3`, manually
verified.** All 6 backend pieces and 5 frontend retrofits from
`docs/ZonePicker-And-Coverage-View-Implementation-Plan.md` built and
verified against Dev. Notable fixes found during the build/verify pass:
- `ZonePicker.tsx` breadcrumb color used `color="info.main"`, an invalid
  MUI Typography `color` value (only bare palette keys or the literal
  `"text.secondary"` are special-cased, not dot-paths) — silently fell
  through to default text color. Fixed to `color="info"`.
- Customer Directory / Opportunity Pipeline zone filters did an *exact*
  `zone_id` match, so picking a parent zone (e.g. "Kerala") returned
  nothing, since accounts are tagged at the leaf level. Fixed
  `account/repository.py::list_accounts` and
  `opportunity/repository.py::list_pipeline`/`count_pipeline` to match the
  picked zone's full subtree via `zone_closure`.
- Duplicate zone name (same name, same parent) crashed with a raw 500
  instead of a clean error — `reference/service.py`'s `create_zone`/
  `update_zone` let the DB's unique constraint throw uncaught. Added
  `ZoneRepository.exists_by_name()` + a `ConflictError` (409) pre-check.
- Clearing the Parent Zone field on Edit silently did nothing —
  `update_zone` only treated a *new* parent id as a move, never a move
  *to* null. Fixed via Pydantic's `model_fields_set`, paired with an
  explicit "top-level zone" checkbox in the Add/Edit form.
- Soft name-collision warning added: Add/Edit Zone form warns (non-
  blocking) if the name typed already exists elsewhere in the tree under
  a different parent — new `GET /admin/zones/name-check` endpoint,
  debounced frontend check. Deliberately non-blocking since the DB
  constraint already permits same name in different branches on purpose.
- Territory Map sort fix: `Zone.children` had no `order_by`, unlike
  `get_tree()`'s root query — added `order_by="Zone.name"`.
- Post-build UX add-ons: Territory Admin's assignee chips gated behind a
  "Show/Hide Coverage" toggle (were cluttering the default tree view);
  New Customer form pre-fills Zone from the logged-in user's own zone.

**User Deactivate/Reactivate — shipped, `980d81b`.** Closed a gap found
while cleaning up 5 test-fixture users: no way to deactivate any user,
ever, through the app. Built to match the proven zone-deprecate pattern
(grandfathered, non-destructive, reversible, visible-but-grayed-out).
Backend: `UserListResponse.is_active`, `UserBlastRadius` schema,
`UserRepository.blast_radius`/`list_active(include_inactive=...)`,
`UserService.deactivate_user`/`reactivate_user`, 3 new endpoints. The 3
assignment pickers (Next Action/Split participant/Opportunity owner) stay
active-only; only User Directory's own listing and the Pipeline Owner
filter (deliberately, so a deactivated owner's existing deals stay
findable) can opt into `include_inactive`. Frontend: Show/Hide Inactive
toggle, Deactivate/Reactivate icon per row, grayed-out rendering.

Notable bugs found and fixed during manual verification:
- `UserRepository.blast_radius`'s lazy import pulled `OpportunityStatus`
  from the wrong module (`opportunity.models` instead of
  `reference.models`) — a plain `ImportError` only surfaced when the
  method actually ran, invisible to import-only checks.
- Deactivating a manager (Haroon, 5 direct reports) silently cleared the
  "reports to Haroon" label everywhere — the name lookup only searched
  the active-only-by-default `users` list. Fixed by always fetching the
  full roster and applying "Show Inactive" as a client-side row filter,
  not a fetch filter; the Manager dropdown now lists inactive managers
  too (red, disabled) so existing assignments still render correctly.
- A deactivated user's Supabase Auth credentials still granted app-shell
  access, since Auth has no concept of `user_profile.is_active`. Took
  three iterations to close correctly: `AuthContext.tsx`'s `signIn()`
  originally set local session state before checking `/auth/me`, letting
  `onAuthStateChange` race ahead independently and briefly grant access
  anyway; consolidating both paths around one `applySession()` helper
  (only place allowed to set a non-null session, only after `/auth/me`
  succeeds) fixed the flicker, but then introduced a double-submit path
  where a second `signIn()` call could wipe out the first attempt's error
  state before the user saw it. Final fix: a `signingInRef` guard so the
  listener skips any event already being driven end-to-end by an
  in-flight `signIn()` call — exactly one handler per login attempt.
- **`npm run generate:types` overwrote `types/api.ts`** and silently
  deleted the hand-maintained block of convenience type aliases (~23
  lines, not auto-generated) — broke type-checking across ~15 unrelated
  files. Recovered via `git diff`; flagged as worth fixing properly later
  (teach the generator to preserve the block, or drop the aliases).
- **Never ran the real backend test suite this whole thread** — only
  import/manual-exercise checks. A concurrent session (Sales Manager Tier
  Collapse, below) happened to run `pytest` and found 4 pre-existing
  failures, all traced back to this thread: the `include_inactive` kwarg
  addition broke a strict `assert_called_once_with` in
  `test_organization_service.py`, and `test_zone_service.py`'s shared
  mock never set `exists_by_name.return_value = False` so it defaulted
  truthy, tripping a false `ConflictError` on every zone create/rename
  test. Both fixed; full suite went to 509 passed, 0 failed. **Lesson:
  `pytest` needs to run before calling backend work done, not just `ruff
  check` + manual method calls.**

**Sales Manager Tier Collapse — built, migration `0021` applied to Dev,
committed.** Per `docs/Sales-Manager-Tier-Collapse-Implementation-Plan.md`
— Basheer confirmed no Haroon review gate needed (ZonePicker/Territory
Admin verification was already done, closing the plan's sequencing
concern; the org reframing doesn't reduce leadership-approved intent).
Folded the retired Sales Manager tier's `manager_id` rule into the Area
Manager RLS branch as an additional OR-condition, dropped the role.

*Preflight surprise:* the plan assumed the `Test - Sales Manager` fixture
user was a clean delete. A live-Dev FK sweep across all 41 constraints
referencing `user_profile` found it wasn't — real dependents on
`opportunity`, `opportunity_item`, `split`, and `user_zone`. Basheer
reassigned the fixture's `role_id` to Area Manager directly in Supabase
Table Editor instead of deleting the row, clearing the only reference to
the retired role without cascading into those other tables.

*Built:* migration `0021` (`ALTER POLICY opportunity_tier_visibility`
folding `manager_id` in; `DELETE FROM role` for the retired id — 0 rows
on Dev since already manually cleared, but needed for fresh/UAT/Prod).
Python mirror in `organization/repository.py`'s `TEAM_SCOPE_BUILDERS`.
Six test files updated. Docs: `Opportunity-Access-Hierarchy-Technical-
Design.md` (5-tier table + dated revision note, old table kept for
history), `ADR.md` ADR-009 (dated Amendment, not a rewrite),
`Business-Rules.md` (BR-ORG-01/02), `Seed-Data.sql`, `Physical-
Schema.sql` (RLS policy text re-synced to match Dev).

*Manual verification found a test-scenario flaw, not a code bug:* first
attempt used Amit R (Sales Staff, current `sbu_id` = Critical Care) →
Arun Adarsh (Area Manager, Critical Care, South Kerala only), expecting
his North-Kerala-zoned opportunity to appear via the new `manager_id`
fold. It didn't. Root cause: both of Amit R's live opportunities are
stamped `sbu_id` = Imaging from when he was created — frozen at creation
per the Access Hierarchy doc's §8 ("SBU Transfers — Frozen Attribution"),
unaffected by his later move to Critical Care. The Area Manager branch's
outer `sbu_id = cabio_app_sbu_id()` guard blocked visibility before the
`manager_id` fold was ever evaluated — confirmed by directly checking the
live policy text and the fixture's DB state, nothing had regressed. A
same-SBU real-data case (Basheer K → Fazal, "Ultrasound m/c" account in
South Kerala, both Imaging) was identified as the corrected test but not
yet run before session close.

## 2026-08-17 — Activity Notes multi-line fix; Zone Deactivate/Reactivate; full regression pass

**Activity Notes multi-line entry — shipped, `c9861a0`/`1a3738d`.** Sales
staff feedback from 2026-08-11 ("notes field is not allowed to go the
next line") had its root cause found and parked in the backlog at the
time. Picked up this session: `FormModal.tsx`'s `onKeyDown` guard called
`e.preventDefault()` on Enter for both `INPUT` and `TEXTAREA` tags — meant
to stop a plain `<input>` from accidentally submitting the form, but a
MUI `multiline` `TextField` renders as a `TEXTAREA`, so this also blocked
it from ever inserting a newline. One-line fix: drop `TEXTAREA` from the
check (a native `<textarea>`'s Enter never implicitly submits a form, so
nothing was actually being guarded there). Verified safe for the other
two `FormModal`-hosted `multiline` fields too (`ProductCatalogScreen.tsx`
Description, `CloseReminderModal.tsx` "What was done?").
Follow-on found during manual verification: three read-only *display*
sites (`ActivityTimeline.tsx`, `DailyActivityReportScreen.tsx`,
`ReminderRow.tsx`) rendered `notes` in a plain `Box` with no `whiteSpace`
style, so newlines were saved correctly but collapsed visually — fixed
with `whiteSpace: "pre-wrap"`. Same root cause, once surfaced, found two
more instances: buyback item descriptions
(`OpportunityDetailScreen.tsx`'s Products tab) and product descriptions
(`ProductCatalogScreen.tsx`'s Product Detail view) — both multiline
fields wrapped in `FormModal` (so already input-fixed as a side effect of
the first fix), both missing the same display-side `pre-wrap`. Fixed in a
second commit (`1a3738d`). Deliberately left untouched:
`OpportunityItemsList.tsx`'s compact list-row rendering, which is
intentionally `whiteSpace: "nowrap"` + truncated by design, not a bug.

**Zone Deactivate/Reactivate — shipped, `b0b4109`.** Territory Admin's
zone lifecycle was one-way (`deprecate_zone` set `is_active = false`, no
path back through the app) — surfaced concretely when Central Kerala got
deprecated 2026-08-15 with no in-app way to undo it. Renamed
"deprecate"→"deactivate" throughout the Zone domain to match User
Directory's already-shipped Deactivate/Reactivate vocabulary, and added
the missing `reactivate_zone` service method + endpoint, mirroring
`UserService.reactivate_user` near-verbatim. No migration —
`zone.is_active` already existed. Full backend+frontend guard-green
(pytest 514 passed, ruff clean, `tsc`/`lint`/`build` clean).

**Full regression pass — `docs/Regression-Test-Plan-2026-08.md`, completed
2026-08-17.** Both pre-listed blockers resolved before starting: Central
Kerala confirmed `is_active = false` on live Dev (already correct,
doc was stale); `Test - SBU Manager` reactivated (doubling as A3's
reactivate-user check). All of Part A (A0–A9) passed, plus B5/B8/B9 and
both remaining Part C checks — nothing broken. Notable findings, all
confirmed correct/expected rather than bugs:
- **A0 (Sales Manager Tier Collapse RLS):** Basheer K → Fazal manager
  reassignment correctly surfaced Basheer K's South Kerala opportunities
  on Fazal's Pipeline via the `manager_id` fold — confirming the fold is
  genuinely zone-unconditional (`owner_id IN (SELECT id FROM user_profile
  WHERE manager_id = cabio_app_uid())`, no zone clause at all). Basheer K
  (Admin) never appears in Fazal's Owner-filter dropdown regardless,
  because `organization/repository.py`'s `not_unrestricted` filter
  excludes Admin/GM from every scoped picker listing unconditionally —
  correct, pre-existing, unrelated to the fold.
- **A1 (Zone Hierarchy RLS):** Arun Adarsh's empty Pipeline (Critical
  Care, South Kerala + 3 districts) was real data thinness, not a
  visibility bug — confirmed via direct DB check that all 4 live Critical
  Care opportunities are owned by Nishad K V in North Kerala, entirely
  outside Arun's coverage, and his one direct report (Vivek) owns
  nothing. Shruthi's Pipeline showing a Lost, cross-zone (North Kerala)
  split with Basheer K alongside her own Bangalore deal doubled as a live
  confirmation of A7 (split zone-restriction drop) — `cabio_app_has_split`
  is correctly unconditional on both zone and status (Won/Lost don't hide
  a deal from a split participant, per ADR-028).
- **Pipeline's Owner filter vs. RLS visibility:** confirmed these are
  deliberately different questions — the filter is a literal
  `Opportunity.owner_id == owner_id` match, while RLS asks "does this
  person have *any* legitimate reason to see this row." Filtering by
  Owner = Shruthi correctly excludes the split deal she doesn't own.
- **Next Actions is personal-scoped, even for Admin:** confirmed via DB
  that Abdul Latheef P has exactly 1 reminder total (completed, 0
  pending) — Next Actions never broadens to "everyone's tasks" regardless
  of role, unlike Accounts/Opportunities visibility.
- **A2 cleanup:** two orphaned test zones (`Darwad`, `REGRESSION TEST
  ZONE`) found still `is_active = true` on live Dev with no accounts/
  users/children referencing them — deleted directly (`zone_closure` rows
  first, then the `zone` rows, then a full closure rebuild), verified
  clean and consistent afterward.
- **Territory Map "Add Zone" perceived slowness:** investigated and
  confirmed not a backend/algorithmic issue — the closure-rebuild query
  itself runs in ~56ms against the current 43-zone tree; the felt latency
  is several sequential round-trips per request (auth, parent lookup,
  duplicate-name check, insert, closure delete+rebuild) plus a second
  full tree refetch, each paying round-trip cost to the remote Supabase
  pooler. Logged as a real but low-priority backlog item (Admin-only
  tooling, not demo-facing), not fixed this session.
- One originally-listed Part C check ("Catalog gate is the only role
  restriction anywhere") was dropped as stale during the pass — written
  before RLS/tier-visibility existed, directly contradicted by the entire
  Part A surface this doc exists to test.

Landed independently the same day, outside this regression-testing
thread entirely (`91a0906`): Admin/GM made SBU- and zone-agnostic
(migration `0022`) — see `docs/Admin-GM-SBU-Agnostic-Implementation-
Plan.md` for full detail; noted here only because it changed
`organization/service.py`/`repository.py` files this session's earlier
work also touched. One loose end from that work: `Physical-Schema.sql`
regen still pending, blocked on Docker Desktop's daemon not running
locally.

Demo moved from 2026-08-17 evening to 2026-08-18 evening.
