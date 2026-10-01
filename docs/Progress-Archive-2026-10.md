# Progress Archive — October 2026

## 2026-10-01 — Hospital-wise Part 1 E2E: section I (steps 26–29) pass; approval-refused messages reworded

**Test-plan gap:** step 27 assumed Haroon could approve Vivek's plan.
He can't: only the rep's own manager (Arun) gets Approve/Reject on
screen. Admin/GM may decide on the server, but the screen shows them
no buttons for someone else's rep (Basheer checked Latheef Bhai's
login). The step was run with Arun in two windows instead. That tests
the same thing, since the refusal depends only on the plan already being
decided, not on who presses Approve. Lesson: the 2026-09-24 rule (check
who each picker actually offers) should also cover who can approve.

**Result:** the late Approve was refused and the plan stayed Rejected;
"Last approved target ₹30" was kept after the rejection.

**Wording change (Basheer):** both refusal messages now point to the
refreshed plan: "…already been decided. Please check the latest version
below." and "The rep changed this plan while you were reviewing it.
Please check the latest version below and review again." The "--" in
the first became "—". Business-Rules, the implementation plan's as-built
section and test plan step 24 were updated to match. Planning tests: 111
pass.

**Step 30 (section J) pass; two screen fixes (Basheer: option A, fix
now).** The brand split tripped the run a second time (step 20, then
30): when hospital amounts drop, the brands keep the old total and the
screen said only "Remaining to allocate: ₹-10.00L" / "currently ₹60.00L
of ₹50.00L". Now: "Over by ₹10.00L — reduce brand amounts" (or "…still
to allocate" / "Fully allocated"), and the Submit error names the
direction and amount. Auto-scaling the brands (option B) was turned
down: it would quietly change the rep's numbers. Also the test plan
assumed EDAN alone; Vivek's Q3 split had two brands. Second fix: the
"Needs Your Approval" list re-checks every 60 s (it only refreshed on
reload or window focus). tsc + lint clean.

**Open question for Backlog (not decided):** should the Admin/GM screen
show Approve/Reject on any plan, since the server already allows it?

## 2026-10-01 — UAT data-quality check; hospital filing level added

- **Script:** `uat_data_quality_check.py` section 16 — all hospitals by
  filing level (counts only) and a list of those filed at region level
  or above, with per-region counts; the count goes into the run log.
  Trialled on Dev, then run on UAT.
- **Filing:** 85 of 443 hospitals at region level (North Kerala 43,
  South Kerala 24, Bangalore 18), same as 30 Sep; the 11 added since
  were filed correctly. All 210 cluster-level hospitals are in Bangalore
  (East 88, North 54, West 51, South 17), so Bangalore's 18 go to a
  cluster and Kerala's to a district. Dealers are genuine customers
  (Basheer). Re-filing still held for the Haroon discussion.
- **Other results vs 29 Sep:** deals with no activity 62 → 63; missing
  next action 121 → 127; everything else unchanged.
- **Report:** `C:\Backups\CabioUAT\data_consistency_reports\UAT-Data-Quality-Report-2026-10-01.pdf`.
  Rule added: only the approved PDF goes in that folder (CLAUDE.md).
- **Note:** the auto-mode classifier blocked an approved read-only UAT
  query; Basheer ran it via `!`. The `!` prefix runs bash, not
  PowerShell.

## 2026-10-01 — Close dates for the 37 closed deals: proposal sent to Haroon

Basheer asked whether "last updated" could stand in for the 23 deals
closed before the change history began (2026-09-08). Read-only UAT
checks (scratchpad scripts, run by Basheer via `!`):
- **Last updated:** usable for 11, entered-already-Won for 3, lost for 9.
  Those 9 were all edited 24–29 Sep, and the audit log kept no copy of
  the earlier timestamp: UPDATEs that change only `updated_at` (e.g.
  line-item saves touching the parent deal) leave no audit row.
- **Created date** (Basheer's question): right quarter, but wrong month
  for 3 of the 9 — the deal is opened as a lead, not when it's won.
- **Activity notes** gave the best evidence ("got the order", "PO
  collected", "order lost to …"), including for 4 of the 14 audited
  deals, which were marked closed days after the order (e.g. Dhanvantri
  lost 12 Sep, marked 24 Sep). Reps also log several notes at once after
  the event (Fazal on 5 Sep about July), so note dates aren't always event
  dates.
- **Result:** all 37 fall in Jul–Sep 2026 (Jul 1, Aug 16, Sep 20), so
  Part 2's quarter totals are right whichever date is used. The Sales
  Report has no past-period filter yet (Basheer), so no screen is wrong
  today.
- **Sent to Haroon** (Basheer, 2026-10-01): PDF of all 37 with proposed
  date, evidence and an answer column; Excel version held. Three
  questions: commitment or PO date, 2 deals with no information, IQRAA
  Padne S50 Elite. Files in `C:\Backups\CabioUAT\data_consistency_reports\`.
  Backlog entry "UAT: fill in missing 'date closed'" updated.
