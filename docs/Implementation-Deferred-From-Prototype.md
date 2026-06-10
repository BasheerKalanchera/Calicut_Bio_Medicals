ID: DF-001

Requirement:
User Administration

Source:
PRD Section 7
Phase 1 Requirements List

Reason:
Not required for Prototype Freeze.

Action:
Must be included during
ERD, API Design and SDD.


ID: DF-002

Requirement:
Master Data Administration

Source:
Derived from Product,
Territory and Governance requirements.

Reason:
Not required for Prototype Freeze.

Action:
Review during SDD preparation.

---

ID: DF-003

Requirement:
Opportunity Governance Workflows

Source:
PRD Section 8.1
Capability Coverage Review

Reason:
Approval workflows are required for production governance but are not necessary for validating core CRM workflows during the prototype phase.

The capability introduces significant workflow, authorization and security complexity that should be addressed during architecture and detailed design.

Examples:

* Probability Override Approval
* Stage Exception Approval
* Discount Approval
* Split Ownership Approval
* High Value Opportunity Approval

Action:
Document as an architectural requirement.

Review during:

* Business Rules Register
* Design Decisions Register
* Security Architecture
* API Design
* SDD Preparation

Status:
Deferred From Prototype

---

ID: DF-004

Requirement:
Document Management

Source:
PRD Section 1.4
PRD Data Model B.2.13
Capability Coverage Review

Reason:
Document management is required for production operations but is not essential for validating CRM workflows during the prototype phase.

The capability introduces file storage, document security, document versioning and document lifecycle management requirements that should be addressed during architecture and detailed design.

Examples:

* PNDT Approvals
* Form B Documents
* Purchase Orders
* Contracts
* Quotations
* Installation Certificates
* Warranty Documents

Action:
Review during:

* ERD Design
* Storage Architecture Design
* API Design
* Security Design
* SDD Preparation

Expected Architecture:

* Document Metadata → PostgreSQL
* Document Files → Supabase Storage

Status:
Deferred From Prototype

---

ID: DF-005

Requirement:
Project Management Capabilities

Source:
PRD Section 3.6
PB-026 – Project Opportunity Foundation

Reason:
Phase 1 supports only Project entity provisioning and Opportunity-to-Project association.

Operational Project Management capabilities are not required for Prototype Freeze and introduce additional workflow, reporting, forecasting, analytics, and governance complexity beyond the approved Phase 1 scope.

Examples:

* Project Workspaces
* Project Dashboards
* Project Reporting
* Project Forecasting
* Project Progress Tracking
* Project-Level Analytics
* Project Approval Workflows

Action:
Review during:

* ERD Design
* API Design
* Reporting & Analytics Design
* Forecasting Design
* SDD Preparation

Status:
Deferred From Prototype

## Future Enhancement Candidates

### FE-001 – Won Deal Risk Management

#### Business Need

Track deals that have reached Order / Closed Won status but are experiencing post-order execution risk.

The current opportunity lifecycle assumes that once an order is secured, the deal is effectively complete. However, in medical equipment sales, significant commercial and operational risks may still exist after order receipt.

Examples include:

* Customer reconsideration after PO issuance
* Clinical user resistance
* Funding or payment delays
* Installation delays
* Competitor re-entry attempts
* PO amendment requests
* Scope reduction requests
* Delivery blockers

#### Example Scenario

A hospital issues a purchase order and advance payment for an Ultrasound machine.

Subsequently, the Radiologist requests that the hospital purchase a competitor's system instead because they are more familiar with that product.

The hospital owner wishes to proceed with the original order, but the deal becomes operationally and commercially at risk despite already being classified as Closed Won.

#### Proposed Future Solution

Introduce a separate Risk Status attribute for Won Deals.

Possible values:

* Normal
* At Risk
* Blocked
* Cancelled

#### Benefits

* Early identification of post-order issues
* Improved management visibility
* Better coordination between Sales, Installation, and Service teams
* More accurate revenue forecasting and order realization tracking

#### Status

Future Enhancement Candidate

Not in Phase 1 scope.

Not required for Prototype Freeze.

Review during Phase 2 roadmap planning.
