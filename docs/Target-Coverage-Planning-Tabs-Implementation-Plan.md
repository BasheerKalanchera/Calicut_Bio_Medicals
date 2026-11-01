# Target & Coverage Planning: One Tab per Section — Implementation Plan

**Status:** Approved, 2026-10-31 — Basheer agreed the mock-up.
**Build progress:** step 1 (the screen) built 2026-10-31, commit `7a8a201`,
pushed; merged into `main` 1 Nov (`515a2f2`). E2E started 1 Nov (8 of 25
steps recorded, one Fail: B1); it found D12–D16, whose fixes (step 3)
are for `/build`. No migration.
**Traceability rows:** signed 3.1 ("Sales target configuration:
individual, team, regional" — 6.4 Target Management; layout only, row
stays Done).
**Design / discussion:** Backlog "Target & Coverage Planning: one tab per
section, like My Work" (Basheer, 2026-10-30, Annual Target E2E J3).
Mock-up: https://claude.ai/artifact/XR3ftVbahPshwicQ9Vxsd5 version 26,
boards under "31 Oct — Target & Coverage Planning, one tab per section" —
agreed by Basheer, 2026-10-31.

## Decisions

- D1. Its own plan. Built before `docs/Target-vs-Actuals-Simpler-Table-Implementation-Plan.md`;
  the two share no files, so the order doesn't matter — Basheer,
  2026-10-31.
- D2. The screen's sections become tabs: **My Plan**, **Needs Your
  Approval (N)**, **Team Targets** (the SBU target and the team's
  targets), **Team Plans**. The Quarter/Year switch and the period arrows
  stay above the tabs and apply to every tab — Basheer, 2026-10-31.
- D3. Who sees which tab: My Plan for everyone but Admin (no plan of
  their own); Needs Your Approval, Team Targets and Team Plans only for
  people who approve plans. A rep sees only My Plan, so no tab bar —
  Basheer, 2026-10-31.
- D4. Opening tab: a manager opens on Needs Your Approval when something
  is waiting, else on Team Plans; a rep on My Plan — Basheer, 2026-10-31.
- D5. A bell click opens the tab holding the plan: "submitted" opens
  Needs Your Approval with that plan opened up; "approved" or "rejected"
  opens My Plan — Basheer, 2026-10-31.
- D6. "People who approve plans" (D3) = Admin, General Manager, SBU
  Manager and Area Manager — the roles that see Team Plans today. The
  Needs Your Approval tab shows for them even when nothing is waiting,
  with "Nothing waiting for your approval" — Basheer, 2026-10-31.
- D7. A "submitted" notification for a plan already approved or rejected
  by the time it's clicked opens Team Plans with that plan opened up,
  since it's no longer in Needs Your Approval — Basheer, 2026-10-31.
- D8. Admin and GM's SBU choice moves up beside the Quarter/Year switch,
  since it applies to both Team Targets and Team Plans — Basheer,
  2026-10-31.
- D9. Team Targets is hidden when it would be empty (no one reports to
  the viewer and they can't see the SBU target), as the card is today —
  Basheer, 2026-10-31.
- D10. The tabs are My Work's style of tabs (one shared piece, not a
  copy); the chosen tab resets to the opening tab (D4) when the screen is
  left, as My Work's do (My Work D33) — Basheer, 2026-10-31.
- D11. Annual Target E2E section L steps 1–3 (three-width look of this
  screen) are rewritten for the tabs and run after this build — Basheer,
  2026-10-31.
- D12. Found at B1 of the E2E (1 Nov). Needs Your Approval, and the
  count on its tab, follow the Quarter/Year choice and the SBU choice,
  like the other tabs, and a line under the list says how many more are
  waiting outside them, e.g. "3 more waiting in other periods", so
  nothing is hidden. Until now the list showed every plan waiting in any
  period (4 for Haroon on 1 Nov: Oct–Dec 2026, Jan–Mar 2027, Apr–Jun
  2027 ×2). D4's opening-tab rule then looks at the chosen period and
  SBU. A bell click on a "submitted" plan still opens that plan (D5,
  D7), in its own period — Basheer, 2026-11-01.
- D13. Found at A5. The SBU choice (Admin and GM) now applies to every
  tab: My Plan shows only the chosen SBU's row, as Team Targets and Team
  Plans do. Until now My Plan listed every SBU and Needs Your Approval
  every pending plan. Replaces the "SBU applies to both" wording of D8 —
  Basheer, 2026-11-01.
- D14. Tab order for managers: My Plan, Needs Your Approval, Team Plans,
  Team Targets (Team Plans moves above Team Targets), so both tabs the
  screen opens on sit next to My Plan. Replaces the order in D2 —
  Basheer, 2026-11-01.
- D15. Opening tab stays as D4 (Needs Your Approval when something is
  waiting, else Team Plans; D12 narrows "waiting" to the chosen period
  and SBU) — Basheer, 2026-11-01.
- D16. Found at A2. My Plan in the Annual view gains a "Your target for
  FY 2026-27: ₹X" line: the four quarterly targets added up, as the SBU
  Target card does (Annual Target D47); "Not set yet" when none is set.
  The Quarter view already has it. Not a regression: the old card had no
  such line — Basheer, 2026-11-01.

## Figures and sources

- Sections and who sees them today — `TargetPlanningScreen.tsx`
  (`ROLLUP_VISIBLE_ROLES`, `SBU_TARGET_VIEW_ROLES`,
  `NO_PERSONAL_TARGET_ROLES`, `pendingApproval.length > 0`), read
  2026-10-31.
- Plan notifications are three kinds: submitted (to the manager),
  approved, rejected (to the owner) — `backend/app/domains/notification/service.py:182–219`,
  read 2026-10-31.
- Fahad's plan as the bell example — Annual Target E2E J3, Progress-Archive
  2026-10, 30 Oct.
- GM can't see a plan two levels down in Needs Your Approval — Backlog,
  found in Annual Target E2E J9 (30 Oct); not fixed by this plan.

## 1. In plain terms

Target & Coverage Planning today is one long page with My Plan, Needs
Your Approval, the SBU target, Team Targets and Team Plans one under the
other. Each becomes its own tab, as on My Work, so a manager sees one
thing at a time.

- **A rep** sees only My Plan, as today, with no tabs.
- **A manager** (Area Manager, SBU Manager, GM, Admin) sees My Plan
  (not Admin), Needs Your Approval with a count, Team Targets and Team
  Plans. The screen opens on Needs Your Approval when something is
  waiting, otherwise on Team Plans.
- **The bell:** when Fahad submits his plan, his manager's click opens
  Needs Your Approval with Fahad's plan opened up. Fahad's "approved" or
  "rejected" click opens My Plan.
- Quarter/Year, the period arrows and (Admin and GM) the SBU choice sit
  above the tabs and apply to all of them.

**What doesn't change.** What each section shows and does; who can
approve; no change to saved data or the server.

**Where it lands.** Built and tested on Dev; to UAT with the next release
after its E2E.

### On a phone

Header as today: title; Quarter/Year (and SBU for Admin/GM); period with
its arrows. Then the tabs in one row that scrolls sideways if it doesn't
fit, as on My Work. Each tab's content as today (one block per row).

## 2. Build order

1. **Screen.** Tabs, opening tab, bell landing, SBU choice moved; shared
   tab piece taken from My Work. Type check, lint; commit. Screen only, no
   server change.
2. **Docs and test.** Business-Rules if any wording names the old layout;
   Annual Target E2E L1–L3 rewritten and this plan's E2E
   (`docs/Target-Coverage-Planning-Tabs-Manual-E2E-Test-Plan.md`) both
   written ahead of the build, 2026-10-31; pre-E2E review; E2E on Dev.
3. **Fixes found in the E2E (D12–D16), built by `/build` in its copy of
   the code** (Basheer, 1 Nov), merged once. Screen only (reads the
   existing lists; check whether the pending list needs a period/SBU
   filter on the server or can be filtered on the screen). Then the
   pre-E2E review of the new code; test plan rewritten for it (B1's
   expected count, C2, A2–A5 order, B-steps for the opening tab, a new
   Annual "Your target" step, the "more waiting in other periods" line);
   Build & Test re-runs A–C and runs D–F on the final screen.

## 3. What could be affected

- (a) Screens that request it: Target & Coverage Planning only.
- (b) Links that open it: the bell's plan notifications (D5, D7); the
  side menu.
- (c) Other screens reusing its data: none read this screen's state. My
  Work's tabs change only if the tab piece is shared (D10) — checked
  before and after.

## 4. Not in this plan (with reasons)

- The GM's Needs Your Approval not listing plans two levels down: a
  separate gap (Backlog), not about layout.
- A number on the bell: separate finding (30 Oct).
- Found in the E2E on 1 Nov (A2, A5, B1) and decided the same day: see
  D12–D16 and build step 3 below.

## 5. Business rules and records to update

- Backlog entry "Target & Coverage Planning: one tab per section": moves
  to Progress-Archive once this plan is approved.
- User manual and in-app help: with the UAT move.

## 6. Technical addendum

File and line numbers re-read at build.
- `TargetPlanningScreen.tsx` (760 lines): wrap My Plan, Needs Your
  Approval, Team Targets (`SbuTargetBox`/`AnnualSbuTargetCard` +
  `TeamTargetsPanel`/`AnnualTeamTargetsCard`) and Team Plans in tabs;
  likely split into one component per tab.
- `initialFocus {period, sbuId, planId}` gains which tab to open:
  `NotificationBell.tsx:80–91` knows the notification `type`
  (`TARGET_PLAN_SUBMITTED` / `_APPROVED` / `_REJECTED`).
- The pill row (`ChipTabs`, taken out of `MyWorkScreen.tsx`) is now the
  shared component `components/ChipTabs.tsx` (D10); `SubTabs` stays in
  My Work.
- No server change, no migration.
