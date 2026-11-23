<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Manager Note Privacy — Manual E2E Test Plan

**Covers:** `docs/Manager-Note-Privacy-Implementation-Plan.md` (Approved 20 Nov
2026, D1–D11); rule in `docs/Business-Rules.md` BR-ACT-02.
**Built:** `dac003f` (migration 0067, applied to Dev, `alembic current` =
`0067 (head)`); automated Dev check `d7defb0`, extended by `320981e` (10 passed
with `RUN_DEV_DB_TESTS=1`); review fix `ee5be3f` (the Activity Levels report no
longer counts Manager Notes).
**Where:** Dev. Written 22 Nov 2026, updated 23 Nov, not yet run (0 of 27). The
pre-E2E `/code-review` (high: a database-rule change) was run 22 Nov; its
findings 1 and 6 are fixed (`ee5be3f`, `320981e`), finding 4 is a watch line in
step 8, findings 2, 3 and 5 were left as they are.

**In plain words.** A Manager Note is now shown only to the rep it is about,
the manager who wrote it, Admin, the General Manager, the SBU Manager of the
rep's business unit, and Area Managers who are above the rep or who cover the
customer's zone in the rep's business unit. Everyone else no longer sees it:
not on the customer's Activity tab, not on the Opportunity's Activity tab, not
in the Daily Activity Report. Visits, calls and ordinary notes are unchanged.
There is no screen change and no "private" label — a hidden note is simply
missing from the list. One report changes: Insights → Team Activity no longer
counts Manager Notes at all, so a person's bar is the same number for every
manager (steps 3b, 5b, 9b, 20b, 21b). Almost everything is checked on the 24 Manager Notes
already on Dev; only the zone-only Area Manager case needs one new save (step
4). **That one Manager Note stays on Dev for good** — Activities cannot be
deleted.

## Checked against live data

Checked read-only on Dev, 22 Nov 2026 (Alembic 0067), each login's own user,
role and business unit set and verified, one read-only transaction, rolled
back. Scripts and output are in the session scratchpad:
`dev_mn_e2e_cast_2026-11-22.txt`, `dev_mn_e2e_counts_2026-11-22.txt`,
`dev_mn_e2e_other_2026-11-22.txt`. **Re-run 23 Nov:** the same three scripts,
output byte-identical to 22 Nov (files `..._2026-11-23.txt`), so every count
below stands. **Re-run again on the day of the run** if anyone has logged a
Manager Note on Dev since.

**Insights → Team Activity** (steps 3b, 5b, 9b, 20b, 21b) shows a rolling 30
days (today minus 30 days to today), so its figures can't be written here: on
the run day, Claude gives the list from a Dev read-only query. The Manager
Notes inside the window on 23 Nov are 3 (31 Oct about Rudrappa, 31 Oct and 7
Nov about Basheer K); the 31 Oct ones leave the window on 1 Dec and the 7 Nov
one on 8 Dec. A note counts for the person it is about, not the writer. After
step 4 the new note about Rudrappa is inside the window too, and is the check
that works on any run day.

- **Who sees:** counts of Manager Notes per login per customer and per
  Opportunity are in the steps below. Hide-check people, picked from live data:
  Nishad K V (covers North Kerala, but Critical Care) sees 0 notes on Al Shifa
  Hospital Perinthalmanna and on aster hospital; Fahad (split + reminder holder
  on "USG M/c - Test Aug 18", Aster MIMS Calicut) sees 0 of its 2 notes; Vivek
  (reminder holder on "usg m/c", aster medicity) sees 0 of its 1 note; Fazal
  sees 6 of the 10 notes on Al Shifa Hospital Perinthalmanna, not the 4 about
  Rudrappa. Every one of the 11 active logins opened all six customers.
- **Who can approve:** n/a — Manager Notes have no approval step.
- **Who can save:** only Admin, General Manager, SBU Manager and Area Manager
  see Manager Note in the Type list (code, `LogActivityModal.tsx`). The "This
  Note Is For" picker offers all 12 active users: Abdul Latheef P, Arun Adarsh,
  Basheer K, Fahad, Fazal, Haroon Sidheeq, Marketing Test User, Marketing User,
  Nishad K V, Rudrappa, Shruthi, Vivek.
- **Existing values:** 24 Manager Notes on Dev (10 unlinked), oldest 22 Jul,
  newest 7 Nov 2026. aster hospital (Kozhikode) has no activity at all today.
  Other customers: Al Shifa Hospital Perinthalmanna 10 notes, Aster MIMS
  Calicut 4, aster medicity 2, another hospital 5, Aster DM 2.

Button labels, messages and the order of checks are taken from the code, not
the design doc: **Log Activity** (opens the pop-up), **Type \***, **This Note
Is For \***, **Opportunity (optional)** with "None — customer-level", **Urgent
— notify immediately**, and the **Log** button.

## Figures and sources

- Every Manager Note count below, per login and per customer or Opportunity —
  Dev read-only query as each login, 22 Nov 2026 (`dev_mn_e2e_counts_2026-11-22.txt`)
- 24 Manager Notes, their customers, who they are about, who wrote them, which
  are linked — Dev read-only query, 22 Nov 2026 (`dev_mn_e2e_cast_2026-11-22.txt`)
- Who reports to whom, business units, Area Manager zones — Dev read-only
  query 20 Nov (`dev_manager_note_people_2026-11-20.txt`) and the 22 Nov cast
  file; Nishad K V is Critical Care, Arun Adarsh Critical Care, Fazal and
  Shruthi Imaging
- Fahad: split and reminder on "USG M/c - Test Aug 18" (Aster MIMS Calicut);
  Fazal: split on "usg m/c" (aster medicity); Vivek: reminder on "usg m/c"
  (aster medicity) — `dev_mn_e2e_cast_2026-11-22.txt`, section 2
- Calls, emails, meetings on the customers (Al Shifa Hospital Perinthalmanna 3
  calls; another hospital 10 calls, 1 email, 1 meeting) — Dev read-only query as
  Nishad K V, 22 Nov (`dev_mn_e2e_other_2026-11-22.txt`)
- "Nine notes logged on 9 Sep" — counted from the cast file, dates read in UTC;
  the report may show a different number, so step 3 only asks to note it
- Rudrappa, Haroon, "Privacy E2E note about Rudrappa" — names are real Dev
  users; the note text is a made-up example
- Largest customer list is 36 rows (Aster MIMS Calicut, Admin's view), under
  the 50 the screen loads — counted from the 22 Nov other-activities file plus
  its 4 notes; page size 50 in `backend/app/domains/activity/router.py`
- 1622 passed, 10 skipped — full backend pytest after `320981e`, 23 Nov 2026
- The Team Activity screen: "last 30 days", manager roles only (SBU Manager,
  Area Manager, Admin, General Manager), the period is today minus 30 days —
  `sales-os-app/src/screens/InsightsDashboardScreen.tsx` lines 27, 133–135 and
  304; a person's count is the activities logged under their name —
  `backend/app/domains/reporting/repository.py` `activity_levels`
- Notes inside the 30 days, 3 — counted from the 23 Nov cast file (dates in
  UTC): 31 Oct, 31 Oct, 7 Nov

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]`. Saves to Dev are "Basheer clicks,
Claude watches"; Claude reads the record back in the app. Steps are grouped by
login (11 logins, A to K); switch only when the next group starts. "Notes"
means the grey **Manager Note** badge on a row; calls, visits and the rest are
not counted unless said.

**Phone:** no screen is added or changed (plan D7), so only one light
`[Complex: phone layout]` step is included (step 19), required by the template:
the Activity tab with a shortened list.

**Opportunities:** each one named with its hospital in brackets.

## Pre-flight

- P1. [Simple] Dev backend restarted since migration 0067 (no frontend change,
  so no screen restart needed). —
- P2. [Simple] Basheer can sign in as each of the 11 people in the groups
  below; say now if any login (Fahad, Vivek, Arun Adarsh, Nishad K V) is not
  available, and that group is recorded as skipped. —
- P3. [Simple] Counts re-run on the day (Claude, read-only), and nobody has
  logged a Manager Note on Dev since 22 Nov. Re-run 23 Nov: identical to
  22 Nov; repeat if the run is on a later day. —
- P4. [Simple] Claude has the Team Activity list for the run day (read-only
  Dev query, no Manager Notes counted), for steps 3b, 5b, 9b, 20b, 21b. —

## A — Haroon Sidheeq (General Manager): baseline and the one save

1. [Simple] Customer 360 → Activity tab, each of six customers; count the
   Manager Note badges. **Expected:** Al Shifa Hospital Perinthalmanna 10;
   Aster MIMS Calicut 4; aster medicity 2; another hospital 5; Aster DM 2;
   aster hospital 0. —
2. [Simple] Opportunity → Activity tab, three Opportunities. **Expected:**
   "USG M/c - Test Aug 18" (Aster MIMS Calicut) 2; "usg m/c" (aster medicity)
   1; "New opportunity for hospital pick" (Al Shifa Hospital Perinthalmanna) 4. —
3. [Simple] Daily Activity Report (side menu), Date 9 Sep 2026, Team Member on
   All. **Expected:** Manager Note rows are listed. Note how many; step 18
   compares. —
3b. [Simple] Insights → **Team Activity** tab ("Team Activity — last 30
   days"). **Expected:** each person's number equals Claude's list for the run
   day (P4), with no Manager Note counted. Write down every person's number;
   steps 9b, 20b and 21b compare with it. Note Rudrappa's number, or that he
   is not listed. —
4. [Simple] Customer 360 → aster hospital (Kozhikode) → Activity tab →
   **Log Activity**: **Type** = Manager Note; **This Note Is For** = Rudrappa;
   **Opportunity** left on "None — customer-level"; **Urgent** unticked; text
   "Privacy E2E note about Rudrappa"; click **Log**. *Basheer clicks, Claude
   watches.* **Expected:** saves without an error; the Activity tab shows 1
   Manager Note, about Rudrappa, written by Haroon Sidheeq. —
5. [Simple] Customer 360 → Al Shifa Hospital Perinthalmanna → Activity tab.
   **Expected:** still 10 Manager Notes (nothing else moved). —
5b. [Simple] Insights → **Team Activity** tab; leave the screen and come back
   (or reload) so it refreshes. **Expected:** Rudrappa's number is exactly what
   you noted in step 3b (or he is still not listed): the note saved in step 4
   is inside the 30 days, but Manager Notes are not counted. Nobody else's
   number moved. —

## B — Fazal (Area Manager, Imaging): the zone-only case

6. [Simple] Customer 360 → aster hospital (Kozhikode) → Activity tab.
   **Expected:** 1 Manager Note, about Rudrappa, written by Haroon Sidheeq.
   Rudrappa reports to Shruthi, not Fazal; Kozhikode is in Fazal's area and
   both are Imaging — the one case Dev's old notes could not show. —
7. [Simple] Customer 360 → Activity tab, the other five customers.
   **Expected:** Al Shifa Hospital Perinthalmanna 6 (the 5 about him and 1
   about Fahad, his rep; not the 4 about Rudrappa); Aster MIMS Calicut 2;
   Aster DM 1; aster medicity 0; another hospital 0. —
8. [Simple] Opportunity → Activity tab. **Expected:** "USG M/c - Test Aug 18"
   (Aster MIMS Calicut) 2; "New opportunity for hospital pick" (Al Shifa
   Hospital Perinthalmanna) 4; "usg m/c" (aster medicity) opens because he
   holds a split, but shows 0 Manager Notes (its one note is about the SBU
   Manager, which an Area Manager never sees). **Watch (pre-E2E review finding
   4):** on the Customer 360 Activity tabs of steps 6 to 8, the notes linked to
   an Opportunity (the four about him on "New opportunity for hospital pick",
   Al Shifa Hospital Perinthalmanna, and two on "USG M/c - Test Aug 18", Aster
   MIMS Calicut) — follow a note's Opportunity link if the screen shows one. If
   an Opportunity does not open for him, record exactly what he sees (empty
   page, message, error); that is reported to Basheer, not failed on its own. —

## C — Shruthi (Area Manager, Imaging)

9. [Simple] Customer 360 → Activity tab. **Expected:** aster hospital 1 (the
   new note; she is above Rudrappa and does not cover Kozhikode); Al Shifa
   Hospital Perinthalmanna 4 (the four about Rudrappa, none of the six about
   Fahad or Fazal); another hospital 4; Aster MIMS Calicut 1; Aster DM 1;
   aster medicity 0. —
9b. [Simple] Insights → **Team Activity** tab (Shruthi sees herself and her
   team). **Expected:** every person listed has the same number as in step
   3b; people outside her team are simply not listed. Rudrappa's number is
   the one from step 5b. —

## D — Rudrappa (Sales Staff, Imaging)

10. [Simple] Bell. **Expected:** "Haroon Sidheeq left you a manager note", no
    urgent pop-up. Click it: aster hospital's Customer 360 opens on the
    Activity tab with the note highlighted (plan section 3: the bell still
    opens the note). —
11. [Simple] Customer 360 → Activity tab. **Expected:** aster hospital 1; Al
    Shifa Hospital Perinthalmanna 4 (about him only); another hospital 2;
    Aster MIMS Calicut 0; aster medicity 0; Aster DM 0. —

## E — Fahad (Sales Staff, Imaging): split and reminder holder

12. [Simple] Opportunity "USG M/c - Test Aug 18" (Aster MIMS Calicut) →
    Activity tab. **Expected:** the Opportunity opens and its other
    activities show, but 0 Manager Notes (two exist, both about Fazal). —
13. [Simple] Customer 360 → Activity tab. **Expected:** Al Shifa Hospital
    Perinthalmanna 1 (the one about himself); aster hospital 0; every other
    customer 0. —

## F — Vivek (Sales Staff, Critical Care): reminder holder

14. [Simple] Opportunity "usg m/c" (aster medicity) → Activity tab.
    **Expected:** opens, 0 Manager Notes (one exists, about the SBU Manager). —
15. [Simple] Customer 360 → Activity tab. **Expected:** aster medicity 1 (the
    one about him, written by Arun Adarsh); aster hospital 0; every other
    customer 0. —

## G — Arun Adarsh (Area Manager, Critical Care)

16. [Simple] Customer 360 → Activity tab. **Expected:** aster medicity 1 of
    the 2 (the one about Vivek, whom he leads; not the one about the SBU
    Manager); aster hospital 0; every other customer 0. —

## H — Nishad K V (Area Manager, Critical Care): covers the zone, wrong unit

17. [Simple] Customer 360 → Activity tab, all six customers. **Expected:** 0
    Manager Notes on every one, including aster hospital (Kozhikode) and Al
    Shifa Hospital Perinthalmanna: North Kerala covers both, but he is
    Critical Care and the reps are Imaging. Ordinary activities are unchanged:
    Al Shifa Hospital Perinthalmanna still lists its 3 calls; another
    hospital its 10 calls, 1 email and 1 meeting. —
18. [Simple] Daily Activity Report (side menu), Date 9 Sep 2026. **Expected:**
    no row with the Manager Note badge (compare with Haroon's step 3). —
19. [Complex: phone layout] Customer 360 → Al Shifa Hospital Perinthalmanna →
    Activity tab at 390, 768 and 1280 px. **Expected:** the shorter list (3
    calls) looks normal, nothing runs past the card or looks squashed; no
    change of look is expected from this feature. —

## I — Basheer K (SBU Manager, Imaging)

20. [Simple] Customer 360 → Activity tab, six customers, and three
    Opportunities. **Expected:** Al Shifa Hospital Perinthalmanna 10; Aster
    MIMS Calicut 4; another hospital 5; aster hospital 1; aster medicity 1 of
    2 (his own; not Vivek's, a Critical Care rep); Aster DM 1 (the one about
    Fazal; not Haroon's about himself). "USG M/c - Test Aug 18" (Aster MIMS
    Calicut) 2; "usg m/c" (aster medicity) 1; "New opportunity for hospital
    pick" (Al Shifa Hospital Perinthalmanna) 4. —
20b. [Simple] Insights → **Team Activity** tab (the SBU Manager sees the whole
    Imaging team). **Expected:** every person listed has the same number as in
    step 3b, including Basheer K's own number (the notes about him are not
    counted) and Rudrappa's (as in step 5b). —

## J — Abdul Latheef P (Admin)

21. [Simple] Customer 360 → Activity tab, six customers. **Expected:** as
    Haroon in step 1, with aster hospital 1: Al Shifa Hospital Perinthalmanna
    10; Aster MIMS Calicut 4; aster medicity 2; another hospital 5; Aster DM 2. —
21b. [Simple] Insights → **Team Activity** tab. **Expected:** the same numbers
    as Haroon's in step 3b, person for person. —

## K — Marketing User

22. [Simple] Customer 360 → Activity tab, six customers. **Expected:** every
    customer opens and shows 0 Manager Notes (no manager role, no business
    unit). —

## Not repeated here

- A comment on a hidden note: comments follow the note; the 21 Nov Dev check
  found none visible on a note the login cannot see.
- "Last contact" on customer lists: counts only visits, calls, meetings and
  emails, never Manager Notes.
- The by-project activity list: no Project is part of this run.
- UAT: a separate run after the next full move (plan D9), with Basheer's yes
  for the UAT people check.
