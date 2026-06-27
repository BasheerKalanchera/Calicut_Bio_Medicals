import { useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import CustomerDirectoryScreen from "./screens/CustomerDirectoryScreen";
import Customer360Screen from "./screens/Customer360Screen";
import ProductCatalogScreen from "./screens/ProductCatalogScreen";
import ProjectDirectoryScreen from "./screens/ProjectDirectoryScreen";

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
              DEVELOPMENT
            </h3>
            <a
              href="/prototype"
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm text-gray-500 hover:bg-gray-50 transition-all"
            >
              <span className="text-lg">🧪</span>
              Prototype (Mock Data)
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
          className="text-gray-400 hover:text-red-500 text-xs font-black uppercase tracking-widest transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
        >
          Sign Out
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ErrorBoundary>
          {/* Account Management — always mounted, sub-tabbed */}
          <div className={`flex-1 overflow-hidden flex flex-col ${view === "customers" ? "" : "hidden"}`}>
            {/* Sub-tab bar */}
            <div className="flex px-4 pt-2 bg-white border-b border-gray-100 shrink-0">
              {[
                { id: "customers", label: "Customers" },
                { id: "projects", label: "All Projects" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAccountSubTab(tab.id)}
                  className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all -mb-px ${
                    accountSubTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Customer Directory — always mounted */}
            <div className={`flex-1 overflow-hidden flex flex-col ${accountSubTab === "customers" ? "" : "hidden"}`}>
              <CustomerDirectoryScreen onSelectAccount={handleSelectAccount} />
            </div>
            {/* Project Directory — always mounted */}
            <div className={`flex-1 overflow-hidden flex flex-col ${accountSubTab === "projects" ? "" : "hidden"}`}>
              <ProjectDirectoryScreen />
            </div>
          </div>

          {view === "customer360" && selectedAccount && (
            <Customer360Screen
              accountId={selectedAccount.id}
              initialAccount={selectedAccount}
              onBack={handleBack360}
            />
          )}
          {view === "catalog" && <ProductCatalogScreen />}
        </ErrorBoundary>
      </div>
    </div>
  );
}
