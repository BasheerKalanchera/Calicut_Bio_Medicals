# Cabio Sales OS - UI & Form Inventory

This document provides a detailed inventory of the screens, navigation structure, forms, and input elements reverse-engineered from the React prototype ([App.jsx](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx)).

---

## 1. Application Layout & Navigation Structure

The system is deployed as a single-page responsive dashboard layout where views are conditionally rendered based on the active view state variable (`view`), synchronized to the `localStorage` key `sales_os_view`.

### 1.1 Sidebar Sections & View IDs
The navigation sidebar (L1904 – L1966) is structured into logical sections:

| Section | Menu Item | View ID | Visibility Rules | Icon |
| :--- | :--- | :--- | :--- | :--- |
| **Sales Planning** | Target Planning | `settings` | Manager role only | 🎯 |
| | Coverage Planning | `beat-planning` | All users | 📅 |
| **Sales Execution** | Account Management | `customers` / `projects` | All users | 🏥 |
| | Opportunities | `pipeline` / `manager` | All users | 📊 |
| | Next Actions | `reminders` | All users | ✅ |
| **Performance** | Insights | `insights` | All users | 💡 |
| **Administration** | Product Catalog | `catalog` | All users | 📦 |
| | Users | `users` | Admin roles only (`isAdmin`) | 👥 |

### 1.2 Acting Role Switcher (L1968 – L1991)
* **Location:** Rendered at the bottom of the sidebar.
* **Component Type:** Native HTML `<select>` dropdown.
* **Options:** Mapped from `Manager` plus all active names in the user master state.
* **Security & Routing Event:** 
  - Triggers an `onChange` listener.
  - Switches session context (`currentUser`) and derives admin permission `isAdmin`.
  - If the new user is a non-admin, the system automatically redirects them to the default deals pipeline: `if (!isNewAdmin) setView("pipeline")`.

### 1.3 Customer 360 View Workspace (L3997 – L4800)
* **Trigger:** Conditionally rendered when a customer account is selected (`selectedAccount` state is non-null).
* **UI Layout:** Full-screen detail overlay panel controlled by a sub-tab navigation state (`active360Tab` local state).
* **Sub-Tabs Inventory:**
  1. **Overview Tab (L4098):** Displays customer profile details (Name, Zone, City, Class, Specialty, Type, and Parent Corporate Group lookup). Includes interactive selectors to update:
     - *NPS Status / Customer Sentiment:* Select dropdown (`Promoter`, `Neutral`, `Detractor`). Captures `selectedAccount.npsStatus`.
     - *Payer Status / Financial Behavior:* Select dropdown (`Good Paymaster`, `Average Payer`, `Problematic Payer`, `Unknown Payer`). Captures `selectedAccount.payerStatus`.
  2. **Stakeholders Tab (L4428):** Lists contact details of stakeholders associated with this customer. Includes buttons to add/remove contacts.
  3. **Projects Tab (L4517):** Renders corporate projects associated with this hospital. Links to the Project Creation modal.
  4. **Opportunities Tab (L4578):** Displays a listing of all opportunities associated with this hospital (active, won, lost), including value and win probability.
  5. **Installed Base Tab (L4646):** Lists hardware assets installed at this account. Provides `+ Log Asset` button linking to Asset logging form.
  6. **Activity Timeline Tab (L4693):** Unified vertical feed of activity interaction logs and pending/completed action items.

### 1.4 Global UI Indicators & State Toggles
* **Mobile Sidebar Toggle (`isSidebarOpen`):** State toggle to control responsive sidebar drawers on mobile screens.
* **Custom Alert Interceptor (`customAlert` L388):** A central intercept modal that renders alert messages, warning indicators, and operation success dialogs dynamically.
* **Toast Notification Banner (`hideHaroonNotification` L387):** Simulator toast banner at the top of the interface showing real-time urgent updates.

---

## 2. Interactive Dialogs & Form Fields

The system leverages modal dialogs and overlays to capture operational inputs. Below is the field-level registry for all system forms.

### 2.1 Customer Account Creation Form (L4920 – L5040)
* **Rendered:** Step 1 of the New Lead Wizard (if creating a new customer) or within the Customer list view.
* **Fields:**
  * **Account Name:** Text input. Captures `newCustomerName`. *(Required)*
  * **Zone:** Select dropdown. Options: `North Kerala`, `South Kerala`, `Central Kerala`, `Bangalore`. Captures `newCustomerZone`.
  * **City:** Text input. Captures `newCustomerCity`.
  * **Class:** Select dropdown. Options: `Class A`, `Class B`, `Class C`, `Class D`, `Corporate`, `Clinic`. Captures `newCustomerClass`.
  * **Specialty:** Select dropdown. Options: `General`, `Multi Speciality`, `Urology`, `Ortho`, `Cardiac`, `IVF`, `Cardiology`, `Radiology`, `Gynecology`, `Pediatrics`. Captures `newCustomerSpecialty`.
  * **Customer Type:** Select dropdown. Options: `Corporate Group`, `Hospital`, `Department`. Captures `newCustomerType`.
  * **Parent Customer:** Autocomplete text search lookup against the customer database. Captures `newParentCustomerId`.

### 2.2 New Lead Wizard Form (L5041 – L5197)
* **Step 1: Account Context Selection**
  * progressive text input searching existing hospitals and cities. Clicking an item sets `selectedCustomerId`.
  * Alternatively, a dashed border button (`+ Create New Account`) opens the Customer Creation form inline.
* **Step 2: Opportunity Details**
  * **Category Selector:** Tabs switching between `Ultrasound` and `Critical Care` (updates `wizardCategoryFilter`).
  * **Products Catalog Grid:** Checkbox list filtering items mapped to the active category. Checking items appends `productId` to the `selectedProducts` array and auto-populates the opportunity requirement description.
  * **Lead / Deal Requirement:** Text input. Captures `leadName`. *(Required)*
  * **Lead Source:** Select dropdown. Options: `Direct Inquiry`, `Website`, `Referral`, `Field Scanning`, `IndiaMart`, `OEM Referral`, `CME Event`. Captures `leadSource`.
  * **Campaign:** Text input. Captures `leadCampaign`.
  * **Expected Value (₹ Lakhs):** Numeric input. Captures `leadValue`. *(Required)*
  * **Associated Project:** Select dropdown list filtering projects linked to the customer. Captures `selectedProjectId`.

### 2.3 Edit Opportunity Form (L5289 – L6245)
A detailed overlay that segments the opportunity fields into 4 tabs:
* **Overview Tab:**
  * **Deal Name:** Text input. Captures `editLeadData.name`.
  * **Stage:** Select dropdown. Options: `Lead`, `Qualified`, `Demo`, `Negotiation`, `Order`, `Closed Won`, `Lost`.
  * **Deal Value:** Text input. Captures `editLeadData.value` (Lakhs).
  * **Forecast Status:** Select dropdown toggle. Options: `Active` (contributing to forecast) or `On Hold` (paused, excluded).
  * **On Hold Details:** (Rendered only if status is `On Hold`):
    - *Hold Reason:* Select dropdown. Options: `Budget Approval Pending`, `Customer Internal Approval`, `Regulatory Approval`, `Competitor Action`, `Other`.
    - *Expected Reactivation Date:* Date picker.
    - *Hold Notes:* Textarea.
  * **Budget Range:** Text input. Captures `editLeadData.budgetRange`.
  * **Demo Date:** Date picker. Captures `editLeadData.demoDate`.
  * **Demo Outcome:** Select dropdown. Options: `Pending`, `Product approved`, `Product rejected`, `Demo not required`.
  * **Expected Closure Date:** Date picker. Captures `editLeadData.closureDate`.
  * **Interaction Notes:** Textarea. Captures `editLeadData.activityInput`. *(Required if stage changes)*
  * **Next Action Scheduler:** Checkbox toggle (`isSchedulingFollowUp`). If checked, opens:
    - *Next Action Date:* Date picker.
    - *Next Action Description:* Text input.
* **Products Tab:** Checkbox grid containing all catalog items to associate with the deal.
* **Contacts Tab:** Stakeholder contacts list, with a `+ Add Stakeholder` button leading to the Stakeholder form.
* **Team Tab:** Splits list of contributors. Rep name dropdown, Role dropdown, and split percentage input. *Note: Sum of contributor splits must equal exactly 100% to save changes on transition to Order stage (validated inside handler L6098-L6108).*

### 2.4 Coverage / Beat Planning Form (L8012 – L8221)
* **Quarter:** Select dropdown. Options: `Q1 2026`, `Q2 2026`, `Q3 2026`, `Q4 2026`.
* **Hospital Allocation Grid:** Dynamic table with addable/removable rows:
  * **Hospital Lookup:** Progressive search select matching customer directory (`customerType === "Hospital"`).
  * **Planned Visits:** Numeric spinner. Default: `1`.
  * **Expected Revenue (₹ Lakhs):** Numeric input. Default: `0`.
  * **Strategic Objective:** Text input.

### 2.5 SBU Target Settings Form (L6289 – L6668)
* **Corporate Target:** Numeric input (Crores). Captures overall corporate goal.
* **Imaging SBU Target:** Numeric input (Crores).
* **Critical Care SBU Target:** Numeric input (Crores).
* **Representative Quotas list:** Grouped list of active representatives. Displays Rep Name, SBU, Zone, and editable Quota input field (Lakhs).

### 2.6 Project Creation Form (L7545 – L7694)
* **Project Name:** Text input. Captures `formProjectName`. *(Required)*
* **Customer Name Lookup:** Text input lookup search matching customers. Captures `formCustomerId`. *(Required)*
* **Project Type:** Select dropdown. Options: `New Hospital Build`, `Expansion`, `Equipment Upgrade`, `Renovation`, `Digital Transformation`.
* **Status:** Select dropdown. Options: `Planning`, `Active`, `On Hold`, `Completed`.
* **Expected Close Date:** Date picker.

### 2.7 User Management Form (L6788 – L7005)
* **User Name:** Text input. Captures `newUserName`. *(Required)*
* **Employee ID:** Text input. Pre-populated sequentially. Captures `newUserEmployeeId`.
* **Mobile Number:** Text input. Captures `newUserMobile`.
* **Email Address:** Text input. Captures `newUserEmail`.
* **Role:** Select dropdown. Options: `Sales Executive`, `Sales Manager`, `General Manager`, `Admin`.
* **Zone:** Select dropdown. Options: `North Kerala`, `South Kerala`, `Central Kerala`, `Bangalore`.
* **SBU:** Select dropdown. Options: `Imaging`, `Critical Care`.
* **Reporting Manager:** Select dropdown. Mapped from active managers.
* **Status:** Select dropdown. Options: `Active`, `Inactive`.

### 2.8 Product Catalog Form (L7099 – L7280)
* **Machine Name:** Text input. Captures `newProductName`. *(Required)*
* **Brand:** Text input. Captures `newProductBrand`.
* **Model:** Text input. Captures `newProductModel`.
* **SBU:** Select dropdown. Options: `Imaging`, `Critical Care`.
* **OEM Partner:** Select dropdown. Options: `Sonoscape`, `Magnamed`, `Mindray`, `Edan`, `GE Healthcare`, `Philips`.
* **Price Range:** Text input. Captures `newProductPrice`.
* **Collateral Links:** Addable list rows containing `Label` (text) and `URL` (text).

### 2.9 Log Installed Equipment Asset Form (L6250 – L6285)
* **Equipment Model:** Text input. Captures `newAssetModel`. *(Required)*
* **Installation Date:** Date picker. Captures `newAssetInstallDate`. *(Required)*
* **Service Notes / Status:** Textarea. Captures `newAssetNotes`.

### 2.10 Stakeholder Contact Form (L5205 – L5284)
* **Full Name:** Text input. Captures `newStakeholderName`. *(Required)*
* **Role / Designation:** Text input. Captures `newStakeholderRole`. *(Required)*
* **Phone / WhatsApp:** Text input. Captures `newStakeholderPhone`.
* **Email Address:** Text input. Captures `newStakeholderEmail`.
