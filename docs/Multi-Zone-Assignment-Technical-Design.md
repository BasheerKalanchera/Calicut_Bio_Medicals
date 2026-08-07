# Multi-Zone User Assignment — Technical Design

**Status:** All three §8 decisions resolved — core multi-zone assignment
(§§3–6) ready to plan/build. §7's Target/Coverage Planning work still has one
separate open question (`target_plan.zone_id` nullability) before that part
starts.
**Prepared:** 2026-08-07. **Updated:** 2026-08-07 — added §7 (Target & Coverage
Planning quota scoping, confirmed with Haroon); resolved §5/§8 Split-picker
question, §8 role-scope question, and §8 territory-naming question (raw zone
list, no named `territory` entity — see §8, item 3).

## 1. Context

Trigger: Fazal, an Area Manager (Imaging), needs to cover both North Kerala and the
newly added Mangalore zone. The current data model ties exactly one zone to one
user (`user_profile.zone_id`), so this can't be represented today.

Immediate stopgap agreed with Basheer (2026-08-07): promote Fazal to SBU Manager
for Imaging, since no SBU Manager exists there yet — the SBU Manager RLS branch is
unconditional across the whole SBU, so it happens to cover both of Fazal's zones
with zero code change. This unblocks him today but is explicitly a workaround, not
a fix:

- **Over-grants.** SBU Manager sees every zone in Imaging, not just Fazal's two.
- **Doesn't repeat.** Basheer confirmed "cases like Fazal" recur across Area
  Managers — promoting each one to SBU Manager collapses the zone boundary the
  entire Level-4 tier exists to enforce. Once two or more people hold "SBU
  Manager" with full-SBU visibility, per-zone containment is gone for that SBU;
  the trick only works cleanly once, for one person.
- **Not durable.** Cabio expects to eventually appoint one real SBU Manager per
  SBU. When that happens, Fazal's promotion has to be undone, and his original
  multi-zone need resurfaces unsolved.

This document designs the actual fix: let a `user_profile` hold more than one
zone.

## 2. Current constraint — why this doesn't work today

`zone_id` is a scalar, single-valued attribute at every layer of the stack:

- **Schema** (`Physical-Schema.sql:608-612`): `user_profile.zone_id uuid` —
  nullable single FK to `zone`. No junction table exists.
- **RLS session context** (`db/session.py:48-53`): `set_rls_context()` issues one
  `SET LOCAL app.current_zone_id = :zid`, conditional on `user.zone_id is not
  None`.
- **RLS policy** (`cabio_app_zone_id()`, `Physical-Schema.sql:141-143`, consumed
  by the Area Manager branch of `opportunity_tier_visibility` —
  `0010_rls_opportunity_children.py:78-82` — and inherited by `split`,
  `opportunity_item`, `opportunity_stakeholder`, `activity`, `document`,
  `reminder` via join-back in `0011_rls_activity_document_reminder.py`): a scalar
  equality check, `account.zone_id = cabio_app_zone_id()`.
- **Python scoping** (`organization/repository.py:19`):
  `TEAM_SCOPE_BUILDERS["Area Manager"]` does `UserProfile.zone_id ==
  <caller>.zone_id` — plain column equality. Feeds the Daily Activity Report
  and default User Directory scope. (The Split picker's `scope="sbu"` branch
  used to have the same zone equality check — fixed 2026-08-07, see §5, so
  it's no longer in this list.)
- **Business logic default** (`account/service.py:105-107`): Account creation
  defaults to `current_user.zone_id` when no zone is given explicitly.
- **Frontend** (`UserDirectoryScreen.tsx:181-183`, `types/api.ts` — 10
  occurrences of `zone_id: string`): every form and DTO assumes one zone per
  user.

None of these can represent "Fazal is in North Kerala AND Mangalore" without a
real change.

## 3. Data model

New join table:

```sql
CREATE TABLE user_zone (
    user_id uuid NOT NULL REFERENCES user_profile(id),
    zone_id uuid NOT NULL REFERENCES zone(id),
    PRIMARY KEY (user_id, zone_id)
);
```

**Keep `user_profile.zone_id`** rather than dropping it — repurposed as "primary
zone," used for Account-creation defaulting (§5) and anywhere the UI needs one
zone to pre-select or display. `user_zone` becomes the authoritative set for
*visibility*; `user_profile.zone_id` is a convenience pointer that should always
be a member of that same user's `user_zone` rows. Enforced at the service layer,
not the DB — there's no clean way to express "column value must be a member of a
related table's rows" as a plain constraint, and a trigger is more machinery than
this needs.

Migration: create the table, backfill one `user_zone` row per existing non-null
`user_profile.zone_id`.

## 4. RLS

Replace the Area Manager branch's scalar equality with a set-membership check
against `user_zone`:

```sql
OR (
    cabio_app_role_name() = 'Area Manager'
    AND sbu_id = cabio_app_sbu_id()
    AND account_id IN (
        SELECT id FROM account
        WHERE zone_id IN (SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid())
    )
)
```

This queries `user_zone` directly via `cabio_app_uid()` (already in session
context since `0009_cabio_app_rls_helper_functions.py`), so it **doesn't need a
multi-valued session GUC** — Postgres session variables are scalar strings,
awkward to hold a set. This also means `app.current_zone_id` and the conditional
`SET LOCAL` in `set_rls_context()` can likely be retired entirely once this
lands — the RLS layer no longer needs zone pushed into session context at all,
it reads `user_zone` straight from the table. Net simplification, not just a
swap.

**Blast radius:** one policy family (`opportunity_tier_visibility`), inherited by
the six tables it already cascades to via join-back. Same shape of change as the
original Phase 2E rollout — needs the same six-tier, role-by-role manual
re-verification before shipping (not just unit tests), because this rewrites a
security policy rather than adding to one.

## 5. Backend business logic (non-RLS)

`organization/repository.py`:

- `TEAM_SCOPE_BUILDERS["Area Manager"]` (line 19) — rewrite from
  `UserProfile.zone_id == u.zone_id` to an `EXISTS` intersection against
  `user_zone` for both caller and candidate row (target users may also be
  multi-zone).
- `scope="sbu"` branch (Split picker, BR-FIN-06) — **no rewrite needed here.**
  Issue 2 §3.1 (decided 2026-08-05, **shipped 2026-08-07** — see
  `docs/Discussion-SplitParticipant-SBU-Scope.md`) already changed this
  picker's scope from "same SBU + same zone" (formerly `scope="sbu_zone"`)
  to "same SBU, any zone," dropping the zone check entirely rather than
  loosening it. A multi-zone caller's Split picker already works correctly
  today, because the picker no longer looks at zone at all. (Superseded
  2026-08-07: this section previously proposed rewriting the zone check to
  a set-intersection, any-overlap vs. exact-match — moot now that Issue 2
  §3.1 is built.)

`account/service.py:105-107` — Account creation's zone default. With a
multi-zone user, `current_user.zone_id` (the "primary zone" from §3) remains the
default, unchanged. No new ambiguity, as long as the primary-zone convention
holds — this is why §3 keeps that field instead of moving to a bare list.

`account/repository.py` — `list_accounts(zone_id=...)` filter stays
single-valued; no correctness requirement to change it (filtering to one zone at
a time in the directory UI is a reasonable, unforced UX choice, not a gap).

## 6. Frontend

- `UserDirectoryScreen.tsx` — Zone field becomes a multi-select;
  `UserCreate`/`UserUpdate` (`organization/schemas.py:37,48,56`) gain
  `zone_ids: list[uuid]` alongside the existing scalar `zone_id` (primary).
- `types/api.ts` — DTOs representing a *user's* zone(s) get a `zone_ids` array;
  DTOs representing an *account's* or *opportunity's* zone (still single,
  unaffected — see §3) stay as-is.
- Target/Coverage Planning — see §7, correcting an earlier claim in this doc
  that this area was unaffected.
- Account/Customer directory zone filter — optional UX nicety to let a
  multi-zone user filter across "any of my zones" at once; not required for
  correctness, can stay single-select.

## 7. Target & Coverage Planning — zone-scoped quotas (confirmed 2026-08-07 with Haroon)

**Correction to this doc's earlier §6 claim** ("no `zone_id` anywhere in
`planning/models.py`, genuinely unaffected"): that was true of the *code as it
stands*, but Basheer confirmed with Haroon that Fazal is evaluated against **two
independent quotas** — one per zone (North Kerala and Mangalore) — not one
combined number that's merely split for visibility. That's a real requirement on
this area, not a non-issue.

**Lower risk than it first looks, though:** Target Planning and Coverage
Planning have **no backend or frontend implementation at all today** —
`backend/app/domains/planning/` contains only `models.py` (the SQLAlchemy
tables); there's no `service.py`, `router.py`, or `schemas.py`, and no
Target/Coverage Planning screen exists anywhere in the live app (`DemoApp.tsx`
has no nav entry for it — the only UI for it is in the abandoned legacy
prototype). So this is new-build work, not a retrofit of something working
today. It needs the right schema from the start, not a migration of live data.

**Schema changes needed:**
- `target_plan` (`Physical-Schema.sql:970`, unique on `(user_id, sbu_id,
  planning_period)`) — add `zone_id`, widen the unique constraint to
  `(user_id, sbu_id, zone_id, planning_period)`. A single-zone user still gets
  one row per quarter, using their one zone; a multi-zone user gets one row
  per zone they cover.
- `coverage_plan` (`Physical-Schema.sql:722`, unique on `(user_id,
  planning_period)`) — this is the *tighter* constraint: one coverage plan per
  user per quarter, full stop, regardless of SBU or zone, as things stand.
  `BR-PL-03` ties every Coverage Plan 1:1 to a Target Plan, so once
  `target_plan` is zone-scoped, `coverage_plan` needs its own `zone_id` and a
  widened constraint (`user_id, zone_id, planning_period`) too — otherwise
  Fazal could never have two coverage plans (one per zone) in the same
  quarter.
- `coverage_plan_entry` (per-account `target_revenue_lakhs`) needs no schema
  change, but should get a validation rule once built: an entry's
  `account.zone_id` should match its parent `coverage_plan.zone_id` — a
  Mangalore coverage plan containing a North Kerala account would quietly
  undermine the entire point of splitting the quota by zone.

**Business rules to amend when this is actually built** (not now —
`Business-Rules.md` should describe what the system enforces, not a
not-yet-built plan):
- **BR-PL-01** ("Target Plans must be defined at the User + SBU + Quarter
  level") → add Zone.
- **BR-PL-03** ("Coverage Plans cannot be created unless a Target Plan exists
  for the same User, SBU, and Planning Period") → add Zone to the match.

**Relationship to §3's `user_zone` design:** a Target Plan should only be
creatable for a zone the user is actually in `user_zone` for — enforce this at
the service layer when Target Planning is built (Fazal can have a Mangalore
Target Plan *because* `user_zone` says he covers Mangalore; a user not in
`user_zone` for a zone shouldn't be able to get one).

**Open question, not yet resolved:** `target_plan.zone_id` — `NOT NULL`, or
nullable? `user_profile.zone_id` is nullable today because Admin/GM (and
possibly SBU Manager) carry no real zone. If Target Plans are only ever set for
zoned, individual-contributor-style roles, `NOT NULL` is right; if an
unzoned role can also hold a target, it needs to stay nullable. Nothing in the
current code restricts *who* can have a `target_plan` by role, so this needs an
explicit answer, not an assumption, before the migration is written.

**This also resolves a hedge already in the PRD**, not just a gap in this
design: `Cabio Sales OS – Phase 1 - PRD.md:394`, §5 "Zone Allocation," states
*"Zone assignment is informational and does not drive target allocation in
Phase 1"* — explicitly scoped to "Phase 1." Haroon's requirement confirms
zone-based target allocation is a real Phase 2+ need, not hypothetical — worth
noting in the PRD when Target Planning is actually scoped for build, so that
line doesn't read as still-current at that point.

## 8. Decisions needed before build starts

This resolves an item already on record in `Opportunity-Access-Hierarchy-
Proposal.md`'s leadership decision list (#1): *"Does each Area Manager's
territory line up exactly with one region, or could a territory span parts of
more than one region, or be shared between more than one Area Manager?"* Fazal's
case answers the first half concretely — yes, a territory can span regions.
Worth taking this design back to leadership as the resolution of that question
rather than opening a new one.

Specific calls needed:

1. ~~Is multi-zone assignment general (any role) or scoped to particular
   roles~~ — **resolved 2026-08-07: open it to all roles, no additional cost
   or risk.** `user_zone` has no FK to `role` and is already role-agnostic.
   Checked what actually *changes* per tier if given multiple zones:
   Admin/General Manager/SBU Manager are already unconditional (zone never
   enters their check), Sales Manager is scoped by `manager_id` (zone never
   enters their check), Sales Staff is scoped to `owner_id = self` (zone
   never enters their check) — **Area Manager is the only tier whose RLS/
   scoping actually keys off zone membership.** So multi-zone only changes
   access outcomes for Area Managers; for every other role it only affects
   (a) their account-creation default zone and (b) whether they're picked up
   in someone else's zone-scoped view (e.g. a multi-zone Sales Staff member
   showing up in an Area Manager's Daily Activity Report for either zone) —
   both already handled by this design with no extra work. Restricting it
   to specific roles would be a business-policy choice, not something the
   system needs for correctness or safety.
2. ~~Split-picker "same zone" semantics~~ — **resolved, see §5**: moot once
   Issue 2 ships, since that removes the zone check from this picker
   entirely.
3. ~~Does a multi-zone Area Manager's territory need to be named/reported as
   a unit~~ — **resolved 2026-08-07: raw zone list is sufficient, no named
   `territory` entity.** Basheer's call: Fazal's case is isolated (one
   person, two zones), and his targets are already set and reported per zone
   independently, not as a combined figure — so there's no reporting need
   the raw list doesn't already serve. Revisit only if a second multi-zone
   case surfaces where leadership wants to reason about territories as
   named, reusable units rather than "this person's list of zones."

## 9. Testing

- **Rewrite:** `test_session.py` (single `SET LOCAL` assertion),
  `test_organization_repository.py` / `test_organization_service.py` (Area
  Manager scope), `test_account_repository.py` / `test_account_service.py`
  (zone default/filter — unaffected by the primary-zone design, but
  re-verify).
- **New:** multi-zone RLS coverage — an Area Manager with two zones sees
  opportunities/activities/documents/reminders across both and nothing
  outside them; a Sales Manager whose report has an overlapping zone still
  resolves correctly (that branch is already zone-agnostic — confirm no
  regression, not new behavior).
- **New:** `user_zone` backfill migration correctness — every existing
  non-null `zone_id` produces exactly one `user_zone` row.
- **New, once Target/Coverage Planning is built (§7):** a multi-zone user can
  hold one Target Plan per covered zone in the same quarter; a Coverage Plan's
  entries are all in-zone for its parent Target Plan's zone; a Target Plan
  can't be created for a zone the user isn't in `user_zone` for.

## 10. Effort / risk summary

| Layer | Change | Risk |
|---|---|---|
| Schema | New `user_zone` table + backfill migration | Low |
| RLS | Rewrite Area Manager branch; retire `app.current_zone_id` | **High** — security policy rewrite, needs full six-tier manual re-verification |
| Backend scoping | Rewrite 2 scope builders (equality → intersection) | Medium |
| Account creation default | None — primary-zone convention absorbs it | — |
| Frontend | User form → multi-select; DTO/type updates | Medium |
| Target/Coverage Planning | New build (not a retrofit — nothing exists yet): `zone_id` on both `target_plan` and `coverage_plan`, widened unique constraints, BR-PL-01/03 amendments | Medium — greenfield, but must land correctly the first time since no live feature exists to regress |
| Tests | ~5 existing files rewritten + new multi-zone RLS suite + new Target/Coverage Planning suite | Medium |

## 11. Recommendation

Build this once §7's decisions are made. It's the only version of "Fazal-style"
coverage that scales past one person, doesn't over-grant beyond the zones
someone actually covers, and survives real SBU Managers being appointed later
without needing to be unwound. Until then, the SBU Manager promotion (§1) is an
acceptable, cheap stopgap for Fazal specifically — but shouldn't be repeated for
the next person in the same situation, since each repetition further erodes the
zone boundary the model relies on.
