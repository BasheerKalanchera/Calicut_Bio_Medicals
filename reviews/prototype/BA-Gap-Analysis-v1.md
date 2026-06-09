# Cabio Sales OS – Phase 1: Business Analyst Gap Analysis

**Author:** Lead Business Analyst, Cabio Sales OS  
**Date:** June 7, 2026  
**Document Reference:** reviews/prototype/BA-Gap-Analysis-v1.md  
**Objective:** Compare the React prototype (`sales-os-app`) against `docs/Cabio Sales OS – Phase 1 - PRD.md` to identify missing requirements, business rules, fields, validations, dashboard metrics, navigation paths, user actions, and edge cases.

---

## **Executive Summary**

From a Business Analysis perspective, the prototype implements the basic visual layout of a CRM dashboard but lacks the essential **data validation rules, compliance checks, governance workflows, and auditing controls** that ensure database integrity and process alignment. 

Without enforcing mandatory stage exit criteria, contribution split validations (100% total rule), geographic zone routing based on PIN codes, and role-based data segregation boundaries, the platform cannot function as a reliable enterprise system of record. 

---

## **BA Gap Analysis Registry**

### **1. Missing Requirements & Business Rules**

| Severity | Requirement & Rule | Current Status | Business Impact | PRD Ref |
| :--- | :--- | :--- | :--- | :--- |
| **Critical** | **Zone-Based Visibility & Restrictions (SBU / Zone Boundaries)** | Not enforced. All salespersons can toggle and see all data. SBU-based visibility restrictions are absent. | **High Risk:** Reps can view and edit deals outside their territories. Breach of regional pricing confidentiality, lead poaching, and commission disputes. | Section 7 & 8 |
| **Critical** | **Manager Approvals for Key Actions** | Missing. Critical changes (value overrides, ownership updates, contribution edits) save immediately without manager sign-off. | **Loss of Control:** High-value deals can be manipulated or reassigned without governance. Unapproved changes skew forecasts and target compliance. | Section 8.1 |
| **Important** | **Account Hierarchy Structure** | Missing. Accounts are a flat list. No corporate hospital group parent-child relationships. | **Reporting Inaccuracy:** Impossible to run consolidated revenue reports for group accounts (e.g., Aster DM Healthcare) and departments. | Section 1.1 |
| **Important** | **SBU Opportunity Assignment Routing** | SBU assignment is hardcoded during automatic category splits, but there is no modular division assignment page. | **Data Segregation Risk:** Imaging and Critical Care opportunities cannot be logically separated or assigned to distinct SBU budgets. | Section 2.6 / 6.8 |
| **Important** | **Beat Planning Approval Process** | Missing. Reps cannot submit planned visits for manager review or approval. | **Operational Inefficiency:** Reps may log unapproved travel and visits, leading to budget leakages and travel allowance disputes. | Section 6.1 |
| **Important** | **Coexistence of Account Manager & Specialists** | Missing. Customers do not support a Primary Account Manager attribute separate from Opportunity Owner. | **Account Conflict:** Strategic customer planning is hindered. Multi-department initiatives lack a single coordination owner. | Section 6.3 & 6.3A |
| **Important** | **Lead Reassignment Workflows** | Missing. Lead reassignment doesn't trigger approval requests or log reassignments in the audit trail. | **Process Breakdown:** High-value leads can be transferred arbitrarily. Reps can hoarding leads without proper distribution. | Section 6.7 |

---

### **2. Missing Fields**

| Severity | Field Category | Missing Attributes | Business Purpose & Impact | PRD Ref |
| :--- | :--- | :--- | :--- | :--- |
| **Critical** | **PIN Code (Geographic Mapping)** | `PINCode` (Customer profile) | Auto-derives geographic Zone/Territory; prevents manual assignment errors and visibility bypasses. | Section 1.4 / 6.2 / B.2.6 |
| **Critical** | **Opportunity Split Contributions** | `ContributorID`, `TeamRole`, `ContributionPercentage` | Distributes opportunity revenue across contributors. Essential for correct revenue attribution. | Section 3.5 / B.3.3 |
| **Critical** | **Closed-Won Handover Attributes** | `InstallationRequirements`, `DeliveryNotes`, `SpecialCommitments`, `ServiceCoordinationNotes` | Records critical details needed to transition a won deal to downstream operations and service systems. | Section 3.13 |
| **Critical** | **Audit Trail Logging** | `UserID`, `Timestamp`, `OldValue`, `NewValue`, `EntityID`, `AttributeName` | Backs the audit logging system, recording every single transition of stage, owner, value, or split. | Section 9 / B.2.16 |
| **Important** | **Opportunity "On Hold" State** | `OpportunityState` (Active/On Hold), `HoldReason`, `HoldNotes`, `ExpectedReactivationDate` | Track deals on hold and filter them out of active risk-weighted forecast calculations. | Section 3.3 / B.3.2 |
| **Important** | **Customer segmentation & Tiers** | `CustomerStatus` (Prospect, Active, Inactive, Strategic), `CustomerTier` (Tier 1, Tier 2) | Groups customers dynamically for revenue potential analysis and prioritized engagement campaigns. | Section 1.3 / 1.3A |
| **Important** | **Stakeholder Details** | `Designation`, `Department`, `InfluenceLevel` (High/Medium/Low), `DecisionRole` (Evaluator, Buyer, etc.) | Evaluates contact footprint in accounts. Prevents single-point-of-failure risks in high-value deals. | Section 1.4 / B.2.7 |
| **Important** | **Product Master Metadata** | `SBUID`, `OEMID`, `Brand`, `Model`, `ProductType` | Links catalog entries to OEM partners and SBUs for downstream reporting. | Section 2.5 / B.2.8 |
| **Important** | **Beat Plan Fields** | `StrategicObjective`, `Quarter`, `PlannedVisitsCount`, `CoveredHospitalsList` | Defines the plan details, and links to monthly schedules. | Section 6.1 |

---

### **3. Missing Validations**

| Severity | Validation Rule | Validation Logic | Business Impact | PRD Ref |
| :--- | :--- | :--- | :--- | :--- |
| **Critical** | **Opportunity Stage Exit Criteria** | Block stage transitions unless required details are populated: <br> - *Qualified:* Product & Budget Range. <br> - *Demo:* Demo Date & Demo Outcome. <br> - *Closed Won:* Order Value & Product. <br> - *Closed Lost:* Loss Reason & Competitor. | Prevents reps from skipping stages or archiving deals without logging competitor losses or final pricing data. SKUs cannot be ordered without details. | Section 3.4 |
| **Critical** | **Opportunity Team Split Allocation** | Sum of contribution percentages of all team contributors must equal exactly 100% when saving a deal as *Closed Won*. | Inflated revenue reporting, double-counting of commissions, and major payment disputes during audits. | Section 3.5 |
| **Critical** | **Zone Mapping Validation** | Verify that `PINCode` entered is valid and mapped in `PINCodeGeoMapping` table before customer creation. | Prevents orphaned customers who belong to no zone, which locks data visibility for sales representatives. | Section 6.2 / 8.0 |
| **Important** | **Activity Log Completeness** | Enforce that any logged interaction MUST contain a Summary, Next Action, Due Date, and Owner. | Prevents reps from logging empty summaries ("Visited doctor") without scheduling follow-ups. | Section 4.3 |
| **Important** | **Date Validation on Opportunities** | Reactivation Date (for hold) and Closure Date (for negotiation) must be set in the future. | Prevents historical placeholders that skew pipeline velocity reports. | Section 3.3 / 3.4 |

---

### **4. Missing Reports & Dashboard Metrics**

| Severity | Dashboard / Report | Missing Metrics | Business Impact of Absence | PRD Ref |
| :--- | :--- | :--- | :--- | :--- |
| **Critical** | **Forecast Report (A.3.3 / 5.1)** | Weighted Forecast, Unweighted Forecast, Coverage Ratio, SBU/Zone aggregates. | Sales leadership cannot plan monthly inventory, cash flow, or evaluate quota health. | Section 5.1 / A.3.3 |
| **Critical** | **Manager Dashboard (A.2.2 / 5.4)** | Team target compliance, pipeline aging, hold deals count, beat plan compliance, team activity levels. | Managers cannot identify underperforming representatives or stagnant opportunities until deals are lost. | Section 5.4 / A.2.2 |
| **Critical** | **GM Dashboard (A.2.3 / 5.5)** | Consolidated Revenue vs. Target, SBU Performance, Zone aggregates, Competitive Loss totals. | Executives cannot track performance across Imaging and Critical Care divisions or handle strategic risks. | Section 5.5 / A.2.3 |
| **Critical** | **Revenue Attribution Report (A.3.7 / 5.14)** | Attributed Revenue per user based on contribution splits. | Quotas and achievements cannot be verified. Human resources cannot calculate performance. | Section 5.14 / A.3.7 |
| **Critical** | **No Activity Hospital Report (A.3.6 / 5.7)** | Customers with zero activity in previous 3 months, Account Manager, assets count. | Neglected hospital accounts churn, and competitor products are installed without alert triggers. | Section 5.7 / A.3.6 |
| **Important** | **Beat Plan Execution Report (A.3.1)** | Planned vs. Completed visits, Coverage percentage, expected revenue. | Performance audits fail. Travel reimbursements cannot be verified against client visits. | A.3.1 |
| **Important** | **Product Performance Report (A.3.4 / 5.6)** | Quantity sold, average selling price (ASP), margins. | Product managers cannot evaluate product lines, OEM partnerships, or calculate profitability. | Section 5.6 / A.3.4 |
| **Important** | **Competitive Loss Report (A.3.5 / 5.5)** | Lost value, loss reasons, lost competitor products. | Product and sales teams cannot isolate missing features or address pricing vulnerabilities. | Section 5.5 / A.3.5 |

---

### **5. Missing Navigation Paths**

| Severity | Navigation Element | Destination & Purpose | Business Impact | PRD Ref |
| :--- | :--- | :--- | :--- | :--- |
| **Critical** | **GM Dashboard Tab** | Navigates to consolidated GM dashboard. | High-level executives have no way to access overall business unit metrics. | Section 5.5 / 7.0 |
| **Critical** | **Approvals Center** | central queue to review, approve, or reject splits, reassignments, and overrides. | Business control lockups or bypasses occur. Workflows stall without access panels. | Section 8.1 |
| **Important** | **Beat Planning Workspace** | View and build quarterly coverage schedules. | Reps cannot plan schedules, and manager audit maps cannot be referenced. | Section 6.1 |
| **Important** | **Audit Trail Board** | Search and view system logs of deal and account changes. | Operations cannot track when close dates or owners were changed, hindering forensics. | Section 9.0 |
| **Important** | **Knowledge Repository Search Tab** | Dedicated search engine to query historic interactions. | Institutional memory remains isolated inside individual customers. | Section 4.6 |
| **Nice To Have** | **Hierarchy Tree View** | Tree diagram of Account hierarchical relationships. | Reps cannot visualize corporate networks and department branches. | Section 1.1 |

---

### **6. Missing User Actions & Edge Cases**

| Severity | User Action / Edge Case | Business Description | Business Impact | PRD Ref |
| :--- | :--- | :--- | :--- | :--- |
| **Critical** | **Edge Case: Opportunity Split with <100% Allocation** | When marking a deal *Closed Won*, if the sum of contribution percentages is less or more than 100%, what happens? | **Bad Data:** Skews team payouts, introduces accounting errors, and triggers auditing flags. | Section 3.5 |
| **Important** | **Action: Opportunity Auto-Splitting (Dual Categories)** | Automatically splitting a combined lead (e.g. Imaging + Critical Care machine) into separate SBU-specific opportunities. | **Assignment Conflict:** Without an automated rule, reps bypass routing or map deals to incorrect SBU specialists. | Section 2.6 / 3.3 |
| **Important** | **Edge Case: Reassignment Pending Approval Access** | A salesperson requests a lead transfer. While approval is pending, who has write access? | **Process Lock:** Data could be double-edited or neglected during the pending state. | Section 6.7 / 8.1 |
| **Important** | **Edge Case: Mapped PIN Code Mismatch** | Creating an account with a PIN Code not registered in the PIN Code mapping table. | **Orphaned Account:** Account is created but remains invisible to all zone-restricted users. | Section 6.2 / 8.0 |
| **Important** | **Edge Case: Deleting a Contact with Activity History** | Deleting a stakeholder contact that has historic visits and logs linked to their name. | **Data Corruption:** Historic interaction reports and audits break due to missing relational entities. | Section 1.4 / 9.0 |
| **Important** | **Edge Case: Overdue On-Hold Reactivation** | An opportunity's Reactivation Date passes but no action is logged. | **Forecast Drift:** The deal remains permanently in a forecast-excluded hold state, hiding stagnant deals. | Section 3.3 |
