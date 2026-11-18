# "Hospital" → "Customer" and "deal" → "Opportunity" wording — Implementation Plan

**Status:** Approved 2026-11-16 (Basheer). Build started by Build & Test
2026-11-16. E2E: `docs/Customer-Wording-Manual-E2E-Test-Plan.md`.
**Traceability rows:** none (wording and code names only; no signed
feature changes).
**Design / discussion:** replaces the Backlog entries "Wording: "Hospital"
→ "Customer" across the app" and "Wording: "deal" → "Opportunity" across
the app and docs" (moved here 2026-11-16; their history is in git).

## Decisions

- Say "Customer" wherever any customer type is meant; keep "Hospital" only
  where only hospitals are meant — Basheer, 2026-10-26; approved by Haroon
  (reported by Basheer, 2026-11-16).
- The "+ Add Hospital" button on the New Opportunity form becomes
  "+ Add Customer"; the "New Customer" title stays — Basheer, 2026-10-25.
- Done in the same pass and the same commit as the remaining "deal" →
  "Opportunity" wording — Basheer, 2026-10-26.
- "Stagnant Deals" becomes "Stagnant Opportunities" (already done in
  `65ab36a`); the docs that name it are updated in this pass — Basheer,
  2026-10-25.
- Three groups. **A, change (step 1):** every word a user reads that
  means any customer. **B, rename (step 2):** names inside the code that
  say "hospital" or "deal" for any customer or an Opportunity — file
  names, names used only in the screens, names the server and screens
  share, and the two server web addresses — so the code matches the
  screens. **C, keep:** the four customer type names and codes
  (Multispeciality Hospital, Specialty Hospital, Medical College Hospital,
  Government Hospital), the example email "doctor@hospital.com" and the
  help line's example "a hospital expansion" — Basheer, 2026-11-16.
- Group B is its own commit after the wording commit, so that if a screen
  stops loading it's clear which change caused it — Basheer, 2026-11-16.
- Kept even in the code rename: old database change files (e.g.
  `0055_hospital_wise_target_planning.py`), whose names are part of the
  record of what was applied; Progress-Archive and dated review files —
  Basheer, 2026-11-16.
- The menu item and screen "Rate Hospitals" becomes "Rate Customers"; the
  My Work tab and card "My hospitals" become "My customers"; the Audit Log
  record type "Plan Hospital" becomes "Plan Customer" — Basheer, 2026-11-16.
- Target Planning's "Hospitals" column, the plan dialog's "Hospitals"
  section and its messages say "Customers": the plan dialog lets a rep
  add any customer type, not only hospitals (no customer-type filter in
  the planning or account search code, read 2026-11-16) — Basheer, 2026-11-16.
- The side-menu item, the screen's own heading and the "?" help title
  "Pipeline" become "Opportunity Pipeline" ("Opportunity Pipeline — Help"),
  so they no longer look like the separate "Pipeline Report" item; done in
  the wording commit (menu and heading `DemoApp.tsx`, help title
  `helpContent.tsx`); the user manual's "Pipeline" wording follows in
  step 5 — Basheer, 2026-11-18.
- The old prototype screen (`App.jsx`, address `/prototype`, 93 of the
  178 lines found) is left alone: it isn't in the menu, and its removal is
  its own Backlog entry — Basheer, 2026-11-16.
- Built by Build & Test, not alongside the Activity Type table build: both
  change the Log Activity form, so running them in parallel would clash —
  Basheer, 2026-11-16.
- Goes to UAT with the next full move, not as a hotfix — Basheer, 2026-11-16.
- Three of the changed screens still break the MUI standard, and the
  commit check refuses a changed screen until it is fixed whole: the
  Projects list (41 typed colours, 25 typed text sizes), the Quick Lead
  pop-up (16, 10) and the Audit Log (1, 5). They are restyled in this
  build as their own commit first, with the usual per-file check that
  nothing looks different, so the wording commit stays wording only —
  Basheer, 2026-11-16.

## Figures and sources

- 178 lines in the screens with "Hospital" or "Hospitals" as a word
  (comments, imports, tests and the generated API file left out) —
  search of `sales-os-app/src`, 2026-11-16.
- 93 of those 178 are in the old prototype screen `App.jsx` and 3 in
  `DemoApp.tsx` — same search.
- About 56 lines in group A, 10 in group C, the rest group B — my reading
  of that search's 85 lines outside the prototype, 2026-11-16; to be
  re-counted at step 1.
- 13 server messages mentioning "hospital" (account, activity and
  planning) — search of `backend/app`, 2026-11-16.
- 16 screen lines saying "deal" (1 on Opportunity Detail, 15 in the help
  panels) and 3 server messages (document removal, split edit Won and
  Lost) — search, 2026-11-16. The Backlog's earlier "about 25" was an
  estimate before `65ab36a`.
- `docs/UAT-User-Manual.md`: 49 lines mention "hospital", 4 say "deal" —
  counted 2026-11-16 (not all 49 change; group C applies).
- Traceability: 24 "deal" changes drafted, 15 of them client-visible —
  Backlog, doc tidy-up 2026-10-12. `Audit-Trail-Redesign-Implementation-Plan.md`:
  14 places — same source.
- Server-message tests: `test_document_router.py`,
  `test_document_service.py`, `test_opportunity_router.py` check the
  "deal" message text — search of `backend/tests`, 2026-11-16.
- MUI check in report mode (`check-mui-standard.js --all`, 2026-11-16):
  21 files, 279 lines break the standard; of this plan's files only
  `ProjectDirectoryScreen.tsx` (66 lines), `QuickLeadModal.tsx` (26) and
  `AuditLogScreen.tsx` (6), split by type with the same rules.
- Names inside the code (group B, 2026-11-16 search): 2 screen files
  (`AddHospitalModal.tsx`, `RateHospitalsScreen.tsx`) and 1 migration
  file; about 22 distinct names on the screens side and 11 on the server
  side; no database table or column has "hospital" in its name (only the
  four customer type codes); 1 server web address
  (`/master-data/zones/search-for-hospital`). "deal": 1 screen file
  (`StagnantDealsReportScreen.tsx`), about 9 names, 1 web address
  (`/reporting/stagnant-deals`).
- The build worktree has no commits that aren't in `main` — git,
  2026-11-16; so the earlier wait (Backlog, 31 Oct and 1 Nov) is over.

## 1. In plain terms

Customers include clinics, dealers and diagnostic centres, not only
hospitals, but many screens still say "hospital". After this change the
screens, pop-ups, messages, help panels and the user manual say
"customer" wherever any customer is meant. For example, "+ Add Hospital"
on the New Opportunity form becomes "+ Add Customer", the Rate Hospitals
screen becomes Rate Customers, and My Work's "My hospitals" tab becomes
"My customers". "Hospital" stays where it really means a hospital, such
as the customer type "Government Hospital".

In the same pass, the last places that still say "deal" say
"Opportunity": one line on Opportunity Detail ("this deal is past Demo
stage"), most help panels, and three messages a user sees when they
aren't allowed to remove a document or change a split.

Nothing that is saved changes, and no screen works differently. Only the
words change. It lands on Dev first and goes to UAT with the next full
move.

### On a phone

No layout changes. The new words are about the same length as the old
ones ("My hospitals" and "My customers" are both 12 letters; "Rate
Hospitals" and "Rate Customers" both 14), so tabs, menu items and card
labels keep their place. The step 4 walk checks the My Work tabs and the
Target Planning cards at phone width.

## 2. Build order

Three commits, in this order (Basheer, 2026-11-16): the MUI restyle of
three screens; the wording pass (steps 1–6); the code-names rename
(step 7). Each is its own commit so that a problem points at one change.
Dev keeps working throughout, since each commit is complete on its own.

0. MUI restyle, its own commit: the Projects list, the Quick Lead pop-up
   and the Audit Log, with no wording changes. Each typed colour and text
   size is replaced by the theme name with the same value, with the usual
   per-file check that nothing looks different; tests, type check and
   lint, then Basheer's look on Dev at desktop and phone width.
1. Re-run the search on the current `main` and list every line in group
   A, B or C. Show the list to Basheer only if it differs from this plan
   (a new screen or more than about 10 lines more).
2. Screens: change every group A line, including the help panels.
3. Server messages: the 13 "hospital" and 3 "deal" messages, and the
   three test files that check that text.
4. Checks: full backend tests, type check, lint; a walk on Dev at
   desktop and phone width over every screen in section 3.
5. Docs in the same commit: the user manual, the agreed help wording in
   the help plan's section 7, the 24 Traceability changes and the 14 in
   the Audit Trail Redesign plan, and the docs naming "Stagnant Deals",
   including the My Work plan and its test plan section E
   (Progress-Archive and dated review files stay as written). In
   Traceability, signed requirement wording and PRD section titles (3.9,
   3.10) stay as written (Basheer, 2026-10-12, from the Backlog entry).
6. After the commit, Plan & Chore regenerates the client scorecard and
   shows Basheer the exact client-visible change before republishing.
7. Code-names commit (group B): rename the 3 screen files, the names used
   only in the screens, the names the server and screens share, and the
   two server web addresses (`/master-data/zones/search-for-hospital`,
   `/reporting/stagnant-deals`); regenerate `api.ts`. Re-run the search
   first and list every name. Server, screens and `api.ts` change in the
   same commit. Full backend tests, type check and lint, then a Dev walk
   over every screen in section 3's second list. Users see no difference.

## 3. What could be affected

Nothing that is fetched or saved changes, and the screens don't depend on
the wording of any server message (search 2026-11-16: no screen checks a
message's text). So the checks are about how things look, one per screen
with changed words:

- Customer Directory and Customer 360 (similar-name warning, next actions
  empty text, New Customer pop-up).
- New Opportunity form ("+ Add Customer"), Log Activity form ("None —
  customer-level"), Marketing Lead create pop-up.
- My Work: Summary card and "My customers" tab.
- Target Planning list and cards, the plan dialog, the plan details, and
  Target vs Actuals for one person ("By customer").
- Rate Customers (menu item, search box, table, empty text).
- Customer with No Activity, Opportunity Pipeline and Project Directory
  search boxes, Audit Log record type filter.
- Opportunity Detail (High Priority line), the help panels, and the three
  server messages (document removal, split change on Won and on Lost).

Step 7 (code names) does change what the server and screens pass to each
other: the names of shared fields and two web addresses. Every screen
that uses one is checked on Dev before and after (list from the
2026-11-16 search; step 7 re-runs it):

- Target Planning list and cards, the plan dialog and plan details
  (`planned_hospitals`, `hospital_level_only`).
- My Work and the Weekly Follow-up list.
- Target vs Actuals for one person (`TargetVsActualHospital`).
- Rate Customers.
- Stagnant Opportunities report (`/reporting/stagnant-deals`,
  `avg_deal_size_lakhs`).
- The New Customer pop-up, zone search (`/master-data/zones/search-for-hospital`).

A rep with the app already open at the UAT move may see a screen fail to
load until they reopen it (the app updates itself when opened —
`vite.config.ts`, auto-update); UAT moves run at 07:00.

## 4. Not in this plan (with reasons)

- Old database change files and the four customer type codes (e.g.
  `GOVERNMENT_HOSPITAL`): they really are hospitals, or record what was
  applied.
- The old prototype screen (`App.jsx`): not in the menu; its removal is
  its own Backlog entry.
- Database table and column names: not visible; no migration.
- Progress-Archive and dated review files: they record what was said at
  the time.

## 5. Business rules and records to update

- No business rule changes.
- Backlog: both wording entries moved out 2026-11-16 (plan approved);
  "Waiting on people" dropped the Haroon line (answered); the three MUI
  screens leave "Front-end standardisation fixes, by screen" when step 0
  is committed.
- Traceability and the client scorecard: step 5 and step 6 above.

## 6. Technical addendum

- Screens (group A, 2026-11-16 search): `AddHospitalModal.tsx:226, 307`;
  `QuickLeadModal.tsx:506`; `LogActivityModal.tsx:461`;
  `MarketingLeadCreateModal.tsx:145`; `TargetPlanDetails.tsx:48, 56, 76`;
  `TargetPlanDialog.tsx:159, 164, 234, 257, 259, 266, 319, 328`;
  `TargetVsActualsPerson.tsx:98, 100, 123`; `AuditLogScreen.tsx:30`;
  `Customer360Screen.tsx:1188, 1209`; `MyWorkScreen.tsx:43, 292, 294,
  298, 562, 575, 616, 619, 624, 686, 699`;
  `NoActivityCustomersReportScreen.tsx:50, 223`;
  `OpportunityPipelineScreen.tsx:441`; `ProjectDirectoryScreen.tsx:484,
  577`; `RateHospitalsScreen.tsx:66, 71, 112, 121, 134`;
  `TargetPlanningScreen.tsx:754, 772, 847, 875`; `DemoApp.tsx:105, 838`;
  `helpContent.tsx:49, 61, 72, 80, 84, 88, 122`.
- Group C (kept): `AddHospitalModal.tsx:35, 36, 40, 41`;
  `Customer360Screen.tsx:1261, 1262, 1266, 1267, 1276`;
  `helpContent.tsx:59`.
- "deal": `OpportunityDetailScreen.tsx:1947`; `helpContent.tsx:29, 84,
  109, 111, 117, 122, 126, 134, 136, 143, 147, 149, 158, 187, 188`.
- Server messages: `account/service.py:133, 166, 235, 257`;
  `activity/service.py:432, 626, 656, 670`; `planning/service.py:188,
  193, 202, 206, 1342`; `document/service.py:122`;
  `opportunity/service.py:52–54`. Routes `/reporting/stagnant-deals` and
  `/master-data/zones/search-for-hospital` are renamed in step 7.
- Tests: `tests/domains/document/test_document_router.py`,
  `test_document_service.py`, `tests/domains/opportunity/test_opportunity_router.py`.
- No migration in any step. Steps 0–6: `api.ts` unchanged (no schema
  change). Step 7: schema and route names change, so `api.ts` is
  regenerated in the same commit (the api.ts guard requires it).
- Step 7 names (2026-11-16 search; re-run before building): screens about
  15 local names (e.g. `setShowAddHospital`, `searchZonesForHospital`,
  `WeeklyFollowupHospitalList`, `isHospitalLevel`); shared about 11
  (e.g. `hospital_level_only`, `planned_hospitals`, `hospitals_in_view`,
  `TargetVsActualHospital`); "deal" about 9 (e.g. `StagnantDealsResponse`,
  `StagnantDealRow`, `avg_deal_size_lakhs`, `getStagnantDeals`). Files:
  `AddHospitalModal.tsx`, `RateHospitalsScreen.tsx`,
  `StagnantDealsReportScreen.tsx`.
