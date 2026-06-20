# Change Summary: Opportunity Stages & Status Architecture

This document summarizes the changes made to convert the "Opportunity Stages & Status Design Brief" into the final approved architecture specification.

**1. New Document Created**
- Created a new file: `opportunity_stages_and_status_architecture.md`
- The original design brief (`opportunity_stages_and_status_design_brief.md`) is preserved untouched.

**2. Document Metadata & Purpose (Updates A & B)**
- Changed Status from "Pending Customer Approval" to "Approved Architecture Baseline".
- Added "Approved By: Cabio Leadership Team".
- Added "Decision Date: 20 June 2026".
- Rewrote the Purpose section to clearly state that this document is the authoritative source for the approved architecture, removing all consultative language ("Your input is required", "For review").

**3. Opportunity Stages & Win Probabilities**
- Updated headings from "Proposed" to "Approved".
- Retained the 7 approved stages (Lead to Delivery & Installation).
- Preserved win probabilities as defaults, explicitly stating salespeople may override them.

**4. Opportunity Status Model (Update C)**
- Separated statuses into **Operational Statuses** (Active, On-Hold, Stalled) and **Terminal Statuses** (Won, Lost).
- Removed "Proposed" language.

**5. Stalled Rules (Update G)**
- Renamed "Business Rules for Stalled (Decisions Required)" to "Approved Business Rules for Stalled".
- Converted all rules to definitive language (e.g., 180 days inactivity threshold, any logged activity counts, automatic exit).

**6. Won/Lost Architecture Decision (Updates D, E, F)**
- Renamed Section 5 to "Approved Architecture Decision".
- Stated clearly: "Approved Decision: Won and Lost are implemented as Opportunity Statuses."
- Moved "Option A" to a new subsection titled "Alternative Considered and Rejected" to preserve traceability.
- Renamed "Option B" to "Approved Architecture".

**7. Decisions Summary (Update H)**
- Renamed Section 6 to "Approved Decisions Summary".
- Replaced the consultative options table with a definitive "Decision" and "Approved Outcome" table detailing the 9 confirmed decisions.

**8. Implementation Impact (Update I)**
- Renamed Section 7 to "Implementation Impact".
- Detailed how the approved decisions affect the EDM, PDM, Business Rules, Pipeline Reporting, Forecasting, and Stalled Monitoring.

**9. Architecture Implementation Guidance (Update J)**
- Added a new section mandating that Stages and Statuses be implemented as reference/master data (not hard-coded enums), with `display_order`, default win probabilities, and operational flags (`is_terminal`, `is_system_generated`).

**10. Traceability (Update K)**
- Added a traceability section referencing `ADR.md`, `Business-Rules.md`, and `Enterprise-Data-Model.md` as downstream artifacts that must align with this specification.
