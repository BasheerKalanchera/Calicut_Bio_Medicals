# Weekly Follow-up (Daily Hub) — Implementation Plan

**Status:** Draft, 2026-10-11.
**Traceability rows:** 11.1 Weekly Follow-up Report (Not started). Also
touches 6.1 Beat Planning (Not started) once hospital-wise planning is on
UAT.
**Design / discussion:** UAT usage analysis of 4–10 Oct 2026
(Progress-Archive-2026-10, to be written); PRD §5.8, §A.3.2, §5.7;
Proposal v2 and Kickoff deck "Daily Hub"; `docs/Backlog.md` "Weekly
Follow-up Report — not built, no longer blocked";
`docs/Discussion-Next-Action-Driven-Activity-Logging-2026-10.md`. This
plan replaces an uncommitted 2026-10-04 draft from another tool (deleted
2026-10-11; its one extra idea, summary cards, is in D3).

## Decisions

Every choice this plan depends on, one line each. Claude's suggestions end
in `— proposed`; once Basheer answers, change the ending to
`— Basheer, YYYY-MM-DD`.

- D1. One screen for everyone: a rep sees their own work; a manager sees their team's, with a person picker (same scoping as the existing reports) — proposed
- D2. Formal screen name "Weekly Follow-up", matching signed requirement 11.1, so the scorecard row maps to it directly. Menu label "My Work" (chosen from the shortlist My Work / My Dashboard / My Hub / My Follow-up); "Insights Dashboard" keeps its name — Basheer, 2026-10-11
- D3. Five sections: (1) high-priority Opportunities (BR-OP-15), (2) Opportunities at 70 % chance or more, (3) closing date passed (BR-OP-16), (4) "Not visited in N+ days" (new BR-OP-20, D6), (5) overdue next actions. Each has a summary card with its count and ₹ total; each row shows Opportunity, hospital, owner, stage, chance, value, and days overdue or idle — proposed
- D3a. Plain names on screen: never "Stagnant" or "Stalled" in what reps see; each list says what it is ("Not visited in 30+ days") — proposed
- D4. Desk additions beyond the contract: "Next actions due this week" (not only overdue), and, once hospital-wise planning is on UAT, "My hospitals this quarter" with last visit and next action due for each — proposed
- D5. "Automated generation" in 11.1 is met by the screen always being up to date when opened; no weekly email or WhatsApp in Phase 1 — proposed
- D6. "Not visited" uses the same measure as the existing Stagnant Deals report (days since the last activity on the Opportunity, or since it was created if none). The user types any number of days (e.g. 30 or 60 — Basheer, 2026-10-11); the screen opens at a default of 30 days and returns to it each time it is opened. — Basheer, 2026-10-11
- D6a. New rule BR-OP-20 "Not visited": an Active Opportunity with no activity for more than N days (N chosen by the user) appears on the list; nothing about the Opportunity changes; logging an activity takes it off. Separate from BR-OP-06 because the trigger and the fix differ — proposed
- D6b. BR-OP-06 reworded to mean time in stage ("Stuck in stage"): an Active Opportunity that stays in one stage longer than that stage's limit becomes Stalled; it clears when the Opportunity moves to a stage it hasn't been in before, or is marked Won or Lost. Logging an activity does not clear it. Switched off until Basheer decides reps log regularly; the per-stage table is unchanged (Payment Pending still undecided). See section 4 for what must be built before it is switched on — proposed
- D6c. The existing Stagnant Deals report gets the same type-any-number box, and its code comment claiming "BR-OP-06 says 180 days" is corrected, so the report and this desk agree — proposed
- D6d. "Not visited" counts only calls, visits, meetings and emails, not Notes, so a Note written for a stage change (BR-OP-22) or a new hospital doesn't reset the clock — Basheer, 2026-10-12
- D7. "This week" means Monday to Sunday, India time — proposed
- D8. Act from the desk: each next-action row has "Done" (the existing close form) and each Opportunity or hospital row has "Log Activity"; no new forms — proposed
- D9a. Landing screen now: everyone except Marketing Users lands on Account Management instead of Pipeline (step 1) — Haroon via Basheer, 2026-10-12
- D9b. Landing screen later: once this screen is built, everyone except Marketing Users lands here instead (step 5) — proposed
- D10. After adding a hospital from Account Management, the app opens that hospital's page instead of returning to the list (step 1) — proposed
- D11. Next-action pre-fill: when a rep logs an activity on a hospital or Opportunity that has an open next action of theirs, the form shows it, ticked "this activity completes it", and the new next-action box starts with its text for the rep to edit — proposed
- D12. Which open next action is offered first when there are several: from an Opportunity page, that Opportunity's; elsewhere, the one due soonest; the rep can pick another — proposed
- D13. D11 follows whichever version (A, B or C) Haroon picks in the next-action discussion (he chose C on 2026-10-12: BR-ACT-11); this plan builds the shared part (pick the next action and close it in the same form) and the pre-fill, which all three versions need — proposed
- D14. Sequencing: step 1 first (independent, small); steps 2–4 after the Target vs Actuals E2E and the Opportunity chance + create-form plan; step 5 after hospital-wise planning reaches UAT — proposed

## 1. In plain terms

Last week's UAT log (4–10 Oct) shows what reps actually do. Most sessions
start by searching for a hospital, open its page, log a visit or open one
of its Opportunities, then go back and search for the next hospital. Only
34 of about 590 app opens used the Pipeline screen people land on. Next
actions are closed in batches from the Next Actions screen.

This plan makes the rep's day start from one desk instead of a search box:

- **Now (step 1):** the app opens on Account Management instead of
  Pipeline. Adding a hospital takes the rep straight to its page, ready to
  add an Opportunity or log a visit; today it drops them back on the list
  and they search for the hospital they just added (89 times last week).
- **The Weekly Follow-up desk (steps 2–4):** one screen, shown in the
  menu under a short personal name (D2), with five sections:
  high-priority Opportunities, 70 %+ chance, closing date passed, "Not
  visited in N+ days" (the user picks N, e.g. 30 or 60), and overdue next
  actions, plus next actions due this week. Each section has a card with
  its count and ₹ total. A rep can close a next action or log a visit
  straight from it. A manager sees the same screen for their team.
- **Two different warnings, kept apart:** "Not visited" (nobody has
  logged a visit or call for a while; fixed by visiting and logging it) is
  on the desk now. "Stuck in stage" (an Opportunity sitting in one stage
  longer than that stage's limit; fixed by moving it forward or closing
  it) stays switched off, so reps who are just getting used to entering
  data aren't flooded with flags. It is switched on later, once the basic
  routine is established.
- **Starting from the last next action (step 3):** when a rep logs a visit
  where they already have an open next action, the form shows it as "this
  visit completes it" and fills the new next-action box with its text. The
  rep edits one line instead of typing from scratch, and the old next
  action closes instead of piling up.
- **Their hospitals (step 5):** once hospital-wise planning is on UAT, the
  desk lists the rep's planned hospitals for the quarter, and the app
  opens on this desk instead of Account Management.

Where it lands: each step is built and tested on Dev, then moves to UAT
with the next full promotion. Step 5 needs hospital-wise planning
(migrations 0055 and 0056) to be on UAT first.

## 2. Build order

1. **Landing screen and new-hospital flow** (frontend only). Opens on
   Account Management; a newly added hospital opens its page. Nothing
   stops working. Own commit; can go to UAT ahead of the rest.
2. **Weekly Follow-up data** (backend). One new read-only report request
   returning the five lists plus next actions due this week, scoped by
   role. Checkpoint commit. Nothing visible changes on Dev.
3. **Next-action pre-fill and completion in the Log Activity form**
   (backend + frontend), shaped by Haroon's A/B/C answer. Checkpoint
   commit. Until step 4 lands, it is reachable from the hospital page,
   Opportunity page and top-bar button.
4. **Weekly Follow-up screen** in the menu under Reports, with "Done" and
   "Log Activity" on its rows. Checkpoint commit, then E2E.
5. **My hospitals + landing on the desk**, after hospital-wise planning is
   on UAT. Adds the planned-hospital list and switches the landing screen.

## 3. What could be affected

First pass from a code search, 2026-10-11. To be completed before approval.

- **Step 1, landing screen:** the starting screen choice in `DemoApp.tsx`;
  the post-login reminders banner, which switches to Next Actions (check
  it still does); Marketing Users still land on Marketing Leads.
- **Step 1, new hospital:** the add-hospital form is opened from
  Account Management and from the Quick Lead form. Only the Account
  Management path changes; the Quick Lead path must keep returning the new
  hospital to the lead form.
- **Step 3, logging and closing next actions:**
  - (a) Log Activity form, opened from the top bar, the hospital page and
    the Opportunity page; the close form on the Next Actions screen.
  - (b) Next Actions screen opened from the post-login banner with a due
    filter.
  - (c) Lists refreshed after a save: Next Actions, the Opportunity's Next
    Actions tab, activity lists on the hospital and Opportunity pages, the
    Daily Activity Report, the Insights overdue-actions and activity-level
    tiles, the Stagnant Deals report (a new activity resets an
    Opportunity's idle count).
- **Steps 2 and 4:** a new read-only request and a new screen; no existing
  screen reads them. None beyond the menu.

## 4. Not in this plan (with reasons)

- **Exception Report (PRD §5.7: hospitals with no activity for 3 months):**
  a separate requirement about hospitals, not Opportunities; it can become
  a later list on this desk once scoped.
- **Count of closing-date push-backs:** Backlog idea, Phase 2 candidate.
- **Weekly email or WhatsApp digest:** see D5.
- **"Stuck in stage" (BR-OP-06 as reworded, D6b; Feature 13.2 alerts):**
  switched off for now to avoid noise during adoption (Basheer,
  2026-10-11). Before it is switched on, it needs:
  1. **A record of each stage move and when it happened.** The app keeps
     no "entered stage on" date today; the audit trail may hold stage
     changes (not checked).
  2. **Checks against clearing the flag without real progress:**

     | Way round it | Example (made up) | Check |
     |---|---|---|
     | Move forward too early | Stuck in Demo, moved to Negotiation with nothing new | Stage gates already ask for proof (e.g. BR-OP-19), but can be overridden with a reason; managers see a list of override moves |
     | Move back and forward | Negotiation → Demo → Negotiation the same day | The clock counts from when it *first* entered the stage; a backward move notifies the manager |
     | Put it On Hold | On Hold to hide a stuck Opportunity | Hold already needs a reason and restart date; when that date passes it returns with its clock still running |
     | Mark Lost, then start a new one | Lost this week, a fresh Opportunity for the same hospital and product next week | Warn when a new Opportunity matches one recently closed as Lost; manager sees it |
     | Mark Won too early | Unlikely: Won needs a PO date and shows in sales figures | Nothing extra |

  3. **A scheduled job** that sets and clears Stalled (none exists yet),
     plus the notifications BR-OP-06 describes.
  Not yet verified in code: whether a rep can move an Opportunity
  backwards today, and how a hold's restart date is handled. Check both
  before writing them into the rule.
- **Strictness of the next-action rule (A/B/C):** decided by Haroon in the
  discussion doc; this plan only follows it (D13).

## 5. Business rules and records to update

- `docs/Business-Rules.md`:
  - new BR-OP-20 "Not visited" (D6a);
  - BR-OP-06 reworded to time in stage, switched off (D6b), with every
    other doc that mentions BR-OP-06 updated in the same commit;
  - BR-ACT-04 and BR-ACT-05 (pre-fill, completing from the Log Activity
    form), per Haroon's answer;
  - BR-OP-16 "Where shown".
  The exact wording of BR-OP-20 and BR-OP-06 is shown to Basheer before
  saving.
- `docs/Signed-Requirements-to-PRD-Traceability.md`: row 11.1; row 6.1 at
  step 5.
- `docs/Backlog.md`: close "Weekly Follow-up Report — not built"; remove
  the Weekly plan from the "fix the two other-tool plans" item (old draft
  deleted 2026-10-11); add "Stuck in stage" (BR-OP-06) as a later step
  with the prerequisites in section 4.
- `docs/UI-Inventory.md`: new screen.
- User manual/help: landing screen, new screen, Log Activity form.

## 6. Technical addendum

- **Step 1:** `DemoApp.tsx:130` default `view` `"opportunities"` →
  Account Management's view key. `CustomerDirectoryScreen.tsx:93`
  `handleAccountCreated` → call `onSelectAccount(account)` as
  `handleExistingSelected` (`:101`) already does. `AddHospitalModal`'s
  `onCreated` already passes `{id, name}`. `QuickLeadModal.tsx:639`
  unchanged.
- **Step 2:** new `GET /reporting/weekly-followup` (`sbu_id`, `zone_id`,
  `user_id`, `idle_days` default 30), reusing the scoping and
  queries behind `/reporting/stagnant-deals` and `/reporting/overdue-actions`
  and the BR-OP-15 `is_high_priority` expression in
  `opportunity/repository.py:263`. Alternative to decide in review: the
  screen calls the existing endpoints plus small new ones, instead of one
  combined request.
- **Step 3:** `LogActivityModal` fetches the rep's open reminders for the
  account or Opportunity; on submit, either `PATCH /reminders/{id}` with
  the BR-ACT-05 closing payload (closing Activity = this Activity) or one
  new combined endpoint, so the activity and the completion save
  together. `NOT_CUSTOMER_FACING_TYPES` cannot close a reminder. Invalidate
  `["reminders"]`, `["opp-reminders", id]` and the activity queries.
- **D6c:** `StagnantDealsReportScreen.tsx:7–20` (`STAGNANT_THRESHOLD_OPTIONS`
  90/180, comment "BR-OP-06 says 180 days") → free number entry; backend
  `threshold_days` already accepts any value ≥ 1 (`reporting/router.py:49`).
  Measure: `reporting/repository.py` `stagnant_deals`, last `activity_date`
  per Opportunity, else `created_at`.
- **Step 5:** planned hospitals from `target_plan_account` (visit
  frequency, planned amount) for the rep's current-quarter `target_plan`.
- Tests: pytest for scoping per role and each list's rule; E2E plan via
  the `cabio-e2e-testing` skill.
