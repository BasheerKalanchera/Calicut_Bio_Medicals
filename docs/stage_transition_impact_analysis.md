# Cabio Sales OS
## Stage Transition Rules — Impact Analysis
### Option B Adoption: 7 Stages + 5 Statuses (Won/Lost as Terminal Statuses)

**Version:** 1.0 — For Internal Review
**Date:** 19 June 2026
**Source Rules:** [Business-Rules.md](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/docs/Business-Rules.md) (Lines 41–73)

---

## 1. What Changes Under Option B

Before analysing individual rules, here is the core structural shift:

| Dimension            | Current PRD Model                                                  | Option B Model                                                                                                   |
| -------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Stages**           | Lead, Qualified, Demo, Negotiation, Order, Closed Won, Closed Lost | Lead, Qualified, Product Demo, Clinical Evaluation, Commercial Negotiation, PO Received, Delivery & Installation |
| **Won/Lost**         | Stages (terminal steps in pipeline)                                | **Statuses** (outcomes that freeze the Stage)                                                                    |
| **Status**           | On-Hold (manual)                                                   | Active, On-Hold, Stalled (auto), Won, Lost                                                                       |
| **Stage count**      | 7 (including Won/Lost)                                             | 7 process stages + 2 terminal statuses                                                                           |
| **Transition model** | Stage moves linearly to Closed Won/Lost                            | Stage moves linearly; Status changes independently                                                               |

---

## 2. Rule-by-Rule Impact Assessment

### BR-OP-00: Opportunity Creation Flexibility

> *"Opportunities may be created at any valid pipeline stage. When created at an advanced stage, all mandatory data for that stage and preceding stages must be present."*

**Impact: MODIFY — Stage names change; logic is preserved**

The underlying rule (create at any stage, backfill mandatory data) is sound and should be retained as-is. Only the **stage names** in the examples need to be updated.

**Required Change:**

| Before                           | After                                             |
| -------------------------------- | ------------------------------------------------- |
| Example references "Negotiation" | Example should reference "Commercial Negotiation" |
| Example references "Demo"        | Example should reference "Product Demo"           |

**No structural change to the rule logic.**

---

### BR-OP-01: Stage Transition Exit Criteria

> *"Opportunities must satisfy specific 'Gate' requirements before progressing to the next stage."*

**Impact: SIGNIFICANT REWRITE REQUIRED**

This is the most affected rule. The current gate table maps to the **old 5-process-stage model** (Lead, Qualified, Demo, Negotiation, Order). Under Option B, the model expands to **7 process stages** and adds two new stages (Clinical Evaluation and Delivery & Installation). Additionally, "Closed Won" and "Closed Lost" are no longer stages — they are statuses — so the gate entries `Order → Closed Won` and `Any Stage → Closed Lost` must be reframed as **status transition gates**, not stage gates.

#### Current Gate Table (PRD)

| Transition              | Mandatory Requirements                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| Lead → Qualified        | Product identified. Budget Range defined. Lead Source defined.                                     |
| Qualified → Demo        | Demo Date defined.                                                                                 |
| Demo → Negotiation      | Demo Outcome recorded. Expected Closure Date defined.                                              |
| Negotiation → Order     | Order Value confirmed. Product Details defined. Shared Ownership Validation. Handover Information. |
| Order → Closed Won      | PO Number entered. Product Details confirmed.                                                      |
| Any Stage → Closed Lost | Loss Reason defined. Competitor Information recorded.                                              |

#### Proposed Revised Gate Table (Option B)

| Transition                                       | Type              | Mandatory Requirements                                                                                                                             | Change from PRD                                   |
| ------------------------------------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Lead → Qualified**                             | Stage             | 1. Product identified. 2. Budget Range defined. 3. Lead Source defined.                                                                            | ✅ No change                                       |
| **Qualified → Product Demo**                     | Stage             | 1. Demo Date defined (single date or range).                                                                                                       | ✅ No change (renamed stage only)                  |
| **Product Demo → Clinical Evaluation**           | Stage             | 1. Demo Outcome recorded. 2. Clinical contact identified (doctor/BME). 3. Clinical evaluation start date defined.                                  | 🆕 New gate (new stage added)                      |
| **Clinical Evaluation → Commercial Negotiation** | Stage             | 1. Clinical Evaluation Outcome recorded (Pass/Fail/Conditional). 2. Expected Closure Date defined.                                                 | 🔄 Split from old Demo → Negotiation gate          |
| **Commercial Negotiation → PO Received**         | Stage             | 1. Order Value confirmed. 2. Product Details defined. 3. Shared Ownership Validation completed (if applicable). 4. Handover Information completed. | ✅ Equivalent to old Negotiation → Order           |
| **PO Received → Delivery & Installation**        | Stage             | 1. PO Number entered. 2. Delivery Date scheduled. 3. Installation Site confirmed.                                                                  | 🔄 Replaces old Order → Closed Won gate            |
| **Delivery & Installation (complete)**           | Stage             | No additional stage to move to. Status = Won is set here.                                                                                          | 🆕 Terminal stage; triggers Won status             |
| **Any Stage → Won**                              | **Status**        | 1. PO Number entered. 2. Product Details confirmed.                                                                                                | 🔄 Moved from stage gate to status transition gate |
| **Any Stage → Lost**                             | **Status**        | 1. Loss Reason defined (from Appendix A). 2. Competitor name recorded (optional but encouraged).                                                   | 🔄 Moved from stage gate to status transition gate |
| **Any Stage → On-Hold**                          | **Status**        | 1. Hold Reason defined (from Appendix A). 2. Reactivation Date defined (must be future date).                                                      | ✅ No change (already in BR-OP-02)                 |
| **System → Stalled**                             | **Status (Auto)** | Triggered automatically: No activity recorded for 180 consecutive days.                                                                            | 🆕 New rule (BR-OP-04, see below)                  |

> **Key design point:** Under Option B, "Closed Won" and "Closed Lost" no longer appear as rows in the stage gate table. Instead, they appear as **status transition gates** — a separate, parallel set of rules. The Stage at the time of the status change is **frozen** and preserved in the audit record.

---

### BR-OP-02: On-Hold Discipline

> *"Moving an opportunity to 'On Hold' is a guarded transition. Mandatory: hold_reason (Enum) and reactivation_date (Date). reactivation_date must be in the future. When current_date >= reactivation_date, flag as 'Reactivation Overdue'."*

**Impact: MINOR MODIFY — Logic is sound; one addition needed**

The On-Hold rule is well-designed and survives Option B unchanged in its core logic. However, one addition is required:

**Addition:** Under Option B, **On-Hold and Stalled are distinct statuses**. The existing BR-OP-02 covers On-Hold (manual). A new rule BR-OP-04 is needed to govern Stalled (automatic). See below.

**Also clarify:** When an On-Hold deal is reactivated:
- Status should return to **Active** (not to a stage)
- The stage remains whatever it was when On-Hold was set

No other changes required to BR-OP-02.

---

### BR-OP-03: Closed Lost Validation

> *"Moving an Opportunity to Closed Lost is a guarded transition. Mandatory: loss_reason. Optional: loss_notes, competitor_name. Closed Lost opportunities must retain historical stage, value, and contributor information."*

**Impact: REFRAME REQUIRED — This becomes a Status Transition Rule, not a Stage Rule**

Under the current PRD, "Closed Lost" is treated as a Stage. Under Option B, it is a **Status**. This changes how the rule is framed but **not what it requires**.

**Proposed Revised Rule:**

> **BR-OP-03: Lost Status Transition Validation**
> Moving an Opportunity Status to **Lost** is a guarded transition.
> - **Mandatory Fields:** `loss_reason` (Enum, from Appendix A)
> - **Optional Fields:** `loss_notes`, `competitor_name`
> - **Validation:** The Opportunity's **Stage at the time of Loss must be frozen** and preserved in the record. It must not be overwritten.
> - **Validation:** All historical stage visits, deal value, and contributor splits must be retained for reporting.

The validation requirement in the last line — *"retain historical stage, value, and contributor information"* — was **anticipating the need for Option B behaviour** even in the current PRD. Option B formalises this intent in the data model.

---

### 🆕 BR-OP-04: Stalled Status Auto-Detection (New Rule Required)

This rule does not exist in the current PRD. It is required under Option B.

> **BR-OP-04: Stalled Opportunity Detection**
> - **Trigger:** Automated system job (daily batch or event-driven)
> - **Condition:** An Opportunity in **Active** or **On-Hold** status has had no recorded Activity for **180 consecutive days**
> - **Action:** Status is automatically changed to **Stalled**
> - **Notification:** Salesperson and their reporting Manager are notified
> - **Exit Condition:** When any Activity is logged against the Opportunity, status automatically returns to **Active**
> - **Forecast Impact:** Stalled Opportunities are excluded from the **Committed Pipeline** view but remain visible in the Total Pipeline view with 0% win probability applied
> - **Audit Requirement:** All Stalled transitions (entry and exit) must be recorded in the audit trail

**Open question for client:** Should On-Hold deals also be evaluated for Stalled status after 180 days, or should the On-Hold status suppress the Stalled rule?

---

## 3. Impact on Financial Rules

### BR-FIN-01: Contributor Split Validation
**Impact: No change.** The 100% split rule is independent of the stage/status model.

### BR-FIN-03: Opportunity Value Calculation
**Impact: No change.** Value is derived from Opportunity Items. Stage/status model does not affect this.

### BR-FIN-04: Split Governance
> *"Contributor splits may be modified only while an Opportunity remains open."*

**Impact: CLARIFY DEFINITION OF "OPEN"**

Under Option B, "open" needs to be formally defined:

| Status  | Is the deal "Open"?       | Can splits be modified? |
| ------- | ------------------------- | ----------------------- |
| Active  | Yes                       | ✅ Yes                   |
| On-Hold | Yes (paused, not closed)  | ✅ Yes                   |
| Stalled | Yes (flagged, not closed) | ✅ Yes                   |
| Won     | **No — Terminal**         | ❌ No                    |
| Lost    | **No — Terminal**         | ❌ No                    |

**Proposed addition to BR-FIN-04:** Define "open" as any Opportunity with a Status of Active, On-Hold, or Stalled. Won and Lost are terminal and splits are locked.

---

## 4. Impact on Activity Rules

### BR-ACT-01: Opportunity Support
> *"Every interaction (Activity) should ideally be linked to an Opportunity to count towards pipeline velocity."*

**Impact: ENHANCEMENT OPPORTUNITY**

Under Option B, Activity logging directly controls Stalled status transitions. This makes BR-ACT-01 operationally critical, not just a pipeline velocity rule.

**Proposed addition to BR-ACT-01:**

> Activities linked to an Opportunity reset the Stalled clock. An Opportunity will not be auto-flagged as Stalled while activities are being regularly logged. This creates a direct incentive for salespeople to log activities — the pipeline stays healthy and visible.

---

## 5. Impact on Section 8 — Unresolved Logic

The existing PRD has three unresolved questions. Option B partially resolves two of them:

| #   | Unresolved Question                                                                                             | Impact Under Option B                                                                                                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | *"Does a cross-SBU split require approval from both SBU managers?"*                                             | **Not affected.** Independent of stage/status model. Still unresolved.                                                                                                                                                                                                          |
| 2   | *"If an 'Order' is cancelled, does it go back to 'Negotiation' or straight to 'Lost'?"*                         | **Partially resolved.** Under Option B: the equivalent of "Order cancelled" would be: Stage remains at **PO Received**, Status changes to **Lost** with Loss Reason = `ORDER_CANCELLED` (new loss reason to be added to Appendix A). The deal does NOT move backwards in stage. |
| 3   | *"If a Project (Tender) bid deadline is missed, does the system auto-mark all linked Opportunities as 'Lost'?"* | **Not affected.** Independent of stage/status model. Still unresolved.                                                                                                                                                                                                          |

> **Recommendation:** Add `ORDER_CANCELLED` to the Loss Reason reference data in Appendix A.

---

## 6. Summary — All Actions Required

| #   | Rule           | Action Required                                                                                    | Priority |
| --- | -------------- | -------------------------------------------------------------------------------------------------- | -------- |
| 1   | **BR-OP-00**   | Update stage name examples (Demo → Product Demo, Negotiation → Commercial Negotiation)             | Low      |
| 2   | **BR-OP-01**   | Full rewrite of Stage Gate table — add 2 new stage gates, reframe Won/Lost as status gates         | **High** |
| 3   | **BR-OP-02**   | Add clarification: On-Hold → Active on reactivation; Stage is preserved                            | Medium   |
| 4   | **BR-OP-03**   | Reframe as a Status Transition rule (not a Stage rule). Add: Stage must be frozen at point of Loss | **High** |
| 5   | **BR-OP-04**   | **Write new rule** for Stalled auto-detection (does not exist in current PRD)                      | **High** |
| 6   | **BR-FIN-04**  | Add formal definition of "open" = Active / On-Hold / Stalled                                       | Medium   |
| 7   | **BR-ACT-01**  | Add: Activity logging resets the Stalled detection clock                                           | Medium   |
| 8   | **Appendix A** | Add `ORDER_CANCELLED` to Loss Reason values                                                        | Low      |

---

## 7. What Does NOT Change

The following rules are **completely unaffected** by Option B adoption:

- BR-PL-01 through BR-PL-04 (Planning Domain)
- BR-PROJ-01 (Project Lifecycle)
- BR-FIN-01, BR-FIN-02, BR-FIN-03 (Financial Rules)
- BR-ACC-01, BR-ACC-02 (Account & Stakeholder Rules)
- BR-ACT-02 (Manager Push Logging)
- BR-AUD-01 (Audit & History)

---

## 8. Recommendation

> Option B adoption requires **targeted, well-scoped changes** to 4 existing rules and the creation of 1 new rule. It does **not** require a wholesale rewrite of the Business Rules Catalog.
>
> The most important structural change is the reframing of BR-OP-01 and BR-OP-03 — separating **Stage gates** from **Status transition gates**. This is a clean, manageable change.
>
> Once the customer confirms the decisions in the Opportunity Stages & Status Design Brief, the Business Rules Catalog can be updated in a single targeted revision.

---

*This analysis was prepared against Business-Rules.md v1.0 (June 18, 2026). No changes have been made to the source document. All modifications above are proposals pending customer and architect approval.*
