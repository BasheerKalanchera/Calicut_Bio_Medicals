# Target Planning — Manual E2E Test Plan

**Feature:** Milestone 2 Pillar 1 (`docs/Target-Planning-Implementation-Plan.md`).
**Scope built:** every role sets/revises their own quarterly revenue target
(`YYYY-Qn`, Indian FY April–March); a target isn't final until the setter's
own direct manager approves it — resolved generically from `manager_id`, no
hardcoded role names. Nobody may approve their own row, including GM (only
a separate Admin account can approve GM's own target). SBU Manager/Area
Manager/Admin/GM additionally see an SBU-wide rollup (total + per-person
breakdown) for the selected quarter. A **Quarterly/Annual** toggle next to
the period arrows switches the whole screen to a fiscal-year view: "My
Target" shows an Annual Total plus all 4 quarters underneath (each still
individually revisable), and the SBU Rollup shows the same grouped-by-rep
layout — one Annual Total row per person, their 4 quarterly rows
underneath. Screen: `TargetPlanningScreen.tsx`, under **Sales Execution**
for every role, no nav gate.

**Not built in this pass — don't treat these as bugs if you notice them
missing:**
- No Delete button on the screen. The backend has `DELETE
  /planning/targets/{id}`, but the frontend never wired a control to it —
  out of scope for "just build the screen." (This one is deliberate beyond
  scope, too — `docs/API-Catalog.md` says targets shouldn't be deletable at
  all, only revised/rejected; the backend capability existing is a known,
  accepted gap versus that doc, left as unused dead code rather than
  removed.)
- No per-product-category split — flat revenue-only target, per the
  implementation plan's decision #1-3.

**Test users needed:** one Sales Staff, their direct Area Manager, and
either GM or the separate Admin account. Ideally also a second, *unrelated*
Area Manager (for Group F's negative case) and, if one exists, an SBU
Manager (Group H) — if none is currently active in the org, skip the
SBU-Manager-specific parts of H and rely on Admin/GM instead, per the
implementation plan's note that this role tier exists but is unpopulated
today.

**Setup:** pick a quarter nobody has already set a target for for the test
Sales Staff and test Area Manager (the current quarter is usually clean,
or step the picker forward to a future one) — this makes each test's
starting state ("no target yet") predictable without deleting existing
data (there's no Delete UI anyway, see above).

---

## A — Sales Staff sets a target for the first time

1. Log in as the test Sales Staff, open **Target Planning**.
   **Expected:** "My Target" card reads "No target set for `<period>` yet,"
   with a **Set Target** button. No "Needs Your Approval" or SBU Rollup
   sections appear anywhere on the page for this role.
2. Click **Set Target**, enter an amount (e.g. `50`), Save.
   **Expected:** modal closes, card now shows the amount as `₹50.0L` with a
   **Pending Approval** status chip and a **Revise** button.
3. Hard-refresh the browser, reopen Target Planning.
   **Expected:** the same amount/status is still there — confirms it saved
   server-side, not just a local screen update.
4. Try **Set Target** again for the same quarter (if the UI still allows
   reaching the form — e.g. by clicking Revise then attempting to submit a
   duplicate via a second tab is optional; primarily confirm the one-row-
   per-user/SBU/quarter constraint doesn't silently overwrite).
   **Expected:** no silent duplicate; revising through the normal Revise
   flow updates the same row.

## B — Revising a still-pending target

5. Click **Revise**, change the amount (e.g. `50` → `65`), Save.
   **Expected:** card updates immediately to `₹65.0L`, status stays
   **Pending Approval**.

## C — Manager approves a subordinate's target

6. Log in as the test Area Manager (the Sales Staff's actual `manager_id`),
   open Target Planning, same quarter.
   **Expected:** a **Needs Your Approval** section appears listing the
   Sales Staff's `₹65.0L` request for this quarter (won't appear if
   they're on a different quarter than the manager is currently viewing —
   the list isn't period-filtered, it's status-filtered, so it should show
   regardless of which quarter the manager has the picker on).
7. Click **Approve** (optionally add a note first).
   **Expected:** row disappears from "Needs Your Approval."
8. Log back in as the Sales Staff, same quarter.
   **Expected:** "My Target" now shows **Approved** status.

## D — Manager rejects a subordinate's target

9. Have the Sales Staff set a *new* target for a different, still-clean
   quarter (repeat step 1-2 on a fresh period).
10. As the Area Manager, find it in "Needs Your Approval," click **Reject**
    with a note (e.g. "Too low for this territory"), submit.
    **Expected:** row disappears from the manager's list.
11. As the Sales Staff, reopen that quarter.
    **Expected:** status chip now reads **Rejected**.

## E — Revising an approved target resets it to Pending

12. Using the target approved in Group C (Sales Staff, that quarter), click
    **Revise**, change the amount, Save.
    **Expected:** an info banner in the modal warns revising sends it back
    for fresh approval; after saving, status flips back to **Pending
    Approval** and the amount is the new value.
13. As the Area Manager, confirm it reappears in "Needs Your Approval" with
    the revised amount.

## F — Who's *not* allowed to approve

14. Log in as a **different, unrelated** Area Manager (not this Sales
    Staff's actual manager). Open Target Planning.
    **Expected:** their own "Needs Your Approval" section does **not**
    include the test Sales Staff's pending target (it's simply absent —
    there's no error, just nothing to approve for them).
15. *(If reachable via direct API/URL manipulation isn't something you'd
    normally do — skip unless you want to confirm the backend authorization
    error text.)* Otherwise this is adequately covered by step 14 — the
    frontend never offers an Approve/Reject control for a target that isn't
    yours to approve.

## G — GM's own target: only the separate Admin account can approve it

16. Log in as GM, set a target for a clean quarter (same as Group A, steps
    1-2).
    **Expected:** works the same as any other role — GM sets their own
    target too, not exempted.
17. Still as GM, check "Needs Your Approval."
    **Expected:** GM's own just-submitted target never appears there —
    nobody can approve their own row.
18. Log in as the separate Admin account, open Target Planning.
    **Expected:** GM's pending target appears in Admin's "Needs Your
    Approval" section (Admin/GM act as an unrestricted overlay approver,
    except on their own row).
19. Approve it as Admin.
    **Expected:** GM sees it flip to **Approved** on their own screen.

## H — SBU Rollup + per-person team table

20. Log in as the test Area Manager (or SBU Manager, if one exists), open
    Target Planning for the quarter with known targets set (e.g. Group C's
    quarter).
    **Expected:** an "SBU Target Rollup" section appears below "Needs Your
    Approval" — no SBU picker (their own SBU is implicit) — showing "Total:
    ₹Xl across N targets" plus a table listing each person in that SBU for
    that quarter with their amount and status chip.
21. Log in as Sales Staff, same quarter.
    **Expected:** no "SBU Target Rollup" section appears at all for this
    role.
22. Log in as Admin (or GM), open Target Planning.
    **Expected:** the Rollup section includes an **SBU** dropdown (since
    Admin/GM carry no real business SBU of their own). Switching the
    dropdown updates both the total and the per-person table to the newly
    selected SBU.
23. Cross-check the rollup total against the sum of the visible rows'
    amounts (pending targets count too, by design — don't expect it to
    match only the Approved rows).

## I — Quarter navigation keeps periods separate

24. As the Sales Staff, use the ◀/▶ arrows to move to a quarter with no
    target set.
    **Expected:** "My Target" reverts to "No target set for `<period>` yet"
    — the previous quarter's amount/status doesn't leak into this view.
25. Navigate back to a quarter with a target already set.
    **Expected:** that quarter's own amount/status reappears correctly.

## J — Annual view

26. As the Sales Staff, with at least 2 of the 4 quarters in the current
    fiscal year set (reuse Groups A/B/D's quarters, or set one or two
    more), click the **Annual** toggle.
    **Expected:** period label switches from `<period>` to `FY <year>-<year+1>`
    (e.g. "FY 2026-27"); "My Target" card becomes a table with a bold
    **Annual Total** row at the top (sum of whichever quarters are set),
    followed by 4 rows — one per quarter — each showing that quarter's own
    amount and status, or "Not set" for quarters with nothing entered.
27. Click **Set** or **Revise** on one of the individual quarter rows.
    **Expected:** the same target modal opens, scoped to that specific
    quarter (title shows the right `YYYY-Qn`) — saving updates only that
    row, and the Annual Total recalculates immediately to match.
28. Use the ◀/▶ arrows while still in Annual mode.
    **Expected:** they now step a full fiscal year at a time (e.g. "FY
    2026-27" → "FY 2027-28"), not one quarter.
29. As the Area Manager (or Admin/GM), same fiscal year, check the SBU
    Rollup section.
    **Expected:** table now groups by rep — each rep's bold Annual Total
    row, followed by their 4 quarterly rows underneath (amount + status,
    or "Not set"). The section's total line reads "Total: ₹X across N
    reps for FY `<year>`," and that total matches the sum of every
    Annual Total row shown below it.
30. Toggle back to **Quarterly**.
    **Expected:** the screen returns exactly to the single-quarter view
    from Groups A-I, on whichever quarter the picker was last on before
    switching to Annual.

## K — Regression

31. Confirm the **Target Planning** nav item appears under Sales Execution
    for every role tested above (Sales Staff, Area Manager, Admin, GM) —
    no role sees it missing, no role sees an error screen instead of the
    normal view.
32. Spot-check one or two other screens (e.g. Pipeline, Insights) still
    load normally after visiting Target Planning — confirms nothing in the
    new screen's always-mounted query wiring broke shared state.

---

## Not re-tested live (already covered by automated tests)

The authorization boundary itself — resolved-manager approval, the
nobody-approves-their-own-row rule (including the GM/Admin top-of-chain
case), non-owner revision rejection, and the SBU rollup's sum/count — has
36 backend unit tests in `test_target_plan_service.py`/
`test_target_plan_repository.py`, all passing (865/865 full suite). This
live pass is about the screen's wiring (does the right section show to the
right role, does a save round-trip actually persist, does the picker/nav
behave), not re-proving the underlying rule.

## Sign-off

*(Fill in after the live pass — date, who tested as which role, pass/fail
per group, any bugs found and fixed.)*
