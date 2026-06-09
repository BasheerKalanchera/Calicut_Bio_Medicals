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
