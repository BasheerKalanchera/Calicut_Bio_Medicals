import React, { useState } from "react";

const stages = ["Lead", "Qualified", "Demo", "Negotiation", "Order"];

const stageProbability = {
  Lead: 10,
  Qualified: 30,
  Demo: 50,
  Negotiation: 70,
  Order: 100
};

// 🔷 Demo dataset
const initialDeals = [
  // --- "You" (Salesperson 1) ---
  { id: 1, name: "Al Shifa Hospital – Ultrasound", stage: "Qualified", value: "₹22L", probability: 30, owner: "You", risk: "Low", lastActivity: "Just now", timeline: [{ text: "Doctor interested, requirement discussed" }] },
  { id: 2, name: "City Scan – Doppler", stage: "Demo", value: "₹18L", probability: 50, owner: "You", risk: "Low", lastActivity: "Just now", timeline: [{ text: "Demo scheduled" }] },
  { id: 3, name: "Iqra UST m/c", stage: "Order", value: "₹30L", probability: 100, owner: "You", risk: "Low", lastActivity: "Just now", timeline: [{ text: "PO confirmed" }] },
  { id: 4, name: "MIMS Clinic - C-Arm", stage: "Lead", value: "₹15L", probability: 10, owner: "You", risk: "Medium", riskReason: "Budget approval delayed by CFO.", lastActivity: "1d ago", timeline: [{ text: "Cold call, showed interest" }] },
  { id: 5, name: "Baby Memorial - Ventilator", stage: "Negotiation", value: "₹8L", probability: 70, owner: "You", risk: "High", riskReason: "Competitor GE Healthcare heavily discounting.", lastActivity: "2h ago", timeline: [{ text: "Price negotiation round 1" }] },

  // --- "Amit" (Salesperson 2) ---
  { id: 6, name: "City Clinic – X-Ray", stage: "Demo", value: "₹8L", probability: 50, owner: "Amit", risk: "Low", lastActivity: "1d ago", timeline: [{ text: "Demo completed, awaiting feedback" }] },
  { id: 7, name: "Medical College – CT Scanner", stage: "Qualified", value: "₹150L", probability: 30, owner: "Amit", risk: "High", riskReason: "Tender process highly competitive; L1 pricing tight.", lastActivity: "2d ago", timeline: [{ text: "Met HOD, budget approved" }] },
  { id: 8, name: "St. Joseph - Patient Monitors", stage: "Lead", value: "₹12L", probability: 10, owner: "Amit", risk: "Low", lastActivity: "3d ago", timeline: [{ text: "Initial inquiry email" }] },
  { id: 9, name: "Aster MIMS - Defibrillators", stage: "Order", value: "₹20L", probability: 100, owner: "Amit", risk: "Low", lastActivity: "4h ago", timeline: [{ text: "Advance payment received" }] },
  { id: 10, name: "Nirmala Hospital - ECG Machines", stage: "Negotiation", value: "₹5L", probability: 70, owner: "Amit", risk: "Medium", riskReason: "Customer requested extended warranty.", lastActivity: "Just now", timeline: [{ text: "Waiting for final sign-off" }] },

  // --- "Rahul" (Salesperson 3 - Bangalore Region) ---
  { id: 11, name: "Apollo Hospitals – Ultrasound", stage: "Negotiation", value: "₹25L", probability: 70, owner: "Rahul", risk: "Medium", riskReason: "Decision maker out of office for 2 weeks.", lastActivity: "2d ago", timeline: [{ text: "Commercial discussion ongoing" }] },
  { id: 12, name: "NIMHANS - MRI Setup", stage: "Lead", value: "₹200L", probability: 10, owner: "Rahul", risk: "High", riskReason: "Technical specs need customization beyond standard offering.", lastActivity: "4d ago", timeline: [{ text: "RFP received" }] },
  { id: 13, name: "Manipal Hospital - Portable X-Ray", stage: "Demo", value: "₹10L", probability: 50, owner: "Rahul", risk: "Low", lastActivity: "1h ago", timeline: [{ text: "Scheduled demo for next Monday" }] },
  { id: 14, name: "Aster CMI - Hematology Analyzer", stage: "Order", value: "₹9L", probability: 100, owner: "Rahul", risk: "Low", lastActivity: "1d ago", timeline: [{ text: "Installation completed" }] },
  { id: 15, name: "Fortis Hospital - Endoscopy System", stage: "Qualified", value: "₹45L", probability: 30, owner: "Rahul", risk: "Low", lastActivity: "Just now", timeline: [{ text: "Technical presentation delivered" }] },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState("Manager");
  const [managerFilter, setManagerFilter] = useState("All");
  const [view, setView] = useState("pipeline");
  const [deals, setDeals] = useState(initialDeals);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const [showActivity, setShowActivity] = useState(false);
  const [activityInput, setActivityInput] = useState("");
  const [pendingStage, setPendingStage] = useState(null);

  const [showNewLead, setShowNewLead] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadValue, setLeadValue] = useState("");

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

    const prefix = currentUser === "Manager" ? "👑 Manager Note: " : "";
    const updatedTimeline = [{ text: prefix + activityInput }, ...selectedDeal.timeline];

    const updates = { timeline: updatedTimeline };

    if (pendingStage) {
      updates.stage = pendingStage;
      updates.probability = stageProbability[pendingStage];
    }

    updateDeal(selectedDeal.id, updates);

    setSelectedDeal({ ...selectedDeal, ...updates });
    setActivityInput("");
    setPendingStage(null);
    setShowActivity(false);
  };

  const createLead = () => {
    if (!leadName.trim()) return;

    const newDeal = {
      id: Date.now(),
      name: leadName,
      stage: "Lead",
      value: leadValue ? `₹${leadValue}L` : "₹0L",
      probability: 10,
      owner: currentUser === "Manager" ? "You" : currentUser,
      risk: "Low",
      lastActivity: "Just now",
      timeline: []
    };

    setDeals(prev => [newDeal, ...prev]);
    setLeadName("");
    setLeadValue("");
    setShowNewLead(false);
  };

  const visibleDeals = currentUser === "Manager" ? deals : deals.filter(d => d.owner === currentUser);

  const dashboardDeals = (currentUser === "Manager" && view === "manager" && managerFilter !== "All")
    ? visibleDeals.filter(d => d.owner === managerFilter)
    : visibleDeals;

  const parseValue = (valStr) => parseFloat(valStr.replace(/[^\d.]/g, '')) || 0;
  const totalPipelineValue = dashboardDeals.reduce((sum, deal) => sum + parseValue(deal.value), 0);
  const totalWeightedValue = dashboardDeals.reduce((sum, deal) => sum + (parseValue(deal.value) * (deal.probability / 100)), 0);

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* Header */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap justify-between items-center bg-white shadow-sm border-b border-gray-200 gap-y-3">
        <div className="flex items-center gap-3">
          <img src="/Cabio%20logo.jpeg" alt="Calicut Bio Medicals Logo" className="h-20 sm:h-28 object-contain" />
          <div className="h-10 sm:h-12 w-px bg-gray-300"></div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800 tracking-tight whitespace-nowrap">Sales OS</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={currentUser}
            onChange={(e) => {
              setCurrentUser(e.target.value);
              if (e.target.value !== "Manager") setView("pipeline");
            }}
            className="text-sm bg-gray-50 border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          >
            <option value="Manager">👑 Manager</option>
            <option value="You">👤 You (Sales)</option>
            <option value="Amit">👤 Amit (Sales)</option>
            <option value="Rahul">👤 Rahul (Sales)</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setView(view === "pipeline" ? "manager" : "pipeline")}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-semibold text-sm text-gray-700 shadow-sm transition-colors whitespace-nowrap"
            >
              {view === "pipeline" ? "List View" : "Pipeline View"}
            </button>
            <button
              onClick={() => setShowNewLead(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-semibold text-sm transition-colors whitespace-nowrap"
            >
              + Lead
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Metrics (Manager Only) */}
      {currentUser === "Manager" && !selectedDeal && (
        <div className="bg-white border-b px-4 py-3 flex gap-4 shadow-sm z-10 relative">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex-1 shadow-sm">
            <div className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-1">Raw Pipeline Value</div>
            <div className="text-2xl font-extrabold text-blue-900">₹{totalPipelineValue.toFixed(1).replace(/\.0$/, '')}L</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex-1 shadow-sm">
            <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-1">Expected Revenue (Weighted)</div>
            <div className="text-2xl font-extrabold text-emerald-900">₹{totalWeightedValue.toFixed(1).replace(/\.0$/, '')}L</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg flex-1 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-700 font-bold uppercase tracking-wider mb-1">Active Deals</div>
              <div className="text-2xl font-extrabold text-purple-900">{dashboardDeals.length}</div>
            </div>
            {view === "manager" && managerFilter !== "All" && (
              <div className="text-xs text-purple-600 font-medium text-right bg-white px-2 py-1 rounded border border-purple-100">
                Viewing:<br /><strong>{managerFilter}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pipeline */}
      {view === "pipeline" && (
        <div className="flex gap-4 overflow-x-auto p-3">
          {stages.map(stage => (
            <div key={stage} className="min-w-[260px] bg-gray-200 rounded-xl p-3">
              <h3 className="font-semibold mb-3">{stage}</h3>
              {visibleDeals.filter(d => d.stage === stage).map(deal => (
                <div
                  key={deal.id}
                  className="bg-white p-3 rounded-xl shadow mb-3 cursor-pointer"
                  onClick={() => setSelectedDeal(deal)}
                >
                  <div className="font-semibold text-sm">{deal.name}</div>
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
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Manager View */}
      {view === "manager" && (
        <div className="p-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg text-gray-800">List View {currentUser === "Manager" ? "(All Deals)" : "(Your Deals)"}</h2>
            {currentUser === "Manager" && (
              <select
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
                className="text-sm bg-white border p-1 rounded font-semibold text-gray-700 shadow-sm"
              >
                <option value="All">All Sales Reps</option>
                <option value="You">You</option>
                <option value="Amit">Amit</option>
                <option value="Rahul">Rahul</option>
              </select>
            )}
          </div>
          {(managerFilter === "All" ? visibleDeals : visibleDeals.filter(d => d.owner === managerFilter))
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
                  <div className="font-semibold text-blue-900">{deal.name}</div>
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
      )}

      {/* Deal Detail */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-white p-4 overflow-y-auto">
          <button onClick={() => setSelectedDeal(null)} className="text-blue-500 mb-2 font-semibold">&larr; Back to Dashboard</button>
          <h2 className="font-bold text-xl">{selectedDeal.name}</h2>
          <div className="text-sm text-gray-600 mb-3">Owner: {selectedDeal.owner} &emsp;|&emsp; Value: {selectedDeal.value}</div>

          {(selectedDeal.risk === 'High' || selectedDeal.risk === 'Medium') && selectedDeal.riskReason && (
            <div className="my-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <span className="font-bold">⚠️ Decision Context: </span>{selectedDeal.riskReason}
            </div>
          )}

          <button
            onClick={() => setShowActivity(true)}
            className={`mt-2 text-white px-3 py-2 rounded shadow text-sm w-full font-bold ${currentUser === 'Manager' ? 'bg-indigo-600' : 'bg-blue-500'}`}
          >
            {currentUser === "Manager" ? "+ Add Manager Guidance Note" : "+ Log Interaction"}
          </button>

          <h3 className="mt-6 font-bold text-gray-800 border-b pb-1 mb-2">Timeline</h3>
          {selectedDeal.timeline.length === 0 && <div className="text-gray-500 italic text-sm">No activity yet</div>}
          {selectedDeal.timeline.map((t, i) => (
            <div key={i} className={`p-2 my-2 rounded text-sm shadow-sm ${t.text.includes("Manager Note") ? "bg-indigo-50 border border-indigo-200 text-indigo-900" : "bg-gray-50 border border-gray-200 text-gray-800"}`}>
              {t.text}
            </div>
          ))}
        </div>
      )}

      {/* Activity Modal */}
      {showActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-[300px]">
            <textarea
              className="w-full border p-2 mb-2"
              value={activityInput}
              onChange={(e) => setActivityInput(e.target.value)}
              placeholder="Interaction notes"
            />
            <button
              onClick={addActivity}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      {showNewLead && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-[300px]">
            <h3 className="font-semibold mb-2">Create Lead</h3>

            <input
              className="w-full border p-2 mb-2"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="What is this lead about?"
            />

            <input
              className="w-full border p-2 mb-3"
              value={leadValue}
              onChange={(e) => setLeadValue(e.target.value)}
              placeholder="Approx value (₹ Lakhs)"
            />

            <button
              onClick={createLead}
              className="bg-blue-500 text-white px-3 py-1 rounded w-full"
            >
              Create Lead
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
