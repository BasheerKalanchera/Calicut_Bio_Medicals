# High Priority Deal Flag — Manual E2E Test Plan

**Feature:** Sprint Plan item 8, BR-OP-15 (`docs/Business-Rules.md`).
**Scope built:** an Opportunity is High Priority in one of two ways — automatic
(any deal past Demo stage: Clinical Evaluation, Negotiation, Order, or
Delivery & Installation — computed live, nothing to set) or manual (a
checkbox a person ticks by hand, only offered while the deal is still in
Lead/Qualified/Demo). A red-orange "High Priority" badge shows wherever a
deal appears — Kanban card, List row, and the Detail screen's header — right
alongside the existing "Reactivation Overdue" badge. Full design:
`docs/High-Priority-Deal-Flag-Implementation-Plan.md`.

**Not in scope for this pass:** the Kanban priority-*sort* itself (next
week's item) and the Insights Dashboard's "High-Priority Deals" tile
(separate, not yet scoped) — this plan only verifies the flag itself
computes correctly and shows up everywhere it should.

**Test user needed:** any one login that can edit Opportunities (e.g. an
Area Manager, SBU Manager, or Admin/GM on their own deals) — this feature
has no role-based gate, so one login is enough to prove all the cases.

**Setup:** find (or move) one deal into Clinical Evaluation/Negotiation/
Order/Delivery & Installation stage (for the automatic cases), and one deal
sitting in Lead, Qualified, or Demo stage that currently has no High
Priority badge (for the manual cases).

---

## A — Automatic High Priority (deal past Demo stage)

1. Open Pipeline (Kanban view), find the past-Demo deal from Setup.
   **Expected:** its card already shows the "High Priority" badge (amber/
   orange), even though nobody set anything.
2. Switch to List view, same deal.
   **Expected:** same badge shows in its row.
3. Open that deal's Detail screen.
   **Expected:** badge shows in the header, alongside the Stage/Status
   badges (and Reactivation Overdue, if that also applies to this deal).
4. On the Overview tab, click Edit.
   **Expected:** no "High Priority" checkbox appears — instead a small note
   reading "Automatically High Priority — this deal is past Demo stage."

## B — Manual flag (deal at/below Demo stage)

5. Open the Lead/Qualified/Demo deal from Setup, confirm no High Priority
   badge shows anywhere for it yet (Kanban, List, Detail header).
6. Detail screen → Overview tab → Edit → tick the "High Priority" checkbox
   → Save.
   **Expected:** modal closes, badge appears immediately in the Detail
   header — no page reload needed.
7. Without refreshing, go back to Pipeline (Kanban).
   **Expected:** the same deal's card now shows the badge too.
8. Switch to List view.
   **Expected:** badge shows in that row as well.
9. Hard-refresh the browser and reopen the same deal.
   **Expected:** badge is still there — confirms it actually saved, not
   just a local screen update.

## C — Unchecking the manual flag

10. Edit the same deal again, untick "High Priority" → Save.
    **Expected:** badge disappears everywhere — Detail header, Kanban card,
    List row.

## D — Manual flag becomes moot once the deal moves past Demo

11. Take a Lead/Qualified/Demo deal with the manual flag **off**. Edit it,
    change Stage to Clinical Evaluation (or further), Save.
    **Expected:** the badge now appears automatically, purely from the
    stage change — reopening Edit shows the "Automatically..." note, not a
    checkbox, even though the manual flag was never touched.
12. *(Optional)* Take a Demo-stage deal with the manual flag **on**, advance
    it past Demo the same way.
    **Expected:** badge stays visible throughout (no flicker/disappearance
    at the transition) — it's now showing for the automatic reason instead
    of the manual one, which should be invisible to you as a user.

## E — Regression

13. Find (or use) a deal that qualifies for **both** High Priority and
    Reactivation Overdue at once.
    **Expected:** both badges display together cleanly, no layout overlap,
    in Kanban, List, and Detail header.
14. Open a deal that qualifies for **neither**.
    **Expected:** neither badge shows, no leftover gap or spacing oddity
    where a badge would have been.

---

## Not re-tested live (already covered by automated tests)

The underlying rule itself — `stage.display_order > 30 OR
high_priority_manual` — has 10 backend unit tests covering every stage at
both manual-flag values, plus create/update persistence tests. 809/809
backend tests pass, `tsc`/lint clean. This live pass is about the UI wiring
(badges + checkbox + save round-trip), not re-proving the underlying rule.

## Sign-off

**Full pass, live, 2026-09-15.** Tested as Nishad K V (Area Manager) for
Groups A-D, using "New ICU Monitor deal" (automatic, past-Demo) and "Test
demo lead" (manual flag) from Setup.

- **Group A (automatic High Priority):** steps 1-4 all PASS — badge on
  Kanban card, List row, Detail header; Edit shows the "Automatically High
  Priority" note, no checkbox.
- **Group B (manual flag):** steps 5-9 all PASS, including a hard-refresh
  confirming the flag actually persisted server-side, not just a local
  update.
- **Group C (unchecking):** step 10 PASS — badge disappears from Detail
  header, Kanban card, and List row together.
- **Group D (flag becomes moot past Demo):** step 11 PASS — advancing
  "Test demo lead" to Clinical Evaluation (via Edit, which also required
  filling in the pre-existing Demo Start Date gate) flipped the badge on
  automatically with the manual flag still off underneath; reopening Edit
  confirmed the checkbox was replaced by the automatic note. Step 12
  (optional, flag-on-through-transition) not separately run — same code
  path as step 11, no reason to expect different behavior.
- **Group E (regression):** step 13 (both badges at once) required
  switching to Haroon (Admin/GM) since no Area Manager-visible deal had a
  Reactivation Overdue status, then Basheer put "New ICU Monitor deal"
  On-Hold live and had its `reactivation_date` backdated directly in the
  Dev DB (one field, one row, explicit go-ahead given, reverted to its
  original `2026-10-15` immediately after the check) — PASS, all three
  surfaces (Kanban/List/Detail) show High Priority and Reactivation Overdue
  side by side cleanly. Step 14 (neither badge) PASS — "New opportunity for
  hospital pick," clean header, no leftover gap.

No bugs found. Feature 2.2's High Priority row
(`Signed-Requirements-to-PRD-Traceability.md` /
`Phase1-Delivery-Scorecard.md`) is ready to flip from **Not started** to
**Done** — do that, log the pass in `docs/Progress-Archive-2026-09.md`, and
commit.
