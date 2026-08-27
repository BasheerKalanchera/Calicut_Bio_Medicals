# Referral Credit & Relationship-Support Activity — Implementation Plan

**Status:** Part 1 (Referral Credit, BR-FIN-07) **shipped 2026-08-18**, migration
`0023_add_referral_credit.py` — confirmed live: `Business-Rules.md`'s `BR-FIN-07`,
`opportunity.referred_by_user_id`/`referred_by_note` + `ck_opportunity_referral_not_both`
in the model, and the 4-entry-point frontend toggle in `OpportunityDetailScreen.tsx`
(and its sibling forms) are all confirmed present in the codebase. **Part 2
(Relationship-Support Activity) built 2026-08-27** (backend, frontend, migration
`0029`, `BR-ACT-10`, tests) — not yet applied to Dev or manually verified, see
`docs/Backlog.md`'s "Referral Credit Part 2" entry for current status. This doc's
stale references to migration `0028`/`BR-ACT-09` (both since claimed by Sales
Development Activities, built same week) are corrected below where the actual
build differs — read the code and `Business-Rules.md` as authoritative over this
doc's original numbering.
**Date:** 2026-08-11 (original plan; Part 1 shipped 2026-08-18, this doc corrected
2026-08-25 to stop describing shipped work as pending — see numbering fixes below)
**Prepared by:** Basheer Kalanchera (with Claude)
**Purpose:** Concrete, ordered implementation plan for parts 2 and 3 of
`docs/Discussion-SplitParticipant-SBU-Scope.md` (v6) — "Referral credit" and
"Relationship-support activity." That doc records the *policy* decision
(three separate ways to recognize cross-SBU contribution, decided
2026-08-05); this doc records the *execution steps*, and — per a planning
conversation on 2026-08-11 — **redesigns §3.2's implementation-level detail**
(the policy itself is unchanged). Part 1 (Split stays same-SBU-any-zone) is
already shipped (`8aff9cd`-era work, 2026-08-07) and is not touched here.

---

## Context

### What changed from the original discussion doc, and why

**Referral credit (§3.2) — redesigned, not just detailed.** The original
sketch was a standalone `referred_by_user_id` column, always editable, with
every edit auto-logged as a new `Activity` note for audit. Two problems
surfaced while planning the execution:

1. It never accounted for a referral **from a customer contact** (a doctor,
   a hospital administrator) — only ever "credit a colleague." Real
   referrals are both.
2. The "auto-log every edit as an Activity" mechanism would have been the
   first time `OpportunityService` reaches into another domain's repository
   (`ActivityRepository`) — a genuinely new architectural pattern for one
   field's audit trail, when the codebase already has a general-purpose
   `updated_by`/`updated_at` audit mechanism.

**Decided instead (2026-08-11):** tie referral credit to the existing
`Lead Source = Referral` selection, not a standalone always-visible field.
When a rep sets Lead Source to **Referral** (and only Referral — not the
separate `OEM Referral` category, which names a partner company, not a
person), one extra input appears: a toggle between **"Cabio colleague"**
(structured picker, any SBU/zone, feeds a future incentive calculation) and
**"External referrer"** (free text, for a customer contact). This reuses an
existing UI pattern in this codebase almost exactly —
`Customer360Screen.tsx`'s "Competitor Equipment" checkbox, which flips an
Installed Asset row between a structured Product picker and a free-text
competitor name. No separate audit-log mechanism — `Opportunity.updated_by`/
`updated_at` already cover "who changed this record and when," and the field
isn't independently versioned.

**Relationship-support activity (§3.3) — implementation confirmed as
designed, one rule refined.** BR-ACT-04 (mandatory Next Action) originally
had no stated position on the new `RELATIONSHIP_SUPPORT` activity type.
**Decided:** exempt it, same mechanism as `MANAGER_NOTE` — the
relationship-support logger has no standing access to the deal at all today
(no owner/split/tier-visibility route reaches them, which is the entire
reason this feature needs a new RLS bypass) — forcing the same mandatory
follow-up flow used by an actual owner/split participant doesn't fit.

**The account-scoped Opportunity picker — scope narrowed back down, 2026-08-25.**
The original 2026-08-11 draft of this plan widened the picker to appear for *any*
activity type logged from the Account level, reasoning that the lookup had to be
built regardless. **Reversed in a 2026-08-25 architecture discussion with
Basheer:** the picker now renders **only when `Activity Type = Relationship
Support` is selected** — not for every note logged from the Account level. The
general-purpose "tag any note to a deal from the Account page" convenience (a
real, separately-noticed gap) is explicitly **dropped from this build**, not
bundled in — it can be picked up later as its own deliberate decision if wanted,
see `docs/Backlog.md`.

**Important nuance, so the remaining effort is scoped accurately:** gating the
*dropdown's rendering* to one activity type is a frontend-only change — it does
**not** shrink the backend security work. The lookup (`cabio_app_account_opportunities()`,
below) still has to exist as a plain, callable capability, and it still has to
return every Opportunity's `id`+`name` under an Account regardless of the
caller's SBU/zone tier, because the backend has no way to know *why* the
frontend is asking. That's the same deliberate, narrow (name-only, no
value/stage/owner/financials) widening of the SBU security boundary
(ADR-037/BR-FIN-06) as before — same manual cross-SBU verification required
(including a raw API call, not just through the gated UI, since gating is a UI
convention, not an enforcement mechanism). What changes is *who realistically
encounters the picker in the UI* and *that the general-purpose version is no
longer shipped as an incidental side effect* — not the size of the backend
build.

## Confirmed current state (verified directly against the codebase)

**LeadSource seed data** (`docs/Seed-Data.sql`): `REFERRAL` and
`OEM_REFERRAL` are two separate existing rows — confirmed distinct, the
toggle only triggers on `REFERRAL`.

**Opportunity model** (`backend/app/domains/opportunity/models.py:23-90`):
no `referred_by_*` columns exist. `owner_id`/`owner` relationship
(`OwnerNested` response shape, `schemas.py:54-59`) is the closest existing
precedent for the new `referred_by` FK + nested response.

**Opportunity schemas/service** (`schemas.py:192-230`, `service.py:178-230`):
`OpportunityUpdate.model_dump(exclude_unset=True)` is applied via a fully
generic `setattr` loop in `update_opportunity` — new optional fields need
*no* special-case service code to be persisted on update.

**No existing "does this FK exist" validation for people-fields**:
`owner_id` is never checked for existence anywhere in `create_opportunity`/
`update_opportunity` — relies entirely on the DB FK constraint (would raise
on a bad UUID, not a clean `NotFoundError`). `referred_by_user_id` follows
the same precedent deliberately — not a new inconsistency.

**Competitor-equipment toggle precedent** (`sales-os-app/src/screens/
Customer360Screen.tsx` — `editAIsCompetitor` checkbox controlling whether
`InstalledAssetCreate` shows a Product `Autocomplete` or a free-text
competitor name field; backend validator `InstalledAssetCreate.
check_product_required`, `backend/app/domains/asset/schemas.py:14-18`) is
the exact shape the referral toggle reuses, front and back.

**Activity model** (`backend/app/domains/activity/models.py:10-39`):
`activity_type: Mapped[str] = mapped_column(String(50), nullable=False)` —
**no DB CHECK constraint**, confirmed against `Physical-Schema.sql:187-198`
(plain `character varying(50)`). `RELATIONSHIP_SUPPORT` is purely an
application-level addition to the `ActivityType` `Literal` in
`activity/schemas.py:8` — no migration needed for the type itself.

**BR-ACT-04 exemption mechanism** (`activity/schemas.py:61-68`,
`_require_next_action_unless_manager_note`): currently a single
`!= "MANAGER_NOTE"` check. Needs generalizing to a set —
`_EXEMPT_FROM_NEXT_ACTION = {"MANAGER_NOTE", "RELATIONSHIP_SUPPORT"}` — not
a second copy-pasted branch. Frontend mirror:
`LogActivityModal.tsx`'s `isManagerNote` boolean (line 72,
`activityType === "MANAGER_NOTE"`) gates both the Next Action tab's
visibility and its client-side required-field checks — same generalization
needed there (`isExempt = activityType === "MANAGER_NOTE" || activityType
=== "RELATIONSHIP_SUPPORT"`).

**The write-path RLS gap (real, confirmed)**: `ActivityRepository.
opportunity_exists()` (`activity/repository.py:23-24`) is a plain
`select(1).where(Opportunity.id == opportunity_id)` run on the same
RLS-scoped session as every other query — for a cross-SBU relationship-
support logger, this returns `False` for an Opportunity that genuinely
exists (RLS silently filters it, not a real 404), so `ActivityService.
log_activity` (`activity/service.py:125-126`) would reject the write today.

**The read-back gap (real, confirmed)**: `activity_tier_visibility`
(`Physical-Schema.sql:1875-1879`, current text —
`(opportunity_id IS NULL) OR (opportunity_id IN (SELECT id FROM
opportunity))`) filters through `opportunity`'s own tier-visibility policy.
A cross-SBU logger's own just-written row would be invisible to them on
read-back without the `OR (user_id = cabio_app_uid())` addition.

**Existing `SECURITY DEFINER` precedent**: `cabio_app_has_split(uuid)` and
`cabio_app_assigned_reminder(uuid)` (`Physical-Schema.sql:85-97`,
`68-81`) are both narrow boolean yes/no functions, `LANGUAGE sql STABLE
SECURITY DEFINER`, `SET search_path = public` (hardened against search-path
hijacking) — `cabio_app_opportunity_in_account()` follows this exactly.
`cabio_app_account_opportunities()` (the lookup) is the **first
row-returning** `SECURITY DEFINER` function in this codebase — same
security shape (`SECURITY DEFINER`, pinned search path), new return shape
(`RETURNS TABLE`, not `RETURNS boolean`) — flagged as a first, not assumed
safe by analogy alone.

**`GET /users?scope=all`** (`organization/repository.py:50-51`,
`Business-Rules.md` BR-ACT-06) already exists, unrestricted, exactly the
picker the "Cabio colleague" referral toggle needs — no backend change.

**A second, independent bug found during planning**: `OpportunityDetailScreen.
tsx` has *two* separate `users` queries with **colliding query keys**. Line
619 (inside the Splits tab) fetches `listUsers("sbu")`. Line 1200 (main
component, feeds the Owner picker) is keyed `["users", "all"]` but actually
calls `listUsers()` with no argument — which defaults to `"scoped"` per
`masterData.ts`'s signature, **not** `"all"` despite the key's name (a
pre-existing naming quirk, not something this plan needs to fix). The new
"Cabio colleague" referral picker needs a genuine `scope="all"` list — it
**cannot** reuse either existing query. It must use its own distinct query
key (e.g. `["users", "referral-picker"]`) calling `listUsers("all")`
explicitly — reusing `["users", "all"]` for this would silently collide
with the existing (differently-scoped) cached data under that same key.

**Account-scoped Opportunity list already exists, but is tier-filtered**:
`GET /accounts/{account_id}/opportunities` (`opportunity/router.py:79-86`
→ `service.list_by_account` → RLS-scoped query) is the existing pattern —
correct for the general case, but would show **nothing** to the one person
this feature is for (a cross-SBU relationship-support logger has no tier
route to those rows). The new lookup endpoint is a second, deliberately
unscoped sibling to this one, not a replacement.

**Migration numbering — corrected 2026-08-25:** Part 1 shipped as `0023_add_referral_credit.py`
(2026-08-18), containing only the `referred_by_user_id`/`referred_by_note` columns and
the `ck_opportunity_referral_not_both` constraint — **not** the two `SECURITY DEFINER`
functions or the `activity_tier_visibility` RLS amendment described in Step 1 below,
which are Part 2 only and were correctly deferred. Highest migration on disk is now
`0026` (`0024`/`0025`/`0026` were the notification-feature migrations, landed
2026-08-24). **Part 2's migration should use `0028`** — `0027` was reassigned to
`Manager-Attested-Gate-Override-Implementation-Plan.md` (2026-08-25, both plans
initially claimed `0027`; Gate Override is being built first as the more contained
change) — and must contain **only** the `SECURITY DEFINER` functions + RLS policy
amendment. Re-check `backend/alembic/versions/` at actual build time regardless,
same caveat as before, since this number will drift again if anything else lands
first.

**Business rules — status corrected 2026-08-25:** **BR-FIN-07 is done** (Referral
Credit, live in `Business-Rules.md`, confirmed 2026-08-18). Still needed: an
amendment to **BR-ACT-04** generalizing its exemption list, and a new rule for
relationship-support activity — **not `BR-ACT-08`** (that number was taken by
Opportunity Document Upload, shipped since this plan was written). Next free is
**BR-ACT-09** — re-check at build time, same caveat.

## Build summary, 2026-08-27 (read this before the steps below — they're the
original plan, kept for the reasoning, but numbering/detail drifted)

**Migration is `0029`, not `0028`** — `0028` was claimed by Sales Development
Activities, built the same week (`docs/Sales-Development-Activities-
Implementation-Plan.md`). File:
`backend/alembic/versions/0029_relationship_support_activity_rls.py`. Contains
only the two `SECURITY DEFINER` functions and the `activity_tier_visibility`
RLS amendment, exactly as scoped below — not applied to Dev yet.

**BR-ACT-10, not BR-ACT-09** — `BR-ACT-09` was also claimed by Sales
Development Activities. Written into `Business-Rules.md` as BR-ACT-10; the
BR-ACT-04/BR-ACT-05 amendments below also landed.

**Exemption mechanism differs from the plan's sketch, for a good reason**:
the plan proposed a fresh `_EXEMPT_FROM_NEXT_ACTION = {"MANAGER_NOTE",
"RELATIONSHIP_SUPPORT"}` set. By build time, Sales Development Activities had
already generalized this into `SALES_DEVELOPMENT_ACTIVITY_TYPES` plus inline
`MANAGER_NOTE` checks at both the next-action and closing-activity sites.
Rather than add a second, overlapping set, both sites now share one
`NOT_CUSTOMER_FACING_TYPES` frozenset (`MANAGER_NOTE` ∪
`SALES_DEVELOPMENT_ACTIVITY_TYPES` ∪ `{"RELATIONSHIP_SUPPORT"}`) —
deliberately *not* merged with the separate account-requirement exemption,
since Relationship Support still requires an Account (unlike the six Sales
Development types). See `activity/schemas.py`.

**Two real gaps found and filled that the plan didn't cover**:
1. **`opportunity_id` is required for `RELATIONSHIP_SUPPORT`** — the plan's
   schema section (step 5) never added this. Without it, logging this type
   would just produce an ordinary Account-level note, which every other
   activity type already covers — the entire point of the feature is tying
   support to a *specific* deal.
2. **`notes` is required for `RELATIONSHIP_SUPPORT`** — same reasoning as
   Sales Development's `OTHER_DEVELOPMENT` requirement: without a
   description, the entry is a name attached to someone else's deal with no
   record of what was actually done.

**Everything else matches the plan as written** — the two `SECURITY DEFINER`
functions, the `activity_tier_visibility` amendment, the
`opportunity_exists() OR opportunity_in_account()` fallback in
`log_activity`, the `OpportunityLookup` schema (deliberately distinct from
`OpportunityNested`), the new lookup endpoint, and the "Related Opportunity"
picker gated to `activityType === "RELATIONSHIP_SUPPORT"` only.

**Verified, 2026-08-27:** 619/619 backend tests pass (11 new, covering the
cross-SBU OR-fallback, the two new required-field validators, the BR-ACT-05
exclusion, and the lookup endpoint's 200/404 shapes), `ruff` clean, `tsc
--noEmit` and `npm run lint` clean (0 errors). Migration `0029` applied to
Dev, `Physical-Schema.sql` regenerated and reviewed. **Manual verification
complete, all 16 cases pass** — including the cross-SBU flow (step 12.3),
run live as Fahad doubling as both the same-SBU sanity check and the
cross-SBU test subject — see
`docs/Referral-Credit-And-Relationship-Support-Manual-E2E-Verification.md`.
One finding recorded there: the RLS widening turned out tighter than
planned — a cross-SBU logger's own note text reads back, but the linked
Opportunity's *name* stays invisible even on their own entry, since the
nested `opportunity` relationship load still goes through Opportunity's own
RLS. Feature is done.

## Implementation steps

### 1. Migration — **DONE** (columns/constraint) / **remaining** (RLS pieces only)

**Already shipped**, `0023_add_referral_credit.py` (2026-08-18): the
`referred_by_user_id`/`referred_by_note` columns and
`ck_opportunity_referral_not_both` constraint below are **live** — do not
recreate them. What's left is a **new, separate migration** —
`0028_relationship_support_activity_rls.py` (re-check the actual next-free
number at build time) — containing only the two `SECURITY DEFINER`
functions and the RLS policy amendment:

```python
# Already live via 0023_add_referral_credit.py -- shown here for context only,
# do NOT repeat these in the new migration:
#
#   op.add_column(
#       "opportunity",
#       sa.Column("referred_by_user_id", sa.UUID(as_uuid=True), sa.ForeignKey("user_profile.id"), nullable=True),
#   )
#   op.add_column("opportunity", sa.Column("referred_by_note", sa.Text(), nullable=True))
#   op.create_check_constraint(
#       "ck_opportunity_referral_not_both",
#       "opportunity",
#       "NOT (referred_by_user_id IS NOT NULL AND referred_by_note IS NOT NULL)",
#   )

def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.cabio_app_opportunity_in_account(
            p_opportunity_id uuid, p_account_id uuid
        )
        RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
        SET search_path = public
        AS $$
            SELECT EXISTS (
                SELECT 1 FROM opportunity
                WHERE id = p_opportunity_id AND account_id = p_account_id
            )
        $$;
        """
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.cabio_app_account_opportunities(p_account_id uuid)
        RETURNS TABLE(id uuid, name text)
        LANGUAGE sql STABLE SECURITY DEFINER
        SET search_path = public
        AS $$
            SELECT o.id, o.name FROM opportunity o
            WHERE o.account_id = p_account_id
            ORDER BY o.name
        $$;
        """
    )

    op.execute(
        """
        ALTER POLICY activity_tier_visibility ON activity USING (
            opportunity_id IS NULL
            OR opportunity_id IN (SELECT id FROM opportunity)
            OR user_id = cabio_app_uid()
        );
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER POLICY activity_tier_visibility ON activity USING (
            opportunity_id IS NULL
            OR opportunity_id IN (SELECT id FROM opportunity)
        );
        """
    )
    op.execute("DROP FUNCTION IF EXISTS public.cabio_app_account_opportunities(uuid);")
    op.execute("DROP FUNCTION IF EXISTS public.cabio_app_opportunity_in_account(uuid, uuid);")
    # referred_by_user_id/referred_by_note/ck_opportunity_referral_not_both belong to
    # 0023_add_referral_credit.py -- that migration's own downgrade() handles them,
    # not this one.
```

### 2. Model — `opportunity/models.py` — **DONE, shipped 2026-08-18**

- `referred_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=True)`
- `referred_by_note: Mapped[str | None] = mapped_column(Text, nullable=True)`
- `referred_by: Mapped["UserProfile | None"] = relationship(foreign_keys=[referred_by_user_id], lazy="joined")`
  — a second FK to `user_profile` alongside `owner_id`/`owner`; needs its own
  `foreign_keys=` disambiguation, same as `Reminder.closing_activity`
  (`activity/models.py:65-67`) already does for its second FK into `activity`.

### 3. Schemas — `opportunity/schemas.py` — **DONE, shipped 2026-08-18**

- `OwnerNested` (existing, line 54) is reused as-is for the response's
  `referred_by` field — no new nested class needed.
- `OpportunityCreate`/`OpportunityUpdate`: add
  `referred_by_user_id: uuid.UUID | None = None` and
  `referred_by_note: str | None = None` to both. Fully optional — no
  `model_validator` forcing presence even when `lead_source_id` resolves to
  Referral (matches the "why not give an option" framing — opt-in, not
  mandatory).
- Add one `model_validator(mode="after")` to each (or a shared mixin, if
  that reads cleaner) enforcing "not both set" client-side for a clean `422`
  rather than relying solely on the DB `CHECK` constraint's `500`:
  ```python
  @model_validator(mode="after")
  def _check_referral_not_both(self) -> "OpportunityCreate":  # / Update
      if self.referred_by_user_id is not None and self.referred_by_note:
          raise ValueError("Referral credit is either a Cabio colleague or a free-text note, not both.")
      return self
  ```
  Check at build time whether `model_validator` is already imported into
  this file (the Buyback free-text plan, `0018`, adds it too — if that
  lands first, reuse the existing import rather than duplicating it).
- `OpportunityResponse`: add `referred_by_user_id: uuid.UUID | None`,
  `referred_by_note: str | None`, `referred_by: OwnerNested | None`.

### 4. Service — `opportunity/service.py` — **DONE, shipped 2026-08-18**

No special-case logic needed for persistence — `update_opportunity`'s
existing generic `setattr` loop over `model_dump(exclude_unset=True)`
already handles both new optional fields. No change to `create_opportunity`
beyond the schema already carrying the two new optional fields through.

---

**Everything below this point (Steps 5–8, 10–12) is Part 2 — Relationship-Support
Activity — and is what's actually still outstanding.** Step 9 (frontend referral
toggle) is also done, marked below in place.

### 5. Activity — schemas / repository / service / router

**`activity/schemas.py`**:
- `ActivityType` literal: add `"RELATIONSHIP_SUPPORT"`.
- Generalize the exemption check:
  ```python
  _EXEMPT_FROM_NEXT_ACTION = {"MANAGER_NOTE", "RELATIONSHIP_SUPPORT"}

  @model_validator(mode="after")
  def _require_next_action_unless_exempt(self) -> "ActivityCreate":
      if self.activity_type not in _EXEMPT_FROM_NEXT_ACTION:
          if not self.next_action_text:
              raise ValueError("Next Action is required to log this activity.")
          if not self.next_action_due_date:
              raise ValueError("Next Action Due Date is required to log this activity.")
      return self
  ```
  (Rename from `_require_next_action_unless_manager_note` — the old name is
  no longer accurate.)

**`activity/repository.py`** (`ActivityRepository`):
- New method `opportunity_in_account(self, opportunity_id: uuid.UUID, account_id: uuid.UUID) -> bool`
  — raw SQL call to `cabio_app_opportunity_in_account(:opportunity_id, :account_id)`
  via `self.db.execute(text(...))`, mirroring how existing `*_exists` helpers
  are shaped but calling the new function instead of querying the table
  directly.
- New method `list_account_opportunities_lookup(self, account_id: uuid.UUID) -> list[tuple[uuid.UUID, str]]`
  — raw SQL call to `SELECT * FROM cabio_app_account_opportunities(:account_id)`.

**`activity/service.py`** (`ActivityService.log_activity`, line ~125):
```python
if data.opportunity_id:
    visible = self.repository.opportunity_exists(data.opportunity_id)
    in_account = self.repository.opportunity_in_account(data.opportunity_id, data.account_id)
    if not (visible or in_account):
        raise NotFoundError(f"Opportunity {data.opportunity_id} not found")
```
New method `list_account_opportunities_lookup(self, account_id) -> list[...]`
— thin pass-through to the repository, `NotFoundError` if the account itself
doesn't exist (reuse `account_exists`, same pattern as `list_by_account`
above it).

**`activity/router.py`**: new endpoint,
`GET /accounts/{account_id}/opportunities/lookup` →
`APIResponse[list[OpportunityLookup]]` where `OpportunityLookup` is a new
minimal schema (`id: uuid.UUID`, `name: str`) — deliberately not
`OpportunityNested` reused, to keep this response shape visibly distinct
from the tier-scoped one and avoid it being mistaken for a fully-authorized
Opportunity reference elsewhere.

### 6. Business rules — `docs/Business-Rules.md`

- ~~**BR-FIN-07: Referral Credit**~~ — **DONE, shipped 2026-08-18**, live in
  `Business-Rules.md` exactly as originally drafted. Nothing left to do here.
- **BR-ACT-04 amendment** (still outstanding): update the exemption list from "every
  `activity_type` except `MANAGER_NOTE`" to "except `MANAGER_NOTE` and
  `RELATIONSHIP_SUPPORT`" — add one sentence on why (the logger has no
  standing access to the deal, so a mandatory follow-up on someone else's
  deal doesn't fit; contrast with `MANAGER_NOTE`'s reason, which is "not
  customer-facing").
- **BR-ACT-09** (still outstanding — renumbered 2026-08-25: `BR-ACT-08` was
  taken by Opportunity Document Upload, shipped since this plan was written;
  re-check the actual next-free `BR-ACT-` number at build time) —
  **Relationship-Support Activity**, new rule.
  States the `RELATIONSHIP_SUPPORT` activity type, its exemption from
  BR-ACT-04 (cross-reference), and the write/read RLS mechanism:
  `cabio_app_opportunity_in_account()` widens the write path,
  `activity_tier_visibility`'s `OR (user_id = cabio_app_uid())` widens the
  read path — both narrow, per-fact grants, never a blanket Opportunity
  visibility grant. **Explicitly document the account-opportunity lookup's
  visibility widening here too** (`cabio_app_account_opportunities()`
  exposes `id`+`name` only, across SBU boundaries, callable by anyone —
  **the frontend only invokes it when Activity Type = Relationship Support
  is selected (2026-08-25 scope decision), but the function itself carries
  no such restriction, since that's a UI convention, not a backend
  enforcement mechanism**) — cross-reference ADR-037/BR-FIN-06's
  "SBU is an RLS security boundary" framing so this reads as a conscious,
  scoped exception, not an inconsistency with that stance.

### 7. Regenerate `docs/Physical-Schema.sql`

`pg_dump --schema-only` against Dev immediately after applying the new
relationship-support-activity migration — not batched to the end.

### 8. Backend tests

~~**`backend/tests/domains/opportunity/test_opportunity_service.py`**~~ — **DONE**,
Part 1's referral tests shipped 2026-08-18 alongside the feature. Kept below for
reference only, not remaining work:
- Create/update with `referred_by_user_id` set — persists, response nests
  `referred_by`.
- Create/update with `referred_by_note` set — persists, `referred_by` nested
  field is `None`.
- Both set simultaneously — `ValidationError` (schema-level, pure
  construction test, same shape as the Buyback plan's analogous test).
- Neither set — unaffected, both `None`.

**`backend/tests/domains/activity/test_activity_service.py`** (confirm exact
filename at build time):
- `RELATIONSHIP_SUPPORT` activity without `next_action_text`/
  `next_action_due_date` — succeeds (schema-level test:
  `ActivityCreate(activity_type="RELATIONSHIP_SUPPORT", ...)` constructs
  without error).
- `MANAGER_NOTE` still exempt — regression check, since the exemption logic
  moved from a single check to a set.
- `log_activity` with an `opportunity_id` that fails `opportunity_exists`
  but succeeds `opportunity_in_account` (mock both repository methods) —
  activity is created, not rejected.
- `log_activity` with an `opportunity_id` that fails **both** — still
  raises `NotFoundError` (regression check — the OR must not become an
  unconditional pass).
- New: `list_account_opportunities_lookup` — thin pass-through test,
  `NotFoundError` when the account doesn't exist.

**Not unit-testable — flag for manual verification instead**: the RLS
policy amendment itself (`OR user_id = cabio_app_uid()` on
`activity_tier_visibility`, and both new `SECURITY DEFINER` functions) only
takes effect against a real Postgres connection with RLS enabled — this
repo's service-layer tests mock the repository/session, so they cannot
exercise Postgres's actual policy evaluation. Step 11 below is the real
check for this, not a substitute unit test.

### 9. Frontend — referral toggle (4 entry points) — **DONE, shipped 2026-08-18**

Confirmed live: `["users", "referral-picker"]` query and
`referred_by_user_id`/`referred_by_note` handling all present in
`OpportunityDetailScreen.tsx` (checked 2026-08-25). Kept below for reference only.

Added to each of: `sales-os-app/src/components/QuickLeadModal.tsx`,
`sales-os-app/src/screens/Customer360Screen.tsx` (Add Opportunity modal),
`sales-os-app/src/screens/ProjectDirectoryScreen.jsx` (create form),
`sales-os-app/src/screens/OpportunityDetailScreen.tsx` (edit form, near the
existing Lead Source field at line ~1578-1589) — same field-parity
precedent as BR-OP-13/REPEAT_ORDER (Issue 1):

- Conditionally rendered: only when the selected Lead Source's `name ===
  "REFERRAL"` (reuse the existing `editLeadSourceCode`-style lookup pattern
  already present in `OpportunityDetailScreen.tsx` line 1381 for
  `REPEAT_ORDER` — same shape, different value).
- A checkbox/toggle ("External referrer (not Cabio staff)"), mirroring
  `Customer360Screen.tsx`'s `editAIsCompetitor` pattern exactly:
  - Off (default): `TextField select` populated from a **new**,
    distinctly-keyed `useQuery` (`["users", "referral-picker"]` →
    `listUsers("all")`) — must not reuse either of `OpportunityDetailScreen.
    tsx`'s two existing `users` queries (see the query-key collision found
    above).
  - On: free-text `TextField` for the external referrer's name/relationship.
- `openEditOpp`/create-form initializers seed both fields; `handleUpdateOpp`/
  create payload include whichever of `referred_by_user_id`/
  `referred_by_note` is populated (`null` for the other); `applyOppPatch`
  reconciles `referred_by` the same way `owner`/`lead_source` are
  reconciled today (line ~1373).

### 10. Frontend — `LogActivityModal.tsx`

- Add `RELATIONSHIP_SUPPORT` to `ACTIVITY_TYPES` (line 23-30) — pick an
  icon/emoji consistent with the existing set's style.
- Generalize `isManagerNote` (line 72) to `isExempt = activityType ===
  "MANAGER_NOTE" || activityType === "RELATIONSHIP_SUPPORT"` — replace all
  four existing `isManagerNote` usages (Next Action tab visibility ×2,
  submit validation, tab reset-on-type-change at line 212).
- New service function `sales-os-app/src/services/activities.ts`:
  `listAccountOpportunitiesLookup(accountId): Promise<{id: string; name:
  string}[]>` → `GET /accounts/{accountId}/opportunities/lookup`.
- New state `const [selectedOpportunityId, setSelectedOpportunityId] =
  useState("")`; new `useQuery` (`["opportunities", "lookup", accountId]`,
  `enabled: isOpen && !!resolvedAccountId && !opportunityId &&
  activityType === "RELATIONSHIP_SUPPORT"`) calling the new service
  function — **the added `activityType` condition is the 2026-08-25 scope
  change**, so the lookup isn't even fetched unless this specific activity
  type is selected.
- New `TextField select` ("Related Opportunity"), shown whenever
  `resolvedAccountId` is set, `opportunityId` prop is **not** fixed, **and**
  `activityType === "RELATIONSHIP_SUPPORT"` — **narrowed 2026-08-25**, no
  longer available for every activity type. Reset alongside the other
  fields in the `useEffect` at line 92, and also cleared if the user
  switches away from `RELATIONSHIP_SUPPORT` to a different activity type
  after having picked one.
- `handleSubmit`'s `logActivity(...)` call: `opportunity_id: opportunityId
  ?? (selectedOpportunityId || undefined)`.
- Existing "Linked to this opportunity" chip (line 240-250) stays for the
  fixed-`opportunityId` case; the new picker only appears in the
  complementary case (no fixed `opportunityId`), so the two never show
  together.

### 11. `types/api.ts`

`npm run generate:types` after backend changes are running — picks up the
two new `Opportunity` fields, the `referred_by` nested object, the new
`RELATIONSHIP_SUPPORT` literal member, and the new lookup endpoint's
response shape automatically. No manual edits.

### 12. Manual verification on Dev

1. **Referral toggle, all 4 entry points**: select Lead Source = Referral →
   toggle appears; select `OEM Referral` → toggle does **not** appear;
   switch between colleague-picker and free-text modes, confirm the other
   field clears; save, reload, confirm the right one persisted and
   round-trips into the edit form correctly.
2. Attempt to save with both somehow set (e.g. via a raw API call) — expect
   a `422`, not a `500`.
3. **Cross-SBU relationship-support flow** — the real security-relevant
   check, can't be skipped: log in as a user with **zero** existing
   visibility into a specific Opportunity (no owner/split/tier/assigned-
   reminder route to it — pick one deliberately outside their SBU). Confirm:
   (a) they can see the parent Account, (b) the "Related Opportunity" picker
   in Log Activity shows that Opportunity by name, (c) logging a
   `RELATIONSHIP_SUPPORT` activity against it succeeds with no Next Action
   required, (d) they can read that activity back afterward (the RLS
   read-back fix), (e) they still **cannot** open the Opportunity itself or
   see any of its other detail (owner, value, stage) — the widening is
   name-only, confirm it stays that way.
4. **Confirm the picker does NOT appear for any activity type other than
   Relationship Support** (narrowed 2026-08-25) — log a normal Call/Visit/Email
   note from the Account level and confirm no "Related Opportunity" dropdown
   renders; switch the Activity Type selector to Relationship Support and
   confirm it appears; switch away again and confirm it disappears and any
   selection is cleared.
5. Confirm `MANAGER_NOTE` is still exempt from Next Action (regression).
6. Confirm `Physical-Schema.sql` was regenerated and committed alongside
   the new relationship-support-activity migration (`0028` at time of
   writing — re-check).

## Ordering — corrected 2026-08-25, Part 1 (steps 1–4, 9) already done

**Remaining work:** activity schemas/repository/service/router (5) →
backend tests (8), run suite green → apply migration `0028` (RLS pieces
only) to Dev + regenerate `Physical-Schema.sql` (7) → `Business-Rules.md`
(6) → frontend `LogActivityModal.tsx` (10) → regenerate `types/api.ts` (11)
→ manual verification on Dev, including the cross-SBU security check (12).

### Critical files — remaining work only
- backend/alembic/versions/0028_relationship_support_activity_rls.py (new — re-check number)
- backend/app/domains/activity/models.py (no change — reference only, `activity_type` already a plain string)
- backend/app/domains/activity/schemas.py
- backend/app/domains/activity/repository.py
- backend/app/domains/activity/service.py
- backend/app/domains/activity/router.py
- backend/tests/domains/activity/test_activity_service.py
- sales-os-app/src/components/LogActivityModal.tsx
- sales-os-app/src/services/activities.ts
- docs/Business-Rules.md
- docs/Physical-Schema.sql

(`QuickLeadModal.tsx`, `Customer360Screen.tsx`, `ProjectDirectoryScreen.jsx`,
`OpportunityDetailScreen.tsx`, and `services/masterData.ts` were Part 1's files —
already shipped 2026-08-18, not touched by the remaining work.)
