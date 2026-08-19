# Referral Credit & Relationship-Support Activity — Implementation Plan

**Status:** Planned — approved for build, not yet started.
**Date:** 2026-08-11
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

**The account-scoped Opportunity picker — scope widened.** The original doc
scoped this narrowly: "so the relationship-support person has something to
pick from." Planning surfaced that **no path in this codebase today** lets
anyone link a logged Activity to a specific Opportunity when working from
the Account level (`LogActivityModal.tsx` only shows an opportunity at all
when the modal is opened *from inside* that Opportunity's own page — a fixed
prop, never a picker). Since the picker and its backing lookup have to be
built regardless, **decided:** make it available for any activity type
logged from the Account level, not gated to `RELATIONSHIP_SUPPORT` only.

**Flag this plainly, not buried:** the new lookup this requires
(`cabio_app_account_opportunities()`, below) returns every Opportunity's
`id`+`name` under an Account regardless of the caller's SBU/zone tier — a
deliberate, narrow (name-only, no value/stage/owner/financials) widening of
what's visible across the SBU security boundary that ADR-037/BR-FIN-06 treat
seriously elsewhere. It's opt-in (only surfaces when actively logging an
activity from that Account) and was already anticipated for the cross-SBU
relationship-support case specifically; generalizing it to every activity
type is what extends the exposure to everyone. Worth a second look before
building, flagged here so it isn't missed on a read-through.

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

**Migration numbering**: highest on disk is `0016`. Two other plans
(`docs/Multi-Zone-Assignment-Milestone-1-Implementation-Plan.md`,
`docs/Buyback-Freetext-Implementation-Plan.md`) have already claimed `0017`
and `0018` respectively, neither built yet. This migration should use
**`0019`** — re-check `backend/alembic/versions/` at actual build time,
since whichever of the three lands first shifts what's actually free.

**Business rules to add** (`docs/Business-Rules.md`): next free rule numbers
confirmed by grep — **BR-FIN-07** (last is BR-FIN-06) for referral credit,
**BR-ACT-08** (last is BR-ACT-07) for relationship-support activity, plus an
amendment to **BR-ACT-04** generalizing its exemption list.

## Implementation steps

### 1. Migration `0019_referral_credit_and_relationship_support.py`

`down_revision = "0016"` (re-check head at build time — may need to chain
after `0017`/`0018` if either lands first).

```python
def upgrade() -> None:
    op.add_column(
        "opportunity",
        sa.Column("referred_by_user_id", sa.UUID(as_uuid=True), sa.ForeignKey("user_profile.id"), nullable=True),
    )
    op.add_column("opportunity", sa.Column("referred_by_note", sa.Text(), nullable=True))
    op.create_check_constraint(
        "ck_opportunity_referral_not_both",
        "opportunity",
        "NOT (referred_by_user_id IS NOT NULL AND referred_by_note IS NOT NULL)",
    )

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
    op.drop_constraint("ck_opportunity_referral_not_both", "opportunity", type_="check")
    op.drop_column("opportunity", "referred_by_note")
    op.drop_column("opportunity", "referred_by_user_id")
```

### 2. Model — `opportunity/models.py`

- `referred_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=True)`
- `referred_by_note: Mapped[str | None] = mapped_column(Text, nullable=True)`
- `referred_by: Mapped["UserProfile | None"] = relationship(foreign_keys=[referred_by_user_id], lazy="joined")`
  — a second FK to `user_profile` alongside `owner_id`/`owner`; needs its own
  `foreign_keys=` disambiguation, same as `Reminder.closing_activity`
  (`activity/models.py:65-67`) already does for its second FK into `activity`.

### 3. Schemas — `opportunity/schemas.py`

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

### 4. Service — `opportunity/service.py`

No special-case logic needed for persistence — `update_opportunity`'s
existing generic `setattr` loop over `model_dump(exclude_unset=True)`
already handles both new optional fields. No change to `create_opportunity`
beyond the schema already carrying the two new optional fields through.

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

- **BR-FIN-07: Referral Credit (2026-08-11)** — new rule. States: when
  `lead_source_id` resolves to `Referral`, the Opportunity may optionally
  carry either `referred_by_user_id` (any active Cabio user, any SBU/zone —
  same eligibility as BR-ACT-06's Next Action assignee) or
  `referred_by_note` (free text, for a non-Cabio referrer), never both.
  Pure credit record — no split-percentage impact, no RLS visibility grant,
  no SBU/zone revenue rollup effect. Does not apply to the separate
  `OEM Referral` lead source. Enforcement: schema `model_validator` (mutual
  exclusivity) + DB `CHECK` constraint as a backstop. Reference: this doc,
  ADR-013 (rollups this deliberately does *not* feed), BR-ACT-06 (shared
  eligibility rule for the colleague picker).
- **BR-ACT-04 amendment**: update the exemption list from "every
  `activity_type` except `MANAGER_NOTE`" to "except `MANAGER_NOTE` and
  `RELATIONSHIP_SUPPORT`" — add one sentence on why (the logger has no
  standing access to the deal, so a mandatory follow-up on someone else's
  deal doesn't fit; contrast with `MANAGER_NOTE`'s reason, which is "not
  customer-facing").
- **BR-ACT-08: Relationship-Support Activity (2026-08-11)** — new rule.
  States the `RELATIONSHIP_SUPPORT` activity type, its exemption from
  BR-ACT-04 (cross-reference), and the write/read RLS mechanism:
  `cabio_app_opportunity_in_account()` widens the write path,
  `activity_tier_visibility`'s `OR (user_id = cabio_app_uid())` widens the
  read path — both narrow, per-fact grants, never a blanket Opportunity
  visibility grant. **Explicitly document the account-opportunity lookup's
  visibility widening here too** (`cabio_app_account_opportunities()`
  exposes `id`+`name` only, across SBU boundaries, to anyone logging any
  activity from that Account) — cross-reference ADR-037/BR-FIN-06's
  "SBU is an RLS security boundary" framing so this reads as a conscious,
  scoped exception, not an inconsistency with that stance.

### 7. Regenerate `docs/Physical-Schema.sql`

`pg_dump --schema-only` against Dev immediately after applying migration
`0019` — not batched to the end.

### 8. Backend tests

**`backend/tests/domains/opportunity/test_opportunity_service.py`**
(`TestCreateOpportunity`, and a new update-focused block near
`TestReplaceSplits`):
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

### 9. Frontend — referral toggle (4 entry points)

Add to each of: `sales-os-app/src/components/QuickLeadModal.tsx`,
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
  `enabled: isOpen && !!resolvedAccountId && !opportunityId`) calling the
  new service function.
- New `TextField select` ("Related Opportunity (optional)"), shown whenever
  `resolvedAccountId` is set and `opportunityId` prop is **not** fixed —
  available for every activity type (per the scope decision above), not
  gated to `RELATIONSHIP_SUPPORT`. Reset alongside the other fields in the
  `useEffect` at line 92.
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
4. Confirm a normal same-SBU user logging any activity type from the
   Account level can now optionally tag it to one of that account's
   Opportunities via the same picker (the generalized case).
5. Confirm `MANAGER_NOTE` is still exempt from Next Action (regression).
6. Confirm `Physical-Schema.sql` was regenerated and committed alongside
   migration `0019`.

## Ordering

Migration (1) → model (2) → schemas/validators, both domains (3, 5) →
opportunity service — no-op confirmation (4) → activity repository/service/
router (5) → backend tests (8), run suite green → apply to Dev + regenerate
`Physical-Schema.sql` (7) → `Business-Rules.md` (6) → frontend referral
toggle × 4 files (9) → frontend `LogActivityModal.tsx` (10) → regenerate
`types/api.ts` (11) → manual verification on Dev, including the cross-SBU
security check (12).

### Critical files
- backend/alembic/versions/0019_referral_credit_and_relationship_support.py
- backend/app/domains/opportunity/models.py
- backend/app/domains/opportunity/schemas.py
- backend/app/domains/activity/models.py (no change — reference only, `activity_type` already a plain string)
- backend/app/domains/activity/schemas.py
- backend/app/domains/activity/repository.py
- backend/app/domains/activity/service.py
- backend/app/domains/activity/router.py
- backend/tests/domains/opportunity/test_opportunity_service.py
- backend/tests/domains/activity/test_activity_service.py
- sales-os-app/src/screens/OpportunityDetailScreen.tsx
- sales-os-app/src/screens/Customer360Screen.tsx
- sales-os-app/src/screens/ProjectDirectoryScreen.jsx
- sales-os-app/src/components/QuickLeadModal.tsx
- sales-os-app/src/components/LogActivityModal.tsx
- sales-os-app/src/services/masterData.ts
- sales-os-app/src/services/activities.ts
- docs/Business-Rules.md
- docs/Physical-Schema.sql
