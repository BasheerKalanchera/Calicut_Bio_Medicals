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
