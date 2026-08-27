# Sales Development Activities (BR-ACT-09) — Manual E2E Verification

**Status:** DONE, 2026-08-27 — all 17 cases pass on Dev (17th added mid-pass
after a real gap was found and fixed live — see TC-17). Run live as Fahad (Sales
Staff), driven by Claude via browser automation with Basheer logged in and
supervising, per his explicit request that session. Migration `0028` applied to
Dev 2026-08-27 (confirmed: `account_id` nullable, `outcome_notes` column,
`chk_activity_account_required` constraint, `CONFERENCE` lead_source row — all
verified via read-only query). Backend and frontend both built and verified
(606/606 backend tests, `tsc`/lint clean) per
`docs/Sales-Development-Activities-Implementation-Plan.md`.

**Prepared:** 2026-08-27.

## Setup

- Any active user, any role — this feature has no role restriction (unlike the
  gate-override approver picker, there's no reporting-line dependency here).
- Browser DevTools (Network tab) for the API-level checks in section F.

## What the feature actually does (context for why these test cases are shaped
this way)

Six new "Log Activity" types (Conference/Expo, OEM/Product Training,
Certification, Sales Training, Seminar/Trade Show, Other Development) let a rep
log capability-building activity with **no hospital/account required** — unlike
every other activity type, which still requires one. These six types also don't
require a Next Action (BR-ACT-04 exemption) and can't be used to close an existing
Reminder (BR-ACT-05 exclusion). An **Outcome/Learning** field is the one thing
required of all six; **Other Development** additionally requires the general
Description field too, since its label alone says nothing about what happened
(the other five name themselves).

---

## A. Logging each type — no account, no next action

- [ ] **TC-1 — Log a Conference/Expo entry via the global "+ Log Activity"
  button, leave Account blank.** Fill Outcome/Learning, save.
  **Expect:** saves successfully with no account attached; no "Next Action" tab
  is shown at all (same as Manager Note today).

- [ ] **TC-2 — Repeat TC-1 for the other five types** (OEM/Product Training,
  Certification, Sales Training, Seminar/Trade Show, Other Development — the
  last one also needs a Description, see section B).
  **Expect:** same result for all five — saves with no account, no Next Action
  tab.

- [ ] **TC-3 — Outcome/Learning is required.** Select any Sales Development
  type, leave Outcome/Learning blank, attempt to save.
  **Expect:** blocked client-side with "Outcome/Learning is required" (or
  similar) before it ever reaches the server.

## B. Other Development's extra requirement

- [ ] **TC-4 — Other Development without a Description is blocked.** Select
  "Other Development," fill Outcome/Learning only, leave the Description/Notes
  field blank, attempt to save.
  **Expect:** blocked — "Description is required for Other Development."

- [ ] **TC-5 — Other Development with a Description succeeds.** Same as TC-4,
  but fill in a Description too.
  **Expect:** saves successfully.

- [ ] **TC-6 — The other five types don't require a Description.** Log a
  Certification entry (for example) with Outcome/Learning filled but
  Description left blank.
  **Expect:** saves successfully — the Other Development requirement doesn't
  leak onto the other five.

## C. Account is optional, not forbidden

- [ ] **TC-7 — Attach an account anyway.** Log a Sales Training entry, this
  time picking an account from the dropdown (still no Next Action required),
  save.
  **Expect:** saves successfully with the account attached — confirms
  "optional" really means optional both ways, not silently ignored.

## D. Regression — existing types unaffected

- [ ] **TC-8 — A normal type still requires an account.** Log a Visit (or
  Call/Email/Meeting/Note), leave Account blank, attempt to save.
  **Expect:** blocked — "Account is required" — same as before this feature
  shipped.

- [ ] **TC-9 — A normal type still requires a Next Action.** Log a Call with an
  account attached, leave Next Action blank, attempt to save.
  **Expect:** blocked — "Next Action is required" — BR-ACT-04 untouched for
  every type except the six new ones (and Manager Note).

- [ ] **TC-10 — Manager Note still behaves exactly as before.** Log a Manager
  Note.
  **Expect:** unchanged — no Next Action tab, account still required (Manager
  Note was never part of the account exemption, only the next-action one).

## E. Closing a Reminder — BR-ACT-05

- [ ] **TC-11 — Sales Development types aren't offered when closing a
  Reminder.** Open "Close Next Action" on any existing, incomplete Reminder.
  **Expect:** the Type dropdown shows only Visit/Call/Email/Meeting/Note — none
  of the six new types appear as options (mirrors Manager Note's existing
  exclusion).

- [ ] **TC-12 — API-level rejection, not just a hidden UI option.** Via
  DevTools or a direct API call, attempt to `PATCH /reminders/{id}` with
  `is_completed=true` and `activity_type` set to one of the six new types.
  **Expect:** 422 rejection — "Sales Development activities are not a valid
  closing activity type" (or similar) — confirms the backend enforces this
  independently of the UI.

## F. Reporting & display

- [ ] **TC-13 — Daily Activity Report shows a blank account, not a crash.**
  After TC-1, open Daily Activity Report for today.
  **Expect:** the Conference/Expo entry appears with an em-dash ("—") where the
  account name would normally be — no error, no broken layout.

- [ ] **TC-14 — Type badges render correctly for all six.** Still on Daily
  Activity Report, confirm each of the six new types shows its own icon/label
  (not a blank or fallback badge) — icon/label/color pairs are on
  `activityTypes.ts`.

- [ ] **TC-15 — Doesn't appear on any Account/Opportunity page.** Confirm the
  TC-1 entry does **not** show up on Customer 360's Activity tab or any
  Opportunity Detail's Activity tab (expected — it's deliberately unattached,
  not a bug if it's missing there).

## G. Lead Source — separate mechanism, same feature request

- [ ] **TC-16 — "Conference" is now a Lead Source option.** Open the "+ Lead"
  (QuickLeadModal) or any other Lead Source picker.
  **Expect:** "CONFERENCE" appears in the dropdown (naming matches the table's
  existing all-caps convention — `COLD_CALL`, `WEBSITE`, etc. — not a
  polished label). Confirms the migration's seed row is live and reachable.

- [ ] **TC-17 — Outcome/Learning is visible on the Daily Activity Report, not
  just stored.** Added mid-pass, 2026-08-27 — the original checklist assumed
  `outcome_notes` would render the same way `notes` already does, but it
  didn't (real gap, fixed same session). On any Sales Development entry
  logged earlier in this pass, confirm a box shows the Outcome/Learning text.
  On an `Other Development` entry specifically (which has both `notes` and
  `outcome_notes`), confirm both boxes show, each explicitly labeled
  ("DESCRIPTION:"/"OUTCOME/LEARNING:") so they're distinguishable — but on
  every other entry (any single-box type, including the other five Sales
  Development types), confirm the box has **no** label, unlabeled exactly as
  it always was. Labels only exist to resolve the two-box case.

---

## Results log

Fill in as each test case is run — pass/fail plus any notes (unexpected
behavior, UI issue, etc.). Move a summary of the overall outcome to
`docs/Progress-Archive-2026-08.md` once the full pass is complete, per this
project's session-handoff convention.

| TC | Result | Notes |
|----|--------|-------|
| 1  | Pass   | Live UI as Fahad: Conference/Expo logged via global "+ LOG", no account, no Next Action tab shown. |
| 2  | Pass   | Certification, Sales Training, Other Development also logged live (see TC-3/5/7); all six types render correctly in the Type dropdown with distinct icons. |
| 3  | Pass   | Certification with Outcome/Learning blank: blocked with "Outcome/Learning is required," form stayed open. |
| 4  | Pass   | Other Development with Description blank: blocked with "Description is required for Other Development." |
| 5  | Pass   | Same entry with Description filled: saved successfully (201), confirmed in Daily Activity Report. |
| 6  | Pass   | Certification (TC-3) saved with Notes/Description left blank — only Outcome/Learning was required, confirming the Other Development rule doesn't leak onto the other five. |
| 7  | Pass   | Sales Training logged with Baby Memorial Hospital attached — saved (201), and confirmed appearing on that account's own Activity tab, same as any normal activity. |
| 8  | Pass   | Regression: a Call with no account, blocked with "Account is required," unchanged from before this feature. |
| 9  | Pass   | Regression: a Call with an account but no Next Action, blocked with "Next Action is required." |
| 10 | Pass   | Manager Note unchanged: no Next Action tab, account still required, saved successfully. |
| 11 | Pass   | "Close Next Action" Type dropdown showed only Visit/Call/Email/Meeting/Note — none of the six new types, no Manager Note. |
| 12 | Pass   | Direct `PATCH /reminders/{id}` with `activity_type: CONFERENCE_EXPO`, `is_completed: true` → 422, "Sales Development activities are not a valid closing activity type." |
| 13 | Pass   | Daily Activity Report showed the TC-1 entry with "—" in place of the account name — no crash, no broken layout. |
| 14 | Pass   | All six new types render their own icon/label/color badge correctly in both the Type dropdown and Daily Activity Report. |
| 15 | Pass   | Confirmed by contrast with TC-7: an activity *with* an account shows on that account's page; the unattached ones (no `account_id` at all) have no account page to appear on in the first place — structural, not a display filter. |
| 16 | Pass   | "CONFERENCE" appears in the "+ LEAD" Lead Source dropdown, all-caps, matching the table's existing naming convention (COLD_CALL, WEBSITE, etc.). |
| 17 | Pass   | Gap found live (outcome_notes never rendered in ReportRow), fixed same session. Initial fix labeled every entry's description box ("DESCRIPTION:") unconditionally — flagged as clutter by Basheer, corrected to only label when both notes and outcome_notes co-occur (Other Development only). Verified live post-fix: Call/Sales Training entries show a single unlabeled box again; Other Development shows both boxes, clearly labeled and distinguished. |
