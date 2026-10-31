<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Activity Type Table — Manual E2E Test Plan

**Covers:** `docs/Activity-Type-Table-Implementation-Plan.md`, steps 1–3
(D1–D12), one run after the build. Written 2026-10-31, ahead of the build.
**Built:** not yet built.
**Where:** Dev.

**What this run proves.** Users should see no difference (plan D2), so
almost every step is "same as before": the same 13 types, the same fields
for each type, the same refusals, the same report numbers. Section S takes
the "before" numbers on the old code; section E compares after the build.
Most checks open a form and press its button with a field left empty — the
form refuses before anything is saved. Only C1 and C2 save.

## Checked against live data

Checked read-only on Dev, 2026-10-31 15:20 IST, app connection as Haroon
Sidheeq (General Manager), all three RLS settings set and verified,
rolled back. Re-run at P4 just before the run: the hospital next-action
rule's E2E, also at Aster MIMS Calicut, may change these records.

- **Who sees:** testers Basheer K (SBU Manager, Imaging), Haroon Sidheeq
  (General Manager), Arun Adarsh (Area Manager, Critical Care), all
  active. F1's hide-check: Vivek (Sales Staff, Critical Care, active) —
  not a manager, so he must NOT be offered Manager Note.
- **Who can approve:** n/a — nothing in this feature is approved.
- **Who can save:** C1 and C2 are Basheer K's own activities; C2 is on
  "Mims calicut" (Aster MIMS Calicut): Imaging, owner Basheer K, stage
  Demo, Active, no open next action of anyone's. B4's "Related
  Opportunity *" list: Aster MIMS Calicut has 20 Opportunities of both
  SBUs (e.g. "critical care icu", Nishad K V, Critical Care).
- **Existing values:** 139 activities on Dev, of 11 types — every one
  among the 13 (OEM/Product Training and Seminar/Trade Show have none);
  the most are Call 79, Manager Note 23, Relationship Support 10. "Mims
  calicut" (Aster MIMS Calicut): last Visit/Call/Meeting/Email 21 Jul
  2026, so it is on both 30-day "Not visited" lists in S1 and S2.

Button labels, messages and the order of checks are taken from the code
(`LogActivityModal.tsx`, `CloseReminderModal.tsx`, `MyWorkScreen.tsx`,
`DemoApp.tsx`, `activityTypes.ts`, in the build worktree, read
2026-10-31), not the design doc. The build keeps every message word for
word (plan step 2); re-read them from the built code before the run.

## Figures and sources

- 13 types, their names, icons and dropdown order — `LogActivityModal.tsx:27-41`,
  `activityTypes.ts:6-24`, 2026-10-31
- The five closing / first-activity types (Visit, Call, Email, Meeting,
  Note) — `CloseReminderModal.tsx:81-86`, 2026-10-31
- Manager Note only for Admin, General Manager, SBU Manager, Area
  Manager — `LogActivityModal.tsx:45`, `843c552`
- Messages "Account is required", "Outcome/Learning is required",
  "Description is required for Other Development", "Related Opportunity
  is required for Relationship Support", "Notes describing what was done
  are required for Relationship Support", "Next Action is required" —
  `LogActivityModal.tsx:236-264`, 2026-10-31
- Labels "Select account", "Select account (optional)", "Opportunity
  (optional)", "None — hospital-level", "Related Opportunity *",
  "Description *", "Notes", "Outcome/Learning *", "Urgent — notify
  immediately", "Linked to this opportunity" — `LogActivityModal.tsx`,
  2026-10-31
- "Type *", "What was done? *", "What happened? *", "Next action to close
  *" — `CloseReminderModal.tsx`, 2026-10-31
- My Work tabs "Summary", "My hospitals", "Opportunities", "Next
  actions"; "Not visited for (days)", "Last visit" — `MyWorkScreen.tsx`,
  2026-10-31
- Menu names "Stagnant Opportunities", "Daily Activity Report", "Next
  Actions", "My Work" — `DemoApp.tsx`, 2026-10-31
- Only Visit, Call, Meeting, Email reset "Not visited" — 
  `reporting/repository.py:77`, 2026-10-31
- Data-quality script runs on Dev with `--env dev --no-log` —
  `scripts/uat_data_quality_check.py:183-184`, 2026-10-31
- Testers, roles and SBUs; 139 activities and the count by type; the 20
  Opportunities at Aster MIMS Calicut; "Mims calicut" (Aster MIMS
  Calicut)'s owner, stage, open next actions (none) and last contact (21
  Jul 2026) — read-only Dev query, 2026-10-31 15:20 IST (scratchpad
  `dev_activity_type_check_2026-10-31.txt`)
- 30 days for the report threshold; texts "zz ATT E2E C1 outcome", "zz
  ATT E2E C2 follow-up" — made up for this run

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]`. Basheer runs Complex steps too,
from exact instructions; a step Claude runs says so — `[Complex: Claude —
<reason>]` (Basheer, 2026-10-29). Saves to Dev are "Basheer clicks, Claude
watches"; Claude reads the record back in the app.

**Phone:** no screen changes (plan "On a phone"); H1 checks the Log
Activity form, the one form whose fields now come from the table.

**Opportunities:** every Opportunity is named with its hospital in
brackets.

**Not tested on Dev** (backend tests cover them):
- A new type added to the table being offered and checked without a code
  change (D5) — there is no Reference Data screen yet, and a row added by
  hand on the shared Dev database would show to everyone.
- The database refusing an unknown type, and its hospital check reading
  the table (D8) — the form never sends either.
- The server's own refusals behind the form (each message in section B
  also comes back from the server) — the form refuses first.
- The vendor pipeline report script — not changed (D10).

**Left on Dev permanently:** C1's Conference/Expo and C2's Call with its
next action "zz ATT E2E C2 follow-up". Activities can't be deleted.

## Pre-flight

- P1. [Simple] Before the build reaches Dev: section S done on the old
  code, the same day the new code goes on Dev (the "days" go up by one
  each day). —
- P2. [Simple] Dev backend restarted after the build's last backend
  change; `alembic current` on Dev = the new head; Physical-Schema.sql
  regenerated. —
- P3. [Simple] Signed in as Basheer K in one window; private windows for
  Haroon, Arun Adarsh and the non-manager tester (F1). —
- P4. [Simple] Live-data check above re-run (Claude, read-only): stored
  types all among the 13; "Mims calicut" (Aster MIMS Calicut) still
  Basheer K's with no open next action of his; the F1 tester is not a
  manager; "Related Opportunity *" offers Basheer K at least one
  Opportunity at Aster MIMS Calicut (B4). Records as described, or this
  plan updated first. —

## S — Before snapshot (old code, Basheer K)

1. [Simple] Reports → Stagnant Opportunities, "Not visited for (days)"
   30. **Write down:** the number of rows, and for the first five the
   Opportunity, hospital and days; whether "Mims calicut" (Aster MIMS
   Calicut) is listed, and its days. —
2. [Simple] My Work → Opportunities tab, "Not visited for (days)" 30.
   **Write down:** the number of rows and the first five (Opportunity,
   hospital, days). —
3. [Simple] My Work → My hospitals tab. **Write down:** "Last visit" for
   the first five hospitals, and for Aster MIMS Calicut. —
4. [Complex: Claude — script output] Claude runs the data-quality script
   on Dev, read-only (`--env dev --no-log`), and keeps section 7a's
   output. —

## A — Log Activity form, type by type (D2, D3, D4)

1. [Simple] As Basheer K, top bar Log Activity, open "Type *".
   **Expected:** 13 types in this order: 🏥 Visit, 📞 Call, ✉️ Email, 🤝
   Meeting, 📝 Note, 📋 Manager Note, 🎪 Conference/Expo, 🎓 OEM/Product
   Training, 📜 Certification, 📚 Sales Training, 🗣️ Seminar/Trade Show,
   🌱 Other Development, 🤲 Relationship Support. —
2. [Complex: five types in one form] "Select account" Aster MIMS Calicut,
   then pick in turn Visit, Call, Email, Meeting, Note. **Expected for
   each:** the box is "Select account"; "Opportunity (optional)" shows,
   starting at "None — hospital-level"; a "Next Action *" tab; "Notes"
   box; no "Outcome/Learning *" box. —
3. [Simple] Same form, pick 📋 Manager Note. **Expected:** "Urgent —
   notify immediately" tick box; no "Next Action *" tab; "Opportunity
   (optional)" still shows. —
4. [Complex: six types in one form] Pick in turn Conference/Expo,
   OEM/Product Training, Certification, Sales Training, Seminar/Trade
   Show. **Expected for each:** the box is "Select account (optional)";
   no Opportunity picker; no "Next Action *" tab; an "Outcome/Learning *"
   box; the notes box is "Notes". Then Other Development. **Expected:**
   the same, except the notes box is "Description *". —
5. [Simple] Pick 🤲 Relationship Support. **Expected:** "Related
   Opportunity *" (starting at "Select opportunity") instead of
   "Opportunity (optional)"; "Description *"; no "Next Action *" tab; no
   "Outcome/Learning *". Cancel. —
6. [Complex: opened from an Opportunity] Open "Mims calicut" (Aster MIMS
   Calicut) → Log Activity, type 🎪 Conference/Expo. **Expected:** as on
   the old code — "Linked to this opportunity" shows, no Opportunity
   picker, "Outcome/Learning *" box (plan section 4: the form only hides
   the picker; nothing new here). Cancel. —

## B — Form refusals, nothing saved (D3, D4)

Each step presses "Log" with one field left empty; the form must refuse
with the exact message and not save.

1. [Simple] Top bar Log Activity, type 🏥 Visit, no account, Notes
   filled. **Expected:** "Account is required". —
2. [Simple] Type 🎪 Conference/Expo, no account, "Outcome/Learning *"
   empty. **Expected:** "Outcome/Learning is required" (not "Account is
   required"). —
3. [Simple] Type 🌱 Other Development, "Outcome/Learning *" filled,
   "Description *" empty. **Expected:** "Description is required for
   Other Development". —
4. [Simple] Type 🤲 Relationship Support, account Aster MIMS Calicut,
   "Related Opportunity *" left on "Select opportunity". **Expected:**
   "Related Opportunity is required for Relationship Support". Pick any
   Opportunity, leave "Description *" empty. **Expected:** "Notes
   describing what was done are required for Relationship Support". —
5. [Simple] Type 📞 Call, account Aster MIMS Calicut, Opportunity "Mims
   calicut" (Aster MIMS Calicut), the "Next Action *" tab left empty.
   **Expected:** the form moves to the "Next Action *" tab with "Next
   Action is required". Cancel. —

## C — Two saves (D3, D8)

1. [Complex: save, then read back] As Basheer K, top bar Log Activity,
   type 🎪 Conference/Expo, no account, "Outcome/Learning *" "zz ATT E2E
   C1 outcome", press "Log". Basheer clicks, Claude watches.
   **Expected:** saved with no hospital (the database's new hospital
   check lets the six through, D8). **Read back:** Reports → Daily
   Activity Report for today shows the row with 🎪 Conference/Expo. —
2. [Complex: save, then read back] Open "Mims calicut" (Aster MIMS
   Calicut) → Log Activity, type 📞 Call, Notes filled, "Next Action *"
   tab: "zz ATT E2E C2 follow-up", due one week out, "Log". Basheer
   clicks, Claude watches. **Expected:** saved. **Read back:** the
   Opportunity's activity timeline shows 📞 Call; its Next Actions show
   "zz ATT E2E C2 follow-up" with the Call icon, owner Basheer K. —

## D — Closing a next action and the first activity (D3)

1. [Simple] Next Actions → "zz ATT E2E C2 follow-up" (Mims calicut,
   Aster MIMS Calicut) → close it, open "Type *". **Expected:** exactly
   🏥 Visit, 📞 Call, ✉️ Email, 🤝 Meeting, 📝 Note — no Manager Note,
   no training types, no Relationship Support. Cancel, nothing saved. —
2. [Simple] Log Activity on "Mims calicut" (Aster MIMS Calicut) again,
   type 🏥 Visit. **Expected:** the open next action warning and the
   "Close next action" button (a type that needs a next action, D3).
   Pick 🎪 Conference/Expo instead. **Expected:** no warning, button
   "Log". Cancel. —
3. [Complex: multi-step, cancel before save] Pipeline → new Opportunity
   (quick form), fill it in for Aster MIMS Calicut, press Create; in the
   First activity pop-up open "Type *". **Expected:** the same five types
   as D1. Cancel the pop-up — nothing is created (the Opportunity, its
   first activity and next action save together). Check Pipeline: no new
   Opportunity. —

## E — Reports after (D2)

1. [Complex: compare with S1] Stagnant Opportunities, 30 days.
   **Expected:** the same rows and days as S1, except "Mims calicut"
   (Aster MIMS Calicut), gone from the list — C2's Call reset its days to
   0. —
2. [Complex: compare with S2] My Work → Opportunities, 30 days.
   **Expected:** the same as S2, with the same one exception. —
3. [Complex: compare with S3] My Work → My hospitals. **Expected:** the
   same "Last visit" as S3, except Aster MIMS Calicut, now today (C2's
   Call). C1's Conference/Expo changes nothing (it isn't a visit). —
4. [Complex: Claude — script output] Claude re-runs the data-quality
   script on Dev, read-only. **Expected:** section 7a gives the same
   answer as S4. —

## F — Roles and SBUs (D7; Manager Note rule stays in code)

1. [Simple] As Vivek (Sales Staff, Critical Care), top bar Log Activity, open
   "Type *". **Expected:** the 12 types of A1 without 📋 Manager Note
   (hide-check). —
2. [Simple] As Arun Adarsh (Area Manager, Critical Care), the same.
   **Expected:** all 13, in A1's order — the list isn't limited by SBU
   (D7). —
3. [Simple] As Haroon (General Manager), the same. **Expected:** all 13.
   —

## G — Icons and names on other screens (D9)

1. [Simple] As Basheer K, Customer 360 → Aster MIMS Calicut → Activity
   tab. **Expected:** C2's Call shows 📞 and "Call"; older activities show
   the same icons and names as before the build. —
2. [Simple] Reports → Daily Activity Report, today. **Expected:** C1 with
   🎪 Conference/Expo and C2 with 📞 Call, colours as before. —
3. [Simple] My Work → Next actions tab. **Expected:** "zz ATT E2E C2
   follow-up" with the Call icon, as other rows. —

## H — Phone

1. [Complex: phone layout] Phone, tablet and laptop widths (390, 768,
   1280 px), top bar Log Activity, with 🏥 Visit, then 🎪 Conference/
   Expo, then 🤲 Relationship Support picked; open "Type *" and every
   tab. **Expected:** the type list reads in full, fields and tabs fit
   the form, nothing runs past its edge — as before the build. —
