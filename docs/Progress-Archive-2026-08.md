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

**Post-regression backlog work, same night.** With the extra day, picked
two small items off `docs/Backlog.md` instead of new feature work.

*Product-picker label consistency — investigated, dropped, not built.*
The backlog entry claimed the Opportunity item-picker showed `{p.name}`
only while Installed Base dropdowns showed `{p.name} — {p.model_number}`.
Checked both halves directly against the live catalog before touching any
code: zero products share a `name` (queried directly — no duplicates
exist), so there's no actual disambiguation gap for a model-number suffix
to close; and `name` is already, for ~27 of 29 real products, a literal
`"{oem_name} {model_number}"` concatenation (e.g. `EDAN` + `SE-1200
Express` = `EDAN SE-1200 Express`), so appending the model number again
would mostly just repeat it on the same line. Also found the "Installed
Base already does this" half of the original claim was itself wrong —
that dropdown doesn't show the model number either, only the read-only
saved-asset summary row does, likely stale since `Customer360Screen.tsx`'s
MUI rewrite. One real product (`Siemens USG M/c`, model `P500`) has a name
that doesn't surface its model number, but that's a single mislabeled
row, not a systemic pattern. Backlog entry updated to record this rather
than left stale.

**User Directory manager_id-resend fix — shipped, `49e7dfd`.** The
backlog item surfaced 2026-08-12: the Edit form always resent a user's
existing `manager_id` on save even when untouched, so changing someone's
SBU while their manager was a normal (non-Admin/GM) person from the old
SBU would fail with "Manager must belong to the same SBU as the user" —
correct from the backend's perspective, confusing from the admin's, since
the Manager field was never touched. Fix: the SBU `TextField`'s
`onChange` now looks up the currently-selected manager in the
already-fetched `users` list and clears `manager_id` back to `""` if that
manager is a normal person whose `sbu_id` no longer matches — Admin/GM
managers stay exempt, mirroring the backend's own exemption
(`organization/service.py`'s `_USER_WRITE_ROLES` check).

*Two-bug investigation, not a one-line fix in practice.* First manual
test (Vivek: Critical Care → Imaging, manager Arun Adarsh) showed the
Manager field still displaying "Arun Adarsh" both live in the form and
after save — looked like the fix wasn't working at all. Ruled out a stale
Vite bundle first (only one dev-server process running, no PWA
`devOptions` registering a service worker in dev mode, so a hard refresh
should have been sufficient — and was, for the live-form half of the
report). Direct DB check of Vivek's persisted row (`sbu_id` = Imaging,
`manager_id` still Arun Adarsh) confirmed the save-time behavior was
genuinely broken, not a caching illusion. Root cause: `handleUpdate` sent
`manager_id: form.manager_id || undefined` — when the field is cleared to
`""`, that becomes `undefined`, and `JSON.stringify` drops
`undefined`-valued keys entirely from the request body. The backend's
`exclude_unset=True` partial-update semantics treat an *absent* key as
"leave this field alone," not "clear it" — so the PATCH silently no-op'd
on `manager_id` every time. Fixed by sending explicit `null` instead.
**Side finding, not previously known:** this same bug means manually
selecting "No manager" from the dropdown and saving has likely never
actually worked for anyone, for any user, since this screen shipped —
not just for this new SBU-auto-clear path. The second, apparently
unrelated report (retest after hard refresh looking identical) turned out
to have a mundane explanation, not a second bug: Vivek's `sbu_id` was
already persisted as Imaging from the first failed save, and MUI's
`Select` doesn't fire `onChange` when the already-selected option is
picked again — so that particular retest never actually exercised the
code path at all.

Verified end-to-end on live Dev: reverted Vivek to Critical Care first
(matches Arun Adarsh, so no clearing expected — clean baseline), then
redid the genuine test (Critical Care → Imaging) — Manager field reset to
"No manager" live in the form, save succeeded, DB confirmed
`manager_id = NULL` afterward, User Directory list stopped showing
"reports to Arun Adarsh." Reverted Vivek to his correct real-world state
(Critical Care, reports to Arun Adarsh) afterward, since he's a real
person's account, not a fixture. `tsc --noEmit`/`npm run lint` clean.

**Session closed for the night.** Tomorrow's plan (2026-08-18, before the
evening demo): `ProjectDirectoryScreen.jsx`'s full MUI migration as the
main event — deliberately deferred rather than started at the tail end of
this already-long session, given it's the largest remaining item in the
migration backlog and the project's own per-file ritual is slow by
design. Two small, low-risk items queued to pick up first: the activity
query correctness gap (`list_by_opportunity`'s approximated total) and
the input text size/weight theme fix. Full detail in
`.claude/active_progress.md`.

## 2026-08-16/17 — Vivek account correction; Admin/GM SBU-agnostic; Fazal/Naeem territory split; Add Opportunity status-gate gap found

**Amit R to Vivek account correction, executed directly on Dev.** A
background check (triggered outside this session's visible context)
into renaming Sales Staff "Amit R" to "Vivek" found they were not a
naming inconsistency -- the `user_profile` row labelled "Amit R" already
had the exact profile (manager Arun Adarsh, Critical Care) of the real,
distinct field rep "Vivek" already documented in `docs/Zone-Hierarchy-
Territory-Data-2026-08.md`, who had no account at all. Basheer confirmed:
the "Amit R" row was itself the mis-labeled placeholder for what should
have been Vivek's account all along, not two people needing two accounts.

Renaming in place turned out not to be viable once a real login was
needed: `user_profile.id` must equal the Supabase Auth `id` (ADR-024),
and the old row's id was a synthetic demo-seed value with no matching
Auth account -- Supabase's Dashboard "Add user" flow can't be told to
reuse an arbitrary existing UUID either. Basheer created a real Auth
account (`vivek@cabio-demo.com`), confirmed by direct `auth.users` query.
Migration executed as one transaction: new `user_profile` row on the real
Auth UUID (Sales Staff, Critical Care, manager Arun Adarsh) then
re-pointed every live reference off the old placeholder id (a 50% split
on "New USG m/c," a pending reminder, and -- found only via a full FK
sweep against every table referencing `user_profile`, not just the
opportunities originally suspected -- 3 owned Projects) then replaced the
old coarse "South Kerala" zone-level assignment with the 6 specific
districts from the territory doc then deleted the now-empty old
placeholder row. Verified clean afterward (old row gone, all data intact
on the new one).

**Separate, unrelated finding surfaced reviewing Amit R's original 2
opportunities:** both were stamped `sbu_id = Imaging` despite Amit R's
own `sbu_id` being Critical Care. Not a bug -- `docs/Opportunity-Access-
Hierarchy-Technical-Design.md` section 7/8's "SBU Transfers -- Frozen
Attribution": an opportunity's SBU is fixed at creation, deliberately
never following the owner's later SBU changes, to protect reporting
integrity. The documented remediation for the resulting "who currently
works this deal" gap is a manual ownership handoff -- Basheer reassigned
both opportunities to Basheer K (Imaging), the documented fix, not a
workaround.

**Fazal/Naeem North Kerala territory split, confirmed with Haroon.**
Two corrections to `docs/Zone-Hierarchy-Territory-Data-2026-08.md`,
found to be stale relative to what Basheer had already fixed live:
Alappuzha and Idukki are fully assigned to Vivek (not split with Adarsh
at the taluk level as the doc's older, more granular section still
claimed -- that section predates a since-simplified territory doc pass).
And North Kerala Imaging is now two peer managers, not one: Fazal keeps
only his 3 remaining districts (Kasaragod, Kannur, Kozhikode -- Irfan's,
confirmed reporting to Fazal) plus his existing Mangalore/Karnataka
Coastal charge; **Naeem**, a new Imaging Area Manager hired specifically
for Malappuram/Wayanad, reports directly to **Haroon**, not to Fazal --
resolving a long-open question in that doc about whether a single
cross-SBU North Kerala manager exists above the Imaging/Critical Care
split (it doesn't; Fazal, Naeem, and Nishad are independent peers).
Live Dev's `user_zone` already matched the correction (verified) before
the doc was updated to match.

**Admin/GM made SBU- and zone-agnostic -- investigated, planned, built,
shipped, `91a0906`.** `docs/Backlog.md` had carried this since 2026-07-28
as "real multi-file work, not a quick follow-up." Re-investigated fresh
rather than trusting the year-old scope, since a lot of the code it
worried about (Zone Hierarchy, Multi-Zone Milestone 1, Sales Manager Tier
Collapse, BR-OP-12) had been rebuilt since. Full audit of every RLS
policy referencing `sbu_id` (6 migrations: `0009` through `0012`, `0014`)
found the database security layer was already completely safe -- every
policy gates Admin/GM on role name alone (`cabio_app_role_name() IN
('Admin', 'General Manager') OR sbu_id = cabio_app_sbu_id()`), never
evaluating `cabio_app_sbu_id()` for them. Same for the Python-level
checks (`organization/repository.py`'s `list_active`, the BR-ORG-01
manager-SBU match) -- both already role-branch before touching an
Admin/GM's own `sbu_id`.

**One genuinely dangerous gap found that the 2026-07-28 backlog entry
never caught:** `UserMeResponse.sbu` was non-nullable. Since this backs
`/auth/me`, called on every login, leaving it unfixed would have locked
every Admin/GM out of the app the moment their `sbu_id` went `NULL` --
not cosmetic, a hard lockout. Sequenced first in the build for exactly
this reason.

Decision needed on `UserCreate.sbu_id` (create a new Admin/GM with no
SBU at all, or still require a placeholder at creation and only allow
clearing it later): Basheer chose full support (option b) -- a new
Admin/GM can skip SBU entirely at creation. This also surfaced a second,
real gap the plan's first draft missed: `UserDirectoryScreen.tsx`'s Add
User form unconditionally required SBU regardless of role (`if
(!form.sbu_id) throw new Error("SBU is required")`, no exception) -- so
this ended up touching the frontend too, not staying backend-only as
first scoped.

Built: migration `0022` (`sbu_id` nullable, backfilled to `NULL` by
`role_name`, not hardcoded user ids -- same reasoning as `0021`'s
role-id-constant pattern, applies identically to any environment).
*Real bug caught applying it, not just written correctly the first
time:* the migration's `UPDATE ... SET sbu_id = NULL` ran before the
`ALTER COLUMN ... DROP NOT NULL` -- failed immediately with a
`NotNullViolation` against live Dev. Postgres's transactional DDL rolled
it back cleanly (confirmed `alembic current` still read `0021`
afterward, no partial state); swapped the statement order, reran, clean.
`UserProfile` model, `UserMeResponse`/`UserListResponse`/`UserCreate`
schemas, `set_rls_context()`'s `None`-guard (mirroring the now-dead
`cabio_app_zone_id()` GUC's old guard), `create_user`'s role-conditional
SBU requirement (mirrors BR-OP-12's shape, extended slightly further
than originally planned: the existing manager-SBU-match check now also
exempts the case where the *new user* being created is Admin/GM, not
just where the manager is -- a real gap in the pre-existing check, found
while touching the same lines). 5 new/updated backend tests, full
519-test suite green, `ruff check` clean.

**Critical-path verification, not just unit tests:** exercised
`/auth/me`'s exact code path directly against Dev (real ORM fetch plus
`set_rls_context` plus `UserMeResponse` construction) for all 3 real
Admin/GM accounts with `sbu_id` genuinely `NULL` -- confirmed working
before considering this done, since a passing unit test suite wouldn't
have caught a live-DB-only failure mode here.

**Zone placeholder cleanup, separate and much smaller.** Same session,
Basheer asked about Admin/GM's `zone_id` too. Checked the same things as
for `sbu_id` and found `zone_id` had already been built correctly from
day one: column already nullable, both schemas already `| None`, the
zone-based RLS SQL function (`cabio_app_zone_id()`) already dead code
since migration `0018` moved zone visibility to `user_zone`/
`zone_closure`, the Add/Edit User form never required it, and the
sidebar already rendered it defensively (`userProfile.zone ? ... : ""`).
Pure stale-data cleanup, no code change needed: cleared `zone_id` and
deleted the matching `user_zone` row for all 5 Admin/GM rows (3 real
plus 2 deactivated fixtures) directly. Re-verified `/auth/me` clean
afterward.

**One loose end, not resolved this session:** `Physical-Schema.sql`
regen (`docker run postgres:17 pg_dump ...`) -- Docker Desktop's CLI is
installed on this machine but its engine daemon isn't running, so the
regen command fails immediately. Needs Docker Desktop started, or
Basheer to run the regen himself.

**2026-08-17 (later) -- `ProjectDirectoryScreen.jsx` Add Opportunity SBU
parity bug, found and fixed; bigger status-gate field gap found across
all 3 create screens, fix deferred to tomorrow pending a decision.**
Basheer reported "SBU is required to create an Opportunity as Admin or
General Manager" with no SBU dropdown visible, adding an Opportunity from
within a Project. Root cause: `ProjectDirectoryScreen.jsx`'s Add
Opportunity form never had BR-OP-12's Admin/GM SBU-override logic at
all -- `Customer360Screen.tsx` and `QuickLeadModal.tsx` (+LEAD) both
already had it. Not a regression from the SBU-agnostic work above -- the
form was always missing it; making Admin/GM's placeholder genuinely
`NULL` just stopped it from coincidentally working. Fixed, mirroring the
other two screens' exact pattern: `isSbuOverrideRole` check, a role-gated
"SBU *" dropdown, `payload.sbu_id` wired to it, and the item picker's
product list now refetches against the chosen override SBU (BR-OP-11)
instead of the caller's now-blank placeholder. `eslint`/Tailwind-guard
and `tsc --noEmit` clean. Committed 2026-08-18 (`874bd8f`).

**Bigger gap found immediately after, while checking parity across all
3 Add Opportunity screens per Basheer's request.** Basheer separately hit
"Hold Reason is required to put an opportunity On-Hold." -- with the
trailing period, which turned out to be the tell: that's the *backend's*
validator message (`opportunity/validators.py:161`), not any frontend
screen's client-side check, meaning the request reached the server with
nothing catching it first. `validate_status_transition`'s own docstring
confirms this is deliberate design, not an accident -- it's meant to gate
*creation* too ("Pass `current_status_code='ACTIVE'`... when creating an
opportunity so that non-Active initial statuses are validated"), not just
edits. All 3 create screens (Customer 360, +LEAD, Project) list every
status unfiltered in their initial Status dropdown, and none of them have
Hold Reason/Reactivation Date/Loss Reason/Competitor Name fields or
validation at create time -- only their Edit forms do.

**Deeper than a missing UI field, though:** `OpportunityCreate` (backend
schema) has no `hold_reason_id`/`reactivation_date`/`loss_reason_id`/
`competitor_name` fields at all -- only `OpportunityUpdate` does -- and
`create_opportunity`'s call to `validate_status_transition` hardcodes all
of them to `None` unconditionally. So creating directly into On Hold or
Lost is currently impossible regardless of frontend work; a perfect
dropdown couldn't fix it without a backend schema/service change too.
Two fix directions presented to Basheer, not decided yet: (A) full
support -- add the missing fields to `OpportunityCreate`, thread them
through `create_opportunity`, then build the frontend fields in all 3
create screens; (B) narrower -- stop offering On Hold/Lost/Won as initial
Status choices at create time at all (restrict to Active-family
statuses), since nobody actually creates a deal that's already closed in
normal use, and Edit already handles these transitions correctly
everywhere. **Deferred to tomorrow, decision needed first.**

## 2026-08-18 — BR-OP-10 fix: restrict initial Opportunity Status to Active (option B)

Decision made the next session: **(B)**, the narrower fix — stop
offering On Hold/Lost/Won as initial Status choices at create time,
rather than (A)'s full backend-schema + all-3-screens field build-out.
Investigation before building turned up that this isn't a new policy
call at all: `docs/Business-Rules.md`'s **BR-OP-10** already states
"User-facing Opportunity creation workflows must not allow direct
creation of Opportunities in WON, LOST, STALLED, or ON_HOLD status" --
the 3 create screens were simply violating an existing rule, not
missing an undecided feature. The reference table also has a 5th status
(`STALLED`, `is_system_generated = TRUE`) never surfaced as a user
choice anywhere, so "Active only" is the complete fix, not a partial one.

Same one-line filter added at each of the 3 confirmed create-only
Status dropdown render sites (`oppStatuses.filter((s) => s.status_code
=== "ACTIVE").map(...)`, in place of the unfiltered `.map(...)`):
`Customer360Screen.tsx` ("New Opportunity" modal), `QuickLeadModal.tsx`
(whole modal is create-only; its local `StatusOption` type had to gain
a `status_code` field to support the filter), `ProjectDirectoryScreen.jsx`
("Add Opportunity" modal). Edit/Detail-screen Status dropdowns in all 3
files (`Customer360Screen.tsx`'s and `ProjectDirectoryScreen.jsx`'s own
"Edit Opportunity" forms, `OpportunityDetailScreen.tsx`'s status-change
control) were deliberately left untouched -- full Active/On-Hold/Won/Lost
list still available there, since those are the only place a status
*transition* legitimately happens post-creation. No backend or service
change needed -- `OpportunityCreate` already only ever receives whatever
`status_id` the picker offers.

`npm run lint` (incl. Tailwind guard) and `npx tsc --noEmit` both clean.
Manually verified end-to-end on Dev across all 3 create screens plus the
edit/detail regression check (Basheer's own pass). Committed `91e7fc2`.

## 2026-08-18 — `ProjectDirectoryScreen.jsx` MUI migration — plan agreed, conversion starting

Full triple-conversion plan (Tailwind -> MUI `sx`, manual `.then()`/SWR
cache -> React Query, `.jsx` -> `.tsx`) worked out and agreed with
Basheer before touching code, per the file's size (1,090 lines) and the
project's mandatory per-file migration ritual. One commit, not split --
the fetch and styling code in this file are too entangled to separate
cleanly, same call `ProductCatalogScreen.tsx`/`CustomerDirectoryScreen.tsx`
made on their own migrations.

**Key architectural decision: reuse `Customer360Screen.tsx`'s existing
React Query keys rather than invent new ones**, since that screen
already queries almost identical data (its Projects tab + Add/Edit
Opportunity modals are a near-structural twin of this file's
`ProjectDetailView`). Reusing `["opportunities", "byAccount", accountId]`,
`["opp-items", opportunityId]`, `["stages"]`/`["statuses"]`/
`["leadSources"]`/`["holdReasons"]`/`["lossReasons"]`, `["products",
"picker", sbuId]`, `["sbus"]`, `["users", "all"]`, and
`["projects", "byAccount", accountId]` (all `staleTime: Infinity` where
Customer360Screen.tsx already sets it) means this file's cache is warm
for free whenever the other screen was visited this session, and
invalidating a shared key on mutation refreshes both screens --
resolving the standing Backlog item ("this screen's opportunity
create/update never invalidates React Query caches") as a natural side
effect, not a separate patch. Only the top-level paginated project list
needs a genuinely new key (`["projects", "list", {search, page}]`) since
no other screen already queries it.

Typing plan: local stopgap interfaces (`StageOption`/`StatusOption`/
`UserOption`/`ProductOption`) copied verbatim from
`OpportunityDetailScreen.tsx`, not redefined differently; opportunity/
project lists stay `any[]` via `as Promise<any[]>` casts and
`services/accounts.ts`'s `number`-typed ID params get the same `as any`
cast at call sites, both matching `Customer360Screen.tsx`'s own
treatment of the identical calls -- retyping the shared service layer
itself is the separate, already-deferred Backlog item, out of scope
here. Converting to `.tsx` will also type-check this file's use of
`FormModal`/`ActivityTimeline`/`OpportunityItemAddRow`/
`OpportunityItemsList` (all already `.tsx`) for the first time.

Ritual to follow (per Frontend-Implementation-Standards.md §9): convert
-> property-diff (evidence table against pre-migration git history) ->
triage (§6.8 rules) -> Basheer's manual E2E -> guard-green (`lint` +
`tsc --noEmit`) -> honest §9 table update (moves this file's row from
Pending to Fully Migrated) -> commit. **Not started yet as of this
entry** -- conversion begins next.

## 2026-08-18 (later) -- `ProjectDirectoryScreen.jsx` MUI migration
completed -- last pending file, MUI/React Query/TypeScript migration closed out

Full triple-conversion (1,090 lines): Tailwind -> MUI `sx`, manual
`.then()`/module-level SWR cache (`projectListCache`) -> React Query,
`.jsx` -> `.tsx`, following the plan agreed earlier the same day (above).

**Key decision, not just a same-file port:** rather than inventing new
query keys, this migration deliberately reused `Customer360Screen.tsx`'s
existing keys for data both screens already fetch --
`["opportunities","byAccount",accountId]`, `["opp-items",id]`,
`["stages"]`/`["statuses"]`/`["leadSources"]`/`["holdReasons"]`/
`["lossReasons"]`, `["products","picker",sbuId]`, `["sbus"]`,
`["users","all"]`, `["projects","byAccount",accountId]` (all
`staleTime: Infinity` where `Customer360Screen.tsx` already sets it).
Only the top-level paginated project list needed a genuinely new key
(`["projects","list",{search,page}]`), given `placeholderData:
keepPreviousData` so pagination doesn't flash a full loading state.
Reusing these keys closes the standing gap where this screen's
opportunity create/update never invalidated any cache -- invalidating a
shared key now refreshes Customer 360's Opportunities tab too, as a
natural side effect of the key choice, not a separate patch. The
module-level `projectListCache` `Map` and its `CACHE_TTL_MS`/
`getCached`/`setCache` helpers were deleted outright, not ported --
superseded by React Query's own cache/staleness handling, same
reasoning as every prior migration on this list. Local stopgap types
(`StageOption`/`StatusOption`/etc. pattern) were skipped in favor of
`any` throughout, matching `Customer360Screen.tsx`'s own established
looseness for this exact same Project/Opportunity create/edit shape --
not a new precedent.

**Three real bugs found and fixed during manual verification**
(Basheer's own pass on Dev), none of them in this file's own logic alone:
1. **Query-key collision on `["accounts","picker"]`** with
   `QuickLeadModal.tsx`'s own account picker -- this file's `queryFn`
   returned the full `{items,total}` page object, `QuickLeadModal.tsx`'s
   returned the bare `items` array; since `QuickLeadModal` is
   always-mounted, whichever `queryFn` ran last poisoned the shared
   cache entry for the other, crashing `QuickLeadModal` on every Create
   Project. Fixed by matching shapes (bare array) so the shared entry is
   unambiguous regardless of which component's `queryFn` executes.
2. **Edit Project bounced back to the list on every save** instead of
   reflecting the edit in place -- a pre-existing gap carried over from
   the original file (`selectedProject` was a static snapshot with no
   way to refresh, so returning to the list was the only way to see the
   update). Fixed by patching `selectedProject` locally from the
   already-loaded status/owner picker lists instead of clearing it.
3. **Edit Opportunity's product picker ignored the opportunity's own
   SBU** -- `productsSbuId` only ever resolved from the Add flow's
   override or the caller's own SBU, never the opportunity being edited;
   Admin/GM (whose own `userProfile.sbu` is null per BR-OP-12) saw every
   product unfiltered instead of just the deal's actual SBU.
   `Customer360Screen.tsx`'s own Edit Opportunity modal had the
   identical gap (same pattern, not copied from here) -- fixed there too
   in the same session, single-line addition to its own `productsSbuId`
   resolution.

Also added, adjacent but not part of the migration itself: the global
"+ Lead" button now pre-fills Account/Project from wherever it was
clicked (Customer 360, Opportunity Detail, or a Project's own detail
view), mirroring `LogActivityModal.tsx`'s existing context-inference
pattern exactly -- `QuickLeadModal.tsx` gained `initialAccountId`/
`initialProjectId` props for this.

`tsc --noEmit` and `npm run lint` (incl. Tailwind guard) both clean.
**Manually verified end-to-end on Dev by Basheer** -- full checklist
covering list/search/pagination, Create/Edit Project, Add/Edit
Opportunity (including Admin/GM SBU override and BR-OP-02/03/05
status-gated fields), Products sub-modals, cross-screen navigation via
Customer 360, and ADR-030 always-mounted state preservation across
sidebar navigation. One deliberate non-change confirmed during
verification: `DemoApp.tsx`'s `navigate()` explicitly clears Project
Directory's detail-view selection on every sidebar navigation (via
`projectResetRef`) while leaving search/pagination state untouched --
pre-existing intentional behavior carried over unchanged from the
original file, not a migration regression; Basheer confirmed keeping it
as-is rather than changing it to preserve the detail view too.

**Two other-session collision found and worked around, not caused by
this migration:** while committing, `QuickLeadModal.tsx` and
`Customer360Screen.tsx` were found to have a concurrent session's
Referral Credit feature work (BR-FIN-07) interleaved line-by-line with
this session's fixes in the same uncommitted working tree. Split
cleanly via zero-context diffs (`git diff -U0`) to isolate exact
line-level hunks, staged only this session's hunks via `git apply
--cached` (patches the index only), verified the staged subset
compiles/lints cleanly in isolation, and confirmed via blob-hash
comparison that the working tree's final content was byte-identical to
before the split -- the other session's work was undisturbed and
remained ready to commit separately.

Following this closeout, `docs/Frontend-Implementation-Standards.md`'s
§9 table reached 0 pending for the first time -- triggering that
document's own "Post-migration cleanup" instructions (delete Superseded
blocks, collapse §9, bump to v3.0). See the next entry below for the
preserved history of every migration §9 tracked, before that cleanup
removed the narrative from the standards doc itself.

## 2026-08-18 -- `docs/Frontend-Implementation-Standards.md` §9 migration
history preserved before doc cleanup (retrospective consolidation)

§9's own text calls its per-file narrative entries "traceability aids
with a deliberate expiry, not permanent documentation" -- once the
table reached 0 pending (previous entry), its own "Post-migration
cleanup" instructions call for deleting the Superseded pattern blocks
and collapsing §9 entirely, since a standards doc's job is describing
the current standard, not archiving how the codebase got there. That
history belongs here instead. Consolidating everything §9 recorded,
across the whole migration, before it's removed from that doc:

**`ProductCatalogScreen.tsx`** (migrated 2026-08-07, prerequisite for
the Product Lifecycle feature build, which needed to add a new field to
this screen's create/edit form without adding more Tailwind). Full
triple-conversion: Tailwind -> MUI `sx`, the manual `.then()`/
module-level `productListCache` `Map` -> `useQuery` (list, count,
single-product-detail, and product-documents all as independent
parallel queries) plus `useMutation` for collateral-link create/delete,
`.jsx` -> `.tsx`. The hand-rolled `ProductFormModal` was replaced with
the shared `FormModal` component (matching `UserDirectoryScreen.tsx`'s
precedent) rather than converted in place. `isMountedRef` and the
`CACHE_TTL_MS`/`productListCache` module-level cache were both deleted
outright, not ported -- both superseded by React Query's own
cache/staleness handling. Added three new hand-written type aliases to
`types/api.ts` (`ProductListResponse`, `ProductResponse`,
`DocumentResponse`) since no prior screen had imported them. Scope note:
this migration only closed the Styling/React Query/TypeScript columns --
it did not restructure the screen's internal list<->detail navigation
into the ADR-030 always-mounted pattern, since that's a
navigation-architecture change orthogonal to what the migration tracked.

**`OpportunityDetailScreen.tsx`** (migrated, date not recorded in the
original §9 entry) -- moved to fully-migrated once its React Query
commit landed: all 6 manual `.then()` chains converted to `useQuery`,
gated by `enabled` on the state that used to trigger each fetch
(`editing`/`showAdd`/`showEditOpp`) so behavior was unchanged, just
cached and parallelized. Its master-data lookups (stages/statuses/
users/products/stakeholders) got local stopgap types
(`StageOption`/`StatusOption`/`UserOption`/`ProductOption`/
`StakeholderOption`) in place of `any[]`; the transient edit-buffer
state (`editItems`/`editSplits`) and a few pre-existing `as any` ID
casts remained untyped -- never claimed as "no `any` anywhere in the
file."

**`CustomerDirectoryScreen.tsx`** (migrated 2026-08-11, `59baa6b`).
Full triple-conversion, same shape as `ProductCatalogScreen.tsx`'s own
migration: module-level `accountListCache` (SWR, 30s TTL) and
`isMountedRef` deleted outright, not ported -- superseded by React
Query's own cache/staleness handling, which naturally reproduced the
"instant paint on back-navigation" behavior the module cache's own
comment described wanting. Manual `.then()` chains (list -> dependent
counts fetch, plus a separately-debounced parent-account search)
converted to `useQuery`/`useMutation`. Also fixed in
`services/accounts.ts` while there: `listAccounts`/`getAccount`/
`getAccountCounts`/`createAccount` were typed with `number` ids and
`Promise<unknown>` returns despite this app's ids being UUID strings
everywhere else -- retyped against `AccountListResponse`/
`AccountResponse`/`AccountCountsEntry` (all already existed in
`types/api.ts`, zero new hand-written aliases needed). Every other
function in that file was left untouched -- same pre-existing issue,
out of scope. A real cross-file simplification, not just a same-file
port: the `accountUpdateRef`/`onAccountUpdate` prop chain (`DemoApp.tsx`
-> `Customer360Screen.tsx`) existed solely to patch an edited account
back into this screen's now-deleted module cache -- replaced by one
`queryClient.invalidateQueries({queryKey:["accounts","list"]})` call in
`Customer360Screen.tsx`'s `handleUpdateAccount`, and the entire
ref/prop chain removed from both files. One property-diff gap found,
initially dropped, then restored on review: the original scrolled the
list container to top after a successful create -- first pass judged
this a one-time decoration and left it out; on reflection its actual
purpose was preventing the user from being left stranded mid-scroll
with no indication anything happened, a usability concern worth
restoring, not a decoration. Restored, called from the create
mutation's `onSuccess`. Parent-account search (create modal) upgraded
from a hand-rolled absolute-positioned dropdown to MUI `Autocomplete`,
matching `Customer360Screen.tsx`'s own edit-form picker for the
identical field on the identical entity -- not a new pattern.

**`ProjectDirectoryScreen.tsx`** (migrated 2026-08-18) -- see the entry
immediately above this one for full detail; not repeated here.

Every migration in this list shipped with `tsc --noEmit` and `npm run
lint` (incl. the `check-no-tailwind.js` Tailwind guard) clean before
commit -- that guard-green requirement never varied across the whole
effort.

---

## 2026-08-19 -- Leadership demo, presenter narrative + slide deck built; Referral Credit shown live

**Demo delivered to leadership tonight -- went extremely well** (Basheer's
own report). Covered all 25 code commits sitting on `main` since the last
UAT migration (`origin/uat` at `7a3c8d7`, 2026-08-06) plus Referral
Credit, added to the demo as a late but deliberate addition -- built,
manually verified (`docs/Business-Rules.md`'s BR-FIN-07 records the
2026-08-18 E2E reconfirmation), but still uncommitted -- because it
directly answers a standing ask from leadership and the sales team: how
to actually track a referral. Not a scope surprise on the night; a
considered call to fold in a finished, verified feature for impact.

**Two presenter artifacts built and iterated live with Basheer's
feedback**, both published as Claude Artifacts (not committed to the
repo as artifacts -- ephemeral presentation aids):
1. A narrative briefing (also saved to the repo, see below) -- four
   "movements" (Territory & Organization, The Deal Itself, Referral
   Credit, Data You Can Stand Behind) plus a closing "Wider Picture"
   section tying the whole build to ADR-001/ADR-013's Target -> Coverage
   -> Opportunity -> Revenue hierarchy. Verified against
   `backend/app/domains/planning/models.py` before writing the claim --
   `TargetPlan`/`CoveragePlan`/`CoveragePlanEntry` tables genuinely exist
   in the schema already, no UI yet, so the pitch ("the foundation snaps
   onto the pipeline you're looking at right now") is accurate, not
   aspirational marketing.
2. A 7-slide browser-based presenter deck (dark, stage-lit design,
   keyboard/click/swipe navigation) -- reordered and trimmed twice on
   Basheer's live feedback (title slide dropped, hook slide relocated to
   sit right before the vision slide, a stale "Sales Manager tier
   retired" line cut from the Territory slide once it was pointed out as
   redundant with the org-chart framing already covering it, and a
   "Trade-ins, refurbished stock, accessories" bullet corrected -- the
   actual product model is New Product / Accessory / Buyback as line
   items, not "trade-ins" as its own category, confirmed against
   `opportunity.models.py`'s `line_type` CHECK constraint and
   `product.models.py`'s `product_type` CHECK constraint before fixing
   the copy).

**Narrative revision history worth remembering for next time:** the
first draft was a straight feature-by-feature list organized into "Acts"
with click-by-click demo instructions -- correctly rejected by Basheer as
not impressive enough. Rebuilt around a real through-line (Sales
Operating System vs. CRM, closing with the Target/Coverage vision) after
a corporate-storyteller-style review requested staccato pacing on the
climax, scenario-framed (not click-framed) demo cues, and an opening hook
built on contrast ("did you log your activity" vs. "will this help you
hit your target"). **Lesson: for a leadership audience, lead with the
business narrative and only cite specific bugs/fixes as supporting
evidence, never as the headline** -- an earlier pass that led with "here's
what we found broken and fixed" was explicitly rejected (see the
2026-08-18 thread) as the wrong frame for this audience, even though the
same underlying fixes are completely fair game in the reference-detail
section further down the page.

Saved to the repo as `docs/Demo-Narrative-UAT-Migration-2026-08-19.md`
(untracked, not yet committed) -- kept in sync with the final Artifact
version by hand across every revision.

**Real blocker hit, not resolved:** live DB read (a plain read-only
`SELECT display_name, is_active FROM user_profile` via `psycopg2`,
intended to cross-check which names in
`docs/Zone-Hierarchy-Territory-Data-2026-08.md` (Adarsh, Vivek, Shruthi,
Fazal, Fahad, Irfan, Nishad, Adydev, Naeem, Rudrappa, Om Hiremath,
Dhanushma, Nagesh Ninganoor, Ravikumar) don't yet have a live
`user_profile` row, for a planned demo moment) was blocked by the Claude
Code auto-mode safety classifier -- same restriction the Zone Hierarchy
build hit applying migration `0019` back on 2026-08-11. Chat approval
alone doesn't satisfy it; Basheer either needs to run DB-touching
commands himself (`!`-prefixed, runs directly in the session) or grant a
Bash permission rule for them. **Not resolved -- relevant again for the
UAT Users/Territories setup below, which will hit the identical wall.**

**Nothing from tonight is committed, at the point this entry was
written.** Referral Credit (backend + frontend, all 4 entry points, from
the 2026-08-18 session above) and the narrative markdown file were both
still sitting in the working tree.

**Correction, same night:** Referral Credit was committed shortly after
this entry was written, as `ea19bd1` (bundled with an Add/Edit Opportunity
UX overhaul it prompted), followed by `9e32fb2` (Territory Map fixes) --
see the entry immediately below this one for full detail. The narrative
markdown file (`docs/Demo-Narrative-UAT-Migration-2026-08-19.md`) remains
uncommitted. Remaining task: promote everything on `main` (36 commits
ahead of `origin/uat`) to `uat`, and set up real Users and Territories in
the UAT database to match what's been live on Dev since the Zone
Hierarchy / Multi-Zone / Sales Manager Tier Collapse work -- see
`.claude/active_progress.md`'s current task.

## 2026-08-18/19 -- Referral Credit (BR-FIN-07) shipped, plus a UX
overhaul and several bugs found during manual E2E (`ea19bd1`, `9e32fb2`)

Ran as a separate session in parallel with the `ProjectDirectoryScreen.tsx`
migration above -- deliberately split from
`docs/Referral-Credit-And-Relationship-Support-Implementation-Plan.md`:
Part 1 (Referral Credit) built now; Part 2 (Relationship-Support Activity)
deliberately deferred, not touched, moved to `docs/Backlog.md`.

**Referral Credit backend:** migration `0023_add_referral_credit.py` adds
`opportunity.referred_by_user_id` (FK -> `user_profile`, any SBU/zone,
same eligibility as BR-ACT-06's Next Action assignee) and
`referred_by_note` (free text, for a non-Cabio referrer), mutually
exclusive via both a schema `model_validator` (clean `422`) and a DB
`CHECK` constraint (`ck_opportunity_referral_not_both`) as backstop. Only
applies when `lead_source_id` resolves to `Referral` -- deliberately not
`OEM Referral`, which names a partner company rather than a person (this
distinction was questioned mid-build and reconfirmed: merging them would
bury "how many leads come through OEM partnerships" inside a generic
bucket, losing real Lead Source Analytics granularity). The plan doc's
claim that `create_opportunity` needed no change was wrong -- unlike
`update_opportunity`'s generic `setattr` loop, `create_opportunity` builds
`Opportunity(...)` with named fields, so the two new fields had to be
added there explicitly. 7 new backend tests; full 526-test suite green
throughout. Applied to Dev; `docs/Physical-Schema.sql` regenerated
(Docker Desktop + `postgres:17` pg_dump) -- turned out to be stale since
`0019`, so this pass also caught up `0020`'s `idx_zone_name_trgm` index
that a prior regen had missed.

**Two real gaps beyond the plan doc, found and fixed:**
1. `WorkspaceOpportunity` (`backend/app/domains/account/workspace_schemas.py`)
   is a third Opportunity response shape the plan never accounted for --
   it's what `GET /accounts/{id}/opportunities` returns, and what both
   Customer 360's and Project Directory's Edit Opportunity forms read from
   to prefill. Missing the two new fields there would have meant those two
   screens' Edit forms could never show the current referral value.
2. `types/api.ts`'s hand-maintained "convenience aliases" block (named
   type exports like `PipelineOpportunity`) gets silently wiped by every
   `npm run generate:types` regen -- restored from git history each time
   this came up (twice in this session); `tsc --noEmit` catches it
   immediately if ever missed (30+ errors, one per lost alias).

**Frontend, all 4 entry points** (`QuickLeadModal.tsx`; `Customer360Screen.
tsx`'s New and Edit Opportunity forms; `OpportunityDetailScreen.tsx`'s
edit form; `ProjectDirectoryScreen.tsx`'s Add and Edit forms, added once
that screen's own MUI migration landed): a checkbox toggle between a
Cabio-colleague picker (`["users","referral-picker"]`, a new,
distinctly-keyed query calling `listUsers("all")` -- confirmed and avoided
the pre-existing `["users","all"]` naming-quirk collision, where that key
actually calls `listUsers()` with no scope arg despite its name) and a
free-text external referrer field. Displayed on Opportunity Detail's
Overview tab, positioned directly under Lead Source (moved there after
Basheer flagged its first position as visually odd). Referral credit is
now cleared automatically (`referred_by_user_id`/`note` explicitly sent as
`null`, not omitted) whenever Lead Source is edited away from Referral --
this was a real bug Basheer caught during manual verification: the fields
were being left stranded and invisible instead of cleared.

**Two navigation bugs found during Customer 360 E2E, unrelated to
Referral Credit but surfaced by the same testing pass, both fixed in
`DemoApp.tsx`/`Customer360Screen.tsx`:**
1. Its tab bar could resume on the wrong tab after Back from Opportunity
   Detail -- `DemoApp.tsx` was reusing one shared `initialTab` value for
   two unrelated screens' tab state (which Customer 360 tab to resume on
   Back, and which Opportunity Detail tab to open on). Split into two
   independent params (`detailTab`, `customer360Tab`); every Customer 360
   call site now passes its own current tab explicitly instead of leaving
   a stale value from an earlier, unrelated Project visit in place. First
   fix attempt reused the single value and broke the plain
   Opportunities-tab click (opened Opportunity Detail on a non-existent
   "opportunities" tab, rendering blank) -- caught immediately by Basheer,
   fixed properly the same session.
2. The tab-centering scroll (`handleTabChange`) only ran on an actual
   click, never for the tab a screen resumed on after remounting (this
   screen fully unmounts/remounts on every navigation away and back) --
   the correct tab was highlighted but scrolled out of view. Added a
   mount-time effect using the same centering logic, instant (not
   animated) so it doesn't visibly slide on first paint.

**Add/Edit Opportunity UX overhaul, prompted by Basheer noticing the
modals had grown too tall to use comfortably:**
- `FormModal.tsx`: the shared component behind every modal in the app had
  a plain `<form>` wrapping `DialogTitle`/`DialogContent`/`DialogActions`,
  which silently broke the flex-layout chain MUI's `Dialog` relies on to
  let `DialogContent` scroll independently -- the whole dialog scrolled as
  one block instead, hiding the header and Save/Cancel on a long form.
  Fixed by making the form wrapper itself a flex column
  (`display:flex, flexDirection:column, minHeight:0, overflow:hidden`).
  The error `Alert` was also moved out of the scrollable `DialogContent`
  into its own fixed row between the title and the fields, for the same
  reason (it was scrolling out of view too).
- Progressive disclosure on all 6 Add/Edit Opportunity forms, grounded
  directly in `validators.py`'s BR-OP-00 stage-gate thresholds (not
  invented cutoffs): Status removed entirely from Create (BR-OP-10 leaves
  exactly one selectable value, so the dropdown was pure clutter -- set
  automatically instead); Indicative Value/Demo Start/Demo End/Expected
  Closure/PO Number now show only once the selected Stage reaches that
  field's own gate. On Create, hidden below the threshold entirely. On
  Edit, shown whenever the field already holds a value even below the
  threshold (Basheer's explicit call, after the first pass covered Create
  forms only per his own scope decision -- "we don't want to show the
  fields if they are empty or not relevant" was the exact bar) so no
  populated data is ever hidden; PO Number also stays visible whenever
  Status is WON regardless of Stage, since Stage/Status are decoupled
  (ADR-028) and a deal can reach Won without Stage having reached Order.
- Bug fix: Customer 360 and Project Directory's Edit Opportunity forms had
  no fields at all for Demo Start/End Date or Expected Closure Date --
  `WorkspaceOpportunity` was missing the 3 columns (same schema gap as
  above), so advancing a deal's Stage to Demo/Negotiation from those two
  screens would fail server-side with no way to fix it on screen. Added,
  and reordered all 3 Edit forms (Name -> Stage/Status -> Lead Source ->
  Referred By -> Owner -> Win Probability -> Indicative Value -> Demo/
  Closure dates -> PO Number -> Hold/Loss) to a consistent order --
  Opportunity Detail's version previously had Lead Source stranded after
  the dates instead of right after Stage/Status.
- Project Directory's Add/Edit Opportunity modal badge showed only the
  Project name, not the Account -- Basheer kept losing track of which
  account he was in; now shows "Account -- Project".

**Territory Map fixes** (`9e32fb2`, `TerritoryAdminScreen.tsx`/
`UserDirectoryScreen.tsx`), found during a side conversation while
Basheer was testing the above:
1. Stale data: `UserDirectoryScreen.tsx`'s save/deactivate/reactivate only
   invalidated `["users"]`, never `["zone-tree"]` (which Territory Map
   reads each zone's `user_count` from) -- a zone reassignment stayed
   stale until a hard refresh. One-line fix since all 4 mutations already
   funnel through one `invalidateUsers()` helper.
2. Coverage pills rendering under the wrong zone's card: the divider
   border was on the zone row alone, so it drew directly under the row --
   pills rendered below that line then visually read as the next zone's,
   not their own. Row and pills now share one wrapper so the border only
   appears after both.
3. Zone-level pill overlapping the "+" (add child zone) icon: the
   zone-name `Typography` had no `minWidth: 0`, so a long name pushed past
   its allotted width instead of shrinking within the flex row. Fixed by
   letting the name wrap onto a second line (not truncate -- Basheer
   wanted long cluster names fully visible without opening Edit) plus
   `flexShrink: 0` on the pills/icons so they never get squeezed.
4. Mobile layout: header buttons shrunk (responsive `sx`); the title/
   button row made sticky (split into a fixed header + independently
   scrollable tree list, was one scrolling block); Add Zone moved onto the
   title's own row on mobile only (CSS breakpoint toggle, two markup
   blocks, since flex-wrap alone can't put one of three buttons on a
   different line than its siblings) to save vertical space, with Show
   Coverage/Refresh Territory Visibility on their own row below; per-level
   indentation halved (`depth * 3` -> `depth * 1.5`) since 5 possible zone
   levels made deep nesting waste a lot of width on narrow screens.

**Also, mid-session:** the other (MUI migration) session's manual
verification pass found and fixed real bugs in `QuickLeadModal.tsx`/
`Customer360Screen.tsx` concurrently with this session's referral-credit
edits landing in the same two files -- both sessions' work ended up
interleaved line-by-line in the same live working tree (no worktree
isolation). Untangled via a careful zero-context-diff `git apply --cached`
split on their end; confirmed post-commit on this side that nothing was
lost (`tsc --noEmit`/`npm run lint` clean, all referral markers intact).
Real coordination cost from working the same files concurrently without
checking first -- see `[[cabio_feedback_check_before_touching_wip_files]]`
memory, written specifically from this incident.

Manually verified end-to-end on Dev by Basheer across all 4 Referral
Credit entry points, both the create and edit sides, plus the
cross-cutting checks (mutual exclusivity, cross-SBU colleague picker as
Admin/GM) and the Territory Map fixes. `tsc --noEmit`/`npm run lint`
clean throughout both commits.

**Part 2 (Relationship-Support Activity) not started** -- moved to
`docs/Backlog.md` as a clearly-scoped, ready-to-build item (the original
implementation plan doc already has full detail for it, steps 5/7-8/10
plus BR-ACT-09).

---

## 2026-08-20 — UAT-to-Prod cutover strategy decided (data carry-forward + Render tier)

Discussion prompted by drafting the Aug 22 extended-team training invite:
once the extended sales team starts entering real inflight opportunities
and activities in UAT alongside the Star team, UAT stops being disposable
test data and becomes the seed of record for Production. `Deployment-
Topology.md`'s original plan (`Data` row, Phase B checklist) assumed the
opposite -- UAT holds "realistic-but-fake data" and Prod is always a
brand-new, empty Supabase project created after sign-off. That assumption
no longer holds, so the topology doc's Prod section was updated
(see below) to reflect the decision made here.

**Decision: promote the existing UAT Supabase project's data in place to
become Prod, rather than dump/restore into a fresh Prod project.**
Considered both:
- *Dump/restore into a new project* (the literal "as-is migration" first
  asked about) -- rejected as higher-risk than it looks. Supabase Auth
  (`auth.users`) is project-scoped; `user_profile` FKs into it and RLS
  policies key off `auth.uid()`. A new Prod project would need every
  UAT user's auth identity recreated with matching UUIDs (or every FK
  remapped) alongside the data copy -- real engineering work with a real
  chance of silently broken ownership/RLS if anything is missed.
  There's also no reliable way to bulk-migrate Supabase Auth accounts
  between projects short of the admin API, which brings its own
  password/session-reset complications.
- *Promote in place* -- the UAT Supabase project's connection details
  (URL, keys, project ref) don't change; it's the same physical database,
  just relabeled as Prod going forward. Zero data-migration risk, since
  nothing actually moves. A fresh, empty UAT project gets created
  afterward for the next dev/test cycle. Cost is identical either way --
  both paths need a 3rd paid Supabase project (Pro plan trigger), so
  promote-in-place has no downside relative to the documented plan
  beyond the doc itself needing an update.

**Decision: Render hosting for Prod stays on the already-documented plan
-- new Starter-tier services, not an in-place upgrade of the free-tier
UAT services.** Two options considered:
- *Upgrade `calicut-bio-medicals` (backend) / `cabio-sales-os-uat-frontend`
  (frontend) in place* -- rejected. These are UAT-named/UAT-branded
  services; repointing them to serve Prod either bakes "uat" into the
  URL the whole sales team bookmarks, or requires renaming mid-flight
  with unclear effects on the auto-assigned `.onrender.com` subdomain
  (CORS/`VITE_API_BASE_URL` would need re-verifying either way).
- *New Starter-tier services on the `prod` branch* (adopted) -- backend
  env vars (`DATABASE_URL`, `ADMIN_DATABASE_URL`, `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `CABIO_APP_DB_PASSWORD`) copy over unchanged since
  the DB connection details don't change under the promote-in-place plan
  above. The old free-tier UAT services become idle once Prod is
  verified, and get repointed at a freshly created empty UAT Supabase
  project to serve as the next UAT environment. Starter tier confirmed
  necessary (not optional) for Prod specifically because free tier's
  ~15min idle spin-down / 30-50s cold start, currently masked on UAT by
  an UptimeRobot keep-alive ping, isn't something to build real
  production reliability on -- the doc's original Phase B plan already
  called for Starter tier here, this only confirms it still holds under
  the promote-in-place change.

**Also reconfirmed, no change:** the fix-vs-Milestone-2 parallel
development model (branch fixes off wherever the bug lives, verify on
`uat`, promote the same tested commit to `prod`, cherry-pick into `main`)
was already fully documented in `Deployment-Topology.md`'s Promotion
Flow section, including the Alembic migration-divergence caveat -- no
process change needed there, just confirmed it holds once Prod exists
for real.

`Deployment-Topology.md` updated same day to reflect the two decisions
above (Data row, Phase B checklist, Approved Decisions note).

## 2026-08-21 — UAT code promotion executed; RLS lockout recurrence;
zone_id clear bug; Central Kerala deprecated; Karnataka tree flattened

**Code promotion (Part 1 of the UAT migration) executed and verified.**
`main` (`5aa4731`, 39 commits ahead of `uat`'s `7a3c8d7`) fast-forward
pushed to `uat` (`git push origin main:uat`). Render redeployed both
`calicut-bio-medicals` (backend) and `cabio-sales-os-uat-frontend` --
both confirmed Live, health check healthy. The 8 pending Alembic
migrations (`0016`-`0023`) applied cleanly against UAT by Basheer via Git
Bash (`ADMIN_DATABASE_URL` from `backend/.env.uat`, `.venv/Scripts/
python.exe -m alembic upgrade head`, `0015 -> 0023`, no errors) --
confirms the known DB-command-blocked-for-Claude pattern still holds
(hit again requesting a plain read; Basheer ran it himself, same as
migration `0019` back on 2026-08-11).

**Bug found and fixed: UAT-wide RLS lockout recurrence, this time scoped
to 2 tables.** Basheer reported Territory Map's "Show Coverage" pills
empty despite the 4 Area Managers showing zone assignments in User
Directory. Traced to the exact same root cause as the 2026-08-03
UAT-wide lockout: UAT's out-of-band `rls_auto_enable()` Supabase event
trigger (flagged as an open reconciliation item back on 2026-08-05,
never closed) auto-enables RLS with zero policies on any newly created
table. Today's migrations created two new tables -- `user_zone`
(`0018`) and `zone_closure` (`0019`) -- and neither migration adds an
RLS policy for its table (by design; Alembic has never touched RLS
outside the original 8 Phase-2E tables). Confirmed via a read-only
`pg_class`/`pg_policies` check (`RLS enabled: True | policies: 0` for
both). Reads silently returned empty rows (explaining the missing
coverage pills and, unnoticed at the time, an equally-empty `zone_ids`
list anywhere User Directory's list view relies on it); writes hit a
genuine Postgres RLS policy violation, which the browser reported as a
CORS error (`blocked by CORS policy`) because the 500 response skipped
CORS headers -- a red herring chased for a few messages before the
actual pattern was recognized. **Fixed** with the same remediation as
2026-08-03: `ALTER TABLE user_zone/zone_closure DISABLE ROW LEVEL
SECURITY`, run by Basheer via the same Git-Bash-blocked-for-Claude
pattern. **Logged to `docs/Backlog.md`** as a standing item: this will
recur on every future migration that adds a table until `rls_auto_enable()`
is either removed from UAT or a "check + disable RLS on any new table"
step is added to the migration checklist -- two incidents now, not a
one-off.

**Bug found and fixed: `zone_id` couldn't be cleared once set, blocking
"Admin/GM shouldn't have a territory" cleanup.** After the RLS fix,
Basheer noticed GM/Admin accounts showing a zone (stale pre-Zone-
Hierarchy `zone_id` values, auto-backfilled into `user_zone` by
migration `0018`'s backfill `INSERT`) -- correctly flagged as not
making sense for an SBU/zone-agnostic overlay role. Clearing the zone
in User Directory and saving threw `400 "Primary zone_id must be
included in zone_ids"`. Two bugs, not one:
1. **Frontend** (`UserDirectoryScreen.tsx`) sent `zone_id: form.zone_id
   || undefined` -- `undefined` is dropped entirely by `JSON.stringify`,
   so a cleared picker never reached the request body at all. Same class
   of bug already fixed for `manager_id` on 2026-08-17; `zone_id` was
   missed. Fixed: `|| null` instead, both create and update payloads.
2. **Backend** (`organization/service.py::update_user`) had the matching
   gap even after the frontend fix: `effective_zone_id = data.zone_id if
   data.zone_id is not None else user.zone_id` can't distinguish an
   explicit `null` from an omitted key (both parse to Python `None` on
   the field itself) -- it kept falling back to the stale `zone_id`
   either way. Fixed: check `"zone_id" in data.model_fields_set` instead
   of `is not None`. Only found because Basheer re-tested in Dev and hit
   the identical `400` again after the frontend-only fix.
   New regression test (`test_zone_id_explicit_null_clears_primary_
   zone`) added deliberately, given this is the *second* field
   (`manager_id`, `zone_id`) to hit this exact omitted-vs-null gap in the
   same service. Verified: `tsc --noEmit`/lint clean, 74 backend tests
   (`-k user`) pass, manually confirmed on both Dev and UAT (UAT needed a
   second PWA hard-refresh before the new bundle actually took --
   consistent with `PWA-UAT-MobileLaptop-Setup.md`'s documented
   fallback). Committed `81fded7` -- accidentally swept in `git commit`
   without file-scoping (`active_progress.md`, `Backlog.md`, and
   Basheer's two unrelated personal Discussion docs came along); left
   as-is since none of it was sensitive, not worth a `main` force-push
   rewrite to un-bundle. Promoted `main` -> `uat` the same way as the
   morning's code promotion.

**Central Kerala deprecated.** Basheer moved the hospital accounts that
were incorrectly sitting in Central Kerala over to South Kerala in UAT,
then deactivated the Central Kerala zone once confirmed empty --
resolving the open question `Zone-Hierarchy-Territory-Data-2026-08.md`
flagged on 2026-08-11 ("does Central Kerala need to be deprecated/
merged, or does it just sit dormant?") that was never acted on.
`CLAUDE.md`'s Zones line updated to drop it.

**Zone tree shape decided: not uniform across states, deliberately.**
Basheer asked about flattening every zone level to State -> District
except Bangalore (which needs its numbered Zone 1-6 sub-split). Analysis:
the cluster level's only real value is letting a manager whose true
coverage is a whole region be assigned once and automatically inherit
any district added to that region later, via `zone_closure` tree
membership -- worth keeping only where a manager's actual boundary is
the whole cluster. **Decided:** Kerala keeps its existing 3-level shape
(Kerala -> North/South Kerala -> District) since the North/South split
is a real, durable operational boundary, not just a UI grouping.
Karnataka flattens to 2 levels (Karnataka -> District) except Bangalore,
which keeps its own cluster node + Zone 1-6 children (already at the
same depth as the clusters being removed, not structurally a special
case). **Known cost, accepted:** Shruthi covers Bangalore + South/
Central/North Karnataka (all of Karnataka except Fazal's Coastal
cluster) -- once those three clusters flatten, she needs an explicit
district-level `user_zone` row per district instead of 3 cluster-level
rows, and any *new* Karnataka district added later outside Bangalore
won't automatically fall under her coverage. Recorded in `Zone-
Hierarchy-Territory-Data-2026-08.md` alongside the decision so it isn't
forgotten when Karnataka's tree gets built out.

**Status at session end:** code promotion (Part 1) fully done and
verified on UAT. Part 2 (Users & Territories) in progress -- Fazal's
North Kerala + Coastal Karnataka district assignments and the Karnataka
tree flattening were being worked on directly in Territory Admin by
Basheer when the session ended; not yet confirmed complete. `CLAUDE.md`
and `Zone-Hierarchy-Territory-Data-2026-08.md`'s latest edits (Central
Kerala + tree-shape decision) are uncommitted. See `active_progress.md`
for the exact next step.

## 2026-08-22 -- Reminders-on-Login built and committed; E2E verification pending

GM Haroon asked for "a notification note when a user logs in." Clarified
with Basheer this meant the previously-deferred **Reminders-on-login**
backlog item (`docs/Backlog.md`) -- each user seeing their own pending
Next Actions on login, not a GM-facing "who logged in" alert.

**Scope decided with Basheer:**
- Trigger: every user, every login.
- Content: a short, clickable headline counting Next Actions due today
  or overdue (not the full list) -- clicking it opens Next Actions
  pre-filtered to the same set.
- Zero due/overdue -> show nothing (no empty-state banner).
- Bonus: added a manual date-range filter to the Next Actions screen
  itself, both for reps planning their day/week and as groundwork for
  Milestone 2's coverage-execution planning (generic `due_after`/
  `due_before`, not hardcoded to "today").

**Why this was cheap to build:** the Reminder data model, repository,
service, `GET /reminders` endpoint, and rendering component
(`ReminderRow`, with its existing `isOverdue()` helper) already existed
from the earlier Next Actions module and were already scoped to the
current user server-side. No DB migration, no new endpoint, no new
subsystem -- purely an additive query filter plus a small piece of
frontend UI.

**What shipped** (full detail in
`docs/Reminders-on-Login-Implementation-Plan.md`):
- Backend: `ReminderRepository`/`ReminderService`/`GET /reminders` gain
  optional `due_after`/`due_before` filters.
- `AuthContext.tsx`: new `justLoggedIn` flag, set only on an explicit
  `signIn()` success (not on page-refresh session-restore or token
  refresh) -- the reliable "just logged in" signal the banner needs.
- New `LoginRemindersBanner.tsx`: dismissible one-line banner, shown
  once per login, only when the due/overdue count is > 0.
- `DemoApp.tsx`: mounts the banner; click-through navigates to Next
  Actions pre-filtered to "due today or overdue."
- `NextActionsScreen.tsx`: added a "Due from / Due to" `DatePicker`
  filter (same pattern as `DailyActivityReportScreen.tsx`).

**Verified so far:** 528 backend tests pass (existing `ReminderService`
mock-assertion tests extended for the new params, plus a new
`test_due_after_and_due_before_forwarded` case); frontend `tsc --noEmit`,
`vite build`, and `eslint` all clean. `npm run generate:types` was
deliberately skipped -- it needs a live backend against the shared dev
DB, and nothing in the changed frontend code consumes the generated
types for these query params (built as plain request params), so
nothing depends on it.

**Not yet done: manual E2E.** Committed by Basheer as `dc826b2` before
the walkthrough happened. Basheer will run it first thing tomorrow
morning (2026-08-23), before resuming UAT migration Part 2. Checklist is
in the plan doc's Verification section and mirrored in
`active_progress.md`.

## 2026-08-23 -- Reminders-on-Login changed from banner to overlay dialog

Before the manual E2E pass, Basheer flagged that what shipped (an inline
`Alert` banner mounted in the app shell, appearing over whichever screen
happens to be active on login) didn't match his recollection of the
agreed UX -- he expected a separate overlaying dialog box. Neither
`docs/Backlog.md` nor the 2026-08-22 entry above recorded a dialog
decision, so the mismatch was never written down either way; Basheer
confirmed he now wants the overlay dialog on UX grounds regardless.

**Change:** `LoginRemindersBanner.tsx` replaced by
`LoginRemindersDialog.tsx` -- same trigger (`justLoggedIn`), same
zero-count no-render behavior, now rendered as an MUI `Dialog` with
Dismiss/Review actions instead of an inline `Alert`. `DemoApp.tsx`
updated to mount the new component under the same name/prop contract
(`onReview={handleReviewLoginReminders}`). Plan doc updated to describe
the dialog. Manual E2E checklist unchanged in substance -- still
pending.

### Same session: dialog exposed a pre-existing latency, root-caused and fixed

Basheer noticed the new dialog took noticeably longer to appear than
the pipeline screen behind it. Root-caused with live measurements
against the shared dev DB (Supabase, ap-south-1) rather than guessing:

- Every backend request already paid a ~350ms tax before running its
  own query: a `pool_pre_ping` health check + three separate
  `SET LOCAL` statements (`set_rls_context` in `backend/app/db/session.py`)
  to seed the RLS context, each a separate network round trip (measured
  ~45-115ms each against a warm connection to the Supabase pooler --
  query execution itself was ~2.6ms, all the cost was round-trip
  latency, not query cost).
- On top of that baseline, the old `countDueOrOverdueReminders()`
  (`sales-os-app/src/services/activities.ts`) ran the full
  `ReminderService.list_for_user()` -- which always executes *both* a
  `list_for_user` item-fetch *and* a separate `count_for_user` query --
  just to read `total` and discard the items. One whole extra DB round
  trip solely for this dialog's benefit.
- The banner had the exact same latency; it was just an inline element
  that blended in while the rest of the page settled, so nobody
  noticed. The dialog's screen-dimming overlay made the pre-existing
  wait visible, it didn't introduce a new one (MUI's default ~225ms
  `Dialog` fade-in transition added a little, but that's animation, not
  the fetch).

**Two fixes applied (Basheer approved both after a plain-language
walkthrough of the diagnosis):**

1. **Piggyback the count on `/auth/me` instead of a separate call.**
   `AuthContext.applySession()` already calls `getCurrentUser()`
   (`GET /auth/me`) on every sign-in, and by the time it responds the
   RLS context is already set on that request's DB session. Added
   `due_or_overdue_reminder_count: int` to `UserMeResponse`
   (`backend/app/domains/organization/schemas.py`); `get_me`
   (`backend/app/api/routers/auth.py`) now also takes
   `db: Session = Depends(get_db)` (FastAPI dependency-caches this to
   the *same* session `get_current_user` already used -- no new
   connection/handshake) and runs one `ReminderRepository.count_for_user`
   call against it, using an IST end-of-day boundary
   (`zoneinfo.ZoneInfo("Asia/Kolkata")` -- no existing "due today"
   convention existed server-side to match, so this establishes one).
   `LoginRemindersDialog.tsx` now reads
   `userProfile.due_or_overdue_reminder_count` directly instead of
   fetching -- the dialog has its data before it ever renders.
   `countDueOrOverdueReminders()` deleted from `activities.ts` (no
   longer called anywhere). This is the fix that actually removes the
   dialog's wait, not just shortens it.
2. **Collapsed the three `SET LOCAL` statements into one round trip,
   app-wide.** `set_rls_context()` now sets all three context vars via
   a single `SELECT set_config(...), set_config(...), set_config(...)`
   statement instead of three sequential `db.execute()` calls. Verified
   live against the dev DB: one round trip, correct readback via
   `current_setting()`. Benefits every API call in the app, not just
   this feature.

**Not done, flagged for a separate deliberate decision:** `pool_pre_ping`
still fires a health-check round trip on every connection checkout
(~60-100ms/request app-wide). Removing it in favor of `pool_recycle`-based
staleness handling would save more, but trades off some connection-error
resilience -- given the live shared dev DB, that's a call for Basheer to
make on its own, not bundle into a quiet perf patch.

**Verification:** 528 backend tests pass (two updated for the new
call shapes: `test_auth_endpoint.py::TestAuthMe::test_returns_user_profile`
now overrides `get_db` and asserts the new field;
`test_session.py::TestSetRlsContext` now asserts one combined call
instead of three). Frontend `tsc --noEmit`, `eslint`, `vite build` all
clean. The combined `set_config` statement and the `/auth/me` count
query were both re-verified directly against the live dev DB. Types
regenerated (`npm run generate:types`) -- this also picked up
`due_after`/`due_before` on `GET /reminders` and some
`expected_closure_date`/`demo_start_date`/`demo_end_date` fields that
had drifted in from unrelated prior backend changes never regenerated
until now; the hand-maintained type-alias block at the bottom of
`api.ts` (wiped by every regen, per its own comment) was restored.
Not yet committed -- folding into the same commit as the manual E2E
pass once that's done.

## 2026-08-24 -- Karnataka zone tree finished; Star Sales team testing UAT, extended team not yet rolled out

Karnataka zone tree work from the 2026-08-21 decision (Karnataka ->
District flat, except Bangalore keeps its cluster node + Zone 1-6) is
complete: Fazal's North Kerala + Coastal Karnataka district
assignments and Shruthi's explicit per-district assignments (Mysore,
Mandya, Ramnagara, Chamrajnagar, Tumkur, Chitradurga, Hassan, Dharwad)
are both done -- see `docs/Zone-Hierarchy-Territory-Data-2026-08.md`'s
2026-08-21 section for the underlying data/decision this implements.

Staged rollout is proceeding exactly as planned, not skipped: **only
the Star Sales team has been given UAT access so far, and they are
currently testing.** The extended sales team has not been rolled out
and has not started testing -- that step (and their training) stays
gated behind explicit Star Sales sign-off, which has not been received
yet. (An earlier pass at this entry incorrectly said the extended-team
rollout had happened -- corrected same day, 2026-08-24, per Basheer.)

**Reminders-on-Login manual E2E: partially done**, not itemized here --
Basheer is folding the remaining checklist items (see the 2026-08-22
entry's Verification section / `active_progress.md`) into the manual
pass for the new Opportunity-Assignment-Notifications feature since
both surface in the same app-header area. The two features are not
code-dependent on each other -- this is a testing convenience, not a
technical link.

### Same day: Opportunity-Assignment Notifications built and committed

The feature planned earlier the same day
(`docs/Opportunity-Assignment-Notifications-Implementation-Plan.md`)
was fully built and committed as `b772416`: backend `notification`
domain (model/repository/service/router), migrations
0024-0026, hooks into `create_opportunity`/`update_opportunity` (fires
only on an actual reassignment to someone else, not self-assignment or
a no-op re-save), frontend `NotificationBell` + `UrgentNotificationDialog`,
and backend test coverage.

**Two RLS bugs found and fixed during manual testing** (migrations
0025, 0026, same commit): the recipient-scoped policy's implicit
`WITH CHECK` blocked any INSERT where the actor differs from the
recipient -- i.e. every real assignment, since the actor and recipient
are different people by definition. Even after that fix, SQLAlchemy's
read-your-write `RETURNING` clause on the INSERT was still being
filtered by the original narrow `USING` clause, since `RETURNING` on
INSERT is checked against `USING`, not `WITH CHECK` -- a second,
separate fix.

**Not yet done:** the full manual E2E walkthrough of the feature
end-to-end (bell badge, urgent dialog, click-through, mark-as-read on
open) -- see `active_progress.md` for the checklist, bundled with the
remaining Reminders-on-Login items above.

---

## 2026-08-25 -- Opportunity-Assignment Notifications + Reminders-on-Login: full manual E2E pass, five bugs found and fixed

Both features' outstanding manual E2E checklists (from the 2026-08-22
and 2026-08-24 entries above) were walked through live in-browser this
session. Backend suite green throughout (547 -> 558 passed after the
one gap closed below). Frontend changes committed `e47ccc9`; backend
router test gap committed `a6fbf0a`.

**Backend test gap closed (`a6fbf0a`):** the notification feature's
Verification section promised router-level tests for its three new
endpoints (`GET /notifications`, `/unread-count`, `/urgent-unread`),
but none existed -- `notification/router.py` sat at 67% coverage,
missing exactly the three endpoint bodies. Repository and service
layers were tested; the HTTP wiring (routing, auth dependency,
response envelope, `limit` query param) wasn't. Added
`test_notification_router.py`, same pattern as
`test_opportunity_router.py` (mocked `db`, real router+service+
repository wiring exercised). Brings that file to 100%.

**Five bugs found and fixed during the E2E pass (`e47ccc9`):**

1. **Urgent dialog blocking the Opportunity Detail screen it just
   navigated to** -- two distinct root causes, found in sequence:
   - The bell dropdown's `onSelectOpportunity` never touched the
     urgent dialog's dismissal state at all (it was local state
     inside `UrgentNotificationDialog`, only set by that dialog's own
     Dismiss/Review). Fixed by lifting `dismissedAt` to `DemoApp.tsx`
     as `urgentDialogDismissedAt`, stamped unconditionally by
     `handleSelectOpportunity` -- the single shared handler every
     "open an Opportunity" call site uses app-wide, not just this
     dialog.
   - Even after that fix, it could still reappear moments later: the
     `urgent-unread` query had no `refetchInterval` of its own, so it
     only ever refreshed via React Query's default
     `refetchOnWindowFocus` (still on app-wide) or via a `setTimeout`-
     delayed `invalidateQueries(["notifications"])` in `handleReview`
     -- which by prefix-matching also swept up `urgent-unread`. Either
     one could land *after* a click's `dismissedAt` timestamp and pop
     the dialog back up over the newly-opened screen. Confirmed live:
     with only one urgent item, `urgent.length` also independently
     dropped to 0 after the refetch, masking the race; with two, the
     remaining item kept `urgent.length > 0`, exposing it. Fixed by
     scoping `refetchOnWindowFocus: false` + an explicit
     `refetchInterval: 60_000` to that one query (not the global
     `QueryClient`, so no other screen loses its own focus-refresh
     behavior), and narrowing the `invalidateQueries` calls in both
     `UrgentNotificationDialog.handleReview` and
     `NotificationBell.handleSelect` to `unread-count`/`list` only,
     leaving `urgent-unread` to its own interval.
2. **Urgent dialog UX simplified**: was one "Review" button per urgent
   item crammed into the alert dialog (via MUI's `secondaryAction`),
   looking cramped/misaligned with Dismiss. Changed to a single Review
   button in `DialogActions` -- one item navigates straight to it;
   2+ items open a small "Tap a Lead to Review" picker sub-dialog
   (rows are tap-targets, no per-row buttons -- better on mobile).
3. **Opportunity Detail's Back button landing on a blank screen**
   when opening a *second* Opportunity (via the bell dropdown) while
   already viewing a *first* one. `handleSelectOpportunity` was
   unconditionally overwriting `opportunityReturnView` with whatever
   `view` currently was -- which, mid-chain, is `"opportunityDetail"`
   itself. Back then set `view = "opportunityDetail"` with
   `selectedOpportunity = null`, and the render guard
   (`view === "opportunityDetail" && selectedOpportunity && (...)`)
   rendered nothing. Fixed by only capturing a new return view when
   not already on the Detail screen, preserving the true original
   entry point (Pipeline, Customer 360, etc.) across any number of
   chained Detail -> Detail navigations.
4. **Header layout squeeze on narrow viewports**: the logo and
   `+Lead`/`+Log` buttons had no `flexShrink`/`whiteSpace` protection,
   so the header's 6 items (hamburger, logo, 2 buttons, bell, help,
   sign out) could squeeze below their real size at ~392px -- the
   logo shrank from 40px to 28px, and `"+ Lead"` (marginally wider
   than `"+ Log"`) wrapped to two lines while `"+ Log"` didn't,
   producing visibly mismatched button heights. Root-caused precisely
   via live DOM inspection (`scrollWidth` vs actual `width`), not
   guessed -- also ruled out an unrelated NotificationBell change via
   a live revert-and-retest before finding the real cause. Fixed with
   `flexShrink: 0` on every fixed-size header item plus tighter
   `xs`-only gaps/button padding to reclaim the space that protection
   costs.
5. **Next Actions screen, three related fixes**:
   - "Due from"/"Due to" date-range filters moved to their own row
     below the Pending/Completed toggle -- they wrapped awkwardly
     next to it on mobile.
   - Due date now shown (date only, no time) on every reminder card
     -- previously only shown for not-yet-due items, so anything
     Overdue or Completed showed no date at all.
   - Overdue badge was flagging reminders due *earlier today* as
     Overdue, inconsistent with the backend's own due-vs-overdue
     boundary (`auth.py`'s `due_or_overdue_reminder_count` compares
     against end-of-today, not the live instant). Fixed
     `ReminderRow.isOverdue` to compare against start-of-today instead
     of `new Date()`, so "due today" stays "due today" regardless of
     what time of day it currently is, only becoming Overdue once the
     calendar day actually passes. Verified live against a real
     reminder logged due earlier the same day.

All five verified live in-browser (not just code review) before being
called done, including two cases (the refetch race, the chained-
navigation blank screen) that needed actual DOM/React-state inspection
to root-cause correctly after an initial wrong theory each.

**Same session: `UrgentNotificationDialog`'s remaining multi-item edge
case reviewed and fixed.** Basheer brought a diagnosis written up in a
prior session for review. Traced it line-by-line against the actual
code and confirmed it was correct: bug #1 above (the
`dismissedAt`/`refetchInterval` fix) resolved the single-item and
bell-dropdown cases, but reviewing one of 2+ outstanding urgent items
still popped the dialog back up over the just-opened Opportunity Detail
screen within ~500ms. Root cause: `handleReview`'s
`setTimeout(..., 500)` called
`queryClient.invalidateQueries({queryKey: ["notifications"]})`, which by
prefix-matching also invalidated `urgent-unread` -- the exact query bug
#1's fix scoped `refetchOnWindowFocus: false` on specifically to stop it
refetching out-of-band. With only 1 item outstanding the bug was masked
(the refetch also dropped `urgent.length` to 0, independently hiding
the dialog via a separate guard clause); with 2+, the remaining item
kept `urgent.length > 0` and exposed the race. Fixed by narrowing that
invalidate to `unread-count`/`list` only, leaving `urgent-unread` to its
own 60s `refetchInterval` -- committed as part of `e47ccc9`, confirmed
live in the file, already on `main`.

---

## 2026-08-25 (later) -- Manager-Attested Gate Override (BR-OP-14) built end-to-end, applied to Dev

Full plan: `docs/Manager-Attested-Gate-Override-Implementation-Plan.md`;
decision record: `docs/Discussion-FastTrack-Gate-Override-2026-08.md`
(DECIDED same day, Basheer/Haroon). Built the same session the decision
landed in.

**Backend (migration `0027`, applied to Dev by Basheer):** new
`gate_override_reason` master-data table (3 seed rows) + 5 new nullable
columns on `opportunity` (`gate_override_approver_id`,
`gate_override_reason_id`, `gate_override_note`, `gate_override_set_at`,
`gate_override_set_by`) + a DB check constraint mirroring the referral
credit pattern (`ck_opportunity_gate_override_reason_required`).
`validate_stage_transition` gets the same `not is_gate_override` skip
`REPEAT_ORDER` already has on the Demo Date and Expected Closure Date
gates only -- Negotiation->Order and Order->Delivery stay untouched.
`OpportunityService._validate_gate_override`: approver must be the
owner's own `manager_id` holding the Area Manager role, or (escalation
path, no reporting-line check) any General Manager. 17 new backend
tests (5 validator, 7 create-path, 4 update-path covering the full
approver matrix, 1 master-data) -- suite went 558 -> 575 passing.

**Real backend gap found mid-build, not in the original plan's scope:**
`WorkspaceOpportunity` (`backend/app/domains/account/workspace_schemas.py`)
-- a separate response schema Customer 360's and Project Directory's
opportunity lists actually use, distinct from `OpportunityResponse`/
`PipelineOpportunity` (which the plan did cover) -- was missing the
gate-override fields entirely. Without it, editing an Opportunity from
either of those two screens couldn't prefill an existing override. Added
the 3 flat fields + 2 nested (`gate_override_approver`, new
`GateOverrideReasonNested`) to match; caught before any frontend work
against it, not after.

**`Physical-Schema.sql` regenerated** via Docker `pg_dump` against Dev's
`ADMIN_DATABASE_URL` post-migration; diff reviewed line by line --
exactly the new table/columns/constraint/FKs, plus two pre-existing
`notification` index/FK definitions that only swapped `pg_dump`'s
non-deterministic dump order (confirmed not a real schema change).
`BR-OP-14` added to `Business-Rules.md`, same structure as `BR-OP-13`.

**Frontend built across all 4 opportunity entry points**
(`QuickLeadModal.tsx`, `Customer360Screen.tsx` create+edit,
`ProjectDirectoryScreen.tsx` create+edit, `OpportunityDetailScreen.tsx`):
a conditional "Gate Override" section (shown when the Demo Date/Expected
Closure Date gates would otherwise block, or an override is already
set), an approver picker scoped to the owner's actual manager + every
active General Manager (mirrors the backend's own eligibility check so
the picker never offers a choice the request would reject), a reason
dropdown (`listGateOverrideReasons`, new in `masterData.ts`) + optional
note, and client-side "reason required if approver set" validation
mirroring the schema rule. `OpportunityDetailScreen.tsx`'s Overview tab
also got a read-only display box, matching the existing Hold/Loss
reason pattern. `types/api.ts` regenerated twice (once after the
backend build, again after the `WorkspaceOpportunity` fix) against a
locally-run backend. `tsc --noEmit`: clean. `npm run lint`: 0 errors,
238 warnings (all pre-existing `no-explicit-any`, none new).

**Confirmed, not assumed: a Sales Staff rep can create a brand-new
Opportunity directly at Negotiation or Order stage** using this feature
in one create action -- `_validate_gate_override` checks only the named
approver's role, never the creator's, and no Stage picker on any create
form is role-restricted. Verified by reading the actual code
(`_SBU_OVERRIDE_ROLES` only gates the SBU field, unrelated), not
assumed from the design doc.

**Windows networking detour, unrelated to the feature itself:** after
this session's own temporary `uvicorn --port 8000` (started twice to
regenerate `types/api.ts`) was supposedly torn down via `kill %1`, that
only killed the Bash job wrapper, not the underlying Windows process --
left `python.exe` PID squatting on port 8000 with Windows' exclusive-
socket semantics. When Basheer later tried to start his own backend, he
hit `WinError 10013` ("access forbidden"), which was first suspected to
be a Hyper-V/WSL2/Docker Desktop dynamic port-exclusion issue (Docker
had been started earlier the same session for the `pg_dump` step) --
disproven by `netsh interface ipv4 show excludedportrange protocol=tcp`
(8000 wasn't in any excluded range). `netstat -ano` then found the real
leftover PID actually `LISTENING` on 8000; `tasklist`/`wmic` confirmed
it was the stray `uvicorn` process; `taskkill //F` cleared it, port
free immediately, Basheer's own server started fine afterward.

**Committed: nothing yet.** 24 files staged (backend + tests + docs +
frontend, explicitly listed, not `git add -A` -- excluded several other
files already dirty/untracked in the working tree before this session
started, unrelated to this feature) -- Basheer is committing this one
himself.

**Not yet done: manual E2E on Dev.** 14-case checklist written:
`docs/Manager-Attested-Gate-Override-Manual-E2E-Verification.md`,
covering the create-straight-into-Negotiation scenario, the approver-
validation matrix (including two cases that need a direct API call
since the UI picker only ever offers valid choices), gates that stay
enforced, clearing an override, and audit/display. Results log table in
that same file, to be filled in as Basheer runs it.

## 2026-08-26/27 -- Manager-Attested Gate Override: checkbox rework, approver
notification, two audit bugs found and fixed; manual E2E complete, committed

**Auto-trigger design rejected during manual E2E, replaced with an explicit
checkbox.** The original design (override UI appearing automatically whenever
Stage reached Demo with a blank Demo Date) showed the override box on every
Opportunity reaching Demo stage, intended or not -- not a deliberate opt-in.
Replaced across all 4 entry points (`QuickLeadModal.tsx`, `Customer360Screen.tsx`,
`ProjectDirectoryScreen.tsx`, `OpportunityDetailScreen.tsx`) with an explicit
**"Fast-Track this Deal"** checkbox as the sole trigger; redundant duplicate
banner text removed.

**Real crash found and fixed during this rework:** `Customer360Screen.tsx`
called its approver-picker function before the `referralUsers` query it
depends on was declared -- a temporal-dead-zone `ReferenceError` that crashed
the whole screen's render. This is why a newly created Opportunity appeared to
vanish from the pipeline after saving: the `POST` had actually succeeded, the
screen just couldn't render afterward. Fixed by reordering the declarations.

**Approver notification added, 2026-08-27:** the named approver now gets a
one-time, non-urgent bell-icon notification (`GATE_OVERRIDE_NAMED`,
`notification/service.py`) when named -- never the interrupting urgent dialog
(that's reserved for IndiaMART buylead SLA cases). Found and fixed a real bug
along the way: `update_opportunity` was re-stamping
`gate_override_set_at`/`set_by` (and would have re-notified) on *every* save
once an override was set, not just the save that actually set it, because the
frontend always resends the field once checked. Fixed by comparing against the
previous value before re-stamping/notifying.

**Second bug, found by Basheer running TC-6 himself:** unchecking the override
on a deal already sitting at a gated stage (e.g. Negotiation with no Closure
Date) silently succeeded instead of re-blocking the save -- stage gates only
fire on a *forward* stage move (`validators.py`'s `validate_stage_transition`
returns immediately when `new_stage_order <= current_stage_order`), and this
save doesn't change Stage. Worse than the gate simply not re-firing: it let a
rep erase the one audit signal (the named approver) that a shortcut was ever
taken, while keeping the shortcut's effect. Fixed in `update_opportunity`: when
a save clears the override, re-check the current stage's cumulative gates as
if arriving there fresh (`current_stage_order=0`, same pattern
`create_opportunity` uses).

**10 new backend tests added across the two fixes -- 585 passing total** at
the time; `tsc --noEmit` clean. `docs/Manager-Attested-Gate-Override-
Implementation-Plan.md` (step 15) and `docs/Business-Rules.md` (`BR-OP-14`)
updated to match both fixes.

**Unrelated fix, found while testing this feature:** logging in as
Fahad/Fazal (Sales Staff/Area Manager, not Admin/GM) to test the approver
flow surfaced a pre-existing, harmless-but-noisy issue -- the Territory Map
screen is always mounted in the background (`DemoApp.tsx`, for instant tab
switching) and fetched its zone tree unconditionally, 403-ing for any
non-Admin/GM session repeatedly on every window focus. Not caused by this
feature (verified against git history back to 2026-08-12/15) -- just never
noticed before, since prior testing was all on Admin accounts. Fixed:
`TerritoryAdminScreen.tsx`'s query now gates on the same Admin/General-Manager
check its nav entry already used (`TERRITORY_ADMIN_ROLES`, mirrors the
backend's own `_TERRITORY_ADMIN_ROLES`).

**Manual E2E on Dev complete.** All 22 cases run against Dev (guided one
section at a time; TC-14/16 fired live via authenticated fetch as Fahad;
TC-19/21/22 verified against the live DB via an admin connection since Fazal
wasn't logged in separately). 20 Pass, 2 Skipped (TC-13: not representative of
real usage; TC-15: no live test user matched that data shape). No open issues
found. Full detail: `docs/Manager-Attested-Gate-Override-Manual-E2E-
Verification.md`'s Results log.

**Committed:** the checkbox rework + crash fix + notification + both
audit-stamp fixes, `9043a50`; the unrelated Territory Map fix, `a7fb786`.
Feature fully done.

## 2026-08-27 -- Sales Development Activities (BR-ACT-09) built end-to-end,
committed

**Feature:** six new `activity_type` values (Conference/Expo, OEM/Product
Training, Certification, Sales Training, Seminar/Trade Show, Other
Development) let reps log capability-building activity -- conferences,
training, certifications -- with no hospital/deal attached, addressing a GM
request (Haroon) that this kind of activity had nowhere to go in Sales OS.
Decided and scoped in `docs/Discussion-Sales-Development-Activities-2026-08.md`;
built per `docs/Sales-Development-Activities-Implementation-Plan.md`.

**Migration `0028`:** `activity.account_id` made nullable, replaced with a
`chk_activity_account_required` `CHECK` constraint (`account_id IS NOT NULL OR
activity_type IN (...)`) rather than a blanket `NOT NULL` drop -- keeps
BR-ACT-01's guarantee intact for every existing activity type, only the six
new ones are exempted. New `outcome_notes` column. Seeded a `CONFERENCE`
`lead_source` row, confirmed missing from the live dropdown by Basheer --
naming matches the table's existing `ALL_CAPS_WITH_UNDERSCORES` convention
(`COLD_CALL`, `WEBSITE`, ...), not the loosely-worded "Conference" from the
discussion doc.

**Two real gaps found during the build that the discussion doc didn't cover:**
BR-ACT-04's mandatory-next-action rule and BR-ACT-05's closing-activity rule
both only exempted `MANAGER_NOTE` -- extended to the six new types (neither is
a customer interaction). Also found and fixed: `ActivityService.log_activity`
unconditionally called `account_exists(data.account_id)`, which would have
misbehaved once `account_id` could be `None`. New shared
`SALES_DEVELOPMENT_ACTIVITY_TYPES` frozenset in `activity/schemas.py` governs
all three exemptions (no-next-action, no-account-required, invalid-closing-
type) so the three call sites can't drift apart the way `MANAGER_NOTE`'s
single-site exemption previously invited.

**Decision #4a, made with Basheer:** `notes` (the general description) is
required specifically for `OTHER_DEVELOPMENT` -- the other five types name
themselves ("Certification" already says what happened), but the catch-all
type carries no information on its own without it.

**BR-ACT-09** added to `Business-Rules.md`; `BR-ACT-01`/`BR-ACT-03`/`BR-ACT-04`
amended to describe the six-type exception precisely.

**Frontend:** `LogActivityModal.tsx` -- six new type options, the shared
exemption set (kept in sync by hand with the backend, no shared package
between frontend/backend), account picker becomes optional for these six,
new "Outcome/Learning" field. `activityTypes.ts` gained six new
icon/label/color entries (the `ACTIVITY_TYPE_CONFIG` `Record` is typed
exhaustively over `ActivityType`, so `tsc` fails to compile until all six are
present -- a useful forcing function).

**Real UI bug found live during manual E2E, fixed same session:**
`DailyActivityReportScreen.tsx`'s `ReportRow` rendered `notes` inline but
never referenced the new `outcome_notes` field at all -- meaning the one field
BR-ACT-09 actually requires, the whole point of these entries, was invisible
on the only screen these unattached activities ever appear on (per BR-ACT-09,
they never show on any Account/Opportunity page). First fix labeled every
entry's description box ("DESCRIPTION:") unconditionally, which Basheer
correctly flagged as clutter -- 11 of 12 activity types only ever show one
box and never needed disambiguating. Corrected: labels only render when both
`notes` and `outcome_notes` are present on the same row (`Other Development`
only, the sole case needing to tell two boxes apart); every other type/entry
stays a single unlabeled box, exactly as it always worked.

**Testing:** 619/619 backend tests passing (17 new, covering the six-type
validators, the `account_exists` guard fix, the BR-ACT-05 exclusion, and
`ActivityReportRow`/`ActivityContextNested` serializing correctly with
`account=None`); `ruff`/`tsc`/`lint` clean.

**Manual E2E on Dev: 17/17 cases pass**, run live as Fahad, driven via Claude
browser automation with Basheer supervising (his explicit request that
session). Confirmed: all six types save correctly with no account; the
required-field validators block correctly; a normal type's account/next-action
requirements are unaffected (regression); Manager Note unaffected; the
BR-ACT-05 exclusion rejects at the API level, not just in the gated UI;
`—` renders cleanly for a blank account, no crash; the `CONFERENCE`
lead_source row is live and reachable. Full detail: `docs/Sales-Development-
Activities-Manual-E2E-Verification.md`'s Results log.

**Committed:** `ac587a3`. Feature fully done.

## 2026-08-27 (later) -- Referral Credit Part 2 / Relationship-Support Activity
(BR-ACT-10) built end-to-end, committed

**Feature:** a new `RELATIONSHIP_SUPPORT` activity type lets someone with no
standing access to an Opportunity -- outside its owner/split/tier-visibility
route entirely, regardless of SBU or zone -- log a short note against it
documenting informal help given (an introduction, a call to a contact), with
no ownership/split/revenue change. Completes the two-part plan from
`docs/Discussion-SplitParticipant-SBU-Scope.md` (v6, §3.3) -- Part 1
(Referral Credit, `BR-FIN-07`) shipped 2026-08-18; this is Part 2, the
informal counterpart (Referral Credit is for whoever originated the lead;
Relationship Support is for whoever helped along the way without originating
anything). Built per `docs/Referral-Credit-And-Relationship-Support-
Implementation-Plan.md`.

**Migration `0029`** (originally planned as `0028`, bumped a second time
because Sales Development Activities claimed it first that same week): two
narrow `SECURITY DEFINER` functions mirroring the existing
`cabio_app_has_split()`/`cabio_app_assigned_reminder()` pattern --
`cabio_app_opportunity_in_account(opportunity_id, account_id)` (write-path
check: lets `log_activity` accept an Opportunity the caller's own RLS-scoped
`opportunity_exists()` would otherwise correctly reject as invisible) and
`cabio_app_account_opportunities(account_id)` (the "Related Opportunity"
picker's lookup -- the first row-returning `SECURITY DEFINER` function in
this codebase, not assumed safe by analogy to the boolean ones alone). Plus
`activity_tier_visibility` gains `OR user_id = cabio_app_uid()`, so the
cross-SBU logger's own just-written row is readable back afterward.

**Two real gaps found and filled beyond the original plan:** `opportunity_id`
and `notes` are both now required for `RELATIONSHIP_SUPPORT` -- the plan left
both optional at the schema level, which would have let the feature degrade
into a meaningless unlinked, empty note (no different from an ordinary
Account-level Note). `BR-ACT-10` added to `Business-Rules.md`;
`BR-ACT-04`/`BR-ACT-05` amended a second time to add this type to the
existing `NOT_CUSTOMER_FACING_TYPES` exemption set (consolidated from the
Sales Development Activities build rather than reintroducing a second,
overlapping exemption set).

**Frontend:** `LogActivityModal.tsx` -- new "Related Opportunity" picker,
rendered only when `activityType === "RELATIONSHIP_SUPPORT"` and there's no
fixed `opportunityId` prop (2026-08-25 architecture decision with Basheer --
the general-purpose "tag any note to a deal from the Account level" version
from the original plan draft was explicitly dropped, not bundled in). Cleared
automatically when switching away from the type.

**Two real UI/data bugs found live during manual E2E, both fixed same
session:** (1) the new picker's floating label overlapped its "Select
opportunity" placeholder text -- missing `inputLabel: { shrink: true }`,
exactly the pattern the modal's own "Assign Next Action To" field already
used for the same shape of labeled-select-with-placeholder. (2) Basheer
caught, testing from Customer 360: the linked Opportunity's name never
rendered on the logger's own Daily Activity Report entry, even for a same-
appearing-but-actually-cross-SBU case -- `ActivityReportRow.opportunity` is
populated via a plain SQLAlchemy relationship load, which goes through
Opportunity's own tier-visibility RLS, silently returning `None` even for the
person who logged the activity. Fixed in the router: backfill the name via
the same unscoped lookup the picker itself used (one lookup per distinct
account among affected rows, not per row) -- not a new information leak,
since the caller already saw and picked that exact name seconds earlier.

**Testing:** 621/621 backend tests passing (13 new across both the initial
build and the opportunity-name backfill fix); `ruff`/`tsc`/`lint` clean.

**Manual E2E on Dev: 16/16 cases pass**, run live as Fahad doubling as both
the same-SBU sanity check and the cross-SBU test subject (Imaging/Mangalore
logging against a Critical Care opportunity he had zero standing access to).
**The real security-relevant check, confirmed:** the target Opportunity
returned 0 results in a normal Pipeline search and 404'd on direct API access
both before and after the cross-SBU write -- the widening never expanded
beyond the picker itself. **One finding, tighter than planned, not a bug:**
after the opportunity-name backfill fix, a cross-SBU logger's own note text
and the Opportunity's name both now read back correctly on their own entry,
but `GET /opportunities/{id}` and `GET /opportunities/{id}/activities` both
still 404 for them -- the widening really is name-only, confirmed at the API
level, nowhere else. Full detail: `docs/Referral-Credit-And-Relationship-
Support-Manual-E2E-Verification.md`'s Results log.

**Committed:** `4e1f4c8`. Feature fully done.

## 2026-08-29 -- Extended sales team walkthrough: onboarding, live storage bug fixed, a false-alarm report "bug," and a duplicate-hospital decision brief

**Extended sales team walkthrough held today**, ahead of the Star Sales
sign-off this doc's 2026-08-24 entry said was required -- Basheer's explicit
call to proceed without it, not an oversight. Ran roughly 1.5-2 hours after
the decision to go ahead.

**Onboarding.** Claude proposed a 10-person roster for the extended team
(email/role/SBU/primary zone/manager per person), matching the existing
7-account UAT convention (`firstname@cabio-uat.com`, `docs/Progress-
Archive-2026-08.md`'s 2026-08-03 entry). Basheer created every Supabase
Auth account and every `user_profile` row himself -- Claude never wrote to
the live DB, only proposed the roster and verified the result afterward via
read-only query (`ADMIN_DATABASE_URL` from `backend/.env.uat`, same
mechanism as the original 7-account bootstrap).

Verified live roster: Vivek (South Kerala / Adarsh), Rudrappa Deevatagi
(Bangalore East / Shruthi), Om Hiremath (Bangalore West / Shruthi),
Dhanushma (Bangalore South / Shruthi), Ravi Kumar (Chitradurga / Shruthi),
Irfan (Kasaragod / Fazal), Fahad (Mangalore / Fazal), Adydev (Kozhikode /
Nishad), Naeem (Malappuram, Area Manager / Haroon), and **Gopika pv**
(Malappuram / Naeem) -- Gopika wasn't in the original proposed roster,
added by Basheer directly.

**Nagesh Ninganoor was deliberately not onboarded -- he has resigned.**
His territory (Mysuru, Mandya, Ramnagara, Chamrajanagar) needed interim
coverage; Basheer's call: Shruthi covers it until a replacement joins.
Checked via read-only query on `user_zone` -- **already true**, no DB
change needed. Shruthi's 2026-08-24 territory assignment already included
all four of those districts as part of her broader Karnataka-wide
coverage. `docs/Zone-Hierarchy-Territory-Data-2026-08.md` still names
Nagesh as the assignee for those four districts -- stale, needs a
correction pass (Shruthi interim, then whoever replaces Nagesh) next time
that doc is touched.

**Structural finding, incidental to the onboarding work:** live UAT's
Bangalore zone tree is 5 directional clusters (Central/East/North/South/
West), not the numbered "Zone 1-6" scheme `Zone-Hierarchy-Territory-Data-
2026-08.md` describes. The planning doc is stale on Bangalore's actual
built structure -- discovered while trying to map Rudrappa/Om Hiremath/
Dhanushma's planning-doc zone numbers onto real `zone` table rows during
roster prep; Basheer confirmed the live `user_profile` assignments (already
made) as authoritative rather than have Claude guess a mapping.

**Bug found and fixed: Opportunity Document upload (PDF/JPG) failing in
UAT.** Surfaced live during the walkthrough -- upload attempts failed
outright. Root-caused by checking the actual app config rather than the
Supabase dashboard: `backend/app/core/storage.py` calls Supabase's Storage
REST API directly via `httpx`, using `SUPABASE_SERVICE_ROLE_KEY` -- separate
from both the SQLAlchemy `DATABASE_URL` connection (backend) and the
`supabase-js` client (frontend, Auth-only, confirmed via grep to have zero
`.from()` table-query calls). `backend/.env.uat` had `SUPABASE_URL` but
**no `SUPABASE_SERVICE_ROLE_KEY` at all** -- confirmed by grepping the key
name (not its value). The `documents` Storage bucket itself also hadn't
been created in UAT. Matches the unchecked checklist item in
`docs/Deployment-Topology.md` ("Supabase Storage `documents` bucket +
`SUPABASE_SERVICE_ROLE_KEY` secret must be provisioned... per-environment")
-- that item is tracked for Prod only, so UAT's own gap had gone
unverified. **Fixed by Basheer:** created the private `documents` bucket in
UAT Supabase Storage (private, not public -- all access is proxied through
the backend's service-role key and short-lived signed URLs per BR-ACT-08,
so no bucket-level policies were needed), set `SUPABASE_SERVICE_ROLE_KEY`
in Render's UAT environment variables and in `backend/.env.uat` locally,
redeployed. **Verified working** by Basheer, live, after the fix. Same gap
plausibly exists for Prod -- still an open, unchecked item there.

**False alarm, not a bug: Daily Activity Report "missing" an activity.**
Also surfaced live during the walkthrough -- an activity logged for Naeem
(MEETING type) didn't appear in the Daily Activity Report, even though the
row existed in the `activity` table and Basheer was viewing as Admin
(unrestricted role, rules out the tier-visibility scoping in
`ActivityRepository._apply_daily_report_scope`). Read-only diagnostic query
against UAT showed the row's `activity_date` = 2026-08-15, while
`created_at` = today -- confirmed by Basheer as **correct**: a real past
visit, entered retroactively today. The report correctly filters by
`activity_date` (when the activity happened), not `created_at` (when it was
logged) -- `ActivityService.list_daily_report` computes an IST calendar-day
window from the requested `report_date` and queries `Activity.activity_date`
against it, exactly as designed. No code change made or needed.

**Duplicate hospital names -- decision brief written, not yet built either
way.** Raised by Basheer during the walkthrough: Account creation only
blocks an exact case-insensitive name match (`Account
Repository.exists_by_name`, `func.lower(Account.name) ==
func.lower(name)`) -- a one-character-different name is allowed through, so
near-duplicate hospital records can accumulate. Two options sized for a
decision: **(A) restrict new-Account creation to Admin/GM roles**
(~half a day -- one role check mirroring the existing BR-OP-12 pattern, hide
the "Add Account" affordance in `CustomerDirectoryScreen.tsx` for other
roles -- but removes the "add a hospital on the spot" field workflow the
UAT setup doc explicitly describes as expected usage); **(B) a soft
similarity warning at creation time** using Postgres's `pg_trgm` extension
(`similarity()` scoring against existing names, non-blocking confirm dialog
on a near-match) -- ~1-1.5 days plus follow-up threshold-tuning time, since
common Indian hospital-name tokens ("Hospital," "Medical College," "Nursing
Home") will inflate similarity scores until normalized out. Recommendation:
Option B, on workflow-fit grounds, at roughly 2-3x Option A's cost. Written
up for a non-technical audience and saved to `docs/Duplicate-Hospital-
Decision-Brief-2026-08-29.md`; tracked in `docs/Backlog.md`'s "Deferred /
undecided items." Basheer taking it to Haroon 2026-08-30 -- no code
changes made pending that decision.

---

## 2026-08-30 -- Two real duplicate hospitals found and fixed in UAT, directory-wide cleanup, and an Option B prototype (BR-ACC-03)

**Trigger: Nishad K V called in a real duplicate.** He'd added "EMS
cooperative hospital Cherpulassery" ~3 weeks earlier, forgot, and added it
again as "Cooperative hos Cherpulassery" -- then logged a real ₹16.85L
Critical Care Opportunity (Edan CX12, Aeonmed 7200A, Magnamed OxyMag) and a
VISIT activity against the wrong (new) account. Root cause confirmed by
direct UAT queries via `ADMIN_DATABASE_URL` (the app-role `DATABASE_URL`
connection returns zero rows for RLS-protected tables like `opportunity`
without the app's `set_config` session context -- cost real time
mid-investigation before realizing the "not found" result was RLS silently
filtering, not an empty table). Fixed: `UPDATE opportunity`/`UPDATE
activity` re-pointing both to the original account, `DELETE` the duplicate
account -- run by Basheer directly in the Supabase SQL Editor (DB-mutating
commands stay outside Claude's tool access per this project's standing
rule).

**While tracing a side-finding (a no-`created_by` "EMS Hospital" account),
found the real explanation in this file's own 2026-08-02 entry:** UAT was
seeded from Dev with an 18-down-to-11-account demo copy ahead of the first
orientation, done as a direct DB copy (no app user, hence no `created_by`).
Audited all 11 for dependencies: 7 were untouched and clean; `Aster MIMS
Calicut` carried live Haroon Sidheeq pipeline data (kept); `Aster DM`,
`KIMS Al-Shifa Hospital, Perinthalmanna`, and `aster medicity` carried only
Basheer's own "ICU Monitor" demo opportunities from the manager
orientation (all three created within one hour on 2026-08-03). Deleted the
9 accounts with no real data, deleted the 3 demo opportunities + Aster DM's
"New Imaging department" demo project, kept Aster DM itself since it's the
real parent-group record for two genuine hospitals.

**A full fuzzy-duplicate sweep of the whole 76-account UAT directory**
(after the above cleanup) found a second real duplicate, unrelated to
Nishad's: `Aster Mims Mother Areekode` / `Aster MIMS Mother Hospital
Areekode`, both entered by Haroon Sidheeq 15 days apart, each carrying a
different real deal (an ECG machine, a portable ultrasound) plus real
activities -- a true merge, not a delete, since both deals were genuine.
Consolidated both onto the older account (which already had the correct
`parent_account_id`), deleted the duplicate. Net across the whole session:
**77 -> 66 UAT accounts**, zero real Opportunity/Activity data lost.
First-pass fuzzy search used raw `pg_trgm` `similarity()` and produced 96
noisy candidate pairs, dominated by false positives on shared generic
words ("Medical College Hospital," "Diagnostics," "Cooperative Hospital");
a second pass stripping those generic words before fuzzy-matching the
remaining significant words cut this to 12 candidates and correctly
separated the 2 real duplicates from the rest (e.g. Ramaiah/KMCT/Yenepoya
Medical College Hospital -- three real, unrelated hospitals -- no longer
false-flagged).

**Turned into an Option B prototype (BR-ACC-03, `docs/Business-Rules.md`)
to test whether it would actually have prevented both real incidents.**
`AccountService.create_account` now checks `AccountRepository.
find_similar_by_name` before creating; a match raises `PossibleDuplicateError`
(new in `core/exceptions.py`) -> `409 POSSIBLE_DUPLICATE` with candidate
accounts, unless the caller sets `force_create=true` on `AccountCreate`.
`CustomerDirectoryScreen.tsx`'s "New Customer" modal shows the match(es)
with "Use this one instead" (navigates to the existing account via
`onSelectAccount`, whose type was widened from the full `AccountListResponse`
to the `{id, name}` shape every other caller in the app already uses) and
"No, create it anyway" (resubmits with `force_create`).

**First version scoped the check to an exact `zone_id` match** (a rep
re-entering a hospital is almost always in their own zone, cutting most
cross-hospital generic-word false positives for free) -- validated against
both real incidents successfully. **Basheer found a real gap during manual
testing:** tried adding "al Shifa" against an existing "Al Shifa Hospital"
and it didn't fire, because zones are a hierarchy (`zone_closure` table,
migration `0019`) -- the existing hospital was filed at the top-level
"North Kerala" zone, the new one at "Malappuram," a sub-zone of it. Exact
`zone_id` equality missed same-territory duplicates filed at different
tree depths.

**Fix widened the check to the whole top-level zone branch** (via
`zone_closure`'s ancestor/descendant rows) and replaced raw
`similarity()` with the same generic-word-stripped token matcher validated
during the directory sweep above -- required together, not separately:
widening the pool alone reopens the false-positive problem raw similarity
has (confirmed with real numbers -- `Ramaiah Medical College Hospital` vs
`Kmct Medical college Hospital`, different real hospitals, scores *higher*
on raw similarity, 0.649, than the real `Al Shifa Hospital`/`al Shifa`
duplicate does, 0.529 -- no single raw-similarity threshold gets both
right). New `account/duplicate_matching.py` holds the scorer, independently
unit-tested (`test_duplicate_matching.py`) -- the first time this
similarity logic has had direct test coverage, since the codebase's
existing convention was to leave `pg_trgm`-dependent repository methods
untested (no real-DB integration suite for them). One accepted, documented
trade-off found in that process: two genuinely different real hospital
branches sharing a brand + generic wording, differing only in town name
(`EMS cooperative hospital Cherpulassery` vs `EMS Coperative Hospital
Perambra`), still score above threshold -- acceptable since the UX is a
one-tap-dismiss warning, not a hard block.

**Hardened from prototype to reviewable state, all in this session:**
similarity threshold moved to `ACCOUNT_DUPLICATE_SIMILARITY_THRESHOLD`
(config, default `0.5`, tunable without a redeploy -- the brief itself
anticipated needing real-world tuning); every warning and every override
now logged (`account_possible_duplicate_warned` / `account_
duplicate_override_confirmed`, `core/logging.py`'s existing `structlog`
setup -- the first domain-service use of it, previously confined to
`main.py`'s infra-level logging) so the threshold can actually be tuned
from real usage later; the confirmation UI now lists every candidate
returned (previously only showed the closest); BR-ACC-03 written up in
`docs/Business-Rules.md` and the decision brief's status updated to
reflect it's built-and-validated-but-not-approved. Backend suite: 631/631
passing (was 623 before this session's changes); frontend `tsc --noEmit`
and `npm run lint` both clean, no new warnings.

**Explicitly not a rollout.** This is still a prototype built to answer
"would Option B have worked" -- validated yes, against three real cases
(Nishad's, Haroon's Areekode entries, and the Al Shifa zone-hierarchy
gap Basheer found manually). The Option A vs. B decision itself is still
Haroon's, per the original brief; nothing here is live for the sales team.

**Also not yet in this file as of the 08-30 write-up above:** the actual
create-hospital UI for the warning (`SilentModalError`, the "Did you mean
X?" Alert with Use This One / Create Anyway in `CustomerDirectoryScreen.tsx`,
`FormModal.tsx`, `lib/api.ts`, `lib/formErrors.ts`) was built in the same
session but ~4 hours after this entry and `active_progress.md` were last
saved -- reconstructed 2026-08-31 from file mtimes when the handover doc
turned out to be stale. Noted here so the gap doesn't repeat: this file and
`active_progress.md` need updating as work lands, not only at a session's
first stopping point.

## 2026-08-31 -- Real "aster 1"/"aster 2" duplicate in dev exposed a zone-branch lookup gap; fixed, plus rep territory scoping for Add/Edit Hospital

**Trigger:** Basheer manually testing the BR-ACC-03 prototype added "aster
1" to the directory with its zone set to bare "Kerala" (the state node, not
a district or region under it), then added "aster 2" the same way -- no
duplicate warning fired for either.

**Root cause:** `AccountRepository.find_similar_by_name` finds its search
scope by walking up from the new hospital's zone to the nearest ancestor at
`zone_level="ZONE"` (North Kerala / South Kerala / etc.), then compares
against every account in that whole branch. That walk assumes the zone
picked is always a ZONE-level node or something under it. "Kerala" itself
sits *above* ZONE level (a `zone_level="STATE"` parent, added earlier in the
zone-hierarchy work) -- walking up from it finds no ZONE-level ancestor at
all, so the old code (`root_zone_id` built as a `.scalar_subquery()` and
never independently executed) silently produced `ancestor_zone_id = NULL`,
which SQL never matches anything. Confirmed directly against dev data: the
ancestor lookup for Kerala's own `zone_id` returned zero rows, and the
existing "aster 1" account really was filed at `zone_id = Kerala`.

**Fix (`find_similar_by_name`):** execute the ancestor lookup as a real
query first; if it comes back empty, fall back to the hospital's own
`zone_id` as the search root instead of giving up. The existing "walk up,
then sweep every zone underneath the root" logic (`zone_closure`) then
naturally covers the whole state when anchored at "Kerala" -- no special-
casing needed. Verified against real data: a new "aster 2" filed at Kerala
now correctly surfaces all 5 existing Aster-named hospitals across the
state (`aster 1`, `aster md`, `Aster MIMS Calicut`, `aster hospital`, plus
one unrelated near-miss).

**Discussed and deliberately did NOT narrow the comparison scope to fix
this** (raised by Basheer): the region-wide sweep is intentional, not
collateral -- it's what catches a colleague or manager having already
added the same hospital in a neighboring district or at the region level,
which is the exact real-incident pattern (Nishad's, Haroon's) BR-ACC-03
exists to catch. Confirmed empirically that climbing from an already-ZONE-
level pick (e.g. "North Kerala") does *not* over-widen to the state --
only a pick with no ZONE-level ancestor at all triggers the fallback.

**Follow-up scoping decision, also from this session:** should reps be
allowed to pick a zone that broad in the first place? Concluded: no --
built a second, narrower fix rather than only patching the query.

- **New rep-scoped zone search**, `master-data/zones/search-for-hospital`
  (`master_data.py`) + `ZoneRepository.search_by_name`'s new
  `within_zone_id` param: Admin/General Manager keep the existing
  unrestricted search; every other role is scoped to their own
  `zone_id` plus everything under it (chosen over their multi-zone
  `UserZone` assignments -- a hospital's physical location can only ever
  be one place, so the single home zone is the right source of truth
  here, unlike the Opportunity-visibility RLS rule which does use
  `UserZone`). Verified against real data: a rep scoped to "Kozhikode"
  gets "Kozhikode" back for a "Koz" search and nothing for "Ernakulam";
  the existing unrestricted `zones/search` endpoint (used by Territory
  Admin, User Directory, Customer 360's other pickers, Opportunity
  Pipeline) is untouched -- new sibling endpoint, not a flag on the old
  one, so those four screens can't regress.
- **`ZonePicker.tsx`** gained an optional `searchFn` prop (defaults to
  the existing unrestricted search) rather than a second component --
  wired into the new endpoint only in `CustomerDirectoryScreen.tsx`
  (Add) and `Customer360Screen.tsx` (Edit)'s hospital zone field; the
  Directory's own zone *filter* picker stays unrestricted, since
  Accounts have no RLS and are already visible to everyone (confirmed
  directly: no `ENABLE ROW LEVEL SECURITY` on `account` in
  Physical-Schema.sql, unlike Opportunity's tiered RLS policy).
- **Hard block for a rep with no zone assigned**, Add only (not Edit, by
  explicit scope call): `AccountService.create_account` now checks the
  creating user's own `zone_id` before anything else in the method and
  raises `BusinessRuleViolation` regardless of what `zone_id` was
  submitted -- can't be bypassed by calling the API directly even if the
  UI's restricted picker is skipped. Mirrored in
  `CustomerDirectoryScreen.tsx`'s `openCreateModal` with a plain-language
  dialog before the form even opens, same message text both places.

Backend suite: 638/638 passing (was 634 going in). Frontend `tsc --noEmit`
and `npm run lint` both clean, no new warnings. **Not yet done:** no manual
browser pass on any of this session's three changes, and nothing is
committed.

---

## 2026-08-31 (later) — Duplicate Opportunity incident (Mount Zion/Vivek), and a full architecture design session for Marketing-Sourced Lead Management + Relationship Notes

Separate session, investigation/planning only — no code changes, no
migrations, no commits. Ran in parallel with the BR-ACC-03 session above;
confirmed zero file overlap throughout.

**Investigated and fixed: periodic-logout bug.** Traced to
`AuthContext.tsx`'s deactivation check (added 2026-08-15, `980d81b`)
signing users out on *any* `/auth/me` failure, including transient network
blips during the hourly background token refresh — not just a genuine
401/403. Also designed a 60-minute inactivity timeout (previously absent
entirely). Full design: `docs/Auth-Session-Resilience-Implementation-
Plan.md`. (Built same day by the BR-ACC-03 session per that plan's status
line — not built by this session.)

**Planned: Audit Trail for account/user_profile/product/opportunity.**
Implements ADR-017 for the four tables named in `docs/Audit-Trail-
Implementation-Brief-2026-08-31.md`. Design went through two real
simplifications during review, both catching genuine over-engineering in
the first draft: (1) UPDATE logs only the fields that actually changed,
computed generically via `jsonb_each` comparison, not a full-row copy;
(2) CREATE isn't logged at all — the master row's own `created_by`/
`created_at` plus the first edit's `old_data` already recover everything a
creation snapshot would add, so the trigger only reacts to UPDATE/DELETE.
One high-risk implementation detail flagged prominently: the trigger
function must be `SECURITY DEFINER` or its own insert into the RLS-
protected `audit_log` table would fail and roll back every write to all
four tables. Full design: `docs/Audit-Trail-Implementation-Plan.md`.

**Incident: duplicate Opportunity for Mount Zion Medical College.**
"CTG Machine @ Mount Zion Medical College" — created by Abdul Latheef P
2026-08-31 09:23 UTC, assigned to Vivek — turned out to duplicate an
Opportunity Vivek had already entered himself, already at Demo stage.
Verified zero FK dependents (`activity`, `document`, `opportunity_item`,
`opportunity_stakeholder`, `split`, and `reminder` via `activity` all
returned 0 rows) via a read-only check against UAT before deleting;
confirmed no `ON DELETE CASCADE` exists anywhere in the schema, so the
delete would have been safely refused by Postgres if any dependent had
existed. Deleted directly per Basheer's request. Side finding: UAT is
missing at least migration `0024` (`notification` table doesn't exist
there) — confirmed known/expected, not a bug (some migrations haven't been
promoted to UAT yet).

**That incident became a full architecture discussion, landing on two new
planned features:**

1. **A new "Marketing User" role** (create-and-assign only, no pipeline
   visibility) is needed to enter leads from conference events and
   IndiaMART, assigning each to the appropriate rep. Researched how
   Salesforce/Zoho/Dynamics 365 handle this (all three: a separate,
   loosely-structured Lead object, converted into a real Opportunity only
   after a human reviews it; Dynamics' disqualify-reasons even include a
   named "Duplicate" outcome). Landed on a Cabio-appropriate variant: a new
   `lead` table (not reusing `opportunity`) so unqualified/junk marketing
   interest never touches real pipeline data or its forecasting numbers.
   The Mount Zion incident wouldn't have been prevented by a same-account
   duplicate-Opportunity warning at creation time (no product matched —
   it was a vague post-conference "interest recorded" entry, not a scoped
   deal) — the actual fix is structural: nothing becomes a real Opportunity
   until a rep has carefully reviewed and converted it, so a duplicate gets
   caught (and simply discarded) before it ever enters the pipeline, not
   detected after the fact. Confirmed existing full-access reps/managers
   already have a working self-check for this via Customer 360's
   Opportunities tab — the gap only exists for a role with no other
   visibility. **Also decided:** the existing IndiaMART 4-hour buylead-
   credit urgent-notification behavior (`URGENT_LEAD_SOURCE_NAMES` in
   `notification/service.py`, shipped as part of Opportunity-Assignment-
   Notifications, `b772416`) needs to be retired — that response now
   happens on IndiaMART's own platform, by the lead-entry person, before
   anything reaches Cabio at all. Confirmed this feature is Dev-only, never
   promoted to UAT/Prod, so the revert carries no live-environment risk.
   Full design: `docs/Lead-Management-Implementation-Plan.md`.

2. **A new `RELATIONSHIP_NOTE` Activity type** for durable, editable
   relationship/deal context ("procurement head is price-sensitive"), as
   distinct from Activity's existing per-interaction timestamped log.
   Discovered the codebase already has almost exactly this shape of thing
   (`MANAGER_NOTE`, exempt from BR-ACT-04's mandatory-next-action rule) —
   extending that established pattern rather than adding an overwritable
   column on `account`/`opportunity` avoids ever losing history in the
   first place (an overwritable field would have needed the Audit Trail as
   a safety net, which has no viewing UI this phase — a real answer for
   compliance, not a practical one for reading back "what did this note
   used to say"). Bundled with a same-ship Activity-tab type filter on
   Customer 360, since a new note type nobody can find in a long-running
   account's activity history is only half a feature. Full design:
   `docs/Relationship-Note-Implementation-Plan.md`.

**Not yet decided:** sequencing among the four now-queued items (Auth
Session Resilience — built; Audit Trail; Lead Management; Relationship
Note) beyond Auth-before-Audit-Trail, decided earlier the same day.
Whether the Marketing User role also needs Account-creation rights (tying
directly into BR-ACC-03's still-undecided Option A/B call) is flagged as
an open question in the Lead Management plan, not resolved here.

## 2026-08-31 (later) -- Auth Session Resilience Part B (idle timeout) built, manually tested, found broken -- root cause not yet found

Built both parts of `docs/Auth-Session-Resilience-Implementation-Plan.md`
end to end: Part A (retry up to 2x before signing out on a transient
`/auth/me` failure, only a definitive 401/403 signs out immediately) and
Part B (60-minute inactivity timeout, new `useIdleLogout` hook mounted in
`AuthGate`, a distinct "signed out due to inactivity" message on
`LoginScreen` via a new `signOutReason` context field). `tsc --noEmit` and
`npm run lint` both clean throughout. One real bug caught by the compiler
before it ever ran: `DemoApp.tsx`'s "Log out" button was wired
`onClick={signOut}` -- now that `signOut` takes an optional reason, that
would have silently passed the click event itself as the reason on every
manual logout. Fixed to `onClick={() => signOut()}`.

**Manual testing found Part B's message not displaying, then found Part B
itself not reliably firing at all -- two separate problems, only the
first is understood.**

1. **Message not showing, first fix (confirmed real, but insufficient
   alone):** `signOut()` was writing `signOutReason` as its *last* step,
   after `supabase.auth.signOut()` -- which independently triggers its own
   `onAuthStateChange(SIGNED_OUT)` event that can reach `LoginScreen`
   before `signOut()`'s own state updates land. Reordered to set
   `signOutReason` first. Confirmed via added trace logging
   (`console.log` calls marked `// TEMPORARY` in `AuthContext.tsx`,
   `useIdleLogout.ts`, `LoginScreen.tsx` -- not yet removed) that with
   this fix, one clean test (stayed on the tab, watched it, didn't
   background) worked correctly end to end: timer fired, `signOut("idle")`
   called, `LoginScreen` rendered with `signOutReason: "idle"` on both
   renders after.

2. **Backgrounding the tab never exercised the fix at all.** Every attempt
   to background the tab and return (20s, then a real 1-hour gap) produced
   the identical console signature as a fresh page load/hard refresh --
   the startup burst (`applySession(null)` x3, several blank `LoginScreen`
   renders) with no `useIdleLogout` firing log and no `signOut` log at all.
   Most likely cause: the browser is discarding/reloading the backgrounded
   tab outright (Chrome's memory-saving tab discarding, more aggressive
   than expected even at ~20s -- confirmed still on a laptop, not mobile,
   per Basheer), which wipes all in-page JS state including the idle timer
   before it can run. Added a `visibilitychange`-triggered immediate
   re-check (on top of the existing interval, not replacing it) specifically
   to catch a throttled-while-hidden timer the moment focus returns -- this
   does not violate the plan's "don't reset on visibilitychange" design
   rule (a check isn't a reset).

3. **Regression found after the visibilitychange fix, not yet
   understood:** subsequent tests -- including sitting and watching the
   tab the whole time, no backgrounding at all -- now show the user get
   signed out around 13-15s with *no* `useIdleLogout`/`signOut` trace logs
   at all, i.e. not going through Part B's code path, and no message
   shown. This was not happening in the one earlier clean success (item 1
   above). Leading unverified hypothesis for tomorrow: `applySession`'s
   *other* branch (Part A's own definitive-401/403 path, `AuthContext.tsx`
   ~line 92-95) calls `supabase.auth.signOut()` directly, bypassing the
   context's `signOut()` wrapper entirely -- that path has no trace
   logging added (only the `if (!s)` branch does), so it would produce
   exactly this signature (silent, no idle/signOut logs, but a real
   `applySession(null)`-triggered sign-out) if `/auth/me` is genuinely
   returning a 401/403 around that time for an unrelated reason. Not
   confirmed. Suspicious 13-15s timing (close to the temporary 15s test
   constant) may be coincidental or may point at an interaction between
   Part A and Part B not yet understood.

**State of the files as of stopping -- must NOT be committed as-is:**
- `sales-os-app/src/hooks/useIdleLogout.ts`: `IDLE_TIMEOUT_MS`/
  `CHECK_INTERVAL_MS`/`ACTIVITY_THROTTLE_MS` temporarily shrunk from
  60min/30s/30s to 15s/3s/2s for testing; original values noted in a
  comment. Plus one `// TEMPORARY` debug `console.log` on firing.
- `sales-os-app/src/contexts/AuthContext.tsx`: two `// TEMPORARY` debug
  `console.log` calls (in `applySession`'s null-session branch, and in
  `signOut`). The `signOut` reorder fix (set `signOutReason` before the
  Supabase call) is a real, permanent fix -- keep it.
- `sales-os-app/src/components/LoginScreen.tsx`: one `// TEMPORARY` debug
  `console.log` on every render.

**Next session:** add trace logging to `applySession`'s other (definitive-
rejection) branch to confirm or rule out the leading hypothesis above;
consider testing Part A and Part B in isolation from each other (e.g.
temporarily disable `useIdleLogout`'s call in `AuthGate` to see if Part A
alone still causes unexplained sign-outs); once root-caused and fixed,
strip all `TEMPORARY` logging and restore the real timeout constants
before this can be committed alongside BR-ACC-03.
