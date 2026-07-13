# Regression Test Plan — Changes Since June 30, 2026

**Purpose:** full manual regression pass across the whole application ahead
of the July 20 demo checkpoint. Covers ~68 commits: the MUI + TypeScript +
React Query migration, Sprint 2 backend/frontend build-out (Opportunity,
Activity, Reminders, Next Actions), the backend concurrency fix, and all 6
Milestone 1 gap-closure items (most recently the Catalog role gate).

**How to use this doc:** Part A is the highest-risk, most-likely-to-break
surface — test it first and thoroughly. Part B is a full screen-by-screen
sweep for baseline coverage. Part C is cross-cutting behavior that spans
screens. Part D is a list of things that will *look* broken but aren't —
check it before filing anything as a bug.

---

## Before you start

**Test accounts** (live shared dev DB):
| Role | Login |
|---|---|
| Sales Executive | Your own login (`display_name` currently shows "TEST - Sales Executive" — cosmetic only, revert whenever convenient) |
| Sales Manager | `manager@cabio-demo.com` |
| General Manager | `gm@cabio-demo.com` |
| Admin | `admin@cabio-demo.com` |

**Environment:**
```
cd backend && uvicorn app.main:app --reload --port 8000
cd sales-os-app && npm run dev
```

**Data-safety note:** `backend/.env` points at the live shared Supabase dev
DB — this is real, persistent data, not a disposable test DB. `Activity`
rows have no DELETE endpoint (immutable by design), so anything you log
during this pass stays forever. **Prefix any activity notes/reminders you
create with `REGRESSION TEST -`** so they're identifiable later and don't
get mistaken for real demo data. Prefer editing/viewing existing seeded
records over creating new ones where the test allows it.

---

## Part A — High-risk areas (test first, test thoroughly)

### A1. Backend-wide concurrency fix (`2bb41b4`)
All 48 route handlers were converted from `async def` to `def` (root-cause
fix for Activity-tab slowness — blocking sync DB calls were serializing on
Uvicorn's single event loop). This touches every endpoint in the app.
- [ ] Open Customer 360 for any account — it fires ~12 concurrent requests
      on mount (account, counts, stakeholders, projects, opportunities,
      assets, zones, statuses, etc.). Confirm fast load (not the old
      multi-second stall) and that **every** tab's data is correct, not
      just fast — a threading regression would show as wrong/missing data
      under concurrency, not just slowness.
- [ ] Open Opportunity Detail from Pipeline — confirm all 4 tabs
      (Products/Splits/Stakeholders/Activity) show correct data
      immediately on tab click (they're prefetched on mount).
- [ ] General smoke: log in, click through several screens rapidly: no
      random 500s, no data from the wrong record appearing (a classic
      symptom of a concurrency bug would be account A's data flashing on
      account B's screen).

### A2. Product Catalog — role gate + collateral links (`42fa050`, `ab67209`)
Already verified by Basheer per-role; re-confirm as part of the full sweep.
- [ ] Sales Executive / Sales Manager: `+ Add` and `Edit` buttons hidden.
- [ ] General Manager / Admin: both buttons visible; add a product, edit a
      product — both succeed.
- [ ] Collateral Links card on Product Detail: add a link (all 4 types —
      Brochure/Video/Image/Other), click a link's label (opens in new tab),
      delete a link. **Not role-gated** — confirm this is still true for
      all 4 roles (by design, only Add/Edit Product is gated).
- [ ] `curl -X POST /api/v1/products` with a Sales Executive/Manager token
      → 403. Same with GM/Admin token → 201. (Confirms server-side
      enforcement, not just UI-hidden.)

### A3. Opportunity Detail — field trio + 4-tab prefetch + status gates
(`b662751`, `2f7e074`, `01cead0`, `3619295`)
- [ ] Overview tab shows: Demo Start + Demo End (same row), Expected
      Closure (next to PO Number), SBU, Lead Source, Associated Project.
- [ ] Edit modal: Lead Source dropdown (set, clear-to-blank, save) — this
      is the only backfill path since Quick Lead only sets it once at
      creation; a missing Lead Source silently blocks the Lead→Qualified
      stage gate, so this write path matters functionally, not just
      cosmetically. Demo End Date field (set/edit/save).
- [ ] Associated Project — display-only, plain text, **no click-through**
      (deliberately deferred — don't file as a bug).
- [ ] Change status on an opportunity that has the BR-OP-02/03/05
      status-gated fields (Hold Reason, Loss Reason, etc.) — confirm the
      form actually has fields for whatever the target status requires
      (this was the demo-blocking bug found and fixed `2f7e074` — status
      changes used to be un-completable from this screen).
- [ ] Try changing a WON or LOST opportunity's status back to Active —
      should **fail** ("Cannot change status of a LOST opportunity"). This
      is correct/by-design (terminal states for audit integrity), not a
      bug.
- [ ] Reactivation Overdue badge shows on both Opportunity Detail and
      Pipeline for a qualifying opportunity.
- [ ] Products/Splits/Stakeholders tabs: add/edit/remove an item on each;
      confirm the Splits sum validation (BR-FIN-03 auto-sync) still works.
- [ ] Link a new Stakeholder to the opportunity, then unlink it — confirm
      it doesn't corrupt or duplicate the account-level Stakeholder record
      (this endpoint does a full bulk-replace under the hood — a known
      audit-trail risk documented in code comments, not directly
      user-visible, but worth confirming behavior looks sane).

### A4. Reminder click-through (`ac6d008`)
- [ ] From Next Actions, click a reminder's **account** name → opens
      Customer 360 for that account.
- [ ] From Next Actions, click a reminder's **opportunity** name → opens
      Opportunity Detail (brief loading spinner is expected — this screen
      now does a real fetch-on-mount for this entry point). Confirm it's
      NOT blank/missing fields once loaded.
- [ ] From the opportunity detail opened via reminder, click **Back** →
      returns to Next Actions (not to Pipeline). This exact bug was found
      and fixed during verification — worth re-confirming.
- [ ] From Pipeline → open an opportunity → Back → returns to Pipeline
      (unchanged baseline behavior).
- [ ] From Customer Directory → open an account → Back → returns to
      Directory (unchanged baseline behavior).
- [ ] Inside Customer 360, click a parent/child account link a couple of
      hops deep, then click Back → returns to the Directory, not stuck on
      an intermediate account (multi-hop navigation edge case that was
      specifically guarded against regressing).

### A5. Customer 360 — Parent Customer + CustomerType (`87fde5a`, `95e118a`, `70cf978`)
- [ ] Overview tab shows Customer Type (8-value enum, formatted as Title
      Case) and Parent Customer (clickable) + Child Accounts (chips, if
      any).
- [ ] Edit Customer modal: change Customer Type, save, confirm it sticks;
      clear it to blank, save, confirm it clears (not left stale).
- [ ] Edit Customer modal: set a Parent Customer via the Autocomplete
      search; try to set an account as its own parent or create a cycle
      (A→B→C→A) — should be rejected.
- [ ] After setting a parent, immediately check the **parent's** Child
      Accounts list (open the parent account) — should show the new child
      without a stale/missing entry (this was a real cache-invalidation
      bug that was found and fixed — worth specifically re-testing, not
      just trusting it works).
- [ ] Customer Directory: "Parent: X" badge and Customer Type badge both
      show correctly on directory cards; New Customer modal has both
      fields (Parent lookup + Customer Type select) and they save
      correctly.

### A6. Migrated screens — styling + data correctness spot-check
Screens that went through the MUI + React Query rewrite (higher risk of
subtle regressions than untouched code): `main.tsx`, `LoginScreen`,
`FormModal`, `ActivityTimeline`, `NextActionsScreen`, `LogActivityModal`,
`OpportunityPipelineScreen`, `QuickLeadModal`, `OpportunityDetailScreen`,
`Customer360Screen`, `DemoApp.tsx`, `ErrorBoundary`.
- [ ] All of the above render with consistent MUI styling (no stray
      Tailwind classes, no broken layout) — see Part D for the 3 files
      that are **expected** to still look different (not migrated yet).
- [ ] Trigger an error boundary (e.g. temporarily break a network call, or
      just confirm you know what the fallback UI looks like) — not
      critical, but `ErrorBoundary.tsx` was migrated recently.
- [ ] Activity Timeline renders as cards (not the old list style) with
      correct activity type labels (Visit/Call/Email/Meeting/Note/Manager
      Note) — this depends on a backend enum fix (`bb671bc`), worth
      confirming no activity shows a blank/wrong type.

---

## Part B — Full screen-by-screen sweep

### B1. Login
- [ ] Valid credentials → signs in, lands on default view.
- [ ] Invalid credentials → clear error, no crash.
- [ ] Sign out → returns to login form.

### B2. Customer Directory (legacy Tailwind — see Part D)
- [ ] List loads, search works, pagination works.
- [ ] New Customer modal: create an account with all fields including
      Parent + Customer Type; confirm it appears in the list.
- [ ] Click into an account → opens Customer 360.

### B3. Customer 360
- [ ] All tabs load: Overview, Activity (position 2, not last), Projects,
      Opportunities, Stakeholders, Installed Assets.
- [ ] Edit Customer modal: full save round-trip on every field.
- [ ] New Stakeholder / Edit Stakeholder: save round-trip. NPS field
      accepts a number (no range enforcement yet — see Part D, not a bug).
- [ ] Log Activity from this screen's own `+ Log` entry point — confirm
      mandatory Next Action capture (BR-ACT-04) blocks submission if
      empty, **except** for Manager Note activity type (exempted).

### B4. Product Catalog (legacy Tailwind — see Part D)
- [ ] Covered in depth under A2 — spot-check list/search/filter/pagination
      here.

### B5. Project Directory (legacy Tailwind — see Part D)
- [ ] List loads, click into a project → detail view shows inline.
- [ ] Log Activity via `DemoApp.tsx`'s header `+ Log` button (this screen
      doesn't have its own modal mount — uses the shared header button,
      confirm the "Project: {name}" chip shows correctly).
- [ ] Navigate away (sidebar) and back to Project Directory — confirm it
      does **not** show a stale previously-open project's detail view
      stacked oddly (this was a real bug, found and fixed).

### B6. Opportunity Pipeline (Kanban)
- [ ] Loads, stage/status columns correct, filter by stage/status/owner
      works.
- [ ] Reactivation Overdue badge shows where expected.
- [ ] Click an opportunity → opens Opportunity Detail with full data
      (no loading gap — Pipeline hands off a complete object).
- [ ] Create a lead via Quick Lead (see B9) → confirm it appears on the
      Pipeline in the right stage/column.

### B7. Opportunity Detail
- [ ] Covered in depth under A3.

### B8. Next Actions
- [ ] Pending / Completed toggle — confirm each tab shows only the
      correct set (the `include_completed` filter was fixed from additive
      to exclusive — completed items should no longer leak into Pending).
- [ ] Reminder click-through — covered under A4.

### B9. Quick Lead wizard
- [ ] Create a new lead against an **existing** account (no inline account
      creation — by design, not a gap; reps create the account first via
      Account Management).
- [ ] SBU-filtered product dropdown shows the right products for the
      selected SBU.
- [ ] Resulting opportunity appears on the Pipeline in the Lead stage with
      correct Lead Source.

### B10. Log Activity modal
- [ ] Test from all 3 independent mount points: Customer 360, Opportunity
      Detail, and the shared `DemoApp.tsx` header button (used by Project
      Detail). Confirm all 3 save correctly and show up on the
      respective Activity tab/timeline.
- [ ] Mandatory Next Action (BR-ACT-04) enforced on all activity types
      except Manager Note.
- [ ] 6 channel types available (Visit/Call/Email/Meeting/Note/Manager
      Note) — prototype's 12-purpose taxonomy is **not** present, this is
      known/scoped (see Part D).

### B11. Activity Timeline
- [ ] Renders correctly wherever it's embedded (Customer 360, Opportunity
      Detail, Project Detail) — card style, correct type/date/note text.

---

## Part C — Cross-cutting checks

- [ ] **Cache staleness:** open an account, note a field, edit that same
      field from a different tab/window (or via the parent/child
      relationship), return to the first tab — confirm it picks up the
      change within a few seconds rather than showing stale data
      indefinitely (there's a documented 30s global `staleTime`; a couple
      of specific `initialData` staleness bugs were already found and
      fixed for Parent/Child accounts and Opportunity detail — worth
      spot-checking the pattern holds elsewhere too).
- [ ] **Role-based access:** confirm the Catalog Add/Edit gate is the
      **only** role restriction anywhere in the app right now — every
      other screen/action should behave identically regardless of which
      of the 4 roles is logged in (RLS/broader RBAC isn't built yet — see
      Part D, this is expected, not a gap to fix here).
- [ ] **Terminal opportunity states:** WON/LOST opportunities reject
      status changes back to Active (by design, confirmed above under A3
      — re-list here since it's a cross-screen invariant, not just an
      Opportunity Detail quirk).

---

## Part D — Known gaps: do NOT file these as bugs

- **`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
  `ProjectDirectoryScreen.jsx`** still use the old Tailwind styling —
  they will look visually inconsistent with the rest of the MUI-migrated
  app. This is tracked, in-progress work (§9 migration backlog), not a
  new regression.
- **NPS Score** on Stakeholders accepts any number in -100..100 (backend
  constraint), no frontend 0-10 clamp — a real gap, but a pre-existing,
  undecided one, not something this regression pass should catch as new.
- **Quick Lead**: no inline account creation, no type-ahead search beyond
  the first 100 accounts, no auto-split/zone-routing, no category-tabbed
  product picker. All deliberately out of Phase 1 scope.
- **Log Activity**: no auto-suggested follow-up text; 6 generic channel
  types instead of the prototype's 12 business-specific purposes. Known,
  not a regression.
- **BR-OP-06 Stalled Opportunity Detection** (180-day auto-stall): not
  implemented at all, no scheduled job exists. Won't show up in any UI
  flow — don't go looking for it.
- **Demo Outcome, Handover Information, Delivery Date/Installation Site**:
  formally mandated fields with zero schema support today. Not testable
  because they don't exist yet.
- **Associated Project** on Opportunity Detail is display-only, no
  click-through to the project — deliberately deferred.
- **Manager grouping** on Next Actions (reps grouped under their manager
  with pending counts): not built — no `manager_id`/reporting-line field
  exists on `user_profile` at all.
- **Stalled/incomplete stage gates**: Demo→Clinical-Eval and half of
  Order→Delivery stage gates are not enforced server-side yet (5 of 6
  `BR-OP-01` gates are; these 2 pieces are the known exceptions). Don't
  expect the form to block these specific transitions.

---

## Appendix — Recent commit reference

For context on *why* something behaves a certain way, `.claude/active_progress.md`
has full write-ups for every Milestone 1 item (Parent Customer, CustomerType,
Opportunity Detail trio, Reminder click-through, Product Catalog collateral
links, Catalog role gate) plus the backend concurrency fix and the `api.ts`
regeneration cleanup. `docs/Prototype-Production-Parity-Audit.md` is the
authoritative source for what's in/out of Milestone 1 vs. deferred to
Milestone 2.
