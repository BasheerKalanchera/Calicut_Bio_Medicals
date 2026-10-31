<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Target & Coverage Planning: One Tab per Section — Manual E2E Test Plan

**Covers:** `docs/Target-Coverage-Planning-Tabs-Implementation-Plan.md`
(D2–D10). Annual Target E2E L1–L3 (look at three widths) are rewritten
for the tabs there (D11) and run with this plan.
**Built:** `7a8a201` on `worktree-build`, pushed; not yet merged into `main`.
**Where:** Dev, after `/build` merges the tabs into `main`.

## Checked against live data

Written 2026-10-31 from the last read-only Dev checks, not a new query:
Annual Target E2E "Checked against live data" (Dev, 2026-10-21, as
Haroon, all three RLS settings set and verified) and the Target vs
Actuals redesign E2E P3 (Dev, 2026-10-30). P3 below re-runs the check
before the E2E, since Dev data moves during other E2Es.

- **Who sees:** tabs by role, from `TargetPlanningScreen.tsx` (read
  2026-10-31) and plan D3, D6, D9. Admin (Abdul Latheef P): no My Plan.
  GM (Haroon Sidheeq), SBU Manager (Basheer K, Imaging), Area Managers
  (Fazal, Shruthi, Arun Adarsh, Nishad K V): all four tabs, except Team
  Targets for Nishad K V (no one reports to him; he can't see the SBU
  target). Reps (Fahad, Rudrappa, Vivek): My Plan only, no tab bar.
  Teams: Fazal → Fahad; Shruthi → Rudrappa; Arun Adarsh → Vivek; Nishad
  K V → no one; the four Area Managers and Basheer K → Haroon.
- **Who can approve:** a plan's owner's manager, and Admin and GM any
  plan but their own (Annual Target E2E, 21 Oct). Fahad's plan: Fazal.
- **Who can save:** a plan's owner submits it; the steps here save only
  in D (one submit by Fahad, one approve by Fazal) — "Basheer clicks,
  Claude watches".
- **Existing values:** Oct–Dec 2026 plans (30 Oct): Rudrappa ₹10.0 L
  approved, Basheer K ₹55.0 L pending (manager Haroon), Arun Adarsh
  ₹50.0 L and Vivek ₹66.0 L approved. Jan–Mar 2027 (21 Oct, not
  re-checked since): Arun Adarsh ₹30 L pending, Nishad K V ₹10 L
  pending, Vivek ₹45 L rejected. Fahad's own plans and bell: re-read at
  P3.

Button labels and headings are taken from the code as it is today: "My
Plan", "Needs Your Approval", "Team Targets", "SBU Target", "Team Plans",
"No plans set for {period} yet." The tabs are new — **re-check every
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
  `scripts/quarter.py`, re-run at P3.

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

- P1. [Simple] Dev frontend running the merged build (no server change
  in this plan, so no backend restart needed). —
- P2. [Simple] Basheer can sign in as Abdul Latheef P, Haroon Sidheeq,
  Fazal, Nishad K V and Fahad. —
- P3. [Complex: Claude — reading values the screen doesn't show] Re-run
  the read-only check (all three RLS settings): plans waiting for
  Haroon's and Fazal's approval in Oct–Dec 2026; Fahad's plans and his
  hospitals; Fahad's and Fazal's plan notifications. Update "Existing
  values" and the expected counts below if they moved. —

## A — Who sees which tab (D3, D6, D9)

1. [Simple] As Fahad (rep): Target & Coverage Planning. **Expected:** My
   Plan only, no tab bar. —
2. [Simple] As Fazal (Area Manager): same screen. **Expected:** tabs My
   Plan, Needs Your Approval, Team Targets, Team Plans, in that order. —
3. [Simple] As Nishad K V (Area Manager, no one reports to him).
   **Expected:** My Plan, Needs Your Approval, Team Plans; no Team
   Targets tab (D9). —
4. [Simple] As Abdul Latheef P (Admin). **Expected:** Needs Your
   Approval, Team Targets, Team Plans; no My Plan tab. —
5. [Simple] As Haroon (GM). **Expected:** all four tabs; the SBU choice
   sits beside Quarter/Year, above the tabs (D8). —

## B — Opening tab (D4, D10)

1. [Simple] As Haroon, Oct–Dec 2026. **Expected:** opens on Needs Your
   Approval, with a count of 1 (Basheer K's ₹55.0 L plan, if still
   pending at P3). —
2. [Simple] As Fazal, Oct–Dec 2026. **Expected:** if nothing waits for
   him (P3), opens on Team Plans. —
3. [Simple] As Fazal: click Needs Your Approval. **Expected:** "Nothing
   waiting for your approval" (D6), unless P3 found a plan waiting. —
4. [Complex: cross-screen] As Fazal: pick Team Targets, go to My Work,
   then back to Target & Coverage Planning from the menu. **Expected:**
   back on the opening tab, not Team Targets (D10). —

## C — Quarter/Year, period and SBU apply to every tab (D2, D8)

1. [Complex: multi-step] As Haroon: on Team Plans, switch to Year, then
   open each tab. **Expected:** every tab shows the year; switch back to
   Quarter and arrow to Jan–Mar 2027 — every tab shows Jan–Mar 2027. —
2. [Complex: multi-step] As Haroon: switch the SBU choice from Imaging to
   Critical Care. **Expected:** Team Targets and Team Plans both show
   Critical Care (Arun Adarsh, Vivek, Nishad K V). —
3. [Simple] Each tab's content. **Expected:** the same as the old card
   it replaces — same headings, columns and buttons; nothing lost. —

## D — The bell lands on the right tab (D5, D7)

Saves on Dev: "Basheer clicks, Claude watches".

1. [Complex: cross-role, saves] As Fahad: My Plan, Jan–Mar 2027 — submit
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
   **Expected:** opens on My Plan, Jan–Mar 2027 (D5). A "rejected"
   notification, if P3 found one in his bell, also opens My Plan. —

## E — Phone, tablet and laptop

1. [Complex: phone layout] Annual Target E2E L1–L3 (rewritten 31 Oct for
   the tabs), as Haroon, at 390, 768 and 1280 px. **Expected:** as
   written there; on a phone the tab row scrolls sideways when it
   doesn't fit, as on My Work. —
2. [Complex: phone layout] As Fahad on a phone. **Expected:** no tab
   bar; My Plan as today. —

## F — Must not change

1. [Simple] As Fazal: My Work. **Expected:** its tabs and small tabs
   look and behave as before (the tab piece is now shared, D10). —
2. [Simple] As Haroon: Target vs Actuals card on Insights Dashboard.
   **Expected:** unchanged by this build. —
