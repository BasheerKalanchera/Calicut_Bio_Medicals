# Audit Trail Extension (opportunity_item / split / stakeholder) — Manual E2E Test Plan

**Status:** All 18 cases run live against Dev 2026-09-09/10 (Haroon
Sidheeq, General Manager), on Opportunity "USG M/c - Test Aug 18"
(Fahad) plus one Stakeholder on its Account (Aster MIMS Calicut). **Two
real bugs found and fixed during this pass** (see below), both
re-verified live after fixing. Migration `0041` applied to Dev,
`Physical-Schema.sql` regenerated. 727/727 backend tests pass, `ruff`
clean.

**Second bug found and fixed:** `Stakeholder` was added to
`_RECORD_LABEL_RESOLVER_MAP` but not `_MODEL_DISPLAY_ATTR` —
`_resolve_display_values` looks up every `_RECORD_LABEL_RESOLVER_MAP`
model in `_MODEL_DISPLAY_ATTR`, so this threw a bare `KeyError` and
**500'd the entire Audit Log endpoint** the moment any stakeholder audit
row existed, for every table, not just stakeholder. Surfaced live as a
"Couldn't load the audit log" error right after the first stakeholder
edit; reproduced directly against Dev with the real traceback via a
throwaway script (`db.get`-style RLS context set manually, since the
plain app-role connection returns 0 rows silently on this RLS-protected
table). Fixed by adding the missing `_MODEL_DISPLAY_ATTR` entry; also
added `test_every_record_label_resolver_model_has_a_display_attr`,
mirroring the existing field-resolver version of that check but for
`_RECORD_LABEL_RESOLVER_MAP` (which the original check didn't cover —
that's exactly why this slipped through initially).

**Follow-on addendum, same day:** raised by Basheer during review —
`opportunity_item`/`split` rows showed only a raw record id
(`397ad3a4-...`) with nothing tying them back to their Opportunity, and
`stakeholder` rows nothing tying them back to their Account. Generalized
further on his call to include `opportunity` rows showing their Account
too. Added a `_PARENT_CONTEXT_MAP` (`opportunity`→Account,
`opportunity_item`/`split`→Opportunity, `stakeholder`→Account) — a live
lookup against the row's own table for UPDATE (the parent FK rarely
changes, so it's almost never in the diff itself), falling back to the
DELETE snapshot's own captured FK when the row itself is gone. New tests
guard the same `_MODEL_DISPLAY_ATTR` KeyError class the bug above hit,
this time for `_PARENT_CONTEXT_MAP`'s target models.

**Second follow-on, same day:** Basheer asked for the chip to be
clickable, to jump straight to the parent Opportunity/Account rather than
just naming it. Backend response reshaped from a single formatted string
to structured `parent_type`/`parent_id`/`parent_label` fields so the
frontend has an id to navigate with. `AuditLogScreen.tsx` now takes
`onSelectOpportunity`/`onSelectAccount` props — same click-through
pattern `NotificationBell`/`UrgentNotificationDialog` already use
(`DemoApp.tsx`'s `handleSelectOpportunity`/`handleSelectAccount`) — and
the chip calls the right one based on `parent_type`. Verified live: the
Opportunity chip on a Split row opens that Opportunity's detail screen;
the Account chip on that Opportunity's own row opens Customer 360 for
that Account. 738/738 backend tests pass, `ruff`/`tsc` clean.

**Bug found and fixed:** `replace_items`/`replace_splits` were
unconditionally reassigning `updated_by` on every line in the resubmitted
list, including ones nobody touched — since `service.py` sets the current
actor's id on every constructed item/split regardless of whether it
changed, this made an *untouched* line dirty (and fire a spurious audit
row) whenever the current actor differed from whoever last saved it.
Confirmed live: editing only one of two products on this Opportunity
produced a genuine UPDATE for the edited line, but *also* a bogus
`updated_by`-only row for the untouched Buyback line. Fixed by only
reassigning fields (including `updated_by`) when the line's real content
actually changed. Re-verified live with a second edit — only the edited
line produced an audit row. New regression tests added:
`test_unchanged_resave_by_a_different_actor_does_not_bump_updated_by` in
both `TestReplaceItems` and `TestReplaceSplits`. 726/726 backend tests
pass, `ruff` clean.

**Also found and fixed during this pass (frontend, cosmetic, not a data
bug):** `AuditLogScreen.tsx`'s `TABLE_OPTIONS` was never extended for
`stakeholder`/`opportunity_item`/`split` — missing from the filter
dropdown, shown as the raw lowercase table name instead of a label. Data
itself was never hidden; only the label/filter. Fixed, verified live
(dropdown now offers Stakeholder/Opportunity Item/Split, filtering by
Split works correctly).

**Also noted, not a bug:** `AuditLogScreen` is "always mounted" in the
background (existing, pre-dating this work) so switching to it via the
sidebar doesn't refetch — only a full reload or changing a filter does.
Tripped up testing at first (looked empty when it was just stale); not
something this build changed or needs to fix.

## Setup

- Admin or General Manager login (the **Audit Log** screen — 📜, sidebar —
  is Admin/GM-only).
- One Opportunity with **at least 2 line items** and **at least 1 split
  participant** already on it — any existing Dev Opportunity you're
  comfortable editing works; this feature only adds audit *capture*, it
  never deletes or alters real business data.
- One Account with **at least 1 Stakeholder** already on it.
- Two browser tabs/windows helps (one to make the edit, one on the Audit
  Log screen filtered to that record) but isn't required — the screen can
  just be refreshed after each edit.

## What the feature actually does (context for why these cases are shaped
this way)

Three more tables now feed the existing Audit Log: `stakeholder`,
`opportunity_item`, `split`. `stakeholder` was already edited in place, so
it's a plain trigger addition. `opportunity_item`/`split` used to be saved
via delete-everything-then-reinsert-everything on every save, which the
audit trigger would have seen as unrelated DELETE+INSERT pairs instead of
a real edit — so the save path itself was changed to do genuine in-place
UPDATEs when a line's identity (its own `id` for items, `(opportunity_id,
user_id)` for splits) matches an existing row, while a line that's
genuinely dropped from the list still correctly produces a DELETE, and a
genuinely new line still produces no audit row at all (INSERT is
deliberately not logged anywhere in this system — see BR-AUD-01 / ADR-017,
`created_by`/`created_at` already cover who/when for an unedited row).

The test cases below are shaped around proving that distinction: an
**edit** must show as one clean UPDATE row with only the changed field(s),
not a DELETE alongside an unrelated-looking INSERT.

---

## A. Stakeholder — plain trigger addition

- [ ] **TC-1 — Edit an existing Stakeholder's field (e.g. designation or
  phone).** From Customer 360, edit a Stakeholder on the test Account,
  change one field, save.
  **Expect:** save succeeds as normal (no visible change in behavior).

- [ ] **TC-2 — Audit Log shows a clean UPDATE diff.** Open the Audit Log
  screen, filter/search for `stakeholder` (or the record's id/name).
  **Expect:** one new row, action = UPDATE, record label reads the
  stakeholder's name (not a raw UUID), diff shows only the field(s) you
  actually changed — old value on one side, new value on the other.

## B. Opportunity item — editing an existing line

- [ ] **TC-3 — Edit one existing line's price or quantity.** Open the test
  Opportunity's Products tab, change the unit price (or quantity) on one
  existing line, leave the other line(s) untouched, save.
  **Expect:** save succeeds, totals update as normal.

- [ ] **TC-4 — Audit Log shows exactly one clean UPDATE row, not a
  DELETE.** Check the Audit Log for `opportunity_item`.
  **Expect:** exactly one new row, action = UPDATE, diff shows only the
  field you changed (e.g. `unit_price_lakhs: 5.00 → 8.00`) — **not** a
  DELETE row for the old line paired with an unrelated INSERT-looking
  entry. This is the core thing this whole build exists to fix.

- [ ] **TC-5 — The untouched line produces no audit row.** Same save as
  TC-3/4 — check that the *other*, unedited line on the same Opportunity
  has no new audit entry from this save.

## C. Opportunity item — removing and adding lines

- [ ] **TC-6 — Remove an existing line entirely, save.** Delete one line
  from the Products tab (don't add a replacement), save.
  **Expect:** save succeeds.

- [ ] **TC-7 — Audit Log shows a DELETE row with full old values.** Check
  the Audit Log for `opportunity_item`.
  **Expect:** one new row, action = DELETE, `old_data` has the full old
  line (product, quantity, price, etc.), `new_data` is empty/null — this
  is a genuine removal, correctly logged as one.

- [ ] **TC-8 — Add a brand-new line, save.** Add a new product line to the
  same (or another) Opportunity, save.
  **Expect:** save succeeds, but **no new audit row** appears for it —
  matches the existing INSERT-not-logged rule already true for the other
  four tables.

## D. Split — same edit/remove/add shape as items

- [ ] **TC-9 — Edit an existing split participant's percentage.** Open the
  test Opportunity's Split tab, change one participant's percentage
  (rebalance so it still sums to 100%), save.
  **Expect:** save succeeds.

- [ ] **TC-10 — Audit Log shows a clean UPDATE row for `split`.**
  **Expect:** one new row, action = UPDATE, diff shows only
  `split_percentage` changing — not a delete/insert pair.

- [ ] **TC-11 — Remove a split participant, save.**
  **Expect:** one new `split` row, action = DELETE, full old values
  captured.

- [ ] **TC-12 — Add a new split participant, save.**
  **Expect:** no new audit row for the newly-added participant.

## E. Mixed batch and no-op save

- [ ] **TC-13 — One save that edits one line, removes another, and adds a
  new one, all at once (items or splits, whichever is easier to set up).**
  **Expect:** Audit Log shows exactly one UPDATE row (the edited line) and
  one DELETE row (the removed line) — nothing for the added line, nothing
  for any line left untouched.

- [ ] **TC-14 — Resave the exact same list with nothing actually changed**
  (open the edit form, don't change anything, save anyway).
  **Expect:** zero new audit rows — a no-op save produces no noise in the
  Audit Log.

## F. Display layer — FK values resolve to names, not raw UUIDs

- [ ] **TC-15 — `opportunity_id`/`product_id`/`user_id` in a diff show
  readable names.** Look at any of the diffs from A-E above.
  **Expect:** wherever the diff involves one of these FK columns, the
  Audit Log UI shows the Opportunity/Product/person's name, not a bare
  UUID — confirms the new `_FIELD_RESOLVER_MAP` entries are wired up.

- [ ] **TC-16 — `opportunity_item`/`split` rows show gracefully with no
  record label, not a broken UI.** Look at how a `opportunity_item`/
  `split` row's own "record" column renders (this table deliberately has
  no single-column label, per the implementation plan).
  **Expect:** renders as blank/fallback/dash — not an error, missing row,
  or crash.

## G. Regression — original four tables and Admin/GM gate unaffected

- [ ] **TC-17 — Existing audit coverage for account/user_profile/product/
  opportunity still works normally.** Edit any field on one of these four
  (e.g. rename an Account, or edit a Product), check the Audit Log.
  **Expect:** same clean UPDATE-diff behavior as before this build — no
  regression from the new triggers or resolver-map entries.

- [ ] **TC-18 — Audit Log screen stays Admin/GM-only.** Log in as any
  other role (Sales Staff, Area Manager, SBU Manager, Marketing User).
  **Expect:** no "Audit Log" item in the sidebar; a direct API call to
  list the audit log is rejected (403), same as before this build.

---

## Results log

Fill in as each test case is run. Move a summary of the overall outcome to
`docs/Progress-Archive-2026-09.md` once the full pass is complete.

| TC | Result | Notes |
|----|--------|-------|
| 1  | Pass   | Edited Dr Ajmal's phone (blank → 9876543210) on Aster MIMS Calicut |
| 2  | Pass   | Clean UPDATE row, record label correctly shows "Dr Ajmal" (not a raw id) — this edit is what first exposed the KeyError/500 bug below; re-verified clean after the fix |
| 3  | Pass   | Edited SonoScape E2's price on "USG M/c - Test Aug 18" (12→15), left the Buyback line untouched |
| 4  | Pass   | Clean single UPDATE row, unit_price_lakhs + extended_value_lakhs only. First attempt (10→12) exposed the updated_by bug below, fixed, re-verified clean on this second edit |
| 5  | Pass   | Untouched Buyback line produced zero audit rows on the re-verification edit (produced a bogus updated_by-only row before the fix) |
| 6  | Pass   | Removed the Buyback line entirely from Products, saved |
| 7  | Pass   | One clean DELETE row, full 13-field snapshot available via "Show all fields" |
| 8  | Pass   | Added SonoScape HD-550 as a new line — zero audit rows for it, only the parent Opportunity's indicative_value updated (expected side effect) |
| 9  | Pass   | Changed Shruthi 20%→30%, Fahad 80%→70% on the same Opportunity's Splits |
| 10 | Pass   | Two clean UPDATE rows, split_percentage only, one per participant |
| 11 | Pass   | Removed Shruthi's split entirely (Fahad bumped to 100%) — one clean DELETE row for Shruthi's row, one clean UPDATE for Fahad's |
| 12 | Pass   | Adding Shruthi (20%) + Fahad (80%) as brand-new split participants produced zero audit rows, per the no-INSERT-logging design |
| 13 | Pass   | One save: edited SonoScape E2 (15→18), removed SonoScape HD-550, added a Buyback line — produced exactly one UPDATE + one DELETE, nothing for the added line |
| 14 | Pass   | Resaved the same product list with no changes — zero new audit rows |
| 15 | Pass   | DELETE row's expanded fields showed `product_id: SonoScape HD-550` and `opportunity_id: USG M/c - Test Aug 18`, both resolved to names, not raw UUIDs |
| 16 | Pass   | Every opportunity_item/split row rendered with its raw record id as a graceful fallback throughout this pass — never blank, broken, or missing |
| 17 | Pass   | Account/User/Opportunity edits throughout this pass (e.g. Al Shifa Hospital zone_id, User role_id/manager_id) kept their normal clean-diff behavior, no regression |
| 18 |        | Not independently re-tested (would require a non-admin login); role gate code (`AUDIT_LOG_ADMIN_ROLES`) untouched by this build, low risk |
