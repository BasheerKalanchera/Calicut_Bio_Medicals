# Hospital-Level Open Next Action Rule — Implementation Plan

**Status:** Approved 2026-10-28 (Basheer), D1–D5; D6–D8 added
2026-10-30 (Basheer). Not built; E2E test plan written 2026-10-28,
section G added 2026-10-30 (`docs/Hospital-Next-Action-Rule-Manual-E2E-Test-Plan.md`).
**Traceability rows:** Activity logging / Next Actions rows (unchanged in
what they cover; this tightens BR-ACT-11).
**Design / discussion:** `docs/Next-Action-Rules-Implementation-Plan.md`
(the Opportunity version, built 15 Oct, on UAT 25 Oct);
`docs/Progress-Archive-2026-10.md` 2026-10-28 (the UAT check that found
the gap).

## Decisions

- D1. BR-ACT-11 is extended to hospitals: while a person has an open next
  action of their own on a hospital that is not tied to an Opportunity,
  they can't log a fresh customer-facing activity on that hospital
  without an Opportunity; they close the next action instead, in the same
  Log Activity form — Basheer, 2026-10-28
- D2. Projects are their own level (Basheer, 2026-10-28: "Hospital and
  project level activities are separate"). The rule covers three levels,
  each blocking only itself: an Opportunity; a Project, for activities
  logged on it without an Opportunity; and a hospital, for activities with
  neither. Project-level open next actions are cleared the same way as
  hospital ones (D4) — Basheer, 2026-10-28 (first proposal counted
  Project ones as hospital-level)
- D3. Each level blocks only itself, as in D2. An open next action on an
  Opportunity doesn't stop a hospital-level or Project-level log at the
  same hospital, and an open one at hospital or Project level doesn't
  stop logging on an Opportunity — Basheer, 2026-10-28
- D4. The existing overdue hospital-level next actions are not
  bulk-closed; each blocks at the rep's next visit to that hospital, so
  they are cleared visit by visit — Basheer, 2026-10-28
- D5. Everything else is the same as the Opportunity rule: only the
  person's own next actions count; the same exempt types; several open
  ones show as a tick list (D22 of the Opportunity plan); a visit that
  produced a new Opportunity still closes a hospital-level next action
  with no follow-up (D3 of that plan) — Basheer, 2026-10-28
- D6. The Next Actions screen and the Opportunity Detail Next Actions tab
  show every next action, not only the first 50, with the total in the
  heading. Today both fetch 50 and say nothing about the rest — Basheer,
  2026-10-30 (found in the UAT data-quality report that day)
- D7. Customer 360 gets a Next Actions tab, copied from Opportunity
  Detail's: everyone's next actions on that hospital, each row showing
  its owner; only the owner can close their own — Basheer, 2026-10-30
- D8. The Customer 360 tab lists every level at that hospital —
  hospital, Project and Opportunity — each row showing its Opportunity
  when it has one — Basheer, 2026-10-30

## Figures and sources

- 8 reps who closed no overdue next action since 25 Oct; 42 of their 46
  activities hospital-level; 376 of their 422 overdue next actions
  hospital-level; Rudrappa 10 hospital visits, 49 overdue, all
  hospital-level — UAT read-only query, 2026-10-28
  (`docs/Progress-Archive-2026-10.md`)
- Open next actions by level: hospital 753 (389 overdue), Opportunity 147
  (80), Project 2 (1, both Nishad K V's); 11 Project-level activities
  ever — UAT read-only query, 2026-10-28 10:24 IST
- Rule live on UAT since 2026-10-25 08:15 IST — Progress-Archive 25 Oct
- BR-ACT-11 "Unchanged: activities with no Opportunity" —
  `docs/Business-Rules.md` BR-ACT-11
- 536 overdue next actions across 13 people; Dhanushma 85 and Ravi Kumar
  83, more than the 50 the Next Actions screen shows (D6) — UAT read-only
  query, 2026-10-30 (`docs/Progress-Archive-2026-10.md`)
- The 50 cap: `sales-os-app/src/services/activities.ts` `listReminders`
  and `listOpportunityReminders` send `page_size: 50` and ignore `total`
  — code read 2026-10-30, same on `main` and UAT

## 1. In plain terms

Today, if a rep has an open next action on an Opportunity, the app makes
them close it before they log anything new there. Hospital-level work has
no such rule, so a rep can keep logging visits to a hospital while the
earlier follow-ups for that hospital pile up unanswered.

After this change, the Log Activity form behaves the same way for a
hospital. If you choose a hospital, leave the Opportunity as "None —
hospital-level", and you still have an open next action of your own
there, the form shows it and asks you to close it, saying what happened,
instead of logging a new one. Closing it is what records the visit.

The same applies on a Project's screen: an open next action of your own
on that Project must be closed before you log there again. Each level
(Opportunity, Project, hospital) only blocks itself (D2, D3).

Old overdue next actions are not cleared in one go. Each one comes up the
next time that rep logs at that hospital. So a rep with 49 overdue (like
Rudrappa) clears them as he visits.

To clear them, reps need to see them all. The Next Actions screen today
shows only a person's first 50, with no sign there are more; after this
change it shows all of them and the total (D6). Customer 360 gets a Next
Actions tab listing every open next action at that hospital — anyone's,
on the hospital, a Project or an Opportunity — so a rep or manager can
see what is owed before the visit. Only the owner can close their own
(D7, D8).

This is built and tested on Dev first. It reaches UAT only in a later
update, with its own approval.

### On a phone

Log Activity, on Customer 360, Opportunity Detail and the main menu: the
same yellow warning box the Opportunity rule already shows. It lists the
open next actions with their due dates, and the wording says "on this
hospital" instead of "on this Opportunity". It fills the form's width, as
the Opportunity box does. There is no new screen or pop-up.

Customer 360's new Next Actions tab sits in the same row of tabs as
Activity and Opportunities, and looks like Opportunity Detail's Next
Actions tab on a phone (same rows, same Pending/Completed switch).

## 2. Build order

1. **Server check** — the server refuses a fresh hospital-level activity
   while the person has an open hospital-level next action there. The
   same commit adds a way to list a hospital's open hospital-level next
   actions. Tests. *Stops working on Dev:* until step 2 lands, a rep who
   is blocked sees a plain error after pressing Save instead of the
   close form.
2. **Log Activity form** — the warning box and the switch to the close
   form, for hospital-level logging. One commit.
3. **Seeing them all** — the Next Actions screen and the Opportunity
   tab load every page (D6); Customer 360's Next Actions tab (D7, D8),
   using step 1's hospital list without the hospital-only filter. Tests.
   One commit. *Stops working on Dev:* nothing.
4. **E2E on Dev** — its own test plan,
   `docs/Hospital-Next-Action-Rule-Manual-E2E-Test-Plan.md` (separate
   file — Basheer, 2026-10-28).
   Then Business-Rules BR-ACT-11 is updated, and the UAT move follows with
   its own approval.

## 3. What could be affected

Logging an activity, and closing a next action, are the two ways in.
- (a) Log Activity opened from: the main menu, Customer 360, Opportunity
  Detail (with "None — hospital-level" chosen). The quick lead form
  (`QuickLeadModal`) also uses it; its types are exempt and need checking.
- (b) None. No report opens Log Activity with a filter.
- (c) Close Next Action (`CloseReminderModal`): its "logged from Log
  Activity" mode now also opens for hospital-level ones. My Work and
  Next Actions lists refresh after a close, as they do today.
- (d) Next-action lists (D6–D8): the Next Actions screen, including its
  "due today or overdue" view opened from the login pop-up's Review; the
  Opportunity Detail Next Actions tab and the other Opportunity Detail
  places that call `listOpportunityReminders`; the new Customer 360 tab.
  Each must refresh after a close from any of them.

## 4. Not in this plan (with reasons)

- Bulk-closing the 376 old overdue next actions: they need a real "what
  happened", not an automatic close (D4).
- Summaries of what happened at a hospital: see
  `docs/Engagement-History-Generation-Implementation-Plan.md` (parked to
  Phase 2).

## 5. Business rules and records to update

- `docs/Business-Rules.md` BR-ACT-11: remove "activities with no
  Opportunity" from "Unchanged"; add the hospital case (after E2E).
- User Manual and Log Activity help wording: one line each.
- E2E test plan: `docs/Hospital-Next-Action-Rule-Manual-E2E-Test-Plan.md`
  (written 2026-10-28).

## 6. Technical addendum

- `backend/app/domains/activity/service.py:164`: add a second check when
  `data.opportunity_id` is empty and `data.account_id` is set.
- `backend/app/domains/activity/repository.py`: add
  `has_open_for_user_on_account_level(account_id, user_id)` and
  `has_open_for_user_on_project(project_id, user_id)` (D2). Both use the
  same join as `has_open_for_user_on_opportunity`. Hospital level is
  `Activity.account_id == account_id`, `opportunity_id IS NULL`,
  `project_id IS NULL`; Project level is `Activity.project_id ==
  project_id`, `opportunity_id IS NULL`. The Project screen's Log Activity
  passes `projectId` (`DemoApp.tsx:964`).
- `router.py`: add `GET /accounts/{account_id}/reminders?hospital_level=true`,
  shaped like `/opportunities/{id}/reminders`.
- `sales-os-app/src/components/LogActivityModal.tsx:156`: change
  `blockingReminders` to use the hospital list when there is no
  Opportunity, and parameterise the warning wording.
- `service.py:518` `_others_to_close` (D22 of the Opportunity plan) today
  refuses outright when the next action has no Opportunity ("Only next
  actions on an Opportunity can be closed together."). It must instead
  accept the same person's other open next actions on the same hospital
  with no Opportunity. Without this, a rep with 2 or more on one hospital
  can't log there at all.
- Tests: the backend activity tests mirror the BR-ACT-11 Opportunity cases.
- D6: `sales-os-app/src/services/activities.ts:113` `listReminders` and
  `:128` `listOpportunityReminders` loop over `page` until
  `total_pages`, keeping `page_size` at the router's maximum (100); the
  screens show `total` in the heading.
- D7, D8: `GET /accounts/{account_id}/reminders` without
  `hospital_level=true` returns every level at the hospital (join on
  `Activity.account_id`), paged like the Opportunity route; RLS already
  scopes `reminder` rows. `Customer360Screen.tsx:83` tabs gain
  "Next Actions"; the tab copies `OpportunityDetailScreen.tsx:282`
  `NextActionsTab` (Close on own rows only; `ReminderRow` already shows
  "Owner:" and the Opportunity chip) without `hideOpportunity`.
