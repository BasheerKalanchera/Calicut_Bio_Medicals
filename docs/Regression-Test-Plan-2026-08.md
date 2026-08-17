# Regression Test Plan — Changes Since July 20, 2026

**Status: COMPLETED 2026-08-17.** Every Part A item (A0–A9), plus B5/B8/B9
and both Part C cross-cutting checks, passed — nothing broken found.
`docs/Progress-Archive-2026-08.md`'s 2026-08-17 entry has the full
narrative (notable clarifications, not bugs: Basheer K's Admin role
correctly excludes him from scoped picker dropdowns despite the
`manager_id` visibility fold; Arun Adarsh's empty Pipeline was real data
thinness, not an RLS gap; Shruthi's cross-zone Lost-status split
confirmed A7 live). Two orphaned test zones (`Darwad`, `REGRESSION TEST
ZONE`) found and deleted directly from Dev during the A2 pass — no real
data attached, closure table rebuilt and verified clean afterward. One
originally-listed Part C check ("Catalog gate is the only role
restriction anywhere") was dropped as stale — its premise predates the
Zone Hierarchy RLS rebuild this very doc exists to test. Demo has since
moved to 2026-08-18 evening.

**Purpose:** manual regression pass ahead of the Cabio leadership demo
(tentatively Monday evening, 2026-08-17). Covers everything shipped since
the last regression pass (`docs/Regression-Test-Plan.md`, July 20
checkpoint): Multi-Zone Milestone 1, the Zone Hierarchy rebuild (tree +
closure-based RLS), the Sales Manager Tier Collapse, User Deactivate/
Reactivate, ZonePicker + Territory Admin, Buyback free-text + unified
item picker, real Document Upload, Product Catalog + Customer Directory
MUI migrations, the Split participant zone-restriction drop, and the
Admin/GM manager-SBU fix. ~24 commits, none of it yet on `uat`.

**How to use this doc:** Part A is the highest-risk surface from this
stretch of work — test it first, in order. The RLS/tier-visibility stack
was rewritten three separate times (`0018`, `0019`, `0021`), so it gets
the most weight. Part B points back at the July 20 plan for baseline
screens that haven't materially changed. Part C is known gaps — don't
file these as new bugs. Given the time crunch, if you can only do one
thing before the demo, do A0 + A1.

---

## Before you start

**⚠ Two blockers found while preparing this doc, not yet resolved:**
1. **Central Kerala zone still shows `is_active = true`** on live Dev.
   This was believed resolved (deprecated) as part of the 2026-08-15
   Territory build-out — the live data says otherwise. Confirm intent
   before the demo: either deprecate it now via Territory Admin, or
   update the record if there's a reason it's still active.
2. **No active SBU Manager account exists anywhere in the system.** The
   only SBU Manager row (`Test - SBU Manager`) is deactivated. This tier
   cannot be logged into — not for this regression pass, not for the
   demo. Either reactivate that fixture via User Directory, or set up a
   real SBU Manager account, before doing anything else below.

**Test accounts** (live shared Dev DB — real people, not fixtures, since
the old `*@cabio-demo.com` "Test - X" fixtures are now deactivated by the
User Deactivate/Reactivate work):

| Role | Who | SBU | Zones |
|---|---|---|---|
| Sales Staff | Amit R | Critical Care | (owner-only visibility, zone-independent) |
| Area Manager | Fazal | Imaging | North Kerala + Mangalore |
| Area Manager | Nishad K V | Critical Care | North Kerala |
| Area Manager | Arun Adarsh | Critical Care | South Kerala |
| Area Manager | Shruthi | Imaging | Bangalore |
| SBU Manager | **none active — see blocker #2 above** | — | — |
| General Manager | Haroon Sidheeq | Imaging (placeholder, ignored) | — |
| Admin | Basheer K / Abdul Latheef P | Imaging (placeholder, ignored) | — |

**Environment:**
```
cd backend && uvicorn app.main:app --reload --port 8000
cd sales-os-app && npm run dev
```

**Data-safety note:** same as always — live shared Supabase Dev DB, not
disposable. `Activity` rows have no DELETE endpoint. Prefix anything you
create with `REGRESSION TEST -`. Prefer viewing/editing existing seeded
records over creating new ones.

---

## Part A — Highest-risk surface (test in order)

### A0. Sales Manager Tier Collapse RLS test — prerequisite, do this first
Not repeated here in full — see `.claude/active_progress.md`'s "Current
task" section and `docs/Sales-Manager-Tier-Collapse-Implementation-Plan.md`.
Basheer K → Fazal manager reassignment, confirm the two South-Kerala
opportunities appear on Fazal's Pipeline via the new `manager_id` fold,
revert the manager change afterward. This is the one item that's an
**unverified live RLS policy change**, not just a manually-untested
feature — treat it as a blocker, not a nice-to-have.

### A1. Zone Hierarchy / closure-based RLS — the rewritten visibility engine
`0019` moved the Area Manager RLS branch from flat zone-list matching to
`zone_closure`-based subtree matching; `0018` moved a manager from a
single `zone_id` to a multi-zone `user_zone` list in the first place.
- [ ] Log in as **Fazal** (North Kerala + Mangalore). Confirm Pipeline /
      Customer Directory / Account Management all show accounts and
      opportunities from **both** zones, not just one — this is the
      multi-zone part of `0018`, easy to silently regress to
      single-zone.
- [ ] Log in as **Nishad K V** (North Kerala only, Critical Care).
      Confirm he sees North Kerala Critical Care data and **not**
      Fazal's Imaging data in the same zone (SBU boundary still holds
      alongside the zone rewrite).
- [ ] Pick a **parent zone** in a filter — e.g. filter Customer Directory
      or Pipeline by "Kerala" (not North/South Kerala specifically) as
      Admin/GM. Confirm it returns accounts/opportunities from **all**
      descendant zones (North Kerala, South Kerala, Central Kerala) —
      this is the `zone_closure` subtree-match fix from `4f814e3`; before
      that fix, a parent-zone pick silently returned nothing.
- [ ] Same check filtering by "Karnataka" — should return Bangalore,
      Coastal Karnataka, Central Karnataka, South Karnataka data
      together.
- [ ] Log in as **Arun Adarsh** (South Kerala, Critical Care) and
      **Shruthi** (Bangalore, Imaging) — quick sanity pass, confirm each
      sees only their own zone/SBU combination, nothing bleeding across.

### A2. Territory Admin + ZonePicker — new screens, new shared component
- [ ] Territory Admin tree view loads, children sorted alphabetically,
      matches the real hierarchy (State → Zone/Cluster → District).
- [ ] Add a new zone under an existing parent — succeeds, appears in
      tree immediately.
- [ ] Try creating a zone with a name that already exists under the same
      parent — should fail with a clean error (409), not a raw 500.
- [ ] Edit a zone, clear its Parent Zone via the "top-level zone"
      checkbox — confirm it actually moves to root (this silently did
      nothing before the fix).
- [ ] Type a zone name that exists elsewhere in the tree under a
      *different* parent — confirm the soft warning appears but doesn't
      block saving.
- [ ] Toggle "Show/Hide Coverage" — assignee chips appear, labeled by
      role (Area Manager's real-visibility assignment should read
      differently from a Sales Staff responsibility-only record).
- [ ] "Refresh Territory Visibility" button — runs without error.
- [ ] Pick a zone via the shared `ZonePicker` (Customer Directory,
      Pipeline filter, Customer360, User Directory, Territory Admin's own
      Parent Zone field) — type-ahead search resolves, breadcrumb path
      displays correctly, and it defaults to the logged-in user's own
      zone where expected.
- [ ] New Customer form — Zone field pre-fills from the logged-in user's
      zone.

### A3. User Deactivate/Reactivate
- [ ] Deactivate a test user from User Directory (not a real person's
      account) — confirm they can no longer log in at all (the
      `AuthContext.tsx` login-gate fix).
- [ ] Confirm that deactivated user does **not** appear in the Next
      Action / Split participant / Opportunity owner assignment pickers.
- [ ] Confirm User Directory's own list and the Pipeline Owner filter
      **can** show them via "Show Inactive" — existing deals owned by a
      deactivated user should stay findable.
- [ ] Deactivate a manager with direct reports (or find one already
      deactivated) — confirm "reports to X" labels still render
      correctly elsewhere in the app (not blank), and that the Manager
      dropdown lists inactive managers too (red/disabled), so existing
      assignments still display.
- [ ] Reactivate a deactivated user — confirm login access is restored.
      **This is also how you unblock the SBU Manager gap above —
      reactivate `Test - SBU Manager` here if no real account exists
      yet.**

### A4. Buyback free-text + unified item picker
Touches every opportunity entry point, so check more than one:
- [ ] From Customer360's "Add Opportunity" and from Quick Lead, add one
      Product item, one Accessory item, and one Buyback free-text line
      item to the same opportunity — all three save and display
      together correctly.
- [ ] Open an **older** opportunity (created before this change) — items
      still display correctly, no broken rendering from the data-shape
      unification.

### A5. Document Upload (real Supabase Storage, not a stub anymore)
- [ ] Upload a document on an Opportunity — appears in the list, opens/
      downloads correctly, stays attached to the right opportunity.

### A6. Product Catalog + Customer Directory — MUI migrations
- [ ] Product Catalog: list/search/filter/pagination all work; Add/Edit
      buttons still correctly gated to GM/Admin only (this role gate
      predates the migration — confirm it survived).
- [ ] Customer Directory: list/search/pagination work; New Customer
      modal has Parent Customer, Customer Type, and Zone (pre-filled)
      fields, all save correctly; zone filter uses subtree matching
      (covered under A1, re-confirm from this specific screen).

### A7. Split participant picker — zone restriction dropped
- [ ] Split a deal with a colleague in a **different zone, same SBU** —
      should now succeed (previously blocked).
- [ ] Confirm a **cross-SBU** split attempt is still blocked — this was
      deliberately *not* reopened (ADR-037/BR-FIN-06).

### A8. Admin/GM manager-SBU fix
- [ ] Change a user's SBU in User Directory where their manager is
      Admin/GM — should now succeed (previously failed with "Manager
      must belong to the same SBU as the user").
- [ ] **Known, do-not-file:** the same action where the manager is a
      *normal* (non-Admin/GM) person may still fail — separate,
      already-tracked gap (see Part C).

### A9. Default landing screen
- [ ] Log in — lands on Pipeline, not Account Management.

---

## Part B — Baseline sweep (screens unchanged since July 20)

Login, Customer 360, Project Directory, Opportunity Detail (4-tab
prefetch, status gates), Next Actions, Quick Lead wizard, Log Activity
modal, Activity Timeline — none of these were touched in this stretch of
work. `docs/Regression-Test-Plan.md`'s Part A3/A4/B still applies as
written for baseline confidence. **Skip re-running it in full if time is
short** — Part A above is the actual delta since that doc was written.

---

## Part C — Known gaps: do NOT file these as new bugs

- **Activity Notes field blocks multi-line entry.** `FormModal.tsx`'s
  Enter-key handler fires on `TEXTAREA` as well as `INPUT`, so a
  multiline `TextField` (e.g. Log Activity's Notes field) can't take a
  line break. Root cause known, one-line fix identified, not yet applied
  as of this doc.
- **`ProjectDirectoryScreen.tsx` doesn't invalidate React Query caches**
  on opportunity create/update — a new/edited opportunity from Project
  Detail won't show up on Pipeline or Customer 360 without a hard
  refresh. Known, deferred.
- **`ProjectDirectoryScreen.jsx` is still Tailwind-styled** — the one
  remaining file in the MUI migration backlog. Visual inconsistency
  only, not a functional bug.
- **User Directory: moving a user with a *normal* (non-Admin/GM) manager
  to a different SBU may fail** with the same-SBU manager-match error —
  the form resends the untouched `manager_id` on every save. Known,
  root-caused, not yet fixed (distinct from the Admin/GM case, which
  A8 above confirms as fixed).
- **NPS Score** on Stakeholders accepts any number in -100..100, no
  frontend 0-10 clamp — pre-existing, undecided, not new.
- Everything in `docs/Regression-Test-Plan.md`'s Part D still holds
  (stage-gate gaps, Quick Lead scope limits, etc.) — not repeated here.

---

## Appendix — Commit reference for this stretch

`2739bb0` Pipeline zone filter · `ce61dc2` Multi-Zone Milestone 1 ·
`59baa6b` Customer Directory MUI migration · `49c4c1d` Document Upload ·
`1e8bb5a` Zone Hierarchy backend · `c6c287f` default landing screen ·
`aca2e9c` Admin/GM manager-SBU fix · `f6a2a11` Territory Admin screen ·
`8f4526e` Product Catalog MUI migration · `781aa07` Product Lifecycle ·
`8aff9cd` Account Management zone filter · `bc49eba` Split participant
zone-restriction drop · `8ab0c4e` Buyback free-text + unified picker ·
`4f814e3` ZonePicker + Territory Admin coverage view · `980d81b` User
Deactivate/Reactivate · `5367557` Sales Manager Tier Collapse.

Full write-ups for each: `docs/Progress-Archive-2026-08.md`.
