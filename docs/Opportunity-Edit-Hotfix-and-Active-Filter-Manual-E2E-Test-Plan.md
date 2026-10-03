# UAT Hotfix (Opportunity Edit via Opportunity Page + Customer 360 Active-only Filter) — Manual E2E Test Plan

**Covers:** `docs/Opportunity-Edit-Via-Deal-Page-Hotfix-Plan.md` and
`docs/Customer360-Active-Opportunities-Filter-Implementation-Plan.md`.
**Built:** `a430152` on branch `hotfix/opportunity-edit-via-deal-page` (off
`origin/uat` `143c78e`); on UAT 2026-10-03; merged into `main` as `eb89fa7`.
**Where:** Dev. Screens run from the worktree at `localhost:5174`; Dev
backend and Dev database as usual. A short re-check on UAT follows the push
(section G).

**Data checked read-only on Dev, 2026-10-01** (all three RLS settings
verified per user):
- **Basheer K** (SBU Manager, Imaging) sees: *another hospital* 2 Active of
  4 (Good Marketing lead, USG m/c Active; USG 2 Won; usg Lost);
  *aster medicity* 5 Active of 5; *Aster MIMS Calicut* 10 Active of 11.
- **Nishad K V** (Area Manager, Critical Care) sees *Aster DM* 0 Active of
  1 (New ICU Monitor Opportunity, On Hold).
- Test Opportunity for saves: **New USG Machine - referral test** (Aster MIMS
  Calicut, Imaging, Lead, Active, owner Basheer K, no products, no
  project). Aster MIMS Calicut's projects: Another new project, New Cath
  Lab Installation, Project 2.
- Project path: project **New Cath Lab Installation** holds **New Cath Lab
  Equipment** (Lead, owner Basheer K, no products, value ₹85).
- A customer with no Opportunities at all: **Test Hospital** (Bangalore) — confirm
  at step 1.

**Tags:** **Simple** = Basheer does it and reports; **Complex** = Claude
drives in its own tab. Saves to Dev are "Basheer clicks, Claude watches":
Claude then reads the record back in the app.

## Pre-flight

- P1. Dev backend restarted (or confirmed running since the last backend
  change) — Simple. —
- P2. Worktree screens running at `localhost:5174` — Simple. —
- P3. Claude's tab signed in as **Basheer K** on 5174 — Simple (Basheer
  signs in). —

## A — Active-only list (Simple, Basheer; steps 1–4 run by Claude before retagging)

1. As Basheer K, open **another hospital** → Opportunities. **Expected:**
   heading "Showing Active Opportunities (2 Active of 4)"; only Good Marketing lead and
   USG m/c listed; buttons **Show All (4)** and **+ Add**. Also open **Test
   Hospital** → Opportunities: "Opportunities (0)", "No opportunities found
   for this account.", no Show All. —
   **Step 1: Pass** 2026-10-01 (another hospital: Claude; Test Hospital: Basheer). —
2. Press **Show All (4)**. **Expected:** all 4 listed (incl. USG 2 Won, usg
   Lost); button reads **Show Active Only**; heading "Showing All Opportunities
   (4)" (wording changed 2026-10-01, after this step passed with the old
   one). —
   **Step 2: Pass** 2026-10-01 (Claude). —
3. Open **USG 2** (Won) from the list, then Back. **Expected:** back on
   the Opportunities tab, still showing all 4. —
   **Step 3: Pass** 2026-10-01 (Claude). —
4. Switch to the **Activity** tab and back to **Opportunities**.
   **Expected:** still all 4 (Show All kept). —
   **Step 4: Pass** 2026-10-01 (Claude). —
5. Back to the customer list, reopen **another hospital** → Opportunities.
   **Expected:** Active only again (2 listed, **Show All (4)**). —
   **Step 5: Pass** 2026-10-01 (Basheer). —
6. Open **aster medicity** → Opportunities. **Expected:** "Showing
   Active Opportunities (5 Active of 5)", all 5 listed, **no** Show All button (decision 13). —
   **Step 6: Pass** 2026-10-01 (Basheer). Also: heading reworded and the
   heading row made to wrap on a phone (checked at phone width, both
   states) at Basheer's request. —

## B — No Active Opportunities (Simple, Basheer as Nishad)

7. Sign in as **Nishad K V** (any window on 5174), open **Aster DM** →
   Opportunities. **Expected:** "Showing Active Opportunities (0 Active of 1)", "No Active
   Opportunities", **Show All (1)** in the heading row (moved there
   from the empty box after this step passed, 2026-10-01); pressing it shows New ICU
   Monitor Opportunity (On Hold). —
   **Step 7: Pass** 2026-10-01 (Basheer). —

## C — EDIT opens the Opportunity page; the original bug (Basheer clicks, Claude watches)

8. As Basheer K, **Aster MIMS Calicut** → Opportunities → **EDIT** on
   **New USG Machine - referral test**. **Expected:** the Opportunity page opens
   (Overview), not an edit form. — Simple. —
   **Step 8: Pass** 2026-10-01 (Basheer). —
9. Basheer: **Products** tab → **+ Add** → add one product → **Save**.
   Then **Overview** → **Edit** → Stage **Qualified** → **Save**.
   **Expected:** both saves succeed (no "At least one product must be
   added…" error). Claude reads back: Products (1), stage Qualified,
   value = the product total. —
   **Step 9: Pass** 2026-10-01 (Basheer; no error). Read back on the Opportunity
   page: stage Qualified, Active, value ₹10.0L. —
10. Back. **Expected:** Customer 360 Opportunities tab; the Opportunity shows
    stage Qualified and the new value. — Simple. —
    **Step 10: Pass** 2026-10-01 (Basheer). —

## D — Project dropdown (Basheer clicks, Claude watches)

11. On the same Opportunity: **Edit** → **Project** shows "No project" →
    choose **Project 2** → **Save**. **Expected:** Overview "Associated
    Project: Project 2". Claude: open Project 2 in Project Directory — the
    Opportunity is listed there. —
    **Step 11: Pass** 2026-10-01 (Basheer; repeated so the Project 2
    listing was checked on the project's own page). —
12. **Edit** → Project **No project** → **Save**. **Expected:**
    Associated Project empty; the Opportunity no longer listed under Project 2. —
    **Step 12: Pass** 2026-10-01 (Basheer). —

## E — Project page path + review fix (Basheer clicks, Claude watches)

13. Project Directory → **New Cath Lab Installation** → **EDIT** on **New
    Cath Lab Equipment**. **Expected:** Opportunity page opens. — Simple. —
    **Step 13: Pass** 2026-10-01 (Basheer). —
14. Basheer: **Products** → **+ Add** → one product → **Save**. Back.
    **Expected:** back on the project page; the Opportunity shows the new value
    (product total), not ₹85 (code-review fix, 2026-10-01). —
    **Step 14: Pass** 2026-10-01 (Basheer). —

## F — Status change drops a Opportunity out of the Active list (Basheer clicks, Claude watches)

15. Open **New USG Machine - referral test** → **Edit** → Status **On
    Hold**, a Hold Reason, a future Reactivation Date → **Save**. Back.
    **Expected:** Aster MIMS Calicut shows "Opportunities (9 Active of
    11)"; the Opportunity isn't listed until **Show All (11)**. —
    **Step 15: Pass** 2026-10-01 (Basheer). —
16. Reset: open it again → **Edit** → Status **Active** → **Save**.
    **Expected:** "10 Active of 11" again. —
    **Step 16: Pass** 2026-10-01 (Basheer); test Opportunity back to Active. —

## G — UAT re-check after the push (Simple, Basheer, on UAT)

17. On UAT, repeat the reported bug: a customer's page → EDIT on a Lead
    Opportunity with no products → Opportunity page → add a product (Products → Save) →
    Edit → stage onward → Save. **Expected:** no error. Glance at the
    Opportunities tab: Active only + Show All. —
    **Step 17: Pass (look-only)** 2026-10-03 (Basheer). Run as a look-only
    check by Basheer's choice, so no test data was saved on UAT: Kmct Medical
    college Hospital shows "3 Active of 4", Show All (4) reveals the Won one;
    Edit opens the Opportunity page; its Edit window has Project with "No
    project"; Cancel. Projects → Mobile ICU → Edit opens the Opportunity
    page. The full save path is covered by Dev steps 1–16 and the rep's own
    next real edit. —

## Sign-off

**Result:** Dev steps 1–16 pass, 2026-10-01 (Basheer, with Claude).
Screen changes made during the run at Basheer's request: heading wording,
phone-width heading row, Show All button moved into the heading row in
the no-Active state. Pushed to UAT 2026-10-03 (`uat` 143c78e →
a430152, frontend only); step 17 (UAT, look-only) passes 2026-10-03.
After merging `uat` into `main` (no conflicts): tsc and lint 0 errors,
backend 1069/1069 pass; Dev re-check on Aster MIMS Calicut (Active-only
heading + Show All, Edit opens the Opportunity page, Project field) passes
2026-10-03 (Basheer).

**Dev data this run changes:** New USG Machine - referral test (product
added, stage Qualified, project set then cleared, On Hold then Active);
New Cath Lab Equipment (product added, value changes from ₹85).
