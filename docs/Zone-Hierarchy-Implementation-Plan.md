# Zone Hierarchy Redesign — Implementation Plan

**Status:** Planned — approved for build, not yet started.
**Date:** 2026-08-11
**Prepared by:** Basheer Kalanchera (with Claude)
**Purpose:** Concrete, ordered implementation plan for
`docs/Zone-Hierarchy-Technical-Design.md` — that doc records the
*decisions* (schema shape, RLS approach, screen design); this doc records
the *execution steps* (exact SQL, files, tests, sequencing). Real
geography content to seed comes from `docs/Zone-Hierarchy-Territory-Data-
2026-08.md`, referenced here, not duplicated.

---

## Context

**Hard sequencing dependency, restated from the Technical Design doc:**
this migration must chain after Multi-Zone Assignment Milestone 1
(`docs/Multi-Zone-Assignment-Milestone-1-Implementation-Plan.md`, not yet
built), because it rewrites the *same* `opportunity_tier_visibility`
Area Manager branch that Milestone 1 rewrites first. **Do not start this
plan until Milestone 1 has shipped and passed its own six-tier manual
verification.**

## Confirmed current state (verified directly against the codebase)

**`Zone` model** (`backend/app/domains/reference/models.py:34-43`):
```python
class Zone(Base):
    __tablename__ = "zone"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool | None] = mapped_column(Boolean, server_default="true")
    user_profiles: Mapped[list["UserProfile"]] = relationship(back_populates="zone", lazy="select")
    accounts: Mapped[list["Account"]] = relationship(back_populates="zone", lazy="select")
```
No `parent_zone_id`, no depth concept. **`name` is globally `UNIQUE`** —
a real constraint to relax (below), not just an implementation detail:
once districts/taluks are real rows, two different branches could
plausibly want the same place name (India has many duplicate
place names across states/regions) — the constraint needs to become
per-parent, not global.

**Self-referencing FK precedent, already proven in this codebase**
(`backend/app/domains/account/models.py:36-49`, `Account.parent_account_id`):
```python
parent_account_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("account.id"), nullable=True)
parent_account: Mapped["Account | None"] = relationship(back_populates="child_accounts", remote_side="Account.id", lazy="joined")
child_accounts: Mapped[list["Account"]] = relationship(back_populates="parent_account", lazy="select")
```
`Zone.parent`/`Zone.children` follow this exact shape — `remote_side`,
`lazy="joined"` for the single parent (cheap), `lazy="select"` for the
children collection (avoid eager-loading an entire subtree by accident).

**Current live RLS policy** (`docs/Physical-Schema.sql:1936-1940`, i.e.
*before* Milestone 1 lands):
```sql
CREATE POLICY opportunity_tier_visibility ON public.opportunity USING (
  (cabio_app_role_name() = ANY (ARRAY['Admin','General Manager']))
  OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
  OR (cabio_app_role_name() = 'Area Manager' AND sbu_id = cabio_app_sbu_id()
      AND account_id IN (SELECT id FROM account WHERE account.zone_id = cabio_app_zone_id()))
  OR (cabio_app_role_name() = 'Sales Manager' AND owner_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid()))
  OR (owner_id = cabio_app_uid())
  OR cabio_app_has_split(id)
  OR cabio_app_assigned_reminder(id)
);
```
**This plan does not rewrite this text directly.** Milestone 1 rewrites
the Area Manager clause first, to:
```sql
AND account_id IN (SELECT id FROM account WHERE zone_id IN (SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid()))
```
(exact text from `Multi-Zone-Assignment-Milestone-1-Implementation-Plan.
md` step 1). **This plan's migration assumes that text is already live**
and rewrites *that* clause a second time, into the closure-based version
(§4 of the Technical Design doc). Re-confirm Milestone 1's actual landed
SQL against `Physical-Schema.sql` at build time before writing this
migration's `ALTER POLICY` — do not assume the plan text matches exactly
what shipped.

**Migration numbering:** highest on disk is `0017`
(`0017_add_opportunity_item_description_and_nullable_product.py`,
Buyback, built). Multi-Zone Milestone 1 claims `0018` (not built);
Referral Credit & Relationship-Support claims `0019` (not built,
independent of this feature). This migration needs **`0020`** if both of
those land first in that order — but since this plan's only hard
dependency is on Milestone 1 specifically (not Referral Credit), the
actual number depends on build order at the time. **Re-verify
`backend/alembic/versions/` and chain `down_revision` off Milestone 1's
actual migration, whatever number it ends up being** — do not hardcode
`0020` blindly.

**Frontend role-gate precedent** (`sales-os-app/src/DemoApp.tsx:21,37,219`):
```ts
const ADMIN_ROLES = new Set(["Admin", "General Manager"]);
...
{ id: "users", label: "User Directory", icon: "👥", adminOnly: true },
...
section.items.filter((item) => !item.adminOnly || ADMIN_ROLES.has(userProfile?.role_name))
```
The new Territory Management nav entry follows this exact pattern — add
one `NAV_SECTIONS` entry with `adminOnly: true`, no new gating mechanism.

**Backend role-gate precedent** (`opportunity/service.py`):
`_SBU_OVERRIDE_ROLES = {"Admin", "General Manager"}`, checked in
`create_opportunity`. The new territory-admin endpoints use an analogous
domain-local constant, same set, same shape — not a new authorization
pattern.

**Trigram search precedent** (`opportunity/models.py:30-32`):
```python
Index("idx_opportunity_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"})
```
The zone-name search-mode picker (Technical Design §5) reuses this exact
index shape on `zone.name`, not a new search technology.

**Existing zone-filter pickers to generalize** (both currently flat
`<TextField select>` / `<Menu>` pickers over the same `listZones()` call):
- `sales-os-app/src/screens/CustomerDirectoryScreen.jsx:59,94,117-128,167,230,280-284`
- `sales-os-app/src/screens/OpportunityPipelineScreen.tsx:226,234-235,252,347`
  (built this session, `docs/Pipeline-Zone-Filter-Implementation-Plan.md`)

**Delete-then-reinsert precedent** (`opportunity/repository.py`,
`replace_splits()`) — the shape `zone_closure` subtree recompute reuses:
delete affected rows, reinsert fresh, single `flush()`. Already reused
once by Milestone 1's planned `replace_zones()`.

**`zone_exists()`** already exists on `UserRepository`
(`organization/repository.py:96-99`) — reusable as-is for validating a
`parent_zone_id` on create.

## Implementation steps

### 1. Migration `00XX_zone_hierarchy_tree_and_closure.py`

`down_revision` = Milestone 1's actual migration id (re-verify at build
time, see above).

```python
def upgrade() -> None:
    op.add_column("zone", sa.Column("parent_zone_id", sa.UUID(as_uuid=True), sa.ForeignKey("zone.id"), nullable=True))
    op.add_column("zone", sa.Column("zone_level", sa.String(20), nullable=True))

    # Relax global uniqueness to per-parent uniqueness -- two different
    # branches may legitimately want the same place name once districts/
    # taluks are real. Known minor gap, flagged not silently accepted:
    # Postgres treats each NULL as distinct for UNIQUE purposes, so a
    # composite (parent_zone_id, name) constraint alone would NOT catch two
    # top-level (parent_zone_id IS NULL) zones sharing a name -- add a
    # partial unique index for that one case specifically.
    op.drop_constraint("zone_name_key", "zone", type_="unique")  # confirm actual constraint name at build time
    op.create_unique_constraint("uq_zone_parent_name", "zone", ["parent_zone_id", "name"])
    op.create_index(
        "uq_zone_root_name", "zone", ["name"],
        unique=True, postgresql_where=sa.text("parent_zone_id IS NULL"),
    )

    op.create_table(
        "zone_closure",
        sa.Column("ancestor_zone_id", sa.UUID(as_uuid=True), sa.ForeignKey("zone.id"), primary_key=True),
        sa.Column("descendant_zone_id", sa.UUID(as_uuid=True), sa.ForeignKey("zone.id"), primary_key=True),
    )
    op.create_index("idx_zone_closure_descendant", "zone_closure", ["descendant_zone_id"])

    # Self-row per existing zone -- every zone is its own ancestor/descendant
    # at distance zero. Real hierarchy content (parents, new districts/
    # taluks/clusters) is a SEPARATE data-seeding migration (step 8), not
    # this one -- this migration only establishes the mechanism.
    op.execute("INSERT INTO zone_closure (ancestor_zone_id, descendant_zone_id) SELECT id, id FROM zone;")

    # Rewrites the Area Manager clause Milestone 1 already rewrote once
    # (flat user_zone membership) into closure-based tree membership.
    # RE-CONFIRM this matches Milestone 1's actual landed policy text
    # before running -- do not assume, re-read Physical-Schema.sql.
    op.execute(
        """
        ALTER POLICY opportunity_tier_visibility ON opportunity USING (
            cabio_app_role_name() = ANY (ARRAY['Admin','General Manager'])
            OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
            OR (
                cabio_app_role_name() = 'Area Manager'
                AND sbu_id = cabio_app_sbu_id()
                AND account_id IN (
                    SELECT id FROM account WHERE zone_id IN (
                        SELECT descendant_zone_id FROM zone_closure
                        WHERE ancestor_zone_id IN (SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid())
                    )
                )
            )
            OR (cabio_app_role_name() = 'Sales Manager' AND owner_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid()))
            OR owner_id = cabio_app_uid()
            OR cabio_app_has_split(id)
            OR cabio_app_assigned_reminder(id)
        );
        """
    )


def downgrade() -> None:
    # Reverts to Milestone 1's flat set-membership version, NOT all the way
    # back to the pre-Milestone-1 scalar version -- that's Milestone 1's own
    # downgrade's job, not this migration's.
    op.execute(
        """
        ALTER POLICY opportunity_tier_visibility ON opportunity USING (
            cabio_app_role_name() = ANY (ARRAY['Admin','General Manager'])
            OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
            OR (
                cabio_app_role_name() = 'Area Manager'
                AND sbu_id = cabio_app_sbu_id()
                AND account_id IN (SELECT id FROM account WHERE zone_id IN (SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid()))
            )
            OR (cabio_app_role_name() = 'Sales Manager' AND owner_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid()))
            OR owner_id = cabio_app_uid()
            OR cabio_app_has_split(id)
            OR cabio_app_assigned_reminder(id)
        );
        """
    )
    op.drop_index("idx_zone_closure_descendant", table_name="zone_closure")
    op.drop_table("zone_closure")
    op.drop_index("uq_zone_root_name", table_name="zone")
    op.drop_constraint("uq_zone_parent_name", "zone", type_="unique")
    op.create_unique_constraint("zone_name_key", "zone", ["name"])  # only safe if no per-parent duplicate names exist yet
    op.drop_column("zone", "zone_level")
    op.drop_column("zone", "parent_zone_id")
```

### 2. Models

**`reference/models.py`, `Zone`:**
```python
parent_zone_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("zone.id"), nullable=True)
zone_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
parent: Mapped["Zone | None"] = relationship(back_populates="children", remote_side="Zone.id", lazy="joined")
children: Mapped[list["Zone"]] = relationship(back_populates="parent", lazy="select")
```

**New `ZoneClosure` model** (`reference/models.py`, no `Base` mixin needed
— this table has no audit columns, it's a derived/computed index, not a
user-editable record):
```python
class ZoneClosure(Base):
    __tablename__ = "zone_closure"
    ancestor_zone_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("zone.id"), primary_key=True)
    descendant_zone_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("zone.id"), primary_key=True)
```

### 3. Closure maintenance — `reference/repository.py` (new methods on a
`ZoneRepository`, create this file/class if it doesn't already exist —
confirm at build time)

**Design revised, 2026-08-11 (later) — dropped the incremental delete/
reinsert algorithm originally sketched here, in favor of a single,
always-correct full-table rebuild on every edit.** An incremental
"recompute just the affected subtree" algorithm is exactly the kind of
logic where an off-by-one silently over- or under-grants RLS visibility —
a security-relevant bug, not a data-hygiene one, and hard to catch by
inspection. Given the whole tree stays in the low hundreds of rows even
fully built out pan-India, and zone-map edits are rare and deliberate
(admin actions, not something happening while someone's just using the
app — already stated in the Discussion doc), **there's no reason to
accept that risk for a performance gain nobody needs.** One code path,
always exercised the same way, is safer than two subtly different ones
(incremental + a separate full-rebuild-as-safety-net) that could disagree
with each other.

- **`rebuild_all_closure()`** — the *only* closure-maintenance method.
  Called after every create, rename, move, and deprecate — not just as a
  manual safety net. Truncates `zone_closure` and repopulates it in one
  statement:
  ```sql
  TRUNCATE zone_closure;
  INSERT INTO zone_closure (ancestor_zone_id, descendant_zone_id)
  WITH RECURSIVE ancestry AS (
      SELECT id AS descendant_zone_id, id AS ancestor_zone_id FROM zone
      UNION ALL
      SELECT ancestry.descendant_zone_id, zone.parent_zone_id
      FROM ancestry
      JOIN zone ON zone.id = ancestry.ancestor_zone_id
      WHERE zone.parent_zone_id IS NOT NULL
  )
  SELECT ancestor_zone_id, descendant_zone_id FROM ancestry;
  ```
  Self-terminating (stops climbing once `parent_zone_id IS NULL`, i.e. at
  a root), provably correct by construction — every zone's full ancestor
  chain including itself, nothing more. Deliberately runs inside the same
  transaction as the triggering `zone` write (create/rename/move/
  deprecate), so `zone_closure` is never observably stale between the two.
  Also exposed directly to the Admin screen as the manual "rebuild
  everything" safety-net action from the Technical Design — same method,
  no separate code path to keep in sync.
- **`blast_radius(zone_id)`**: `COUNT(*)` of `account`/`user_zone` rows
  whose `zone_id` is in `(SELECT descendant_zone_id FROM zone_closure
  WHERE ancestor_zone_id = :zone_id)` — read-only, backs the pre-move/
  pre-deprecate confirmation UI (§5, §7).

### 4. `organization/repository.py` — Area Manager scope generalization

`TEAM_SCOPE_BUILDERS["Area Manager"]` — currently (post-Milestone-1) a
flat `UserProfile.zone_id.in_(subquery of caller's user_zone rows)`.
Rewrite to join through `ZoneClosure`: candidate's `zone_id` must be a
`descendant_zone_id` of any zone the caller is an `ancestor_zone_id` for
via their own `user_zone` rows — same closure-join shape as the RLS
policy in step 1, applied in SQLAlchemy instead of raw SQL.

### 5. Territory Admin backend — new `zone` domain additions

**`reference/schemas.py`** (or wherever `Zone`-facing schemas currently
live — confirm at build time): `ZoneCreate` (name, parent_zone_id,
zone_level), `ZoneUpdate` (name, parent_zone_id — re-parenting is just
changing this field), `ZoneTreeNode` (id, name, zone_level, children:
list[self], for the tree-view response), `ZoneBlastRadius` (account_count,
user_count).

**Service** (new `ZoneAdminService` or extend an existing reference
service — confirm placement at build time):
- `create_zone`: validate `parent_zone_id` exists (`zone_exists()`,
  already present), insert, call `rebuild_all_closure()`.
- `rename_zone`: plain `name` update — no closure impact, `zone_closure`
  is keyed by id, not name — but call `rebuild_all_closure()` anyway for
  the same one-code-path reason as §3, not because renaming needs it.
- `move_zone` (re-parent): validate the new parent isn't a descendant of
  the zone being moved (cycle guard — same reasoning as
  `AccountService._creates_cycle`, reuse that function's pattern, not a
  new one), update `parent_zone_id`, call `rebuild_all_closure()`.
- `deprecate_zone` — **explicit visibility decision, not left implicit
  (real gap found in review, 2026-08-11 later — flagged by Basheer, this
  was previously stated only as "does not touch any existing FK" without
  saying what that means for RLS specifically):**
  - Sets `is_active = false` (column already exists on `Zone` today,
    unused until now). Does **not** delete the row, does **not** touch any
    existing `account.zone_id`/`user_zone.zone_id` row pointing at it, and
    does **not** remove it from `zone_closure` — deliberately, not by
    omission.
  - **Consequence, stated plainly: a deprecated zone's existing RLS
    visibility grants are grandfathered, not revoked.** Anyone already
    assigned via `user_zone` keeps seeing exactly what they saw before —
    deprecating is not a way to silently cut off access. This mirrors an
    existing precedent in this exact codebase, `BR-FIN-06`'s split
    grandfathering (`Business-Rules.md`): "participants already persisted
    ... are exempt from this check — only participants new to that
    specific save are validated." Same shape here — existing assignments
    are exempt, only *new* ones are gated.
  - **What deprecation actually gates: new assignments only.** The zone
    picker (§6) filters `is_active = true`, so a deprecated zone can't be
    newly selected for an Account or a `user_zone` row going forward. The
    admin CRUD endpoints (`create_zone`/`move_zone`) also reject a
    `parent_zone_id` pointing at a deprecated zone — you can't attach new
    structure under a deprecated node either.
  - **This is a policy call, not a purely technical one — flagged for
    Basheer's explicit confirmation, not decided unilaterally here.** The
    alternative (deprecation *does* revoke existing access, forcing
    reassignment first) is a real option too, but risks silently locking a
    rep out of their own live deals as a side effect of unrelated
    administrative housekeeping — the grandfathering approach above is
    the recommendation, matching this codebase's established preference
    (BR-FIN-06) for "existing stays, only new is gated."
  - **The blast-radius check (§7) is the actual safety net for this** —
    before confirming a deprecate, the admin sees exactly how many
    Accounts/Users still actively point at the zone, so grandfathering
    is an informed choice, not a blind one.
- `blast_radius`: thin pass-through to the repository method above.
- `rebuild_all_closure`: thin pass-through, Admin/GM only, also directly
  exposed as the manual safety-net action (§3 — same method every write
  path already calls, not a separate mechanism).

**Router** (`reference/router.py` or a new `zone_admin/router.py` —
confirm placement): `POST /admin/zones`, `PATCH /admin/zones/{zone_id}`,
`GET /admin/zones/tree`, `GET /admin/zones/{zone_id}/blast-radius`,
`POST /admin/zones/rebuild-closure`. All gated
`role_name in {"Admin", "General Manager"}`, `AuthorizationError`
otherwise — same shape as `_SBU_OVERRIDE_ROLES` checks elsewhere.

### 6. Shared zone picker component — frontend

New `sales-os-app/src/components/ZonePicker.tsx` (or similar), two modes
per the Technical Design:
- **Default:** no picker rendered — caller passes the acting user's own
  `zone_id`, used silently.
- **Search/override:** a `TextField` with debounced search against a new
  `GET /master-data/zones/search?q=` endpoint (backed by the trigram
  index from step "Confirmed current state"), resolving directly to a
  zone id/name pair — not a cascading menu.

Replace the flat picker in:
- `CustomerDirectoryScreen.jsx` (lines ~59-284, cited above)
- `OpportunityPipelineScreen.tsx` (lines ~226-347, cited above)
- Account create/edit (`Customer360Screen.tsx`, `QuickLeadModal.tsx` —
  confirm exact zone-picker locations at build time, not yet audited in
  this pass)
- User Directory's zone assignment (already touched once by Milestone
  1's "+Add another zone" UI — this generalizes that same picker to be
  tree-aware, not a second separate rebuild)

### 7. Territory Admin screen — frontend

New `sales-os-app/src/screens/TerritoryAdminScreen.tsx`. Tree view
(expand/collapse per node), inline add/rename/move/deprecate actions.
Move and deprecate both show the blast-radius count (step 5's endpoint)
before confirming, with copy reassuring the admin per the "map edits
never touch ownership or rewrite history" principle already stated in the
Discussion doc — don't just show a number with no context.
**Deprecate's confirmation copy specifically must state the
grandfathering behavior from §5** ("N accounts and M people are still
assigned here — they'll keep working exactly as before; this only stops
new assignments"), not just show a bare count — the whole point of
surfacing the blast radius is informed consent to grandfathering, not a
generic "are you sure?".

New `DemoApp.tsx` nav entry:
```ts
{ id: "territories", label: "Territory Map", icon: "🗺️", adminOnly: true },
```
Same section as `users`/`catalog` (Administration section, per the
existing `NAV_SECTIONS` grouping — confirm exact section at build time).

### 8. Seed real data — new migration or a one-off script

Separate from step 1 (schema-only). Seeds the gathered-and-still-
partially-open data from `Zone-Hierarchy-Territory-Data-2026-08.md`:
North Kerala's 5 districts, South Kerala's 9 districts + 2 taluk splits,
Karnataka's Bangalore 5 zones (Zone 5 gap left genuinely absent — do not
invent a placeholder), Karnataka South/Central/Coastal clusters, Dharwad.
Two new top-level rows: Kerala, Karnataka — existing North/South/Central
Kerala, Bangalore, Mangalore zones get `parent_zone_id` set to these,
**keeping their existing ids** (zero FK migration risk on existing
Account/UserProfile/user_zone rows).

**Prerequisite check, not assumed:** confirm which of the named people
(Adarsh, Vivek, Irfan, Shruthi, Rudrappa, Om Hiremath, Dhanushma, Nagesh
Ninganoor, Ravikumar, Fahad, Fazal) already have `user_profile` rows in
Dev before writing their `user_zone` assignments — "Staff New" and the
Dharwad subdealer relationship likely don't, and their territories stay
unassigned until they do, not force-assigned to a placeholder user.

Call `rebuild_all_closure()` once at the end of this seeding step, rather
than computing closure incrementally row-by-row during a bulk insert —
simpler and just as cheap given the total row count.

### 9. Business rules — `docs/Business-Rules.md`

New rule (next free `BR-ORG-` or a new `BR-ZONE-` prefix — confirm
numbering at build time against what Milestone 1's own `BR-ORG-02` ends
up being) describing: the territory tree's existence, that visibility
scales via closure (not just direct assignment), and that map edits
(add/rename/re-parent/deprecate) never reassign ownership or rewrite past
reports — the two principles already stated in the Discussion doc, now
with a concrete rule reference.

### 10. Regenerate `docs/Physical-Schema.sql`

Immediately after applying the schema migration (step 1) to Dev — not
batched to the end.

### 11. Tests

- Closure repository tests: `rebuild_all_closure()` on a fresh multi-level
  tree produces exactly the expected `(ancestor, descendant)` pairs,
  including self-rows; on a move (re-parenting a subtree with its own
  children), the old external ancestor links are gone and the new ones
  are present, while internal subtree links are unchanged; idempotency
  (running twice gives the same result); `blast_radius` counts correctly
  across a multi-level subtree.
- `move_zone` cycle guard: attempting to move a zone under its own
  descendant is rejected, mirroring `AccountService._creates_cycle`'s
  existing test coverage shape.
- **`deprecate_zone` grandfathering, the gap found in review**: a
  `user_zone` row and an `account.zone_id` pointing at a zone both survive
  `deprecate_zone` unchanged; the zone's rows in `zone_closure` are
  unchanged too (deprecating must not call anything that would drop them);
  a *new* `create_zone`/`move_zone` targeting a deprecated zone as parent
  is rejected.
- `TEAM_SCOPE_BUILDERS["Area Manager"]` rewrite: extend Milestone 1's own
  test (`test_area_manager_scoped_to_own_sbu_and_zone_and_self`) with a
  multi-level case — an Area Manager assigned to a State-level zone sees
  candidates in a District three levels down.
- RLS policy — same caveat as every other plan this session: schema-level
  tests can't fully exercise real Postgres policy evaluation. Manual
  verification (step 12) is the real check, and is the one that actually
  proves the deprecation-grandfathering behavior end-to-end, not just at
  the repository layer.
- Router tests for the 5 new admin endpoints, including the Admin/GM
  authorization gate rejecting every other role.

### 12. Manual six-tier verification (required — High risk, same
designation as Milestone 1, not reduced by inheritance from it)

1. Multi-level Area Manager case: assign an Area Manager to a State-level
   zone (e.g. "Kerala"), confirm they see Opportunities across every
   zone/district/taluk under it, nothing from an unrelated branch
   (Karnataka).
2. Single-level Area Manager (control, same as today/Milestone 1):
   unchanged behavior.
3. Admin/GM: still fully unrestricted.
4. SBU Manager, Sales Manager, Sales Staff: unchanged (none of these
   tiers touch zone logic).
5. Territory Admin screen: create a new district, confirm it appears
   correctly nested; move a district to a different parent, confirm
   blast-radius count is accurate *before* confirming, and that
   Opportunity ownership/past reports are unaffected *after* confirming.
6. **Deprecate a zone that has a live Area Manager assigned to it via
   `user_zone`, with an Opportunity underneath** (the actual gap flagged
   in review, not just a picker check): confirm that Area Manager can
   *still see that Opportunity* after deprecation — RLS visibility is
   genuinely grandfathered, not just "the FK row wasn't deleted." Then
   confirm the deprecated zone no longer appears when searching the zone
   picker for a *new* assignment.
7. Run `rebuild_all_closure()` manually (the same method every write path
   already calls, per §3) — confirm it's a no-op against current state,
   i.e. re-running it doesn't change any existing visibility.
8. Zone picker (both modes) on at least two of the four touched screens
   (step 6) — default-to-own-zone shows zero clicks for a single-zone
   user; search resolves a taluk-level place name correctly.

## Ordering

Confirm Milestone 1 is live and verified (prerequisite, not a step here)
→ migration (1) → models (2) → closure repository (3) → Area Manager
scope rewrite (4), tests alongside (11) → territory admin backend (5) →
regenerate `Physical-Schema.sql` (10) → manual six-tier verification of
the RLS/backend layer alone (12, items 1-4) before any frontend work
starts → shared zone picker (6) → territory admin screen (7) → seed real
data (8) → business rules doc (9) → full manual verification including
the new screen (12, items 5-8).

### Critical files
- backend/alembic/versions/00XX_zone_hierarchy_tree_and_closure.py
- backend/app/domains/reference/models.py
- backend/app/domains/reference/repository.py
- backend/app/domains/reference/schemas.py
- backend/app/domains/reference/router.py (or new zone_admin/ module)
- backend/app/domains/organization/repository.py
- backend/tests/domains/reference/ (new test files)
- backend/tests/domains/organization/test_organization_repository.py
- sales-os-app/src/components/ZonePicker.tsx (new)
- sales-os-app/src/screens/TerritoryAdminScreen.tsx (new)
- sales-os-app/src/screens/CustomerDirectoryScreen.jsx
- sales-os-app/src/screens/OpportunityPipelineScreen.tsx
- sales-os-app/src/screens/Customer360Screen.tsx
- sales-os-app/src/components/QuickLeadModal.tsx
- sales-os-app/src/screens/UserDirectoryScreen.tsx
- sales-os-app/src/DemoApp.tsx
- docs/Business-Rules.md
- docs/Physical-Schema.sql
