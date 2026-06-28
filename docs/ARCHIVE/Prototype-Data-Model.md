# Cabio Sales OS - Prototype Data Model & Storage Schema

This document details the client-side data model, entity structures, and local storage variables reverse-engineered from the React prototype ([App.jsx](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/App.jsx)).

---

## 1. LocalStorage Variables Mappings

The prototype uses 17 distinct key-value pairs stored in the browser's `localStorage` to mock a persistence layer.

| Key | Data Type | Default/Seed Content | Description |
| :--- | :--- | :--- | :--- |
| `sales_os_currentUser` | String | `"Manager"` | Currently logged-in user session context. |
| `sales_os_view` | String | `"pipeline"` | Current active navigation panel ID. |
| `sales_os_managerFilter` | String | `"All"` | Filter for pipeline aggregation (`All` / `Zone:...` / `Rep:...`). |
| `sales_os_repdata` | Object | Mapped from `initialRepData` (L15) | Annual/quarterly targets per representative. |
| `sales_os_sbu_targets` | Object | Mapped from `initialSbuTargets` (L24) | Annual/quarterly targets per SBU. |
| `sales_os_categoryAssignments` | Object | Mapped from routing rules | SBU categories and owners mapped to zones. |
| `sales_os_teams` | Object | Peer visibility lists | Team members mapped to each salesperson. |
| `sales_os_users` | Array | 6 active users | Directory of employees, roles, and zones. |
| `sales_os_customers` | Array | 22 mock customers | Directory of hospital and corporate accounts. |
| `sales_os_deals` | Array | 10 mock deals | Pipeline of active and closed opportunities. |
| `sales_os_beat_plans` | Array | 9 beat plans | Representative quarterly beat plans. |
| `sales_os_projects` | Array | 11 projects | Corporate projects master list. |
| `sales_os_catalog` | Array | 10 products | Catalog of medical equipment, models, and brands. |
| `sales_os_contacts` | Array | Empty `[]` | Master contact list of customer stakeholders. |
| `sales_os_activities` | Array | Empty `[]` | Logged customer-facing interactions. |
| `sales_os_reminders` | Array | Empty `[]` | Task lists, reminders, and follow-ups. |
| `sales_os_assets` | Array | Empty `[]` | Installed base inventory under accounts. |

---

## 2. Entity Schemas & TypeScript Interfaces

Below are the entity structures derived from the React component state definitions:

### 2.1 User Directory (`User`)
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

### 2.2 Customer Accounts (`Customer`)
```typescript
interface Customer {
  id: number;
  name: string;
  zone: string;
  city: string;
  customerType: "Hospital" | "Corporate Group" | "Department";
  parentCustomerId?: string; // Empty string if root level. Links to Corporate Groups.
  class?: string; // "Class A" | "Class B" | "Class C" | "Class D" | "Corporate" | "Clinic"
  specialty?: string; // Clinical specialties (e.g. "Radiology", "Gynecology")
  npsStatus?: "Promoter" | "Neutral" | "Detractor"; // NPS sentiment tracker (defaults to "Neutral")
  payerStatus?: "Good Paymaster" | "Average Payer" | "Problematic Payer" | "Unknown Payer"; // Financial categorization (defaults to "Unknown Payer")
}
```

### 2.3 Opportunities / Deals (`Deal`)
```typescript
interface Deal {
  id: number;
  name: string; // E.g. "Aster Medcity – SonoScape S22 (Ultrasound)"
  stage: "Lead" | "Qualified" | "Demo" | "Negotiation" | "Order" | "Closed Won" | "Lost";
  value: string; // Stored as string "₹[Value]L" (e.g., "₹25L") in state, but inputs capture as float, and calculations parse it dynamically using a helper parseFloat() regex utility
  probability: number; // Win probability percentage (e.g., 10, 30, 50, 70, 90, 100, 0)
  owner: string; // Username of sales executive
  supervisoryManager?: string; // Mapped from routing rules
  lastActivity: string; // Activity log status timestamp (e.g., "Just now")
  timeline: Array<{ text: string }>; // List of historical log items
  isPriority?: boolean; // Star priority deal flag
  state: "Active" | "On Hold";
  holdReason?: "Budget Approval Pending" | "Customer Internal Approval" | "Regulatory Approval" | "Competitor Action" | "Other";
  holdNotes?: string;
  holdReactivationDate?: string; // Date string (YYYY-MM-DD)
  projectId?: string; // Associated project ID reference
  projectName?: string;
  groupId?: string; // Group ID shared across automatically split deals
  category?: "Ultrasound" | "Critical Care";
  source?: string; // Lead source
  campaign?: string; // Campaign metadata
  region?: string; // Derived customer zone
  poNumber?: string; // PO number (mandatory for Closed Won)
  productIds: Array<number>; // Mapped catalog machine item IDs
  contributors: Array<{
    user: string;
    role: string;
    split: number; // Shared ownership split percentage (0-100)
  }>;
  budgetRange?: string; // Required for Qualified and beyond
  demoDate?: string; // Required for Demo and beyond
  demoOutcome?: "Pending" | "Product approved" | "Product rejected" | "Demo not required";
  handoverOwner?: string; // Handover coordinator username
  deliveryNotes?: string;
  installationRequirements?: string;
  specialCommitments?: string;
  handoverChecklist?: Array<boolean>; // 3-element checklist representation [sales, clinical, service]
  handoverStatus?: "Pending" | "In Progress" | "Completed";
  lostCompetitor?: string; // Required if Stage is Lost
  lostReason?: string; // Required if Stage is Lost
}
```

### 2.4 Coverage / Beat Plans (`BeatPlan`)
```typescript
interface BeatPlan {
  id: string; // Unique string ID
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

### 2.5 Corporate Projects (`Project`)
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

### 2.6 Product Catalog (`Product`)
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

### 2.7 Stakeholder Contacts (`Contact`)
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

### 2.8 Activity Interactions (`Activity`)
```typescript
interface Activity {
  id: string | number;
  accountId: string | number;
  dealId?: string | number | null;
  notes: string;
  purpose: string; // e.g. "Field Visit", "Demo", "Negotiation Meeting", "Proposal Discussion"
  date: string; // Timestamp string
  owner: string;
}
```

### 2.9 NextAction Reminders (`Reminder`)
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

### 2.10 Installed Equipment Asset (`Asset`)
```typescript
interface Asset {
  id: number;
  accountId: string | number;
  type: string; // Equipment model name
  installDate: string; // YYYY-MM-DD
  notes: string;
}
```

---

## 3. Baseline Seed Datasets (App.jsx)

The prototype codebase initializes state from several predefined datasets which define the default system records and establish the baseline schema structures:

1. **`initialCustomers` (L95):** A collection of 22 hospital and corporate accounts containing predefined cities, classes, and specialities.
2. **`initialDeals` (L61):** 10 active and closed opportunities seeded with varying stages, values, probabilities, and routing region variables.
3. **`initialCatalog` (L273):** 10 primary medical equipment records representing Sonoscape ultrasounds, Edan scanners, and Magnamed critical care systems, loaded SBU mapping categorizations and collateral link details.
4. **`initialUsers` (L264):** 6 active platform users mapping specific roles (Sales Executive, Sales Manager, GM, Admin) and SBU divisions.
5. **`initialProjects` (L124):** 11 infrastructure developments associated with accounts, providing the baseline for project opportunity tracking.
6. **`initialBeatPlans` (L138):** 9 quarterly target beat plans seeded to demonstrate coverage tracking and progress.

