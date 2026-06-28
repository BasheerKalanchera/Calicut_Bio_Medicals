import { useState, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import FormModal from "./components/FormModal";
import CustomerDirectoryScreen from "./screens/CustomerDirectoryScreen";
import Customer360Screen from "./screens/Customer360Screen";
import ProductCatalogScreen from "./screens/ProductCatalogScreen";
import ProjectDirectoryScreen from "./screens/ProjectDirectoryScreen";
import { listAccounts, createOpportunity } from "./services/accounts";
import { listStages, listStatuses, listUsers } from "./services/masterData";

const NAV_SECTIONS = [
  {
    title: "SALES EXECUTION",
    items: [
      { id: "customers", label: "Account Management", icon: "🏥" },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { id: "catalog", label: "Product Catalog", icon: "📦" },
    ],
  },
];

export default function DemoApp() {
  const { userProfile, signOut } = useAuth();
  const [view, setView] = useState("customers");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountSubTab, setAccountSubTab] = useState("customers");
  const [projectDetailMode, setProjectDetailMode] = useState(false);
  const customerCreateRef = useRef(null);
  const projectCreateRef = useRef(null);

  // Quick Lead modal state
  const [showQuickLead, setShowQuickLead] = useState(false);
  const [leadAccounts, setLeadAccounts] = useState([]);
  const [leadStages, setLeadStages] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [leadUsers, setLeadUsers] = useState([]);
  const [leadAccountId, setLeadAccountId] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadStageId, setLeadStageId] = useState("");
  const [leadStatusId, setLeadStatusId] = useState("");
  const [leadOwnerId, setLeadOwnerId] = useState("");
  const [leadWinProb, setLeadWinProb] = useState("");
  const [leadValue, setLeadValue] = useState("");

  function handleSelectAccount(account) {
    setSelectedAccount(account);
    setView("customer360");
  }

  function handleBack360() {
    setSelectedAccount(null);
    setView("customers");
  }

  function navigate(viewId) {
    setView(viewId);
    setSelectedAccount(null);
    setIsSidebarOpen(false);
    setProjectDetailMode(false);
  }

  async function openQuickLead() {
    setLeadAccountId(""); setLeadName(""); setLeadStageId("");
    setLeadStatusId(""); setLeadOwnerId(""); setLeadWinProb(""); setLeadValue("");
    setShowQuickLead(true);
    await Promise.all([
      leadAccounts.length === 0 && listAccounts({ page_size: 100 }).then((d) => setLeadAccounts(d.items || [])).catch(() => {}),
      leadStages.length === 0 && listStages().then(setLeadStages).catch(() => {}),
      leadStatuses.length === 0 && listStatuses().then(setLeadStatuses).catch(() => {}),
      leadUsers.length === 0 && listUsers().then(setLeadUsers).catch(() => {}),
    ]);
  }

  async function handleCreateLead() {
    if (!leadAccountId) throw new Error("Account is required");
    if (!leadName.trim()) throw new Error("Opportunity name is required");
    if (!leadStageId) throw new Error("Stage is required");
    if (!leadStatusId) throw new Error("Status is required");
    if (!leadOwnerId) throw new Error("Owner is required");
    if (leadWinProb === "") throw new Error("Win probability is required");
    const payload = {
      name: leadName.trim(),
      stage_id: leadStageId,
      status_id: leadStatusId,
      owner_id: leadOwnerId,
      win_probability: Number(leadWinProb),
    };
    if (leadValue !== "") payload.indicative_value = Number(leadValue);
    await createOpportunity(leadAccountId, payload);
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden relative">
      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[210] shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Sidebar header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-blue-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg">
              <img
                src="/Cabio%20logo.jpeg"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="font-extrabold text-lg tracking-tight">Sales OS</h2>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
          {NAV_SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-2">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    view === item.id ||
                    (item.id === "customers" && view === "customer360");
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                        isActive
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Prototype link */}
          <section className="pt-4 border-t border-gray-100">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-2">
              COMING SOON
            </h3>
            <a
              href="/prototype"
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm text-gray-500 hover:bg-gray-50 transition-all"
            >
              <span className="text-lg">🚀</span>
              Sprint 2 Preview
            </a>
          </section>
        </div>

        {/* Profile footer */}
        {userProfile && (
          <div className="p-4 border-t border-gray-100 shrink-0 bg-white">
            <div className="p-3 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl text-white shadow-lg">
              <div className="text-[9px] font-black opacity-60 uppercase mb-0.5">
                Logged in as
              </div>
              <div className="font-bold flex items-center gap-2 mb-0.5 text-xs sm:text-sm">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {userProfile.display_name}
              </div>
              <div className="text-[9px] opacity-85 leading-normal border-t border-white/10 pt-1 mt-1">
                <div>
                  {userProfile.role_name}
                  {userProfile.zone ? ` • ${userProfile.zone.name}` : ""}
                </div>
                <div className="font-bold text-blue-200 uppercase tracking-wider text-[7px] mt-0.5 bg-white/10 px-1 py-0.5 rounded w-fit">
                  SBU: {userProfile.sbu.name}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top header */}
      <div className="px-4 py-3 flex justify-between items-center bg-white shadow-sm border-b border-gray-100 z-[100]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <span className="text-xl">☰</span>
          </button>
          <div className="flex items-center gap-3">
            <img
              src="/Cabio%20logo.jpeg"
              alt="Logo"
              className="h-10 object-contain"
            />
            <h1 className="text-lg font-black text-gray-800 tracking-tight hidden sm:block">
              Sales OS
            </h1>
          </div>
        </div>

        <button
          onClick={signOut}
          className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 text-xs font-black uppercase tracking-widest transition-colors px-3 py-2 rounded-xl"
        >
          Sign Out
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ErrorBoundary>
          {/* Account Management — always mounted, sub-tabbed */}
          <div className={`flex-1 overflow-hidden flex flex-col ${view === "customers" ? "" : "hidden"}`}>
            {/* Section header + tab bar — hidden when inside a project detail */}
            {!projectDetailMode && (
              <>
                <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
                  <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">Account Management</h2>
                  <button
                    onClick={openQuickLead}
                    className="px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all uppercase tracking-wider shadow-sm"
                  >
                    + Lead
                  </button>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100 shrink-0">
                  <div className="flex gap-2 flex-1">
                    {[
                      { id: "customers", label: "Customers" },
                      { id: "projects", label: "Projects" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => { setAccountSubTab(tab.id); setProjectDetailMode(false); }}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                          accountSubTab === tab.id
                            ? "bg-blue-600 text-white"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      accountSubTab === "customers"
                        ? customerCreateRef.current?.()
                        : projectCreateRef.current?.()
                    }
                    className="px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition-all uppercase tracking-wider shadow-sm shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </>
            )}
            {/* Customer Directory — always mounted */}
            <div className={`flex-1 overflow-hidden flex flex-col ${accountSubTab === "customers" ? "" : "hidden"}`}>
              <CustomerDirectoryScreen onSelectAccount={handleSelectAccount} openCreateRef={customerCreateRef} />
            </div>
            {/* Project Directory — always mounted */}
            <div className={`flex-1 overflow-hidden flex flex-col ${accountSubTab === "projects" ? "" : "hidden"}`}>
              <ProjectDirectoryScreen onDetailModeChange={setProjectDetailMode} openCreateRef={projectCreateRef} />
            </div>
          </div>

          {view === "customer360" && selectedAccount && (
            <Customer360Screen
              accountId={selectedAccount.id}
              initialAccount={selectedAccount}
              onBack={handleBack360}
            />
          )}
          {/* Product Catalog — always mounted, hidden when not active */}
          <div className={`flex-1 overflow-hidden flex flex-col ${view === "catalog" ? "" : "hidden"}`}>
            <ProductCatalogScreen />
          </div>
        </ErrorBoundary>
      </div>

      {/* Quick Lead modal */}
      <FormModal
        isOpen={showQuickLead}
        onClose={() => setShowQuickLead(false)}
        title="New Lead"
        onSubmit={handleCreateLead}
        submitLabel="Create Lead"
      >
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Account *</label>
          <select value={leadAccountId} onChange={(e) => setLeadAccountId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium">
            <option value="">Select account</option>
            {leadAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Opportunity Name *</label>
          <input type="text" value={leadName} onChange={(e) => setLeadName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" placeholder="e.g. Ultrasound Upgrade — ICU" autoFocus />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Stage *</label>
          <select value={leadStageId} onChange={(e) => { const s = leadStages.find((x) => x.id === e.target.value); setLeadStageId(e.target.value); if (s) setLeadWinProb(String(s.default_win_probability)); }} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium">
            <option value="">Select stage</option>
            {leadStages.map((s) => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Status *</label>
          <select value={leadStatusId} onChange={(e) => setLeadStatusId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium">
            <option value="">Select status</option>
            {leadStatuses.map((s) => <option key={s.id} value={s.id}>{s.status_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Owner *</label>
          <select value={leadOwnerId} onChange={(e) => setLeadOwnerId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium">
            <option value="">Select owner</option>
            {leadUsers.map((u) => <option key={u.id} value={u.id}>{u.display_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Win Probability % *</label>
          <input type="number" min="0" max="100" value={leadWinProb} onChange={(e) => setLeadWinProb(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" placeholder="0 – 100" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Indicative Value (Lakhs)</label>
          <input type="number" step="any" min="0" value={leadValue} onChange={(e) => setLeadValue(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" placeholder="e.g. 25.50" />
        </div>
      </FormModal>
    </div>
  );
}
