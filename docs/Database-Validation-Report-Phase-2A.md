# Database Validation Report

## Project Information
Project Name: Cabio Sales OS
Environment: Supabase
Region: ap-south-1
PostgreSQL Version: PostgreSQL 17.6
Validation Date: 23-Jun-2026
Validated By: Basheer Kalanchera

---

## Deployment Summary
| Item                           | Result |
| ------------------------------ | ------ |
| Physical-Schema.sql Deployment | PASS   |
| Seed-Data.sql Deployment       | PASS   |
| SQL Errors Encountered         | NO     |

---

## Object Validation
| Object Type  | Expected               | Actual                 | Result |
| ------------ | ---------------------- | ---------------------- | ------ |
| Tables       | 25                     | 25                     | PASS   |
| Foreign Keys | 72                     | 72                     | PASS   |
| Constraints  | Generated Successfully | Generated Successfully | PASS   |
| Indexes      | 60                     | 60                     | PASS   |
| Views        | 1                      | 1                      | PASS   |

---

## Seed Data Validation
### OpportunityStage: PASS
Validated Records: 7
* LEAD, QUALIFIED, DEMO, CLINICAL_EVALUATION, NEGOTIATION, ORDER, DELIVERY_INSTALLATION

### OpportunityStatus: PASS
Validated Records: 5
* ACTIVE, ON_HOLD, STALLED, WON, LOST

### ProjectStatus: PASS
Validated Records: 6
* DRAFT, ACTIVE, BID_SUBMITTED, AWARDED, LOST, CLOSED

### LeadSource: PASS
Validated Records: 9
* COVERAGE_PLAN, REFERRAL, EXISTING_CUSTOMER, TENDER, OEM_REFERRAL, WEBSITE, COLD_CALL, WALK_IN, OTHER

### HoldReason: PASS
Validated Records: 7
* CUSTOMER_DELAY, BUDGET_PENDING, PROCUREMENT_DELAY, REGULATORY_APPROVAL_PENDING, COMPETITOR_EVALUATION, INTERNAL_RESOURCE_CONSTRAINT, OTHER

### LossReason: PASS
Validated Records: 8
* PRICE, COMPETITOR_WON, BUDGET_CANCELLED, REQUIREMENT_CHANGED, TECHNICAL_MISMATCH, TIMING_DELAY, NO_DECISION, OTHER

---

## ADR-026 Validation
View: `vw_opportunities_with_value`
Result: PASS
Notes:
* View created successfully during schema deployment.
* View visible in information_schema.views.
* View visible in Supabase Schema Visualizer.
* View count validation returned 1 view in public schema.

---

## Supabase Compatibility Validation
| Validation Item          | Result |
| ------------------------ | ------ |
| PostgreSQL Compatibility | PASS   |
| Table Creation           | PASS   |
| Constraint Creation      | PASS   |
| Foreign Key Creation     | PASS   |
| Index Creation           | PASS   |
| View Creation            | PASS   |
| Seed Data Load           | PASS   |

---

## Overall Assessment
Database Foundation Status: READY FOR PHASE 2B
All schema objects deployed successfully. All seed data loaded successfully. Referential integrity validated through 72 foreign key relationships. Master data validation completed. Database is approved for backend development activities.

---

## Issues Identified
No blocking issues identified.
Observations:
1. Opportunity Status includes STALLED status, which is an approved enhancement beyond the original baseline status set.
2. Seed data and deployed database are internally consistent.
3. Additional business roles may be introduced in future releases without schema modification due to role-based reference architecture.

---

## Sign-Off
Validated By: Basheer Kalanchera
Date: 23-Jun-2026
