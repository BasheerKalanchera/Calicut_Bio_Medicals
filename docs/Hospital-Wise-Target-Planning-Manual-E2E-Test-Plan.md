# Hospital-Wise Target Planning (Part 1) — Manual E2E Test Plan

**Feature:** `docs/Hospital-Wise-Target-Planning-Implementation-Plan.md`
(Part 1). A quarterly target is now built from hospitals: each hospital
gets a visit frequency and an expected amount, and the target is their
sum (BR-PL-07). Admin/GM rate hospitals High/Medium/Low on a new **Rate
Hospitals** screen. Rules exercised: BR-PL-05 (below last approved total),
BR-PL-06 (₹0 warnings), BR-PL-07 (hospitals, territory, own SBU, drafts),
BR-PL-08 (change note, fresh approval, latest-version check), BR-PL-09
(same-SBU overlap), BR-ACC-04 (rating notes Admin/GM only).

**Built:** step 1 `e55c112` (migration `0055`), step 2 `04c5e87`
(backend), 3a `72564dc`, 3b `467dee8`, 3c + 3d `70e41e1` (migration
`0056`), ₹0 warnings `bfeef46`, code-review fixes `1a4843a`, row lock
`3907b88`.

**Automated coverage:** 1069 backend tests pass; ruff clean on planning;
tsc clean; lint 0 errors (247 older warnings).

**Environment:** Dev only. The UAT move waits for Part 2.

**Data checked read-only on live Dev, 2026-09-30:**
- No hospital-wise plan exists yet. Existing plans (no hospitals):
  Vivek 2026-Q2 ₹65 Approved, Vivek 2026-Q3 ₹60 Approved, Arun Adarsh
  2026-Q3 ₹50 Approved, Haroon 2026-Q2 (both SBUs) Approved, Rudrappa
  2026-Q3 ₹10 Pending. **2026-Q4 is clean for everyone** — used below.
- Every hospital is **Not rated**.
- Critical Care has 9 active brands (EDAN used below); Imaging has 1.
- Territories: Vivek = Alappuzha, Idukki, Kottayam, Pathanamthitta,
  Kollam, Trivandrum (manager Arun Adarsh). Arun Adarsh = South Kerala,
  Palakkad, Ernakulam, Thrissur (manager Haroon). Nishad K V = North
  Kerala (manager Haroon). Rudrappa = two Bangalore clusters (manager
  Shruthi). Basheer K = SBU Manager, Imaging, no zones (may pick any
  hospital).
- **Vivek's area contains 0 hospitals.** The South Kerala hospitals are
  filed at "South Kerala" itself, above his districts, so his picker is
  empty. Rudrappa: same (Bangalore hospitals filed at "Bangalore"). Hence
  setup step S1.

**Cast:** Vivek (Sales Staff, Critical Care), Arun Adarsh (his Area
Manager), Haroon (GM), Nishad K V (other Area Manager, Critical Care),
Rudrappa (Sales Staff, Imaging), Basheer K (SBU Manager, Imaging).

**Simple / Complex:** Simple = Basheer runs it, told what to click and
check. Complex = two windows at once, direct API calls, or database
checks. Anything that saves to Dev is "Basheer clicks, Claude watches"
(Claude records the tab's requests first).

---

## Pre-flight

P1. **(Claude)** Dev `alembic current` = `0056 (head)`; `docs/Physical-Schema.sql`
    regenerated since `0056` (`70e41e1`). **Pass** 2026-09-30 —
    `alembic_version` = `0056`; schema last regenerated in `70e41e1`,
    the same commit as `0056`.
P2. **(Basheer)** Restart the Dev backend; confirm it's running.
    **Pass** 2026-09-30 (Basheer restarted it). —
P3. **(Claude)** Open a test browser tab and start request recording.
    Warn before any frontend file edit while it's open (hot reload can
    reset the logged-in user). **Pass** 2026-09-30 — test tab on
    `localhost:5173`, logged in as Haroon; request recording started. —

## S — Setup (Simple) — *approved by Basheer, 2026-09-30*

S1. As Admin, edit three hospitals' zone so they sit inside Vivek's
    districts (they stay inside Arun's South Kerala too):
    **KIMS Hospital Trivandrum → Trivandrum**, **Test hospital 2 →
    Kollam**, **Test hospital 3 → Kottayam**. **Expected:** Vivek's
    picker (step 10) then offers exactly these three. **Pass** 2026-09-30
    — Basheer re-filed them; read-only check: KIMS → Trivandrum, TH2 →
    Kollam, TH3 → Kottayam (all districts under South Kerala). Vivek's
    area now holds exactly these three; Rudrappa's still none (step 36).
    All still Not rated. —

## A — Rate Hospitals (Simple, as Haroon)

1. Open **Rate Hospitals**. **Expected:** the screen opens filtered to
   "Not rated yet"; KIMS Hospital Trivandrum is listed; each row has a
   rating, a note box and a **Save** button, which is greyed out. —
2. On KIMS, pick **High** but don't click Save. Change the filter to "All
   ratings" and back. **Expected:** KIMS still shows **Not rated** —
   picking alone saves nothing. —
3. On KIMS, pick **High**, type the note "ICU expansion planned", click
   **Save**. **Expected:** the row leaves the "Not rated yet" list. With
   filter **High**: KIMS shows High and the note. —
4. Rate **Test hospital 2 → Medium** and **Test hospital 3 → Low**, Save
   each (no note). Leave aster medicity Not rated. —
5. On KIMS, change only the note, Save. Filter **High**, check the new
   note is kept and the rating is still High. —
   **Steps 1–5: Pass** 2026-09-30 (Basheer). **Issue found:** the
   search box and filters scroll away with the list instead of staying
   pinned at the top, unlike Customer Directory. **Fixed** 2026-09-30
   on all three planning screens (Frontend Standards §6.1); rechecked
   in the browser on Rate Hospitals. DB check confirmed the three
   ratings and KIMS's edited note. —

## B — Who sees ratings and notes (Simple, one Complex)

6. As Haroon, open KIMS's customer page. **Expected:** a **High** chip
   and the note. —
7. As Vivek: no **Rate Hospitals** in the menu; KIMS's customer page
   shows the **High** chip but **no note**. —
8. **(Complex, Claude, Vivek's session)** `PATCH
   /accounts/{KIMS}/business-potential` → **403**; rating unchanged. —
   **Steps 6–7: Pass** 2026-09-30 (Basheer). **Step 8: Pass** 2026-09-30
   — from Vivek's session (token for vivek@cabio-demo.com), sent the
   same values KIMS already had (High + current note): **403** "Only
   Admin/GM may rate a hospital's Business Potential." Before the call,
   Vivek's own read showed High with the note hidden. The follow-up
   database read was blocked by the auto-mode permission check; with the
   same values sent, a wrong success could only have changed who set the
   rating and when. —

## C — Vivek's draft (Simple)

9. As Vivek, open **Target & Coverage Planning**, quarter **2026-Q4**.
   **Expected:** no target; a **Plan** button. —
10. Click Plan, open the hospital picker. **Expected:** only KIMS, Test
    hospital 2 and Test hospital 3, each with its rating chip. Searching
    "Al Shifa" or "aster medicity" finds nothing. —
11. Add all three at **₹0**. **Expected:** KIMS gets a **red** warning,
    Test hospital 2 and 3 **yellow** ones; total ₹0. Click **Save draft**.
    **Expected:** saved as **Draft** (₹0 is allowed on a draft). —
12. As Arun (2026-Q4): Vivek's draft is **not** in Needs Your Approval
    and **not** in the team list. —
    **Steps 9–12: Pass** 2026-09-30 (Basheer). Step wording corrected
    from "Set" to "Plan"; the quarterly view's "Plan Target" button was renamed "Plan" to match the annual view (Plan / Continue / Revise in both; Basheer, 2026-09-30). **Issue
    found:** in the side menu, "Target & Coverage Planning" wraps to two
    lines and the text is centred, unlike the other items. **Fixed**
    2026-09-30 (`textAlign: left` on menu buttons; Frontend Standards
    §6.6 item 2); rechecked in the browser. —

## D — Submit (Simple, as Vivek)

13. Reopen the draft. Set KIMS **₹30** (Weekly, objective "Demo new
    ventilator"), Test hospital 2 **₹15** (Monthly), Test hospital 3
    **₹0** (Quarterly). **Expected:** live total **₹45.00L**; KIMS's red
    warning goes; Test hospital 3's yellow one stays; no change-note box
    (still a draft). —
14. Brand split **EDAN ₹40** only, click **Submit**. **Expected:** blocked
    — the split must equal ₹45. Change EDAN to **₹45**, Submit.
    **Expected:** **Pending Approval**; Test hospital 3's warning shown
    but doesn't block. —
    **Steps 13–14: Pass** 2026-09-30 (Basheer). Read back through the
    app in Vivek's session: Pending Approval, ₹45.00; KIMS ₹30 Weekly,
    TH2 ₹15 Monthly, TH3 ₹0 Quarterly; EDAN ₹45. (KIMS's objective
    was saved with the quote marks from the instruction text — typing
    artefact, not a bug.) —

## E — Same-SBU overlap (Simple, one Complex)

15. As Arun, 2026-Q4, **Plan**: add **KIMS ₹20** and **aster medicity
    ₹10**. **Expected:** a warning on KIMS naming **Vivek**. Split EDAN
    ₹30, **Submit** — the warning doesn't block. —
16. As Nishad, 2026-Q4, **Plan**: add **Al Shifa Hospital Perinthalmanna
    ₹10**, split EDAN ₹10, **Submit**. —
17. **(Complex, Claude)** `GET /planning/targets/overlaps` for Al Shifa,
    Critical Care, 2026-Q4, in Vivek's then Arun's session.
    **Expected:** both return **nothing** (Al Shifa is outside their
    area). In Haroon's session: names **Nishad**. —

## F — First approval (Simple, as Arun)

18. Needs Your Approval shows Vivek 2026-Q4 **₹45**, **3 hospitals**, no
    "Revised" label. Expand: three hospitals with ratings, visit
    frequencies, amounts, and "EDAN ₹45"; no change note. —
19. **Approve**. As Vivek: **Approved**. —

## G — Revising below the approved total (Simple)

20. As Vivek, **Revise**: remove Test hospital 2. **Expected:** total
    **₹30**; a warning that it's **₹15 below** the approved ₹45. Try
    **Submit** with no note → blocked. Note "Lost Test hospital 2 to a
    competitor", split EDAN ₹30, Submit → **Pending Approval**. —
21. As Arun: the row shows **Revised** and **2 hospitals**. Expand:
    "**Why it changed:** Lost Test hospital 2…" and "Last approved
    target: ₹45.00L — this revision is ₹15.00L below it". —

## H — Plan changed while the manager was reviewing (Complex, two windows)

Basheer: normal window as **Arun**, private window as **Vivek**.

22. Arun: click **Approve** on Vivek's plan, leave the dialog open. —
23. Vivek: **Revise**, change only KIMS's objective to "Demo + training",
    note "Objective updated", Submit. —
24. Arun: click **Approve** in the still-open dialog. **Expected:** the
    dialog closes, a warning reads "The rep changed this plan while you
    were reviewing it. Here is the latest version. Please review again.",
    and the expanded row now shows "Objective updated". Vivek's plan is
    still **Pending Approval**. —
25. Arun: **Approve** again. **Expected:** Approved. In the team list,
    expanded: "**Last change (approved):** Objective updated"; the "Last
    approved target" line is gone. —

## I — Plan already decided by someone else (Complex, two windows)

26. Vivek: **Revise**, add Test hospital 2 back at **₹15** (total ₹45),
    note "Won Test hospital 2 back", split EDAN ₹45, Submit. —
27. Private window as **Haroon**: click **Approve** on Vivek's plan, leave
    the dialog open. Normal window as **Arun**: **Reject** it with note
    "Recheck TH2 amount". —
28. Haroon: click **Approve**. **Expected:** the dialog closes with a
    warning that the plan is no longer waiting for approval; Vivek's plan
    stays **Rejected**. —
29. Arun's team list, expanded: "**Last change (rejected):** Won Test
    hospital 2 back"; "Last approved target: ₹30.00L" still shown (kept
    after a rejection). —

## J — Older plan without hospitals (Simple, as Vivek)

30. Quarter **2026-Q3** (₹60, Approved, no hospitals). **Expected:** it
    still shows normally. **Revise:** Submit is blocked until a hospital
    is added. Add **KIMS ₹50**, note "Now built from hospitals", split
    EDAN ₹50, Submit. **Expected:** warning **₹10 below** the approved
    ₹60; as Arun, the row shows last approved ₹60. —

## K — Server guards (Complex, Claude, Vivek's session — all refused)

31. `POST /planning/targets` for **Imaging**, 2026-Q4, KIMS ₹1 → **403**
    "You can only set a target for your own SBU."; nothing created. —
32. `PATCH` Vivek's 2026-Q4 plan with KIMS **₹10.005** → **422**; plan
    unchanged. —
33. `POST /planning/targets/{id}/approve` **without** `expected_updated_at`
    (in Arun's session) → **422**; nothing decided. —

## L — Who can read hospital lines (Complex, Claude, read-only database check)

34. Read `target_plan_account` rows for Vivek's 2026-Q4 plan, as each
    user (all three settings set and verified). **Expected:** Vivek and
    Arun see them; **Nishad 0**; **Rudrappa 0**. —

## M — Territory edge cases (Simple)

35. As Basheer K (SBU Manager, Imaging), 2026-Q4, **Plan**, open the
    picker. **Expected:** hospitals from any zone (e.g. Al Shifa and Aster
    DM). **Cancel** — don't save. —
36. As Rudrappa, 2026-Q4, **Plan**. **Expected:** the picker offers no
    hospitals, so no plan can be submitted. **Cancel.** —

## N — Regression (Simple)

37. As Haroon, **Brand Target Tracking**, Critical Care, 2026-Q4.
    **Expected:** EDAN's Team Committed = ₹45 (Vivek, Rejected) + ₹30
    (Arun) + ₹10 (Nishad) = **₹85** — every non-draft plan counts, as
    before this feature. —
38. Menu per role: **Rate Hospitals** for Haroon and Abdul Latheef only;
    Target & Coverage Planning for everyone. Pipeline and Insights load
    normally. —

---

## Sign-off

**Result:** not yet run.

**Dev test data this run leaves behind:** ratings on KIMS (High),
Test hospital 2 (Medium), Test hospital 3 (Low); 2026-Q4 plans for Vivek,
Arun and Nishad; Vivek's 2026-Q3 plan revised; three hospitals re-filed
(S1).
