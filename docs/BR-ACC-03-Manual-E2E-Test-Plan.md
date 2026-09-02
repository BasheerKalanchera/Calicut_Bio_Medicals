# BR-ACC-03 (Duplicate Hospital Warning) — Manual E2E Test Plan

**Status as of 2026-08-31:** Basheer exercised the create/edit
duplicate-warning UI directly (button wording/sizing/layout fixed based
on live feedback) — no issues found there. The full group-by-group plan
below has not been explicitly confirmed complete end to end; use it to
finish the pass before committing.

Built against real accounts in the dev DB. **Setup:** start both dev
servers — this is the live shared dev DB, not disposable, so any hospital
created during testing needs cleanup afterward via Supabase SQL Editor.

**Test users available** (role → zone):
- Admin/GM (unrestricted): Basheer K, Abdul Latheef P, Haroon Sidheeq —
  all zone=None
- Reps (restricted to their own branch): Nishad K V (North Kerala), Arun
  Adarsh (South Kerala), Fazal (Kasaragod), Shruthi (Bangalore), Fahad
  (Mangalore), Vivek (Alappuzha)
- No rep with zero zone assigned exists yet — see Group D.

## Group A — Add Hospital: exact-duplicate + near-duplicate warning (baseline)
1. Log in as any rep. Customer Directory → Add Hospital.
2. Type the exact name of an existing hospital in your zone → Create.
   Expect: hard error, "already exists."
3. Type a close-but-not-exact variant of an existing hospital's name →
   Create. Expect: yellow "Did you mean X?" warning, **Use this one
   instead** / **Create Anyway** buttons.
4. Click **Use this one instead** → navigates to that hospital, modal closes.
5. Repeat step 3, click **Create Anyway** → hospital created for real
   (clean up after).

## Group B — Add Hospital: zone picker restricted to the rep's own territory
1. As a rep (e.g. Nishad, North Kerala), Add Hospital → Zone field, type
   a South Kerala town. Expect: no results.
2. Same field, type a North Kerala town. Expect: shows up.
3. As Admin/GM, same field, type anything anywhere. Expect: unrestricted.

## Group C — Add Hospital: zone-hierarchy bug fix (state-level zone)
Only Admin/GM can reach this (reps' picker no longer offers state-level
zones).
1. As Admin/GM, Add Hospital → Zone field, pick the bare **Kerala** state
   entry itself.
2. Type a name close to a real Aster-branded hospital. Expect: warning
   fires, lists Aster hospitals from across the whole state (both North
   and South Kerala branches).

## Group D — Add Hospital: zone-less rep hard block
No existing rep has this state. Create a throwaway Sales Staff user via
User Directory without assigning a zone, or skip — covered by 4 backend
unit tests (`TestZoneAssignmentRequired`) already.
1. As that rep, try Add Hospital. Expect: "No territory assigned yet...
   ask your manager" dialog, form never opens.

## Group E — Edit Hospital: same zone-picker restriction as Add
1. As a rep, open an existing hospital → Edit → Zone field, type a town
   outside your own branch. Expect: no results.
2. As Admin/GM, same screen. Expect: unrestricted.

## Group F — Edit Hospital: rename triggers the same duplicate check
1. Rename a hospital to the exact name of a different existing hospital →
   Save. Expect: hard error, "already exists."
2. Rename to a near-duplicate of a different real hospital → Save.
   Expect: "Did you mean X?" warning, **Use this one instead** / **Change
   Anyway**.
3. Click **Use this one instead** → navigates away, edit abandoned.
4. Repeat step 2, click **Change Anyway** → rename goes through.
5. Self-exclusion check: edit a hospital changing only an unrelated field
   (not the name) → Save. Expect: no duplicate warning at all.

## Group G — Regression: screens NOT touched by this session
Spot-check the other 4 zone pickers still work exactly as before (they
hit a different, untouched endpoint):
1. Territory Admin screen — zone search still unrestricted for Admin.
2. User Directory — assigning a zone to a user still shows every zone.
3. Customer 360's other zone-adjacent pickers, Opportunity Pipeline's
   zone filter — still unrestricted for everyone.
