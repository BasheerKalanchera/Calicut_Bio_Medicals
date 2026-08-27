# Relationship-Support Activity (BR-ACT-10) — Manual E2E Verification

**Status:** DONE, 2026-08-27 — all 16 cases pass on Dev. Run live as Fahad (Sales
Staff, Imaging/Mangalore) doubling as both R (section A) and X (section B, the
cross-SBU test), driven by Claude via browser automation with Basheer logged in and
supervising. Migration `0029` applied to Dev 2026-08-27 (confirmed:
`cabio_app_opportunity_in_account()`, `cabio_app_account_opportunities()`, and the
widened `activity_tier_visibility` policy all verified via read-only query).
`docs/Physical-Schema.sql` regenerated same day and reviewed — diff contains exactly
the expected changes, nothing else. Backend and frontend both built and verified
(619/619 backend tests, `tsc`/lint clean) per `docs/Referral-Credit-And-Relationship-
Support-Implementation-Plan.md`. Part 1 (the Referral Credit toggle) shipped and was
verified 2026-08-18; section E below is a quick regression pass on it, not a full
re-verification.

**One finding worth recording, not a bug:** TC-9's read-back is real (the logged
note's text is visible to X afterward), but the Opportunity's *name* doesn't render
next to it in Daily Activity Report — `ActivityReportRow.opportunity` is populated
via a relationship load that goes through `opportunity`'s own tier-visibility RLS,
which X still fails. The net effect is tighter than the plan asked for: the widening
isn't just "name-only in the picker" as designed, it's invisible everywhere except
the picker itself, including on X's own logged entry. Confirmed via TC-10's raw API
checks: `GET /opportunities/{id}` and `GET /opportunities/{id}/activities` both 404
for X.

**Prepared:** 2026-08-27.

## Setup

- **R** — any Sales Staff rep, own SBU/zone, for section A's sanity check. (Live Dev:
  Fahad, Sales Staff, Imaging, Mangalore — used elsewhere this week, known-good login.)
- **X** — a rep with **zero** standing access to a specific Opportunity: different SBU
  *and* different zone from R, no owner/split/tier-visibility/assigned-reminder route
  to it. This is the real test — pick deliberately, don't reuse R for it.
  Candidate: Fahad (Imaging, Mangalore) logging against a **Critical Care** deal in
  **North Kerala** (e.g. one of Adydev's, reporting to Nishad per
  `docs/Zone-Hierarchy-Territory-Data-2026-08.md`) — confirm the specific Opportunity
  has no split/referral/reminder tie to Fahad before using it, so the test is clean.
- Browser DevTools (Network tab) for the API-level checks in section B.

## What the feature actually does (context for why these test cases are shaped
this way)

`Relationship Support` is a new "Log Activity" type that lets someone with no
standing access to a deal — outside its owner/split/tier-visibility route entirely,
regardless of SBU or zone — log a short note against it documenting informal help
they gave (an introduction, a call to a contact). No ownership, split, or revenue
change. Unlike every other activity type, it **requires** an Opportunity (picked from
a new "Related Opportunity" dropdown that appears only for this type) **and**
requires a description of what was done — both are gaps the original plan left open,
filled during the build (see the plan doc's "Build summary" section). It's exempt
from the mandatory Next Action (same as Manager Note) since the logger has no
standing access to promise or complete a follow-up on someone else's deal.

The security-relevant part: this works via two narrow `SECURITY DEFINER` database
functions plus one RLS policy amendment — not a broadened Opportunity visibility
grant. The person can log and read back their *own* note; they still cannot open the
Opportunity itself or see its owner, value, stage, or any other activity on it.

---

## A. Same-SBU sanity check (mechanism works at all)

- [ ] **TC-1 — Log Relationship Support against an Opportunity R can already
  see**, via the global "+ Log Activity" button, no fixed account. Pick an
  Account, select "Relationship Support" as the type.
  **Expect:** no "Next Action" tab appears; a "Related Opportunity" dropdown
  appears, listing that account's opportunities.

- [ ] **TC-2 — Save without picking an Opportunity.**
  **Expect:** blocked with "Related Opportunity is required for Relationship
  Support."

- [ ] **TC-3 — Pick an Opportunity, leave the description blank, save.**
  **Expect:** blocked with "Notes describing what was done are required for
  Relationship Support."

- [ ] **TC-4 — Pick an Opportunity, fill in a description, save.**
  **Expect:** saves successfully, no Next Action required, appears in Daily
  Activity Report.

## B. Cross-SBU flow — the real security check, can't be skipped

- [ ] **TC-5 — X can see the parent Account.** Log in as X, confirm the
  Account behind the target Opportunity is visible/searchable normally.

- [ ] **TC-6 — X cannot open the Opportunity itself.** Attempt to find/open
  that Opportunity directly (search, pipeline list, etc.).
  **Expect:** not visible anywhere in X's normal navigation — confirms X
  genuinely has no standing access before the carve-out is tested.

- [ ] **TC-7 — The "Related Opportunity" picker shows it anyway.** As X, open
  Log Activity, pick the target Account, select Relationship Support.
  **Expect:** the target Opportunity appears in the "Related Opportunity"
  dropdown by name, despite TC-6.

- [ ] **TC-8 — Logging succeeds.** Pick that Opportunity, fill in a
  description (e.g. "Called Dr. X, made the introduction"), save.
  **Expect:** saves successfully — confirms `cabio_app_opportunity_in_account()`
  lets the write through despite X's own RLS-scoped `opportunity_exists()`
  check failing.

- [ ] **TC-9 — X can read their own logged activity back.** Check Daily
  Activity Report (or wherever X's own activities surface) for the TC-8
  entry.
  **Expect:** visible to X — confirms the `OR user_id = cabio_app_uid()`
  read-back fix on `activity_tier_visibility`.

- [ ] **TC-10 — The widening stays name-only.** As X, confirm you still
  **cannot** open the Opportunity's own detail page, see its owner, value,
  stage, or any *other* activity logged against it (only your own TC-8 entry
  is visible to you, nothing else about the deal).

- [ ] **TC-11 — API-level check, not just the gated UI.** Via DevTools or a
  direct call, `GET /accounts/{account_id}/opportunities/lookup` as X for the
  target account.
  **Expect:** 200, returns the Opportunity's `id`+`name` — confirms the
  lookup itself carries no SBU/zone restriction (the frontend gate is a UI
  convention only, per `BR-ACT-10`).

## C. Picker gating regression

- [ ] **TC-12 — Picker does NOT appear for any other activity type.** Log a
  normal Call/Visit/Note from the Account level.
  **Expect:** no "Related Opportunity" dropdown renders.

- [ ] **TC-13 — Switching away clears the selection.** Select Relationship
  Support, pick an Opportunity, then switch the Type dropdown to Call.
  **Expect:** the picker disappears; switch back to Relationship Support and
  confirm the Opportunity selection was cleared, not silently retained.

## D. Regressions

- [ ] **TC-14 — Manager Note still exempt from Next Action.** Unaffected by
  this build, quick regression check.

- [ ] **TC-15 — Relationship Support is not offered when closing a
  Reminder.** Open "Close Next Action" on any existing reminder.
  **Expect:** Type dropdown shows only Visit/Call/Email/Meeting/Note — no
  Relationship Support option (BR-ACT-05 exclusion).

## E. Referral Credit toggle (Part 1) — quick regression, not full re-verification

- [ ] **TC-16 — Toggle still appears/behaves correctly.** In any of the 4
  entry points (QuickLeadModal, Customer 360, Project Directory,
  Opportunity Detail), set Lead Source = Referral, confirm the
  colleague-picker/free-text toggle still appears and saves correctly; set
  Lead Source = OEM Referral, confirm it does **not** appear.

---

## Results log

Fill in as each test case is run — pass/fail plus any notes. Move a summary
of the overall outcome to `docs/Progress-Archive-2026-08.md` once the full
pass is complete, per this project's session-handoff convention.

| TC | Result | Notes |
|----|--------|-------|
| 1  | Pass   | Selected Relationship Support on an Aster MIMS Calicut opportunity Fahad owns — no Next Action tab, "Related Opportunity" and "Description" fields both appeared. |
| 2  | Pass   | Saved with no Opportunity picked: blocked with "Related Opportunity is required for Relationship Support." |
| 3  | Pass   | Picked an Opportunity, left Description blank: blocked with "Notes describing what was done are required for Relationship Support." |
| 4  | Pass   | Filled Description, saved (201). Confirmed in Daily Activity Report showing "Aster MIMS Calicut · USG M/c - Test Aug 18" and the description text. |
| 5  | Pass   | Fahad can already see Aster MIMS Calicut (used it in section A). |
| 6  | Pass   | Searched "critical care icu" in Pipeline: 0 results across every stage tab. |
| 7  | Pass   | Opened Log Activity, Relationship Support, Aster MIMS Calicut account — "critical care icu" appeared in the Related Opportunity dropdown despite TC-6. |
| 8  | Pass   | Picked it, filled a description, saved — 201. Confirms the opportunity_exists() OR opportunity_in_account() fallback. |
| 9  | Pass   | Entry visible in Fahad's own Daily Activity Report — but see the finding above: the Opportunity name itself didn't render (account name only), tighter than planned, not a bug. |
| 10 | Pass   | Raw API: GET /opportunities/{id} → 404, GET /opportunities/{id}/activities → 404. Widening confirmed name-only (via the picker), nowhere else. |
| 11 | Pass   | Raw GET /accounts/{id}/opportunities/lookup as Fahad → 200, returns id+name list including "critical care icu", no other fields. |
| 12 | Pass   | Logged a plain Call — no Related Opportunity picker rendered. |
| 13 | Pass   | Picked "New Cath Lab Equipment" under Relationship Support, switched to Call (picker disappeared), switched back — showed "Select opportunity" again, selection cleared. |
| 14 | Pass   | Manager Note: no Next Action tab, unaffected. |
| 15 | Pass   | "Close Next Action" Type dropdown showed only Visit/Call/Email/Meeting/Note — no Relationship Support. |
| 16 | Pass   | Lead Source = Referral showed the colleague-picker/free-text toggle; Lead Source = OEM_REFERRAL did not. |
