<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Duplicate Hospital Prevention, Part A (one press only) — Manual E2E Test Plan

**Covers:** `docs/Duplicate-Hospital-Prevention-Implementation-Plan.md`,
Part A (A1–A3): "Create Anyway" on the New Customer form and "Change
Anyway" on the Edit Customer form.
**Built:** not yet; commit hashes filled in after the fact.
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

**Left on Dev permanently:** two hospitals, "zz Test duplicate guard" and
"zz Test duplicate guard 2" (the app has no delete for hospitals). The
rename steps reuse the second one, so nothing more is added.

## Pre-flight

- P1. [Simple] Local screens running from `main` with Part A; the Dev backend needs no restart (no backend change). —
- P2. [Simple] Signed in as Basheer K; browser console open (F12 → Console). —

## A — New Customer form, "Create Anyway"

1. [Simple] Account Management → add a hospital: Name "zz Test duplicate guard", Zone North Kerala → **Create** (Basheer clicks, Claude watches). **Expected:** the main button shows "Saving..." while saving; the form closes; the hospital appears in the list. —
2. [Simple] Open the New Customer form again: Name "zz Test duplicate guard 2", Zone North Kerala → **Create**. **Expected:** warning "Did you mean **zz Test duplicate guard**? It's already in the directory." with "Use this one instead" and a yellow "Create Anyway" button. (If no warning appears, Claude picks a closer name before going on.) —
3. [Complex: three presses inside one moment can't be done by hand reliably] Claude gives a one-line console snippet that presses "Create Anyway" three times at once; Basheer pastes and runs it. **Expected:** "Create Anyway" greys out and reads "Saving..."; the main Create and Cancel buttons grey out too; the form closes once. —
4. [Simple] Search Account Management for "zz Test duplicate guard". **Expected:** exactly two hospitals — "zz Test duplicate guard" and "zz Test duplicate guard 2", one of each. —
5. [Complex: needs the browser set offline mid-flow] New Customer form: Name "zz Test duplicate guard 3", Zone North Kerala → Create → warning appears → DevTools Network set to Offline → press "Create Anyway". **Expected:** an error message shows on the form; the buttons come back; no hospital is created. Set Network back to Online, then **Cancel**. —
6. [Simple] New Customer form: Name "zz Test duplicate guard 3", Zone North Kerala → Create → press **Use this one instead** on the warning. **Expected:** the form closes and the existing hospital opens; nothing is created. —

## B — Edit Customer form, "Change Anyway" (rename)

7. [Simple] Open "zz Test duplicate guard 2" → Edit → change the name to "zz Test duplicate guard." (with a full stop) → **Save**. **Expected:** warning "Did you mean **zz Test duplicate guard**? It's already in the directory." with a yellow "Change Anyway" button. —
8. [Complex: three presses inside one moment] Same console snippet, for "Change Anyway" (Basheer clicks, Claude watches). **Expected:** "Change Anyway" greys out and reads "Saving..."; Save and Cancel grey out; the form closes once; the hospital's name now reads "zz Test duplicate guard.". —
9. [Simple] Audit Log, filtered to the hospital. **Expected:** exactly one name change recorded for this rename. —
10. [Complex: needs the browser set offline mid-flow] Edit → change the name back to "zz Test duplicate guard 2" → Save → if the warning shows, set Network Offline → press "Change Anyway". **Expected:** error on the form, buttons back. Set Online, press "Change Anyway" again. **Expected:** saves once; name reads "zz Test duplicate guard 2". —

## C — Nothing else changed

11. [Simple] New Customer form, type any name, press **Cancel**. **Expected:** the form closes; nothing created; reopening shows an empty form with no warning left over. —

## D — After the move to UAT (look only)

12. [Simple] On UAT, open the New Customer form and close it with Cancel. **Expected:** the form opens and closes normally; nothing is saved. —
