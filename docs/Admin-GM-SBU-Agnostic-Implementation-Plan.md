# Admin/GM SBU-Agnostic — Implementation Plan

**Status:** Shipped, migration `0022` applied to Dev, 2026-08-17. All 5
real Admin/GM `user_profile` rows confirmed `sbu_id = NULL` live.
`/auth/me` verified working end-to-end for all 3 real accounts (Basheer
K, Haroon Sidheeq, Abdul Latheef P) by exercising the exact code path
directly against Dev — the one thing that could have locked them out of
login is confirmed safe. Full 519-test backend suite green, `ruff check`
clean on every changed file, frontend `tsc --noEmit`/`npm run lint`
clean. **One item not done:** `Physical-Schema.sql` regen — needs
`docker run postgres:17 pg_dump`, and Docker Desktop's engine isn't
running on this machine (CLI present, daemon unreachable). Needs
Basheer to run the regen command from this doc's own "in scope" section
5, or start Docker Desktop first.
**Date:** 2026-08-16

## Context

`user_profile.sbu_id` is `NOT NULL` today, so every Admin/General Manager
row carries a real SBU value even though Admin/GM are an unrestricted
overlay tier, not members of any SBU — the value is a meaningless
placeholder, not real membership. This was first surfaced 2026-07-28
(`docs/Backlog.md`) as a deferred item; this plan supersedes that entry
with a fresh, fully re-investigated scope, since a lot of the code that
item worried about has since been rebuilt (Zone Hierarchy, Multi-Zone
Milestone 1, Sales Manager Tier Collapse, BR-OP-12) and the actual risk
picture has changed — mostly for the better.

**Investigated 2026-08-16, full audit of every RLS policy and every
Python-level `.sbu_id` read.** Headline finding: the database security
layer (RLS) is **already completely safe** — every policy that checks
`sbu_id` (`opportunity`, `activity`/`document`/`reminder`,
`product` — migrations `0009`–`0012`, `0014`) is written as
`cabio_app_role_name() IN ('Admin', 'General Manager') OR sbu_id =
cabio_app_sbu_id()` — the Admin/GM branch is role-only and never
evaluates `cabio_app_sbu_id()` at all. Making the column nullable changes
nothing at the policy layer. Same story in Python:
`organization/repository.py`'s `list_active` (assignment pickers) and
`UserService`'s BR-ORG-01 same-SBU manager check both already branch on
role name first and never touch an Admin/GM's own `sbu_id` — already
written nullable-safe, with comments in the code acknowledging it.

**One genuinely dangerous gap found that the original Backlog item never
mentioned:** `organization/schemas.py`'s `UserMeResponse.sbu: SBUNested`
is required, not nullable. This is the `/auth/me` response, built via
`model_validate(from_attributes=True)`, called on **every login**. Left
unfixed, the moment an Admin/GM's `sbu_id` goes `NULL`, Pydantic
validation fails building this response and **that user cannot log in at
all** — not a cosmetic gap, a hard lockout. This must be fixed first in
the sequence, not incidentally.

**Confirmed no user-facing behavior change needed on Opportunity/Product
creation:** Opportunity creation already requires Admin/GM to explicitly
pick an SBU via dropdown, no default (`BR-OP-12`, shipped 2026-08-04) —
verified the placeholder `sbu_id` passed into `create_opportunity` is
already ignored and overridden by the mandatory `data.sbu_id` for
Admin/GM. Product creation already requires an explicit SBU on every
create, for every role, never defaulted from the caller. Account has no
`sbu_id` column at all — not applicable.

**One real exception found, and decided 2026-08-17 (Basheer): option
(b) below.** User Directory's own "Add User" form (`UserDirectoryScreen.
tsx`) unconditionally requires SBU — `if (!form.sbu_id) throw new Error
("SBU is required")`, no role exception — so creating a *new* Admin/GM
today already forces a placeholder pick, same as everything else, but
unlike Opportunity/Product this one genuinely needs a fix, not just
confirmation it's already fine. This is now in scope (item 6, resolved
below), and makes this plan not purely backend after all.

## What's in scope

**1. Migration** (new alembic revision):
`ALTER TABLE user_profile ALTER COLUMN sbu_id DROP NOT NULL;` and backfill
existing Admin/GM rows (`Haroon Sidheeq`, `Abdul Latheef P`, `Basheer K`)
to `sbu_id = NULL`.

**2. `UserProfile` model** (`organization/models.py`):
`sbu_id: Mapped[uuid.UUID | None]`, `sbu: Mapped[SBU | None]`.

**3. Fix `UserMeResponse` first, before anything else touches live data**
(`organization/schemas.py:27`): `sbu: SBUNested | None`. Whatever builds
this response (`auth.py`, mirroring `_to_user_list_response`'s pattern)
needs the matching `None`-safe construction. This is the one change that
must land and be verified *before* the backfill step runs on Dev, so
there's never a window where a NULL-sbu_id Admin/GM tries to log in
against old schema code.

**4. `UserListResponse.sbu_id`** (`organization/schemas.py:37`):
`uuid.UUID | None` — matches `master_data.py`'s existing pass-through,
no logic change needed there.

**5. `set_rls_context()`** (`app/db/session.py`): add the same
`None`-guard the now-dead `cabio_app_zone_id()` GUC used to have —
`str(user.sbu_id) if user.sbu_id is not None else ""` — so
`app.current_sbu_id` resolves through the existing
`NULLIF(current_setting(...), '')::uuid` SQL helper (`0009`) to a clean
NULL, not the literal string `"None"`.

**6. `UserCreate.sbu_id` — decided 2026-08-17: option (b), properly
optional for Admin/GM, not just deferred to a post-creation edit.**
   - **Backend** (`organization/schemas.py:57`,
     `organization/service.py`'s `create_user`): `UserCreate.sbu_id:
     uuid.UUID | None = None`; `create_user` gets a role-conditional
     check mirroring the existing BR-ORG-01 pattern — `sbu_exists()`
     only called, and only required, when `role_id` isn't Admin/GM;
     `BusinessRuleViolation` if a non-Admin/GM role omits it (mirrors
     `OpportunityService`'s existing "SBU is required... as Admin or
     General Manager" vs. "only Admin/GM may omit it" framing, just
     inverted).
   - **Frontend** (`UserDirectoryScreen.tsx`): the `if (!form.sbu_id)
     throw new Error("SBU is required")` checks (create and save
     handlers) need the same role exception — skip/relax when
     `form.role_id` resolves to Admin or General Manager. The SBU field
     itself should probably disable or hide when those roles are
     selected, mirroring how the Opportunity/Quick-Lead SBU pickers
     already behave for Admin/GM (no default, explicit choice only —
     same pattern, just the reverse: here the field goes away rather
     than becoming mandatory).
   - This is the one piece of this plan that touches the frontend —
     everything else is backend-only.

**7. Docs**: `Physical-Schema.sql` (column nullability), `ADR.md`/
`Business-Rules.md` if either documents the constraint — confirmed
neither currently mentions `sbu_id`'s nullability explicitly, so likely
just the schema regen, not a business-rule rewrite.

## What's confirmed already safe — no change needed

- Every RLS policy referencing `sbu_id` (verified by reading all 6
  migrations directly, not assumed).
- `organization/repository.py`'s `list_active` (assignment pickers,
  split-participant scoping) — already role-branches before touching
  `current_user.sbu_id`.
- `UserService`'s BR-ORG-01 same-SBU manager check — already exempts
  Admin/GM managers by role name.
- `OpportunityService.create_opportunity` (BR-OP-12) — placeholder
  `sbu_id` param already dead code for Admin/GM, overridden by mandatory
  `data.sbu_id`.
- Product creation — always requires explicit `sbu_id`, no caller-default
  logic exists for any role.
- Split-participant SBU matching (`opportunity/service.py`) — an
  Admin/GM's `sbu_id` (placeholder today, `NULL` after) never equals a
  real opportunity's `sbu_id` either way, so the existing rejection
  behavior (Admin/GM can't be split participants) is unchanged, verified
  consistent before and after.
- `Account` — no `sbu_id` column at all, not applicable.

## What's explicitly out of scope

- No change to how any other role's `sbu_id` behaves — this is Admin/GM
  only.
- No change to Opportunity/Product creation's SBU picker — both already
  handle Admin/GM correctly, confirmed by inspection, not touched here.
- Sidebar/zone display placeholder-hiding for Admin/GM — already done,
  2026-08-04 (`DemoApp.tsx`), not reopened here.

## Verification

1. Run the migration + backfill against Dev.
2. **Immediately** log in as Haroon Sidheeq, Abdul Latheef P, and
   Basheer K (all three real Admin/GM accounts) — confirm `/auth/me`
   succeeds and the app loads normally. This is the one check that
   actually matters; everything else in this plan was already confirmed
   safe by code inspection.
3. Spot-check: create an Opportunity as Admin, create a Product as GM —
   confirm the existing explicit-SBU-dropdown behavior is unchanged.
4. Create a **new** Admin/GM user via User Directory — confirm the SBU
   field is skippable and the resulting row genuinely has `sbu_id =
   NULL`, not a placeholder. Create a new Sales Staff/Area Manager/SBU
   Manager user in the same session — confirm SBU is still required for
   them (the role-conditional check didn't loosen it for everyone).
5. Guard-green: `pytest` (full suite), `ruff check`, `npx tsc --noEmit`,
   `npm run lint`.

## Effort estimate

Half a day to a day. Smaller than the original Backlog framing suggested
— the RLS audit was the part that could have hidden real risk and it
turned out clean. The real work is narrow and sequential: fix
`UserMeResponse` and `set_rls_context()` first, then the migration, then
the two remaining schema tweaks, then item 6's backend + frontend change,
then the verification pass (login-as-Admin/GM plus the new-user-creation
checks above). The frontend piece (item 6) is small — one form, a
handful of lines — but real, so this isn't purely a backend change
despite starting out looking like one.
