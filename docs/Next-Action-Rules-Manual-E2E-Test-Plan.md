<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Next-Action Rules — Manual E2E Test Plan

**Covers:** `docs/Next-Action-Rules-Implementation-Plan.md`, steps 1–3 and 5 (step 4 dropped)
(one combined run after step 5, per the plan's step 5). The pre-fill (plan
D10, added 2026-10-14) is checked inside the four close forms' existing
steps — A3, B2, C3 and D2 — so it needs no extra saves on Dev.
**Built:** step 1 `3d38e75` (2026-10-15, checkpoint); step 2 `bd92e4a` + `4fc8531` (2026-10-16, checkpoints); step 3 `c4e1ca3` (2026-10-16); step 4 dropped (plan D21); step 5: script `f93397f`, pre-E2E review fixes `4bec886` (2026-10-16). Commit hashes filled in after the fact.
**Where:** Dev.

## Checked against live data

Checked read-only on Dev, 2026-10-14, through the admin connection: the
check needed everyone's next actions, and the "own next action" rule is
about who a next action is assigned to, not who can see it. Re-checked
just before the run (these records may change meanwhile), and the
hide-check in section C re-run then too.

- **Who sees:** testers are Basheer K (SBU Manager, Imaging, reports to
  Haroon), Vivek (Sales Staff, Critical Care, reports to Arun Adarsh) and
  Haroon Sidheeq (General Manager). Vivek sees "usg m/c" only because he
  is assigned one of its next actions.
- **Who can approve:** n/a — nothing in this feature is approved.
- **Who can save:** owner of every existing Opportunity used below is
  Basheer K; next actions are assigned as listed.
- **Existing values:** records used:
  - "usg m/c" — aster medicity, Lead, Active, owner Basheer K. Open next
    actions: Basheer K's "Call Mr Ajman to understand the progress on
    budget discussion" (due 7 Aug) and Vivek's "Please meet Dr Ajmal
    tomorrow." (due 31 Jul).
  - "new lead" — aster medicity, Lead, Active, owner Basheer K. Two open
    next actions, both Basheer K's: "Meet Dr Ajmal in person" (31 Jul) and
    "Meeting next week" (7 Aug).
  - "Ultrasound m/c" — KIMS Hospital Trivandrum, Lead, Active, owner
    Basheer K, no open next action.
  - "Imaging department refresh" — Baby Memorial Hospital, Lead, Active,
    owner Basheer K, no open next action, no re-activation date.
  - Hospital-level next actions, both Basheer K's: KIMS Hospital
    Trivandrum "Meet him again 1 wk from now" (29 Jul); Aster MIMS Calicut
    "Call tomorrow again" (30 Jul).
  - Project "Another new project" — Aster MIMS Calicut (owner Basheer K).
  - A Marketing Lead not yet converted, assigned to an Imaging user: not
    picked yet; picked at the re-check before the run.

Button labels, messages and the order of checks are taken from the code,
not the design doc. Sections D and E were checked against the built code
on 2026-10-16 (steps 2–3, decisions D12–D19); the wording in A–C and G is
still a description, replaced with the built code's wording at the
re-check before the run.

## Figures and sources

- Users, roles, SBUs and managers — Dev query, 2026-10-14
- Open next actions on Opportunities (13) and at hospital level (11), and
  every record named above — same Dev query, 2026-10-14
- Project "Another new project" — Win Probability E2E test plan (Dev
  check, 2026-10-13)
- Creating at Payment Pending is allowed; only Won is refused at create;
  Repeat Order skips the demo-date and closure-date gates —
  `OpportunityService.create_opportunity` and Business-Rules BR-OP-13,
  read 2026-10-14
- Step D8's fast-track approach — Basheer, 2026-10-14
- Opportunity names
  "zz NA E2E – …" — made-up names for this run

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Left on Dev permanently:** every closed next action and its closing
activity, every Note and follow-up next action created below; "new lead"
marked Lost; "Ultrasound m/c" and "usg m/c" moved on a stage;
"Imaging department refresh" On Hold; "zz NA E2E – top bar" marked Lost
(E5); six new Opportunities —
"zz NA E2E – from hospital visit" (B4), "zz NA E2E – fast track Won"
(D8, Won), "zz NA E2E – top bar", "– Customer 360", "– project" (E3),
"– converted lead" (E4). Activities can't be deleted.

## Pre-flight

- P1. [Simple] Dev backend restarted after the last backend change. —
- P2. [Simple] Screens running from `main` with all five steps; Win
  Probability plan step 2 (one create form) and Duplicate Hospitals Part A
  already on `main`. —
- P3. [Simple] Signed in as Basheer K in one window; a second (private)
  window for Vivek and Haroon in turn. —
- P4. [Simple] Re-check above done; Marketing Lead for E4 picked. —

## A — Close it, don't go round it (BR-ACT-11)

1. [Complex: form changes shape] As Basheer K, Opportunity page
   "usg m/c" → Log Activity. **Expected:** the form offers only closing a
   next action; it lists Basheer K's "Call Mr Ajman…" and not Vivek's;
   there is no way to log a fresh Call or Visit. —
2. [Complex: same check from two more screens] Same as A1 from Customer
   360 (aster medicity → Log Activity, pick "usg m/c") and from the top
   bar Log Activity (pick aster medicity, then "usg m/c"). **Expected:**
   the same close-only form both times. —
3. [Complex: save, then read back] In that form, pick "Call Mr Ajman…".
   **Expected (pre-fill, D10):** the follow-up next-action box already
   holds "Call Mr Ajman to understand the progress on budget discussion"
   and can be edited. Change it to "Call Mr Ajman for the budget decision",
   add what happened and a due date one week out, and save.
   Basheer clicks, Claude watches. **Expected:** saved, with the edited
   text (not the pre-filled one) on the follow-up; the Opportunity's
   Activity tab shows the closing activity; Next Actions tab shows the old
   one done and the follow-up open. —
4. [Complex: rule re-applies after a close] Log Activity on "usg m/c"
   again. **Expected:** close-only again, now offering the follow-up from
   A3 — a rep with any open next action of their own stays held. —
5. [Complex: cross-user] As Haroon (no next action of his own on
   "usg m/c"), Log Activity on "usg m/c". **Expected:** a normal fresh
   activity form; save a Call with a next action. Basheer K's and Vivek's
   next actions are not offered and stay open. —
6. [Complex: cross-user, D2] As Haroon, Log Activity on "usg m/c" for
   Basheer K (the "logged for" person set to Basheer K). **Expected:**
   close-only, offering Basheer K's open next action — the person the
   activity is for counts, not the one typing. Cancel without saving. —
7. [Complex: cross-user, own only] As Vivek, Log Activity on "usg m/c".
   **Expected:** close-only, offering only "Please meet Dr Ajmal
   tomorrow."; Basheer K's isn't listed. Cancel. —
8. [Simple] As Basheer K, top bar Log Activity, hospital aster medicity,
   no Opportunity, type Visit. **Expected:** the normal form; it saves
   with a next action (hospital-level work is unchanged). —
9. [Simple] As Haroon, Log Activity on "usg m/c", type Manager Note for
   Basheer K. **Expected:** allowed, no next action asked (types that
   never need a next action are unchanged). —

## B — Closing always sets the next one (BR-ACT-05 change)

1. [Simple] As Basheer K, Next Actions screen → close "Meet Dr Ajmal in
   person" ("new lead") with what happened but no follow-up. **Expected:**
   refused; the message asks for a follow-up next action. —
2. [Simple] Same, now with a follow-up. **Expected (pre-fill, D10):**
   when the close form opens, the follow-up box already holds "Meet Dr
   Ajmal in person"; keep the text as it is, add a due date and save.
   **Expected:** saved; the follow-up "Meet Dr Ajmal in person" appears on
   the Next Actions list with the new due date. —
3. [Simple] Next Actions screen → close KIMS Hospital Trivandrum "Meet him
   again 1 wk from now" with no follow-up and the "produced a new
   Opportunity" box unticked. **Expected:** refused, as B1. —
4. [Complex: cross-form flow, D3] Same next action, tick "This visit
   produced a new Opportunity". **Expected:** the New Opportunity form
   opens with KIMS Hospital Trivandrum filled in and fixed. Create
   "zz NA E2E – from hospital visit". **Expected:** the First activity
   pop-up starts with the visit just typed in the close form (D17); add
   its next action and Create. The Opportunity is saved, then the
   hospital next action closes with no follow-up asked. The visit shows
   once on the hospital's Activity timeline, as the new Opportunity's
   activity — no second, hospital-only copy (D20). —
5. [Complex: cancel path, D3] Close Aster MIMS Calicut "Call tomorrow
   again", tick the box, then cancel the New Opportunity form.
   **Expected:** back on the close form, the tick removed, and a
   follow-up next action now required; save with one. No Opportunity was
   created. —

## C — Closing from the Opportunity page (hide-check)

1. [Complex: visual, hide-check] As Basheer K, "usg m/c" → Next Actions
   tab. **Expected:** "Close" on his own open row; none on Vivek's
   "Please meet Dr Ajmal tomorrow.". —
2. [Complex: hide-check, cross-user] As Vivek, same tab. **Expected:**
   "Close" on his own row only; none on Basheer K's. —
3. [Complex: save, then read back] As Vivek, press "Close" on his row in
   the tab. **Expected (pre-fill, D10):** the follow-up box already holds
   "Please meet Dr Ajmal tomorrow.". Clear it, type "Visit Dr Ajmal with
   the brochure", add what happened and a due date, and save.
   **Expected:** saved with the typed text; the tab and
   Vivek's Next Actions screen both show it done. —

## D — A note on every stage or status change (BR-OP-22, On Hold)

1. [Complex: form changes shape, D14] As Basheer K, "Ultrasound m/c" (no
   open next action of his) → Edit → stage Lead → Qualified → Save.
   **Expected:** the "Why this change?" pop-up opens with "You have no
   open next action on this Opportunity, so this is saved as a Note.", a
   "Why the change? *" box and a required follow-up next action. Press
   Cancel. **Expected:** back on the Edit form; nothing saved (reload:
   still Lead). Save again, fill the Note and a next action, Save.
   **Expected:** stage Qualified; Activity tab shows the Note; Next
   Actions tab shows its next action. —
2. [Complex: close-as-note, D15 single] "usg m/c" → Edit → stage Lead →
   Qualified → Save. **Expected:** the pop-up closes Basheer K's one open
   next action (the A3 follow-up, "Call Mr Ajman for the budget
   decision"), already picked — no "Next action to close" list; a
   follow-up is required and its box already holds that text — pre-fill,
   D10. Save. **Expected:** stage changed, next action closed, follow-up
   open — one save. —
3. [Simple] "usg m/c" → Edit → change only the name, save. **Expected:**
   saved with no note asked (no stage or status change). Change the name
   back. —
4. [Complex: cross-user, manager with none, D13] As Haroon (no next
   action of his own on "Ultrasound m/c"), "Ultrasound m/c" → Edit →
   stage Qualified → Demo → Save. **Expected:** the pop-up shows the
   "saved as a Note" line; he writes a Note with a next action and saves;
   Basheer K's next action from D1 is not offered and stays open. —
4a. [Complex: cross-user, manager with his own, D13] As Haroon, "usg m/c"
   (he has the open next action he set in A5, assigned to "Me (default)")
   → Edit → stage Qualified → Demo → Save. **Expected:** the pop-up
   closes Haroon's own A5 next action, not a Note; Basheer K's and
   Vivek's are not offered and stay open. Save with a follow-up. —
5. [Complex: date rule] As Basheer K, "Imaging department refresh" →
   Edit → status On Hold, a hold reason, re-activation date one month
   out. **Expected:** the note's next-action due date is filled with the
   re-activation date; moving it one day later is refused; one day
   earlier saves. Read back: On Hold, next action due on that date. —
6. [Complex: Lost exception, D12, D15 pick] As Basheer K, "new lead" →
   Edit → status Lost with a loss reason → Save. **Expected:** the pop-up
   shows "Next action to close *" listing his two open ones, soonest due
   first — "Meeting next week" (7 Aug) above the B2 follow-up "Meet Dr
   Ajmal in person" — with none picked. Pick "Meeting next week", leave
   the follow-up empty (labels have no "*"), Save. **Expected:** saved as
   Lost; no follow-up asked. —
7. [Simple] Next Actions screen → close the follow-up left open on
   "new lead" (from B2), no follow-up. **Expected:** saved — the
   Opportunity is Lost, so none is needed. —
8. [Complex: multi-step, D4] As Basheer K, top bar "+ Lead": name
   "zz NA E2E – fast track Won", any Imaging hospital, lead source Repeat
   Order, stage Payment Pending, with order value, a product, PO number
   and PO date, plus the first activity and next action. **Expected:**
   created at Payment Pending, Active. Then Edit → status Won, tick full
   payment, leave the payment note empty, Save. **Expected:** the "Why
   this change?" pop-up opens (the Won save needs it, D4), closing
   Basheer K's open next action from creation, already picked. Fill "Why
   the change?", leave the follow-up empty, Save. **Expected:** saved as
   Won; no follow-up next action asked; the payment note stays optional. —

## E — A new Opportunity starts with an activity (BR-OP-21)

1. [Simple] Top bar "+ Lead": fill the Opportunity, Create.
   **Expected:** the "First activity" pop-up opens (D19) with "Every new
   Opportunity starts with the conversation that led to it, and a next
   action. Create saves all three together." Press Cancel. **Expected:**
   back on the New Opportunity form, nothing created. —
2. [Simple] Create again; in the pop-up open "Type *". **Expected:** only
   Visit, Call, Email, Meeting and Note (D5); "Assign To" reads "<owner>
   — Opportunity owner (default)" (D16). Cancel. —
3. [Complex: save, then read back, three ways in] Create one Opportunity
   from each way in, each with its first activity and next action:
   "zz NA E2E – top bar"; "zz NA E2E – Customer 360" (aster medicity);
   "zz NA E2E – project" ("Another new project"). **Expected:** each
   Opportunity's Activity tab and Next Actions tab show them. —
4. [Complex: cross-screen] Marketing Lead (picked at P4) → Convert.
   **Expected:** "what happened" is pre-filled from the lead's interest
   note and can be edited; create "zz NA E2E – converted lead"; lead shows
   as converted; first activity and next action read back. —
5. [Complex: cross-user, Won/Lost with a Note, D12, D13] As Haroon, "zz
   NA E2E – top bar" (from E3; its next action is Basheer K's, D16) →
   Edit → status Lost with a loss reason → Save. **Expected:** the pop-up
   shows the "saved as a Note" line; write the Note, leave the next action
   empty (no "*"), Save. **Expected:** saved as Lost with the Note;
   Basheer K's next action is untouched. —

## F — (removed 2026-10-16)

Section F tested BR-ACC-05 (a new hospital starts with a Note and a next
action). Plan step 4 was dropped and the rule withdrawn (plan D21), so
there is nothing to test; the letter is kept so later references still
match.

## G — Data-quality check on Dev

1. [Complex: script output] Run `scripts/uat_data_quality_check.py --env
   dev --no-log`. **Expected:** "Active Opportunities with no open next
   action" also lists On Hold ones; "Imaging department refresh" is not
   listed (it got one in step D5); a hospital whose only use is an open
   hospital-level next action is not listed as unused (record picked
   read-only from Dev when step 5 is built). —
