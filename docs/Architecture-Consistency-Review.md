# Cabio Sales OS — Architecture Consistency Review

**Reviewer Role:** Chief Data Architect (Review Pass)
**Date:** June 19, 2026
**Status:** Draft — Pending Architect Approval
**Scope:** Cross-document consistency between ADR.md, Enterprise-Data-Model.md, and Business-Rules.md
**Purpose:** Identify gaps, conflicts, and open questions before Physical Data Model (PDM) generation begins.

> **Important:** This document is a **read-only review artifact**. No source documents have been modified. All recommendations require explicit architect approval before any document or schema changes are made.

---

## Review Summary

| Category                   | Count | Severity |
| :------------------------- | :---: | :------- |
| Missing Entities           |   2   | 🟡 Medium |
| Missing Foreign Keys       |   6   | 🔴 High   |
| Missing Relationships      |   5   | 🟡 Medium |
| Conflicting Business Rules |   4   | 🔴 High   |
| Missing Assumptions        |   7   | 🟡 Medium |
| Pre-PDM Recommendations    |   8   | —        |
- [Cabio Sales OS — Architecture Consistency Review](#cabio-sales-os--architecture-consistency-review)
  - [Review Summary](#review-summary)
  - [1. Missing Entities](#1-missing-entities)
    - [ME-01: `Zone` Entity — Declared but Not Modeled](#me-01-zone-entity--declared-but-not-modeled)
    - [ME-02: `SBU` Entity — Listed in Conceptual Model but Absent from Logical Model](#me-02-sbu-entity--listed-in-conceptual-model-but-absent-from-logical-model)
  - [2. Missing Foreign Keys](#2-missing-foreign-keys)
    - [MFK-01: `Target Plan` — Missing SBU Foreign Key and Planning Period Attribute](#mfk-01-target-plan--missing-sbu-foreign-key-and-planning-period-attribute)
    - [MFK-02: `Coverage Plan` — Missing `target_plan_id` Foreign Key](#mfk-02-coverage-plan--missing-target_plan_id-foreign-key)
    - [MFK-03: `Opportunity` — Missing `coverage_plan_entry_id` Foreign Key](#mfk-03-opportunity--missing-coverage_plan_entry_id-foreign-key)
    - [MFK-04: `Opportunity` — Missing `lead_source` Attribute](#mfk-04-opportunity--missing-lead_source-attribute)
    - [MFK-05: `Opportunity` — Missing `hold_reason` and `reactivation_date` Attributes](#mfk-05-opportunity--missing-hold_reason-and-reactivation_date-attributes)
    - [MFK-06: `Reminder` — Missing Contextual Entity Foreign Keys](#mfk-06-reminder--missing-contextual-entity-foreign-keys)
  - [3. Missing Relationships](#3-missing-relationships)
    - [MR-01: `Activity` — Missing Direct `Account` Linkage](#mr-01-activity--missing-direct-account-linkage)
    - [MR-02: `Project` — Missing Relationship to `User` (Owner)](#mr-02-project--missing-relationship-to-user-owner)
    - [MR-03: `Activity` — Missing Relationship to `Project`](#mr-03-activity--missing-relationship-to-project)
    - [MR-04: `Stakeholder` — Missing Relationship to `Opportunity`](#mr-04-stakeholder--missing-relationship-to-opportunity)
    - [MR-05: `Installed Asset` — Missing from ER Summary Matrix](#mr-05-installed-asset--missing-from-er-summary-matrix)
  - [4. Conflicting Business Rules](#4-conflicting-business-rules)
    - [CBR-01: Opportunity Value — Calculated vs. Manually Asserted](#cbr-01-opportunity-value--calculated-vs-manually-asserted)
    - [CBR-02: Opportunity `project_id` — Optional vs. Conditionally Required](#cbr-02-opportunity-project_id--optional-vs-conditionally-required)
    - [CBR-03: `Activity` — Mandatory vs. Optional Opportunity Linkage](#cbr-03-activity--mandatory-vs-optional-opportunity-linkage)
    - [CBR-04: `Closed Lost` — Competitor Information Mandatory vs. Optional](#cbr-04-closed-lost--competitor-information-mandatory-vs-optional)
  - [5. Missing Assumptions](#5-missing-assumptions)
    - [MA-01: `planning_period` Format Not Defined](#ma-01-planning_period-format-not-defined)
    - [MA-02: Fiscal Year vs. Calendar Year Not Declared](#ma-02-fiscal-year-vs-calendar-year-not-declared)
    - [MA-03: Opportunity Stage Enum Values Not Defined in EDM](#ma-03-opportunity-stage-enum-values-not-defined-in-edm)
    - [MA-04: `Installed Asset` — Competitor Equipment Modeling Not Resolved](#ma-04-installed-asset--competitor-equipment-modeling-not-resolved)
    - [MA-05: `Document` Entity — Storage Backend and Attributes Not Defined](#ma-05-document-entity--storage-backend-and-attributes-not-defined)
    - [MA-06: `User` Entity — Authentication Provider Strategy Not Declared in EDM](#ma-06-user-entity--authentication-provider-strategy-not-declared-in-edm)
    - [MA-07: `Split` — Default Single-Owner Behavior Not Defined](#ma-07-split--default-single-owner-behavior-not-defined)
  - [6. Recommendations Before Physical Data Model Generation](#6-recommendations-before-physical-data-model-generation)
  - [Appendix: ADR Coverage Cross-Reference](#appendix-adr-coverage-cross-reference)

---
    
## 1. Missing Entities

### ME-01: `Zone` Entity — Declared but Not Modeled

**Source of Conflict:** GEMINI.md explicitly declares `Zone` as a core supporting entity. ADR-009 references it in security scoping. The EDM Conceptual Data Model (Section 4) describes a User as having an assigned SBU, Zone, and Role, but **no Zone entity is defined** in the Logical Data Model (Section 5) or the ER Summary Matrix (Section 6).

**Impact:**
- A `User` references a Zone but there is no FK target for that reference.
- Zone-based reporting and coverage analysis (mentioned in GEMINI.md) have no data foundation.
- The PDM cannot generate a `zone_id` FK on `users` without a `zones` table definition.

**Recommendation:** `Accept` — Define a `Zone` entity in the EDM with at minimum: `zone_id`, `zone_name`, `description`. Establish a `User → Zone (Many:1)` relationship.

---

### ME-02: `SBU` Entity — Listed in Conceptual Model but Absent from Logical Model

**Source of Conflict:** The Conceptual Data Model (EDM Section 4) lists `SBU` as a business entity central to target allocation, security, and product ownership. However, `SBU` appears **nowhere in the Logical Data Model (Section 5)** and **nowhere in the ER Summary Matrix (Section 6)**.

**Impact:**
- `Target Plan` is defined at "User + SBU + Quarter level" (BR-PL-01) but the EDM logical model shows only `User (Many:1)` with no SBU FK.
- `Product` is scoped to one SBU (ADR-016) but no Product → SBU relationship exists in the logical model.
- The RLS policy (ADR-009) depends on `sbu_id` claims, requiring a proper `sbus` table.

**Recommendation:** `Accept` — Define an `SBU` entity and explicitly add the following relationships to the Logical Model:
- `Target Plan → SBU (Many:1)`
- `Product → SBU (Many:1)`
- `User → SBU (Many:1)`

---

## 2. Missing Foreign Keys

### MFK-01: `Target Plan` — Missing SBU Foreign Key and Planning Period Attribute

**Source of Conflict:** BR-PL-01 states: *"Target Plans must be defined at the User + SBU + Quarter level."* BR-PL-03 requires Coverage Plans to link to a Target Plan for the same *"User, SBU, and Planning Period."*

The EDM Logical Model for Target Plan lists only `User (Many:1)`. There is no `sbu_id` FK, no `quarter` field, and no `planning_period` attribute documented.

**Impact:** Without `sbu_id` and `planning_period` on Target Plan, the uniqueness constraint in BR-PL-01 and the traceability check in BR-PL-03 cannot be enforced at the database level.

**Recommendation:** `Accept` — Add `sbu_id` (FK → SBU), `planning_period` (e.g., `YYYY-Qn`), and a unique composite constraint `(user_id, sbu_id, planning_period)` to Target Plan.

---

### MFK-02: `Coverage Plan` — Missing `target_plan_id` Foreign Key

**Source of Conflict:** BR-PL-03 requires every Coverage Plan to be associated with an approved Target Plan for the same User, SBU, and Planning Period. ADR-013 mandates that Coverage Plans must be traceable to Targets. The EDM Logical Model for Coverage Plan shows only `User (Many:1)` and `Coverage Plan Entries (1:Many)`.

**Impact:** There is no `target_plan_id` FK on Coverage Plan. The hierarchy Target → Coverage → Opportunity → Revenue (the central ADR-013 mandate) cannot be enforced at the data layer.

**Recommendation:** `Accept` — Add `target_plan_id` (FK → Target Plan) as a mandatory field on Coverage Plan.

---

### MFK-03: `Opportunity` — Missing `coverage_plan_entry_id` Foreign Key

**Source of Conflict:** BR-PL-04 mandates that Coverage-originated Opportunities *"must reference the Coverage Plan Entry that initiated the opportunity."* The EDM Logical Model for Opportunity lists: `Account (Many:1)`, `Project (Many:1)`, `Opportunity Items (1:Many)`, `Splits (1:Many)`, `Activities (1:Many)`. There is **no `coverage_plan_entry_id` FK**.

**Impact:** The origination classification required by BR-PL-04 (Coverage Plan Originated vs. Opportunistic) cannot be enforced or queried. ADR-013 traceability from Coverage → Opportunity → Revenue breaks at this joint.

**Recommendation:** `Accept` — Add `origination_type` (Enum: `COVERAGE`, `OPPORTUNISTIC`) and nullable `coverage_plan_entry_id` (FK → Coverage Plan Entry) to Opportunity. Enforce: if `origination_type = COVERAGE`, then `coverage_plan_entry_id` must be populated.

---

### MFK-04: `Opportunity` — Missing `lead_source` Attribute

**Source of Conflict:** BR-OP-01 stage gate requires *"Lead Source defined using values from Appendix A"* at the Lead → Qualified transition. Appendix A defines 9 Lead Source values (WEBSITE, REFERRAL, TENDER, etc.). The EDM Logical Model for Opportunity has no `lead_source` attribute defined.

**Impact:** The stage gate at Lead → Qualified cannot be enforced at the data model level. The PDM will generate no column or enum for this mandatory field.

**Recommendation:** `Accept` — Add `lead_source` (Enum, nullable initially, required at Qualified stage) to Opportunity.

---

### MFK-05: `Opportunity` — Missing `hold_reason` and `reactivation_date` Attributes

**Source of Conflict:** ADR-005 and BR-OP-02 define the On Hold discipline as requiring `hold_reason` (Enum) and `reactivation_date` (Date). Appendix A in Business-Rules.md defines 7 Hold Reason values. The EDM Logical Model for Opportunity does not list these fields.

**Impact:** The PDM will miss these columns. The "Reactivation Overdue" alert logic defined in BR-OP-02 cannot be built without `reactivation_date`.

**Recommendation:** `Accept` — Add `hold_reason` (Enum, nullable), `reactivation_date` (Date, nullable), and `stage` (Enum covering all pipeline stages including `ON_HOLD`) to the Opportunity entity in the EDM.

---

### MFK-06: `Reminder` — Missing Contextual Entity Foreign Keys

**Source of Conflict:** The EDM defines `Reminder` with only a `User (Many:1)` relationship. In practice, Reminders described in the system (BR-OP-02 reactivation alerts, follow-up tasks) are contextually associated with Opportunities, Activities, and Projects — not just a user in isolation.

**Impact:** Without context linkage, a Reminder cannot be displayed in the correct entity timeline. Developers will be forced to add ad-hoc columns post-PDM, breaking the schema baseline.

**Recommendation:** `Needs Discussion` — Decide whether Reminder should use:
- **Option A:** Specific nullable FKs — `opportunity_id`, `project_id`, `account_id` (simpler for Phase 1)
- **Option B:** A polymorphic `entity_type` (Enum) + `entity_id` (UUID) pattern

Present both options to architect before PDM generation.

---

## 3. Missing Relationships

### MR-01: `Activity` — Missing Direct `Account` Linkage

**Source of Conflict:** BR-ACT-01 states: *"Activities linked only to an Account (with no Opportunity) are classified as 'Account Scanning/Profiling'."* ADR-006 explicitly states *"Activities may exist before an Opportunity is created."* The EDM ER Summary Matrix shows `Opportunity → Activity (1:M)` only. There is no `Account → Activity` relationship in the matrix.

**Impact:** Account-level prospecting activities (pre-opportunity engagement) cannot be associated with an Account in the current model, directly violating ADR-006.

**Recommendation:** `Accept` — Add a nullable `account_id` (FK → Account) to Activity. Make `opportunity_id` also nullable. Enforce: at least one of `account_id` or `opportunity_id` must be non-null.

---

### MR-02: `Project` — Missing Relationship to `User` (Owner)

**Source of Conflict:** Projects in the EDM relate only to Account (Many:1) and Opportunities (1:Many). ADR-014 references Project-level activity tracking and stakeholder engagement. BR-PROJ-01 implies a managed lifecycle. The Security Classification table (EDM Section 8) scopes Projects at the SBU level, but there is no `owner_id` or `assigned_to` FK on Project.

**Impact:** No mechanism exists to determine who owns or manages a Project. Pipeline reports, access control, and notifications cannot be attributed to a responsible user.

**Recommendation:** `Accept` — Add `owner_id` (FK → User) to Project as a mandatory field. Consider `sbu_id` (FK → SBU) to support SBU-scoped security.

---

### MR-03: `Activity` — Missing Relationship to `Project`

**Source of Conflict:** ADR-014 states: *"Project-level…activity tracking…become possible."* ADR-011 states all activity histories including "Project" render as timelines. The EDM defines Activities as related only to Opportunities. There is no `project_id` FK on Activity.

**Impact:** Activities performed in the context of a Project (e.g., bid preparation meetings, site surveys for a tender) cannot be attributed to a Project without misusing the `opportunity_id` reference.

**Recommendation:** `Needs Discussion` — Add nullable `project_id` (FK → Project) to Activity, consistent with the polymorphic activity linkage pattern emerging from MR-01.

---

### MR-04: `Stakeholder` — Missing Relationship to `Opportunity`

**Source of Conflict:** ADR-014 mentions "Project-level stakeholder engagement tracking." In medical sales, knowing which stakeholders are involved in a specific Opportunity (as decision-maker, influencer, or evaluator) is operationally critical. The EDM shows only a Stakeholder → Account (Many:1) relationship.

**Impact:** There is no mechanism to record which stakeholders are engaged on a specific Opportunity. Influence mapping at the deal level — a core differentiator of the Sales OS — is structurally impossible in Phase 1.

**Recommendation:** `Needs Discussion` — Consider a junction table `opportunity_stakeholders` (`opportunity_id`, `stakeholder_id`, `role_in_deal`) for Phase 1. Project-level stakeholder linkage can be a future extension point.

---

### MR-05: `Installed Asset` — Missing from ER Summary Matrix

**Source of Conflict:** The Conceptual Data Model (EDM Section 4) and the Master Data table (EDM Section 7) both include Installed Asset. The Logical Model (Section 5.2) defines it with Account (Many:1) and Product (Many:1) relationships. However, Installed Asset **does not appear in the ER Summary Matrix (Section 6)**.

**Impact:** The ER Matrix is used as the primary reference for PDM FK generation. Its omission means the `account_id` and `product_id` FKs on the `installed_assets` table will not be generated unless caught manually.

**Recommendation:** `Accept` — Add two Installed Asset rows to the ER Summary Matrix in EDM Section 6.

---

## 4. Conflicting Business Rules

### CBR-01: Opportunity Value — Calculated vs. Manually Asserted

**Source of Conflict:**
- **BR-FIN-03** states: *"Opportunity Value is system-calculated and cannot be manually overridden."*
- **ADR-015** acknowledges that Opportunities may be created at any stage, including Negotiation or Order, where a monetary value would typically be known before individual Opportunity Items are entered.
- **BR-OP-01** (Negotiation → Order gate) requires "Order Value confirmed" — implying a value can be asserted at that point independently.

**Assessment:** If value is strictly calculated from Opportunity Items, a salesperson creating an Opportunity at Negotiation must first create all line items before the deal has any value. This is operationally impractical for high-stage entry scenarios permitted by ADR-015.

**Recommendation:** `Needs Discussion` — Consider:
- **Option A:** Allow a manual `indicative_value` (Lakhs) for early stages; replace it with the calculated value once Opportunity Items are entered.
- **Option B:** Require at least one Opportunity Item before an Opportunity can be saved at any stage.

This decision directly impacts API validation logic and the PDM column design.

---

### CBR-02: Opportunity `project_id` — Optional vs. Conditionally Required

**Source of Conflict:**
- **ADR-014** states: *"Opportunities may **optionally** belong to Projects."*
- **ADR-004** states Projects are the *"**primary** business grouping mechanism."*
- **BR-PL-04** classifies Opportunities as Coverage Plan Originated or Opportunistic with no mention of Project linkage as a condition.
- The EDM Logical Model for Opportunity lists a `Project (Many:1)` relationship but does not clarify nullability or conditions.

**Assessment:** "Optionally" in ADR-014 and "primary grouping mechanism" in ADR-004 create an unstated tension. Government tender scenarios would logically require a Project link, but no business rule currently enforces it.

**Recommendation:** `Needs Discussion` — Define explicitly:
- Is `project_id` on Opportunity always optional?
- Are Government Tender Opportunities required to have a `project_id`?
- Does `origination_type = COVERAGE` imply or require a `project_id`?

---

### CBR-03: `Activity` — Mandatory vs. Optional Opportunity Linkage

**Source of Conflict:**
- **BR-ACT-01** says activities *"should ideally"* be linked to an Opportunity — implying optional.
- **ADR-006** says `opportunity_id` is a *"primary linkage"* for interaction logs — implying near-mandatory.
- The **EDM ER Matrix** shows only `Opportunity → Activity (1:M)` with no `account_id` — implying Activities cannot exist without an Opportunity.

**Assessment:** Three documents use three different degrees of constraint for the same relationship. This will produce inconsistent frontend validation, backend enforcement, and API contracts.

**Recommendation:** `Accept` — Establish a single, unambiguous rule: Activity requires **at least one of** `opportunity_id` or `account_id` to be non-null. Activities with only `account_id` are classified as "Account Development." Activities with `opportunity_id` are classified as "Pipeline Activity."

---

### CBR-04: `Closed Lost` — Competitor Information Mandatory vs. Optional

**Source of Conflict:**
- **BR-OP-01 Stage Gate table** states for "Any Stage → Closed Lost": *"Competitor Information recorded"* — implying mandatory.
- **BR-OP-03 Closed Lost Validation** states `competitor_name` is an **Optional Field**.

**Assessment:** Within the same document (Business-Rules.md), the stage gate table and the dedicated Closed Lost rule directly contradict each other on whether competitor information is required.

**Recommendation:** `Accept` — Reconcile to a single standard. Suggested resolution:
- `loss_reason` — **Mandatory**
- `competitor_name` — **Mandatory** only when `loss_reason = COMPETITOR_WON`
- `loss_notes` — **Optional**

---

## 5. Missing Assumptions

The following assumptions are implicit across the documents but have not been formally declared. Each must be resolved before PDM generation to avoid incorrect schema or validation logic.

### MA-01: `planning_period` Format Not Defined

**Gap:** BR-PL-01 and BR-PL-03 reference "Quarter" and "Planning Period" as key uniqueness identifiers. No document defines the data type or format of this field.

**Risk:** Inconsistent formats between frontend and backend will break the uniqueness constraint and reporting rollups.

**Recommendation:** Define `planning_period` format explicitly — e.g., `YYYY-Qn` where n ∈ {1,2,3,4} — and clarify whether the system uses calendar quarters or fiscal quarters (see MA-02).

---

### MA-02: Fiscal Year vs. Calendar Year Not Declared

**Gap:** Target Plans are described as "Annual/Quarterly." India's standard fiscal year runs April–March. No document specifies whether the system operates on a calendar or fiscal year basis.

**Risk:** Quarter boundary misalignment between Target Plans and Coverage Plans if not standardized across the system.

**Recommendation:** Declare the fiscal year model as a system-wide assumption. For Indian medical sales, April–March fiscal quarters are recommended.

---

### MA-03: Opportunity Stage Enum Values Not Defined in EDM

**Gap:** BR-OP-01 defines stage transitions (Lead, Qualified, Demo, Negotiation, Order, Closed Won, Closed Lost, On Hold). The EDM does not define an `Opportunity Stage` enum or list the valid stage values anywhere in the logical model.

**Risk:** PDM will generate an unconstrained text column unless the enum is formally specified in the EDM.

**Recommendation:** Define the Opportunity Stage enum in the EDM, sourced from the Business Rules stage transition table.

---

### MA-04: `Installed Asset` — Competitor Equipment Modeling Not Resolved

**Gap:** The EDM states Installed Assets include *"competitor equipment."* If a competitor's product is installed at an account, it may not exist in the `Products` table. The current `product_id` FK on Installed Asset would be null or invalid for competitor equipment.

**Risk:** Either competitor products must be added to the Products table (polluting the product catalog) or `product_id` must be made nullable with a separate text field — a design choice that must be made before PDM generation.

**Recommendation:** `Needs Discussion` — Decide:
- **Option A:** Allow `product_id` to be nullable with `is_competitor_equipment = true` (Boolean) and `competitor_product_name` (Text) fields.
- **Option B:** Create a separate `competitor_products` reference table.

---

### MA-05: `Document` Entity — Storage Backend and Attributes Not Defined

**Gap:** The EDM defines a `Document` entity for "File metadata and references." The underlying storage mechanism (Supabase Storage, S3, local filesystem) is not declared in any document, and no attribute schema is described beyond the relationships.

**Risk:** PDM will generate an incomplete `documents` table without knowing what metadata columns are required.

**Recommendation:** Define Document attributes at minimum: `document_id`, `entity_type` (Enum), `entity_id` (UUID), `file_name`, `storage_url`, `mime_type`, `file_size_bytes`, `uploaded_by` (FK → User), `uploaded_at`.

---

### MA-06: `User` Entity — Authentication Provider Strategy Not Declared in EDM

**Gap:** ADR-012 declares Supabase as the backend. Supabase provides built-in `auth.users`. The EDM does not clarify whether `users` will be a custom table, a view over `auth.users`, or a profile table extending Supabase auth.

**Risk:** If not decided before PDM generation, the `users` table schema will be designed incorrectly and will conflict with Supabase Auth integration and RLS token claims (ADR-009).

**Recommendation:** Declare explicitly: The system will maintain a `user_profiles` table in the public schema, linked to `auth.users` via UUID. The `user_profiles` table holds `sbu_id`, `zone_id`, `role_id`, and business-specific attributes.

---

### MA-07: `Split` — Default Single-Owner Behavior Not Defined

**Gap:** BR-FIN-01 requires at least one contributor and the sum to equal 100%. When a single salesperson owns a deal, the system should default to a 100% split for that user. No document defines whether this split is created automatically or must be entered manually.

**Risk:** If not automatic, every single-owner deal will require a manual split entry before saving — creating friction for the most common scenario in the system.

**Recommendation:** Define: *"A default Split record of 100% for the creating user is automatically created when an Opportunity is saved without explicit split entries."*

---

## 6. Recommendations Before Physical Data Model Generation

All items below should be resolved or confirmed before PDM work begins.

| ID   | Recommendation                                                                                            | Priority | Classification   |
| :--- | :-------------------------------------------------------------------------------------------------------- | :------- | :--------------- |
| R-01 | Add `Zone` entity to EDM Logical Model and ER Matrix                                                      | 🔴 High   | Accept           |
| R-02 | Add `SBU` entity to EDM Logical Model and ER Matrix with FKs to User, Target Plan, and Product            | 🔴 High   | Accept           |
| R-03 | Add `target_plan_id` (FK) to Coverage Plan in EDM to enforce the Target → Coverage planning hierarchy     | 🔴 High   | Accept           |
| R-04 | Add `coverage_plan_entry_id` (nullable FK) and `origination_type` (Enum) to Opportunity in EDM            | 🔴 High   | Accept           |
| R-05 | Reconcile CBR-04: define exactly when `competitor_name` is mandatory on Closed Lost                       | 🔴 High   | Accept           |
| R-06 | Define Opportunity Stage enum values in the EDM (currently only specified in Business-Rules.md)           | 🟡 Medium | Accept           |
| R-07 | Resolve CBR-01: decide whether an `indicative_value` override is permitted before Opportunity Items exist | 🟡 Medium | Needs Discussion |
| R-08 | Resolve MA-04: define the Installed Asset model for competitor equipment (nullable FK vs. separate table) | 🟡 Medium | Needs Discussion |

---

## Appendix: ADR Coverage Cross-Reference

| ADR     | Decision                                  | EDM Coverage                                                             | Business Rules Coverage                                | Gap Reference                         |
| :------ | :---------------------------------------- | :----------------------------------------------------------------------- | :----------------------------------------------------- | :------------------------------------ |
| ADR-001 | Sales OS Paradigm                         | ✅ Reflected in design principles                                         | —                                                      | None                                  |
| ADR-002 | Strategic Coverage Planning               | ✅ Coverage Plan / Entry entities defined                                 | ✅ BR-PL-02 enforces it                                 | None                                  |
| ADR-003 | 100% Split Rule                           | ✅ Split entity defined                                                   | ✅ BR-FIN-01 enforces it                                | None                                  |
| ADR-004 | Tender via Projects                       | ✅ Project entity defined                                                 | ✅ BR-PROJ-01 lifecycle defined                         | None                                  |
| ADR-005 | On Hold Discipline                        | ❌ `hold_reason` / `reactivation_date` absent from EDM Logical Model      | ✅ BR-OP-02 fully defined                               | MFK-05                                |
| ADR-006 | Activity Support Flow                     | ⚠️ Activity → Account link missing from ER Matrix                         | ⚠️ BR-ACT-01 uses "ideally" (ambiguous)                 | MR-01, CBR-03                         |
| ADR-007 | Stakeholder-Centric NPS                   | ✅ Stakeholder entity defined                                             | ✅ BR-ACC-01 enforces it                                | None                                  |
| ADR-008 | Period-Based Event Tracking               | ❌ `demo_start_date` / `demo_end_date` absent from Opportunity attributes | —                                                      | No BR coverage either                 |
| ADR-009 | SBU RLS                                   | ⚠️ SBU entity absent from Logical Model                                   | —                                                      | ME-02                                 |
| ADR-010 | Mobile-First UX                           | — (UX-only decision)                                                     | —                                                      | N/A                                   |
| ADR-011 | Unified Timelines                         | — (UX-only decision)                                                     | —                                                      | N/A                                   |
| ADR-012 | React / FastAPI / Supabase                | — (Infrastructure decision)                                              | —                                                      | MA-06                                 |
| ADR-013 | Target → Coverage → Opportunity → Revenue | ⚠️ No `target_plan_id` FK on Coverage Plan                                | ✅ BR-PL-03 requires it                                 | MFK-02                                |
| ADR-014 | Account → Project → Opportunity Model     | ⚠️ Partially covered; Project → User (owner) missing                      | ⚠️ No BR enforces Project-level rules beyond BR-PROJ-01 | MR-02, CBR-02                         |
| ADR-015 | Opportunity at Any Stage                  | ✅ Referenced in EDM conflicts section                                    | ✅ BR-OP-00 defined                                     | ⚠️ Tension with BR-FIN-03 — see CBR-01 |
| ADR-016 | Product Category = SBU                    | ❌ Product → SBU FK absent from Logical Model                             | —                                                      | ME-02                                 |
| ADR-017 | Audit Logging via Triggers                | ✅ Audit requirements in EDM Section 9                                    | ✅ BR-AUD-01 defined                                    | None                                  |

---

*This review was generated on June 19, 2026 as a pre-PDM gate artifact. No source documents were modified. All findings require architect review and disposition before Physical Data Model generation proceeds.*
