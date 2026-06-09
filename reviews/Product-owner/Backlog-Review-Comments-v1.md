PB-001

Status:
Change Required

Reason:
PRD requires customer hierarchy support.
Current backlog implementation appears over-engineered.

Requested Change:
Replace hierarchy management UI and nested directory tree
with a simplified approach.

Phase 1 Scope:

- Customer Type
- Parent Customer
- Parent relationship display in Customer 360

Out of Scope:

- Hierarchy management workspace
- Nested customer directory tree
- Advanced hierarchy administration

PB-009

Status:
Change Required

Reason:
Requirement already exists in PRD as a business rule.

Current backlog item incorrectly treats it as a standalone feature.

Requested Change:
Remove as independent P1 capability.

Implement as part of Customer Master and Opportunity inheritance logic.

Move detailed definition to Business Rules Register during reverse-ingestion.

Impact:
No PRD change required.
No additional prototype screens required.

PB-017

Status:
Major Change Required

Reason:
PRD requires interaction summaries
to be searchable.

PRD does not require:

- Knowledge Repository Module
- Knowledge Repository Screen
- Sidebar Navigation Entry

Requested Change:

Replace Knowledge Repository Screen
with searchable interaction history.

Search may be provided within:

- Customer 360
- Activity Management
- Global Search

No dedicated module required.

Impact:

Reduce scope.

Reduce navigation complexity.

Preserve PRD intent.

PB-021

Status:
Remove From Prototype Backlog

Reason:
Requirement represents authorization and security behavior rather than prototype functionality.

Product authorization rules are implementation concerns and should be addressed through:

Security Architecture
Authorization Rules
RLS Strategy
API Design
SDD

Requested Change:

Remove PB-021 from Prototype Completion Backlog.

Move requirement definition to:

Business Rules Register
Security Architecture
Design Decisions Register

Impact:

No additional prototype screens required.

No additional prototype workflows required.

Requirement remains in implementation scope.