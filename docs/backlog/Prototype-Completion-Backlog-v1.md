# Prototype Completion Backlog v1

## Summary

* **Total Backlog Items:** 24
* **P1 Critical Count:** 14
* **P2 High Count:** 5
* **P3 Medium Count:** 5

---

## Backlog Items

### PB-001 – Account Structure & Hierarchy
* **Source:** REC-01
* **Business Area:** Customer Management
* **Description:** Add support for structural linking of customer accounts to represent multi-location groups. Enables linking a Corporate Group to individual Hospitals, which are further linked to specific Departments.
* **Prototype Change Required:** New fields on customer profiles for Parent Account and Type; nested display in Customer Directory tree.
* **Acceptance Criteria:**
  * User can define account type (Corporate Group, Hospital, Department)
  * User can link a Hospital to a parent Corporate Group
  * User can link a Department to a parent Hospital
  * Customer Directory renders nested accounts reflecting the parent-child relationship
* **Dependencies:** None
* **Priority:** P1 Critical

---

### PB-002 – Opportunity State - "On Hold"
* **Source:** REC-02
* **Business Area:** Opportunity Management
* **Description:** Introduce an "On Hold" state separate from active stages. Allows users to flag deals as On Hold, capture hold details, and exclude them from forecast calculations.
* **Prototype Change Required:** New workflow state toggle, hold notes inputs, reactivation date picker, and forecast exclusion calculations.
* **Acceptance Criteria:**
  * User can toggle deal state between "Active" and "On Hold"
  * UI displays Hold Reason, Hold Notes, and Expected Reactivation Date inputs when On Hold is toggled
  * Forecast summary dynamically recalculates to exclude On Hold opportunity values
* **Dependencies:** None
* **Priority:** P1 Critical

---

### PB-003 – Stage Exit Criteria Enforcement
* **Source:** REC-03
* **Business Area:** Opportunity Management
* **Description:** Enforce mandatory fields check before allowing an opportunity to advance in pipeline stages.
* **Prototype Change Required:** Stage transition validation dialogs and blocking save rules.
* **Acceptance Criteria:**
  * Block transition to "Qualified" if Product or Budget range is missing
  * Block transition to "Demo" if Demo Date or Demo Outcome is missing
  * Block transition to "Closed Won" if Order Value or Product details are missing
  * Block transition to "Closed Lost" if Loss Reason or Competitor is missing
* **Dependencies:** None
* **Priority:** P1 Critical

---

### PB-004 – Shared Opportunity Ownership
* **Source:** REC-04
* **Business Area:** Opportunity Management
* **Description:** Build support for shared ownership of opportunities by defining contribution splits among team members.
* **Prototype Change Required:** New form section in opportunity view to list multiple contributors, select roles, and allocate percentages.
* **Acceptance Criteria:**
  * User can add multiple contributors to a single opportunity
  * Each contributor is assigned a specific Team Role (e.g. Account Manager, Closer)
  * Contribution percentage is captured for each contributor
* **Dependencies:** None
* **Priority:** P1 Critical

---

### PB-005 – Closed-Won Handover
* **Source:** REC-05
* **Business Area:** Opportunity Management
* **Description:** Prompt salesperson for operational handover details when a deal is closed won to coordinate downstream delivery and services.
* **Prototype Change Required:** New modal dialog triggered on Closed Won transition containing operational notes textareas.
* **Acceptance Criteria:**
  * Closed Won transition triggers Handover form dialog
  * Captures Delivery Notes, Installation Requirements, and Special Commitments
  * Handover records remain permanently accessible in opportunity history
* **Dependencies:** None
* **Priority:** P1 Critical

---

### PB-006 – Salesperson Dashboard Metrics
* **Source:** REC-06
* **Business Area:** Dashboards
* **Description:** Enhance the main KPI row on the Salesperson Dashboard with missing metrics defined in the PRD.
* **Prototype Change Required:** New dashboard widgets and metric calculations.
* **Acceptance Criteria:**
  * Displays "Open Pipeline Value" card (unweighted sum of active deals)
  * Displays "High Priority Opportunities" count card
  * Displays "Overdue Actions" count card
  * Displays "Beat Plan Progress" achievement bar
* **Dependencies:** None
* **Priority:** P2 High

---

### PB-007 – Manager Dashboard Metrics
* **Source:** REC-07
* **Business Area:** Dashboards
* **Description:** Create the manager dashboard view containing team-wide metrics and aggregates.
* **Prototype Change Required:** New screen panel for Managers displaying team metrics.
* **Acceptance Criteria:**
  * Displays Team Target vs Actual revenue quota progress bar
  * Displays Pipeline Aging Summary chart
  * Displays "Opportunities On Hold" count widget
  * Displays "Beat Plan Compliance" percentage card
  * Displays "Team Activity Levels" visits table
* **Dependencies:** PB-002
* **Priority:** P2 High

---

### PB-008 – GM Dashboard & Role
* **Source:** REC-08
* **Business Area:** Dashboards
* **Description:** Implement the General Manager (GM) role and dashboard providing high-level business unit aggregates.
* **Prototype Change Required:** Selectable GM role option in "Acting As" side panel, and GM Dashboard workspace screen.
* **Acceptance Criteria:**
  * GM role is selectable in side drawer options
  * Dashboard displays SBU Performance summary (Imaging vs Critical Care)
  * Dashboard displays Zone Performance aggregates
  * Dashboard displays Competitive Loss summaries
* **Dependencies:** None
* **Priority:** P2 High

---

### PB-009 – PIN Code Geographic Routing
* **Source:** REC-09
* **Business Area:** Territory Management
* **Description:** Auto-derive geographic Zone based on Customer PIN Code mapping.
* **Prototype Change Required:** Customer profile field for PIN Code and auto-lookup routing query.
* **Acceptance Criteria:**
  * Customer profiles capture PIN Code (6 digits)
  * Creating a customer automatically maps PIN code to corresponding Zone (North Kerala, South Kerala, Bangalore)
  * Opportunity inherits geographic Zone from linked Customer
* **Dependencies:** None
* **Priority:** P1 Critical

---

### PB-010 – Mandatory Interaction Logging
* **Source:** REC-11
* **Business Area:** Activities
* **Description:** Require all interaction logs to contain next step details to prevent dropped follow-ups.
* **Prototype Change Required:** Save button validation on Add Interaction form.
* **Acceptance Criteria:**
  * Intercept save action and block if Summary is empty
  * Enforce selection of Next Action, Due Date, and Owner
  * Highlight validation errors on empty fields
* **Dependencies:** None
* **Priority:** P1 Critical

---

### PB-011 – Customer Status & Tiering
* **Source:** REC-12
* **Business Area:** Customer Management
* **Description:** Capture Customer Status and Tier attributes on accounts to segment accounts.
* **Prototype Change Required:** Status and Tier dropdowns on Customer forms and profile view.
* **Acceptance Criteria:**
  * User can set Customer Tier (Tier 1, Tier 2)
  * User can set Customer Status (Prospect, Active Customer, Inactive Customer, Strategic Account)
  * Status and Tier attributes exist independently and show on Customer 360 card
* **Dependencies:** None
* **Priority:** P3 Medium

---

### PB-012 – Customer Profile Contact Details
* **Source:** REC-13
* **Business Area:** Customer Management
* **Description:** Expand Customer details to capture core contact profile attributes.
* **Prototype Change Required:** Profile input fields on Customer registration and edit forms.
* **Acceptance Criteria:**
  * Captures Customer street address, telephone, email
  * Captures WhatsApp number
  * Displays contact details in Customer 360 contact header
* **Dependencies:** None
* **Priority:** P3 Medium

---

### PB-013 – Stakeholder Influence & Role Assessment
* **Source:** REC-14
* **Business Area:** Customer Management
* **Description:** Assign structured influence ratings and decision roles to stakeholder contacts.
* **Prototype Change Required:** Dropdown selections in stakeholder creation/edit modal.
* **Acceptance Criteria:**
  * User can assign structured Decision Role (e.g. End User, Influencer, Approver, Procurement)
  * User can select Influence Level rating (High, Medium, Low)
  * Influence Level and Decision Role display next to contact name in Customer 360
* **Dependencies:** None
* **Priority:** P3 Medium

---

### PB-014 – Product & SBU Assignment Structure
* **Source:** REC-16
* **Business Area:** Product Management
* **Description:** Configure the product catalog entries to support assignment to Strategic Business Units (SBUs) and OEM partner details.
* **Prototype Change Required:** Catalog schema updates to support Brand, Model, SBU, and OEM metadata, and UI display updates.
* **Acceptance Criteria:**
  * Product configuration supports Brand and Model fields
  * Product must be mapped to an SBU (Imaging vs Critical Care)
  * Product must be mapped to an OEM (e.g., Sonoscape, Magnamed)
* **Dependencies:** None
* **Priority:** P1 Critical

---

### PB-015 – OEM Profiles Management
* **Source:** REC-17
* **Business Area:** Product Management
* **Description:** Build master registry to manage OEM supplier profiles.
* **Prototype Change Required:** New section or table in Catalog screen to list OEMs, support contacts, and partnership details.
* **Acceptance Criteria:**
  * User can view OEM Name, support contacts, and partnership status
  * Associate OEM records with Products in the catalog selection
* **Dependencies:** None
* **Priority:** P3 Medium

---

### PB-016 – Feedback Collection Workspace
* **Source:** REC-18
* **Business Area:** Customer Management
* **Description:** Create forms to log post-installation and post-service customer feedback to build customer health insights.
* **Prototype Change Required:** New feedback entry forms inside Customer 360 view.
* **Acceptance Criteria:**
  * User can submit Post-Installation Feedback rating and comments
  * User can submit Post-Service Feedback rating and comments
  * Saved feedback logs are displayed in Customer 360 history
* **Dependencies:** None
* **Priority:** P3 Medium

---

### PB-017 – Knowledge Repository Screen
* **Source:** REC-19
* **Business Area:** Knowledge Management
* **Description:** Build a searchable database screen of interaction summaries to leverage institutional memory.
* **Prototype Change Required:** New search panel tab in Sidebar navigation.
* **Acceptance Criteria:**
  * Search bar filters interaction summaries by Keyword
  * Filter interactions by Customer name
  * Filter interactions by Product category or Competitor
* **Dependencies:** PB-010
* **Priority:** P2 High

---

### PB-018 – Target Management by Product Category
* **Source:** REC-20
* **Business Area:** Targets & Quotas
* **Description:** Allow quotas and targets configuration broken down by product categories.
* **Prototype Change Required:** target setting grids in Settings view to configure quarterly/annual targets by category.
* **Acceptance Criteria:**
  * Manager can set targets specifically for Imaging (Ultrasound) category
  * Manager can set targets specifically for Critical Care category
  * Total category quotas rollup matches individual annual/quarterly quota targets
* **Dependencies:** PB-014
* **Priority:** P1 Critical

---

### PB-019 – Operational Reports Library
* **Source:** REC-22
* **Business Area:** Reporting
* **Description:** Build filterable, grid-style operational reports corresponding to the Appendix A.3 reports list.
* **Prototype Change Required:** New "Reports Library" navigation view in side drawer, containing pages for 7 key reports.
* **Acceptance Criteria:**
  * **Beat Plan Execution Report:** Shows planned/covered hospitals, visit completion rates.
  * **Pipeline Review Report:** Lists deals, days in stage, state (Active/On Hold), next actions.
  * **Forecast Report:** Displays weighted/unweighted values, coverage ratios.
  * **Product Performance Report:** Tracks quantities, revenues, ASP, margins.
  * **Competitive Loss Report:** Details competitor loss count, lost value, reasons.
  * **No Activity Hospital Report:** Lists customers with no lead activity for 3 months.
  * **Revenue Attribution Report:** Lists contributions and commission splits.
* **Dependencies:** PB-002, PB-004, PB-005, PB-009, PB-018
* **Priority:** P2 High

---

### PB-020 – Pre-Lead Scanning
* **Source:** REC-24
* **Business Area:** Opportunity Management
* **Description:** Allow salespeople to log interactions and scanning activities against customer accounts prior to opportunity creation.
* **Prototype Change Required:** Add activity logging action directly inside Customer profile directories even if no open deals exist.
* **Acceptance Criteria:**
  * User can log a "Field Scanning" activity directly on Customer 360 profile
  * Save is allowed without specifying a Deal ID or Opportunity reference
  * Displays scanning logs in customer history feed
* **Dependencies:** None
* **Priority:** P1 Critical

---

### PB-021 – Product-Team Mapping & Authorization
* **Source:** REC-25
* **Business Area:** Security
* **Description:** Restrict sales representatives to selecting only products their assigned team is authorized to sell during opportunity creation.
* **Prototype Change Required:** Catalog selection filters in lead creation wizard matching user team maps.
* **Acceptance Criteria:**
  * Products in lead creation wizard are filtered based on team authorization mapping
  * Prevents creation of deals with unauthorized product categories
* **Dependencies:** PB-014
* **Priority:** P1 Critical

---

### PB-022 – Opportunity Split Validation (100% Split Rule)
* **Source:** REC-28
* **Business Area:** Opportunity Management
* **Description:** Enforce split percentage validation check when closing a shared ownership opportunity.
* **Prototype Change Required:** Validation check during transition to Closed Won.
* **Acceptance Criteria:**
  * User is blocked from saving Closed Won if total contribution split sum $\neq$ 100%
  * Renders error warning dialog if split allocation is insufficient or exceeds 100%
* **Dependencies:** PB-004
* **Priority:** P1 Critical

---

### PB-023 – Opportunity Auto-Splitting (Dual Categories)
* **Source:** REC-29
* **Business Area:** Opportunity Management
* **Description:** Enforce routing rules when opportunities include products spanning both Imaging (Ultrasound) and Critical Care categories by auto-splitting the lead.
* **Prototype Change Required:** Auto-split handler inside lead creation logic.
* **Acceptance Criteria:**
  * Multi-category lead creation triggers automatic split into SBU-specific deals
  * Auto-assigns SBU specialist owners based on regional routing matrices
  * Links both split opportunities to the same parent Group ID in history logs
* **Dependencies:** PB-014
* **Priority:** P1 Critical

---

### PB-024 – Overdue On-Hold Reactivation Edge Case
* **Source:** REC-33
* **Business Area:** Opportunity Management
* **Description:** Trigger alert rules when an opportunity remains in "On Hold" state past its expected reactivation date.
* **Prototype Change Required:** Reactivation date check logic and alert flag display.
* **Acceptance Criteria:**
  * Triggers stagnant alert banner if reactivation date passes without active stage transition
  * Displays warning badge on opportunity timeline when overdue reactivation date is reached
* **Dependencies:** PB-002
* **Priority:** P1 Critical

---

## Suggested Implementation Sequence

Group work into waves ordered logically by dependencies to maximize efficiency and build a solid foundation.

### Wave 1 – Core Sales Workflow
Focus on the basic deal management, state controls, logging requirements, and validation checks.
1. **PB-002 – Opportunity State - "On Hold"** (P1 Critical)
2. **PB-024 – Overdue On-Hold Reactivation Edge Case** (P1 Critical)
3. **PB-003 – Stage Exit Criteria Enforcement** (P1 Critical)
4. **PB-004 – Shared Opportunity Ownership** (P1 Critical)
5. **PB-022 – Opportunity Split Validation (100% Split Rule)** (P1 Critical)
6. **PB-005 – Closed-Won Handover** (P1 Critical)
7. **PB-010 – Mandatory Interaction Logging** (P1 Critical)
8. **PB-020 – Pre-Lead Scanning** (P1 Critical)

### Wave 2 – Territory & Security Foundations
Introduce catalog structures, geographic boundaries, routing splits, and category target setups.
9. **PB-014 – Product & SBU Assignment Structure** (P1 Critical)
10. **PB-001 – Account Structure & Hierarchy** (P1 Critical)
11. **PB-009 – PIN Code Geographic Routing** (P1 Critical)
12. **PB-018 – Target Management by Product Category** (P1 Critical)
13. **PB-021 – Product-Team Mapping & Authorization** (P1 Critical)
14. **PB-023 – Opportunity Auto-Splitting (Dual Categories)** (P1 Critical)

### Wave 3 – Dashboards & Reporting
Compile metric aggregations, build dashboards (Salesperson, Manager, GM), and create tabular operational reports.
15. **PB-006 – Salesperson Dashboard Metrics** (P2 High)
16. **PB-007 – Manager Dashboard Metrics** (P2 High)
17. **PB-008 – GM Dashboard & Role** (P2 High)
18. **PB-019 – Operational Reports Library** (P2 High)

### Wave 4 – Productivity & Knowledge Features
Build supplementary profile details, feedback logs, and the interaction search index database.
19. **PB-011 – Customer Status & Tiering** (P3 Medium)
20. **PB-012 – Customer Profile Contact Details** (P3 Medium)
21. **PB-013 – Stakeholder Influence & Role Assessment** (P3 Medium)
22. **PB-015 – OEM Profiles Management** (P3 Medium)
23. **PB-016 – Feedback Collection Workspace** (P3 Medium)
24. **PB-017 – Knowledge Repository Screen** (P2 High)
