<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Target & Coverage Planning: One Tab per Section — Manual E2E Test Plan

**Covers:** `docs/Target-Coverage-Planning-Tabs-Implementation-Plan.md`
(D2–D17). Annual Target E2E L1–L3 (look at three widths) are rewritten
for the tabs there (D11) and run with this plan.
**Built:** `7a8a201` on `worktree-build`, pushed; merged into `main` 1 Nov (`515a2f2`). Pre-E2E review fix `03ac0ea`; the quarter/year chevron arrows (C4), `3937558` (1 Nov), pushed. Fixes D12–D16 found in this E2E: built by `/build` (`30766c7`, `8d0d0b3`) on `worktree-build`, merge into `main` pending; expected wording below rewritten 2 Nov from that code (read, not run) — re-check every quoted label after the merge. **D17 (My Targets tab, found 2 Nov):** built as `cfa886c`, review fixes `19141b8`, merged into `main` as `1bf0260` (3 Nov, checked in git); expected wording below rewritten 3 Nov from that code (read, not run) — re-check every quoted label again after the merge.
**Where:** Dev (`main`).

## Checked against live data

Written 2026-10-31 from the last read-only Dev checks, not a new query:
Annual Target E2E "Checked against live data" (Dev, 2026-10-21, as
Haroon, all three RLS settings set and verified) and the Target vs
Actuals redesign E2E P3 (Dev, 2026-10-30). P3 below re-runs the check
before the E2E, since Dev data moves during other E2Es.

- **Who sees:** tabs by role, from `TargetPlanningScreen.tsx` (read
  2026-11-03, `worktree-build`) and plan D3, D6, D9, D17. Admin (Abdul
  Latheef P): Needs Your Approval, Team Targets, Team Plans — no My
  Targets, no My Plans. GM (Haroon Sidheeq), SBU Manager (Basheer K,
  Imaging), Area Managers (Fazal, Shruthi, Arun Adarsh, Nishad K V): all
  five tabs, except Team Targets for Nishad K V (no one reports to him;
  he can't see the SBU target). Reps (Fahad, Rudrappa, Vivek): My
  Targets and My Plans, with a tab bar.
  Teams: Fazal → Fahad; Shruthi → Rudrappa; Arun Adarsh → Vivek; Nishad
  K V → no one; the four Area Managers and Basheer K → Haroon.
- **Who can approve:** a plan's owner's manager, and Admin and GM any
  plan but their own (Annual Target E2E, 21 Oct). Fahad's plan: Fazal.
- **Who can save:** a plan's owner submits it; the steps here save only
  in D (one submit by Fahad, one approve by Fazal) — "Basheer clicks,
  Claude watches".
- **Existing values:** Oct–Dec 2026 plans (30 Oct): Rudrappa ₹10.0 L
  approved, Basheer K ₹55.0 L pending (manager Haroon), Arun Adarsh
  ₹50.0 L and Vivek ₹66.0 L approved; Fahad ₹25.0 L and Haroon ₹30.0 L
  approved (P3, 1 Nov). Jan–Mar 2027 (P3, 1 Nov): Arun Adarsh ₹30 L
  pending, Nishad K V ₹12.0 L approved, Vivek ₹45 L rejected; Fahad none.
  Fahad's bell: see P3. **Own quarterly targets (P3c, Dev, 3 Nov), FY
  2026-27:** only Oct–Dec 2026 is set for anyone — Arun Adarsh ₹100.0 L,
  Fahad ₹140.0 L, Fazal ₹160.0 L, Nishad K V ₹85.0 L, Rudrappa ₹100.0 L,
  Shruthi ₹120.0 L, Vivek ₹90.0 L. No target at all: Basheer K, Haroon
  Sidheeq, Abdul Latheef P. **SBU targets (P3c):** Oct–Dec 2026 Imaging
  ₹280.0 L, Critical Care ₹185.0 L; Jan–Mar 2027 Critical Care ₹10.0 L,
  Imaging none; no other quarter in FY 2026-27 set.

Button labels and headings are taken from the code as it is built in
`worktree-build` (read 3 Nov): "My Targets", "My Plans" (heading "My
Plan" in the Quarter view), "Needs Your Approval", "Team Targets", "SBU
Target", "Team Plans", "No plans set for {period} yet." The tabs are
new — **re-check every
quoted label against the built code before the E2E starts** (pre-E2E
review).

## Figures and sources

- Section headings — `TargetPlanningScreen.tsx` lines 439, 525, 610, 714;
  `TeamTargetsPanel.tsx` line 113; `SbuTargetBox.tsx` line 21, read
  2026-10-31.
- "Nothing waiting for your approval" — plan D6 (Basheer, 2026-10-31).
- Plan notifications: three kinds, submitted (to the manager), approved
  and rejected (to the owner) — `notification/service.py` lines 182–219,
  read 2026-10-31.
- Roles and teams — Annual Target E2E, Dev, 2026-10-21.
- Plans and amounts — Annual Target E2E (Dev, 21 Oct) and Target vs
  Actuals redesign E2E P3 (Dev, 30 Oct).
- Fahad's Jan–Mar 2027 plan, ₹20.0 L, in D — made-up amount; the
  hospital is picked at P3 from his hospitals.
- Oct–Dec 2026 and Jan–Mar 2027 are the current and next quarters —
  `scripts/quarter.py`, re-run at P3. FY 2026-27 in the app's period
  names: 2026-Q1 Apr–Jun 2026, 2026-Q2 Jul–Sep 2026, 2026-Q3 Oct–Dec
  2026, 2026-Q4 Jan–Mar 2027 (`scripts/quarter.py`, 3 Nov).
- Own and SBU targets (P3c) — Dev read-only query, 3 Nov, as the GM with
  all three RLS settings verified (scratchpad `tabs_p3c_targets.py`).
  Critical Care Annual total ₹195.0 L is ₹185.0 L + ₹10.0 L, added by hand.
- My Targets tab wording, tab order and opening tab — `MyTargetsCard.tsx`,
  `TargetPlanningScreen.tsx`, `TeamTargetsPanel.tsx` (lines 84, 170, 260–
  266), commits `cfa886c` and `19141b8`, read 3 Nov.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (layout shift, multi-step,
cross-screen/cross-role, or a genuine visual check). Basheer runs Complex
steps too, from exact instructions; a step Claude drives in the browser
says so — `[Complex: Claude — <reason>]` — and only when it can't be judged
by eye (e.g. measuring whether something runs past its card), to save
usage credits (Basheer, 2026-10-29). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Phone:** this is a phone app (PWA). Every screen, card and pop-up the
feature adds or changes gets its own `[Complex: phone layout]` step: at
phone width, every row, arrow and tab opened, nothing runs past the card
and nothing looks squashed. Basheer runs it at 390, 768 and 1280 px;
nobody checks in a browser before handover (Basheer, 2026-10-29), so this
step is the first look. Claude measures in the browser only if something
looks off.

**Opportunities:** no step names or creates an Opportunity.

## Pre-flight

- P1. [Simple] Dev frontend running the build with the D12–D16 fixes
  merged. The Dev backend is restarted once after that merge (the
  Target vs Actuals plan's Overdue tab gets a new server field); one
  restart covers both plans. **Result 2 Nov — Pass (Basheer restarted
  the backend; Claude confirmed the server process started 11:29:28,
  after the merged files changed at 11:25:54, and no backend file has
  changed since).** —
- P2. [Simple] Basheer can sign in as Abdul Latheef P, Haroon Sidheeq,
  Fazal, Nishad K V and Fahad. —
- P3. [Complex: Claude — reading values the screen doesn't show] Re-run
  the read-only check (all three RLS settings): plans waiting for
  Haroon's and Fazal's approval in Oct–Dec 2026; Fahad's plans and his
  hospitals; Fahad's and Fazal's plan notifications. Update "Existing
  values" and the expected counts below if they moved. **Result 1 Nov —
  Pass (Claude, Dev read-only, all three RLS settings verified).**
  Oct–Dec 2026: only Basheer K's ₹55.0 L waits for Haroon (count 1);
  nothing waits for Fazal (Fahad's ₹25.0 L is approved) — B1–B3 stand.
  Fahad has no Jan–Mar 2027 plan, so D1 can submit. His one hospital
  by zone (Mangalore) is "new customer"; confirm the picker offers it
  at D1. His bell: one "approved" (unread) and one "rejected" (read),
  both for his Oct–Dec plan. Fazal's bell: two "submitted" (read), same
  plan. Moved since the plan was written: Nishad K V's Jan–Mar ₹10 L
  is now ₹12.0 L approved. —

- P3b. [Complex: Claude — reading values the screen doesn't show] (New
  2 Nov.) **Result 2 Nov — Pass (Claude, Dev read-only, the app's own
  approval-list and team-targets code run as Haroon and Fazal, all three
  RLS settings verified).** Waiting for Haroon, all periods: 4, unchanged
  — Oct–Dec 2026 Basheer K ₹55.0 L (Imaging); Jan–Mar 2027 Arun Adarsh
  ₹30.0 L (Critical Care); Apr–Jun 2027 Nishad K V ₹10.0 L and Arun
  Adarsh ₹30.0 L (Critical Care). Waiting for Fazal: 0 in any period.
  Fazal's own targets, FY 2026-27: Oct–Dec ₹160.0 L, the other three
  quarters not set — so A2's Annual line should read "Your target for FY
  2026-27: ₹160.0 L". (3 Nov: that line has moved off My Plans to the My
  Targets tab, D17; see A6.) —
- P3c. [Complex: Claude — reading values the screen doesn't show] (New
  3 Nov, for D17.) **Result 3 Nov — Pass (Claude, Dev read-only, as the
  GM with all three RLS settings verified; scratchpad
  `tabs_p3c_targets.py`).** Own quarterly targets and SBU targets for FY
  2026-27 are in "Existing values" above. Only Oct–Dec 2026 is set for
  any person. Basheer K has no target in any quarter, so his My Targets
  reads "Not set yet" (matches Dev 2 Nov). Re-run before the E2E if Dev
  data moved. —

## A — Who sees which tab (D3, D6, D9, D17)

1. [Simple] As Fahad (rep): Target & Coverage Planning. **Expected
   (rewritten 3 Nov for D17):** two tabs, My Targets and My Plans, with a
   tab bar; it opens on My Plans. **Result 1 Nov — Pass (Basheer) on the
   old wording** (My Plan only, no tab bar). Re-run after the merge. —
2. [Simple] As Fazal (Area Manager): same screen. **Expected (rewritten
   3 Nov for D17):** tabs Needs Your Approval, My Targets, My Plans, Team
   Targets, Team Plans, in that order. My Plans has no "Your target" line,
   in Quarter or Annual (it moved to My Targets, A6). **Result 1 Nov —
   Pass (Basheer) on the old wording** (order My Plan, Needs Your
   Approval, Team Targets, Team Plans; no "Your target" line). Found:
   Annual My Plan had no "Your target" line, and Team Plans sat last.
   Decided 1 Nov: the line is added (D16) and the order changed (D14).
   **Re-run 2 Nov — Pass (Basheer, as Fazal, after the merge).** Order and
   the "₹160.0 L" line as expected. Noted: the Oct–Dec row in the table
   below shows "Not set" / "Plan" because that table is his own plan, not
   his target (expected). Also noted: Annual "Plan" is a plain link,
   Quarter's is a filled button; Basheer prefers the button. Basheer
   proposed a "My Targets" tab (design change, for `/build`; see
   Progress-Archive 2 Nov); built as D17. Re-run after the merge. —
3. [Simple] As Nishad K V (Area Manager, no one reports to him).
   **Expected (rewritten 3 Nov for D17):** Needs Your Approval, My
   Targets, My Plans, Team Plans; no Team Targets tab (D9). **Result 1 Nov
   — Pass (Basheer) on the old wording** (My Plan, Needs Your Approval,
   Team Plans). Re-run after the merge. —
4. [Simple] As Abdul Latheef P (Admin). **Expected (rewritten 3 Nov for
   D17):** Needs Your Approval, Team Targets, Team Plans, in that order;
   no My Targets and no My Plans tab. **Result 1 Nov — Pass (Basheer)**
   on the same order (Needs Your Approval, Team Targets, Team Plans).
   Re-run after the merge. —
5. [Simple] As Haroon (GM). **Expected (rewritten 3 Nov for D13, D17):** all
   five tabs; the SBU choice sits beside Quarter/Year, above the tabs
   (D8), and applies to every tab: My Targets shows the chosen SBU's
   target (A7), My Plans only the chosen SBU's
   row, Needs Your Approval lists only that SBU's plans (and the chosen
   period's), Team Plans and Team Targets show that SBU. **Result 1 Nov —
   Pass (Basheer) on the old wording.** Needs Your Approval was
   highlighted, with plans waiting. Found: the SBU choice changed Team
   Targets and Team Plans only, not My Plan or Needs Your Approval.
   Decided 1 Nov: it applies to every tab (D13). Re-run after the
   merge. —
6. [Simple] (New 3 Nov, D17.) As Fazal: My Targets tab, Quarter view,
   Oct–Dec 2026. **Expected:** heading "My Target" with ₹160.0L beside
   it, and the line "Your target for Oct–Dec 2026, set by the person
   you report to." Arrow to Jan–Mar 2027: "My Target" with "Not set yet".
   Switch to Year (FY 2026-27): heading "My Targets", the line "Your
   target for each quarter, set by the person you report to.", and a
   table with columns Period and Target: the row "FY 2026-27 — Annual
   Total" ₹160.0L with the four quarters under it — Oct–Dec ₹160.0L, the
   other three "Not set yet". (Dev, 3 Nov, P3c.) —
7. [Complex: cross-role] (New 3 Nov, D17.) As Haroon (GM), My Targets
   tab, Quarter view, Oct–Dec 2026, SBU Imaging. **Expected:** heading
   "Imaging SBU target" with ₹280.0L beside it (not "My Target"), and the
   line "The total of this SBU's brand targets for Oct–Dec 2026, set on
   Brand Target Tracking. You have no target of your own." Switch the SBU
   to Critical Care: "Critical Care SBU target" ₹185.0L. Year view,
   Imaging: heading "Imaging SBU target"; "FY 2026-27 — Annual Total"
   ₹280.0L; Oct–Dec ₹280.0L, the other three quarters "Not set yet";
   Critical Care: total ₹195.0L, Oct–Dec ₹185.0L, Jan–Mar 2027 ₹10.0L,
   the other two "Not set yet". (Dev, 3 Nov, P3c; Critical Care total
   added by hand.) —
8. [Simple] (New 3 Nov, D17.) As Basheer K (SBU Manager, Imaging): My
   Targets tab. **Expected:** "My Target" with "Not set yet" in Quarter;
   in Year every quarter "Not set yet" and the total "Not set yet" (no
   target in any quarter, P3c). His Team Targets tab still shows the SBU
   Target card (D17). —
9. [Simple] (New 3 Nov, D17.) As Fazal: Team Targets tab, Quarter view,
   Oct–Dec 2026. **Expected:** the comparison with his own target is
   still there — "Your target: ₹160.0L" beside the team figures. Year
   view: the team total row reads "Team total for FY 2026-27 ·" followed
   by "Your target for the year: ₹160.0L". (Layout from
   `TeamTargetsPanel.tsx:170, 260–266`; read, not run.) —
10. [Simple] (New 3 Nov, D17.) As Fazal: My Plans tab, Year view, FY
   2026-27. **Expected:** the card heading reads "My Plans" (Quarter view:
   "My Plan"). A quarter with no plan — Oct–Dec 2026 shows "Not set" —
   has a filled "Plan" button, the same as in the Quarter view; a quarter
   with a plan shows "Continue" (draft) or "Revise" as plain text. —

## B — Opening tab (D4, D10)

1. [Simple] As Haroon, Oct–Dec 2026, SBU Imaging. **Expected
   (rewritten 2 Nov for D12, D15):** opens on "Needs Your Approval (1)",
   listing Basheer K's ₹55.0 L plan only, with the line "3 more waiting in
   other periods or SBUs" under it (Arun Adarsh ₹30.0 L in Jan–Mar 2027;
   Arun Adarsh ₹30.0 L and Nishad K V ₹10.0 L in Apr–Jun 2027, Critical
   Care — Dev, 1 Nov; P3 re-reads them before the run). **Result 1 Nov —
   Fail (Basheer) on the old wording (count 1).** It opened on Needs
   Your Approval with a count of 4, not 1. Cause (read-only Dev check, 1
   Nov): the list is every plan waiting for Haroon in any period, and has
   never followed the Quarter/Year choice (the old page was the same):
   Oct–Dec 2026 Basheer K ₹55.0 L; Jan–Mar 2027 Arun Adarsh ₹30.0 L;
   Apr–Jun 2027 Arun Adarsh ₹30.0 L and Nishad K V ₹10.0 L. The plan's
   "1" was wrong: P3 looked at two periods only. Decided 1 Nov: the list
   follows the period and SBU (implementation plan D12). Re-run after
   the merge. —
2. [Simple] As Fazal, Oct–Dec 2026. **Expected:** if nothing waits for
   him (P3), opens on My Plans (rewritten 3 Nov for D17; was Team
   Plans). **Result 1 Nov — Pass (Basheer) on the old wording** (Team
   Plans). Re-run after the merge. —
3. [Simple] As Fazal: click Needs Your Approval. **Expected:** "Nothing
   waiting for your approval" (D6), unless P3 found a plan waiting. If
   plans wait for him in other periods only, the text reads "Nothing
   waiting for your approval in Oct–Dec 2026" with a "N more waiting in
   other periods" line under it (B2 passing on 1 Nov means none did
   then). **Re-run 2 Nov — Pass (Basheer, as Fazal, after the merge).** —
4. [Complex: cross-screen] As Fazal: pick Team Targets, go to My Work,
   then back to Target & Coverage Planning from the menu. **Expected:**
   back on the opening tab, My Plans (3 Nov, D17), not Team Targets
   (D10). —
5. [Complex: multi-step] (New 2 Nov, D12, D13, D15.) As Haroon: Needs
   Your Approval, arrow to Jan–Mar 2027, SBU Imaging. **Expected:** the
   tab stays open (it is chosen once, on opening, D15); it reads "Nothing
   waiting for your approval in Jan–Mar 2027" with "4 more waiting in
   other periods or SBUs" under it. Switch the SBU to Critical Care:
   "Needs Your Approval (1)" lists Arun Adarsh ₹30.0 L, with "3 more
   waiting in other periods or SBUs". (Counts from Dev, 1 Nov; P3
   re-reads them.) —

## C — Quarter/Year, period and SBU apply to every tab (D2, D8, D12, D13)

1. [Complex: multi-step] As Haroon: on Team Plans, switch to Year, then
   open each of the five tabs. **Expected:** every tab shows the year
   (Needs Your Approval lists plans from all four quarters of the year;
   My Targets shows its Year table, A7); switch back to Quarter and arrow
   to Jan–Mar 2027 — every tab shows Jan–Mar 2027, Needs Your Approval
   and My Targets included (its list follows the period, D12). —
2. [Complex: multi-step] As Haroon: switch the SBU choice from Imaging to
   Critical Care. **Expected:** all five tabs show Critical Care: My
   Targets "Critical Care SBU target" ₹185.0L (Oct–Dec 2026, A7), My
   Plans its row only, Needs Your Approval its plans only, Team Plans and
   Team Targets (Arun Adarsh, Vivek, Nishad K V) (D13, D17). —
3. [Simple] Each tab's content. **Expected:** the same as the old card
   it replaces — same headings, columns and buttons; nothing lost. —
4. [Simple] As Haroon: the arrows either side of the period name at the
   top. **Expected:** chevron icons, not typed ◀ ▶ (Frontend standards
   §6.11 rule 8). Hover over them: "Previous quarter" and "Next quarter";
   switch to Annual and they read "Previous fiscal year" and "Next fiscal
   year". —

## D — The bell lands on the right tab (D5, D7)

Saves on Dev: "Basheer clicks, Claude watches".

1. [Complex: cross-role, saves] As Fahad: My Plans, Jan–Mar 2027 — submit
   a ₹20.0 L plan on the hospital picked at P3 (made-up amount).
   **Expected:** status pending. —
2. [Complex: cross-role] As Fazal: bell → the "submitted" notification
   for Fahad's plan. **Expected:** Target & Coverage Planning opens on
   Needs Your Approval, Jan–Mar 2027, with Fahad's plan opened up (D5). —
3. [Complex: cross-role, saves] As Fazal: approve Fahad's plan.
   **Expected:** it leaves Needs Your Approval; the count drops by one. —
4. [Complex: cross-role] As Fazal: click the same "submitted"
   notification again. **Expected:** opens on Team Plans with Fahad's
   plan opened up, since it is no longer waiting (D7). —
5. [Complex: cross-role] As Fahad: bell → the "approved" notification.
   **Expected:** opens on My Plans, Jan–Mar 2027 (D5, D17). A "rejected"
   notification, if P3 found one in his bell, also opens My Plans. —

## E — Phone, tablet and laptop

1. [Complex: phone layout] Annual Target E2E L1–L3 (rewritten 31 Oct for
   the tabs), as Haroon, at 390, 768 and 1280 px. **Expected:** as
   written there; on a phone the tab row scrolls sideways when it
   doesn't fit, as on My Work. —
2. [Complex: phone layout] As Fahad on a phone. **Expected (rewritten 3
   Nov for D17):** a tab bar with two tabs, My Targets and My Plans,
   opening on My Plans; both fit without sideways scrolling at 390 px. —
3. [Complex: phone layout] (New 3 Nov, D17.) My Targets at 390, 768 and
   1280 px, as Fazal and as Haroon (Imaging): Quarter view, then Year
   view. **Expected:** the heading, the amount, the caption line and (in
   Year) the Period/Target table all fit inside the card at every width,
   nothing runs past the edge; "Imaging SBU target" and the longer GM
   caption wrap onto further lines rather than being cut off. —

## F — Must not change

1. [Simple] As Fazal: My Work. **Expected:** its tabs and small tabs
   look and behave as before (the tab piece is now shared, D10). —
2. [Simple] As Haroon: Target vs Actuals card on Insights Dashboard.
   **Expected:** unchanged by this build. —
