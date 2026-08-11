# Zone Hierarchy Redesign — Technical Design

**Status:** Draft — ready for Basheer's confirmation before the concrete
Implementation Plan is written. Nothing described here is built yet.
**Date:** 2026-08-11
**Prepared by:** Basheer Kalanchera (with Claude)
**Purpose:** The execution shape (schema, RLS, screens, sequencing) for
the territory tree design already agreed in principle in
`docs/Discussion-Zone-Hierarchy-2026-08.md`. That doc carries the
plain-language policy record (why a flexible tree, how visibility scales,
handover rules, data-entry simplification, the admin screen requirement);
this doc turns it into something buildable. Real geography content lives
separately in `docs/Zone-Hierarchy-Territory-Data-2026-08.md` — this doc
references it as the seed source, not a duplicate of it.

---

## 1. Context

Real data gathered on 2026-08-11 (`Zone-Hierarchy-Territory-Data-2026-08.
md`) proved the flat 5-zone table can't represent reality: South Kerala
needs a 4th level (Zone → District → Taluk) for the Idukki/Alappuzha
splits; Karnataka needs a State → Cluster → District shape. It also proved
the *groupings themselves* aren't static — within one afternoon, a
district moved clusters (Coorg), two clusters got renamed (Karnataka
South/Central), and new places were added (Bhatkal, North Kerala's
district set) — all done as manual document edits because no live
mechanism exists yet to make these changes directly.

**Basheer's framing, 2026-08-11: plan on the assumption territory
groupings will keep changing.** That reframes what "done" means for this
feature — it's not "ship the one correct tree," it's "ship a tree *and* a
first-class way to keep changing it," with the admin edit screen as a
required deliverable, not a nice-to-have.

**Sequencing dependency, real and load-bearing:** this design builds
directly on top of Multi-Zone Assignment Milestone 1
(`docs/Multi-Zone-Assignment-Milestone-1-Implementation-Plan.md`, not yet
built), which introduces the `user_zone` join table and rewrites the Area
Manager RLS branch from scalar zone equality to flat set-membership. Zone
Hierarchy rewrites that *same* branch a second time — from flat
set-membership to tree-membership. **Cannot start §4 below until Milestone
1 has shipped and been verified.**

## 2. Current constraint — why the flat table can't represent reality

`zone` (`docs/Physical-Schema.sql`): 5 rows, no parent column, no depth —
North Kerala, South Kerala, Central Kerala, Bangalore, Mangalore, all
siblings. Every regrouping this session (adding Mangalore in isolation,
now needing Karnataka/Kerala as parents; Coorg moving clusters) required a
manual data/doc change because the schema has no concept of nesting at
all.

## 3. Data model

- **`zone` keeps its name — not renamed to `territory`.** Renaming would
  ripple into `cabio_app_zone_id()`, every RLS policy referencing it, the
  `app.current_zone_id` session variable, and every `Account.zone_id`/
  `UserProfile.zone_id`/`user_zone.zone_id` reference in the codebase, for
  zero functional gain. "Territory" stays the conversational/UI term only
  — this is the option the Discussion doc itself flagged as acceptable.
- **Add `parent_zone_id uuid REFERENCES zone(id)`**, nullable,
  self-referencing. Arbitrary depth, no fixed levels — matches the
  confirmed-necessary 4-level South Kerala branch and 3-level Karnataka
  branch without needing different handling per depth.
- **Add `zone_level varchar(20)`**, nullable, purely advisory
  (`STATE`/`ZONE`/`DISTRICT`/`TALUK`/`CLUSTER`) — not structurally
  enforced, just useful for UI/reporting, since depth alone doesn't say
  what *kind* of node something is (a Bangalore numbered zone and a Kerala
  taluk can sit at the same tree depth but mean different things).
- **New `zone_closure` table** — `ancestor_zone_id`, `descendant_zone_id`,
  composite PK, both FK'd to `zone`. The "coverage binder" from the
  Discussion doc. Includes a self-row per zone (`ancestor = descendant`)
  so "is this zone in my coverage" and "is anything under my coverage" use
  the same query shape. **Maintained by a single always-correct full-table
  rebuild (one recursive-CTE statement, truncate + repopulate), run on
  every add/move/rename/deprecate — not an incremental "recompute just the
  affected subtree" algorithm.** Decided this way deliberately (revised
  2026-08-11, during Implementation Plan review): an incremental algorithm
  is exactly where an off-by-one silently over- or under-grants RLS
  visibility, a security-relevant risk, not a data-hygiene one. Given the
  tree stays in the low hundreds of rows even fully built out pan-India
  and map edits are rare/deliberate admin actions, there's no performance
  reason to accept that risk — one code path, always exercised the same
  way, beats two subtly different ones. Application-level, inside the same
  transaction as the triggering write — not a DB trigger, per the
  Discussion doc's explicit preference, matching how Milestone 1 already
  handles its own "primary zone" bookkeeping. The "manual full rebuild"
  safety net from the Discussion doc is this exact same method, exposed
  directly to the Admin screen — not a separate mechanism to keep in sync.
- **`user_zone`** (introduced by Milestone 1, shape unchanged): a
  person's `zone_id` entries can now point at tree nodes of any depth —
  no schema change needed to `user_zone` itself, only to what the RLS
  policy does with it (§4).
- **Existing 5 zones don't move or get new IDs.** North Kerala/South
  Kerala/Central Kerala/Bangalore/Mangalore each just gain a
  `parent_zone_id` pointing at two new top-level rows (Kerala, Karnataka).
  Every existing `account.zone_id`/`user_profile.zone_id`/`user_zone.
  zone_id` FK stays valid throughout — zero migration risk on existing
  records, purely additive.
- **Central Kerala's fate is not resolved here.** Per Basheer, Kerala
  runs North/South only "for now" — whether the live Central Kerala row
  gets deprecated or just sits parentless/unused is a follow-up call, not
  a blocker (§8).

## 4. RLS

Generalizes Milestone 1's `user_zone` set-membership check into a
closure-based tree-membership check, on the same `opportunity_tier_
visibility` Area Manager branch:

```sql
AND account_id IN (
    SELECT id FROM account
    WHERE zone_id IN (
        SELECT descendant_zone_id FROM zone_closure
        WHERE ancestor_zone_id IN (
            SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid()
        )
    )
)
```

Because `zone_closure` includes a self-row per zone, a single-zone Area
Manager whose zone has no children behaves identically to today and to
Milestone 1's flat version — the tree case is a strict superset, not a
divergent code path. Confirmed via Milestone 1's own grep that `cabio_
app_zone_id()`/zone logic touches exactly this one policy branch — no
other RLS policy needs a parallel change.

**High risk, same designation as Milestone 1** — this is a second live
rewrite of the same security-critical branch. Full six-tier manual
re-verification required again, not assumed safe by inheritance from
Milestone 1's own verification.

**Deprecated zones and existing visibility — a real gap found during
Implementation Plan review (2026-08-11 later), flagged by Basheer, now an
explicit decision, not an implicit side effect.** The Admin Territory
Management screen (§5) can deprecate a zone (`is_active = false`). The
RLS query above reads `zone_closure` and `user_zone` directly — neither
consults `is_active` at all. **Consequence, stated deliberately:
deprecating a zone does not revoke anyone's existing RLS visibility.**
Anyone already assigned to it via `user_zone`, or any Account already
tagged with it, keeps working exactly as before. Deprecation only blocks
*new* assignments (the zone picker filters `is_active = true`; the CRUD
endpoints reject a deprecated zone as a new parent). This mirrors an
existing precedent in this codebase — `BR-FIN-06`'s split grandfathering,
where participants already on an Opportunity are exempt from a rule that
only gates new additions. **Recommended, not unilaterally decided** — the
alternative (deprecation forces reassignment first, revoking access
immediately) is real but risks silently locking a rep out of live deals
as a side effect of unrelated administrative housekeeping. The blast-
radius check (§5/§6) is what makes grandfathering an informed choice
rather than a blind one — an admin deprecating a zone sees exactly how
many Accounts/Users are still actively affected before confirming.

## 5. Backend business logic (non-RLS)

- **`TEAM_SCOPE_BUILDERS["Area Manager"]`** (`organization/repository.
  py`) — same closure-based generalization applied to the `user_profile`
  visibility rule that Milestone 1 already rewrote once (flat →
  set-intersection); this rewrites it a second time (flat → closure).
- **Account creation zone default** — stays `current_user.zone_id` (their
  own primary/deepest-assigned zone), unaffected by tree depth. No change
  needed beyond what Milestone 1 already confirmed.
- **Shared zone/territory picker, two modes** (backs every zone-selection
  UI, §6):
  - **Default mode** (the common case): no picker rendered at all —
    defaults silently to the acting user's own `zone_id`, same "default
    to caller's own" pattern as Opportunity SBU (`BR-OP-12`).
  - **Search mode** (override only): type-ahead resolving a place name
    directly to a tree node — reuses this codebase's existing trigram
    search precedent (`idx_opportunity_name_trgm`, `opportunity/
    models.py`), applied to `zone.name` instead. No cascading
    State→Zone→District→Taluk menu.
- **Admin Territory Management backend** — CRUD on `zone`: create (name +
  parent), rename, re-parent (update `parent_zone_id`, trigger closure
  recompute for the affected subtree), deprecate. A read-only "blast
  radius" endpoint — count of Accounts/Users under a given zone or its
  descendants — shown before a move/deprecate is confirmed; reuses the
  same closure join, no new mechanism.
- **Access:** Admin/GM only. Reuse the existing role-gate pattern already
  established for Product Catalog and BR-OP-12's SBU-override roles —
  not a new authorization mechanism.

## 6. Frontend

- **New Admin Territory Management screen** (Admin/GM only, same nav
  gating as other role-restricted areas): tree view (expand/collapse),
  inline add/rename/move/deprecate actions, blast-radius confirmation
  before a move or deprecate actually applies.
- **Shared zone picker (§5) replaces the flat `<TextField select>`**
  currently used in: Account create/edit (`Customer360Screen.tsx`,
  `QuickLeadModal.tsx`), User Directory's zone assignment (already being
  touched by Milestone 1's own "+Add another zone" UI — this generalizes
  that same picker to be tree-aware rather than a second rebuild), the
  Pipeline Zone filter (`OpportunityPipelineScreen.tsx`, built this
  session), and the Customer Directory zone filter
  (`CustomerDirectoryScreen.jsx`).
- **Zone display stays a single leaf name**, not a full breadcrumb, on
  cards/detail screens — consistent with today's display. Breadcrumb /
  full-path context only appears inside the new Admin screen's own tree
  view.

## 7. Seeding real data

Migration seeds the gathered-and-partially-resolved data from
`Zone-Hierarchy-Territory-Data-2026-08.md`: North Kerala's 5 districts,
South Kerala's 9 districts + 2 taluk splits, Karnataka's Bangalore 5 zones
(Zone 5's gap left genuinely absent, not invented), Karnataka South/
Central/Coastal clusters, Dharwad. **Seeded explicitly as best-current-
understanding, not final** — the whole point of shipping the Admin screen
in the same release is that the territory doc's remaining open items
(Zone 5, Ernakulam's zone boundary, North Kerala completeness,
unconfirmed reporting lines) get corrected live afterward through the
screen, not gated on 100% data certainty before this ships.

`user_zone` rows for the real people named (Adarsh, Vivek, Irfan, Shruthi,
Rudrappa, Om Hiremath, Dhanushma, Nagesh Ninganoor, Ravikumar, Fahad,
Fazal) — only for whichever already have `user_profile` rows in Dev.
**Needs an inventory check at build time** — "Staff New" (unnamed hire)
and the Dharwad subdealer relationship may have no `user_profile` row to
attach to at all; not assumed here, flagged as a real prerequisite check.

## 8. Decisions needed before build starts

Re-examined against the Discussion doc's 7 open items — **none of these
block starting the build**:
- Item 1 (Area Manager → Zone Manager rename): cosmetic, a `role.
  role_name` string update, apply whenever confirmed, doesn't gate schema
  or RLS work.
- Item 5 (Admin/GM functionally different roles): orthogonal — both stay
  unrestricted in this design regardless of the answer.
- Item 6 (handover Split-vs-transfer default): governs Opportunity
  ownership/Split, an existing, separate, already-built mechanism — this
  build doesn't implement handover logic itself.
- Item 7 (stakeholder picker widening): a small, unrelated fix to a
  different screen.

**What's actually needed before starting:**
1. Confirm Central Kerala's fate — can default to "leave dormant,
   parentless, revisit later" if no answer is needed to unblock.
2. Confirm whether Dharwad's subdealer relationship and the North Kerala
   "Staff New" placeholder get real `user_profile` rows before seeding,
   or stay unassigned territories until they do.

## 9. Testing

Same shape as Milestone 1's own testing section: closure-table unit tests
(add/move/rebuild correctness), RLS policy tests at the schema level
(flagged, same as this session's Referral Credit plan — real policy
evaluation needs a live Postgres connection, not fully exercisable by
this repo's mocked-session unit tests), Admin CRUD endpoint tests,
six-tier manual re-verification on Dev (required, not optional, per §4's
High risk designation).

## 10. Effort / risk summary

**High risk** — a second live rewrite of the same security-critical RLS
branch Milestone 1 already touched once. **Medium-large effort** — schema
+ closure maintenance + RLS rewrite + new Admin screen + a shared picker
component touching 4+ existing screens + a real-data seeding migration.
**Hard sequencing dependency on Multi-Zone Assignment Milestone 1** —
cannot start §4 until that ships and is verified.

## 11. Recommendation

Confirm this shape, then move to a concrete step-by-step Implementation
Plan (exact migration SQL, file-by-file changes, test list, six-tier
manual verification checklist) — same two-document pattern already used
for Multi-Zone Assignment. Not written in this same pass, given the size
of what's above.
