import React, { useState, useEffect } from "react";

const stages = ["Lead", "Qualified", "Demo", "Negotiation", "Order", "Lost"];

const stageProbability = {
  Lead: 10,
  Qualified: 30,
  Demo: 50,
  Negotiation: 70,
  Order: 100,
  Lost: 0
};

const initialRepData = {
  "Basheer": { zone: "North Kerala", target: { annual: 100, q1: 25, q2: 25, q3: 25, q4: 25 } },
  "Amit": { zone: "South Kerala", target: { annual: 160, q1: 40, q2: 40, q3: 40, q4: 40 } },
  "Rahul": { zone: "Bangalore", target: { annual: 120, q1: 30, q2: 30, q3: 30, q4: 30 } }
};

const mockContributorsList = ["Basheer", "Amit", "Rahul", "Ahmed", "Rashid", "Niyas", "Firoz", "Anoop"];
const mockRolesList = ["Account Manager", "Product Specialist", "Clinical Specialist", "Sales Engineer", "Closer", "Manager"];

// 🔷 Demo dataset
const initialDeals = [
  // --- "Basheer" (Salesperson 1) ---
  { id: 1, name: "Al Shifa Hospital – SonoScape S50", stage: "Qualified", value: "₹22L", probability: 30, owner: "Basheer", lastActivity: "Just now", timeline: [{ text: "Doctor interested in S50 Elite, requirement discussed" }], isPriority: false, state: "Active", contributors: [{ user: "Basheer", role: "Account Manager", split: 60 }, { user: "Amit", role: "Product Specialist", split: 40 }] },
  { id: 2, name: "City Scan – SonoScape E2", stage: "Demo", value: "₹18L", probability: 50, owner: "Basheer", lastActivity: "Just now", timeline: [{ text: "Demo scheduled for E2 portable" }], state: "Active", contributors: [{ user: "Basheer", role: "Account Manager", split: 80 }, { user: "Rahul", role: "Clinical Specialist", split: 15 }] },

  { id: 3, name: "Iqra SonoScape X3", stage: "Order", value: "₹30L", probability: 100, owner: "Basheer", lastActivity: "Just now", timeline: [{ text: "PO confirmed" }], isLastMonth: false, state: "Active" },
  { id: 4, name: "MIMS Clinic - P40 Elite", stage: "Lead", value: "₹15L", probability: 10, owner: "Basheer", lastActivity: "1d ago", timeline: [{ text: "Cold call, showed interest" }], state: "Active" },
  { id: 5, name: "Baby Memorial - Patient Monitor", stage: "Negotiation", value: "₹8L", probability: 70, owner: "Basheer", lastActivity: "2h ago", timeline: [{ text: "Price negotiation round 1" }], isPriority: true, state: "Active" },
  { id: 101, name: "Fathima Hospital - Defibrillator", stage: "Order", value: "₹10L", probability: 100, owner: "Basheer", lastActivity: "20d ago", timeline: [{ text: "Installed" }], isLastMonth: true, state: "Active" },
  { id: 102, name: "Wayanad Medical - Patient Monitor", stage: "Lost", value: "₹5L", probability: 0, owner: "Basheer", lastActivity: "15d ago", timeline: [{ text: "Budget constraints" }], isLastMonth: true, state: "Active" },

  // --- "Amit" (Salesperson 2) ---
  { id: 6, name: "Aster Medcity – SonoScape S80", stage: "Demo", value: "₹28L", probability: 50, owner: "Amit", lastActivity: "1d ago", timeline: [{ text: "Demo completed, awaiting feedback" }], state: "Active" },
  { id: 7, name: "Trivandrum Medical College – SonoScape HD-550", stage: "Qualified", value: "₹150L", probability: 30, owner: "Amit", lastActivity: "2d ago", timeline: [{ text: "Met HOD, budget approved" }], state: "On Hold", holdReason: "Budget Approval Pending", holdNotes: "State budget allocation delayed to next fiscal quarter. HOD confirmed interest remains.", holdReactivationDate: "2026-08-15" },
  { id: 8, name: "Lakeshore Hospital - Patient Monitors", stage: "Lead", value: "₹12L", probability: 10, owner: "Amit", lastActivity: "3d ago", timeline: [{ text: "Initial inquiry email" }], isPriority: false, state: "Active" },
  { id: 9, name: "KIMS Trivandrum - Defibrillators", stage: "Order", value: "₹20L", probability: 100, owner: "Amit", lastActivity: "4h ago", timeline: [{ text: "Advance payment received" }], isLastMonth: false, state: "Active" },
  { id: 10, name: "SUT Hospital - ECG Machines", stage: "Negotiation", value: "₹5L", probability: 70, owner: "Amit", lastActivity: "Just now", timeline: [{ text: "Waiting for final sign-off" }], state: "Active" },
  { id: 103, name: "Amrita Hospital Kochi - SonoScape S22", stage: "Order", value: "₹25L", probability: 100, owner: "Amit", lastActivity: "18d ago", timeline: [{ text: "Delivered" }], isLastMonth: true, state: "Active" },

  // --- "Rahul" (Salesperson 3 - Bangalore Region) ---
  { id: 11, name: "Apollo Hospitals – SonoScape P60", stage: "Negotiation", value: "₹25L", probability: 70, owner: "Rahul", lastActivity: "2d ago", timeline: [{ text: "Commercial discussion ongoing" }], state: "Active" },
  { id: 12, name: "NIMHANS - MRI Setup", stage: "Lead", value: "₹200L", probability: 10, owner: "Rahul", lastActivity: "4d ago", timeline: [{ text: "RFP received" }], state: "On Hold", holdReason: "Regulatory Approval", holdNotes: "AERB clearance pending for MRI installation. Expected 2-3 month delay.", holdReactivationDate: "2026-09-01" },
  { id: 13, name: "Manipal Hospital - Portable X-Ray", stage: "Demo", value: "₹10L", probability: 50, owner: "Rahul", lastActivity: "1h ago", timeline: [{ text: "Scheduled demo" }], isPriority: true, state: "Active" },
  { id: 14, name: "Aster CMI - Hematology Analyzer", stage: "Order", value: "₹9L", probability: 100, owner: "Rahul", lastActivity: "1d ago", timeline: [{ text: "Installation completed" }], isLastMonth: false, state: "Active" },
  { id: 15, name: "Fortis Hospital - SonoScape HD-500", stage: "Qualified", value: "₹45L", probability: 30, owner: "Rahul", lastActivity: "Just now", timeline: [{ text: "Technical presentation delivered" }], state: "Active" },
  { id: 104, name: "Sakra World - Ventilators", stage: "Lost", value: "₹40L", probability: 0, owner: "Rahul", lastActivity: "12d ago", timeline: [{ text: "Lost to competitor" }], isLastMonth: true, state: "Active" }
];

// 🔷 Customer Dataset (Phase 2)
const initialCustomers = [
  { id: 1, name: "Al Shifa Hospital", zone: "North Kerala", city: "Malappuram" },
  { id: 2, name: "City Scan", zone: "North Kerala", city: "Calicut" },
  { id: 3, name: "Iqra Hospital", zone: "North Kerala", city: "Calicut" },
  { id: 4, name: "MIMS Clinic", zone: "North Kerala", city: "Calicut" },
  { id: 5, name: "Baby Memorial", zone: "North Kerala", city: "Calicut" },
  { id: 6, name: "Aster Medcity", zone: "South Kerala", city: "Kochi" },
  { id: 7, name: "Trivandrum Medical College", zone: "South Kerala", city: "Trivandrum" },
  { id: 8, name: "Lakeshore Hospital", zone: "South Kerala", city: "Kochi" },
  { id: 9, name: "KIMS Trivandrum", zone: "South Kerala", city: "Trivandrum" },
  { id: 10, name: "SUT Hospital", zone: "South Kerala", city: "Trivandrum" },
  { id: 16, name: "Amrita Hospital", zone: "South Kerala", city: "Kochi" },
  { id: 11, name: "Apollo Hospitals", zone: "Bangalore", city: "Bangalore" },
  { id: 12, name: "NIMHANS", zone: "Bangalore", city: "Bangalore" },
  { id: 13, name: "Manipal Hospital", zone: "Bangalore", city: "Bangalore" },
  { id: 14, name: "Aster CMI", zone: "Bangalore", city: "Bangalore" },
  { id: 15, name: "Fortis Hospital", zone: "Bangalore", city: "Bangalore" }
];

const initialCatalog = [
  // --- Ultrasound (SonoScape) ---
  {
    id: 1, name: "SonoScape S50 Elite", category: "Ultrasound", priceRange: "₹25L - ₹35L",
    collaterals: [
      { label: "Brochure", url: "https://www.sonoscapeindia.in/productdetails-5-discover-and-embrace-elite" },
      { label: "Clinical Images", url: "https://www.sonoscape.com/product/clinical_images/s50" }
    ]
  },
  {
    id: 2, name: "SonoScape X3", category: "Ultrasound", priceRange: "₹12L - ₹18L",
    collaterals: [{ label: "Brochure", url: "https://www.sonoscapeindia.in/productdetails-25-small-size-smart-sight" }]
  },
  {
    id: 3, name: "SonoScape HD-550", category: "Ultrasound", priceRange: "₹45L - ₹75L",
    collaterals: [{ label: "Official Page", url: "https://www.sonoscapeindia.in/productdetails-10-full-hd-video-endoscopy-system" }]
  },
  {
    id: 4, name: "SonoScape E2", category: "Ultrasound", priceRange: "₹8L - ₹12L",
    collaterals: [{ label: "Brochure", url: "https://www.sonoscapeindia.in/productdetails-58-sonoscape-e2-compact-color-doppler-ultrasound-system" }]
  },
  {
    id: 5, name: "SonoScape P60 Exp", category: "Ultrasound", priceRange: "₹40L - ₹55L",
    collaterals: [
      { label: "Brochure", url: "https://www.sonoscapeindia.in/productdetails-3-intelligent-future-attainable" },
      { label: "Video Demo", url: "https://www.youtube.com/watch?v=demo" }
    ]
  },

  // --- Critical Care (Magnamed) ---
  {
    id: 6, name: "Magnamed Fleximag Max", category: "Critical Care", priceRange: "₹18L - ₹28L",
    collaterals: [{ label: "Brochure", url: "https://www.inovacoesmagnamed.com.br/fleximagmaxen" }]
  },
  {
    id: 7, name: "Magnamed OxyMag", category: "Critical Care", priceRange: "₹8L - ₹15L",
    collaterals: [{ label: "Brochure", url: "https://www.inovacoesmagnamed.com.br/oxymag-en" }]
  },

  // --- Critical Care (EDAN / Magnamed) ---
  {
    id: 8, name: "EDAN i15 Blood Gas", category: "Critical Care", priceRange: "₹5L - ₹8L",
    collaterals: [
      { label: "Brochure", url: "https://www.edan.com/product/e/i15_Blood_Gas_and_Chemistry_Analysis_System.html" },
      { label: "Catalog Extract", url: "file:///C:/Users/Basheer/.gemini/antigravity/brain/4a1141d4-664e-49f1-b6fb-2bd5ed4da440/extract_edan_poct_1776388853938.webp" }
    ]
  },
  {
    id: 9, name: "EDAN elite V Series", category: "Critical Care", priceRange: "₹12L - ₹22L",
    collaterals: [{ label: "Brochure", url: "https://www.edan.com/product/i/PM_elite_V_Series.html" }]
  },
  {
    id: 10, name: "Magnamed Ventmeter", category: "Critical Care", priceRange: "₹4L - ₹6L",
    collaterals: [{ label: "Brochure", url: "https://www.inovacoesmagnamed.com.br/ventmeter-en" }]
  }
];

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
    return saved ? JSON.parse(saved) : initialCustomers;
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

  const [deals, setDeals] = useState(() => {
    const saved = localStorage.getItem("sales_os_deals");
    if (saved && saved.includes("Mindray")) {
      localStorage.removeItem("sales_os_deals");
      return initialDeals;
    }
    const parsed = saved ? JSON.parse(saved) : initialDeals;
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
      return {
        ...d,
        owner: d.owner === "You" ? "Basheer" : d.owner,
        isPriority: d.isPriority === true ? true : false,
        state: d.state || "Active",
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
  const [assets, setAssets] = useState(() => JSON.parse(localStorage.getItem("sales_os_assets")) || []);
  const [selectedAccount, setSelectedAccount] = useState(null); // For 360 view
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Ultrasound");
  const [newProductUrl, setNewProductUrl] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductCollaterals, setNewProductCollaterals] = useState([]);

  const [catalog, setCatalog] = useState(() => {
    const saved = localStorage.getItem("sales_os_catalog");
    // Force reset if stale data includes competitor products or missing categories
    if (saved && (saved.includes("Mindray") || saved.includes("General Imaging") || saved.includes("productdetails-56") || saved.includes("Ventilator"))) {
      localStorage.removeItem("sales_os_catalog");
      return initialCatalog;
    }
    return saved ? JSON.parse(saved) : initialCatalog;
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

  const [reminders, setReminders] = useState(() => JSON.parse(localStorage.getItem("sales_os_reminders") || "[]"));

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
    const saved = localStorage.getItem("sales_os_activities");
    if (saved) {
      let parsed = JSON.parse(saved);
      // 🛠️ Data Cleaning for Demo Persistence
      return parsed.map(a => {
        let n = a.notes;
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

  const handleSaveCustomer = () => {
    if (!newCustomerName.trim()) return;
    const newCustomer = {
      id: Date.now(),
      name: newCustomerName,
      zone: newCustomerZone,
      city: newCustomerCity,
      class: newCustomerClass,
      specialty: newCustomerSpecialty
    };
    setCustomers(prev => [...prev, newCustomer]);
    setSelectedCustomerId(newCustomer.id);
    setIsCreatingCustomer(false);
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
          isPriority: false
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
        isPriority: false
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

  const activePipelineDeals = dashboardDealsRibbon.filter(d => d.stage !== "Order" && d.stage !== "Lost" && d.state !== "On Hold");

  const ordersDeals = dashboardDealsRibbon.filter(d => d.stage === "Order" && d.state !== "On Hold");
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

  const matchesMetricFilter = (deal) => {
    if (!metricFilter) return true;
    if (metricFilter === "orders") return deal.stage === "Order";
    if (metricFilter === "hot") return deal.stage !== "Order" && deal.stage !== "Lost";
    if (metricFilter === "won") return deal.stage === "Order" && deal.isLastMonth;
    if (metricFilter === "lost") return deal.stage === "Lost";
    if (metricFilter === "stagnant") return deal.stage !== "Order" && deal.stage !== "Lost" && getDaysAgo(deal.lastActivity) > 7;
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
                { id: "pipeline", label: "Pipeline View", icon: "📊" },
                { id: "manager", label: "Deals List", icon: "📋" },
                { id: "customers", label: "Customer Directory", icon: "🏥" },
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
      {!selectedDeal && (view === "pipeline" || view === "manager") && stagnantDealsCount > 0 && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center gap-3">
          <span className="text-amber-600 font-bold">⚠️ Action Required</span>
          <span className="text-amber-800 text-sm font-semibold">{stagnantDealsCount} pipeline deal{stagnantDealsCount > 1 ? 's have' : ' has'} no activity over the last 7 days.</span>
          <button onClick={() => setMetricFilter("stagnant")} className="ml-auto bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase transition-colors shadow-sm">Review Stagnant</button>
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
                            borderLeftColor: deal.isPriority ? '#fbbf24' : '#60a5fa'
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
                            onChange={(e) => changeStage(deal, e.target.value)}
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
                    style={{ borderLeftColor: deal.isPriority ? '#fbbf24' : '#60a5fa' }}
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
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <span>📍 {acc.city}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span>🌐 {acc.zone}</span>
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
                  setNewProductCategory("Ultrasound");
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
              <option>All</option>
              <option>Ultrasound</option>
              <option>Critical Care</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {catalog.filter(p => catalogCategoryFilter === "All" || p.category === catalogCategoryFilter).map(prod => (
              <div key={prod.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all group flex flex-col p-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{prod.category}</span>
                    <h3 className="font-extrabold text-gray-800 text-xl group-hover:text-blue-600 transition-colors uppercase tracking-tight">{prod.name}</h3>
                  </div>
                  {currentUser === "Manager" && (
                    <button
                      onClick={() => {
                        setEditingProduct(prod);
                        setNewProductName(prod.name);
                        setNewProductCategory(prod.category);
                        setNewProductPrice(prod.priceRange || "");
                        setNewProductCollaterals(prod.collaterals || [{ label: "Brochure", url: prod.url }]);
                        setIsProductModalOpen(true);
                      }}
                      className="w-8 h-8 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 shadow-sm"
                    >
                      ✎
                    </button>
                  )}
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.1em] mb-6">Estimated Range: <span className="text-gray-700">{prod.priceRange}</span></div>

                <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-1 gap-2">
                  {(prod.collaterals || [{ label: "Brochure & specs", url: prod.url }]).map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center py-3 bg-gray-50 border border-gray-100 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                      <span>📄</span> {link.label} &rarr;
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {catalog.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-gray-100 italic text-gray-400">
              No products found in the catalog.
            </div>
          )}
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

              const usndVal = activeD.filter(d => getDealCategory(d) === "ultrasound").reduce((acc, d) => acc + parseValue(d.value), 0);
              const ccVal = activeD.filter(d => getDealCategory(d) === "criticalcare").reduce((acc, d) => acc + parseValue(d.value), 0);

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
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex justify-between">Active Pipeline <span>📊</span></div>
                    <div className="flex flex-col justify-end gap-1 mt-auto">
                      <div onClick={() => setDrilldownReport({ title: "Active Ultrasound Pipeline", data: activeD.filter(d => getDealCategory(d) === "ultrasound") })} className="flex justify-between items-center text-xs font-bold p-1.5 -mx-1.5 rounded-lg cursor-pointer hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors"><span className="text-indigo-600">Ultrasound</span> <span className="flex items-center gap-1">₹{usndVal}L <span className="text-[10px] text-gray-300">&rarr;</span></span></div>
                      <div onClick={() => setDrilldownReport({ title: "Active Critical Care Pipeline", data: activeD.filter(d => getDealCategory(d) === "criticalcare") })} className="flex justify-between items-center text-xs font-bold p-1.5 -mx-1.5 rounded-lg cursor-pointer hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"><span className="text-rose-600">C.Care</span> <span className="flex items-center gap-1">₹{ccVal}L <span className="text-[10px] text-gray-300">&rarr;</span></span></div>
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
                &larr; Back to Dashboard
              </button>

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
                    {selectedDeal.name.split('–')[0]} &rarr;
                  </div>
                  <h2 className="font-extrabold text-3xl text-gray-800 leading-tight uppercase tracking-tight flex items-center gap-3">
                    {selectedDeal.name.split('–')[1] || selectedDeal.name}
                    {selectedDeal.isPriority && <span className="text-amber-400 text-2xl">⭐</span>}
                  </h2>
                </div>
                <button
                  onClick={() => { setEditLeadData(selectedDeal); setIsEditingLead(true); }}
                  className="w-12 h-12 bg-white border-2 border-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50/50 transition-all font-bold text-xl shadow-sm"
                >
                  ✎
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50 shadow-inner">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 opacity-60">Stage</div>
                  <div className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{selectedDeal.stage}</div>
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


              <h3 className="mt-6 font-bold text-gray-800 border-b pb-1 mb-2 flex justify-between items-center">
                Key Contacts
                <button className="text-xs text-blue-600 font-semibold" onClick={() => {
                  setIsAddingStakeholder(true);
                }}>+ Add</button>
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
              <div className="flex items-center gap-2 text-xs font-bold opacity-80 uppercase tracking-widest">
                <span className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">📍 {selectedAccount.city}</span>
                <span className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">🌐 {selectedAccount.zone}</span>
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
                    <div key={d.id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex justify-between items-center cursor-pointer hover:border-blue-400 transition-all border-b-4" style={{ borderLeftWidth: '4px', borderLeftColor: d.isPriority ? '#fbbf24' : 'transparent' }} onClick={() => { setSelectedDeal(d); setSelectedAccount(null); }}>
                      <div>
                        <div className="text-sm font-black text-blue-900 leading-tight flex items-center gap-2">
                          {d.isPriority && <span className="text-amber-400">⭐</span>}
                          {d.name.split('–')[1] || d.name}
                        </div>
                        <div className="text-[9px] text-gray-400 font-black mt-1 uppercase tracking-wider flex items-center gap-2">
                          <span>{d.stage} · {d.owner}</span>
                          {d.state === "On Hold" && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[7px] font-black uppercase tracking-wider rounded-md">⏸ On Hold</span>}
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
                <button onClick={() => { setShowNewLead(false); setLeadWizardStep(1); setIsCreatingCustomer(false); }} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none">&times;</button>
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
                  <select className="w-full border border-gray-300 p-2 mb-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newCustomerSpecialty} onChange={(e) => setNewCustomerSpecialty(e.target.value)}>
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

                  <div className="flex gap-2">
                    <button onClick={() => setIsCreatingCustomer(false)} className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1150] p-4">
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
                        setContacts([...contacts, { id: Date.now(), accountId: selectedAccount ? selectedAccount.id : (selectedDeal ? customers.find(cust => selectedDeal.name.includes(cust.name))?.id : null), name: newStakeholderName, role: newStakeholderRole, phone: newStakeholderPhone, email: newStakeholderEmail, influenceLevel: "Medium" }]);
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

                  {stageChanged && (
                    <div className="col-span-2 mt-4 p-4 rounded-2xl border border-blue-100 bg-blue-50/30 space-y-4">
                      <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1">
                        <span>💬</span> Stage Transition Interaction
                      </div>

                      {/* Expected Closure Date for Negotiation */}
                      {editLeadData.stage === "Negotiation" && (
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Expected Closure Date *</label>
                          <input
                            type="date"
                            className="w-full bg-white border border-gray-100 p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            value={editLeadData.closureDate || ""}
                            onChange={(e) => setEditLeadData({ ...editLeadData, closureDate: e.target.value })}
                          />
                        </div>
                      )}

                      {/* Loss Fields for Lost */}
                      {editLeadData.stage === "Lost" && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Competitor Name *</label>
                            <input
                              type="text"
                              placeholder="e.g. Mindray, GE, Siemens..."
                              className="w-full bg-white border border-gray-100 p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              value={editLeadData.lostCompetitor || ""}
                              onChange={(e) => setEditLeadData({ ...editLeadData, lostCompetitor: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Loss Reason *</label>
                            <select
                              className="w-full bg-white border border-gray-100 p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              value={editLeadData.lostReason || "Price"}
                              onChange={(e) => setEditLeadData({ ...editLeadData, lostReason: e.target.value })}
                            >
                              <option>Price</option>
                              <option>Feature Missing</option>
                              <option>Relationship / Competitor Entrenched</option>
                              <option>Budget Cancelled</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Purpose Select for other stages */}
                      {editLeadData.stage !== "Negotiation" && editLeadData.stage !== "Lost" && (
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
                            <option>Feedback</option>
                          </select>
                        </div>
                      )}

                      {/* Notes text area */}
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                          {editLeadData.stage === "Lost" ? "Loss Details *" : editLeadData.stage === "Negotiation" ? "Negotiation Summary *" : "Interaction Notes *"}
                        </label>
                        <textarea
                          className="w-full bg-white border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                          placeholder={editLeadData.stage === "Lost" ? "Additional loss details..." : editLeadData.stage === "Negotiation" ? "Negotiation summary..." : "What did you discuss?"}
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

                    // 1. Contributor splits verification if stage is Order
                    if (editLeadData.stage === "Order") {
                      const contributors = editLeadData.contributors || [];
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

                    // 2. Stage change validations (inline fields)
                    const stageChanged = originalDeal && editLeadData.stage !== originalDeal.stage;
                    if (stageChanged) {
                      // Check for note
                      if (!editLeadData.activityInput || !editLeadData.activityInput.trim()) {
                        setCustomAlert({
                          title: "Notes Required",
                          message: editLeadData.stage === "Lost" ? "Please enter Loss Details." : editLeadData.stage === "Negotiation" ? "Please enter a Negotiation Summary." : "Please enter Interaction Notes.",
                          type: "warning"
                        });
                        return;
                      }

                      // Expected closure date validation
                      if (editLeadData.stage === "Negotiation" && !editLeadData.closureDate) {
                        setCustomAlert({
                          title: "Date Required",
                          message: "Please enter Expected Closure Date.",
                          type: "warning"
                        });
                        return;
                      }

                      // Competitor validation
                      if (editLeadData.stage === "Lost" && (!editLeadData.lostCompetitor || !editLeadData.lostCompetitor.trim())) {
                        setCustomAlert({
                          title: "Competitor Required",
                          message: "Please enter Competitor Name.",
                          type: "warning"
                        });
                        return;
                      }

                      // Follow-up Date validation if checked
                      if (editLeadData.isSchedulingFollowUp && !editLeadData.followUpDate) {
                        setCustomAlert({
                          title: "Date Required",
                          message: "Please set a Due Date for the follow-up task.",
                          type: "warning"
                        });
                        return;
                      }
                    }

                    // 3. Process activity logging if stage changed
                    if (stageChanged) {
                      const accountId = selectedAccount ? selectedAccount.id : (originalDeal ? customers.find(c => originalDeal.name.includes(c.name))?.id : null);
                      
                      let finalNotes = editLeadData.activityInput || "";
                      if (editLeadData.stage === "Negotiation" && editLeadData.closureDate) {
                        finalNotes = `Moved to Negotiation. Exp. Closure: ${editLeadData.closureDate}. ` + finalNotes;
                      } else if (editLeadData.stage === "Lost") {
                        finalNotes = `Deal Lost to ${editLeadData.lostCompetitor || "Competitor"} due to ${editLeadData.lostReason || "Price"}. ` + finalNotes;
                      }

                      const newActivity = {
                        id: Date.now(),
                        accountId: accountId,
                        dealId: editLeadData.id,
                        notes: finalNotes,
                        purpose: editLeadData.stage === "Negotiation" ? "Negotiation Meeting" : (editLeadData.stage === "Lost" ? "Loss Analysis" : (editLeadData.activityPurpose || "Deal Follow-up")),
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

                    if (stageChanged) {
                      if (editLeadData.stage === "Negotiation" && editLeadData.closureDate) {
                        savedDealData.expectedClosureDate = editLeadData.closureDate;
                      }
                      if (editLeadData.stage === "Lost") {
                        savedDealData.lostCompetitor = editLeadData.lostCompetitor;
                        savedDealData.lostReason = editLeadData.lostReason;
                      }
                    }

                    // Delete the UI state variables
                    delete savedDealData.activityInput;
                    delete savedDealData.activityPurpose;
                    delete savedDealData.closureDate;
                    delete savedDealData.lostCompetitor;
                    delete savedDealData.lostReason;
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
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Category</label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all"
                    >
                      <option>Ultrasound</option>
                      <option>Critical Care</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Price Range</label>
                    <input
                      type="text"
                      className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all"
                      placeholder="₹25L - ₹35L"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                    />
                  </div>
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
                    if (newProductName) {
                      const productData = {
                        id: editingProduct ? editingProduct.id : Date.now(),
                        name: newProductName,
                        category: newProductCategory,
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
                      setNewProductPrice("");
                      setNewProductCollaterals([]);
                    }
                  }}
                  disabled={!newProductName}
                  className={`flex-1 px-4 py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${newProductName ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-gray-300 cursor-not-allowed"}`}
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
                      <div key={deal.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
