<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Hospital Next-Action Rule — Manual E2E Test Plan

**Covers:** `docs/Hospital-Next-Action-Rule-Implementation-Plan.md`,
steps 1–2 (D1–D5), one run after step 2. Written 2026-10-28, ahead of the
build.
**Built:** not yet — commit hashes filled in after the fact.
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
- Follow-up texts "zz E2E HR …" and the new Opportunity name "zz HR E2E –
  produced" (aster medicity) — made up for this run

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

**Left on Dev permanently:** every closing activity and follow-up below,
Haroon's Call and its next action at Aster MIMS Calicut (D1), the Manager
Note (D3), the new Opportunity "zz HR E2E – produced" (aster medicity)
with its first activity and next action (E1). Activities can't be
deleted.

## Pre-flight

- P1. [Simple] Dev backend restarted after step 1's backend change. —
- P2. [Simple] Screens running from `main` with steps 1 and 2. —
- P3. [Simple] Signed in as Basheer K in one window; a private window
  for Haroon. —
- P4. [Simple] Live-data re-check above re-run (Claude, read-only);
  records as described, or this plan updated first. —

## A — Hospital level (D1, D3)

1. [Simple] As Basheer K, top bar Log Activity, "Select account" Aster
   MIMS Calicut, "Opportunity (optional)" left on "None — hospital-level",
   type 🏥 Visit. **Expected:** yellow warning "You have an open next
   action on this hospital. Close it, saying what happened, instead of
   logging a new activity.", listing only "Call Dr tomorrow — due 31 Jul
   2026" (not the Project one, not the Opportunity one); no "Next Action
   *" tab; button "Close next action". —
2. [Complex: same check from another screen] Customer 360 → Aster MIMS
   Calicut → Activity tab "+ Log", Opportunity left on "None —
   hospital-level". **Expected:** the same warning and button as A1.
   Cancel. —
3. [Complex: level switch in one form] In the A1 form, pick "zz NA E2E –
   project" (Aster MIMS Calicut) in "Opportunity (optional)".
   **Expected:** the warning changes to "You have an open next action on
   this Opportunity…", listing only "zz E2E E3 project follow-up". Pick
   "Mims calicut" (Aster MIMS Calicut). **Expected:** no warning, button
   "Log", a "Next Action *" tab — the hospital-level one doesn't block an
   Opportunity (D3). Back to "None — hospital-level". **Expected:** the
   hospital warning again. Cancel. —
4. [Complex: save, then read back] A1 again → "Close next action".
   **Expected:** the "Close Next Action" form shows "Call Dr tomorrow" at
   the top; "Follow-up next action *" pre-filled with "Call Dr tomorrow".
   Change it to "zz E2E HR A4 follow-up", "Due Date *" one week out, fill
   "What was done? *", press "Complete". Basheer clicks, Claude watches.
   **Expected (read back):** Customer 360 (Aster MIMS Calicut) Activity
   tab shows the closing Visit with no Opportunity; Next Actions screen
   shows "Call Dr tomorrow" completed and "zz E2E HR A4 follow-up"
   pending, owner Basheer K, without a page reload; "Call tomorrow again"
   and "zz E2E E3 project follow-up" still pending. —
5. [Simple] A1 again. **Expected:** the warning now lists "zz E2E HR A4
   follow-up". Cancel. —

## B — Project level (D2, D3)

1. [Simple] As Basheer K, Project screen "Another new project" (Aster
   MIMS Calicut) → Log Activity. **Expected:** the tag "Project: Another
   new project"; warning "You have an open next action on this
   Project…", listing only "Call tomorrow again — due 18 Oct 2026" (not
   "zz E2E HR A4 follow-up"); button "Close next action". —
2. [Simple] Project screen "Project 2" (Aster MIMS Calicut) → Log
   Activity. **Expected:** no warning, button "Log" — each Project only
   blocks itself. Cancel. —
3. [Complex: save, then read back] B1 again → "Close next action",
   follow-up "zz E2E HR B3 follow-up" one week out, fill "What was done?
   *", "Complete". Basheer clicks, Claude watches. **Expected (read
   back):** the closing activity shows on the Project; "Call tomorrow
   again" completed; B1 again lists "zz E2E HR B3 follow-up" (the
   follow-up stays on the Project); A1 still lists only "zz E2E HR A4
   follow-up". —

## C — Other people and exempt types (D5)

1. [Complex: cross-user, save] As Haroon, top bar Log Activity, Aster
   MIMS Calicut, "None — hospital-level", type 📞 Call. **Expected:** no
   warning (Basheer K's next action there isn't Haroon's); button "Log".
   Save with a next action "zz E2E HR C1 Haroon", "Assign Next Action
   To" left on "Me (default)". Basheer clicks as Haroon. **Expected
   (read back as Basheer K):** Haroon's Call on Customer 360's Activity
   tab; "zz E2E HR A4 follow-up" still pending. —
2. [Simple] As Haroon, A1 again, and set the person box under "Type *"
   to Basheer K. **Expected:** "Basheer K has an open next action on this
   hospital. Close it, saying what happened, instead of logging a new
   activity.", listing "zz E2E HR A4 follow-up". Cancel. —
3. [Simple] As Haroon, top bar Log Activity, Aster MIMS Calicut, "None —
   hospital-level", type 📋 Manager Note, "This Note Is For *" Basheer
   K, press "Log". **Expected:** allowed, no warning, no "Next Action *"
   tab. —
4. [Simple] As Basheer K, A1 with type 🎪 Conference/Expo.
   **Expected:** no warning, no "Next Action *" tab, button "Log".
   Cancel. —

## D — Several open at one hospital (D5, tick list)

1. [Simple] As Basheer K, top bar Log Activity, "another hospital",
   "None — hospital-level", type 📞 Call. **Expected:** "You have open
   next actions on this hospital. Close them, saying what happened,
   instead of logging a new activity.", listing all four ("ZxcZXc",
   "Need to call the doctor after 2 days", "Follow up", "Test due-today
   overdue-badge fix"). —
2. [Complex: save, then read back] "Close next action". **Expected:**
   "Next actions to close *" with four tick boxes, none ticked, soonest
   due first. "Complete" with none ticked. **Expected:** "Tick the next
   actions to close". Tick "ZxcZXc" and "Need to call the doctor after 2
   days"; **Expected:** the follow-up box holds both texts, one per line.
   Replace with "zz E2E HR D2 follow-up", due one week out, fill "What
   was done? *", "Complete". Basheer clicks. **Expected (read back):**
   both completed by the same Call; "Follow up" and "Test due-today…"
   still pending; one new follow-up. —
3. [Complex: visual check, then save] Next Actions screen → "Mark to
   complete" on "Follow up" (another hospital). **Expected:** "Also
   close:" lists "Test due-today overdue-badge fix" and "zz E2E HR D2
   follow-up", nothing from another hospital, Project or Opportunity, and
   no "Only next actions on an Opportunity can be closed together." Tick
   "Test due-today…", follow-up "zz E2E HR D3 follow-up", fill "What was
   done? *", "Complete". Basheer clicks. **Expected:** both closed, one
   follow-up added; D1 again lists only the D2 and D3 follow-ups. —

## E — A visit that produced a new Opportunity (D5)

1. [Complex: save, two records] As Basheer K, top bar Log Activity,
   aster medicity, "None — hospital-level" → warning lists "This is
   follow up next action for the hospital activity" → "Close next
   action". Tick "This visit produced a new Opportunity", create "zz HR
   E2E – produced" (aster medicity) with its first activity and next
   action, "Complete". Basheer clicks. **Expected (read back):** the new
   Opportunity on aster medicity's Customer 360 with its activity and
   next action; the hospital-level next action completed with no
   follow-up. —
2. [Simple] Top bar Log Activity, aster medicity, "None —
   hospital-level". **Expected:** no warning, button "Log". Cancel. —

## F — Phone, tablet and laptop

1. [Complex: phone layout] 390 px: top bar Log Activity, "another
   hospital", "None — hospital-level". **Expected:** the warning box
   fills the form's width, each next action with its due date wraps
   inside it, nothing runs past the form; then "Close next action" — the
   tick list fits too. Same at 768 and 1280 px. Cancel. —
2. [Complex: phone layout] 390 px: Project screen "Another new project"
   (Aster MIMS Calicut) → Log Activity. **Expected:** the "Project:"
   tag and the warning fit the form's width. Cancel. —
