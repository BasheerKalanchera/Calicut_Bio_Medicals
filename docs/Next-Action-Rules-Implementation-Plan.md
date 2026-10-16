# Next-Action Rules — Implementation Plan

**Status:** Approved 2026-10-14 (Basheer). Step 1 built on Dev
2026-10-15 (`3d38e75`, checkpoint commit, tested by unit tests only; manual E2E at
step 5). Step 2 built 2026-10-16: server `bd92e4a`, screen `4fc8531`
(checkpoints; unit tests, type check and lint only; manual E2E at step
5). Step 3 built 2026-10-16 (`c4e1ca3`; unit tests, type check and
lint only; manual E2E at step 5). Step 4 dropped 2026-10-16 (D21).
Step 5 in progress 2026-10-16: data-quality script `f93397f`; pre-E2E
review fixes `4bec886`; manual E2E next.
**Traceability rows:** none (new rules BR-ACT-11, BR-OP-21, BR-OP-22,
the BR-ACT-05 change and the On Hold next action; BR-ACC-05 withdrawn, D21).
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
- ~~A new hospital starts with a Note activity carrying the first next
  action (BR-ACC-05) — Basheer, 2026-10-12~~ Withdrawn 2026-10-16 (D21)
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
- ~~D6. A hospital added from inside the new-Opportunity form needs no
  first entry of its own; the Opportunity's first activity and next
  action cover it. The hospital is saved as soon as its small form is
  saved, so if the rep then cancels the Opportunity, the app asks for the
  hospital's Note and next action before the form closes — Basheer, 2026-10-14~~
  Replaced by D21 (2026-10-16)
- D7. The whole build starts only after Win Probability plan step 2 (the
  create-form merge); step 4 also waits for Duplicate Hospitals Part A,
  which changes the same Add Hospital form — Basheer, 2026-10-14 (step 4
  later dropped, D21)
- D8. Before the UAT move, a short WhatsApp message is drafted for Haroon
  to send the team, explaining that old open next actions must be closed
  first — Basheer, 2026-10-14
- D9. The new-hospital rule is BR-ACC-05 in Business-Rules — Basheer, 2026-10-14
  (withdrawn, D21)
- D10. Pre-fill (added after approval, moved here from the My Work plan's
  D11): wherever a rep closes their own next action and must set the
  follow-up, the new next-action box starts with the closed one's text
  for the rep to edit, so they change one line instead of typing from
  scratch. Built in step 1. The My Work plan (`docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md`,
  step 3, D13) is built after this plan and uses step 1 and this
  pre-fill as they are — Basheer, 2026-10-14
- D11. Log Activity opened from a hospital's Customer 360 page or the top
  bar gets an optional Opportunity picker, listing that hospital's
  Opportunities the person can see. With one picked, the close-only rule
  applies as on the Opportunity page; left blank, the activity is
  hospital-level and unchanged. Built in step 1 (added at the step 1
  check-in: today's form has no Opportunity picker there) — Basheer, 2026-10-15
- D12. Marking Won or Lost: the stage-change Note's next action is
  optional, as the follow-up already is when closing a next action. A rep
  may still add one to keep the relationship going — Basheer, 2026-10-16
- D13. Whoever has an open next action of their own on the Opportunity
  closes it as the stage-change note, managers included. A manager with
  none writes a Note, and the owner's next action stays open — Basheer, 2026-10-16
- D14. The stage-change note reuses the close form as a second pop-up
  after the Edit form's Save, titled "Why this change?". Its Save stores
  the change, the closing (or the Note) and the follow-up together; its
  Cancel returns to the Edit form with nothing saved. With no open next
  action of one's own, the same pop-up asks for a Note and a next action
  (added at the step 2 check-in; the Edit form today has no written note
  for Lost, only Loss Reason and Competitor Name) — Basheer, 2026-10-16
- D15. With more than one open next action of one's own on the
  Opportunity, the "Why this change?" pop-up lets the rep pick which one
  to close (listed soonest due first); with one, it is already picked.
  Rare once these rules are live, but old next actions from before the
  move and follow-ups assigned by someone else can still leave two —
  Basheer, 2026-10-16
- D16. A new Opportunity's first activity is recorded under the person
  creating it; its next action's "Assign to" starts with the
  Opportunity's owner, and can be changed (e.g. Haroon creates one owned
  by Vivek: the activity is Haroon's, the next action Vivek's) — Basheer, 2026-10-16
- D17. Coming from "This visit produced a new Opportunity" (D3), the
  first activity starts with the close form's type, date and "what
  happened", editable — Basheer, 2026-10-16
- D18. Step 3's server and screen go in one commit, so creating an
  Opportunity is never refused on Dev in between — Basheer, 2026-10-16
- D19. The first activity is asked for in a "First activity" pop-up
  after the New Opportunity form's Create, built from the same form as
  "Why this change?" (D14), not a section of the form and not Log
  Activity (13 types, pickers that don't apply). Nothing is saved until
  its Save; its Cancel returns to the form — Basheer, 2026-10-16
- D20. When a hospital visit produced a new Opportunity (D3), the visit is
  recorded once, as that Opportunity's first activity (it shows on the
  hospital's timeline too, which lists its Opportunities' activities).
  Closing the hospital next action links to it instead of saving a
  second, hospital-level copy; the close form's "what was done" only
  pre-fills it (D17) — Basheer, 2026-10-16
- D21. Step 4 is dropped and BR-ACC-05 withdrawn: adding a hospital does
  not ask for a first activity. Haroon was not keen on making it
  mandatory (his next-action discussion with Basheer a few days before
  the 15 Oct demo). Enforcing it showed an edge case: a hospital added
  through "+ Add Hospital" inside the New Opportunity form is saved at
  once, so cancelling the Opportunity leaves it with nothing, and nothing
  can bring the rep back to it. Closing that gap meant removing the
  shortcut or saving hospital and Opportunity together — more steps for
  reps for a small gain. Steps 1–3 already give every Opportunity, on a
  new hospital too, its first activity and next action. Hospitals added
  and never used stay in the data-quality report ("not used yet",
  step 5). Backlog: "A new hospital starts with a next action — revisit
  if unused hospitals grow" — Basheer, 2026-10-16

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
6. ~~**A new hospital starts with a Note and a next action.**~~ Dropped
   2026-10-16 (D21): adding a hospital stays as it is today.

These stop new cases in three sections of the UAT data-quality report: 3
(Opportunities with no activity), 5 (activities with no next action) and 6
(active Opportunities with nothing planned). Section 9 (hospitals not
used) still lists new cases for managers to follow up (D21).
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
   - Log Activity on Customer 360 and the top bar: optional Opportunity
     picker (D11).
   - Next Actions screen: follow-up required in the close form; the D3
     tick box and its cancel path.
   - Opportunity page: "Close" on one's own rows in the Next Actions tab.
   - Pre-fill (D10): in each of these close forms, the follow-up box
     starts with the closed next action's text.
   - The My Work plan's step 3 relies on this step; check that plan
     before changing how closing works here.
   - Tests, then a *checkpoint commit*. Nothing stops working on Dev; reps
     with old open next actions must close them first, as intended.
2. **A note on every stage or status change, and On Hold (point 4).**
   - Opportunity page edit form asks for the note when stage or status
     changes; the server refuses the change without it.
   - *Checkpoint commit.* Nothing stops working.
3. **A new Opportunity starts with an activity (point 5)** on the one
   create form. *Checkpoint commit.*
4. ~~**A new hospital starts with a Note and next action (point 6)** on the
   Add Hospital form, after Duplicate Hospitals Part A. *Checkpoint commit.*~~
   Dropped 2026-10-16 (D21).
5. **Data-quality check, records and testing.** The check's "nothing
   planned" also covers On Hold Opportunities. ("Not used yet" leaving
   out hospitals with an open next action, discussion note section 4a,
   needed no change: every next action hangs off an activity, and that
   section already leaves out hospitals with any activity — script and
   schema read 2026-10-16.)
   Business rules marked built; rep message for Haroon (D8); pre-E2E
   review and one manual E2E. After the UAT move: delete
   `.claude/dq-check-paused` and run the UAT data-quality check (ask
   Basheer first) to confirm most of today's issues are gone — the check
   is paused until then (Basheer, 2026-10-15).

## 3. What could be affected

From a code search, 2026-10-14:

- (a) Screens that save through the changed paths: Log Activity form
  (Opportunity page, Customer 360, top bar); Next Actions screen's close
  form; Opportunity page Next Actions tab and edit-form save (the only
  place stage or status changes; the inline value edit is not affected);
  the one new-Opportunity form (all four ways in). (The Add Hospital form
  was on this list until step 4 was dropped, D21.)
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

- Business-Rules: BR-ACT-11, BR-OP-21, BR-OP-22, the BR-ACT-05 change and
  the On Hold next action marked built (step 5). BR-ACC-05 marked
  withdrawn 2026-10-16 (D21).
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
  `PATCH /reminders/{id}`. D10: the follow-up `next_action_text` field in
  each close form is seeded from the closed reminder's text (frontend
  only; still editable, still required). D11: the picker reuses the existing
  RLS-scoped `GET /accounts/{account_id}/opportunities` (`listOpportunities`,
  the Customer 360 Opportunities tab's own list), so no new lookup was
  needed; the BR-ACT-10 `listAccountOpportunitiesLookup` is deliberately
  unscoped and can't be reused. D2: `ReminderUpdate` gains `user_id` so a manager
  closing on a rep's behalf records the closing activity under the rep.
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
- **Point 6 (BR-ACC-05) — not built, dropped 2026-10-16 (D21); kept for
  the record:** `AccountService.create_account` would have gained
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
