# Manager Note Notification — Manual E2E Test Plan

**Status:** Not yet run. Built 2026-09-08 per `docs/Manager-Note-
Notification-Implementation-Plan.md`, not yet committed. 695/695 backend
tests pass, `tsc`/lint/build clean — this plan covers what those can't:
the actual notification arriving, the bell's click-through landing on the
right screen/tab, and the read-receipt actually clearing.

## Setup

- A Sales Staff rep (**R**) and their manager (**M**) — reuse the
  **Fahad (R) → Fazal (M)** pair from the Gate Override test plan, or any
  active rep/manager pair with a real `manager_id` link.
- One Account belonging to R with **at least one Opportunity** on it —
  needed to test both the Account-only and Opportunity-tied cases.
- Two logins available (M to log notes, R to receive them) — either two
  browser profiles/incognito windows, or log out/in between steps.
- Browser DevTools (Network tab) for the API-level check in section E.

## What the feature actually does (context for why these cases are shaped
this way)

Logging a `MANAGER_NOTE` Activity against a rep now notifies that rep.
The manager can tick **"Urgent — notify immediately"** (only shown for
Manager Note) — ticked pops `UrgentNotificationDialog` on R's next
screen, unticked is bell/count only. Where the notification's bell click
takes R depends on whether the note was tied to a specific Opportunity or
just the Account:
- **Opportunity-tied** (logged from inside that Opportunity's own Activity
  tab, or the Account-level form with an Opportunity picked): opens that
  Opportunity's own screen, landing on its Activity tab.
- **Account-only** (logged from Customer 360 with no Opportunity link):
  opens Customer 360, landing on its Activity tab.

A manager logging a note against **their own name** does not notify
anyone (no one to notify). Opening the notification also marks it read —
this type has no per-item detail screen to piggyback that on the way
Opportunity notifications do, so it's an explicit call, worth confirming
it actually fires.

---

## A. Urgent checkbox — only appears for Manager Note

- [ ] **TC-1 — Checkbox absent for every other activity type.** As M
  (or R), open Log Activity, cycle through Type = Call, Visit, Note, etc.
  **Expect:** no "Urgent" checkbox appears for any of them.

- [ ] **TC-2 — Checkbox appears for Manager Note, defaults unchecked.**
  Set Type = Manager Note. **Expect:** "Urgent — notify immediately"
  checkbox appears, unchecked by default.

- [ ] **TC-3 — Switching away from Manager Note clears it.** Check
  "Urgent", then change Type to something else, then back to Manager
  Note. **Expect:** the checkbox is unchecked again — a stale tick
  doesn't silently carry over.

## B. Account-only note, passive

- [ ] **TC-4 — Log a passive Manager Note from Customer 360.** As M, open
  R's Account via Customer 360 (not from inside an Opportunity), log a
  Manager Note against R with the Urgent box **unchecked**, save.
  **Expect:** save succeeds, no error.

- [ ] **TC-5 — R sees it in the bell, not urgently.** Log in as R (or
  refresh if already logged in — bell polls every 60s).
  **Expect:** bell badge count increases; dropdown shows "[M] left you a
  manager note." `UrgentNotificationDialog` does **not** pop.

- [ ] **TC-6 — Clicking it opens Customer 360's Activity tab and marks
  it read.** Click the notification in the dropdown.
  **Expect:** navigates to R's own Account (Customer 360), landing
  directly on the Activity tab (not Overview). Reopen the bell dropdown
  shortly after — the item should show as read (or the unread count
  should have dropped by one).

## C. Account-only note, urgent

- [ ] **TC-7 — Log an urgent Manager Note from Customer 360.** As M, same
  as TC-4 but tick "Urgent — notify immediately" before saving.

- [ ] **TC-8 — R sees the urgent popup.** As R, load (or navigate within)
  the app. **Expect:** `UrgentNotificationDialog` pops automatically,
  reading "[M] left you an urgent manager note." Bell badge also shows it.

- [ ] **TC-9 — Dismissing/clicking through still lands on the right tab
  and marks read.** Click through from the dialog (or the bell).
  **Expect:** same landing/read behavior as TC-6.

## D. Opportunity-tied note

- [ ] **TC-10 — Log a Manager Note from inside an Opportunity's own
  Activity tab.** As M, open one of R's Opportunities, go to its Activity
  tab, Log Activity, Type = Manager Note (confirm the "Linked to this
  opportunity" badge is shown), leave Urgent unchecked, save.

- [ ] **TC-11 — R's bell click-through opens the Opportunity, not the
  Account.** As R, click the resulting notification.
  **Expect:** navigates straight to that Opportunity's own detail screen,
  landing on its Activity tab — **not** Customer 360.

- [ ] **TC-12 — Repeat TC-10/11 with Urgent ticked.**
  **Expect:** urgent popup appears (same as TC-8), and clicking through
  still opens the Opportunity's Activity tab, not the Account.

## E. Self-notify skip and server-side validation

- [ ] **TC-13 — Manager logs a note against their own name.** As M
  (or any user), log a Manager Note with the "user" field set to
  themselves. **Expect:** save succeeds, but no notification is created
  for anyone — bell count for M doesn't change.

- [ ] **TC-14 — API rejects `is_urgent` on a non-Manager-Note type.** Via
  DevTools Network tab or a REST client, `POST /api/v1/activities` with
  `activity_type: "CALL"` and `is_urgent: true`.
  **Expect:** `422` validation error ("is_urgent is only valid for
  MANAGER_NOTE" or similar) — confirms the server enforces this, not just
  the UI hiding the checkbox.

## F. Regression — existing notification types unaffected

- [ ] **TC-15 — Opportunity assignment / gate override notifications
  still work normally.** Trigger any existing notification type (e.g.
  assign an Opportunity to someone, or a Fast-Track approver naming —
  see the Gate Override test plan) and confirm its bell message and
  click-through behave exactly as before — no regression from the new
  `entity_type="activity"` join or the widened `onSelectOpportunity`/new
  `onSelectAccount` props.

---

## Results log

Fill in as each test case is run. Move a summary of the overall outcome
to `docs/Progress-Archive-2026-09.md` once the full pass is complete.

| TC | Result | Notes |
|----|--------|-------|
| 1  |        |       |
| 2  |        |       |
| 3  |        |       |
| 4  |        |       |
| 5  |        |       |
| 6  |        |       |
| 7  |        |       |
| 8  |        |       |
| 9  |        |       |
| 10 |        |       |
| 11 |        |       |
| 12 |        |       |
| 13 |        |       |
| 14 |        |       |
| 15 |        |       |
