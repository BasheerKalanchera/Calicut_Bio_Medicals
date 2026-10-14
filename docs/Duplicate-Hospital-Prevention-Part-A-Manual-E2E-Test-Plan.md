<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Duplicate Hospital Prevention, Part A (one press only) — Manual E2E Test Plan

**Covers:** `docs/Duplicate-Hospital-Prevention-Implementation-Plan.md`,
Part A (A1–A3): "Create Anyway" on the New Customer form and "Change
Anyway" on the Edit Customer form.
**Built:** `f04d309` (2026-10-14). Steps 1–18 Pass on Dev 2026-10-14; step 19 after the UAT move.
**Where:** Dev (`main`); section D is a look-only check on UAT after the
next full move, which carries Part A (Basheer, 2026-10-13).

## Checked against live data

Checked read-only on Dev, 2026-10-13, through the admin connection (no
visibility rule is under test here, so the three RLS settings were not
needed).

- **Who sees:** n/a — no visibility change. Tester: Basheer K (SBU Manager,
  Imaging). That role may add a hospital without an assigned territory
  (`account/service.py:25`), so any zone can be picked.
- **Who can approve:** n/a — no approval step.
- **Who can save:** any signed-in user may add or rename a hospital; tester
  Basheer K as above.
- **Existing values:** no hospital named "zz Test duplicate guard…" exists
  on Dev (six test-named hospitals today: "asdf - Test Regression", "Test
  Bangalore Customer", "Test customer 3", "Test Hospital", "Test hospital
  2", "Test hospital 3"). North Kerala holds 12 hospitals. The similar-name
  check looks across the whole zone branch, so the test names below are
  compared only with each other and the North Kerala hospitals.

Button labels, messages and the order of checks are taken from the code,
not the design doc (`AddHospitalModal.tsx`, `Customer360Screen.tsx`,
`FormModal.tsx` on `main`; the warning texts are the same on `uat`). The new "Saving..." and error texts are
confirmed against the built code before the run.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Test data on Dev:** five "zz Test duplicate guard…" hospitals (steps 1,
3 and 5; step 3 was rerun) and one stakeholder "zz Test contact" on "zz Test
duplicate guard 2" (step 16). The app has no delete for hospitals; Basheer
decided (2026-10-14) to delete all of them from the Dev database after the
E2E: the stakeholder first, then the five hospitals, after a read-only
check, shown first, that nothing else is linked to them. The rename steps
reuse "zz Test duplicate guard 2", so nothing more is added.

## Pre-flight

- P1. [Simple] Local screens running from `main` with Part A; the Dev backend needs no restart (no backend change). — **Pass** 2026-10-14: `localhost:5173/demo`, hard refresh after the A1 changes.
- P2. [Simple] Signed in as Basheer K; browser console open (F12 → Console). — **Pass** 2026-10-14: no errors; only the usual React DevTools note and the "apple-mobile-web-app-capable is deprecated" notice, neither comes from a file Part A changed.

## A — New Customer form, "Create Anyway"

1. [Simple] Account Management → add a hospital: Name "zz Test duplicate guard", Zone North Kerala → **Create** (Basheer clicks, Claude watches). **Expected:** the main button shows "Saving..." while saving; the form closes; the hospital appears in the list. — **Pass** 2026-10-14 (Basheer K): form closed, hospital in the list, no warning, no console error. "Saving..." too brief to see on a fast save (the main button showed it before Part A too); the visible greyed-out check is step 3, run on a throttled connection. Exact count checked in step 4.
2. [Simple] Open the New Customer form again: Name "zz Test duplicate guard 2", Zone North Kerala → **Create**. **Expected:** warning "Did you mean **zz Test duplicate guard**? It's already in the directory." with "Use this one instead" and a yellow "Create Anyway" button. (If no warning appears, Claude picks a closer name before going on.) — **Pass** 2026-10-14 (Basheer K, after the Alt + Tab fix and a hard refresh): warning "Did you mean zz Test duplicate guard? It's already in the directory." shown. The two buttons weren't reported separately: "Create Anyway" is used in step 3 and "Use this one instead" in step 6. (The first try of this step, before the fix, was lost to the Alt + Tab form reset; see step 14.)
3. [Complex: three presses inside one moment can't be done by hand reliably] DevTools Network set to "Slow 4G" first, so the saving state lasts long enough to see; Claude gives a one-line console snippet that presses "Create Anyway" three times at once; Basheer pastes and runs it, then sets Network back to "No throttling". **Expected:** "Create Anyway" greys out and reads "Saving..."; the main Create and Cancel buttons grey out too; the form closes once. — **Pass** 2026-10-14 (Basheer K), second try. First try: the open console hid the form, so the greying wasn't seen. Second try, with DevTools undocked and Name "zz Test duplicate guard 4": Basheer saw "Create Anyway" grey out and read "Saving...", Create, Cancel and "Use this one instead" grey out, and the form close once. The snippet's printout 300 ms in: all three "Use this one instead", Cancel and both "Saving..." buttons disabled; only the dropdown fields' blank icon buttons enabled. Basheer ran the second try twice, so it created two hospitals.
4. [Simple] Search Account Management for "zz Test duplicate guard". **Expected:** exactly two hospitals — "zz Test duplicate guard" and "zz Test duplicate guard 2", one of each. — **Pass** 2026-10-14 (Basheer K): four "zz Test duplicate guard…" hospitals = one per save attempt (step 1, the first try of step 3, and the two runs of the second try). The triple press added no extra copy.
5. [Complex: needs one request failed mid-flow] New Customer form: Name "zz Test duplicate guard 3", Zone North Kerala → Create → warning appears → paste Claude's one-shot console snippet, which points the next `POST …/api/v1/accounts` at a closed port and then removes itself (Chrome's request-blocking menu has moved and DevTools can't be driven by Claude) → press "Create Anyway". **Expected:** an error message shows on the form; the buttons come back; no hospital is created. Then **Cancel**. — **First try (Network set to Offline): not as expected, cause is the test step itself, not Part A** 2026-10-14 (Basheer K). "Create Anyway" stayed on "Saving..." with Cancel greyed out. When Network went back online the save went through once, and "zz Test duplicate guard 3" was created (the fifth test hospital). Cause: the app's data library (TanStack Query, default `networkMode: "online"`) doesn't send a save while the browser reports offline; it waits and sends it when the connection returns. So "Offline" never produces an error. Step rewritten to block the request instead, which does produce an error. Console during the try: the 409 is the duplicate warning (expected); the `/auth/me … ERR_INTERNET_DISCONNECTED` lines are the tab-return login re-check failing while offline ("keeping existing session"), and the form wasn't wiped. **Second try: Pass** 2026-10-14 (Basheer K): red "Network Error" on the form, buttons usable again, no hospital created (still five).
6. [Simple] New Customer form: Name "zz Test duplicate guard 3", Zone North Kerala → Create → press **Use this one instead** on the warning. **Expected:** the form closes and the existing hospital opens; nothing is created. — **Pass** 2026-10-14 (Basheer K): form closed, "zz Test duplicate guard 3" opened, still five test hospitals.
7. [Simple] New Customer form: Name "zz Test duplicate guard 3", Zone North Kerala → Create → warning appears → type one more letter at the end of the name. **Expected:** the warning and "Create Anyway" disappear at once; the Create button is back. Press **Cancel**; nothing is created. — **Pass** 2026-10-14 (Basheer K): warning disappeared, Create button back, still five test hospitals.

## B — Edit Customer form, "Change Anyway" (rename)

8. [Simple] Open "zz Test duplicate guard 2" → Edit → change the name to "zz Test duplicate guard." (with a full stop) → **Save**. **Expected:** warning "Did you mean **zz Test duplicate guard**? It's already in the directory." with a yellow "Change Anyway" button. — **Pass** 2026-10-14 (Basheer K): yellow warning with a list of similar hospitals. With five test hospitals there's more than one match, so the code shows "This looks similar to hospitals already in the directory:" instead of "Did you mean…" (`Customer360Screen.tsx:1406–1407`).
9. [Complex: three presses inside one moment] Same console snippet, for "Change Anyway" (Basheer clicks, Claude watches). **Expected:** "Change Anyway" greys out and reads "Saving..."; Save and Cancel grey out; the form closes once; the hospital's name now reads "zz Test duplicate guard.". — **Pass** 2026-10-14 (Basheer K): buttons greyed out, form closed once, name reads "zz Test duplicate guard." (confirmed by sight; the console printout wasn't pasted).
10. [Simple] Sign in as Abdul Latheef P (Admin): the Audit Log is shown only to Admin and General Manager (`AUDIT_LOG_ADMIN_ROLES`, `AuditLogScreen.tsx:16`), and Basheer K is an SBU Manager. Audit Log → filters Account + Changed (it has no filter for one hospital). Afterwards sign back in as Basheer K for step 11. **Expected:** exactly one name change recorded for this rename. — **Pass** 2026-10-14 (Abdul Latheef P, Admin, run by Basheer): one CHANGED card, "zz Test duplicate guard 2" → "zz Test duplicate guard.".
11. [Complex: needs one request failed mid-flow] Signed in as Basheer K. Edit → change the name back to "zz Test duplicate guard 2" → Save → if the warning shows, paste Claude's one-shot console snippet that fails the next `PUT …/api/v1/accounts/…` (as in step 5; DevTools "Offline" only holds the save until reconnect) → press "Change Anyway". **Expected:** error on the form, buttons back. Press "Change Anyway" again (the snippet has already removed itself). **Expected:** saves once; name reads "zz Test duplicate guard 2". — **Pass** 2026-10-14 (Basheer K): warning shown, "Network Error" on the form with buttons back, second press saved once, name reads "zz Test duplicate guard 2".
12. [Simple] Edit → change the name to "zz Test duplicate guard." again → Save → warning appears → delete the full stop. **Expected:** the warning and "Change Anyway" disappear at once. Press **Cancel**; the name still reads "zz Test duplicate guard 2". — **Pass** 2026-10-14 (Basheer K).

## C — Nothing else changed

13. [Simple] New Customer form, type any name, press **Cancel**. **Expected:** the form closes; nothing created; reopening shows an empty form with no warning left over. — **Pass** 2026-10-14 (Basheer K): closed, nothing created, reopened empty with no warning. The zone was empty too: Basheer K is an SBU Manager with no home zone on file, and the form fills in the zone only when the user has one (`AddHospitalModal.tsx`, reset effect).
14. [Simple] New Customer form: Name "zz Test duplicate guard 3", Zone North Kerala → Create → warning appears → Alt + Tab to a window that fully covers the browser, wait 5 seconds, Alt + Tab back. **Expected:** the name, the zone and the warning are all still there (before this fix, coming back emptied the form — Basheer, 2026-10-14). Press **Cancel**; nothing is created. — **Pass** 2026-10-14 (Basheer K): name, zone and warning all still there after Alt + Tab.

## R — Regression: other forms in the shared form window

Part A also changed the shared pop-up window that 31 forms on 16 screens
use (counted in the code, 2026-10-14): it now accepts one press of its
Save button at a time. These steps check that ordinary forms still show
their errors, recover, save and close as before. Only R1 saves anything,
and only to the test hospital.

15. [Simple] Hospital page of "zz Test duplicate guard 2" → Stakeholders tab → add a stakeholder → press **Create** with the name empty. **Expected:** "Stakeholder name is required" at the top of the form; Create and Cancel work again straight away. — **Pass** 2026-10-14 (Basheer K).
16. [Simple] Same form: Name "zz Test contact" → **Create** (Basheer clicks, Claude watches). **Expected:** the button reads "Saving..." briefly; the form closes once; exactly one "zz Test contact" in the Stakeholders tab. — **Pass** 2026-10-14 (Basheer K).
17. [Simple] Open any Opportunity → **Edit** → clear the name → **Save**. **Expected:** "Name is required" at the top of the form; the buttons work again. Press **Cancel**; nothing is changed. — **Pass** 2026-10-14 (Basheer K).
18. [Simple] Target Planning, signed in as Basheer K (every role except Admin has its own plan section — `NO_PERSONAL_TARGET_ROLES`, `TargetPlanningScreen.tsx:70`) → in your own plan section, find a quarter whose button reads **Plan** (not "Continue" or "Revise" — those open a plan that already has hospitals, so Save draft would really save) → press it → with no hospitals added, press **Save draft**. **Expected:** "Add at least one hospital to the plan." at the top of the form; both buttons work again. Press **Cancel**; nothing is saved. — **Pass** 2026-10-14 (Basheer K).

## D — After the move to UAT (look only)

19. [Simple] On UAT, open the New Customer form and close it with Cancel. **Expected:** the form opens and closes normally; nothing is saved. —
