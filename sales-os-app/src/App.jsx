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

const repData = {
  "You": { zone: "North Kerala", target: 100 },
  "Amit": { zone: "South Kerala", target: 150 },
  "Rahul": { zone: "Bangalore", target: 120 }
};

// 🔷 Demo dataset
const initialDeals = [
  // --- "You" (Salesperson 1) ---
  { id: 1, name: "Al Shifa Hospital – SonoScape S50", stage: "Qualified", value: "₹22L", probability: 30, owner: "You", risk: "Low", lastActivity: "Just now", timeline: [{ text: "Doctor interested in S50 Elite, requirement discussed" }] },
  { id: 2, name: "City Scan – SonoScape E2", stage: "Demo", value: "₹18L", probability: 50, owner: "You", risk: "Low", lastActivity: "Just now", timeline: [{ text: "Demo scheduled for E2 portable" }] },
  { id: 3, name: "Iqra SonoScape X3", stage: "Order", value: "₹30L", probability: 100, owner: "You", risk: "Low", lastActivity: "Just now", timeline: [{ text: "PO confirmed" }], isLastMonth: false },
  { id: 4, name: "MIMS Clinic - P40 Elite", stage: "Lead", value: "₹15L", probability: 10, owner: "You", risk: "Medium", riskReason: "Budget approval delayed by CFO.", lastActivity: "1d ago", timeline: [{ text: "Cold call, showed interest" }] },
  { id: 5, name: "Baby Memorial - Patient Monitor", stage: "Negotiation", value: "₹8L", probability: 70, owner: "You", risk: "High", riskReason: "Competitor heavily discounting.", lastActivity: "2h ago", timeline: [{ text: "Price negotiation round 1" }] },
  { id: 101, name: "Fathima Hospital - Defibrillator", stage: "Order", value: "₹10L", probability: 100, owner: "You", risk: "Low", lastActivity: "20d ago", timeline: [{ text: "Installed" }], isLastMonth: true },
  { id: 102, name: "Wayanad Medical - Patient Monitor", stage: "Lost", value: "₹5L", probability: 0, owner: "You", risk: "High", lastActivity: "15d ago", timeline: [{ text: "Budget constraints" }], isLastMonth: true },

  // --- "Amit" (Salesperson 2) ---
  { id: 6, name: "Aster Medcity – SonoScape S80", stage: "Demo", value: "₹28L", probability: 50, owner: "Amit", risk: "Low", lastActivity: "1d ago", timeline: [{ text: "Demo completed, awaiting feedback" }] },
  { id: 7, name: "Trivandrum Medical College – SonoScape HD-550", stage: "Qualified", value: "₹150L", probability: 30, owner: "Amit", risk: "High", riskReason: "Tender process highly competitive.", lastActivity: "2d ago", timeline: [{ text: "Met HOD, budget approved" }] },
  { id: 8, name: "Lakeshore Hospital - Patient Monitors", stage: "Lead", value: "₹12L", probability: 10, owner: "Amit", risk: "Low", lastActivity: "3d ago", timeline: [{ text: "Initial inquiry email" }] },
  { id: 9, name: "KIMS Trivandrum - Defibrillators", stage: "Order", value: "₹20L", probability: 100, owner: "Amit", risk: "Low", lastActivity: "4h ago", timeline: [{ text: "Advance payment received" }], isLastMonth: false },
  { id: 10, name: "SUT Hospital - ECG Machines", stage: "Negotiation", value: "₹5L", probability: 70, owner: "Amit", risk: "Medium", riskReason: "Customer requested extended warranty.", lastActivity: "Just now", timeline: [{ text: "Waiting for final sign-off" }] },
  { id: 103, name: "Amrita Hospital Kochi - SonoScape S22", stage: "Order", value: "₹25L", probability: 100, owner: "Amit", risk: "Low", lastActivity: "18d ago", timeline: [{ text: "Delivered" }], isLastMonth: true },

  // --- "Rahul" (Salesperson 3 - Bangalore Region) ---
  { id: 11, name: "Apollo Hospitals – SonoScape P60", stage: "Negotiation", value: "₹25L", probability: 70, owner: "Rahul", risk: "Medium", riskReason: "Decision maker out of office for 2 weeks.", lastActivity: "2d ago", timeline: [{ text: "Commercial discussion ongoing" }] },
  { id: 12, name: "NIMHANS - MRI Setup", stage: "Lead", value: "₹200L", probability: 10, owner: "Rahul", risk: "High", riskReason: "Technical specs need customization.", lastActivity: "4d ago", timeline: [{ text: "RFP received" }] },
  { id: 13, name: "Manipal Hospital - Portable X-Ray", stage: "Demo", value: "₹10L", probability: 50, owner: "Rahul", risk: "Low", lastActivity: "1h ago", timeline: [{ text: "Scheduled demo" }] },
  { id: 14, name: "Aster CMI - Hematology Analyzer", stage: "Order", value: "₹9L", probability: 100, owner: "Rahul", risk: "Low", lastActivity: "1d ago", timeline: [{ text: "Installation completed" }], isLastMonth: false },
  { id: 15, name: "Fortis Hospital - SonoScape HD-500", stage: "Qualified", value: "₹45L", probability: 30, owner: "Rahul", risk: "Low", lastActivity: "Just now", timeline: [{ text: "Technical presentation delivered" }] },
  { id: 104, name: "Sakra World - Ventilators", stage: "Lost", value: "₹40L", probability: 0, owner: "Rahul", risk: "High", lastActivity: "12d ago", timeline: [{ text: "Lost to competitor" }], isLastMonth: true }
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
  { id: 1, name: "SonoScape S50 Elite", category: "Ultrasound", priceRange: "₹25L - ₹35L", url: "https://www.sonoscapeindia.in/productdetails-5-discover-and-embrace-elite" },
  { id: 2, name: "SonoScape X3", category: "Ultrasound", priceRange: "₹12L - ₹18L", url: "https://www.sonoscapeindia.in/productdetails-25-small-size-smart-sight" },
  { id: 3, name: "SonoScape HD-550", category: "Ultrasound", priceRange: "₹45L - ₹75L", url: "https://www.sonoscapeindia.in/productdetails-10-full-hd-video-endoscopy-system" },
  { id: 4, name: "SonoScape E2", category: "Ultrasound", priceRange: "₹8L - ₹12L", url: "https://www.sonoscapeindia.in/productdetails-58-sonoscape-e2-compact-color-doppler-ultrasound-system" },
  { id: 5, name: "SonoScape P60 Exp", category: "Ultrasound", priceRange: "₹40L - ₹55L", url: "https://www.sonoscapeindia.in/productdetails-3-intelligent-future-attainable" },

  // --- Ventilator (Magnamed) ---
  { id: 6, name: "Magnamed Fleximag Max", category: "Ventilator", priceRange: "₹18L - ₹28L", url: "https://www.inovacoesmagnamed.com.br/fleximagmaxen" },
  { id: 7, name: "Magnamed OxyMag", category: "Ventilator", priceRange: "₹8L - ₹15L", url: "https://www.inovacoesmagnamed.com.br/oxymag-en" },

  // --- Critical Care (EDAN / Magnamed) ---
  { id: 8, name: "EDAN i15 Blood Gas", category: "Critical Care", priceRange: "₹5L - ₹8L", url: "https://www.edan.com/product/e/i15_Blood_Gas_and_Chemistry_Analysis_System.html" },
  { id: 9, name: "EDAN elite V Series", category: "Critical Care", priceRange: "₹12L - ₹22L", url: "https://www.edan.com/product/i/PM_elite_V_Series.html" },
  { id: 10, name: "Magnamed Ventmeter", category: "Critical Care", priceRange: "₹4L - ₹6L", url: "https://www.inovacoesmagnamed.com.br/ventmeter-en" }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState("Manager");
  const [managerFilter, setManagerFilter] = useState("All");
  const [view, setView] = useState("pipeline");
  const [metricFilter, setMetricFilter] = useState(null);

  // Persistent States
  const [deals, setDeals] = useState(() => {
    const saved = localStorage.getItem("sales_os_deals");
    // Force reset if stale data includes competitor products
    if (saved && saved.includes("Mindray")) {
      localStorage.removeItem("sales_os_deals");
      return initialDeals;
    }
    return saved ? JSON.parse(saved) : initialDeals;
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem("sales_os_customers");
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  useEffect(() => {
    localStorage.setItem("sales_os_deals", JSON.stringify(deals));
  }, [deals]);

  useEffect(() => {
    localStorage.setItem("sales_os_customers", JSON.stringify(customers));
  }, [customers]);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const [showActivity, setShowActivity] = useState(false);
  const [activityInput, setActivityInput] = useState("");
  const [pendingStage, setPendingStage] = useState(null);

  const [showNewLead, setShowNewLead] = useState(false);
  const [leadWizardStep, setLeadWizardStep] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerZone, setNewCustomerZone] = useState("North Kerala");
  const [newCustomerCity, setNewCustomerCity] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadValue, setLeadValue] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [customerZoneFilter, setCustomerZoneFilter] = useState("All Zones");
  const [selectedAccount, setSelectedAccount] = useState(null); // For 360 view
  const [newStakeholderName, setNewStakeholderName] = useState("");
  const [newStakeholderRole, setNewStakeholderRole] = useState("");

  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState("All");
  const [wizardCategoryFilter, setWizardCategoryFilter] = useState("Ultrasound");
  const [isAddingStakeholder, setIsAddingStakeholder] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState(null);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editLeadData, setEditLeadData] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Ultrasound");
  const [newProductUrl, setNewProductUrl] = useState("");

  const [catalog, setCatalog] = useState(() => {
    const saved = localStorage.getItem("sales_os_catalog");
    // Force reset if stale data includes competitor products or missing categories
    if (saved && (saved.includes("Mindray") || saved.includes("General Imaging") || saved.includes("productdetails-56"))) {
      localStorage.removeItem("sales_os_catalog");
      return initialCatalog;
    }
    return saved ? JSON.parse(saved) : initialCatalog;
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

  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem("sales_os_activities");
    if (saved) return JSON.parse(saved);

    // Legacy migration: Pull timeline from initialDeals if no activities exist
    const initialActivities = [];
    initialDeals.forEach(deal => {
      deal.timeline.forEach((t, index) => {
        initialActivities.push({
          id: `${deal.id}-${index}`,
          accountId: initialCustomers.find(c => deal.name.includes(c.name))?.id || 1,
          dealId: deal.id,
          type: t.text.includes("Manager") ? "manager_note" : "interaction",
          notes: t.text,
          date: deal.lastActivity,
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

  const updateDeal = (id, updates) => {
    setDeals(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
  };

  const changeStage = (deal, newStage) => {
    setSelectedDeal(deal);
    setPendingStage(newStage);
    setShowActivity(true);
  };

  const addActivity = () => {
    if (!activityInput.trim()) return;

    const accountId = selectedAccount ? selectedAccount.id : (selectedDeal ? customers.find(c => selectedDeal.name.includes(c.name))?.id : null);

    const newActivity = {
      id: Date.now(),
      accountId: accountId,
      dealId: selectedDeal?.id || null,
      type: "interaction",
      notes: (currentUser === "Manager" ? "👑 Manager Note: " : "") + activityInput,
      date: "Just now",
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
        owner: currentUser
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
      updateDeal(selectedDeal.id, updates);
      setSelectedDeal({ ...selectedDeal, ...updates });
    }

    setActivityInput("");
    setPendingStage(null);
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
      notes: `🚨 [AUDIT] ${message}`,
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
      city: newCustomerCity
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

    const newDeal = {
      id: Date.now(),
      name: `${customer.name} – ${leadName || "General Equipment"}`,
      stage: "Lead",
      value: leadValue ? `₹${leadValue}L` : "₹0L",
      probability: 10,
      owner: currentUser === "Manager" ? "You" : currentUser,
      risk: "Low",
      lastActivity: "Just now",
      timeline: [],
      productIds: selectedProducts // Store associated machines
    };

    setDeals(prev => [newDeal, ...prev]);

    // Reset wizard
    setLeadName("");
    setLeadValue("");
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
      ? (repData[managerFilter.split(":")[1]]?.target || 0)
      : managerFilter.startsWith("Zone:")
        ? Object.values(repData).filter(r => r.zone === managerFilter.split(":")[1]).reduce((sum, r) => sum + r.target, 0)
        : Object.values(repData).reduce((sum, r) => sum + r.target, 0))
    : (repData[currentUser]?.target || 0);

  const activePipelineDeals = dashboardDealsRibbon.filter(d => d.stage !== "Order" && d.stage !== "Lost");

  const ordersDeals = dashboardDealsRibbon.filter(d => d.stage === "Order");
  const bookedRevenue = ordersDeals.reduce((sum, deal) => sum + parseValue(deal.value), 0);
  const attainment = targetQuota > 0 ? Math.round((bookedRevenue / targetQuota) * 100) : 0;

  const lastMonthWonDeals = ordersDeals.filter(d => d.isLastMonth);
  const lastMonthWonValue = lastMonthWonDeals.reduce((sum, deal) => sum + parseValue(deal.value), 0);

  const hotLeals = activePipelineDeals.filter(d => d.probability >= 70);
  const hotLealsValue = hotLeals.reduce((sum, deal) => sum + parseValue(deal.value), 0);

  const lostDeals = dashboardDealsRibbon.filter(d => d.stage === "Lost");
  const lostDealsValue = lostDeals.reduce((sum, deal) => sum + parseValue(deal.value), 0);

  const matchesMetricFilter = (deal) => {
    if (!metricFilter) return true;
    if (metricFilter === "orders") return deal.stage === "Order";
    if (metricFilter === "hot") return deal.probability >= 70 && deal.stage !== "Order" && deal.stage !== "Lost";
    if (metricFilter === "won") return deal.stage === "Order" && deal.isLastMonth;
    if (metricFilter === "lost") return deal.stage === "Lost";
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
                { id: "reminders", label: "Next Actions", icon: "✅" },
                { id: "manager", label: "Deals List", icon: "📋" },
                { id: "customers", label: "Customer Directory", icon: "🏥" },
                { id: "catalog", label: "Product Catalog", icon: "📦" },
                { id: "insights", label: "Insights", icon: "💡" }
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
                <option value="You">👤 You (Sales)</option>
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
            <span className="hidden sm:inline">Lead</span>
          </button>
        </div>
      </div>

      {/* Dashboard Metrics (Manager & Rep) */}
      {!selectedDeal && (view === "pipeline" || view === "manager") && (
        <div className="bg-white border-b px-2 sm:px-4 py-2 sm:py-3 shadow-sm z-10 relative grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4">
          <div onClick={() => setMetricFilter(metricFilter === "orders" ? null : "orders")} className={`p-2 sm:p-3 rounded-lg sm:flex-1 shadow-sm cursor-pointer transition-all ${metricFilter === "orders" ? "bg-blue-100 border-2 border-blue-500 ring-2 ring-blue-300" : "bg-blue-50 border border-blue-200 hover:shadow-md"}`}>
            <div className="text-[10px] sm:text-xs text-blue-700 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Target vs Actual</div>
            <div className="text-lg sm:text-2xl font-extrabold text-blue-900">
              ₹{bookedRevenue.toFixed(1).replace(/\.0$/, '')}L <span className="text-[10px] sm:text-sm text-blue-600 font-semibold">/ ₹{targetQuota}L</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-1 sm:h-1.5 mt-1 sm:mt-2">
              <div className="bg-blue-600 h-1 sm:h-1.5 rounded-full whitespace-nowrap" style={{ width: `${Math.min(100, attainment)}%` }}></div>
            </div>
          </div>
          <div onClick={() => setMetricFilter(metricFilter === "hot" ? null : "hot")} className={`p-2 sm:p-3 rounded-lg sm:flex-1 shadow-sm cursor-pointer transition-all ${metricFilter === "hot" ? "bg-orange-100 border-2 border-orange-500 ring-2 ring-orange-300" : "bg-orange-50 border border-orange-200 hover:shadow-md"}`}>
            <div className="text-[10px] sm:text-xs text-orange-700 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Hot Leads (≥70%)</div>
            <div className="text-lg sm:text-2xl font-extrabold text-orange-900">₹{hotLealsValue.toFixed(1).replace(/\.0$/, '')}L</div>
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
                  {visibleDeals.filter(d => d.stage === stage).map(deal => {
                    const isMatch = matchesMetricFilter(deal);
                    return (
                      <div
                        key={deal.id}
                        className={`p-3 rounded-xl shadow mb-3 cursor-pointer transition-all duration-300 border-l-4 ${metricFilter && isMatch ? 'ring-2 ring-blue-400 shadow-lg scale-[1.02]' : metricFilter && !isMatch ? 'opacity-30' : ''}`}
                        style={{
                          backgroundColor: 'white',
                          borderLeftColor: deal.risk === 'High' ? '#ef4444' : deal.risk === 'Medium' ? '#eab308' : '#22c55e'
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
                        </div>
                        <div className="text-sm">{deal.value}</div>
                        <div className="text-sm">🎯 {deal.probability}%</div>
                        <div className="text-xs text-gray-500">{deal.lastActivity}</div>
                        <div className="text-xs">Owner: {deal.owner}</div>
                        <div className="text-xs">Risk: {deal.risk}</div>

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
                    <option value="Rep:You">Rep: You</option>
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
                .filter(d => {
                  if (!metricFilter) return true;
                  if (metricFilter === "orders") return d.stage === "Order";
                  if (metricFilter === "hot") return d.probability >= 70 && d.stage !== "Order" && d.stage !== "Lost";
                  if (metricFilter === "won") return d.stage === "Order" && d.isLastMonth;
                  if (metricFilter === "lost") return d.stage === "Lost";
                  return true;
                })
                .sort((a, b) => {
                  const riskScore = { "High": 3, "Medium": 2, "Low": 1 };
                  return (riskScore[b.risk] || 0) - (riskScore[a.risk] || 0);
                })
                .map(deal => (
                  <div
                    key={deal.id}
                    className="bg-white p-3 mb-2 rounded shadow border-l-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ borderLeftColor: deal.risk === 'High' ? '#ef4444' : deal.risk === 'Medium' ? '#eab308' : '#22c55e' }}
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
                    <div className="text-sm text-gray-600 mt-1">Stage: {deal.stage} &nbsp;|&nbsp; Owner: <strong>{deal.owner}</strong></div>
                    <div className="text-sm text-gray-500 mt-1">🎯 {deal.probability}% &nbsp;|&nbsp; Risk: <span className={`font-semibold ${deal.risk === 'High' ? 'text-red-500' : deal.risk === 'Medium' ? 'text-yellow-500' : 'text-green-600'}`}>{deal.risk}</span> &nbsp;|&nbsp; Last Act: {deal.lastActivity}</div>
                    {(deal.risk === "High" || deal.risk === "Medium") && deal.riskReason && (
                      <div className="mt-2 p-2 bg-gray-50 border rounded text-xs text-gray-700 italic border-l-2 border-l-gray-400">
                        <strong>Decision Context: </strong>{deal.riskReason}
                      </div>
                    )}
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
                        <div key={r.id} className={`bg-white p-5 rounded-[32px] border-2 shadow-sm transition-all hover:shadow-md ${isOverdue ? 'border-red-100' : 'border-white'}`}>
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
            </div>

            <div className="space-y-3">
              {customers
                .filter(acc =>
                  (customerZoneFilter === "All Zones" || acc.zone === customerZoneFilter) &&
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
            <button
              onClick={() => setIsAddingProduct(true)}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="text-lg">＋</span>
              Machine
            </button>
          </div>

          <div className="mb-8">
            <select
              className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-widest text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              value={catalogCategoryFilter}
              onChange={(e) => setCatalogCategoryFilter(e.target.value)}
            >
              <option>All</option>
              <option>Ultrasound</option>
              <option>Ventilator</option>
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
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.1em] mb-6">Estimated Range: <span className="text-gray-700">{prod.priceRange}</span></div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                  <a
                    href={prod.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-4 bg-gray-50 border-2 border-gray-100 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                  >
                    View Brochure & Images &rarr;
                  </a>
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

      {/* Insights Placeholder */}
      {view === "insights" && (
        <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-[32px] flex items-center justify-center text-4xl mb-6 shadow-xl shadow-orange-900/10">
            💡
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Sales Intelligence & Insights</h2>
          <p className="text-gray-500 font-medium max-w-sm mt-3">This space will serve as the wisdom hub for the Cabio team. Stay tuned for:</p>
          <div className="mt-6 space-y-3 text-left max-w-xs mx-auto">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-700 flex items-start gap-3">
              <span className="text-xl">🏆</span>
              <div>
                <div className="text-xs uppercase text-orange-600 font-black mb-1">Success Stories</div>
                <div className="text-sm">How we closed the Al Shifa S50 Elite deal.</div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-700 flex items-start gap-3">
              <span className="text-xl">🛡️</span>
              <div>
                <div className="text-xs uppercase text-orange-600 font-black mb-1">Failure Learnings</div>
                <div className="text-sm">Countering competitor discounts in North Kerala.</div>
              </div>
            </div>
          </div>
          <button onClick={() => setView("pipeline")} className="mt-10 px-8 py-3 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-200">
            Back to Dashboard
          </button>
        </div>
      )
      }

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
                  <h2 className="font-extrabold text-3xl text-gray-800 leading-tight uppercase tracking-tight">
                    {selectedDeal.name.split('–')[1] || selectedDeal.name}
                  </h2>
                </div>
                <button
                  onClick={() => { setEditLeadData(selectedDeal); setIsEditingLead(true); }}
                  className="w-12 h-12 bg-white border-2 border-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50/50 transition-all font-bold text-xl shadow-sm"
                >
                  ✎
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50 shadow-inner">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 opacity-60">Stage</div>
                  <div className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{selectedDeal.stage}</div>
                </div>
                <div className="bg-blue-50/30 p-4 rounded-3xl border border-blue-50 shadow-inner">
                  <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 opacity-70">Probability</div>
                  <div className="text-[13px] font-black text-blue-600">{selectedDeal.probability}%</div>
                </div>
                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50 shadow-inner">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 opacity-60">Risk</div>
                  <div className={`text-[11px] font-black uppercase tracking-tight ${selectedDeal.risk === 'High' ? 'text-red-500' : selectedDeal.risk === 'Medium' ? 'text-orange-500' : 'text-green-500'}`}>{selectedDeal.risk}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-[32px] border border-blue-100 flex items-center justify-between shadow-sm mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 text-2xl shadow-md border border-blue-50">👤</div>
                  <div>
                    <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Assigned Owner</div>
                    <div className="text-base font-black text-indigo-900 uppercase">{selectedDeal.owner}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Estimated Value</div>
                  <div className="text-2xl font-black text-indigo-900 tracking-tighter">₹{selectedDeal.value}</div>
                </div>
              </div>

              {(selectedDeal.risk === 'High' || selectedDeal.risk === 'Medium') && (selectedDeal.riskReason || selectedDeal.decisionContext) && (
                <div className="mb-10 p-5 bg-red-50/50 border-2 border-red-100 text-red-800 rounded-[28px] text-[13px] flex gap-3 shadow-inner">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <span className="font-black uppercase text-[10px] block mb-1 tracking-widest opacity-70">Strategic Risk Alert</span>
                    {selectedDeal.riskReason || selectedDeal.decisionContext}
                  </div>
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
                  {reminders.filter(r => r.dealId === selectedDeal.id && r.status === "pending").map(r => (
                    <div key={r.id} className="bg-white p-4 rounded-2xl border border-indigo-50 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="text-sm font-black text-gray-800 leading-tight">{r.text}</div>
                        <div className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{r.dueDate}</div>
                      </div>
                      <button
                        onClick={() => completeReminder(r)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-900/10 flex items-center justify-center gap-2"
                      >
                        ✓ Mark Goal as Reached
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowActivity(true)}
                className="w-full bg-indigo-600 text-white py-4.5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/10 mb-8 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-indigo-800"
              >
                <span>➕</span> {currentUser === "Manager" ? "Add Manager Note" : "Add Interaction"}
              </button>


              <h3 className="mt-6 font-bold text-gray-800 border-b pb-1 mb-2 flex justify-between items-center">
                Key Contacts
                <button className="text-xs text-blue-600 font-semibold" onClick={() => {
                  const name = prompt("Contact Name:");
                  const role = prompt("Role:");
                  if (name) {
                    const accId = customers.find(c => selectedDeal.name.includes(c.name))?.id;
                    setContacts([...contacts, { id: Date.now(), accountId: accId, name, role, influenceLevel: "Medium" }]);
                  }
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
              {activities.filter(a => a.dealId === selectedDeal.id).map((a, i) => (
                <div key={i} className={`p-2 my-2 rounded text-sm shadow-sm ${a.notes.includes("Manager Note") ? "bg-indigo-50 border border-indigo-200 text-indigo-900" : "bg-gray-50 border border-gray-200 text-gray-800"}`}>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                    <span>{a.owner} · {a.type}</span>
                    <span>{a.date}</span>
                  </div>
                  {a.notes}
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* Account Detail (Customer 360) */}
      {
        selectedAccount && (
          <div className="fixed inset-0 bg-white overflow-y-auto z-[1000]">
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 pb-10 rounded-b-[40px] shadow-2xl relative border-b-4 border-blue-400">
              <button
                onClick={() => setSelectedAccount(null)}
                className="mb-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 w-fit transition-all uppercase tracking-wider border border-white/30"
              >
                &larr; Back
              </button>

              <div className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-1">Customer 360 Profile</div>
              <h2 className="font-bold text-3xl leading-tight mb-2 uppercase tracking-tight">{selectedAccount.name}</h2>
              <div className="flex items-center gap-2 text-xs font-bold opacity-80 uppercase tracking-widest">
                <span className="bg-white/10 px-2 py-1.5 rounded-lg border border-white/10">📍 {selectedAccount.city}</span>
                <span className="bg-white/10 px-2 py-1.5 rounded-lg border border-white/10">🌐 {selectedAccount.zone}</span>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setShowActivity(true)}
                  className="flex-1 bg-white text-blue-900 px-4 py-4 rounded-2xl font-black shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-gray-200"
                >
                  <span className="text-xl">💬</span> + Interaction
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomerId(selectedAccount.id);
                    setCustomerSearch(selectedAccount.name);
                    setLeadWizardStep(2);
                    setShowNewLead(true);
                  }}
                  className="flex-1 bg-blue-500 text-white px-4 py-4 rounded-2xl font-black shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-blue-700"
                >
                  <span className="text-xl">🚀</span> + Lead
                </button>
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
                        <button
                          onClick={() => { setEditingStakeholder(c); setIsAddingStakeholder(true); setNewStakeholderName(c.name); setNewStakeholderRole(c.role); }}
                          className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all font-bold text-[10px]"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => {
                            const isUsed = activities.some(a => a.notes.includes(c.name));
                            if (currentUser !== "Manager") {
                              alert("⚠️ Admin Access Required: Only Managers can delete stakeholders.");
                              return;
                            }
                            if (isUsed) {
                              alert(`🛑 Cannot Delete: ${c.name} is currently linked to active leads or interaction history. Try updating their details instead.`);
                              return;
                            }
                            if (window.confirm(`Are you sure you want to remove ${c.name}? This action will be logged in the audit trail.`)) {
                              logAuditActivity(selectedAccount.id, null, `Stakeholder Removed: ${c.name} (${c.role})`);
                              setContacts(prev => prev.filter(con => con.id !== c.id));
                            }
                          }}
                          className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all font-bold text-[10px] ${currentUser !== "Manager" ? "opacity-30 cursor-not-allowed" : ""}`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  {contacts.filter(c => c.accountId === selectedAccount.id).length === 0 && <div className="text-gray-400 text-xs italic py-4 text-center">No stakeholders listed.</div>}
                </div>
              </section>

              <section className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner">
                <h3 className="font-black text-gray-800 mb-4 text-sm uppercase tracking-wider flex justify-between items-center">
                  Reminders & Follow-ups
                  <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-200 font-black uppercase tracking-widest">Next Steps</span>
                </h3>
                <div className="space-y-3">
                  {reminders.filter(r => r.accountId === selectedAccount.id && r.status === "pending").map(r => (
                    <div key={r.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs font-black text-gray-800 leading-tight">{r.text}</div>
                        <div className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-2">{r.dueDate}</div>
                      </div>
                      <button
                        onClick={() => completeReminder(r)}
                        className="w-full mt-2 py-2 bg-indigo-50 hover:bg-green-600 text-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-100 hover:border-green-600"
                      >
                        ✓ Complete Task
                      </button>
                    </div>
                  ))}
                  {reminders.filter(r => r.accountId === selectedAccount.id && r.status === "pending").length === 0 && (
                    <div className="text-gray-400 text-xs italic py-4 text-center bg-white rounded-2xl border border-dashed border-gray-200">No pending follow-ups.</div>
                  )}
                </div>
              </section>

              <section className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner">
                <h3 className="font-black text-gray-800 mb-4 text-sm uppercase tracking-wider italic opacity-60">Deal History</h3>
                <div className="space-y-3">
                  {deals.filter(d => d.name.includes(selectedAccount.name)).map(d => (
                    <div key={d.id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex justify-between items-center cursor-pointer hover:border-blue-400 transition-all border-b-4" onClick={() => { setSelectedDeal(d); setSelectedAccount(null); }}>
                      <div>
                        <div className="text-sm font-black text-blue-900 leading-tight">{d.name.split('–')[1] || d.name}</div>
                        <div className="text-[9px] text-gray-400 font-black mt-1 uppercase tracking-wider">{d.stage} · {d.owner}</div>
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
                {activities.filter(a => a.accountId === selectedAccount.id).map((a, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[54px] top-6 w-6 h-6 rounded-xl rotate-45 border-4 border-white shadow-md z-10 transition-transform hover:scale-110 ${a.type === 'audit' ? "bg-red-500" : (a.dealId ? "bg-blue-500" : "bg-indigo-500")}`}></div>
                    <div className={`p-6 rounded-[32px] shadow-sm border-2 transition-all hover:shadow-md ${a.type === 'audit' ? "bg-red-50/30 border-red-100" : (a.dealId ? "bg-white border-blue-50 shadow-blue-900/5" : "bg-indigo-50/50 border-indigo-100 shadow-indigo-900/5")}`}>
                      <div className="flex justify-between items-start mb-3 text-[10px] font-black uppercase tracking-widest">
                        <span className={a.type === 'audit' ? "text-red-600" : (a.dealId ? "text-blue-500" : "text-indigo-600")}>
                          {a.owner} · {a.type === 'audit' ? "SYSTEM AUDIT" : (a.dealId ? (deals.find(d => d.id === a.dealId)?.name.split('–')[1] || "DEAL") : "MARKETING VISIT")}
                        </span>
                        <span className="text-gray-400 font-bold">{a.date}</span>
                      </div>
                      <div className={`text-[13px] leading-relaxed font-bold ${a.type === 'audit' ? "text-red-900 italic font-black" : "text-gray-800"}`}>{a.notes}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )
      }

      {/* Activity Modal */}
      {
        showActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100]">
            <div className="bg-white p-6 rounded-2xl w-[320px] shadow-2xl transition-all scale-100">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-gray-800 text-sm uppercase">Add Interaction</h3>
                <button onClick={() => setShowActivity(false)} className="text-gray-400 hover:text-gray-800 font-bold text-lg">&times;</button>
              </div>
              <textarea
                className="w-full border border-gray-200 p-3 mb-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[100px]"
                value={activityInput}
                onChange={(e) => setActivityInput(e.target.value)}
                placeholder="What did you discuss? (e.g. Discussed demo with HOD)"
                autoFocus
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
                  <input className="w-full border border-gray-300 p-2 mb-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newCustomerCity} onChange={(e) => setNewCustomerCity(e.target.value)} placeholder="E.g. Kochi" />

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
                        setContacts(prev => prev.map(con => con.id === editingStakeholder.id ? { ...con, name: newStakeholderName, role: newStakeholderRole } : con));
                      } else {
                        setContacts([...contacts, { id: Date.now(), accountId: selectedAccount ? selectedAccount.id : (selectedDeal ? customers.find(cust => selectedDeal.name.includes(cust.name))?.id : null), name: newStakeholderName, role: newStakeholderRole, influenceLevel: "Medium" }]);
                      }
                      setNewStakeholderName("");
                      setNewStakeholderRole("");
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
      {isEditingLead && editLeadData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1200] p-4">
          <div className="bg-white p-6 rounded-[32px] w-full max-w-[360px] shadow-2xl">
            <h3 className="font-black text-gray-800 text-xl mb-6 tracking-tight uppercase">Edit Lead Details</h3>
            <div className="space-y-4">
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
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Risk</label>
                  <select
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={editLeadData.risk}
                    onChange={(e) => setEditLeadData({ ...editLeadData, risk: e.target.value })}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Current Stage</label>
                <select
                  className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={editLeadData.stage}
                  onChange={(e) => setEditLeadData({ ...editLeadData, stage: e.target.value, probability: stageProbability[e.target.value] })}
                >
                  {stages.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => { setIsEditingLead(false); setEditLeadData(null); }}
                className="flex-1 px-4 py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeals(prev => prev.map(d => d.id === editLeadData.id ? editLeadData : d));
                  setSelectedDeal(editLeadData);
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

      {/* Add Product Modal */}
      {
        isAddingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
            <div className="bg-white p-6 rounded-3xl w-full max-w-[400px] shadow-2xl">
              <h3 className="font-extrabold text-gray-800 text-xl mb-6 tracking-tight">Add New Machine</h3>

              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Machine Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all placeholder:font-medium"
                    placeholder="E.g. SonoScape S50 Elite"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Category</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all"
                  >
                    <option>Ultrasound</option>
                    <option>Ventilator</option>
                    <option>Critical Care</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Official Brochure URL (Collateral)</label>
                  <input
                    type="url"
                    className="w-full border border-gray-100 p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 transition-all"
                    placeholder="https://www.manufacturer.com/..."
                    value={newProductUrl}
                    onChange={(e) => setNewProductUrl(e.target.value)}
                  />
                  <p className="text-[9px] text-gray-400 mt-2 italic font-medium px-1 leading-relaxed">Best practice: Use the official website link to ensure the latest documentation and reduce app size.</p>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setIsAddingProduct(false)}
                  className="flex-1 px-4 py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newProductName) {
                      const newProd = {
                        id: Date.now(),
                        name: newProductName,
                        category: newProductCategory,
                        priceRange: "TBD",
                        url: newProductUrl || "#"
                      };
                      setCatalog([...catalog, newProd]);
                      setNewProductName("");
                      setNewProductUrl("");
                      setIsAddingProduct(false);
                    }
                  }}
                  disabled={!newProductName}
                  className={`flex-1 px-4 py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${newProductName ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-gray-300 cursor-not-allowed"}`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}
