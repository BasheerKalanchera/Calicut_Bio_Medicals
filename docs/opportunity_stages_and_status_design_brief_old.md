# Cabio Sales OS
## Opportunity Stages & Status — Design Brief
**Version:** 1.0 — For Customer Review & Decision
**Date:** 19 June 2026
**Status:** Pending Customer Approval

---

## Purpose of This Document

This document presents the proposed design for **Opportunity Stages** and **Opportunity Status** in the Cabio Sales OS. It covers:

- The recommended deal stages for medical equipment sales
- Win probability defaults at each stage
- The deal status model (Active, On-Hold, Stalled, Won, Lost)
- A key architectural decision that requires customer input before implementation begins

**Your input is required.** This document is not a final specification. It is a structured brief to help your team make informed decisions before the physical data model is built.

---

## Background

In a Sales Operating System, two fields track the state of every opportunity:

| Field      | Question it answers                        |
| ---------- | ------------------------------------------ |
| **Stage**  | *Where is this deal in the sales process?* |
| **Status** | *What is the current state of this deal?*  |

These are related but distinct concepts. Getting this right at the design stage avoids costly rework later.

---

## Section 1 — Proposed Opportunity Stages

### The Recommended Model

The following seven stages are proposed for the Cabio Sales OS, designed specifically for capital medical equipment sales in the Indian market:

| #   | Stage                       | What it means                                                                                                                                                                   |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Lead**                    | An unvalidated enquiry or potential interest. Budget, authority, and need have not yet been confirmed.                                                                          |
| 2   | **Qualified**               | The opportunity is validated. Budget, decision authority, clinical need, and timeline have been confirmed. The deal is real.                                                    |
| 3   | **Product Demo**            | A product demonstration has been scheduled or completed. The customer is actively evaluating the solution.                                                                      |
| 4   | **Clinical Evaluation**     | The customer has committed clinical resources (doctors, biomedical engineers, department heads) to evaluate the product in a clinical setting. This is a high-commitment stage. |
| 5   | **Commercial Negotiation**  | Clinical evaluation is complete. The customer has shortlisted the product. Commercial terms — pricing, payment schedule, warranty, AMC — are being negotiated.                  |
| 6   | **PO Received**             | A Purchase Order has been received. The deal is commercially confirmed. Execution (delivery and installation) is in progress.                                                   |
| 7   | **Delivery & Installation** | Equipment has been delivered and is being installed and commissioned at the customer site. The deal is pending final acceptance.                                                |

### Terminal Outcomes

Two terminal outcomes exist:

| Outcome  | What it means                                                                       |
| -------- | ----------------------------------------------------------------------------------- |
| **Won**  | The deal has been successfully closed. Revenue is confirmed.                        |
| **Lost** | The deal has been lost to a competitor, or the customer has decided not to proceed. |

> **Note on "Lead" as a Stage:** In some CRM systems, a Lead is treated as a separate object before it becomes an Opportunity. In the Cabio Sales OS Phase 1 model, Lead is included as the first stage of an Opportunity for simplicity. This can be revisited in a future phase if a separate lead management workflow is required.

---

## Section 2 — Win Probability by Stage

Win probability represents the likelihood of a deal closing successfully at a given stage. These are **system defaults** — salespeople can override them based on field intelligence.

| Stage                       | Default Win Probability | Rationale                                                                                                                                       |
| --------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lead**                    | 5%                      | Most enquiries do not convert. Low confidence at this stage.                                                                                    |
| **Qualified**               | 20%                     | Real intent is confirmed, but significant selling work remains.                                                                                 |
| **Product Demo**            | 35%                     | Customer is engaged but may still be evaluating multiple vendors.                                                                               |
| **Clinical Evaluation**     | 55%                     | A significant commitment from the customer. Clinical teams have invested time. Difficult for customers to reverse course without strong reason. |
| **Commercial Negotiation**  | 70%                     | Commercial intent is established. The deal is being structured. Risk of loss is primarily on price or competitor action.                        |
| **PO Received**             | 92%                     | Order is confirmed. Residual risk is limited to delivery failure or cancellation.                                                               |
| **Delivery & Installation** | 98%                     | Near-certain closure. Risk is only technical acceptance failure.                                                                                |
| **Won**                     | 100%                    |                                                                                                                                                 |
| **Lost**                    | 0%                      |                                                                                                                                                 |

### Important Design Principles

1. **Salesperson Override**: Salespeople must be able to override the default win probability based on ground-level intelligence. The system provides a default; the salesperson provides market reality.
2. **Pipeline Forecasting**: These probabilities drive weighted pipeline calculations (Expected Revenue = Deal Value × Win Probability). Getting these defaults right is critical for forecast accuracy.
3. **Clinical Evaluation is a pivot point**: The jump from 35% (Demo) to 55% (Clinical Evaluation) reflects the high commitment cost to the customer at this stage. If your sales data suggests this jump is too aggressive or too conservative, it should be adjusted after the first full sales cycle.

---

## Section 3 — Opportunity Status Model

Status answers a different question from Stage:

- **Stage** = Where is the deal in the process?
- **Status** = Is the deal actively being worked right now?

### Proposed Statuses

| Status      | Type        | How it is Set             | What it Means                                                                                                                                                                          |
| ----------- | ----------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Active**  | Operational | Manual (Salesperson)      | The deal is being actively worked. This is the default state for all open opportunities.                                                                                               |
| **On-Hold** | Operational | Manual (Salesperson)      | The salesperson has deliberately paused this deal. There is a known reason — e.g., customer has requested a delay, waiting for a new financial year, or pending a tender notification. |
| **Stalled** | Operational | **Automatic (System)**    | The system has detected no activity on this deal for 180 consecutive days. The deal is flagged for review by the salesperson and manager.                                              |
| **Won**     | Terminal    | Manual or Stage-triggered | The deal is closed successfully.                                                                                                                                                       |
| **Lost**    | Terminal    | Manual                    | The deal has been lost. A loss reason should be recorded.                                                                                                                              |

---

## Section 4 — The Stalled Status

### What is Stalled?

Stalled is a **system-driven status** — it is not set by the salesperson. The system automatically flags an opportunity as Stalled when there has been no recorded activity (visit, call, email, note, or meeting) for **180 consecutive days**.

### Why is this important?

In medical equipment sales, some deals move slowly — especially government tenders and institutional purchases. Without a system-driven flag, these deals can remain in the pipeline indefinitely, inflating the forecast without any realistic chance of closure.

Stalled serves as an early warning system for management to identify neglected pipeline.

### How Stalled differs from On-Hold

|                                | On-Hold                                              | Stalled                                       |
| ------------------------------ | ---------------------------------------------------- | --------------------------------------------- |
| **Who sets it?**               | Salesperson (deliberate)                             | System (automatic)                            |
| **Does the salesperson know?** | Yes — they set it intentionally                      | May not be aware                              |
| **Is there a known reason?**   | Yes                                                  | Not necessarily                               |
| **What action is needed?**     | Resume when ready                                    | Manager review + salesperson follow-up        |
| **Example scenario**           | "Customer asked us to wait until Q3 budget approval" | "No visit, call, or note logged in 6+ months" |

### Business Rules for Stalled (Decisions Required)

The following business rules need to be confirmed before implementation:

| Rule                                           | Proposed Default                                         | Confirm / Modify? |
| ---------------------------------------------- | -------------------------------------------------------- | ----------------- |
| **Inactivity threshold**                       | 180 days (rolling)                                       |                   |
| **What counts as activity?**                   | Any logged activity — visit, call, email, meeting, note  |                   |
| **Who gets notified?**                         | Salesperson + their reporting manager                    |                   |
| **How does a deal exit Stalled?**              | Automatically, when any activity is logged               |                   |
| **Does Stalled affect the pipeline forecast?** | Yes — Stalled deals are excluded from committed pipeline |                   |

> **Recommendation:** Stalled is classified as a **Phase 1 requirement**, not a future enhancement, because your business has a concrete rule: deals with no activity for 6 months need to be flagged.

---

## Section 5 — Key Architectural Decision Required

### The Question

**Should "Won" and "Lost" be Stages or Statuses?**

This is the most important design decision in this document. It has a direct impact on what data you can report on after deals are closed.

---

### Option A — Won and Lost as Stages *(Simpler)*

In this approach, Won and Lost are the final two stages in the pipeline, consistent with how Salesforce and HubSpot work by default.

```
Lead → Qualified → Product Demo → Clinical Evaluation 
→ Commercial Negotiation → PO Received → Delivery & Installation 
→ Closed Won / Closed Lost
```

**What you gain:**
- Simpler to implement
- Familiar to salespeople who have used standard CRM tools
- Easy to visualise on a pipeline board

**What you lose:**
- When a deal is marked Closed Lost, the stage it was lost at is overwritten
- You cannot easily answer: *"At which stage did we lose the most deals last quarter?"*
- Coaching insights are limited — you cannot pinpoint where in the sales process you are losing

---

### Option B — Won and Lost as Statuses *(Analytically Superior — Recommended)*

In this approach, Won and Lost are **Statuses**, not Stages. The Stage is always preserved at the last active stage.

```
Stage:  Lead | Qualified | Demo | Clinical Eval | Negotiation | PO Received | Delivery
Status: Active | On-Hold | Stalled | WON | LOST
```

**Example:**

| Deal               | Stage (frozen at closure) | Status | What we learn                    |
| ------------------ | ------------------------- | ------ | -------------------------------- |
| Apollo ICU Monitor | Commercial Negotiation    | Lost   | Lost on price at negotiation     |
| MIMS X-Ray         | Clinical Evaluation       | Lost   | Lost during clinical trial phase |
| Aster Ventilator   | PO Received               | Won    | Won at PO stage                  |

**What you gain:**
- Stage is permanently preserved at the point of win or loss
- Powerful reporting: *"Where in the pipeline are we losing deals?"*
- Enables sales coaching by identifying pipeline leakage points
- Supports better forecast calibration over time
- Aligns with the Cabio Sales OS vision of revenue intelligence

**What you gain in reporting (examples):**
- "We lost 5 of 8 deals at Clinical Evaluation last quarter — possible product gap?"
- "3 deals stalled at Commercial Negotiation for more than 90 days — pricing issue?"
- "Our win rate at PO Received stage is 94% — very low risk once PO is confirmed"

**What is slightly more complex:**
- Requires a two-field model (Stage + Status) rather than a single Stage field
- UI design needs to handle Won/Lost as statuses clearly (not as pipeline columns)
- Implementation is slightly more complex than Option A

---

### Recommendation

> **Option B is recommended** for the Cabio Sales OS.
>
> The Sales OS is designed to answer: *"Will this help me achieve my target?"* That requires knowing not just that deals were lost, but **where** in the process they were lost and **why**. Option A does not support this. Option B does.
>
> The additional implementation complexity is low relative to the long-term analytical value.

---

## Section 6 — Summary of All Decisions Required

Please review each item and confirm your decision:

| #   | Decision                                  | Options                                              | Recommendation                                                   |
| --- | ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | **Stage model**                           | 7-stage model as proposed / Modify stages            | Proceed with 7-stage model                                       |
| 2   | **Win probabilities**                     | Accept defaults / Adjust values                      | Accept defaults for Phase 1; review after first full sales cycle |
| 3   | **Status model**                          | 5-status model (Active, On-Hold, Stalled, Won, Lost) | Accept as proposed                                               |
| 4   | **Won/Lost — Stage or Status?**           | Option A (Stages) / Option B (Statuses)              | **Option B — Statuses (Recommended)**                            |
| 5   | **Stalled threshold**                     | 180 days / Different period                          | 180 days (6 months rolling)                                      |
| 6   | **Stalled — what counts as activity?**    | Any logged activity / Stage movement only            | Any logged activity                                              |
| 7   | **Stalled — who gets notified?**          | Salesperson only / Salesperson + Manager             | Both                                                             |
| 8   | **Stalled — how does deal exit Stalled?** | Any activity logged / Manual reset only              | Automatically on any logged activity                             |
| 9   | **Loss reason — mandatory?**              | Yes, required / Optional                             | Recommended: Required (select from list)                         |

---

## Section 7 — What Happens Next

Once the above decisions are confirmed:

1. The **physical data model** for the Opportunity entity will be finalised
2. Stage and Status fields will be formally defined with allowed values and transition rules
3. Win probability defaults will be coded into the system with override capability
4. The Stalled auto-flagging business rule will be implemented as a scheduled job
5. Pipeline reporting and forecast calculations will be aligned to the approved model

---

## Appendix — Glossary

| Term                 | Definition                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stage**            | A step in the sales process that reflects where the deal currently stands in the selling cycle.                                               |
| **Status**           | The current operational state of a deal — whether it is being actively worked, paused, flagged, won, or lost.                                 |
| **Win Probability**  | The estimated likelihood (%) that a deal at a given stage will eventually close as Won. Used for weighted pipeline and forecast calculations. |
| **Stalled**          | A system-generated status applied when no activity has been recorded on an opportunity for more than 180 days.                                |
| **On-Hold**          | A manually applied status indicating that the salesperson has intentionally paused work on a deal for a known reason.                         |
| **Terminal Status**  | A final, irreversible state — Won or Lost. Once a deal reaches a terminal status, it exits the active pipeline.                               |
| **Pipeline Leakage** | The rate at which deals drop out of the sales pipeline at each stage. Identifying leakage points is a key sales coaching tool.                |

---

*This document was prepared by the Cabio Sales OS project team. It is intended for review and decision-making by the client. No implementation work will commence on the data model until the decisions in Section 6 are formally confirmed.*
