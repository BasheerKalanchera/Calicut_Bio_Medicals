# Demo to Haroon and Latheef Bhai — October 2026

**Date:** to be fixed by Basheer.
**Why:** everything built on Dev since their last demo (2026-09-24) is shown
to them before it moves to UAT (Basheer, 2026-10-13; order recorded in
`docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md` step 7).
**Where:** Dev. UAT is still on `143c78e` (2026-09-27). Already on UAT and
so left out: the three Query Load speed fixes and Opportunity editing on
its own page.

## Suggested order (about 45 minutes)

1. **Rate Hospitals** (Admin menu; login Haroon or Admin) — hospitals rated
   High / Medium / Low business potential; their "Business Potential instead
   of Tier 1/2/3" request from 2026-09-24.
2. **Target Planning** (login Rudrappa, then Shruthi) — a rep splits the
   quarterly target across their own hospitals; warnings when a High-rated
   hospital gets ₹0 or the plan is below the last approved total; the plan
   goes to the rep's manager to approve or reject; the Quarter view lists
   who has and hasn't submitted.
3. **Insights Dashboard → Target vs Actuals tab** (login Haroon, then
   Shruthi) — the GM's SBU target against the team's plans; PO received,
   Won (paid), likely finish; a per-person table with zones and brands; a
   shared Opportunity credited by each person's share. Dashboard sections
   are now tabs; menu renamed "Insights Dashboard".
4. **Opportunity closing rules** (Fahad's "Test opportunity", look only) —
   PO date required from Order to Delivery & Installation and at Won; new
   last stage "Payment Pending": Won only after full payment is confirmed,
   with who and when recorded.
5. **Reports** (login Haroon) — brand breakdown in the Pipeline and Sales
   reports; zone breakdown as a tree; Opportunity counts on each bar.
6. **Audit Log** (Admin menu; login Admin) — changes grouped by save: who
   changed what, and when.

## To settle with them

- **Stage name:** "Payment Pending" is the working name, awaiting their
  confirmation since ~2026-10-05 (alternatives "Awaiting Payment",
  "Collection Pending").
- **Stall alerts** for Delivery & Installation are not live yet — tell them.
- **Reps follow the new closing rules (PO date, payment confirmation) from
  the day UAT moves** — who tells the team, and when.

## Caution

Dev is the shared test database: a plan submitted, an approval or an
activity logged during the demo stays there (activities can't be deleted).
Show the screens and save only on the existing test records above.

## Afterwards

Record their decisions in the right authoritative doc the same day; then
write the UAT promotion plan (own approval).
