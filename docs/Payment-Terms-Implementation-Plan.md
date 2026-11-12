# Payment Terms on the Opportunity — Implementation Plan

**Status:** Approved, 2026-11-12 (Basheer; all decisions answered the same
day). Not yet built.
**Traceability rows:** Commitment beyond contract, "Requested by Cabio
leadership — to be built" row 3 (payment collection control); this plan
is its first part.
**Design / discussion:** `docs/Discussion-Collections-and-Cycle-Time-2026-10.md`
section 4c and question Q4 (Q4a, Q4b answered 12 Nov).

## Decisions

- One "Payment terms" choice on each Opportunity, four options: Full
  payment; Advance + instalments; Customer's bank loan; Cabio-facilitated
  loan. No amounts or due dates; payments stay with Accounts — leadership
  team via Basheer, 2026-11-12
- Full payment, customer's bank loan and Cabio-facilitated loan are Won
  once full payment is received. Advance + instalments stays at Payment
  Pending until the last instalment or post-dated cheque has cleared —
  leadership team via Basheer, 2026-11-12
- "Paid" for a post-dated cheque means cleared, not handed over — Basheer,
  2026-11-12
- Customer's bank loan and Cabio-facilitated loan are closed Won straight
  away, as soon as the lender pays Cabio (still through Payment Pending and
  the "full payment received" tick, BR-OP-17) — Basheer, 2026-11-12
- If a Cabio-facilitated loan's EMIs default after Won, the salesperson
  follows up — Basheer, 2026-11-12. How: a next action on the hospital
  (hospital-level next actions already exist), no new build — Basheer,
  2026-11-12
- Advance + instalments sales can take well over 60 days to be fully paid;
  the overdue alert must not treat that as late — Basheer, 2026-11-12
- Lighter option (this plan): the choice only, no instalment schedule.
  The heavier option (each instalment's amount and due date, alerts per
  instalment) stays the Phase 2 candidate in the paper's section 4c —
  Basheer, 2026-11-12
- Which option fits is decided by who the hospital pays the EMIs to, not
  how many there are: EMIs paid to Cabio = Advance + instalments; a lender
  pays Cabio in full and the hospital repays the lender = a loan option —
  Basheer, 2026-11-12 (Ambalpadi waits until Fahad says who its EMIs are
  paid to)
- The choice must be filled in to move from Order to Delivery & Installation,
  the same step that already asks for PO number and PO date (terms are
  known once the PO is in) — Basheer, 2026-11-12
- Existing Opportunities are not forced to fill it in until they next pass
  that step; Opportunities already past it can leave it blank — Basheer,
  2026-11-12
- One-time fill-in on UAT for the instalment sales already found (Ambalpadi
  ×2, City Nursing Home, Gulf Laboratory, Mangalore Multi-speciality, and
  IQRAA and SABA once Haroon and Fazal answer), shown first and run with
  Basheer's yes — Basheer, 2026-11-12; he checks the list with Haroon
  before anything is written on UAT
- Marking Won stays exactly as today for all four options: saved at Payment
  Pending, then "full payment received" ticked. The choice doesn't change
  that rule; it records why a sale is still at Payment Pending — Basheer,
  2026-11-12 (the choice can be changed until "full payment received" is
  ticked and the sale is Won)
- The four options live in their own small table, added as a seventh list
  to the planned Reference Data screen (Admin/GM can add and rename
  options; `docs/Reference-Data-Management-Screen-Implementation-Plan.md`,
  Draft) — Basheer, 2026-11-12
- A new option added later on that screen is treated like full payment by
  the future overdue alert; only "Advance + instalments" is skipped
  (marked on its row, not by its name) — Basheer, 2026-11-12
- The choice can be changed later, with the usual change note, until the
  Opportunity is Won; after Won it is locked like the stage. Rarely needed
  once the PO is in, but cheap to allow — Basheer, 2026-11-12
- The payment-overdue alert is not built yet (it is on hold, paper Q1–Q3).
  When it is built, it skips "Advance + instalments" sales; this plan only
  records that rule — Basheer, 2026-11-12 (instalments beyond 60 days
  aren't late)
- Shown on the Opportunity page (Overview), and on the Pipeline report, not
  the Opportunity list (its header has no room for another box) — Basheer,
  2026-11-12. How: "Payment terms" as one more choice in the report's
  existing "Pipeline by" box (bars for each option plus "Not set"; tapping
  a bar opens the matching Opportunities), so no new box is added —
  Basheer, 2026-11-12
- Commercial: once built, the payment-terms choice becomes a new row
  under "What we built" on the client page; Requested item 3 stays under
  "Requested" for the remaining parts (instalment due dates and
  late-payment reminders). Exact wording shown before any republish —
  Basheer, 2026-11-12

## Figures and sources

- 4 payment-terms options, Won timing, PDC meaning — leadership team and
  Basheer, 12 Nov (chat)
- 7 hospitals with agreed instalments, 4 offered, 5 bank loans, 20
  advance-then-balance, out of 2,598 activities — UAT read-only check,
  11 Nov (Progress-Archive 11 Nov)
- Ambalpadi, City Nursing Home, Gulf Laboratory, IQRAA, Mangalore
  Multi-speciality, SABA — same check, 11 Nov; timelines re-read 12 Nov
- Order → Delivery & Installation asks for PO number and PO date —
  `backend/app/domains/opportunity/validators.py:118–126`, read 12 Nov
- Won only from Payment Pending with "full payment received" — BR-OP-17
- Example of Fahad and SonoScape S50 Elite at Ambalpadi — from the real
  UAT record, 12 Nov

## 1. In plain terms

When an order comes in, the salesperson picks how the hospital will pay:
in full, an advance plus instalments, through the hospital's own bank
loan, or through a loan Cabio arranges. Example: Fahad moves "SonoScape S50
Elite" at Ambalpadi from Order to Delivery & Installation; the app asks
for the PO number, the PO date and now the payment terms, and he picks
"Advance + instalments".

Nothing else changes in how a sale is closed. Every sale still goes to
Payment Pending after installation, and is marked Won only when the
person ticks "full payment received". What the choice adds is the reason
a sale is still waiting: an instalment sale can sit at Payment Pending for
two years and be perfectly on time, while a full-payment sale waiting 60
days is late. Managers can see the open pipeline split by payment terms
on the Pipeline report, and the future overdue alert can leave instalment
sales alone.

Built and tested on Dev first; reaches UAT at the next move.

### On a phone

- Delivery & Installation step: the payment-terms box sits under PO number
  and PO date, full width, one option per line when opened.
- Opportunity page: one more line in Overview, "Payment terms: Advance +
  instalments".
- Pipeline report: one more option in the "Pipeline by" box; bars as today.

## 2. Build order

1. Database: the new field (one migration; Basheer runs `alembic upgrade
   head` himself). Nothing visible changes until step 2.
2. Server: save and read the field; the Order → Delivery & Installation
   check; lock after Won; tests. Checkpoint commit. Until step 3, Dev's
   app can't move an Opportunity past Order (the server asks for a field
   the screen doesn't show yet), so steps 2 and 3 go to Dev together.
3. Screens: the box on the Edit form and the New Opportunity form, the
   Overview line, the Pipeline report option.
4. Pre-E2E review and manual E2E on Dev.
5. One-time UAT fill-in for the known sales, after the UAT move.

## 3. What could be affected

Code search, 12 Nov (read only). Every way an Opportunity can reach
Delivery & Installation or later:

- **Opportunity page, Edit form** — the only place an existing Opportunity
  changes stage. Gets the box next to PO number and PO date, plus the same
  "required" check the screen already does for PO date
  (`OpportunityDetailScreen.tsx:1488`). Overview gets one line (next to
  PO Number/PO Date, `:232`).
- **New Opportunity form (quick add)** — can create an Opportunity straight
  at Delivery & Installation or later, and the server checks the same gate
  then (`service.py:211`, `QuickLeadModal.tsx:341`). Gets the box too,
  shown only when such a stage is picked, like PO date.
- **Taking off a manager's gate override** re-checks the gates
  (`service.py:490`); the new check rides along, no extra work.
- **Repeat orders and gate overrides do not skip the PO checks today**
  (`validators.py:118–126`), so they won't skip payment terms either —
  closes the "to confirm" in the addendum.
- **Marking Won:** the Won check also asks for PO number and date
  (`validators.py:171–184`). Payment terms is **not** added there, or the
  old Opportunities already at Payment Pending (allowed to stay blank)
  couldn't be closed.
- No other screen or service creates or moves Opportunities: one create
  path in the server (`router.py:164`). The old prototype screens in
  `App.jsx` have PO boxes but save nothing to the server (no API calls) —
  left alone.

Reports and other places:
- **Pipeline report:** "Pipeline by" list gains "Payment terms" on both
  sides (`reporting/schemas.py:13`, `types/reporting.ts:1`) and a new
  grouping in `reporting/repository.py`. **That file has uncommitted edits
  from another session today** — build after they are committed.
- **Tapping a bar** opens the Opportunity list filtered to that option: the
  list's server call needs one hidden filter (`router.py:89–104`); no new
  box on the list screen.
- No CSV or file exports of Opportunities exist in the server — nothing to
  change.
- **Change history:** the existing audit trigger on `opportunity` records
  every column of the row (`Physical-Schema.sql:2096`), so a change of
  terms is recorded with no extra work; how the Change history tab labels
  it is checked at build.
- **Tests:** 4 test files mention PO number (68 lines, counted 12 Nov);
  tests that move or create an Opportunity at Delivery & Installation or
  later will need payment terms filled in.

## 4. Not in this plan (with reasons)

- Instalment amounts, due dates and reminders per instalment — the Phase 2
  candidate (paper 4c); leadership chose the simple choice first.
- The payment-overdue alert itself — on hold until the team is used to
  Payment Pending (paper Q1–Q3).
- Retention orders (paper Q6) — parked separately.
- An automatic "collect next EMI" next action — the rep already has to keep
  a next action open (BR-ACT-05); no extra rule needed.

## 5. Business rules and records to update

- Business-Rules: new rule for the field and its gate; BR-OP-17 gets a line
  saying it applies to all four options.
- ADR: new entry, payment terms as a lookup table.
- Reference Data screen plan: add "Payment Terms" as its seventh list.
- Traceability Requested row 3: note this first part.
- Collections paper Q4: link to this plan.
- `docs/Physical-Schema.sql` regenerated with the migration.

## 6. Technical addendum

- New lookup table `payment_terms` (`terms_code`, `terms_name`,
  `display_order`, `is_active`, plus a boolean for "skipped by the overdue
  alert", true only on `ADVANCE_INSTALMENTS`), seeded with
  `FULL_PAYMENT`, `ADVANCE_INSTALMENTS`, `CUSTOMER_BANK_LOAN`,
  `CABIO_FACILITATED_LOAN`; `opportunity.payment_terms_id` UUID NULL FK.
  Read-only `GET /master-data/payment-terms`. ADR entry needed (Basheer
  chose a table over a CHECK list, 12 Nov). Reference Data plan: add it to
  its registry and its audit-trigger list (that plan's 7th list).
  Column names to check against Physical-Schema at build.
- `validators.py` `validate_stage_transition`: new check in the Order →
  Delivery & Installation gate, next to PO number and PO date.
- Repeat orders (BR-OP-13) and gate override (BR-OP-14): the new check
  applies to them too, like the PO checks (section 3).
- Lock after Won: alongside the BR-OP-09 checks in the Opportunity service.
- Frontend: `sales-os-app/src/screens/OpportunityDetailScreen.tsx` and the
  stage-change form; `PipelineReportScreen.tsx` / `PipelineHeaderStrip`
  "Pipeline by" box and the pipeline-summary endpoint's group-by (new
  `payment_terms` value). MUI only.
- Audit: `trg_audit_opportunity` is a row trigger with no column list, so
  the new column is covered (section 3).
