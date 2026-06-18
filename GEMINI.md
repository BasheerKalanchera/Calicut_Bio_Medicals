# Cabio Sales OS

## Product Vision

Cabio Sales OS is a Sales Operating System for a medical equipment distributor.

This is NOT a traditional CRM.

The primary objective is to help salespeople achieve quota and revenue targets.

The system should help salespeople answer:

"Will this help me achieve my target?"

rather than:

"Did I log my activity?"

---

## Core Sales Operating Model

Traditional CRM:

Activities
↓
Reports

Cabio Sales OS:

Target Planning
↓
Coverage Planning
↓
Opportunity Planning
↓
Revenue Achievement

Activities support Opportunities.

Opportunities support Revenue.

Revenue supports Target Achievement.

When generating designs, always prioritize quota achievement over activity tracking.

---

## Organization Structure

Current Strategic Business Units (SBUs):

* Imaging
* Critical Care

Target allocation hierarchy:

Corporate
↓
SBU
↓
Salesperson

Zones are used for:

* Reporting
* Coverage Analysis
* Performance Insights

Zones are NOT currently used for target allocation.

Avoid introducing additional planning levels unless explicitly required.

---

## Coverage Planning

Coverage Planning is strategic account coverage planning.

Coverage Planning answers:

"Which accounts should receive what level of coverage this quarter?"

Coverage Planning is NOT:

* Visit Planning
* Call Scheduling
* Daily Activity Planning

Coverage Planning should directly support:

Target
↓
Coverage
↓
Pipeline
↓
Revenue

---

## Core Business Entities

Primary Entities:

* Account
* Stakeholder
* Project
* Opportunity
* Product
* Target Plan
* Coverage Plan
* Activity

Supporting Entities:

* User
* Role
* SBU
* Zone
* Installed Asset
* Reminder

When generating designs, prefer extending existing entities before creating new entities.

---

## Account Management

Accounts represent organizations.

Examples:

* Hospital
* Clinic
* Diagnostic Center
* Government Agency

Accounts may support parent-child hierarchies.

Examples:

Corporate Hospital Group
↓
Individual Hospitals

---

## Stakeholder Management

Stakeholders are more important than account-level relationships.

Relationships exist with people, not organizations.

NPS belongs to Stakeholders, not Accounts.

Examples:

Dr Ahmed
→ Promoter

Purchase Manager
→ Neutral

Biomedical Engineer
→ Detractor

Stakeholders should support:

* Influence Level
* Decision Role
* Relationship Health
* NPS

---

## Project Philosophy

Projects are strategic initiatives.

Examples:

* Hospital Expansion
* ICU Upgrade
* Tender Program
* Equipment Modernization

Relationship:

Account
↓
Project
↓
Multiple Opportunities

Projects should be used as the primary grouping mechanism.

---

## Government Tender Modeling

Government tenders should be modeled using existing entities.

Preferred structure:

Government Agency Account
↓
Tender Project
↓
Hospital Opportunities

Examples:

KMSCL
↓
Patient Monitor Tender
↓
Apollo Opportunity
↓
Aster Opportunity
↓
MIMS Opportunity

Avoid creating a separate Tender entity unless there is a strong business requirement.

---

## Opportunity Management

Opportunities represent revenue-generating deals.

An Opportunity may be created at any stage.

Examples:

Lead
Qualified
Demo
Negotiation
Order

OR

Requirement
↓
Direct PO

Do not assume every opportunity starts as a Lead.

Salespeople may override win probability based on field intelligence.

The system should support both structured sales cycles and direct-order scenarios.

---

## Product Management

Products belong to exactly one SBU.

Examples:

SonoScape
Magnamed

Current structure:

Product
↓
SBU

For Phase 1:

Product Category = SBU

Avoid introducing a separate Product Category hierarchy.

---

## Installed Base

Installed Assets should support:

* Equipment
* Installation Date
* Department
* Customer

Examples:

Radiology
ICU
OT
NICU

Department information is important for sales planning and account intelligence.

---

## Target Planning

Target Planning is one of the most important modules.

Hierarchy:

Corporate
↓
SBU
↓
Salesperson

Target Planning should eventually drive:

Coverage Planning
↓
Opportunity Planning
↓
Revenue Achievement

When generating future designs, maintain this linkage.

---

## Future Sales OS Vision

The desired operating model is:

Target
↓
Pipeline
↓
Coverage
↓
Opportunities
↓
Activities
↓
Revenue

Salespeople care about:

* Quota Achievement
* Pipeline Coverage
* Revenue Generation

Management cares about:

* Forecast Accuracy
* Target Achievement
* Business Growth

The system should support both perspectives.

---

## Design Principles

Always:

* Prefer simplicity
* Reuse existing entities
* Avoid over-engineering
* Future-proof where practical
* Explicitly document assumptions
* Explicitly identify future extension points
* Separate Phase 1 requirements from future requirements

Avoid:

* Creating new entities when existing entities can solve the problem
* Designing for hypothetical future requirements
* Introducing unnecessary complexity

---

## Architecture Generation Instructions

When generating:

* Enterprise Data Models
* ERDs
* Physical Schemas
* API Catalogs
* Business Rule Catalogs
* SDD Documents

Always:

1. Explain assumptions.
2. Explain rationale.
3. Identify future extension points.
4. Highlight unresolved questions.
5. Prefer Phase 1 simplicity over enterprise complexity.
6. Align designs with the Sales OS philosophy.

If a generated design conflicts with this document, explain the conflict and propose alternatives.

## Architecture Review Instructions

When reviewing any existing artifact:

- Do not automatically modify documents.
- First identify conflicts, risks, assumptions, and improvement opportunities.
- Classify every recommendation as:

  - Accept
  - Reject
  - Needs Discussion

- Provide rationale for every recommendation.
- Highlight tradeoffs where applicable.
- Wait for approval before proposing document updates.

When uncertain:

- Explain the uncertainty.
- Present alternative options.
- Recommend a preferred option with rationale.

Do not introduce new entities, attributes, workflows, or business concepts unless:

1. They are explicitly required by project documents, OR
2. A gap has been identified and justified.

When proposing new entities or attributes:

- Explain why existing entities cannot solve the problem.
- Identify whether the proposal is:
  - Phase 1 Requirement
  - Future Enhancement
  - Architectural Option

## Change Control

When reviewing existing artifacts:

- Never modify files automatically.
- Never update documents automatically.
- Never apply schema changes automatically.

Instead:

1. Identify issues.
2. Propose recommendations.
3. Classify each recommendation as:
   - Accept
   - Reject
   - Needs Discussion
4. Provide rationale.
5. Wait for approval before generating revised versions.

Assume a human architect owns final design decisions.
