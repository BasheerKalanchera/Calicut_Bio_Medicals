# Discussion: Payment collection and order cycle time — 2026-10-13

**Status:** Draft — questions in section 5 are proposed, not answered,
except Q6 (parked, Basheer 2026-10-16).
**Participants:** Latheef Bhai (raised it; wants to work out the solution
together), Basheer (decisions), Haroon / Cabio leadership (business
sign-off), Claude (options and analysis).
**Origin:** three audio messages from Latheef Bhai to Basheer, 13 Oct 2026
(summarised in section 2). Traceability: "Requested by Cabio leadership — to
be built", row 3; signed rows 11.1 (pipeline aging) and 13.2 (stagnant-deal
alerts) cover part of it.

## 1. In plain terms

Cabio's biggest money problem is the time between winning an order and
having the cash in the bank. Some orders take nearly a year. The business
is coming in, but it isn't reaching the bottom line.

Latheef Bhai is asking for two things:

- **Find where the time goes.** For each order, how long did each step
  take — demo, certification, delivery, installation, payment — so the team
  can see which steps commonly lose time and work on those.
- **Don't let payments slip.** He has told staff an overdue payment must
  never pass 60 days. He wants the app to hold each order's payment terms
  (when each payment is due) and send reminders when one is late: to the
  salesperson, their manager, Haroon, and possibly the accounts staff. The
  salesperson owns collection; the app should tie payment to their sales
  work instead of leaving it to accounts to chase.

Part of this is already built or planned (section 3). The new parts are
the reminder chain beyond the manager, payment terms per order, and
anything that involves the accounts staff — these are beyond the signed
Phase 1 scope (section 4c).

## 2. Where this came from

Latheef Bhai's three messages, 13 Oct 2026, summarised:

1. **The cycle is too long.** Cash flow is tracked from order closing
   dates, and the data shows a very long working capital cycle. Delays are
   mainly in certification (TNDT) and at the demo stage. Mapping each
   order's timeline stage by stage, historically, would show where time is
   lost. No quick fix — gradual steps, even a small reduction helps.
2. **Why payments get delayed.** Several causes:
   - *Delays on our side:* a hospital budgets to buy by end of October; our
     delivery slips to late November; by then the budget has gone
     elsewhere.
   - *The customer waits on other money:* e.g. a hospital paying from
     student-admission fees, which come late.
   - *No follow-up after installation:* especially on small items. Across
     5 or 10 orders the outstanding amount piles up.

   Once late, a payment tends to stay late for a long time. He has been
   chasing overdue accounts one by one. New instruction to staff: overdue
   never beyond 60 days; collection is the salesperson's job; a payment
   stage is being added.
3. **The proposal.** Payment terms per order. When a payment is late or
   extended, an automatic reminder to the salesperson, their manager and
   Haroon, optionally the accounts staff (today Sarfeena and Shahul follow
   up, then Latheef Bhai himself). "Control points", even before accounts
   is connected. Some of this may be Phase 2 — bring items forward, or
   start Phase 2 slowly. Wider aim: find the business's pain points and
   the operational and financial levers with the highest return, so
   everyone works with a financial mindset (Anil Lamba: "most decisions
   are financial decisions").

## 3. What exists today

| Ask | Today |
|---|---|
| A payment stage | **Built, tested on Dev 3 Oct, not yet on UAT** (comes with the next UAT move). After Delivery & Installation there is a last stage, Payment Pending; an Opportunity can be marked Won only from there, with "full payment received" ticked. Rule BR-OP-17. |
| Reminder when payment is late | **Planned, not built.** The "stuck in stage" alerts would flag an Opportunity that sits too long in one stage and tell the rep and their manager. Payment Pending has no time limit yet (30 or 45 days had been suggested; Latheef Bhai's instruction now says 60). Two things are missing: a daily job that runs on its own, and a record of when each Opportunity moved stage. On 11 Oct Basheer decided to keep these alerts off while reps get used to the app. |
| Reminder to Haroon and accounts staff | **Not planned.** The design only reaches the rep and their direct manager. Accounts staff don't use Sales OS; whether they get a list (and in what form) was an open question. |
| Payment terms per order | **Not planned.** The payment-stage plan deliberately left out advance, part and retention payments. The signed requirements make Finance's own system the owner of payments and collections. |
| Time spent in each stage | **Signed requirement, deferred.** "Pipeline aging" (row 11.1) is Partial because the app doesn't record when an Opportunity moved stage — only where it is now. Once recording starts, history builds from that day; orders from before can't be analysed in the app. |
| Follow-up after installation | **Agreed 12 Oct, not built.** Every open Opportunity must carry a next action; only Won and Lost are exempt. Payment Pending is neither, so the salesperson always has a dated follow-up — e.g. Fahad moves SonoScape E1 Exp to Payment Pending, closes "PO follow up" with "PO received", and sets "Chase payment". |

## 4. The proposal

### 4a. Overdue-payment alerts (Phase 1, small)

Switch on the "stuck in stage" alert for Payment Pending only, at 60 days,
ahead of the other stages. The rep and their manager are told; the
Opportunity is flagged on the pipeline board and on My Work. Needs the
daily job and the record of stage moves (4b) — the same build the other
stages need later, so nothing is thrown away.

The longer chain — Haroon, then accounts, then Latheef Bhai — is
question 3. Accounts staff could get a weekly Excel list of Opportunities
at Payment Pending, with how long each has waited, instead of a login.

### 4b. Record stage moves, then the stage-time analysis (Phase 1, small)

Start recording, for every Opportunity, each stage it enters and when. This
unlocks three things already waiting on it: the "stuck in stage" alerts,
pipeline aging (signed row 11.1), and counting how often a closing date
slips. A stage-time report follows once there is a few months' history.

Reasons for delay (certification, demo issues, budget moved) come from the
note now required on every stage change (BR-OP-22, agreed 12 Oct). A fixed
list of delay reasons could be added later if the notes show common ones.

Past orders, including last year's year-long ones, were never in the app.
Analysing them is a one-off exercise on Finance's records (question 5).

### 4c. Payment terms per order (beyond signed scope — Phase 2 candidate)

Each order would carry its payment schedule — e.g. 30 % advance, 60 % on
installation, 10 % retention after a year — with a due date per part, and
the alerts would key on each due date instead of the stage. This puts
payment amounts in Sales OS, which the signed scope leaves to Finance's
system, and overlaps with the open retention question. Best decided after
Payment Pending has run on UAT for a quarter, so the team knows how much
the simpler version already catches.

### 4d. The wider levers

Latheef Bhai's "operational and financial levers" thinking is captured in
`docs/Operational-and-Financial-Levers.md` (draft, not yet reviewed). This
paper handles only the collection and cycle-time lever; the rest belongs in
the Phase 2 discussion he mentions.

## 5. Questions

All proposed — not yet answered.

**Q1. From what date do the 60 days count?** Example: Fahad moves
SonoScape E1 Exp to Payment Pending on the day installation is done. The
app knows that date; it doesn't know the invoice date or the agreed
payment date. *Recommend:* count from the day the Opportunity is saved at
Payment Pending. Check with Latheef Bhai that this matches his "overdue".

**Q2. Switch on payment alerts before the other "stuck in stage" alerts?**
On 11 Oct the alerts were held back so reps getting used to the app aren't
flooded. *Recommend:* yes, Payment Pending only — it is the stage
leadership is asking about and holds few Opportunities.

**Q3. Who is told, and when?** Example ladder: day 60, the salesperson and
their manager; day 75, Haroon; day 90, on the weekly list to Sarfeena and
Shahul; after that, Latheef Bhai steps in. *Recommend:* Haroon and Latheef
Bhai set the days; accounts get a weekly Excel list at first, not a login.

**Q4. Payment terms per order — Phase 1 or Phase 2?** *Recommend:*
Phase 2 or a priced change request, decided after a quarter of Payment
Pending on UAT, together with Q6.

**Q5. Analyse last year's orders as a one-off, outside the app?**
*Recommend:* yes, once Latheef Bhai shares Finance's order and payment
dates; no build needed. It gives the "where time is lost" answer now,
while 4b builds the history for the future.

**Q6. Retention amounts and "fully paid"** (moved from the Backlog,
raised 2026-10-12). Some orders let the hospital hold back part of the
payment until warranty or performance terms are met, often a year or more
after delivery. Payment Pending allows Won only after full payment, so such
an Opportunity would sit there — and, with Q1, raise an alert — for that
whole time. Ask Haroon: how common are retention clauses, and should
"fully paid" mean everything except an agreed retention amount?
*Recommend:* answer with Q1; if retention is common, "fully paid" excludes
the agreed retention, recorded in the payment note.
**2026-10-16 (Basheer):** about 5 % of Opportunities take almost a year
to be fully paid. Starting idea: the GM approves closing one as Won once
everything except the agreed retention is paid (amount and release date
recorded). **Parked** until "Won only after full payment" has run on UAT —
field feedback may change or roll back the rule, so nothing is built now.

## 6. Related

- Payment stage: `docs/Discussion-Payment-Confirmation-Gate-2026-09.md`,
  `docs/Payment-Confirmation-Gate-Implementation-Plan.md`, BR-OP-17.
- "Stuck in stage" alerts: BR-OP-06; `docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md`
  section 4 (stage-move record, anti-gaming checks, scheduled job);
  Backlog "'Stuck in stage' (BR-OP-06 as reworded)".
- Next-action rules: `docs/Discussion-Next-Action-Driven-Activity-Logging-2026-10.md`
  (BR-OP-21, BR-OP-22, BR-ACT-05 change).
- Backlog "Count how often a deal's closing date is pushed back" — needs
  the same stage/date record.
- Opportunity Support Attribution (`docs/Discussion-Opportunity-Support-Attribution-2026-09.md`)
  — the other open question on giving Finance a view.
- Levers: `docs/Operational-and-Financial-Levers.md` (draft). It names the
  payment rule BR-OP-15; the correct number is BR-OP-17 — fix when that
  document is reviewed.

## Technical addendum (for the record)

- Payment Pending: migrations 0057 (stage row, `stage_order` 80, default
  probability 98) and 0058 (`full_payment_note`); commits `b9e01e8`,
  `71f07b5`, `0d0133d`, `75ac199`. Not on UAT.
- No stage-history table exists (`docs/Physical-Schema.sql`);
  `opportunity` holds only the current `stage_id`. The audit trail records
  field changes, but the Insights Dashboard plan judged `updated_at` too
  imprecise for aging; whether the audit log can backfill stage moves
  since UAT go-live is worth checking before 4b is designed.
- No scheduler exists yet (Traceability 13.2). BR-OP-06 per-stage limits
  (Lead 14d, Qualified 7d, Demo 7d, Negotiation 5d, Order 2d, Delivery &
  Installation 30d) are per SBU; Payment Pending would get a seeded row
  (60d proposed).
- PRD Appendix B.5: Invoice, Payment and Collections owned by the Finance
  system.
