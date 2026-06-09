# Cabio Sales OS – Phase 1: Product Management Gap Analysis

**Author:** Product Manager, Cabio Sales OS  
**Date:** June 7, 2026  
**Document Reference:** reviews/prototype/PM-Gap-Analysis-v1.md  
**Objective:** Compare the React prototype under the `sales-os-app` folder against the approved `docs/Cabio Sales OS – Phase 1 - PRD.md` to identify screens, reports, dashboards, navigation elements, and user journeys that are missing or incomplete.

---

## **Executive Summary**

The React prototype provides a visually appealing and responsive foundation for the Cabio Sales OS client. It implements the basic sales pipeline flow, customer list, product catalog, and next-action reminders. However, several critical governance, security, reporting, and operational elements outlined in the Phase 1 PRD are currently missing. Key areas requiring implementation include shared opportunity ownership (contribution splitting), opportunity "On Hold" state handling, structured Closed-Won handovers, geographic routing based on customer PIN code mapping, and the General Manager (GM) view.

Below is the structured gap analysis listing all missing features and items compared to the Phase 1 PRD.

---

## **Gap Analysis Table**

| Priority | Requirement | Current Status | Recommendation |
| :--- | :--- | :--- | :--- |
| **High** | **Account Structure & Hierarchy (PRD 1.1)** | Currently a flat list of accounts. No parent-child linking for multi-location groups. | Implement relationships to link `Corporate Group` $\rightarrow$ `Hospital` $\rightarrow$ `Department`. |
| **High** | **Opportunity State - "On Hold" (PRD 3.3)** | Missing. Opportunities only have active pipeline stages; no "On Hold" state exists. | Add an `On Hold` state separate from active stages. Include input fields for Hold Reason, expected reactivation date, and logic to exclude these from forecasts. |
| **High** | **Stage Exit Criteria Enforcement (PRD 3.4)** | Enforcement is missing. The user can advance stages without providing required information. | Enforce mandatory fields in the UI: product & budget for *Qualified*; demo date & outcome for *Demo*; and order value & products for *Closed Won*. |
| **High** | **Shared Opportunity Ownership (PRD 3.5)** | Opportunities are restricted to a single owner. Shared ownership and contribution percentage splitting are missing. | Add a contributors section. Capture Team Roles (e.g., Application Engineer, Star Closer) and enforce 100% total contribution splitting on *Closed Won*. |
| **High** | **Closed-Won Handover (PRD 3.13)** | Missing. No screen or form exists to capture delivery notes or service coordination details. | Launch a Handover Form upon marking a deal *Closed Won* to collect delivery notes, installation requirements, and coordination comments. |
| **High** | **GM Dashboard & Role (PRD 5.5 / 7.0)** | Missing. The GM role is not selectable, and the GM Dashboard screen is completely absent. | Add a dedicated `GM` role and dashboard showing Zone Performance, Product Performance, Competitive Loss Analysis, and Forecast vs Budget. |
| **High** | **PIN Code Geographic Routing (PRD 6.2)** | Zones are hardcoded on customers. PIN Code-to-Zone automatic derivation is missing. | Add a `PINCode` attribute to accounts. Write logic to automatically derive the zone and restrict user visibility based on geographical boundaries. |
| **High** | **Manager Approval Workflows (PRD 8.1)** | Missing. No approval mechanisms exist for opportunity updates, ownership changes, or overrides. | Build an Approvals Queue screen for managers to review and approve ownership changes, contribution overrides, and value threshold adjustments. |
| **High** | **Core Reports Library (PRD 5.6 - 5.14 / Appendix A)** | The Insights screen only shows high-level metric cards. None of the Appendix A reports are present. | Build a Reports page containing filterable tables for Weighted/Unweighted Forecasts, Installed Base, and Opportunity Aging. |
| **High** | **Mandatory Interaction Logging (PRD 4.3)** | Next Action, Due Date, and Owner are optional in the UI. | Make Next Action details, Due Date, and Owner mandatory fields to save any interaction. |
| **Medium** | **Customer Status Classification (PRD 1.3A)** | Missing. The customer status attribute is not captured. | Add a "Customer Status" (Prospect, Active, Inactive, Strategic Account) attribute separate from Customer Tier. |
| **Medium** | **Customer Segmentation & Tiers (PRD 1.2 / 1.3)** | Segment flags (hospital size, revenue potential) and Tiering (Tier 1 vs Tier 2) are missing. | Add segmentation fields and Tier classifications to the customer edit/create forms. |
| **Medium** | **Customer Profile Fields (PRD 1.4)** | Customer profile only records city and zone. Phone, WhatsApp, and email are missing. | Add phone, email, and WhatsApp fields to the Customer profile page. |
| **Medium** | **Stakeholder Influence Assessment (PRD 1.4)** | Stakeholders have roles, but influence level (High, Medium, Low) is missing. | Add an influence level drop-down for stakeholders in the Customer 360 View. |
| **Medium** | **Document Management (PRD 1.4)** | Missing. There is no document storage interface in the Customer 360 View. | Implement a Documents panel in Customer 360 to upload and view PNDT Approvals, Contracts, and Installation Certificates. |
| **Medium** | **Product & SBU Assignment Structure (PRD 2.1)** | Products only have a category. Separate Brand, Model, SBU, and OEM details are missing. | Re-structure catalog products to support SBU assignment (Imaging vs Critical Care) and associate with Brands and Models. |
| **Medium** | **OEM Profiles Management (PRD 2.5)** | Missing. No OEM Profiles exist. Products are not linked to OEM metadata. | Create an OEM entity and administration screen to manage partner information and contacts. |
| **Medium** | **Feedback Collection (PRD 1.8 / 2.2)** | Missing. No form to collect or view post-installation/service feedback. | Create a post-installation and post-service feedback collection workflow. |
| **Medium** | **Knowledge Repository (PRD 4.6)** | Missing. No searchable institutional memory repository of interaction summaries. | Implement a searchable repository to find customer interactions by keywords, product, or competitor. |
| **Medium** | **Target Management by Product Category (PRD 6.5)** | Settings only allow overall annual/quarterly quota targets; product category targets are missing. | Expand target settings to allow configuration of annual/quarterly targets by product category. |
| **Medium** | **Beat Planning (PRD 6.1)** | Missing. No beat planning interface or approval workflow exists. | Create a Beat Planning screen allowing reps to log planned visits and expected revenue, and submit to managers. |
| **Medium** | **Audit Trail Database (PRD 9.1)** | Missing. No change log viewer. Edits to opportunity value, stage, and owner are not tracked. | Implement a database log table to capture and view change history (user, timestamp, old value, new value). |
| **Low** | **Pre-Lead Scanning (PRD 3.2)** | Missing. Marketing visits and scouting activities cannot be logged before a deal is created. | Allow activities to be logged directly against a customer without requiring an active opportunity. |
| **Low** | **Product-Team Mapping (PRD 6.6)** | Missing. Authorization boundaries mapping teams to products are not implemented. | Add team authorization checks in the lead creation wizard to restrict unauthorized product selling. |
| **Low** | **Collateral Security (PRD 7.0)** | Missing. Sensitive brochures or files cannot be restricted by user SBU/Zone/Team. | Implement role-based access restrictions on sensitive documents in the product catalog. |

---

## **Detailed Gaps Breakdown**

### **1. Missing Screens**
* **GM Dashboard Screen (PRD 5.5):** A dedicated high-level dashboard displaying zone performance, product-category performance, competitive loss analysis, and forecast vs. budget.
* **Beat Planning Workspace (PRD 6.1):** A tool for sales representatives to compile quarterly coverage plans, record expected revenues, and submit them for manager approval.
* **Opportunity Approval Dashboard (PRD 8.1):** An administrative approval queue where managers can view, approve, or reject probability overrides, team ownership adjustments, and value overrides.
* **Knowledge Repository / Search Screen (PRD 4.6):** A dedicated interface allowing users to search across the institutional memory database using keyword, customer, product, competitor, or outcome.
* **OEM Profile Management (PRD 2.5):** An administrative page to input and maintain OEM records, partnership statuses, support contacts, and territorial coverages.
* **Feedback Collection Screen (PRD 1.8):** Forms to collect post-installation and post-service customer feedback.
* **Audit Trail Viewer (PRD 9.0):** A system history dashboard displaying logs of all changes made to opportunities (e.g., changes in value, probability, ownership, and stages).

### **2. Missing Reports**
All core, exception, and analytical reports defined in the PRD (Appendix A) are absent as filterable/exportable tables:
* **Forecast Reports (A.2):** Filterable Weighted (A.2.1) and Unweighted (A.2.2) Forecast tables.
* **Pipeline Reports (A.3):** Pipeline Summary Report (A.3.1) and Opportunity Stage Aging Report (A.3.2).
* **Opportunity Hold Report (A.3.3 / 5.13):** Lists opportunities placed on hold, reactivation dates, and reasons.
* **Achievement Reports (A.4):** Quarterly Achievement (A.4.1), Revenue Attribution (A.4.2), and Product Category Achievement (A.4.3).
* **Customer Reports (A.5):** Customer Portfolio (A.5.1), Customer Health Risk (A.5.2), and Stakeholder Coverage (A.5.3).
* **Installed Base Reports (A.6):** Summary Report (A.6.1), OEM Footprint (A.6.2), Warranty Expiry (A.6.3), and Replacement Opportunity (A.6.4).
* **Product Performance Reports (A.7):** Product Sales Performance (A.7.1), Conversion Rates by Product (A.7.2), Sales Funnel Conversions (A.7.3), and Lead Source Effectiveness (A.7.4).
* **Competitive Intelligence Reports (A.8):** Competitive Loss Analysis (A.8.1) and Competitor Performance (A.8.2).
* **Productivity Reports (A.9):** Activity Summary (A.9.1) and Demo-to-Sale Effectiveness (A.9.2).
* **Governance Reports (A.10):** Pipeline Coverage Exception (A.10.1), No-Activity Hospital (A.10.2), Territory Exception (A.10.3), and Forecast Accuracy (A.10.4).

### **3. Missing Dashboards**
* **GM Dashboard:** Specialized dashboard widgets mapping zone performance, SBU-specific achievements, and forecast variance models.
* **Enhanced Manager Dashboard Elements (PRD 5.4):** Missing specific team-level visualizations on the manager's view, such as Pipeline Coverage gauges ($< 3\times$ revenue warnings), Forecast Accuracy trends, Pipeline Aging charts, and individual Rep Activity tables.

### **4. Missing Navigation Elements**
* **GM View Toggle:** No navigation link in the side drawer to access the GM dashboard.
* **Beat Planning Tab:** Missing in the navigation bar.
* **Approvals Hub Tab:** Missing in the side navigation drawer.
* **Knowledge Repository Tab:** Missing in the sidebar navigation.
* **Admin Settings Panel:** Settings are restricted to rep quotas. No admin tabs exist to adjust SBUs, configure zones, map PIN codes, or set up team boundaries.

### **5. Missing User Journeys**
* **GM Performance Review Journey:** Logging in as GM $\rightarrow$ analyzing zone performance $\rightarrow$ drilling down to SBU performance $\rightarrow$ checking forecast variance.
* **Beat Planning Submission & Approval:** Salesperson creating a beat plan $\rightarrow$ adding hospital coverage targets $\rightarrow$ submitting to Manager $\rightarrow$ Manager reviewing, adjusting, and approving.
* **Shared Ownership Allocation:** Salesperson closing a deal as Closed Won $\rightarrow$ entering opportunity team roles $\rightarrow$ allocating contribution percentages (totaling 100%) $\rightarrow$ submitting to Manager.
* **Opportunity Hold Workflow:** Salesperson putting a deal "On Hold" $\rightarrow$ capturing expected reactivation date & reason $\rightarrow$ system automatically excluding it from risk-weighted pipeline.
* **Closed-Won Operations Handover:** Salesperson marking a deal Closed Won $\rightarrow$ populating delivery, installation, and coordination requirements $\rightarrow$ system flagging the record for service system ingestion.
* **Geographical Customer Routing:** Creating a customer account $\rightarrow$ entering PIN code $\rightarrow$ system auto-assigning zone and filtering permissions accordingly.
* **Document Lifecycle Compliance:** Uploading PNDT or Form B document to Customer 360 $\rightarrow$ recording status and validity details.
