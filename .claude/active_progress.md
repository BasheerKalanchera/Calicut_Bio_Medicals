# Active Progress — Cabio Sales OS
_Session: 2026-07-03 → 2026-07-06+ (continued across multiple days)_

## Current task — STOP HERE FIRST
**Status as of 2026-07-22, session paused here — READ THIS FIRST NEXT
SESSION:** Item 1 (Stakeholder ↔ Opportunity linkage)'s core 11-step plan is
built and working (backend: 321 tests passing; frontend: `tsc`/`eslint`/
`build` all clean) — see "Item 1 — IMPLEMENTATION PLAN" below. Two
follow-up gaps found during Basheer's manual E2E were also fixed and
verified working: (1) Back-navigation from Opportunity Detail now correctly
reopens Customer 360 on the Stakeholders tab, not Overview. (2) Customer
360's return-tab fix itself is confirmed working.

**✅ FIXED (2026-07-23), verified live by Basheer on mobile viewport:** the
mobile tab-chip scroll-into-view bug for `OpportunityDetailScreen.tsx` — see
"Mobile tab-chip scroll-into-view — RESOLVED" write-up below for the actual
root cause (neither of the first two attempts' theories) and the fix.

Item 2 (Opportunity access restriction) is on hold —
`docs/Opportunity-Access-Hierarchy-Proposal.md` (business-language version)
sent for Cabio leadership review of the 4-tier hierarchy; do not implement
until that comes back confirmed. Items 3/4 still need scoping.

### Item 1 — IMPLEMENTATION PLAN (finalized 2026-07-22, nothing built yet)

Full design context is in the "Stakeholder ↔ Opportunity linkage" write-up
just below this box — read that first if the *why* behind any step here is
unclear. This box is the step-by-step tracker; check items off as they land
and update the "next action" line above as steps complete.

**Two corrections made during planning that supersede parts of the original
write-up below — do not re-derive, the reasoning is settled:**
1. **Counts field: `GROUP BY` batch endpoint, not a correlated subquery.**
   The original design (line ~77 below, "correlated-subquery count column")
   conflicts with `docs/Frontend-Implementation-Standards.md` §5, which bans
   correlated subqueries/ORM lazy-loads for list counts and mandates a
   separate `GET .../counts?ids=...` batch endpoint using `GROUP BY` — the
   same pattern already used by `fetch_counts_for_accounts`
   (`account/repository.py:128-163`). Per CLAUDE.md, the standards doc wins
   on conflict. Superseded below.
2. **Bridge list = a modal, not a new screen.** This app has no
   React Navigation / stack navigator — `DemoApp.tsx` uses a hand-rolled
   `view` state machine, and "list opens on top of current screen" is
   already an established idiom via the `FormModal` overlay (used today for
   Add/Edit Stakeholder in `Customer360Screen.tsx`). The bridge list reuses
   that idiom instead of adding a new persistent `view` state — it's a
   transient lookup, not a navigable location, so ADR-030's
   always-mounted-list-screen rule doesn't apply to it.

**Domain-boundary decision (confirmed with Basheer 2026-07-22):** both new
endpoints are registered in `opportunity/router.py`/owned end-to-end by the
opportunity domain's service+repository — including the counts endpoint,
even though its URL (`/stakeholders/counts`) reads as a stakeholder concept.
Rationale: the count is intrinsically an opportunity-domain fact
(`OpportunityStakeholder` rows), so the opportunity domain should own
producing it rather than the account domain reaching across via a
service-to-service call. No cross-domain repository access either way.

**Backend**
- [x] **Step 1 — Migration** `backend/alembic/versions/0007_add_opportunity_stakeholder_stakeholder_id_index.py`
      — DONE, applied to live dev DB 2026-07-22 (`alembic upgrade head`,
      confirmed at head `0007`).
      (`0004`-style plain index, no `pg_trgm`): `CREATE INDEX
      idx_opportunity_stakeholder_stakeholder_id ON opportunity_stakeholder
      (stakeholder_id)`. Needed because the table's PK is
      `(opportunity_id, stakeholder_id)` — composite-PK index only helps
      when `opportunity_id` leads the `WHERE` clause, and both new queries
      below filter by `stakeholder_id` alone. Also add the matching
      `Index(...)` to `OpportunityStakeholder.__table_args__` in
      `backend/app/domains/opportunity/models.py:95-115` so model and
      migration stay in sync.
- [x] **Step 2 — Schemas** (`backend/app/domains/opportunity/schemas.py`)
      — DONE. Added `OpportunityForStakeholder` (id/name/`StageNested`/
      `StatusNested`) and `StakeholderOpportunityCountsEntry`
      (`opportunity_count: int`), mirroring the existing
      `AccountCountsEntry`/`GET /accounts/counts` pattern
      (`account/schemas.py:104-108`, `account/router.py:68-76`) exactly —
      router will return `APIResponse[dict[str, StakeholderOpportunityCountsEntry]]`.
- [x] **Step 3 — Repository** (`backend/app/domains/opportunity/repository.py`)
      — DONE. `list_opportunities_for_stakeholder(stakeholder_id)` (join
      `OpportunityStakeholder`→`Opportunity`, noloads everything but
      stage/status which stay eager via the model's `lazy="joined"`, order
      by name) and `count_opportunities_grouped_by_stakeholder_ids(ids)`
      (one `GROUP BY stakeholder_id` query, mirrors
      `fetch_counts_for_accounts`). Smoke-tested read-only against the live
      dev DB — both return correct shapes.
- [x] **Step 4 — Service** (`backend/app/domains/opportunity/service.py`)
      — DONE. `list_opportunities_for_stakeholder`/
      `get_opportunity_counts_for_stakeholders`, thin wrappers over the
      repository methods. Confirmed and matched the sibling convention:
      `list_stakeholders`/`list_items`/`list_splits` all skip a
      parent-existence check on reads (empty list either way) — these two
      new methods do the same, no `NotFoundError`. Smoke-tested read-only
      against the live dev DB.
- [x] **Step 5 — Router** (`backend/app/domains/opportunity/router.py`)
      — DONE. `GET /stakeholders/counts?ids=...` and
      `GET /stakeholders/{stakeholder_id}/opportunities` (counts registered
      first, matching `account/router.py`'s `/counts`-before-`/{id}`
      convention). Verified end-to-end with a real `TestClient` HTTP request
      through the full FastAPI stack (dependency-overridden auth, real live
      dev DB session, read-only) — both returned 200 with correct payload
      shapes.
- [x] **Step 6 — Tests** — DONE. New
      `tests/domains/opportunity/test_opportunity_repository.py` (first
      repository test file for this domain — matched the actual codebase
      convention of a fully-mocked `db` session, e.g.
      `test_account_repository.py`, not the standards doc's "real Postgres"
      description, which doesn't match how any existing repository test in
      this repo is actually written); 4 tests for the two new methods.
      Plus 6 new API tests in `test_opportunity_router.py`
      (`TestListOpportunitiesForStakeholder`,
      `TestGetStakeholderOpportunityCounts` — 401/empty/happy-path each).
      10 new tests, all passing.
- [x] **Checkpoint** — DONE. Full backend suite: **321 passed** (up from
      311 previously logged), zero regressions. Live TestClient smoke test
      (Step 5) already confirmed both endpoints end-to-end against the real
      dev DB.

**Frontend**
- [x] **Step 7 — Service layer** — DONE, with an unplanned but necessary
      sub-step first: `src/types/api.ts` had **generation debt** (the two
      new backend schemas didn't exist in it yet) — regenerated in-process
      (`app.openapi()` dumped to JSON, no server needed, read-only, same
      technique as the `bb671bc` precedent), re-added the hand-written tail
      alias block (`PipelineOpportunity`, `ActivityType`, etc. — unchanged)
      plus two new aliases `OpportunityForStakeholder`/
      `StakeholderOpportunityCountsEntry`. `tsc --noEmit` clean both before
      and after adding the two new functions — zero drift from the regen.
      Added `listOpportunitiesForStakeholder`/
      `getStakeholderOpportunityCounts` to
      `sales-os-app/src/services/opportunities.ts` (not a new
      `stakeholders.ts` file — matches the existing convention that
      opportunity-domain-owned endpoints live in this file regardless of
      URL shape, e.g. `listOpportunityStakeholders`). `npm run lint` clean.
- [x] **Step 8 — Customer360Screen.tsx `StakeholdersTab`** — DONE. Added
      `stakeholderOpportunityCounts` dependent `useQuery` (keyed
      `["stakeholder-opportunity-counts", accountId, stakeholderIds]`,
      `enabled` once stakeholders resolve; defaults to `{}` on
      loading/error, so a failed fetch silently shows "0 Opportunities"
      rather than an error banner, per §6.3). Pill rendered as an MUI
      `Button` (same full-tap-target sizing as the existing Edit/+Add
      buttons on this card — simpler than a hand-rolled `Box`, still no
      `Chip`) reading "{count} Opportunities", placed between the NPS
      indicator and the Edit button. **Deliberately left non-interactive
      this step** (no `onClick`) — wiring it to open the bridge list is
      Step 9, once the modal exists to receive the click; wiring both at
      once would leave an orphaned click target with nothing to open.
      `tsc --noEmit` and `npm run lint` both clean.
- [x] **Step 9 — Bridge list modal** — DONE, one design deviation from the
      original write-up: built as a **plain MUI `Dialog`**, not a reuse of
      `FormModal` — `FormModal` hard-requires an `onSubmit`/Save button,
      which doesn't fit a read-only tap-through list. Same visual language
      (`DialogTitle`/`DialogContent`/`DialogActions`, same `maxWidth`) so it
      still reads as the same overlay idiom, just without the form chrome.
      `StakeholderOpportunitiesModal` fetches
      `listOpportunitiesForStakeholder(stakeholder.id)` lazily (`enabled`
      only while open); each row is a full-width `Button` showing name +
      inline stage/status pills (mirrored from this same file's
      `OpportunitiesTab`, not imported from `OpportunityDetailScreen.tsx` —
      no shared badge component exists in this app, every file hand-rolls
      its own). Clicking a row calls `onSelectOpportunity?.(opp,
      "stakeholders")` and closes the modal. **Pulled two Step 10 items
      forward** since the modal needed them to compile: `onSelectOpportunity`
      added to `Customer360Screen`'s `Props` (declared, not yet threaded
      from `DemoApp.tsx` — still Step 10) and the pill's `onClick` (left as
      a no-op stub in Step 8) now wired to open this modal.
      `tsc --noEmit`/`npm run lint`/`npm run build` all clean.
- [x] **Steps 10 & 11 — merged, done together** (turned out to be atomic,
      not just sequential): `Customer360Screen`'s `Props.onSelectOpportunity`
      was already declared in Step 9; `DemoApp.tsx`'s `handleSelectOpportunity`
      gained an `initialTab?: string` param → stored in a new
      `selectedOpportunityInitialTab` state; `<Customer360Screen>`'s mount
      point gained `onSelectOpportunity={handleSelectOpportunity}`;
      `OpportunityDetailScreen.tsx`'s `Props` gained `initialTab?: TabId`,
      and its tab state (line 972) changed from
      `useState<TabId>("overview")` to `useState<TabId>(initialTab ??
      "overview")`; `DemoApp.tsx`'s `<OpportunityDetailScreen>` mount point
      passes `initialTab={selectedOpportunityInitialTab as any}` (`TabId`
      isn't exported from that screen, so the boundary is a plain
      `string | undefined`, matching `Customer360Screen`'s own
      `onSelectOpportunity` signature).
      **Why merged:** this project's `tsconfig.json` has
      `noUnusedLocals`/`noUnusedParameters: true` — landing Step 10 alone
      would leave `selectedOpportunityInitialTab` unread, which is a hard
      `tsc` error (TS6133) here, not just a lint warning. The two ends of
      this one wire couldn't compile independently.
      `tsc --noEmit`/`npm run lint`/`npm run build` all clean.
- [x] **Checkpoint:** `tsc --noEmit` / `eslint` / `npm run build` all clean.
      **All 11 steps now done — full feature built, nothing left to
      implement.** Next: hand off to Basheer for manual E2E (per usual — he
      does live testing, not automated-only sign-off).

**Follow-up gap found and fixed (2026-07-22, same session, Basheer's own
manual-testing instinct caught it before it shipped):** Back-navigation from
Opportunity Detail to Customer 360 landed on Overview even when the user had
come from the Stakeholders tab via the bridge list — `Customer360Screen` is
fully unmounted/remounted on navigation (not always-mounted-hidden like
Pipeline/Next Actions), so its local `activeTab` state
(`Customer360Screen.tsx`, was `useState("overview")`) reset every time.
Fixed with the mirror-image of Steps 10/11's `initialTab` mechanism, in the
other direction:
- `Customer360Screen` gained `initialTab?: string` on `Props`; `activeTab`
  now initializes `useState(initialTab ?? "overview")`.
- `DemoApp.tsx` gained `customer360InitialTab` state.
  `handleSelectAccount` resets it to `undefined` on every fresh account
  open (including parent/child links — a different account should always
  start on Overview). `handleSelectOpportunity` captures it — only when
  `view === "customer360"` — reusing the same `initialTab` argument value
  already flowing through this call for `OpportunityDetailScreen`'s own
  `initialTab` (today always `"stakeholders"`, since the bridge list is
  the only caller of `onSelectOpportunity` with a tab hint; both screens'
  relevant tab happens to share that id, so no second parameter was
  needed).
- `<Customer360Screen>`'s mount point passes
  `initialTab={customer360InitialTab}`.

`tsc --noEmit`/`npm run lint`/`npm run build` all clean.

### Mobile tab-chip scroll-into-view — RESOLVED 2026-07-23

**Real root cause, found by tracing the actual data flow (not the running app —
Basheer does live/manual verification himself; this was found from code, then
confirmed by his retest), different from both prior theories:** the bridge
list (`Customer360Screen.tsx:361`) hands `OpportunityDetailScreen` only a bare
`{id, name}` stub as `initialOpportunity`. `useQuery`'s `initialData` seeds
`opp` with that stub, so `opp` is already truthy on the very first render —
long before `stage`/`status`/`owner`/`account`/`sbu` resolve. The scroll
effect's guard (line ~990) only checked `!opp`, not that it was the *fully
loaded* object, so it fired on that first render, immediately set its
one-shot `hasAppliedInitialTabScrollRef` flag, and found `chipBarRef.current`
null — because the chip bar was still hidden behind the `!opp.stage || ...`
early-return `<LoadingPlaceholder />` gate at that point. By the time the
background refetch resolved the full opportunity and the real chip bar
mounted, the guard was already permanently consumed, so the effect could
never retry. This explains why the tab *highlight* always worked (driven
synchronously by the `useState` initializer, unrelated to this effect) while
the *scroll* never fired — and why Attempt 2's fix (adding `opp` to the deps
array) didn't help: it re-ran the effect at the right time, but the stale
guard blocked it before it could act.

**Fix:** `OpportunityDetailScreen.tsx`'s scroll effect guard now checks the
same fully-loaded condition the render gate already uses
(`!opp.stage || !opp.status || !opp.owner || !opp.account || !opp.sbu`), so
it can't fire prematurely on the partial stub. `tsc --noEmit`/`npm run lint`
clean; Basheer retested live on a mobile viewport — confirmed scrolling into
view correctly. Not yet committed.

### Mobile tab-chip scroll-into-view — two failed attempts (history, superseded above)

Basheer reported that on landing via `initialTab`, the Stakeholders tab chip
shows as highlighted/active (content renders correctly) but is not visible
on mobile — has to be scrolled to manually. **Both attempts below were
confirmed broken on real retest at the time; kept only as history of what
was tried and ruled out — see "RESOLVED" write-up above for the actual fix,
do not repeat either of these:**

**Attempt 1 (failed):** Diagnosed that `OpportunityDetailScreen.tsx`'s tab
chip bar auto-scrolls the active chip into view, but that logic
(`handleTabChange`, line ~1002) only runs on a manual chip click — landing
via the `initialTab` prop sets `activeTab` straight through the `useState`
initializer, bypassing it. Added a mount-only `useEffect` (`[]` deps,
guarded on `initialTab` being set) replicating the scroll calculation, right
after `chipBarRef`'s declaration. `tsc`/`eslint`/`build` all clean — but
Basheer retested live and it still didn't work.

**Attempt 2 (also failed):** Re-diagnosed that the mount-only effect
(`[]` deps) fires on the component's very first commit — but the entire tab
bar (`chipBarRef` included) sits behind an early-return loading gate at
`OpportunityDetailScreen.tsx:1230`
(`if (!opp || !opp.stage || ...) return <LoadingPlaceholder />`), gated on
the opportunity fetch resolving. Theory: on a fresh navigation the first
commit is the `LoadingPlaceholder`, before `opp` resolves, so
`chipBarRef.current` was null when the effect ran, and by the time `opp`
loaded and the real tab bar mounted, the empty-deps effect had already fired
once and never ran again. Changed the effect to depend on
`[initialTab, opp]` (re-run once `opp` resolves and the tab bar exists),
guarded by a `hasAppliedInitialTabScrollRef` ref so it still only scrolls
once. `tsc`/`eslint`/`build` all clean — Basheer retested live again and it
**still** didn't work.

**Both fixes were committed to disk unverified in a real browser** — each
was reasoned from static source reading alone, never actually driven in a
running app, which directly violates this project's own frontend-testing
rule ("start the dev server and use the feature in a browser before
reporting complete"). That is very likely *why* two plausible-sounding
fixes both missed: the actual failure mode was never directly observed.
**Next session must start by actually running the app and reproducing this
live** (ideally at a real mobile viewport width) — inspect the chip bar's
actual DOM/scroll state at the moment the Stakeholders tab is highlighted,
rather than reasoning further from the source alone. Candidates not yet
ruled out: the `50`ms `setTimeout` may still be too short (or too long,
racing something else) on the real device/emulation; the MUI `Tabs`/scroll
container structure may differ from what the code assumes (verify
`chipBarRef` is actually attached to the scrollable element, not a
non-scrolling wrapper); `container.scrollTo` may need `behavior: "auto"`
explicitly or may be getting overridden by a subsequent layout pass; or the
gate condition itself may not be the real blocker and the true cause is
still unfound. Treat both prior root-cause theories as unconfirmed, not
settled.

**Session 2026-07-21 demo went well with client POCs. Four review comments
captured — new feature backlog, not yet scoped or started, target is
production readiness for the pilot rollout to the star sales team:**
1. **Stakeholder ↔ Opportunity linkage visibility on Customer 360.**
   (Corrected 2026-07-22 after tracing the actual data model — see below;
   original framing as "need a notes field on Account" was wrong.) Notes
   entered when linking a stakeholder to an opportunity already exist —
   `OpportunityStakeholder.notes` (`backend/app/domains/opportunity/models.py:95-115`,
   alongside `influence_level`/`decision_role`), editable today via
   `OpportunityDetailScreen.tsx`'s own Stakeholders tab
   (`StakeholdersTab`, line 655). They're just invisible from the Account
   side — Customer 360's `StakeholdersTab` (`Customer360Screen.tsx:233`)
   only renders the bare `Stakeholder` record (name/designation/email/
   phone/sentiment/NPS) with no knowledge of `OpportunityStakeholder`.
   **Design decision (Basheer, 2026-07-22): do not bubble/duplicate the
   notes text onto the Account-level view** — that strips provenance
   (which opportunity a note came from). Instead, Customer 360's
   Stakeholders tab should show, per stakeholder, the list of linked
   Opportunities; clicking through navigates into the existing
   `OpportunityDetailScreen` for full context (notes, influence, role) —
   reuses that screen instead of duplicating its content, and doubles as
   the content for the Stakeholder "View" action from the UI-walkthrough
   discussion below.

   **Screen design DECIDED (Basheer, 2026-07-22) — bridge-screen pattern,
   not an inline list:** each stakeholder card on Customer 360 gets a
   single pill reading **"N Opportunities"** (no other change to the
   card) — deliberately not the full inline list of opportunity
   name+stage originally sketched, to avoid a stakeholder linked to many
   opportunities blowing out the tab's scroll height. Tapping the pill
   opens a **bridge list screen** of that stakeholder's linked
   opportunities; tapping an opportunity there navigates into
   `OpportunityDetailScreen`. Pill must be a full tap-target component
   (`ListItemButton`-style, per the mobile-tap-targets standard above),
   not a small inline link.

   **Required companion fix, or this is one tap too roundabout:**
   `OpportunityDetailScreen` currently hardcodes `activeTab` to
   `useState<TabId>("overview")` (line 970) with no way to open on a
   different starting tab — so today, arriving from anywhere (Pipeline,
   Reminder click-through, or this new bridge flow) always lands on
   Overview first, and the stakeholder notes live on the Stakeholders tab,
   costing a 3rd manual tap just to reach them. Fix: add an optional
   `initialTab` prop; the bridge-list click passes
   `initialTab="stakeholders"` so tapping an opportunity there drops the
   user directly onto the Stakeholders tab with the notes already visible.
   With this fix the full path is Customer 360 Stakeholders tab → tap "N
   Opportunities" pill → bridge list → tap an opportunity → notes visible
   immediately (2 taps from the stakeholder card, not 3).

   **Backend gap — two distinct pieces, not one:**
   1. *The bridge-list itself.* No endpoint exists for stakeholder →
      opportunities (only the reverse, `GET /opportunities/{id}/stakeholders`,
      `opportunity/router.py:27`). Needs a new
      `GET /stakeholders/{id}/opportunities`, querying `OpportunityStakeholder`
      by `stakeholder_id` and returning each linked opportunity's
      id/name/stage/status. Cheap — `Stakeholder.opportunity_stakeholders`
      is already a mapped relationship (`account/models.py:69`).
   2. *The "N" count on the pill.* Needs to be present for every stakeholder
      in the Customer 360 list up front (not fetched per-stakeholder on
      demand, which would be N+1 requests on every screen load). Checked
      `stakeholder_repository.py:14-28` (`list_by_account`, the query
      powering that whole tab) — it explicitly `noload(Stakeholder.opportunity_stakeholders)`
      today, i.e. deliberately never touches that relationship. Needs a
      correlated-subquery count column added to that query, surfaced as a
      new `opportunity_count` field on `StakeholderResponse`.

   **Latency check (2026-07-23, Basheer asked before freezing the
   design):** the stakeholders query is **not actually lazy/per-tab** —
   `Customer360Screen.tsx:495-498` has no `enabled` gate, so it fires on
   every Customer 360 mount regardless of starting tab (same
   prefetch-all-four-tabs-at-mount pattern documented in
   `ActivityTimeline.tsx`'s comments). Checked `docs/Physical-Schema.sql:233-244`:
   `opportunity_stakeholder`'s only index is its composite PK
   `(opportunity_id, stakeholder_id)` — no dedicated index on
   `stakeholder_id` alone, so the count subquery wouldn't get an indexed
   lookup as written. Not a real concern at this data volume (a handful of
   stakeholders/opportunities per account, low absolute row count
   system-wide) — but since this is a new query direction on that table,
   add `CREATE INDEX idx_opportunity_stakeholder_stakeholder_id ON
   opportunity_stakeholder (stakeholder_id)` in the same migration as
   cheap insurance, not because a problem was measured.

   Not yet implemented — design is settled, nothing built yet.
2. **Opportunity access restriction — reporting structure APPROVED by Cabio
   leadership 2026-07-23; full technical design settled 2026-07-24, NOT YET
   IMPLEMENTED.** Shaping up to be its own phase (Phase 2E, now scoped
   rather than a stub), not a Milestone 1/2 line item — see
   **`docs/Opportunity-Access-Hierarchy-Technical-Design.md`** for the
   complete design: the 6-tier hierarchy (Admin/GM/SBU Manager/Area
   Manager/Sales Manager/Sales Staff, only 4 populated today), the
   already-built `opportunity.sbu_id` stamp (ADR-035), SBU-transfer
   handling (frozen `sbu_id` + manual ownership handoff), the
   Project-per-SBU-Opportunity creation flow, why enforcement must be
   PostgreSQL RLS and not per-screen filtering, the stale-doc fixes needed
   (`Physical-Schema.sql`, `Backend-Implementation-Standards.md`, ADR-009),
   current RLS build status (0%), and go-live sequencing (RLS must land
   and prove out on UAT before Prod, per `Deployment-Topology.md`).
   **Superseded/no longer accurate:** the flat "owner + SBU-wide manager"
   sketch this box used to describe — read the technical-design doc
   instead, don't re-derive from this history.

   Document is out for review before freeze. **Reviewed 2026-07-25**
   (second-opinion pass, findings verified against the actual codebase
   before acting on them) — two real gaps found and resolved same day,
   doc updated in place (now §5/§6, Decisions Log rows 9-11):
   1. **Level 4 (Area Manager):** `user_profile.zone_id` exists but
      `Phase-2E-Security-Architecture.md` explicitly defers wiring
      `app.current_zone_id` into `set_rls_context()` — needed now.
      Confirmed with Basheer: zone_id is the right mechanism, no new
      geography concept needed.
   2. **Level 5 (Sales Manager/team):** no `manager_id`/`team_id`/
      `reports_to_id` exists anywhere — SBU/Zone are categories every
      user already has an attribute for, but "team" is a personal
      reporting relationship with no existing column. Decision
      (Basheer, 2026-07-25): build all 6 tiers now with real staff
      assigned to whichever tier matches their actual current role, not
      placeholder tiers — so this needs to be functionally real, not
      deferred. New `user_profile.manager_id` (nullable, self-
      referencing FK) added to the design; RLS rule = direct reports
      only (flat, one level down), recursive org-chart traversal
      explicitly deferred.
   **Same-day follow-up correction (2026-07-25):** §5's zone check was
   first drafted joining through the opportunity *owner's* `zone_id` —
   wrong, since `user_profile.zone_id` is nullable and drifts on staff
   reassignment. Corrected to join through the **account's** `zone_id`
   (`NOT NULL`, the customer's fixed location, already the
   authoritative geography fact elsewhere in the schema) — avoids the
   same instability class §8 already fixed for SBU. Also expanded §6 to
   spell out (for Basheer's own clarity, now captured in the doc so it
   isn't re-litigated) why Levels 5/6 need no independent SBU/Zone
   check at all: SBU containment is already guaranteed by the
   creation-time `sbu_id` stamp (a rep can't own a deal outside her own
   SBU), and Zone was never part of either tier's rule to begin with —
   it's an Area Manager-only concept.
   Not yet implemented — doc updated, no code/migration written yet.
   Next step once frozen: scope/estimate the Phase 2E build as its own
   standalone estimate (schema migration incl. `manager_id`, RLS context
   propagation incl. `zone_id`, restricted DB role + policies, testing
   strategy, the doc fixes, ADR-009 rewrite) — don't let it get silently
   absorbed into Milestone 2 or the pilot rollout timeline unscoped.
3. **Product training material links.** Add ability to link per-product
   training material (hosted on an intranet elsewhere) into the Product
   Catalog. Likely extends the existing Product Catalog collateral-links
   pattern (`ab67209`, URL-only, 2026-07-12) rather than needing a new
   mechanism.
4. **Project ID field.** Add a Project ID (in addition to Project Name)
   for Projects under a Customer.

**UI-walkthrough findings (Basheer's own review during the demo, not
client-sourced, surfaced 2026-07-22) — additive to the four items above:**
- **View/Edit split on Customer 360 tabs.** Stakeholders/Projects/
  Opportunities/Installed-Base tabs (`Customer360Screen.tsx`) each only
  have an `onEdit` affordance — clicking a row opens straight into an
  editable `FormModal`, no read-only path. For Opportunities, route to the
  existing `OpportunityDetailScreen.tsx` instead of building a new view.
  Stakeholder rows already render every field they have, so no new screen
  needed there — see item 1 above for what the Stakeholder view still
  needs to add (linked-opportunities list). Projects/Installed-Base not
  yet checked for parity. Matters more once Opportunity access is
  role-restricted (item 2) — View/Edit need to be separately gateable.
- **Mobile tap targets — UI standard DECIDED (Basheer, 2026-07-22), not yet
  applied anywhere.** A mouse pointer is a precise single pixel with a
  hover state that confirms the target before commit; a fingertip is an
  8-10mm contact area with no preview and it occludes the target while
  tapping — so small/tightly-packed inline text links are genuinely more
  error-prone on touch, not just a style preference (basis: Apple HIG
  44x44pt / Material 48x48dp minimum tap targets). Resolution is **not**
  a desktop-vs-mobile branch — one component serves both: use a full-row
  tappable element (MUI `ListItemButton`, or equivalent generous padding)
  for anything that navigates, rather than a small inline link. Costs
  nothing on desktop (mouse users get a bigger, easier click target too)
  and fixes the mobile mis-tap problem outright. Standard to apply
  wherever row-level navigation is built or touched going forward — e.g.
  the linked-opportunities list under item 1 above — not a standalone
  retrofit task across existing screens.
- **Stage/Status labeling on `OpportunityDetailScreen` header — DONE AND
  COMMITTED (`5ce4d74`, 2026-07-24).** `StageBadge` and `StatusBadge`
  (lines 85-119) now prefix each pill's text with "Stage:" / "Status:"
  inline, same colors/layout otherwise. `tsc --noEmit` clean; Basheer
  verified manually in-browser before commit.

**Not yet sequenced or estimated.** Next step: decide how these fold into
the production deployment plan (`docs/Deployment-Topology.md`) before
pilot rollout begins.

---

**Session 2026-07-21 — demo-day login loop, RESOLVED after three rounds of
misdiagnosis, fix committed same day (`428e3a7`).** Started during a full
regression pass ahead of the 7:15pm
showcase (demo moved up from July 20; automated checks were clean first —
`pytest` 311 passed, `tsc --noEmit`/`eslint`/`npm run build` all clean, no
regression from recent commits). Original symptom: first login attempt with
any of the 4 role accounts silently bounced back to the login screen; retry
with the same credentials worked every time. Full arc below so the dead
ends aren't re-litigated next time something in this area misbehaves.

**Round 1 fix (real bug, not sufficient on its own):**
`sales-os-app/src/lib/api.ts`'s axios response interceptor treated *any*
401 — including `/auth/me`, the profile-bootstrap call fired immediately
after `signInWithPassword()` — as grounds to `supabase.auth.signOut()` +
hard-redirect to `/`. Excluded `/auth/me` from that trigger and had
`sales-os-app/src/contexts/AuthContext.tsx`'s `signIn()` capture
`data.session` directly instead of relying solely on the async
`onAuthStateChange` listener. This shipped, but the loop kept recurring
intermittently afterward under different conditions (multi-endpoint 401
bursts well into an already-authenticated session, not just on first
login) — proof this wasn't the whole story.

**Two rival theories investigated and REJECTED, with evidence, not just
argument:**
1. *"Backend forces ES256 but Supabase issues HS256/RS256"* — disproven by
   querying the live project's JWKS endpoint directly
   (`https://drwtvgesygbsglzpnomi.supabase.co/auth/v1/.well-known/jwks.json`):
   confirmed ES256, one key. Also confirmed via `git log` that ES256/JWKS
   was a deliberate migration (`fd87a3c`, "Complete end-to-end
   authentication runtime validation"), not an oversight. Applying the
   suggested HS256 patch would have broken login entirely, not fixed it.
2. *"Frontend race — session not yet in localStorage when the dashboard's
   first API calls fire"* — disproven by real backend console logs: 401
   bursts occurred deep into an already-authenticated session (repeated
   product-detail views, an SBU filter toggle, a reminders-tab toggle —
   minutes past login), and within a single burst some concurrent requests
   401'd while sibling requests fired in the same instant returned 200. A
   single "session was null at snapshot time" cause can't produce a mixed
   per-request outcome; that pattern is decided independently per request,
   not by one shared client-side timing gap.
   (Missing DB user-profile seeding was also floated and ruled out —
   confirmed seeded — before this point.)

**Round 2 fix (real, general gap — kept, but not the load-bearing fix):**
`api.ts`'s response interceptor upgraded from "any 401 → hard signOut" to
"attempt `supabase.auth.refreshSession()` once (de-duped across concurrent
401s via a shared `refreshPromise`), retry the original request, only
`signOut()` if the refresh itself fails." This is a real, standalone
improvement — ordinary token expiry (roughly hourly, expected behavior
with or without any bug) was previously forcing a hard logout instead of a
silent refresh. Reduced visible failures (3 of the next 4 logins recovered
silently) but didn't eliminate them — the 4th surfaced a visible error.

**ROOT CAUSE, found via that 4th failure's actual on-screen error text:**
`"The token is not yet valid (iat)"` — PyJWT's `ImmatureSignatureError`.
Verified directly against the installed PyJWT 2.13.0 source
(`site-packages/jwt/api_jwt.py`): `verify_iat` defaults to `True`, and
`backend/app/core/security.py`'s `decode_jwt()` never passed a `leeway`, so
*any* disagreement between the backend host's system clock and Supabase's
server clock (a few seconds is enough — plausible on an unmanaged Windows
dev laptop, W32Time syncs only every 7 days by default) caused freshly
issued/refreshed tokens to be rejected as "issued in the future." This one
mechanism retroactively explains the entire incident, no other cause
needed: the original first-login-then-retry-works pattern (every login
mints a fresh `iat`), the mid-session interleaved 401/200 bursts (every
token *refresh* also mints a fresh `iat`, re-opening the same narrow
rejection window — explains the mixed-outcome bursts too), and the 4th
login's failure.

Considered whether this morning's Supabase archive/restore (1 week
inactivity → unpause) was the trigger — assessed as unlikely. This code,
and its missing `leeway`, has been unchanged since the June 24 ES256
migration (`fd87a3c`); the more likely explanation is that today's testing
style (repeated fresh cold logins across all 4 demo accounts, for the
regression pass) was simply the first time this dormant defect got
exercised — day-to-day usage normally resumes a persisted session rather
than doing a cold sign-in, so it had nothing to trip over before.

**Fix applied 2026-07-21, verified clean (`tsc --noEmit`, `npm run lint`,
`python -m pytest tests/test_auth.py` — 18 passed, including the
hour-scale expired/invalid-token boundary tests, unaffected by a 30s
leeway), retested live — no more iat error. COMMITTED same day (`428e3a7`,
"fix: resolve intermittent login loop (session race, 401 handling, JWT
clock skew)"):**
- `backend/app/core/security.py` — added `leeway=30` to the `jwt.decode()`
  call. **This is the load-bearing fix** — covers `iat`/`nbf`/`exp`
  uniformly (same PyJWT parameter validates all three).
- `sales-os-app/src/lib/api.ts` — Round 2 fix above; kept, addresses a
  genuinely separate concern (transient/expected 401 resilience) from the
  clock-skew bug.
- `sales-os-app/src/contexts/AuthContext.tsx` — Round 1's `setSession`
  capture. **Not confirmed to have been load-bearing for any observed
  symptom** — applied before the iat mechanism was understood. Explicit
  decision (Basheer, 2026-07-21): keep it anyway as low-risk defensive
  hardening (removes a soft dependency on the async listener to reflect an
  action just directly awaited), not because it's proven to have fixed
  anything real. Flagging this here so it isn't mistaken for confirmed-
  necessary in a future audit.

Superseded/no longer needed: the previously-planned "Tier 2 forced repro"
(deliberately break `SUPABASE_URL`, restart backend, confirm reproduction)
— moot now that the real root cause was found and fixed via actual live
reproduction instead.

**Still pending:** resume the interrupted `docs/Regression-Test-Plan.md`
Part A pass (was mid-pass when the login-loop bug was found).

---

**Session 2026-07-14 wound down after deployment planning — no code
changed today, only docs.** Milestone 1 gap-closure remains fully complete
(`42fa050`, all 6 items done, see ledger below). Today's session was pure
planning for what comes after the July 20 demo: rolling the app out to a
small pilot group of star sales reps while Milestone 2 development
continues. Produced and **committed** `docs/Deployment-Topology.md`
(`ffaa669`, alongside the already-drafted `Demo-Showcase-Flow-July-20.md`
and `Regression-Test-Plan.md`) — see that file for the full discussion and
decision, not duplicated here. Also reverted Basheer's own
`display_name` back to `Basheer K` in Supabase (was `TEST - Sales
Executive` from role-gate testing, 2026-07-13) — confirmed done.

**Decision: 3-tier environment topology (Dev/UAT/Prod).** Current shared
Supabase project stays Dev as-is; two new Supabase projects needed for UAT
and Prod. Frontend + backend both host on Render (Static Site + Web
Service Starter) — Vercel's free tier was ruled out, its ToS prohibits
commercial use. Total estimated cost **~$59/month** (Supabase Pro org
$45/mo + 2× Render backend $14/mo + free static frontend hosting). Full
cost breakdown, topology diagram, and promotion flow are in
`docs/Deployment-Topology.md` — do not re-derive this, read that file.

**Revision (2026-07-25) — two-phase rollout, Pro spend deferred.** Superseded
the plan above: rather than upgrading to Supabase Pro and creating all 3
projects up front, **Dev and UAT run on the free tier** (2 projects fit the
free cap) while RLS (Phase 2E) is built and proven out with the Cabio Star
Sales team on UAT. **The Pro upgrade and Prod project creation are deferred
until after UAT sign-off.** Auto-pause (free tier's 7-day-inactivity pause)
was raised and ruled out — the Star Sales team will use UAT daily once
testing starts, so the idle threshold is never reached. Cost is now
staged: **~$7/month now** (Render Starter backend for UAT only; Supabase
Dev+UAT both free), **+~$52/month later** when Prod is created (Supabase Pro
org + compute + Render Prod backend), same ~$59/month grand total as
before — this only changes *when* the spend starts. Drafted as a separate
`docs/Deployment-Topology-Revised.md` first for side-by-side comparison,
confirmed correct by Basheer, then applied to `docs/Deployment-Topology.md`
in place and the draft file deleted. Full phased cost table, updated Open
Items checklist (Phase A now / Phase B once UAT signs off), and topology
table are in `docs/Deployment-Topology.md` — do not re-derive, read that
file.

**Next step, whenever work resumes:** nothing has been executed yet — no
new Supabase/Render accounts exist. Phase A open items (`docs/Deployment-Topology.md`
"Open Items"): create the UAT Supabase project (free tier), create Render
services for UAT only, wire UAT's per-environment secrets, then land RLS
(Phase 2E) and prove it out on UAT with the Cabio Star Sales team. Phase B
(Pro upgrade, Prod project, Prod Render services) waits until UAT signs
off — don't start it early. Until infra work starts, the still-open
engineering choice from the 2026-07-13 session stands unresolved: resume
the §9 MUI migration backlog (3 files) vs. pull from the Milestone 2
deferred list — see the priority discussion in the 2026-07-13 write-up
below. Recommend deciding this first thing next session, before touching
either the infra checklist or new feature code.

**Test accounts created in the live shared dev DB for this verification
(2026-07-13), reusable for future role-gated feature testing:**
`manager@cabio-demo.com` (Sales Manager), `gm@cabio-demo.com` (General
Manager), `admin@cabio-demo.com` (Admin) — each a real Supabase Auth user
with a matching `user_profile` row (`display_name` prefixed `Test -`).
Sales Executive was tested via Basheer's own login (`role_id` was already
Sales Executive; only `display_name` was changed, cosmetically, to
`TEST - Sales Executive`, and has since been **reverted back to
`Basheer K`** in Supabase, 2026-07-13 — confirmed). Demo user **Amit R**
(`dddddddd-dddd-dddd-dddd-010000000002`, owns 2 seeded projects + linked
opportunities) was briefly repurposed as a test row during this process
and has been **fully restored** to original seed values (`Seed-Data-Demo.sql`
lines 44-55) — confirmed by query, no lasting damage. Decision: Amit R does
not need real login credentials — nobody logs in as him, he's owner-only
reference data, which is normal.

**Product Catalog collateral links is DONE and COMMITTED (`ab67209`,
2026-07-12).** Closed item 4 of the Milestone 1 gap-closure list. Full
write-up below ("Product Catalog collateral links — full write-up").

**Reminder click-through is DONE and COMMITTED (`ac6d008`, 2026-07-12).**
Closed item 2 of the Milestone 1 gap-closure list — see ledger below for
full write-up.

**Opportunity Detail trio (Associated Project link + Lead Source display/edit
+ Demo End Date display/edit) is DONE and COMMITTED (`b662751`, 2026-07-12).**
Basheer's manual browser pass found one issue (Overview tab field order),
fixed and folded into the same commit — see ledger below for full write-up.
This closes item 1 of the Milestone 1 gap-closure list.

**Open question surfaced during `CustomerType` review — RESOLVED/DEFERRED
(2026-07-13): no 9th enum value for now.** Basheer's real example — Aster
DM is the parent of Aster MIMS Calicut and Aster Medicity Kochi, and may be
a pure corporate/holding entity with no clinical operations of its own
(fits none of the 8 values well). Decision: leave the 8-value enum as-is;
add a "Corporate Group / Holding Entity" value (migration `0007` — `0006`
is now taken) only in Milestone 2, and only if a real customer need
confirms it. Not a blocker for Milestone 1.

**Priority decision (2026-07-10, still in force): Milestone 1 gap-closure
work from the Prototype/Production Parity Audit comes first, ahead of
resuming the §9 MUI migration backlog.** The demo checkpoint moved from
July 13 to July 20, which is what freed up room to do this instead of
migration work — not an abandonment of §9, just a sequencing call. See
`docs/Prototype-Production-Parity-Audit.md` §6 ("Gaps to finish —
Milestone 1") for the full scope. All 6 items now done and committed
(Catalog role gate was the last, `42fa050`, see "Current task" above) —
Milestone 1 gap-closure is fully complete.

**Mapped all 6 (now 1 remaining) items to screens/files 2026-07-11
(research agent, verified against actual code, not just the audit doc's
summary) — see "Milestone 1 remaining items — screen mapping" write-up
below for full detail. Recommended order, supersedes the earlier flat
list:**
1. ~~Opportunity Detail trio~~ — DONE, `b662751`.
2. ~~Reminder click-through~~ — DONE, `ac6d008`.
3. ~~Catalog role gate~~ — DONE, `42fa050`. All 6 items now closed.
4. ~~Product Catalog collateral links~~ — DONE, `ab67209`. Scope decided
   2026-07-12: URL-only labeled links (matches original prototype UX), not
   real Supabase Storage file upload — no storage credentials existed for
   the real-upload path; see write-up for the full decision.

**§9 migration backlog is paused, not abandoned** — resume the 3 remaining
files (`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
`ProjectDirectoryScreen.jsx`) after Milestone 1 gaps are closed. See "Next
step" below.

## Done in prior sessions (committed — see git log/commit messages for full detail)

(ledger rows are commits, not files; §9 status as of `71dc5a0`: 12 fully
migrated, 3 pending — `CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
`ProjectDirectoryScreen.jsx` — and 1 permanently out of scope, `App.jsx`
itself, the prototype, never migrating. 12 + 3 + 1 = 16 tracked total; only
the 3 pending files are actual remaining work.)

| File / change                                       | Commit(s)   | What                                                                                 |
| ---------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| Docs reconciliation + Tailwind pre-commit guard      | `d25bea8`, `dc543fa`, `bb28f23` | CLAUDE.md/Frontend-Standards reconciled to ADR-031; `.githooks/pre-commit` activated |
| `main.tsx`                                           | `8ec95a4`   | MUI migration                                                                        |
| `ActivityTimeline.tsx`                               | `5eef75a`   | MUI migration (redesigned as cards)                                                  |
| `NextActionsScreen.tsx`                              | `219ff99`   | MUI migration                                                                        |
| `LogActivityModal.tsx`                               | `c1796d6`   | MUI migration + `.then()`→`useQuery` fix                                             |
| `OpportunityPipelineScreen.tsx`                      | `8a3ed70`   | MUI migration                                                                        |
| Fidelity audit fixes (theme + first 7 files)         | `a7cbb02`   | Theme-level + per-file corrections; wrote up §6.6/§6.7/§6.8                          |
| `QuickLeadModal.tsx`                                 | `fe68a91`   | MUI migration + React Query                                                          |
| `OpportunityDetailScreen.tsx` Commit A                | `3619295`   | Styling + missing stakeholder-link POST/DELETE endpoints                             |
| `OpportunityDetailScreen.tsx` Commit B                | `01cead0`   | React Query + BR-FIN-03 auto-sync + `applyOppPatch` + stakeholder-edit feature       |
| `check-no-tailwind.js` shape-matching fix            | `11dc051`   | Guard matches real Tailwind utility shape, not bare `className=`                     |
| `sales_os_prototype_demo_ready.jsx` deletion         | `6d7b9f7`   | Removed orphaned prototype file                                                      |
| `DemoApp.tsx`                                        | `d107c5b`   | MUI migration                                                                        |
| `Customer360Screen.tsx` Commit A                     | `fd57a32`   | Styling-only MUI migration                                                           |
| `Customer360Screen.tsx` Commit B                      | `1bc4678`   | React Query (ADR-032) + BR-OP-02/03/05 status-gated fields + activity_count field + Round 1 activity query optimization (account-scoped only — see Deferred) |
| Backend concurrency fix (48 `async def` → `def`)      | `2bb41b4`   | Fixed the real root cause of Activity-tab/general screen-load slowness — see "Backend concurrency fix" below |
| `Customer360Screen.tsx` graduation                    | `a0ef2e4`   | §9 fully-migrated table + `check-no-tailwind.js` GRANDFATHERED removal              |
| `OpportunityDetailScreen.tsx` BR-OP port + 4-tab prefetch | `2f7e074` | BR-OP-02/03/05 status gates, Overview display, Reactivation Overdue badge, always-mounted Products/Splits/Stakeholders/Activity prefetch |
| `OpportunityPipelineScreen.tsx` Reactivation Overdue badge | `349a41e` | Last piece of the BR-OP status-gate rollout (all 3 opportunity-facing screens now done) |
| `ReminderRepository.list_for_user`/`count_for_user` fix    | `39ff781` | `include_completed` changed from additive to exclusive filter — Next Actions "Completed" tab no longer shows pending rows too |
| Activity logging on Project Details                    | `6075c80` | New `list_by_project` backend path + Activity card on `ProjectDirectoryScreen.jsx`; see write-up below |
| `ErrorBoundary.jsx` rename + migration                 | `581c28d`, `71dc5a0` | `.jsx`→`.tsx` rename, then MUI migration; styling + type-conversion only, no data-fetching (per §9's own "N/A" row) — §9 now 12 migrated, 3 pending |
| Parent Customer display (read-side)                    | `87fde5a`   | `AccountRef` type + `list_children()` read path; Customer360Screen Overview tab + CustomerDirectoryScreen "Parent: X" badge; see write-up below |
| Parent Customer editing + 2 bugfixes                    | `95e118a`   | Edit Account/New Customer parent lookups, backend cycle guard, cache-invalidation + `initialDataUpdatedAt` fixes; see write-up below |
| `api.ts` regeneration + `ActivityType` backend fix       | `bb671bc`   | Closed out the generation-debt item below; see write-up below |
| Docs fix (`managing_sbu_id`/`zone_id` drift) + `ADR-035` | `1a6e633`   | `Enterprise-Data-Model.md`/`Physical-Schema.sql` corrected; new ADR formalizing Account-is-SBU-agnostic (previously only in an archived memo) |
| Stray-test fix, unrelated to any feature                | `31bafa8`   | `ProductService.list_products` test called a `brand` kwarg the method never had — fixed the test, did not build brand filtering |
| `CustomerType` (institution-nature)                      | `70cf978`   | Migration `0005` + model/schema/service/tests + `Customer360Screen.tsx`/`CustomerDirectoryScreen.jsx` UI + `ADR-036`; see write-up below. Manually verified by Basheer — see "Current task" for one open follow-up question this surfaced |
| Opportunity Detail trio (Project/Lead Source/Demo End)   | `b662751`   | `PipelineOpportunity` schema + `list_pipeline` noload fix + new `test_opportunity_router.py` + `OpportunityDetailScreen.tsx` Overview/Edit; see write-up below. Manually verified by Basheer, one layout tweak folded in |
| Reminder click-through                                   | `ac6d008`   | New `GET /opportunities/{id}` + `OpportunityDetailScreen.tsx` fetch-on-mount + `NextActionsScreen.tsx`/`DemoApp.tsx` wiring + return-view back-nav fix; see write-up below. Manually verified by Basheer, one back-navigation bug found and fixed |
| Product Catalog collateral links                         | `ab67209`   | New `document` domain (schemas/repository/service/router) + migration `0006` (`file_size_bytes` nullable, applied to live DB) + `ProductCatalogScreen.jsx` Collateral Links card; see write-up below. Manually verified by Basheer |
| Catalog role gate (GM+Admin)                              | `42fa050`   | `ProductService.create_product`/`update_product` require `role_name` kwarg, 403 unless GM/Admin; `ProductCatalogScreen.jsx` hides Add/Edit for other roles. Closes Milestone 1 gap-closure (all 6 items done). Manually verified by Basheer across all 4 roles (UI + direct `curl`) |
| Demo/rollout planning docs                                | `ffaa669`   | `Demo-Showcase-Flow-July-20.md` (8-act presenter script), `Regression-Test-Plan.md`, `Deployment-Topology.md` (Dev/UAT/Prod decision — see write-up below) |

### Backend concurrency fix (`2bb41b4`) — why the Activity tab was actually slow
Two earlier fix attempts (Round 1: activity endpoint query optimization;
Round 2: frontend duplicate-query-observer fix, both landed in `1bc4678`)
did not resolve the reported slowness. Root cause, found by reading the
code, not guessed: `backend/app/db/session.py` uses plain sync SQLAlchemy
(`create_engine`/`sessionmaker`, no `asyncpg`), yet every route handler in
the app — 48 signatures across 11 files, including `get_current_user`, a
dependency on every authenticated endpoint — was `async def` with zero
`await` anywhere in the call chain. An `async def` handler that calls
blocking sync I/O runs directly on Uvicorn's single event-loop thread, so
concurrent requests serialize instead of overlapping; `Customer360Screen`
fires ~12 requests on mount, and whichever landed last in that queue looked
slow regardless of its own query cost. Converted all 48 to plain `def` so
FastAPI dispatches them to its threadpool instead. Confirmed fixed by
Basheer's live retest — "lightning fast now." Full detail (capacity check,
the `tests/test_auth.py` fallout found and fixed) in `2bb41b4`'s commit
message.

### `OpportunityDetailScreen.tsx`'s Activity tab — same investigation, different cause
After the backend fix landed, Basheer noted `OpportunityDetailScreen.tsx`'s
Activity tab still felt slow. Confirmed (his testing) that **all four tabs**
on that screen (Products/Splits/Stakeholders/Activity) load lazily on click
— this screen never got Customer360Screen's Commit B always-mounted-prefetch
treatment. Fixed and committed as `2f7e074`: added always-mounted prefetch
queries for all four (reusing each tab's existing query key), matching
`staleTime` on both ends so a click shortly after mount reads cache instead
of silently re-fetching.

### Activity logging on Project Details (`6075c80`) — design decisions worth remembering
Backend had `project_id` on `ActivityCreate` (write side) but no read path at
all — added `ActivityRepository.project_exists`/`list_by_project`/`count_by_project`,
`ActivityService.list_by_project`, and `GET /projects/{project_id}/activities`,
mirroring the opportunity-scoped pattern exactly.

**Why the frontend went through `DemoApp.tsx`'s header button instead of a
local modal:** the obvious approach was a third independent `LogActivityModal`
mount inside `ProjectDirectoryScreen.jsx` (`Customer360Screen.tsx` and
`OpportunityDetailScreen.tsx` each already have their own). Basheer chose
instead to extend `DemoApp.tsx`'s header `+Log` button — already
context-sensitive for Customer360/OpportunityDetail — to also cover Project
Detail, avoiding a third copy of the duplication already flagged in the
"Consolidate +LOG/+LEAD" deferred item below. Required lifting `selectedProject`
state into `DemoApp.tsx` (`onSelectProject` callback + `openLogActivityRef`,
mirroring the `onDetailModeChange`/`refreshOppsRef` idiom already used in this
file) instead of adding local modal state to `ProjectDirectoryScreen.jsx`.
`LogActivityModal.tsx` also gained a `projectName`-aware "Project: {name}"
chip so it's unambiguous which project an activity lands on when logged via
the header button (opportunity chip intentionally left generic — Basheer's
call, retrofit it when the full +LOG consolidation happens, not bundled here).

**Stale-detail-view bug found and fixed in the same pass** (pre-existing, not
caused by this work): `ProjectDirectoryScreen.jsx` stays mounted-but-hidden
(CSS `display: none`) rather than unmounting like `Customer360Screen`/
`OpportunityDetailScreen` (each their own conditionally-rendered `view`), so
navigating away via the sidebar and back re-showed the previously-open
project's detail view with the Customers/Projects sub-tab header stacked on
top of it. Fixed with the same parent-invokes-child-ref idiom as `openCreateRef`:
new `projectResetRef` in `DemoApp.tsx` called from `navigate()`;
`ProjectDirectoryScreen.jsx`'s `resetDetailRef` handler clears
`selectedProject`/`editingProject` and calls `onSelectProject?.(null)`.

Two decisions from this history had reasoning that lived only in this log,
not in any commit message or ADR — both now fixed at the source instead of
just narrated here:
- The bulk-replace stakeholder `PUT` endpoint's audit-trail-corruption risk
  (why a frontend-only workaround was rejected in `3619295`) is now a code
  comment on `replace_opportunity_stakeholders` (router.py) and
  `replace_stakeholders` (repository.py), so a future caller sees the warning
  without needing this file.
- BR-FIN-03 auto-sync (not a computed field) and the patch-not-invalidate
  cache strategy are both already spelled out in `01cead0`'s commit message
  — verified present, nothing further needed.

### Prototype/Production Parity Audit (2026-07-10) — new, not yet acted on

Produced `docs/Prototype-Production-Parity-Audit.md` — a systematic
comparison of the old prototype (`sales-os-app/src/App.jsx`, 8,740 lines)
against every production screen, then verified against `ADR.md`,
`Business-Rules.md`, `Enterprise-Data-Model.md`, `API-Catalog.md`,
`physical-data-model.md`, `Cabio Sales OS – Phase 1 - PRD.md`, and the live
backend — not a naive diff. Went through three revisions in one session
(v1 raw diff → v2 architecture-verified → v3 re-scoped after the demo date
moved), each documented in the file's own §7 changelog so the corrections
are auditable rather than just asserted.

**Headline corrections from the verification pass, worth remembering so they
don't get re-litigated:**
- Project On-Hold workflow and the Marketing Campaign field both looked like
  gaps in a raw prototype diff but are **not** — `ON_HOLD` isn't a defined
  `ProjectStatus` anywhere in the architecture, and Campaign is explicitly
  named as a future-phase item in `Enterprise-Data-Model.md §10`.
- The claim "no per-stage pipeline validation exists" was wrong — 5 of
  `BR-OP-01`'s 6 stage gates are already enforced server-side in
  `backend/app/domains/opportunity/validators.py`. Only Demo→Clinical-Eval
  and half of Order→Delivery are genuinely missing (confirmed via the
  validator's own code comments admitting the deferral).
- **New compliance gaps found independent of the prototype**, by checking
  `Business-Rules.md` directly: `BR-OP-06` Stalled Opportunity Detection
  (180-day auto-stall) is 0% implemented, no scheduled job exists anywhere.
  Demo Outcome, Handover Information, and Delivery Date/Installation Site
  are all formally mandated `BR-OP-01` gate fields with zero schema support.
- **RBAC reality check:** there is no role-gating pattern anywhere in
  production (frontend or backend) to reuse for the Catalog fix — verified
  false a claim to the contrary. `role` table + 4 seeded roles exist, but
  `get_current_user()` only authenticates, never authorizes. The bigger,
  approved-but-unbuilt initiative for this is `docs/Phase-2E-Security-Architecture.md`
  (full PostgreSQL RLS) — its own `set_rls_context()` hook is currently a
  literal no-op in `db/session.py`. Confirmed that's a separate, multi-day
  project; the Catalog role check is small, standalone service-layer work
  that doesn't need to wait for it.
- **PRD cross-check surfaced a real drop between the PRD and the formalized
  data model**, not a deliberate Phase 1 simplification: `Cabio Sales OS –
  Phase 1 - PRD.md` §1.1/§1.2/§1.3/§B.2.6 define `CustomerType`,
  `CustomerClass`, `CustomerTier`, `CustomerStatus`, and an address block for
  Account — none of it exists in `Enterprise-Data-Model.md`,
  `Physical-Schema.sql`, or the live `Account` model. The PRD also defines
  `CustomerType` two contradictory ways (hierarchy-level vs.
  institution-nature) — resolved by using `account.parent_account_id`
  (already live, structurally one-to-many, but no children-listing read path
  exists yet) for hierarchy, and reserving `CustomerType` for institution
  nature per the PRD §B.2.6 enum.

**Decisions made this session (recorded in the audit doc, not repeated in
full here):**
- Catalog Add/Edit restricted to General Manager + Admin roles — not yet
  built.
- `CustomerType` (institution-nature): approved to build, per PRD §B.2.6.
  `CustomerClass`/`CustomerStatus` remain undecided, explicitly parked.
- Quick Lead inline account creation: **not** built for Phase 1 — reps
  create the account via Account Management first. Simplicity call, not a
  BR-ACT-01/03 requirement (that justification was floated during review and
  didn't hold up on inspection).
- Stakeholder delete: removed from scope entirely — was a straight
  prototype-diff finding never backed by a Business Rule or ADR; its absence
  actually matches a deliberate no-DELETE pattern used elsewhere in
  `API-Catalog.md` (Installed Assets, Reminders, Target Plans).
- Demo checkpoint confirmed moved to **July 20** (from July 13) — this is
  what freed the "Current task" priority call above.

Full detail, tables, and the complete Milestone 1 / Milestone 2 scope split
are in `docs/Prototype-Production-Parity-Audit.md` — treat it as the
authoritative reference, don't re-derive it here.

### Parent Customer display + editing (`87fde5a`, `95e118a`) — full write-up

**Display (`87fde5a`, 2026-07-10):** backend `AccountRef` type + `list_children()`
read path on `GET /accounts/{id}`; frontend `Customer360Screen.tsx` Overview
tab (clickable Parent Customer field + Child Accounts chips) and
`CustomerDirectoryScreen.jsx` ("Parent: X" directory-card badge, Tailwind
one-off exception to ADR-031 — file still pending its own §9 migration).

**Editing (`95e118a`, 2026-07-11):** built because Basheer's review of the
display-only feature concluded *"without ability to add a parent to an
account, this feature is not complete"* — display was the only thing
originally scoped for Milestone 1, editing was a deliberate scope cut that
didn't hold up once the display was actually live.
- **Backend cycle guard:** `service.py`'s `_validate_references` previously
  only blocked *direct* self-parenting. Added `AccountService._creates_cycle`
  + `AccountRepository.get_parent_id`, which walks the full ancestor chain
  from a proposed parent looking for the account itself — catches deeper
  cycles (A→B→C→A), not just the direct case. 4 new tests (2 repository, 2
  service). Cost/complexity tradeoff (one DB round-trip per ancestor level)
  is documented in the function's own docstring, not repeated here — only
  revisit if a future milestone introduces deeper hierarchies than today's
  1-2 levels.
- **Frontend:** `Customer360Screen.tsx`'s Edit Customer modal got a "Parent
  Customer" MUI `Autocomplete` (debounced search via `listAccounts`,
  excludes self + direct children client-side, backend cycle guard as the
  backstop for deeper cycles). `CustomerDirectoryScreen.jsx`'s New Customer
  modal got a matching bespoke Tailwind search/select (no MUI import — same
  file-boundary exception as the badge above).

**Two real bugs found and fixed during manual verification of this and the
display work together** (neither had had a live pass until this session):
1. **Cache invalidation.** Setting a parent only invalidated the edited
   account's own React Query cache entry (`["account", accountId]`), never
   the parent's — so a parent's Child Accounts list could stay stale on any
   screen already open or revisited within the 30s global `staleTime`
   (`main.tsx`). Fixed in both `Customer360Screen.tsx`'s `handleUpdateAccount`
   (invalidates both old and new parent on a reparent) and
   `CustomerDirectoryScreen.jsx`'s `handleCreateAccount` (invalidates the
   new parent) — the latter needed importing `useQueryClient` into a
   Tailwind-only file, which is fine; that boundary is about UI components,
   not data-cache hooks.
2. **`initialDataUpdatedAt` — the real root cause, found after the cache fix
   alone didn't resolve it ("children not showing for a very long time").**
   `Customer360Screen.tsx`'s account query seeds from a name/id-only summary
   (a Directory row, or a parent/child link) via `initialData`, but never
   set `initialDataUpdatedAt`. React Query treats unstamped `initialData` as
   fetched "just now," so under the 30s global `staleTime` the query is
   considered fresh at mount and never kicks off the correcting background
   fetch — and nothing else was forcing one either (no polling; only window
   refocus or a fresh mount would trigger a staleness re-check). On a screen
   the user just leaves open, the incomplete snapshot could persist
   indefinitely. Fixed by backdating `initialDataUpdatedAt: initialAccount ?
   0 : undefined` — forces immediate staleness so a background refetch
   starts right on mount, while still painting instantly from the seed data.
   Verified against the live DB directly (backend `list_children()`/
   `GET /accounts/{id}` both confirmed correct via `TestClient`, read-only,
   before concluding the bug was frontend-only) — root-caused, not guessed.

Basheer's manual verification pass (2026-07-11) confirmed: adding a parent,
viewing parent, viewing children, clicking parent, clicking children all
working.

### `api.ts` generation debt + `ActivityType` backend fix (`bb671bc`) — full write-up

**The debt:** `api.ts` (header: "auto-generated ... do not make direct
changes to this file") hadn't had a real `npm run generate:types` run since
`3bab93f` (2026-07-03). Two commits since then hand-patched fields directly
into the file's "Phase A — Pipeline types (hand-written, not auto-generated)"
tail block instead of regenerating (`2f7e074`, 2026-07-06 — 4 fields
hand-added to `PipelineOpportunity`), and two real backend endpoints shipped
with zero corresponding frontend types ever generated: opportunity
stakeholder `POST`/`PATCH`/`DELETE` (`3619295`, 2026-07-05) and
`GET /projects/{project_id}/activities` (`6075c80`, 2026-07-06). No external
actor — a prior session took a "hand-edit the generated file" shortcut
twice without flagging it as debt.

**The fix:** regenerated against the live backend's OpenAPI spec (pulled
in-process via `TestClient`, no server needed — safe, read-only). Diffed
every hand-written type field-by-field against its backend equivalent
before touching anything:
- Aliased to `components["schemas"][...]` (exact match or additive-only
  diff, safe): `PipelineOpportunity` (+ nested `stage`/`status`/`owner`/
  `account`/`sbu`), `StakeholderLinkResponse`, `OpportunityItemResponse`,
  `SplitResponse` (backend now also returns an `id` field the hand-written
  type never had — additive), `ReminderResponse` (nested `activity` object
  renamed `ActivityContextNested` backend-side, aliased under the existing
  `ReminderResponse` name so nothing importing it breaks).
- `ActivityResponse`/`ActivityType`/`ActivityContextNested.activity_type`
  initially could NOT be safely aliased — the backend's own schema typed
  `activity_type` as plain `str` instead of the 6-value enum
  `ActivityCreate` already used correctly. Fixed at the source instead of
  leaving the frontend override in place: checked the live DB first for any
  value outside the 6-value enum (tightening a *response* schema means
  Pydantic validates on the way out too — a stray value would 500 on
  `GET .../activities`), confirmed clean (only `MEETING`/`CALL`/`EMAIL` in
  use), then fixed `backend/app/domains/activity/schemas.py` lines 72 and 99
  (`ActivityResponse.activity_type` and `ActivityContextNested.activity_type`,
  both `str` → `ActivityType`) and regenerated again. `ActivityResponse` and
  `ActivityPage` are now aliases too; `ActivityType` itself is derived via
  `components["schemas"]["ActivityResponse"]["activity_type"]` rather than
  hand-listed, so it can't drift from the backend enum again.
- `ActivityPage` needed its own hand-written wrapper even after the backend
  fix — aliasing it to the generated `PaginatedResponse_ActivityResponse_`
  wrapper would nest the *backend's* `ActivityResponse` inside, not
  necessarily the same TS symbol as the top-level exported alias, so it's
  written by hand as `{ items: ActivityResponse[]; total; page; page_size;
  total_pages }` referencing the local alias explicitly. `tsc --noEmit`
  caught this the first time it was tried and aliased directly — proof the
  whole-project typecheck after a regen is load-bearing, not a formality.
- `PipelinePage` aliases cleanly to `PaginatedResponse_PipelineOpportunity_`
  (no such ActivityResponse-style trap there, since `PipelineOpportunity` is
  itself already a clean alias).

**Result: `api.ts`'s hand-written tail is now genuinely minimal** — every
exported name still needed by other files (grep-verified against actual
imports, not kept "just in case") is a one-line alias, nothing has a
hand-typed body. Repo-wide grep confirmed no other file carries the same
"auto-generated, do not edit" anti-pattern. `tsc --noEmit`/`npm run lint`/
`npm run build` and `pytest` (275 passed, 1 pre-existing unrelated failure)
all clean. Manual smoke test (Basheer, 2026-07-11) of the most-affected
screens — Opportunity Pipeline, Opportunity Detail (Splits/Stakeholders/
Items tabs), Activity timelines, Next Actions — confirmed normal.

### Milestone 1 remaining items — screen mapping (2026-07-11, research only)

Ran a research agent against the actual code (not just the audit doc's
summary — this session already found a few "documented state" vs. "real
code" mismatches, so worth double-checking) to map all 6 remaining items to
files, before picking what to build next.

| Item | Screen(s) | Backend touch |
| --- | --- | --- |
| Associated Project link | `OpportunityDetailScreen.tsx` | `PipelineOpportunity` schema — add `project_id` + nested `Project` (column/relationship already exist on the ORM model, just missing from this response shape) |
| Lead Source display | `OpportunityDetailScreen.tsx` | `PipelineOpportunity` schema — add `lead_source_id` + nested `LeadSource` (`validators.py` already hard-requires it to advance Lead→Qualified — the write path is enforced, the screen just has no field to satisfy it) |
| Demo end date | `OpportunityDetailScreen.tsx` | none — `demo_end_date` already in `PipelineOpportunity`/`OpportunityCreate`/`OpportunityUpdate`; only `demo_start_date` is actually wired into the Overview display and Edit form today |
| Reminder click-through | `NextActionsScreen.tsx` + `DemoApp.tsx` | mostly none — see gap below |
| Catalog role gate (GM+Admin) | `ProductCatalogScreen.jsx` | new `require_role()`-style FastAPI dependency — confirmed zero role-checking logic exists anywhere in the backend today (`get_current_user` only authenticates) |
| Product Catalog collateral links | `ProductCatalogScreen.jsx` | new Document `schemas.py`/`service.py`/`router.py` — `backend/app/domains/document/` today has only `models.py` (the ORM model + `Product.documents` relationship exist per ADR-025, zero API surface) |

**Key discovery driving the grouping recommendation above:**
`OpportunityDetailScreen.tsx` never fetches its own data — `DemoApp.tsx`'s
`handleSelectOpportunity` just hands it whatever `PipelineOpportunity`
object was already sitting in the pipeline list. So Associated Project,
Lead Source, and Demo End Date all depend on that one schema and that one
screen's Overview tab/Edit form — doing them as one pass is a real
efficiency, not just "same file, do together" convenience.

**Reminder click-through's real design gap, found by the agent, not in
the original audit:** the account-side of this (`handleSelectAccount`)
is safe — a Reminder's nested account is `{id, name}`, exactly the
minimal shape `Customer360Screen.tsx` already expects as a seed, and
that screen already has the `initialDataUpdatedAt` fix from this session
to correctly refetch the rest. The opportunity-side is not safe:
`handleSelectOpportunity` expects a full `PipelineOpportunity` (stage,
status, owner, sbu, account...), but `ReminderResponse.activity.opportunity`
is only `OpportunityNested` (`{id, name}` — see `activity/schemas.py`).
Wiring the click-through naively would open `OpportunityDetailScreen.tsx`
mostly blank, because that screen has no fallback fetch of its own — it's
the same "minimal object treated as complete" bug class as the Parent/Child
account issue fixed earlier this session (`95e118a`), just not yet fixed
for Opportunities. Needs a decision before building: either give
`OpportunityDetailScreen.tsx` a real fetch-on-mount (bigger, more durable
fix — arguably the right one, matching how the account screen now works),
or fatten the reminder's nested opportunity payload to match
`PipelineOpportunity` (cheaper, but only patches this one entry point).

**Catalog role gate + collateral links share a file, not logic** — treat
as two separate efforts even though both touch `ProductCatalogScreen.jsx`;
one's an authorization wrapper on existing buttons, the other's a net-new
Documents tab on a screen with no tab structure today.

## Reference: Customer360Screen.tsx Commit B query-key design

**Query keys — deliberately reusing existing keys from other files so
screens share one cache entry instead of duplicating fetches** (same
principle used in `OpportunityDetailScreen.tsx`'s Commit B for
stages/statuses/users, and now in its 4-tab prefetch too):

| Data                                 | `queryKey`                                                               | Shared with                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Account                              | `["account", accountId]`                                                 | — (screen-local)                                                                     |
| Account counts                       | `["account-counts", accountId]`                                          | —                                                                                    |
| Stakeholders (tab)                   | `["stakeholders", "byAccount", accountId]`                               | `OpportunityDetailScreen.tsx`'s stakeholder-link picker                              |
| Projects (tab)                       | `["projects", "byAccount", accountId]`                                   | `QuickLeadModal.tsx`'s project picker                                                |
| Opportunities (tab)                  | `["opportunities", "byAccount", accountId]`                              | — (new)                                                                              |
| Installed assets (tab)               | `["installed-assets", "byAccount", accountId]`                           | —                                                                                    |
| Zones                                | `["zones"]`, `staleTime: Infinity`                                       | — (new)                                                                              |
| Project statuses                     | `["project-statuses"]`, `staleTime: Infinity`                            | — (new)                                                                              |
| Stages / Opp statuses / Lead sources | `["stages"]` / `["statuses"]` / `["leadSources"]`, `staleTime: Infinity` | `OpportunityDetailScreen.tsx`, `OpportunityPipelineScreen.tsx`, `QuickLeadModal.tsx` |
| Hold / Loss reasons                  | `["holdReasons"]` / `["lossReasons"]`, `staleTime: Infinity`             | `OpportunityDetailScreen.tsx` (both screens' Edit Opportunity modal + Overview display) |
| Users                                | `["users", "all"]`                                                       | all of the above                                                                     |
| Products                             | `["products", "picker", sbuId]`                                         | `QuickLeadModal.tsx`, `OpportunityDetailScreen.tsx`                                  |
| Opportunity items                    | `["opp-items", <opportunityId>]`                                         | `OpportunityDetailScreen.tsx`'s Products tab, same opportunity                       |

**`initialAccount` → `useQuery`'s `initialData`.** First screen to
implement the pattern Frontend-Implementation-Standards.md §3.3 has held a
placeholder for since it was written. **§3.3 line 114 still says "No screen
in this codebase does this yet" — this is now stale and should be updated
with the real Customer360Screen.tsx example**, per that section's own
instruction. Small doc fix, not yet done.

**The ref-guarded seeding subtlety (implemented, verified in code):** the
Edit Opportunity modal's item list (`editOItems`) is an editable draft
buffer, not a direct render of query data. Since `listOpportunityItems` is
only fetched on-demand (`enabled: editingOpp !== null`), data isn't
available the instant the modal opens. Seeded in a `useEffect` guarded by a
ref (seed once per `editingOpp.id`, reset the guard on close) — confirmed
present in `Customer360Screen.tsx` (lines ~629-638) exactly as designed.

## Next step
**Milestone 1 gap-closure — one item left.** Work the remaining list in
`docs/Prototype-Production-Parity-Audit.md` §6 ("Gaps to finish —
Milestone 1"). Done so far: Parent Customer display + editing (`87fde5a`,
`95e118a`), `CustomerType` (`70cf978`), Opportunity Detail trio (`b662751`),
Reminder click-through (`ac6d008`), Product Catalog collateral links
(`ab67209`). **Still open: Catalog role gate (GM+Admin)** — the only
remaining item, no dependency on anything else. Not yet started.

**§9 MUI migration backlog resumes after Milestone 1** — 3 files remain
(`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
`ProjectDirectoryScreen.jsx`), all still needing the full triple-conversion
(styling + fetch + `.jsx`→`.tsx`) — bigger lift than `ErrorBoundary.jsx` was,
no precedent file has been this file type yet. Resume the per-file
migration ritual (below) when picked back up — end with an honest §9 update
per column, not a blanket "done."

**Per-file ritual, mandatory for every remaining migration:**
convert → property-diff (against pre-migration git history, full comparison
table, evidence not summary) → triage (categorize each gap using §6.8's rules:
fix-theme / fix-per-file / verify-first / do-not-fix) → verify on screen
(manual E2E, Basheer's pass) → guard-green (`npm run lint` clean, `npx tsc
--noEmit` clean) → update §9 honestly (per-column, not a blanket "done") and
the `check-no-tailwind.js` GRANDFATHERED list to match, in the same commit →
commit. If a file's data-fetching and styling are genuinely separable risk
profiles, split into two commits rather than bundling.

`npx tsc --noEmit` is a deliberate addition, not a duplicate of `npm run lint`:
`sales-os-app/eslint.config.js` only has a `files: ['**/*.{js,jsx}']` block
(no `.ts`/`.tsx` glob) and there is no `typescript-eslint` package in
`devDependencies`, so `eslint .` silently skips every `.tsx` file. `npm run
build` is plain `vite build`, no `tsc` step either. Net effect: **no
automated step other than `tsc --noEmit` type-checks `.tsx` files.**

Update Frontend-Implementation-Standards.md as new gotchas/patterns surface
during these remaining migrations — §6.6/§6.8 are living documents.

## Deferred
- **Parent-account cycle guard — recursive-CTE optimization, not needed yet.**
  `AccountService._creates_cycle` (`backend/app/domains/account/service.py`)
  walks the ancestor chain with one DB round-trip per level; full reasoning
  and the CTE alternative are in that function's own docstring, not repeated
  here. Revisit only if a future milestone introduces deeper hierarchies.
- **Parent/Child account navigation — richer `initialData` instant-paint.**
  Surfaced during Milestone 1 "Parent Customer display" planning (2026-07-10, see
  `docs/Prototype-Production-Parity-Audit.md` §6). `Customer360Screen.tsx`'s
  `account.parent_account`/`account.child_accounts` are typed as a minimal
  `AccountRef {id, name}` — clicking a parent or child link still paints
  instantly from that (and, since the `initialDataUpdatedAt` fix landed
  2026-07-11, now reliably kicks off an immediate background refetch too —
  see write-up above), but the *initial* paint only has a name, no
  zone/payer_behavior/counts, unlike Directory-list navigation which has
  all of that from its already-fetched row data. This item is about
  closing that specific gap, not about the refetch-never-firing bug, which
  is already fixed.
  **Why it's cheap, if picked up later:** `account.zone` is a separate,
  non-self-referential relationship — always eager-joined regardless of nesting —
  so `parent_account.zone` is already in memory once `parent_account` loads; no
  extra query needed to expose it. For `child_accounts`, the `list_children()`
  repository query would just need `joinedload(Account.zone)` added to its
  options — one wider `SELECT`, not an extra round trip. Still 2 queries total for
  the whole account-detail endpoint, same as today.
  **What it'd take:** (1) backend — use `AccountListResponse` (zone, payer_behavior,
  parent_account_id) instead of the minimal `AccountRef` for `parent_account`/
  `child_accounts`, safe one level deep (no self-referential recursion risk since
  neither field nests a further `parent_account`); (2) frontend — `DemoApp.tsx`'s
  `selectedAccount` state (currently typed `{id, name}` only) needs widening to
  carry the richer object through `handleSelectAccount`, so it flows into
  `Customer360Screen`'s `initialAccount` prop → `useQuery`'s `initialData` the same
  way Directory-list navigation already works. Real cost is a slightly heavier
  payload on every account-detail fetch — negligible, and zero for the majority of
  accounts with no parent/children.
- **NPS field range enforcement + product dropdown label consistency (two-fix commit).**
  Surfaced during `Customer360Screen.tsx` Commit B E2E verification (2026-07-06).
  (1) NPS Score on Stakeholders has no range constraint today — free-number input.
  Standard NPS survey input is 0–10 per respondent; the -100 to +100 range is an
  aggregate metric, not a per-person score. Backend `nps_score` is already
  constrained `ge=-100, le=100` — the frontend-only 0–10 clamp idea needs
  revisiting/a decision before any fix is executed, not a ready-to-build task.
  (2) Opportunity item-picker renders `{p.name}` only; Installed Base dropdowns
  render `{p.name} — {p.model_number}`. One-line fix in `Customer360Screen.tsx`
  line ~928 (still present as of `1bc4678`).
- **Add `whatsapp_number` field to Stakeholder (backend migration + frontend).** Requested
  2026-07-06. Currently not in the DB schema or Pydantic schemas at all — needs a 3-layer
  change: (1) Alembic migration adding `whatsapp_number VARCHAR(50) NULLABLE` column to
  `stakeholder` table (follow pattern of `0002_add_stakeholder_contact_details.py`);
  (2) `stakeholder_schemas.py` → add `whatsapp_number: str | None = Field(None, max_length=50)`
  to `StakeholderCreate`, `StakeholderUpdate`, and `StakeholderResponse`; (3) frontend
  `Customer360Screen.tsx` → add "WhatsApp Number" `TextField` to both New Stakeholder and
  Edit Stakeholder modals. Also add to `OpportunityDetailScreen.tsx`'s stakeholder-edit
  modal if that modal shows contact fields. Run `python -m pytest` after migration.
- **`OpportunityDetailScreen.tsx` — convert Products/Splits/Stakeholders inline edit
  forms to `FormModal` (desktop UX fix).** Surfaced during E2E verification 2026-07-06.
  On desktop (1920px) the inline edit mode for Products, Splits, and Stakeholders tabs
  renders as form fields floating inside the narrow content column — looks stranded and
  unfinished compared to the modal pattern used elsewhere. **Note: the BR-OP-02/03/05
  port + 4-tab prefetch work already landed on this file without bundling this item in**
  (deliberately scoped out — unrelated to the status-change bug that was actually
  demo-blocking). So this is no longer "free" to fold into an already-planned touch of
  the file — it's now its own standalone future change, second touch on this file.
- **Round 1 activity query optimization — never ported to the opportunity-scoped
  path.** `activity/service.py::list_by_account` sources its `total` from
  `account.activity_count` (no separate COUNT query); `list_by_opportunity` still
  does the old 3-round-trip pattern (`opportunity_exists` + `list` + a separate
  `count_by_opportunity`). Minor now that the backend concurrency fix removed the
  actual bottleneck, but a real, verified gap. Also: `ActivityRepository.count_by_account`
  is now dead code (only referenced in tests, never called in production) — confirmed
  via repo-wide grep. And `list_by_account`'s own `total`/`total_pages` response fields
  are a "lower bound" approximation (`offset + len(items)`), not an accurate count —
  works today only because `Customer360Screen.tsx` overrides it with `activity_count`;
  any other caller of that endpoint would get a wrong total. Low priority, not
  demo-blocking, but a real correctness gap in the API contract.
- **Frontend-Implementation-Standards.md §3.3, line 114** — stale placeholder
  ("No screen in this codebase does this yet") for the `initialData` pattern,
  which `Customer360Screen.tsx` now implements. Small doc fix.
- **Input text size/weight on migrated `TextField`s.** Every pre-migration
  Tailwind file used a shared `inp` constant with `text-sm font-medium`
  (14px/500) on every text input. No migrated file's `TextField`s carry an
  explicit override — MUI default typography (~1rem/400) instead. Confirmed
  present in `QuickLeadModal.tsx`, `OpportunityDetailScreen.tsx`, and
  `Customer360Screen.tsx`. Basheer's call: fix once, holistically, in the
  theme (`src/theme/index.ts`'s `MuiOutlinedInput`/`MuiInputBase` override)
  rather than per-file. Grep `size="small"` across migrated files first.
- `statusColors.ts` — create as one pass after Tailwind migration; consolidates
  ~11 files; resolve emerald-50-vs-100 (and any other weight inconsistencies) at
  that time from complete view.
- **Type the shared frontend service functions properly.** `listUsers`
  (services/masterData.ts), `listAccounts`, `listOpportunities`,
  `updateOpportunity` (services/accounts.ts) — and likely their siblings —
  return `Promise<unknown>` instead of a typed shape, forcing callers to use
  `any[]`/local inline types. Cascades — consumed by Customer360Screen.tsx,
  CustomerDirectoryScreen.jsx, QuickLeadModal.tsx, LogActivityModal.tsx.
  Deferred because it's a shared-service-layer change, not part of any
  single file's migration. Post-migration, medium priority.
- **Next Actions screen: show everything + search/filter bar (by account/hospital
  name, reminder text, overdue, completed), replacing the Pending/Completed
  toggle.** Raised by Basheer 2026-07-06 as an alternative to the include_completed
  bug fix; not adopted now (see "Current task" — minimal fix chosen instead).
  Would need: backend query params on `/reminders` (`search`, `status:
  pending|completed|overdue|all`) built server-side to preserve pagination
  (reminders never get deleted — BR-ACT-04 mandates one per Activity, so the
  dataset grows indefinitely); `Reminder`/`Activity` already joins `Account`
  (`lazy="joined"`), so hospital-name search is cheap. Open question never
  resolved: what "name" should match — reminder_text, opportunity name, or a
  stakeholder/contact name (no such field exists on Reminder/Activity today —
  would need a new join if that's the intent). Frontend would replace
  `NextActionsScreen.tsx`'s `ToggleButtonGroup` with a search field + status
  filter. Not started.
- **Consolidate +LOG / +LEAD into context-sensitive global buttons — now
  PARTIALLY DONE, not fully.** Was: 3 independent `LogActivityModal` mounts
  (`DemoApp.tsx`, `Customer360Screen.tsx`, `OpportunityDetailScreen.tsx`).
  During the Project Details activity-logging build (`6075c80`, 2026-07-06,
  see write-up under "Done in prior sessions"), Project Detail was wired
  into `DemoApp.tsx`'s existing header
  `+Log` button instead of adding a 4th independent mount — `DemoApp.tsx` now
  has `selectedProject` state + `onSelectProject`/`openLogActivityRef`
  plumbing, proving the "lift state into DemoApp" approach works in practice.
  **Still remaining:** `Customer360Screen.tsx` and `OpportunityDetailScreen.tsx`
  still each have their own separate `LogActivityModal` mount, untouched —
  retrofitting those two onto the same header-button pattern is the rest of
  this item. Same rationale as before (duplication is what let the
  `.then()`-vs-`useQuery` defect go unnoticed). Sequence after the MUI
  migration backlog, or opportunistically if either file is touched again.
- **Extract a shared `BackButton` component.** The circular `IconButton` +
  `ArrowBackIcon` control (§6.6 item 7) is inlined in `OpportunityDetailScreen.tsx`
  and will be needed unchanged in `Customer360Screen.tsx`, `ProductCatalogScreen.jsx`,
  `ProjectDirectoryScreen.jsx` when they migrate. Do as its own small refactor,
  or fold into the second of these files to migrate.
- **§6.7 enforcement gap.** No mechanical guard against hardcoded hex colors
  drifting back into per-component `sx` props (theme should be single source
  of truth). Post-demo, not blocking.
- **§9 enforcement gap.** §9's checkmarks are self-reported and have already
  drifted silently twice (`LogActivityModal.tsx`, `OpportunityDetailScreen.tsx`
  both mislabeled "React Query ✓" while still using manual `.then()`).
  Candidate guards: grep `.then(` in files listed "React Query ✓"; grep
  `: any`/`any[]` in files listed "TypeScript ✓". Post-demo, not blocking.
- **Inline "+ New Stakeholder" shortcut from the Opportunity Stakeholders tab.**
  `OpportunityDetailScreen.tsx`'s "Link Stakeholder" form only lists existing
  account-level `Stakeholder` records — no way to create one without leaving
  the opportunity. Not a data-model gap (Stakeholder is always account-scoped).
  Reuse `Customer360Screen.tsx`'s existing "New Stakeholder" `FormModal` field
  set/service call, then `addOpportunityStakeholder` to link it. Basheer's
  call: hold as deferred.
- **`brand` filtering on `ProductService.list_products` — not implemented.**
  (Was: a pre-existing broken test — `test_delegates_to_repository` called
  a `brand` kwarg the method never had, `TypeError` on every run. Fixed
  2026-07-11 by correcting the test to match the real signature, not by
  adding the feature.) If real brand filtering is ever needed, add it to
  `ProductService.list_products`/`ProductRepository.list_products` and add
  a genuine test for it then — not before.

## Notes / decisions
- MUI-only decided, non-negotiable. §9 is the authoritative migration tracker.
- Enforcement is live: pre-commit hook blocks new Tailwind automatically.
- The 14 eslint-disable suppressions are load-bearing (they keep lint green / the
  commit gate working) — they get DELETED as each file migrates, not before.
- Timing: original plan was "finish whatever is migrated AND re-verified by
  July 10; freeze rest, demo July 13 on clean mix of migrated + untouched
  screens, resume after." Superseded 2026-07-10: **demo checkpoint moved to
  July 20.** The extra runway is why Milestone 1 gap-closure work (see
  "Current task"/"Next step") was prioritized ahead of resuming the §9
  migration backlog rather than the other way around.
- **Demo-blocking bug found and fixed 2026-07-06:** the (then-)July 13 demo
  would have changed opportunity status from `OpportunityDetailScreen.tsx` (confirmed
  with Basheer), which had zero UI for the BR-OP-02/03/05 status-gated
  fields the backend validator already enforces — any such status change
  would have failed with no way to fix it in the form. Fixed and committed
  as `2f7e074`.
- Confirmed by design, not a bug (2026-07-06): changing a LOST opportunity's
  status back to Active correctly fails ("Cannot change the status of a LOST
  opportunity") — per `Business-Rules.md:114-122`, WON/LOST are terminal;
  a new Opportunity must be created instead, to keep historical WON/LOST
  records immutable for audit.
- Reminders-on-login feature is DEFERRED behind the migration — not lost, not current.
- Live shared Supabase DB caution applies when touching real data.

### `CustomerType` (institution-nature) — full write-up (`70cf978`)

**Backend:**
- `backend/alembic/versions/0005_add_account_customer_type.py` — nullable
  `customer_type` column + `ck_account_customer_type` CHECK constraint
  (8-value enum, PRD §B.2.6). **Applied to the live shared dev DB
  2026-07-11** — verified via `information_schema`/`pg_constraint` queries
  (read-only), not just "migration file exists." `alembic current` → `0005
  (head)`.
- `backend/app/domains/account/models.py` — `Account.customer_type` column +
  matching `CheckConstraint` in `__table_args__`.
- `backend/app/domains/account/schemas.py` — new `CustomerType` `StrEnum`;
  `customer_type` added to `AccountBase` (→ `AccountCreate`), `AccountUpdate`,
  `AccountListResponse`, `AccountResponse` (`AccountDetailResponse` inherits
  it for free).
- `backend/app/domains/account/service.py` — `create_account`'s `Account(...)`
  constructor now passes `customer_type` (`update_account` already handles
  new fields generically, no change needed there).
- `backend/tests/domains/account/{test_account_service,test_account_router}.py`
  — 4 new tests (valid/invalid `customer_type` on create + update) + fixed
  `test_account_router.py`'s `_mock_account` helper (was missing
  `customer_type`, which broke `AccountResponse`/`AccountListResponse`
  Pydantic validation in 4 unrelated pre-existing tests once the field
  existed on the model).

**Frontend:**
- `sales-os-app/src/screens/Customer360Screen.tsx` — new `formatEnumLabel()`
  helper (`"MULTISPECIALITY_HOSPITAL"` → `"Multispeciality Hospital"`,
  generic underscore-split + title-case, works for all 8 values with no
  special-casing); "Customer Type" hardcoded `<MenuItem>` select in Edit
  Customer modal (same pattern as Payer Behavior — no master-data fetch,
  per `ADR-036`); "Customer Type" row added to the Overview tab's `fields`
  array, rendered via `formatEnumLabel`. `handleUpdateAccount` always sends
  `customer_type` (even `null`) so it can be cleared, same convention as
  `parent_account_id`.
- `sales-os-app/src/screens/CustomerDirectoryScreen.jsx` — same
  `formatEnumLabel()` helper (duplicated, not shared — this file is plain
  JS/Tailwind, `Customer360Screen.tsx` is TSX/MUI, no shared util module for
  this one function yet); "Customer Type" hardcoded `<select>` in New
  Customer modal; amber directory-card badge (`bg-amber-50`/`text-amber-700`)
  matching the existing Zone/Parent/Payer Behavior badge row exactly.
- `sales-os-app/src/types/api.ts` — regenerated again (same
  dump-OpenAPI-in-process, no-server-needed approach as the earlier
  `bb671bc` cleanup) to pick up `customer_type` on the Account schemas; the
  hand-written alias tail (wiped by every regen) was re-appended unchanged.
  Note: `services/accounts.ts`'s `listAccounts`/`getAccount` still return
  `Promise<unknown>` (pre-existing deferred item — "type the shared frontend
  service functions properly") — neither screen's use of `account.customer_type`
  is actually type-checked against the regenerated schema as a result; the
  regen was still worth doing to keep `api.ts` itself accurate, just noting
  it wasn't required for `tsc --noEmit` to pass this time, unlike the
  Activity/Pipeline types from the `bb671bc` cleanup which are genuinely
  imported and checked.

`tsc --noEmit`/`npm run lint`/`npm run build`/`pytest` (280 passed) all
clean. Manually verified by Basheer (2026-07-11): New Customer select, Edit
Customer select (change + clear-to-blank), Overview tab display, Directory
badge, regression on accounts with no `customer_type` set — all confirmed
working.

**Open follow-up, not yet resolved — see "Current task" for full detail:**
whether the 8-value enum needs a 9th value for pure corporate/holding
accounts (e.g. Aster DM) that have no clinical nature of their own,
distinct from the hierarchy question (already answered by
`parent_account_id`, no field needed for that part). Basheer is checking
the real data before any further change.

### Opportunity Detail trio (Project link / Lead Source / Demo End Date) — full write-up (`b662751`)

First item of the Milestone 1 gap-closure list. Three fields bundled into
one pass because all three live or die on the same `PipelineOpportunity`
schema and the same screen — `OpportunityDetailScreen.tsx` never fetches
its own data, `DemoApp.tsx` just hands it whatever pipeline-list object was
already loaded (see "Milestone 1 remaining items — screen mapping" above).

**Scope decisions, both made via `AskUserQuestion` before coding:**
- **Associated Project: plain text display, no click-through.** Basheer's
  call — click-through deferred as a post-demo follow-up if a customer asks
  for it; building it now would have required new cross-screen navigation
  plumbing (`onSelectProject` prop + handler in `DemoApp.tsx`) that doesn't
  exist today for Opportunity Detail (Project Detail today only renders
  inline inside `ProjectDirectoryScreen`, no standalone route).
- **Lead Source: display AND editable**, not display-only. Reason: today
  Lead Source can only be set once, at Opportunity creation via
  `QuickLeadModal` — if missed, there was no way to backfill it, which
  silently blocks the Lead→Qualified stage gate (`validators.py`). Confirmed
  via code read that `validate_stage_transition` only runs when a PATCH
  includes `stage_id` (`service.py:182`, `if "stage_id" in updates:`), so
  adding a second write-entry-point for `lead_source_id` (this edit form)
  has zero interaction with that gate's logic when Lead Source is edited
  alone (no stage change in the same request).
- Demo End Date: straightforward, mirrors `demo_start_date` exactly — the
  field already existed on the backend schema, nothing had ever read it.

**Backend:**
- `schemas.py` — `PipelineOpportunity` gained `project: ProjectNested |
  None` and `lead_source: LeadSourceNested | None` (new minimal `{id,
  name}` nested types, same shape as `AccountNested`/`SBUNested`).
- `repository.py`'s `list_pipeline` had `noload(Opportunity.lead_source)`
  explicitly blanking that relationship out on every pipeline fetch —
  removed. (`project` needed no repository change; already rides the ORM's
  default `lazy="joined"`, was never noloaded.)
- New `backend/tests/domains/opportunity/test_opportunity_router.py` — this
  domain had **zero** router-level test coverage before (`list_pipeline`/
  `PipelineOpportunity` had never been tested at any layer). Added 4 tests
  covering the exact risk this change introduces: null-safety when
  project/lead_source are unset, correct serialization when set, and
  `demo_end_date` passthrough.

**Frontend:**
- `sales-os-app/src/types/api.ts` regenerated (same in-process
  TestClient→OpenAPI-dump approach as `bb671bc`); hand-written alias tail
  re-appended unchanged (confirmed via diff: 22 pure additions, 0
  deletions).
- `OpportunityDetailScreen.tsx` — Overview tab grid gained Demo End / Lead
  Source / Associated Project fields (plain `Field` rows, `opp.project?.name`
  read directly, no separate fetch needed for display). Edit modal gained a
  Demo End Date `TextField` (mirrors `demo_start_date`'s 4 wiring points:
  state, populate-on-open, PATCH payload, `applyOppPatch`) and a Lead Source
  `Select` dropdown backed by a new `["leadSources"]` query (mirrors
  `QuickLeadModal.tsx`'s pattern) — sends `null` when cleared, same
  clear-to-blank convention as `CustomerType`/`parent_account_id`. Project
  is **not** in the edit form — display-only per the scope decision above.

`tsc --noEmit`/`npm run lint`/`npm run build`/`pytest` (284 passed = 280 +
4 new) all clean.

**Manually verified by Basheer (2026-07-12):** one issue found — Overview
tab field order — Demo Start/Demo End moved onto the same first row,
Expected Closure moved to the second row (next to PO Number); SBU/Lead
Source/Associated Project unchanged after that. Fixed and folded into the
same commit rather than a separate follow-up, since it landed before the
commit was made. No other issues found.

### Reminder click-through — full write-up (`ac6d008`)

Second item of the Milestone 1 gap-closure list. Closes the design gap
identified while mapping this item (2026-07-11): a Reminder's nested
opportunity is only `OpportunityNested` (`{id, name}`), but
`OpportunityDetailScreen.tsx` never fetched its own data — `DemoApp.tsx`
just handed it whatever full `PipelineOpportunity` object the Pipeline
screen already had loaded. Wiring the click-through naively would have
opened the screen mostly blank.

**Design decision (`AskUserQuestion` before coding): give
`OpportunityDetailScreen.tsx` a real fetch-on-mount**, mirroring
Customer360Screen's parent/child account click-through pattern
(`useQuery` + `initialData` + `initialDataUpdatedAt: 0`) rather than the
cheaper alternative (fattening the reminder's nested opportunity payload to
match `PipelineOpportunity`, which would only have patched this one entry
point). Basheer confirmed this explicitly rather than leaving it to
inference.

**One deliberate deviation from the Customer360 precedent, flagged and
confirmed with Basheer before building:** Customer360Screen's render was
already null-safe throughout (written that way originally for the
Directory-row-seed case), so it could paint instantly from a partial
account and fill in fields as they arrived. `OpportunityDetailScreen.tsx`
accesses `opp.stage`/`opp.status`/`opp.owner`/`opp.account`/`opp.sbu`
unconditionally in ~10 places — retrofitting null-safety through all of
them was judged not worth it, especially since the new endpoint returns
the entire opportunity in one response (no staggered field-by-field
arrival to justify the extra surface area). Used a **loading-spinner gate**
instead: if any of those five required fields aren't loaded yet, render the
screen's existing `LoadingPlaceholder` instead of the full detail body.
Only affects the new Reminder entry point (a few hundred ms); Pipeline
navigation is unaffected since its seed is already a complete object.

**Backend:**
- `opportunity/repository.py` — new `get_for_detail(opportunity_id)`,
  single-row fetch with the exact same eager-load/noload profile as
  `list_pipeline` (feeds the same `PipelineOpportunity` schema).
- `opportunity/service.py` — new `get_opportunity(id)`, raises
  `NotFoundError` if missing (same pattern as `account/service.py`).
- `opportunity/router.py` — new `GET /opportunities/{opportunity_id}` →
  `APIResponse[PipelineOpportunity]`.
- `test_opportunity_router.py` — new `TestGetOpportunity` class: 401
  unauthenticated, 404 not found, 200 full shape, null-safety for
  project/lead_source. 288 passed (284 + 4 new).

**Frontend:**
- `services/opportunities.ts` — new `getOpportunity(id)`.
- `types/api.ts` regenerated (same in-process TestClient→OpenAPI-dump
  approach as prior sessions); hand-written alias tail re-appended
  unchanged (49 additions, 1 deletion — the new path's generated types).
- `OpportunityDetailScreen.tsx` — `opp` changed from `useState(initialOpp)`
  to a `useQuery` (`initialData`/`initialDataUpdatedAt: 0`, same comment
  as Customer360's account query); new `opportunityId`/`initialOpportunity`
  (any-typed seed, same convention as Customer360's `initialAccount?: any`)
  /`onOpportunityUpdate` props replacing the old `opportunity` prop;
  always-mounted prefetch query keys switched from `opp.id` to the
  `opportunityId` prop (always defined, unlike `opp` during the loading
  gap); `applyOppPatch` switched from `setOpp` to
  `queryClient.setQueryData`; `openEditOpp`/`handleUpdateOpp` each gained an
  `if (!opp) return;` guard (closures don't inherit the render-body gate's
  TS narrowing); loading gate added right before the final render.
- `DemoApp.tsx` — `selectedOpportunity` widened to accept
  `PipelineOpportunity | { id; name }`; `handleSelectOpportunity` now takes
  either shape (Pipeline and the new Reminder click-through share it, same
  as `handleSelectAccount` already does); `OpportunityDetailScreen` now
  gets `opportunityId`/`initialOpportunity`/`onOpportunityUpdate` (the last
  one keeps `selectedOpportunity` upgraded to the full object once loaded,
  so the header `+Log` button's `accountId` keeps working regardless of
  entry point); `NextActionsScreen` wired with
  `onSelectAccount`/`onSelectOpportunity`.
- `NextActionsScreen.tsx` — `ReminderRow` gained the same two props;
  account name and (if present) opportunity name are now independently
  clickable, styled identically to Customer360's parent/child links
  (`color: primary.main`, pointer cursor, underline on hover).

`tsc --noEmit`/`npm run lint`/`npm run build` all clean.

**Back-navigation bug found during Basheer's manual verification, fixed in
the same pass:** `handleBack360`/`handleBackToOpportunities` in
`DemoApp.tsx` hardcoded their return view (`"customers"`/`"opportunities"`)
— a fine assumption when the Directory/Pipeline were each screen's only
entry point, but wrong now that Next Actions is a second entry point for
both. Fixed with two new `accountReturnView`/`opportunityReturnView` state
variables, captured at the moment of entry and consumed by the two Back
handlers. `handleSelectAccount`'s capture is guarded with
`if (view !== "customer360")` — Customer360Screen also calls it internally
for parent/child account links, and without the guard, re-navigating
between accounts inside that screen would overwrite the return view with
`"customer360"` itself, turning Back into a no-op (a regression from
today's "Back always returns to the Directory" behavior for that
multi-hop case). `handleSelectOpportunity` needed no such guard —
`OpportunityDetailScreen.tsx` has no internal opportunity-to-opportunity
navigation of its own.

**Manually verified by Basheer:** reminder → account click-through, and
reminder → opportunity click-through (with the brief loading spinner),
both confirmed working; the back-navigation bug above was the only issue
found, confirmed fixed after the patch; regression-checked Directory→
account→Back and Pipeline→opportunity→Back (unchanged), and multi-hop
parent/child navigation inside Customer360 still returns to the Directory
on Back (not stuck on the last-viewed account).

### Product Catalog collateral links — full write-up (`ab67209`)

Fourth and last item of the Milestone 1 gap-closure list. `Product.documents`
already rode on the generic `Document` entity (ADR-025) at the model layer,
but zero API surface existed (no schemas/service/router) and zero file-
upload infrastructure existed anywhere in the backend (no storage SDK
dependency, no multipart-upload endpoint precedent, and critically no
`SUPABASE_SERVICE_ROLE_KEY` or storage bucket configured in `backend/.env`
— only the anon key, JWT-auth only).

**Scope decision (`AskUserQuestion` before coding, 2026-07-12): URL-only
labeled links, not a real Supabase Storage file upload.** The *original
prototype* this was diffed against actually did the simpler thing —
"Array of labeled URLs (brochures/videos/clinical images), clickable" — not
binary uploads. Real uploads would have required Basheer to first
provision a Supabase Storage bucket and hand over a service-role key
(live-infra action outside this session), plus a new dependency and the
backend's first-ever multipart endpoint. Basheer chose the URL-only path.
Forward-compatible by construction: `storage_path` is just a `VARCHAR(500)`
— today it holds a pasted external URL, but nothing about the column
changes if real uploads get built later; only a new upload endpoint would
need to write a Supabase Storage path into that same column instead.

**Architecture question raised and settled before coding:** why a new
`document/` domain rather than folding this into the existing `product/`
domain? Answered by contrasting with `OpportunityItem`/`Split`/
`StakeholderLink` (single-parent sub-resources, correctly living inside
`opportunity/`'s own files) against `Document` (four nullable FKs —
account/project/opportunity/product — explicitly a shared, cross-cutting
entity per ADR-025, whose model already lives in its own
`document/models.py`, not inside any one parent's `models.py`). Keeping it
in its own domain means Account/Project/Opportunity document support,
if built later, is just new methods on the same `DocumentService`/
`DocumentRepository` (`list_by_account`, etc.), not duplicated logic
scattered across four domain folders.

**Backend:**
- `alembic/versions/0006_document_file_size_nullable.py` — `document
  .file_size_bytes` NOT NULL → nullable (URL-only links have no real byte
  size to record). **Applied to the live shared dev DB 2026-07-12** —
  verified via `information_schema.columns` (read-only). `alembic current`
  → `0006 (head)`. `docs/Physical-Schema.sql` updated to match (kept
  authoritative, per project rule).
- `document/models.py` — `file_size_bytes` column updated to match.
- New `document/schemas.py` — `DocumentCreate` (`file_name`, `file_type`,
  `storage_path`), `DocumentResponse`. `file_type` deliberately left an
  unconstrained free-form string (frontend offers a fixed Brochure/Video/
  Image/Other select for icon purposes only) rather than a DB CHECK
  constraint, so real uploads could later populate it with actual MIME
  types without a schema change.
- New `document/repository.py` — `DocumentRepository` (`product_exists`,
  `list_by_product`; create/delete inherited from `BaseRepository`).
- New `document/service.py` — `DocumentService` (`list_by_product`,
  `create_document`, `delete_document`), all 404 via `NotFoundError` when
  the product doesn't exist.
- New `document/router.py` — `GET`/`POST /products/{product_id}/documents`,
  `DELETE /documents/{document_id}`. Nested under `/products` rather than
  the generic `/documents?product_id=...` shape `docs/API-Catalog.md` §8.1
  originally sketched, to stay consistent with how every other sub-resource
  in this codebase is routed (items/splits/stakeholders all nest under
  their parent) — account/project/opportunity-scoped document endpoints
  aren't built yet, so a fully generic top-level endpoint would be
  unused generality today.
- `app/main.py` — registered `document_router`.
- New `tests/domains/document/test_document_router.py` — 9 tests: 401
  unauthenticated + 404 product/document-not-found + success cases for
  list/create/delete. One create-test needed the same `mock_db.add.
  side_effect` back-fill trick already established in
  `test_account_router.py` (`id`/`uploaded_at` are DB/ORM-populated at
  flush time, which a `MagicMock` session never actually does).

**Frontend:**
- New `services/documents.ts` — `listProductDocuments`, `createProductDocument`,
  `deleteDocument`.
- `types/api.ts` regenerated (same in-process approach as prior sessions;
  193 pure additions, 0 deletions).
- `ProductCatalogScreen.jsx` — new `CollateralLinksCard` component, rendered
  inside `ProductDetail`'s scrollable body below the existing "Product
  Details" card. Plain Tailwind, matching this file's own current style
  (one of the 3 files still pending its §9 MUI migration) — same one-off
  exception precedent as `CustomerDirectoryScreen.jsx`'s badges before its
  own migration. Lists links (type icon + label, clickable → opens URL in
  a new tab, × to delete), an "+ Add Link" toggle revealing an inline form
  (label, type select, URL) — no modal, since this is a small addition to
  an existing scrollable card, not a new screen.

`pytest` (297 passed = 288 + 9 new), `tsc --noEmit`/`npm run lint`/`npm run
build` all clean.

**Manually verified by Basheer:** add a link (all 4 types), click a link's
label (opens in new tab), delete a link, regression-checked Add/Edit
Product still works unaffected. No issues found.

## Files in flight
**None — working tree clean as of `ab67209` (2026-07-12).**
