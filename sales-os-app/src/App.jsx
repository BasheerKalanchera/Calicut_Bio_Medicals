import React, { useState, useEffect } from "react";

const stages = ["Lead", "Qualified", "Demo", "Negotiation", "Order", "Closed Won", "Lost"];

const stageProbability = {
  Lead: 10,
  Qualified: 30,
  Demo: 50,
  Negotiation: 70,
  Order: 90,
  "Closed Won": 100,
  Lost: 0
};

const initialRepData = {
  "Basheer": { zone: "North Kerala", target: { annual: 100, q1: 25, q2: 25, q3: 25, q4: 25 } },
  "Amit": { zone: "South Kerala", target: { annual: 160, q1: 40, q2: 40, q3: 40, q4: 40 } },
  "Rahul": { zone: "Bangalore", target: { annual: 120, q1: 30, q2: 30, q3: 30, q4: 30 } }
};

const mockContributorsList = ["Basheer", "Amit", "Rahul", "Ahmed", "Rashid", "Niyas", "Firoz", "Anoop"];
const mockRolesList = ["Account Manager", "Product Specialist", "Clinical Specialist", "Sales Engineer", "Closer", "Manager"];

const isHoldOverdue = (deal) => {
  if (deal.state !== "On Hold" || !deal.holdReactivationDate) return false;
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const todayLocal = new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
  return deal.holdReactivationDate < todayLocal;
};

const getReactivationOverdueDays = (deal) => {
  if (!deal.holdReactivationDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reactDate = new Date(deal.holdReactivationDate);
  reactDate.setHours(0, 0, 0, 0);
  const diffTime = today - reactDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const deriveHandoverStatus = (checklist) => {
  if (!checklist || checklist.length === 0) return "Pending";
  const completedCount = checklist.filter(Boolean).length;
  if (completedCount === 0) return "Pending";
  if (completedCount === checklist.length) return "Completed";
  return "In Progress";
};

// 🔷 Demo dataset
const initialDeals = [
  // --- "Basheer" (Salesperson 1) ---
  { id: 1, name: "Al Shifa Hospital – SonoScape S50", stage: "Qualified", value: "₹22L", probability: 30, owner: "Basheer", lastActivity: "Just now", timeline: [{ text: "Doctor interested in S50 Elite, requirement discussed" }], isPriority: false, state: "Active", contributors: [{ user: "Basheer", role: "Account Manager", split: 60 }, { user: "Amit", role: "Product Specialist", split: 40 }], projectId: "7", projectName: "Al Shifa Patient Monitor Upgrade" },
  { id: 2, name: "City Scan – SonoScape E2", stage: "Demo", value: "₹18L", probability: 50, owner: "Basheer", lastActivity: "Just now", timeline: [{ text: "Demo scheduled for E2 portable" }], state: "Active", contributors: [{ user: "Basheer", role: "Account Manager", split: 80 }, { user: "Rahul", role: "Clinical Specialist", split: 15 }] },

  { id: 3, name: "Iqra Hospital – SonoScape X3", stage: "Closed Won", value: "₹30L", probability: 100, owner: "Basheer", lastActivity: "Just now", timeline: [{ text: "PO confirmed" }], isLastMonth: false, state: "Active", poNumber: "PO-39281", projectId: "6", projectName: "Iqra Hospital New Wing Construction" },
  { id: 4, name: "MIMS Clinic – P40 Elite", stage: "Lead", value: "₹15L", probability: 10, owner: "Basheer", lastActivity: "1d ago", timeline: [{ text: "Cold call, showed interest" }], state: "Active" },
  { id: 5, name: "Baby Memorial – Patient Monitor", stage: "Negotiation", value: "₹8L", probability: 70, owner: "Basheer", lastActivity: "2h ago", timeline: [{ text: "Price negotiation round 1" }], isPriority: true, state: "Active" },
  { id: 101, name: "Fathima Hospital – Defibrillator", stage: "Closed Won", value: "₹10L", probability: 100, owner: "Basheer", lastActivity: "20d ago", timeline: [{ text: "Installed" }], isLastMonth: true, state: "Active", poNumber: "PO-19203" },
  { id: 102, name: "Wayanad Medical – Patient Monitor", stage: "Lost", value: "₹5L", probability: 0, owner: "Basheer", lastActivity: "15d ago", timeline: [{ text: "Budget constraints" }], isLastMonth: true, state: "Active" },

  // --- "Amit" (Salesperson 2) ---
  { id: 6, name: "Aster Medcity – SonoScape S80", stage: "Demo", value: "₹28L", probability: 50, owner: "Amit", lastActivity: "1d ago", timeline: [{ text: "Demo completed, awaiting feedback" }], state: "Active", projectId: "5", projectName: "Aster Medcity Urology Renovation" },
  { id: 7, name: "Trivandrum Medical College – SonoScape HD-550", stage: "Qualified", value: "₹150L", probability: 30, owner: "Amit", lastActivity: "2d ago", timeline: [{ text: "Met HOD, budget approved" }], state: "On Hold", holdReason: "Budget Approval Pending", holdNotes: "State budget allocation delayed to next fiscal quarter. HOD confirmed interest remains.", holdReactivationDate: "2026-08-15" },
  { id: 8, name: "Lakeshore Hospital – Patient Monitors", stage: "Lead", value: "₹12L", probability: 10, owner: "Amit", lastActivity: "3d ago", timeline: [{ text: "Initial inquiry email" }], isPriority: false, state: "Active" },
  { id: 9, name: "KIMS Trivandrum – Defibrillators", stage: "Closed Won", value: "₹20L", probability: 100, owner: "Amit", lastActivity: "4h ago", timeline: [{ text: "Advance payment received" }], isLastMonth: false, state: "Active", poNumber: "PO-48291", projectId: "9", projectName: "KIMS Radiology Digitalization" },
  { id: 10, name: "SUT Hospital – ECG Machines", stage: "Negotiation", value: "₹5L", probability: 70, owner: "Amit", lastActivity: "Just now", timeline: [{ text: "Waiting for final sign-off" }], state: "Active" },
  { id: 103, name: "Amrita Hospital Kochi – SonoScape S22", stage: "Closed Won", value: "₹25L", probability: 100, owner: "Amit", lastActivity: "18d ago", timeline: [{ text: "Delivered" }], isLastMonth: true, state: "Active", poNumber: "PO-29381" },

  // --- "Rahul" (Salesperson 3 - Bangalore Region) ---
  { id: 11, name: "Apollo Hospitals – SonoScape P60", stage: "Negotiation", value: "₹25L", probability: 70, owner: "Rahul", lastActivity: "2d ago", timeline: [{ text: "Commercial discussion ongoing" }], state: "Active", projectId: "3", projectName: "Apollo Bangalore Equipment Upgrade" },
  { id: 12, name: "NIMHANS – MRI Setup", stage: "Lead", value: "₹200L", probability: 10, owner: "Rahul", lastActivity: "4d ago", timeline: [{ text: "RFP received" }], state: "On Hold", holdReason: "Regulatory Approval", holdNotes: "AERB clearance pending for MRI installation. Expected 2-3 month delay.", holdReactivationDate: "2026-05-10" },
  { id: 13, name: "Manipal Hospital – Portable X-Ray", stage: "Demo", value: "₹10L", probability: 50, owner: "Rahul", lastActivity: "1h ago", timeline: [{ text: "Scheduled demo" }], isPriority: true, state: "Active" },
  { id: 14, name: "Aster CMI – Hematology Analyzer", stage: "Closed Won", value: "₹9L", probability: 100, owner: "Rahul", lastActivity: "1d ago", timeline: [{ text: "Installation completed" }], isLastMonth: false, state: "Active", poNumber: "PO-18302" },
  { id: 15, name: "Fortis Hospital – SonoScape HD-500", stage: "Qualified", value: "₹45L", probability: 30, owner: "Rahul", lastActivity: "Just now", timeline: [{ text: "Technical presentation delivered" }], state: "Active" },
  { id: 104, name: "Sakra World – Ventilators", stage: "Lost", value: "₹40L", probability: 0, owner: "Rahul", lastActivity: "12d ago", timeline: [{ text: "Lost to competitor" }], isLastMonth: true, state: "Active" },

  // --- Mock Project Opportunities for Apollo Healthcare Group (PB-026/PB-026B) ---
  { id: 105, name: "Apollo Healthcare Group – MRI Equipment Upgrade", stage: "Negotiation", value: "₹80L", probability: 70, owner: "Basheer", lastActivity: "2d ago", timeline: [{ text: "Discussing technical specifications for MRI block expansion" }], state: "Active", projectId: "1", projectName: "Apollo North Hospital Expansion" },
  { id: 106, name: "Apollo Healthcare Group – Cath Lab Expansion", stage: "Demo", value: "₹120L", probability: 50, owner: "Rahul", lastActivity: "Just now", timeline: [{ text: "Site inspection scheduled for new Cath Lab" }], state: "Active", projectId: "1", projectName: "Apollo North Hospital Expansion" },
  { id: 107, name: "Apollo Healthcare Group – HIS Modernization", stage: "Qualified", value: "₹65L", probability: 30, owner: "Basheer", lastActivity: "1d ago", timeline: [{ text: "Requirement gathering for HIS upgrade complete" }], state: "Active", projectId: "2", projectName: "Apollo Digital Transformation Program" }
];

// 🔷 Customer Dataset (Phase 2)
const initialCustomers = [
  { id: 1, name: "Al Shifa Hospital", zone: "North Kerala", city: "Malappuram", customerType: "Hospital" },
  { id: 2, name: "City Scan", zone: "North Kerala", city: "Calicut", customerType: "Hospital" },
  { id: 3, name: "Iqra Hospital", zone: "North Kerala", city: "Calicut", customerType: "Hospital" },
  { id: 4, name: "MIMS Clinic", zone: "North Kerala", city: "Calicut", customerType: "Hospital" },
  { id: 5, name: "Baby Memorial", zone: "North Kerala", city: "Calicut", customerType: "Hospital" },
  { id: 6, name: "Aster Medcity", zone: "South Kerala", city: "Kochi", customerType: "Hospital", parentCustomerId: "21" },
  { id: 7, name: "Trivandrum Medical College", zone: "South Kerala", city: "Trivandrum", customerType: "Hospital" },
  { id: 8, name: "Lakeshore Hospital", zone: "South Kerala", city: "Kochi", customerType: "Hospital" },
  { id: 9, name: "KIMS Trivandrum", zone: "South Kerala", city: "Trivandrum", customerType: "Hospital" },
  { id: 10, name: "SUT Hospital", zone: "South Kerala", city: "Trivandrum", customerType: "Hospital" },
  { id: 16, name: "Amrita Hospital", zone: "South Kerala", city: "Kochi", customerType: "Hospital" },
  { id: 11, name: "Apollo Hospitals", zone: "Bangalore", city: "Bangalore", customerType: "Hospital", parentCustomerId: "20", class: "Class A", specialty: "Multi Speciality" },
  { id: 12, name: "NIMHANS", zone: "Bangalore", city: "Bangalore", customerType: "Hospital" },
  { id: 13, name: "Manipal Hospital", zone: "Bangalore", city: "Bangalore", customerType: "Hospital" },
  { id: 14, name: "Aster CMI", zone: "Bangalore", city: "Bangalore", customerType: "Hospital", parentCustomerId: "21", class: "Class A", specialty: "Multi Speciality" },
  { id: 15, name: "Fortis Hospital", zone: "Bangalore", city: "Bangalore", customerType: "Hospital" },
  { id: 17, name: "Fathima Hospital", zone: "North Kerala", city: "Calicut", customerType: "Hospital" },
  { id: 18, name: "Wayanad Medical", zone: "North Kerala", city: "Wayanad", customerType: "Hospital" },
  { id: 19, name: "Sakra World", zone: "Bangalore", city: "Bangalore", customerType: "Hospital" },
  { id: 20, name: "Apollo Healthcare Group", zone: "Bangalore", city: "Bangalore", customerType: "Corporate Group", class: "Corporate", specialty: "Multi Speciality" },
  { id: 21, name: "Aster DM Healthcare", zone: "South Kerala", city: "Kochi", customerType: "Corporate Group", class: "Corporate", specialty: "Multi Speciality" },
  { id: 23, name: "Apollo Clinic", zone: "Bangalore", city: "Bangalore", customerType: "Hospital", parentCustomerId: "20", class: "Clinic", specialty: "General" },
  { id: 24, name: "Apollo Cardiology Department", zone: "Bangalore", city: "Bangalore", customerType: "Department", parentCustomerId: "11", class: "Class A", specialty: "Cardiology" },
  { id: 25, name: "Aster Urology Department", zone: "South Kerala", city: "Kochi", customerType: "Department", parentCustomerId: "6", class: "Class A", specialty: "Urology" }
];

const initialContacts = [];

const initialProjects = [
  { id: "1", projectName: "Apollo North Hospital Expansion", projectType: "Expansion", status: "Active", expectedCloseDate: "2026-12-15", customerId: "20", customerName: "Apollo Healthcare Group" },
  { id: "2", projectName: "Apollo Digital Transformation Program", projectType: "Digital Transformation", status: "Planning", expectedCloseDate: "2027-06-30", customerId: "20", customerName: "Apollo Healthcare Group" },
  { id: "3", projectName: "Apollo Bangalore Equipment Upgrade", projectType: "Equipment Upgrade", status: "Active", expectedCloseDate: "2026-09-10", customerId: "11", customerName: "Apollo Hospitals" },
  { id: "4", projectName: "Aster DM Digital Health Initiative", projectType: "Digital Transformation", status: "Planning", expectedCloseDate: "2027-02-18", customerId: "21", customerName: "Aster DM Healthcare" },
  { id: "5", projectName: "Aster Medcity Urology Renovation", projectType: "Renovation", status: "On Hold", expectedCloseDate: "2026-11-20", customerId: "6", customerName: "Aster Medcity" },
  { id: "6", projectName: "Iqra Hospital New Wing Construction", projectType: "New Hospital Build", status: "Active", expectedCloseDate: "2028-03-05", customerId: "3", customerName: "Iqra Hospital" },
  { id: "7", projectName: "Al Shifa Patient Monitor Upgrade", projectType: "Equipment Upgrade", status: "Completed", expectedCloseDate: "2026-05-15", customerId: "1", customerName: "Al Shifa Hospital" },
  { id: "8", projectName: "TMC Critical Care Block Extension", projectType: "Expansion", status: "Active", expectedCloseDate: "2027-01-10", customerId: "7", customerName: "Trivandrum Medical College" },
  { id: "9", projectName: "KIMS Radiology Digitalization", projectType: "Digital Transformation", status: "Active", expectedCloseDate: "2026-10-30", customerId: "9", customerName: "KIMS Trivandrum" },
  { id: "10", projectName: "Baby Memorial Pediatrics Renovation", projectType: "Renovation", status: "Planning", expectedCloseDate: "2026-12-01", customerId: "5", customerName: "Baby Memorial" },
  { id: "11", projectName: "MIMS Clinic Ultrasound Upgrade", projectType: "Equipment Upgrade", status: "Completed", expectedCloseDate: "2026-04-20", customerId: "4", customerName: "MIMS Clinic" }
];

const initialBeatPlans = [
  {
    id: "1",
    userId: "Basheer",
    userName: "Basheer",
    quarter: "Q3 2026",
    status: "Approved",
    createdDate: "2026-06-08",
    submittedDate: "2026-06-09",
    approvedDate: "2026-06-10",
    approvedBy: "Manager",
    accounts: [
      { id: "1-1", beatPlanId: "1", customerId: "11", customerName: "Apollo Hospitals", plannedVisitCount: 4, strategicObjective: "Expand ultrasound footprint", expectedRevenue: 50 },
      { id: "1-2", beatPlanId: "1", customerId: "9", customerName: "KIMS Trivandrum", plannedVisitCount: 3, strategicObjective: "ICU modernization discussions", expectedRevenue: 35 },
      { id: "1-3", beatPlanId: "1", customerId: "6", customerName: "Aster Medcity", plannedVisitCount: 5, strategicObjective: "Multi-department engagement", expectedRevenue: 75 }
    ]
  },
  {
    id: "2",
    userId: "Basheer",
    userName: "Basheer",
    quarter: "Q2 2026",
    status: "Approved",
    createdDate: "2026-03-10",
    submittedDate: "2026-03-12",
    approvedDate: "2026-03-15",
    approvedBy: "Manager",
    accounts: [
      { id: "2-1", beatPlanId: "2", customerId: "1", customerName: "Al Shifa Hospital", plannedVisitCount: 3, strategicObjective: "Demonstrate SonoScape S50", expectedRevenue: 20 },
      { id: "2-2", beatPlanId: "2", customerId: "3", customerName: "Iqra Hospital", plannedVisitCount: 2, strategicObjective: "PO discussions for X3", expectedRevenue: 15 }
    ]
  },
  {
    id: "3",
    userId: "Amit",
    userName: "Amit",
    quarter: "Q3 2026",
    status: "Submitted",
    createdDate: "2026-06-10",
    submittedDate: "2026-06-11",
    accounts: [
      { id: "3-1", beatPlanId: "3", customerId: "8", customerName: "Lakeshore Hospital", plannedVisitCount: 2, strategicObjective: "Expand patient monitoring solutions", expectedRevenue: 15 },
      { id: "3-2", beatPlanId: "3", customerId: "7", customerName: "Trivandrum Medical College", plannedVisitCount: 4, strategicObjective: "Demo HD-550 endoscopy system", expectedRevenue: 40 }
    ]
  },
  {
    id: "4",
    userId: "Rahul",
    userName: "Rahul",
    quarter: "Q4 2026",
    status: "Draft",
    createdDate: "2026-06-11",
    accounts: [
      { id: "4-1", beatPlanId: "4", customerId: "13", customerName: "Manipal Hospital", plannedVisitCount: 3, strategicObjective: "Product demonstrations", expectedRevenue: 10 },
      { id: "4-2", beatPlanId: "4", customerId: "19", customerName: "Sakra World", plannedVisitCount: 2, strategicObjective: "Follow up on ventilators", expectedRevenue: 12 }
    ]
  },
  {
    id: "5",
    userId: "Amit",
    userName: "Amit",
    quarter: "Q4 2026",
    status: "Draft",
    createdDate: "2026-06-11",
    accounts: [
      { id: "5-1", beatPlanId: "5", customerId: "10", customerName: "SUT Hospital", plannedVisitCount: 3, strategicObjective: "Regular account coverage", expectedRevenue: 8 }
    ]
  },
  {
    id: "6",
    userId: "Rahul",
    userName: "Rahul",
    quarter: "Q3 2026",
    status: "Approved",
    createdDate: "2026-06-08",
    submittedDate: "2026-06-09",
    approvedDate: "2026-06-10",
    approvedBy: "Manager",
    accounts: [
      { id: "6-1", beatPlanId: "6", customerId: "15", customerName: "Fortis Hospital", plannedVisitCount: 4, strategicObjective: "Ultrasound upgrades and purchase meet", expectedRevenue: 45 }
    ]
  }
];

const initialCatalog = [
  // --- Ultrasound (SonoScape) ---
  {
    id: 1, name: "SonoScape S50 Elite", category: "Ultrasound", priceRange: "₹25L - ₹35L",
    brand: "Sonoscape", model: "S50 Elite", sbu: "Imaging", oem: "Sonoscape",
    collaterals: [
      { label: "Brochure", url: "https://www.sonoscapeindia.in/productdetails-5-discover-and-embrace-elite" },
      { label: "Clinical Images", url: "https://www.sonoscape.com/product/clinical_images/s50" }
    ]
  },
  {
    id: 2, name: "SonoScape X3", category: "Ultrasound", priceRange: "₹12L - ₹18L",
    brand: "Sonoscape", model: "X3", sbu: "Imaging", oem: "Sonoscape",
    collaterals: [{ label: "Brochure", url: "https://www.sonoscapeindia.in/productdetails-25-small-size-smart-sight" }]
  },
  {
    id: 3, name: "SonoScape HD-550", category: "Ultrasound", priceRange: "₹45L - ₹75L",
    brand: "Sonoscape", model: "HD-550", sbu: "Imaging", oem: "Sonoscape",
    collaterals: [{ label: "Official Page", url: "https://www.sonoscapeindia.in/productdetails-10-full-hd-video-endoscopy-system" }]
  },
  {
    id: 4, name: "SonoScape E2", category: "Ultrasound", priceRange: "₹8L - ₹12L",
    brand: "Sonoscape", model: "E2", sbu: "Imaging", oem: "Sonoscape",
    collaterals: [{ label: "Brochure", url: "https://www.sonoscapeindia.in/productdetails-58-sonoscape-e2-compact-color-doppler-ultrasound-system" }]
  },
  {
    id: 5, name: "SonoScape P60 Exp", category: "Ultrasound", priceRange: "₹40L - ₹55L",
    brand: "Sonoscape", model: "P60 Exp", sbu: "Imaging", oem: "Sonoscape",
    collaterals: [
      { label: "Brochure", url: "https://www.sonoscapeindia.in/productdetails-3-intelligent-future-attainable" },
      { label: "Video Demo", url: "https://www.youtube.com/watch?v=demo" }
    ]
  },

  // --- Critical Care (Magnamed) ---
  {
    id: 6, name: "Magnamed Fleximag Max", category: "Critical Care", priceRange: "₹18L - ₹28L",
    brand: "Magnamed", model: "Fleximag Max", sbu: "Critical Care", oem: "Magnamed",
    collaterals: [{ label: "Brochure", url: "https://www.inovacoesmagnamed.com.br/fleximagmaxen" }]
  },
  {
    id: 7, name: "Magnamed OxyMag", category: "Critical Care", priceRange: "₹8L - ₹15L",
    brand: "Magnamed", model: "OxyMag", sbu: "Critical Care", oem: "Magnamed",
    collaterals: [{ label: "Brochure", url: "https://www.inovacoesmagnamed.com.br/oxymag-en" }]
  },

  // --- Critical Care (EDAN / Magnamed) ---
  {
    id: 8, name: "EDAN i15 Blood Gas", category: "Critical Care", priceRange: "₹5L - ₹8L",
    brand: "EDAN", model: "i15 Blood Gas", sbu: "Critical Care", oem: "Edan",
    collaterals: [
      { label: "Brochure", url: "https://www.edan.com/product/e/i15_Blood_Gas_and_Chemistry_Analysis_System.html" },
      { label: "Catalog Extract", url: "file:///C:/Users/Basheer/.gemini/antigravity/brain/4a1141d4-664e-49f1-b6fb-2bd5ed4da440/extract_edan_poct_1776388853938.webp" }
    ]
  },
  {
    id: 9, name: "EDAN elite V Series", category: "Critical Care", priceRange: "₹12L - ₹22L",
    brand: "EDAN", model: "elite V Series", sbu: "Critical Care", oem: "Edan",
    collaterals: [{ label: "Brochure", url: "https://www.edan.com/product/i/PM_elite_V_Series.html" }]
  },
  {
    id: 10, name: "Magnamed Ventmeter", category: "Critical Care", priceRange: "₹4L - ₹6L",
    brand: "Magnamed", model: "Ventmeter", sbu: "Critical Care", oem: "Magnamed",
    collaterals: [{ label: "Brochure", url: "https://www.inovacoesmagnamed.com.br/ventmeter-en" }]
  }
];

const getActivityQuarter = (activity) => {
  if (!activity || !activity.date) return null;
  const dateStr = String(activity.date).toLowerCase();

  // If it's a timestamp or ISO date string (e.g. "2026-07-15")
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      if (!isNaN(year) && !isNaN(month)) {
        const q = Math.ceil(month / 3);
        return `Q${q} ${year}`;
      }
    }
  }

  // Parse standard string like "24 Apr, 04:30 PM"
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  let foundMonthIdx = -1;
  for (let i = 0; i < 12; i++) {
    if (dateStr.includes(months[i])) {
      foundMonthIdx = i;
      break;
    }
  }

  if (foundMonthIdx !== -1) {
    const monthNum = foundMonthIdx + 1;
    const q = Math.ceil(monthNum / 3);
    return `Q${q} 2026`;
  }

  // Fallback to current date's quarter
  const now = new Date();
  const monthNum = now.getMonth() + 1;
  const q = Math.ceil(monthNum / 3);
  return `Q${q} 2026`;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem("sales_os_currentUser") || "Manager");
  const [managerFilter, setManagerFilter] = useState(() => localStorage.getItem("sales_os_managerFilter") || "All");
  const [view, setView] = useState(() => localStorage.getItem("sales_os_view") || "pipeline");
  const [metricFilter, setMetricFilter] = useState(null);
  const [targetSubjectFilter, setTargetSubjectFilter] = useState("annual");
  const [drilldownReport, setDrilldownReport] = useState(null); // Report Drilldown
  const [hideHaroonNotification, setHideHaroonNotification] = useState(false); // Haroon Notification simulator
  const [customAlert, setCustomAlert] = useState(null); // Custom Alert Modal: { title, message, type }

  const [repData, setRepData] = useState(() => {
    const saved = localStorage.getItem("sales_os_repdata");
    let parsed = saved ? JSON.parse(saved) : initialRepData;
    if (parsed["You"]) {
      parsed["Basheer"] = parsed["You"];
      delete parsed["You"];
    }
    // Flush old target format
    if (parsed["Basheer"] && parsed["Basheer"].target.total !== undefined) {
      localStorage.removeItem("sales_os_repdata");
      return initialRepData;
    }
    return parsed;
  });
  useEffect(() => {
    localStorage.setItem("sales_os_repdata", JSON.stringify(repData));
  }, [repData]);

  useEffect(() => { localStorage.setItem("sales_os_currentUser", currentUser); }, [currentUser]);
  useEffect(() => { localStorage.setItem("sales_os_managerFilter", managerFilter); }, [managerFilter]);
  useEffect(() => { localStorage.setItem("sales_os_view", view); }, [view]);

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem("sales_os_customers");
    if (!saved) return initialCustomers;
    let parsed = JSON.parse(saved);
    initialCustomers.forEach(initC => {
      const existing = parsed.find(c => c.id === initC.id || c.name === initC.name);
      if (!existing) {
        parsed.push(initC);
      } else {
        if (initC.customerType && !existing.customerType) {
          existing.customerType = initC.customerType;
        }
        if (initC.parentCustomerId && !existing.parentCustomerId) {
          existing.parentCustomerId = initC.parentCustomerId;
        }
        // Force update class and specialty properties for correct directory filtering
        if (initC.class && !existing.class) {
          existing.class = initC.class;
        }
        if (initC.specialty && !existing.specialty) {
          existing.specialty = initC.specialty;
        }
      }
    });
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem("sales_os_customers", JSON.stringify(customers));
  }, [customers]);

  const [selectedDeal, setSelectedDeal] = useState(null);

  const [showActivity, setShowActivity] = useState(false);
  const [activityInput, setActivityInput] = useState("");
  const [pendingStage, setPendingStage] = useState(null);
  const [isClosureDatePrompt, setIsClosureDatePrompt] = useState(false);
  const [closureDate, setClosureDate] = useState("");
  const [isLostPrompt, setIsLostPrompt] = useState(false);
  const [lostCompetitor, setLostCompetitor] = useState("");
  const [lostReason, setLostReason] = useState("Price");

  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem("sales_os_projects");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error loading projects", e);
    }
    return initialProjects;
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Form states for projects
  const [formProjectName, setFormProjectName] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formCustomerSearchText, setFormCustomerSearchText] = useState("");
  const [isFormCustomerLookupOpen, setIsFormCustomerLookupOpen] = useState(false);
  const [formProjectType, setFormProjectType] = useState("New Hospital Build");
  const [formProjectStatus, setFormProjectStatus] = useState("Planning");
  const [formExpectedCloseDate, setFormExpectedCloseDate] = useState("");
  const [isFormCustomerLocked, setIsFormCustomerLocked] = useState(false);

  // Search & Filter states for projects master
  const [projectSearchText, setProjectSearchText] = useState("");
  const [projectTypeFilter, setProjectTypeFilter] = useState("All Types");
  const [projectStatusFilter, setProjectStatusFilter] = useState("All Statuses");

  const [beatPlans, setBeatPlans] = useState(() => {
    try {
      const saved = localStorage.getItem("sales_os_beat_plans");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Migration: if saved plans are of the old visit-planning structure, clear and reload defaults
          if (parsed.length > 0 && (parsed[0].visitDate !== undefined || parsed[0].accounts === undefined)) {
            localStorage.removeItem("sales_os_beat_plans");
            return initialBeatPlans;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading beat plans", e);
    }
    return initialBeatPlans;
  });
  const [selectedBeatPlan, setSelectedBeatPlan] = useState(null);
  const [isBeatPlanModalOpen, setIsBeatPlanModalOpen] = useState(false);
  const [editingBeatPlan, setEditingBeatPlan] = useState(null);

  // Form states for beat plans
  const [formBeatPlanQuarter, setFormBeatPlanQuarter] = useState("Q3 2026");
  const [formBeatPlanAccounts, setFormBeatPlanAccounts] = useState([]);

  // Filters for beat plans
  const [beatStatusFilter, setBeatStatusFilter] = useState("All Statuses");
  const [beatSalespersonFilter, setBeatSalespersonFilter] = useState("All Salespersons");
  const [beatQuarterFilter, setBeatQuarterFilter] = useState("All Quarters");

  useEffect(() => {
    localStorage.setItem("sales_os_beat_plans", JSON.stringify(beatPlans));
  }, [beatPlans]);

  // State inside lead wizard for associating a project during opportunity creation
  const [selectedProjectId, setSelectedProjectId] = useState("");

  useEffect(() => {
    localStorage.setItem("sales_os_projects", JSON.stringify(projects));
  }, [projects]);


  const [showNewLead, setShowNewLead] = useState(false);
  const [leadWizardStep, setLeadWizardStep] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerZone, setNewCustomerZone] = useState("North Kerala");
  const [newCustomerCity, setNewCustomerCity] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadValue, setLeadValue] = useState("");
  const [leadSource, setLeadSource] = useState("Direct Inquiry");
  const [leadCampaign, setLeadCampaign] = useState("");
  const [leadRegion, setLeadRegion] = useState("North Kerala");
  const [newCustomerClass, setNewCustomerClass] = useState("Class A");
  const [newCustomerSpecialty, setNewCustomerSpecialty] = useState("General");
  const [newCustomerType, setNewCustomerType] = useState("Hospital");
  const [newParentCustomerId, setNewParentCustomerId] = useState("");
  const [parentSearchText, setParentSearchText] = useState("");
  const [isCreatingParentLookup, setIsCreatingParentLookup] = useState(false);
  const [editParentSearchText, setEditParentSearchText] = useState("");
  const [isEditingParent, setIsEditingParent] = useState(false);


  const [deals, setDeals] = useState(() => {
    const saved = localStorage.getItem("sales_os_deals");
    if (saved && saved.includes("Mindray")) {
      localStorage.removeItem("sales_os_deals");
      return initialDeals;
    }
    let parsed = saved ? JSON.parse(saved) : initialDeals;

    // Migrate older localStorage formats
    parsed = parsed.map(d => {
      if (d.name) {
        let name = d.name;

        // Correct wrong hospital names that got appended or are incorrect
        if (name.includes("Iqra UST m/c")) {
          name = name.replace("Iqra UST m/c", "Iqra Hospital");
        }
        if (name.includes("Baby Memorial - Patient Monitor")) {
          name = name.replace("Baby Memorial - Patient Monitor", "Baby Memorial");
        }
        if (name.includes("SUT Hospital - ECG Machines")) {
          name = name.replace("SUT Hospital - ECG Machines", "SUT Hospital");
        }

        // Restore proper name structure with EN dash if missing
        if (!name.includes("–")) {
          if (name.includes(" - ")) name = name.replace(" - ", " – ");
          else if (name.includes(" -")) name = name.replace(" -", " – ");
          else if (name.includes("- ")) name = name.replace("- ", " – ");
          else if (name.includes("-")) name = name.replace("-", " – ");
          else {
            const initD = initialDeals.find(item => item.id === d.id);
            if (initD) {
              name = initD.name;
            } else {
              name = `${name} – Equipment`;
            }
          }
        }

        // Prevent duplicate hospital or equipment name suffix
        if (name.includes("–")) {
          let parts = name.split("–").map(p => p.trim());
          if (parts.length === 2) {
            let [hosp, equip] = parts;
            if (hosp.includes(" - ")) {
              hosp = hosp.split(" - ")[0].trim();
            }
            if (equip.startsWith(hosp)) {
              equip = equip.replace(hosp, "").trim();
              if (equip.startsWith("-")) equip = equip.substring(1).trim();
              if (equip.startsWith("–")) equip = equip.substring(1).trim();
            }
            if (!equip) {
              const initD = initialDeals.find(item => item.id === d.id);
              if (initD && initD.name.includes("–")) {
                equip = initD.name.split("–")[1].trim();
              } else {
                equip = "Equipment";
              }
            }
            name = `${hosp} – ${equip}`;
          }
        }
        d.name = name;
      }

      // Migrate Closed Won deals stuck in "Order" stage
      if (d.stage === "Order" && (d.probability === 100 || d.poNumber || [3, 9, 14, 101, 103].includes(d.id))) {
        let productIds = d.productIds || [];
        if (productIds.length === 0) {
          if (d.id === 3) productIds = [2]; // SonoScape X3
          else if (d.id === 9) productIds = [9]; // EDAN elite V Series
          else if (d.id === 14) productIds = [8]; // EDAN i15 Blood Gas
          else if (d.id === 101) productIds = [9];
          else if (d.id === 103) productIds = [1]; // SonoScape S50 Elite
          else productIds = [1];
        }
        return {
          ...d,
          stage: "Closed Won",
          probability: 100,
          productIds
        };
      }
      return d;
    });

    // Migrate: ensure every deal has isPriority field (defaults to false)
    return parsed.map(d => {
      let contributors = d.contributors;
      if (!contributors || (contributors.length === 1 && contributors[0].split === 100)) {
        if (d.id === 1) {
          contributors = [{ user: "Basheer", role: "Account Manager", split: 60 }, { user: "Amit", role: "Product Specialist", split: 40 }];
        } else if (d.id === 2) {
          contributors = [{ user: "Basheer", role: "Account Manager", split: 80 }, { user: "Rahul", role: "Clinical Specialist", split: 15 }];
        } else {
          contributors = [{ user: d.owner === "You" ? "Basheer" : d.owner, role: "Account Manager", split: 100 }];
        }
      }
      let productIds = d.productIds || [];
      if (productIds.length === 0) {
        if (d.id === 1) productIds = [1];
        else if (d.id === 2) productIds = [4];
        else if (d.id === 3) productIds = [2];
        else if (d.id === 4) productIds = [5];
        else if (d.id === 5) productIds = [9];
        else if (d.id === 6) productIds = [1];
        else if (d.id === 7) productIds = [3];
        else if (d.id === 8) productIds = [9];
        else if (d.id === 9) productIds = [9];
        else if (d.id === 10) productIds = [10];
        else if (d.id === 11) productIds = [5];
        else if (d.id === 12) productIds = [3];
        else if (d.id === 13) productIds = [4];
        else if (d.id === 14) productIds = [8];
        else if (d.id === 15) productIds = [3];
        else if (d.id === 101) productIds = [9];
        else if (d.id === 102) productIds = [9];
        else if (d.id === 103) productIds = [1];
        else if (d.id === 104) productIds = [7];
        else if (d.id === 105) productIds = [3];
        else if (d.id === 106) productIds = [3];
        else if (d.id === 107) productIds = [3];
        else productIds = [1];
      }
      return {
        ...d,
        owner: d.owner === "You" ? "Basheer" : d.owner,
        isPriority: d.isPriority === true ? true : false,
        state: d.state || "Active",
        poNumber: d.poNumber || "",
        productIds,
        contributors
      };
    });
  });

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAssetModel, setNewAssetModel] = useState("");
  const [newAssetInstallDate, setNewAssetInstallDate] = useState("");
  const [newAssetNotes, setNewAssetNotes] = useState("");
  const [customerZoneFilter, setCustomerZoneFilter] = useState("All Zones");
  const [customerClassFilter, setCustomerClassFilter] = useState("All Classes");
  const [customerSpecialtyFilter, setCustomerSpecialtyFilter] = useState("All Specialties");
  const [activityPurpose, setActivityPurpose] = useState("Deal Follow-up");
  const [assets, setAssets] = useState(() => {
    try {
      const saved = localStorage.getItem("sales_os_assets");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error loading assets", e);
    }
    return [];
  });
  const [selectedAccount, setSelectedAccount] = useState(null); // For 360 view

  const lastAccountIdRef = React.useRef(null);

  useEffect(() => {
    if (selectedAccount) {
      if (lastAccountIdRef.current !== selectedAccount.id) {
        lastAccountIdRef.current = selectedAccount.id;
        const parent = customers.find(c => c.id.toString() === selectedAccount.parentCustomerId?.toString());
        setEditParentSearchText(parent ? parent.name : "");
        setIsEditingParent(false);
      }
    } else {
      lastAccountIdRef.current = null;
      setEditParentSearchText("");
      setIsEditingParent(false);
    }
  }, [selectedAccount, customers]);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!document.body.contains(e.target)) return;
      if (isEditingParent && !e.target.closest(".parent-lookup-container")) {
        setIsEditingParent(false);
        const parent = customers.find(c => c.id.toString() === selectedAccount?.parentCustomerId?.toString());
        setEditParentSearchText(parent ? parent.name : "");
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [isEditingParent, selectedAccount, customers]);

  useEffect(() => {
    const handleCreateDocumentClick = (e) => {
      if (!document.body.contains(e.target)) return;
      if (isCreatingParentLookup && !e.target.closest(".create-parent-lookup-container")) {
        setIsCreatingParentLookup(false);
        if (!newParentCustomerId) {
          setParentSearchText("");
        } else {
          const parent = customers.find(c => c.id.toString() === newParentCustomerId.toString());
          setParentSearchText(parent ? parent.name : "");
        }
      }
    };
    document.addEventListener("mousedown", handleCreateDocumentClick);
    return () => document.removeEventListener("mousedown", handleCreateDocumentClick);
  }, [isCreatingParentLookup, newParentCustomerId, customers]);

  useEffect(() => {
    const handleProjectCustomerClick = (e) => {
      if (!document.body.contains(e.target)) return;
      if (isFormCustomerLookupOpen && !e.target.closest(".project-customer-lookup-container")) {
        setIsFormCustomerLookupOpen(false);
        if (!formCustomerId) {
          setFormCustomerSearchText("");
        } else {
          const cust = customers.find(c => c.id.toString() === formCustomerId.toString());
          setFormCustomerSearchText(cust ? cust.name : "");
        }
      }
    };
    document.addEventListener("mousedown", handleProjectCustomerClick);
    return () => document.removeEventListener("mousedown", handleProjectCustomerClick);
  }, [isFormCustomerLookupOpen, formCustomerId, customers]);

  useEffect(() => {
    const handleBeatHospitalClick = (e) => {
      if (!document.body.contains(e.target)) return;
      setFormBeatPlanAccounts(prev => {
        if (prev.length === 0) return prev;
        let changed = false;
        const next = prev.map(a => {
          if (!a.isLookupOpen) return a;
          const container = e.target.closest(`.beat-row-hospital-lookup-container-${a.id}`);
          if (!container) {
            changed = true;
            return {
              ...a,
              isLookupOpen: false,
              searchText: a.customerName || ""
            };
          }
          return a;
        });
        return changed ? next : prev;
      });
    };
    document.addEventListener("mousedown", handleBeatHospitalClick);
    return () => document.removeEventListener("mousedown", handleBeatHospitalClick);
  }, []);

  const [newStakeholderName, setNewStakeholderName] = useState("");
  const [newStakeholderRole, setNewStakeholderRole] = useState("");
  const [newStakeholderPhone, setNewStakeholderPhone] = useState("");
  const [newStakeholderEmail, setNewStakeholderEmail] = useState("");

  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState("All");
  const [wizardCategoryFilter, setWizardCategoryFilter] = useState("Ultrasound");
  const [isAddingStakeholder, setIsAddingStakeholder] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState(null);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editLeadData, setEditLeadData] = useState(null);

  const originalDeal = editLeadData ? deals.find(d => d.id === editLeadData.id) : null;
  const stageChanged = originalDeal && editLeadData && editLeadData.stage !== originalDeal.stage;

  const openEditModal = (deal, preSelectedStage = null) => {
    const stage = preSelectedStage || deal.stage;

    setEditLeadData({
      ...deal,
      stage: stage,
      activityInput: "",
      activityPurpose: stage === "Negotiation" ? "Negotiation Meeting" : (stage === "Lost" ? "Loss Analysis" : "Deal Follow-up"),
      closureDate: stage === "Negotiation" ? (deal.expectedClosureDate || "") : "",
      isSchedulingFollowUp: false,
      followUpDate: "",
      followUpText: "",
      budgetRange: deal.budgetRange || "",
      demoDate: deal.demoDate || "",
      demoOutcome: deal.demoOutcome || "",
      handoverOwner: deal.handoverOwner || deal.owner || "",
      deliveryNotes: deal.deliveryNotes || "",
      installationRequirements: deal.installationRequirements || "",
      specialCommitments: deal.specialCommitments || "",
      handoverChecklist: deal.handoverChecklist || [false, false, false],
      handoverStatus: deal.handoverStatus || "Pending",
      poNumber: deal.poNumber || ""
    });
    setIsEditingLead(true);
  };


  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [newProductModel, setNewProductModel] = useState("");
  const [newProductSbu, setNewProductSbu] = useState("Imaging");
  const [newProductOem, setNewProductOem] = useState("Sonoscape");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductCollaterals, setNewProductCollaterals] = useState([]);

  const [catalog, setCatalog] = useState(() => {
    const saved = localStorage.getItem("sales_os_catalog");
    // Force reset if stale data includes competitor products or missing categories/SBU, or outdated OEM mappings
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && (parsed.some(p => !p.sbu) || parsed.some(p => p.brand === "EDAN" && p.oem === "Mindray"))) {
          localStorage.removeItem("sales_os_catalog");
          return initialCatalog;
        }
        return parsed;
      } catch (e) {
        return initialCatalog;
      }
    }
    return initialCatalog;
  });

  const [categoryAssignments, setCategoryAssignments] = useState(() => {
    const saved = localStorage.getItem("sales_os_categoryAssignments");
    return saved ? JSON.parse(saved) : {
      "North Kerala": { "Ultrasound": "Basheer", "Critical Care": "Amit" },
      "South Kerala": { "Ultrasound": "Amit", "Critical Care": "Basheer" },
      "Bangalore": { "Ultrasound": "Rahul", "Critical Care": "Rahul" }
    };
  });

  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem("sales_os_teams");
    return saved ? JSON.parse(saved) : {
      "Basheer": ["Basheer", "Rahul"],
      "Amit": ["Amit"]
    };
  });

  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem("sales_os_contacts");
    return saved ? JSON.parse(saved) : initialContacts;
  });

  const [reminders, setReminders] = useState(() => {
    try {
      const saved = localStorage.getItem("sales_os_reminders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error loading reminders", e);
    }
    return [];
  });

  // Unified Interaction State
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpText, setFollowUpText] = useState("");

  const getFormattedDateTime = () => {
    const now = new Date();
    const d = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const t = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${d}, ${t}`;
  };

  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem("sales_os_activities");
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // 🛠️ Data Cleaning for Demo Persistence
          return parsed.map(a => {
            let n = a.notes || "";
            n = n.replace(/^👑 Manager Note: /, "");
            n = n.replace(/^👑 Manager Interaction: /, "");
            n = n.replace(/^\[MANAGER NOTE\] /, "");
            n = n.replace(/^\[.*?\] /, "");

            return {
              ...a,
              notes: n,
              date: a.date === "Just now" ? "25 Apr, 07:15 AM" : a.date
            };
          });
        }
      }
    } catch (e) {
      console.error("Error loading activities", e);
    }

    const initialActivities = [];
    initialDeals.forEach(deal => {
      deal.timeline.forEach((t, index) => {
        initialActivities.push({
          id: `${deal.id}-${index}`,
          accountId: initialCustomers.find(c => deal.name.includes(c.name))?.id || 1,
          dealId: deal.id,
          notes: t.text.replace(/^\[.*?\] /, ""),
          purpose: t.text.includes("Manager") ? "Manager Note" : (t.text.includes("[") ? t.text.split("]")[0].replace("[", "") : "Interaction"),
          date: "24 Apr, 04:30 PM",
          owner: deal.owner
        });
      });
    });

    // Custom activities for Beat Planning execution tracking
    const customMockActivities = [
      // Basheer Q3 2026 activities (Jul-Sep 2026)
      { id: "bp-act-1", accountId: "11", dealId: null, notes: "Initial discussion on ultrasound expansion", purpose: "Field Visit", date: "2026-07-15", owner: "Basheer" },
      { id: "bp-act-2", accountId: "11", dealId: null, notes: "Technical specifications review for Apollo Hospitals", purpose: "Demo", date: "2026-08-02", owner: "Basheer" },
      { id: "bp-act-3", accountId: "11", dealId: null, notes: "Commercial quote discussion with Apollo procurement", purpose: "Proposal Discussion", date: "2026-08-20", owner: "Basheer" },
      
      { id: "bp-act-4", accountId: "6", dealId: null, notes: "ICU renovation site visit at Aster Medcity", purpose: "Field Visit", date: "2026-07-10", owner: "Basheer" },
      { id: "bp-act-5", accountId: "6", dealId: null, notes: "Met Chief Radiologist regarding S80 demo feedback", purpose: "Demo", date: "2026-07-28", owner: "Basheer" },
      { id: "bp-act-6", accountId: "6", dealId: null, notes: "Aster procurement budget meeting", purpose: "Negotiation Meeting", date: "2026-08-12", owner: "Basheer" },
      { id: "bp-act-7", accountId: "6", dealId: null, notes: "Follow up call on final PO status", purpose: "Phone Call", date: "2026-09-01", owner: "Basheer" },
      { id: "bp-act-8", accountId: "6", dealId: null, notes: "Installed demo machine checkup", purpose: "Field Visit", date: "2026-09-15", owner: "Basheer" },
      
      // Basheer Q2 2026 activities (Apr-Jun 2026)
      { id: "bp-act-9", accountId: "1", dealId: null, notes: "Met Al Shifa clinical lead", purpose: "Field Visit", date: "2026-04-10", owner: "Basheer" },
      { id: "bp-act-10", accountId: "1", dealId: null, notes: "Conducted S50 demo", purpose: "Demo", date: "2026-04-20", owner: "Basheer" },
      { id: "bp-act-11", accountId: "1", dealId: null, notes: "Sent commercial draft quote", purpose: "Proposal Discussion", date: "2026-05-05", owner: "Basheer" },
      { id: "bp-act-12", accountId: "1", dealId: null, notes: "Negotiation meeting with purchase director", purpose: "Negotiation Meeting", date: "2026-05-25", owner: "Basheer" },
      
      { id: "bp-act-13", accountId: "3", dealId: null, notes: "Iqra Hospital new wing discussion", purpose: "Field Visit", date: "2026-05-15", owner: "Basheer" },
      { id: "bp-act-14", accountId: "3", dealId: null, notes: "PO sign off discussion for X3", purpose: "Proposal Discussion", date: "2026-06-10", owner: "Basheer" }
    ];
    initialActivities.push(...customMockActivities);

    return initialActivities;
  });

  useEffect(() => {
    localStorage.setItem("sales_os_deals", JSON.stringify(deals));
  }, [deals]);

  useEffect(() => {
    localStorage.setItem("sales_os_activities", JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem("sales_os_contacts", JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem("sales_os_reminders", JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem("sales_os_catalog", JSON.stringify(catalog));
  }, [catalog]);

  useEffect(() => {
    localStorage.setItem("sales_os_categoryAssignments", JSON.stringify(categoryAssignments));
  }, [categoryAssignments]);

  useEffect(() => {
    localStorage.setItem("sales_os_teams", JSON.stringify(teams));
  }, [teams]);

  // Patch: Ensure reminders attached to a deal correctly inherit the deal's owner rather than the person who logged it
  useEffect(() => {
    if (deals.length > 0 && reminders.length > 0) {
      const needsPatch = reminders.some(r => r.dealId && deals.find(d => d.id === r.dealId)?.owner !== r.owner);
      if (needsPatch) {
        setReminders(prev => prev.map(r => {
          if (r.dealId) {
            const deal = deals.find(d => d.id === r.dealId);
            if (deal && deal.owner !== r.owner) {
              return { ...r, owner: deal.owner };
            }
          }
          return r;
        }));
      }
    }
  }, [deals]);

  useEffect(() => {
    localStorage.setItem("sales_os_assets", JSON.stringify(assets));
  }, [assets]);

  const updateDeal = (id, updates) => {
    setDeals(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
  };

  const changeStage = (deal, newStage) => {
    if (newStage === "Order") {
      const contributors = deal.contributors || [];
      const totalSplit = contributors.reduce((acc, curr) => acc + (parseInt(curr.split) || 0), 0);
      if (totalSplit !== 100) {
        if (totalSplit < 100) {
          setCustomAlert({
            title: "Split Verification",
            message: `Contribution allocation must total 100%.\n\nCurrent total: ${totalSplit}%`,
            type: "warning"
          });
        } else {
          setCustomAlert({
            title: "Split Verification",
            message: `Contribution allocation exceeds 100%.\n\nCurrent total: ${totalSplit}%`,
            type: "warning"
          });
        }
        return;
      }
    }

    setSelectedDeal(deal);
    setPendingStage(newStage);

    if (newStage === "Negotiation") {
      setIsClosureDatePrompt(true);
      setShowActivity(true);
    } else if (newStage === "Lost") {
      setIsLostPrompt(true);
      setShowActivity(true);
    } else {
      setShowActivity(true);
    }
  };

  const addActivity = () => {
    const accountId = selectedAccount ? selectedAccount.id : (selectedDeal ? customers.find(c => selectedDeal.name.includes(c.name))?.id : null);

    let finalNotes = activityInput;
    if (isClosureDatePrompt) {
      if (!closureDate) { setCustomAlert({ title: "Date Required", message: "Please set an Expected Closure Date.", type: "warning" }); return; }
      finalNotes = `Moved to Negotiation. Exp. Closure: ${closureDate}. ` + activityInput;
    } else if (isLostPrompt) {
      if (!lostCompetitor) { setCustomAlert({ title: "Competitor Required", message: "Please enter the Competitor Name.", type: "warning" }); return; }
      finalNotes = `Deal Lost to ${lostCompetitor} due to ${lostReason}. ` + activityInput;
    } else {
      finalNotes = activityInput;
    }
    if (!finalNotes.trim() && !isClosureDatePrompt && !isLostPrompt) return;

    const newActivity = {
      id: Date.now(),
      accountId: accountId,
      dealId: selectedDeal?.id || null,
      notes: finalNotes,
      purpose: activityPurpose,
      date: getFormattedDateTime(),
      owner: currentUser
    };

    setActivities(prev => [newActivity, ...prev]);

    // Phase 7: Create Reminder
    if (isSchedulingFollowUp && followUpDate) {
      const newReminder = {
        id: Date.now() + 1,
        accountId: accountId,
        dealId: selectedDeal?.id || null,
        text: followUpText || `Follow up: ${activityInput.substring(0, 30)}...`,
        dueDate: followUpDate,
        status: "pending",
        owner: selectedDeal?.owner || currentUser
      };
      setReminders(prev => [newReminder, ...prev]);
    }

    // Audit Trail: If this was a stage change, log it
    if (pendingStage && selectedDeal) {
      const updates = {
        stage: pendingStage,
        probability: stageProbability[pendingStage],
        lastActivity: "Just now"
      };

      if (pendingStage === "Negotiation" && closureDate) updates.expectedClosureDate = closureDate;
      if (pendingStage === "Lost") {
        updates.lostCompetitor = lostCompetitor;
        updates.lostReason = lostReason;
      }

      updateDeal(selectedDeal.id, updates);
      setSelectedDeal({ ...selectedDeal, ...updates });
    }

    setActivityInput("");
    setPendingStage(null);
    setIsClosureDatePrompt(false);
    setIsLostPrompt(false);
    setClosureDate("");
    setLostCompetitor("");
    setLostReason("Price");
    setActivityPurpose("Deal Follow-up");
    setShowActivity(false);
    // Reset scheduling state
    setIsSchedulingFollowUp(false);
    setFollowUpDate("");
    setFollowUpText("");
  };

  const completeReminder = (reminder) => {
    setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, status: "completed" } : r));

    const completionActivity = {
      id: Date.now(),
      accountId: reminder.accountId,
      dealId: reminder.dealId,
      type: "interaction",
      notes: `✅ TASK COMPLETED: ${reminder.text}`,
      date: "Just now",
      owner: currentUser
    };
    setActivities(prev => [completionActivity, ...prev]);
  };

  const logAuditActivity = (accountId, dealId, message) => {
    const auditActivity = {
      id: Date.now(),
      accountId: accountId,
      dealId: dealId,
      type: "audit",
      notes: `🔄 ${message}`,
      date: "Just now",
      owner: currentUser
    };
    setActivities(prev => [auditActivity, ...prev]);
  };

  const saveProject = () => {
    if (!formProjectName.trim() || !formCustomerId) {
      setCustomAlert({
        title: "Required Fields",
        message: "Please enter Project Name and select a Customer.",
        type: "warning"
      });
      return;
    }
    const customerObj = customers.find(c => c.id.toString() === formCustomerId.toString());
    const projectData = {
      id: editingProject ? editingProject.id : Date.now().toString(),
      projectName: formProjectName.trim(),
      customerId: formCustomerId,
      customerName: customerObj ? customerObj.name : "",
      projectType: formProjectType,
      status: formProjectStatus,
      expectedCloseDate: formExpectedCloseDate
    };

    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? projectData : p));
      setDeals(prev => prev.map(d => d.projectId === editingProject.id ? { ...d, projectName: formProjectName.trim() } : d));
    } else {
      setProjects(prev => [...prev, projectData]);
    }

    setFormProjectName("");
    setFormCustomerId("");
    setFormCustomerSearchText("");
    setFormProjectType("New Hospital Build");
    setFormProjectStatus("Planning");
    setFormExpectedCloseDate("");
    setEditingProject(null);
    setIsProjectModalOpen(false);
    setIsFormCustomerLocked(false);
  };

  const openEditProjectModal = (proj) => {
    setEditingProject(proj);
    setFormProjectName(proj.projectName);
    setFormCustomerId(proj.customerId);
    const cust = customers.find(c => c.id.toString() === proj.customerId.toString());
    setFormCustomerSearchText(cust ? cust.name : "");
    setFormProjectType(proj.projectType);
    setFormProjectStatus(proj.status);
    setFormExpectedCloseDate(proj.expectedCloseDate || "");
    setIsFormCustomerLocked(false);
    setIsProjectModalOpen(true);
  };

  const openNewProjectModal = (prePopulatedCustomerId = "") => {
    setEditingProject(null);
    setFormProjectName("");
    if (prePopulatedCustomerId) {
      setFormCustomerId(prePopulatedCustomerId.toString());
      const cust = customers.find(c => c.id.toString() === prePopulatedCustomerId.toString());
      setFormCustomerSearchText(cust ? cust.name : "");
      setIsFormCustomerLocked(true);
    } else {
      setFormCustomerId("");
      setFormCustomerSearchText("");
      setIsFormCustomerLocked(false);
    }
    setFormProjectType("New Hospital Build");
    setFormProjectStatus("Planning");
    setFormExpectedCloseDate("");
    setIsProjectModalOpen(true);
  };

  const saveBeatPlan = (shouldSubmit = false) => {
    if (!formBeatPlanQuarter) {
      setCustomAlert({ title: "Required Field", message: "Please select a Quarter.", type: "warning" });
      return;
    }
    if (formBeatPlanAccounts.length === 0) {
      setCustomAlert({ title: "No Accounts", message: "Please add at least one Hospital/Account.", type: "warning" });
      return;
    }
    
    // Validate all rows
    for (let i = 0; i < formBeatPlanAccounts.length; i++) {
      const a = formBeatPlanAccounts[i];
      if (!a.customerId) {
        setCustomAlert({ title: "Missing Hospital", message: `Please select a Hospital for Row ${i + 1}.`, type: "warning" });
        return;
      }
      const visits = parseInt(a.plannedVisitCount);
      if (isNaN(visits) || visits <= 0) {
        setCustomAlert({ title: "Invalid Visits", message: `Planned Visit Count must be a positive number for Row ${i + 1}.`, type: "warning" });
        return;
      }
      if (!a.strategicObjective.trim()) {
        setCustomAlert({ title: "Missing Strategic Objective", message: `Please enter a Strategic Objective for Row ${i + 1}.`, type: "warning" });
        return;
      }
      const rev = parseFloat(a.expectedRevenue);
      if (isNaN(rev) || rev < 0) {
        setCustomAlert({ title: "Invalid Revenue", message: `Expected Revenue must be a non-negative number for Row ${i + 1}.`, type: "warning" });
        return;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const planId = editingBeatPlan ? editingBeatPlan.id : Date.now().toString();

    const accountsData = formBeatPlanAccounts.map((a, idx) => ({
      id: a.id || `${planId}-${idx}-${Date.now()}`,
      beatPlanId: planId,
      customerId: a.customerId,
      customerName: a.customerName,
      plannedVisitCount: parseInt(a.plannedVisitCount),
      strategicObjective: a.strategicObjective.trim(),
      expectedRevenue: parseFloat(a.expectedRevenue)
    }));

    const beatPlanData = {
      id: planId,
      userId: editingBeatPlan ? editingBeatPlan.userId : currentUser,
      userName: editingBeatPlan ? editingBeatPlan.userName : currentUser,
      quarter: formBeatPlanQuarter,
      status: shouldSubmit ? "Submitted" : (editingBeatPlan ? editingBeatPlan.status : "Draft"),
      createdDate: editingBeatPlan ? editingBeatPlan.createdDate : todayStr,
      submittedDate: shouldSubmit ? todayStr : (editingBeatPlan ? editingBeatPlan.submittedDate : undefined),
      approvedDate: editingBeatPlan ? editingBeatPlan.approvedDate : undefined,
      approvedBy: editingBeatPlan ? editingBeatPlan.approvedBy : undefined,
      accounts: accountsData
    };

    if (editingBeatPlan) {
      setBeatPlans(prev => prev.map(bp => bp.id === editingBeatPlan.id ? beatPlanData : bp));
    } else {
      setBeatPlans(prev => [...prev, beatPlanData]);
    }

    // Reset form states
    setFormBeatPlanQuarter("Q3 2026");
    setFormBeatPlanAccounts([]);
    setEditingBeatPlan(null);
    setIsBeatPlanModalOpen(false);
  };

  const openNewBeatPlanModal = () => {
    setEditingBeatPlan(null);
    setFormBeatPlanQuarter("Q3 2026");
    // Add one blank row initially
    setFormBeatPlanAccounts([
      { id: Date.now().toString(), customerId: "", customerName: "", searchText: "", isLookupOpen: false, plannedVisitCount: 1, strategicObjective: "", expectedRevenue: 0 }
    ]);
    setIsBeatPlanModalOpen(true);
  };

  const openEditBeatPlanModal = (bp) => {
    setEditingBeatPlan(bp);
    setFormBeatPlanQuarter(bp.quarter);
    setFormBeatPlanAccounts(bp.accounts.map(a => ({
      id: a.id,
      customerId: a.customerId,
      customerName: a.customerName,
      searchText: a.customerName,
      isLookupOpen: false,
      plannedVisitCount: a.plannedVisitCount,
      strategicObjective: a.strategicObjective,
      expectedRevenue: a.expectedRevenue
    })));
    setIsBeatPlanModalOpen(true);
  };

  const submitBeatPlanDirectly = (bp) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = {
      ...bp,
      status: "Submitted",
      submittedDate: todayStr
    };
    setBeatPlans(prev => prev.map(item => item.id === bp.id ? updated : item));
    if (selectedBeatPlan && selectedBeatPlan.id === bp.id) {
      setSelectedBeatPlan(updated);
    }
  };

  const approveBeatPlan = (bp) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = {
      ...bp,
      status: "Approved",
      approvedDate: todayStr,
      approvedBy: currentUser
    };
    setBeatPlans(prev => prev.map(item => item.id === bp.id ? updated : item));
    if (selectedBeatPlan && selectedBeatPlan.id === bp.id) {
      setSelectedBeatPlan(updated);
    }
  };

  const handleCancelNewCustomer = () => {
    setIsCreatingCustomer(false);
    setNewCustomerName("");
    setNewCustomerCity("");
    setNewCustomerZone("North Kerala");
    setNewCustomerClass("Class A");
    setNewCustomerSpecialty("General");
    setNewCustomerType("Hospital");
    setNewParentCustomerId("");
    setParentSearchText("");
  };

  const handleCloseLeadWizard = () => {
    setShowNewLead(false);
    setLeadWizardStep(1);
    setIsCreatingCustomer(false);
    setNewCustomerName("");
    setNewCustomerCity("");
    setNewCustomerZone("North Kerala");
    setNewCustomerClass("Class A");
    setNewCustomerSpecialty("General");
    setNewCustomerType("Hospital");
    setNewParentCustomerId("");
    setParentSearchText("");
  };

  const handleSaveCustomer = () => {
    if (!newCustomerName.trim()) return;
    const newCustomer = {
      id: Date.now(),
      name: newCustomerName,
      zone: newCustomerZone,
      city: newCustomerCity,
      class: newCustomerClass,
      specialty: newCustomerSpecialty,
      customerType: newCustomerType || "Hospital",
      parentCustomerId: newParentCustomerId ? newParentCustomerId.toString() : ""
    };
    setCustomers(prev => [...prev, newCustomer]);
    setSelectedCustomerId(newCustomer.id);
    setIsCreatingCustomer(false);
    
    // Reset form fields
    setNewCustomerName("");
    setNewCustomerCity("");
    setNewCustomerZone("North Kerala");
    setNewCustomerClass("Class A");
    setNewCustomerSpecialty("General");
    setNewCustomerType("Hospital");
    setNewParentCustomerId("");
    setParentSearchText("");

    // If we're on the customers view, we just wanted to add a customer, so close modal
    if (view === "customers") {
      setShowNewLead(false);
      setCustomerSearch(""); // clear search
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      const isSelected = prev.includes(productId);
      const newSelection = isSelected ? prev.filter(id => id !== productId) : [...prev, productId];

      // Auto-update lead name based on selected products
      const selectedProductNames = catalog.filter(p => newSelection.includes(p.id)).map(p => p.name);
      if (selectedProductNames.length > 0) {
        setLeadName(selectedProductNames.join(" & "));
      } else {
        setLeadName("");
      }

      return newSelection;
    });
  };

  const createLead = () => {
    if (!selectedCustomerId) return;
    const customer = customers.find(c => c.id === parseInt(selectedCustomerId));

    // Identify categories
    const selectedProductsObjs = catalog.filter(p => selectedProducts.includes(p.id));
    const categories = [...new Set(selectedProductsObjs.map(p => {
      // Direct category names from catalog
      if (p.category === "Ultrasound") return "Ultrasound";
      // Merge all others (Critical Care, Ventilator etc) into Critical Care per recent rules
      return "Critical Care";
    }))];

    const associatedProj = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
    const projFields = associatedProj ? { projectId: associatedProj.id, projectName: associatedProj.projectName } : {};

    // Splitting Logic: Trigger only if BOTH Ultrasound and Critical Care are present
    if (categories.includes("Ultrasound") && categories.includes("Critical Care")) {
      const gId = `GRP-${Date.now()}`;

      const newDeals = categories.map(cat => {
        const catProducts = selectedProductsObjs.filter(p => {
          const pCat = p.category === "Ultrasound" ? "Ultrasound" : "Critical Care";
          return pCat === cat;
        });
        const catProdIds = catProducts.map(p => p.id);
        const catProdNames = catProducts.map(p => p.name).join(" & ");

        // Find Supervisory Manager from Routing Map
        const supervisoryManager = categoryAssignments[customer.zone]?.[cat] || "Manager";

        return {
          id: Date.now() + Math.random(),
          name: `${customer.name} – ${catProdNames} (${cat})`,
          stage: "Lead",
          value: "₹0L", // User needs to set value for splits
          probability: 10,
          owner: currentUser === "Manager" ? supervisoryManager : currentUser,
          supervisoryManager: supervisoryManager,
          lastActivity: "Just now",
          timeline: [{ text: `[SYSTEM] Automatically split from multi-category requirement. Group ID: ${gId}` }],
          productIds: catProdIds,
          groupId: gId,
          category: cat,
          source: leadSource,
          campaign: leadCampaign,
          region: customer.zone,
          isPriority: false,
          ...projFields
        };
      });

      setDeals(prev => [...newDeals, ...prev]);
    } else {
      // Single category or no categories (General)
      const primaryCat = categories[0] || "Ultrasound";
      const supervisoryManager = categoryAssignments[customer.zone]?.[primaryCat] || "Manager";

      const newDeal = {
        id: Date.now(),
        name: `${customer.name} – ${leadName || "General Equipment"}`,
        stage: "Lead",
        value: leadValue ? `₹${leadValue}L` : "₹0L",
        probability: 10,
        owner: currentUser === "Manager" ? supervisoryManager : currentUser,
        supervisoryManager: supervisoryManager,
        lastActivity: "Just now",
        timeline: [],
        productIds: selectedProducts,
        category: primaryCat,
        source: leadSource,
        campaign: leadCampaign,
        region: customer.zone,
        isPriority: false,
        ...projFields
      };
      setDeals(prev => [newDeal, ...prev]);
    }

    // Reset wizard
    setLeadName("");
    setLeadValue("");
    setLeadSource("Direct Inquiry");
    setLeadCampaign("");
    setLeadRegion("North Kerala");
    setSelectedCustomerId("");
    setSelectedProducts([]);
    setSelectedProjectId("");
    setLeadWizardStep(1);
    setShowNewLead(false);
  };

  const visibleDeals = currentUser === "Manager" ? deals : deals.filter(d => d.owner === currentUser);

  const dashboardDeals = (currentUser === "Manager" && view === "manager" && managerFilter !== "All")
    ? visibleDeals.filter(d => {
      if (managerFilter.startsWith("Zone:")) {
        const zone = managerFilter.split(":")[1];
        return repData[d.owner]?.zone === zone;
      } else if (managerFilter.startsWith("Rep:")) {
        const rep = managerFilter.split(":")[1];
        return d.owner === rep;
      }
      return true;
    })
    : visibleDeals;

  const dashboardDealsRibbon = currentUser === "Manager"
    ? dashboardDeals
    : visibleDeals;

  const parseValue = (valStr) => parseFloat(valStr.replace(/[^\d.]/g, '')) || 0;

  const targetQuota = currentUser === "Manager"
    ? (managerFilter.startsWith("Rep:")
      ? (repData[managerFilter.split(":")[1]]?.target[targetSubjectFilter] || 0)
      : managerFilter.startsWith("Zone:")
        ? Object.values(repData).filter(r => r.zone === managerFilter.split(":")[1]).reduce((sum, r) => sum + r.target[targetSubjectFilter], 0)
        : Object.values(repData).reduce((sum, r) => sum + r.target[targetSubjectFilter], 0))
    : (repData[currentUser]?.target[targetSubjectFilter] || 0);

  const getDealCategory = (deal) => {
    if (deal.productIds && deal.productIds.length > 0) {
      const product = initialCatalog.find(p => p.id === deal.productIds[0]);
      if (product) return product.category.toLowerCase().replace(" ", "");
    }
    const name = deal.name.toLowerCase();
    if (name.includes("ventilator") || name.includes("magnamed") || name.includes("fleximag") || name.includes("oxymag") || name.includes("monitor") || name.includes("defibrillator") || name.includes("ecg") || name.includes("gas") || name.includes("analyzer") || name.includes("blood") || name.includes("critical")) return "criticalcare";
    return "ultrasound";
  };

  const getDealSbu = (deal) => {
    if (deal.productIds && deal.productIds.length > 0) {
      const product = catalog.find(p => p.id === deal.productIds[0]);
      if (product && product.sbu) return product.sbu;
    }
    const cat = getDealCategory(deal);
    if (cat === "criticalcare") return "Critical Care";
    return "Imaging";
  };

  const getBackLabel = () => {
    switch (view) {
      case "pipeline": return "Deals Pipeline";
      case "manager": return "Deals List";
      case "customers": return "Customer Directory";
      case "projects": return "Projects Master";
      case "beat-planning": return "Beat Planning Workspace";
      case "catalog": return "Product Catalog";
      case "reminders": return "Next Actions";
      case "insights": return "Insights";
      default: return "Dashboard";
    }
  };

  const activePipelineDeals = dashboardDealsRibbon.filter(d => d.stage !== "Closed Won" && d.stage !== "Lost" && d.state !== "On Hold");

  const ordersDeals = dashboardDealsRibbon.filter(d => d.stage === "Closed Won" && d.state !== "On Hold");
  const bookedRevenue = ordersDeals.reduce((sum, deal) => sum + parseValue(deal.value), 0);
  const attainment = targetQuota > 0 ? Math.round((bookedRevenue / targetQuota) * 100) : 0;

  const lastMonthWonDeals = ordersDeals.filter(d => d.isLastMonth && d.state !== "On Hold");
  const lastMonthWonValue = lastMonthWonDeals.reduce((sum, deal) => sum + parseValue(deal.value), 0);

  const probableForecastValue = activePipelineDeals.reduce((sum, deal) => sum + (parseValue(deal.value) * (deal.probability / 100)), 0);

  const lostDeals = dashboardDealsRibbon.filter(d => d.stage === "Lost");
  const lostDealsValue = lostDeals.reduce((sum, deal) => sum + parseValue(deal.value), 0);

  const getDaysAgo = (lastActivityStr) => {
    if (lastActivityStr === "Just now" || lastActivityStr.includes("h ago")) return 0;
    if (lastActivityStr.includes("d ago")) return parseInt(lastActivityStr) || 0;
    return 0;
  };

  const stagnantDealsCount = activePipelineDeals.filter(d => getDaysAgo(d.lastActivity) > 7).length;
  const overdueHoldCount = visibleDeals.filter(isHoldOverdue).length;

  const matchesMetricFilter = (deal) => {
    if (!metricFilter) return true;
    if (metricFilter === "orders") return deal.stage === "Closed Won";
    if (metricFilter === "hot") return deal.stage !== "Closed Won" && deal.stage !== "Lost";
    if (metricFilter === "won") return deal.stage === "Closed Won" && deal.isLastMonth;
    if (metricFilter === "lost") return deal.stage === "Lost";
    if (metricFilter === "stagnant") return deal.stage !== "Closed Won" && deal.stage !== "Lost" && getDaysAgo(deal.lastActivity) > 7;
    if (metricFilter === "overduehold") return isHoldOverdue(deal);
    return true;
  };


  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden relative">

      {/* Sidebar / Side Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar / Side Drawer Content */}
      <div className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[210] shadow-2xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg">
              <img src="/Cabio%20logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-extrabold text-lg tracking-tight">Sales OS</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-white/70 hover:text-white transition-colors">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="p-4 space-y-6 mt-4">
          <section>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-2">Main Navigation</h3>
            <div className="space-y-1">
              {[
                { id: "pipeline", label: "Deals Pipeline", icon: "📊" },
                { id: "manager", label: "Deals List", icon: "📋" },
                { id: "customers", label: "Customer Directory", icon: "🏥" },
                { id: "projects", label: "Projects", icon: "📁" },
                { id: "beat-planning", label: "Beat Planning", icon: "📅" },
                { id: "catalog", label: "Product Catalog", icon: "📦" },
                { id: "reminders", label: "Next Actions", icon: "✅" },
                { id: "insights", label: "Insights", icon: "💡" },
                ...(currentUser === "Manager" ? [{ id: "settings", label: "Target Settings", icon: "⚙️" }] : [])
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setIsSidebarOpen(false);
                    setSelectedDeal(null);
                    setSelectedAccount(null);
                    setSelectedProject(null);
                    setSelectedBeatPlan(null);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${view === item.id ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-2">Team Management</h3>
            <div className="bg-gray-50 p-3 rounded-2xl space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Acting As:</label>
              <select
                value={currentUser}
                onChange={(e) => {
                  setCurrentUser(e.target.value);
                  if (e.target.value !== "Manager") setView("pipeline");
                }}
                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Manager">👑 Manager</option>
                <option value="Basheer">👤 Basheer (Sales)</option>
                <option value="Amit">👤 Amit (Sales)</option>
                <option value="Rahul">👤 Rahul (Sales)</option>
              </select>
            </div>
          </section>
        </div>

        <div className="absolute bottom-8 left-6 right-6">
          <div className="p-4 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl text-white shadow-xl">
            <div className="text-[10px] font-black opacity-60 uppercase mb-1">Logged in as</div>
            <div className="font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              {currentUser === "Manager" ? "Administrator" : currentUser}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-4 py-3 flex justify-between items-center bg-white shadow-sm border-b border-gray-100 z-[100]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <span className="text-xl">☰</span>
          </button>
          <div className="flex items-center gap-3">
            <img src="/Cabio%20logo.jpeg" alt="Logo" className="h-10 object-contain" />
            <h1 className="text-lg font-black text-gray-800 tracking-tight hidden sm:block">Sales OS</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewLead(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs sm:text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="text-lg">＋</span>
            <span>Lead</span>
          </button>
        </div>
      </div>

      {/* Stagnation Banner */}
      {!selectedDeal && (view === "pipeline" || view === "manager") && (stagnantDealsCount > 0 || overdueHoldCount > 0) && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="text-amber-600 font-bold">⚠️ Action Required</span>
            <span className="text-amber-800 text-sm font-semibold">
              {stagnantDealsCount > 0 && `${stagnantDealsCount} pipeline deal${stagnantDealsCount > 1 ? 's have' : ' has'} no activity over the last 7 days. `}
              {overdueHoldCount > 0 && `${overdueHoldCount} On Hold deal${overdueHoldCount > 1 ? 's are' : ' is'} overdue for reactivation.`}
            </span>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            {stagnantDealsCount > 0 && (
              <button onClick={() => setMetricFilter(metricFilter === "stagnant" ? null : "stagnant")} className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider transition-colors shadow-sm ${metricFilter === "stagnant" ? "bg-amber-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}`}>Review Stagnant</button>
            )}
            {overdueHoldCount > 0 && (
              <button onClick={() => setMetricFilter(metricFilter === "overduehold" ? null : "overduehold")} className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider transition-colors shadow-sm ${metricFilter === "overduehold" ? "bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}>Review Overdue Hold</button>
            )}
          </div>
        </div>
      )}

      {/* Dashboard Metrics (Manager & Rep) */}
      {!selectedDeal && (view === "pipeline" || view === "manager") && (
        <div className="bg-white border-b px-2 sm:px-4 py-2 sm:py-3 shadow-sm z-10 relative grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4">
          <div className={`p-2 sm:p-3 rounded-lg sm:flex-1 shadow-sm transition-all flex flex-col justify-between ${metricFilter === "orders" ? "bg-blue-100 border-2 border-blue-500 ring-2 ring-blue-300" : "bg-blue-50 border border-blue-200 hover:shadow-md"}`}>
            <div className="flex justify-between items-start mb-0.5 sm:mb-1">
              <div onClick={() => setMetricFilter(metricFilter === "orders" ? null : "orders")} className="text-[10px] sm:text-xs text-blue-700 font-bold uppercase tracking-wider cursor-pointer">Target vs Actual</div>
              <select className="text-[9px] font-bold bg-white text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 outline-none cursor-pointer" value={targetSubjectFilter} onChange={e => setTargetSubjectFilter(e.target.value)}>
                <option value="annual">Annual Target</option>
                <option value="q1">Q1 Target</option>
                <option value="q2">Q2 Target</option>
                <option value="q3">Q3 Target</option>
                <option value="q4">Q4 Target</option>
              </select>
            </div>
            <div onClick={() => setMetricFilter(metricFilter === "orders" ? null : "orders")} className="cursor-pointer">
              <div className="text-lg sm:text-2xl font-extrabold text-blue-900">
                ₹{bookedRevenue.toFixed(1).replace(/\.0$/, '')}L <span className="text-[10px] sm:text-sm text-blue-600 font-semibold">/ ₹{targetQuota}L</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1 sm:h-1.5 mt-1 sm:mt-2 overflow-hidden shadow-inner">
                <div className={`h-full rounded-full whitespace-nowrap transition-all duration-700 ${attainment >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, attainment)}%` }}></div>
              </div>
            </div>
          </div>
          <div onClick={() => setMetricFilter(metricFilter === "hot" ? null : "hot")} className={`p-2 sm:p-3 rounded-lg sm:flex-1 shadow-sm cursor-pointer transition-all flex flex-col justify-between ${metricFilter === "hot" ? "bg-orange-100 border-2 border-orange-500 ring-2 ring-orange-300" : "bg-orange-50 border border-orange-200 hover:shadow-md"}`}>
            <div>
              <div className="text-[10px] sm:text-xs text-orange-700 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Risk-Weighted Forecast</div>
              <div className="text-lg sm:text-2xl font-extrabold text-orange-900">₹{probableForecastValue.toFixed(1).replace(/\.0$/, '')}L</div>
            </div>
            <div className="text-[9px] text-orange-600 mt-1 font-semibold">{activePipelineDeals.length} active deals</div>
          </div>
          <div onClick={() => setMetricFilter(metricFilter === "won" ? null : "won")} className={`p-2 sm:p-3 rounded-lg sm:flex-1 shadow-sm cursor-pointer transition-all ${metricFilter === "won" ? "bg-emerald-100 border-2 border-emerald-500 ring-2 ring-emerald-300" : "bg-emerald-50 border border-emerald-200 hover:shadow-md"}`}>
            <div className="text-[10px] sm:text-xs text-emerald-700 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Won Last Month</div>
            <div className="text-lg sm:text-2xl font-extrabold text-emerald-900">₹{lastMonthWonValue.toFixed(1).replace(/\.0$/, '')}L</div>
          </div>
          <div onClick={() => setMetricFilter(metricFilter === "lost" ? null : "lost")} className={`p-2 sm:p-3 rounded-lg sm:flex-1 shadow-sm cursor-pointer transition-all ${metricFilter === "lost" ? "bg-red-100 border-2 border-red-500 ring-2 ring-red-300" : "bg-red-50 border border-red-200 hover:shadow-md"}`}>
            <div className="text-[10px] sm:text-xs text-red-700 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Lost Deals</div>
            <div className="text-lg sm:text-2xl font-extrabold text-red-900">₹{lostDealsValue.toFixed(1).replace(/\.0$/, '')}L</div>
          </div>
        </div>
      )}
      {/* Pipeline */}
      {
        view === "pipeline" && (
          <div className="flex-1 overflow-x-auto min-h-0 bg-gray-100">
            <div className="flex gap-4 p-3 h-full overflow-y-auto">
              {stages.map(stage => (
                <div key={stage} className="min-w-[280px] bg-gray-200/50 rounded-2xl p-3 h-fit border border-gray-200/50">
                  <div className="sticky top-0 z-10 bg-gray-200/80 backdrop-blur-md -mx-3 -mt-3 p-4 mb-4 rounded-t-2xl border-b border-gray-300/50 flex justify-between items-center">
                    <h3 className="font-black text-[11px] text-gray-500 uppercase tracking-[0.2em]">{stage}</h3>
                    <span className="bg-white/50 px-2 py-0.5 rounded-lg text-[10px] font-black text-gray-400 border border-white/50">
                      {visibleDeals.filter(d => d.stage === stage).length}
                    </span>
                  </div>
                  {visibleDeals.filter(d => d.stage === stage)
                    .sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0) || b.probability - a.probability)
                    .map(deal => {
                      const isMatch = matchesMetricFilter(deal);
                      return (
                        <div
                          key={deal.id}
                          className={`p-3 rounded-xl shadow mb-3 cursor-pointer transition-all duration-300 border-l-4 ${deal.state === "On Hold" ? 'opacity-75' : ''} ${metricFilter && isMatch ? 'ring-2 ring-blue-400 shadow-lg scale-[1.02]' : metricFilter && !isMatch ? 'opacity-30' : ''}`}
                          style={{
                            backgroundColor: 'white',
                            borderLeftColor: isHoldOverdue(deal) ? '#ef4444' : (deal.isPriority ? '#fbbf24' : '#60a5fa'),
                            borderLeftWidth: isHoldOverdue(deal) ? '6px' : '4px'
                          }}
                          onClick={() => setSelectedDeal(deal)}
                        >
                          <div className="font-bold text-blue-900 text-sm mb-1 leading-tight">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                const acc = customers.find(c => deal.name.includes(c.name));
                                if (acc) setSelectedAccount(acc);
                              }}
                              className="hover:underline text-blue-600 decoration-blue-200"
                            >
                              {deal.name.split("–")[0]}
                            </span>
                            <span className="text-gray-300 font-normal mx-1">/</span>
                            <span className="text-gray-700">{deal.name.split("–")[1] || deal.name}</span>
                            {deal.state === "On Hold" && <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[7px] font-black uppercase tracking-wider rounded-md whitespace-nowrap">⏸ On Hold</span>}
                            {isHoldOverdue(deal) && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[7px] font-black uppercase tracking-wider rounded-md whitespace-nowrap animate-pulse">🚨 Reactivation Overdue</span>}
                          </div>
                          <div className="flex justify-between items-center text-sm font-bold mt-2">
                            <div className="text-gray-900">{deal.value}</div>
                            <div className="text-blue-600">🎯 {deal.probability}%</div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1 uppercase font-black tracking-widest opacity-70">
                            <div>⏳ {deal.lastActivity}</div>
                            <div>
                              {deal.contributors && deal.contributors.length > 1 ? (
                                <span className="inline-flex items-center gap-1 bg-indigo-600 text-white px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider shadow-sm">
                                  👥 Shared ({deal.contributors.length})
                                </span>
                              ) : (
                                <span>👤 {deal.owner}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3 mb-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateDeal(deal.id, { isPriority: !deal.isPriority });
                              }}
                              className={`p-1 w-7 h-7 rounded-lg transition-all flex items-center justify-center ${deal.isPriority ? "bg-amber-100 text-amber-500 shadow-sm border border-amber-200" : "bg-gray-50/50 text-gray-200 hover:text-gray-400 border border-transparent"}`}
                            >
                              <span className="text-sm leading-none">{deal.isPriority ? "⭐" : "☆"}</span>
                            </button>
                          </div>

                          <select
                            className="mt-2 w-full border rounded text-sm"
                            value={deal.stage}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => openEditModal(deal, e.target.value)}
                          >
                            {stages.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* Manager View */}
      {
        view === "manager" && (
          <div className="flex-1 overflow-y-auto min-h-0 bg-white">
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-4 border-b border-gray-100 shadow-sm flex justify-between items-center gap-4">
              <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="text-blue-600">📋</span> {currentUser === "Manager" ? "Leads List" : "My Deals"}
                <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-lg text-gray-400 font-black">{dashboardDeals.length} Total</span>
              </h2>
              {currentUser === "Manager" && (
                <select
                  value={managerFilter}
                  onChange={(e) => setManagerFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-[11px] font-black rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                >
                  <option value="All">All Regions</option>
                  <option value="Zone:North Kerala">Zone: North Kerala</option>
                  <option value="Zone:South Kerala">Zone: South Kerala</option>
                  <option value="Zone:Bangalore">Zone: Bangalore</option>
                  <optgroup label="Sales Reps">
                    <option value="Rep:Basheer">Rep: Basheer</option>
                    <option value="Rep:Amit">Rep: Amit</option>
                    <option value="Rep:Rahul">Rep: Rahul</option>
                  </optgroup>
                </select>
              )}
            </div>
            <div className="p-3">
              {(currentUser !== "Manager" || managerFilter === "All" ? visibleDeals : visibleDeals.filter(d => {
                if (managerFilter.startsWith("Zone:")) {
                  return repData[d.owner]?.zone === managerFilter.split(":")[1];
                } else if (managerFilter.startsWith("Rep:")) {
                  return d.owner === managerFilter.split(":")[1];
                }
                return true;
              }))
                .filter(matchesMetricFilter)
                .sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0) || b.probability - a.probability)
                .map(deal => (
                  <div
                    key={deal.id}
                    className="bg-white p-3 mb-2 rounded shadow border-l-4 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                    style={{ borderLeftColor: isHoldOverdue(deal) ? '#ef4444' : (deal.isPriority ? '#fbbf24' : '#60a5fa'), borderLeftWidth: isHoldOverdue(deal) ? '6px' : '4px' }}
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-blue-900 flex flex-wrap items-center gap-1">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            const acc = customers.find(c => deal.name.includes(c.name));
                            if (acc) setSelectedAccount(acc);
                          }}
                          className="text-blue-600 hover:text-blue-800 underline decoration-blue-200 font-bold flex items-center gap-0.5"
                        >
                          <span className="text-[10px]">🏥</span> {deal.name.split("–")[0]}
                        </span>
                        <span className="text-gray-300 font-normal">/</span>
                        <span className="text-gray-700">{deal.name.split("–")[1] || deal.name}</span>
                      </div>
                      <div className="font-bold text-gray-700">{deal.value}</div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1 uppercase font-black text-[9px] tracking-widest opacity-60 flex items-center gap-2">
                      <span>Stage: {deal.stage} &nbsp;|&nbsp; Owner: </span>
                      {deal.contributors && deal.contributors.length > 1 ? (
                        <span className="inline-flex items-center gap-1 bg-indigo-600 text-white px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider shadow-sm">
                          👥 Shared ({deal.contributors.length})
                        </span>
                      ) : (
                        <span className="text-blue-600">{deal.owner}</span>
                      )}
                      {deal.state === "On Hold" && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[7px] font-black uppercase tracking-wider rounded-md">⏸ On Hold</span>}
                      {isHoldOverdue(deal) && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[7px] font-black uppercase tracking-wider rounded-md animate-pulse">🚨 Reactivation Overdue</span>}
                    </div>
                    <div className="text-sm text-gray-500 mt-2 flex items-center justify-between">
                      <div className="font-bold text-gray-800">🎯 {deal.probability}% &nbsp;|&nbsp; ⏳ {deal.lastActivity}</div>
                      {deal.isPriority && <div className="text-amber-400 font-bold text-xs uppercase tracking-tighter">★ Priority</div>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )
      }

      {/* Reminders View (Phase 7 Refinement) */}
      {view === "reminders" && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 bg-gray-50/50">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Task Management</h3>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">Next Actions</h2>
            </div>
            <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-lg mr-2">📅</span>
              <span className="text-sm font-black text-gray-700">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Group reminders by owner for Manager, or just show for User */}
            {(currentUser === "Manager" ? ["Manager", ...new Set(reminders.map(r => r.owner))].filter((v, i, a) => a.indexOf(v) === i) : [currentUser]).map(owner => {
              const userReminders = reminders.filter(r => r.owner === owner && r.status === "pending");
              if (userReminders.length === 0 && currentUser !== "Manager") return (
                <div key="none" className="bg-white border-2 border-dashed border-gray-100 rounded-[32px] p-10 text-center animate-in fade-in duration-700">
                  <span className="text-4xl mb-4 block">🎉</span>
                  <div className="text-gray-400 font-bold text-sm italic">All caught up! No pending actions.</div>
                </div>
              );
              if (userReminders.length === 0 && currentUser === "Manager") return null;

              return (
                <div key={owner} className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
                  {currentUser === "Manager" && (
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2 flex justify-between">
                      <span>{owner === "Manager" ? "My Tasks" : `${owner}'s Tasks`}</span>
                      <span>{userReminders.length} Pending</span>
                    </h3>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userReminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(r => {
                      const isOverdue = new Date(r.dueDate) < new Date().setHours(0, 0, 0, 0);
                      const hospital = customers.find(c => c.id === r.accountId);
                      return (
                        <div key={r.id} className={`bg-white p-5 rounded-[32px] border-2 shadow-sm transition-all hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50/10' : 'border-white'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                              {isOverdue ? "Overdue" : "Upcoming"}
                            </span>
                            <span className={`text-[10px] font-black ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>{r.dueDate}</span>
                          </div>
                          <div className="text-lg font-black text-gray-800 mb-1 leading-tight">{r.text}</div>
                          <div
                            onClick={() => {
                              const deal = deals.find(d => d.id === r.dealId);
                              if (deal) setSelectedDeal(deal);
                              else if (hospital) setSelectedAccount(hospital);
                            }}
                            className="text-[11px] text-blue-600 font-bold mb-6 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            📍 {hospital?.name || "Unknown Hospital"} &rarr;
                          </div>
                          <button
                            onClick={() => completeReminder(r)}
                            className="w-full py-3 bg-gray-50 hover:bg-green-600 text-gray-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-gray-100 hover:border-green-600 flex items-center justify-center gap-2"
                          >
                            Complete Task
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Directory Screen */}
      {
        view === "customers" && (
          <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">Customer Directory</h2>
              <button
                onClick={() => { setShowNewLead(true); setIsCreatingCustomer(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <span>🏥</span> + New Customer
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search Hospital"
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  value={customerSearchText}
                  onChange={(e) => setCustomerSearchText(e.target.value)}
                  autoComplete="off"
                />
                {customerSearchText && (
                  <button
                    onClick={() => setCustomerSearchText("")}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-xs"
                  >
                    &times;
                  </button>
                )}
              </div>
              <select
                className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={customerZoneFilter}
                onChange={(e) => setCustomerZoneFilter(e.target.value)}
              >
                <option>All Zones</option>
                <option>North Kerala</option>
                <option>South Kerala</option>
                <option>Bangalore</option>
              </select>
              <select className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500" value={customerClassFilter} onChange={(e) => setCustomerClassFilter(e.target.value)}>
                <option>All Classes</option>
                <option value="Class A">Class A</option>
                <option value="Class B">Class B</option>
                <option value="Class C">Class C</option>
                <option value="Class D">Class D</option>
                <option value="Corporate">Corporate</option>
                <option value="Clinic">Clinic</option>
              </select>
              <select className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500" value={customerSpecialtyFilter} onChange={(e) => setCustomerSpecialtyFilter(e.target.value)}>
                <option>All Specialties</option>
                <option value="Multi Speciality">Multi Speciality</option>
                <option value="Urology">Urology</option>
                <option value="Ortho">Ortho</option>
                <option value="Cardiac">Cardiac</option>
                <option value="IVF">IVF</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Radiology">Radiology</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Pediatrics">Pediatrics</option>
              </select>
            </div>

            <div className="space-y-3">
              {customers
                .filter(acc =>
                  (customerZoneFilter === "All Zones" || acc.zone === customerZoneFilter) &&
                  (customerClassFilter === "All Classes" || acc.class === customerClassFilter || (!acc.class && customerClassFilter === 'All Classes')) &&
                  (customerSpecialtyFilter === "All Specialties" || acc.specialty === customerSpecialtyFilter || (!acc.specialty && customerSpecialtyFilter === 'All Specialties')) &&
                  acc.name?.toLowerCase().startsWith(customerSearchText.toLowerCase())
                )
                .map(acc => (
                  <div
                    key={acc.id}
                    onClick={() => setSelectedAccount(acc)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {acc.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-lg group-hover:text-blue-900 transition-colors">{acc.name}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                          <span>📍 {acc.city}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span>🌐 {acc.zone}</span>
                          {acc.customerType && (
                            <>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-normal normal-case border ${
                                acc.customerType === "Corporate Group"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : acc.customerType === "Department"
                                  ? "bg-pink-50 text-pink-700 border-pink-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>🏷️ {acc.customerType}</span>
                            </>
                          )}
                          {acc.class && (
                            <>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-normal normal-case border bg-indigo-50 text-indigo-700 border-indigo-200">📁 {acc.class}</span>
                            </>
                          )}
                          {acc.specialty && (
                            <>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-normal normal-case border bg-emerald-50 text-emerald-700 border-emerald-200">✨ {acc.specialty}</span>
                            </>
                          )}
                          {acc.parentCustomerId && (() => {
                            const parent = customers.find(c => c.id.toString() === acc.parentCustomerId.toString());
                            return parent ? (
                              <>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span className="text-gray-500 font-medium normal-case">🔗 Parent: <span className="text-gray-700 font-bold">{parent.name}</span></span>
                              </>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-blue-50 transition-colors">
                      <span className="text-gray-400 group-hover:text-blue-600 transition-colors">&rarr;</span>
                    </div>
                  </div>
                ))}
              {customers.filter(acc =>
                (customerZoneFilter === "All Zones" || acc.zone === customerZoneFilter) &&
                acc.name?.toLowerCase().startsWith(customerSearchText.toLowerCase())
              ).length === 0 && (
                  <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
                    No customers match your filters.
                  </div>
                )}
            </div>
          </div>
        )
      }

      {/* Projects Master Screen */}
      {view === "projects" && (
        <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">Projects Master</h2>
            <button
              onClick={() => openNewProjectModal("")}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <span>📁</span> + New Project
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search Projects"
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                value={projectSearchText}
                onChange={(e) => setProjectSearchText(e.target.value)}
                autoComplete="off"
              />
              {projectSearchText && (
                <button
                  onClick={() => setProjectSearchText("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-xs"
                >
                  &times;
                </button>
              )}
            </div>
            <select
              className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              value={projectTypeFilter}
              onChange={(e) => setProjectTypeFilter(e.target.value)}
            >
              <option value="All Types">All Types</option>
              <option value="New Hospital Build">New Hospital Build</option>
              <option value="Expansion">Expansion</option>
              <option value="Equipment Upgrade">Equipment Upgrade</option>
              <option value="Renovation">Renovation</option>
              <option value="Digital Transformation">Digital Transformation</option>
            </select>
            <select
              className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              value={projectStatusFilter}
              onChange={(e) => setProjectStatusFilter(e.target.value)}
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Project Name</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Project Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Expected Close Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                  {projects
                    .filter(proj => {
                      const matchesSearch = proj.projectName?.toLowerCase().includes(projectSearchText.toLowerCase()) ||
                        proj.customerName?.toLowerCase().includes(projectSearchText.toLowerCase());
                      const matchesType = projectTypeFilter === "All Types" || proj.projectType === projectTypeFilter;
                      const matchesStatus = projectStatusFilter === "All Statuses" || proj.status === projectStatusFilter;
                      return matchesSearch && matchesType && matchesStatus;
                    })
                    .map(proj => (
                      <tr key={proj.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{proj.projectName}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              const cust = customers.find(c => c.id.toString() === proj.customerId.toString());
                              if (cust) setSelectedAccount(cust);
                            }}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            {proj.customerName}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-500">{proj.projectType}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            proj.status === "Active" ? "bg-green-50 text-green-700 border border-green-200" :
                            proj.status === "Planning" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                            proj.status === "On Hold" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}>
                            {proj.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-500">{proj.expectedCloseDate || "N/A"}</td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedProject(proj)}
                            className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditProjectModal(proj)}
                            className="bg-gray-50 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  {projects.filter(proj => {
                    const matchesSearch = proj.projectName?.toLowerCase().includes(projectSearchText.toLowerCase()) ||
                      proj.customerName?.toLowerCase().includes(projectSearchText.toLowerCase());
                    const matchesType = projectTypeFilter === "All Types" || proj.projectType === projectTypeFilter;
                    const matchesStatus = projectStatusFilter === "All Statuses" || proj.status === projectStatusFilter;
                    return matchesSearch && matchesType && matchesStatus;
                  }).length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-gray-400 italic">
                        No projects found matching the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Beat Planning Workspace Screen */}
      {view === "beat-planning" && (() => {
        const visibleBeatPlans = currentUser === "Manager" ? beatPlans : beatPlans.filter(bp => bp.userId === currentUser);

        const filteredBeatPlans = visibleBeatPlans.filter(bp => {
          const matchesStatus = beatStatusFilter === "All Statuses" || bp.status === beatStatusFilter;
          const matchesSalesperson = beatSalespersonFilter === "All Salespersons" || bp.userId === beatSalespersonFilter;
          const matchesQuarter = beatQuarterFilter === "All Quarters" || bp.quarter === beatQuarterFilter;
          return matchesStatus && matchesSalesperson && matchesQuarter;
        });

        const totalBeatPlansCount = visibleBeatPlans.length;
        const submittedPlansCount = visibleBeatPlans.filter(bp => bp.status === "Submitted").length;
        const approvedPlansCount = visibleBeatPlans.filter(bp => bp.status === "Approved").length;
        
        // Sum expected revenue and count planned hospitals and visits
        const allVisibleAccounts = visibleBeatPlans.flatMap(bp => bp.accounts || []);
        const hospitalsPlannedCount = new Set(allVisibleAccounts.map(a => a.customerId)).size;
        const totalPlannedVisits = allVisibleAccounts.reduce((sum, a) => sum + (a.plannedVisitCount || 0), 0);
        const totalExpectedRevenue = allVisibleAccounts.reduce((sum, a) => sum + (a.expectedRevenue || 0), 0);

        // Progress & Compliance Averages (considering Approved beat plans only)
        const approvedPlans = visibleBeatPlans.filter(bp => bp.status === "Approved");
        let avgProgress = 0;
        let avgCompliance = 0;

        if (approvedPlans.length > 0) {
          let progressSum = 0;
          let complianceSum = 0;

          approvedPlans.forEach(bp => {
            const bpPlannedVisits = bp.accounts.reduce((sum, a) => sum + (a.plannedVisitCount || 0), 0);
            let bpActivitiesLogged = 0;
            let coveredHospitals = 0;

            bp.accounts.forEach(a => {
              const matchingActs = activities.filter(act => 
                act.accountId && a.customerId && act.accountId.toString() === a.customerId.toString() &&
                getActivityQuarter(act) === bp.quarter
              );
              bpActivitiesLogged += matchingActs.length;
              if (matchingActs.length > 0) {
                coveredHospitals += 1;
              }
            });

            const progressVal = bpPlannedVisits > 0 
              ? Math.min(100, (bpActivitiesLogged / bpPlannedVisits) * 100) 
              : 0;
            progressSum += progressVal;

            const complianceVal = bp.accounts.length > 0 
              ? (coveredHospitals / bp.accounts.length) * 100 
              : 0;
            complianceSum += complianceVal;
          });

          avgProgress = progressSum / approvedPlans.length;
          avgCompliance = complianceSum / approvedPlans.length;
        }

        const uniqueSalespersons = [...new Set(visibleBeatPlans.map(bp => bp.userId))];

        return (
          <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Sales Planning</h3>
                <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight font-black">Beat Planning Workspace</h2>
              </div>
              <button
                onClick={openNewBeatPlanModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <span>📅</span> + New Beat Plan
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Total Plans</span>
                <div className="text-xl font-black text-blue-900">{totalBeatPlansCount}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Hospitals</span>
                <div className="text-xl font-black text-blue-900">{hospitalsPlannedCount}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Planned Visits</span>
                <div className="text-xl font-black text-blue-900">{totalPlannedVisits}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Expected Rev</span>
                <div className="text-xl font-black text-blue-900">₹{totalExpectedRevenue}L</div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Submitted</span>
                <div className="text-xl font-black text-orange-600">{submittedPlansCount}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Approved</span>
                <div className="text-xl font-black text-green-600">{approvedPlansCount}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Avg Progress</span>
                <div className="text-xl font-black text-blue-900">{Math.round(avgProgress)}%</div>
                <div className="w-full bg-gray-100 rounded-full h-1 mt-2 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${avgProgress}%` }}></div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Avg Compliance</span>
                <div className="text-xl font-black text-green-700">{Math.round(avgCompliance)}%</div>
                <div className="w-full bg-gray-100 rounded-full h-1 mt-2 overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full" style={{ width: `${avgCompliance}%` }}></div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex-grow flex-1 min-w-[150px]">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Filter Status</label>
                <select
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  value={beatStatusFilter}
                  onChange={(e) => setBeatStatusFilter(e.target.value)}
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>

              <div className="flex-grow flex-1 min-w-[150px]">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Filter Quarter</label>
                <select
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  value={beatQuarterFilter}
                  onChange={(e) => setBeatQuarterFilter(e.target.value)}
                >
                  <option value="All Quarters">All Quarters</option>
                  <option value="Q1 2026">Q1 2026</option>
                  <option value="Q2 2026">Q2 2026</option>
                  <option value="Q3 2026">Q3 2026</option>
                  <option value="Q4 2026">Q4 2026</option>
                </select>
              </div>

              {currentUser === "Manager" && (
                <div className="flex-grow flex-1 min-w-[150px]">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Filter Salesperson</label>
                  <select
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    value={beatSalespersonFilter}
                    onChange={(e) => setBeatSalespersonFilter(e.target.value)}
                  >
                    <option value="All Salespersons">All Salespersons</option>
                    {uniqueSalespersons.map(sp => (
                      <option key={sp} value={sp}>{sp}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Quarter</th>
                      <th className="px-6 py-4">Salesperson</th>
                      <th className="px-6 py-4">Hospitals Planned</th>
                      <th className="px-6 py-4">Total Planned Visits</th>
                      <th className="px-6 py-4">Total Expected Revenue</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                    {filteredBeatPlans.map(bp => {
                      const hospitalsCount = bp.accounts ? bp.accounts.length : 0;
                      const totalVisits = bp.accounts ? bp.accounts.reduce((sum, a) => sum + (a.plannedVisitCount || 0), 0) : 0;
                      const totalRev = bp.accounts ? bp.accounts.reduce((sum, a) => sum + (a.expectedRevenue || 0), 0) : 0;

                      return (
                        <tr key={bp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-blue-600">
                            <button
                              onClick={() => setSelectedBeatPlan(bp)}
                              className="hover:underline font-bold text-left"
                            >
                              {bp.quarter}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-gray-500">{bp.userName}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-gray-500">{hospitalsCount}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-gray-500">{totalVisits}</td>
                          <td className="px-6 py-4 font-bold text-gray-900">₹{totalRev}L</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              bp.status === "Approved" ? "bg-green-50 text-green-700 border border-green-200" :
                              bp.status === "Submitted" ? "bg-orange-50 text-orange-700 border border-orange-200" :
                              "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}>
                              {bp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedBeatPlan(bp)}
                              className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors"
                            >
                              View
                            </button>
                            {bp.status === "Draft" && bp.userId === currentUser && (
                              <>
                                <button
                                  onClick={() => openEditBeatPlanModal(bp)}
                                  className="bg-gray-50 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => submitBeatPlanDirectly(bp)}
                                  className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-orange-600 hover:text-white transition-colors"
                                >
                                  Submit
                                </button>
                              </>
                            )}
                            {bp.status === "Submitted" && currentUser === "Manager" && (
                              <button
                                onClick={() => approveBeatPlan(bp)}
                                className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition-colors"
                              >
                                Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredBeatPlans.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-gray-400 italic">
                          No beat plans found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Product Catalog Screen */}
      {view === "catalog" && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Product Catalog</h2>
            </div>
            {currentUser === "Manager" && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setNewProductName("");
                  setNewProductBrand("");
                  setNewProductModel("");
                  setNewProductSbu("Imaging");
                  setNewProductOem("Sonoscape");
                  setNewProductPrice("");
                  setNewProductCollaterals([]);
                  setIsProductModalOpen(true);
                }}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="text-lg">＋</span>
                Machine
              </button>
            )}
          </div>

          <div className="mb-8">
            <select
              className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-widest text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              value={catalogCategoryFilter}
              onChange={(e) => setCatalogCategoryFilter(e.target.value)}
            >
              <option value="All">All SBUs</option>
              <option value="Imaging">Imaging</option>
              <option value="Critical Care">Critical Care</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Brand</th>
                    <th className="px-6 py-4">Model</th>
                    <th className="px-6 py-4">SBU</th>
                    <th className="px-6 py-4">OEM</th>
                    <th className="px-6 py-4">Price Range</th>
                    <th className="px-6 py-4">Collaterals</th>
                    {currentUser === "Manager" && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                  {catalog.filter(p => catalogCategoryFilter === "All" || p.sbu === catalogCategoryFilter).map(prod => (
                    <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 uppercase tracking-tight">{prod.name}</td>
                      <td className="px-6 py-4 text-gray-500 font-semibold">{prod.brand || "—"}</td>
                      <td className="px-6 py-4 text-gray-500 font-semibold">{prod.model || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                          prod.sbu === "Imaging" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                          prod.sbu === "Critical Care" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}>
                          {prod.sbu || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-semibold">{prod.oem || "—"}</td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-700">{prod.priceRange}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 max-w-[150px]">
                          {(prod.collaterals || []).map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                            >
                              <span>📄</span> {link.label || "Link"}
                            </a>
                          ))}
                          {(!prod.collaterals || prod.collaterals.length === 0) && (
                            <span className="text-gray-400 italic text-xs">—</span>
                          )}
                        </div>
                      </td>
                      {currentUser === "Manager" && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setNewProductName(prod.name);
                              setNewProductBrand(prod.brand || "");
                              setNewProductModel(prod.model || "");
                              setNewProductSbu(prod.sbu || "Imaging");
                              setNewProductOem(prod.oem || "Sonoscape");
                              setNewProductPrice(prod.priceRange || "");
                              setNewProductCollaterals(prod.collaterals || []);
                              setIsProductModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-blue-100 shadow-sm"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {catalog.filter(p => catalogCategoryFilter === "All" || p.sbu === catalogCategoryFilter).length === 0 && (
                    <tr>
                      <td colSpan={currentUser === "Manager" ? 8 : 7} className="text-center py-12 text-gray-400 italic">
                        No products found in this SBU.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reporting & Analytics Screen */}
      {view === "insights" && (
        <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50 p-4 sm:p-6 pb-24">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Phase 1 Analytics</h3>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">Reporting Dashboard</h2>
            </div>
            {currentUser !== "Manager" && <div className="bg-gray-100 text-gray-400 font-extrabold text-[10px] px-3 py-1 rounded-lg uppercase text-center ml-4 border border-gray-200">
              <span className="text-gray-600 sm:text-xs text-[11px] block">{dashboardDeals.filter(matchesMetricFilter).length}</span> Total
            </div>
            }
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {(() => {
              const decidedDeals = dashboardDealsRibbon.filter(d => d.stage === "Order" || d.stage === "Lost");
              const wonDeals = decidedDeals.filter(d => d.stage === "Order");
              const winRate = decidedDeals.length > 0 ? Math.round((wonDeals.length / decidedDeals.length) * 100) : 0;

              const activeD = dashboardDealsRibbon.filter(d => d.stage !== "Order" && d.stage !== "Lost" && d.state !== "On Hold");
              const stagnantDeals = activeD.filter(d => getDaysAgo(d.lastActivity) > 7);

              // Demo Tracking (Closed Deals Only)
              const closedDealsForDemo = dashboardDealsRibbon.filter(d => d.stage === "Order" || d.stage === "Lost");
              const demoedClosedDeals = closedDealsForDemo.filter(d => d.timeline?.some(t => t.text?.toLowerCase().includes("demo")));
              const wonDemoDeals = demoedClosedDeals.filter(d => d.stage === "Order");
              const demoConvRate = demoedClosedDeals.length > 0 ? Math.round((wonDemoDeals.length / demoedClosedDeals.length) * 100) : 0;

              const imagingVal = activeD.filter(d => getDealSbu(d) === "Imaging").reduce((acc, d) => acc + parseValue(d.value), 0);
              const criticalCareVal = activeD.filter(d => getDealSbu(d) === "Critical Care").reduce((acc, d) => acc + parseValue(d.value), 0);

              return (
                <>
                  <div
                    onClick={() => {
                      const priorityDeals = activeD.filter(d => d.isPriority || d.probability >= 70);
                      setDrilldownReport({ title: "Weekly Focus: High Priority & Starred", data: priorityDeals });
                    }}
                    className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-2xl shadow-lg border border-amber-400 flex flex-col justify-between hover:scale-[1.02] transition-all cursor-pointer text-white sm:col-span-2 lg:col-span-1">
                    <div className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-2 flex justify-between">Weekly Focus <span>⭐</span></div>
                    <div className="text-3xl font-extrabold">
                      {activeD.filter(d => d.isPriority || d.probability >= 70).length}
                    </div>
                    <div className="text-[9px] text-white/90 font-bold mt-3 bg-black/10 rounded-lg px-2 py-1 inline-block w-fit border border-white/20 uppercase tracking-wider">
                      High Prob & Starred &rarr;
                    </div>
                  </div>

                  <div
                    onClick={() => setDrilldownReport({ title: "Closed Won Deals", data: wonDeals })}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                    <div className="text-[10px] font-black text-gray-400 group-hover:text-blue-500 transition-colors uppercase tracking-widest mb-2 flex justify-between">Win Rate <span>🎯</span></div>
                    <div className="text-3xl font-extrabold text-blue-900">{winRate}%</div>
                    <div className="text-[10px] text-gray-500 font-bold mt-3 bg-gray-50 rounded-lg px-2 py-1 inline-block w-fit border border-gray-100 uppercase tracking-wider">
                      {wonDeals.length} won / {decidedDeals.length} decided &rarr;
                    </div>
                  </div>

                  <div
                    onClick={() => setDrilldownReport({ title: "Stagnant Deals (>7 Days)", data: stagnantDeals })}
                    className="bg-amber-50 p-5 rounded-2xl shadow-sm border border-amber-100 flex flex-col justify-between hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group">
                    <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 flex justify-between">Stagnant Deals <span>⏳</span></div>
                    <div className="text-3xl font-extrabold text-amber-600">{stagnantDeals.length}</div>
                    <div className="text-[10px] text-amber-800 font-bold mt-3 bg-amber-100 rounded-lg px-2 py-1 inline-block w-fit border border-amber-200 uppercase tracking-wider">
                      No activity in 7+ Days &rarr;
                    </div>
                  </div>

                  <div
                    onClick={() => setDrilldownReport({ title: "Demo-to-Order Conversions", data: demoedClosedDeals })}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                    <div className="text-[10px] font-black text-gray-400 group-hover:text-blue-500 uppercase tracking-widest mb-2 flex justify-between">Demo Conversion <span>🔬</span></div>
                    <div className="text-3xl font-extrabold text-gray-800">{demoConvRate}%</div>
                    <div className="text-[10px] text-gray-500 font-bold mt-3 bg-gray-50 rounded-lg px-2 py-1 inline-block w-fit border border-gray-100 uppercase tracking-wider">
                      {wonDemoDeals.length} out of {demoedClosedDeals.length} Demos &rarr;
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex justify-between">Pipeline by SBU <span>📊</span></div>
                    <div className="flex flex-col justify-end gap-1 mt-auto">
                      <div onClick={() => setDrilldownReport({ title: "Active Imaging Pipeline", data: activeD.filter(d => getDealSbu(d) === "Imaging") })} className="flex justify-between items-center text-xs font-bold p-1.5 -mx-1.5 rounded-lg cursor-pointer hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors"><span className="text-indigo-600">Imaging</span> <span className="flex items-center gap-1">₹{(imagingVal / 100).toFixed(1)} Cr <span className="text-[10px] text-gray-300">&rarr;</span></span></div>
                      <div onClick={() => setDrilldownReport({ title: "Active Critical Care Pipeline", data: activeD.filter(d => getDealSbu(d) === "Critical Care") })} className="flex justify-between items-center text-xs font-bold p-1.5 -mx-1.5 rounded-lg cursor-pointer hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"><span className="text-rose-600">Critical Care</span> <span className="flex items-center gap-1">₹{(criticalCareVal / 100).toFixed(1)} Cr <span className="text-[10px] text-gray-300">&rarr;</span></span></div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 pl-1">Salesperson Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {["Basheer", "Amit", "Rahul"].filter(rep => currentUser === "Manager" || currentUser === rep).map(rep => {
              const repDeals = deals.filter(d => d.owner === rep);
              const wonTotal = repDeals.filter(d => d.stage === "Order" && d.state !== "On Hold").reduce((a, b) => a + parseValue(b.value), 0);
              const pipeTotal = repDeals.filter(d => d.stage !== "Order" && d.stage !== "Lost" && d.state !== "On Hold").reduce((a, b) => a + parseValue(b.value), 0);
              const pendingCount = reminders.filter(r => r.owner === rep && r.status === "pending").length;

              return (
                <div key={rep} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50">
                    <div className="font-extrabold text-gray-800 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-inner">
                        {rep.substring(0, 2).toUpperCase()}
                      </span>
                      <div>
                        {rep}
                        <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{repData[rep]?.zone}</div>
                      </div>
                    </div>
                    {pendingCount > 0 && (
                      <span
                        onClick={() => setView('reminders')}
                        className="bg-red-100 text-red-600 text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-red-200 cursor-pointer hover:bg-red-200 transition-colors active:scale-95 shadow-sm"
                      >
                        {pendingCount} Actions
                      </span>
                    )}
                  </div>
                  <div className="space-y-3 mt-auto">
                    <div
                      onClick={() => setDrilldownReport({ title: `${rep}: Closed Won Deals`, data: repDeals.filter(d => d.stage === "Order") })}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors group">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Closed Won</span>
                      <span className="font-extrabold text-emerald-600 flex items-center gap-2">₹{wonTotal}L <span className="text-[10px] opacity-0 group-hover:opacity-100 text-gray-400">&rarr;</span></span>
                    </div>
                    <div
                      onClick={() => setDrilldownReport({ title: `${rep}: Active Pipeline`, data: repDeals.filter(d => d.stage !== "Order" && d.stage !== "Lost") })}
                      className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors group">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Active Pipeline</span>
                      <span className="font-extrabold text-blue-900 flex items-center gap-2">₹{pipeTotal}L <span className="text-[10px] opacity-0 group-hover:opacity-100 text-blue-300">&rarr;</span></span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Deal Detail */}
      {/* Deal Detail */}
      {
        selectedDeal && (
          <div className="fixed inset-0 bg-white overflow-y-auto z-[999]">
            <div className="p-4 max-w-2xl mx-auto pb-24">
              <button
                onClick={() => setSelectedDeal(null)}
                className="mb-6 bg-gray-50 text-gray-400 hover:text-blue-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 w-fit transition-all uppercase tracking-wider border border-gray-100"
              >
                &larr; Back to {getBackLabel()}
              </button>

              {isHoldOverdue(selectedDeal) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-3 shadow-sm animate-pulse">
                  <span className="text-xl">🚨</span>
                  <div className="text-xs font-semibold leading-relaxed">
                    <span className="font-extrabold uppercase block text-[10px] text-red-600 tracking-wider mb-0.5">Hold Reactivation Overdue</span>
                    This opportunity has remained On Hold past its expected reactivation date of <span className="font-extrabold underline">{selectedDeal.holdReactivationDate}</span>. Please resume the deal or update the hold reactivation settings.
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div>
                  <div
                    onClick={() => {
                      const acc = customers.find(c => selectedDeal.name.includes(c.name));
                      if (acc) {
                        setSelectedAccount(acc);
                        setSelectedDeal(null);
                      }
                    }}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] cursor-pointer hover:underline mb-2"
                  >
                    &larr; {selectedDeal.name.split('–')[0]}
                  </div>
                  <h2 className="font-extrabold text-3xl text-gray-800 leading-tight uppercase tracking-tight flex items-center gap-3">
                    {selectedDeal.name.split('–')[1] || selectedDeal.name}
                    {selectedDeal.isPriority && <span className="text-amber-400 text-2xl">⭐</span>}
                  </h2>
                </div>
                <button
                  onClick={() => openEditModal(selectedDeal)}
                  className="w-12 h-12 bg-white border-2 border-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50/50 transition-all font-bold text-xl shadow-sm"
                >
                  ✎
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50 shadow-inner">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 opacity-60">Stage</div>
                  <div className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{selectedDeal.stage}</div>
                </div>
                <div className="bg-indigo-50/30 p-4 rounded-3xl border border-indigo-50 shadow-inner">
                  <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 opacity-70">SBU (Derived)</div>
                  <div className="text-[11px] font-black text-indigo-800 uppercase tracking-tight">{getDealSbu(selectedDeal)}</div>
                </div>
                <div className="bg-blue-50/30 p-4 rounded-3xl border border-blue-50 shadow-inner">
                  <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 opacity-70">Probability</div>
                  <div className="text-[13px] font-black text-blue-600">{selectedDeal.probability}%</div>
                </div>
              </div>

              {/* Opportunity State (PB-002) */}
              <div className={`p-5 rounded-3xl border-2 mb-8 transition-all duration-300 ${selectedDeal.state === "On Hold" ? "bg-amber-50/50 border-amber-200" : "bg-gray-50/30 border-gray-100"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Opportunity State</div>
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-xl ${selectedDeal.state === "On Hold" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"}`}>
                    {selectedDeal.state === "On Hold" ? "⏸ On Hold" : "✅ Active"}
                  </span>
                </div>

                {selectedDeal.state === "On Hold" && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-amber-200/50 text-xs font-semibold text-gray-700">
                    <div className="flex justify-between py-1 border-b border-amber-100/30">
                      <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Hold Reason</span>
                      <span className="font-extrabold">{selectedDeal.holdReason || "N/A"}</span>
                    </div>
                    <div className="py-1">
                      <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest block mb-1">Hold Notes</span>
                      <div className="bg-amber-50/30 border border-amber-100/50 p-2.5 rounded-xl text-gray-600 font-medium text-xs leading-relaxed italic whitespace-pre-wrap">
                        {selectedDeal.holdNotes || "No details entered."}
                      </div>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Expected Reactivation</span>
                      <span className="font-extrabold text-amber-900">{selectedDeal.holdReactivationDate || "Not scheduled"}</span>
                    </div>
                  </div>
                )}
              </div>


              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-[32px] border border-blue-100 flex items-center justify-between shadow-sm mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 text-2xl shadow-md border border-blue-50">👤</div>
                  <div>
                    <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Assigned Owner</div>
                    <div className="flex items-center gap-2">
                      <div className="text-base font-black text-indigo-900 uppercase">{selectedDeal.owner}</div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Estimated Value</div>
                  <div className="text-2xl font-black text-indigo-900 tracking-tighter">{selectedDeal.value}</div>
                </div>
              </div>

              {/* Opportunity Contributors Card (PB-004) */}
              <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-10">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opportunity Contributors</div>
                  {(() => {
                    const totalSplit = (selectedDeal.contributors || []).reduce((acc, curr) => acc + (parseInt(curr.split) || 0), 0);
                    return totalSplit === 100 ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-wider rounded-xl">
                        ✅ Allocation: {totalSplit}%
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black uppercase tracking-wider rounded-xl">
                        ⚠️ Allocation: {totalSplit}%
                      </span>
                    );
                  })()}
                </div>

                <div className="divide-y divide-gray-50">
                  {(selectedDeal.contributors || []).map((c, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">
                          {c.user.substring(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="text-gray-800 font-extrabold uppercase">{c.user}</div>
                          <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">{c.role}</div>
                        </div>
                      </div>
                      <div className="font-extrabold text-blue-900 text-sm">{c.split}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PO Grouping / Linked Deals UI */}
              {selectedDeal.groupId && (
                <div className="mb-10 bg-white p-6 rounded-[32px] border-2 border-gray-50 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/30 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700"></div>
                  <div className="relative">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="text-blue-500">🔗</span> Shared Purchase Order Group
                    </h3>
                    <div className="space-y-3">
                      {deals.filter(d => d.groupId === selectedDeal.groupId && d.id !== selectedDeal.id).map(linked => (
                        <div key={linked.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <div>
                            <div className="text-[11px] font-black text-gray-800 leading-tight uppercase tracking-tight">{linked.name.split('–')[1] || linked.name}</div>
                            <div className="text-[9px] font-bold text-gray-400 uppercase">{linked.owner} • {linked.stage}</div>
                          </div>
                          <button
                            onClick={() => setSelectedDeal(linked)}
                            className="bg-white px-3 py-1.5 rounded-xl border border-gray-100 text-[9px] font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest shadow-sm"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* PO Detail Linking */}
                    <div className="mt-6 pt-5 border-t border-gray-100 flex gap-4 items-center">
                      <div className="flex-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Group PO Reference</label>
                        <input
                          type="text"
                          placeholder="Link to common PO..."
                          className="w-full bg-white border-2 border-gray-50 p-2 rounded-xl text-xs font-bold outline-none focus:border-blue-200 transition-all"
                          value={selectedDeal.groupPONumber || ""}
                          onChange={(e) => {
                            const updatedVal = e.target.value;
                            setDeals(prev => prev.map(d => d.groupId === selectedDeal.groupId ? { ...d, groupPONumber: updatedVal } : d));
                            setSelectedDeal(prev => ({ ...prev, groupPONumber: updatedVal }));
                          }}
                        />
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Group Total</div>
                        <div className="text-sm font-black text-blue-900">
                          ₹{deals.filter(d => d.groupId === selectedDeal.groupId).reduce((acc, d) => acc + (parseInt(d.value.replace('₹', '').replace('L', '')) || 0), 0)}L
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Closed Won Handover Review Widget (PB-005) */}
              {(selectedDeal.stage === "Order" || selectedDeal.stage === "Closed Won") && (
                <div className="mb-6 animate-in fade-in duration-300">
                  <div className="bg-white p-6 rounded-[32px] border-2 border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b pb-3 border-gray-50">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span>📦</span> Closed Won Handover
                      </div>
                      {(() => {
                        const checklist = selectedDeal.handoverChecklist || [false, false, false];
                        const status = deriveHandoverStatus(checklist);
                        const badgeColors = {
                          Completed: "bg-emerald-500 text-white",
                          "In Progress": "bg-blue-500 text-white",
                          Pending: "bg-amber-500 text-white"
                        };
                        return (
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-xl ${badgeColors[status] || "bg-gray-500 text-white"}`}>
                            {status}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-700">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Handover Coordinator</span>
                        <span className="font-extrabold uppercase text-gray-800">{selectedDeal.handoverOwner || selectedDeal.owner || "Basheer"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Checklist Completion</span>
                        {(() => {
                          const checklist = selectedDeal.handoverChecklist || [false, false, false];
                          const completedCount = checklist.filter(Boolean).length;
                          const pct = Math.round((completedCount / checklist.length) * 100);
                          const filled = "■".repeat(completedCount);
                          const empty = "□".repeat(checklist.length - completedCount);
                          return (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-gray-500 text-[10px] tracking-widest bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">[{filled}{empty}]</span>
                              <span className="font-extrabold text-blue-600">{pct}%</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {selectedDeal.poNumber && (
                      <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Purchase Order Number</span>
                        <span className="font-extrabold text-blue-700 uppercase">{selectedDeal.poNumber}</span>
                      </div>
                    )}

                    <div className="space-y-3 pt-3 border-t border-gray-50">
                      <div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Handover Checklist Items</span>
                        <div className="space-y-1.5 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          {[
                            "Delivery schedule aligned with hospital readiness",
                            "Installation pre-requisites review completed",
                            "Clinical support staff assigned for onboarding"
                          ].map((item, idx) => {
                            const checklist = selectedDeal.handoverChecklist || [false, false, false];
                            const checked = checklist[idx] || false;
                            return (
                              <div key={idx} className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                <span className={checked ? "text-emerald-500 text-sm font-black" : "text-gray-300 text-sm"}>
                                  {checked ? "✓" : "○"}
                                </span>
                                <span className={checked ? "line-through text-gray-400" : "text-gray-700"}>{item}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Delivery Notes</span>
                        <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 text-gray-600 font-medium text-xs whitespace-pre-wrap leading-relaxed">
                          {selectedDeal.deliveryNotes || <span className="text-gray-400 italic">No delivery notes entered.</span>}
                        </div>
                      </div>

                      {selectedDeal.installationRequirements && (
                        <div>
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Installation Requirements</span>
                          <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 text-gray-600 font-medium text-xs whitespace-pre-wrap leading-relaxed">
                            {selectedDeal.installationRequirements}
                          </div>
                        </div>
                      )}

                      {selectedDeal.specialCommitments && (
                        <div>
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Special Commitments</span>
                          <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 text-gray-600 font-medium text-xs whitespace-pre-wrap leading-relaxed">
                            {selectedDeal.specialCommitments}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}



              <div className="grid grid-cols-2 gap-3 mb-10">
                <div className="bg-white p-5 rounded-[28px] border-2 border-gray-100 shadow-sm">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 opacity-60">Lead Source</div>
                  <div className="text-[13px] font-extrabold text-gray-700 flex items-center gap-2">
                    <span className="text-blue-500">📍</span> {selectedDeal.source || "Direct Inquiry"}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-[28px] border-2 border-gray-100 shadow-sm">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 opacity-60">Marketing Campaign</div>
                  <div className="text-[13px] font-extrabold text-gray-700 flex items-center gap-2">
                    <span className="text-pink-500">📣</span> {selectedDeal.campaign || "No Campaign"}
                  </div>
                </div>
              </div>

              {selectedDeal.projectId && (
                <div className="mb-10 bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Associated Project</div>
                    <div className="text-sm font-extrabold text-gray-800">{selectedDeal.projectName}</div>
                  </div>
                  <button
                    onClick={() => {
                      const proj = projects.find(p => p.id === selectedDeal.projectId);
                      if (proj) {
                        setSelectedProject(proj);
                        setSelectedDeal(null);
                      }
                    }}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
                  >
                    View Project &rarr;
                  </button>
                </div>
              )}

              {/* Deal Specific Next Actions (Phase 7) */}
              {reminders.filter(r => r.dealId === selectedDeal.id && r.status === "pending").length > 0 && (
                <div className="mb-8 p-6 bg-indigo-50/50 border-2 border-indigo-100 rounded-[32px] shadow-sm animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                      Next Step for this Lead
                    </h3>
                  </div>
                  {reminders.filter(r => r.dealId === selectedDeal.id && r.status === "pending")
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .map(r => {
                      const isOverdue = new Date(r.dueDate) < new Date().setHours(0, 0, 0, 0);
                      return (
                        <div key={r.id} className={`bg-white p-4 rounded-2xl border-2 shadow-sm flex flex-col gap-3 ${isOverdue ? 'border-red-200 bg-red-50/10' : 'border-indigo-50'}`}>
                          <div className="flex justify-between items-start">
                            <div className="text-sm font-black text-gray-800 leading-tight">{r.text}</div>
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${isOverdue ? 'text-red-500 bg-red-50 border-red-200' : 'text-indigo-400 bg-indigo-50 border-indigo-100'}`}>{r.dueDate}</div>
                          </div>
                          <button
                            onClick={() => completeReminder(r)}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-900/10 flex items-center justify-center gap-2"
                          >
                            ✓ Mark Goal as Reached
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}

              {currentUser === "Manager" ? (
                <div className="flex gap-2 mb-8">
                  <button
                    onClick={() => setShowActivity(true)}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/10 active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-indigo-800"
                  >
                    <span>💬</span> Add Interaction
                  </button>
                  <button
                    onClick={() => { setActivityPurpose("Manager Note"); setShowActivity(true); }}
                    className="flex-1 bg-blue-600 text-white py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10 active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-blue-800"
                  >
                    <span>🛡️</span> Manager Note
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowActivity(true)}
                  className="w-full bg-indigo-600 text-white py-4.5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/10 mb-8 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-indigo-800"
                >
                  <span>➕</span> Add Interaction
                </button>
              )}


              <h3 className="mt-6 font-bold text-gray-800 border-b pb-1 mb-2">
                Key Contacts
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {contacts.filter(c => {
                  const accId = customers.find(cust => selectedDeal.name.includes(cust.name))?.id;
                  return c.accountId === accId;
                }).map(c => (
                  <div key={c.id} className="min-w-[120px] p-2 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
                    <div className="text-sm font-bold text-blue-900 leading-tight">{c.name}</div>
                    <div className="text-[10px] text-blue-600 font-semibold uppercase">{c.role}</div>
                  </div>
                ))}
                {contacts.filter(c => {
                  const accId = customers.find(cust => selectedDeal.name.includes(cust.name))?.id;
                  return c.accountId === accId;
                }).length === 0 && <div className="text-gray-400 text-xs italic">No contacts added</div>}
              </div>

              <h3 className="mt-6 font-bold text-gray-800 border-b pb-1 mb-2">Timeline</h3>
              {activities.filter(a => a.dealId === selectedDeal.id).length === 0 && <div className="text-gray-500 italic text-sm">No activity yet</div>}
              {activities.filter(a => a.dealId === selectedDeal.id).map((a, i) => {
                const isManagerNote = a.purpose === "Manager Note";
                return (
                  <div key={i} className={`p-3 my-3 rounded-2xl text-sm shadow-sm border-2 ${isManagerNote ? "bg-emerald-50 border-emerald-100 text-emerald-900" : (a.owner === "Manager" ? "bg-indigo-50 border-indigo-100 text-indigo-900" : "bg-gray-50 border-gray-100 text-gray-800")}`}>
                    <div className="flex justify-between text-[9px] font-black mb-2 uppercase tracking-[0.1em] opacity-60">
                      <span>{a.owner} · {isManagerNote ? "MANAGER NOTE" : (a.purpose || "INTERACTION")}</span>
                      <span>{a.date}</span>
                    </div>
                    <div className="font-semibold leading-tight">
                      {isManagerNote && <span className="mr-1">👑</span>}
                      {a.notes}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      }

      {/* Account Detail (Customer 360) */}
      {
        selectedAccount && (
          <div className="fixed inset-0 bg-white overflow-y-auto z-[1000]">
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 pb-8 rounded-b-[40px] shadow-2xl relative border-b-4 border-blue-400">
              <button
                onClick={() => setSelectedAccount(null)}
                className="mb-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 w-fit transition-all uppercase tracking-wider border border-white/30"
              >
                &larr; Back
              </button>

              <div className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-1">Customer 360 Profile</div>
              <h2 className="font-bold text-3xl leading-tight mb-3 uppercase tracking-tight">{selectedAccount.name}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold opacity-80 uppercase tracking-widest">
                <span className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">📍 {selectedAccount.city}</span>
                <span className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">🌐 {selectedAccount.zone}</span>
                {selectedAccount.customerType && (
                  <span className={`px-2.5 py-1.5 rounded-lg border ${
                    selectedAccount.customerType === "Corporate Group"
                      ? "bg-purple-500/20 border-purple-400/30 text-purple-200"
                      : selectedAccount.customerType === "Department"
                      ? "bg-pink-500/20 border-pink-400/30 text-pink-200"
                      : "bg-blue-500/20 border-blue-400/30 text-blue-200"
                  }`}>🏷️ {selectedAccount.customerType}</span>
                )}
                {selectedAccount.class && (
                  <span className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 px-2.5 py-1.5 rounded-lg">📁 {selectedAccount.class}</span>
                )}
                {selectedAccount.specialty && (
                  <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-2.5 py-1.5 rounded-lg">✨ {selectedAccount.specialty}</span>
                )}
                {selectedAccount.parentCustomerId && (() => {
                  const parent = customers.find(c => c.id.toString() === selectedAccount.parentCustomerId.toString());
                  return parent ? (
                    <button
                      onClick={() => setSelectedAccount(parent)}
                      className="bg-blue-500/30 hover:bg-blue-500/50 text-white px-2.5 py-1.5 rounded-lg border border-blue-400/30 transition-all flex items-center gap-1 normal-case shadow-sm cursor-pointer"
                    >
                      <span>🔗 Parent:</span>
                      <span className="underline font-bold">{parent.name}</span>
                    </button>
                  ) : null;
                })()}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setShowActivity(true)}
                  className="flex-1 bg-white text-blue-900 px-3 py-2.5 rounded-xl font-black shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 border-b-2 border-gray-200 text-xs"
                >
                  <span className="text-base">💬</span> + Interaction
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomerId(selectedAccount.id);
                    setCustomerSearch(selectedAccount.name);
                    setLeadWizardStep(2);
                    setShowNewLead(true);
                  }}
                  className="flex-1 bg-blue-500 text-white px-3 py-2.5 rounded-xl font-black shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 border-b-2 border-blue-700 text-xs"
                >
                  <span className="text-base">🚀</span> + Lead
                </button>
              </div>
            </div>

            {/* Admin Tags Card */}
            <div className="mx-4 -mt-5 mb-4 bg-white p-4 rounded-2xl shadow-lg border border-gray-100 grid grid-cols-2 gap-3 relative z-10">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Class</label>
                <select className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedAccount.class || "Class A"}
                  onChange={(e) => {
                    if (currentUser !== "Manager") { setCustomAlert({ title: "Admin Access Required", message: "Only Admins can update Class.", type: "warning" }); return; }
                    const updated = { ...selectedAccount, class: e.target.value };
                    setCustomers(prev => prev.map(c => c.id === selectedAccount.id ? updated : c));
                    setSelectedAccount(updated);
                  }}
                >
                  <option value="Class A">Class A</option>
                  <option value="Class B">Class B</option>
                  <option value="Class C">Class C</option>
                  <option value="Class D">Class D</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Clinic">Clinic</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Specialty</label>
                <select className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedAccount.specialty || "General"}
                  onChange={(e) => {
                    if (currentUser !== "Manager") { setCustomAlert({ title: "Admin Access Required", message: "Only Admins can update Specialty.", type: "warning" }); return; }
                    const updated = { ...selectedAccount, specialty: e.target.value };
                    setCustomers(prev => prev.map(c => c.id === selectedAccount.id ? updated : c));
                    setSelectedAccount(updated);
                  }}
                >
                  <option value="General">General</option>
                  <option value="Multi Speciality">Multi Speciality</option>
                  <option value="Urology">Urology</option>
                  <option value="Ortho">Ortho</option>
                  <option value="Cardiac">Cardiac</option>
                  <option value="IVF">IVF</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="Pediatrics">Pediatrics</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Payer Status</label>
                <select className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedAccount.payerStatus || "Unknown Payer"}
                  onChange={(e) => {
                    const updated = { ...selectedAccount, payerStatus: e.target.value };
                    setCustomers(prev => prev.map(c => c.id === selectedAccount.id ? updated : c));
                    setSelectedAccount(updated);
                  }}
                >
                  <option value="Good Paymaster">✅ Good Paymaster</option>
                  <option value="Average Payer">⚖️ Average Payer</option>
                  <option value="Problematic Payer">⚠️ Problematic Payer</option>
                  <option value="Unknown Payer">Unknown Payer</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">NPS Status</label>
                <select className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedAccount.npsStatus || "Neutral"}
                  onChange={(e) => {
                    const updated = { ...selectedAccount, npsStatus: e.target.value };
                    setCustomers(prev => prev.map(c => c.id === selectedAccount.id ? updated : c));
                    setSelectedAccount(updated);
                  }}
                >
                  <option value="Promoter">⭐ Promoter</option>
                  <option value="Neutral">😐 Neutral</option>
                  <option value="Detractor">📉 Detractor</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Customer Type</label>
                <select className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedAccount.customerType || "Hospital"}
                  onChange={(e) => {
                    const updated = { ...selectedAccount, customerType: e.target.value };
                    setCustomers(prev => prev.map(c => c.id === selectedAccount.id ? updated : c));
                    setSelectedAccount(updated);
                  }}
                >
                  <option value="Corporate Group">Corporate Group</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Department">Department</option>
                </select>
              </div>
              <div className="relative parent-lookup-container">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Parent Customer</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 pr-6"
                    placeholder="None (Search...)"
                    value={editParentSearchText}
                    onChange={(e) => {
                      setEditParentSearchText(e.target.value);
                      setIsEditingParent(true);
                      if (!e.target.value) {
                        const updated = { ...selectedAccount, parentCustomerId: "" };
                        setCustomers(prev => prev.map(c => c.id === selectedAccount.id ? updated : c));
                        setSelectedAccount(updated);
                      }
                    }}
                    onFocus={() => {
                      setIsEditingParent(true);
                      setEditParentSearchText("");
                    }}
                    onClick={() => {
                      setIsEditingParent(true);
                    }}
                  />
                  {editParentSearchText && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditParentSearchText("");
                        const updated = { ...selectedAccount, parentCustomerId: "" };
                        setCustomers(prev => prev.map(c => c.id === selectedAccount.id ? updated : c));
                        setSelectedAccount(updated);
                        setIsEditingParent(true);
                      }}
                      className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 font-black text-sm"
                    >
                      &times;
                    </button>
                  )}
                </div>
                {isEditingParent && (
                  <div className="absolute z-[1200] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[160px] overflow-y-auto">
                    <div 
                      onClick={() => {
                        const updated = { ...selectedAccount, parentCustomerId: "" };
                        setCustomers(prev => prev.map(cust => cust.id === selectedAccount.id ? updated : cust));
                        setSelectedAccount(updated);
                        setEditParentSearchText("");
                        setIsEditingParent(false);
                      }}
                      className="p-2 border-b cursor-pointer text-xs text-gray-500 italic hover:bg-gray-50 transition-colors"
                    >
                      Clear / No Parent
                    </div>
                    {customers
                      .filter(c =>
                        c.id.toString() !== selectedAccount.id.toString() && // Self-parent validation
                        (c.name?.toLowerCase().includes(editParentSearchText.toLowerCase()) || editParentSearchText === "")
                      )
                      .map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            const updated = { ...selectedAccount, parentCustomerId: c.id.toString() };
                            setCustomers(prev => prev.map(cust => cust.id === selectedAccount.id ? updated : cust));
                            setSelectedAccount(updated);
                            setEditParentSearchText(c.name);
                            setIsEditingParent(false);
                          }}
                          className={`p-2 border-b cursor-pointer text-xs hover:bg-blue-50 transition-colors ${selectedAccount.parentCustomerId?.toString() === c.id.toString() ? 'bg-blue-100' : ''}`}
                        >
                          <div className="font-bold text-gray-800">{c.name}</div>
                          <div className="text-[9px] text-gray-500 uppercase font-semibold">{c.city} · {c.zone}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <section className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner">
                <h3 className="font-black text-gray-800 mb-4 flex justify-between items-center text-sm uppercase tracking-wider">
                  Stakeholders
                  <button
                    onClick={() => { setEditingStakeholder(null); setIsAddingStakeholder(true); }}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    + Add
                  </button>
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {contacts.filter(c => c.accountId === selectedAccount.id).map(c => (
                    <div key={c.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs">{c.name.charAt(0)}</div>
                        <div>
                          <div className="text-sm font-black text-gray-800 leading-tight">{c.name}</div>
                          <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{c.role}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`tel:${c.phone}`}
                          title="Call Stakeholder"
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all font-bold text-[10px] ${c.phone ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-50 text-gray-200 cursor-not-allowed"}`}
                          onClick={(e) => !c.phone && e.preventDefault()}
                        >
                          📞
                        </a>
                        <a
                          href={c.phone ? `https://wa.me/${c.phone.replace(/\D/g, '')}` : "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp Message"
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all font-bold text-[10px] ${c.phone ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-gray-50 text-gray-200 cursor-not-allowed"}`}
                          onClick={(e) => !c.phone && e.preventDefault()}
                        >
                          💬
                        </a>
                        <button
                          onClick={() => { setEditingStakeholder(c); setIsAddingStakeholder(true); setNewStakeholderName(c.name); setNewStakeholderRole(c.role); setNewStakeholderPhone(c.phone || ""); setNewStakeholderEmail(c.email || ""); }}
                          className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all font-bold text-[10px]"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => {
                            const isUsed = activities.some(a => a.notes.includes(c.name));
                            if (currentUser !== "Manager") {
                              setCustomAlert({ title: "Admin Access Required", message: "Only Managers can delete stakeholders.", type: "warning" });
                              return;
                            }
                            if (isUsed) {
                              setCustomAlert({ title: "Cannot Delete Stakeholder", message: `${c.name} is currently linked to active leads or interaction history. Try updating their details instead.`, type: "error" });
                              return;
                            }
                            if (window.confirm(`Are you sure you want to remove ${c.name}? This action will be logged in the audit trail.`)) {
                              logAuditActivity(selectedAccount.id, null, `Stakeholder Removed: ${c.name} (${c.role})`);
                              setContacts(prev => prev.filter(con => con.id !== c.id));
                            }
                          }}
                          className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all font-bold text-[10px] ${currentUser !== "Manager" ? "opacity-30 cursor-not-allowed" : ""}`}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                  {contacts.filter(c => c.accountId === selectedAccount.id).length === 0 && <div className="text-gray-400 text-xs italic py-4 text-center">No stakeholders listed.</div>}
                </div>
              </section>

              <section className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner">
                <h3 className="font-black text-gray-800 mb-4 flex justify-between items-center text-sm uppercase tracking-wider">
                  Projects
                  <button
                    onClick={() => openNewProjectModal(selectedAccount.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    + Project
                  </button>
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {projects
                    .filter(p => p.customerId.toString() === selectedAccount.id.toString())
                    .map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProject(p);
                          setSelectedAccount(null);
                        }}
                        className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
                      >
                        <div>
                          <div className="text-sm font-black text-gray-800 leading-tight group-hover:text-blue-900 transition-colors">{p.projectName}</div>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                            <span>{p.projectType}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-normal normal-case border ${
                              p.status === "Active" ? "bg-green-50 text-green-700 border-green-200" :
                              p.status === "Planning" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              p.status === "On Hold" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-gray-100 text-gray-700 border-gray-200"
                            }`}>{p.status}</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-blue-50 transition-colors">
                          <span className="text-gray-400 group-hover:text-blue-600 transition-colors">&rarr;</span>
                        </div>
                      </div>
                    ))}
                  {projects.filter(p => p.customerId.toString() === selectedAccount.id.toString()).length === 0 && (
                    <div className="text-gray-400 text-xs italic py-4 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                      No projects listed.
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner mt-6">
                <h3 className="font-black text-gray-800 mb-4 flex justify-between items-center text-sm uppercase tracking-wider">
                  Installed Equipment
                  <button onClick={() => {
                    setNewAssetInstallDate(new Date().toISOString().split('T')[0]);
                    setShowAssetModal(true);
                  }} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                    + Equipment
                  </button>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assets.filter(a => a.accountId === selectedAccount.id).map(a => (
                    <div key={a.id} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col gap-1 border-l-4 border-l-indigo-400">
                      <div className="flex justify-between items-start">
                        <div className="text-sm font-black text-gray-800 leading-tight">{a.type}</div>
                        <div className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-widest whitespace-nowrap">Inst: {a.installDate}</div>
                      </div>
                      {a.notes && <div className="text-xs text-gray-600 font-medium mt-1">{a.notes}</div>}
                    </div>
                  ))}
                  {assets.filter(a => a.accountId === selectedAccount.id).length === 0 && <div className="text-gray-400 text-xs italic py-4 text-center md:col-span-2 bg-white rounded-2xl border border-dashed border-gray-200">No installed equipment logged.</div>}
                </div>
              </section>

              <section className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner">
                <h3 className="font-black text-gray-800 mb-4 text-sm uppercase tracking-wider flex justify-between items-center">
                  Reminders & Follow-ups
                  <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-200 font-black uppercase tracking-widest">Next Steps</span>
                </h3>
                <div className="space-y-3">
                  {reminders.filter(r => r.accountId === selectedAccount.id && r.status === "pending")
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .map(r => {
                      const isOverdue = new Date(r.dueDate) < new Date().setHours(0, 0, 0, 0);
                      return (
                        <div key={r.id} className={`p-4 bg-white border-2 rounded-2xl shadow-sm ${isOverdue ? 'border-red-200 bg-red-50/10' : 'border-gray-100'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-xs font-black text-gray-800 leading-tight">{r.text}</div>
                            <div className={`text-[10px] font-bold whitespace-nowrap ml-2 px-2 py-0.5 rounded-lg border ${isOverdue ? 'text-red-500 bg-red-50 border-red-200' : 'text-gray-400 border-none'}`}>{r.dueDate}</div>
                          </div>
                          <button
                            onClick={() => completeReminder(r)}
                            className="w-full mt-2 py-2 bg-indigo-50 hover:bg-green-600 text-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-100 hover:border-green-600"
                          >
                            ✓ Complete Task
                          </button>
                        </div>
                      )
                    })}
                  {reminders.filter(r => r.accountId === selectedAccount.id && r.status === "pending").length === 0 && (
                    <div className="text-gray-400 text-xs italic py-4 text-center bg-white rounded-2xl border border-dashed border-gray-200">No pending follow-ups.</div>
                  )}
                </div>
              </section>

              <section className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner">
                <h3 className="font-black text-gray-800 mb-4 text-sm uppercase tracking-wider italic opacity-60">Deal History</h3>
                <div className="space-y-3">
                  {deals.filter(d => d.name.includes(selectedAccount.name)).map(d => (
                    <div key={d.id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex justify-between items-center cursor-pointer hover:border-blue-400 transition-all border-b-4" style={{ borderLeftWidth: '4px', borderLeftColor: isHoldOverdue(d) ? '#ef4444' : (d.isPriority ? '#fbbf24' : 'transparent') }} onClick={() => { setSelectedDeal(d); setSelectedAccount(null); }}>
                      <div>
                        <div className="text-sm font-black text-blue-900 leading-tight flex items-center gap-2">
                          {d.isPriority && <span className="text-amber-400">⭐</span>}
                          {d.name.split('–')[1] || d.name}
                        </div>
                        <div className="text-[9px] text-gray-400 font-black mt-1 uppercase tracking-wider flex items-center gap-2">
                          <span>{d.stage} · {d.owner}</span>
                          {d.state === "On Hold" && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[7px] font-black uppercase tracking-wider rounded-md">⏸ On Hold</span>}
                          {isHoldOverdue(d) && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[7px] font-black uppercase tracking-wider rounded-md animate-pulse">🚨 Reactivation Overdue</span>}
                        </div>
                      </div>
                      <div className="font-black text-blue-900 text-lg">{d.value}</div>
                    </div>
                  ))}
                  {deals.filter(d => d.name.includes(selectedAccount.name)).length === 0 && <div className="text-gray-400 text-xs italic py-4 text-center">No active or historical deals.</div>}
                </div>
              </section>
            </div>

            <section className="mt-8 mb-12">
              <h3 className="font-black text-gray-800 border-b-2 border-indigo-100 pb-3 mb-6 text-sm uppercase tracking-[0.2em] text-indigo-900 px-2">Unified Interaction History</h3>
              <div className="relative pl-10 pr-2 border-l-4 border-indigo-50/50 space-y-8 ml-4">
                {activities.filter(a => a.accountId === selectedAccount.id).map((a, i) => {
                  const isManagerNote = a.purpose === "Manager Note";
                  return (
                    <div key={i} className="relative">
                      <div className={`absolute -left-[54px] top-6 w-6 h-6 rounded-xl rotate-45 border-4 border-white shadow-md z-10 transition-transform hover:scale-110 ${a.type === 'audit' ? "bg-red-500" : (isManagerNote ? "bg-emerald-500" : (a.dealId ? "bg-blue-500" : "bg-indigo-500"))}`}></div>
                      <div className={`p-6 rounded-[32px] shadow-sm border-2 transition-all hover:shadow-md ${a.type === 'audit' ? "bg-red-50/30 border-red-100" : (isManagerNote ? "bg-emerald-50 border-emerald-100 shadow-emerald-900/5" : (a.dealId ? "bg-white border-blue-50 shadow-blue-900/5" : "bg-indigo-50/50 border-indigo-100 shadow-indigo-900/5"))}`}>
                        <div className="flex justify-between items-start mb-3 text-[10px] font-black uppercase tracking-widest leading-none">
                          <span className={a.type === 'audit' ? "text-red-600" : (isManagerNote ? "text-emerald-600" : (a.dealId ? "text-blue-500" : "text-indigo-600"))}>
                            {a.owner} · {a.type === 'audit' ? "SYSTEM AUDIT" : (isManagerNote ? "MANAGER NOTE" : (a.purpose || "INTERACTION"))}
                          </span>
                          <span className="text-gray-400 font-bold">{a.date}</span>
                        </div>
                        <div className={`text-[13px] leading-relaxed font-bold ${a.type === 'audit' ? "text-red-900 italic font-black" : (isManagerNote ? "text-emerald-900" : "text-gray-800")}`}>
                          {isManagerNote && <span className="mr-1">👑</span>}
                          {a.notes}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div >
        )
      }

      {/* Activity Modal */}
      {
        showActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100]">
            <div className="bg-white p-6 rounded-2xl w-[320px] shadow-2xl transition-all scale-100">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className={`font-black text-sm uppercase tracking-tight ${activityPurpose === "Manager Note" ? "text-emerald-700" : "text-gray-800"}`}>
                  {activityPurpose === "Manager Note" ? "Strategic Manager Note" : (isClosureDatePrompt ? "Confirm Closure Date" : isLostPrompt ? "Loss Analysis" : "Add Interaction")}
                </h3>
                <button onClick={() => { setShowActivity(false); setIsClosureDatePrompt(false); setIsLostPrompt(false); setPendingStage(null); setActivityPurpose("Deal Follow-up"); }} className="text-gray-400 hover:text-gray-800 font-bold text-lg">&times;</button>
              </div>

              {activityPurpose === "Manager Note" && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-[10px] font-bold leading-tight flex gap-2">
                  <span>💡</span>
                  This note will be highlighted in Green for the sales rep and bypasses standard activity tagging.
                </div>
              )}

              {!isClosureDatePrompt && !isLostPrompt && activityPurpose !== "Manager Note" && (
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Purpose</label>
                  <select className="w-full border border-gray-200 p-2 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    value={activityPurpose} onChange={(e) => setActivityPurpose(e.target.value)}>
                    {selectedDeal && <option>Deal Follow-up</option>}
                    <option>Field Scanning</option>
                    <option>Marketing</option>
                    <option>Negotiation Meeting</option>
                    <option>PO Follow up</option>
                    <option>Payment Follow up</option>
                    <option>Installation</option>
                    <option>Application Support</option>
                    <option>Demo</option>
                    <option>Demo Feedback</option>
                    <option>Service Issue</option>
                    <option>Feedback</option>
                  </select>
                </div>
              )}

              {isClosureDatePrompt && (
                <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Expected Closure Date *</label>
                  <input type="date" className="w-full border p-2 rounded focus:ring-2 focus:ring-yellow-500 outline-none text-sm font-semibold" value={closureDate} onChange={(e) => setClosureDate(e.target.value)} />
                </div>
              )}

              {isLostPrompt && (
                <div className="mb-4 space-y-3 bg-red-50 p-3 rounded-lg border border-red-200">
                  <div>
                    <label className="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-1 block">Competitor Name *</label>
                    <input type="text" placeholder="e.g. Mindray, GE, Siemens..." className="w-full border-red-200 p-2 rounded focus:ring-red-400 outline-none text-sm font-semibold border" value={lostCompetitor} onChange={(e) => setLostCompetitor(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-1 block">Loss Reason *</label>
                    <select className="w-full border-red-200 p-2 rounded focus:ring-red-400 outline-none text-sm font-semibold border bg-white" value={lostReason} onChange={(e) => setLostReason(e.target.value)}>
                      <option>Price</option>
                      <option>Feature Missing</option>
                      <option>Relationship / Competitor Entrenched</option>
                      <option>Budget Cancelled</option>
                    </select>
                  </div>
                </div>
              )}

              <textarea
                className="w-full border border-gray-200 p-3 mb-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[100px]"
                value={activityInput}
                onChange={(e) => setActivityInput(e.target.value)}
                placeholder={isLostPrompt ? "Additional loss details..." : isClosureDatePrompt ? "Negotiation summary..." : "What did you discuss?"}
                autoFocus={!isClosureDatePrompt && !isLostPrompt}
              />

              <div className="mb-4 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={isSchedulingFollowUp}
                    onChange={(e) => setIsSchedulingFollowUp(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Schedule Follow-up?</span>
                </label>

                {isSchedulingFollowUp && (
                  <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Due Date</label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 p-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Follow-up Task (Optional)</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 p-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="E.g. Send quote, Call again"
                        value={followUpText}
                        onChange={(e) => setFollowUpText(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowActivity(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addActivity}
                  disabled={!activityInput.trim()}
                  className={`flex-1 px-4 py-2 text-white rounded-xl font-bold text-sm shadow-md transition-colors ${activityInput.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"}`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* New Lead Modal Wizard */}
      {
        showNewLead && (
          <div className="fixed z-[1100] inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white p-5 rounded-xl w-[350px] shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-gray-800">{isCreatingCustomer ? "Create New Account" : (leadWizardStep === 1 ? "Step 1: Select Account" : "Step 2: Lead Details")}</h3>
                <button onClick={handleCloseLeadWizard} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none">&times;</button>
              </div>

              {isCreatingCustomer ? (
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Account Name</label>
                  <input className="w-full border border-gray-300 p-2 mb-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="E.g. Apollo Clinic" autoFocus />

                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Zone</label>
                  <select className="w-full border border-gray-300 p-2 mb-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newCustomerZone} onChange={(e) => setNewCustomerZone(e.target.value)}>
                    <option>North Kerala</option>
                    <option>South Kerala</option>
                    <option>Bangalore</option>
                  </select>

                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">City</label>
                  <input className="w-full border border-gray-300 p-2 mb-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newCustomerCity} onChange={(e) => setNewCustomerCity(e.target.value)} placeholder="E.g. Kochi" />

                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Class</label>
                  <select className="w-full border border-gray-300 p-2 mb-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newCustomerClass} onChange={(e) => setNewCustomerClass(e.target.value)}>
                    <option>Class A</option>
                    <option>Class B</option>
                    <option>Class C</option>
                    <option>Class D</option>
                    <option>Corporate</option>
                    <option>Clinic</option>
                  </select>

                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Specialty</label>
                  <select className="w-full border border-gray-300 p-2 mb-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newCustomerSpecialty} onChange={(e) => setNewCustomerSpecialty(e.target.value)}>
                    <option>General</option>
                    <option>Multi Speciality</option>
                    <option>Urology</option>
                    <option>Ortho</option>
                    <option>Cardiac</option>
                    <option>IVF</option>
                    <option>Cardiology</option>
                    <option>Radiology</option>
                    <option>Gynecology</option>
                    <option>Pediatrics</option>
                  </select>

                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Customer Type</label>
                  <select className="w-full border border-gray-300 p-2 mb-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" value={newCustomerType} onChange={(e) => setNewCustomerType(e.target.value)}>
                    <option value="Corporate Group">Corporate Group</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Department">Department</option>
                  </select>

                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Parent Customer</label>
                  <div className="relative mb-4 create-parent-lookup-container">
                    <div className="relative">
                      <input
                        className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm pr-6"
                        placeholder="Search Parent Customer..."
                        value={parentSearchText}
                        onChange={(e) => {
                          setParentSearchText(e.target.value);
                          setIsCreatingParentLookup(true);
                          if (!e.target.value) {
                            setNewParentCustomerId("");
                          }
                        }}
                        onFocus={() => {
                          setIsCreatingParentLookup(true);
                          setParentSearchText("");
                        }}
                        onClick={() => {
                          setIsCreatingParentLookup(true);
                        }}
                      />
                      {parentSearchText && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setParentSearchText("");
                            setNewParentCustomerId("");
                            setIsCreatingParentLookup(true);
                          }}
                          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 font-black text-sm"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                    {isCreatingParentLookup && (
                      <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[160px] overflow-y-auto">
                        <div 
                          onClick={() => {
                            setNewParentCustomerId("");
                            setParentSearchText("");
                            setIsCreatingParentLookup(true);
                          }}
                          className="p-2 border-b cursor-pointer text-xs text-gray-500 italic hover:bg-gray-50 transition-colors"
                        >
                          Clear / No Parent
                        </div>
                        {customers
                          .filter(c =>
                            c.name?.toLowerCase().includes(parentSearchText.toLowerCase()) || parentSearchText === ""
                          )
                          .map(c => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setNewParentCustomerId(c.id);
                                setParentSearchText(c.name);
                                setIsCreatingParentLookup(false);
                              }}
                              className={`p-2 border-b cursor-pointer hover:bg-blue-50 transition-colors ${newParentCustomerId === c.id ? 'bg-blue-100' : ''}`}
                            >
                              <div className="text-sm font-bold text-gray-800">{c.name}</div>
                              <div className="text-[10px] text-gray-500 uppercase font-semibold">{c.city} · {c.zone}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleCancelNewCustomer} className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                    <button onClick={handleSaveCustomer} disabled={!newCustomerName.trim()} className={`flex-1 px-3 py-2 rounded-lg font-semibold text-white transition-colors ${newCustomerName.trim() ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 cursor-not-allowed"}`}>Save Account</button>
                  </div>
                </div>
              ) : leadWizardStep === 1 ? (
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Search Account (progressive)</label>
                  <div className="relative mb-3">
                    <input
                      className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                      placeholder="Type hospital name or city..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    {customerSearch && (
                      <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl max-h-[160px] overflow-y-auto">
                        {customers
                          .filter(c =>
                            c.name?.toLowerCase().startsWith(customerSearch.toLowerCase())
                          )
                          .map(c => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomerId(c.id);
                                setCustomerSearch(c.name);
                              }}
                              className={`p-2 border-b cursor-pointer hover:bg-blue-50 transition-colors ${selectedCustomerId === c.id ? 'bg-blue-100' : ''}`}
                            >
                              <div className="text-sm font-bold text-gray-800">{c.name}</div>
                              <div className="text-[10px] text-gray-500 uppercase font-semibold">{c.city} · {c.zone}</div>
                            </div>
                          ))
                        }
                        {customers.filter(c =>
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          c.city.toLowerCase().includes(customerSearch.toLowerCase())
                        ).length === 0 && (
                            <div className="p-3 text-sm text-gray-500 italic">No matches found</div>
                          )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center my-3">
                    <div className="flex-1 bg-gray-200 h-px"></div>
                    <div className="px-3 text-xs text-gray-400 font-bold tracking-wide">OR</div>
                    <div className="flex-1 bg-gray-200 h-px"></div>
                  </div>

                  <button onClick={() => setIsCreatingCustomer(true)} className="w-full border-2 border-dashed border-blue-200 text-blue-600 hover:text-blue-700 py-2.5 rounded-lg font-semibold mb-5 hover:bg-blue-50 transition-colors">
                    + Create New Account
                  </button>

                  <button
                    onClick={() => selectedCustomerId && setLeadWizardStep(2)}
                    disabled={!selectedCustomerId}
                    className={`w-full text-white px-3 py-3 rounded-lg font-bold shadow-sm transition-colors ${selectedCustomerId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
                  >
                    Next Steps &rarr;
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs text-gray-500 font-bold uppercase block">Selected Account</label>
                    <button onClick={() => setLeadWizardStep(1)} className="text-xs text-blue-600 font-semibold hover:underline">Change</button>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4 text-sm font-semibold text-gray-800">
                    {customers.find(c => c.id === parseInt(selectedCustomerId))?.name}
                  </div>

                  {(() => {
                    const custProjects = projects.filter(p => p.customerId.toString() === selectedCustomerId.toString());
                    return custProjects.length > 0 ? (
                      <div className="mb-4">
                        <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Associated Project</label>
                        <select
                          className="w-full border border-gray-100 p-2.5 rounded-lg focus:ring-blue-500 outline-none bg-gray-50 text-xs font-bold cursor-pointer"
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                        >
                          <option value="">None (Independent Deal)</option>
                          {custProjects.map(proj => (
                            <option key={proj.id} value={proj.id}>{proj.projectName}</option>
                          ))}
                        </select>
                      </div>
                    ) : null;
                  })()}

                  <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Choose Machines from Catalog</label>
                  <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 no-scrollbar overflow-y-hidden">
                    {["Ultrasound", "Ventilator", "Critical Care"].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setWizardCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${wizardCategoryFilter === cat ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-gray-100 text-gray-400 border-gray-100"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-5 max-h-[160px] overflow-y-auto pr-1">
                    {catalog.filter(p => p.category === wizardCategoryFilter).map(prod => (
                      <div
                        key={prod.id}
                        onClick={() => toggleProductSelection(prod.id)}
                        className={`p-2 rounded-xl border-2 transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${selectedProducts.includes(prod.id) ? "border-blue-600 bg-blue-50 shadow-sm" : "border-gray-100 bg-white"}`}
                      >
                        <div className={`text-[9px] font-black uppercase leading-tight ${selectedProducts.includes(prod.id) ? "text-blue-700" : "text-gray-500"}`}>{prod.name}</div>
                      </div>
                    ))}
                  </div>

                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Lead / Deal Requirement</label>
                  <input
                    className="w-full border border-gray-100 p-2.5 mb-3 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-sm font-bold"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="E.g. Portable USG"
                  />

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block tracking-wider">Lead Source</label>
                      <select className="w-full border border-gray-100 p-2.5 rounded-lg focus:ring-blue-500 outline-none bg-gray-50 text-xs font-bold" value={leadSource} onChange={(e) => setLeadSource(e.target.value)}>
                        <option>Direct Inquiry</option>
                        <option>Website</option>
                        <option>Referral</option>
                        <option>Field Scanning</option>
                        <option>IndiaMart</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block tracking-wider">Campaign</label>
                      <input className="w-full border border-gray-100 p-2.5 rounded-lg focus:ring-blue-500 outline-none bg-gray-50 text-xs font-bold" placeholder="E.g. Q4 CME Event" value={leadCampaign} onChange={(e) => setLeadCampaign(e.target.value)} />
                    </div>
                  </div>

                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Expected Value (₹ Lakhs)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                    <input
                      className="w-full border border-gray-100 p-2.5 pl-7 mb-5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-sm font-bold"
                      value={leadValue}
                      onChange={(e) => setLeadValue(e.target.value)}
                      placeholder="15"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400 font-bold text-sm">L</span>
                  </div>

                  <button
                    onClick={createLead}
                    disabled={!leadName.trim() || !leadValue.trim()}
                    className={`w-full py-3 rounded-lg text-white font-bold shadow-md transition-colors ${(!leadName.trim() || !leadValue.trim()) ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    Create Lead
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Stakeholder Modal */}
      {
        isAddingStakeholder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1300] p-4">
            <div className="bg-white p-6 rounded-3xl w-full max-w-[320px] shadow-2xl scale-100 transition-all">
              <h3 className="font-extrabold text-gray-800 text-xl mb-6 tracking-tight uppercase">{editingStakeholder ? "Update Stakeholder" : "Add Stakeholder"}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Full Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all placeholder:font-medium"
                    placeholder="Dr. Rajesh Kumar"
                    value={newStakeholderName}
                    onChange={(e) => setNewStakeholderName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Role / Designation</label>
                  <input
                    type="text"
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all placeholder:font-medium"
                    placeholder="Chief Radiologist"
                    value={newStakeholderRole}
                    onChange={(e) => setNewStakeholderRole(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Phone / WhatsApp</label>
                  <input
                    type="text"
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all placeholder:font-medium"
                    placeholder="+91 98765 43210"
                    value={newStakeholderPhone}
                    onChange={(e) => setNewStakeholderPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Email Address</label>
                  <input
                    type="email"
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all placeholder:font-medium"
                    placeholder="doctor@hospital.com"
                    value={newStakeholderEmail}
                    onChange={(e) => setNewStakeholderEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => { setIsAddingStakeholder(false); setEditingStakeholder(null); setNewStakeholderName(""); setNewStakeholderRole(""); }}
                  className="flex-1 px-4 py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newStakeholderName && newStakeholderRole) {
                      if (editingStakeholder) {
                        setContacts(prev => prev.map(con => con.id === editingStakeholder.id ? { ...con, name: newStakeholderName, role: newStakeholderRole, phone: newStakeholderPhone, email: newStakeholderEmail } : con));
                      } else {
                        const accId = selectedAccount ? selectedAccount.id : (selectedDeal ? customers.find(cust => selectedDeal.name.includes(cust.name))?.id : (editLeadData ? customers.find(cust => editLeadData.name.includes(cust.name))?.id : null));
                        setContacts([...contacts, { id: Date.now(), accountId: accId, name: newStakeholderName, role: newStakeholderRole, phone: newStakeholderPhone, email: newStakeholderEmail, influenceLevel: "Medium" }]);
                      }
                      setNewStakeholderName("");
                      setNewStakeholderRole("");
                      setNewStakeholderPhone("");
                      setNewStakeholderEmail("");
                      setEditingStakeholder(null);
                      setIsAddingStakeholder(false);
                    }
                  }}
                  disabled={!newStakeholderName || !newStakeholderRole}
                  className={`flex-1 px-4 py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${newStakeholderName && newStakeholderRole ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-gray-300 cursor-not-allowed"}`}
                >
                  {editingStakeholder ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Lead Modal */}
      {
        isEditingLead && editLeadData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1200] p-4">
            <div className="bg-white p-6 rounded-[32px] w-full max-w-[360px] shadow-2xl flex flex-col max-h-[90vh]">
              <h3 className="font-black text-gray-800 text-xl mb-6 tracking-tight uppercase">Edit Lead Details</h3>
              <div className="space-y-4 overflow-y-auto pr-1.5 custom-scrollbar pb-2 flex-1">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Deal Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={editLeadData.name.split('–')[1] || editLeadData.name}
                    onChange={(e) => setEditLeadData({ ...editLeadData, name: `${editLeadData.name.split('–')[0]}–${e.target.value}` })}
                  />
                </div>

                {(() => {
                  const dealCust = customers.find(c => editLeadData.name.includes(c.name));
                  const dealCustProjects = dealCust ? projects.filter(p => p.customerId.toString() === dealCust.id.toString()) : [];
                  return dealCustProjects.length > 0 ? (
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Associated Project</label>
                      <select
                        className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={editLeadData.projectId || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const proj = projects.find(p => p.id === val);
                          setEditLeadData({
                            ...editLeadData,
                            projectId: val || "",
                            projectName: proj ? proj.projectName : ""
                          });
                        }}
                      >
                        <option value="">None (Independent Deal)</option>
                        {dealCustProjects.map(proj => (
                          <option key={proj.id} value={proj.id}>{proj.projectName}</option>
                        ))}
                      </select>
                    </div>
                  ) : null;
                })()}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Value (₹ Lakhs)</label>
                    <input
                      type="text"
                      className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={editLeadData.value}
                      onChange={(e) => setEditLeadData({ ...editLeadData, value: e.target.value })}
                    />
                  </div>
                  <div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block tracking-widest flex justify-between">
                        <span>Deal Probability</span>
                        <span className="text-blue-600">{editLeadData.probability}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        value={editLeadData.probability}
                        onChange={(e) => setEditLeadData({ ...editLeadData, probability: parseInt(e.target.value) })}
                      />
                      <div className="flex justify-between mt-2 text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                        <span>0% (Cold)</span>
                        <span>50% (Demo)</span>
                        <span>100% (Order)</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block tracking-widest flex justify-between">
                      <span>Current Stage</span>
                      <span className="text-blue-600 italic">Mandatory Interaction</span>
                    </label>
                    <select
                      className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={editLeadData.stage}
                      onChange={(e) => {
                        const newStage = e.target.value;
                        if (newStage !== editLeadData.stage) {
                          // Change the draft stage
                          const updates = { stage: newStage, probability: stageProbability[newStage] };
                          if (newStage === "Lost") {
                            updates.state = "Active";
                          }
                          // Initialize inline activity logs
                          updates.activityInput = "";
                          updates.activityPurpose = newStage === "Negotiation" ? "Negotiation Meeting" : (newStage === "Lost" ? "Loss Analysis" : "Deal Follow-up");
                          updates.closureDate = "";
                          updates.lostCompetitor = "";
                          updates.lostReason = "Price";
                          updates.isSchedulingFollowUp = false;
                          updates.followUpDate = "";
                          updates.followUpText = "";
                          
                          setEditLeadData({ ...editLeadData, ...updates });
                        }
                      }}
                    >
                      {stages.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Lead Source</label>
                      <select
                        className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={editLeadData.source || "Direct Inquiry"}
                        onChange={(e) => setEditLeadData({ ...editLeadData, source: e.target.value })}
                      >
                        <option value="Direct Inquiry">Direct Inquiry</option>
                        <option value="Referral">Referral</option>
                        <option value="CME/Conference">CME/Conference</option>
                        <option value="Cold Call">Cold Call</option>
                        <option value="Website">Website</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Marketing Campaign</label>
                      <input
                        type="text"
                        className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="E.g. Q4 CME Event"
                        value={editLeadData.campaign || ""}
                        onChange={(e) => setEditLeadData({ ...editLeadData, campaign: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Exit Criteria: Associated Products & Budget Range */}
                  {["Qualified", "Demo", "Negotiation", "Order", "Closed Won"].includes(editLeadData.stage) && (
                    <div className="col-span-2 space-y-3 p-4 bg-blue-50/20 border border-blue-100/50 rounded-2xl">
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Associated Products</label>
                        <div className="bg-white border border-gray-100 p-3 rounded-xl space-y-2 max-h-32 overflow-y-auto">
                          {catalog.map(prod => {
                            const isSelected = (editLeadData.productIds || []).includes(prod.id);
                            return (
                              <label key={prod.id} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                  checked={isSelected}
                                  onChange={() => {
                                    const newProductIds = isSelected
                                      ? (editLeadData.productIds || []).filter(id => id !== prod.id)
                                      : [...(editLeadData.productIds || []), prod.id];
                                    const selectedProductNames = catalog.filter(p => newProductIds.includes(p.id)).map(p => p.name);
                                    const hospitalName = editLeadData.name.split('–')[0] || editLeadData.name;
                                    const newName = selectedProductNames.length > 0
                                      ? `${hospitalName}–${selectedProductNames.join(" & ")}`
                                      : editLeadData.name;
                                    setEditLeadData({
                                      ...editLeadData,
                                      productIds: newProductIds,
                                      name: newName
                                    });
                                  }}
                                />
                                <span>{prod.name} ({prod.category})</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Budget Range *</label>
                        <select
                          className="w-full border border-gray-100 p-2.5 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                          value={editLeadData.budgetRange || ""}
                          onChange={(e) => setEditLeadData({ ...editLeadData, budgetRange: e.target.value })}
                        >
                          <option value="">Select Budget Range...</option>
                          <option value="₹5L - ₹10L">₹5L - ₹10L</option>
                          <option value="₹10L - ₹15L">₹10L - ₹15L</option>
                          <option value="₹15L - ₹25L">₹15L - ₹25L</option>
                          <option value="₹25L - ₹40L">₹25L - ₹40L</option>
                          <option value="₹40L+">₹40L+</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Exit Criteria: Demo Date & Outcome */}
                  {["Demo", "Negotiation", "Order", "Closed Won"].includes(editLeadData.stage) && (
                    <div className="col-span-2 grid grid-cols-2 gap-3 p-4 bg-purple-50/20 border border-purple-100/50 rounded-2xl">
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Demo Date *</label>
                        <input
                          type="date"
                          className="w-full border border-gray-100 p-2.5 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          value={editLeadData.demoDate || ""}
                          onChange={(e) => setEditLeadData({ ...editLeadData, demoDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Demo Outcome *</label>
                        <select
                          className="w-full border border-gray-100 p-2.5 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                          value={editLeadData.demoOutcome || ""}
                          onChange={(e) => setEditLeadData({ ...editLeadData, demoOutcome: e.target.value })}
                        >
                          <option value="">Select Outcome...</option>
                          <option value="Demo Successful - Highly Interested">Demo Successful - Highly Interested</option>
                          <option value="Decision Pending">Decision Pending</option>
                          <option value="Product Rejected">Product Rejected</option>
                          <option value="Demo not required">Demo not required</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Expected Closure Date (Qualified to Negotiation/Order) */}
                  {["Negotiation", "Order", "Closed Won"].includes(editLeadData.stage) && (
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Expected Closure Date *</label>
                      <input
                        type="date"
                        className="w-full border border-gray-100 p-2.5 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={editLeadData.closureDate || editLeadData.expectedClosureDate || ""}
                        onChange={(e) => setEditLeadData({ ...editLeadData, closureDate: e.target.value, expectedClosureDate: e.target.value })}
                      />
                    </div>
                  )}

                  {/* Lost Fields */}
                  {editLeadData.stage === "Lost" && (
                    <div className="col-span-2 grid grid-cols-2 gap-3 p-4 bg-red-50/20 border border-red-100/50 rounded-2xl">
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Lost Competitor *</label>
                        <input
                          type="text"
                          className="w-full border border-gray-100 p-2.5 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="E.g. Mindray, GE"
                          value={editLeadData.lostCompetitor || ""}
                          onChange={(e) => setEditLeadData({ ...editLeadData, lostCompetitor: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Lost Reason *</label>
                        <select
                          className="w-full border border-gray-100 p-2.5 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                          value={editLeadData.lostReason || "Price"}
                          onChange={(e) => setEditLeadData({ ...editLeadData, lostReason: e.target.value })}
                        >
                          <option value="Price">Price</option>
                          <option value="Feature Missing">Feature Missing</option>
                          <option value="Relationship / Competitor Entrenched">Relationship / Competitor Entrenched</option>
                          <option value="Budget Cancelled">Budget Cancelled</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Closed Won Handover Setup */}
                  {["Order", "Closed Won"].includes(editLeadData.stage) && (
                    <div className="col-span-2 border border-gray-100 p-4 rounded-2xl bg-gray-50/50 space-y-4">
                      <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                        <span>📦</span> Handover Setup
                      </div>

                      {editLeadData.stage === "Closed Won" && (
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Purchase Order Number *</label>
                          <input
                            type="text"
                            className="w-full border border-gray-100 p-2.5 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="E.g. PO-12345"
                            value={editLeadData.poNumber || ""}
                            onChange={(e) => setEditLeadData({ ...editLeadData, poNumber: e.target.value })}
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Handover Coordinator *</label>
                        <select
                          className="w-full border border-gray-100 p-2.5 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                          value={editLeadData.handoverOwner || editLeadData.owner || "Basheer"}
                          onChange={(e) => setEditLeadData({ ...editLeadData, handoverOwner: e.target.value })}
                        >
                          {mockContributorsList.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Delivery Notes *</label>
                        <textarea
                          className="w-full border border-gray-100 p-2.5 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px]"
                          placeholder="Enter downstream delivery and scheduling notes..."
                          value={editLeadData.deliveryNotes || ""}
                          onChange={(e) => setEditLeadData({ ...editLeadData, deliveryNotes: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Installation Requirements</label>
                        <textarea
                          className="w-full border border-gray-100 p-2.5 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px]"
                          placeholder="Power supply, room dimensions..."
                          value={editLeadData.installationRequirements || ""}
                          onChange={(e) => setEditLeadData({ ...editLeadData, installationRequirements: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Special Commitments</label>
                        <textarea
                          className="w-full border border-gray-100 p-2.5 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px]"
                          placeholder="Extended warranty, probes..."
                          value={editLeadData.specialCommitments || ""}
                          onChange={(e) => setEditLeadData({ ...editLeadData, specialCommitments: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Handover Checklist</label>
                        {[
                          "Delivery schedule aligned with hospital readiness",
                          "Installation pre-requisites review completed",
                          "Clinical support staff assigned for onboarding"
                        ].map((item, idx) => {
                          const checklist = editLeadData.handoverChecklist || [false, false, false];
                          const checked = checklist[idx] || false;
                          return (
                            <label key={idx} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                checked={checked}
                                onChange={(e) => {
                                  const updatedChecklist = [...checklist];
                                  updatedChecklist[idx] = e.target.checked;
                                  setEditLeadData({ ...editLeadData, handoverChecklist: updatedChecklist });
                                }}
                              />
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Stage Transition Interaction Notes */}
                  {stageChanged && (
                    <div className="col-span-2 mt-4 p-4 rounded-2xl border border-blue-100 bg-blue-50/30 space-y-4">
                      <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1">
                        <span>💬</span> Stage Transition Interaction
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Purpose</label>
                        <select
                          className="w-full bg-white border border-gray-100 p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                          value={editLeadData.activityPurpose || "Deal Follow-up"}
                          onChange={(e) => setEditLeadData({ ...editLeadData, activityPurpose: e.target.value })}
                        >
                          <option>Deal Follow-up</option>
                          <option>Field Scanning</option>
                          <option>Marketing</option>
                          <option>Negotiation Meeting</option>
                          <option>PO Follow up</option>
                          <option>Payment Follow up</option>
                          <option>Installation</option>
                          <option>Application Support</option>
                          <option>Demo</option>
                          <option>Demo Feedback</option>
                          <option>Service Issue</option>
                          <option>Service Interaction</option>
                          <option>Feedback</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Transition Notes *</label>
                        <textarea
                          className="w-full bg-white border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                          placeholder="What did you discuss during this stage change?"
                          value={editLeadData.activityInput || ""}
                          onChange={(e) => setEditLeadData({ ...editLeadData, activityInput: e.target.value })}
                        />
                      </div>

                      {/* Schedule Follow-up Checkbox & Sub-fields */}
                      <div className="pt-2 border-t border-blue-100/50">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={editLeadData.isSchedulingFollowUp || false}
                            onChange={(e) => setEditLeadData({ ...editLeadData, isSchedulingFollowUp: e.target.checked })}
                          />
                          <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Schedule Follow-up?</span>
                        </label>

                        {editLeadData.isSchedulingFollowUp && (
                          <div className="space-y-3 mt-2 pl-5 border-l border-blue-200">
                            <div>
                              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Due Date *</label>
                              <input
                                type="date"
                                className="w-full bg-white border border-gray-100 p-2 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                value={editLeadData.followUpDate || ""}
                                onChange={(e) => setEditLeadData({ ...editLeadData, followUpDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Follow-up Task (Optional)</label>
                              <input
                                type="text"
                                className="w-full bg-white border border-gray-100 p-2 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="E.g. Send quote, Call again"
                                value={editLeadData.followUpText || ""}
                                onChange={(e) => setEditLeadData({ ...editLeadData, followUpText: e.target.value })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  </div>

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">⭐ Priority Flag</span>
                    <span className="text-[9px] text-amber-600 font-bold">Highlight in pipeline report</span>
                  </div>
                  <button
                    onClick={() => setEditLeadData({ ...editLeadData, isPriority: !editLeadData.isPriority })}
                    className={`w-12 h-6 rounded-full transition-all relative ${editLeadData.isPriority ? 'bg-amber-400' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editLeadData.isPriority ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                {/* Opportunity State (PB-002) */}
                {editLeadData.stage !== "Lost" && (
                  <div className={`p-4 rounded-2xl border transition-all ${editLeadData.state === "On Hold" ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">⏸ Opportunity State</span>
                        <span className="text-[9px] text-gray-500 font-bold">{editLeadData.state === "On Hold" ? "Paused – excluded from forecast" : "Contributing to forecast"}</span>
                      </div>
                      <select
                        className={`text-xs font-black px-3 py-1.5 rounded-xl border outline-none focus:ring-2 transition-all ${editLeadData.state === "On Hold" ? "bg-amber-100 border-amber-300 text-amber-800 focus:ring-amber-400" : "bg-white border-gray-200 text-gray-700 focus:ring-blue-500"}`}
                        value={editLeadData.state || "Active"}
                        onChange={(e) => {
                          const newState = e.target.value;
                          const updates = { state: newState };
                          if (newState === "On Hold" && !editLeadData.holdReason) {
                            updates.holdReason = "Budget Approval Pending";
                          }
                          setEditLeadData({ ...editLeadData, ...updates });
                        }}
                      >
                        <option value="Active">✅ Active</option>
                        <option value="On Hold">⏸ On Hold</option>
                      </select>
                    </div>

                    {editLeadData.state === "On Hold" && (
                      <div className="space-y-3 mt-4 pt-3 border-t border-amber-200/50">
                        <div>
                          <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1 block">Hold Reason</label>
                          <select
                            className="w-full bg-white border border-amber-200 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-amber-400"
                            value={editLeadData.holdReason || "Budget Approval Pending"}
                            onChange={(e) => setEditLeadData({ ...editLeadData, holdReason: e.target.value })}
                          >
                            <option>Budget Approval Pending</option>
                            <option>Tender Delayed</option>
                            <option>Construction Delay</option>
                            <option>Regulatory Approval</option>
                            <option>Customer Internal Approval</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1 block">Hold Notes</label>
                          <textarea
                            className="w-full bg-white border border-amber-200 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-amber-400 min-h-[50px]"
                            placeholder="Details about why this opportunity is on hold..."
                            value={editLeadData.holdNotes || ""}
                            onChange={(e) => setEditLeadData({ ...editLeadData, holdNotes: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1 block">Expected Reactivation Date</label>
                          <input
                            type="date"
                            className="w-full bg-white border border-amber-200 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-amber-400"
                            value={editLeadData.holdReactivationDate || ""}
                            onChange={(e) => setEditLeadData({ ...editLeadData, holdReactivationDate: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Opportunity Contributors Card (PB-004) */}
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Opportunity Contributors</span>
                    {(() => {
                      const totalSplit = (editLeadData.contributors || []).reduce((acc, curr) => acc + (parseInt(curr.split) || 0), 0);
                      return totalSplit === 100 ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-black uppercase tracking-widest rounded-lg">
                          ✅ Allocation: {totalSplit}%
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-black uppercase tracking-widest rounded-lg animate-pulse">
                          ⚠️ Allocation: {totalSplit}%
                        </span>
                      );
                    })()}
                  </div>

                  <div className="space-y-2">
                    {(editLeadData.contributors || []).map((c, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100">
                        <select
                          className="flex-1 min-w-0 bg-gray-50 border border-gray-100 p-2 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                          value={c.user}
                          onChange={(e) => {
                            const updated = [...(editLeadData.contributors || [])];
                            updated[idx] = { ...updated[idx], user: e.target.value };
                            setEditLeadData({ ...editLeadData, contributors: updated });
                          }}
                        >
                          {mockContributorsList.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>

                        <select
                          className="flex-1 min-w-0 bg-gray-50 border border-gray-100 p-2 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                          value={c.role}
                          onChange={(e) => {
                            const updated = [...(editLeadData.contributors || [])];
                            updated[idx] = { ...updated[idx], role: e.target.value };
                            setEditLeadData({ ...editLeadData, contributors: updated });
                          }}
                        >
                          {mockRolesList.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>

                        <div className="flex items-center gap-1 w-16 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-12 bg-gray-50 border border-gray-100 p-2 rounded-lg text-xs font-bold text-gray-700 text-center outline-none focus:ring-2 focus:ring-blue-500"
                            value={c.split}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                              const updated = [...(editLeadData.contributors || [])];
                              updated[idx] = { ...updated[idx], split: val };
                              setEditLeadData({ ...editLeadData, contributors: updated });
                            }}
                          />
                          <span className="text-xs font-bold text-gray-400">%</span>
                        </div>

                        {(editLeadData.contributors || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editLeadData.contributors || []).filter((_, i) => i !== idx);
                              setEditLeadData({ ...editLeadData, contributors: updated });
                            }}
                            className="w-7 h-7 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 flex items-center justify-center font-bold text-sm shrink-0 transition-colors"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(editLeadData.contributors || []), { user: "Ahmed", role: "Product Specialist", split: 0 }];
                      setEditLeadData({ ...editLeadData, contributors: updated });
                    }}
                    className="mt-3 w-full py-2 bg-blue-50/50 hover:bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 active:scale-[0.99]"
                  >
                    ＋ Add Contributor
                  </button>
                </div>

                {/* Key Contacts Section */}
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Key Contacts</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingStakeholder(true);
                      }}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      ＋ Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {contacts.filter(c => {
                      const accId = customers.find(cust => editLeadData.name.includes(cust.name))?.id;
                      return c.accountId === accId;
                    }).map(c => (
                      <div key={c.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-800 leading-tight">{c.name}</div>
                          <div className="text-[9px] text-gray-400 font-bold uppercase">{c.role}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStakeholder(c);
                              setNewStakeholderName(c.name);
                              setNewStakeholderRole(c.role);
                              setNewStakeholderPhone(c.phone || "");
                              setNewStakeholderEmail(c.email || "");
                              setIsAddingStakeholder(true);
                            }}
                            className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 flex items-center justify-center font-bold text-[10px] transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setContacts(prev => prev.filter(con => con.id !== c.id));
                            }}
                            className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center font-bold text-sm transition-colors"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))}
                    {contacts.filter(c => {
                      const accId = customers.find(cust => editLeadData.name.includes(cust.name))?.id;
                      return c.accountId === accId;
                    }).length === 0 && (
                      <div className="text-gray-400 text-[10px] font-bold italic text-center py-2">No key contacts added yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingLead(false);
                    setEditLeadData(null);
                  }}
                  className="flex-1 px-4 py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const originalDeal = deals.find(d => d.id === editLeadData.id);
                    if (!originalDeal) return;

                    const targetStage = editLeadData.stage;

                    // 1. Stage Exit Criteria Validations

                    // Lead -> Qualified: Product or Budget Range is missing
                    if (["Qualified", "Demo", "Negotiation", "Order", "Closed Won"].includes(targetStage)) {
                      if (!editLeadData.productIds || editLeadData.productIds.length === 0 || !editLeadData.budgetRange) {
                        setCustomAlert({
                          title: "Qualification Criteria Required",
                          message: "Please enter Budget Range and select Products to Qualify the deal.",
                          type: "warning"
                        });
                        return;
                      }
                    }

                    // Qualified -> Demo: Demo Date is missing
                    if (["Demo", "Negotiation", "Order", "Closed Won"].includes(targetStage)) {
                      if (editLeadData.demoOutcome !== "Demo not required" && !editLeadData.demoDate) {
                        setCustomAlert({
                          title: "Demo Details Required",
                          message: "Please enter Demo Date for the demo.",
                          type: "warning"
                        });
                        return;
                      }
                    }

                    // Demo -> Negotiation: Demo Outcome or Expected Closure Date is missing
                    if (["Negotiation", "Order", "Closed Won"].includes(targetStage)) {
                      const finalClosureDate = editLeadData.closureDate || editLeadData.expectedClosureDate;
                      if (!editLeadData.demoOutcome || !finalClosureDate) {
                        setCustomAlert({
                          title: "Negotiation Details Required",
                          message: "Please enter Demo Outcome and Expected Closure Date to transition to Negotiation.",
                          type: "warning"
                        });
                        return;
                      }
                    }

                    // Negotiation -> Order: Value, Product Details, Splits (where applicable), or Handover Info is missing
                    if (["Order", "Closed Won"].includes(targetStage)) {
                      // Value check: must be non-zero
                      const rawVal = editLeadData.value || "";
                      const cleanVal = parseFloat(rawVal.replace(/[^\d.]/g, "")) || 0;
                      if (cleanVal <= 0) {
                        setCustomAlert({
                          title: "Value Required",
                          message: "Please enter a valid non-zero deal value.",
                          type: "warning"
                        });
                        return;
                      }

                      // Product Details check
                      if (!editLeadData.productIds || editLeadData.productIds.length === 0) {
                        setCustomAlert({
                          title: "Products Required",
                          message: "Please select at least one product.",
                          type: "warning"
                        });
                        return;
                      }

                      // Handover coordinator check
                      if (!editLeadData.handoverOwner) {
                        setCustomAlert({
                          title: "Handover Coordinator Required",
                          message: "Please select a Handover Coordinator.",
                          type: "warning"
                        });
                        return;
                      }

                      // Delivery Notes check
                      if (!editLeadData.deliveryNotes || !editLeadData.deliveryNotes.trim()) {
                        setCustomAlert({
                          title: "Delivery Notes Required",
                          message: "Please fill in the Delivery Notes for the handover.",
                          type: "warning"
                        });
                        return;
                      }

                      // Split verification (total must equal 100%)
                      const contributors = editLeadData.contributors || [];
                      const totalSplit = contributors.reduce((acc, curr) => acc + (parseInt(curr.split) || 0), 0);
                      if (totalSplit !== 100) {
                        setCustomAlert({
                          title: "Split Verification",
                          message: `Contribution allocation must total 100%.\n\nCurrent total: ${totalSplit}%`,
                          type: "warning"
                        });
                        return;
                      }
                    }

                    // Any Stage -> Closed Lost (Lost): Loss Reason or Competitor is missing
                    if (targetStage === "Lost") {
                      if (!editLeadData.lostCompetitor || !editLeadData.lostCompetitor.trim()) {
                        setCustomAlert({
                          title: "Competitor Required",
                          message: "Please enter Competitor Name.",
                          type: "warning"
                        });
                        return;
                      }
                      if (!editLeadData.lostReason || !editLeadData.lostReason.trim()) {
                        setCustomAlert({
                          title: "Reason Required",
                          message: "Please select Lost Reason.",
                          type: "warning"
                        });
                        return;
                      }
                    }

                    // Order -> Closed Won: Purchase Order Number or Product Details is missing
                    if (targetStage === "Closed Won") {
                      if (!editLeadData.poNumber || !editLeadData.poNumber.trim()) {
                        setCustomAlert({
                          title: "Purchase Order Number Required",
                          message: "Please enter the Purchase Order Number.",
                          type: "warning"
                        });
                        return;
                      }
                      if (!editLeadData.productIds || editLeadData.productIds.length === 0) {
                        setCustomAlert({
                          title: "Products Required",
                          message: "Please select at least one product.",
                          type: "warning"
                        });
                        return;
                      }
                    }

                    // 2. Transition notes & follow-up validations if stage changed
                    const stageChanged = originalDeal && editLeadData.stage !== originalDeal.stage;
                    if (stageChanged) {
                      if (!editLeadData.activityInput || !editLeadData.activityInput.trim()) {
                        setCustomAlert({
                          title: "Notes Required",
                          message: editLeadData.stage === "Lost" ? "Please enter Loss Details." : editLeadData.stage === "Negotiation" ? "Please enter a Negotiation Summary." : editLeadData.stage === "Closed Won" ? "Please enter Closed Won Notes." : "Please enter Interaction Notes.",
                          type: "warning"
                        });
                        return;
                      }
                    }

                    if (editLeadData.isSchedulingFollowUp && !editLeadData.followUpDate) {
                      setCustomAlert({
                        title: "Date Required",
                        message: "Please set a Due Date for the follow-up task.",
                        type: "warning"
                      });
                      return;
                    }

                    // 3. Process activity logging if stage changed
                    if (stageChanged) {
                      const accountId = selectedAccount ? selectedAccount.id : (originalDeal ? customers.find(c => originalDeal.name.includes(c.name))?.id : null);

                      let finalNotes = editLeadData.activityInput || "";
                      if (editLeadData.stage === "Negotiation" && editLeadData.closureDate) {
                        finalNotes = `Moved to Negotiation. Exp. Closure: ${editLeadData.closureDate}. ` + finalNotes;
                      } else if (editLeadData.stage === "Lost") {
                        finalNotes = `Deal Lost to ${editLeadData.lostCompetitor || "Competitor"} due to ${editLeadData.lostReason || "Price"}. ` + finalNotes;
                      } else if (editLeadData.stage === "Closed Won") {
                        finalNotes = `Deal Closed Won with PO ${editLeadData.poNumber || "N/A"}. ` + finalNotes;
                      }

                      const newActivity = {
                        id: Date.now(),
                        accountId: accountId,
                        dealId: editLeadData.id,
                        notes: finalNotes,
                        purpose: editLeadData.stage === "Negotiation" ? "Negotiation Meeting" : (editLeadData.stage === "Lost" ? "Loss Analysis" : (editLeadData.stage === "Closed Won" ? "PO Follow up" : (editLeadData.activityPurpose || "Deal Follow-up"))),
                        date: getFormattedDateTime(),
                        owner: currentUser
                      };
                      setActivities(prev => [newActivity, ...prev]);

                      // Create follow-up reminder if checked
                      if (editLeadData.isSchedulingFollowUp && editLeadData.followUpDate) {
                        const newReminder = {
                          id: Date.now() + 1,
                          accountId: accountId,
                          dealId: editLeadData.id,
                          text: editLeadData.followUpText || `Follow up: ${finalNotes.substring(0, 30)}...`,
                          dueDate: editLeadData.followUpDate,
                          status: "pending",
                          owner: editLeadData.owner || currentUser
                        };
                        setReminders(prev => [newReminder, ...prev]);
                      }
                    }

                    // 4. Save and clean up UI temporary fields
                    const savedDealData = {
                      ...editLeadData,
                      probability: stageChanged ? stageProbability[editLeadData.stage] : editLeadData.probability,
                    };

                    // Map expected closure date
                    if (editLeadData.closureDate) {
                      savedDealData.expectedClosureDate = editLeadData.closureDate;
                    }

                    // Derived handover status if Won
                    if (editLeadData.stage === "Order" || editLeadData.stage === "Closed Won") {
                      savedDealData.handoverStatus = deriveHandoverStatus(editLeadData.handoverChecklist || [false, false, false]);
                    }

                    // Clean up temporary UI state variables
                    delete savedDealData.activityInput;
                    delete savedDealData.activityPurpose;
                    delete savedDealData.isSchedulingFollowUp;
                    delete savedDealData.followUpDate;
                    delete savedDealData.followUpText;

                    setDeals(prev => prev.map(d => d.id === editLeadData.id ? savedDealData : d));
                    setSelectedDeal(savedDealData);
                    setIsEditingLead(false);
                    setEditLeadData(null);
                  }}
                  className="flex-1 px-4 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Asset Form Modal */}
      {
        showAssetModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100]">
            <div className="bg-white p-6 rounded-2xl w-[320px] shadow-2xl transition-all scale-100">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest">Log Equipment</h3>
                <button onClick={() => { setShowAssetModal(false); setNewAssetModel(""); setNewAssetNotes(""); }} className="text-gray-400 hover:text-gray-800 font-bold text-lg">&times;</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Equipment Model *</label>
                  <input type="text" className="w-full border border-gray-200 p-2 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="e.g. SonoScape S50" value={newAssetModel} onChange={e => setNewAssetModel(e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Installation Date *</label>
                  <input type="date" className="w-full border border-gray-200 p-2 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 cursor-pointer" value={newAssetInstallDate} onChange={e => setNewAssetInstallDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Service Notes / Status</label>
                  <textarea className="w-full border border-gray-200 p-2 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 min-h-[60px]" placeholder="Warranty status, upcoming service..." value={newAssetNotes} onChange={e => setNewAssetNotes(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowAssetModal(false); setNewAssetModel(""); setNewAssetNotes(""); }} className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                  <button disabled={!newAssetModel} onClick={() => {
                    setAssets([{ id: Date.now(), accountId: selectedAccount.id, type: newAssetModel, installDate: newAssetInstallDate, notes: newAssetNotes }, ...assets]);
                    setShowAssetModal(false);
                    setNewAssetModel("");
                    setNewAssetNotes("");
                  }} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md">Log Asset</button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Settings View */}
      {
        view === "settings" && currentUser === "Manager" && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto w-full bg-gray-50">
            <h2 className="text-2xl font-black text-gray-800 mb-6 uppercase tracking-tight flex items-center gap-3"><span className="text-3xl">⚙️</span> Target Setting</h2>
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm max-w-4xl mx-auto">
              <div className="mb-6 opacity-60 text-sm font-medium">Update the sales quotas and targets for your field representatives. Changes take effect universally across the dashboard widgets.</div>
              {Object.keys(repData).map(rep => (
                <div key={rep} className="mb-6 p-5 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <h3 className="font-extrabold text-blue-900 text-lg mb-4 flex justify-between items-end border-b pb-2">
                    <span>{rep === "Basheer" ? "Manager (Basheer)" : rep}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-lg uppercase tracking-widest">Zone: {repData[rep].zone}</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.keys(repData[rep].target).map(category => (
                      <div key={category} className="bg-white p-3 border rounded-xl shadow-sm">
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">{category === 'annual' ? 'Annual Quota' : `${category.toUpperCase()} Quota`}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 font-bold text-gray-400">₹</span>
                          <input type="number" value={repData[rep].target[category]} onChange={(e) => {
                            const updated = { ...repData };
                            updated[rep].target[category] = parseInt(e.target.value) || 0;
                            setRepData(updated);
                          }} className="pl-8 pr-3 py-2 border border-gray-100 rounded-lg w-full font-black text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* Product Management Modal */}
      {
        isProductModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
            <div className="bg-white p-6 rounded-[32px] w-full max-w-[420px] shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-gray-800 text-xl tracking-tight uppercase">
                  {editingProduct ? "Edit Product" : "Add New Machine"}
                </h3>
                <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-800 text-2xl font-bold">&times;</button>
              </div>

              <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar pb-4 flex-1">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Machine Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g. SonoScape S50 Elite"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Brand</label>
                    <input
                      type="text"
                      className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all"
                      placeholder="e.g. Sonoscape"
                      value={newProductBrand}
                      onChange={(e) => setNewProductBrand(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Model</label>
                    <input
                      type="text"
                      className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all"
                      placeholder="e.g. X3"
                      value={newProductModel}
                      onChange={(e) => setNewProductModel(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">SBU *</label>
                    <select
                      value={newProductSbu}
                      onChange={(e) => setNewProductSbu(e.target.value)}
                      className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all"
                    >
                      <option value="Imaging">Imaging</option>
                      <option value="Critical Care">Critical Care</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">OEM Partner *</label>
                    <select
                      value={newProductOem}
                      onChange={(e) => setNewProductOem(e.target.value)}
                      className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all"
                    >
                      <option value="Sonoscape">Sonoscape</option>
                      <option value="Magnamed">Magnamed</option>
                      <option value="Mindray">Mindray</option>
                      <option value="Edan">Edan</option>
                      <option value="GE Healthcare">GE Healthcare</option>
                      <option value="Philips">Philips</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Price Range</label>
                  <input
                    type="text"
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all"
                    placeholder="e.g. ₹25L - ₹35L"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Collateral Links</label>
                    <button
                      onClick={() => setNewProductCollaterals([...newProductCollaterals, { label: "", url: "" }])}
                      className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider hover:bg-blue-100"
                    >
                      + Add Link
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newProductCollaterals.map((link, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group">
                        <button
                          onClick={() => setNewProductCollaterals(newProductCollaterals.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          &times;
                        </button>
                        <input
                          type="text"
                          placeholder="Label (e.g. Brochure)"
                          className="w-full bg-white border border-gray-100 p-2 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                          value={link.label}
                          onChange={(e) => {
                            const updated = [...newProductCollaterals];
                            updated[idx].label = e.target.value;
                            setNewProductCollaterals(updated);
                          }}
                        />
                        <input
                          type="url"
                          placeholder="URL (https://...)"
                          className="w-full bg-white border border-gray-100 p-2 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-blue-500"
                          value={link.url}
                          onChange={(e) => {
                            const updated = [...newProductCollaterals];
                            updated[idx].url = e.target.value;
                            setNewProductCollaterals(updated);
                          }}
                        />
                      </div>
                    ))}
                    {newProductCollaterals.length === 0 && (
                      <div className="text-center py-4 bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">No collaterals added</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 px-4 py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newProductName && newProductSbu && newProductOem) {
                      const productData = {
                        id: editingProduct ? editingProduct.id : Date.now(),
                        name: newProductName,
                        brand: newProductBrand,
                        model: newProductModel,
                        sbu: newProductSbu,
                        oem: newProductOem,
                        category: newProductSbu === "Imaging" ? "Ultrasound" : "Critical Care",
                        priceRange: newProductPrice || "TBD",
                        collaterals: newProductCollaterals.filter(l => l.label && l.url)
                      };

                      if (editingProduct) {
                        setCatalog(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
                      } else {
                        setCatalog(prev => [...prev, productData]);
                      }

                      setIsProductModalOpen(false);
                      setEditingProduct(null);
                      setNewProductName("");
                      setNewProductBrand("");
                      setNewProductModel("");
                      setNewProductSbu("Imaging");
                      setNewProductOem("Sonoscape");
                      setNewProductPrice("");
                      setNewProductCollaterals([]);
                    }
                  }}
                  disabled={!newProductName || !newProductSbu || !newProductOem}
                  className={`flex-1 px-4 py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${(newProductName && newProductSbu && newProductOem) ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-gray-300 cursor-not-allowed"}`}
                >
                  {editingProduct ? "Update Catalog" : "Add to Catalog"}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Drilldown Report Modal */}
      {
        drilldownReport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[250] p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-gray-50 w-full max-w-4xl max-h-[90vh] sm:rounded-[32px] rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-8">

              <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{drilldownReport.data.length} Deals Found</h3>
                  <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{drilldownReport.title}</h2>
                </div>
                <button onClick={() => setDrilldownReport(null)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                  <span className="text-xl text-gray-500 font-black">&times;</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {drilldownReport.data.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-bold italic">No deals match this report filter.</div>
                ) : (
                  <div className="grid gap-3">
                    {drilldownReport.data.map(deal => (
                      <div key={deal.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderLeftColor: isHoldOverdue(deal) ? '#ef4444' : (deal.isPriority ? '#fbbf24' : 'transparent'), borderLeftWidth: '4px' }}>
                        <div>
                          <div className="font-bold text-blue-900 flex items-center gap-2">
                            {deal.isPriority && <span className="text-amber-400">⭐</span>}
                            {deal.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                            {deal.contributors && deal.contributors.length > 1 ? (
                              <span className="inline-flex items-center gap-1 bg-indigo-600 text-white px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider shadow-sm">
                                👥 Shared ({deal.contributors.length})
                              </span>
                            ) : (
                              <span>👤 {deal.owner}</span>
                            )}
                            <span>⏳ {deal.lastActivity}</span>
                            <span>🚩 {deal.stage}</span>
                            {deal.state === "On Hold" && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[7px] font-black uppercase tracking-wider rounded-md">⏸ On Hold</span>}
                            {isHoldOverdue(deal) && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[7px] font-black uppercase tracking-wider rounded-md animate-pulse">🚨 Reactivation Overdue</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-extrabold text-gray-800">{deal.value}</div>
                          </div>
                          <button
                            onClick={() => {
                              setDrilldownReport(null);
                              setSelectedDeal(deal);
                            }}
                            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-xs transition-colors"
                          >
                            View Deal
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-gray-200 text-right">
                <button onClick={() => setDrilldownReport(null)} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors">
                  Close Report
                </button>
              </div>

            </div>
          </div>
        )
      }

      {/* Haroon Notification (Due Today or Overdue) */}
      {
        (() => {
          const todayDate = new Date();
          // Format YYYY-MM-DD reliably covering standard local time offsets
          const offset = todayDate.getTimezoneOffset();
          const todayLocal = new Date(todayDate.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];

          const myDueToday = reminders.filter(r => new Date(r.dueDate) <= new Date(todayLocal) && r.status === "pending" && (currentUser === "Manager" || r.owner === currentUser));

          if (myDueToday.length > 0 && !hideHaroonNotification) {
            const isManager = currentUser === "Manager";
            return (
              <div className="fixed bottom-6 right-6 left-6 sm:left-auto bg-green-50 rounded-2xl shadow-2xl border-2 border-green-500 overflow-hidden z-[5000] max-w-sm animate-in slide-in-from-bottom-8">
                <div className="bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 flex justify-between items-center">
                  <span className="flex items-center gap-2 animate-pulse">🛎️ Priority Action Required</span>
                  <button onClick={() => setHideHaroonNotification(true)} className="hover:bg-green-600 rounded px-1">&times;</button>
                </div>
                <div className="p-4 flex gap-4">
                  <div className="bg-white text-green-600 h-12 w-12 rounded-xl flex flex-col justify-center items-center shadow-inner font-black shrink-0 border border-green-100">
                    <span className="text-[10px] uppercase">{new Date().toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl leading-none">{new Date().getDate()}</span>
                  </div>
                  <div>
                    {/* Removed redundant header as requested */}
                    <p className="text-xs text-green-700 font-medium mt-1">
                      {isManager ? "The team has " : "You have "} {myDueToday.length} action{myDueToday.length > 1 ? 's' : ''} requiring attention today.
                    </p>
                    <button onClick={() => { setView("reminders"); setHideHaroonNotification(true); }} className="mt-2 text-[10px] font-black bg-white text-green-600 px-3 py-1.5 rounded border border-green-200 uppercase tracking-widest hover:bg-green-100">
                      View Actions &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()
      }

      {/* Project Detail View Overlay */}
      {selectedProject && (
        <div className="fixed inset-0 bg-white overflow-y-auto z-[1000] animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 pb-8 rounded-b-[40px] shadow-2xl relative border-b-4 border-blue-400">
            <button
              onClick={() => setSelectedProject(null)}
              className="mb-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 w-fit transition-all uppercase tracking-wider border border-white/30"
            >
              &larr; Back to Projects
            </button>

            <div className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-1">Project Details Profile</div>
            <h2 className="font-bold text-3xl leading-tight mb-3 uppercase tracking-tight">{selectedProject.projectName}</h2>
            
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold opacity-80 uppercase tracking-widest mt-4">
              <button
                onClick={() => {
                  const cust = customers.find(c => c.id.toString() === selectedProject.customerId.toString());
                  if (cust) {
                    setSelectedAccount(cust);
                    setSelectedProject(null);
                  }
                }}
                className="bg-blue-500/30 hover:bg-blue-500/50 text-white px-2.5 py-1.5 rounded-lg border border-blue-400/30 transition-all flex items-center gap-1 normal-case shadow-sm cursor-pointer"
              >
                <span>🏥 Customer:</span>
                <span className="underline font-bold">{selectedProject.customerName}</span>
              </button>
              <span className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">🏷️ {selectedProject.projectType}</span>
              <span className={`px-2.5 py-1.5 rounded-lg border ${
                selectedProject.status === "Active" ? "bg-green-500/20 border-green-400/30 text-green-200" :
                selectedProject.status === "Planning" ? "bg-blue-500/20 border-blue-400/30 text-blue-200" :
                selectedProject.status === "On Hold" ? "bg-amber-500/20 border-amber-400/30 text-amber-200" :
                "bg-gray-500/20 border-gray-400/30 text-gray-200"
              }`}>
                ⚡ {selectedProject.status}
              </span>
              <span className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">📅 Exp Close: {selectedProject.expectedCloseDate || "N/A"}</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 pb-24 max-w-5xl mx-auto space-y-6 mt-4">
            <section className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner">
              <h3 className="font-black text-gray-800 mb-4 flex justify-between items-center text-sm uppercase tracking-wider">
                Associated Opportunities
                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-200 font-black uppercase tracking-widest">
                  {deals.filter(d => d.projectId === selectedProject.id).length} Deals
                </span>
              </h3>
              
              <div className="space-y-3">
                {deals
                  .filter(d => d.projectId === selectedProject.id)
                  .map(d => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSelectedDeal(d);
                        setSelectedProject(null);
                      }}
                      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <div className="text-sm font-black text-blue-900 leading-tight">
                          {d.name.split("–")[1] || d.name}
                        </div>
                        <div className="text-[9px] text-gray-400 font-black mt-1 uppercase tracking-wider flex items-center gap-2">
                          <span>{d.stage} · {d.owner}</span>
                          {d.state === "On Hold" && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[7px] font-black uppercase tracking-wider rounded-md">⏸ On Hold</span>}
                          {isHoldOverdue(d) && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[7px] font-black uppercase tracking-wider rounded-md animate-pulse">🚨 Reactivation Overdue</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-extrabold text-blue-900 text-lg">{d.value}</div>
                          <div className="text-[9px] font-bold text-gray-400">🎯 {d.probability}%</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-blue-50 transition-colors">
                          <span className="text-gray-400 group-hover:text-blue-600 transition-colors">&rarr;</span>
                        </div>
                      </div>
                    </div>
                  ))}
                {deals.filter(d => d.projectId === selectedProject.id).length === 0 && (
                  <div className="text-gray-400 text-xs italic py-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    No active or historical deals linked to this project.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Project Creation/Edit Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-[32px] w-full max-w-[400px] shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-800 text-xl tracking-tight uppercase">
                {editingProject ? "Edit Project" : "Add New Project"}
              </h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>

            <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar pb-4 flex-1">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Apollo Cardiac Wing Phase 2"
                  className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all"
                  value={formProjectName}
                  onChange={(e) => setFormProjectName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="relative project-customer-lookup-container">
                <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Customer Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    className={`w-full border border-gray-100 p-3.5 rounded-2xl font-bold text-sm outline-none transition-all pr-8 ${isFormCustomerLocked ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500'}`}
                    placeholder="Search Customer..."
                    value={formCustomerSearchText}
                    disabled={isFormCustomerLocked}
                    onChange={(e) => {
                      if (isFormCustomerLocked) return;
                      setFormCustomerSearchText(e.target.value);
                      setIsFormCustomerLookupOpen(true);
                      if (!e.target.value) {
                        setFormCustomerId("");
                      }
                    }}
                    onFocus={() => {
                      if (!isFormCustomerLocked) setIsFormCustomerLookupOpen(true);
                    }}
                    onClick={() => {
                      if (!isFormCustomerLocked) setIsFormCustomerLookupOpen(true);
                    }}
                  />
                  {formCustomerSearchText && !isFormCustomerLocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormCustomerSearchText("");
                        setFormCustomerId("");
                        setIsFormCustomerLookupOpen(true);
                      }}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 font-bold text-lg"
                    >
                      &times;
                    </button>
                  )}
                </div>
                {isFormCustomerLookupOpen && !isFormCustomerLocked && (
                  <div className="absolute z-[1200] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[160px] overflow-y-auto">
                    {customers
                      .filter(c =>
                        c.name?.toLowerCase().includes(formCustomerSearchText.toLowerCase()) || formCustomerSearchText === ""
                      )
                      .map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setFormCustomerId(c.id.toString());
                            setFormCustomerSearchText(c.name);
                            setIsFormCustomerLookupOpen(false);
                          }}
                          className={`p-2 border-b cursor-pointer text-xs hover:bg-blue-50 transition-colors ${formCustomerId.toString() === c.id.toString() ? 'bg-blue-100 font-bold' : ''}`}
                        >
                          <div className="font-bold text-gray-800">{c.name}</div>
                          <div className="text-[9px] text-gray-500 uppercase font-semibold">{c.city} · {c.zone}</div>
                        </div>
                      ))}
                    {customers.filter(c =>
                      c.name?.toLowerCase().includes(formCustomerSearchText.toLowerCase())
                    ).length === 0 && (
                      <div className="p-3 text-xs text-gray-500 italic text-center">No customers found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Project Type</label>
                  <select
                    value={formProjectType}
                    onChange={(e) => setFormProjectType(e.target.value)}
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all cursor-pointer"
                  >
                    <option value="New Hospital Build">New Hospital Build</option>
                    <option value="Expansion">Expansion</option>
                    <option value="Equipment Upgrade">Equipment Upgrade</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Digital Transformation">Digital Transformation</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Status</label>
                  <select
                    value={formProjectStatus}
                    onChange={(e) => setFormProjectStatus(e.target.value)}
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all cursor-pointer"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Expected Close Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all cursor-pointer"
                  value={formExpectedCloseDate}
                  onChange={(e) => setFormExpectedCloseDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="flex-1 px-4 py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveProject}
                disabled={!formProjectName.trim() || !formCustomerId}
                className={`flex-1 px-4 py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
                  formProjectName.trim() && formCustomerId ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {editingProject ? "Update Project" : "Add Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beat Plan Detail View Overlay */}
      {selectedBeatPlan && (
        <div className="fixed inset-0 bg-white overflow-y-auto z-[1000] animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 pb-8 rounded-b-[40px] shadow-2xl relative border-b-4 border-blue-400">
            <button
              onClick={() => setSelectedBeatPlan(null)}
              className="mb-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 w-fit transition-all uppercase tracking-wider border border-white/30"
            >
              &larr; Back to Beat Plans
            </button>

            <div className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-1">Beat Plan Profile Details</div>
            <h2 className="font-bold text-3xl leading-tight mb-3 uppercase tracking-tight">{selectedBeatPlan.quarter} Beat Plan</h2>
            
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold opacity-80 uppercase tracking-widest mt-4">
              <span className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">👤 Planner: {selectedBeatPlan.userName}</span>
              <span className={`px-2.5 py-1.5 rounded-lg border ${
                selectedBeatPlan.status === "Approved" ? "bg-green-500/20 border-green-400/30 text-green-200" :
                selectedBeatPlan.status === "Submitted" ? "bg-orange-500/20 border-orange-400/30 text-orange-200" :
                "bg-gray-500/20 border-gray-400/30 text-gray-200"
              }`}>
                ⚡ {selectedBeatPlan.status}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6 pb-24 max-w-4xl mx-auto space-y-8 mt-4">
            
            {/* Planned Accounts Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider border-b pb-2">Planned Accounts</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3">Hospital</th>
                      <th className="px-4 py-3 text-center">Planned Visits</th>
                      <th className="px-4 py-3">Strategic Objective</th>
                      <th className="px-4 py-3 text-right">Expected Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {selectedBeatPlan.accounts && selectedBeatPlan.accounts.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              const cust = customers.find(c => c.id.toString() === a.customerId.toString());
                              if (cust) {
                                setSelectedAccount(cust);
                                setSelectedBeatPlan(null);
                              }
                            }}
                            className="text-blue-600 hover:underline font-bold text-left"
                          >
                            {a.customerName}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-600">{a.plannedVisitCount}</td>
                        <td className="px-4 py-3 text-gray-500 italic max-w-[250px] truncate" title={a.strategicObjective}>{a.strategicObjective}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">₹{a.expectedRevenue}L</td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    {(() => {
                      const totalHosp = selectedBeatPlan.accounts ? selectedBeatPlan.accounts.length : 0;
                      const totalVisits = selectedBeatPlan.accounts ? selectedBeatPlan.accounts.reduce((sum, a) => sum + (a.plannedVisitCount || 0), 0) : 0;
                      const totalRev = selectedBeatPlan.accounts ? selectedBeatPlan.accounts.reduce((sum, a) => sum + (a.expectedRevenue || 0), 0) : 0;
                      
                      return (
                        <tr className="bg-gray-50/50 font-black text-gray-900 border-t border-gray-200">
                          <td className="px-4 py-3 text-gray-500 uppercase tracking-wider">Total ({totalHosp} Hospitals)</td>
                          <td className="px-4 py-3 text-center">{totalVisits}</td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3 text-right text-blue-900">₹{totalRev}L</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Execution Analytics Section (Only for Approved Plans) */}
            {selectedBeatPlan.status === "Approved" && (() => {
              const plannedHospitals = selectedBeatPlan.accounts ? selectedBeatPlan.accounts.length : 0;
              const totalPlannedVisits = selectedBeatPlan.accounts ? selectedBeatPlan.accounts.reduce((sum, a) => sum + (a.plannedVisitCount || 0), 0) : 0;
              
              let coveredHospitals = 0;
              let totalActivitiesLogged = 0;
              
              const accountsWithMetrics = selectedBeatPlan.accounts.map(a => {
                const matchingActs = activities.filter(act => 
                  act.accountId && a.customerId && act.accountId.toString() === a.customerId.toString() &&
                  getActivityQuarter(act) === selectedBeatPlan.quarter
                );
                
                const loggedCount = matchingActs.length;
                totalActivitiesLogged += loggedCount;
                if (loggedCount > 0) {
                  coveredHospitals += 1;
                }
                
                const progress = a.plannedVisitCount > 0 
                  ? Math.min(100, Math.round((loggedCount / a.plannedVisitCount) * 100)) 
                  : 0;
                
                return {
                  ...a,
                  activitiesLogged: loggedCount,
                  progressPercent: progress,
                  covered: loggedCount > 0
                };
              });

              const compliancePercent = plannedHospitals > 0 
                ? Math.round((coveredHospitals / plannedHospitals) * 100) 
                : 0;
              const progressPercent = totalPlannedVisits > 0 
                ? Math.min(100, Math.round((totalActivitiesLogged / totalPlannedVisits) * 100)) 
                : 0;

              return (
                <div className="space-y-6">
                  {/* Execution Summary Cards */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider border-b pb-2">Execution Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Planned Hospitals</span>
                        <span className="text-lg font-black text-blue-900">{plannedHospitals}</span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Covered Hospitals</span>
                        <span className="text-lg font-black text-blue-900">{coveredHospitals}</span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Compliance %</span>
                        <span className="text-lg font-black text-green-600">{compliancePercent}%</span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Planned Visits</span>
                        <span className="text-lg font-black text-blue-900">{totalPlannedVisits}</span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Activities Logged</span>
                        <span className="text-lg font-black text-blue-900">{totalActivitiesLogged}</span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Progress %</span>
                        <span className="text-lg font-black text-blue-950">{progressPercent}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Coverage Status Table */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider border-b pb-2">Account Coverage Status</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-wider">
                            <th className="px-4 py-3">Hospital</th>
                            <th className="px-4 py-3 text-center">Planned Visits</th>
                            <th className="px-4 py-3 text-center">Activities Logged</th>
                            <th className="px-4 py-3 text-center">Progress %</th>
                            <th className="px-4 py-3 text-center">Covered</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                          {accountsWithMetrics.map(am => (
                            <tr key={am.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3 font-bold text-gray-900">{am.customerName}</td>
                              <td className="px-4 py-3 text-center font-bold text-gray-500">{am.plannedVisitCount}</td>
                              <td className="px-4 py-3 text-center font-bold text-gray-500">{am.activitiesLogged}</td>
                              <td className="px-4 py-3 text-center font-bold text-gray-900">{am.progressPercent}%</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                  am.covered ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                                }`}>
                                  {am.covered ? "Yes" : "No"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Info Timestamps */}
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner space-y-4">
              <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider border-b pb-2">Audit Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-gray-500">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Created Date:</span>
                    <span className="font-bold text-gray-700">{selectedBeatPlan.createdDate}</span>
                  </div>
                  {selectedBeatPlan.submittedDate && (
                    <div className="flex justify-between">
                      <span>Submitted Date:</span>
                      <span className="font-bold text-gray-700">{selectedBeatPlan.submittedDate}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {selectedBeatPlan.approvedDate && (
                    <div className="flex justify-between text-green-700">
                      <span>Approved Date:</span>
                      <span className="font-bold">{selectedBeatPlan.approvedDate}</span>
                    </div>
                  )}
                  {selectedBeatPlan.approvedBy && (
                    <div className="flex justify-between text-green-700">
                      <span>Approved By:</span>
                      <span className="font-bold">{selectedBeatPlan.approvedBy}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              {selectedBeatPlan.status === "Draft" && selectedBeatPlan.userId === currentUser && (
                <button
                  onClick={() => {
                    submitBeatPlanDirectly(selectedBeatPlan);
                  }}
                  className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-orange-700"
                >
                  Submit Plan
                </button>
              )}
              {selectedBeatPlan.status === "Submitted" && currentUser === "Manager" && (
                <button
                  onClick={() => {
                    approveBeatPlan(selectedBeatPlan);
                  }}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-green-700"
                >
                  Approve Plan
                </button>
              )}
              <button
                onClick={() => setSelectedBeatPlan(null)}
                className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beat Plan Form Modal */}
      {isBeatPlanModalOpen && (() => {
        const isFormValid = formBeatPlanQuarter && formBeatPlanAccounts.length > 0 && formBeatPlanAccounts.every(a => 
          a.customerId && 
          parseInt(a.plannedVisitCount) > 0 && 
          a.strategicObjective.trim() !== "" && 
          parseFloat(a.expectedRevenue) >= 0
        );

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-[32px] w-full max-w-[720px] shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-gray-800 text-xl tracking-tight uppercase">
                  {editingBeatPlan ? "Edit Beat Plan" : "Create Beat Plan"}
                </h3>
                <button onClick={() => setIsBeatPlanModalOpen(false)} className="text-gray-400 hover:text-gray-800 text-2xl font-bold">&times;</button>
              </div>

              <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar pb-4 flex-1">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Quarter *</label>
                  <select
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all cursor-pointer"
                    value={formBeatPlanQuarter}
                    onChange={(e) => setFormBeatPlanQuarter(e.target.value)}
                  >
                    <option value="Q1 2026">Q1 2026</option>
                    <option value="Q2 2026">Q2 2026</option>
                    <option value="Q3 2026">Q3 2026</option>
                    <option value="Q4 2026">Q4 2026</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-black text-gray-600 uppercase tracking-wider">Hospitals Planned *</span>
                    <button
                      onClick={() => setFormBeatPlanAccounts(prev => [...prev, { id: Date.now().toString(), customerId: "", customerName: "", searchText: "", isLookupOpen: false, plannedVisitCount: 1, strategicObjective: "", expectedRevenue: 0 }])}
                      className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all uppercase tracking-wider"
                    >
                      ＋ Add Hospital
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formBeatPlanAccounts.map((a, idx) => (
                      <div key={a.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200/50 space-y-3 relative">
                        <button
                          onClick={() => setFormBeatPlanAccounts(prev => prev.filter(item => item.id !== a.id))}
                          className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-black text-[10px] uppercase tracking-wider"
                          title="Remove Account"
                        >
                          ✕ Remove
                        </button>
                        
                        <div className={`relative beat-row-hospital-lookup-container beat-row-hospital-lookup-container-${a.id}`}>
                          <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block tracking-widest">Hospital Name *</label>
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full border border-gray-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800 transition-all pr-8"
                              placeholder="Search Hospital..."
                              value={a.searchText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormBeatPlanAccounts(prev => prev.map(item => item.id === a.id ? {
                                  ...item,
                                  searchText: val,
                                  customerId: val ? item.customerId : "",
                                  customerName: val ? item.customerName : "",
                                  isLookupOpen: true
                                } : item));
                              }}
                              onFocus={() => {
                                setFormBeatPlanAccounts(prev => prev.map(item => item.id === a.id ? { ...item, isLookupOpen: true } : item));
                              }}
                            />
                            {a.searchText && (
                              <button
                                onClick={() => {
                                  setFormBeatPlanAccounts(prev => prev.map(item => item.id === a.id ? { ...item, searchText: "", customerId: "", customerName: "", isLookupOpen: true } : item));
                                }}
                                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 font-bold text-base"
                              >
                                &times;
                              </button>
                            )}
                          </div>

                          {a.isLookupOpen && (
                            <div className="absolute z-[1200] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[140px] overflow-y-auto">
                              {customers
                                .filter(c => c.customerType === "Hospital")
                                .filter(c =>
                                  c.name?.toLowerCase().includes(a.searchText.toLowerCase()) || a.searchText === ""
                                )
                                .map(c => (
                                  <div
                                    key={c.id}
                                    onClick={() => {
                                      setFormBeatPlanAccounts(prev => prev.map(item => item.id === a.id ? {
                                        ...item,
                                        customerId: c.id.toString(),
                                        customerName: c.name,
                                        searchText: c.name,
                                        isLookupOpen: false
                                      } : item));
                                    }}
                                    className={`p-2 border-b cursor-pointer text-xs hover:bg-blue-50 transition-colors ${a.customerId.toString() === c.id.toString() ? 'bg-blue-100 font-bold' : ''}`}
                                  >
                                    <div className="font-bold text-gray-800">{c.name}</div>
                                    <div className="text-[8px] text-gray-500 uppercase font-semibold">{c.city} · {c.zone}</div>
                                  </div>
                                ))}
                              {customers.filter(c => c.customerType === "Hospital").filter(c =>
                                c.name?.toLowerCase().includes(a.searchText.toLowerCase())
                              ).length === 0 && (
                                <div className="p-3 text-xs text-gray-500 italic text-center">No hospitals found</div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block tracking-widest">Planned Visits *</label>
                            <input
                              type="number"
                              min="1"
                              className="w-full border border-gray-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800 transition-all"
                              value={a.plannedVisitCount}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormBeatPlanAccounts(prev => prev.map(item => item.id === a.id ? { ...item, plannedVisitCount: val } : item));
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block tracking-widest">Expected Rev (₹L) *</label>
                            <input
                              type="number"
                              min="0"
                              className="w-full border border-gray-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800 transition-all"
                              value={a.expectedRevenue}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormBeatPlanAccounts(prev => prev.map(item => item.id === a.id ? { ...item, expectedRevenue: val } : item));
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block tracking-widest">Strategic Objective *</label>
                          <input
                            type="text"
                            placeholder="e.g. ICU modernization discussions"
                            className="w-full border border-gray-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800 transition-all"
                            value={a.strategicObjective}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormBeatPlanAccounts(prev => prev.map(item => item.id === a.id ? { ...item, strategicObjective: val } : item));
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {formBeatPlanAccounts.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 italic text-xs">
                      No hospitals planned yet. Click "＋ Add Hospital" to start coverage planning.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setIsBeatPlanModalOpen(false)}
                  className="flex-grow px-4 py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveBeatPlan(false)}
                  disabled={!isFormValid}
                  className={`px-4 py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex-grow cursor-pointer ${
                    isFormValid ? "bg-gray-600 hover:bg-gray-700 shadow-gray-200" : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  Save Draft
                </button>
                <button
                  onClick={() => saveBeatPlan(true)}
                  disabled={!isFormValid}
                  className={`px-4 py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex-grow cursor-pointer ${
                    isFormValid ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Custom Alert Modal */}
      {customAlert && (() => {
        const typeConfigs = {
          error: {
            icon: "🛑",
            bg: "bg-red-50",
            border: "border-red-100",
            text: "text-red-500",
            titleText: "text-red-950",
            buttonBg: "bg-red-500 hover:bg-red-600 shadow-red-500/20",
          },
          success: {
            icon: "✅",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            text: "text-emerald-500",
            titleText: "text-emerald-950",
            buttonBg: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20",
          },
          info: {
            icon: "ℹ️",
            bg: "bg-blue-50",
            border: "border-blue-100",
            text: "text-blue-500",
            titleText: "text-blue-950",
            buttonBg: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20",
          },
          warning: {
            icon: "⚠️",
            bg: "bg-amber-50",
            border: "border-amber-100",
            text: "text-amber-500",
            titleText: "text-amber-950",
            buttonBg: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
          }
        };
        const config = typeConfigs[customAlert.type] || typeConfigs.warning;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
            <div className={`bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl border ${config.border} flex flex-col items-center text-center animate-in zoom-in-95 duration-200`}>
              <div className={`w-16 h-16 ${config.bg} ${config.text} rounded-full flex items-center justify-center text-3xl mb-4 border ${config.border} shadow-inner`}>
                {config.icon}
              </div>
              <h3 className={`text-sm font-black ${config.titleText} uppercase tracking-wider mb-2`}>
                {customAlert.title}
              </h3>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed mb-6">
                {customAlert.message}
              </p>
              <button
                onClick={() => setCustomAlert(null)}
                className={`w-full py-3 ${config.buttonBg} active:scale-[0.98] text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-md`}
              >
                Okay
              </button>
            </div>
          </div>
        );
      })()}
    </div >
  );
}
