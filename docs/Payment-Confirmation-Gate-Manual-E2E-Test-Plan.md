<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Payment Confirmation Gate (BR-OP-17) — Manual E2E Test Plan

**Covers:** `docs/Payment-Confirmation-Gate-Implementation-Plan.md`.
**Built:** `b9e01e8` (part 1, stage + fields), `71f07b5` (part 2, server rule),
`0d0133d` (part 3, screens), `75ac199` (code-review fixes).
**Where:** Dev. Screens at `localhost:5173`, Dev backend and Dev database.

## Checked against live data

Checked read-only on Dev, 2026-10-03, with all three RLS settings (user, role,
SBU) set and verified (Admin context; `alembic_version` = 0059; stages include
`PAYMENT_PENDING` at 80; 53 Opportunities visible; none has a payment
confirmation yet).

- **Who sees:** tester **Basheer K** (SBU Manager, Imaging) sees every Imaging
  Opportunity (RLS `opportunity_tier_visibility`: SBU Manager, same SBU) —
  including all five Active Opportunities at Order used below.
- **Who can approve:** n/a — BR-OP-17 has no approval step; the payment tick is
  self-attested by whoever saves.
- **Who can save:** Basheer K owns *New opportunity test* and *Test usg oder with
  Buyback*; he can also save *Test new fastrack opportunity from Project 360*
  (owner Fahad, Imaging) through the same SBU Manager policy (that step saves
  nothing anyway).
- **Existing values:** *New opportunity test* (Al Shifa Hospital Perinthalmanna):
  Order, Active, REPEAT_ORDER, 1 product, **no PO**. *Test usg oder with Buyback*
  (Al Shifa): Order, Active, REPEAT_ORDER, 1 product, no PO. *Test new fastrack
  opportunity from Project 360* (Aster MIMS Calicut): Order, Active, Fast-Track
  set, 1 product, no PO. *New Cath Lab Equipment* (Aster MIMS Calicut): Lead,
  Active, 1 product, no PO.

Button labels, messages and the order of checks are taken from the code,
not the design doc.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Dev data this run changes (permanent — Won can't be undone):** *New
opportunity test* and *Test usg oder with Buyback* end up **Won** at Payment
Pending with test PO numbers and a payment confirmation.

## Pre-flight

- P1. [Simple] Dev backend restarted since part 2 (`71f07b5`); its health check answers. — Pass (Basheer restarted it 2026-10-03; Dev `alembic current` = 0059 head; pytest 1091 passed)
- P2. [Simple] Screens at `localhost:5173`, signed in as Basheer K, page refreshed with Ctrl + Shift + R. — Pass

## A — Won is locked before the last stage (no saves)

1. [Simple] Open **Pipeline**. **Expected:** a **Payment Pending** column after **Delivery & Installation**. — Pass
2. [Simple] Open *New opportunity test* → **Edit** → open the **Status** list. **Expected:** **Won — save at Payment Pending first**, greyed out and not clickable; Active, On Hold, Lost selectable. Close with **Cancel**. — Pass (Basheer first couldn't find the record: a list filter was hiding it; it exists on Dev, Order/Active/Basheer K)
3. [Simple] Open *Test new fastrack opportunity from Project 360* (Fast-Track) → **Edit** → **Status** list. **Expected:** the same greyed-out Won (Fast-Track gives no exemption). **Cancel**. — Pass
4. [Simple] Open *New Cath Lab Equipment* (Lead) → **Edit** → **Status** list. **Expected:** Won greyed out; **Lost** and **On Hold** selectable (BR-OP-17 is Won-only). **Cancel**. — Pass (Basheer: same list as steps 2 and 3)

## B — Moving through Delivery & Installation (saves)

5. [Simple] *New opportunity test* → **Edit** → **Stage** = Delivery & Installation, leave **PO Number** empty → **Save**. **Expected:** error *"PO Number is required to advance to Delivery & Installation stage."*; nothing saved. — Pass
6. [Simple] Same window: **PO Number** = `PO-TEST-1703` → **Save**. **Expected:** saves; page shows stage **Delivery & Installation**, PO Number PO-TEST-1703. Claude reads it back. — Pass (Claude read it back in its own tab: Delivery & Installation, Active, PO-TEST-1703)
7. [Simple] **Edit** → **Status** list. **Expected:** Won still greyed out at Delivery & Installation. **Cancel**. — Pass

## C — Payment Pending first, then Won with the payment tick (saves)

8. [Simple] **Edit** → **Stage** = Payment Pending, then open the **Status** list without saving. **Expected:** Won still greyed out (*save at Payment Pending first*) — choosing the stage in the same window isn't enough. — Pass
9. [Simple] Leave Status as Active → **Save**. **Expected:** saves; page shows stage **Payment Pending**, status Active. Claude reads it back. — Pass (Claude read it back after a fresh page load: Payment Pending, Active, PO-TEST-1703)
10. [Simple] **Edit** → **Status** = Won. **Expected:** Won is now selectable; a green box appears with **I confirm full payment has been received \*** (unticked) and **Payment Note**. — Pass
11. [Simple] Leave the tick empty → **Save**. **Expected:** error *"Confirm that full payment has been received to mark this Opportunity as Won"*; nothing saved (status still Active after **Cancel**). — Pass
12. [Simple] **Edit** → Status Won, tick the box, **Payment Note** = `Test cheque 1234` → **Save**. **Expected:** saves; status **Won**, stage **Payment Pending**; a green panel shows **Full Payment Confirmed By** Basheer K, **Confirmed On** today, **Payment Note** Test cheque 1234. — Pass
13. [Complex: read-back after a full reload in Claude's own tab, to confirm the server stored who/when rather than the screen's own copy] Claude reloads *New opportunity test* and checks the green panel values match step 12. — Pass (fresh page load in Claude's tab: Won, Payment Pending, confirmed by Basheer K, 3 Oct 2026, note "Test cheque 1234"; note: a Won Opportunity no longer shows on the Kanban, found via List view search)

## D — Repeat order: same two saves

14. [Simple] *Test usg oder with Buyback* (Order) → **Edit** → **PO Number** = `PO-TEST-1704`, **Stage** = Payment Pending → **Save**. **Expected:** saves; stage Payment Pending (Order → Payment Pending in one save is fine — only Won needs the earlier save). — Pass
15. [Simple] **Edit** → **Status** = Won, tick the box, no note → **Save**. **Expected:** saves; status Won; green panel shows Basheer K and today, no Payment Note line. — Pass
16. [Complex: read-back after reload in Claude's tab] Claude reloads it and confirms Won at Payment Pending with the confirmation stored. — Pass (fresh load: Won, Payment Pending, PO-TEST-1704, confirmed by Basheer K, 3 Oct 2026, no note line)

## Sign-off

**Result:** 18/18 Pass (P1–P2, steps 1–16), run 2026-10-03 on Dev by Basheer with Claude watching.
