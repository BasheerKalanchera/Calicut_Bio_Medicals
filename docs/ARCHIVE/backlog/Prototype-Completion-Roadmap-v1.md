# Prototype Completion Roadmap v1

## Executive Summary

This document outlines the execution plan to complete the remaining gaps in the Cabio Sales OS React prototype, leading directly to the **Prototype v1.0 Freeze**. It establishes a single implementation stream using Claude Code.

* **Total Backlog Items:** 24
* **Total P1 Items:** 14
* **Total P2 Items:** 5
* **Total P3 Items:** 5
* **Estimated Number of Waves:** 4
* **Critical Path Items:** PB-002 (On Hold State), PB-004 (Shared Ownership), PB-010 (Mandatory Logging), PB-014 (SBU/Product Structure).

---

## Roadmap Principles

* **Dependency-First Sequencing:** Establish critical data structures (e.g., SBU configurations, On Hold states, and Shared Ownership splits) before building reports or dashboards that reference them.
* **Core Workflow Before Reporting:** Ensure the opportunity lifecycle, validations, and logs are functional before implementing the Reporting Library.
* **Foundation Before Dashboards:** Build the data routing boundaries (PIN code mapping, team authorizations) before creating Manager and GM dashboards.
* **Dashboards Before Productivity:** Establish aggregated dashboard metrics and summary views before introducing nice-to-have contact details, OEM profile lists, or feedback collection forms.
* **Single Stream Optimization:** Group similar tasks into logical waves to minimize context switching for a single developer assisted by Claude Code.
* **Incremental Validation:** Schedule Product Owner reviews immediately after each wave to validate workflow behavior and ensure early alignment before the code freeze.

---

## Implementation Waves

### Wave 1 – Core Opportunity Lifecycle
* **Objective:** Establish core opportunity lifecycle states, stage validations, mandatory activity logging, and handover rules.

| Backlog ID | Title | Priority | Effort | Dependency |
| :--- | :--- | :--- | :--- | :--- |
| PB-002 | Opportunity State - "On Hold" | P1 Critical | M | None |
| PB-024 | Overdue On-Hold Reactivation Edge Case | P1 Critical | S | PB-002 |
| PB-003 | Stage Exit Criteria Enforcement | P1 Critical | S | None |
| PB-004 | Shared Opportunity Ownership | P1 Critical | M | None |
| PB-022 | Opportunity Split Validation (100% Split Rule) | P1 Critical | S | PB-004 |
| PB-005 | Closed-Won Handover | P1 Critical | S | None |
| PB-010 | Mandatory Interaction Logging | P1 Critical | S | None |
| PB-020 | Pre-Lead Scanning | P1 Critical | S | None |

* **Wave Exit Criteria:**
  * User can toggle opportunity state to "On Hold", input reasons, and reactivate the deal.
  * Overdue reactivation banner triggers if reactivation date passes without stage change.
  * Stage transitions are blocked unless mandatory criteria are met.
  * Contributions can be split across owners, and validation prevents Closed Won if the split sum $\neq$ 100%.
  * Handover modal triggers and saves delivery details upon marking a deal Closed Won.
  * Interaction logging requires next actions, due dates, and owners.
  * Scanning activities can be logged directly against customers without an active opportunity.

---

### Wave 2 – Territory & Security Foundations
* **Objective:** Implement the core account structure, PIN code geographic mapping lookup, team authorization limits, SBU target partitions, and auto-splitting rules.

| Backlog ID | Title | Priority | Effort | Dependency |
| :--- | :--- | :--- | :--- | :--- |
| PB-014 | Product & SBU Assignment Structure | P1 Critical | S | None |
| PB-001 | Account Structure & Hierarchy | P1 Critical | M | None |
| PB-009 | PIN Code Geographic Routing | P1 Critical | M | None |
| PB-018 | Target Management by Product Category | P1 Critical | M | PB-014 |
| PB-021 | Product-Team Mapping & Authorization | P1 Critical | S | PB-014 |
| PB-023 | Opportunity Auto-Splitting (Dual Categories) | P1 Critical | M | PB-014 |

* **Wave Exit Criteria:**
  * Product configurations map to specific Brand, Model, SBU, and OEM metadata.
  * Account Directory supports parent Corporate Group, Hospital, and Department structures.
  * Account creation dynamically routes the customer to the correct Zone based on PIN code entry.
  * Managers can set targets specifically for Imaging (Ultrasound) and Critical Care categories.
  * Reps are blocked from selecting product categories their assigned team is unauthorized to sell.
  * Combined category opportunities split automatically and assign correct regional specialists.

---

### Wave 3 – Dashboards & Reporting
* **Objective:** Implement role-based dashboard widgets and consolidated operational reports.

| Backlog ID | Title | Priority | Effort | Dependency |
| :--- | :--- | :--- | :--- | :--- |
| PB-006 | Salesperson Dashboard Metrics | P2 High | S | None |
| PB-007 | Manager Dashboard Metrics | P2 High | M | PB-002 |
| PB-008 | GM Dashboard & Role | P2 High | M | None |
| PB-019 | Operational Reports Library | P2 High | L | PB-002, PB-004, PB-005, PB-009, PB-018 |

* **Wave Exit Criteria:**
  * Salesperson Dashboard displays Open Pipeline Value, High Priority count, Overdue Actions, and Beat Plan Progress cards.
  * Manager Dashboard aggregates team quotas, aging charts, hold deals, and rep activity metrics.
  * GM role is selectable in sidebar navigation, rendering the GM Dashboard.
  * Reports Library tab is accessible, displaying the 7 required Appendix A.3 operational report grids.

---

### Wave 4 – Productivity & Knowledge Features
* **Objective:** Build supplementary customer metadata profiles, OEM databases, feedback collection modules, and the global search engine for historic interactions.

| Backlog ID | Title | Priority | Effort | Dependency |
| :--- | :--- | :--- | :--- | :--- |
| PB-011 | Customer Status & Tiering | P3 Medium | S | None |
| PB-012 | Customer Profile Contact Details | P3 Medium | S | None |
| PB-013 | Stakeholder Influence & Role Assessment | P3 Medium | S | None |
| PB-015 | OEM Profiles Management | P3 Medium | S | None |
| PB-016 | Feedback Collection Workspace | P3 Medium | S | None |
| PB-017 | Knowledge Repository Screen | P2 High | M | PB-010 |

* **Wave Exit Criteria:**
  * Customer 360 profile supports Tier 1/2, Prospect/Active status, and full street contact info.
  * Stakeholders list displays influence ratings and decision roles.
  * Master OEM database tab is integrated into the Catalog view.
  * Feedback collections can be logged and viewed inside the Customer 360 panel.
  * Search bar filters interaction summaries by Keyword, Customer, Product, or Competitor.

---

## Critical Path Analysis

The critical path is defined by backlog items that must be completed first because they define schemas or capture data needed by multiple downstream dashboards and reports.

| Backlog ID | Reason Critical |
| :--- | :--- |
| **PB-014** | Defines SBU (Imaging vs Critical Care) and OEM attributes on products. Directly blocks category target configurations (PB-018), catalog mapping restrictions (PB-021), opportunity splitting rules (PB-023), and product performance reports. |
| **PB-002** | Establishes the "On Hold" deal state. Directly blocks overdue hold reactivation flags (PB-024), manager hold summary counters (PB-007), and the Pipeline Review / Forecast report integrations (PB-019). |
| **PB-004** | Implements the opportunity split contribution database logic. Directly blocks splits sum validation checks on Closed Won (PB-022) and the Revenue Attribution performance reports (PB-019). |
| **PB-010** | Enforces mandatory interactions metadata (Due Date, Next Action, Owner). Directly blocks the construction of the global search index in the Knowledge Repository (PB-017). |

---

## Prototype Freeze Readiness Checklist

### Functional Readiness
* [ ] All P1 backlog items (PB-001 to PB-005, PB-009, PB-010, PB-014, PB-018, PB-020 to PB-024) completed.
* [ ] All P2 and P3 backlog items implemented.
* [ ] Verification tests validate that stage exit criteria block invalid opportunity transitions.
* [ ] Split calculations sum check validation blocks Closed Won if splits $\neq$ 100%.

### UX Readiness
* [ ] GM Dashboard workspace, Reports Library panels, and Knowledge base screens are accessible in the sidebar navigation drawer.
* [ ] Customer 360 workspace displays contact lists, document placeholder spaces, assets, and feedback feeds.
* [ ] No dead-end workflows; back buttons return correctly to prior lists.

### Governance Readiness
* [ ] Reconciled backlog complete with no open requirements.
* [ ] Product Owner reviews and signs off on each Wave completion.
* [ ] No out-of-scope PM/BA features introduced.

---

## Recommended Execution Sequence (Compressed AI-Assisted Sprint)

Given the prototype's current **95% complete state** and the use of **Claude Code** for automated code updates in a single-file React environment, the timeline is compressed from a standard 4-week cycle into a **5-day focused sprint**. 

### Day 1: Wave 1 – Core Opportunity Lifecycle
* **Focus:** PB-002, PB-024, PB-003, PB-004, PB-022, PB-005, PB-010, PB-020.
* **Milestone:** All core validations, hold toggles, split sum checks, and handover dialogs functional.

### Day 2: Wave 2 – Territory & Security Foundations
* **Focus:** PB-014, PB-001, PB-009, PB-018, PB-021, PB-023.
* **Milestone:** Product configurations mapped, PIN code lookup routing active, team permissions active, and auto-splitting fully operational.

### Day 3: Wave 3 – Dashboards & Reporting (Part 1)
* **Focus:** PB-006 (Salesperson KPIs), PB-007 (Manager Dashboard), PB-008 (GM Dashboard & Role).
* **Milestone:** Active/Manager/GM view toggles and KPI metrics cards rendered.

### Day 4: Wave 3 – Dashboards & Reporting (Part 2)
* **Focus:** PB-019 (Operational Reports Library).
* **Milestone:** The 7 report screens (Forecasts, Pipelines, attribution splits, etc.) implemented with basic tables and mock filters.

### Day 5: Wave 4 – Productivity & Knowledge Features
* **Focus:** PB-011, PB-012, PB-013, PB-015, PB-016, PB-017.
* **Final milestone:** OEM database, feedback lists, keyword search database active, final PO verification tests, and code freeze.

