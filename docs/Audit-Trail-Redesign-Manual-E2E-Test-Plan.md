<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Audit Trail Redesign — Manual E2E Test Plan

**Covers:** `docs/Audit-Trail-Redesign-Implementation-Plan.md`.
**Built:** `24f5607`, `ce56c22`, `b0ba088`, `8842d67`, `c91e51e`, `9a6d98d`, `fb5b7e6`.
**Where:** Dev (migration 0059, `alembic current` = 0059 head; `Physical-Schema.sql` regenerated in `24f5607`).

## Checked against live data

Checked read-only on Dev, 2026-10-03, with all three RLS settings
(user, role, SBU) set and verified. Each line names real users and records
from the database, or says `n/a — <reason>`.

- **Who sees:** only Admin (Abdul Latheef P) and General Manager (Haroon
  Sidheeq) see the Audit Log; everyone else gets no screen. `audit_log` has
  0 "Added" rows today.
- **Who can approve:** n/a — no approval is part of this feature.
- **Who can save:** target plans only by their owner — Vivek's 2026-Q3 plan
  (1 hospital, 2 brand splits, PENDING_APPROVAL), so section B needs Vivek's
  login. Opportunity lines: Haroon owns "Activity visibility test" (1 line,
  0 splits, 0 contacts, 1 document). Users and products are edited by Admin/GM.
- **Existing values:** "Test - Area Manager" (inactive) has no extra zones;
  zone "Test Zone" exists under Bangalore; brand "E2E Test Brand" exists.

Button labels, messages and the order of checks are taken from the code,
not the design doc.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Not testable from the screen:** cascaded child deletes and direct-database
edits (blank "Changed by": "Direct database access (no logged-in user)").
Covered by the 8/8 rolled-back Dev checks and the backend tests.

## Pre-flight

- P1. [Simple] Dev backend restarted since the last backend change (`fb5b7e6`). — Pass (2026-10-03, Basheer: already restarted)
- P2. [Simple] Signed in as Haroon Sidheeq, Audit Log open; note the newest card's time. — Pass (newest card 03 Oct 2026, 05:58 pm)

## A — User zones (save by diff)

1. [Simple] Users → Edit User "Test - Area Manager" → Add zone "Test Zone" → Save. **Expected:** one new card, tag ADDED, "User Zone", "Changed by: Haroon Sidheeq". — Pass (card 03 Oct 2026, 07:26 pm, confirmed by reading the Audit Log: only that one new card)
2. [Simple] Edit the same user, change nothing, Save. **Expected:** no new card. — Pass (2026-10-03, Audit Log re-read: newest card still 07:26 pm)
3. [Simple] Remove "Test Zone", Save. **Expected:** one new card, tag REMOVED. — Pass (2026-10-03, Basheer checked the Audit Log)

## B — Target plan hospitals and brand splits (signed in as Vivek)

1. [Complex: second user, cross-screen] Revise Vivek's 2026-Q3 plan, change only the change note, "Submit for approval". **Expected:** Target Plan CHANGED only; no Target Plan Hospital or Brand Split rows. — Pass (2026-10-03, 09:10 pm, Basheer: one card, Target Plan CHANGED, change_note only)
2. [Complex: cross-screen] Move amount between the two brand splits (total unchanged), submit. **Expected:** only the changed Target Plan Brand Split rows CHANGED; plan card "Changed by" is Vivek. — Pass (2026-10-03, 09:11 pm, Basheer: Brand Split ELECTROSCIENCE 30 → 31 and EDAN 21 → 20 CHANGED; plan row shows only the change note, so the total was untouched; Changed by Vivek)
3. [Complex: cross-screen] Add one hospital, submit. **Expected:** Target Plan Hospital ADDED and Target Plan CHANGED (total), in one card group for the one save. — Pass (2026-10-03, 09:12 pm, Basheer: Test hospital 2 ADDED in the same card as the plan change; KIMS 51 → 42 CHANGED. The plan total did not change because the amounts were rebalanced, so no total row, which is correct)
4. [Complex: cross-screen] Remove that hospital, submit. **Expected:** Target Plan Hospital REMOVED. — Pass (2026-10-03, 09:13 pm, Basheer: Test hospital 2 REMOVED; KIMS 42 → 51 CHANGED)

## C — Opportunity product lines (existing parent)

1. [Simple] "Activity visibility test" → products Edit → Add Product → Save. **Expected:** Opportunity Product ADDED, card titled with the Opportunity. — Pass (2026-10-03, Basheer: two cards, Opportunity Product ADDED plus Opportunity CHANGED for indicative value; the Audit Log needed a manual refresh to show them)
2. [Complex: multi-step] Edit → change only the first line's "Qty" → Save. **Expected:** one CHANGED row for that line; the other line absent. — Pass (2026-10-03, 08:02 pm, read in the Audit Log after reload: Opportunity Product "SonoScape P60 Exp USG Machine" CHANGED, qty 1 → 2 and value 25 → 50; HD-550 line absent; plus Opportunity CHANGED, indicative value 30 → 55)
3. [Simple] Edit → Delete (trash icon) on the added line → Save. **Expected:** Opportunity Product REMOVED. — Pass (2026-10-03, Basheer)

## D — Creating a record is not logged

1. [Complex: creates a permanent record, may leave an Activity row on shared Dev] Create a new Opportunity "E2E Audit test" with 2 products. **Expected:** nothing in the Audit Log for it. — Pass (2026-10-03, Basheer created it himself after my CREATE click did not save; no Audit Log card)
2. [Simple] Edit its name, Save. **Expected:** Opportunity CHANGED only. — Pass (2026-10-03, Basheer; the Audit Log needed F5 to show the card; accepted, the screen stays mounted, and Admin/GM don't need live refresh)

## E — Other tables

1. [Simple] Product Catalog → Edit a test product → add a few words to "Description" → "Save Changes"; then revert. **Expected:** Product CHANGED old → new description; reverting gives a second CHANGED. (Product name is not editable; it comes from Brand and Model.) — Pass (2026-10-03, Basheer)
2. [Simple] Upload, then remove, a document on "Activity visibility test". **Expected:** Document ADDED, then REMOVED. — Pass (2026-10-03, Basheer)

## F — Audit Log screen

1. [Simple] "What happened" = Added, then Changed, then Removed. **Expected:** only that tag shows each time. — Pass (2026-10-03, Basheer)
2. [Simple] Table filter "User Zone". **Expected:** only section A cards. — Pass (2026-10-03, Basheer)
3. [Simple] Sign in as Arun Adarsh. **Expected:** no Audit Log screen. — Pass (2026-10-03, Basheer)
4. [Complex: visual] Page through the list. **Expected:** "Page x of y (n saves)"; no save split across pages; a filter with no match shows "No audit entries match these filters." — Pass (2026-10-03, Claude drove it: footer "Page 1 of 3 (106 saves)"; page 1 ends 22 Sept 05:31 pm, page 2 starts 22 Sept 04:11 pm, no save split; From = 01 Dec 2027 shows the empty message)
