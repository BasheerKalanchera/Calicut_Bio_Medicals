## 

## **Cabio Sales OS**  

## **Opportunity Stages & Status** 

## Design Brief

## 

## **Table of Contents**

[Table of Contents](#heading=h.426fcmsztkpr)

[Purpose of This Document](#purpose-of-this-document)

[Background](#background)

[Section 1 — Proposed Opportunity Stages](#section-1-—-proposed-opportunity-stages)

[The Recommended Model](#the-recommended-model)

[Terminal Outcomes](#terminal-outcomes)

[Section 2 — Proposed Win Probability by Stage](#section-2-—-proposed-win-probability-by-stage)

[Important Design Principles](#important-design-principles)

[Section 3 — Proposed Opportunity Status Model](#section-3-—-proposed-opportunity-status-model)

[Proposed Statuses](#proposed-statuses)

[Section 4 — The Stalled Status](#section-4-—-the-stalled-status)

[What is Stalled?](#what-is-stalled?)

[Why is this important?](#why-is-this-important?)

[How Stalled differs from On-Hold](#how-stalled-differs-from-on-hold)

[Business Rules for Stalled (Decisions Required)](#business-rules-for-stalled-\(decisions-required\))

[Section 5 — Key Architectural Decision Required](#section-5-—-key-architectural-decision-required)

[The Question](#the-question)

[Option A — Won and Lost as Stages (Simpler)](#option-a-—-won-and-lost-as-stages-\(simpler\))

[Option B — Won and Lost as Statuses (Analytically Superior — Recommended)](#option-b-—-won-and-lost-as-statuses-\(analytically-superior-—-recommended\))

[Recommendation](#recommendation)

[Section 5A \- How Stage Transition Rules Change Under Option B](#section-5a---how-stage-transition-rules-change-under-option-b)

[What are Stage Transition Rules?](#what-are-stage-transition-rules?)

[Current Gate Rules vs. Proposed Gate Rules](#current-gate-rules-vs.-proposed-gate-rules)

[Stage Gates (Movement through the sales process)](#stage-gates-\(movement-through-the-sales-process\))

[Status Transition Rules (How a deal exits the pipeline)](#status-transition-rules-\(how-a-deal-exits-the-pipeline\))

[What This Resolves](#what-this-resolves)

[Section 6 — Summary of All Decisions Required](#section-6-—-summary-of-all-decisions-required)

[Section 7 — What Happens Next](#section-7-—-what-happens-next)

[Appendix — Glossary](#appendix-—-glossary)

## 

## **Purpose of This Document** {#purpose-of-this-document}

This document presents the proposed design for **Opportunity Stages** and **Opportunity Status** in the Cabio Sales OS. It covers:

* The recommended deal stages for medical equipment sales  
* Win probability defaults at each stage  
* The deal status model (Active, On-Hold, Stalled, Won, Lost)  
* A key architectural decision that requires customer input before implementation begins

This document is not a final specification. It is a structured brief to help your team make informed decisions before the physical data model is built.

---

## **Background** {#background}

In a Sales Operating System, two fields track the state of every opportunity:

| Field | Question it answers |
| :---- | :---- |
| **Stage** | *Where is this deal in the sales process?* |
| **Status** | *What is the current state of this deal?* |

These are related but distinct concepts. Getting this right at the design stage avoids costly rework later.

## 

## **Section 1 — Proposed Opportunity Stages** {#section-1-—-proposed-opportunity-stages}

### The Recommended Model {#the-recommended-model}

The following seven stages are proposed for the Cabio Sales OS, designed specifically for capital medical equipment sales in the Indian market:

| \# | Stage | What it means |
| :---- | :---- | :---- |
| 1 | **Lead** | An unvalidated enquiry or potential interest. Budget, authority, and need have not yet been confirmed. |
| 2 | **Qualified** | The opportunity is validated. Budget, decision authority, clinical need, and timeline have been confirmed. The deal is real. |
| 3 | **Demo** | A product demonstration has been scheduled or completed. The customer is actively evaluating the solution. |
| 4 | **Clinical Evaluation** | The customer has committed clinical resources (doctors, biomedical engineers, department heads) to evaluate the product in a clinical setting. This is a high-commitment stage. |
| 5 | **Negotiation** | Clinical evaluation is complete. The customer has shortlisted the product. Commercial terms — pricing, payment schedule, warranty, AMC — are being negotiated. |
| 6 | **Order** | A Purchase Order has been received. The deal is commercially confirmed. Execution (delivery and installation) is in progress. |
| 7 | **Delivery & Installation** | Equipment has been delivered and is being installed and commissioned at the customer site. The deal is pending final acceptance. |

### Terminal Outcomes {#terminal-outcomes}

Two terminal outcomes exist:

| Outcome | What it means |
| :---- | :---- |
| **Won** | The deal has been successfully closed. Revenue is confirmed. |
| **Lost** | The deal has been lost to a competitor, or the customer has decided not to proceed. |

**Note on "Lead" as a Stage:** In some CRM systems, a Lead is treated as a separate object before it becomes an Opportunity. In the Cabio Sales OS Phase 1 model, Lead is included as the first stage of an Opportunity for simplicity. This can be revisited in a future phase if a separate lead management workflow is required.

## **Section 2 — Proposed Win Probability by Stage** {#section-2-—-proposed-win-probability-by-stage}

Win probability represents the likelihood of a deal closing successfully at a given stage. These are **system defaults** — salespeople can override them based on field intelligence.

| Stage | Default Win Probability | Rationale |
| :---- | :---- | :---- |
| **Lead** | 5% | Most enquiries do not convert. Low confidence at this stage. |
| **Qualified** | 20% | Real intent is confirmed, but significant selling work remains. |
| **Demo** | 35% | The customer is engaged but may still be evaluating multiple vendors. |
| **Clinical Evaluation** | 55% | A significant commitment from the customer. Clinical teams have invested time. Difficult for customers to reverse course without strong reason. |
| **Negotiation** | 70% | Commercial intent is established. The deal is being structured. Risk of loss is primarily on price or competitor action. |
| **Order** | 90% | Order is confirmed. Residual risk is limited to delivery failure or cancellation. |
| **Delivery & Installation** | 95% | Near-certain closure. Risk is only technical acceptance failure. |
| **Won** | 100% |  |
| **Lost** | 0% |  |

### Important Design Principles {#important-design-principles}

1. **Salesperson Override**: Salespeople must be able to override the default win probability based on ground-level intelligence. The system provides a default; the salesperson provides market reality.  
2. **Pipeline Forecasting**: These probabilities drive weighted pipeline calculations (Expected Revenue \= Deal Value × Win Probability). Getting these defaults right is critical for forecast accuracy.  
3. **Clinical Evaluation is a pivot point**: The jump from 35% (Demo) to 55% (Clinical Evaluation) reflects the high commitment cost to the customer at this stage. If your sales data suggests this jump is too aggressive or too conservative, it should be adjusted after the first full sales cycle.

## **Section 3 — Proposed Opportunity Status Model** {#section-3-—-proposed-opportunity-status-model}

Status answers a different question from Stage:

* **Stage** \= Where is the deal in the process?  
* **Status** \= Is the deal actively being worked right now?

### Proposed Statuses {#proposed-statuses}

| Status | Type | How it is Set | What it Means |
| :---- | :---- | :---- | :---- |
| **Active** | Operational | Manual (Salesperson) | The deal is being actively worked. This is the default state for all open opportunities. |
| **On-Hold** | Operational | Manual (Salesperson) | The salesperson has deliberately paused this deal. There is a known reason — e.g., the customer has requested a delay, waiting for a new financial year, budget or pending a tender notification. |
| **Stalled** | Operational | **Automatic (System)** | The system has detected no activity on this deal for 180 consecutive days. The deal is flagged for review by the salesperson and manager. |
| **Won** | Terminal | Manual  (Salesperson) | The deal is closed successfully. |
| **Lost** | Terminal | Manual (Salesperson) | The deal has been lost. A loss reason should be recorded. |

## 

## **Section 4 — The Stalled Status** {#section-4-—-the-stalled-status}

### What is Stalled? {#what-is-stalled?}

Stalled is a **system-driven status** — it is not set by the salesperson. The system automatically flags an opportunity as Stalled when there has been no recorded activity (visit, call, email, note, or meeting) for **180 consecutive days**.

### Why is this important? {#why-is-this-important?}

In medical equipment sales, some deals move slowly — especially government tenders and institutional purchases. Without a system-driven flag, these deals can remain in the pipeline indefinitely, inflating the forecast without any realistic chance of closure.

Stalled serves as an early warning system for management to identify neglected deals.

### How Stalled differs from On-Hold {#how-stalled-differs-from-on-hold}

|  | On-Hold | Stalled |
| :---- | :---- | :---- |
| **Who sets it?** | Salesperson (deliberate) | System (automatic) |
| **Does the salesperson know?** | Yes — they set it intentionally | May not be aware |
| **Is there a known reason?** | Yes | Not necessarily |
| **What action is needed?** | Move to “Active” status when ready | Manager review \+ salesperson follow-up |
| **Example scenario** | "Customer asked us to wait until Q3 budget approval" | "No visit, call, or note logged in 6+ months" |

### 

### Business Rules for Stalled (Decisions Required) {#business-rules-for-stalled-(decisions-required)}

The following business rules need to be confirmed before implementation:

| Rule | Proposed Default | Confirm / Modify? |
| :---- | :---- | :---- |
| **Inactivity threshold** | 180 days (rolling) |  |
| **What counts as activity?** | Any logged activity — visit, call, email, meeting, note |  |
| **Who gets notified?** | Salesperson \+ their reporting manager |  |
| **How does a deal exit Stalled status?** | Automatically, when any activity is logged |  |
| **Does Stalled affect the pipeline forecast?** | Yes — Stalled deals are excluded from committed pipeline |  |

**Recommendation:** Stalled is classified as a **Phase 1 requirement**, not a future enhancement, because your business has a concrete rule: deals with no activity for 6 months need to be flagged.

## 

## **Section 5 — Key Architectural Decision Required** {#section-5-—-key-architectural-decision-required}

### The Question {#the-question}

**Should "Won" and "Lost" be Stages or Statuses?**

This is the most important design decision in this document. It has a direct impact on what data you can report on after deals are closed.

---

### **Option A — Won and Lost as Stages *(Simpler)*** {#option-a-—-won-and-lost-as-stages-(simpler)}

In this approach, Won and Lost are the final two stages in the pipeline, consistent with how Salesforce and HubSpot work by default, and how the prototype is designed at the moment.

Lead → Qualified → Demo → Clinical Evaluation   
→ Negotiation → Order → Delivery & Installation   
→ Closed Won / Closed Lost

**What you gain:**

* Simpler to implement  
* Familiar to salespeople who have used standard CRM tools  
* Easy to visualise on a KANBAN board

**What you lose:**

* When a deal is marked Closed Lost, the stage it was lost at is overwritten  
* You cannot easily answer: *"At which stage did we lose the most deals last quarter?"*  
* Coaching insights are limited — you cannot pinpoint where in the sales process you are losing deals

### 

### **Option B — Won and Lost as Statuses *(Analytically Superior — Recommended)*** {#option-b-—-won-and-lost-as-statuses-(analytically-superior-—-recommended)}

In this approach, Won and Lost are **Statuses**, not Stages. The Stage is always preserved at the last active stage.

**Stage:**  Lead → Qualified → Demo → Clinical Evaluation → Negotiation → Order → Delivery & Installation  
**Status:** Active | On-Hold | Stalled | WON | LOST

**Example:**

| Deal | Stage  (frozen at closure) | Status | What we learn |
| :---- | :---- | :---- | :---- |
| Apollo ICU Monitor | Commercial Negotiation | Lost | Lost on price at negotiation |
| MIMS X-Ray | Clinical Evaluation | Lost | Lost during clinical trial phase |
| Aster Ventilator | PO Received | Won | Won at PO stage |

**What you gain:**

* Stage is permanently preserved at the point of win or loss  
* Powerful to identify pipeline leakage: *"Where in the pipeline are we losing deals?"*  
* Enables sales coaching by identifying pipeline leakage points  
* Supports better forecast calibration over time  
* Aligns with the Cabio Sales OS future vision of revenue intelligence

**What you gain in reporting (examples):**

* "We lost 5 of 8 deals at Clinical Evaluation last quarter — possible product gap?"  
* "3 deals stalled at Commercial Negotiation for more than 90 days — pricing issue?"  
* "Our win rate at PO Received stage is 94% — very low risk once PO is confirmed"

**What is slightly more complex:**

* Requires a two-field model (Stage \+ Status) rather than a single Stage field  
* UI design needs to handle Won/Lost as statuses clearly (not as pipeline columns)  
* Implementation is slightly more complex than Option A

---

### Recommendation {#recommendation}

**Option B is recommended** for the Cabio Sales OS.

The Cabio Sales team needs to know, not just that deals were lost, but **where** in the process they were lost and **why**. Option A does not support this. 

The additional implementation complexity is low relative to the long-term analytical value.

## **Section 5A \- How Stage Transition Rules Change Under Option B** {#section-5a---how-stage-transition-rules-change-under-option-b}

### What are Stage Transition Rules? {#what-are-stage-transition-rules?}

Every opportunity must meet specific minimum requirements before it can move from one stage to the next. These are called **Stage Gates** or **Exit Criteria**. They exist to ensure data quality and process discipline — a deal cannot advance without the right information being recorded at each stage.

Adopting Option B (7 stages \+ Won/Lost as Statuses) requires updating these gates. Some gates remain unchanged. Some need to be rewritten. Two entirely new gates are added. And the "Closed Won" and "Closed Lost" gates are restructured as **Status Transition Rules** — a separate, parallel concept from Stage gates.

---

### Current Gate Rules vs. Proposed Gate Rules {#current-gate-rules-vs.-proposed-gate-rules}

#### **Stage Gates (Movement through the sales process)** {#stage-gates-(movement-through-the-sales-process)}

| Transition | Current Rule (PRD) | Proposed Rule (Option B) | Change? |
| :---- | :---- | :---- | :---- |
| **Lead → Qualified** | Product identified. Budget Range defined. Lead Source defined. | *(unchanged)* | ✅ No change |
| **Qualified → Demo** | Demo Expected Date range defined. | *(unchanged)* | ✅ No Change |
| **Demo → Clinical Evaluation** | *(did not exist)* | 1\. Demo Outcome recorded. 2\. Clinical contact identified (doctor or biomedical engineer). 3\. Clinical evaluation start date defined. | 🆕 New gate |
| **Clinical Evaluation → Negotiation** | *(was Demo → Negotiation: Demo Outcome \+ Expected Closure Date)* | 1\. Clinical Evaluation Outcome recorded. 2\. Expected Closure Date defined. | 🔄 Split from old gate |
| **Negotiation → Order** | Order Value confirmed. Product Details defined. Shared Ownership Validation. Handover Information. | *(unchanged)* | ✅ No Change |
| **Order → Delivery & Installation** | *(did not exist as a separate gate — was Order → Closed Won)* | 1\. PO Number entered. 2\. Delivery Date scheduled. 3\. Installation Site confirmed. | 🆕 New gate |

#### **Status Transition Rules (How a deal exits the pipeline)** {#status-transition-rules-(how-a-deal-exits-the-pipeline)}

Under Option B, "Won" and "Lost" are no longer stages — they are **outcomes applied as a Status change**. This means their entry criteria become Status Transition Rules, not Stage gates.

**What this means in practice:** A salesperson can mark a deal as Won or Lost from any stage — Lead, Clinical Evaluation, Negotiation, anywhere. The Stage is frozen at its current value. The system records both the Stage and the Status together, enabling powerful reporting:

| Status Transition | Who Triggers It | Mandatory Requirements |
| :---- | :---- | :---- |
| **Any Stage → Won** | Salesperson (manual) | 1\. PO Number entered. 2\. Product details confirmed. |
| **Any Stage → Lost** | Salesperson (manual) | 1\. Loss Reason selected (from approved list). 2\. Competitor name recorded (if loss reason \= COMPETITOR\_WON). |
| **Any Stage → On-Hold** | Salesperson (manual) | 1\. Hold Reason selected (from approved list). 2\. Reactivation Date defined (must be a future date). |
| **Any Stage → Stalled** | System (automatic) | Triggered when no activity is recorded for 180 consecutive days. No manual action required. |
| **Stalled → Active** | System (automatic) | Triggered automatically when any activity is logged against the opportunity. |

---

### What This Resolves {#what-this-resolves}

The question *"If an Order is cancelled, does it go back to Negotiation or go straight to Lost?"* — is cleanly resolved by Option B:

Under Option B, the Stage **does not move backwards**. The Stage remains at **Order**. The Status changes to **Lost** with Loss Reason \= *Order Cancelled*. This preserves the true history of the deal.

## 

## **Section 6 — Summary of All Decisions Required** {#section-6-—-summary-of-all-decisions-required}

Please review each item and confirm your decision:

| \# | Decision | Options | Recommendation |
| :---- | :---- | :---- | :---- |
| 1 | **Stage model** | 7-stage model as proposed | Proceed with 7-stage model |
| 2 | **Win probabilities** | Accept defaults / Adjust values | Accept defaults and manual override by salesperson |
| 3 | **Status model** | 5-status model (Active, On-Hold, Stalled, Won, Lost) | Accept as proposed |
| 4 | **Won/Lost — Stage or Status?** | Option A (Stages) / Option B (Statuses) | **Option B — Statuses (Recommended)** |
| 5 | **Stalled threshold** | 180 days / Different period | 180 days (6 months rolling) |
| 6 | **Stalled — what counts as activity?** | Any logged activity / Stage movement only | Any logged activity |
| 7 | **Stalled — who gets notified?** | Salesperson only / Salesperson \+ Manager | Both |
| 8 | **Stalled — how does a deal exit Stalled?** | Any activity logged / Manual reset only | Automatically on any logged activity |
| 9 | **Loss reason — mandatory?** | Yes, required / Optional | Recommended: Required (select from list) |

---

## **Section 7 — What Happens Next** {#section-7-—-what-happens-next}

Once the above decisions are confirmed:

1. The **physical data model** for the Opportunity entity will be finalised  
2. Stage and Status fields will be formally defined with allowed values and transition rules  
3. Win probability defaults will be coded into the system with override capability  
4. The Stalled auto-flagging business rule will be implemented as a scheduled job  
5. Pipeline reporting and forecast calculations will be aligned to the approved model

## **Appendix — Glossary** {#appendix-—-glossary}

| Term | Definition |
| :---- | :---- |
| **Stage** | A step in the sales process that reflects where the deal currently stands in the selling cycle. |
| **Status** | The current operational state of a deal — whether it is being actively worked, paused, flagged, won, or lost. |
| **Stage Gate** | A set of minimum requirements that must be satisfied before a deal can advance from one stage to the next. Also called Exit Criteria. |
| **Status Transition Rule** | A set of requirements that must be satisfied before a deal's Status can be changed (e.g., to Won or Lost). Distinct from Stage gates. |
| **Win Probability** | The estimated likelihood (%) that a deal at a given stage will eventually close as Won. Used for weighted pipeline and forecast calculations. |
| **Stalled** | A system-generated status applied when no activity has been recorded on an opportunity for more than 180 days. |
| **On-Hold** | A manually applied status indicating that the salesperson has intentionally paused work on a deal for a known reason. |
| **Terminal Status** | A final, irreversible state — Won or Lost. Once a deal reaches a terminal status, it exits the active pipeline. |
| **Pipeline Leakage** | The rate at which deals drop out of the sales pipeline at each stage. Identifying leakage points is a key sales coaching tool. |

---

***Note**: This document was prepared by the ZABISK (Cabio Sales OS Phase 1\) project team. It is intended for review and decision-making by the client. No implementation work will commence on the data model until the decisions in Section 6 are formally confirmed.*

