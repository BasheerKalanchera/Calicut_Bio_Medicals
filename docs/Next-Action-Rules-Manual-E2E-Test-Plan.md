<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Next-Action Rules — Manual E2E Test Plan

**Covers:** `docs/Next-Action-Rules-Implementation-Plan.md`, steps 1–3 and 5 (step 4 dropped)
(one combined run after step 5, per the plan's step 5). The pre-fill (plan
D10, added 2026-10-14) is checked inside the four close forms' existing
steps — A3, B2, C3 and D2 — so it needs no extra saves on Dev.
Section H (added 2026-10-20) covers plan D22, closing several at once,
built after the 2026-10-18 run; it is run on its own.
**Built:** step 1 `3d38e75` (2026-10-15, checkpoint); step 2 `bd92e4a` + `4fc8531` (2026-10-16, checkpoints); step 3 `c4e1ca3` (2026-10-16); step 4 dropped (plan D21); step 5: script `f93397f`, pre-E2E review fixes `4bec886` (2026-10-16); E2E fixes `856d041` (On Hold follow-up date) and `06b41a0` (pop-up wording) (2026-10-17). Run finished 2026-10-18, 32 of 32 Pass. Commit hashes filled in after the fact.
**Where:** Dev.

Every Opportunity in the steps is named with its hospital in brackets, so
the right row is easy to pick in a filtered pipeline (Basheer,
2026-10-17).

## Checked against live data

Checked read-only on Dev, 2026-10-14, through the admin connection: the
check needed everyone's next actions, and the "own next action" rule is
about who a next action is assigned to, not who can see it. Re-checked
2026-10-17 just before the run (app connection as Haroon, General
Manager, read-only): every record below still as described, no
"zz NA E2E" Opportunity on Dev yet, and each of the four existing names
on one hospital only. The hide-check in section C is re-run at the step.

- **Who sees:** testers are Basheer K (SBU Manager, Imaging, reports to
  Haroon), Vivek (Sales Staff, Critical Care, reports to Arun Adarsh) and
  Haroon Sidheeq (General Manager). Vivek sees "usg m/c" (aster medicity)
  only because he is assigned one of its next actions.
- **Who can approve:** n/a — nothing in this feature is approved.
- **Who can save:** owner of every existing Opportunity used below is
  Basheer K; next actions are assigned as listed.
- **Existing values:** records used:
  - "usg m/c" (aster medicity) — Lead, Active, owner Basheer K. Open next
    actions: Basheer K's "Call Mr Ajman to understand the progress on
    budget discussion" (due 7 Aug) and Vivek's "Please meet Dr Ajmal
    tomorrow." (due 31 Jul).
  - "new lead" (aster medicity) — Lead, Active, owner Basheer K. Two open
    next actions, both Basheer K's: "Meet Dr Ajmal in person" (31 Jul) and
    "Meeting next week" (7 Aug).
  - "Ultrasound m/c" (KIMS Hospital Trivandrum) — Lead, Active, owner
    Basheer K, no open next action.
  - "Imaging department refresh" (Baby Memorial Hospital) — Lead, Active,
    owner Basheer K, no open next action, no re-activation date.
  - Hospital-level next actions, both Basheer K's: KIMS Hospital
    Trivandrum "Meet him again 1 wk from now" (29 Jul); Aster MIMS Calicut
    "Call tomorrow again" (30 Jul) — this one is linked to the project
    "Another new project" (found 2026-10-17). Aster MIMS Calicut also has
    "Call Dr tomorrow" (31 Jul), not used here.
  - Project "Another new project" — Aster MIMS Calicut (owner Basheer K,
    Draft).
  - Marketing Lead for E4: "New usg m/c needed." — Imaging, source
    Conference, assigned to Fazal, created 3 Sep, no hospital set.
    Basheer K can convert it (an SBU Manager can review any lead in his
    own SBU, `MarketingLeadService._get_reviewable_lead`).

Button labels, messages and the order of checks are taken from the code,
not the design doc. Sections D and E were checked against the built code
on 2026-10-16 (steps 2–3, decisions D12–D19); A–C and G on 2026-10-17
(`LogActivityModal.tsx`, `CloseReminderModal.tsx`, `ReminderRow.tsx`,
`OpportunityDetailScreen.tsx`, `scripts/uat_data_quality_check.py`).

## Figures and sources

- Users, roles, SBUs and managers — Dev query, 2026-10-14; re-checked
  2026-10-17
- Open next actions on Opportunities (13) and at hospital level (11), and
  every record named above — same Dev query, 2026-10-14; the records used
  here re-checked 2026-10-17
- Project "Another new project" — Win Probability E2E test plan (Dev
  check, 2026-10-13); re-checked 2026-10-17
- Marketing Lead for E4 — Dev query, 2026-10-17
- Section H records — two read-only Dev queries, 2026-10-20 (admin
  connection): only one Opportunity on Dev had one person with two or
  more open next actions ("New USG msg" (Aster MIMS Calicut), a test
  user's), so H0 sets them up; open next actions on Basheer K's
  Opportunities listed the two used in H
- Section H next-action texts and due dates — made up for this run
- Creating at Payment Pending is allowed; only Won is refused at create;
  Repeat Order skips the demo-date and closure-date gates —
  `OpportunityService.create_opportunity` and Business-Rules BR-OP-13,
  read 2026-10-14
- Step D8's fast-track approach — Basheer, 2026-10-14
- Opportunity names
  "zz NA E2E – …" — made-up names for this run
- Hospitals for "zz NA E2E – top bar" and "– fast track Won" (Baby
  Memorial Hospital) and "– converted lead" (KIMS Hospital Trivandrum) —
  made up for this run, 2026-10-17

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Left on Dev permanently:** every closed next action and its closing
activity, every Note and follow-up next action created below; "new lead"
(aster medicity) marked Lost; "Ultrasound m/c" (KIMS Hospital Trivandrum)
and "usg m/c" (aster medicity) moved on a stage; "Imaging department
refresh" (Baby Memorial Hospital) On Hold; "zz NA E2E – top bar" (Baby
Memorial Hospital) marked Lost (E5); six new Opportunities —
"zz NA E2E – from hospital visit" (KIMS Hospital Trivandrum, B4),
"zz NA E2E – fast track Won" (Baby Memorial Hospital, D8, Won),
"zz NA E2E – top bar" (Baby Memorial Hospital), "– Customer 360" (aster
medicity), "– project" (Aster MIMS Calicut) (E3), "– converted lead"
(KIMS Hospital Trivandrum, E4). Section H adds: Haroon's four Calls
(H0), the three closing Calls (H2–H4), the "zz E2E H …" next actions,
two follow-ups, and Haroon's own "zz E2E H Haroon's own" left open on
"zz NA E2E – Customer 360" (aster medicity). Activities can't be deleted.

## Pre-flight

- P1. [Simple] Dev backend restarted after the last backend change. —
  Pass (2026-10-17: Basheer restarted backend and frontend)
- P2. [Simple] Screens running from `main` with all five steps; Win
  Probability plan step 2 (one create form) and Duplicate Hospitals Part A
  already on `main`. — Pass (2026-10-17: `main` level with origin; no
  code change since `4bec886`/`f93397f`, after which backend 1314 passed,
  ruff, tsc and lint clean)
- P3. [Simple] Signed in as Basheer K in one window; a second (private)
  window for Vivek and Haroon in turn. — Pass (2026-10-17: Basheer K in
  Claude's tab; Haroon then Vivek in Basheer's private window)
- P4. [Simple] Re-check above done; Marketing Lead for E4 picked. — Pass
  (2026-10-17: records as described; lead "New usg m/c needed.")

## A — Close it, don't go round it (BR-ACT-11)

1. [Simple] As Basheer K, Opportunity page
   "usg m/c" (aster medicity) → Log Activity. **Expected:** a yellow
   warning "You have an open next action on this Opportunity. Close it,
   saying what happened, instead of logging a new activity.", listing
   Basheer K's "Call Mr Ajman… — due 7 Aug 2026" and not Vivek's; no
   Date & Time, Notes or "Next Action *" tab; the button reads "Close
   next action", not "Log" — no way to log a fresh Call or Visit. —
   Pass (2026-10-17: warning listed only "Call Mr Ajman to understand
   the progress on budget discussion — due 7 Aug 2026"; only a Details
   tab; button "Close next action"; the person box showed "Basheer K")
2. [Complex: same check from two more screens] Same as A1 from Customer
   360 (aster medicity → Log Activity, pick "usg m/c" in "Opportunity
   (optional)") and from the top bar Log Activity (pick aster medicity in
   "Select account", then "usg m/c" in "Opportunity (optional)").
   **Expected:** the same warning and "Close next action" button both
   times. — Pass (2026-10-17: Customer 360 Activity tab "+ Log" and top
   bar "+ Log" from the Pipeline screen both showed the warning listing
   only "Call Mr Ajman…" and "Close next action" once "usg m/c" was
   picked; before that, "Log" and a "Next Action *" tab. The top-bar
   "+ Log" pressed on the Opportunity page itself comes already linked
   to that Opportunity, same as A1. Cancelled each time.)
3. [Complex: save, then read back] Press "Close next action".
   **Expected:** the "Close Next Action" form opens, showing "Call Mr
   Ajman…" at the top. **Expected (pre-fill, D10):** on its "Follow-up *"
   tab, "Follow-up next action *" already holds "Call Mr Ajman to
   understand the progress on budget discussion" and can be edited.
   Change it to "Call Mr Ajman for the budget decision", set "Due Date *"
   one week out, fill "What was done? *" on the Details tab, and press
   "Complete". Basheer clicks, Claude watches. **Expected:** saved, with
   the edited text (not the pre-filled one) on the follow-up; the
   Opportunity's Activity tab shows the closing activity; Next Actions
   tab shows the old one under Completed and the follow-up under
   Pending. — Pass (2026-10-17, Basheer clicked: Activity tab shows the
   Call, 17 Oct 2026 07:27, "Spoke to Mr Ajman; budget still under
   discussion"; Next Actions Completed shows "Call Mr Ajman to
   understand…" closed via that Call; Pending shows "Call Mr Ajman for
   the budget decision", due 24 Oct 2026, owner Basheer K; Vivek's
   "Please meet Dr Ajmal tomorrow." still pending. Pre-fill confirmed by
   Basheer.)
4. [Simple] Log Activity on "usg m/c"
   (aster medicity) again. **Expected:** the same warning, now listing
   the follow-up from A3 — a rep with any open next action of their own
   stays held. Cancel. — Pass (2026-10-17, Basheer ran it: "You have an
   open next action on this Opportunity…" listing "Call Mr Ajman for the
   budget decision — due 24 Oct 2026")
5. [Complex: cross-user] As Haroon (no next action of his own on
   "usg m/c" (aster medicity)), Log Activity on it. **Expected:** no
   warning; the button reads "Log" and there is a "Next Action *" tab.
   Save a Call with a next action ("Assign Next Action To" left on "Me
   (default)"). Basheer K's and Vivek's next actions are not offered and
   stay open. — Pass (2026-10-17, Basheer clicked as Haroon; read back as
   Basheer K: Activity tab shows Haroon Sidheeq's Call, 17 Oct 2026
   08:01, "Call to Dr Ajmal for E2E testing"; Next Actions Pending shows
   his "Call him again tomorrow", due 18 Oct 2026, owner Haroon Sidheeq;
   Basheer K's "Call Mr Ajman for the budget decision" and Vivek's
   "Please meet Dr Ajmal tomorrow." still pending)
6. [Simple] As Haroon (D2), Log Activity on "usg m/c" (aster
   medicity), and set the person box under "Type *" (shows the signed-in
   person's name, as in A1) to Basheer K. **Expected:** the warning reads "Basheer K
   has an open next action on this Opportunity. Close it, saying what
   happened, instead of logging a new activity.", listing his open next
   action — the person the activity is for counts, not the one typing.
   Cancel without saving. — Pass (2026-10-17, Basheer ran it as Haroon)
7. [Simple] As Vivek, Log Activity on "usg m/c"
   (aster medicity). **Expected:** the "You have an open next action…"
   warning, listing only "Please meet Dr Ajmal tomorrow."; Basheer K's
   isn't listed. Cancel. — Pass (2026-10-17, Basheer ran it as Vivek)
8. [Simple] As Basheer K, top bar Log Activity, "Select account" aster
   medicity, "Opportunity (optional)" left on "None — hospital-level",
   type Visit. **Expected:** no warning, button "Log"; it saves with a
   next action (hospital-level work is unchanged). — Pass (2026-10-17,
   Basheer ran it)
9. [Simple] As Haroon, Log Activity on "usg m/c" (aster medicity), type
   Manager Note, "This Note Is For *" set to Basheer K, press "Log".
   **Expected:** allowed, no warning and no "Next Action *" tab (types
   that never need a next action are unchanged). — Pass (2026-10-17,
   Basheer ran it as Haroon)

## B — Closing always sets the next one (BR-ACT-05 change)

1. [Simple] As Basheer K, Next Actions screen → "Mark to complete" on
   "Meet Dr Ajmal in person" ("new lead" (aster medicity)). Fill "What
   was done? *"; on the "Follow-up *" tab clear the pre-filled
   "Follow-up next action *" box; press "Complete". **Expected:** refused
   with "Follow-up next action is required". — Pass (2026-10-17,
   Basheer ran it as Basheer K)
2. [Simple] Same, now with a follow-up. **Expected (pre-fill, D10):**
   when the close form opens, "Follow-up next action *" already holds
   "Meet Dr Ajmal in person"; keep the text as it is, set "Due Date *"
   and press "Complete". **Expected:** saved; the follow-up "Meet Dr
   Ajmal in person" appears on the Next Actions list with the new due
   date. — Pass (2026-10-17, Basheer ran it as Basheer K; pre-fill,
   save and new row checked by him)
3. [Simple] Next Actions screen → "Mark to complete" on KIMS Hospital
   Trivandrum "Meet him again 1 wk from now"; fill "What was done? *",
   clear the follow-up box and leave "This visit produced a new
   Opportunity" unticked; press "Complete". **Expected:** refused, as
   B1. — Pass (2026-10-17, Basheer ran it as Basheer K)
4. [Complex: cross-form flow, D3] Same next action, on the "Follow-up *"
   tab tick "This visit produced a new Opportunity". **Expected:** the
   follow-up boxes give way to "Press Complete to add the new
   Opportunity. This next action closes once it's saved, with no
   follow-up." Press "Complete". **Expected:** the New Opportunity form
   opens with KIMS Hospital Trivandrum filled in and fixed. Create
   "zz NA E2E – from hospital visit" (KIMS Hospital Trivandrum).
   **Expected:** the First activity pop-up starts with the visit just
   typed in the close form (D17); add its next action and Create. The
   Opportunity is saved, then the hospital next action closes with no
   follow-up asked. The visit shows once on the hospital's Activity
   timeline, as the new Opportunity's activity — no second, hospital-only
   copy (D20). — Pass (2026-10-17, Claude drove as Basheer K, Basheer
   pressed the three saves: hand-over message exact; KIMS Hospital
   Trivandrum fixed on the New Opportunity form; First activity opened
   with Call, now, "E2E B4 hospital visit - new Opportunity found" (Call
   is the close form's default, unchanged); follow-up "zz E2E B4
   follow-up call" due 18 Oct; after a reload "Meet him again 1 wk from
   now" gone from Pending; hospital Activity tab shows the visit once and
   the Opportunity's Activity tab shows the same entry. Stage Lead fills
   Win Probability with 5.00, so typed digits append — select first)
5. [Complex: cancel path, D3] Close Aster MIMS Calicut "Call tomorrow
   again" (linked to project "Another new project"): "Mark to complete",
   fill "What was done? *", tick the box, press "Complete", then cancel
   the New Opportunity form. **Expected:** back on the close form's
   "Follow-up *" tab, the tick removed, a blue message "No new
   Opportunity was saved, so add a follow-up next action to close this
   one."; press "Complete" with a follow-up. No Opportunity was
   created. — Pass (2026-10-17, Claude drove as Basheer K, Basheer
   pressed Complete, Cancel, Complete: back on "Follow-up *", tick
   removed, blue message word for word, follow-up pre-filled "Call
   tomorrow again"; after a reload the 31 Jul row gone and a new one
   due 18 Oct; hospital Activity tab shows "E2E B5 call - cancel path"
   once; Aster MIMS Calicut Opportunities 15 before and after)

## C — Closing from the Opportunity page (hide-check)

1. [Simple] (hide-check) As Basheer K, "usg m/c" (aster medicity)
   → Next Actions tab (Pending). **Expected:** "Mark to complete" on his
   own open row; none on Vivek's "Please meet Dr Ajmal tomorrow.". —
   Pass (2026-10-17, read in Claude's tab as Basheer K after A5: "Mark
   to complete" only on "Call Mr Ajman for the budget decision"; none on
   Vivek's row or Haroon's "Call him again tomorrow")
2. [Simple] (hide-check) As Vivek, same tab. **Expected:**
   "Mark to complete" on his own row only; none on Basheer K's. — Pass
   (2026-10-17, Basheer ran it as Vivek, ahead of A8–A9 to save a
   sign-in swap)
3. [Complex: save, then read back] As Vivek, press "Mark to complete" on
   his row in the tab. **Expected (pre-fill, D10):** "Follow-up next
   action *" already holds "Please meet Dr Ajmal tomorrow.". Clear it,
   type "Visit Dr Ajmal with the brochure", fill "What was done? *" and
   "Due Date *", and press "Complete".
   **Expected:** saved with the typed text; the tab and
   Vivek's Next Actions screen both show it done. — Pass (2026-10-17,
   Basheer clicked as Vivek and confirmed the pre-fill and Vivek's Next
   Actions screen; read back as Basheer K after a full page reload:
   Pending no longer has "Please meet Dr Ajmal tomorrow." and shows
   "Visit Dr Ajmal with the brochure", due 21 Oct 2026, owner Vivek)

## D — A note on every stage or status change (BR-OP-22, On Hold)

1. [Complex: form changes shape, D14] As Basheer K, "Ultrasound m/c"
   (KIMS Hospital Trivandrum; no open next action of his) → Edit → stage
   Lead → Qualified → Save. **Expected:** the "Why this change?" pop-up
   opens with "You have no open next action on this Opportunity, so this
   is saved as a Note.", a "Why the change? *" box and a required
   follow-up next action. Press Cancel. **Expected:** back on the Edit
   form; nothing saved (reload: still Lead). Save again, fill the Note and
   a next action, Save. **Expected:** stage Qualified; Activity tab shows
   the Note; Next Actions tab shows its next action. — Pass (2026-10-17,
   Claude drove as Basheer K, Basheer pressed Save, Cancel, Save, Save:
   pop-up wording exact, type fixed as Note; after Cancel and a reload
   still Lead with no activity; after the save Qualified, Activity tab
   shows Note "E2E D1 - budget confirmed, moving to Qualified" once, Next
   Actions tab shows "zz E2E D1 follow-up call" due 18 Oct. Wording note
   for the small-fixes batch: the follow-up hint "every closed next
   action sets the next one" reads oddly when nothing is being closed)
2. [Complex: close-as-note, D15 single] "usg m/c" (aster medicity) → Edit
   → stage Lead → Qualified → Save. **Expected:** the pop-up closes
   Basheer K's one open next action (the A3 follow-up, "Call Mr Ajman for
   the budget decision"), already picked — no "Next action to close"
   list; a follow-up is required and its box already holds that text —
   pre-fill, D10. Save. **Expected:** stage changed, next action closed,
   follow-up open — one save. — Pass (2026-10-17, Claude drove as
   Basheer K, Basheer pressed Save twice: pop-up showed "Call Mr Ajman
   for the budget decision" already picked, no list; type Call (default);
   follow-up box pre-filled with the same text. After a reload: stage
   Qualified (Win Probability moved 5 → 20 on its own when the stage was
   picked); the 24 Oct next action is in Completed, "Closed via call on
   17 Oct 2026, 11:29 am" with the reason; a new one with the same text
   is pending, due 18 Oct; the Activity tab shows the Call once. The saved
   reason reads "…moving to Qualifid" — Claude's typing dropped a letter,
   permanent on Dev)
3. [Simple] "usg m/c" (aster medicity) → Edit → change only the name,
   save. **Expected:** saved with no note asked (no stage or status
   change). Change the name back. — Pass (2026-10-17, Basheer ran it as
   Basheer K)
4. [Complex: cross-user, manager with none, D13] As Haroon (no next
   action of his own on "Ultrasound m/c" (KIMS Hospital Trivandrum)),
   open it → Edit → stage Qualified → Demo, Demo Start Date today (the
   Demo stage gate requires it) → Save. **Expected:** the
   pop-up shows the "saved as a Note" line; he writes a Note with a next
   action and saves; Basheer K's next action from D1 is not offered and
   stays open. — Pass (2026-10-17, Basheer clicked as Haroon; first try
   blocked by the Demo stage gate ("Demo Start Date is required…", not
   in the plan then, now added), nothing saved; with the date: pop-up
   "saved as a Note" line, no list to close, D1's not mentioned (Basheer).
   Read back as Basheer K: stage Demo; Activity tab Haroon Sidheeq's Note
   "E2E D4 Haroon - demo booked" once; Pending "zz E2E D4 Haroon
   follow-up" (Haroon, 18 Oct) and "zz E2E D1 follow-up call" still open)
4a. [Complex: cross-user, manager with his own, D13] As Haroon, "usg m/c"
   (aster medicity; he has the open next action he set in A5, assigned to
   "Me (default)") → Edit → stage Qualified → Demo, Demo Start Date
   today (the Demo stage gate requires it) → Save. **Expected:**
   the pop-up closes Haroon's own A5 next action, not a Note; Basheer K's
   and Vivek's are not offered and stay open. Save with a follow-up. —
   Pass (2026-10-17, Basheer clicked as Haroon, pop-up checked by him.
   Read back as Basheer K: stage Demo; Completed shows "Call him again
   tomorrow" (Haroon, due 18 Oct) "Closed via call on 17 Oct 2026, 03:42
   pm" with "E2E D4a Haroon - demo fixed"; Activity tab shows that Call
   once; Pending: "zz E2E D4a Haroon follow-up" (Haroon, 18 Oct), Basheer
   K's "Call Mr Ajman for the budget decision" and Vivek's "Visit Dr
   Ajmal with the brochure" still open. Basheer's wording finding: the
   pop-up shows the closed next action's text with no label saying what
   it is, and the follow-up hint "every closed next action sets the next
   one" doesn't fit a stage change — fix proposed for the small-fixes
   batch)
5. [Complex: date rule] As Basheer K, "Imaging department refresh" (Baby
   Memorial Hospital) → Edit → status On Hold, a hold reason,
   re-activation date one month out. **Expected:** the note's next-action
   due date is filled with the re-activation date; moving it one day
   later is refused; one day earlier saves. Read back: On Hold, next
   action due on that date. — Pass after a fix (2026-10-17, Claude
   drove as Basheer K, Basheer pressed every Save and Cancel). First try
   failed: the follow-up due date started at tomorrow (18 Oct), not the
   re-activation date; cancelled, nothing saved. Fixed in
   `CloseReminderModal.tsx` (On Hold starts the due date on the
   re-activation date), not yet committed. Retry, Hold Reason Budget
   Pending, re-activation 17 Nov 2026: due date filled 17 Nov 2026;
   hint "Required — due on or before the re-activation date (17 Nov
   2026)."; 18 Nov refused with "For an On Hold Opportunity, the next
   action must be due on or before the re-activation date.", stayed on
   Follow-up; 16 Nov saved. Read back after a reload: On Hold; Activity
   tab shows Note "E2E D5 - budget on hold until next month" once;
   Pending "zz E2E D5 check budget before reactivation" due 16 Nov
   2026, owner Basheer K.
6. [Complex: Lost exception, D12, D15 pick] As Basheer K, "new lead"
   (aster medicity) → Edit → status Lost with a loss reason → Save.
   **Expected:** the pop-up shows "Next action to close *" listing his two
   open ones, soonest due first — "Meeting next week" (7 Aug) above the B2
   follow-up "Meet Dr Ajmal in person" — with none picked. Pick "Meeting
   next week", leave the follow-up empty (labels have no "*"), Save.
   **Expected:** saved as Lost; no follow-up asked. — Pass (2026-10-17,
   Claude drove as Basheer K, Basheer pressed Save, Save; loss reason
   Budget Cancelled). List showed "Meeting next week — due 7 Aug 2026"
   above "Meet Dr Ajmal in person — due 24 Oct 2026", none picked;
   Follow-up tab and fields had no "*", hint "Optional — this
   Opportunity is Lost. Leave the follow-up box empty to save with no
   follow-up."; saved with the box empty, reason "E2E D6 - budget
   cancelled, marking Lost" (Call). Read back after a reload: Lost;
   Pending shows only "Meet Dr Ajmal in person" (24 Oct), left for
   step 7.
7. [Simple] Next Actions screen → close the follow-up left open on
   "new lead" (aster medicity) (from B2), no follow-up. **Expected:**
   saved — the Opportunity is Lost, so none is needed. — Pass
   (2026-10-18, Basheer ran it as Basheer K; Claude read back). Pop-up
   "Close Next Action"; Follow-up tab had no "*", box empty, hint
   "Optional — this Opportunity is Lost. Leave the follow-up box empty to
   close with no follow-up."; Complete closed it. Read back in Claude's
   tab: Activity shows Call "E2E D7 - closing, Opportunity is Lost." (18
   Oct 2026, Basheer K) once; Next Actions tab: no pending next actions.
8. [Complex: multi-step, D4] As Basheer K, top bar "+ Lead": name
   "zz NA E2E – fast track Won", hospital Baby Memorial Hospital, lead
   source Repeat Order, stage Payment Pending, with order value, a
   product, PO number and PO date, plus the first activity and next
   action. **Expected:** created at Payment Pending, Active. Then Edit →
   status Won, tick full payment, leave the payment note empty, Save.
   **Expected:** the "Why this change?" pop-up opens (the Won save needs
   it, D4), closing Basheer K's open next action from creation, already
   picked. Fill "Why the change?", leave the follow-up empty, Save.
   **Expected:** saved as Won; no follow-up next action asked; the payment
   note stays optional. — Pass (2026-10-18, Claude drove as Basheer K,
   Basheer pressed Create, Create, Save, Save). Made-up values: product
   SonoScape E1 Portable USG Machine 1 × ₹5 L (value ₹5.00 L auto), PO
   PO-E2E-D8 dated 18 Oct 2026, win probability 98 % (form's own fill);
   Fast-Track not ticked (Repeat Order hides the demo dates). First
   activity Call "E2E D8 - repeat order PO received, payment pending",
   next action "zz E2E D8 collect full payment" due 19 Oct. Read back:
   Payment Pending, Active, ₹5.0L. Edit → Won showed "I confirm full
   payment has been received *" and "Payment Note" with no "*"; ticked,
   note empty, Save opened "Why this change?" with "Closing your next
   action (due 19 Oct): zz E2E D8 collect full payment"; Follow-up tab
   no "*", box empty, hint "Optional — this Opportunity is Won. Leave the
   follow-up box empty to save with no follow-up."; reason "E2E D8 - full
   payment received, marking Won" (Call). Read back after a reload: Won,
   payment confirmed by Basheer K on 18 Oct 2026; Activity (2) shows both
   Calls once; Next Actions: no pending next actions. Note: "+ Lead"
   opened from an Opportunity page offers only that page's hospital;
   reopened from Pipeline (not a bug for this plan).

## E — A new Opportunity starts with an activity (BR-OP-21)

1. [Simple] Top bar "+ Lead": fill the Opportunity (hospital Baby
   Memorial Hospital), Create. **Expected:** the "First activity" pop-up
   opens (D19) with "Every new Opportunity starts with the conversation
   that led to it, and a next action. Create saves all three together."
   Press Cancel. **Expected:** back on the New Opportunity form, nothing
   created. — Pass (2026-10-18, Basheer ran it as Basheer K, name "zz NA
   E2E – E1 cancel" (made up), stage Lead). Pop-up showed the line;
   Cancel returned to the filled form. Claude searched the Pipeline for
   "E1 cancel" in its own tab: no Opportunity found.
2. [Simple] Create again; in the pop-up open "Type *". **Expected:** only
   Visit, Call, Email, Meeting and Note (D5); "Assign To" reads "<owner>
   — Opportunity owner (default)" (D16). Cancel. — Pass (2026-10-18,
   Basheer ran it as Basheer K; Claude re-filled the E1 form after its
   own read-back reload had closed it — same tab, nothing saved). Type
   list showed exactly Visit, Call, Email, Meeting, Note; Assign To
   "Basheer K — Opportunity owner (default)"; both cancelled. Pipeline
   search for "E1 cancel" in Claude's tab: no Opportunity found.
3. [Complex: save, then read back, three ways in] Create one Opportunity
   from each way in, each with its first activity and next action:
   "zz NA E2E – top bar" (Baby Memorial Hospital, from the top bar);
   "zz NA E2E – Customer 360" (aster medicity, from its Customer 360);
   "zz NA E2E – project" (Aster MIMS Calicut, from "Another new
   project"). **Expected:** each Opportunity's Activity tab and Next
   Actions tab show them. — Pass (2026-10-18, as Basheer K; Claude
   filled each form and pop-up, Basheer pressed both Creates). All
   three: stage Lead, owner Basheer K, win 5 % (form's own fill), first
   activity a Call "E2E E3 - <way in> first call", next action "zz E2E
   E3 <way in> follow-up" due 19 Oct 2026 (text made up). Customer 360
   form fixed the hospital; project form fixed hospital and project and
   pre-filled the project's name (replaced). Read back in Claude's tab:
   each Opportunity's Activity (1) shows the Call by Basheer K and its
   Next Actions tab one pending follow-up, owner Basheer K.
4. [Complex: cross-screen] Marketing Lead "New usg m/c needed." (picked at
   P4) → Convert, hospital KIMS Hospital Trivandrum. **Expected:** "what
   happened" is pre-filled from the lead's interest note and can be
   edited; create "zz NA E2E – converted lead" (KIMS Hospital
   Trivandrum); lead shows as converted; first activity and next action
   read back. — Pass (2026-10-18, as Basheer K; Claude filled the
   form and pop-up, Basheer pressed both Creates). Convert on lead
   #284D6F (Conference, Cochin, assigned to Fazal) opened the form with
   the lead's box and Lead Source CONFERENCE; stage Lead, owner Basheer
   K, win 5 %. "What happened?" opened as "New usg m/c needed." and took
   an added " E2E E4 - called after conversion" (made up); next action
   "zz E2E E4 converted lead follow-up" due 19 Oct 2026. Read back in
   Claude's tab: lead shows "Converted 18 Oct, 08:00 pm"; Activity (1)
   the Call with the edited text by Basheer K; Next Actions one pending,
   owner Basheer K.
5. [Complex: cross-user, Won/Lost with a Note, D12, D13] As Haroon, "zz
   NA E2E – top bar" (Baby Memorial Hospital; from E3; its next action is
   Basheer K's, D16) → Edit → status Lost with a loss reason → Save.
   **Expected:** the pop-up shows the "saved as a Note" line; write the
   Note, leave the next action empty (no "*"), Save. **Expected:** saved
   as Lost with the Note; Basheer K's next action is untouched. — Pass
   (2026-10-18, Basheer ran it as Haroon in his private window, loss
   reason Budget Cancelled, Note "E2E E5 - Haroon marks Lost" (made
   up)). Basheer saw the "saved as a Note" line with Type greyed out as
   Note, Follow-up without "*", left empty, Save worked. Read back in
   Claude's tab (Basheer K, after a reload): status Lost, loss reason
   Budget Cancelled; Activity (2) has the Note by Haroon Sidheeq
   (18 Oct 2026, 8:03 pm); Basheer K's "zz E2E E3 top bar follow-up"
   (due 19 Oct 2026) still pending.

## F — (removed 2026-10-16)

Section F tested BR-ACC-05 (a new hospital starts with a Note and a next
action). Plan step 4 was dropped and the rule withdrawn (plan D21), so
there is nothing to test; the letter is kept so later references still
match.

## G — Data-quality check on Dev

1. [Complex: script output] Run `scripts/uat_data_quality_check.py --env
   dev --no-log`. **Expected:** section "7a-ii. Active or On Hold
   Opportunities with no open next action" also lists On Hold ones;
   "Imaging department refresh" (Baby Memorial Hospital) is not listed
   there (it got one in step D5). — Pass (2026-10-18, Claude ran it,
   exit 0). 7a-ii listed 41, including On Hold "New ICU Monitor deal"
   (Aster DM, Nishad K V); "Imaging department refresh" (Baby Memorial
   Hospital) not listed; none of today's "zz NA E2E" Opportunities
   listed either.

   (A third check — a hospital whose only use is an open next action is
   not listed in "3. Accounts with zero Opportunities and zero Activity" —
   was dropped 2026-10-17, Basheer: a next action always hangs on an
   activity, and section 3 lists only hospitals with no activity, so it
   could never fail.)

## H — Closing several at once (BR-ACT-05, plan D22)

Added 2026-10-20 (Basheer's yes). Code: `CloseReminderModal.tsx`,
`LogActivityModal.tsx`, `ReminderRow.tsx`; `ReminderService._others_to_close`.
Before H0, P1 again: Dev backend restarted after the D22 change.

Records (Dev query, 2026-10-20):
- "zz NA E2E – Customer 360" (aster medicity) — Lead, Active, owner
  Basheer K; its only open next action is Basheer K's "zz E2E E3 Customer
  360 follow-up" (due 19 Oct). Haroon has none of his own there.
- "zz NA E2E – top bar" (Baby Memorial Hospital) — Lead, **Lost**; its
  only open next action is Basheer K's "zz E2E E3 top bar follow-up"
  (due 19 Oct).

Not tested on Dev: a manager closing several of a rep's at once — the
backend test `test_manager_closes_several_of_a_reps_next_actions` covers
it, and it would add more permanent records.

0. [Complex: setup, four saves, cross-user] Basheer clicks as Haroon,
   Claude watches. On "zz NA E2E – Customer 360" (aster medicity), Log
   Activity three times, type Call: next action "zz E2E H send brochure"
   due 21 Oct, "Assign Next Action To" Basheer K; "zz E2E H confirm demo
   date" due 22 Oct, Basheer K; then "zz E2E H Haroon's own", left on "Me
   (default)" — last, as it holds Haroon on this Opportunity. On "zz NA
   E2E – top bar" (Baby Memorial Hospital), log a Call with next action
   "zz E2E H chase payment", assigned to Basheer K. **Expected:** all
   four save (until the last, Haroon has no open next action of his own
   on the Opportunity, so nothing holds him). — Pass (2026-10-21,
   Basheer clicked as Haroon, Claude read back each save on the
   Opportunity's Next Actions tab: brochure 21 Oct and demo date 22 Oct
   owner Basheer K, Haroon's own 23 Oct owner Haroon; chase payment
   22 Oct owner Basheer K on the Lost one. Pre-check by read-only Dev
   query the same morning: records as listed above.)
1. [Simple] As Basheer K, Opportunity page "zz NA E2E – Customer 360"
   (aster medicity) → Log Activity. **Expected:** warning "You have open
   next actions on this Opportunity. Close them, saying what happened,
   instead of logging a new activity.", listing his three ("zz E2E E3
   Customer 360 follow-up", "zz E2E H send brochure", "zz E2E H confirm
   demo date"), no Close button on any row, not Haroon's; button "Close
   next action". — Pass (2026-10-21, Basheer ran it as Basheer K)
2. [Complex: save, then read back] Press "Close next action".
   **Expected:** the "Close Next Action" form, with "Next actions to
   close *" listing three tick boxes, none ticked, soonest due first, not
   Haroon's. Press "Complete" with none ticked. **Expected:** "Tick the
   next actions to close". Tick "zz E2E H send brochure" and "zz E2E H
   confirm demo date". **Expected:** the follow-up box holds both texts,
   one per line, the 21 Oct one first. Fill "What was done? *" and "Due
   Date *", press "Complete"; Basheer clicks. **Expected (read back):**
   Next Actions tab — both under Completed, closed by the same Call; one
   new follow-up under Pending, its text on two lines; "zz E2E E3
   Customer 360 follow-up" and Haroon's still pending. Activity tab — one
   closing Call. — Pass (2026-10-21, second attempt; Claude filled the
   form, Basheer pressed Complete. Read back: brochure and demo date
   Completed, both "Closed via Call on 21 Oct 2026, 09:05 AM" with the
   same text; new follow-up Pending on two lines, due 22 Oct, owner
   Basheer K; E3 follow-up and Haroon's still pending; Activity count
   4 → 5, newest Call by Basheer K. First attempt saved nothing — see
   Progress-Archive-2026-10.)
3. [Complex: visual check, then save] Next Actions screen → "Mark to
   complete" on "zz E2E E3 Customer 360 follow-up" ("zz NA E2E – Customer
   360" (aster medicity)). **Expected:** "Also close:" lists the H2
   follow-up (both lines kept), not Haroon's. Tick it, type "zz E2E H
   final follow-up" in the follow-up box, untick, tick again.
   **Expected:** the typed text stays. Press "Complete"; Basheer clicks.
   **Expected:** both closed, one follow-up added; Log Activity on the
   Opportunity now shows the one-item warning ("You have an open next
   action on this Opportunity…"). — Pass (2026-10-21; Claude filled the
   form, Basheer pressed Complete. Ticking first pre-filled all three
   texts; Claude replaced them with the typed text, which stayed through
   untick/re-tick. Read back: E3 follow-up and the two-line H2 follow-up
   both Completed, "Closed via Call on 21 Oct 2026, 09:12 AM", "zz E2E
   H3 - closed both"; "zz E2E H final follow-up" Pending, due 22 Oct,
   owner Basheer K; Log Activity warning lists only that one.)
4. [Complex: Lost] Next Actions screen → "Mark to complete" on "zz E2E
   E3 top bar follow-up" ("zz NA E2E – top bar" (Baby Memorial
   Hospital), Lost). **Expected:** the "Follow-up next action" box is
   empty, no `*`, one line; "Also close:" lists "zz E2E H chase payment";
   ticking it leaves the box empty. Press "Complete" with the box empty;
   Basheer clicks. **Expected:** both closed, no follow-up added. — Pass
   (2026-10-21; Claude filled "What was done?", Basheer pressed Complete.
   Follow-up tab had no `*` and the note "Optional — this Opportunity is
   Lost…"; box stayed empty after ticking. Read back: "zz E2E E3 top bar
   follow-up" and "zz E2E H chase payment" both Completed, "Closed via
   Call on 21 Oct 2026, 09:19 AM", "zz E2E H4 - closed both"; nothing
   pending left on "zz NA E2E – top bar".)
