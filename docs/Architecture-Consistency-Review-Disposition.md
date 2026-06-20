# Architecture Consistency Review – Disposition Matrix

**Status:** Approved (Except Pending Items)
**Purpose:** Architect-approved disposition of findings from Architecture-Consistency-Review.md. This document is the authoritative source for determining which findings should be implemented in ADR.md, Business-Rules.md, Enterprise-Data-Model.md, and related artifacts.

---

| ID     | Category               | Finding                                               | Decision                  | Implementation Notes                                                                                                                  |
| ------ | ---------------------- | ----------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| ME-01  | Missing Entity         | Zone Entity Missing                                   | ACCEPT                    | Add Zone entity. User → Zone (M:1). Used for reporting, security, and organizational structure. Not used for target allocation.       |
| ME-02  | Missing Entity         | SBU Entity Missing                                    | ACCEPT                    | Add SBU entity. Required for Product ownership, Target Planning, reporting, and security model.                                       |
| MFK-01 | Missing FK             | Target Plan Missing SBU FK and Planning Period        | ACCEPT                    | Add SBU FK and planning_period attribute to Target Plan.                                                                              |
| MFK-02 | Missing FK             | Coverage Plan Missing Target Plan FK                  | ACCEPT                    | Add target_plan_id FK. Supports Target → Coverage → Opportunity planning chain.                                                       |
| MFK-03 | Missing FK             | Opportunity Missing Coverage Plan Entry FK            | REJECT                    | Replace with Lead Source model. Coverage Plan will be represented as a Lead Source value. No direct FK required in Phase 1.           |
| MFK-04 | Missing FK             | Opportunity Missing Lead Source                       | ACCEPT WITH MODIFICATION  | Introduce LeadSource master entity. Add lead_source_id FK to Opportunity. Coverage Plan becomes one Lead Source value.                |
| MFK-05 | Missing FK             | Opportunity Missing Hold Reason and Reactivation Date | ACCEPT                    | Add hold_reason and reactivation_date attributes to Opportunity.                                                                      |
| MFK-06 | Missing FK             | Reminder Missing Context Relationships                | ACCEPT WITH MODIFICATION  | Reminder belongs to Activity. Add activity_id FK and assigned_to_user_id FK. Do not implement polymorphic reminder relationships.     |
| MR-01  | Missing Relationship   | Activity Missing Account Relationship                 | ACCEPT                    | Add account_id FK to Activity.                                                                                                        |
| MR-02  | Missing Relationship   | Project Missing Owner Relationship                    | ACCEPT                    | Add owner_id FK → User. Default owner is creator. Ownership can be reassigned.                                                        |
| MR-03  | Missing Relationship   | Activity Missing Project Relationship                 | ACCEPT                    | Add nullable project_id FK to Activity. Supports project activities before opportunities exist.                                       |
| MR-04  | Missing Relationship   | Stakeholder Missing Opportunity Relationship          | ACCEPT                    | Add OpportunityStakeholder junction entity. Required for stakeholder influence mapping and opportunity execution planning.            |
| MR-05  | Missing Relationship   | Installed Asset Missing from ER Matrix                | ACCEPT                    | Documentation correction only. Add Installed Asset to ER Summary Matrix.                                                              |
| CBR-01 | Business Rule Conflict | Opportunity Value Calculated vs Manual                | ACCEPT WITH MODIFICATION  | Support indicative_value for early stages. When Opportunity Items exist, calculated value becomes authoritative.                      |
| CBR-02 | Business Rule Conflict | Opportunity Project Relationship Ambiguity            | ACCEPT WITH MODIFICATION  | project_id remains optional. Opportunities may exist with or without Projects.                                                        |
| CBR-03 | Business Rule Conflict | Activity Context Ambiguity                            | ACCEPT WITH MODIFICATION  | Activity must belong to at least one of: Account, Project, or Opportunity.                                                            |
| CBR-04 | Business Rule Conflict | Closed Lost Competitor Rule Conflict                  | ACCEPT                    | Competitor information required only when loss_reason = COMPETITOR_WON.                                                               |
| MA-01  | Missing Assumption     | Planning Period Format Undefined                      | ACCEPT                    | Standardize format as YYYY-Qn (e.g., 2026-Q1, 2026-Q2, 2026-Q3, 2026-Q4).                                                             |
| MA-02  | Missing Assumption     | Fiscal Year Definition Missing                        | ACCEPT                    | Use Indian Fiscal Year (April–March).                                                                                                 |
| MA-03  | Missing Assumption     | Opportunity Stage Model Undefined                     | PENDING CUSTOMER DECISION | Await customer decision from Stage vs Status architecture discussion before updating EDM and Business Rules.                          |
| MA-04  | Missing Assumption     | Installed Asset Competitor Equipment Model Undefined  | ACCEPT                    | Allow product_id to be nullable. Add is_competitor_equipment (Boolean) and competitor_product_name (Text).                            |
| MA-05  | Missing Assumption     | Document Storage Architecture Undefined               | ACCEPT WITH MODIFICATION  | Files stored in Supabase Storage. Document entity stores metadata only. Support Account, Project, Opportunity, and Product documents. |
| MA-06  | Missing Assumption     | Authentication Strategy Undefined                     | ACCEPT                    | Use Supabase auth.users plus public user_profiles extension table.                                                                    |
| MA-07  | Missing Assumption     | Opportunity Split Default Behavior Undefined          | ACCEPT                    | Automatically create a 100% split for creator when no explicit split is entered.                                                      |

---

# Additional Architecture Decisions

The following decisions emerged during disposition review and are approved for implementation.

| ID     | Decision                                | Status   | Notes                                                                            |
| ------ | --------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| ADD-01 | Lead Source Master Entity               | APPROVED | Create LeadSource entity with lead_source_id, name, description, is_active.      |
| ADD-02 | Coverage Plan as Lead Source            | APPROVED | Coverage Plan becomes a valid Lead Source value.                                 |
| ADD-03 | Opportunity Stakeholder Junction Entity | APPROVED | Implement OpportunityStakeholder relationship entity.                            |
| ADD-04 | Reminder Linked to Activity             | APPROVED | Reminder context inherited through Activity relationship.                        |
| ADD-05 | Project Ownership Model                 | APPROVED | Projects must have an owner_id FK to User.                                       |
| ADD-06 | Activity Context Rule                   | APPROVED | Activity must belong to Account, Project, Opportunity, or a combination thereof. |
| ADD-07 | Document Storage Architecture           | APPROVED | Store files in Supabase Storage. Store metadata in Document entity.              |

---

# Pending Architecture Decision

| ID       | Topic                                                                 | Status                    |
| -------- | --------------------------------------------------------------------- | ------------------------- |
| ARCH-001 | Opportunity Stage vs Status Model (Closed Won / Closed Lost handling) | PENDING CUSTOMER DECISION |

---

# Implementation Instructions

When updating architecture artifacts:

1. Implement all findings marked **ACCEPT**.
2. Implement all findings marked **ACCEPT WITH MODIFICATION** according to the Implementation Notes.
3. Do not implement findings marked **REJECT**.
4. Do not implement findings marked **PENDING CUSTOMER DECISION**.
5. Update ADR.md, Business-Rules.md, Enterprise-Data-Model.md, ER Summary Matrix, and related artifacts to maintain consistency.
6. Produce a change summary before making modifications.
