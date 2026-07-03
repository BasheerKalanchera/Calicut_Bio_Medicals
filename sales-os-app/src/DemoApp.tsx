import { useRef, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import QuickLeadModal from "./components/QuickLeadModal";
import LogActivityModal from "./components/LogActivityModal";
import CustomerDirectoryScreen from "./screens/CustomerDirectoryScreen";
import Customer360Screen from "./screens/Customer360Screen";
import ProductCatalogScreen from "./screens/ProductCatalogScreen";
import ProjectDirectoryScreen from "./screens/ProjectDirectoryScreen";
import OpportunityPipelineScreen from "./screens/OpportunityPipelineScreen";
import OpportunityDetailScreen from "./screens/OpportunityDetailScreen";
import NextActionsScreen from "./screens/NextActionsScreen";
import type { PipelineOpportunity } from "./types/api";

const NAV_SECTIONS = [
  {
    title: "SALES EXECUTION",
    items: [
      { id: "customers",     label: "Account Management", icon: "🏥" },
      { id: "opportunities", label: "Pipeline",           icon: "📈" },
      { id: "nextActions",   label: "Next Actions",       icon: "✅" },
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
  const [view, setView]                         = useState("customers");
  const [isSidebarOpen, setIsSidebarOpen]       = useState(false);
  const [selectedAccount, setSelectedAccount]   = useState<{ id: string; name: string } | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<PipelineOpportunity | null>(null);
  const [accountSubTab, setAccountSubTab]       = useState("customers");
  const [projectDetailMode, setProjectDetailMode] = useState(false);
  const [showQuickLead, setShowQuickLead]       = useState(false);
  const [showLogActivity, setShowLogActivity]   = useState(false);

  const customerCreateRef        = useRef<(() => void) | null>(null);
  const customerAccountUpdateRef = useRef<((a: unknown) => void) | null>(null);
  const projectCreateRef         = useRef<(() => void) | null>(null);
  const projectOppsRefreshRef    = useRef<(() => void) | null>(null);

  function handleSelectAccount(account: { id: string; name: string }) {
    setSelectedAccount(account);
    setView("customer360");
  }

  function handleBack360() {
    setSelectedAccount(null);
    setView("customers");
  }

  function handleSelectOpportunity(opp: PipelineOpportunity) {
    setSelectedOpportunity(opp);
    setView("opportunityDetail");
  }

  function handleBackToOpportunities() {
    setSelectedOpportunity(null);
    setView("opportunities");
  }

  function navigate(viewId: string) {
    setView(viewId);
    setSelectedAccount(null);
    setSelectedOpportunity(null);
    setIsSidebarOpen(false);
    setProjectDetailMode(false);
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
                <img src="/Cabio%20logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="font-extrabold text-lg tracking-tight">Sales OS</h2>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-white/70 hover:text-white transition-colors">
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
                      (item.id === "customers"     && view === "customer360") ||
                      (item.id === "opportunities" && view === "opportunityDetail");
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
          </div>

          {/* Profile footer */}
          {userProfile && (
            <div className="p-4 border-t border-gray-100 shrink-0 bg-white">
              <div className="p-3 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl text-white shadow-lg">
                <div className="text-[9px] font-black opacity-60 uppercase mb-0.5">Logged in as</div>
                <div className="font-bold flex items-center gap-2 mb-0.5 text-xs sm:text-sm">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  {(userProfile as any).display_name}
                </div>
                <div className="text-[9px] opacity-85 leading-normal border-t border-white/10 pt-1 mt-1">
                  <div>
                    {(userProfile as any).role_name}
                    {(userProfile as any).zone ? ` • ${(userProfile as any).zone.name}` : ""}
                  </div>
                  <div className="font-bold text-blue-200 uppercase tracking-wider text-[7px] mt-0.5 bg-white/10 px-1 py-0.5 rounded w-fit">
                    SBU: {(userProfile as any).sbu?.name}
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
              <img src="/Cabio%20logo.jpeg" alt="Logo" className="h-10 object-contain" />
              <h1 className="text-lg font-black text-gray-800 tracking-tight hidden sm:block">Sales OS</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickLead(true)}
              className="px-3 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all uppercase tracking-wider shadow-sm"
            >
              + Lead
            </button>
            <button
              onClick={() => setShowLogActivity(true)}
              className="px-3 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition-all uppercase tracking-wider shadow-sm"
            >
              + Log
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
            {!projectDetailMode && (
              <>
                <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
                  <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">Account Management</h2>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100 shrink-0">
                  <div className="flex gap-2 flex-1">
                    {[
                      { id: "customers", label: "Customers" },
                      { id: "projects",  label: "Projects" },
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
            <div className={`flex-1 overflow-hidden flex flex-col ${accountSubTab === "customers" ? "" : "hidden"}`}>
              <CustomerDirectoryScreen
                onSelectAccount={handleSelectAccount}
                openCreateRef={customerCreateRef}
                accountUpdateRef={customerAccountUpdateRef}
              />
            </div>
            <div className={`flex-1 overflow-hidden flex flex-col ${accountSubTab === "projects" ? "" : "hidden"}`}>
              <ProjectDirectoryScreen
                onDetailModeChange={setProjectDetailMode}
                openCreateRef={projectCreateRef}
                refreshOppsRef={projectOppsRefreshRef}
              />
            </div>
          </div>

          {view === "customer360" && selectedAccount && (
            <Customer360Screen
              accountId={selectedAccount.id}
              initialAccount={selectedAccount as any}
              onBack={handleBack360}
              onAccountUpdate={(a: unknown) => customerAccountUpdateRef.current?.(a)}
            />
          )}

          {/* Opportunity Pipeline */}
          <div className={`flex-1 overflow-hidden flex flex-col ${view === "opportunities" ? "" : "hidden"}`}>
            <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
              <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">Pipeline</h2>
            </div>
            <OpportunityPipelineScreen onSelectOpportunity={handleSelectOpportunity} />
          </div>

          {/* Opportunity Detail — push navigation */}
          {view === "opportunityDetail" && selectedOpportunity && (
            <OpportunityDetailScreen
              opportunity={selectedOpportunity}
              onBack={handleBackToOpportunities}
            />
          )}

          {/* Product Catalog — always mounted, hidden when not active */}
          <div className={`flex-1 overflow-hidden flex flex-col ${view === "catalog" ? "" : "hidden"}`}>
            <ProductCatalogScreen />
          </div>

          {/* Next Actions — always mounted, hidden when not active */}
          <div className={`flex-1 overflow-hidden flex flex-col ${view === "nextActions" ? "" : "hidden"}`}>
            <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
              <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">Next Actions</h2>
            </div>
            <NextActionsScreen />
          </div>
        </ErrorBoundary>
      </div>

      <QuickLeadModal
        isOpen={showQuickLead}
        onClose={() => setShowQuickLead(false)}
        onCreated={() => { projectOppsRefreshRef.current?.(); }}
        sbuId={(userProfile as any)?.sbu?.id}
      />
      <LogActivityModal
        isOpen={showLogActivity}
        onClose={() => setShowLogActivity(false)}
        accountId={
          view === "customer360" ? selectedAccount?.id :
          view === "opportunityDetail" ? selectedOpportunity?.account.id :
          undefined
        }
        opportunityId={view === "opportunityDetail" ? selectedOpportunity?.id : undefined}
        currentUserId={(userProfile as any)?.id}
      />
    </div>
  );
}
