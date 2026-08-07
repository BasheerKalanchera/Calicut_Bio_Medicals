# Active Progress — Cabio Sales OS
_Session: 2026-08-05_

## Current task — STOP HERE FIRST

**2026-08-07 — Product Lifecycle (trade-ins, refurbished inventory, accessories) —
code-complete, not yet committed.** Full design in
`docs/Product-Lifecycle-TradeIns-Accessories-Technical-Design.md` (status: built).
Two-part build:
- **Part A — `ProductCatalogScreen.jsx` → `.tsx` MUI/React Query migration**
  (prerequisite, needed to add `product_type` without adding more Tailwind).
  `Frontend-Implementation-Standards.md` §9 and `check-no-tailwind.js` updated.
- **Part B — the feature itself:** `Product.product_type` +
  `OpportunityItem.line_type` columns, migration `0016` (applied to Dev, verified,
  `Physical-Schema.sql` regenerated), `BR-CAT-02` (new) + `BR-FIN-03` (amended) in
  `Business-Rules.md`, service-layer buyback validation, `OpportunityDetailScreen.tsx`'s
  Products tab rebuilt with 3 add-modes (Add Product / Add Accessory / Buyback).

**All automated checks green:** backend 435 tests passing (up from 428), backend lint
clean; frontend `tsc --noEmit` clean, `npm run lint` (incl. `check-no-tailwind.js`)
clean. **Not yet committed** — per standing instruction, commits only happen when
explicitly asked. **Immediate next step:** Basheer's manual E2E pass (both parts), then
commit — recommended as two separate commits (migration, then feature), matching
`Backlog.md`'s "split when risk profiles are genuinely separable" guidance.

**Side finding, not yet acted on:** regenerating `Physical-Schema.sql` from Dev (the
only environment with migration `0016`) revealed Dev is missing `rls_auto_enable()` —
an event trigger UAT has that auto-enables RLS on new tables, added out-of-band, not
present in the Alembic migration chain. Flagged to Basheer; not part of this build,
decision on whether/how to reconcile still open.

Multi-Zone Assignment (`docs/Multi-Zone-Assignment-Technical-Design.md`) remains queued
next after this — chosen to go second specifically because its core is an RLS/security
policy rewrite (High risk), unlike this feature's purely additive schema.

---

**Issues 1 and 3 are shipped and verified on UAT by Basheer/Star Sales team.** A
Kanban pill/column centering bug found during that UAT smoke test is also fixed and
verified on UAT (below). **2026-08-07 — `main` pushed to `uat` (fast-forward,
`ef9bc96`→`7a3c8d7`), including the Daily Activity Report and the tzdata fix; both
`origin/main` and `origin/uat` now at `7a3c8d7`.** Report confirmed visible and working
on UAT by Basheer (a brief post-deploy PWA/cache lag resolved itself). Issue 2 is fully
decided and is next up.

**2026-08-07 — new zone `Mangalore` added to Dev and UAT `zone` tables** (plain
lookup-table insert, same precedent as the `REPEAT_ORDER` rename — no schema/code
change). Reference docs synced to match: `CLAUDE.md`'s zone list, `docs/Seed-Data.sql`
(new row, id `...900000000005`), and a staleness note added to both
`docs/Opportunity-Access-Hierarchy-Technical-Design.md` and
`docs/Opportunity-Access-Hierarchy-Proposal.md` (both cited "4 zones" as supporting
context; not rewritten, just flagged, since they're dated decision records). Confirmed
first this wasn't the JV-partner-geography question flagged at the 2026-08-05
leadership meeting — Basheer confirmed it's a plain direct-sales zone, same model as
the existing 4.

**Issue 1 — Fast-track opportunity creation (REPEAT_ORDER) — DONE and on `uat`,
commit `32c94ad` (merged 2026-08-06, fast-forward from `main`).** New `REPEAT_ORDER`
lead-source value relaxes Demo Date/Expected Closure Date/Clinical Evaluation
(`BR-OP-13`); Order Value/Product Details stay required. All 4 opportunity create/edit
entry points brought to field parity (gate fields, Lead Source, and Hold/Lost/Won
status-gated fields — the last of these was a pre-existing gap in Project Detail's edit
modal, found and fixed during Basheer's manual verification, same root cause as the
rest). Full summary in `docs/Discussion-FastTrack-Opportunity-Creation.md`'s
"Implemented" note. Backend suite (405 tests), `tsc --noEmit`, lint (incl. Tailwind
guard) all green.
**2026-08-06 — renamed lead source `REORDER` → `REPEAT_ORDER`** (Star Sales team
feedback, ahead of the UAT push). Pure rename — `lead_source` is a plain lookup table
keyed by `id`, no CHECK/enum constraint, so this touched only the `name`/`description`
data and every string-literal comparison, not the schema. Shipped in the same commit
as Issue 1 (`32c94ad`) since it landed before that push to `uat`.
**DB state — both environments now have the `REPEAT_ORDER` row:**
- **Dev:** existing `REORDER` row renamed in place via `UPDATE`. Confirmed directly
  against the DB (`id=66666666-...-600000000010`, `name='REPEAT_ORDER'`).
- **UAT:** row inserted fresh (UAT never had the old `REORDER` row).
**UAT smoke test passed (Basheer, Star Sales team, 2026-08-06)** — Issue 1 + the
rename are fully proven out.

Opportunity cloning was considered and deliberately deferred as a separate follow-on —
logged to `docs/Backlog.md`, not part of this build.

**2026-08-06 — Kanban pill/column centering fix, commit `ef9bc96` (on `main` and
`uat`).** Found during the UAT smoke test above: clicking a stage pill on a laptop-
width screen (≥896px) scrolled the wrong column into view — worse the wider the
window, invisible on mobile. Root cause: `scrollToStage()` centered columns using
`offsetLeft`, which is relative to the nearest *positioned* ancestor, not necessarily
the scroll container — so it picked up `DemoApp`'s centered max-width layout margin
and overshot. Introduced in `9c88b28` (2026-07-31) when `scrollIntoView()` — immune to
this, since it isn't `offsetLeft`-based — was swapped for manual `scrollTo()` math to
fix a *different* bug (`scrollIntoView` silently no-op'ing on mobile Chrome). Fixed by
replacing the math with a shared `getBoundingClientRect()`-based helper (viewport-
relative geometry, immune to ancestor positioning), used for both the column and pill-
bar centering. Verified on Dev and UAT — laptop (all 6 stage pills) and mobile
(`Mobile-Demo.html`) both center correctly now.

**2026-08-06 — Daily Activity Report, commit `8fd7ff4` (on `main` only, not yet on
`uat`).** New cross-team screen (`GET /activities`) so a manager can see who logged
what activity on a given day without opening every account/opportunity individually —
Haroon's ask, immediate need, no open product questions unlike Issue 2. Checked
against the PRD first: no existing report matches this (closest is the aggregate
"Rep/Team Activity Levels" dashboard metric, not a browsable log). Access scoped via
the existing 6-tier role hierarchy (reused `organization/repository.py`'s
`UNRESTRICTED_ROLES`/`TEAM_SCOPE_BUILDERS`, promoted from private to shared) rather
than an Admin/GM-only allowlist — every role sees an appropriately-scoped slice (self,
direct reports, SBU+zone, SBU, or everyone). Full design in
`docs/Daily-Activity-Report-Technical-Design.md`. Backend 428 tests passing (23 new),
`tsc --noEmit`/lint clean. Manually verified on Dev, including a live-refresh gap
found during that verification: `LogActivityModal`/`CloseReminderModal` weren't
invalidating the report's query, so new activity needed a hard refresh to appear —
fixed, same commit. **Deliberately not pushed to `uat` yet** — Basheer wants to do
that tomorrow morning, not tonight.
**2026-08-06 (later) — tzdata Windows dependency fix, commit `7a3c8d7`.** Basheer hit
`ZoneInfoNotFoundError: 'No time zone found with key Asia/Kolkata'` starting the
backend locally — `zoneinfo` (added for this report's IST date handling) relies on
the OS's IANA tz database, which Windows doesn't ship, unlike Linux/Mac. My own
earlier verification missed this because it ran against an environment that happened
to have `tzdata` already installed globally, not a clean project `.venv` — worth
remembering: test dependency changes in a clean venv, not whatever's already on
hand. Added `tzdata>=2024.1; sys_platform == 'win32'` to `pyproject.toml`'s
dependencies — confirmed via `docs/Deployment-Topology.md` that this is a no-op on
UAT/Prod (Render, Linux), which already has its own tz database. Backend now starts
cleanly on Basheer's machine after `pip install -e ".[dev]"`.
**Considered and deferred, not decided against:** a date-range view (vs. today's
single-day-at-a-time). Backend's day range is already computed from a `[start, end)`
window internally, so extending to a real range later is a small, contained change,
not a rearchitecture — deferred until real usage shows Haroon actually wants it,
rather than speculatively building it now.

**Issue 2 — Split participant picker / cross-SBU contribution — DECIDED 2026-08-05,
partially shipped.** Full record in `docs/Discussion-SplitParticipant-SBU-Scope.md`
(v6). Three parts:
1. **Split stays same-SBU-any-zone — SHIPPED 2026-08-07.** Picker's
   `listUsers()` scope renamed `sbu_zone` → `sbu`, zone check dropped
   (`organization/repository.py`, `master_data.py`, `masterData.ts`,
   `OpportunityDetailScreen.tsx`'s Splits tab). Turned out to need a small
   backend change (new scope name), not zero as originally scoped. Backend
   tests updated and passing; `tsc --noEmit` clean. **Not yet committed.**
2. Referral credit — new `referred_by_user_id` on Opportunity, any SBU/zone
   (reuses the existing `scope="all"` picker), one-time, no revenue/visibility impact.
   **Still to build.**
3. Relationship-support activity — self-reported `Activity` logged against the
   Account with a structured `opportunity_id` link (`activity_type =
   RELATIONSHIP_SUPPORT`). Needs one new Postgres function
   (`cabio_app_opportunity_in_account`, modeled on the existing `cabio_app_has_split`)
   and a small `activity_tier_visibility` RLS amendment (`OR user_id =
   cabio_app_uid()`) — both confirmed directly against `Physical-Schema.sql`, not
   assumed.
**This is the next thing to build.**

**New — Product lifecycle: trade-ins, refurbished inventory, accessories.** Raised by
Haroon in the same conversation. Full design drafted in
`docs/Product-Lifecycle-TradeIns-Accessories-Technical-Design.md` and logged to
`docs/Backlog.md`. **Not yet implemented** — four items need a decision first: split
math over net (post-trade-in) value, GST/invoicing treatment of trade-ins (needs input
from whoever handles Cabio's invoicing), whether `BR-OP-01`'s gate flexibility should
extend to accessory/refurbished sales too, and `product_type`/`condition` naming.

**2026-08-07 (later) — Multi-zone user assignment, decided and unblocked.**
Trigger: Fazal (Area Manager, Imaging) needs to cover both North Kerala and
Mangalore; `user_profile.zone_id` is single-valued today, so this can't be
represented (stopgap in place: Fazal promoted to SBU Manager, a one-time
trick, not repeatable). Full design in
`docs/Multi-Zone-Assignment-Technical-Design.md`: new `user_zone` join table,
Area Manager RLS branch rewritten from scalar equality to set-membership
(flagged **High risk** — security policy rewrite, needs full six-tier manual
re-verification), two backend scope-builder rewrites, Target/Coverage
Planning gains `zone_id` (greenfield — neither has any implementation today).
All three §8 decisions now resolved, including the last one (territory
naming/reporting): Basheer's call was raw zone list, no named `territory`
entity — Fazal's case is isolated and his targets are already set/reported
per zone independently, not combined. One narrower question still open,
inside §7 not §8: `target_plan.zone_id` — `NOT NULL` or nullable — needs an
answer before the Target/Coverage Planning slice specifically starts.
**Ready to plan/build**, not yet started.

**Immediate next step:** two build-ready items are queued — Issue 2 (parts 2/3:
referral credit, relationship-support activity) and Multi-zone user assignment.
Ask Basheer which to plan first; use the same explore-then-plan-then-build flow
for whichever is picked. Product-lifecycle item stays parked until its four open
questions are answered.

**Immediately prior work (2026-08-05, earlier this session), resolved/shipped — full
detail in `docs/Progress-Archive-2026-08.md`'s 2026-08-05 entry:**
- `main` (`3c81e23` — BR-OP-12 Admin/GM SBU override + Add-Product focus-loss fix)
  merged and pushed to `uat`; both redeploys verified directly.
- Diagnosed and documented a PWA stale-cache issue (installed mobile app not picking up
  updates after login/logout). Fallback note added to
  `docs/PWA-UAT-MobileLaptop-Setup.md` (+ Malayalam translation); WhatsApp broadcast
  drafted for Basheer to send. **Basheer still needs to send that message** — not yet
  confirmed the wider team has refreshed. `.html`/`.pdf` renders of both setup docs are
  now stale vs. the `.md` source; not regenerated (his call whether needed).

## Also still open (unrelated, carried over)

The Critical Care/Imaging manager hierarchy build-out — see
`docs/Progress-Archive-2026-07.md`'s Phase 2E section for the confirmed plan. The
"create Supabase Auth accounts" blocker this was waiting on is resolved for Dev, but
this item concerns the UAT/Prod rollout more broadly — revisit once UAT is fully proven
out per the current task above.

**Deliberately left unconverted, not forgotten** (Basheer's explicit scope call, see
the `@mui/x-date-pickers` archive entry): 9 date-only `type="date"` fields in
`Customer360Screen.tsx`/`OpportunityDetailScreen.tsx`, and 2 more in
`ProjectDirectoryScreen.jsx` (entangled with that file's own pending MUI migration).
Pick up only if Basheer decides to extend scope.
