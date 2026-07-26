# Phase 2E — RLS Build Estimate

**Status:** Scoped — ready to build, not yet started
**Date:** 2026-07-25
**Prepared by:** Basheer Kalanchera (with Claude Code)
**Depends on:** `Opportunity-Access-Hierarchy-Technical-Design.md` (approved 6-tier design),
`Phase-2E-Security-Architecture.md` (RLS mechanism, Approved), `ADR-035` (Opportunity SBU
stamping), `ADR-009` (needs rewrite, see §6)
**Purpose:** Turn the frozen Opportunity Access Hierarchy design into a concrete, table-by-table
build plan and estimate — per the technical design doc's own §17 recommendation, so this doesn't
get silently absorbed into Milestone 2 or the pilot rollout timeline unscoped.

---

## 1. Table enumeration — what actually needs an RLS policy

The technical design doc only worked through `opportunity` itself. Tracing every domain's actual
router/repository code (not assumed) surfaces three distinct buckets, of different build
difficulty:

### 1a. Clean — pure Opportunity children, keyed only by `opportunity_id`
`split`, `opportunity_item`, `opportunity_stakeholder` — each has no independent account/project
context, so their policy is a straight join-back to `opportunity`'s own visibility rule. Same
mechanical shape for all three.

### 1b. Structurally harder — polymorphic tables
`activity` and `document` both carry nullable `account_id` / `project_id` / `opportunity_id` on
the same row shape (one table serves all three contexts, confirmed in
`activity/models.py:14-22` and `document/models.py`). A row with `opportunity_id IS NOT NULL` must
be gated by the same 6-tier rule as its parent Opportunity; a row scoped only to `account_id`/
`project_id` must stay universally visible (see §2 for why). This needs a **conditional policy**
— `opportunity_id IS NULL OR <tier check via opportunity join>` — not the flat single-condition
`USING (...)` the architecture doc's only worked example shows.

`reminder` is one hop further: it points at `activity_id`, not `opportunity_id`, directly
(`activity/models.py:44`). Its policy has to join through `activity` and then, conditionally,
through `opportunity` — a two-hop RLS join. This is real, new complexity, and the most likely
place for a subtly-wrong policy; needs its own supporting index (`reminder.activity_id` is
already indexed — confirmed) and its own explicit test cases per tier.

### 1c. Flat SBU check — Product Catalog (added to scope, see §3)
`product` already has a non-nullable `sbu_id` (`product/models.py:16`) and no polymorphic
columns, so its policy is the same *shape* as Opportunity's Level 1-3 SBU check — no new
mechanism, just one more table using a pattern already being built. Confirmed the current
behavior this changes: `GET /products` takes `sbu_id` as an **optional, client-supplied** query
filter (`product/router.py:26`, `repository.py:38-39`) — nothing today stops a client from
omitting it or passing the other SBU's id and getting results back. RLS makes this enforced and
unforgeable instead of advisory, which is a real behavior change on `ProductCatalogScreen.jsx`
(today shows both SBUs' products to every role) — Admin/GM still need the "everything across both
SBUs" override, same branching Opportunity's Level 1-2 already requires.

### 1d. Explicitly out of scope — restricting these would break ADR-035, not just be unneeded
`account`, `project`, `stakeholder`, `installed_asset`, and any `activity`/`document` row scoped
only to account/project (not opportunity). ADR-035 depends on these staying visible across SBUs —
e.g. a Critical Care rep must see a shared Account/Project record to open her own Opportunity
under it (Technical Design §10's flow). Restricting them would silently break that multi-SBU-per-
customer model, not just be redundant caution.

### 1e. Deferred — confirmed with Basheer, 2026-07-25
`target_plan` / `coverage_plan` are Milestone 2 features — **RLS for Phase 2E covers Milestone 1
features only.** These stay globally readable (unchanged) until their own milestone scopes
whether the 6-tier rule should apply to them too. Not an oversight — an explicit boundary.

---

## 2. Why the polymorphic tables matter more than they look

Without a conditional policy on `activity`/`document`/`reminder`, restricting `opportunity` alone
does not actually close the Opportunity visibility gap — a Sales Staff user blocked from seeing
an Opportunity via Pipeline could still call `GET /opportunities/{id}/activities` directly (it
queries `activity` by `opportunity_id`, not via a join enforced by Opportunity's own RLS) and read
its notes anyway. This is exactly the "one screen has the filter, another forgot it" leak class
the Technical Design doc's §11 says RLS-at-the-database-layer is supposed to close by
construction — leaving these three tables unrestricted would reopen it silently. They are not
optional polish on top of the Opportunity policy; they're part of making the Opportunity policy
actually mean something.

---

## 3. Role table — resolved naming plan

Confirmed by grep: `role_name` is used as a security/authorization check in exactly one place in
the whole codebase — the Catalog write-gate (`{"General Manager", "Admin"}` in
`product/service.py:8` and `ProductCatalogScreen.jsx:17`), which references neither "Sales
Manager" nor "Sales Executive". The rename below is therefore low-blast-radius: seed data and
display labels only, no gating logic to update.

**Decision (Basheer, 2026-07-25): build all 6 as distinct, clearly-named tiers — no reused
titles.**

| Today (`Seed-Data.sql:88-93`) | Becomes | Action |
|---|---|---|
| Admin | Admin | unchanged |
| General Manager | General Manager | unchanged |
| Sales Manager | **SBU Manager** | rename existing row (Level 3) |
| — | **Area Manager** | new row (Level 4) |
| — | **Sales Manager** | new row, new meaning (Level 5) |
| Sales Executive | **Sales Staff** | rename existing row (Level 6) |

---

## 4. User assignment — no CRUD exists for `user_profile` today (new finding)

Raised by Basheer during scoping, confirmed by code: there is **no write path for `user_profile`
anywhere** — `GET /users` (`master_data.py:91`) is read-only (powers owner-picker dropdowns),
`GET /auth/me` returns only the caller's own profile, and no frontend screen exists to edit
another user's `role_id`/`sbu_id`/`zone_id`/`manager_id`. Every other domain in this app has a
full write path; this one doesn't.

**Recommendation:** don't block Phase 2E on building this. The initial tier assignment (§1 of the
Technical Design doc — a handful of real staff) is a one-time data change, reasonably done via
direct SQL/Supabase dashboard the same way test accounts have been created all along (see
`active_progress.md`'s 2026-07-13 session). But since Decision #9 commits to populating tiers with
*real, ongoing* staff assignments (not placeholders), an **Admin/GM-gated "Edit User" screen**
(role_id, sbu_id, zone_id, manager_id fields on an existing user — not full account creation,
which still goes through Supabase Auth signup) is worth scoping as a **fast-follow**, sized
separately below, not bundled into the RLS build itself. It also happens to double as a useful
RLS test case (verifying Admin can write cross-tenant `user_profile` rows once `cabio_app` is
live).

---

## 5. Build environment discipline (confirmed with Basheer, 2026-07-25)

Solo developer, solo tester (testing via login as each of the demo role accounts) — dev DB is an
acceptable place to build this, **not** because the risk is smaller, but because two disciplines
mitigate the specific risk RLS introduces (which is different from the generic "shared live DB"
caution in `CLAUDE.md` about permanent `Activity` rows):

1. **Verify before cutover, not after.** The instant the app's `DATABASE_URL` points at
   `cabio_app`, RLS is enforced on every enabled table at once — Postgres RLS is default-deny for
   non-owner roles, so one missing policy can 500 the whole app, not just leak/hide rows. Build
   and check every policy via a **separate `psql` session**
   (`SET ROLE cabio_app; SET LOCAL app.current_user_id = ...`) against the existing superuser
   connection first. Only flip the app's own `DATABASE_URL` once every table in §1a/1b/1c has a
   verified policy.
2. **Never leave a cutover half-done between sessions.** This DB is also what client POCs get
   demoed against (2026-07-21 session). Either finish a cutover and verify all role logins in the
   same session, or roll back to the superuser connection before stopping.

Both `ENABLE/DISABLE ROW LEVEL SECURITY` and `CREATE/DROP POLICY` are trivially reversible — worst
case is a manual undo, not data loss.

---

## 6. Full task list

| # | Task | Notes |
|---|---|---|
| 1 | Migration: `user_profile.manager_id`, role table rename + 2 new rows, `cabio_app` role + grants | rename is data-only (`UPDATE role_name`), no FK churn |
| 2 | Assign real staff to Area Manager / Sales Manager (Level 5) tiers, set `manager_id` | Basheer's call on names/reporting lines, not build work |
| 3 | `db/session.py` + `dependencies.py`: 4-var `set_rls_context()`, 4 SQL helper functions | small, mechanical, matches architecture doc exactly |
| 4 | RLS policies: `opportunity`, `split`, `opportunity_item`, `opportunity_stakeholder` (§1a) | straightforward, all one join-back shape |
| 5 | RLS policies: `activity`, `document`, `reminder` (§1b) — conditional/two-hop | the real unknown; write + verify per tier, per table, individually |
| 6 | RLS policy: `product` (§1c) | flat SBU check + Admin/GM override, reuses the Level 1-3 pattern |
| 7 | Local verification loop (side `psql` session, all 6 roles × every table above) | per §5's discipline, before any `DATABASE_URL` cutover |
| 8 | Cutover to `cabio_app` on dev, live retest as all 4 currently-real roles | Area Manager/Sales Manager tested via reassigning an existing test account, no separate new logins needed |
| 9 | Doc fixes: `Physical-Schema.sql` (missing `sbu_id`), `Backend-Implementation-Standards.md` (stale `managing_sbu_id`), ADR-009 rewrite (2-tier → 6-tier), `Phase-2E-Security-Architecture.md` sample-policy fix, `CLAUDE.md` zone list (missing Bangalore) | all already enumerated in Technical Design §12 |
| 10 | *(fast-follow, not blocking)* Admin/GM "Edit User" screen | §4 above — separate estimate, do after RLS core lands |

Items 4 and 6 are mechanically simple and low-risk. Item 5 is where the real time goes — three
tables, each needing a correct conditional policy, individually verified against all 6 tiers
before cutover.

---

## 7. Sequencing

No dependency on Deployment Phase A (UAT project) — building and proving this out on the local
dev DB, per §5's discipline, can start now. UAT becomes the place this gets *re-proven* before
Prod go-live (`Deployment-Topology.md`), not where it's first built.
