# Discussion: Next actions drive activity logging on an Opportunity — 2026-10-11

**Status:** Agreed 2026-10-12 — all questions answered (section 5a).
Agreed rules are in Business-Rules (BR-OP-21, BR-OP-22, BR-ACT-11,
BR-ACT-05 change, On Hold next action), not built. Next: its own
implementation plan.
**Participants:** Basheer (decisions), Haroon / Cabio leadership (business
sign-off), Claude (options and analysis).
**Origin:** UAT data-quality check, 2026-10-11. Basheer: many sales staff log
fresh activities instead of continuing from the next action they set last
time, and Haroon is now asking them to let their next actions drive their
activity list. Basheer asked how the app could make that the only way for an
existing Opportunity.

## 1. In plain terms

When a rep logs a call, visit or meeting, they also set a next action: what
happens next, by when, and who does it. That next action then sits on the
rep's Next Actions list until it is done.

There are two ways to record the next piece of work:

- **Way A — complete the next action.** The rep opens the next action from
  their list, marks it done and writes what happened. The app saves that as an
  activity, linked to the next action it completed. This is what Haroon wants.
- **Way B — log a fresh activity.** The rep ignores the open next action and
  logs a new activity from scratch. The old next action stays open on their
  list, now out of date, and the history no longer shows that the follow-up
  was done.

Today the app allows both, and the screen a rep is most likely to be on when
working an Opportunity only offers Way B. The proposal: when a rep logs an
activity on an Opportunity that already has an open next action of their
own, the app steers them to Way A. Section 4b sets out three ways of doing
that, from gentle to strict. Section 4a adds three rules so that no active
Opportunity or hospital is left without a next action.

## 2. How it works today

- **Next Actions screen:** the only place where Way A is possible. The rep
  marks a next action done, writes what happened, and *may* set a new next
  action. Setting one is optional at that point.
- **Opportunity page:** has a Next Actions tab listing that Opportunity's
  next actions, but it is read-only. That was deliberate: the tab shows
  everyone's next actions on the Opportunity, and allowing completion there
  would let one person close another's follow-up. Its only logging button is
  "Log Activity", which is Way B.
- **Hospital page (Customer 360) and the "Log Activity" button in the top
  bar:** also Way B.
- **A fresh activity (Way B) must set a next action** for calls, visits,
  meetings and similar. Conferences, seminars, manager notes and support
  entries are exempt.

## 3. What the 11 Oct data shows

- 50 activity notes don't say what happened. Most are Way A done badly: the
  rep completed a "Follow up" next action with just "Done" (Vivek, 6–7 Oct:
  27 of them; Nishad K V, 5 Oct: 14).
- The check's old count of "activities with no next action" (258) counted
  Way A completions as problems. Corrected, only 2 activities are really
  missing a next action. All 53 of Fahad's on 9 Oct were next actions he
  marked done during Haroon's review.
- 51 active Opportunities have no open next action: 18 have been worked
  but their last next action was closed with nothing new set, and 33 have
  never had any activity.

## 4. The proposal

### 4a. The goal: an active Opportunity is never left without a next action

Two rules, both enforced by the app:

**Rule 1 — an Opportunity starts with an activity and a next action.**
Whoever enters an Opportunity also logs its first activity (the
conversation that made it an Opportunity) and the next action, in the same
step. This applies to every way an Opportunity is created, including
converting a marketing lead. It stops new cases like the 33 active
Opportunities that have never had any activity (11 Oct data-quality
report, section 6).

**Rule 2 — a new hospital starts with a next action.** Whoever enters a
hospital also sets its next action (for example "First visit", with a
date and the rep who will do it). If there has already been contact, they
log that as the first activity too. A hospital is often entered before
anyone has been there, as a place to cover, so an activity can't always
be demanded; a next action can. It stops new cases like the 36 hospitals
with no Opportunity and no activity (same report, section 9). Today a
next action can only be saved as part of an activity, so this needs a
change to how next actions are kept (question 9).

**Rule 3 — closing a next action needs a follow-up next action**, whether
it belongs to an Opportunity or a hospital. The rep must set the next one
before saving. It stops new cases like the 18 Opportunities that were
worked but now have nothing planned (same report, section 6). Only two
exceptions:

- **The Opportunity is being marked Won or Lost** at the same time, so
  there is nothing left to plan on it. The rep may still add one if there
  is something to do, such as chasing payment after a Won order.
- **Another next action is still open on the same Opportunity or
  hospital.** It is still on someone's list, so it cannot be forgotten.
  This matters during clean-ups like Haroon's review round, where a rep
  closes several old next actions on one Opportunity in a row: only the
  last one closed needs a follow-up.

A hospital-level next action whose visit turned into a new Opportunity
needs no hospital follow-up: rule 1 gives the new Opportunity its own.

**On Hold Opportunities also keep a next action.** Putting an Opportunity
On Hold already requires a re-activation date. The app would also require
a next action, its due date filled in with the re-activation date; the
rep can move it earlier but not later.

None of the rules fixes what is already there: the existing cases (40
Opportunities with no activity, 51 with no next action, 36 unused
hospitals) still need the reps to work through them, as the data-quality
report asks. Some of the 36 hospitals are copies or mistakes (two unused
copies of Radians health care Thrissur, one named "Duplicate") and need
removing or merging rather than a next action.

When the rules are built, two report checks change with them: the
"no next step planned" check (section 6) also covers On Hold
Opportunities, and the "hospitals not used yet" check (section 9) counts
only hospitals with no activity, no Opportunity and no open next action.

### 4b. Steering reps to close next actions instead of logging fresh activities

**When it applies.** A rep opens the Log Activity form (from the
Opportunity page, the hospital page or the top bar) for an Opportunity
that already has an open next action assigned to that rep. The app enforces
this itself, so it is the same on every screen.

**Three versions — Haroon to choose one:**

| | What the Log Activity form does | Good | Weak |
|---|---|---|---|
| **A. Reminder** | Says "this Opportunity has a pending next action — close that instead?" If the rep says no, they log a fresh activity as today. | Easy on reps; nothing new to learn. | The old habit is one click away. A rep who says no still leaves the old next action open and out of date. |
| **B. Middle — recommended** | Same offer as A. If the rep says no, they must still say what happens to the old next action before saving: **"No longer needed"** (the app closes it and records that) or **"Still to be done"** (it stays open). | The rep keeps a choice, but no next action is silently left behind. | One extra question each time a rep chooses a fresh activity. |
| **C. Strict** | Only lets the rep close the open next action. A fresh activity isn't allowed until no open next action of theirs is left on that Opportunity. | Leaves no way round the rule. | Hard on reps in unusual cases, e.g. an unplanned visit while the planned call is still due next week. |

**Recommendation: B.** A plain reminder tends to get clicked past, and
the strict version gets in the way of real work.

**Common to all three:**

1. **Closing the next action happens in the same form**, so reps don't have
   to change screens. The form shows the rep's open next action(s) for that
   Opportunity; they pick the one this activity completes and write what
   happened.
2. **Rule 3 applies** (section 4a): closing the next action needs a
   follow-up, with the same exceptions.
3. **Unchanged:**
   - activities with no Opportunity (hospital-level work)
   - the types that never need a next action (conferences, seminars, manager
     notes, support entries)
   - Opportunities with no open next action for that rep, where a fresh
     activity is still the only way to record anything

## 5. Questions

**For Haroon**

1. **Which version: A, B or C** (section 4b)? For example: Vivek has an open
   "Follow up" next action at THIRUVALLA MEDICAL MISSION HOSPITAL,
   THIRUVALLA and logs a call there from the Opportunity page. Under A he
   can ignore the offer and the "Follow up" stays open; under B he must
   say whether it is no longer needed or still to be done; under C he can
   only close it.
   *Recommendation: B.*
2. **Someone else's next action.** Fazal logs a visit on an Opportunity where
   the only open next action belongs to Haroon (for example, Haroon's own
   reminder to call the purchase manager). Should Fazal be made to complete
   Haroon's next action first?
   *Recommendation: no.* Only the rep's own open next actions trigger the
   form's offer. Otherwise one person's reminder would get in the way of
   everyone else logging on that Opportunity.
3. **Old, overdue next actions.** A rep's next action has been overdue for
   three weeks and the situation has moved on. With version B, may they
   keep it as "Still to be done" without changing anything?
   *Recommendation: no — they also give it a new due date.* Otherwise
   stale next actions pile up and the list stops meaning anything.
4. **Rule 3: a follow-up whenever a next action is closed** (section 4a).
   For example: on 9 Oct Fahad closed his "PO Follow up" and "Tuesday" next
   actions on SonoScape E1 Exp at Pragathi Hospital Puttur (Order, 99 %
   chance) and set no new one, so nothing now reminds him to follow it up.
   Should he have had to set the next step when closing the last one, with
   the two exceptions in section 4a?
   *Recommendation: yes.* This is what keeps every active Opportunity on
   someone's list.
5. **Rule 1: an activity and next action when an Opportunity is entered**
   (section 4a). For example: Om Hiremath's 17 Opportunities in Bangalore
   were entered between 1 and 11 September and have had no activity
   since. Should entering an Opportunity require its first
   activity and next action in the same step?
   *Recommendation: yes*, on every way an Opportunity is created.
6. **Completing from the Opportunity page.** Should the Opportunity page's
   Next Actions tab let a rep mark *their own* next actions done there, like
   the Next Actions screen?
   *Recommendation: yes, own ones only.* That keeps the original reason the
   tab was made read-only.
7. **Hospital-level next actions.** Some next actions belong to a hospital,
   not an Opportunity (for example, a first visit before any Opportunity
   exists). Should closing one also need a follow-up (rule 3)?
   *Recommendation: yes.* Hospitals in the coverage plan need regular
   contact whether or not there is an Opportunity yet. If the visit turned
   into a new Opportunity, that Opportunity's next action is enough.
8. **On Hold Opportunities.** For example: Vivek's Max300 at SP FORT
   HOSPITAL, TRIVANDRUM is On Hold. Should putting an Opportunity On Hold
   also require a next action, due by its re-activation date?
   *Recommendation: yes*, so someone is reminded to pick it up again.
9. **New hospitals (rule 2).** The report lists 36 hospitals with no
   Opportunity and no activity, 17 of them in Wayanad. Should entering a
   hospital require a next action (and the first activity, if there has
   been contact)?
   *Recommendation: yes.*

**For Basheer**

10. **A next action with no activity behind it** (rule 2). Today every
   next action is saved as part of an activity, so a planned first visit
   to a hospital nobody has contacted can't be stored. Two ways:
   (a) allow a next action on its own, attached to a hospital — cleaner,
   but a structural change, since the Next Actions screen and reports
   assume every next action comes from an activity; or (b) log a planning
   entry as a non-customer activity (like a manager note) carrying the
   next action — no structural change, but it adds activities that aren't
   real contact and muddies "has this hospital been worked?" checks.
   *Recommendation: (a).*
11. **Plan.** This changes the same "log activity" area as the approved
   Opportunity chance + create-form plan
   (`docs/Win-Probability-Rule-and-One-Create-Form-Implementation-Plan.md`), whose
   step 1 hasn't started, and rule 1 changes the create form that plan
   rebuilds. Fold it in as a later step there, or write a separate plan?
   *Recommendation: a separate plan*, so the approved plan isn't reopened;
   it builds rule 1 on top of the new create form once that lands.

## 5a. Answers — 2026-10-12

Haroon's answers, passed on by Basheer, and Basheer's follow-ups the
same day:

- **Question 1 — version C (strict).** A rep with an open next action of
  their own on an Opportunity can't log a fresh activity there until it is
  closed (Haroon). → BR-ACT-11.
- **Question 2 — own next actions only.** Each person is held back only by
  next actions assigned to them (Basheer). → BR-ACT-11.
- **Question 4 — yes, as reading (i).** Closing one's own next action on
  an Opportunity always needs a new one on that Opportunity; the only
  exception is marking it Won or Lost — section 4a's second exception
  ("another next action is still open") is dropped (Basheer). Stage and status can
  still be changed on the Opportunity page (Basheer: "(i) now, tighten to
  (ii) once the team is comfortable"). The stricter (ii) — stage and status
  changed only by closing a next action — is parked in Backlog "Stage
  changes only by closing a next action". → BR-ACT-05 change.
- **Question 5 — yes.** A new Opportunity can't be saved without its first
  activity (Haroon). → BR-OP-21.
- **New: a note on every stage or status change** (Haroon). Basheer: when
  the person changing it has an open next action of their own, closing that
  next action is the note; otherwise they log a Note activity; a manager
  logs a Note and the owner's next action stays open. → BR-OP-22.
- **Question 6 — yes, own ones only**, as a consequence of BR-OP-22:
  owners close their next action from the Opportunity page while changing
  stage (Basheer).
- **Also from Haroon:** the app opens on Account Management instead of
  Pipeline — `docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md` D9,
  first half.

- **Question 11 — a separate plan** (Basheer), built on top of the new
  create form once the chance + create-form plan lands.
  **Build order (2026-10-13):** both plans change the "New Opportunity"
  form. The Win Probability plan merges the three create forms into one;
  the rule that a new Opportunity starts with an activity (BR-OP-21) is
  then added to that one form. So the next-action rules are built after
  the form merge (Win Probability plan step 2), into one form instead of
  three. The next-action plan is written with that order and shown to
  Basheer for approval.

- **Question 3 — no new rule needed** (Basheer). Under BR-ACT-11 an
  out-of-date next action can't be left behind: the next time its owner
  works the Opportunity, they must close it, and a Note saying why (e.g.
  "no longer needed; customer wants a demo") is already a valid closing
  activity.
- **Question 7 — yes** (Basheer): closing a hospital-level next action
  needs a new one, unless the visit produced a new Opportunity (BR-OP-21
  gives it its own).
- **Question 8 — yes** (Basheer): putting an Opportunity On Hold needs a
  next action due by the re-activation date; it is the follow-up for the
  next action closed at that point.
- **Question 9 — yes** (Basheer); how the first next action is stored
  (question 10).
- **Question 10 — a Note, not (a) or (b)** (Basheer, 2026-10-12): the
  person adding the hospital logs a Note on it ("Added for coverage; first
  visit planned") carrying the first next action — a Note already needs a
  hospital and a next action, so nothing structural changes. "Not visited"
  ignores Notes (Weekly Follow-up plan D6d).

All questions answered. Next: the separate implementation plan.

## 6. Related

- The Weekly Follow-up Daily Hub plan (Draft,
  `docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md`, which replaced
  the Weekly Follow-up Report plan on 2026-10-11) has an "overdue next
  actions" section. It is only as useful as the next action lists behind
  it, which these rules keep current.
- Business rules affected: BR-ACT-04 (next action on every activity) and
  BR-ACT-05 (completing a next action records what happened). Question 4
  would make BR-ACT-05's optional new next action mandatory while the
  Opportunity is open. Version B's "No longer needed" is a new way to close
  a next action without a matching activity; today BR-ACT-05 always needs
  one, so the rule would gain that exception.
- Rule 2 adds a next action when a hospital is entered; the On Hold point
  adds a next action to the On Hold rule (hold reason and re-activation
  date) in Business-Rules.
- The draft duplicate-hospital plan
  (`docs/Duplicate-Hospital-Prevention-Implementation-Plan.md`) also
  changes the "add hospital" form; rule 2 would be built after it, in the
  same form.

## Technical addendum (for the record)

- Way A today: `NextActionsScreen.tsx` → `CloseReminderModal.tsx` →
  `PATCH /reminders/{id}` (`ReminderService.patch_reminder`), which creates
  the closing Activity atomically, inheriting `account_id`/`opportunity_id`
  from the reminder's creating Activity, linked via
  `reminder.closing_activity_id`. Follow-up `next_action_*` fields optional
  (BR-ACT-05).
- Way B today: `LogActivityModal.tsx` (used by `OpportunityDetailScreen.tsx`,
  `Customer360Screen.tsx`, `DemoApp.tsx` top bar) → `ActivityService.log_activity`;
  `next_action_*` mandatory except `NOT_CUSTOMER_FACING_TYPES` (BR-ACT-04).
- Opportunity page Next Actions tab is read-only by design
  (`OpportunityDetailScreen.tsx` comment above `NextActionsTab`): its list
  isn't scoped to the assignee.
- `LogActivityModal` would look up the logging user's open reminders on the
  chosen Opportunity and offer the completion route (`PATCH
  /reminders/{id}`). Per version: A — frontend prompt only; B — backend
  `log_activity` requires a disposition for each of the user's open
  reminders on that `opportunity_id` (close as no longer needed, needing a
  new closed-without-activity state on `reminder`, or keep open); C —
  backend `log_activity` refuses the Activity while any such reminder is
  open. B and C are enforced in the backend so every screen and the API
  behave the same. Reminder → Opportunity link is through
  the creating Activity (`reminder.activity_id` → `activity.opportunity_id`).
- Rule 1: Opportunity creation (`OpportunityService` create and the
  marketing-lead conversion path) would take the first Activity and its
  `next_action_*` in the same transaction. Rule 2: `reminder.activity_id`
  is `NOT NULL` today (`docs/Physical-Schema.sql`), so a next action with
  no Activity needs either a nullable `activity_id` plus a direct
  `account_id` on `reminder` (option a, migration; Next Actions screen and
  report queries that join through `activity` need reworking) or a
  non-customer-facing planning Activity type (option b). Rule 3:
  `patch_reminder` would require the follow-up `next_action_*` unless the
  same request moves the Opportunity to Won or Lost, or another open
  reminder exists on the same Opportunity (via `reminder.activity_id` →
  `activity.opportunity_id`) or, for hospital-level reminders, the same
  account. On Hold: the status change would require a reminder with
  `due_date` ≤ `reactivation_date`.
- Data-check side: section 7a of `scripts/uat_data_quality_check.py` now
  leaves out closing Activities and exempt types (fix 2026-10-11); new
  section 7a-ii lists active Opportunities with no open reminder.
