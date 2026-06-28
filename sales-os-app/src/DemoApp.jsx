import { useState, useRef, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import FormModal from "./components/FormModal";
import CustomerDirectoryScreen from "./screens/CustomerDirectoryScreen";
import Customer360Screen from "./screens/Customer360Screen";
import ProductCatalogScreen from "./screens/ProductCatalogScreen";
import ProjectDirectoryScreen from "./screens/ProjectDirectoryScreen";
import { listAccounts, listProjects, createOpportunity } from "./services/accounts";
import { listProducts } from "./services/products";
import { listStages, listStatuses, listUsers, listLeadSources } from "./services/masterData";

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
  const customerAccountUpdateRef = useRef(null);
  const projectCreateRef = useRef(null);
  const projectOppsRefreshRef = useRef(null);

  // Quick Lead modal state
  const [showQuickLead, setShowQuickLead] = useState(false);
  const [leadAccounts, setLeadAccounts] = useState([]);
  const [leadStages, setLeadStages] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [leadUsers, setLeadUsers] = useState([]);
  const [leadAccountId, setLeadAccountId] = useState("");
  const [leadProjects, setLeadProjects] = useState([]);
  const [leadProjectsLoading, setLeadProjectsLoading] = useState(false);
  const [leadProjectId, setLeadProjectId] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadStageId, setLeadStageId] = useState("");
  const [leadStatusId, setLeadStatusId] = useState("");
  const [leadOwnerId, setLeadOwnerId] = useState("");
  const [leadWinProb, setLeadWinProb] = useState("");
  const [leadValue, setLeadValue] = useState("");
  const [leadProducts, setLeadProducts] = useState([]);
  const [leadItems, setLeadItems] = useState([]);
  const [leadItemProdId, setLeadItemProdId] = useState("");
  const [leadItemQty, setLeadItemQty] = useState("1");
  const [leadItemPrice, setLeadItemPrice] = useState("");
  const [leadItemDisc, setLeadItemDisc] = useState("0");
  const [showLeadItemsModal, setShowLeadItemsModal] = useState(false);
  const [leadSources, setLeadSources] = useState([]);
  const [leadLeadSourceId, setLeadLeadSourceId] = useState("");

  useEffect(() => {
    if (leadItems.length > 0) {
      const total = leadItems.reduce((s, i) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0);
      setLeadValue(total.toFixed(2));
    } else {
      setLeadValue("");
    }
  }, [leadItems]);

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
    setLeadAccountId(""); setLeadProjects([]); setLeadProjectId("");
    setLeadName(""); setLeadStageId("");
    setLeadStatusId(""); setLeadOwnerId(""); setLeadWinProb(""); setLeadValue("");
    setLeadItems([]); setLeadItemProdId(""); setLeadItemQty("1"); setLeadItemPrice(""); setLeadItemDisc("0");
    setLeadLeadSourceId("");
    setShowQuickLead(true);
    await Promise.all([
      leadAccounts.length === 0 && listAccounts({ page_size: 100 }).then((d) => setLeadAccounts(d.items || [])).catch(() => {}),
      leadStages.length === 0 && listStages().then(setLeadStages).catch(() => {}),
      leadStatuses.length === 0 && listStatuses().then(setLeadStatuses).catch(() => {}),
      leadUsers.length === 0 && listUsers().then(setLeadUsers).catch(() => {}),
      leadProducts.length === 0 && listProducts({ page_size: 100, sbu_id: userProfile?.sbu?.id }).then((d) => setLeadProducts(d.items || [])).catch(() => {}),
      leadSources.length === 0 && listLeadSources().then(setLeadSources).catch(() => {}),
    ]);
  }

  async function handleCreateLead() {
    if (!leadName.trim()) throw new Error("Opportunity name is required");
    if (!leadAccountId) throw new Error("Account is required");
    if (!leadStageId) throw new Error("Stage is required");
    if (!leadStatusId) throw new Error("Status is required");
    if (!leadOwnerId) throw new Error("Owner is required");
    if (leadWinProb === "") throw new Error("Win probability is required");
    const _stage = leadStages.find((s) => s.id === leadStageId);
    const _qualified = leadStages.find((s) => s.stage_code === "QUALIFIED");
    if (_stage && _qualified && _stage.display_order >= _qualified.display_order && leadValue === "") {
      throw new Error("Indicative value is required for Qualified stage and above");
    }
    const payload = {
      name: leadName.trim(),
      stage_id: leadStageId,
      status_id: leadStatusId,
      owner_id: leadOwnerId,
      win_probability: Number(leadWinProb),
    };
    if (leadValue !== "") payload.indicative_value = Number(leadValue);
    if (leadProjectId) payload.project_id = leadProjectId;
    if (leadLeadSourceId) payload.lead_source_id = leadLeadSourceId;
    if (leadItems.length > 0) payload.items = leadItems.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price_lakhs: i.unit_price_lakhs,
      discount_lakhs: i.discount_lakhs,
    }));
    await createOpportunity(leadAccountId, payload);
    projectOppsRefreshRef.current?.();
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

      {/* Sidebar drawer — wrapper clips inner panel to content boundary */}
      <div
        className={`fixed top-0 left-0 min-[896px]:left-[calc((100vw-56rem)/2)] h-full w-[280px] z-[210] overflow-hidden transition-shadow duration-300 ease-in-out ${
          isSidebarOpen ? "shadow-2xl pointer-events-auto" : "shadow-none pointer-events-none"
        }`}
      >
      <div
        className={`w-full h-full bg-white transform transition-transform duration-300 ease-in-out ${
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
      </div>

      {/* Top header */}
      <div className="bg-white shadow-sm border-b border-gray-100 z-[100]">
      <div className="max-w-4xl mx-auto w-full px-4 py-3 flex justify-between items-center">
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

        <div className="flex items-center gap-2">
          <button
            onClick={openQuickLead}
            className="px-3 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all uppercase tracking-wider shadow-sm"
          >
            + Lead
          </button>
          <button
            onClick={signOut}
            className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-black uppercase transition-colors px-2.5 py-2 rounded-xl"
          >
            <span className="hidden sm:inline text-xs tracking-widest">Sign Out</span>
            <svg className="sm:hidden w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
        <ErrorBoundary>
          {/* Account Management — always mounted, sub-tabbed */}
          <div className={`flex-1 overflow-hidden flex flex-col ${view === "customers" ? "" : "hidden"}`}>
            {/* Section header + tab bar — hidden when inside a project detail */}
            {!projectDetailMode && (
              <>
                <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
                  <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">Account Management</h2>
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
              <CustomerDirectoryScreen onSelectAccount={handleSelectAccount} openCreateRef={customerCreateRef} accountUpdateRef={customerAccountUpdateRef} />
            </div>
            {/* Project Directory — always mounted */}
            <div className={`flex-1 overflow-hidden flex flex-col ${accountSubTab === "projects" ? "" : "hidden"}`}>
              <ProjectDirectoryScreen onDetailModeChange={setProjectDetailMode} openCreateRef={projectCreateRef} refreshOppsRef={projectOppsRefreshRef} />
            </div>
          </div>

          {view === "customer360" && selectedAccount && (
            <Customer360Screen
              accountId={selectedAccount.id}
              initialAccount={selectedAccount}
              onBack={handleBack360}
              onAccountUpdate={(a) => customerAccountUpdateRef.current?.(a)}
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
        title="New Opportunity"
        onSubmit={handleCreateLead}
        submitLabel="Create"
      >
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Name *</label>
          <input type="text" value={leadName} onChange={(e) => setLeadName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" placeholder="Enter opportunity name" autoFocus />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Account *</label>
          <select
            value={leadAccountId}
            onChange={(e) => {
              const id = e.target.value;
              setLeadAccountId(id);
              setLeadProjectId("");
              setLeadProjects([]);
              if (id) {
                setLeadProjectsLoading(true);
                listProjects(id).then(setLeadProjects).catch(() => {}).finally(() => setLeadProjectsLoading(false));
              }
            }}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
          >
            <option value="">Select account</option>
            {leadAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
            Project {leadProjectsLoading && <span className="text-gray-300 font-normal normal-case tracking-normal">— loading…</span>}
          </label>
          <select
            value={leadProjectId}
            onChange={(e) => setLeadProjectId(e.target.value)}
            disabled={!leadAccountId || leadProjectsLoading}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium disabled:opacity-40"
          >
            <option value="">None</option>
            {leadProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Stage *</label>
            <select value={leadStageId} onChange={(e) => { const s = leadStages.find((x) => x.id === e.target.value); setLeadStageId(e.target.value); if (s) setLeadWinProb(String(s.default_win_probability)); }} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium">
              <option value="">Select stage</option>
              {leadStages.map((s) => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Status *</label>
            <select value={leadStatusId} onChange={(e) => setLeadStatusId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium">
              <option value="">Select status</option>
              {leadStatuses.map((s) => <option key={s.id} value={s.id}>{s.status_name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Lead Source</label>
          <select value={leadLeadSourceId} onChange={(e) => setLeadLeadSourceId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium">
            <option value="">Select source</option>
            {leadSources.map((ls) => <option key={ls.id} value={ls.id}>{ls.name}</option>)}
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
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
            Indicative Value (Lakhs)
            {leadItems.length > 0 && <span className="ml-1 text-blue-400 font-normal normal-case tracking-normal">(auto)</span>}
          </label>
          <input type="number" step="any" min="0" value={leadValue} onChange={(e) => setLeadValue(e.target.value)} readOnly={leadItems.length > 0} className={leadItems.length > 0 ? "w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-500 cursor-not-allowed" : "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"} placeholder="e.g. 25.50" />
        </div>
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Products</div>
            <button type="button" onClick={() => setShowLeadItemsModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all uppercase tracking-wider shrink-0">
              {leadItems.length > 0 ? `Edit (${leadItems.length})` : "+ Add Products"}
            </button>
          </div>
          {leadItems.length > 0 ? (
            <div className="space-y-1">
              {leadItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl text-xs">
                  <div className="flex-1 font-bold truncate">{item.product_name}</div>
                  <div className="text-gray-400 shrink-0">{item.quantity}×₹{item.unit_price_lakhs}L{item.discount_lakhs > 0 ? ` −₹${item.discount_lakhs}L` : ""}</div>
                </div>
              ))}
              <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-wider pr-1">
                Total: ₹{leadItems.reduce((s, i) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">No products added</div>
          )}
        </div>
      </FormModal>

      {/* New Opportunity — Products secondary modal */}
      <FormModal
        isOpen={showLeadItemsModal}
        onClose={() => setShowLeadItemsModal(false)}
        title="Products"
        onSubmit={async () => {}}
        submitLabel="Done"
      >
        {leadItems.length > 0 && (
          <div className="space-y-2">
            {leadItems.map((item, i) => (
              <div key={i} className="px-3 py-2 bg-gray-50 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold truncate">{item.product_name}</div>
                  <button type="button" onClick={() => setLeadItems(leadItems.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 font-black shrink-0 ml-2">×</button>
                </div>
                <div className="flex gap-2">
                  <div className="w-20">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Qty</div>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => setLeadItems(leadItems.map((it, j) => j === i ? { ...it, quantity: Number(e.target.value) } : it))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
                  </div>
                  <div className="w-20">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Price (₹L)</div>
                    <input type="number" min="0" step="any" value={item.unit_price_lakhs} onChange={(e) => setLeadItems(leadItems.map((it, j) => j === i ? { ...it, unit_price_lakhs: Number(e.target.value) } : it))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
                  </div>
                  <div className="w-20">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Disc (₹L)</div>
                    <input type="number" min="0" step="any" value={item.discount_lakhs} onChange={(e) => setLeadItems(leadItems.map((it, j) => j === i ? { ...it, discount_lakhs: Number(e.target.value) } : it))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
                  </div>
                </div>
              </div>
            ))}
            <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-wider pr-1">
              Total: ₹{leadItems.reduce((s, i) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L
            </div>
          </div>
        )}
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Add Product</div>
          <select value={leadItemProdId} onChange={(e) => setLeadItemProdId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium">
            <option value="">Select product</option>
            {leadProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex gap-2">
            <div className="w-20">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Qty</div>
              <input type="number" min="1" value={leadItemQty} onChange={(e) => setLeadItemQty(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" placeholder="e.g. 2" />
            </div>
            <div className="w-20">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Price (₹L)</div>
              <input type="number" min="0" step="any" value={leadItemPrice} onChange={(e) => setLeadItemPrice(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" placeholder="e.g. 12.5" />
            </div>
            <div className="w-20">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Disc (₹L)</div>
              <input type="number" min="0" step="any" value={leadItemDisc} onChange={(e) => setLeadItemDisc(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" placeholder="0" />
            </div>
          </div>
          <button type="button" onClick={() => {
            if (!leadItemProdId || !leadItemQty || !leadItemPrice) return;
            const prod = leadProducts.find((p) => p.id === leadItemProdId);
            setLeadItems([...leadItems, { product_id: leadItemProdId, product_name: prod?.name || "", quantity: Number(leadItemQty), unit_price_lakhs: Number(leadItemPrice), discount_lakhs: Number(leadItemDisc || 0) }]);
            setLeadItemProdId(""); setLeadItemQty("1"); setLeadItemPrice(""); setLeadItemDisc("0");
          }} className="w-full py-2 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider">
            + Add Product
          </button>
        </div>
      </FormModal>
    </div>
  );
}
