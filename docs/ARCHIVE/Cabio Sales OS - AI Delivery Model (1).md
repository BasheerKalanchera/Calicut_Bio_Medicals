# **AI Delivery Model v5.0 (Production Version)**

## **Purpose**

Deliver Cabio Sales OS Phase 1 using:

* Antigravity 2.0  
* Claude Code  
* React  
* FastAPI  
* PostgreSQL / Supabase

while maintaining:

* Architectural consistency  
* Business alignment  
* High delivery velocity  
* Low rework

---

# **1\. Delivery Philosophy**

The project shall be delivered using an AI-Augmented Delivery Team model.

Roles are split as follows:

You:

* Product Owner  
* Delivery Manager  
* Final Decision Maker

Antigravity:

* Business Analysis  
* Architecture Review  
* Data Architecture  
* QA Review  
* Governance

Claude Code:

* Implementation  
* Refactoring  
* Documentation  
* Unit Testing

Principle:

Antigravity reviews.

Claude Code implements.

You approve.

---

# **2\. Source of Truth Hierarchy**

The following artifacts define the system.

Priority Order:

1. Approved Design Decisions  
2. Approved Business Rules  
3. Approved ERD  
4. Approved RLS Strategy  
5. Approved API Catalog  
6. Approved SDD  
7. Approved Development Standards  
8. Approved PRD  
9. Approved Prototype

No implementation may violate higher-priority artifacts.

---

# **3\. Technology Stack**

Frontend

* React 19  
* TypeScript  
* Vite  
* Material UI

Backend

* Python 3.13  
* FastAPI

Database

* PostgreSQL  
* Supabase

Authentication

* Supabase Auth

Storage

* Supabase Storage

Hosting

* Vercel  
* Supabase

---

# **4\. Architecture Principles**

Architecture Style

* Modular Monolith

Security Strategy

* RLS First

Preferred Solution Order

1. PostgreSQL Constraints  
2. PostgreSQL Views  
3. Materialized Views  
4. RLS Policies  
5. FastAPI Services

Avoid

* Microservices  
* CQRS  
* Event Sourcing  
* Kafka  
* Redis  
* GraphQL

Optimize For

* Simplicity  
* Maintainability  
* Fast Delivery

---

# **5\. Repository Structure**

Cabio-Sales-OS

/docs

PRD.md

Design-Decisions.md  
Business-Rules.md

ERD.md  
Physical-Schema.md

RLS-Strategy.md  
Reporting-Strategy.md

API-Catalog.md

SDD.md

Development-Standards.md

Traceability-Matrix.md

UAT-Scenarios.md

/prototype

React-Screens

/reviews

/frontend

/backend

/agents

/tasks

AGENTS.md

---

# **6\. Antigravity Agent Setup**

## **PM Agent**

Purpose

Scope Governance

Responsibilities

* Scope control  
* Milestone alignment  
* Dashboard validation  
* Report validation

Question

Is this required for Phase 1?

Outputs

* Scope Review  
* Traceability Matrix  
* Phase 2 Backlog

---

## **BA Agent**

Purpose

Business Completeness

Responsibilities

* Business Rules  
* Workflow Review  
* Validation Rules  
* User Adoption Review

Question

Can a salesperson perform daily work using this workflow?

Outputs

* Business-Rules.md  
* Open-Questions.md

---

## **Solution Architect Agent**

Purpose

Application Architecture

Responsibilities

* FastAPI Architecture  
* React Architecture  
* API Design  
* Security Design

Question

Can this system be maintained three years from now?

Outputs

* SDD.md  
* API-Catalog.md  
* Architecture Review

---

## **Data Architect Agent**

Purpose

Database Architecture

Responsibilities

* ERD  
* Physical Schema  
* RLS Design  
* Reporting Design  
* Index Strategy

Question

Can PostgreSQL solve this better than Python?

Outputs

* ERD.md  
* Physical-Schema.md  
* RLS-Strategy.md  
* Reporting-Strategy.md

---

## **QA Agent**

Purpose

Protect Week 7 UAT

Responsibilities

* UAT Scenarios  
* Test Cases  
* Edge Cases  
* Negative Tests

Output Format

Given  
When  
Then  
Expected Result  
Priority

Outputs

* UAT-Scenarios.md

---

## **UX Audit Agent (Temporary)**

Used During Week 1 Only

Purpose

Reverse Engineer Prototype

Responsibilities

* Screen Inventory  
* Navigation Inventory  
* Form Inventory  
* Data Structure Extraction

Outputs

* UI-Inventory.md  
* Prototype-Data-Model.md  
* Traceability-Matrix.md

Retire After Week 1\.

---

# **7\. Challenge Layer**

## **/grill-me**

Purpose

Challenge assumptions.

Used:

* Before Business Rules Freeze  
* Before ERD Freeze  
* Before API Freeze  
* Before UAT

Questions

* Why will this fail?  
* Why will users avoid it?  
* What is missing?  
* What breaks during UAT?  
* What breaks after Go Live?

---

# **8\. Claude Code Setup**

Role

FastAPI Tech Lead

Responsibilities

* SQLAlchemy Models  
* Pydantic Schemas  
* FastAPI APIs  
* React Components  
* Unit Tests  
* Documentation  
* Refactoring

Must Read Before Coding

* Business Rules  
* Design Decisions  
* ERD  
* RLS Strategy  
* API Catalog  
* Development Standards

Must Not

* Invent Business Rules  
* Invent Requirements  
* Change Architecture

---

# **9\. Phase 0A \- Prototype Completion**

Current State

Prototype \= 95%

Objective

Prototype \= 100% Functional Coverage

Activities

PM Agent

Compare PRD and Prototype

Generate:

* Missing Screens  
* Missing Reports  
* Missing Dashboards

BA Agent

Compare PRD and Prototype

Generate:

* Missing Fields  
* Missing Validations  
* Missing Workflows

Output

Prototype Gap Analysis

You update prototype.

Deliverable

Prototype v1.0

Freeze Prototype v1.0

---

# **10\. Phase 0B \- Reverse Ingestion Sprint**

Run After Prototype Freeze

UX Audit Agent

Generate:

* UI Inventory  
* Navigation Map  
* Form Inventory  
* Prototype Data Model

Architect Agent

Generate:

* Traceability Matrix

Mapping:

Requirement  
→ Screen  
→ API  
→ Database

Freeze Outputs

---

# **11\. Foundation Week**

Day 1

Generate

* Business Rules Register  
* Design Decisions Register

Run

* BA Review  
* Architect Review  
* QA Review  
* Grill Review

Freeze

---

Day 2

Generate

* ERD  
* Physical Schema

Run

* Data Architect Review  
* QA Review  
* Grill Review

Freeze

---

Day 3

Generate

* RLS Strategy  
* Reporting Strategy  
* View Strategy

Freeze

---

Day 4

Generate

* API Catalog  
* Security Design

Freeze

---

Day 5

Generate

* SDD  
* Development Standards

Freeze

---

# **12\. Code Generation Flow**

Never

PRD → Code

Always

PRD  
\+  
Prototype

↓

Business Rules

↓

Design Decisions

↓

ERD

↓

RLS Strategy

↓

API Catalog

↓

SDD

↓

Development Standards

↓

Claude Code

---

# **13\. Code Review Strategy**

Tier 1

Simple CRUD

Examples

* Customer  
* Product  
* Stakeholder

Review

Claude Code  
→ QA  
→ You

---

Tier 2

Business Logic

Examples

* Opportunity Workflow  
* Revenue Attribution  
* Beat Planning

Review

Claude Code  
→ Architect  
→ QA  
→ You

---

Tier 3

Security

Examples

* RLS  
* Ownership  
* Visibility

Review

Claude Code  
→ Data Architect  
→ Architect  
→ QA  
→ You

---

# **14\. Documentation Strategy**

Every implementation task must generate:

1. Code  
2. Unit Tests  
3. Technical Documentation  
4. README Updates

Module Documentation Template

* Purpose  
* Business Rules Implemented  
* APIs Exposed  
* Tables Used  
* Security Rules  
* Dependencies

Documentation is mandatory.

Never assume Claude Code will create it automatically.

---

# **15\. Week 1 Success Criteria**

By end of Week 1 the following artifacts are approved:

* Prototype v1.0  
* Traceability Matrix  
* Business Rules Register  
* Design Decisions Register  
* ERD  
* Physical Schema  
* RLS Strategy  
* Reporting Strategy  
* API Catalog  
* SDD  
* Development Standards

Only after these are approved does production code generation begin.

---

# **Final Rule**

Every major artifact follows:

Draft  
→ Review  
→ Grill  
→ Approve  
→ Freeze

Only frozen artifacts may be used for implementation.

