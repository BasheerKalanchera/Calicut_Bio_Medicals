# Phase 2A Execution Plan

## Success Criteria

At the end of Phase 2A, you should have:

```text
Supabase Project
Physical-Schema.sql deployed
Seed-Data.sql deployed
Validation completed
Database Validation Report produced
```

Only then do we approve Phase 2B.

---

# Step 1 – Create Supabase Project

## 1.1 Create Account

Go to: [Supabase](https://supabase.com)

Recommended:
```text
Sign in with GitHub
```
since the project already lives in GitHub.

## 1.2 Create Project

Suggested values:
```text
Organization: Personal
Project Name: cabio-sales-os
Database Password: Generate and save securely
Region: Mumbai (ap-south-1)
```
Reason: Lowest latency for Kerala users

## 1.3 Record Credentials

Create a secure file (do NOT commit to git): `implementation/secrets/Supabase-Setup.md`

Record:
```text
Project URL
Anon Key
Service Role Key
Database Password
Region
Project ID
```
*Never commit secrets to Git.*

---

# Step 2 – Verify PostgreSQL Version

Open: `Supabase Dashboard -> Settings -> Database`

Record: `PostgreSQL Version`

Expected: `15+`
Add to validation report.

---

# Step 3 – Deploy Physical Schema

## Open SQL Editor

`Supabase Dashboard -> SQL Editor -> New Query`

## Deploy

Paste contents of `Physical-Schema.sql` and Execute.

## Expected Result

`Success. No errors.`

If errors occur:
Stop immediately. Do not modify SQL ad hoc. Capture the Error, Line Number, and Object Name and review.

---

# Step 4 – Verify Object Creation

Open: `Database -> Tables`

Verify every expected table exists. Expected categories should roughly include:
- Identity: `role`, `user_profile`
- Reference: `sbu`, `zone`, `product`, `lead_source`, `loss_reason`, `hold_reason`
- Sales: `account`, `stakeholder`, `project`, `opportunity`, `opportunity_item`, `split`, `activity`, `coverage_plan`, `coverage_plan_entry`, etc.

Every table must exist.

---

# Step 5 – Verify Foreign Keys

Open: `Database -> Table Editor -> Relationships`

Verify all FK relationships present. Critical examples:
- `user_profile.role_id`, `user_profile.sbu_id`
- `product.sbu_id`
- `project.account_id`
- `opportunity.project_id`, `opportunity.owner_id`
- `opportunity_item.opportunity_id`
- `activity.opportunity_id`

---

# Step 6 – Verify Constraints

Run query:
```sql
SELECT conname, contype FROM pg_constraint ORDER BY conname;
```
Verify PK constraints, FK constraints, Unique constraints, Check constraints exist as expected.

---

# Step 7 – Verify Indexes

Run query:
```sql
SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname='public' ORDER BY tablename;
```
Verify all custom indexes created (Opportunity indexes, Activity indexes, Account indexes, Project indexes).

---

# Step 8 – Verify Views

Run query:
```sql
SELECT table_name FROM information_schema.views WHERE table_schema='public';
```
Expected: `vw_opportunities_with_value`

---

# Step 9 – Deploy Seed Data

Open new query.
Paste contents of `Seed-Data.sql` and Execute.

## Expected Result
Success. No FK violations, duplicate key violations, or dependency errors.

---

# Step 10 – Validate Seed Data

Run counts. Example: `SELECT COUNT(*) FROM opportunity_stage;`
- OpportunityStage: Expected 7
- OpportunityStatus: Expected 5
- ProjectStatus: Expected 6
- LossReason: Expected 8
- LeadSource: Expected 9
- HoldReason: Expected 7
- Role: Expected 4
- SBU: Expected 2
- Zone: Expected 4

---

# Step 11 – Validate Opportunity Value View

Critical ADR-026 validation.
Run query:
```sql
SELECT * FROM vw_opportunities_with_value LIMIT 10;
```
Verify: View compiles, returns rows, no SQL errors.

---

# Step 12 – Supabase Compatibility Validation

Verify:
- Table Creation: PASS
- Foreign Keys: PASS
- Constraints: PASS
- Indexes: PASS
- Views: PASS
- Seed Data: PASS
- PostgreSQL Compatibility: PASS

---

# Database Validation Report Template

# Database Validation Report

## Project Information
Project Name: Cabio Sales OS
Environment: Supabase
Region:
PostgreSQL Version:
Validation Date:
Validated By:

---

## Deployment Summary
| Item                           | Result      |
| ------------------------------ | ----------- |
| Physical-Schema.sql Deployment | PASS / FAIL |
| Seed-Data.sql Deployment       | PASS / FAIL |
| SQL Errors Encountered         | YES / NO    |

---

## Object Validation
| Object Type  | Expected | Actual | Result |
| ------------ | -------- | ------ | ------ |
| Tables       | 20       |        |        |
| Foreign Keys |          |        |        |
| Constraints  |          |        |        |
| Indexes      |          |        |        |
| Views        | 1        |        |        |

---

## Seed Data Validation
### OpportunityStage: PASS / FAIL
### OpportunityStatus: PASS / FAIL
### ProjectStatus: PASS / FAIL
### LeadSource: PASS / FAIL
### HoldReason: PASS / FAIL
### LossReason: PASS / FAIL
### Role: PASS / FAIL
### SBU: PASS / FAIL
### Zone: PASS / FAIL

---

## ADR-026 Validation
View: `vw_opportunities_with_value`
Result: PASS / FAIL
Notes: 

---

## Supabase Compatibility Validation
| Validation Item          | Result      |
| ------------------------ | ----------- |
| PostgreSQL Compatibility | PASS / FAIL |
| Table Creation           | PASS / FAIL |
| Constraint Creation      | PASS / FAIL |
| Foreign Key Creation     | PASS / FAIL |
| Index Creation           | PASS / FAIL |
| View Creation            | PASS / FAIL |
| Seed Data Load           | PASS / FAIL |

---

## Overall Assessment
Database Foundation Status: READY FOR PHASE 2B (or NOT READY)
## Issues Identified
(List any issues)
## Sign-Off
Validated By:
Date:
