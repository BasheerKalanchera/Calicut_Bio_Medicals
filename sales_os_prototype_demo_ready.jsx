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
  {
    id: 1,
    name: "Al Shifa Hospital – Ultrasound",
    stage: "Qualified",
    value: "₹22L",
    probability: 30,
    owner: "You",
    risk: "Low",
    lastActivity: "Just now",
    timeline: [
      { text: "Doctor interested, requirement discussed" }
    ]
  },
  {
    id: 2,
    name: "City Scan – Doppler",
    stage: "Demo",
    value: "₹18L",
    probability: 50,
    owner: "You",
    risk: "Low",
    lastActivity: "Just now",
    timeline: [
      { text: "Demo scheduled" }
    ]
  },
  {
    id: 3,
    name: "City Clinic – X-Ray",
    stage: "Demo",
    value: "₹8L",
    probability: 50,
    owner: "Amit",
    risk: "Low",
    lastActivity: "1d ago",
    timeline: [
      { text: "Demo completed, awaiting feedback" }
    ]
  },
  {
    id: 4,
    name: "ABC Hospital – Ultrasound",
    stage: "Negotiation",
    value: "₹25L",
    probability: 70,
    owner: "Rahul",
    risk: "Medium",
    lastActivity: "2d ago",
    timeline: [
      { text: "Commercial discussion ongoing" }
    ]
  },
  {
    id: 5,
    name: "Iqra UST m/c",
    stage: "Order",
    value: "₹30L",
    probability: 100,
    owner: "You",
    risk: "Low",
    lastActivity: "Just now",
    timeline: [
      { text: "PO confirmed" }
    ]
  }
];

export default function App() {
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

    const updatedTimeline = [...selectedDeal.timeline, { text: activityInput }];

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
      value: leadValue ? `₹${leadValue}` : "₹0",
      probability: 10,
      owner: "You",
      risk: "Low",
      lastActivity: "Just now",
      timeline: []
    };

    setDeals(prev => [newDeal, ...prev]);
    setLeadName("");
    setLeadValue("");
    setShowNewLead(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* Header */}
      <div className="p-3 flex justify-between items-center bg-white shadow">
        <h1 className="font-bold">Sales OS</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === "pipeline" ? "manager" : "pipeline")}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            {view === "pipeline" ? "Manager" : "Pipeline"}
          </button>
          <button
            onClick={() => setShowNewLead(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            + Lead
          </button>
        </div>
      </div>

      {/* Pipeline */}
      {view === "pipeline" && (
        <div className="flex gap-4 overflow-x-auto p-3">
          {stages.map(stage => (
            <div key={stage} className="min-w-[260px] bg-gray-200 rounded-xl p-3">
              <h3 className="font-semibold mb-3">{stage}</h3>
              {deals.filter(d => d.stage === stage).map(deal => (
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
          <h2 className="font-bold mb-3">Manager View</h2>
          {deals.map(deal => (
            <div key={deal.id} className="bg-white p-3 mb-2 rounded shadow">
              <div className="font-semibold">{deal.name}</div>
              <div>Stage: {deal.stage}</div>
              <div>🎯 {deal.probability}%</div>
              <div>Risk: {deal.risk}</div>
            </div>
          ))}
        </div>
      )}

      {/* Deal Detail */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-white p-4">
          <button onClick={() => setSelectedDeal(null)}>Close</button>
          <h2 className="font-bold">{selectedDeal.name}</h2>

          <button
            onClick={() => setShowActivity(true)}
            className="mt-2 bg-blue-500 text-white px-2 py-1 rounded"
          >
            + Interaction
          </button>

          <h3 className="mt-4">Timeline</h3>
          {selectedDeal.timeline.length === 0 && <div>No activity yet</div>}
          {selectedDeal.timeline.map((t, i) => (
            <div key={i}>{t.text}</div>
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
