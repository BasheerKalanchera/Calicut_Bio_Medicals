# Next-Action Rules — Implementation Plan

**Status:** Approved 2026-10-14 (Basheer). Not started; starts after
Win Probability plan step 2 (D7).
**Traceability rows:** none (new rules BR-ACT-11, BR-OP-21, BR-OP-22,
BR-ACC-05, the BR-ACT-05 change and the On Hold next action).
**Design / discussion:** `docs/Discussion-Next-Action-Driven-Activity-Logging-2026-10.md`
(all questions answered 2026-10-12, section 5a).

## Decisions

Agreed in the discussion note:

- Version C (strict): a person with an open next action of their own on
  an Opportunity can't log a fresh activity there until it is closed;
  only their own next actions count (BR-ACT-11) — Haroon and Basheer, 2026-10-12
- Closing one's own next action needs a new one; the only exception for an
  Opportunity is marking it Won or Lost (BR-ACT-05 change, reading (i)) — Basheer, 2026-10-12
- A new Opportunity starts with its first activity and next action, on
  every way in (BR-OP-21) — Haroon, 2026-10-12
- Every stage or status change carries a note: closing one's own next
  action, or a Note; a manager logs a Note and the owner's next action
  stays open (BR-OP-22) — Haroon and Basheer, 2026-10-12
- Owners close their own next actions from the Opportunity page's Next
  Actions tab; others' stay read-only — Basheer, 2026-10-12
- Closing a hospital-level next action needs a new one, unless the visit
  produced a new Opportunity — Basheer, 2026-10-12
- Putting an Opportunity On Hold needs a next action due by the
  re-activation date — Basheer, 2026-10-12
- A new hospital starts with a Note activity carrying the first next
  action (BR-ACC-05) — Basheer, 2026-10-12
- A separate plan, built on the one create form — Basheer, 2026-10-12

Decided for this plan:

- D1. The stage or status change and its note are saved together in one
  save, and the server refuses the change without the note — Basheer, 2026-10-14
- D2. When an activity is logged for someone else, that person's open
  next actions are the ones that count (e.g. a manager logging a visit
  for Vivek is held to Vivek's "Follow up") — Basheer, 2026-10-14
- D3. Closing a hospital-level next action offers "This visit produced a
  new Opportunity". Ticked, the new-Opportunity form opens with the
  hospital filled in; if the Opportunity is saved, the next action closes
  with no follow-up; if the form is cancelled, the rep returns to the
  close form and must add a follow-up next action. The server accepts "no
  follow-up" only together with a real new Opportunity on that hospital — Basheer, 2026-10-14
- D4. Marking Won needs the stage-change note like any other change; the
  existing payment note stays optional and separate — Basheer, 2026-10-14
- D5. A new Opportunity's first activity is a Visit, Call, Email, Meeting
  or Note, with "what happened" required; on Marketing Lead "Convert",
  "what happened" is pre-filled from the lead's notes and can be edited — Basheer, 2026-10-14
- D6. A hospital added from inside the new-Opportunity form needs no
  first entry of its own; the Opportunity's first activity and next
  action cover it. The hospital is saved as soon as its small form is
  saved, so if the rep then cancels the Opportunity, the app asks for the
  hospital's Note and next action before the form closes — Basheer, 2026-10-14
- D7. The whole build starts only after Win Probability plan step 2 (the
  create-form merge); step 4 also waits for Duplicate Hospitals Part A,
  which changes the same Add Hospital form — Basheer, 2026-10-14
- D8. Before the UAT move, a short WhatsApp message is drafted for Haroon
  to send the team, explaining that old open next actions must be closed
  first — Basheer, 2026-10-14
- D9. The new-hospital rule is BR-ACC-05 in Business-Rules — Basheer, 2026-10-14

## Figures and sources

- Opportunities with no activity 39, activities with no next action 2,
  active Opportunities with nothing planned 53, notes that don't say what
  happened 50, hospitals added but not used 36 — UAT data-quality report
  13 Oct (`C:\Backups\CabioUAT\data_consistency_reports\UAT-Data-Quality-Report-2026-10-13.pdf`), page 1, sections 3, 5, 6, 7, 9
- Om Hiremath's 17 Opportunities with no activity — same report, page 3
- Vivek, Fazal, Haroon, Fahad and SonoScape E1 Exp examples — discussion
  note, sections 5 and 5a
- The four ways an Opportunity is created — Win Probability plan, step 3
- The Opportunity page's edit form is the only screen that changes stage
  or status — front-end code search, 2026-10-14

## 1. In plain terms

**Today:** a rep can ignore the next action they set last time and log a
fresh activity, leaving the old one open and out of date. Closing a next
action doesn't ask what happens next. An Opportunity or a hospital can be
entered with no activity and no next action. A stage can be changed
without saying why.

**After:**

1. **Close it, don't go round it.** If a rep has an open next action of
   their own on an Opportunity, Log Activity there (from the Opportunity
   page, the hospital page or the top bar) only lets them close it and
   write what happened. Someone else's next action doesn't hold them back.
2. **Closing always sets the next one.** Closing a next action needs a new
   one. Exceptions: the Opportunity is being marked Won or Lost; or, for a
   hospital-level next action, the visit produced a new Opportunity that
   the rep then saves (D3).
3. **Owners close their own next actions on the Opportunity page**, in its
   Next Actions tab. Others' stay read-only.
4. **A stage or status change carries a note, in the same save.** If the
   person changing it has an open next action of their own there, closing
   it is the note; otherwise they write a Note. A manager always writes a
   Note, and the rep's next action stays open. Putting an Opportunity On
   Hold also needs a next action due by the re-activation date.
5. **A new Opportunity starts with its first activity and next action**,
   on all four ways in: the top bar "+ Lead", a hospital's Customer 360
   page, a project's page, and Marketing Lead "Convert".
6. **A new hospital starts with a Note and a next action**, e.g. "Added for
   coverage; first visit planned" with the first visit as the next action.
   If there has already been contact, a Visit or Call instead. A hospital
   added from inside the new-Opportunity form is covered by the
   Opportunity's first activity; if that Opportunity is cancelled, the
   app asks for the hospital's Note and next action (D6).

These stop new cases in four sections of the UAT data-quality report: 3
(Opportunities with no activity), 5 (activities with no next action), 6
(active Opportunities with nothing planned) and 9 (hospitals not used).
They don't clean up the existing cases; reps work through those from the
report.

Built and tested on Dev; reaches UAT with the next full move from Dev. No
database change.

## 2. Build order

Starts only after Win Probability plan step 2 (D7). Check in before each
step.

1. **Close-don't-go-round-it and the follow-up (points 1–3).**
   - Server: refuse a fresh activity while the person has an open next
     action of their own on that Opportunity; refuse closing a next action
     without a follow-up, except the two cases above.
   - Log Activity form: switches to "close your next action" when that
     applies.
   - Next Actions screen: follow-up required in the close form; the D3
     tick box and its cancel path.
   - Opportunity page: "Close" on one's own rows in the Next Actions tab.
   - Tests, then a *checkpoint commit*. Nothing stops working on Dev; reps
     with old open next actions must close them first, as intended.
2. **A note on every stage or status change, and On Hold (point 4).**
   - Opportunity page edit form asks for the note when stage or status
     changes; the server refuses the change without it.
   - *Checkpoint commit.* Nothing stops working.
3. **A new Opportunity starts with an activity (point 5)** on the one
   create form. *Checkpoint commit.*
4. **A new hospital starts with a Note and next action (point 6)** on the
   Add Hospital form, after Duplicate Hospitals Part A. *Checkpoint commit.*
5. **Data-quality check, records and testing.** The check's "nothing
   planned" also covers On Hold Opportunities, and "not used yet" leaves
   out hospitals with an open next action (discussion note, section 4a).
   Business rules marked built; rep message for Haroon (D8); pre-E2E
   review and one manual E2E.

## 3. What could be affected

From a code search, 2026-10-14:

- (a) Screens that save through the changed paths: Log Activity form
  (Opportunity page, Customer 360, top bar); Next Actions screen's close
  form; Opportunity page Next Actions tab and edit-form save (the only
  place stage or status changes; the inline value edit is not affected);
  the one new-Opportunity form (all four ways in); Add Hospital form
  (Customer Directory, and "+ Add Hospital" inside the new-Opportunity
  form).
- (b) Reports showing the results: Daily Activity Report, Activity tabs,
  Next Actions lists — read-only, unchanged queries; checked once that new
  closing activities and Notes appear.
- (c) Lists refreshed after a save: the Opportunity's next actions, the
  rep's next-action list, activities, Pipeline, a hospital's
  Opportunities, the hospital list.

## 4. Not in this plan (with reasons)

- Stage changes only by closing a next action — the later tightening,
  Backlog "Stage changes only by closing a next action".
- Cleaning up existing data — reps work through the data-quality report.
- Who may close someone else's next action through the server —
  unchanged; the screens offer only one's own.
- Activity notes that don't say what happened (report section 7) — these
  rules don't address it.

## 5. Business rules and records to update

- Business-Rules: BR-ACT-11, BR-OP-21, BR-OP-22, the BR-ACT-05 change, the
  On Hold next action and BR-ACC-05 marked built (step 5).
- Business-Rule-Implementation-Matrix rows.
- Discussion note status.
- `scripts/uat_data_quality_check.py` (step 5).
- User Manual and Help Catch-up plan: reps' workflow changes.

## 6. Technical addendum

- **Point 1 (BR-ACT-11):** `ActivityService.log_activity`
  (`backend/app/domains/activity/service.py`) refuses when `opportunity_id`
  is set, the type is not in `NOT_CUSTOMER_FACING_TYPES`, and an open
  `reminder` exists whose creating activity has that `opportunity_id` and
  whose `assigned_to_user_id` is the activity's `user_id` (D2).
  `LogActivityModal.tsx` looks up those reminders and closes through
  `PATCH /reminders/{id}`.
- **Point 2 (BR-ACT-05 change):** `ReminderService.patch_reminder` requires
  `next_action_*` when `is_completed=True`, unless the Opportunity's status
  is terminal after the request, or a hospital-level reminder comes with
  `produced_opportunity_id` naming an Opportunity on the same account
  (D3). Front end: `CloseReminderModal.tsx` opens the create form and
  sends the close only after the Opportunity is saved.
- **Point 3:** `NextActionsTab` (`OpportunityDetailScreen.tsx`) shows Close
  on rows assigned to the current user, opening `CloseReminderModal`.
- **Point 4 (BR-OP-22, On Hold):** `OpportunityUpdate` gains `change_note`
  — either `{close_reminder_id, activity_type, activity_date, notes,
  next_action_*}` or `{note, next_action_*}` — required when `stage_id` or
  `status_id` changes, handled in `update_opportunity`'s transaction. On
  Hold also requires `next_action_due_date` ≤ `reactivation_date`.
  Front end: the edit-form save in `OpportunityDetailScreen.tsx`.
- **Point 5 (BR-OP-21):** `OpportunityCreate` gains a required
  `first_activity` (D5 types, notes, `next_action_*`), created in
  `create_opportunity`'s transaction. Marketing-lead conversion uses the
  same endpoint, then `mark_converted`.
- **Point 6 (BR-ACC-05):** `AccountService.create_account` gains
  `first_entry` (Note or a contact type, plus `next_action_*`); not
  required when the hospital is added from inside the new-Opportunity
  form (D6). `QuickLeadModal.tsx` opens `AddHospitalModal`, which saves
  the hospital at once (POST /accounts); if the Opportunity form is then
  cancelled, it asks for the Note and next action and logs them through
  POST /activities before closing. The server can't tell the two cases
  apart, so the cancel path is a form-level guarantee; the data-quality
  check's "not used yet" section catches any that slip through.
- **Tests:** existing backend tests that create Opportunities or hospitals
  through the server need the new fields (count taken at build time);
  new tests for each refusal and exception.
