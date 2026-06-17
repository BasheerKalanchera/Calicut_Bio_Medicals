# Cabio Sales OS - Traceability Matrix (Phase 0B Frozen)

This document maps the Phase 1 PRD requirements and prototype backlog items (PB-XXX) to the React prototype views, variables, and forms in [App.jsx](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx).

---

## 1. Baseline PRD Requirements Mapping (95% Core Functionality)

These mappings represent the core product features described in the Phase 1 PRD that were built into the baseline prototype:

| PRD Ref | Business Feature / Description | React Element / Code Variable in App.jsx | Line Reference in App.jsx |
| :--- | :--- | :--- | :--- |
| **Section 1.1** | Customer Listing & Directory | Renders `customers` array in tabular/card layouts | [L2422-L2605](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2422-L2605) |
| **Section 1.2** | Account Search & Filters | States: `customerSearchText`, `customerZoneFilter`, `customerClassFilter`, `customerSpecialtyFilter` | [L2480-L2528](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2480-L2528) |
| **Section 1.5** | Customer Financial Categorization | `payerStatus` input selector in Customer 360 overview tab | [L4326-L4343](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L4326-L4343) |
| **Section 1.6** | Customer Sentiment Tracking | `npsStatus` select dropdown in Customer 360 overview tab | [L4310-L4320](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L4310-L4320) |
| **Section 1.7** | Customer 360 View Workspace | `selectedAccount` overlay panel with 6 sub-tabs | [L3997-L4800](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L3997-L4800) |
| **Section 2.1** | SBU Division Configuration | Core check on `Imaging` and `Critical Care` catalog assignments | [L928-L945](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L928-L945) |
| **Section 2.2** | Product Catalog Browser | `catalog` list layout, text search, SBU category filtering | [L3114-L3240](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L3114-L3240) |
| **Section 2.3** | Product Collaterals Linking | Renders list items in `prod.collaterals` as clickable links | [L3180-L3205](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L3180-L3205) |
| **Section 3.3** | Opportunity Pipeline Stages | Columns mapped based on `stages` array in Kanban board | [L2136-L2230](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2136-L2230) |
| **Section 3.7** | Win Probability Rules | Automatic lookup maps linking `stage` to default probabilities | [L1662](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L1662), [L6020-L6045](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L6020-L6045) |
| **Section 3.8** | Opportunity Search & Filters | `getFilteredDeals` helper filtering by query, owner, or status | [L2064-L2130](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2064-L2130) |
| **Section 4.3** | Next Actions Reminders Panel | List layout showing pending tasks assigned to `currentUser` | [L2348-L2420](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2348-L2420) |
| **Section 4.3** | Interaction Activity Logging | Unified timeline records rendered in Account 360 and Deals detail | [L2475](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2475), [L4693-L4765](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L4693-L4765) |
| **Section 5.3** | Salesperson Dashboard View | Quota attainment progress bar, won/lost values, overdue indicators | [L2043-L2135](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2043-L2135) |
| **Section 5.4** | Manager Dashboard View | Sales rep data rollup table, overall quota, zone filter dropdowns | [L2234-L2330](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2234-L2330) |
| **Section 5.6** | Core Reports Workspace | Interactive drilldown detail panel mapped in Insights | [L3241-L3400](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L3241-L3400) |
| **Section 6.8** | User Management Directory | Renders user list and role edit modal (Admin-only view) | [L6673-L6785](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L6673-L6785) |

---

## 2. Traceability Mapping: Prototype Backlog Updates (Sprint Deliverables)

| Backlog ID | Business Feature | PRD Ref | Prototype View / Element | Line Reference in App.jsx |
| :--- | :--- | :--- | :--- | :--- |
| **PB-001** | Account Structure & Hierarchy | Section 1.1 | `newCustomerType` & `newParentCustomerId` in Customer Form | [L4960-L4967](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L4960-L4967) |
| **PB-002** | Opportunity State: "On Hold" | Section 3.3 | `editLeadData.state === "On Hold"` rendering in Overview tab | [L5734-L5780](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L5734-L5780) |
| **PB-003** | Stage Exit Criteria Enforcement | Section 3.4 | `Stage Exit Criteria Validations` inside Opportunity Save | [L6015-L6148](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L6015-L6148) |
| **PB-004** | Shared Opportunity Ownership | Section 3.5 | `editLeadData.contributors` grid in Opportunity Team Tab | [L5898-L5960](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L5898-L5960) |
| **PB-005** | Closed-Won Handover | Section 3.13 | `checklists` & handover inputs inside Order/Won validator | [L6056-L6097](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L6056-L6097), [L3634-L3730](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L3634-L3730) |
| **PB-006** | Salesperson Dashboard Metrics | Section 5.3 | Open pipeline cards, priority counts, beat plan meters in header | [L2043-L2130](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2043-L2130) |
| **PB-007** | Manager Dashboard Metrics | Section 5.4 | Quota progress and deal listing. Note: *Team Aging Charts are not implemented in prototype codebase*. | [L2234-L2330](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2234-L2330) |
| **PB-008** | GM Dashboard & Role | Section 5.5 | `General Manager` option in Role Switcher | [L1983-L1986](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L1983-L1986) |
| **PB-009** | PIN Code Geographic Routing | Section 6.2 | Zone assignment computed in customer form save lookup maps | [L1655](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L1655) |
| **PB-010** | Mandatory Interaction Logging | Section 4.3 | Save button disabled unless notes & next action are set | [L4890-L4903](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L4890-L4903) |
| **PB-011** | Customer Status & Tiering | Section 1.3 | Display of Class, Specialty, and Type on customer details. Note: *Customer Tier and Customer Status fields are not implemented on UI headers or cards*. | [L4027](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L4027), [L4111](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L4111) |
| **PB-012** | Customer Profile Contact Details | Section 1.4 | Note: *Customer-level contact details (WhatsApp, mobile, street address) are not implemented in the prototype at the account level (only Stakeholders store contacts)*. | N/A (Prototype Gap) |
| **PB-013** | Stakeholder Influence & Role | Section 1.4 | Decision Role & Influence selects in Stakeholder creation | [L5215-L5250](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L5215-L5250) |
| **PB-014** | Product & SBU Assignment | Section 2.1 | `newProductSbu` & `newProductOem` dropdowns in Catalog Form | [L7160-L7210](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L7160-L7210) |
| **PB-015** | OEM Profiles Management | Section 2.5 | Mapped to product cards list and oem filtering controls | [L3114-L3180](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L3114-L3180) |
| **PB-016** | Feedback Collection Workspace | Section 1.8 | Feedback submission section in Customer 360 overview | [L6210](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L6210) |
| **PB-017** | Searchable Interaction History | Section 4.6 | Search text input filtering activities list | [L3913](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L3913) |
| **PB-018** | Target Planning Workspace | Section 5 | SBU targets allocation grid (Crores) & Sales reps quotas (Lakhs) | [L6289-L6668](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L6289-L6668) |
| **PB-020** | Pre-Lead Scanning | Section 3.2 | Logging activity direct from Customer 360 without deal ID | [L2475](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L2475) |
| **PB-021** | Product-Team Authorization | Section 6.6 | Validated in product selection checkers in lead wizard | [L5141-L5149](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L5141-L5149) |
| **PB-022** | Opportunity Split Sum validation | Section 8 | Save validation block: `totalSplit !== 100` | [L6098-L6108](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L6098-L6108) |
| **PB-023** | Category Auto-Splitting | Section 8 | Split handler in `createLead` for Ultrasound & Critical Care | [L1643-L1676](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L1643-L1676) |
| **PB-024** | Overdue Hold Reactivation Check | Section 8 | Stagnant hold warnings and alert badges | [L3490-L3520](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L3490-L3520) |
| **PB-025** | Coverage Planning Foundation | Section 6.1 | Beat plans list and dynamic hospital target alignment grid | [L7698-L7750](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L7698-L7750), [L8012-L8221](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L8012-L8221) |
| **PB-026** | Project Opportunity Foundation | Section 3.6 | Project Creation modal and lookup selection inside opportunities | [L7545-L7694](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L7545-L7694), [L1355-L1380](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L1355-L1380) |
| **PB-027** | User Master & SBU Assignment | Section 6.8 | Users database master grid and role/SBU update dialog | [L6788-L7005](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx#L6788-L7005) |

---

## 3. Logical Backend & Database Mapping (Future Phase)
During Foundation Week, these mappings will be expanded to reference the physical database tables (SQL) and backend FastAPI endpoints.
* **Format:** `PRD Requirement` ➔ `UI Screen` ➔ `FastAPI Route` ➔ `Database Table`.

