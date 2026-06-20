# Cabio Sales OS
## Opportunity Stages & Status — Architecture Specification
**Version:** 2.0 — Final
**Date:** 20 June 2026
**Status:** Approved Architecture Baseline
**Approved By:** Cabio Leadership Team
**Decision Date:** 20 June 2026

---

## Purpose of This Document

This document records the approved Opportunity Stage and Status architecture for Cabio Sales OS Phase 1. It establishes the authoritative design for how deals are tracked, measured, and progressed within the system. It covers:

- The approved deal stages for medical equipment sales
- Win probability defaults at each stage
- The approved deal status model (Active, On-Hold, Stalled, Won, Lost)
- The approved architectural separation of Stage and Status concepts

---

## Background

In a Sales Operating System, two fields track the state of every opportunity:

| Field      | Question it answers                        |
| ---------- | ------------------------------------------ |
| **Stage**  | *Where is this deal in the sales process?* |
| **Status** | *What is the current state of this deal?*  |

These are related but distinct concepts. This architecture carefully separates them to ensure precise forecasting and accurate pipeline leakage analysis.

---

## Section 1 — Approved Opportunity Stages

### The Approved Model

The following seven stages are approved for the Cabio Sales OS, designed specifically for capital medical equipment sales in the Indian market:

| #   | Stage                       | What it means                                                                                                                                                                   |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Lead**                    | An unvalidated enquiry or potential interest. Budget, authority, and need have not yet been confirmed.                                                                          |
| 2   | **Qualified**               | The opportunity is validated. Budget, decision authority, clinical need, and timeline have been confirmed. The deal is real.                                                    |
| 3   | **Demo**            | A product demonstration has been scheduled or completed. The customer is actively evaluating the solution.                                                                      |
| 4   | **Clinical Evaluation**     | The customer has committed clinical resources (doctors, biomedical engineers, department heads) to evaluate the product in a clinical setting. This is a high-commitment stage. |
| 5   | **Negotiation**  | Clinical evaluation is complete. The customer has shortlisted the product. Commercial terms — pricing, payment schedule, warranty, AMC — are being negotiated.                  |
| 6   | **Order**             | A Purchase Order has been received. The deal is commercially confirmed. Execution (delivery and installation) is in progress.                                                   |
| 7   | **Delivery & Installation** | Equipment has been delivered and is being installed and commissioned at the customer site. The deal is pending final acceptance.                                                |

> **Note on "Lead" as a Stage:** In the Cabio Sales OS Phase 1 model, Lead is included as the first stage of an Opportunity for simplicity. This can be revisited in a future phase if a separate lead management workflow is required.

### Approved Stage Gates (Exit Criteria)

Every opportunity must meet specific minimum requirements before it can advance from one stage to the next. These gates ensure data quality and process discipline.

| Transition | Mandatory Requirements |
| :---- | :---- |
| **Lead → Qualified** | Product identified. Budget Range defined. Lead Source defined. |
| **Qualified → Demo** | Demo Expected Date range defined. |
| **Demo → Clinical Evaluation** | 1. Demo Outcome recorded.<br>2. Clinical contact identified (doctor or biomedical engineer).<br>3. Clinical evaluation start date defined. |
| **Clinical Evaluation → Negotiation** | 1. Clinical Evaluation Outcome recorded.<br>2. Expected Closure Date defined. |
| **Negotiation → Order** | Order Value confirmed. Product Details defined. Shared Ownership Validation. Handover Information. |
| **Order → Delivery & Installation** | 1. PO Number entered.<br>2. Delivery Date scheduled.<br>3. Installation Site confirmed. |

---

## Section 2 — Win Probability by Stage

Win probability represents the likelihood of a deal closing successfully at a given stage. These are **system defaults** — salespeople may override them based on field intelligence.

| Stage                       | Default Win Probability | Rationale                                                                                                                                       |
| --------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lead**                    | 5%                      | Most enquiries do not convert. Low confidence at this stage.                                                                                    |
| **Qualified**               | 20%                     | Real intent is confirmed, but significant selling work remains.                                                                                 |
| **Demo**            | 35%                     | Customer is engaged but may still be evaluating multiple vendors.                                                                               |
| **Clinical Evaluation**     | 55%                     | A significant commitment from the customer. Clinical teams have invested time. Difficult for customers to reverse course without strong reason. |
| **Negotiation**  | 70%                     | Commercial intent is established. The deal is being structured. Risk of loss is primarily on price or competitor action.                        |
| **Order**             | 90%                     | Order is confirmed. Residual risk is limited to delivery failure or cancellation.                                                               |
| **Delivery & Installation** | 95%                     | Near-certain closure. Risk is only technical acceptance failure.                                                                                |

### Important Design Principles

1. **Salesperson Override**: Salespeople must be able to override the default win probability based on ground-level intelligence. The system provides a default; the salesperson provides market reality.
2. **Pipeline Forecasting**: These probabilities drive weighted pipeline calculations (Expected Revenue = Deal Value × Win Probability).
3. **Clinical Evaluation is a pivot point**: The jump from 35% (Demo) to 55% (Clinical Evaluation) reflects the high commitment cost to the customer at this stage. 

---

## Section 3 — Opportunity Status Model

Status answers a different question from Stage:

- **Stage** = Where is the deal in the process?
- **Status** = Is the deal actively being worked right now?

### Approved Statuses

**Operational Statuses:**
| Status      | How it is Set             | What it Means                                                                                                                                                                          |
| ----------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Active**  | Manual (Salesperson)      | The deal is being actively worked. This is the default state for all open opportunities.                                                                                               |
| **On-Hold** | Manual (Salesperson)      | The salesperson has deliberately paused this deal. There is a known reason — e.g., customer has requested a delay, waiting for a new financial year, or pending a tender notification. |
| **Stalled** | **Automatic (System)**    | The system has detected no activity on this deal for 180 consecutive days. The deal is flagged for review by the salesperson and manager.                                              |

**Terminal Statuses:**
| Status      | How it is Set             | What it Means                                                                                                                                                                          |
| ----------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Won**     | Manual or Stage-triggered | The deal is closed successfully.                                                                                                                                                       |
| **Lost**    | Manual                    | The deal has been lost. A loss reason must be recorded.                                                                                                                                |

### Approved Status Transition Rules

A salesperson can mark a deal as Won, Lost, or On-Hold from **any stage**. The Stage is frozen at its current value when a terminal status is applied.

| Status Transition | Who Triggers It | Mandatory Requirements |
| :---- | :---- | :---- |
| **Any Stage → Won** | Salesperson (manual) | 1. PO Number entered.<br>2. Product details confirmed. |
| **Any Stage → Lost** | Salesperson (manual) | 1. Loss Reason selected (from approved list).<br>2. Competitor name recorded (if loss reason = COMPETITOR_WON). |
| **Any Stage → On-Hold** | Salesperson (manual) | 1. Hold Reason selected (from approved list).<br>2. Reactivation Date defined (must be a future date). |
| **Any Stage → Stalled** | System (automatic) | Triggered when no activity is recorded for 180 consecutive days. No manual action required. |
| **Stalled → Active** | System (automatic) | Triggered automatically when any activity is logged against the opportunity. |

---

## Section 4 — The Stalled Status

### What is Stalled?

Stalled is a **system-driven status** — it is not set by the salesperson. The system automatically flags an opportunity as Stalled when there has been no recorded activity (visit, call, email, note, or meeting) for **180 consecutive days**.

### Why is this important?

In medical equipment sales, some deals move slowly — especially government tenders and institutional purchases. Without a system-driven flag, these deals can remain in the pipeline indefinitely, inflating the forecast without any realistic chance of closure. Stalled serves as an early warning system for management to identify neglected pipeline.

### How Stalled differs from On-Hold

|                                | On-Hold                                              | Stalled                                       |
| ------------------------------ | ---------------------------------------------------- | --------------------------------------------- |
| **Who sets it?**               | Salesperson (deliberate)                             | System (automatic)                            |
| **Does the salesperson know?** | Yes — they set it intentionally                      | May not be aware                              |
| **Is there a known reason?**   | Yes                                                  | Not necessarily                               |
| **What action is needed?**     | Resume when ready                                    | Manager review + salesperson follow-up        |
| **Example scenario**           | "Customer asked us to wait until Q3 budget approval" | "No visit, call, or note logged in 6+ months" |

### Approved Business Rules for Stalled

The following rules govern the Stalled status implementation:

| Rule                                           | Approved Implementation                                  |
| ---------------------------------------------- | -------------------------------------------------------- |
| **Inactivity threshold**                       | 180 days (rolling)                                       |
| **What counts as activity?**                   | Any logged activity — visit, call, email, meeting, note  |
| **Who gets notified?**                         | Salesperson + their reporting manager                    |
| **How does a deal exit Stalled?**              | Automatically, when any activity is logged               |
| **Does Stalled affect the pipeline forecast?** | Yes — Stalled deals are excluded from committed pipeline |

---

## Section 5 — Approved Architecture Decision

### Approved Decision:
**Won and Lost are implemented as Opportunity Statuses.**

### Approved Architecture (Option B)

In this adopted model, Won and Lost are **Statuses**, not Stages. The Stage is always preserved at the last active stage.

```
Stage:  Lead | Qualified | Demo | Clinical Eval | Negotiation | Order | Delivery
Status: Active | On-Hold | Stalled | WON | LOST
```

**Example:**

| Deal               | Stage (frozen at closure) | Status | What we learn                    |
| ------------------ | ------------------------- | ------ | -------------------------------- |
| Apollo ICU Monitor | Negotiation    | Lost   | Lost on price at negotiation     |
| MIMS X-Ray         | Clinical Evaluation       | Lost   | Lost during clinical trial phase |
| Aster Ventilator   | Order               | Won    | Won at Order stage                  |

**Why this was chosen:**
- Stage is permanently preserved at the point of win or loss.
- Powerful reporting: *"Where in the pipeline are we losing deals?"*
- Enables sales coaching by identifying pipeline leakage points.
- Supports better forecast calibration over time.
- Aligns with the Cabio Sales OS vision of revenue intelligence.

### Alternative Considered and Rejected (Option A)

*Option A (Won and Lost as Stages) was considered but rejected.* In that approach, Won and Lost would have been the final two stages in the pipeline (Lead → ... → Closed Won / Closed Lost).

**Why it was rejected:**
- When a deal is marked Closed Lost, the stage it was lost at is overwritten.
- It becomes impossible to easily answer: *"At which stage did we lose the most deals last quarter?"*
- Coaching insights are limited — you cannot pinpoint where in the sales process you are losing.

---

## Section 6 — Approved Decisions Summary

| #   | Decision                                  | Approved Outcome                                         |
| --- | ----------------------------------------- | -------------------------------------------------------- |
| 1   | **Stage model**                           | 7-stage model implemented                                |
| 2   | **Win probabilities**                     | Defaults approved; salespeople may override              |
| 3   | **Status model**                          | 5-status model (Active, On-Hold, Stalled, Won, Lost)     |
| 4   | **Won/Lost — Stage or Status?**           | **Statuses** (Stage is preserved at closure)             |
| 5   | **Stalled threshold**                     | 180 days (6 months rolling)                              |
| 6   | **Stalled — what counts as activity?**    | Any logged activity                                      |
| 7   | **Stalled — who gets notified?**          | Both Salesperson and Manager                             |
| 8   | **Stalled — how does deal exit Stalled?** | Automatically on any logged activity                     |
| 9   | **Loss reason — mandatory?**              | Required (must select from list)                         |

---

## Section 7 — Implementation Impact

The approved decisions affect downstream system components as follows:

*   **Enterprise Data Model (EDM):** Opportunity entity must support both `stage_id` and `status_id`.
*   **Physical Data Model (PDM):** Schema must reflect the separation of Stage and Status.
*   **Business Rules:** Enforcement of mandatory loss reasons; rule implementations for the Stalled transition and automated exit.
*   **Pipeline Reporting:** Dashboards must aggregate by Stage while filtering out Terminal and Stalled statuses for committed pipeline views. Loss analysis reports will pivot on the frozen Stage of Lost opportunities.
*   **Forecasting:** Forecast calculations (`Expected Revenue = Value × Win Probability`) must exclude Stalled and Lost deals.
*   **Stalled Monitoring:** A scheduled background job or trigger system must be implemented to evaluate the 180-day inactivity threshold across all active and on-hold opportunities.

---

## Section 8 — Architecture Implementation Guidance

To ensure the system remains flexible for future evolution without requiring schema changes, implement the following:

*   **Reference Data Implementation:** Opportunity Stages and Opportunity Statuses should be implemented as reference/master data (e.g., database tables) rather than hard-coded enums in the application code.
*   **Stage Ordering:** Stage progression and display order should be controlled through a `display_order` integer column on the Stage master table.
*   **Win Probability Defaults:** The default win probability should be stored as an attribute on the Stage definition record.
*   **Status Flags:** Statuses should support operational boolean flags, including:
    *   `is_terminal` (true for Won, Lost)
    *   `is_system_generated` (true for Stalled)

---

## Section 9 — Traceability

This approved architecture supersedes any conflicting proposals. The following downstream artifacts must remain aligned with this specification:

*   `docs/ADR.md`
*   `docs/Business-Rules.md`
*   `docs/Enterprise-Data-Model.md`
