<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Hospital Next-Action Rule — Manual E2E Test Plan

**Covers:** `docs/Hospital-Next-Action-Rule-Implementation-Plan.md`,
steps 1–5 (D1–D14), one run after the merge. Written 2026-10-28, ahead of
the build; section G and F3 (D6–D8) added 2026-10-30; section H, E3 and
F4 (D9, D10, D12) added 2026-10-31; D4 and D5 (D13, D14) added 2026-10-31.
**Built:** steps 1–5 — `2b5a113`, `421fc63`, `f129bb0`, `0e99f99`,
`406adcd`, then D13/D14 `1119312`, `e9418e9` (31 Oct). Merged into `main`
as `dce73f5` (31 Oct); not yet run.
**Where:** Dev.

The new warning wording ("on this hospital", "on this Project") is the
plan's; the exact text is re-read from the built `LogActivityModal.tsx`
before the run and corrected here if it differs.

## Checked against live data

Checked read-only on Dev, 2026-10-28 10:30 IST, app connection as Haroon
Sidheeq (General Manager), all three RLS settings set and verified,
rolled back. Re-run at P4 just before the run: the build session's tests
and other sessions may change these records.

- **Who sees:** testers are Basheer K (SBU Manager, Imaging, reports to
  Haroon), Haroon Sidheeq (General Manager). Each hospital below exists
  once on Dev. Vivek is not used: no hospital or Project below has a
  next action of his.
- **Who can approve:** n/a — nothing in this feature is approved.
- **Who can save:** the next actions below are all Basheer K's; the
  Projects "Another new project" and "Project 2" (Aster MIMS Calicut)
  are owned by Basheer K; "Mims calicut" (Aster MIMS Calicut) is an
  Imaging Opportunity owned by Basheer K. The "logged for" person box
  offers Basheer K to Haroon (as in the Opportunity rule's A6, 17 Oct).
- **Existing values:** open next actions used:
  - Aster MIMS Calicut, hospital level: Basheer K's "Call Dr tomorrow"
    (due 31 Jul 2026).
  - Aster MIMS Calicut, Project "Another new project": Basheer K's "Call
    tomorrow again" (due 18 Oct 2026). Project "Project 2": none.
  - Aster MIMS Calicut, Opportunity "zz NA E2E – project" (Aster MIMS
    Calicut): Basheer K's "zz E2E E3 project follow-up" (due 19 Oct
    2026). "Mims calicut" (Aster MIMS Calicut): none of Basheer K's.
  - another hospital, hospital level, all Basheer K's: "ZxcZXc" (7 Jul),
    "Need to call the doctor after 2 days" (7 Jul, from an Email),
    "Follow up" (24 Aug), "Test due-today overdue-badge fix" (24 Aug).
  - aster medicity, hospital level: Basheer K's "This is follow up next
    action for the hospital activity" (due 18 Oct 2026).
  - Haroon has no open next action of his own at Aster MIMS Calicut
    (his only hospital-level one is at Aster DM).

**Re-check 2026-10-31 (P4), Dev:** the records above are as described.
Counts below are as Haroon (General Manager) sees them — all SBUs.
Basheer K (Imaging) does not see Critical Care rows: Nishad K V's "Call
him next week" ("critical care icu") is missing from his view (found at
G2, 31 Oct). Added or changed since 28 Oct:
- Aster MIMS Calicut has 8 open next actions: Basheer K's 3 (hospital,
  Project, Opportunity level) and 5 of other people, all on
  Opportunities: Fahad 2 ("zz E2E MyWork C2 follow-up" on "USG M/c -
  Test Aug 18"; "due today counts as overdue" on "Now fastack lead"),
  Nishad K V 1 ("Call him next week" on "critical care icu"), Test - Area
  Manager 2 (both on "New USG msg").
- Open total: Basheer K 16, Haroon 6; nobody has more than 16 (next:
  Vivek 3, Fahad 3).
- "Another new project" (Aster MIMS Calicut) holds 7 Opportunities,
  including "zz NA E2E – project", "critical care icu" and "USG M/c -
  Test Aug 18" (all Aster MIMS Calicut). Pending next actions reaching
  it: Basheer K's "Call tomorrow again" and "zz E2E E3 project
  follow-up", Nishad K V's "Call him next week", Fahad's "zz E2E MyWork
  C2 follow-up". Fahad's "due today counts as overdue" ("Now fastack
  lead") and Test - Area Manager's two are not under it.
- "Project 2" (Aster MIMS Calicut): no Opportunities, no pending next
  actions (completed ones not checked). A second "Project 2" exists at
  "another hospital" — not used. "Mims calicut" (Aster MIMS Calicut) is
  under the Project "New Cath Lab Installation".
- Nobody has 2+ open Project-level next actions on one Project (D4 not
  testable). Hospital level: Aster DM has open ones of two people, Fazal
  and Haroon Sidheeq (D5 testable there). No Project has two people with
  open Project-level ones.

Button labels, messages and the order of checks are taken from the code
(`LogActivityModal.tsx`, `CloseReminderModal.tsx`, read 2026-10-28), not
the design doc; the new hospital and Project wording is re-checked
against the built code before the run.

## Figures and sources

- Testers, roles and managers; every next action, Project and
  Opportunity named above — read-only Dev queries, 2026-10-28 10:30 IST
  (scratchpad `dev_hospital_rule_records_2026-10-28.txt`,
  `dev_hospital_rule_opps_2026-10-28.txt`,
  `dev_hospital_rule_opps2_2026-10-28.txt`)
- Labels "None — hospital-level", "Close next action", "Log", "Project:
  <name>", "Next actions to close *", "Also close:", "Tick the next
  actions to close", "What was done? *", "This visit produced a new
  Opportunity", "📋 Manager Note", "🎪 Conference/Expo" —
  `LogActivityModal.tsx` and `CloseReminderModal.tsx`, 2026-10-28
- Current Opportunity warning wording — `LogActivityModal.tsx:438-439`
- "Mark to complete" on the Next Actions screen — Next-Action Rules E2E
  test plan, section H (run 2026-10-21)
- Follow-up texts "zz E2E HR …" and the new Opportunity names "zz HR E2E –
  produced" (aster medicity) and "zz HR E2E – project produced" (Aster
  MIMS Calicut) — made up for this run
- Project-screen chips, "+ Add", "Edit", "Pending (n)", "Mark to
  complete", "No pending next actions on this Project.", "No completed
  next actions yet.", "No opportunities linked to this project." —
  `ProjectDirectoryScreen.tsx`, `NextActionsPanel.tsx`, `ReminderRow.tsx`,
  read 2026-10-31 in the build worktree
- P4 results (re-check below) — read-only Dev query as Haroon Sidheeq
  (General Manager), all three RLS settings verified, rolled back,
  2026-10-31 (scratchpad `dev_hospital_rule_p4_2026-10-31.txt`)
- Automatic checks on `dce73f5`, run 2026-10-31 by Build & Test: pytest
  1496 passed, ruff clean, tsc clean, lint 0 errors / 135 warnings

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Phone:** every screen, card and pop-up the feature changes gets a
`[Complex: phone layout]` step (section F).

**Opportunities:** every Opportunity is named with its hospital in
brackets.

**Not tested on Dev:**
- The plain error a blocked rep sees between steps 1 and 2 — it lasts
  only until step 2 lands; backend tests cover the server refusal.
- The quick lead form — its first activity is always on the new
  Opportunity, so the hospital rule never applies; a backend test
  covers it.
- A manager closing several of a rep's hospital-level next actions at
  once — covered by a backend test, like the Opportunity version.
- A list longer than 50 (D6): P4 (31 Oct) found no Dev user with more
  than 16 open next actions, so the build's automated test covers it; no
  next actions are created on Dev just for this (they can't be deleted).
- D13 (two open Project-level next actions of one person on one Project)
  and the Project half of D14: no such data on Dev (P4, 31 Oct); backend
  tests cover them.

**Left on Dev permanently:** every closing activity and follow-up below,
Haroon's Call and its next action at Aster MIMS Calicut (D1), the Manager
Note (D3), the new Opportunity "zz HR E2E – produced" (aster medicity)
with its first activity and next action (E1), the new Opportunity "zz HR
E2E – project produced" (Aster MIMS Calicut) with its first activity and
next action (E3). Activities can't be deleted.

## Pre-flight

- P1. [Simple] Dev backend restarted after the merge (`dce73f5`). Pass —
  Basheer, 31 Oct.
- P2. [Simple] Screens running from `main` (all of steps 1–5, D13, D14).
  Pass — Basheer, 31 Oct: frontend runs from the main folder.
- P3. [Simple] Signed in as Basheer K in one window; a private window
  for Haroon. Pass — Basheer, 31 Oct.
- P4. [Simple] Live-data re-check above re-run (Claude, read-only).
  Pass — 31 Oct: records as described; counts and Project contents
  recorded in the re-check above; this plan's G, H and D steps corrected
  to match. —

## A — Hospital level (D1, D3)

1. [Simple] As Basheer K, top bar Log Activity, "Select account" Aster
   MIMS Calicut, "Opportunity (optional)" left on "None — hospital-level",
   type 🏥 Visit. **Expected:** yellow warning "You have an open next
   action on this hospital. Close it, saying what happened, instead of
   logging a new activity.", listing only "Call Dr tomorrow — due 31 Jul
   2026" (not the Project one, not the Opportunity one); no "Next Action
   *" tab; button "Close next action". **Result 31 Oct — Pass
   (Basheer).** —
2. [Complex: same check from another screen] Customer 360 → Aster MIMS
   Calicut → Activity tab "+ Log", Opportunity left on "None —
   hospital-level". **Expected:** the same warning and button as A1.
   Cancel. **Result 31 Oct — Pass (Basheer).** —
3. [Complex: level switch in one form] In the A1 form, pick "zz NA E2E –
   project" (Aster MIMS Calicut) in "Opportunity (optional)".
   **Expected:** the warning changes to "You have an open next action on
   this Opportunity…", listing only "zz E2E E3 project follow-up". Pick
   "Mims calicut" (Aster MIMS Calicut). **Expected:** no warning, button
   "Log", a "Next Action *" tab — the hospital-level one doesn't block an
   Opportunity (D3). Back to "None — hospital-level". **Expected:** the
   hospital warning again. Cancel. **Result 31 Oct — Pass
   (Basheer).** —
4. [Complex: save, then read back] A1 again → "Close next action".
   **Expected:** the "Close Next Action" form shows "Call Dr tomorrow" at
   the top; "Follow-up next action *" pre-filled with "Call Dr tomorrow".
   Change it to "zz E2E HR A4 follow-up", "Due Date *" one week out, fill
   "What was done? *", press "Complete". Basheer clicks, Claude watches.
   **Expected (read back):** Customer 360 (Aster MIMS Calicut) Activity
   tab shows the closing Visit with no Opportunity; Next Actions screen
   shows "Call Dr tomorrow" completed and "zz E2E HR A4 follow-up"
   pending, owner Basheer K, without a page reload; "Call tomorrow again"
   and "zz E2E E3 project follow-up" still pending. **Result 31 Oct —
   Pass (Basheer).** The Customer 360 Next Actions tab check also
   finishes the "after A4" half of G4. —
5. [Simple] A1 again. **Expected:** the warning now lists "zz E2E HR A4
   follow-up". Cancel. **Result 31 Oct — Pass (Basheer).** —

## B — Project level (D2, D3)

1. [Simple] As Basheer K, Project screen "Another new project" (Aster
   MIMS Calicut) → Log Activity. **Expected:** the tag "Project: Another
   new project"; warning "You have an open next action on this
   Project…", listing only "Call tomorrow again — due 18 Oct 2026" (not
   "zz E2E HR A4 follow-up"); button "Close next action". **Result 31
   Oct — Pass (Basheer).** —
2. [Simple] Project screen "Project 2" (Aster MIMS Calicut) → Log
   Activity. **Expected:** no warning, button "Log" — each Project only
   blocks itself. Cancel. **Result 31 Oct — Pass (Basheer).** —
3. [Complex: save, then read back] B1 again → "Close next action",
   follow-up "zz E2E HR B3 follow-up" one week out, fill "What was done?
   *", "Complete". Basheer clicks, Claude watches. **Expected (read
   back):** the closing activity shows on the Project; "Call tomorrow
   again" completed; B1 again lists "zz E2E HR B3 follow-up" (the
   follow-up stays on the Project); A1 still lists only "zz E2E HR A4
   follow-up". **Result 31 Oct — Pass (Basheer).** —

## C — Other people and exempt types (D5)

1. [Complex: cross-user, save] As Haroon, top bar Log Activity, Aster
   MIMS Calicut, "None — hospital-level", type 📞 Call. **Expected:** no
   warning (Basheer K's next action there isn't Haroon's); button "Log".
   Save with a next action "zz E2E HR C1 Haroon", "Assign Next Action
   To" left on "Me (default)". Basheer clicks as Haroon. **Expected
   (read back as Basheer K):** Haroon's Call on Customer 360's Activity
   tab; "zz E2E HR A4 follow-up" still pending. **Result 31 Oct — Pass
   (Basheer).** —
2. [Simple] As Haroon, A1 again, and set the person box under "Type *"
   to Basheer K. **Expected:** "Basheer K has an open next action on this
   hospital. Close it, saying what happened, instead of logging a new
   activity.", listing "zz E2E HR A4 follow-up". Cancel. **Result 31 Oct
   — Pass (Basheer).** —
3. [Simple] As Haroon, top bar Log Activity, Aster MIMS Calicut, "None —
   hospital-level", type 📋 Manager Note, "This Note Is For *" Basheer
   K, press "Log". **Expected:** allowed, no warning, no "Next Action *"
   tab. **Result 31 Oct — Pass (Basheer).** —
4. [Simple] As Basheer K, the A1 form (top bar Log Activity, Aster MIMS
   Calicut, "None — hospital-level") with type 🎪 Conference/Expo.
   **Expected:** no warning, no "Next Action *" tab, button "Log".
   Cancel. **Result 31 Oct — Pass (Basheer).** —

## D — Several open at one hospital (D5, tick list)

1. [Simple] As Basheer K, top bar Log Activity, "another hospital",
   "None — hospital-level", type 📞 Call. **Expected:** "You have open
   next actions on this hospital. Close them, saying what happened,
   instead of logging a new activity.", listing all four ("ZxcZXc",
   "Need to call the doctor after 2 days", "Follow up", "Test due-today
   overdue-badge fix"). **Result 31 Oct — Pass (Basheer).** —
2. [Complex: save, then read back] "Close next action". **Expected:**
   "Next actions to close *" with four tick boxes, none ticked, soonest
   due first. "Complete" with none ticked. **Expected:** "Tick the next
   actions to close". Tick "ZxcZXc" and "Need to call the doctor after 2
   days"; **Expected:** the follow-up box holds both texts, one per line.
   Replace with "zz E2E HR D2 follow-up", due one week out, fill "What
   was done? *", "Complete". Basheer clicks. **Expected (read back):**
   both completed by the same Call; "Follow up" and "Test due-today…"
   still pending; one new follow-up. **Result 31 Oct — Pass
   (Basheer).** —
3. [Complex: visual check, then save] Next Actions screen → "Mark to
   complete" on "Follow up" (another hospital). **Expected:** "Also
   close:" lists "Test due-today overdue-badge fix" and "zz E2E HR D2
   follow-up", nothing from another hospital, Project or Opportunity, and
   no "Only next actions on an Opportunity can be closed together." Tick
   "Test due-today…", follow-up "zz E2E HR D3 follow-up", fill "What was
   done? *", "Complete". Basheer clicks. **Expected:** both closed, one
   follow-up added; D1 again lists only the D2 and D3 follow-ups.
   **Result 31 Oct — Pass (Basheer).** —
4. [Simple] D13 — Not tested on Dev, no such data. P4 (31 Oct) found
   nobody with two or more open Project-level next actions of their own
   on one Project, and the Log Activity rule stops anyone creating a
   second on Dev. Covered by the build's backend tests (`1119312`). —
5. [Complex: data-dependent, cross-person] D14 (the pop-ups ask the
   server for only the right person's, at the right level). P4 (31 Oct)
   found one hospital where two people have open hospital-level next
   actions: Aster DM (Fazal and Haroon Sidheeq). No Project has two. As
   Haroon (private window): top bar Log Activity, Aster DM, "None —
   hospital-level", type 📞 Call. **Expected:** the warning lists only
   Haroon's own hospital-level next action(s), none of Fazal's. As Basheer
   K (he has none at Aster DM): same form. **Expected:** no warning,
   button "Log" — another person's next action never blocks him. Cancel
   both. The Project half: not tested on Dev, no such data. **Result 31
   Oct — hospital half Pass (Basheer); Project half not tested.** —

## E — A visit that produced a new Opportunity (D5)

1. [Complex: save, two records] As Basheer K, top bar Log Activity,
   aster medicity, "None — hospital-level" → warning lists "This is
   follow up next action for the hospital activity" → "Close next
   action". Tick "This visit produced a new Opportunity", create "zz HR
   E2E – produced" (aster medicity) with its first activity and next
   action, "Complete". Basheer clicks. **Expected (read back):** the new
   Opportunity on aster medicity's Customer 360 with its activity and
   next action; the hospital-level next action completed with no
   follow-up. **Result 31 Oct — Pass (Basheer).** —
2. [Simple] Top bar Log Activity, aster medicity, "None —
   hospital-level". **Expected:** no warning, button "Log". Cancel.
   **Result 31 Oct — Pass (Basheer).** —
3. [Complex: save, two records, cross-screen] D12. Run after B3. As
   Basheer K, Project screen "Another new project" (Aster MIMS Calicut) →
   top bar Log Activity → warning lists "zz E2E HR B3 follow-up" → "Close
   next action". Tick "This visit produced a new Opportunity".
   **Expected:** the Add Opportunity form opens with Aster MIMS Calicut
   filled and "Another new project" filled and not changeable (exact
   wording of the locked field re-read from the built code before the
   run). Create "zz HR E2E – project produced" (Aster MIMS Calicut) with
   its first activity and next action, "Complete". Basheer clicks, Claude
   watches. **Expected (read back):** the Project screen's Opportunities
   tab lists "zz HR E2E – project produced"; its Next Actions tab shows
   "zz E2E HR B3 follow-up" under Completed with no follow-up from the
   close, and the new Opportunity's next action under Pending showing
   that Opportunity's name (it belongs to the Project through its
   Opportunity, D9); Customer 360 (Aster MIMS Calicut) lists the new
   Opportunity. **Result 31 Oct — Pass (Basheer).** —

### Fix found during the E2E (31 Oct) — Completed order
Basheer: on a Next Actions tab it was hard to see where a new item landed.
Pending lists stay soonest-due first; **Completed lists now show the one
closed most recently first** (Next Actions screen, Customer 360, Opportunity
and Project screens). Not one of the 37 steps. Check once, e.g. on the
Project "Another new project" → Next Actions → Completed: "zz E2E HR B3
follow-up" (closed at E3) is above "Call tomorrow again" (closed at B3).
Result 31 Oct — Pass (Basheer): "It is working."

## F — Phone, tablet and laptop

1. [Complex: phone layout] 390 px: top bar Log Activity, "another
   hospital", "None — hospital-level". **Expected:** the warning box
   fills the form's width, each next action with its due date wraps
   inside it, nothing runs past the form; then "Close next action" — the
   tick list fits too. Same at 768 and 1280 px. Cancel. **Result 31 Oct
   — Pass (Basheer).** —
2. [Complex: phone layout] 390 px: Project screen "Another new project"
   (Aster MIMS Calicut) → Log Activity. **Expected:** the "Project:"
   tag and the warning fit the form's width. Cancel. **Result 31 Oct —
   Pass (Basheer).** —
3. [Complex: phone layout] 390 px: Customer 360 → Aster MIMS Calicut →
   Next Actions tab. **Expected:** the tab is reachable in the tab row;
   each row (text, due date, owner, Opportunity name) wraps inside the
   screen, nothing runs past it. Same at 768 and 1280 px. **Result 31
   Oct — Pass (Basheer).** —
4. [Complex: phone layout] 390 px: Project screen "Another new project"
   (Aster MIMS Calicut). **Expected:** the four-chip row (Overview,
   Opportunities, Activity, Next Actions) slides sideways inside the
   screen with the page itself not scrolling sideways; each of the four
   tabs fits the screen width, and on Next Actions each row (text, due
   date, owner, Opportunity name) wraps inside it. Same at 768 and 1280
   px. **Result 31 Oct — Pass (Basheer).** —

## G — Seeing them all (D6, D7, D8)

Run G before A, so the next actions are as listed under "Existing
values". Close-button label re-read from the built code before the run.

1. [Simple] As Basheer K, Customer 360 → Aster MIMS Calicut.
   **Expected:** a "Next Actions" tab in the tab row, right after
   Activity (Basheer, 31 Oct: it was built after Opportunities; moving
   it is a small fix, made 31 Oct, uncommitted in the small-fixes batch;
   re-check the position after the reload). **Result 31 Oct — Pass (tab
   present, next to Activity after the fix; Basheer).** —
2. [Complex: three levels in one list] Open it. **Expected:** pending
   list includes "Call Dr tomorrow" (hospital level, no Opportunity
   shown), "Call tomorrow again" (Project "Another new project") and "zz
   E2E E3 project follow-up" showing Opportunity "zz NA E2E – project"
   (Aster MIMS Calicut); each shows "Owner: Basheer K" and "Mark to
   complete". Also listed, with their owner's name and no "Mark to
   complete" (D7, D8): Fahad's "zz E2E MyWork C2 follow-up" ("USG M/c -
   Test Aug 18") and "due today counts as overdue" ("Now fastack lead"),
   Nishad K V's "Call him next week" ("critical care icu"), Test - Area
   Manager's "Call Dr Ajmal next week to check" and "I need to call
   middle of next month" (both "New USG msg") — 7 pending in all. **Must
   not appear (hide-check, SBU boundary):** Nishad K V's "Call him next
   week" on "critical care icu" — a Critical Care Opportunity, and Basheer
   K is Imaging. (P4 ran as Haroon, who sees both SBUs, so it listed 8; the
   plan said 8 until Basheer saw 7 on 31 Oct — checked: Basheer K's
   own view returns no row for it.) **Result 31 Oct — Pass (7 rows,
   Basheer).** —
3. [Complex: cross-role] Haroon's window, same tab. **Expected:** 8 rows
   — the 7 above plus Nishad K V's "Call him next week" ("critical care
   icu") — none with "Mark to complete" (Haroon has none of his own
   here). **Result 31 Oct — Pass (Basheer).** —
4. [Simple] Basheer K's window, same tab, switch to Completed (nothing
   is closed here — A4 does that). **Expected:** completed next actions
   at this hospital, if any, with no close button; back to Pending shows
   the G2 list. After A4, this tab shows "Call Dr tomorrow" under
   Completed and "zz E2E HR A4 follow-up" under Pending without a page
   reload. **Result 31 Oct — Pass for the Completed/Pending switch
   (Basheer); the "after A4" half is checked at A4.** —
5. [Simple] Next Actions screen (left menu). **Expected:** the heading
   shows Basheer K's total open next actions, and the list count matches
   it. P4 (31 Oct): 16 before this run's changes; the number moves as A4,
   B3, D2, D3, E1 and E3 close and add next actions, so compare heading
   and list with each other, not with 16. **Result 31 Oct — Pass
   (Basheer).** —
6. [Simple] More than 50 — Not tested on Dev, automated test. P4 (31
   Oct): no Dev user has more than 16 open next actions; no next actions
   are created on Dev just for this (they can't be deleted). Covered by
   the build's automated test. **Result 31 Oct — Not tested on Dev
   (16 rows is under the old cap of 50, so it can't show the fix).** —

## H — Project screen: tabs and Next Actions (D9, D10)

Run H1–H6 before B, so "Call tomorrow again" is still pending; H7 runs
after B3. Wording below is from `ProjectDirectoryScreen.tsx`,
`NextActionsPanel.tsx` and `ReminderRow.tsx` as built (read 2026-10-31).

1. [Complex: two ways in] As Basheer K, Account Management screen →
   Projects sub-tab (no "Projects" item in the left menu — Basheer, 31
   Oct) → "Another new project" (Aster MIMS Calicut). **Expected:** the
   screen opens on
   Overview (Project Details: Account, Status, Owner, Bid Submission
   Date) with a chip row Overview, Opportunities, Activity, Next Actions.
   Back, then Customer 360 → Aster MIMS Calicut → Projects tab → the same
   Project. **Expected:** again opens on Overview. **Result 31 Oct —
   Pass (Basheer).** —
2. [Complex: buttons inside tabs] Opportunities chip. **Expected:** the
   Opportunities card with "+ Add"; the Project's Opportunities listed
   (stage, win %, value) or "No opportunities linked to this project."; a
   row opens that Opportunity (back returns). "+ Add" opens the new
   Opportunity form with Aster MIMS Calicut and the Project fixed;
   Cancel. Activity chip. **Expected:** the Project's activity timeline;
   top bar Log Activity from here shows the tag "Project: Another new
   project"; Cancel. Header "Edit" opens the Edit Project form from any
   tab; Cancel. **Result 31 Oct — Pass (Basheer).** —
3. [Complex: own and Opportunity next actions in one list] Next Actions
   chip. **Expected:** heading "Pending (3)" with 3 rows: "Call tomorrow
   again" (Project level, no Opportunity shown) and "zz E2E E3 project
   follow-up" (showing "zz NA E2E – project"), both with "Mark to
   complete"; Fahad's "zz E2E MyWork C2 follow-up" (showing "USG M/c -
   Test Aug 18"), with his name and no "Mark to complete". **Must not
   appear:** Nishad K V's "Call him next week" ("critical care icu" is
   under this Project but is Critical Care — not visible to Basheer K,
   as G2); Fahad's "due today counts as overdue", Test - Area Manager's
   "Call Dr Ajmal next week to check" and "I need to call middle of next
   month" (their Opportunities are not under this Project). **Result 31
   Oct — Pass (Basheer).** —
4. [Simple] Account Management → Projects sub-tab → "Project 2" (Aster
   MIMS Calicut — not the one at "another hospital") → Next Actions.
   **Expected:** "No pending next actions on this Project." (P4, 31 Oct:
   no Opportunities, no pending next actions); Completed switch shows "No
   completed next actions yet." or its completed ones (not checked at
   P4). **Result 31 Oct — Pass (Basheer).** —
5. [Complex: cross-role] Haroon's window, "Another new project" → Next
   Actions. **Expected:** "Pending (4)": the three rows of H3 plus
   Nishad K V's "Call him next week" ("critical care icu"), none with
   "Mark to complete" (Haroon has none of his own here). **Result 31
   Oct — Pass (Basheer).** —
6. [Simple] Basheer K's window, H3 list: press the Opportunity name
   under "zz E2E E3 project follow-up" ("zz NA E2E – project"). **Expected:**
   that Opportunity opens. **Result 31 Oct — Pass (Basheer).** —
7. [Complex: refresh without reload] After B3, with the Project screen
   still open on Next Actions. **Expected:** "Call tomorrow again" under
   Completed (switch), "zz E2E HR B3 follow-up" under Pending, owner
   Basheer K, without a page reload; after E3, "zz E2E HR B3 follow-up"
   moves to Completed and the new Opportunity's next action shows under
   Pending. **Result 31 Oct — Pass (Basheer), after E3.** —
