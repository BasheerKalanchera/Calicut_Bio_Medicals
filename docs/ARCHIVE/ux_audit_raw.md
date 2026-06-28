# UX Audit Report: React Sales OS Prototype
**Target File**: [App.jsx](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx)  
**Date of Audit**: 2026-06-15  
**Auditor**: UX Audit Agent  

---

## 1. UI Screens & Navigation Map

The prototype implements a single-page dashboard layout driven by local React state. The core navigation relies on a collapsible sidebar, a user role selector, and a tab-based layout inside specific screens.

### 1.1 Sidebar Navigation (L1904 – L1966)
Navigation is determined by the `view` state variable (L383), which is synchronized with the local storage key `sales_os_view`. Side menu items are grouped into four sections:
*   **SALES PLANNING**
    *   **Target Planning** (`view === "settings"`, L6289): Visible only when the active user is `Manager` (`currentUser === "Manager"`). Icon: `🎯`.
    *   **Coverage Planning** (`view === "beat-planning"`, L2742): Visually displays Beat Plan cards. Icon: `📅`.
*   **SALES EXECUTION**
    *   **Account Management** (`view === "customers"` / `view === "projects"`, L2422): Features a two-tab sub-view (Customers & Projects). Icon: `🏥`.
    *   **Opportunities** (`view === "pipeline"` / `view === "manager"`, L2043): The core sales pipeline view. Displays opportunities in Kanban or List form. Icon: `📊`.
    *   **Next Actions** (`view === "reminders"`, L2348): Display of pending tasks/reminders. Icon: `✅`.
*   **PERFORMANCE**
    *   **Insights** (`view === "insights"`, L3241): Sales analytics and statistics. Icon: `💡`.
*   **ADMINISTRATION**
    *   **Product Catalog** (`view === "catalog"`, L3114): Listing of machines, brands, and price points. Icon: `📦`.
    *   **Users** (`view === "users"`, L6673): User directory management. Visible only if the user has admin rights (`isAdmin === true`). Icon: `👥`.

### 1.2 Acting Role Switcher (L1968 – L1991)
Located at the bottom of the sidebar, this dropdown selector updates `currentUser` (L381), stored in local storage as `sales_os_currentUser`.
*   **Options**:
    *   👑 Manager (defaults to Administrator, role `Sales Manager`)
    *   👤 Rep name list mapped dynamically from the `users` array (L1983-L1987).
*   **Behavior**:
    *   Selecting a non-admin role triggers a view reset: `if (!isNewAdmin) setView("pipeline")` (L1978) to redirect to the opportunity pipeline.
    *   `isAdmin` is derived at L1844: `const isAdmin = currentUser === "Manager" || users.find(u => u.name === currentUser)?.role === "Admin"`.

### 1.3 Modals, Overlays & Detail Panels
*   **New Lead Modal Wizard** (`showNewLead`, L4912): Multi-step overlay wizard for adding customers and opportunities.
*   **Edit Opportunity Modal** (`isEditingLead` & `editLeadData`, L5289): A tabbed detailed form for updates.
*   **Project Creation/Edit Modal** (`isProjectModalOpen`, L7545): Popup form to create/edit projects.
*   **Beat Plan Detail Overlay** (`selectedBeatPlan`, L7698): Fullscreen overlay showcasing coverage metrics and account lists.
*   **Beat Plan Form Modal** (`isBeatPlanModalOpen`, L8012): Creation/edit screen for beat plans containing dynamically added hospital rows.
*   **User Management Create/Edit Modal** (`isUserModalOpen`, L6788): Modal form for manager/admin roles to create/edit platform users.
*   **Product Management Modal** (`isProductModalOpen`, L7099): Form for modifying or creating machine records in the catalog.
*   **Asset Form Modal** (`showAssetModal`, L6252): Overlay to log equipment assets under specific hospital accounts.
*   **Stakeholder Modal** (`isAddingStakeholder`, L5205): Add/update contact modal inside hospital details or opportunity forms.
*   **Custom Alert Modal** (`customAlert`, L8224): Unified popup dialog showing warnings, validation errors, and successes.

---

## 2. Form Inventory & Stage Exit Criteria

### 2.1 Customer / Account Creation Form (L4920 – L5040)
Rendered during Step 1 of the Lead Wizard or from the Customer Directory when `isCreatingCustomer === true`.
*   **Fields**:
    *   `Account Name` (`newCustomerName`): Text input. Required.
    *   `Zone` (`newCustomerZone`): Dropdown select (`North Kerala`, `South Kerala`, `Bangalore`). Default: `North Kerala`.
    *   `City` (`newCustomerCity`): Text input.
    *   `Class` (`newCustomerClass`): Dropdown select (`Class A`, `Class B`, `Class C`, `Class D`, `Corporate`, `Clinic`). Default: `Class A`.
    *   `Specialty` (`newCustomerSpecialty`): Dropdown select (`General`, `Multi Speciality`, `Urology`, `Ortho`, `Cardiac`, `IVF`, `Cardiology`, `Radiology`, `Gynecology`, `Pediatrics`). Default: `General`.
    *   `Customer Type` (`newCustomerType`): Dropdown select (`Corporate Group`, `Hospital`, `Department`). Default: `Hospital`.
    *   `Parent Customer` (`newParentCustomerId`): Auto-suggest lookup against existing `customers` list. (Sets `newParentCustomerId` and `parentSearchText`).
*   **Validation**: Save button is disabled unless `newCustomerName.trim()` is true (L5038).
*   **Exit / Save Handler** (`handleSaveCustomer`, L1576): Adds a customer record to `customers` state, sets `selectedCustomerId` to the newly created account, resets form states, and returns to Step 1 of the opportunity creation wizard.

### 2.2 New Lead Wizard Form (L5041 – L5197)
Multi-step dialog to register an opportunity for a customer.
*   **Step 1: Select Account (L5041 – L5098)**
    *   Input: Progressive Search input (`customerSearchText`) matching existing hospital names or cities.
    *   Alternate Action: Button to trigger the New Customer Form (Step 2.1).
    *   Exit Criteria: A customer must be selected (`selectedCustomerId` is set) to click "Next Steps" (L5094) and progress to Step 2.
*   **Step 2: Lead Details (L5100 – L5197)**
    *   Input: Category Filter tabs (Ultrasound vs Critical Care) to filter the product selection catalog (L5104-L5138).
    *   Input: Products selection checkbox list (L5141-L5150) that dynamically concatenates names to populate `leadName`.
    *   Input: `Lead / Deal Requirement` (`leadName`): Text input. Required.
    *   Input: `Lead Source` (`leadSource`): Dropdown (`Direct Inquiry`, `Website`, `Referral`, `Field Scanning`, `IndiaMart`). Default: `Direct Inquiry`.
    *   Input: `Campaign` (`leadCampaign`): Text input.
    *   Input: `Expected Value` (`leadValue`): Numeric input representing Lakhs. Required.
    *   Input: `Associated Project` (`selectedProjectId`, L541): Dropdown matching active projects.
*   **Exit Criteria**: "Create Lead" is disabled unless `leadName.trim()` and `leadValue.trim()` are non-empty (L5191).
*   **Exit / Save Handler** (`createLead`, L1626):
    *   **Split Opportunity Logic** (L1643): If products belong to BOTH `Ultrasound` and `Critical Care` categories, it automatically splits the lead into two opportunities sharing a common `groupId` (`GRP-${Date.now()}`), sets expected values to `"₹0L"`, and assigns each split to the respective zone representative from `categoryAssignments`.
    *   Otherwise: Saves a single opportunity using `leadValue` formatted as `₹${leadValue}L` and assigns ownership to the representative defined in the routing map for that zone and product category.

### 2.3 Edit Opportunity Form (L5289 – L6245)
Tab-based modal configuration.
*   **Overview Tab (L5423)**:
    *   `Deal Name` (`editLeadData.name`): Text input.
    *   `Stage` (`editLeadData.stage`): Dropdown (`Lead`, `Qualified`, `Demo`, `Negotiation`, `Order`, `Closed Won`, `Lost`).
    *   `Deal Value` (`editLeadData.value`): Text input.
    *   `Forecast Status` (`editLeadData.state`): Dropdown (`Active` - contributing, `On Hold` - paused, excluded).
    *   If `On Hold`: `Hold Reason` dropdown (`Budget Approval Pending`, `Customer Internal Approval`, `Regulatory Approval`, `Competitor Action`, `Other`), `Reactivation Date` (date picker), and `Hold Notes` (textarea) are rendered.
    *   `Budget Range` (`editLeadData.budgetRange`): Text input (e.g. "₹20L - ₹25L").
    *   `Demo Date` (`editLeadData.demoDate`): Date input.
    *   `Demo Outcome` (`editLeadData.demoOutcome`): Dropdown select.
    *   `Expected Closure Date` (`editLeadData.closureDate`): Date input.
    *   `Interaction Notes` (`editLeadData.activityInput`): Textarea (Required if stage changes).
    *   `Next Action Date` (`editLeadData.followUpDate`) & `Reminder Text` (`editLeadData.followUpText`): Checkbox-triggered follow-up scheduler.
*   **Products Tab (L5803)**:
    *   Visual catalog checkboxes to add/remove products (`productIds`).
*   **Contacts Tab (L5830)**:
    *   List of associated contacts. Includes "+ Add Stakeholder" button.
*   **Team Tab (L5898)**:
    *   Interactive contributor list with role selections (`Account Manager`, `Product Specialist`, clinical roles) and percentage splits (`split`). Total split sum must equal 100% (L6100).
*   **Stage Exit Criteria (Validated on Save - L6009)**:
    1.  **Lead ➔ Qualified** (L6018): Requires `productIds` to be non-empty and `budgetRange` to be defined.
    2.  **Qualified ➔ Demo** (L6030): Requires `demoDate` to be populated (unless `demoOutcome` is set to "Demo not required").
    3.  **Demo ➔ Negotiation** (L6042): Requires `demoOutcome` and `expectedClosureDate` (mapped as `closureDate` or `expectedClosureDate`) to be set.
    4.  **Negotiation ➔ Order** (L6055): Requires:
        *   Non-zero deal value (`cleanVal > 0`).
        *   At least one selected product in `productIds`.
        *   `handoverOwner` (handover coordinator) is set.
        *   `deliveryNotes` is non-empty.
        *   Team split total must be exactly `100%`.
    5.  **Order ➔ Closed Won** (L6132): Requires `poNumber` and at least one product in `productIds`.
    6.  **Any Stage ➔ Lost** (L6112): Requires `lostCompetitor` and `lostReason`.
    7.  **Interaction Notes on Stage Transition** (L6152): If the stage changes, interaction notes (`activityInput`) must be filled out. Note validation messaging changes depending on target stage (Lost ➔ Loss Details, Negotiation ➔ Negotiation Summary, Closed Won ➔ Closed Won Notes, general ➔ Interaction Notes).

### 2.4 Coverage / Beat Planning Form (L8012 – L8221)
*   **Fields**:
    *   `Quarter` (`formBeatPlanQuarter`): Select dropdown (`Q1 2026`, `Q2 2026`, `Q3 2026`, `Q4 2026`).
    *   `Hospitals Planned` list (`formBeatPlanAccounts`): Addable/removable rows.
        *   `Hospital Name` (`searchText`): Dropdown lookup filtering `customers` where `customerType === "Hospital"`. Sets `customerId` and `customerName`.
        *   `Planned Visits` (`plannedVisitCount`): Number input. Default: `1`.
        *   `Expected Revenue (₹L)` (`expectedRevenue`): Number input. Default: `0`.
        *   `Strategic Objective` (`strategicObjective`): Text input.
*   **Validation**: Save/Submit are disabled unless `isFormValid` (L8013) resolves to true:
    *   `formBeatPlanQuarter` is chosen.
    *   At least 1 hospital row is added.
    *   For every row: `customerId` is selected, `plannedVisitCount > 0`, `expectedRevenue >= 0`, and `strategicObjective.trim() !== ""`.
*   **Exit / Save Actions**:
    *   **Save Draft**: Calls `saveBeatPlan(false)`, sets status to `"Draft"`, and closes modal.
    *   **Submit**: Calls `saveBeatPlan(true)`, sets status to `"Submitted"`, stamps `submittedDate` to the current system date, and closes modal.

### 2.5 Target Planning Form (L6289 – L6668)
Available only to the `Manager` role.
*   **Fields**:
    *   `Planning Period`: Buttons representing `annual`, `q1`, `q2`, `q3`, `q4`. Updates `planningPeriod`.
    *   `Workspace Perspective`: Tab buttons (`SBU Allocation` vs `Sales Team Allocation`).
    *   **SBU Perspective (L6444)**:
        *   `Corporate Target`: Number input. (Stores target in Crores in `sbuTargets.overall[period]`).
        *   `Imaging SBU Target`: Number input. (Stores target in `sbuTargets.imaging[period]`).
        *   `Critical Care SBU Target`: Number input. (Stores target in `sbuTargets.criticalCare[period]`).
    *   **Sales Team Perspective (L6628)**:
        *   Representative rows display the name, zone, and a numeric quota value in Lakhs: `repData[rep].target[selectedPeriod]`.
*   **Exit / Live Saving**: Inputs trigger live updates on `onChange` to `sbuTargets` and `repData` (saved directly to localStorage).
*   **Reconciliation Rules**:
    *   SBU allocated targets (`imaging` + `criticalCare`) are compared against Corporate Goal. Difference is highlighted as a Gap / Excess. Status indicators: `Fully Allocated` (difference = 0), `Under Allocated` (difference > 0), or `Over Allocated` (difference < 0).
    *   Representative quotas within each SBU (Imaging or Critical Care) are rolled up (`sum(reps) / 100` to convert to Cr) and reconciled against SBU Targets. Warnings are displayed if representatives' quotas are under-allocated or exceed the SBU targets (L6617-L6625).

### 2.6 Project Creation/Edit Form (L7545 – L7694)
*   **Fields**:
    *   `Project Name` (`formProjectName`): Text. Required.
    *   `Customer Name` (`formCustomerId` & `formCustomerSearchText`): Progressive Search input lookup matching `customers`. Required. (Disabled and locked if pre-populated from hospital page context).
    *   `Project Type` (`formProjectType`): Dropdown select (`New Hospital Build`, `Expansion`, `Equipment Upgrade`, `Renovation`, `Digital Transformation`). Default: `New Hospital Build`.
    *   `Status` (`formProjectStatus`): Dropdown select (`Planning`, `Active`, `On Hold`, `Completed`). Default: `Planning`.
    *   `Expected Close Date` (`formExpectedCloseDate`): Date input.
*   **Validation**: Save button is disabled if `!formProjectName.trim() || !formCustomerId`.
*   **Exit / Save Handler** (`saveProject`, L1355): Creates or updates the project object, updates opportunity references if editing, resets form fields, and closes the modal.

### 2.7 User Management Form (L6788 – L7005)
*   **Fields**:
    *   `User Name` (`newUserName`): Text. Required.
    *   `Employee ID` (`newUserEmployeeId`): Text.
    *   `Mobile Number` (`newUserMobile`): Text.
    *   `Email Address` (`newUserEmail`): Email.
    *   `Role` (`newUserRole`): Dropdown select (`Sales Executive`, `Sales Manager`, `General Manager`, `Admin`). Default: `Sales Executive`.
    *   `Zone` (`newUserZone`): Dropdown select (`North Kerala`, `South Kerala`, `Central Kerala`). Default: `North Kerala`.
    *   `SBU` (`newUserSbu`): Dropdown select (`Imaging`, `Critical Care`). Default: `Imaging`.
    *   `Reporting Manager` (`newUserReportingManager`): Dropdown select (`Sales Manager`, `General Manager`, `Basheer`, `Rahul`, `Amit`). Default: `Sales Manager`.
    *   `Status` (`newUserStatus`): Dropdown select (`Active`, `Inactive`). Default: `Active`.
*   **Validation**: Save button is disabled if `!newUserName.trim()`.
*   **Exit / Save Handler** (L6921): Creates or updates the user object. If a user name changes, the handler cascades the name change to `repData`, `beatPlans` ownership, and `deals` owners/contributors. It resets form values and closes the modal.

### 2.8 Product Catalog Form (L7099 – L7280)
*   **Fields**:
    *   `Machine Name` (`newProductName`): Text. Required.
    *   `Brand` (`newProductBrand`): Text.
    *   `Model` (`newProductModel`): Text.
    *   `SBU` (`newProductSbu`): Dropdown select (`Imaging`, `Critical Care`). Default: `Imaging`.
    *   `OEM Partner` (`newProductOem`): Dropdown select (`Sonoscape`, `Magnamed`, `Mindray`, `Edan`, `GE Healthcare`, `Philips`). Default: `Sonoscape`.
    *   `Price Range` (`newProductPrice`): Text. Default: `TBD` if empty.
    *   `Collateral Links` (`newProductCollaterals`): Dynamic list rows containing `Label` (text) and `URL` (url input).
*   **Validation**: Add/Update button disabled if `!newProductName || !newProductSbu || !newProductOem`.
*   **Exit / Save Handler** (L7243): Maps SBU to product category (`Imaging ➔ Ultrasound`, `Critical Care ➔ Critical Care`), filters out empty collaterals, creates/updates catalog state, resets values, and closes the modal.

### 2.9 Log Equipment / Asset Form (L6250 – L6285)
*   **Fields**:
    *   `Equipment Model` (`newAssetModel`): Text. Required.
    *   `Installation Date` (`newAssetInstallDate`): Date. Required.
    *   `Service Notes / Status` (`newAssetNotes`): Textarea.
*   **Validation**: "Log Asset" button is disabled if `!newAssetModel`.
*   **Exit / Save Handler** (L6274): Prepends asset row `{ id: Date.now(), accountId: selectedAccount.id, type: newAssetModel, installDate: newAssetInstallDate, notes: newAssetNotes }` to `assets`, resets values, and closes the modal.

### 2.10 Stakeholder Form (L5205 – L5284)
*   **Fields**:
    *   `Full Name` (`newStakeholderName`): Text. Required.
    *   `Role / Designation` (`newStakeholderRole`): Text. Required.
    *   `Phone / WhatsApp` (`newStakeholderPhone`): Text.
    *   `Email Address` (`newStakeholderEmail`): Email.
*   **Validation**: Add button disabled if `!newStakeholderName || !newStakeholderRole`.
*   **Exit / Save Handler** (L5260): If editing, updates matching contact in `contacts`. If creating, determines active account scope ID and appends a contact record `{ id, accountId, name, role, phone, email, influenceLevel: "Medium" }` to `contacts`, resets states, and closes the modal.

---

## 3. Prototype Data Model & LocalStorage Schema

The prototype utilizes 17 local storage keys to store structured data records representing the Sales OS entities.

### 3.1 LocalStorage Keys & Data Schemas

#### 1. Current Active Session (`sales_os_currentUser`)
*   **Type**: String  
*   **Default**: `"Manager"` (Maps to Administrator)  

#### 2. View Context (`sales_os_view`)
*   **Type**: String  
*   **Default**: `"pipeline"`  

#### 3. Manager Filter (`sales_os_managerFilter`)
*   **Type**: String  
*   **Default**: `"All"` (Options: `"All"`, `"Zone:North Kerala"`, `"Rep:Basheer"`, etc.)  

#### 4. Sales Representative Assignments (`sales_os_repdata`)
*   **Type**: Object mapping User Name keys to a profile dictionary.
*   **Default**: Mapped from `initialRepData` (L15).
*   **Schema**:
    ```typescript
    {
      [userName: string]: {
        zone: string; // "North Kerala" | "South Kerala" | "Central Kerala"
        target: {
          annual: number; // quota in Lakhs
          q1: number;
          q2: number;
          q3: number;
          q4: number;
        }
      }
    }
    ```

#### 5. SBU Corporate Targets (`sales_os_sbu_targets`)
*   **Type**: Object  
*   **Default**: Mapped from `initialSbuTargets` (L24).
*   **Schema**:
    ```typescript
    {
      overall: { annual: number; q1: number; q2: number; q3: number; q4: number; }; // quota in Crores
      imaging: { annual: number; q1: number; q2: number; q3: number; q4: number; };
      criticalCare: { annual: number; q1: number; q2: number; q3: number; q4: number; };
    }
    ```

#### 6. Product Category Assigned Reps (`sales_os_categoryAssignments`)
*   **Type**: Object mapping Zone to category owners.
*   **Default**:
    ```json
    {
      "North Kerala": { "Ultrasound": "Basheer", "Critical Care": "Amit" },
      "South Kerala": { "Ultrasound": "Amit", "Critical Care": "Basheer" },
      "Bangalore": { "Ultrasound": "Rahul", "Critical Care": "Rahul" }
    }
    ```

#### 7. Sales Teams Matrix (`sales_os_teams`)
*   **Type**: Object mapping reps to list of visible peers.
*   **Default**: `{ "Basheer": ["Basheer", "Rahul"], "Amit": ["Amit"] }`

#### 8. User Directory (`sales_os_users`)
*   **Type**: Array of User objects.
*   **Default**: Array of 6 entries (L264).
*   **Schema**:
    ```typescript
    interface User {
      id: number;
      name: string;
      employeeId: string;
      email: string;
      mobile: string;
      role: "Sales Executive" | "Sales Manager" | "General Manager" | "Admin";
      zone: "North Kerala" | "South Kerala" | "Central Kerala" | "Bangalore";
      sbu: "Imaging" | "Critical Care";
      manager: string;
      status: "Active" | "Inactive";
    }
    ```

#### 9. Customer Accounts Master (`sales_os_customers`)
*   **Type**: Array of Customer objects.
*   **Default**: Initialized with 22 mock entries (L95).
*   **Schema**:
    ```typescript
    interface Customer {
      id: number;
      name: string;
      zone: string;
      city: string;
      customerType: "Hospital" | "Corporate Group" | "Department";
      parentCustomerId?: string; // Links to corporate groups
      class?: string; // "Class A" | "Clinic" | "Corporate"
      specialty?: string; // clinical specialties
    }
    ```

#### 10. Opportunities / Leads Pipeline (`sales_os_deals`)
*   **Type**: Array of Deal objects.
*   **Default**: Mapped from `initialDeals` (L61).
*   **Schema**:
    ```typescript
    interface Deal {
      id: number;
      name: string; // format: "Customer Name – Equipment / Product Info"
      stage: "Lead" | "Qualified" | "Demo" | "Negotiation" | "Order" | "Closed Won" | "Lost";
      value: string; // string representing lakhs (e.g. "₹22L")
      probability: number; // 0 | 10 | 30 | 50 | 70 | 90 | 100
      owner: string;
      supervisoryManager?: string;
      lastActivity: string;
      timeline: Array<{ text: string }>;
      isPriority?: boolean;
      state: "Active" | "On Hold";
      holdReason?: "Budget Approval Pending" | "Customer Internal Approval" | "Regulatory Approval" | "Competitor Action" | "Other";
      holdNotes?: string;
      holdReactivationDate?: string; // YYYY-MM-DD
      projectId?: string;
      projectName?: string;
      groupId?: string; // Shared across split opportunities
      category?: "Ultrasound" | "Critical Care";
      source?: string;
      campaign?: string;
      region?: string;
      poNumber?: string;
      productIds: Array<number>; // catalog item ids
      contributors: Array<{
        user: string;
        role: string;
        split: number; // percentage split (0-100)
      }>;
      budgetRange?: string;
      demoDate?: string;
      demoOutcome?: string;
      handoverOwner?: string;
      deliveryNotes?: string;
      installationRequirements?: string;
      specialCommitments?: string;
      handoverChecklist?: Array<boolean>; // Length 3 checkbox checklist [sales, clinical, service]
      handoverStatus?: "Pending" | "In Progress" | "Completed";
      lostCompetitor?: string;
      lostReason?: string;
    }
    ```

#### 11. Coverage Beat Plans (`sales_os_beat_plans`)
*   **Type**: Array of BeatPlan objects.
*   **Default**: Initialized with 9 records (L138).
*   **Schema**:
    ```typescript
    interface BeatPlan {
      id: string;
      userId: string;
      userName: string;
      quarter: "Q1 2026" | "Q2 2026" | "Q3 2026" | "Q4 2026";
      status: "Draft" | "Submitted" | "Approved";
      createdDate: string; // YYYY-MM-DD
      submittedDate?: string;
      approvedDate?: string;
      approvedBy?: string;
      accounts: Array<{
        id: string;
        beatPlanId: string;
        customerId: string;
        customerName: string;
        plannedVisitCount: number;
        strategicObjective: string;
        expectedRevenue: number; // expected value in Lakhs
      }>;
    }
    ```

#### 12. Corporate Projects Master (`sales_os_projects`)
*   **Type**: Array of Project objects.
*   **Default**: Initialized with 11 projects (L124).
*   **Schema**:
    ```typescript
    interface Project {
      id: string;
      projectName: string;
      projectType: "New Hospital Build" | "Expansion" | "Equipment Upgrade" | "Renovation" | "Digital Transformation";
      status: "Planning" | "Active" | "On Hold" | "Completed";
      expectedCloseDate: string; // YYYY-MM-DD
      customerId: string;
      customerName: string;
    }
    ```

#### 13. Product Catalog Master (`sales_os_catalog`)
*   **Type**: Array of Product objects.
*   **Default**: Initialized with 10 medical machines (L273).
*   **Schema**:
    ```typescript
    interface Product {
      id: number;
      name: string;
      category: "Ultrasound" | "Critical Care";
      priceRange: string;
      brand: string;
      model: string;
      sbu: "Imaging" | "Critical Care";
      oem: "Sonoscape" | "Magnamed" | "Mindray" | "Edan" | "GE Healthcare" | "Philips";
      collaterals: Array<{
        label: string;
        url: string;
      }>;
    }
    ```

#### 14. Stakeholder Contacts Master (`sales_os_contacts`)
*   **Type**: Array of Contact objects.
*   **Default**: Initialized to `[]` empty list (L122).
*   **Schema**:
    ```typescript
    interface Contact {
      id: number;
      accountId: string | number;
      name: string;
      role: string;
      phone: string;
      email: string;
      influenceLevel: "Low" | "Medium" | "High";
    }
    ```

#### 15. Activity Interaction Logs (`sales_os_activities`)
*   **Type**: Array of Activity objects.
*   **Schema**:
    ```typescript
    interface Activity {
      id: string | number;
      accountId: string | number;
      dealId?: string | number | null;
      notes: string;
      purpose: string; // e.g. "Field Visit", "Demo", "Negotiation Meeting", "Proposal Discussion"
      date: string; // formatted date time string or date string
      owner: string;
    }
    ```

#### 16. Action Item Tasks & Reminders (`sales_os_reminders`)
*   **Type**: Array of Reminder objects.
*   **Schema**:
    ```typescript
    interface Reminder {
      id: number;
      accountId: string | number;
      dealId?: string | number;
      text: string;
      dueDate: string; // YYYY-MM-DD
      status: "pending" | "completed";
      owner: string;
    }
    ```

#### 17. Installed Equipment Inventory (`sales_os_assets`)
*   **Type**: Array of Asset objects.
*   **Schema**:
    ```typescript
    interface Asset {
      id: number;
      accountId: string | number;
      type: string; // Equipment model
      installDate: string; // YYYY-MM-DD
      notes: string;
    }
    ```
