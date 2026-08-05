# Active Progress — Cabio Sales OS
_Session: 2026-08-05_

## Current task — STOP HERE FIRST

**UAT smoke testing is underway with the Cabio Star Sales team.** Issue 3 is shipped
and live on UAT. **Issue 1 is now implemented, uncommitted, pending two follow-ups
below.** Issues 2 and the new product-lifecycle item are still discussion/design work
awaiting leadership follow-through.

**Issue 1 — Fast-track opportunity creation (Reorder) — IMPLEMENTED 2026-08-05, not
yet committed.** New `Reorder` lead-source value relaxes Demo Date/Expected Closure
Date/Clinical Evaluation (`BR-OP-13`); Order Value/Product Details stay required.
Backend (`validators.py`/`service.py`/`repository.py`), all 4 frontend
create/edit entry points, `Business-Rules.md` (BR-OP-01 amendment + BR-OP-13), and
`Seed-Data.sql` (new `REORDER` row) all done — full summary in
`docs/Discussion-FastTrack-Opportunity-Creation.md`'s "Implemented" note. Backend
suite (405 tests), `tsc --noEmit`, and lint (incl. Tailwind guard) all green.
**Still outstanding:**
1. Changes are **uncommitted** — no commit/push has been made this session.
2. ~~`docs/Seed-Data.sql`'s new `REORDER` row hasn't been applied~~ — **applied to Dev
   2026-08-05 (Basheer).** UAT still needs it, but only once this code actually ships
   there — no rush before then.
3. No manual E2E verification yet — Dev is now unblocked for Basheer's pass (feature
   is usable end-to-end there); UAT verification follows once merged/deployed.

Opportunity cloning was considered and deliberately deferred as a separate follow-on —
logged to `docs/Backlog.md`, not part of this build.

**Issue 2 — Split participant picker / cross-SBU contribution.** Consolidated with
Haroon into `docs/Discussion-SplitParticipant-SBU-Scope.md` (now v5). **Confirmed:**
splits stay same-SBU-any-zone (contained UI fix — swap the picker's `listUsers()` scope,
no backend change); referral credit gets its own field (`referred_by_user_id`),
decoupled from splits. **Still open** — relationship-support activity (Section 3.3): a
self-reported Activity logged against the Account, optionally with a structured
Opportunity link. Three technical gaps need closing before it's buildable — the
RLS-gated `opportunity_exists()` write check, an account-scoped Opportunity picker, and
a likely read-back gap in `activity_tier_visibility` (see paper Section 5).

**New — Product lifecycle: trade-ins, refurbished inventory, accessories.** Raised by
Haroon in the same conversation. Full design drafted in
`docs/Product-Lifecycle-TradeIns-Accessories-Technical-Design.md` and logged to
`docs/Backlog.md`. **Not yet implemented** — four items need a decision first: split
math over net (post-trade-in) value, GST/invoicing treatment of trade-ins (needs input
from whoever handles Cabio's invoicing), whether `BR-OP-01`'s gate flexibility should
extend to accessory/refurbished sales too, and `product_type`/`condition` naming.

**Immediate next step:** none of the three threads above is actionable right now —
each is waiting on Basheer/Haroon/leadership to resolve its own open items. Pick back
up once any one of them lands.

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
