# Proposed Change Summary — Architecture Consistency Review Implementation (Revised)

**Source:** Architecture-Consistency-Review-Disposition.md  
**Target Artifacts:** ADR.md, Business-Rules.md, Enterprise-Data-Model.md  
**Status:** AWAITING APPROVAL  

---

## Corrected Item Count

The disposition document contains **three separate tables** totalling **32 items**:

| Table                                                | Items       | Count  |
| ---------------------------------------------------- | ----------- | ------ |
| Main Findings (ME, MFK, MR, CBR, MA series)          | Lines 10–33 | 24     |
| Additional Architecture Decisions (ADD-01 to ADD-07) | Lines 43–49 | 7      |
| Pending Architecture Decision (ARCH-001)             | Lines 56–57 | 1      |
| **Total**                                            |             | **32** |

| Disposition                         | Count  | Items                                                                                                              |
| ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| **ACCEPT**                          | 16     | ME-01, ME-02, MFK-01, MFK-02, MFK-05, MR-01, MR-02, MR-03, MR-04, MR-05, CBR-04, MA-01, MA-02, MA-04, MA-06, MA-07 |
| **ACCEPT WITH MODIFICATION**        | 6      | MFK-04, MFK-06, CBR-01, CBR-02, CBR-03, MA-05                                                                      |
| **APPROVED** (Additional Decisions) | 7      | ADD-01, ADD-02, ADD-03, ADD-04, ADD-05, ADD-06, ADD-07                                                             |
| **REJECT**                          | 1      | MFK-03                                                                                                             |
| **PENDING CUSTOMER DECISION**       | 2      | MA-03, ARCH-001                                                                                                    |
| **Total to implement**              | **29** |                                                                                                                    |
| **Total excluded**                  | **3**  |                                                                                                                    |

> [!NOTE]
> Several ADD items reinforce and formalize decisions already captured in the main findings. They are listed separately but implemented together: ADD-01/02 with MFK-04, ADD-03 with MR-04, ADD-04 with MFK-06, ADD-05 with MR-02, ADD-06 with CBR-03, ADD-07 with MA-05.

---

## Items NOT Being Implemented

| ID       | Decision                  | Reason                                                                                                  |
| -------- | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| MFK-03   | REJECT                    | Coverage Plan FK on Opportunity is replaced by the Lead Source model. No direct FK required in Phase 1. |
| MA-03    | PENDING CUSTOMER DECISION | Opportunity Stage vs Status model — awaiting customer decision.                                         |
| ARCH-001 | PENDING CUSTOMER DECISION | Opportunity Stage vs Status Model (Closed Won / Closed Lost handling) — same pending decision as MA-03. |

---

## All 29 Items Being Implemented

### Group 1: Entity Additions (ME-01, ME-02)

| ID    | Finding             | Decision | Change                                                                                                                           |
| ----- | ------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| ME-01 | Zone Entity Missing | ACCEPT   | Add Zone as a formal entity. User → Zone (M:1). Used for reporting, security, and org structure. Not used for target allocation. |
| ME-02 | SBU Entity Missing  | ACCEPT   | Add SBU as a formal entity. Required for Product ownership, Target Planning, reporting, and security model.                      |

### Group 2: Missing Foreign Keys (MFK-01, MFK-02, MFK-04, MFK-05, MFK-06)

| ID     | Finding                                               | Decision                 | Change                                                                                                                                        |
| ------ | ----------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| MFK-01 | Target Plan Missing SBU FK and Planning Period        | ACCEPT                   | Add `sbu_id` FK and `planning_period` (YYYY-Qn) attribute to Target Plan.                                                                     |
| MFK-02 | Coverage Plan Missing Target Plan FK                  | ACCEPT                   | Add `target_plan_id` FK to Coverage Plan. Supports Target → Coverage → Opportunity chain.                                                     |
| MFK-04 | Opportunity Missing Lead Source                       | ACCEPT WITH MODIFICATION | Introduce LeadSource master entity. Add `lead_source_id` FK to Opportunity. Coverage Plan becomes one Lead Source value (see ADD-01, ADD-02). |
| MFK-05 | Opportunity Missing Hold Reason and Reactivation Date | ACCEPT                   | Add `hold_reason` and `reactivation_date` attributes to Opportunity entity in EDM. (Already in Business Rules — EDM confirmation required.)   |
| MFK-06 | Reminder Missing Context Relationships                | ACCEPT WITH MODIFICATION | Add `activity_id` FK and `assigned_to_user_id` FK to Reminder. Remove polymorphic reminder relationships. (See ADD-04.)                       |

### Group 3: Missing Relationships (MR-01 to MR-05)

| ID    | Finding                                      | Decision | Change                                                                                                    |
| ----- | -------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| MR-01 | Activity Missing Account Relationship        | ACCEPT   | Add `account_id` FK to Activity.                                                                          |
| MR-02 | Project Missing Owner Relationship           | ACCEPT   | Add `owner_id` FK → User on Project. Default owner is creator. Ownership can be reassigned. (See ADD-05.) |
| MR-03 | Activity Missing Project Relationship        | ACCEPT   | Add nullable `project_id` FK to Activity. Supports project activities before opportunities exist.         |
| MR-04 | Stakeholder Missing Opportunity Relationship | ACCEPT   | Add `OpportunityStakeholder` junction entity. (See ADD-03.)                                               |
| MR-05 | Installed Asset Missing from ER Matrix       | ACCEPT   | Documentation correction only — add Installed Asset rows to ER Summary Matrix.                            |

### Group 4: Business Rule Conflicts (CBR-01 to CBR-04)

| ID     | Finding                                    | Decision                 | Change                                                                                                                                       |
| ------ | ------------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| CBR-01 | Opportunity Value Calculated vs Manual     | ACCEPT WITH MODIFICATION | Add `indicative_value` to Opportunity. When no Items exist, `indicative_value` is used. When Items exist, calculated value is authoritative. |
| CBR-02 | Opportunity Project Relationship Ambiguity | ACCEPT WITH MODIFICATION | Confirm `project_id` is nullable on Opportunity. Update Business Rules to explicitly state Opportunities may exist without Projects.         |
| CBR-03 | Activity Context Ambiguity                 | ACCEPT WITH MODIFICATION | Activity must belong to at least one of: Account, Project, or Opportunity. Update BR-ACT-01 and add BR-ACT-03. (See ADD-06.)                 |
| CBR-04 | Closed Lost Competitor Rule Conflict       | ACCEPT                   | Competitor information required **only** when `loss_reason = COMPETITOR_WON`. Update BR-OP-03.                                               |

### Group 5: Missing Assumptions (MA-01, MA-02, MA-04, MA-05, MA-06, MA-07)

| ID    | Finding                                              | Decision                 | Change                                                                                                                                                    |
| ----- | ---------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MA-01 | Planning Period Format Undefined                     | ACCEPT                   | Standardize as YYYY-Qn (e.g., 2026-Q1). Add ADR entry. Update Target Plan and Coverage Plan attribute notes.                                              |
| MA-02 | Fiscal Year Definition Missing                       | ACCEPT                   | Indian Fiscal Year (April–March). Add ADR entry.                                                                                                          |
| MA-04 | Installed Asset Competitor Equipment Model Undefined | ACCEPT                   | Make `product_id` nullable on Installed Asset. Add `is_competitor_equipment` (Boolean) and `competitor_product_name` (Text).                              |
| MA-05 | Document Storage Architecture Undefined              | ACCEPT WITH MODIFICATION | Files stored in Supabase Storage. Document entity stores metadata only. Supports Account, Project, Opportunity, and Product. Add ADR entry. (See ADD-07.) |
| MA-06 | Authentication Strategy Undefined                    | ACCEPT                   | Use Supabase `auth.users` + `public.user_profiles` extension table. Add ADR entry.                                                                        |
| MA-07 | Opportunity Split Default Behavior Undefined         | ACCEPT                   | Auto-create 100% split for creator when no explicit split entered. Add ADR entry. Update Business Rules.                                                  |

### Group 6: Additional Architecture Decisions (ADD-01 to ADD-07)

| ID     | Decision                                | Status   | Implemented Via                                                                                            |
| ------ | --------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| ADD-01 | Lead Source Master Entity               | APPROVED | Implemented together with MFK-04. LeadSource entity: `lead_source_id`, `name`, `description`, `is_active`. |
| ADD-02 | Coverage Plan as Lead Source            | APPROVED | Implemented together with MFK-04. COVERAGE_PLAN added as a valid Lead Source value.                        |
| ADD-03 | Opportunity Stakeholder Junction Entity | APPROVED | Implemented together with MR-04. OpportunityStakeholder entity added.                                      |
| ADD-04 | Reminder Linked to Activity             | APPROVED | Implemented together with MFK-06. Reminder context inherited through `activity_id` FK.                     |
| ADD-05 | Project Ownership Model                 | APPROVED | Implemented together with MR-02. `owner_id` FK on Project → User.                                          |
| ADD-06 | Activity Context Rule                   | APPROVED | Implemented together with CBR-03. Activity must belong to Account, Project, Opportunity, or a combination. |
| ADD-07 | Document Storage Architecture           | APPROVED | Implemented together with MA-05. Supabase Storage for files; Document entity for metadata.                 |

---

## Per-Document Change Plan

---

### ADR.md — New ADR Entries (13 new entries)

| New ADR | Topic                                                                 | Source Items           |
| ------- | --------------------------------------------------------------------- | ---------------------- |
| ADR-018 | Zone Entity and User → Zone Assignment                                | ME-01                  |
| ADR-019 | SBU as a Formal Entity                                                | ME-02                  |
| ADR-020 | Planning Period Format (YYYY-Qn) and Indian Fiscal Year (April–March) | MA-01, MA-02           |
| ADR-021 | LeadSource Master Entity and Coverage Plan as Lead Source             | MFK-04, ADD-01, ADD-02 |
| ADR-022 | OpportunityStakeholder Junction Entity                                | MR-04, ADD-03          |
| ADR-023 | Project Ownership Model                                               | MR-02, ADD-05          |
| ADR-024 | Reminder Linked to Activity (No Polymorphic Relationships)            | MFK-06, ADD-04         |
| ADR-025 | Authentication Strategy (Supabase auth.users + user_profiles)         | MA-06                  |
| ADR-026 | Document Storage Architecture (Supabase Storage + Metadata Entity)    | MA-05, ADD-07          |
| ADR-027 | Opportunity Split Default (100% to Creator)                           | MA-07                  |
| ADR-028 | Activity Context Rule (at least one of Account, Project, Opportunity) | CBR-03, ADD-06         |
| ADR-029 | Opportunity Value Dual-Mode (indicative_value vs. calculated value)   | CBR-01                 |
| ADR-030 | Installed Asset Competitor Equipment Model                            | MA-04                  |

---

### Business-Rules.md — Rules to Update or Add

| Rule                     | Action                                                                                                             | Source Items   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | -------------- |
| BR-PL-01                 | Update: add reference to `planning_period` format YYYY-Qn                                                          | MA-01          |
| BR-PL-04                 | Update: replace Coverage Plan Entry FK reference with Lead Source = COVERAGE_PLAN                                  | MFK-04, ADD-02 |
| BR-OP-02                 | Confirm: `hold_reason` and `reactivation_date` already covered — no change needed                                  | MFK-05         |
| BR-OP-03                 | Update: competitor info required **only** when `loss_reason = COMPETITOR_WON`                                      | CBR-04         |
| BR-OP-04 (new)           | Add: Opportunities may exist with or without a Project. `project_id` is optional.                                  | CBR-02         |
| BR-FIN-03                | Update: `indicative_value` used when no Opportunity Items exist; calculated value authoritative when items exist   | CBR-01         |
| BR-FIN-05 (new)          | Add: When no split is explicitly entered, the system auto-creates a 100% split assigned to the opportunity creator | MA-07          |
| BR-ACT-01                | Update: Activity must belong to at least one of: Account, Project, or Opportunity                                  | CBR-03, ADD-06 |
| BR-ACT-03 (new)          | Add: Activity Context Constraint — at least one of `account_id`, `project_id`, `opportunity_id` must be non-null   | CBR-03, ADD-06 |
| Appendix A — Lead Source | Update: add COVERAGE_PLAN value; add note that values are managed in the LeadSource master entity                  | ADD-02         |

---

### Enterprise-Data-Model.md — Entity and Relationship Changes

#### Section 4 — Conceptual Data Model (add/update rows)

| Action | Details                                                                            | Source         |
| ------ | ---------------------------------------------------------------------------------- | -------------- |
| Add    | **Zone** — Geographic/organisational zone used for reporting and security          | ME-01          |
| Add    | **LeadSource** — Master list of opportunity origination channels                   | MFK-04, ADD-01 |
| Add    | **OpportunityStakeholder** — Junction entity linking Opportunities to Stakeholders | MR-04, ADD-03  |
| Update | **User** row — Add "Zone" to assignments                                           | ME-01          |

#### Section 5 — Logical Data Model (add/update entities)

| Entity                     | Change                                                                                                                                                                  | Source                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Zone**                   | Add new entity. Attributes: `zone_id`, `name`, `description`. Relationship: User (1:M).                                                                                 | ME-01                          |
| **SBU**                    | Add/expand entity. Attributes: `sbu_id`, `name`, `description`. Relationships: Product (1:M), Target Plan (1:M).                                                        | ME-02                          |
| **LeadSource**             | Add new entity. Attributes: `lead_source_id`, `name`, `description`, `is_active`.                                                                                       | MFK-04, ADD-01                 |
| **Target Plan**            | Add `sbu_id` FK (→ SBU), `planning_period` (YYYY-Qn format)                                                                                                             | MFK-01                         |
| **Coverage Plan**          | Add `target_plan_id` FK (→ Target Plan)                                                                                                                                 | MFK-02                         |
| **Project**                | Add `owner_id` FK (→ User). Default owner = creator.                                                                                                                    | MR-02, ADD-05                  |
| **Opportunity**            | Add `lead_source_id` FK (→ LeadSource), `indicative_value` (Numeric 15,2). Confirm `project_id` is nullable. Confirm `hold_reason` and `reactivation_date` are present. | MFK-04, MFK-05, CBR-01, CBR-02 |
| **Activity**               | Add `account_id` FK (→ Account), nullable `project_id` FK (→ Project)                                                                                                   | MR-01, MR-03                   |
| **Reminder**               | Replace any polymorphic relationships with `activity_id` FK (→ Activity) and `assigned_to_user_id` FK (→ User)                                                          | MFK-06, ADD-04                 |
| **OpportunityStakeholder** | Add new junction entity. Attributes: `opportunity_id` FK, `stakeholder_id` FK, `influence_role`, `notes`                                                                | MR-04, ADD-03                  |
| **Installed Asset**        | Make `product_id` nullable. Add `is_competitor_equipment` (Boolean), `competitor_product_name` (Text)                                                                   | MA-04                          |
| **Document**               | Confirm metadata-only model with `storage_path` referencing Supabase Storage. Confirm links to Account, Project, Opportunity, Product.                                  | MA-05, ADD-07                  |

#### Section 6 — ER Summary Matrix (add rows)

| New Row                     | Relationship                     | Logic                                                           | Source         |
| --------------------------- | -------------------------------- | --------------------------------------------------------------- | -------------- |
| User → Zone                 | M:1                              | A User belongs to one Zone                                      | ME-01          |
| Zone → User                 | 1:M                              | A Zone has many Users                                           | ME-01          |
| SBU → Product               | 1:M                              | Products belong to one SBU                                      | ME-02          |
| SBU → Target Plan           | 1:M                              | Target Plans scoped to an SBU                                   | MFK-01         |
| Target Plan → Coverage Plan | 1:M                              | Coverage Plans trace back to a Target Plan                      | MFK-02         |
| Activity → Account          | M:1                              | Activities are linked to an Account                             | MR-01          |
| Activity → Project          | M:1 (nullable)                   | Activities can optionally belong to a Project                   | MR-03          |
| Opportunity ↔ Stakeholder   | M:M (via OpportunityStakeholder) | Stakeholders mapped to Opportunities                            | MR-04, ADD-03  |
| Reminder → Activity         | M:1                              | Reminders derive context from their parent Activity             | MFK-06, ADD-04 |
| Installed Asset → Account   | M:1                              | An Account has many Installed Assets (documentation correction) | MR-05          |

#### Section 7 — Master Data vs Transaction Data (add entries)

| Table       | Add                      |
| ----------- | ------------------------ |
| Master Data | **Zone**, **LeadSource** |

#### Section 8 — Security Classification (add row)

| Entity | Scoping Logic            | Visibility Level             |
| ------ | ------------------------ | ---------------------------- |
| Zone   | Organisational Reference | Global (Read) / Admin (Edit) |

---

> [!IMPORTANT]
> This is the revised proposed change summary. **Please review and approve before any document modifications are made.**

> [!CAUTION]
> MA-03 / ARCH-001 (Opportunity Stage vs Status Model) and MFK-03 (Coverage Plan FK) are explicitly excluded per the Disposition Matrix. No changes related to these items will be made.
