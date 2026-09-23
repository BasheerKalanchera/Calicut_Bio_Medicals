# Split Editing Permission — Implementation Plan

**Status:** All decisions settled by Basheer, 2026-09-23 (see "Decided");
ready to build once this plan is approved.
**Business rule:** `docs/Business-Rules.md` BR-FIN-08 (written alongside
this plan).
**Origin:** found during Brand-Level Target Planning manual E2E, step 26
(`docs/Brand-Level-Target-Planning-Manual-E2E-Test-Plan.md`); parked in
`docs/Backlog.md` ("Opportunity split editing: who may change a split").

## The problem, in plain terms

A deal's split decides who gets credit for its revenue. Today, **anyone who
can open a deal can rewrite its split**. Nothing checks who they are.

That matters because several kinds of people can open a deal without owning
or managing it:

- someone who's already on the split (they receive credit);
- someone handed a single follow-up task on the deal, even from another
  business unit (BR-ACT-06 lets them see the deal so they can do the task).

Found live: Vivek (Critical Care) could open the split editor on Basheer K's
Imaging deal just because he'd been given a follow-up. The only thing that
stopped him saving was the rule that *new* people on a split must be from
the deal's business unit. That rule doesn't cover people already on the
split, so he could still have shifted percentages between them, or removed
them.

## Decided (Basheer, 2026-09-23)

1. **Only these people may change a deal's split:** the deal's owner, anyone
   above the owner in the hierarchy, and GM/Admin.
2. **Split participants may not change it** — they receive the credit, so
   they don't set it.
3. **People who can see the deal only through a follow-up task may not
   change it.**
4. **Lighter build:** the server refuses the change, and the screen hides
   the Edit button. No database-level lock (no migration). Every split
   change today goes through one server check, so there's no way round it.
5. **Closed deals** (settles BR-FIN-04's "only while open", unenforced today):
   - **Won:** only the **General Manager** may change the split — not Admin,
     not the owner or their managers. Anyone needing a correction asks the
     GM outside the app. Chosen over a request-and-approve workflow (which
     would need a new table, a migration and approval screens); every split
     change is already recorded in the Audit Log, so the GM's change leaves
     a permanent record anyway.
   - **Lost:** locked for everyone — a Lost deal brings in no revenue, so
     its split affects no figures.
   - **Active / On Hold:** the table below applies as normal.
6. **Area Manager reach:** keep the table below as it is.

## What "above the owner in the hierarchy" means here

The app already has one definition of management reach — the rule that
decides who can *see* a deal. This plan reuses it exactly, minus the two
"visitor" routes (split participant, follow-up assignee), so there's still
one definition of a manager's reach in the app, not two:

| Who | May change the split? | Same as today's "can see" rule? |
|---|---|---|
| Admin, General Manager | Yes, any deal | Yes |
| The deal's owner | Yes | Yes |
| SBU Manager | Yes, deals in their own business unit | Yes |
| Area Manager | Yes, deals in their business unit where the hospital is in their zone(s), **or** the owner reports directly to them | Yes |
| Split participant (not otherwise above) | **No** — read-only | Sees it, can't change it |
| Follow-up assignee (not otherwise above) | **No** — read-only | Sees it, can't change it |
| Anyone else (e.g. other Sales Staff) | No | Can't see it anyway |

Someone who fits two rows (e.g. an Area Manager who's also on the split)
gets the more permissive one. This table applies to **Active and On Hold**
deals; Won and Lost deals follow decision 5 instead.

## What changes

**Server (the real lock):**
- One new check, run before any split change is saved. Anyone outside the
  table above gets a clear refusal: *"Only the deal's owner, their managers,
  or GM/Admin can change this split."* On a Won deal: *"This deal is Won —
  only the General Manager can change its split."* On a Lost deal: *"This
  deal is Lost — its split can no longer be changed."* Nothing is saved.
- A small new "may I edit this split?" answer the screen can ask for, worked
  out by that same check — so the screen and the server can never disagree.
- The existing "not in this Opportunity's SBU" error names the person
  instead of showing their raw ID (bundled in; found in the same E2E step).

**Screen:**
- The Splits tab's **Edit** / **+ Add** button is hidden for anyone who
  isn't allowed. They still see the split itself, read-only.

**Not changing:**
- Who can *see* a deal, or its split — visibility is untouched.
- The default 100% split created automatically when a deal is first made
  (BR-FIN-05) — that's created by the system at creation time, not an edit.
- The same-business-unit rule for new participants (BR-FIN-06) — still
  applies on top of this one.

## Dropped from the original Backlog bundle

**The contributor list offering the wrong business unit's people** — no
longer worth fixing separately. The list shows the *editor's* own business
unit. Under this rule the only people who can edit are the owner, their
managers (same business unit as the deal), and GM/Admin (who already see
everyone). So the mismatch Vivek hit can't happen any more: he won't have
an Edit button at all. Fixing the list as well would add a code change with
no visible effect.

## Technical addendum

- **Check:** new `OpportunityService._can_edit_splits(opportunity, user)`,
  called at the top of `replace_splits` (`opportunity/service.py:476`);
  raises `AuthorizationError` → `403` (already mapped in `main.py:110`).
  Logic mirrors `opportunity_tier_visibility` (`Physical-Schema.sql:3190`)
  minus `cabio_app_has_split()` and `cabio_app_assigned_reminder()`:
  `role in {Admin, General Manager}` · `owner_id == user.id` ·
  `SBU Manager and sbu_id == user.sbu_id` · `Area Manager and sbu_id ==
  user.sbu_id and (account.zone_id in the user's zone_closure descendants
  or owner.manager_id == user.id)`. The zone-tree lookup reuses the
  `ZoneClosure` pattern already in `opportunity/repository.py:134`;
  `get_owner_manager_id` (`repository.py:52`) already exists.
- **Screen signal:** new `GET /opportunities/{id}/splits/can-edit` →
  `{ "can_edit": bool }`, computed by the same method. A dedicated endpoint
  rather than a field on `PipelineOpportunity`, because that schema is
  shared with the pipeline list and would force the check per row.
- **Frontend:** `SplitsTab` (`OpportunityDetailScreen.tsx:507`) queries it
  and hides the Edit / + Add button when `false`. `api.ts` regenerated.
- **Error message:** `service.py:516` — look up display names for the
  rejected ids (extend `get_user_sbu_ids` or add a name lookup) and use
  `"{display_name} is not in this Opportunity's SBU…"`.
- **Closed deals:** the same method checks the opportunity's status
  (`OpportunityStatus.status_code`, ADR-028 — status, not stage) first:
  `LOST` → refuse everyone; `WON` → allow only `role == "General Manager"`;
  `ACTIVE`/`ON_HOLD` → the tier logic above. `can-edit` inherits this.
  Reason-specific messages come from the same method so the screen and
  server stay in step. BR-FIN-04 updated to point here.
- **Tests (service layer, `tests/domains/opportunity/`):** one per table
  row — owner ✓, GM ✓, Admin ✓, SBU Manager same SBU ✓ / other SBU ✗, Area
  Manager zone ✓ / direct report ✓ / neither ✗, split participant ✗,
  follow-up assignee ✗; `can-edit` agrees with `replace_splits` for each;
  error message shows the name; Won: GM ✓, Admin ✗, owner ✗, SBU
  Manager ✗; Lost: GM ✗, Admin ✗, owner ✗; On Hold behaves like Active. Existing 17 split
  tests must still pass — any that save as a non-owner need their acting
  user updated, not the rule loosened.
- **No migration, no RLS change** (lighter build, decided). The RLS policy
  `split_via_opportunity` stays FOR ALL on visibility; the service check is
  the enforcement point, same as BR-FIN-06 today.
- **Sequence:** Basheer approves this plan → build → `/code-review` (medium)
  → manual E2E plan (Simple/Complex tagged) → test → commit → checklist.
  Environment: Dev only; UAT picks it up with the next UAT deploy.
