## 

## **Objective**

Deploy a responsive, cloud-based Sales Operating System that standardizes sales execution, opportunity management, institutional knowledge capture, forecasting, and sales governance across territories, product categories, and customer accounts while providing a scalable foundation for future CRM capabilities.

---

# **Enterprise Scalability & Future-State Architecture Principles**

The Cabio Sales OS platform shall be designed as a scalable enterprise foundation supporting Cabio's long-term growth strategy across multiple Strategic Business Units (SBUs), branches, franchise networks, customer engagement models, commercial models, and integrated business systems.

While Phase 1 focuses on Sales Operations capabilities, the underlying architecture shall support future business expansion through modular business domains without requiring fundamental redesign of the platform core.

The platform shall be designed around reusable enterprise entities including:

* Organization  
* Strategic Business Unit (SBU)  
* Customer  
* Stakeholder  
* Product  
* OEM  
* Installed Asset  
* Contract  
* Activity  
* User  
* Document

Future business capabilities shall extend these foundational entities rather than creating duplicate business structures.

Examples of future business domains include:

* Service Operations  
* Calibration Management  
* AMC / CMC Management  
* Refurbishment Management  
* Academy & Training Operations  
* Digital Health Services  
* Equipment-as-a-Service  
* Subscription-based Offerings  
* Franchise Operations

These future capabilities are outside the scope of Phase 1 implementation but have been considered during architecture and data model design.

---

# **1\. Customer Account Management Module**

## **1.1 Account Structure & Hierarchy**

### **Feature 5.1 – Account Structure**

The system shall support the configuration of various account types including:

* Multi-location corporate hospital groups  
* Individual hospitals  
* A/B/C/D hospital classifications  
* Diagnostic centers  
* Clinics  
* Dealers

### **Customer Hierarchy Model**

The system shall support a hierarchical customer structure:

* Corporate Group  
  * Hospital  
    * Department

Example:

* Aster DM Healthcare  
  * Aster Medcity  
  * Aster MIMS Calicut  
  * Aster Kannur

All reporting and opportunity management shall support this hierarchy.

---

## **1.2 Account Segmentation**

The system shall support segmentation based on:

* Hospital size  
* Medical specialty  
* Revenue potential

---

## **1.3 Customer Tiering**

The system shall provide configurable tier classifications:

* Tier 1  
* Tier 2

Tiering shall be based on:

* Historical purchases  
* Strategic value  
* Future revenue potential

### **1.3A Customer Status Classification**

The system shall support configurable customer status classifications.

Default statuses shall include:

* Prospect  
* Active Customer  
* Inactive Customer  
* Strategic Account

Customer Status shall be independent of Customer Tier.

Examples:

* A Tier 1 customer may be Active or Strategic.  
* A Tier 2 customer may be Active or Inactive.

Customer Status shall be available as a reporting and segmentation attribute.

---

## **1.4 Customer Profile Management**

The system shall capture:

* Organization details  
* Address  
* Phone  
* WhatsApp  
* Email

### **Stakeholder Management**

The system shall support multiple stakeholders per customer.

Stakeholder roles shall include:

* Decision Maker  
* Influencer  
* Technical Evaluator  
* Biomedical Engineer  
* Procurement  
* Finance Approver  
* End User

### **Stakeholder Influence Assessment**

In addition to stakeholder role classification, the system shall support stakeholder influence ratings.

Default influence levels shall include:

* High  
* Medium  
* Low

Influence ratings shall assist sales teams in identifying key decision makers and prioritizing engagement efforts.

Influence ratings shall be available within Customer 360 views and stakeholder reporting.

### **Document Management**

The system shall support storing and managing customer-related documents including:

* PNDT Approvals  
* Form B Documentation  
* Contracts  
* Installation Certificates  
* Customer Agreements  
* Reference Documents

Documents shall be accessible from the Customer 360 View.

---

## **1.5 Financial Categorization**

Users shall be able to categorize customers as:

* Good Paymaster  
* Problematic Payer

---

## **1.6 Customer Health & Sentiment**

The system shall support Customer 360 sentiment tracking:

* Promoter  
* Neutral  
* Detractor

---

## **1.7 Customer Intelligence View**

Provide a consolidated Customer 360 view including:

* Purchase History  
* Installed Assets  
* Open Opportunities  
* Stakeholders  
* Customer Sentiment  
* Feedback History  
* Customer Documents  
* Commercial Contracts

The Customer 360 view shall serve as the primary customer intelligence workspace.

---

## **1.8 Feedback Collection**

Capture:

* Post-installation feedback  
* Post-service feedback

Feedback shall contribute to customer health indicators.

---

# 

# **2\. Product Catalog Management Module**

## **2.1 Product Structure**

Maintain a structured product hierarchy:

Category → Brand → Model

Each Product shall belong to a Strategic Business Unit (SBU). Phase 1 shall support following two SBU’s:

* Imaging  
* Critical Care

Additional SBUs shall be configurable through administration functions.  
---

## **2.2 Product Information**

Support:

* Technical specifications  
* Product configurations  
* Product URLs from company website

---

## **2.3 Sales Collateral Management**

Support attachment of:

* Brochures  
* Spec sheets  
* Pricing guides  
* Training videos

---

## **2.4 Training & Enablement**

Support:

* Training URLs  
* Product learning resources  
* Sales enablement material

---

## **2.5 OEM Management**

The system shall maintain OEM information including:

* OEM Name  
* Territory  
* Support Contacts  
* Partnership Status

Products shall be associated with an OEM.

OEM information shall support future installed-base analysis and OEM performance reporting.

---

## **2.6 Product-SBU Assignment**

Each Product shall be associated with a Strategic Business Unit (SBU).

Examples:

* Sonoscape Ultrasound → Imaging  
* Ventilator → Critical Care

Product-SBU mapping shall support:

* Opportunity assignment  
* Reporting  
* Target management  
* Pipeline analysis  
* Forecasting

# 

# **3\. Opportunity Management Module**

## **3.1 Lead Capture**

Capture:

* Lead source  
* Campaign source  
* Zone  
* Product category

---

## **3.2 Pre-Lead Scanning**

Allow users to record marketing visits and prospecting activities before opportunity creation.

---

## **3.3 Opportunity Lifecycle**

Pipeline Stages:

* Lead  
* Qualified  
* Demo  
* Negotiation  
* Closed Won  
* Closed Lost

The system shall support configurable stage aging limits by product category.

In addition to stages, the system shall support Opportunity State:

* Active  
* On Hold

An opportunity placed On Hold shall retain its existing stage while being excluded from active forecasting calculations.

The system shall capture:

* Hold Reason  
* Hold Notes  
* Expected Reactivation Date

---

## **3.4 Stage Exit Criteria**

### **Qualified**

Mandatory:

* Product identified  
* Budget range

### **Demo**

Mandatory:

* Demo date  
* Demo outcome

### **Negotiation**

Mandatory:

* Expected closure date

### **Closed Won**

Mandatory:

* Order value  
* Product details

### **Closed Lost**

Mandatory:

* Loss reason  
* Competitor

---

## **3.5 Opportunity Ownership**

The system shall support shared ownership of opportunities.

Each opportunity may have one or more contributing users.

For each contributing user the system shall capture:

* User  
* Team Role  
* Contribution Percentage

The total contribution percentage across all contributors must equal 100%.

The primary owner of the opportunity shall assign contribution percentages when the opportunity is marked Closed Won.

Contribution allocations may only be modified by the responsible manager.

All contribution allocation changes shall be audit logged.

Default team roles may include:

* Opportunity Owner  
* Application Engineer  
* Star Closer  
* Account Manager

Additional team roles may be configured through administration functions.

Incentive calculations and commission calculations remain outside the scope of Phase 1\.

---

## **3.6 Project Opportunity Management**

The platform architecture shall support future Project Opportunity Management capabilities.

A Project may represent a customer initiative involving multiple opportunities, product categories, business units, or external vendors.

Examples may include:

* Hospital Expansion Projects  
* New Hospital Setup Projects  
* Multi-Department Procurement Initiatives

The Phase 1 data model shall provision a Project entity and support association of opportunities to a Project.

However:

* Project management screens  
* Project workflows  
* Project reporting  
* Project approvals

are not included within the approved Phase 1 scope.

Future capabilities may include:

* Multiple Opportunities per Project  
* Multi-SBU Participation  
* Multiple Opportunity Owners  
* External Vendor Participation  
* Project-Level Forecasting

---

## **3.7 Win Probability Management**

Support:

* System-generated probability  
* Manager override  
* Manual adjustment

Default probabilities:

* Qualified – 25%  
* Demo – 50%  
* Negotiation – 75%  
* Closed Won – 100%

---

## **3.8 Pipeline Management**

Provide:

* Kanban pipeline  
* List view  
* Search capability

Filtering by:

* Zone  
* Product  
* Salesperson  
* Team

---

## **3.9 Deal Prioritization**

Provide High Priority flag.

---

## **3.10 Lost Deal Intelligence**

Capture:

* Loss summary  
* Competitor  
* Competitor product  
* Loss reason

Loss reasons:

* Price  
* Competitor Relationship  
* Product Gap  
* Financing  
* Service Concern  
* Delayed Response  
* Budget Not Approved  
* Project Cancelled  
* Other

---

## **3.11 Competitive Intelligence**

Capture deal-level competitive intelligence.

---

## **3.12 Manager Push Logging**

Managers shall be able to record tactical instructions that remain permanently attached to the opportunity history.

---

## **3.13 Closed-Won Handover**

Upon closure of an opportunity as Closed Won, the system shall support recording handover information required for downstream operational processes.

Handover information may include:

* Customer  
* Product  
* Order Value  
* Installation Requirements  
* Delivery Notes  
* Special Commitments  
* Service Coordination Notes

The handover record shall remain associated with the opportunity history.

The design shall support future integration with Service Management Systems.

# **4\. Activity Tracking & Next Actions Module**

## **4.1 Field Visit Management**

Capture:

* Visit purpose  
* Visit outcome  
* Notes

---

## **4.2 Demo Management**

Capture:

* Demo date  
* Outcome  
* Follow-up actions

Track demo-to-sale conversion metrics.

---

## **4.3 Interaction Logging**

Every interaction must capture:

* Summary  
* Next Action  
* Due Date  
* Owner

The interaction cannot be saved without these fields.

---

## **4.4 Workflow Automation**

Generate:

* Follow-up reminders  
* Escalations  
* Manager notifications

---

## **4.5 Pipeline Aging Alerts**

Generate alerts for:

* Stagnant opportunities  
* Overdue actions

---

## **4.6 Knowledge Repository**

Mandatory interaction summaries shall be stored in a searchable institutional memory repository.

Search by:

* Customer  
* Product  
* Competitor  
* Keyword  
* Deal outcome

---

# **5\. Reporting & Review Module**

### **Reporting Dimensions**

All reports shall support filtering, grouping, and drill-down based on applicable business and geographic dimensions including:

* Strategic Business Unit (SBU)  
* Zone  
* Individual User

The architecture shall support future Territory-based reporting without requiring redesign of reporting structures.

Zone shall be derived from customer geography using PIN Code to Zone mapping.

## **5.1 Forecasting**

Provide:

* Weighted Forecast  
* Unweighted Forecast

By:

* Month  
* Quarter  
* Product  
* Zone

---

## **5.2 Pipeline Coverage Monitoring**

Trigger alerts when:

Active Unweighted Pipeline \< 3 × Revenue Target

---

## **5.3 Salesperson Dashboard**

Display:

* Target vs Actual  
* Pipeline Value  
* Forecast  
* High Priority Deals  
* Overdue Actions

---

## **5.4 Manager Dashboard**

Display:

* Team Performance  
* Pipeline Coverage  
* Forecast Accuracy  
* Pipeline Aging  
* Rep Activity Levels

---

## **5.5 GM Dashboard**

Display:

* Zone Performance  
* Product Performance  
* Competitive Loss Analysis  
* Forecast vs Budget

---

## **5.6 Core Reports**

Provide:

* Sales reports  
* Pipeline reports  
* Product performance reports  
* Margin reports

---

## **5.7 Exception Reports**

Hospitals with:

* No lead activity for 3 months

Minor transactions such as accessories shall not exclude hospitals from this report.

---

## **5.8 Weekly Follow-up Report**

Report shall include:

* High-priority deals  
* Deals with probability ≥70%  
* Stagnant deals  
* Overdue actions

---

## **5.9 Drill-down Reporting**

Support:

Zone → Team → Individual

---

## **5.10 Installed Base Summary Report**

Provide visibility into installed assets by:

* Customer  
* Product  
* OEM  
* Installation Date  
* Warranty Expiry

---

## **5.11 Warranty Expiry Report**

Provide visibility into assets approaching warranty expiration.

Support configurable warning periods.

---

## **5.12 Customer Portfolio Report**

Provide a consolidated customer view including:

* Revenue  
* Open Opportunities  
* Installed Assets  
* Activities  
* Customer Sentiment

---

## **5.13 Opportunity Hold Report**

Provide visibility into opportunities currently on hold.

Include:

* Customer  
* Product  
* Opportunity Value  
* Current Stage  
* Hold Reason  
* Reactivation Date  
* Days On Hold

---

## **5.14 Revenue Attribution Report**

Provide contribution-based achievement reporting for opportunities with shared ownership.

Include:

* Opportunity  
* Opportunity Value  
* Contributor  
* Team Role  
* Contribution Percentage 

# **6\. Organization & Sales Governance Module**

## **6.1 Beat Planning**

Support quarterly beat planning.

Capture:

* Hospitals to cover  
* Planned visits  
* Strategic objective  
* Expected revenue

Manager approval required.

Designed for future Google Maps integration.

---

## 

## **6.2 Geographic Coverage & Ownership Mapping** 

The system shall support management of geographic sales coverage through Zones.

Customer Zone shall be derived through PIN Code mapping.

The system shall support:

* Zone Management  
* PIN Code to Zone Mapping  
* User-to-Zone Assignment  
* Zone-based Reporting  
* Zone-based Visibility Controls

The architecture shall support future Territory implementation.

Territories are not included in the approved Phase 1 operational scope.

---

## **6.3 Account Manager Assignment**

Optional assignment of Account Manager for strategic customers.

This role shall coexist with product-category ownership.

## **6.3A Customer Ownership Management**

The system shall support assignment of a Primary Account Manager to each customer account.

The Primary Account Manager shall be responsible for:

* Overall customer relationship management  
* Strategic account planning  
* Coordination across multiple product teams  
* Executive stakeholder engagement  
* Customer escalation management

Customer ownership shall coexist with product ownership and opportunity ownership models.

A customer may therefore have:

* One Primary Account Manager  
* Multiple Product Specialists  
* Multiple Opportunity Owners

All ownership changes shall be audit logged.

Customer geographic assignment shall be determined through customer location and PIN Code mapping and shall remain independent of Primary Account Manager ownership assignments.

Changing ownership shall not alter customer geographic assignment.

---

## **6.4 Target Management**

Support target definition at:

* Individual  
* Team  
* Zone

---

## **6.5 Product Category Targets**

Support:

* Quarterly targets  
* Annual targets

By product category.

---

## **6.6 Product-Team Mapping**

Map teams to products they are authorized to sell.

---

## **6.7 Workflow Rules**

Configure lead reassignment workflows requiring manager approval.

---

## **6.8 Organization Structure Management**

Support administration of:

* Strategic Business Units (SBUs)  
* Zones  
* PIN Code to Zone Mapping  
* Teams

Users shall be associated with:

* Primary SBU  
* Assigned Zone

Phase 1 shall support:

* Imaging  
* Critical Care

Branch & Territory administration is not included within the approved Phase 1 scope.

---

# **7\. User Roles & Access Control Module**

### **Roles**

* Salesperson  
* Manager  
* GM  
* Admin

### **Access Control**

Support:

* Hierarchy-based visibility  
* Cross-Zone restrictions  
* Product-based restrictions  
* SBU-based visibility controls

Reporting and data visibility shall respect configured organizational boundaries.

### **Collateral Security**

Restrict sensitive collateral access to authorized users.

Visibility controls shall support:

* SBU Level  
* Territory Level  
* Team Level

# 

# **8\. Business Rules & Governance**

## **Opportunity Contribution Rules**

Revenue achievement shall be allocated according to contribution percentages.

---

## **Forecast Rules**

Weighted forecast shall use stage probabilities unless overridden.

---

### **Geographic Coverage Rules**

Customer geographic assignment shall be determined through customer location and PIN Code mapping.

Zone shall be derived from the customer PIN Code.

Users may only access customer and opportunity data within their assigned geographic coverage unless additional permissions are granted through role-based access controls.

Future Territory rules shall extend the same model without requiring redesign.

---

## **Data Visibility Rules**

Visibility shall follow role hierarchy.

---

## **8.1 Opportunity Approval Rules**

The system shall support configurable approval workflows for opportunity governance.

Approval workflows shall be configurable based on business rules including:

* Opportunity value thresholds  
* Opportunity ownership changes  
* Contribution allocation changes  
* Probability overrides  
* Exceptional opportunity updates

Approval history shall be permanently recorded within the audit trail.

Approval workflows shall be configurable by administrators without requiring system customization.

---

# **9\. Audit & History**

The system shall maintain a complete audit trail for:

* Opportunity value  
* Probability  
* Stage  
* Ownership  
* Contribution allocation  
* Territory assignment

Audit entries shall include:

* User  
* Timestamp  
* Old value  
* New value

---

# **10\. System & Architecture Constraints**

## **Mobility & UX**

Deploy as Responsive Web Application.

Support:

* Mobile  
* Tablet  
* Desktop

UI shall minimize data entry effort.

---

## **Technical Architecture**

Support:

* API-first architecture  
* Cloud deployment  
* Multi-Zone scalability  
* Future integration readiness

The architecture shall maintain logical separation between:

* Core Enterprise Data Model  
* Application-Specific Data Models

Future business modules shall extend the Core Enterprise Data Model without requiring redesign of foundational business entities.

---

## **Future Integration Readiness**

Expand to include:

* ERP Systems  
* Finance Systems  
* Service Management Systems  
* OEM Systems  
* Document Management Systems  
* Email Platforms  
* WhatsApp  
* Google Maps  
* Future SaaS Platforms

---

## **Scalability Requirements**

Add New Subsection

The platform shall support:

* Multiple Strategic Business Units  
* Franchise Networks  
* Installed Base Intelligence  
* Future Commercial Models  
* API-Based Integration Architecture  
* Organization-Level Data Segregation  
* Cross-SBU Reporting  
* Modular Expansion Through Additional Business Domains

---

## **Future Integration Readiness**

Architecture shall support future integration with:

* ERP  
* Finance Systems  
* Service Management Systems  
* Email  
* WhatsApp  
* Google Maps

---

## **Database Design**

Support:

* Structured data  
* Unstructured data

---

## **Security & Compliance**

Support:

* Role-based access control  
* Data encryption  
* Backup & Disaster Recovery  
* MFA for Admin users

---

## **Performance Requirements**

* Dashboard load time \< 5 seconds  
* Search results \< 3 seconds  
* Interaction save \< 2 seconds

---

## **Availability**

System availability target:

99.5%

# 

# **Appendix A – Analytics & Reporting** 

## **A.1 Reporting Principles**

The purpose of reporting and analytics within Cabio Sales OS is to support daily sales execution, pipeline governance, forecasting, performance management, and strategic decision making.

The platform shall provide a combination of role-based dashboards and operational reports.

All dashboards and reports shall support filtering and grouping by applicable dimensions including:

* Strategic Business Unit (SBU)  
* Zone  
* Team  
* Individual User  
* Product  
* Time Period

The architecture shall support future Territory-based reporting without requiring redesign of reporting structures.

Reports shall support export to Excel and PDF where applicable.

Reports shall respect role-based access controls and configured visibility rules.

Geographic reporting shall derive Zone and future Territory assignments through customer PIN Code mapping.

---

# **A.2 Dashboards**

## **A.2.1 Salesperson Dashboard**

Purpose

Provide sales representatives with a daily operating view of their assigned business.

Key Metrics

* Revenue Target  
* Revenue Achieved  
* Achievement Percentage  
* Open Pipeline Value  
* Weighted Forecast  
* High Priority Opportunities  
* Overdue Actions  
* Beat Plan Progress  
  ---

  ## **A.2.2 Manager Dashboard**

Purpose

Provide sales managers with visibility into team performance and pipeline health.

Key Metrics

* Team Revenue Target  
* Team Revenue Achieved  
* Team Forecast  
* Pipeline Value  
* Pipeline Aging Summary  
* Opportunities On Hold  
* Overdue Actions  
* Beat Plan Compliance  
* Team Activity Levels  
  ---

  ## **A.2.3 GM Dashboard**

Purpose

Provide sales leadership with consolidated business visibility across Strategic Business Units and Zones.

Key Metrics

* Revenue vs Target  
* Weighted Forecast  
* Unweighted Forecast  
* Pipeline Coverage Ratio  
* SBU Performance Summary  
* Zone Performance Summary  
* Product Performance Summary  
* Competitive Loss Summary  
* Key Pipeline Risks  
  ---

  # **A.3 Operational Reports**

  ## **A.3.1 Beat Plan Execution Report**

Purpose

Measure execution of approved quarterly beat plans.

Metrics

* Planned Hospitals  
* Covered Hospitals  
* Coverage Percentage  
* Planned Visits  
* Completed Visits  
* Visit Completion Percentage  
* Hospitals With No Activity  
* Expected Revenue  
* Pipeline Generated

Grouping Options

* SBU  
* Zone  
* User  
* Quarter  
*   
  ---

  ## **A.3.2 Pipeline Review Report**

Purpose

Provide visibility into pipeline health and opportunities requiring management attention.

Metrics

* Opportunity  
* Customer  
* Product  
* Opportunity Value  
* Stage  
* Days in Stage  
* Current State  
* Hold Reason  
* Expected Reactivation Date  
* Next Action  
* Opportunity Owner

This report shall support identification of:

* Stagnant Opportunities  
* Opportunities On Hold  
* High Priority Opportunities  
* Overdue Follow-Ups  
  ---

  ## **A.3.3 Forecast Report**

Purpose

Provide forecasting visibility for revenue planning and business reviews.

Metrics

* Opportunity Count  
* Pipeline Value  
* Weighted Forecast Value  
* Unweighted Forecast Value  
* Coverage Ratio

Grouping Options

* SBU  
* Zone  
* Team  
* User  
* Product  
  ---

  ## **A.3.4 Product Performance Report**

Purpose

Measure commercial performance of products and brands.

Metrics

* Quantity Sold  
* Revenue  
* Average Selling Price  
* Margin  
* Opportunity Count  
* Won Opportunities  
* Lost Opportunities

Grouping Options

* Product  
* Brand  
* OEM  
* SBU  
  ---

  ## **A.3.5 Competitive Loss Report**

Purpose

Understand why opportunities are lost and monitor competitive threats.

Metrics

* Competitor  
* Competitor Product  
* Loss Reason  
* Lost Value  
* Opportunity Count

Grouping Options

* Competitor  
* Product  
* SBU  
* Zone  
  ---

  ## **A.3.6 No Activity Hospital Report**

Purpose

Identify hospitals with insufficient engagement activity.

Criteria

* No lead activity within the previous three months.

Minor accessory transactions shall not exclude hospitals from this report.

Metrics

* Customer  
* Last Activity Date  
* Account Manager  
* Opportunity Count  
* Installed Asset Count  
  ---

  ## **A.3.7 Revenue Attribution Report**

Purpose

Support achievement reporting for opportunities with shared ownership.

Metrics

* Opportunity  
* Opportunity Value  
* Contributor  
* Team Role  
* Contribution Percentage  
* Attributed Revenue

Grouping Options

* SBU  
* Zone  
* User  
  ---

  # **A.4 Operational Alerts**

The platform shall support generation of operational alerts including:

## **Pipeline Coverage Alert**

Trigger when:

Active Unweighted Pipeline \< 3 × Revenue Target

## **Stagnant Opportunity Alert**

Trigger when:

Opportunity exceeds configured stage aging threshold.

## **Overdue Follow-Up Alert**

Trigger when:

Next Action Due Date is exceeded.

## **Beat Plan Coverage Alert**

Trigger when:

Planned hospital coverage falls below configured threshold for the reporting period.

# **Appendix B – Enterprise Data Model**

## **B.1 Purpose**

The Cabio Sales OS platform is intended to serve as the foundational customer, sales, and commercial intelligence platform supporting Cabio's long-term business growth strategy.

While Phase 1 focuses on Sales Operations capabilities, the underlying architecture shall be designed to support future business expansion across multiple Strategic Business Units (SBUs), branches, franchise networks, customer engagement models, commercial models, installed base intelligence, analytics capabilities, and enterprise integrations.

To support this objective, the data model is organized into two logical layers:

1. Core Enterprise Data Model (Strategic Foundation)  
2. Phase 1 Sales OS Data Model (Application Layer)

The Core Enterprise Data Model contains stable business entities expected to remain relevant across future business expansions and technology initiatives.

The Phase 1 Sales OS Data Model contains application-specific entities required to deliver the approved Sales OS Phase 1 scope.

---

# **B.2 Core Enterprise Data Model**

The following entities form the strategic foundation of the Cabio platform:

* Organization  
* SBU  
* State  
* Zone  
* Territory  
* PINCodeGeoMapping  
* User  
* Team  
* Customer  
* CustomerAccountManager  
* Stakeholder  
* Product  
* ProductDocument  
* OEM  
* InstalledAsset  
* Contract  
* Document  
* Activity  
* NextAction  
* Project  
* AuditLog

  ---

  ## **B.2.1 Organization**

Represents the corporate structure under which all business activities operate.

### **Key Attributes**

* Organization ID  
* Organization Name  
* Organization Type (Corporate / Franchise)  
* Status  
* Created Date  
* Modified Date

  ### **Relationships**

Organization

→ Strategic Business Units (SBUs)

→ Zones

→ Teams

→ Users

### **Purpose**

Supports:

* Multi-SBU operations  
* Multi-Zone operations  
* Data segregation  
* Consolidated reporting  
  ---

  ## **B.2.2 Strategic Business Unit (SBU)**

Represents major business divisions within Cabio.

### **Examples**

* Imaging Division  
* Critical Care Division  
* Service Division  
* Calibration Division  
* Refurbishment Division  
* Academy Division  
* Manufacturing Division  
* Digital Health Division  
* Equipment-as-a-Service Division

  ### **Key Attributes**

* SBU ID  
* Organization ID  
* SBU Name  
* Description  
* Status  
  ---

  ## **B.2.3 State**

Represents states within Cabio's geographic operating structure.

Key Attributes

* StateID  
* StateName  
* Status

## **B.2.4 Zone**

Represents geographic sales coverage areas.

Key Attributes

* ZoneID  
* StateID  
* ZoneName  
* Status  
* CreatedDate   
* CreatedBy 

Examples

* South Kerala  
* North Kerala

Purpose

Supports:

* Geographic coverage management  
* Reporting  
* User assignment  
* Access control  
* Sales planning

---

## **B.2.4A PINCodeGeoMapping** 

Represents geographic mapping between customer PIN Codes and sales coverage areas.

Key Attributes

* PINCode  
* ZoneID  
* TerritoryID 

Purpose

Supports:

* Geographic assignment  
* Reporting  
* Territory Management  
* Sales coverage planning 

---

## **B.2.5 User**

Represents employees and authorized users of the platform.

**Key Attributes** 

* UserID  
* EmployeeCode  
* Name  
* Email  
* Mobile  
* RoleID  
* TeamID  
* SBUID  
* ZoneID  
* TerritoryID  
* ExternalEmployeeReference  
* Status  
* CreatedDate   
* CreatedBy 

---

## **B.2.6 Customer**

Represents organizations with whom Cabio maintains commercial relationships.

**Key Attributes**

* CustomerID  
* CustomerName  
* ParentCustomerID (Nullable)  
* CustomerType  
* CustomerClass  
* CustomerTier   
* CustomerStatus  
* CustomerSentiment  
* State  
* District  
* City  
* PINCode  
* PrimaryAccountManagerID  
* FinancialBehavior  
* Status  
* CreatedDate  
* CreatedBy  
* ModifiedDate  
* ModifiedBy 

**Customer Types**

* Multispeciality Hospital  
* Specialty Hospital  
* Diagnostic Center  
* Clinic  
* Dealer  
* Medical College Hospital  
* Government Hospital  
* Other

**Customer Classes**

* A   
* B   
* C   
* D 

**Customer Tier:** Represents strategic importance. 

* Tier 1 \= Strategic Account  
* Tier 2 \= Important Account  
* Tier 3 \= Standard Accoun**t** 

**Customer Status**

* Prospect  
* Active  
* Inactive  
* Blocked 

**Financial Behavior**

* Good Paymaster  
* Problematic Payer

**Customer Sentiment**

* Promoter  
* Neutral  
* Detractor

Note

Zone and Territory assignments shall be derived through PINCodeGeoMapping and shall not be stored directly on the Customer entity.

## **B.2.6B CustomerAccountManager**

Represents customer ownership assignments.

**Key Attributes**

* CustomerAccountManagerID  
* CustomerID  
* UserID  
* Role  
* EffectiveFrom  
* EffectiveTo  
* Status

**Roles**

* Primary  
* Secondary  
  ---

  ## **B.2.7 Stakeholder**

Represents individuals associated with customer organizations.

### **Key Attributes**

* Stakeholder ID  
* Customer ID  
* Name  
* Designation  
* Department  
* Mobile  
* WhatsAppNumber   
* Email  
* Influence Level  
* Decision Role  
* Status  
* CreatedDate  
* CreatedBy  
* ModifiedDate  
* ModifiedBy 

  ### **Decision Roles**

* User  
* Influencer  
* Evaluator  
* Approver  
* Buyer  
  ---

  ## **B.2.8 Product**

Represents any sellable, serviceable, trainable, or billable offering.

### **Examples**

* Ultrasound Equipment  
* Ventilator  
* CT Scanner  
* Calibration Service  
* AMC Package  
* AI Diagnostic Subscription  
* Training Program

  ### **Key Attributes**

* Product ID  
* Product Family  
* Product Category  
* Brand  
* Model  
* Product Type  
* OEM ID  
* WebsiteURL   
* SBU ID  
* Status  
* CreatedDate   
* CreatedBy 

  ### **Product Types**

* Equipment  
* Service  
* Subscription  
* Training  
* Spare Part  
* Consumable  
  ---

  ## **B.2.8A ProductDocument**

  ### **Key Attributes**

* ProductDocumentID  
* ProductID  
* DocumentType  
* URL  
* DocumentID (Nullable)  
* Status

**Document Types:**

* Brochure  
* Spec Sheet  
* Pricing Guide  
* Training Material  
* Video  
  ---

  ## **B.2.9 OEM**

Represents manufacturers and strategic supplier partners.

### **Examples**

* Sonoscape  
* GE Healthcare  
* Mindray  
* Philips  
* Siemens

  ### **Key Attributes**

* OEM ID  
* OEM Name  
* PrimaryContact  
* SupportContact   
* Partnership Status  
* Status

  ### **Purpose**

Supports:

* OEM relationship management  
* Installed base reporting  
* Demo support coordination  
* Warranty management visibility  
* Joint marketing initiatives  
* OEM performance reporting  
  ---

  ## **B.2.10 Installed Asset**

Represents a commercial and customer-intelligence view of equipment installed at customer locations.

The authoritative operational service records may continue to reside within the Service Management System and may be synchronized into Sales OS as required.

### **Key Attributes**

* Installed Asset ID  
* Product ID  
* Customer ID  
* Serial Number  
* Installation Date  
* Warranty Start Date  
* Warranty End Date  
* Asset Status  
* Service System Asset Reference  
* Source System  
* Last Sync Date

  ### **Purpose**

Supports:

* Installed base intelligence  
* Replacement cycle forecasting  
* Customer 360 visibility  
* Reference customer identification  
* AMC opportunity identification  
* Upsell opportunity identification  
  ---

  ## **B.2.11 Contract**

Represents commercial agreements between Cabio and customers.

### **Contract Types**

* Capital Sale  
* AMC  
* CMC  
* Subscription  
* Revenue Share  
* Pay Per Use  
* Lease

  ### **Key Attributes**

* Contract ID  
* Contract Type  
* Customer ID  
* Installed Asset ID  
* Contract Start Date  
* Contract End Date  
* Contract Value  
* External Contract Reference  
* Source System  
* Last Sync Date  
* Status

  ### **Purpose**

Provides a unified framework for current and future commercial models.

---

## **B.2.12 Activity**

Represents customer-facing interactions across business functions.

### 

### **Key Attributes**

* Activity ID  
* Activity Type  
* Customer ID  
* StakeholderID (Nullable)   
* Project ID (Nullable)  
* OpportunityID (Nullable)   
* Installed Asset ID (Nullable)  
* User ID  
* Activity Date  
* Outcome  
* Notes

**Activities Types**

* Scanning  
* Phone Call  
* Field Visit  
* Demo  
* Negotiation Meeting  
* Proposal Discussion  
* Installation Feedback  
* Service Feedback  
* Training Session  
* Other 

OpportunityID nullable because Relationship-management activities may exist before opportunity creation.

---

## **B.2.13 Document**

Represents documents associated with business entities.

### **Examples**

* Quotations  
* Installation Certificates  
* PNDT Approvals  
* Form B Documents  
* Contracts  
* OEM Documentation  
* Training Certificates

  ### **Key Attributes**

* Document ID  
* Customer ID (Nullable)  
* Opportunity ID (Nullable)  
* Contract ID (Nullable)   
* Document Type  
* Version  
* Upload Date  
* Uploaded By  
* Status

  ### **Purpose**

Provides a centralized document management framework across current and future business modules.

---

# **B.2.14 Team**

Represents logical sales teams operating within the organization.

## **Key Attributes**

* TeamID  
* TeamName  
* ManagerID  
* SBUID  
* ZoneID  
* TerritoryID  
* Status 

  ## **Purpose**

Supports:

* Target allocation  
* Reporting  
* Team-based visibility  
* Forecasting  
* Opportunity ownership  
* Performance management  
  ---

  # **B.2.15 Territory**

Represents geographic subdivisions within a Zone.

Key Attributes

* TerritoryID  
* ManagerID   
* ZoneID  
* TerritoryName  
* Status  
* CreatedDate   
* CreatedBy 

Example

Zone

* South Kerala  
  Territories  
* Kochi Territory  
* Trivandrum Territory  
* Kottayam Territory 

Purpose Supports:

* Territory ownership  
* Beat planning  
* Access control  
* Reporting  
* Sales planning

Territory is an operational geographic entity within Phase 1 and supports sales ownership, beat planning, reporting, visibility controls and performance management.

---

# 

# **B.2.16 NextAction** 

Represents follow-up actions arising from customer interactions.

**Key Attributes**

* NextActionID  
* ActivityID  
* OpportunityID (Nullable)  
* AssignedToUserID  
* ActionDescription  
* DueDate  
* Priority  
* Status  
* CompletedDate  
* CompletedBy

**Status:**

* Open  
* Completed  
* Cancelled  
* Deferred

**Priority:**

* High  
* Medium  
* Low  
  ---

  # **B.2.17 AuditLog**

  **Key Attributes**  
* AuditLogID  
* EntityName  
* EntityID  
* FieldName  
* OldValue  
* NewValue  
* ChangedBy  
* ChangedDate


  # 

  # **B.3 Phase 1 Sales OS Data Model**

The following entities are application-specific entities required for the approved Phase 1 Sales OS implementation.

---

## **B.3.2 Opportunity**

Represents qualified revenue opportunities.

### **Key Attributes**

* OpportunityID  
* CustomerID  
* ProductID  
* SBUID  
* ProjectID (Nullable)  
* OpportunityOwnerID  
* LeadSource   
* OpportunityType   
* Stage  
* State  
* Probability  
* OpportunityValue  
* CreatedDate  
* LastModifiedDate   
* ExpectedCloseDate  
* IsHighPriority  
* CompetitorID (Nullable)  
* CompetitorProduct (Nullable)  
* LossReason (Nullable)   
* HoldReason (Nullable)  
* HoldNotes (Nullable)  
* ExpectedReactivationDate (Nullable)   
* LastReviewedDate

  ### LeadSource (identifies how the opportunity originated)

* IndiaMART  
* Scanning  
* Marketing Campaign  
* CME Event  
* Referral  
* Demonstration  
* Direct Enquiry  
* Existing Customer  
* OEM Referral  
* Other

  ### OpportunityType (identifies the commercial nature of the opportunity)

* New Business  
* Replacement  
* Expansion  
* Project  
* Other

Stages

* Lead  
* Qualified  
* Demo  
* Negotiation  
* Closed Won  
* Closed Lost

States

* Active  
* On Hold

Add note:

Zone and Territory shall be derived through Customer → PIN Code → Geographic Mapping.

---

## **B.3.3 Opportunity Team**

Supports shared ownership and contribution allocation.

### **Key Attributes**

* Opportunity Team ID  
* Opportunity ID  
* User ID  
* Team Role  
* Contribution Percentage  
* Approval Status

  ### **Team Roles**

* Primary Owner  
* Application Engineer   
* Star Closer  
* Account Manager   
  ---

  ## **B.3.4 Project** 

Represents customer initiatives that may involve multiple opportunities.

Key Attributes

* ProjectID  
* CustomerID  
* ProjectName  
* Status  
* ExpectedCloseDate

Purpose

Provides architectural readiness for future Project Opportunity Management capabilities.

Project functionality is not included within the approved Phase 1 operational scope.

---

## **B.3.7 Quarterly Target**

Stores target allocations.

### **Key Attributes**

* UserID  
* SBUID  
* Quarter  
* RevenueTarget  
* OpportunityTarget   
  ---

  ## **B.3.8 Forecast Snapshot**

Stores historical forecast data for reporting and auditability.

### **Key Attributes**

* Snapshot Date  
* Forecast Value  
* Pipeline Value  
* Coverage Ratio  
* SBUID  
* ZoneID  
* TerritoryID   
  ---

  ## **B.3.9 Customer Feedback**

Captures customer sentiment and satisfaction information.

### **Key Attributes**

* FeedbackID  
* CustomerID  
* ActivityID  
* FeedbackType  
* Rating  
* Comments  
* Date   
  ---

  ## **B.3.10 BeatPlan**

  Represents quarterly account coverage plans prepared by sales representatives. 

  ### **Key Attributes**

* BeatPlanID  
* UserID  
* Quarter  
* Status  
* SubmittedDate  
* ApprovedBy  
* ApprovedDate  
  Purpose Supports:  
* Quarterly planning  
* Beat plan approvals  
* Coverage monitoring  
* Beat plan execution reporting 


## **B.3.11 BeatPlanAccount**

Represents customer accounts included within an approved Beat Plan.

### **Key Attributes**

* BeatPlanAccountID  
* BeatPlanID  
* CustomerID  
* PlannedVisitCount  
* StrategicObjective  
* ExpectedRevenue

Supports:

* Planned account coverage  
* Visit planning  
* Strategic objective tracking  
* Beat plan execution reporting   
  ---

  # **B.4 Architectural Principles**

The Core Enterprise Data Model shall remain stable and reusable across future business applications.

Future business capabilities shall primarily be introduced through additional application-layer entities and modules while continuing to leverage the Core Enterprise Data Model.

Examples of future modules include:

* Advanced Sales Operations  
* AMC Lifecycle Management  
* Calibration Management  
* Refurbishment Management  
* Academy & Training Management  
* Digital Health Services  
* Equipment-as-a-Service  
* Advanced Analytics  
* Franchise Management

These future modules shall extend the platform without requiring fundamental redesign of the Core Enterprise Data Model.

---

# **B.5 System of Record Ownership**

To support a scalable integrated ecosystem, each business entity shall have a clearly defined System of Record.

| Entity | System of Record |
| ----- | ----- |
| Customer | Sales OS |
| Stakeholder | Sales OS |
| Opportunity | Sales OS |
| Product | Sales OS |
| User | Sales OS |
| Installed Asset | Service System (Synchronized to Sales OS) |
| Service History | Service System |
| Warranty Information | Service System |
| Invoice | Finance System |
| Payment | Finance System |
| Collections | Finance System |
| OEM Information | Sales OS |
| Documents | Sales OS |

This governance model ensures clear ownership, reduces data duplication, and simplifies future integrations across enterprise systems.

