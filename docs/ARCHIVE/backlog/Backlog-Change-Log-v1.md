# Backlog Change Log v1

This document tracks changes made to the Cabio Sales OS Prototype Completion Backlog from v1 to v2, based on Product Owner decisions and review comments.

---

## Change Registry

### PB-001 – Account Structure & Hierarchy
* **Backlog Item:** PB-001 – Account Structure & Hierarchy
* **Change Type:** Modified
* **Reason:** Original implementation plan was over-engineered and exceeded Phase 1 requirements.
* **Product Owner Decision:** Limit prototype scope to basic attributes and display properties on existing views. Replace hierarchy management UI workspace and nested directory tree with a simplified approach.
* **Impact:** 
  * Retained: Customer Type selection, Parent Customer lookup mapping, and parent relationship link display in the Customer 360 view.
  * Removed: Dedicated hierarchy workspace, nested Customer Directory tree, and advanced hierarchy administration screens.
  * Priority and identifier preserved.

---

### PB-009 – PIN Code Geographic Routing
* **Backlog Item:** PB-009 – PIN Code Geographic Routing
* **Change Type:** Removed from Prototype Backlog
* **Reason:** Geocoding routing logic is a core backend/database business rule rather than a front-end prototype feature.
* **Product Owner Decision:** Remove from prototype backlog scope. Transfer responsibility to business rules, database configuration, and backend API design.
* **Impact:**
  * Removed as an independent backlog item (total count reduced by 1).
  * Removed all references from implementation sequence.
  * Dependency updated in PB-019 (Operational Reports Library) to remove dependency on PB-009.
  * Implementation responsibility moved to Business Rules Register, Customer Master logic, and Opportunity inheritance logic.

---

### PB-017 – Searchable Interaction History
* **Backlog Item:** PB-017 – Searchable Interaction History (formerly *Knowledge Repository Screen*)
* **Change Type:** Modified
* **Reason:** A dedicated repository module and navigation link were out of scope for Phase 1. Search capability is only required to be exposed within existing profile or activity widgets.
* **Product Owner Decision:** Replace dedicated Knowledge Repository screen/module with searchable interaction history integrated into existing views.
* **Impact:**
  * Replaced "Knowledge Repository Screen" title with "Searchable Interaction History".
  * Removed dedicated Knowledge Repository screen, sidebar navigation entry, and dedicated module.
  * Exposed search capabilities (keyword, customer, product, competitor) directly within Customer 360, Activity Management, or Global Search.
  * Priority (P2 High) and identifier preserved.

---

### PB-021 – Product-Team Mapping & Authorization
* **Backlog Item:** PB-021 – Product-Team Mapping & Authorization
* **Change Type:** Removed from Prototype Backlog
* **Reason:** Product-team authorization boundaries represent security architecture and authorization logic rather than mockable prototype behavior.
* **Product Owner Decision:** Remove from prototype backlog scope. Requirement remains in scope for Phase 1 but is deferred to technical design.
* **Impact:**
  * Removed as an independent backlog item (total count reduced by 1).
  * Removed all references from implementation sequence.
  * Responsibility moved to Security Architecture, Authorization Rules, RLS Strategy, API Design, and System Design Document (SDD).

---

### DF-001 – User Administration
* **Backlog Item:** DF-001 – User Administration
* **Change Type:** Added as Deferred
* **Reason:** Administration views for user profiles and roles are not critical for Prototype v1.0 Freeze.
* **Product Owner Decision:** Defer from prototype coverage.
* **Impact:**
  * Added to new "Deferred From Prototype" section.
  * Retained in Phase 1 scope; must be factored into ERD, API Design, Security Design, and System Design Document (SDD).

---

### DF-002 – Master Data Administration
* **Backlog Item:** DF-002 – Master Data Administration
* **Change Type:** Added as Deferred
* **Reason:** Master data management screens for products, territories, and governance parameters are not required for the prototype freeze.
* **Product Owner Decision:** Defer from prototype coverage.
* **Impact:**
  * Added to new "Deferred From Prototype" section.
  * Retained in implementation scope; must be reviewed during System Design Document (SDD) preparation.
