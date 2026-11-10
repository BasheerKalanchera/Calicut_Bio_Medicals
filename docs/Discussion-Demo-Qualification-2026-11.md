# Discussion: Demo qualification checklist — 2026-11-10

**Status:** Discussion. Basheer's decisions recorded (section 3). Waiting
on Haroon (checklist items, Q-H1; what counts as a Win, Q-H2; two repeat-order
questions, Q-H3 and Q-H4) and the Cabio
leadership team (which machines need manager approval, Q-L1). Nothing built.
**Participants:** Basheer (decisions), Haroon / Cabio leadership (business
sign-off), Claude (options and analysis).
**Origin:** Haroon's answer to question 11 (7 Nov): the Performance tab
shows only Wins and the number of **qualified demos** conducted. Basheer,
9 Nov: a qualified demo is a demo given only to a customer expected to buy.
A demo of a high-end ultrasound machine is expensive, so reps should demo
only to likely buyers. This grew from a reporting question into a new
business rule and feature. Earlier notes: `docs/Progress-Archive-2026-11.md`,
9 Nov evening and 10 Nov later session.

## 1. In plain terms

Before a rep gives a demo, they fill in a short checklist about the
customer: is there a budget, have they met the person who signs off, when
do they expect to order, and so on. Their manager then approves the demo.
Only demos that went through this count as "qualified demos" on Target vs
Actuals. After the demo, the rep must record how it went.

## 2. Signed requirement or beyond the contract

| Part | Where it stands |
|---|---|
| Recording each demo's outcome becomes required | **Signed.** PRD 3.4 (Demo: date and outcome mandatory) and 4.2. Moves scorecard row 6.1 "Demo outcome tracking" towards Done. |
| "Qualified demos" column on Target vs Actuals | **Signed, in part.** Adds to the demo-to-sale conversion row (6.1, Not started) but does not close it; the conversion report is a separate piece. |
| The qualification checklist and the manager's approval before a demo | **Beyond the contract.** PRD 3.4 asks only for "product identified" and "budget range" to leave Qualified. Cabio's own ask, so it goes on the scorecard's Requested list now (client wording shown to Basheer first) and counts as beyond contract once built. |

## 3. Decisions (Basheer)

9 Nov:
- D1. The checklist opens when an Opportunity moves into Qualified and is
  filled in while it is at Qualified. Lead → Qualified stays as today.
- D2. Qualified → Demo needs the checklist complete **and** the manager's
  approval.
- D3. Opportunities already at Demo, or created straight at Demo, go
  through the checklist and approval before their demo is held.
- D4. Once the checklist is live, recording each demo's outcome is required
  (BR-OP-01 already lists it for Demo → Clinical Evaluation; the app does
  not check it today).
- D5. On Target vs Actuals, a demo counts in the quarter of its end date,
  and the Opportunity owner gets the credit. "Qualified demos" is a column
  there, not a separate Performance tab.

10 Nov:
- D6. Opportunities created at Clinical Evaluation or later: the checklist
  is asked for when the Opportunity is created, with **no** manager
  approval (the demo money is already spent).
- D7. Repeat orders skip the checklist and have no demo dates (the screens
  already hide the demo-date boxes for a repeat order). An Opportunity with
  a demo date counts as a demo whatever its lead source: it needs the
  checklist and the manager's approval, and only after that can it be
  marked Repeat Order. A rep who needs a demo on a repeat customer uses
  another lead source. So the Repeat Order mark can't be used to get a demo
  without approval. (Revised 10 Nov, Basheer: the first wording assumed a
  rep could enter a demo date on a repeat order; the screens don't allow
  it.)
- D8. Opportunities whose demo is already over when this goes live are left
  as they are and not counted as qualified demos. Only demos approved after
  go-live count.
- D9. The draft checklist (section 5) goes to Haroon to confirm (Q-H1).
- D10. Each part is labelled signed or beyond contract (section 2).

Proposed, not decided:
- P1. No "Repeat orders" filter on the Opportunities list for now; a
  Backlog entry instead. Today a manager sees the mark only by opening the
  Opportunity.

## 4. Questions for Haroon and the leadership team

- **Q-H1 (Haroon): the checklist items.** Are the items in section 5 right,
  and which must be filled in before the demo? Recommendation: the five
  marked required.
- **Q-H2 (Haroon): what counts as a Win** on Target vs Actuals — PO
  received, or fully paid? Recommendation: PO received, as that is when
  the rep's work ends; payment is tracked as Payment Pending.
- **Q-H3 (Haroon): the repeat order with a demo date.** Your Edan M3A
  pulse oximeter at Dr. Moopen's Medical College (created 1 Sep, Won) is
  marked Repeat Order but has a demo date of 3 Sep. Was a demo held, and
  was the Repeat Order mark set before or after the demo date? The change
  history on UAT starts on 8 Sep, so the app can't tell (UAT check, 10 Nov).
- **Q-H4 (Haroon): 6 repeat orders at Lead or Qualified** (section 6). Are
  any of them new sales marked Repeat Order by mistake?
- **Q-L1 (leadership): which demos need manager approval?** Basheer leans
  towards expensive machines only. Recommendation: decide it by product
  category (for example high-end ultrasound) rather than an amount, so it
  doesn't change when prices change.

## 5. Draft checklist (Claude, from a web search on 9 Nov; general guidance, mostly vendor and sales-training sources)

| Item | Choices | Required? |
|---|---|---|
| Need: which department, and new / replacement / additional machine; the using doctor backs the demo | text + choice | Required |
| Money: budget sanctioned / being arranged / not yet; how they'll pay | choice | Required |
| Who decides: the rep has met the person who signs off | yes / no + name | Required |
| When: order expected within 3 / 6 / 12 months | choice | Required |
| Ultrasound only: valid PC-PNDT registration (the Act bars selling to an unregistered buyer; Kerala and Karnataka rules still to check) | yes / no | Required |
| How they buy: direct / quotes / tender or GeM; other brands in the running | choice + text | Optional |
| Site ready for the machine | yes / no | Optional |

The customer's past payment record is already in the app (payer behaviour)
and is shown, not asked again.

## 6. What the numbers show (UAT, approved read-only checks)

9 Nov (254 Opportunities):
- Created at Demo: 20; active at Demo now: 12. Fahad has 8 of the 20, all
  SonoScape ultrasound; 7 have a demo start before the day they were
  created (a demo already held, recorded afterwards).
- Created at Clinical Evaluation or later: 57 (26 after 8 Sep). These are
  what D6 covers.

10 Nov (254 Opportunities):
- Repeat orders: 29 (11 %). Created at Lead 3, Qualified 5, Negotiation 6,
  Order 15, none at Demo. None at Demo now. 2 passed through Demo; 1 has a
  demo date (Dr. Moopen's Medical College, 3 Sep, Won). So D7 will rarely
  apply.
- 6 repeat orders are at Lead or Qualified (4 open). A true repeat order
  usually starts at Order; some of these may be new sales marked Repeat
  Order by mistake (guess, not checked) — Q-H4.
- The one repeat order with a demo date has no change history (all its
  changes were 1–3 Sep, before the history began on 8 Sep), so how it got
  a demo date can't be checked — Q-H3.

The change history begins 8 Sep, so the creation stage of older
Opportunities may be missing an early stage change.

## 7. Not in this paper

- Skipping a demo with a named manager (BR-OP-14) stays as it is: no demo
  money is spent.
- The demo-to-sale conversion report (row 6.1) and the paused demo-outcome
  plan (4 Nov): own plan, later.
- The implementation plan: written once Q-H1 and Q-L1 are answered.

## 8. Technical addendum

- Today's Qualified → Demo gate: `backend/app/domains/opportunity/validators.py:91–95`
  (demo start date), waived for `REPEAT_ORDER` (`:67`) and a gate override
  (BR-OP-14). Demo outcome not checked: `validators.py:26` (deferred).
- Create at any stage: ADR-015; the new-Opportunity form lists every stage
  (`QuickLeadModal.tsx:528–540`), the server runs the same gates
  (`service.py:210–222`).
- Repeat order rule: BR-OP-13. The demo-date boxes are hidden for
  `REPEAT_ORDER` on the new-Opportunity form (`QuickLeadModal.tsx:609`) and
  the edit screen (`OpportunityDetailScreen.tsx:1954–1957`, but a box that
  already holds a date stays visible), since `32c94ad` (6 Aug). The server
  doesn't refuse demo dates on a repeat order. D7's build: refuse switching
  to Repeat Order while a demo date is set without an approved checklist
  (server and screen).
- Dr. Moopen's Opportunity `500b959c-…`: `audit_log` rows 0; UAT trail
  starts 2026-09-08 03:38 UTC (`uat_moopens_audit.py`, 10 Nov).
- No lead-source filter on the Opportunities list: no `lead_source` in
  `backend/app/domains/opportunity/router.py` (frontend list screens not
  read in full).
- Scripts and output: 9 Nov `uat_created_at_stage.py`; 10 Nov
  `uat_repeat_orders.py`, `uat_repeat_orders_2026-11-10.txt` (session
  scratchpads).
