# Weekly Follow-up (Daily Hub) — Implementation Plan

**Status:** Step 1 on UAT 2026-10-25 (`8b2ec8a`). Approved 2026-10-21 (Basheer; every line in Decisions
answered). Step 1 (D9a, D10) built ahead of the approval, 2026-10-19
(`508ff42`; Basheer: not part of My Work itself); commit and Dev check in
Progress-Archive. Steps 2, 4 and 5 built 2026-10-28 on branch
`worktree-build` (`42bd5f8`, `8d4bdac`, `d4a8df4`; review fixes `8c0e0c9`)
and merged into `main` the same day on Basheer's go, with the Annual Target
Planning Part 2 E2E paused (D18; the Part 1 E2E that D14 waited for passed
2026-10-24); step 3 has nothing of its own (D13). Still to do: user manual
and in-app help (merge-time catch-up); this plan's E2E not yet run. E2E test plan written 2026-10-25
(`docs/Weekly-Follow-up-Daily-Hub-Manual-E2E-Test-Plan.md`, 33 steps per
`393beee`'s message).
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

- D1. One screen design for everyone, opening on the viewer's own work. A rep sees only their own, with no picker. A manager also opens on their own work and gets a "Showing: Me ▾" switch with "My team" (everyone under them together) and each rep by name; picking a rep shows that rep's My Work exactly as the rep sees it. "Team" follows the existing reports: Area Manager — reps in their zones; SBU Manager — their SBU; Admin and General Manager — everyone — Basheer, 2026-10-14. Changed 2026-10-28 (Basheer): no "My team" combined view — the desk is for the person's own work first, and a combined view is clutter. The switch offers "Me" and each rep by name, one at a time, view-only (D15); a manager uses it to review one person's My Work. This also settles whether "My team" would include the manager's own items (no team total exists)
- D2. Formal screen name "Weekly Follow-up", matching signed requirement 11.1, so the scorecard row maps to it directly. Menu label "My Work" (chosen from the shortlist My Work / My Dashboard / My Hub / My Follow-up); "Insights Dashboard" keeps its name — Basheer, 2026-10-11
- D3. Four sections: (1) "High priority or 70 %+": Opportunities that are high priority (BR-OP-15) or at 70 % chance or more, with a "70 %+ only" tick box that covers PRD §5.8's separate "probability ≥70%" list; (2) closing date passed (BR-OP-16); (3) "Not visited in N+ days" (BR-OP-20, D6); (4) overdue next actions. The PRD's two lists are merged because they almost fully overlap: every stage past Demo is high priority, and the starting chance is 70 % from Negotiation on (Seed-Data.sql); only early-stage Opportunities raised to 70 %+ by hand, and Clinical Evaluation at 55 %, fall outside the overlap. An Opportunity appears in every section it qualifies for; each card shows its own count and ₹ total (next-action cards count only, D21), never a grand total across cards (it would count the same rupees twice). Each row shows Opportunity, hospital, owner, stage, chance, value, and days overdue or idle — Basheer, 2026-10-14
- D3a. Plain names on screen: never "Stagnant" or "Stalled" in what reps see; each list says what it is ("High priority or 70 %+", "Closing date passed", "Not visited in 30+ days" with the number following what the user types, "Overdue next actions"). The existing Stagnant Deals report keeps its name for now; renaming it is a separate later decision — Basheer, 2026-10-14
- D4. Desk additions beyond the contract: "Next actions due this week" (not only overdue), and "My hospitals this quarter" (each hospital in the rep's approved quarterly plan) with last visit and next action due for each, built as the last step (step 5) — Basheer, 2026-10-14; timing reworded in D14 — Basheer, 2026-10-21
- D5. "Automated generation" in 11.1 is met by the screen always being up to date when opened; no weekly email or WhatsApp in Phase 1 — Basheer, 2026-10-21
- D6. "Not visited" counts days since the last visit, call, meeting or email on the Opportunity (D6d), or since it was created if none, and lists Active Opportunities only — not On Hold (Basheer, 2026-10-14). The user types any number of days (e.g. 30 or 60 — Basheer, 2026-10-11); the screen opens at a default of 30 days and returns to it each time it is opened. — Basheer, 2026-10-11, 2026-10-14
- D6a. New rule BR-OP-20 "Not visited", wording in `docs/Business-Rules.md`: an Active Opportunity with no visit, call, meeting or email for N days or more (D20) (N chosen by the user) appears on the list; nothing about the Opportunity changes; logging one of those takes it off. Separate from BR-OP-06 because the trigger and the fix differ — Basheer, 2026-10-14
- D6b. BR-OP-06 reworded to mean time in stage ("Stuck in Stage"), wording in `docs/Business-Rules.md`: an Active Opportunity that stays in one stage longer than that stage's limit becomes Stalled, counted from when it first entered the stage; it clears when the Opportunity moves to a stage it hasn't been in before, or is marked Won or Lost. Logging an activity does not clear it. Switched off until Basheer decides reps log regularly; the per-stage table is unchanged (Payment Pending still undecided). See section 4 for what must be built before it is switched on — Basheer, 2026-10-14
- D6c. The existing Stagnant Deals report changes to the same measure as this desk: only visits, calls, meetings and emails count, and only Active Opportunities are listed (today it counts every activity type, Notes included, and also lists On Hold). It also gets the same type-any-number box, and its code comment claiming "BR-OP-06 says 180 days" is corrected, so a manager never sees two different answers — Basheer, 2026-10-14
- D6d. "Not visited" counts only calls, visits, meetings and emails, not Notes, so a Note written for a stage change (BR-OP-22) or a new hospital doesn't reset the clock — Basheer, 2026-10-12
- D7. "This week" means Monday to Sunday, India time (on Wednesday 21 Oct, 19–25 Oct); overdue ones have their own section — Basheer, 2026-10-21
- D8. Act from the desk: each next-action row has "Done" (the existing close form, with its pre-fill) and each Opportunity or hospital row has "Log Activity"; no new forms. "Close several at once" (Next-Action Rules D22) stays on the Next Actions screen only — Basheer, 2026-10-21
- D9a. Landing screen now: everyone except Marketing Users lands on Account Management instead of Pipeline (step 1) — Haroon via Basheer, 2026-10-12
- D9b. Landing screen later: once this screen is built, everyone except Marketing Users lands here instead (step 5), not earlier: without the rep's hospitals the desk would not replace the hospital search reps start their day with — Basheer, 2026-10-21
- D10. After adding a hospital from Account Management, the app opens that hospital's page instead of returning to the list (step 1) — Basheer, 2026-10-19
- D11. Next-action pre-fill (the new next-action box starts with the old one's text) moved to `docs/Next-Action-Rules-Implementation-Plan.md` D10, built there — Basheer, 2026-10-14
- D12. Which open next action the Log Activity form offers is whatever the Next-Action Rules plan builds; this plan adds no choice of its own (don't build it twice) — Basheer, 2026-10-14
- D13. Step 3 keeps its place with reduced scope. The Next-Action Rules plan is built before this one, so showing and closing the rep's open next action in the Log Activity form (its step 1, Version C, BR-ACT-11) and the pre-fill (its D10) already exist when My Work is built; step 3 uses them and builds nothing of its own. My Work lists next actions (overdue, due this week) and its "Done" and "Log Activity" buttons open those forms. This plan's E2E tests step 3 from My Work itself (closing and logging through My Work's buttons, the lists updating afterwards); the forms' own rules are tested in the Next-Action Rules E2E plan — Basheer, 2026-10-14
- D14. Sequencing: step 1 first (independent, small; built and checked on Dev 2026-10-19, `508ff42`); steps 2–4 after the Annual Target Planning Part 1 E2E (Target vs Actuals and the Opportunity chance + create-form plan, named here before, have both passed theirs); step 5 built on Dev straight after step 4, using Dev's hospital-wise planning; it goes to UAT (with the landing switch, D9b) only in a move where hospital-wise planning is already on UAT or goes in the same move, so the list is never empty for lack of plans — Basheer, 2026-10-21
- D15. When a manager views a rep's My Work ("My team" dropped 2026-10-28, D1), the "Done" and "Log Activity" buttons show only on the manager's own rows; the rep's rows are view-only, because closing a next action records a visit or call as if it happened — Basheer, 2026-10-21
- D16. "Closing date passed" lists only the Opportunities the person owns, since only the owner can change the date or close it; shared Opportunities are not repeated for each participant (unlike Target vs Actuals, which counts shares) — Basheer, 2026-10-21
- D17. "Overdue" means due by the end of today (India time), the same cut as the Insights "Overdue Actions" count; "Due this week" then shows only those due after today — Basheer, 2026-10-21
- D14a. Step 1 goes to UAT with the next full UAT move, not on its own (screen-only, no database change) — Basheer, 2026-10-21
- D18. Steps 2–5 are built immediately after the Annual Target Planning Part 2 E2E is done, ahead of other new features; changes D14's "after the Part 1 E2E" — Basheer, 2026-10-25. Changed 2026-10-28 (Basheer): steps 2 and 4 are built in the parallel `/build` session while Build & Test runs the Part 2 E2E (they touch none of its screens), and reach `main` at the one merge after that E2E; step 5 still follows step 4. Changed again 2026-10-28 (Basheer): the Part 2 E2E is paused, so steps 2, 4 and 5 are merged into `main` now and Build & Test runs this plan's E2E first
- D19. "My Work" is the first item on the menu, at the top of Sales Execution above Account Management, not under Reports. Marketing Users keep their own one-item menu and don't get it — Basheer, 2026-10-25
- D20. "Not visited in N+ days" means N days or more: an Opportunity idle exactly 30 days is on the 30+ list, matching the label and the existing Stagnant Deals report; BR-OP-20 reworded from "more than N" — Basheer, 2026-10-25
- D21. The two next-action cards ("Overdue next actions", "Next actions due this week") show a count only, no ₹ total, because many next actions are on a hospital with no Opportunity value; the three Opportunity cards keep count and ₹ total (narrows D3) — Basheer, 2026-10-25
- D22. All three Opportunity lists ("High priority or 70 %+", "Closing date passed", "Not visited") list only Opportunities the person owns; a split partner doesn't see a shared one there, so it isn't counted twice in "My team" (extends D16) — Basheer, 2026-10-25. "My team" dropped 2026-10-28 (D1); owner-only still holds
- D23. The Stagnant Deals report's server side moves to the "Not visited" measure (D6c) in step 2, sharing one calculation with My Work so the two never disagree; its type-any-number box comes with step 4's screen work. Once merged, Stagnant Deals lists more Opportunities than before, since Notes no longer reset the count — Basheer, 2026-10-28
- D24. My Work makes one combined request for all five lists, not several calls to the existing reports: the existing next-action reports give only a count per person, and one request keeps the cards' counts consistent (settles section 6's open alternative) — Basheer, 2026-10-28
- D25. The Stagnant Deals report's type-any-number box (D6c) opens at 30 days, the same as My Work, instead of today's 180 — Basheer, 2026-10-28
- D26. My Work's two next-action lists come back in the same full form the Next Actions screen uses, so "Done" opens the existing close form with everything it needs and no second request (changes step 2's next-action rows) — Basheer, 2026-10-28
- D27. In "My hospitals this quarter" (step 5), a hospital's "last visit" counts only visits, calls, meetings and emails (the same as "Not visited", D6d), not Notes — Basheer, 2026-10-28
- D28. "Last visit" is the viewed person's own latest such activity at that hospital, whether logged on the hospital or on one of its Opportunities; other people's visits to the same hospital aren't shown — Basheer, 2026-10-28
- D29. A hospital's "next action due" is the earliest open next action assigned to the viewed person at that hospital, including those tied to its Opportunities — Basheer, 2026-10-28

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
  menu under a short personal name (D2), with four sections:
  high priority or 70 %+ chance, closing date passed, "Not
  visited in N+ days" (the user picks N, e.g. 30 or 60), and overdue next
  actions, plus next actions due this week. Each section has a card with
  its count and ₹ total. A rep can close a next action or log a visit
  straight from it. A manager can also open one rep's desk, view-only,
  to review it with them (D1).
- **Two different warnings, kept apart:** "Not visited" (nobody has
  logged a visit or call for a while; fixed by visiting and logging it) is
  on the desk now. "Stuck in stage" (an Opportunity sitting in one stage
  longer than that stage's limit; fixed by moving it forward or closing
  it) stays switched off, so reps who are just getting used to entering
  data aren't flooded with flags. It is switched on later, once the basic
  routine is established.
- **Closing the last next action (step 3, reduced):** when a rep logs a
  visit where they already have an open next action, the Log Activity
  form makes them close it in the same save, so old next actions don't
  pile up. The Next-Action Rules plan builds this; My Work relies on it
  and doesn't build it again (D13). The new next-action box starts with
  the old one's text, so the rep edits one line (built there too, D11).
- **Their hospitals (step 5):** built straight after the desk, the
  desk lists the rep's planned hospitals for the quarter, and the app
  opens on this desk instead of Account Management.

Where it lands: each step is built and tested on Dev, then moves to UAT
with the next full promotion. Step 5 is built on Dev without waiting,
but reaches UAT only with or after hospital-wise planning (migrations 0055
and 0056), since it lists each rep's approved hospital plan (D14).

## 2. Build order

1. **Landing screen and new-hospital flow** (frontend only). Opens on
   Account Management; a newly added hospital opens its page. Nothing
   stops working. Own commit; goes to UAT with the next full move (D14a).
2. **Weekly Follow-up data** (backend). One new read-only report request
   returning the four lists plus next actions due this week, scoped by
   role. Checkpoint commit. Nothing visible changes on Dev.
3. **Closing next actions from the Log Activity form — scope reduced
   (D13).** Fulfilled by `docs/Next-Action-Rules-Implementation-Plan.md`
   step 1 and D10 (pre-fill), which are built before this plan; nothing of
   its own to build. My Work's "Done" and "Log Activity" buttons (step 4)
   open those forms. E2E: this plan's test plan checks closing and logging
   from My Work's buttons and that its lists update; the forms' own rules
   are tested in the Next-Action Rules E2E plan.
4. **Weekly Follow-up screen**, first item on the menu (D19), with "Done" and
   "Log Activity" on its rows. Checkpoint commit, then E2E.
5. **My hospitals + landing on the desk**, built on Dev straight after
   step 4; to UAT only with or after hospital-wise planning (D14). Adds the planned-hospital list and switches the landing screen.

## 3. What could be affected

First pass from a code search, 2026-10-11; completed 2026-10-21 (below).

- **Step 1, landing screen:** the starting screen choice in `DemoApp.tsx`;
  the post-login reminders banner, which switches to Next Actions (check
  it still does); Marketing Users still land on Marketing Leads.
- **Step 1, new hospital:** the add-hospital form is opened from
  Account Management and from the Quick Lead form. Only the Account
  Management path changes; the Quick Lead path must keep returning the new
  hospital to the lead form.
- **Step 3, logging and closing next actions** (changed by the Next-Action
  Rules plan, D13; listed so the dependency is visible):
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

Completed from the code, 2026-10-21:

- **Next actions of other people:** no existing request lists them. The
  Next Actions screen's list returns only the signed-in user's own; the
  Insights "Overdue Actions" card gets a count per person, no list. Step
  2 builds the team list itself (already a new request, so no extra step).
- **Overdue means due by the end of today:** the Insights "Overdue
  Actions" count includes next actions due today. My Work uses the same
  cut, so the two never disagree (D17).
- **Closing date passed:** Target vs Actuals already works it out (built,
  E2E passed), per SBU and split-aware. My Work reuses the rule, not that
  list as is: owner only (D16).
- **Closing other people's next actions:** the database lets anyone who
  can see a next action close it, and the close request does not check
  who it belongs to, so a manager *could* close a rep's from My Work
  (D15).
- **Stagnant Deals change (D6c):** the server query feeds only the
  Stagnant Deals screen; no Insights tile uses it. The old prototype
  screen (`/prototype`, mock data) has its own "stagnant" count and is
  unaffected.
- **Team:** the reports' existing team scoping already matches D1; My
  Work reuses it.
- **Menu (step 4):** Annual Target Planning's screens (`642f04c`) did not
  change the menu; no clash today. Check again before step 4.
- **Step 5:** `target_plan_account` is unchanged by Annual Target
  Planning (migration 0062).

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
- **Closing next actions in the Log Activity form and the strict rule
  (Version C, BR-ACT-11):** built by `docs/Next-Action-Rules-Implementation-Plan.md`;
  this plan only relies on it (D12, D13).

## 5. Business rules and records to update

- `docs/Business-Rules.md`:
  - new BR-OP-20 "Not visited" (D6a) — done 2026-10-14;
  - BR-OP-06 reworded to time in stage, switched off (D6b), with every
    other doc that mentions BR-OP-06 updated in the same commit — done
    2026-10-14;
  - BR-ACT-04 and BR-ACT-05: changed by the Next-Action Rules plan, not
    here, pre-fill included (D11);
  - BR-OP-16 "Where shown".
  BR-OP-20 and BR-OP-06 wording approved and saved 2026-10-14 (Basheer).
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
  `opportunity/repository.py:263`. One combined request (D24); `user_id`
  picks whose desk, defaulting to the viewer — no team-wide mode (D1).
- **Step 3 (reduced, D13):** the `LogActivityModal` reminder lookup and
  close-in-the-same-save are the Next-Action Rules plan's step 1, and the
  pre-fill its D10 (its technical addendum). Nothing added here.
- **D6c:** `StagnantDealsReportScreen.tsx:7–20` (`STAGNANT_THRESHOLD_OPTIONS`
  90/180, comment "BR-OP-06 says 180 days") → free number entry; backend
  `threshold_days` already accepts any value ≥ 1 (`reporting/router.py:49`).
  Measure today: `reporting/repository.py:248` `stagnant_deals`, last
  `activity_date` per Opportunity across all activity types, else
  `created_at`, filtered `is_terminal == False` (so On Hold and Stalled are
  included). Change (D6, D6c): last-activity subquery limited to
  `activity_type IN ('VISIT','CALL','MEETING','EMAIL')`, and status =
  Active only. The same expression feeds the desk's "Not visited" list.
- **Step 5:** planned hospitals from `target_plan_account` (visit
  frequency, planned amount) for the rep's current-quarter `target_plan`.
- Tests: pytest for scoping per role and each list's rule; E2E plan via
  the `cabio-e2e-testing` skill.
