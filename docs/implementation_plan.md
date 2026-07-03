# Cabio Sales OS - Core System Development & First Production Demo Plan

## Executive Summary
Following the kickoff on June 1, the first two weeks were utilized to complete the prototype backlog. The prototype demo occurred on June 15. After finalizing the minor demo feedback tweaks by tomorrow (June 17), the prototype will be frozen as **Prototype v1.0**.

This leaves exactly **3.5 weeks** for the design and development of the **Core System module** (ending July 13 — July 3rd week / Wk 6) and **1.5 weeks** (ending June 29) until the **First Production Demo**.

Per the project timeline, prioritization, and rollout checkpoints:
1. **Milestone 1 (Core System — Due July 27):** Account Management, Product Catalog, Opportunities, and Activities & Next Actions.
   * *Checkpoint:* **Core System Readiness Demo** on **Monday, July 13** (End of Week 6) before deployment steps.
   * *Vacation:* **July 14 – July 19** (Week 7) — No development or deployment activity.
   * *UAT & Setup Block:* **Staging Deployment, Star Onboarding, Core System UAT & Bug Fixing** from **July 20 – July 26** (Week 8) supported by the user.
   * *Production Go-Live (Star Sales):* **Monday, July 27** (Week 9).
2. **Milestone 2 (Full System Completion — Due August 31):** Sales Planning (Target & Coverage), Reporting & Review, and ADMIN (Power User).
   * *Checkpoint:* **Interim Demo 1** on **Monday, August 10** (Week 10 / Sprint 3).
   * *Checkpoint:* **Interim Demo 2** on **Monday, August 24** (Week 12 / Sprint 4).
   * *UAT Block:* **Full System UAT** from **August 24 – August 30** (Week 13).
   * *Production Go-Live (All Users):* **Monday, August 31** (Week 14).

---

## User Review Required
> [!IMPORTANT]
> To meet the aggressive 1.5-week deadline for the first production demo, we must execute a compressed **4-day Foundation Period (June 18 - June 21)**. During these 4 days, we will focus exclusively on drafting, reviewing, and freezing the 11 design artifacts required by the delivery model. Production coding will start on June 22.

> [!WARNING]
> Since we are on a compressed schedule, any delays in reviewing and approving the daily design artifacts during the 4-day Foundation Period will push back the start of production development and put the 1.5-week production demo at risk.

---

## Open Questions
- **Demo Scope Confirmation:** For the first production demo on June 29, are we aligned on showcasing a live **Customer 360 Workspace** (with basic account setup/detail editing) and **Product Catalog Browser** pulling from a live PostgreSQL database?
*(Resolved: Supabase setup and credential provisioning are scheduled for the Sprint 1 Kickoff on June 22).*

---

## Proposed Schedule & Sprint Breakdown

### Milestone 1: Ingestion & Core System Development (Weeks 1 to 7)

#### 1. Phase 0B Finalization (June 17)
* **Goal:** Apply minor demo feedback tweaks to the prototype and freeze Phase 0B deliverables.
* **Deliverables:** Frozen [UI-Inventory.md](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/docs/UI-Inventory.md), [Prototype-Data-Model.md](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/docs/Prototype-Data-Model.md), and [Traceability-Matrix.md](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/docs/Traceability-Matrix.md).

#### 2. Compressed Foundation Period (June 18 – June 21)
During this period, we will generate and freeze all Week 1 design artifacts required for production coding.

* **Day 1 (June 18): Logical Architecture & Scope Rules**
  * Draft [Design-Decisions.md](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/docs/Design-Decisions.md) (authentication, SBU separation, Vite/Material UI setup).
  * Draft [Business-Rules.md](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/docs/Business-Rules.md) (opportunity split validation, stage transition exit criteria, sentiment/payer behaviour updates).
* **Day 2 (June 19): Data Architecture**
  * Draft [ERD.md](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/docs/ERD.md) (Mermaid database schema representation focusing on Customers, Products, Projects, and Contacts).
  * Draft `Physical-Schema.sql` (PostgreSQL table schemas and constraints).
* **Day 3 (June 20): Database Security & Reporting**
  * Draft [RLS-Strategy.md](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/docs/RLS-Strategy.md) (PostgreSQL Row-Level Security rules by role).
  * Draft `Reporting-Strategy.md` (SQL views for quotas, forecasts, pipeline calculations).
* **Day 4 (June 21): Service Interfaces & SDD**
  * Draft `API-Catalog.md` (FastAPI schema, parameters, endpoints).
  * Draft `SDD.md` (System Design Document) & `Development-Standards.md`.
  * **Milestone:** All 11 design deliverables approved and frozen.

#### 3. Production Sprint 1: Accounts & Products (June 22 – June 29 / Weeks 3-4)
* **Goal:** Deliver a working production demo featuring Customer 360 & Product Catalog.
* **Tasks:**
  * **Sprint 1 Kickoff (June 22):** Set up Supabase organization, provision PostgreSQL instance, and configure environment credentials.
  * Initialize the database schema for Core tables (Users, Customers, Stakeholders, Products, Projects, Assets).
  * Set up the FastAPI backend service; implement models, schemas, and APIs for:
    * Customer directory listing and details updates.
    * Stakeholder contact management.
    * Product catalog browsing and collateral list rows.
  * Deploy the backend to Vercel/Render.
  * Initialize the React Vite + TypeScript + Material UI frontend project.
  * Develop frontend client API connection and role session context.
  * Build the **Customer Directory UI** (search and zone/class/specialty filters).
  * Build the **Customer 360 Workspace UI** (tabs: Overview, Stakeholders, Projects, Installed Base).
  * Build the **Product Catalog Browser UI** (SBU category filters and collaterals).
  * **Deliverable (Monday, June 29):** **First Production Demo** demonstrating working customer management and catalog browsing connected to the live database.

#### 4. Production Sprint 2: Opportunities & Activities (June 30 – July 13 / Weeks 5-6)
* **Goal:** Implement Opportunity Pipeline and Activity tracking.
* **Tasks:**
  * Create tables/APIs for Opportunities, Contributor Splits, Activities, and Reminders.
  * Develop Frontend Kanban Pipeline board. **Decision (2026-07-03):** ships
    click-based for Milestone 1 — stage changes via the Opportunity Detail
    panel's Stage field, not drag-and-drop on the board. Drag-and-drop is
    deferred; revisit after Milestone 1 (post July 27 go-live) if still
    desired.
  * Implement Opportunity Detail panel and form wizards (lead wizard split routing).
  * Enforce Stage Exit validations and shared split logic (sum = 100%).
  * Implement Activity Logging timeline and Next Actions panel.
  * **Deliverable (Monday, July 13):** **Core System Readiness Demo** (End of Week 6 checkpoint before deployment steps).

#### 5. Vacation Week (July 14 – July 19 / Week 7)
* **Status:** Vacation — No development, staging deployment, or onboarding activity.

#### 6. Staging Deployment, Star Onboarding, Core System UAT & Bug Fixing (July 20 – July 26 / Week 8)
* **Goal:** Deploy Core System to staging, onboard Star Sales members, and resolve UAT defects.
* **Tasks:**
  * Deploy backend APIs and frontend build to staging environment.
  * Set up database seeding for test records.
  * Onboard Star Sales members onto the Core System.
  * Run active UAT testing workflows (tracked via `UAT-Scenarios.md`).
  * Fix UAT defects and security issues in database/API layers (user active to support).
  * **Milestone (July 26):** Core System signed off, frozen, and ready for production deployment.

#### 7. Core System Production Deployment (Monday, July 27 / Week 9 Kickoff)
* **Goal:** Make the Core System live for Star Sales members in production.
* **Tasks:**
  * Deploy backend and frontend builds to production hosting.
  * Migrate production database structures.
  * Transition Star Sales members to the live production database.

---

### Milestone 2: Full System Completion (Weeks 9 to 15)

#### 1. Production Sprint 3: Sales Planning & Admin Modules (July 27 – August 10 / Weeks 9-10)
* **Goal:** Deliver working target/beat planning workflows and role-based permissions.
* **Tasks:**
  * Create database tables and APIs for Rep Targets, SBU Targets, and Beat Plans.
  * Build the **Target Planning UI** (Manager views for annual/quarterly quota sets and SBU targets).
  * Build the **Coverage Planning UI** (Sales representative lists of Beat Plans and hospital visit allocations).
  * Build the **ADMIN Directory UI** (User management grid, role selections, active status controls).
  * **Deliverable (Monday, August 10):** **Milestone 2 Interim Demo 1** (End of Week 10 checkpoint).

#### 2. Production Sprint 4: Reporting & Dashboard Module (August 11 – August 24 / Weeks 11-12)
* **Goal:** Implement analytics, forecast rollups, and stabilization checks.
* **Tasks:**
  * Build PostgreSQL reporting views and calculations.
  * Develop the **Insights Dashboard UI** (attainment progress bar, win rates, stagnant warnings, rep comparisons).
  * Perform Mobile optimization, field usage testing, and data validation sweeps.
  * **Deliverable (Monday, August 24):** **Milestone 2 Interim Demo 2** (End of Week 12 checkpoint).

#### 3. Full System UAT (August 24 – August 30 / Week 13)
* **Goal:** Conduct UAT testing on the complete system.
* **Tasks:**
  * Run active UAT testing workflows (tracked via `UAT-Scenarios.md`).
  * Resolve UAT defects and reporting inconsistencies.
  * **Milestone (August 30):** Full System signed off and frozen.

#### 4. Full System Production Deployment & Go-Live (Monday, August 31 / Week 14 Kickoff)
* **Goal:** Make the Full System live for all sales team members.
* **Tasks:**
  * Deploy full build to production.
  * Transition all user roles onto the live database.

#### 5. Full Team Onboarding (September 1 – September 13 / Weeks 14-15)
* **Goal:** Onboard and train the entire sales team.
* **Tasks:**
  * Conduct team enablement sessions.
  * Monitor usage and provide stabilization support.
