# QA Peer Review Report: Phase 0B Architectural Design Artifacts

**Date:** June 15, 2026  
**Reviewer:** QA / Peer Review Agent  
**Target Artifacts:**
* `docs\UI-Inventory.md`
* `docs\Prototype-Data-Model.md`
* `docs\Traceability-Matrix.md`
**Source of Truth Baseline:**
1. `docs\Cabio Sales OS – Phase 1 - PRD.md` (Frozen PRD)
2. `sales-os-app\src\App.jsx` (Prototype Source Code)

---

## 1. Executive Summary

A rigorous, line-by-line comparison of the Phase 0B architectural design artifacts against the frozen PRD and the `App.jsx` prototype codebase was conducted. The audit reveals that while the current documents capture the incremental backlog items (the delta updates) and basic forms, they exhibit a **systematic omission of the baseline functionality (representing ~95% of the core PRD requirements)**. 

### Key Findings:
1. **Traceability Matrix Gap:** The matrix tracks *only* sprint backlog items (`PB-XXX`). Core system capabilities—such as the Kanban pipeline board, standard customer listing/filtering, core opportunity fields, basic activities tracking, dashboard layouts, and catalog browsing—are completely unmapped.
2. **UI & Form Inventory Omissions:** The central **Customer 360 View Workspace** (which contains 6 functional tabs, custom dashboards, and form controls) is completely undocumented. Several modals, form fields, and global state UI elements (such as alert/notification panels) are also missing.
3. **Data Model Deficiencies:** The `Customer` data schema excludes critical operational fields present in the code and PRD, specifically `npsStatus` (Customer Sentiment) and `payerStatus` (Financial Behavior). Data type definitions also contain inconsistencies regarding deal value representations.
4. **Incorrect Mapping and Code Divergence:** Several mapping references in `Traceability-Matrix.md` (e.g., `PB-007`, `PB-011`, `PB-012`) point to incorrect line ranges in `App.jsx`. Furthermore, there are gaps where the documentation claims features exist in the code that are actually absent (e.g., team aging charts, customer mobile/WhatsApp/street fields).

---

## 2. Traceability Matrix Audit: Baseline Omissions & Gaps

### 2.1 Why the Traceability Matrix is Incomplete
The current `Traceability-Matrix.md` was drafted with a restricted scope, focusing strictly on incremental sprint updates labeled as prototype backlog items (`PB-001` through `PB-027`). Because of this, it fails to map the foundational system architectures that provide the 95% baseline functionality. 

To bridge this gap, the Traceability Matrix must be expanded to include the baseline functional requirements from the PRD, mapped to their implementation in `App.jsx`.

### 2.2 Missing Baseline Requirements Mapping
The following table details the key baseline requirements from the PRD that are implemented in the code but entirely missing from the current `Traceability-Matrix.md`:

| PRD Ref | Feature / Description | React Element / Code Variable in App.jsx | Code Line Reference in App.jsx |
| :--- | :--- | :--- | :--- |
| **Section 1.1** | Customer Listing & Directory | Rendering of `customers` array with tabular/card grid | [L2422-L2605](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2422-L2605) |
| **Section 1.2** | Account Search & Filter | `customerSearchText`, `customerZoneFilter`, `customerClassFilter`, `customerSpecialtyFilter` states | [L2480-L2528](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2480-L2528) |
| **Section 1.7** | Customer 360 View Modal | `selectedAccount` modal with 6 sub-tabs | [L3997-L4800](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L3997-L4800) |
| **Section 1.5** | Customer Financial Categorization | `payerStatus` input inside the Customer 360 overview tab | [L4326-L4343](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L4326-L4343) |
| **Section 1.6** | Customer Sentiment Tracking | `npsStatus` select dropdown in Customer 360 overview | [L4310-L4320](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L4310-L4320) |
| **Section 2.1** | SBU Configuration | Division check on `Imaging` and `Critical Care` categories | [L236-L241](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/docs/Cabio%20Sales%20OS%20%E2%80%93%20Phase%201%20-%20PRD.md#L236-L241), [L928-L945](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L928-L945) |
| **Section 2.2** | Product Catalog Browser | `catalog` mapping grid, search, and category tab filter | [L3114-L3240](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L3114-L3240) |
| **Section 2.3** | Product Collaterals Linking | Mapping `prod.collaterals` into click-to-open download links | [L3180-L3205](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L3180-L3205) |
| **Section 3.3** | Opportunity Pipeline Stages | Rendering Kanban board with columns based on `stages` | [L2136-L2230](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2136-L2230) |
| **Section 3.7** | Win Probability Rules | Default probability mapping (Qualified=25%, Demo=50%, Neg=75%, Won=100%) | [L1662](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L1662), [L6020-L6045](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L6020-L6045) |
| **Section 3.8** | Opportunity Search / Filters | Filtering `deals` list by metrics, search query, or owner | [L2064-L2130](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2064-L2130) |
| **Section 4.3** | Next Actions Reminders View | Renders list of tasks in `reminders` panel by owner | [L2348-L2420](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2348-L2420) |
| **Section 4.3** | Interaction Activity Logging | Displaying timeline logs under customer account and deals | [L2475](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2475), [L4693-L4765](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L4693-L4765) |
| **Section 5.3** | Salesperson Dashboard | Renders Target attainment meter, won/lost values, overdue follow-ups | [L2043-L2135](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2043-L2135) |
| **Section 5.4** | Manager Dashboard | Displays team details grid and zone target filters | [L2234-L2330](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2234-L2330) |
| **Section 5.6** | Core Reports Workspace | Interactive reports selection & drilldown panel under Insights | [L3241-L3400](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L3241-L3400) |
| **Section 6.8** | User Management Directory | Renders user list and role edit modal (when logged as Admin) | [L6673-L6785](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L6673-L6785) |

---

## 3. UI & Form Inventory Audit: Omissions & Deficiencies

A comparison of `docs\UI-Inventory.md` against the user interface blocks conditionally rendered in `App.jsx` identified the following missing items:

### 3.1 Major Omission: Customer 360 View Workspace
The Customer 360 View is a key dashboard/detail panel in the application layout (`selectedAccount` L3997–L4800). It is displayed when clicking a customer from the Account list. It is completely missing from the UI Inventory:
* **Layout Structure:** Conditionally renders when `selectedAccount` is active, utilizing a tabs navigation bar (`active360Tab`).
* **Sub-Tabs Inventory:**
  1. **Overview Tab (L4098):** Displays account profile detail fields, Parent Corporate Group association, NPS/Sentiment selection, Payer/Financial Behavior selection, and an Installed Base quick summary widget.
  2. **Stakeholders Tab (L4428):** Lists stakeholders assigned to the customer. Provides buttons to add new or remove existing stakeholders.
  3. **Projects Tab (L4517):** Renders all corporate projects associated with this hospital. Provides a link to open the Project Creation wizard.
  4. **Opportunities Tab (L4578):** Displays a list of all deals (active, won, lost) associated with the hospital. Includes a shortcut button to log a new opportunity for this customer.
  5. **Installed Base Tab (L4646):** Lists installed asset details. Includes a button to open the "Log Installed Equipment Asset" form.
  6. **Activity Timeline Tab (L4693):** Renders a vertical log of interaction activities and reminders (with a status filter for pending vs. completed tasks).

### 3.2 UI Form Field Gaps
Several forms listed in Section 2 of `UI-Inventory.md` omit operational field logic present in `App.jsx`:
* **Customer Account Creation Form (Section 2.1):** Omits the Parent Customer autocomplete lookup logic (`newParentCustomerId`, `parentSearchText`).
* **Edit Opportunity Form (Section 2.3):** Omits descriptions of the interactive **Products Tab** (checkbox grid representing the catalog items), **Contacts Tab** (list of stakeholder assignments), and **Team Tab** (shared ownership splits grid).
* **Product Catalog Form (Section 2.8):** Omits explanation of the dynamic collaterals attachment list (user can add/remove rows containing `Label` and `URL`).
* **User Management Form (Section 2.7):** Omits the **Reporting Manager** dropdown which dynamically lists active managers in the system context.

### 3.3 Missing State Toggles & Modals
The UI Inventory does not document the following global notifications and UI controls:
* **Sidebar Toggle:** `isSidebarOpen` state controlling responsive sidebar sliding on mobile/tablet views.
* **Custom Alert Modal:** A global intercept modal (`customAlert` L388) that displays success/error warnings.
* **Haroon Notification Simulator:** A simulated toast notification header (`hideHaroonNotification` L387) showing urgent alerts.

---

## 4. Prototype Data Model Audit: Schema Inconsistencies

A review of `docs\Prototype-Data-Model.md` reveals that the documented schemas do not fully align with the browser local storage state and component variables in `App.jsx`.

### 4.1 Omission of Customer NPS & Payer Fields
The `Customer` schema in Section 2.2 of `Prototype-Data-Model.md` defines only basic address, class, and specialty attributes. It is missing the fields actually used in the prototype state:
```typescript
// Missing from documented Customer schema:
npsStatus?: "Promoter" | "Neutral" | "Detractor"; // Defaults to "Neutral"
payerStatus?: "Good Paymaster" | "Average Payer" | "Problematic Payer" | "Unknown Payer"; // Defaults to "Unknown Payer"
```

### 4.2 State Schemas vs. Code Inconsistencies
1. **Deal Value Representations:** The documentation defines `value` on a `Deal` as a string formatted with currency symbols (e.g., `"₹25L"`). However, the wizard forms capture this value as a numeric float (`leadValue` numeric input). In calculations (like forecast and metrics compilation), the code calls `parseValue(deal.value)` to strip non-numeric characters and evaluate it as a float:
   ```javascript
   // L1255 in App.jsx
   const parseValue = (valStr) => {
     if (!valStr) return 0;
     const clean = valStr.toString().replace(/[^\d.]/g, '');
     return parseFloat(clean) || 0;
   };
   ```
   *Recommendation:* Update the data model to clarify that while values are stored in LocalStorage as formatted strings (e.g., `"₹25L"`), they are processed as numeric values inside forms and calculations.
2. **Missing Seed Data Structures:** The document details LocalStorage keys but does not document the seed datasets (like `initialDeals` and `initialCustomers`) which define the baseline schema structures for testing.

---

## 5. Inconsistencies & Incorrect Mapping References

The following direct errors were found in `docs\Traceability-Matrix.md`:

1. **PB-011 Mapping Error (Customer Status & Tiering):**
   * *Documented reference:* `[L2560]` in `App.jsx` mapping to "Tier/Status values displayed on Customer profile headers".
   * *Actual Code:* `L2560` renders the `customerType` label (`acc.customerType === "Corporate Group"`). The code does **not** render customer tier or customer status on customer profile headers or cards.
2. **PB-012 Mapping Error (Customer Profile Contact Details):**
   * *Documented reference:* `[L2480-L2530]` in `App.jsx` mapping to "WhatsApp, mobile, street fields rendering in details modal".
   * *Actual Code:* `L2480-L2530` contains the list filtering controls (`customerSearchText` search input, zone filter select, class filter select, specialty filter select). There are **no contact detail fields** (WhatsApp, mobile, or street address) rendered in this range.
3. **PB-007 Mapping Error (Manager Dashboard Metrics):**
   * *Documented reference:* `[L2234-L2330]` in `App.jsx` mapping to "Quota progress bars, team aging charts when acting as Manager".
   * *Actual Code:* `L2234-L2330` renders a filter header and a simple list of deal cards. There are **no team aging charts or quota progress bars** rendered in this block.
4. **Prototype-to-PRD Alignment Gap (Section 1.4):**
   * *Requirement:* Section 1.4 of the PRD states the customer profile must capture address, phone, WhatsApp, and email contact info.
   * *Prototype Code:* The customer creation form and Customer 360 overview do **not** capture phone, WhatsApp, or email directly for the account (they are only captured under the separate Stakeholder entity). This is an unimplemented PRD requirement in the prototype code that must be documented as a prototype gap.
5. **Traceability Matrix PB-007 (Aging Charts):**
   * *Requirement:* Section 5.4 of the PRD requires the Manager Dashboard to display "Pipeline Aging". `PB-007` claims team aging charts are mapped to the manager view.
   * *Prototype Code:* Team aging charts are **completely absent** from the codebase. No chart library is imported, and no aging breakdown is rendered. This is a significant gap in the prototype that is incorrectly flagged as mapped.

---

## 6. Recommendations & Action Plan

To ensure the design artifacts reflect 100% alignment with the PRD and codebase, the following revisions are recommended:

### 6.1 Update `docs\Traceability-Matrix.md`
1. **Add Baseline Mapping Section:** Insert a new table mapping the 17 core baseline requirements listed in Section 2.2 of this report.
2. **Correct Invalid Line References:**
   * Update `PB-007` (Manager Dashboard Metrics) to point to `L2234` for the list filter panel, and flag "Team Aging Charts" as *Not Implemented in Prototype*.
   * Update `PB-011` (Customer Status & Tiering) to point to `L4027` and `L4111` (where class/type are handled in the Customer 360 details panel) and note that Tiering is *Not implemented on UI*.
   * Update `PB-012` (Customer Contact Details) to note that Phone/WhatsApp/Email at the Account Level are *Not implemented in prototype* (only available on Stakeholders).

### 6.2 Update `docs\UI-Inventory.md`
1. **Insert Customer 360 Section:** Add a dedicated subsection (e.g., Section 1.3) detail-inventorying the Customer 360 view, its 6 tabs, and the editable fields (`npsStatus`, `payerStatus`, `class`, `specialty`, `customerType`, `parentCustomerId`).
2. **Expand Modals section:** Update Section 2 to include stakeholder selections and product catalog checklists.

### 6.3 Update `docs\Prototype-Data-Model.md`
1. **Update Customer Interface:** Insert `npsStatus` and `payerStatus` fields with their correct string literal union types.
2. **Clarify Deal Value Type:** Document the float-to-string format transition for the `value` field.
