# Active Progress — Cabio Sales OS
_Session: 2026-08-05_

## Current task — STOP HERE FIRST

**Issues 1 and 3 are shipped and verified on UAT by Basheer/Star Sales team.** A
Kanban pill/column centering bug found during that UAT smoke test is also fixed and
verified on UAT (below). **Issue 2 is fully decided, ready to build — next thing to
pick up.** The new product-lifecycle item is still discussion/design work awaiting
leadership follow-through.

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

**Issue 2 — Split participant picker / cross-SBU contribution — DECIDED 2026-08-05,
ready to build.** Full record in `docs/Discussion-SplitParticipant-SBU-Scope.md`
(v6). Three parts, all decided:
1. Split stays same-SBU-any-zone — swap the picker's `listUsers()` scope from
   `sbu_zone` to a same-SBU-any-zone scope. No backend change.
2. Referral credit — new `referred_by_user_id` on Opportunity, any SBU/zone
   (reuses the existing `scope="all"` picker), one-time, no revenue/visibility impact.
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

**Immediate next step (tomorrow):** plan and implement Issue 2 — same
explore-then-plan-then-build flow used for Issue 1. Product-lifecycle item stays
parked until its four open questions are answered.

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
