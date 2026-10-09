# Target & Coverage Planning Roster — Implementation Plan

**Status:** Built on Dev 2026-10-06 — `0b503ad`, `23582c1`, review fixes `a9e9277`; combined manual E2E pending (not Done). Approved 2026-10-06 (Basheer). Step 6 of
`docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md` (section 3).
**Traceability rows:** 3.1 Target Planning (roster on the planning
screen); 3.2 actual-vs-target dashboards (finished together with step 5).
**Design / discussion:** redesign decisions of 2026-10-05 in
`docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md` ("Roster" line).
**Rollout:** Dev only. Goes to UAT in the combined move (step 7 of the
Target vs Actuals plan), after the combined E2E below.

## Decisions

- Everyone in the viewer's scope gets a row on the Target Planning team table every quarter, with a "N of M haven't submitted" line; managers see only "Draft" on others' drafts — Basheer, 2026-10-05
- Roster on the Quarter view only; the Annual view keeps its totals (Backlog "Annual view roster on Target Planning") — Basheer, 2026-10-06
- "Pending Approval" everywhere, on Target Planning and on the Target vs Actuals card (the card's "Waiting" changes) — Basheer, 2026-10-06
- A rejected revision counts at its last approved amount on Target Planning too, so the planning total and the card's "Planned" (renamed "Team plans" 2026-10-09; see the Plan-vs-Actuals plan's Decisions) always match; the row shows the amount asked for and the wording Basheer picks for the card at E2E — Basheer, 2026-10-06
- The "was ₹X approved" note on revised plans shows in the team table too — Basheer, 2026-10-06
- One combined manual E2E for steps 5 and 6, run after this build — Basheer, 2026-10-06
- Both screens read one shared roster-and-status list from the backend, so they can't drift apart — Basheer, 2026-10-06

## 1. In plain terms

Today the Target Planning team table lists only people who have submitted
a plan. After this change it works like an attendance register: everyone
in the viewer's team appears each quarter, those who haven't started say
"Not started", and a line says how many haven't submitted. A manager sees
that a team member has a draft, but not its figures.

The planning screen and the Target vs Actuals card then say the same
thing: the same people, the same status words ("Pending Approval"), and
the same total. Example from Dev: Critical Care's next-quarter total
reads ₹85 L on Target Planning today but ₹70 L on the card, because
Target Planning counts Vivek's rejected ₹45 L revision; after this change
both read ₹70 L, Vivek's last approved ₹30 L counting.

## 2. Build order

1. **Backend:** one read-only roster list (who is on the roster for a
   quarter and SBU, their plan status, the amount that counts, the "was
   ₹X approved" figure), built from the step 3 roster code and used by
   both the card and the planning screen. The planning screen's total
   uses the same counting rule. Tests: roster rows, others' drafts shown
   without figures, rejected revision at last approved, scope per role.
   **Checkpoint commit** proposed when tests pass.
2. **Frontend:** Target Planning Quarter team table gets the roster rows
   (Not started and others' Draft rows show "—" and don't open), the "N of
   M haven't submitted" line, "Pending Approval" wording and the "was ₹X
   approved" note; the card's "Waiting" becomes "Pending Approval".
3. **Checks:** pytest, ruff, tsc, lint; `/code-review` medium.
4. **Combined manual E2E** (steps 5 and 6), checked against live Dev data,
   with hide-checks and Simple/Complex tags: the Target vs Actuals card in
   full; the target → approval → actuals chain (Basheer K's Al Shifa plan
   against his existing ₹18 L wins: submit, approve, revise, reject);
   Shruthi approves Rudrappa's plan; the SBU target box; PO date gates and
   PO received; the Won-without-PO-date refusal (Fahad's Opportunity saved
   at Payment Pending, then Won with the PO date cleared — refused before
   saving); both screens showing the same people, statuses and totals;
   Target Planning's earlier test (38 steps) re-run. Dev backend restarted
   first.
5. **Commit, push, post-commit checklist** for steps 5 and 6 together,
   including the `Plan-vs-Actuals-Tracking-*` → `Target-vs-Actuals-*` doc
   rename.

Estimate: about 1 day of build, plus the combined E2E.

## 3. Not in this plan (with reasons)

- **Annual view roster** — plans are made and approved one quarter at a
  time; Backlog entry if needed later.
- **Won / Expected columns on Target Planning** — they live on the Target
  vs Actuals card; the planning screen stays about plans.

## 4. Business rules and records to update

- BR-PL-05 (last approved total counts): note that both screens apply it.
- Traceability 3.1 / 3.2 and the scorecard at the post-commit checklist.

## 5. Technical addendum

- **Today:** `/planning/targets/team` (`list_by_sbu_and_period`) returns
  only plans, hides others' drafts, RLS-scoped; `/rollup`
  (`get_sbu_rollup`) sums every non-Draft status, REJECTED at its own
  total, no owner-scope narrowing. Dev check 2026-10-06 (read-only, all
  10 users, Q3/Q4): `/team` scope matched the card's `_apply_owner_scope`
  for every user; totals differ only on CC Q4 (₹85 L vs ₹70 L).
- **Proposed:** `GET /planning/targets/roster?sbu_id&planning_period`
  returning roster rows (user, status or NOT_STARTED, counted amount,
  asked amount, previous approved total), from `repository.roster` +
  `list_plans`; `TargetVsActualService` reuses the same builder. The
  planning screen's total comes from it, replacing the `/rollup` call on
  the Quarter view (`/rollup` kept if anything else calls it; checked at
  build).
- **Frontend:** `TargetPlanningScreen` Quarter team table and total line
  (it already says "Pending Approval"); on the card only
  `TargetVsActualsSection.tsx:36` and the "Planned" tile caption change
  ("Pending approval and approved plans").
- **Data for the E2E plan:** session 0fa74619 scratchpad
  (`tva_views_out.txt`, `tp_team_out.txt`, `tva_mgr_out.txt`,
  `tva_elig_out.txt`, `tva_bk_out.txt`).
