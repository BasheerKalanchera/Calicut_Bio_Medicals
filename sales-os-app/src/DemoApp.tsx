import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Backdrop, Box, Button, IconButton, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import QuickLeadModal from "./components/QuickLeadModal";
import LogActivityModal from "./components/LogActivityModal";
import CustomerDirectoryScreen from "./screens/CustomerDirectoryScreen";
import Customer360Screen from "./screens/Customer360Screen";
import ProductCatalogScreen from "./screens/ProductCatalogScreen";
import ProjectDirectoryScreen from "./screens/ProjectDirectoryScreen";
import HelpDrawer from "./components/HelpDrawer";
import { HELP_CONTENT } from "./utils/helpContent";
import OpportunityPipelineScreen from "./screens/OpportunityPipelineScreen";
import OpportunityDetailScreen from "./screens/OpportunityDetailScreen";
import NextActionsScreen from "./screens/NextActionsScreen";
import DailyActivityReportScreen from "./screens/DailyActivityReportScreen";
import UserDirectoryScreen from "./screens/UserDirectoryScreen";
import TerritoryAdminScreen from "./screens/TerritoryAdminScreen";
import type { PipelineOpportunity } from "./types/api";

const ADMIN_ROLES = new Set(["Admin", "General Manager"]);

const NAV_SECTIONS = [
  {
    title: "SALES EXECUTION",
    items: [
      { id: "customers",     label: "Account Management", icon: "🏥" },
      { id: "opportunities", label: "Pipeline",           icon: "📈" },
      { id: "nextActions",   label: "Next Actions",       icon: "✅" },
      { id: "dailyActivity", label: "Daily Activity Report", icon: "📋" },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { id: "catalog",     label: "Product Catalog", icon: "📦" },
      { id: "users",       label: "User Directory",  icon: "👥", adminOnly: true },
      { id: "territories", label: "Territory Map",   icon: "🗺️", adminOnly: true },
    ],
  },
];

const SHADOW_SM = "0 1px 2px rgba(0,0,0,0.05)";

export default function DemoApp() {
  const { userProfile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView]                         = useState("opportunities");
  const [isSidebarOpen, setIsSidebarOpen]       = useState(false);
  const [selectedAccount, setSelectedAccount]   = useState<{ id: string; name: string } | null>(null);
  // Where to return to on Back — Customer360/OpportunityDetail now have more than
  // one entry point (Directory/Pipeline, or Next Actions via Reminder click-through).
  const [accountReturnView, setAccountReturnView]         = useState("customers");
  const [opportunityReturnView, setOpportunityReturnView] = useState("opportunities");
  // Only ever set to something other than "customers" when a project is opened
  // from outside the Projects list itself (e.g. Customer 360's Projects tab) —
  // consumed and reset back to "customers" on Back, see handleBackFromProjectDetail.
  const [projectReturnView, setProjectReturnView]         = useState("customers");
  // Often just an {id, name} reference (Reminder click-through) rather than a
  // full PipelineOpportunity (Pipeline navigation) — OpportunityDetailScreen
  // fetches the rest itself and reports back via onOpportunityUpdate.
  const [selectedOpportunity, setSelectedOpportunity] = useState<PipelineOpportunity | { id: string; name: string } | null>(null);
  // Set by the Customer 360 stakeholder bridge list, so OpportunityDetailScreen
  // can open straight on the tab the user actually came here for, instead of
  // always defaulting to Overview.
  const [selectedOpportunityInitialTab, setSelectedOpportunityInitialTab] = useState<string | undefined>(undefined);
  // Which Customer 360 tab to reopen on when Back returns there from
  // Opportunity Detail (e.g. the stakeholder bridge list) — reset to
  // undefined (defaults to Overview) on any fresh account open.
  const [customer360InitialTab, setCustomer360InitialTab] = useState<string | undefined>(undefined);
  const [selectedProject, setSelectedProject]   = useState<{ id: string; name: string; account: { id: string; name: string } } | null>(null);
  const [accountSubTab, setAccountSubTab]       = useState("customers");
  const [projectDetailMode, setProjectDetailMode] = useState(false);
  const [showQuickLead, setShowQuickLead]       = useState(false);
  const [showLogActivity, setShowLogActivity]   = useState(false);
  // Spike (2026-08-01): Help button only wired up for Pipeline so far — see
  // HelpDrawer.tsx and active_progress.md for the plan to generalize this.
  const [showHelp, setShowHelp]                 = useState(false);
  // Lifted out of OpportunityPipelineScreen so the Kanban/List toggle can sit
  // in this header row next to the "Pipeline" title, freeing the filter row
  // below for the Owner/Zone selects (narrow-viewport layout fix).
  const [pipelineViewMode, setPipelineViewMode] = useState<"kanban" | "list">("kanban");

  const customerCreateRef        = useRef<(() => void) | null>(null);
  const projectCreateRef         = useRef<(() => void) | null>(null);
  const projectOppsRefreshRef    = useRef<(() => void) | null>(null);
  const projectResetRef          = useRef<(() => void) | null>(null);
  const projectOpenRef           = useRef<((p: { id: string; name: string }) => void) | null>(null);
  const openLogActivityRef       = useRef<(() => void) | null>(null);
  openLogActivityRef.current = () => setShowLogActivity(true);

  function handleSelectAccount(account: { id: string; name: string }) {
    // Only capture the return view when entering from elsewhere — Customer360Screen
    // also calls this internally for parent/child account links, and in that case
    // view is already "customer360", so capturing it would make Back a no-op.
    if (view !== "customer360") setAccountReturnView(view);
    // Any fresh account open (including a parent/child link to a different
    // account) should start on Overview, not whatever tab a prior visit left.
    setCustomer360InitialTab(undefined);
    setSelectedAccount(account);
    setView("customer360");
  }

  function handleBack360() {
    setSelectedAccount(null);
    setView(accountReturnView);
  }

  // detailTab and customer360Tab are deliberately separate params, not one
  // shared value -- bug fix, 2026-08-19. They were previously conflated into a
  // single `initialTab`, which happened to work only for the stakeholder-bridge
  // flow because OpportunityDetailScreen and Customer360Screen both happen to
  // have a tab literally called "stakeholders". Passing Customer360's own tab
  // id ("opportunities") through the same param for the plain Opportunities-tab
  // click broke that coincidence: OpportunityDetailScreen has no "opportunities"
  // tab, so nothing matched and its content area rendered blank.
  function handleSelectOpportunity(
    opp: PipelineOpportunity | { id: string; name: string },
    detailTab?: string,
    customer360Tab?: string,
  ) {
    setOpportunityReturnView(view);
    // Unconditional (not gated on truthiness) so a future call site that
    // forgets to pass one falls back to Overview, not a stale tab.
    if (view === "customer360") setCustomer360InitialTab(customer360Tab);
    setSelectedOpportunity(opp);
    setSelectedOpportunityInitialTab(detailTab);
    setView("opportunityDetail");
  }

  function handleBackToOpportunities() {
    setSelectedOpportunity(null);
    setView(opportunityReturnView);
  }

  function handleSelectProject(project: { id: string; name: string }) {
    // Project Detail isn't its own top-level view — it lives inside the
    // Accounts view's Projects sub-tab — so opening one from elsewhere means
    // switching there first, then telling that (always-mounted) screen which
    // project to show via projectOpenRef.
    if (view !== "customers") setProjectReturnView(view);
    if (view === "customer360") setCustomer360InitialTab("projects");
    setAccountSubTab("projects");
    setView("customers");
    projectOpenRef.current?.(project);
  }

  function handleBackFromProjectDetail() {
    // Only redirect if this project was opened from outside the Projects
    // list (projectReturnView was left at its "customers" default otherwise).
    // Consumed once so a later direct open-from-list Back doesn't misfire.
    if (projectReturnView !== "customers") {
      const target = projectReturnView;
      setProjectReturnView("customers");
      setView(target);
    }
  }

  function navigate(viewId: string) {
    setView(viewId);
    setSelectedAccount(null);
    setSelectedOpportunity(null);
    setSelectedProject(null);
    setProjectReturnView("customers");
    setIsSidebarOpen(false);
    setProjectDetailMode(false);
    projectResetRef.current?.();
  }

  // Project 360 is a sub-state of "customers" (Account Management), not its
  // own top-level view -- distinguish it here so Help shows the right topic.
  const helpViewId = view === "customers" && projectDetailMode ? "projectDetail" : view;

  return (
    <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", bgcolor: "#f3f4f6", overflow: "hidden", position: "relative" }}>
      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <Backdrop open sx={{ zIndex: 200 }} onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar drawer */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          "@media (min-width:896px)": { left: "calc((100vw - 56rem) / 2)" },
          height: "100%",
          width: 280,
          zIndex: 210,
          overflow: "hidden",
          transition: "box-shadow 300ms ease-in-out",
          boxShadow: isSidebarOpen ? "0 25px 50px -12px rgba(0,0,0,0.25)" : "none",
          pointerEvents: isSidebarOpen ? "auto" : "none",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            bgcolor: "#fff",
            transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 300ms ease-in-out",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Sidebar header */}
          <Box sx={{ p: 2.5, borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#1e3a8a", color: "#fff", flexShrink: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, bgcolor: "#fff", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", p: 0.75, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)" }}>
                <Box component="img" src="/Cabio%20logo.jpeg" alt="Logo" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </Box>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.025em" }}>Sales OS</Typography>
            </Box>
            <IconButton onClick={() => setIsSidebarOpen(false)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff" } }}>
              <Box component="span" sx={{ fontSize: "1.5rem", lineHeight: 1 }}>&times;</Box>
            </IconButton>
          </Box>

          {/* Navigation */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 3, minHeight: 0 }}>
            {NAV_SECTIONS.map((section) => (
              <Box component="section" key={section.title}>
                <Typography component="h3" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em", mb: 1, px: 1 }}>
                  {section.title}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                  {section.items
                    .filter((item) => !item.adminOnly || ADMIN_ROLES.has(userProfile?.role_name))
                    .map((item) => {
                    const isActive =
                      view === item.id ||
                      (item.id === "customers"     && view === "customer360") ||
                      (item.id === "opportunities" && view === "opportunityDetail");
                    return (
                      <Button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        sx={{
                          width: "100%",
                          justifyContent: "flex-start",
                          gap: 1.5,
                          px: 1.75,
                          py: 1,
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          textTransform: "none",
                          transition: "all 0.15s",
                          ...(isActive
                            ? { bgcolor: "#eff6ff", color: "#1d4ed8", boxShadow: SHADOW_SM }
                            : { color: "#6b7280", "&:hover": { bgcolor: "#f9fafb" } }),
                        }}
                      >
                        <Box component="span" sx={{ fontSize: "1.125rem" }}>{item.icon}</Box>
                        {item.label}
                      </Button>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Profile footer */}
          {userProfile && (
            <Box sx={{ p: 2, borderTop: "1px solid #f3f4f6", flexShrink: 0, bgcolor: "#fff" }}>
              <Box sx={{ p: 1.5, background: "linear-gradient(135deg, #1e3a8a, #312e81)", borderRadius: "0.75rem", color: "#fff", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)" }}>
                <Box sx={{ fontSize: "9px", fontWeight: 900, opacity: 0.6, textTransform: "uppercase", mb: 0.25 }}>Logged in as</Box>
                <Box sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1, mb: 0.25, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      bgcolor: "#4ade80",
                      borderRadius: "50%",
                      animation: "demoAppPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      "@keyframes demoAppPulse": {
                        "0%, 100%": { opacity: 1 },
                        "50%": { opacity: 0.5 },
                      },
                    }}
                  />
                  {(userProfile as any).display_name}
                </Box>
                <Box sx={{ fontSize: "9px", opacity: 0.85, lineHeight: "normal", borderTop: "1px solid rgba(255,255,255,0.1)", pt: 0.5, mt: 0.5 }}>
                  <Box>
                    {(userProfile as any).role_name}
                    {(userProfile as any).zone ? ` • ${(userProfile as any).zone.name}` : ""}
                  </Box>
                  {/* BR-OP-12: Admin/GM's sbu_id is a meaningless NOT-NULL placeholder,
                      not a real assignment -- don't display it as if it were one. */}
                  {!ADMIN_ROLES.has((userProfile as any)?.role_name) && (
                    <Box sx={{ fontWeight: 700, color: "#bfdbfe", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "7px", mt: 0.25, bgcolor: "rgba(255,255,255,0.1)", px: 0.5, py: 0.25, borderRadius: "4px", width: "fit-content" }}>
                      SBU: {(userProfile as any).sbu?.name}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Top header */}
      <Box sx={{ bgcolor: "#fff", boxShadow: SHADOW_SM, borderBottom: "1px solid #f3f4f6", zIndex: 100 }}>
        <Box sx={{ maxWidth: "56rem", mx: "auto", width: "100%", px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              onClick={() => setIsSidebarOpen(true)}
              sx={{ width: 40, height: 40, borderRadius: "0.75rem", bgcolor: "#f9fafb", color: "#4b5563", "&:hover": { bgcolor: "#f3f4f6" }, boxShadow: SHADOW_SM }}
            >
              <Box component="span" sx={{ fontSize: "1.25rem" }}>☰</Box>
            </IconButton>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box component="img" src="/Cabio%20logo.jpeg" alt="Logo" sx={{ height: 40, objectFit: "contain" }} />
              <Typography component="h1" sx={{ fontSize: "1.125rem", fontWeight: 900, color: "#1f2937", letterSpacing: "-0.025em", display: { xs: "none", sm: "block" } }}>
                Sales OS
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="contained"
              onClick={() => setShowQuickLead(true)}
              sx={{ px: 1.5, py: 1, fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.05em", bgcolor: "#059669", "&:hover": { bgcolor: "#047857" } }}
            >
              + Lead
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowLogActivity(true)}
              sx={{ px: 1.5, py: 1, fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.05em" }}
            >
              + Log
            </Button>
            {HELP_CONTENT[helpViewId] && (
              <IconButton
                onClick={() => setShowHelp(true)}
                aria-label="Help"
                sx={{ width: 40, height: 40, borderRadius: "0.75rem", bgcolor: "#f9fafb", color: "#4b5563", "&:hover": { bgcolor: "#f3f4f6" }, boxShadow: SHADOW_SM }}
              >
                <Box component="span" sx={{ fontSize: "1rem", fontWeight: 900 }}>?</Box>
              </IconButton>
            )}
            <Button
              onClick={signOut}
              sx={{
                bgcolor: "#f3f4f6",
                color: "#4b5563",
                "&:hover": { bgcolor: "#fef2f2", color: "#dc2626" },
                fontWeight: 900,
                px: 1.25,
                py: 1,
                minWidth: 0,
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Sign Out</Box>
              <Box
                component="svg"
                sx={{ display: { xs: "block", sm: "none" }, width: 16, height: 16 }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </Box>
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", maxWidth: "56rem", mx: "auto", width: "100%" }}>
        <ErrorBoundary>
          {/* Account Management — always mounted, sub-tabbed */}
          <Box sx={{ flex: 1, overflow: "hidden", display: view === "customers" ? "flex" : "none", flexDirection: "column" }}>
            {!projectDetailMode && (
              <>
                <Box sx={{ px: 2, py: 1.5, bgcolor: "#fff", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
                  <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.5rem", color: "#1f2937", letterSpacing: "-0.025em" }}>
                    Account Management
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, bgcolor: "#fff", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
                  <Box sx={{ display: "flex", gap: 1, flex: 1 }}>
                    {[
                      { id: "customers", label: "Customers" },
                      { id: "projects",  label: "Projects" },
                    ].map((tab) => (
                      <Button
                        key={tab.id}
                        onClick={() => { setAccountSubTab(tab.id); setProjectDetailMode(false); }}
                        sx={{
                          px: 2,
                          py: 1,
                          fontSize: "0.75rem",
                          fontWeight: 900,
                          letterSpacing: "0.05em",
                          borderRadius: "0.5rem",
                          ...(accountSubTab === tab.id
                            ? { bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.main" } }
                            : { color: "#9ca3af", "&:hover": { color: "#4b5563", bgcolor: "#f3f4f6" } }),
                        }}
                      >
                        {tab.label}
                      </Button>
                    ))}
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() =>
                      accountSubTab === "customers"
                        ? customerCreateRef.current?.()
                        : projectCreateRef.current?.()
                    }
                    sx={{ px: 2, py: 1, fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.05em", flexShrink: 0 }}
                  >
                    + Add
                  </Button>
                </Box>
              </>
            )}
            <Box sx={{ flex: 1, overflow: "hidden", display: accountSubTab === "customers" ? "flex" : "none", flexDirection: "column" }}>
              <CustomerDirectoryScreen
                onSelectAccount={handleSelectAccount}
                openCreateRef={customerCreateRef}
              />
            </Box>
            <Box sx={{ flex: 1, overflow: "hidden", display: accountSubTab === "projects" ? "flex" : "none", flexDirection: "column" }}>
              <ProjectDirectoryScreen
                onDetailModeChange={setProjectDetailMode}
                openCreateRef={projectCreateRef}
                refreshOppsRef={projectOppsRefreshRef}
                onSelectProject={setSelectedProject}
                openLogActivityRef={openLogActivityRef}
                resetDetailRef={projectResetRef}
                onSelectOpportunity={handleSelectOpportunity}
                openProjectRef={projectOpenRef}
                onDetailBack={handleBackFromProjectDetail}
              />
            </Box>
          </Box>

          {view === "customer360" && selectedAccount && (
            <Customer360Screen
              accountId={selectedAccount.id}
              initialAccount={selectedAccount as any}
              onBack={handleBack360}
              onSelectAccount={handleSelectAccount}
              onSelectOpportunity={handleSelectOpportunity}
              onSelectProject={handleSelectProject}
              initialTab={customer360InitialTab}
            />
          )}

          {/* Opportunity Pipeline */}
          <Box sx={{ flex: 1, overflow: "hidden", display: view === "opportunities" ? "flex" : "none", flexDirection: "column" }}>
            <Box sx={{ px: 2, py: 1.5, bgcolor: "#fff", borderBottom: "1px solid #f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.5rem", color: "#1f2937", letterSpacing: "-0.025em" }}>
                Pipeline
              </Typography>
              <ToggleButtonGroup
                value={pipelineViewMode}
                exclusive
                onChange={(_, value) => { if (value !== null) setPipelineViewMode(value); }}
                sx={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", overflow: "hidden", flexShrink: 0 }}
              >
                {(["kanban", "list"] as const).map((mode) => (
                  <ToggleButton
                    key={mode}
                    value={mode}
                    disableRipple
                    sx={{
                      px: 1.5, py: 0.75, fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
                      border: "none", color: "#9ca3af", bgcolor: "#fff",
                      "&:hover": { bgcolor: "background.default" },
                      "&.Mui-selected": { bgcolor: "primary.main", color: "#fff" },
                      "&.Mui-selected:hover": { bgcolor: "primary.main" },
                    }}
                  >
                    {mode === "kanban" ? "⬛ Kanban" : "☰ List"}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
            <OpportunityPipelineScreen onSelectOpportunity={handleSelectOpportunity} viewMode={pipelineViewMode} />
          </Box>

          {/* Opportunity Detail — push navigation */}
          {view === "opportunityDetail" && selectedOpportunity && (
            <OpportunityDetailScreen
              opportunityId={selectedOpportunity.id}
              initialOpportunity={selectedOpportunity}
              onBack={handleBackToOpportunities}
              onOpportunityUpdate={setSelectedOpportunity}
              initialTab={selectedOpportunityInitialTab as any}
            />
          )}

          {/* Product Catalog — always mounted, hidden when not active */}
          <Box sx={{ flex: 1, overflow: "hidden", display: view === "catalog" ? "flex" : "none", flexDirection: "column" }}>
            <ProductCatalogScreen />
          </Box>

          {/* User Directory — always mounted, hidden when not active; nav entry is Admin/GM-gated */}
          <Box sx={{ flex: 1, overflow: "hidden", display: view === "users" ? "flex" : "none", flexDirection: "column" }}>
            <UserDirectoryScreen />
          </Box>

          {/* Territory Map — always mounted, hidden when not active; nav entry is Admin/GM-gated */}
          <Box sx={{ flex: 1, overflow: "hidden", display: view === "territories" ? "flex" : "none", flexDirection: "column" }}>
            <TerritoryAdminScreen />
          </Box>

          {/* Next Actions — always mounted, hidden when not active */}
          <Box sx={{ flex: 1, overflow: "hidden", display: view === "nextActions" ? "flex" : "none", flexDirection: "column" }}>
            <Box sx={{ px: 2, py: 1.5, bgcolor: "#fff", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.5rem", color: "#1f2937", letterSpacing: "-0.025em" }}>
                Next Actions
              </Typography>
            </Box>
            <NextActionsScreen onSelectAccount={handleSelectAccount} onSelectOpportunity={handleSelectOpportunity} />
          </Box>

          {/* Daily Activity Report — always mounted, hidden when not active; scoped per
              user's own tier (self/team/SBU/everyone), not admin-gated */}
          <Box sx={{ flex: 1, overflow: "hidden", display: view === "dailyActivity" ? "flex" : "none", flexDirection: "column" }}>
            <Box sx={{ px: 2, py: 1.5, bgcolor: "#fff", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.5rem", color: "#1f2937", letterSpacing: "-0.025em" }}>
                Daily Activity Report
              </Typography>
            </Box>
            <DailyActivityReportScreen onSelectAccount={handleSelectAccount} onSelectOpportunity={handleSelectOpportunity} />
          </Box>
        </ErrorBoundary>
      </Box>

      <QuickLeadModal
        isOpen={showQuickLead}
        onClose={() => setShowQuickLead(false)}
        onCreated={() => {
          projectOppsRefreshRef.current?.();
          queryClient.invalidateQueries({ queryKey: ["pipeline"] });
        }}
        sbuId={(userProfile as any)?.sbu?.id}
        initialAccountId={
          view === "customer360" ? selectedAccount?.id :
          view === "opportunityDetail" ? (selectedOpportunity as PipelineOpportunity | null)?.account?.id :
          projectDetailMode ? selectedProject?.account.id :
          undefined
        }
        initialProjectId={projectDetailMode ? selectedProject?.id : undefined}
      />
      <LogActivityModal
        isOpen={showLogActivity}
        onClose={() => setShowLogActivity(false)}
        accountId={
          view === "customer360" ? selectedAccount?.id :
          view === "opportunityDetail" ? (selectedOpportunity as PipelineOpportunity | null)?.account?.id :
          projectDetailMode ? selectedProject?.account.id :
          undefined
        }
        opportunityId={view === "opportunityDetail" ? selectedOpportunity?.id : undefined}
        projectId={projectDetailMode ? selectedProject?.id : undefined}
        projectName={projectDetailMode ? selectedProject?.name : undefined}
        currentUserId={(userProfile as any)?.id}
      />
      <HelpDrawer isOpen={showHelp} onClose={() => setShowHelp(false)} viewId={helpViewId} />
    </Box>
  );
}
