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

**Still outstanding**: the entire Multi-Zone Milestone 1 backend (migration
`0018` + all code) plus today's Split-picker Admin/GM fix are **not yet
committed** — Basheer was asked whether to commit before or after the
frontend work and hasn't answered yet. Frontend changes
(`UserDirectoryScreen.tsx`, `types/api.ts`) are also uncommitted. Next:
Basheer's manual in-browser verification of the multi-zone UI, then commit
(backend + frontend, together or separately per his call).
