# Opportunity Access Hierarchy — Technical Design

**Status:** Draft — for review before freeze
**Date:** 2026-07-24
**Prepared by:** Basheer Kalanchera (with Claude Code)
**Depends on:** `Opportunity-Access-Hierarchy-Proposal.md` (business-level proposal, approved by
Cabio leadership 2026-07-23) — this document is the technical design that implements it.
**Related:** `Phase-2E-Security-Architecture.md` (RLS mechanism, Approved but unbuilt),
`ADR.md` (ADR-035, ADR-018, ADR-024, ADR-009), `Business-Rules.md` (BR-FIN-01),
`Deployment-Topology.md` (go-live sequencing)

**Revision (2026-07-25):** added §5 (`zone_id` RLS session-context propagation) and §6
(`user_profile.manager_id` for Level 5 team visibility) — both closing gaps found during
review. Decision (Basheer, 2026-07-25): build all 6 tiers now with real staff assigned to
whichever tier matches their actual current role, not placeholder tiers populated later — see
§2 and §6 for why that makes both additions load-bearing rather than optional. **Same-day
follow-up correction:** §5's zone check now joins through `account.zone_id` (the customer's fixed
location), not the opportunity owner's `zone_id` — the earlier draft would have reintroduced the
same instability §8 already fixed for SBU. §6 expanded to cover Level 6 too, and to spell out why
neither Level 5 nor 6 needs an independent SBU/Zone check.

---

## 1. Approved Reporting Structure

| Level | Role | Visibility |
|---|---|---|
| 1 (top) | Admin | Everything, across both SBUs |
| 2 | General Manager | Everything, across both SBUs |
| 3 | SBU Manager | Everything within their own SBU |
| 4 | Area Manager *(new)* | Everything within their SBU **and** their region |
| 5 | Sales Manager *(new — title reused, different role than today)* | Only their own team's opportunities |
| 6 (bottom) | Sales Staff | Only their own opportunities |

Source: `Opportunity-Access-Hierarchy-Proposal.md`, approved by Cabio leadership 2026-07-23.

---

## 2. Present Reality vs. Future Growth

Today only 4 of these 6 levels are populated: **Admin → General Manager → SBU Manager → Sales
Staff.** In the `role` table today that's literally `Admin`, `General Manager`, `Sales Manager`,
`Sales Executive` (`Seed-Data.sql:88-93`) — today's "Sales Manager" *is* the SBU Manager tier
functionally, just not relabeled yet; "Sales Executive" is the Sales Staff tier. Area Manager and
the new junior Sales Manager are the two genuinely new levels, added for future growth.

**Directive:** build the data model and RLS for the full 6-tier structure now, not a 4-tier
version extended later — the two new tiers must be first-class from day one.

**Decision (Basheer, 2026-07-25): populate the two new tiers now, with real people, not empty
scaffolding.** Existing staff get assigned to whichever of the 6 tiers actually matches the role
they're presently playing — e.g., someone already functioning as a de facto regional coordinator
is labeled Area Manager; someone already running a small deal team is labeled Sales Manager with
real direct reports. This is why §5 and §6 below (zone RLS context, `manager_id`) are load-bearing
for this phase, not deferred conveniences — a Level 4/5 person assigned today needs the
enforcement mechanism to actually work today, not once the tier is retroactively populated later.

---

## 3. "Doubling Up" Adjacent Roles Needs No Special Handling

Each tier's visibility is a strict superset of the tier(s) below it (SBU Manager ⊇ Area Manager ⊇
Sales Manager's team). So when one person covers two adjacent responsibilities (e.g., an SBU
Manager also personally running one zone), simply assign them the **more senior** of the two
roles — their access already includes everything the junior role would have granted. No
dual-role mechanism needed, ever, as long as it's within the same SBU.

(Cross-SBU double-duty — one person managing across two different SBUs simultaneously — isn't
supported today; each person belongs to exactly one SBU via `user_profile.sbu_id`.)

---

## 4. "Area" = the Existing `zone` Table, Not New Geography

Confirmed against `Seed-Data.sql:104-110`: `zone` already has 4 rows — North Kerala, South
Kerala, Central Kerala, **and Bangalore.**

> Note: `CLAUDE.md`'s "Zones: North Kerala, South Kerala, Central Kerala" list is stale, missing
> Bangalore. Small doc fix, unrelated to this design.

Area Manager's region scope keys off `user_profile.zone_id` (already exists, nullable) — no new
column needed. **Confirmed with Basheer (2026-07-25): `zone_id` is the right mechanism, no
alternative geography concept required.** The column existing is not the same as it being
enforceable, though — see §5.

---

## 5. Level 4 RLS Enforcement — Propagating `zone_id` into the Session Context

**The gap:** `user_profile.zone_id` exists as a column, but nothing carries it into PostgreSQL's
session so an RLS policy could filter on it. `Phase-2E-Security-Architecture.md` currently wires
exactly three session variables via `set_rls_context()` — `app.current_user_id`,
`app.current_sbu_id`, `app.current_role_id` — and explicitly lists `app.current_zone_id` as
*"Deferred until zone-based policies are needed."* That moment has now arrived: Level 4 cannot be
enforced without it.

**Required change to `Phase-2E-Security-Architecture.md` (mechanism, not schema — `zone_id`
itself needs no migration, it already exists):**
- Add a fourth `SET LOCAL app.current_zone_id = '<uuid>'` call alongside the existing three in
  `set_rls_context()`.
- Add a matching SQL helper function `cabio_app_zone_id()`, mirroring the existing
  `cabio_app_sbu_id()`/`cabio_app_user_id()`/`cabio_app_role_id()` pattern exactly.
- Level 4's RLS policy then reads: visible where `opportunity.sbu_id = cabio_app_sbu_id()` **and**
  the opportunity's account is in-region —
  `opportunity.account_id IN (SELECT id FROM account WHERE zone_id = cabio_app_zone_id())`.
  Joins through the **account's** `zone_id` (the customer's fixed location — `NOT NULL`, already
  the authoritative geography fact used elsewhere in the schema, e.g.
  `account/repository.py:47-48`), **not** the opportunity owner's `zone_id`
  (`user_profile.zone_id` — nullable, just describes which region a staff member is presently
  assigned to). Joining via the owner would reintroduce the same instability §8 already fixed for
  SBU — a rep's historical deals silently changing zone-visibility the moment she's reassigned to
  a different region. The account's zone is stable; a staff member's assigned zone isn't.

This is scope for the Phase 2E build estimate (§17), not a separate migration — the column is
already live, only the session-context wiring and the RLS policy itself are new.

---

## 6. Level 5 & 6 RLS Enforcement — Team and Self Visibility, No Separate SBU/Zone Check Needed

**Why this is a different kind of gap than §5's:** SBU and Zone are both *categories* every user
already has an attribute for (`sbu_id`, `zone_id`) — filtering "everyone in my SBU" or "everyone in
my zone" is a plain attribute match, no new relationship needed. "Their own team" is not a
category — it's a personal reporting relationship (who reports to whom), and nothing in the
schema records that today. `user_profile` has no `manager_id`, `reports_to_id`, or `team_id`
anywhere (confirmed against `organization/models.py` and `Physical-Schema.sql`).

Per §2's decision to assign real staff into Level 5 now, this needs to be a working relationship
from day one, not a placeholder.

**Schema addition (same migration batch as the rest of this phase's schema work):**
```sql
ALTER TABLE user_profile ADD COLUMN manager_id UUID REFERENCES user_profile(id);
```
Nullable, self-referencing — each Sales Staff row optionally points to the Sales Manager they
report to. Nullable means no backfill is required to land the migration; assignment happens
per-person as Cabio staffs the new tier.

**RLS rule for Level 5:** opportunities visible where the owner's `user_profile.manager_id` =
the caller's own `id` — "everyone who reports directly to me."

**RLS rule for Level 6:** opportunities visible where `opportunity.owner_id = cabio_app_user_id()`
— "only my own." No new column — `owner_id` already exists and is already how ownership is
tracked everywhere else in the app.

**Scope is deliberately flat, one level down — not a recursive org-chart walk.** Level 5 sees its
direct reports (Level 6) only. If Cabio later wants chained visibility (e.g., an Area Manager
seeing through Sales Manager → Sales Staff via the reporting chain, rather than only via the
`sbu_id`/`zone_id` categories already covering that), that's a recursive-CTE RLS policy — deferred
until a real need surfaces, since §3's superset rule already gives Level 4 everything in-SBU and
in-zone without needing the reporting chain at all.

**Why neither Level 5 nor Level 6 needs its own SBU or Zone check, even though every deal has
both:** these two tiers' rules are *relational* ("this specific person," "these specific reports"),
not *geographic/organizational* ("this SBU," "this SBU and region") — a fundamentally different
kind of restriction than Levels 3/4 use, not a lighter version of the same one.
- **SBU containment is already guaranteed by construction, not by an extra check.**
  `Opportunity.sbu_id` is stamped at creation from the creator's own SBU (§7) — a rep can only
  ever create a deal under her own SBU, there's no path to owning one for the other SBU. So
  `owner_id = me` can never surface a deal outside my SBU; adding `AND sbu_id = cabio_app_sbu_id()`
  to the Level 6 policy branch would be a no-op, never excluding a row that wasn't already
  excluded. Level 5 inherits the same guarantee transitively, since a manager's direct reports are
  each individually subject to that same creation-time stamp.
- **Zone was never part of either tier's rule to begin with.** The approved hierarchy (§1) states
  Level 5 as "only their own team's opportunities" and Level 6 as "only their own" — neither
  mentions region. Zone-based restriction is exclusively an Area Manager (Level 4) concept.
  There's nothing to "propagate" for Levels 5/6 because geography was never part of what defines
  their visibility.

Net effect: `app.current_sbu_id`/`app.current_zone_id` are still set in the session for every
user regardless of role (§5's session-context wiring runs unconditionally) — Levels 5/6 simply
have no reason to reference them in their own policy branch, since their narrower relational
filter already implies the correct SBU scope and never claimed a zone scope at all.

---

## 7. Opportunity SBU Attribution — Already Decided, Already Built

This turned out not to be new design work. **ADR-035** ("Account Is SBU-Agnostic — SBU Scoping
Lives on Opportunity," Accepted, implemented in migration `0001`, 2026-06-26) already specifies:

> "SBU scoping is captured explicitly on the Opportunity entity (`sbu_id`, NOT NULL), stamped at
> creation from the creating user's current SBU and never auto-updated afterward."

Verified in the actual code, not just the ADR text:
- `Opportunity.sbu_id` — real, non-nullable, indexed FK column (`opportunity/models.py:40-42`).
- `router.py:100-101` — stamped from `current_user.sbu_id` (the authenticated caller's own
  profile, server-side; not client-supplied) at creation.

This is airtight given the modeling convention in §10 below — an Opportunity's SBU is never
ambiguous by construction.

---

## 8. SBU Transfers — Frozen Attribution + Manual Ownership Handoff

**The gap:** nothing about *ownership* is frozen — if a rep transfers SBUs, her old deals stay
under her name until someone actively reassigns them.

**Why both pieces are needed together, not as alternatives:**
- **Frozen `sbu_id`** (§7, already built) protects *visibility and reporting integrity* — a deal
  keeps counting toward its original SBU regardless of who currently owns it or which team they
  now sit in. Without this, a live join to the owner's current SBU would misattribute historical
  deals the instant someone transfers.
- **Manual handoff** (chosen approach — Decision, §16) is the human decision about *who actively
  works the deal going forward* — typically the outgoing SBU Manager deciding, deal by deal,
  whether the transferring rep finishes it out or a colleague still in that SBU takes over. This
  uses the existing "edit opportunity owner" mechanism — no new UI needed.
- Frozen `sbu_id` is what makes manual handoff *safe*: the deal's SBU accounting never shifts
  mid-handoff, however long that takes.

---

## 9. Cross-SBU Splits — Documented as a Future Capability, Not in Use Today

`Business-Rules.md` (BR-FIN-01) documents splits crossing SBUs (e.g., Imaging 60% / Critical Care
40%) as present-tense capability, but this isn't actually in use today (confirmed with Basheer) —
it's coming later.

**Action:** add a validation guard now — reject a split whose contributor's SBU doesn't match the
opportunity's stamped `sbu_id` — so this isn't silently violated before the real cross-SBU
capability is built. Cheap, low-risk, prevents the invariant in §7/§10 from quietly breaking.

---

## 10. Project → Opportunity Creation Flow, for Multi-SBU Customer Needs

When a customer needs products from more than one SBU, that's modeled as **one Project with one
Opportunity per SBU**, not one Opportunity spanning SBUs. Confirmed: `project` table has no
`sbu_id` at all — SBU-agnostic, same pattern as `account` per ADR-035.

Example: customer needs both imaging and critical-care equipment.
1. Imaging rep creates the `Project` (`account_id`, `owner_id` = herself). No SBU on the Project
   record.
2. She creates her own `Opportunity` under it (`project_id` = the Project, `owner_id` = herself)
   — `sbu_id` stamped as Imaging at that moment (§7).
3. The Critical Care rep, working the same account, creates a **separate** `Opportunity` under
   the **same** `project_id`, `owner_id` = herself — `sbu_id` stamped as Critical Care,
   independently.
4. Result: one Project, two single-SBU Opportunities, each visible only to its own SBU's
   management chain.

This works safely specifically because a rep only ever creates/owns Opportunities for her own
SBU's products — "whoever created it" and "which SBU it's for" are guaranteed to be the same
answer, so the stamp in §7 never has ambiguity to resolve.

**Companion guard:** block reassigning an Opportunity's owner to someone from a **different** SBU
than its stamped `sbu_id` — a handoff (§8) should only ever go to someone in the same SBU as the
deal.

---

## 11. Enforcement Mechanism — PostgreSQL RLS, Not Application-Layer Filtering

Already the approved direction (`Phase-2E-Security-Architecture.md`, status: Approved):

> "Repository Layer — executes queries without security awareness. RLS is invisible... PostgreSQL
> RLS enforces data scoping... unforgeable from the application layer."

**Why this specifically matters here:** the Project's own "Opportunities" tab (§10) is a separate
query (`WHERE project_id = X`) from the Pipeline screen. If visibility were enforced per-screen in
application code, this tab could easily leak the other SBU's opportunity — a classic "one screen
has the filter, another forgot it" bug. Because enforcement lives in the database itself (RLS
policy on the `opportunity` table), *every* query — Pipeline, Project tab, search, anything built
in the future — is filtered identically and automatically, with zero extra code per screen.

**Caveat (no action needed today, just don't forget it later):** this protection only holds if
every code path connects via the same restricted DB role. If some future one-off script reaches
for the Supabase service key/superuser connection "for convenience," it bypasses RLS entirely —
that's how Postgres RLS is designed to work, not a bug. Today the whole app already uses one
single connection, so there's nothing to change now — just don't let a future admin/reporting
script use a different door.

---

## 12. Document Consistency Review

**Aligned, no conflict:**
- ADR-035, ADR-018, ADR-024 — all consistent with, and partly already implement, this design.
- `Backend-Implementation-Standards.md:887-918` — confirms "RLS First," repositories/services stay
  RLS-unaware, mechanism deferred to Phase 2E. Consistent.

**Stale, needs a doc-only fix (no code change):**
- `Physical-Schema.sql` — its `opportunity` table definition is missing the `sbu_id` column, even
  though it's been live since migration `0001` (2026-06-26). `CLAUDE.md` calls this file
  authoritative for DB object names — currently inaccurate for this table.
- `Backend-Implementation-Standards.md` (lines 430/443/458/1327-1391) — still references the old
  `managing_sbu_id` field that ADR-035 removed from `Account`. Missed in the earlier cleanup pass
  (commit `1a6e633`).
- **ADR-009** ("SBU-Level Data Isolation via RLS," Accepted) — written in old 2-tier language
  (Sales Executive vs. Manager/GM rollup), predates the approved 6-tier structure. Needs
  updating/superseding, same batch as `Enterprise-Data-Model.md` §341-342 and the Phase 2E doc.
- `Phase-2E-Security-Architecture.md`'s own sample RLS policy (`opportunity_sbu_isolation`)
  references `account.managing_sbu_id`, which no longer exists — should read
  `opportunity.sbu_id = cabio_app_sbu_id()` instead, consistent with §7 above.

---

## 13. Current Build Status of Phase 2E RLS: 0% Built

- `db/session.py:48-50` — `set_rls_context()` is a literal no-op stub (`pass`); no user identity
  reaches Postgres today.
- No restricted DB role (`cabio_app` or equivalent) exists anywhere in the codebase — one single
  connection/role for the entire app.
- No migration anywhere runs `ENABLE ROW LEVEL SECURITY` or `CREATE POLICY` — RLS is off on every
  table.
- `user_profile.manager_id` (§6) does not exist yet — new column, new migration.
- `app.current_zone_id` (§5) is not wired into `set_rls_context()` — new session variable, new
  helper function.
- **Net effect today:** every query already sees every Opportunity, in every SBU, regardless of
  role — not a bug, just the honest current state.

---

## 14. Go-Live Sequencing

Already decided 2026-07-14 (`Deployment-Topology.md`): RLS lands and is proven on UAT **before**
Prod goes live. This design work reinforces why that can't slip — without it, there is no
SBU/hierarchy restriction on Opportunities at all, and the client explicitly asked for this at the
July 21 demo. Since neither UAT nor Prod exists yet, there's no retrofit risk — Prod gets built
with RLS in place from day one, not patched onto something already live.

---

## 15. Residual — Not Yet Confirmed by Cabio Leadership

From `Opportunity-Access-Hierarchy-Proposal.md` §7, not explicitly re-confirmed in the approval
message:
1. Does each Area Manager's territory map to exactly one zone, or could it span/share zones?
2. Is "SBU Manager" the final title, or does Cabio want something else?
3. Does the ~1-year timeline to grow into this structure still hold?

None of these block starting the data-model work.

---

## 16. Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Build all 6 tiers now, not 4 extended later | Today's reality and future growth must be the same code path (§2) |
| 2 | "Doubling up" = assign the senior role, never both | Senior scope is always a superset (§3) |
| 3 | `opportunity.sbu_id` frozen at creation | Already decided (ADR-035) and already built (§7) |
| 4 | SBU transfers: frozen `sbu_id` + manual ownership handoff, combined | Manual handoff alone leaks visibility during the transition window (§8) |
| 5 | Cross-SBU splits: guard added now, capability deferred | Not in use today; prevents future capability from being silently pre-empted (§9) |
| 6 | Multi-SBU customer need = one Project, one Opportunity per SBU | Matches existing Project/Opportunity modeling convention (§10) |
| 7 | Enforcement via PostgreSQL RLS, not per-screen filtering | Already approved direction; closes the Project-tab leak class of bug by construction (§11) |
| 8 | RLS must land and be proven on UAT before Prod go-live | Already decided 2026-07-14; reinforced by this design (§14) |
| 9 | Populate Level 4/5 now with real staff, assigned by actual current role | Directive was "6 tiers now," not empty scaffolding — makes §5/§6 load-bearing, not optional (§2) |
| 10 | Propagate `zone_id` into RLS session context via `app.current_zone_id` + `cabio_app_zone_id()` | Column already exists; only the session-context wiring and policy were missing (§5) |
| 11 | Add `user_profile.manager_id` (nullable, self-referencing FK) | SBU/Zone are categories every user already has; "team" is a reporting relationship with no existing column (§6) |
| 12 | Level 4's zone join is via `account.zone_id`, not the opportunity owner's `zone_id` | Account's zone is the stable customer-location fact; owner's zone can drift on reassignment — same instability class §8 already fixed for SBU (§5) |
| 13 | Levels 5/6 need no independent SBU/Zone check in their RLS policy | SBU containment already guaranteed by the creation-time stamp (§7); Zone was never part of either tier's rule to begin with (§6) |

---

## 17. Recommendation

Treat this as its own phase — it already has a name and a home (**Phase 2E**), just needs to go
from "approved but undefined" to "scoped and estimated." Suggested next step: size the full Phase
2E build as an explicit, standalone estimate, covering:
- Schema migration: `user_profile.manager_id` (§6), plus any other Phase 2E columns.
- RLS context propagation: `app.current_zone_id` + `cabio_app_zone_id()` (§5), alongside the
  already-planned `app.current_user_id`/`app.current_sbu_id`/`app.current_role_id`.
- Restricted DB role + policies for all 6 tiers (§1, §5, §6, §7, §11).
- Testing strategy for the full tier matrix.
- The doc fixes and ADR-009 rewrite (§12).

— before it gets silently assumed to fit inside whatever timeline Milestone 2 or the pilot
rollout currently has.
