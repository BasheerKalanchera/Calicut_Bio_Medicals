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
