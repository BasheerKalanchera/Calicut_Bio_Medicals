import { useEffect, useState, useCallback, useRef } from "react";
import {
  getAccount,
  getAccountCounts,
  updateAccount,
  listStakeholders,
  createStakeholder,
  updateStakeholder,
  listProjects,
  createProject,
  updateProject,
  listOpportunities,
  createOpportunity,
  updateOpportunity,
  listOpportunityItems,
  addOpportunityItem,
  deleteOpportunityItem,
  listInstalledAssets,
  createInstalledAsset,
  updateInstalledAsset,
} from "../services/accounts";
import {
  listZones,
  listProjectStatuses,
  listLeadSources,
  listStages,
  listStatuses,
  listUsers,
} from "../services/masterData";
import { listProducts } from "../services/products";
import { useAuth } from "../contexts/AuthContext";
import FormModal from "../components/FormModal";
import ActivityTimeline from "../components/ActivityTimeline";
import LogActivityModal from "../components/LogActivityModal";

interface Props {
  accountId: string;
  initialAccount?: any;
  onBack: () => void;
  onAccountUpdate?: (account: any) => void;
}

const TABS = [
  { id: "overview",      label: "Overview" },
  { id: "stakeholders",  label: "Stakeholders" },
  { id: "projects",      label: "Projects" },
  { id: "opportunities", label: "Opportunities" },
  { id: "installed",     label: "Installed Base" },
  { id: "activity",      label: "Activity" },
];

// ---------------------------------------------------------------------------
// Module-level SWR cache for tab data — keyed by accountId, persists across
// Customer360Screen mounts so revisiting a customer shows all tabs instantly.
// ---------------------------------------------------------------------------
const TAB_CACHE_TTL_MS = 30_000;
const tabDataCache = new Map<string, { data: any; fetchedAt: number }>();
const accountDataCache = new Map<string, { data: any; fetchedAt: number }>();

function getTabCached(accountId: string, tab: string): any | null {
  const key = `${accountId}:${tab}`;
  const entry = tabDataCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TAB_CACHE_TTL_MS) {
    tabDataCache.delete(key);
    return null;
  }
  return entry.data;
}

function setTabCache(accountId: string, tab: string, data: any) {
  tabDataCache.set(`${accountId}:${tab}`, { data, fetchedAt: Date.now() });
}

function getCachedAccount(accountId: string): any | null {
  const entry = accountDataCache.get(accountId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TAB_CACHE_TTL_MS) {
    accountDataCache.delete(accountId);
    return null;
  }
  return entry.data;
}

function setCachedAccount(accountId: string, data: any) {
  accountDataCache.set(accountId, { data, fetchedAt: Date.now() });
}

// ---------------------------------------------------------------------------
// Small presentational components
// ---------------------------------------------------------------------------
function PayerBadge({ behavior }: { behavior?: string | null }) {
  if (!behavior) return null;
  const styles: Record<string, string> = {
    GOOD:        "bg-emerald-50 text-emerald-700 border-emerald-200",
    PROBLEMATIC: "bg-red-50 text-red-700 border-red-200",
    UNKNOWN:     "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${styles[behavior] ?? styles.UNKNOWN}`}>
      {behavior}
    </span>
  );
}

function SentimentBadge({ sentiment }: { sentiment?: string | null }) {
  if (!sentiment) return null;
  const config: Record<string, { label: string; cls: string }> = {
    PROMOTER:  { label: "Promoter",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    NEUTRAL:   { label: "Neutral",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
    DETRACTOR: { label: "Detractor", cls: "bg-red-50 text-red-700 border-red-200" },
  };
  const { label, cls } = config[sentiment] ?? { label: sentiment, cls: "bg-gray-50 text-gray-600 border-gray-200" };
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${cls}`}>{label}</span>;
}

function NpsIndicator({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-gray-300 text-xs">—</span>;
  const color = score >= 50 ? "text-emerald-600" : score >= 0 ? "text-amber-600" : "text-red-600";
  return <span className={`font-black text-lg ${color}`}>{score}</span>;
}

// ---------------------------------------------------------------------------
// Tab components
// ---------------------------------------------------------------------------
function OverviewTab({ account, onEdit }: { account: any; onEdit: () => void }) {
  const fields = [
    { label: "Account Name",    value: account.name },
    { label: "Zone",            value: account.zone?.name || "—" },
    { label: "Payer Behavior",  value: <PayerBadge behavior={account.payer_behavior} /> },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Account Details</h4>
          <button onClick={onEdit} className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider">
            Edit
          </button>
        </div>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.label}>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{f.label}</div>
              <div className="font-bold text-gray-800">{f.value || "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StakeholdersTab({ stakeholders, onAdd, onEdit }: { stakeholders: any[]; onAdd: () => void; onEdit: (s: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stakeholders ({stakeholders.length})</h4>
        <button onClick={onAdd} className="px-3 py-1.5 rounded-xl text-xs font-black text-violet-600 bg-violet-50 hover:bg-violet-100 transition-all uppercase tracking-wider">+ Add</button>
      </div>
      {stakeholders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">No stakeholders found for this account.</div>
      ) : (
        stakeholders.map((s) => (
          <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center font-black text-sm shadow-sm">
                {s.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-gray-800">{s.name}</div>
                {s.designation && <div className="text-xs text-gray-500 mt-0.5">{s.designation}</div>}
                <div className="flex items-center gap-2 mt-1"><SentimentBadge sentiment={s.sentiment} /></div>
                {(s.email || s.phone) && (
                  <div className="flex items-center gap-3 mt-1">
                    {s.email && <span className="text-[10px] text-gray-400">{s.email}</span>}
                    {s.phone && <span className="text-[10px] text-gray-400">{s.phone}</span>}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">NPS</div>
                <NpsIndicator score={s.nps_score} />
              </div>
              <button onClick={() => onEdit(s)} className="px-3 py-1.5 rounded-xl text-xs font-black text-violet-600 bg-violet-50 hover:bg-violet-100 transition-all uppercase tracking-wider">Edit</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ProjectsTab({ projects, onAdd, onEdit }: { projects: any[]; onAdd: () => void; onEdit: (p: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Projects ({projects.length})</h4>
        <button onClick={onAdd} className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider">+ Add</button>
      </div>
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">No projects found for this account.</div>
      ) : (
        projects.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-gray-800">{p.name}</div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-blue-50 text-blue-700 border-blue-200">{p.status.status_name}</span>
                <button onClick={() => onEdit(p)} className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider">Edit</button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <div><span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">Owner: </span><span className="font-bold">{p.owner.display_name}</span></div>
              {p.bid_submission_date && <div><span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">Bid Date: </span><span className="font-bold">{p.bid_submission_date}</span></div>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function OpportunitiesTab({ opportunities, onAdd, onEdit }: { opportunities: any[]; onAdd: () => void; onEdit: (o: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Opportunities ({opportunities.length})</h4>
        <button onClick={onAdd} className="px-3 py-1.5 rounded-xl text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all uppercase tracking-wider">+ Add</button>
      </div>
      {opportunities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">No opportunities found for this account.</div>
      ) : (
        opportunities.map((o) => (
          <div key={o.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-gray-800">{o.name}</div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-amber-50 text-amber-700 border-amber-200">{o.stage.stage_name}</span>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-blue-50 text-blue-700 border-blue-200">{o.status.status_name}</span>
                <button onClick={() => onEdit(o)} className="px-3 py-1.5 rounded-xl text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all uppercase tracking-wider">Edit</button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <div><span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">Owner: </span><span className="font-bold">{o.owner.display_name}</span></div>
              <div>
                <span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">Win %: </span>
                <span className={`font-black ${Number(o.win_probability) >= 70 ? "text-emerald-600" : Number(o.win_probability) >= 40 ? "text-amber-600" : "text-red-600"}`}>
                  {o.win_probability}%
                </span>
              </div>
              {o.indicative_value && <div><span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">Value: </span><span className="font-bold">{o.indicative_value}L</span></div>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function InstalledBaseTab({ assets, onAdd, onEdit }: { assets: any[]; onAdd: () => void; onEdit: (a: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Installed Base ({assets.length})</h4>
        <button onClick={onAdd} className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider">+ Add</button>
      </div>
      {assets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">No installed assets found for this account.</div>
      ) : (
        assets.map((a) => {
          const productName = a.is_competitor_equipment ? a.competitor_product_name || "Unknown Competitor" : a.product?.name || "Unknown Product";
          const modelInfo   = !a.is_competitor_equipment && a.product?.model_number ? a.product.model_number : null;
          const oemInfo     = !a.is_competitor_equipment && a.product?.oem_name ? a.product.oem_name : null;
          return (
            <div key={a.id} className={`bg-white p-4 rounded-2xl shadow-sm border ${a.is_competitor_equipment ? "border-red-200" : "border-gray-100"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-gray-800">{productName}</div>
                  {a.is_competitor_equipment && <span className="px-2 py-0.5 rounded-md text-[10px] font-black border bg-red-50 text-red-600 border-red-200">COMPETITOR</span>}
                </div>
                <button onClick={() => onEdit(a)} className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider">Edit</button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                {oemInfo  && <div><span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">OEM: </span><span className="font-bold">{oemInfo}</span></div>}
                {modelInfo && <div><span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">Model: </span><span className="font-bold">{modelInfo}</span></div>}
                {a.department && <div><span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">Dept: </span><span className="font-bold">{a.department}</span></div>}
                {a.installation_date && <div><span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">Installed: </span><span className="font-bold">{a.installation_date}</span></div>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function Customer360Screen({ accountId, initialAccount = null, onBack, onAccountUpdate }: Props) {
  const { userProfile } = useAuth();
  const [account, setAccount]                             = useState<any>(() => getCachedAccount(accountId) || initialAccount);
  const [stakeholders, setStakeholders]                   = useState<any[]>([]);
  const [projects, setProjects]                           = useState<any[]>([]);
  const [opportunities, setOpportunities]                 = useState<any[]>([]);
  const [installed, setInstalled]                         = useState<any[]>([]);
  const [loading, setLoading]                             = useState(!initialAccount);
  const [stakeholdersLoading, setStakeholdersLoading]     = useState(true);
  const [projectsLoading, setProjectsLoading]             = useState(true);
  const [opportunitiesLoading, setOpportunitiesLoading]   = useState(true);
  const [installedLoading, setInstalledLoading]           = useState(true);
  const [error, setError]                                 = useState<string | null>(null);
  const [activeTab, setActiveTab]                         = useState("overview");

  // Activity tab
  const [showLogActivity, setShowLogActivity]             = useState(false);

  // Edit Account
  const [showEditAccount, setShowEditAccount]             = useState(false);
  const [zones, setZones]                                 = useState<any[]>([]);
  const [editAccountName, setEditAccountName]             = useState("");
  const [editAccountZoneId, setEditAccountZoneId]         = useState("");
  const [editAccountPayer, setEditAccountPayer]           = useState("");

  // Stakeholders
  const [showCreateStakeholder, setShowCreateStakeholder] = useState(false);
  const [newSName, setNewSName]                           = useState("");
  const [newSDesignation, setNewSDesignation]             = useState("");
  const [newSEmail, setNewSEmail]                         = useState("");
  const [newSPhone, setNewSPhone]                         = useState("");
  const [newSNps, setNewSNps]                             = useState("");
  const [newSSentiment, setNewSSentiment]                 = useState("");
  const [editingStakeholder, setEditingStakeholder]       = useState<any | null>(null);
  const [editSName, setEditSName]                         = useState("");
  const [editSDesignation, setEditSDesignation]           = useState("");
  const [editSEmail, setEditSEmail]                       = useState("");
  const [editSPhone, setEditSPhone]                       = useState("");
  const [editSNps, setEditSNps]                           = useState("");
  const [editSSentiment, setEditSSentiment]               = useState("");

  // Master data (lazy-loaded for modal dropdowns)
  const [projectStatuses, setProjectStatuses]             = useState<any[]>([]);
  const [stages, setStages]                               = useState<any[]>([]);
  const [oppStatuses, setOppStatuses]                     = useState<any[]>([]);
  const [leadSources, setLeadSources]                     = useState<any[]>([]);
  const [users, setUsers]                                 = useState<any[]>([]);
  const [products, setProducts]                           = useState<any[]>([]);

  // Projects
  const [showCreateProject, setShowCreateProject]         = useState(false);
  const [newPName, setNewPName]                           = useState("");
  const [newPStatusId, setNewPStatusId]                   = useState("");
  const [newPOwnerId, setNewPOwnerId]                     = useState("");
  const [newPBidDate, setNewPBidDate]                     = useState("");
  const [editingProject, setEditingProject]               = useState<any | null>(null);
  const [editPName, setEditPName]                         = useState("");
  const [editPStatusId, setEditPStatusId]                 = useState("");
  const [editPOwnerId, setEditPOwnerId]                   = useState("");
  const [editPBidDate, setEditPBidDate]                   = useState("");

  // Opportunities
  const [showCreateOpp, setShowCreateOpp]                 = useState(false);
  const [showNewOppItems, setShowNewOppItems]             = useState(false);
  const [newOName, setNewOName]                           = useState("");
  const [newOProjectId, setNewOProjectId]                 = useState("");
  const [newOStageId, setNewOStageId]                     = useState("");
  const [newOStatusId, setNewOStatusId]                   = useState("");
  const [newOLeadSourceId, setNewOLeadSourceId]           = useState("");
  const [newOOwnerId, setNewOOwnerId]                     = useState("");
  const [newOWinProb, setNewOWinProb]                     = useState("");
  const [newOValue, setNewOValue]                         = useState("");
  const [newOItems, setNewOItems]                         = useState<any[]>([]);
  const [newOItemProdId, setNewOItemProdId]               = useState("");
  const [newOItemQty, setNewOItemQty]                     = useState("1");
  const [newOItemPrice, setNewOItemPrice]                 = useState("");
  const [newOItemDisc, setNewOItemDisc]                   = useState("0");
  const [editingOpp, setEditingOpp]                       = useState<any | null>(null);
  const [showEditOppItems, setShowEditOppItems]           = useState(false);
  const [editOName, setEditOName]                         = useState("");
  const [editOProjectId, setEditOProjectId]               = useState("");
  const [editOStageId, setEditOStageId]                   = useState("");
  const [editOStatusId, setEditOStatusId]                 = useState("");
  const [editOLeadSourceId, setEditOLeadSourceId]         = useState("");
  const [editOOwnerId, setEditOOwnerId]                   = useState("");
  const [editOWinProb, setEditOWinProb]                   = useState("");
  const [editOValue, setEditOValue]                       = useState("");
  const [editOItems, setEditOItems]                       = useState<any[]>([]);
  const [editOOriginalItemIds, setEditOOriginalItemIds]   = useState<string[]>([]);
  const [editOItemProdId, setEditOItemProdId]             = useState("");
  const [editOItemQty, setEditOItemQty]                   = useState("1");
  const [editOItemPrice, setEditOItemPrice]               = useState("");
  const [editOItemDisc, setEditOItemDisc]                 = useState("0");

  // Installed assets
  const [showCreateAsset, setShowCreateAsset]             = useState(false);
  const [newAIsCompetitor, setNewAIsCompetitor]           = useState(false);
  const [newAProductId, setNewAProductId]                 = useState("");
  const [newACompetitorName, setNewACompetitorName]       = useState("");
  const [newAInstallDate, setNewAInstallDate]             = useState("");
  const [newADepartment, setNewADepartment]               = useState("");
  const [editingAsset, setEditingAsset]                   = useState<any | null>(null);
  const [editAIsCompetitor, setEditAIsCompetitor]         = useState(false);
  const [editAProductId, setEditAProductId]               = useState("");
  const [editACompetitorName, setEditACompetitorName]     = useState("");
  const [editAInstallDate, setEditAInstallDate]           = useState("");
  const [editADepartment, setEditADepartment]             = useState("");

  const chipBarRef   = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setTimeout(() => {
      const container = chipBarRef.current;
      if (container) {
        const chip = container.querySelector(`[data-tab="${tabId}"]`) as HTMLElement | null;
        if (chip) {
          const scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
          container.scrollTo({ left: scrollLeft, behavior: "smooth" });
        }
      }
    }, 50);
  }, []);

  // Auto-calc opportunity value from items
  useEffect(() => {
    if (newOItems.length > 0) {
      setNewOValue(newOItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2));
    } else { setNewOValue(""); }
  }, [newOItems]);

  useEffect(() => {
    if (editOItems.length > 0) {
      setEditOValue(editOItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2));
    }
  }, [editOItems]);

  const loadAccount = useCallback(() => {
    if (!initialAccount) setLoading(true);
    setError(null);

    const cachedStakeholders  = getTabCached(accountId, "stakeholders");
    const cachedProjects       = getTabCached(accountId, "projects");
    const cachedOpportunities  = getTabCached(accountId, "opportunities");
    const cachedInstalled      = getTabCached(accountId, "installed");

    if (cachedStakeholders)  setStakeholders(cachedStakeholders);
    if (cachedProjects)      setProjects(cachedProjects);
    if (cachedOpportunities) setOpportunities(cachedOpportunities);
    if (cachedInstalled)     setInstalled(cachedInstalled);

    setStakeholdersLoading(!cachedStakeholders);
    setProjectsLoading(!cachedProjects);
    setOpportunitiesLoading(!cachedOpportunities);
    setInstalledLoading(!cachedInstalled);

    getAccount(accountId as any)
      .then((data: any) => { setAccount(data); setCachedAccount(accountId, data); onAccountUpdate?.(data); setLoading(false); })
      .catch((err: any) => { if (!initialAccount) { setError(err.message || "Failed to load account"); setLoading(false); } });

    if (initialAccount?.stakeholder_count == null) {
      getAccountCounts([accountId] as any)
        .then((countMap: any) => {
          if (!isMountedRef.current) return;
          const c = countMap[accountId] || {};
          setAccount((prev: any) => (prev ? { ...prev, ...c } : prev));
        })
        .catch(() => {});
    }

    listStakeholders(accountId as any).then((d: any) => { setStakeholders(d); setTabCache(accountId, "stakeholders", d); }).catch(() => {}).finally(() => setStakeholdersLoading(false));
    listProjects(accountId as any).then((d: any) => { setProjects(d); setTabCache(accountId, "projects", d); }).catch(() => {}).finally(() => setProjectsLoading(false));
    listOpportunities(accountId as any).then((d: any) => { setOpportunities(d); setTabCache(accountId, "opportunities", d); }).catch(() => {}).finally(() => setOpportunitiesLoading(false));
    listInstalledAssets(accountId as any).then((d: any) => { setInstalled(d); setTabCache(accountId, "installed", d); }).catch(() => {}).finally(() => setInstalledLoading(false));
  }, [accountId, initialAccount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadAccount(); }, [loadAccount]);

  // --- Loading / error states ---
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50">
        <div className="text-center py-12"><div className="text-gray-400 font-bold text-sm animate-pulse">Loading Customer 360...</div></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider">&larr; Back</button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadAccount} className="ml-4 shrink-0 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all">Retry</button>
        </div>
      </div>
    );
  }

  // --- Modal helpers ---
  const loadProjectMD = async () => {
    const loads: Promise<any>[] = [];
    if (projectStatuses.length === 0) loads.push(listProjectStatuses().then((d: any) => setProjectStatuses(d)).catch(() => {}));
    if (users.length === 0) loads.push(listUsers().then((d: any) => setUsers(d)).catch(() => {}));
    await Promise.all(loads);
  };

  const loadOppMD = async () => {
    const loads: Promise<any>[] = [];
    if (stages.length === 0) loads.push(listStages().then((d: any) => setStages(d)).catch(() => {}));
    if (oppStatuses.length === 0) loads.push(listStatuses().then((d: any) => setOppStatuses(d)).catch(() => {}));
    if (leadSources.length === 0) loads.push(listLeadSources().then((d: any) => setLeadSources(d)).catch(() => {}));
    if (users.length === 0) loads.push(listUsers().then((d: any) => setUsers(d)).catch(() => {}));
    if (products.length === 0) loads.push(listProducts({ page_size: 100, sbu_id: (userProfile as any)?.sbu?.id } as any).then((d: any) => setProducts(d.items || [])).catch(() => {}));
    await Promise.all(loads);
  };

  const loadProductsMD = async () => {
    if (products.length === 0) {
      await listProducts({ page_size: 100, sbu_id: (userProfile as any)?.sbu?.id } as any).then((d: any) => setProducts(d.items || [])).catch(() => {});
    }
  };

  // Edit account
  const openEditAccount = async () => {
    setEditAccountName(account.name || "");
    setEditAccountZoneId(account.zone?.id || "");
    setEditAccountPayer(account.payer_behavior || "");
    setShowEditAccount(true);
    if (zones.length === 0) { try { const d: any = await listZones(); setZones(d.items || d); } catch {} }
  };

  const handleUpdateAccount = async () => {
    if (!editAccountName.trim()) throw new Error("Customer name is required");
    if (!editAccountZoneId) throw new Error("Zone is required");
    const payload: any = { name: editAccountName.trim(), zone_id: editAccountZoneId };
    if (editAccountPayer) payload.payer_behavior = editAccountPayer;
    await updateAccount(accountId as any, payload);
    getAccount(accountId as any).then((d: any) => { setAccount(d); setCachedAccount(accountId, d); onAccountUpdate?.(d); }).catch(() => {});
  };

  // Stakeholder
  const openCreateStakeholder = () => {
    setNewSName(""); setNewSDesignation(""); setNewSEmail(""); setNewSPhone(""); setNewSNps(""); setNewSSentiment("");
    setShowCreateStakeholder(true);
  };

  const handleCreateStakeholder = async () => {
    if (!newSName.trim()) throw new Error("Stakeholder name is required");
    const payload: any = { name: newSName.trim() };
    if (newSDesignation.trim()) payload.designation = newSDesignation.trim();
    if (newSEmail.trim()) payload.email = newSEmail.trim();
    if (newSPhone.trim()) payload.phone = newSPhone.trim();
    if (newSNps !== "") payload.nps_score = Number(newSNps);
    if (newSSentiment) payload.sentiment = newSSentiment;
    await createStakeholder(accountId as any, payload);
    listStakeholders(accountId as any).then((d: any) => { setStakeholders(d); setTabCache(accountId, "stakeholders", d); }).catch(() => {});
    getAccount(accountId as any).then((d: any) => { setAccount(d); setCachedAccount(accountId, d); onAccountUpdate?.(d); }).catch(() => {});
  };

  const openEditStakeholder = (s: any) => {
    setEditingStakeholder(s);
    setEditSName(s.name || ""); setEditSDesignation(s.designation || "");
    setEditSEmail(s.email || ""); setEditSPhone(s.phone || "");
    setEditSNps(s.nps_score != null ? String(s.nps_score) : ""); setEditSSentiment(s.sentiment || "");
  };

  const handleUpdateStakeholder = async () => {
    if (!editSName.trim()) throw new Error("Stakeholder name is required");
    const payload: any = { name: editSName.trim(), designation: editSDesignation.trim() || null, email: editSEmail.trim() || null, phone: editSPhone.trim() || null };
    if (editSNps !== "") payload.nps_score = Number(editSNps);
    if (editSSentiment) payload.sentiment = editSSentiment;
    await updateStakeholder(editingStakeholder.id, payload);
    listStakeholders(accountId as any).then((d: any) => { setStakeholders(d); setTabCache(accountId, "stakeholders", d); }).catch(() => {});
  };

  // Projects
  const openCreateProject = async () => {
    setNewPName(""); setNewPStatusId(""); setNewPOwnerId(""); setNewPBidDate("");
    setShowCreateProject(true);
    await loadProjectMD();
  };

  const handleCreateProject = async () => {
    if (!newPName.trim()) throw new Error("Project name is required");
    if (!newPOwnerId) throw new Error("Owner is required");
    if (!newPStatusId) throw new Error("Status is required");
    const payload: any = { name: newPName.trim(), owner_id: newPOwnerId, status_id: newPStatusId };
    if (newPBidDate) payload.bid_submission_date = newPBidDate;
    await createProject(accountId as any, payload);
    listProjects(accountId as any).then((d: any) => { setProjects(d); setTabCache(accountId, "projects", d); }).catch(() => {});
    getAccount(accountId as any).then((d: any) => { setAccount(d); setCachedAccount(accountId, d); onAccountUpdate?.(d); }).catch(() => {});
  };

  const openEditProject = async (p: any) => {
    setEditingProject(p); setEditPName(p.name || ""); setEditPStatusId(p.status?.id || "");
    setEditPOwnerId(p.owner?.id || ""); setEditPBidDate(p.bid_submission_date || "");
    await loadProjectMD();
  };

  const handleUpdateProject = async () => {
    if (!editPName.trim()) throw new Error("Project name is required");
    const payload: any = { name: editPName.trim(), owner_id: editPOwnerId || undefined, status_id: editPStatusId || undefined };
    if (editPBidDate) payload.bid_submission_date = editPBidDate;
    await updateProject(editingProject.id, payload);
    listProjects(accountId as any).then((d: any) => { setProjects(d); setTabCache(accountId, "projects", d); }).catch(() => {});
  };

  // Opportunities
  const openCreateOpp = async () => {
    setNewOName(""); setNewOProjectId(""); setNewOStageId(""); setNewOStatusId(""); setNewOLeadSourceId("");
    setNewOOwnerId(""); setNewOWinProb(""); setNewOValue(""); setNewOItems([]);
    setNewOItemProdId(""); setNewOItemQty("1"); setNewOItemPrice(""); setNewOItemDisc("0");
    setShowCreateOpp(true);
    await loadOppMD();
  };

  const handleCreateOpp = async () => {
    if (!newOName.trim()) throw new Error("Opportunity name is required");
    if (!newOOwnerId) throw new Error("Owner is required");
    if (!newOStageId) throw new Error("Stage is required");
    if (!newOStatusId) throw new Error("Status is required");
    if (newOWinProb === "") throw new Error("Win probability is required");
    const _stage = stages.find((s: any) => s.id === newOStageId);
    const _qual  = stages.find((s: any) => s.stage_code === "QUALIFIED");
    if (_stage && _qual && _stage.display_order >= _qual.display_order && newOValue === "") {
      throw new Error("Indicative value is required for Qualified stage and above");
    }
    const payload: any = { name: newOName.trim(), owner_id: newOOwnerId, stage_id: newOStageId, status_id: newOStatusId, win_probability: Number(newOWinProb) };
    if (newOProjectId) payload.project_id = newOProjectId;
    if (newOLeadSourceId) payload.lead_source_id = newOLeadSourceId;
    if (newOValue !== "") payload.indicative_value = Number(newOValue);
    if (newOItems.length > 0) payload.items = newOItems.map((i: any) => ({ product_id: i.product_id, quantity: i.quantity, unit_price_lakhs: i.unit_price_lakhs, discount_lakhs: i.discount_lakhs }));
    await createOpportunity(accountId as any, payload);
    listOpportunities(accountId as any).then((d: any) => { setOpportunities(d); setTabCache(accountId, "opportunities", d); }).catch(() => {});
    getAccount(accountId as any).then((d: any) => { setAccount(d); setCachedAccount(accountId, d); onAccountUpdate?.(d); }).catch(() => {});
  };

  const openEditOpp = async (o: any) => {
    setEditingOpp(o); setEditOName(o.name || ""); setEditOProjectId(o.project_id || "");
    setEditOStageId(o.stage?.id || ""); setEditOStatusId(o.status?.id || "");
    setEditOLeadSourceId(o.lead_source_id || ""); setEditOOwnerId(o.owner?.id || "");
    setEditOWinProb(o.win_probability != null ? String(o.win_probability) : "");
    setEditOValue(o.indicative_value != null ? String(o.indicative_value) : "");
    setEditOItems([]); setEditOOriginalItemIds([]);
    setEditOItemProdId(""); setEditOItemQty("1"); setEditOItemPrice(""); setEditOItemDisc("0");
    await Promise.all([
      loadOppMD(),
      listOpportunityItems(o.id).then((items: any) => {
        const mapped = items.map((i: any) => ({ id: i.id, product_id: i.product_id, product_name: i.product?.name || "", quantity: i.quantity, unit_price_lakhs: Number(i.unit_price_lakhs), discount_lakhs: Number(i.discount_lakhs) }));
        setEditOItems(mapped); setEditOOriginalItemIds(mapped.map((i: any) => i.id));
      }).catch(() => {}),
    ]);
  };

  const handleUpdateOpp = async () => {
    if (!editOName.trim()) throw new Error("Opportunity name is required");
    const _editStage = stages.find((s: any) => s.id === editOStageId);
    const _qualStage = stages.find((s: any) => s.stage_code === "QUALIFIED");
    if (_editStage && _qualStage && _editStage.display_order >= _qualStage.display_order && editOValue === "") {
      throw new Error("Indicative value is required for Qualified stage and above");
    }
    const payload: any = {
      name: editOName.trim(), owner_id: editOOwnerId || undefined,
      stage_id: editOStageId || undefined, status_id: editOStatusId || undefined,
      win_probability: editOWinProb !== "" ? Number(editOWinProb) : undefined,
      lead_source_id: editOLeadSourceId || null,
      indicative_value: editOValue !== "" ? Number(editOValue) : null,
    };
    if (editOProjectId) payload.project_id = editOProjectId;
    await updateOpportunity(editingOpp.id, payload);
    const currentIds = editOItems.filter((i: any) => i.id).map((i: any) => i.id);
    const toDelete   = editOOriginalItemIds.filter((id) => !currentIds.includes(id));
    const toAdd      = editOItems.filter((i: any) => !i.id);
    await Promise.all([
      ...toDelete.map((id) => deleteOpportunityItem(id as any).catch(() => {})),
      ...toAdd.map((i: any) => addOpportunityItem(editingOpp.id, { product_id: i.product_id, quantity: i.quantity, unit_price_lakhs: i.unit_price_lakhs, discount_lakhs: i.discount_lakhs }).catch(() => {})),
    ]);
    listOpportunities(accountId as any).then((d: any) => { setOpportunities(d); setTabCache(accountId, "opportunities", d); }).catch(() => {});
  };

  // Installed assets
  const openCreateAsset = async () => {
    setNewAIsCompetitor(false); setNewAProductId(""); setNewACompetitorName(""); setNewAInstallDate(""); setNewADepartment("");
    setShowCreateAsset(true);
    await loadProductsMD();
  };

  const handleCreateAsset = async () => {
    if (!newAIsCompetitor && !newAProductId) throw new Error("Product is required");
    const payload: any = { is_competitor_equipment: newAIsCompetitor, installation_date: newAInstallDate || null, department: newADepartment.trim() || null };
    if (newAIsCompetitor) { payload.competitor_product_name = newACompetitorName.trim() || null; } else { payload.product_id = newAProductId; }
    await createInstalledAsset(accountId as any, payload);
    listInstalledAssets(accountId as any).then((d: any) => { setInstalled(d); setTabCache(accountId, "installed", d); }).catch(() => {});
  };

  const openEditAsset = async (a: any) => {
    setEditingAsset(a); setEditAIsCompetitor(a.is_competitor_equipment);
    setEditAProductId(a.product?.id || ""); setEditACompetitorName(a.competitor_product_name || "");
    setEditAInstallDate(a.installation_date || ""); setEditADepartment(a.department || "");
    await loadProductsMD();
  };

  const handleUpdateAsset = async () => {
    if (!editAIsCompetitor && !editAProductId) throw new Error("Product is required");
    const payload: any = { is_competitor_equipment: editAIsCompetitor, installation_date: editAInstallDate || null, department: editADepartment.trim() || null };
    if (editAIsCompetitor) { payload.competitor_product_name = editACompetitorName.trim() || null; payload.product_id = null; }
    else { payload.product_id = editAProductId; payload.competitor_product_name = null; }
    await updateInstalledAsset(editingAsset.id, payload);
    listInstalledAssets(accountId as any).then((d: any) => { setInstalled(d); setTabCache(accountId, "installed", d); }).catch(() => {});
  };

  // Shared style constants
  const lbl = "block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1";
  const inp = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium";

  // Helper: render the add-product sub-form row
  const OppItemAddRow = ({ prodId, setProdId, qty, setQty, price, setPrice, disc, setDisc, items, setItems }: any) => (
    <div className="border-t border-gray-100 pt-3 space-y-2">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Add Product</div>
      <select value={prodId} onChange={(e) => setProdId(e.target.value)} className={inp}><option value="">Select product</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <div className="flex gap-2">
        {([["Qty", qty, setQty, "1"], ["Price (₹L)", price, setPrice, "0", "any"], ["Disc (₹L)", disc, setDisc, "0", "any"]] as any[]).map(([label, val, setVal, min, step]: any) => (
          <div key={label} className="w-20"><label className={lbl}>{label}</label><input type="number" value={val} min={min} step={step} onChange={(e) => setVal(e.target.value)} className={inp} /></div>
        ))}
      </div>
      <button type="button" onClick={() => {
        if (!prodId || !qty || !price) return;
        const prod: any = products.find((p: any) => p.id === prodId);
        setItems([...items, { product_id: prodId, product_name: prod?.name || "", quantity: Number(qty), unit_price_lakhs: Number(price), discount_lakhs: Number(disc || 0) }]);
        setProdId(""); setQty("1"); setPrice(""); setDisc("0");
      }} className="w-full py-2 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider">+ Add Product</button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 animate-in fade-in duration-200">
      {/* Fixed header */}
      <div className="px-4 pt-4 bg-gray-50">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:bg-gray-200 transition-all shrink-0" aria-label="Back">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-xl text-gray-800 tracking-tight leading-tight">{account.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {account.zone && <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black border bg-teal-50 text-teal-700 border-teal-200">{account.zone.name}</span>}
              <PayerBadge behavior={account.payer_behavior} />
            </div>
          </div>
        </div>

        {/* Count strip */}
        <div className="flex items-center justify-around bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 mb-4">
          <div className="text-center"><div className="text-xl font-black text-violet-600">{account.stakeholder_count ?? "—"}</div><div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">Stakeholders</div></div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center"><div className="text-xl font-black text-blue-600">{account.project_count ?? "—"}</div><div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">Projects</div></div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center"><div className="text-xl font-black text-emerald-600">{account.opportunity_count ?? "—"}</div><div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">Opportunities</div></div>
        </div>

        {/* Tab chip bar */}
        <div className="relative mb-4">
          <div ref={chipBarRef} className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", paddingRight: "50vw" }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} data-tab={tab.id} onClick={() => handleTabChange(tab.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 border focus:outline-none active:scale-95 ${isActive ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"}`}>
                  {isActive && <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="absolute right-0 top-0 h-full w-10 pointer-events-none" style={{ background: "linear-gradient(to left, #f9fafb, transparent)" }} />
        </div>
      </div>

      {/* Scrollable tab content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        {activeTab === "overview"      && <OverviewTab account={account} onEdit={openEditAccount} />}
        {activeTab === "stakeholders"  && (stakeholdersLoading  ? <div className="text-center py-12"><div className="text-gray-400 font-bold text-sm animate-pulse">Loading...</div></div> : <StakeholdersTab  stakeholders={stakeholders}   onAdd={openCreateStakeholder}  onEdit={openEditStakeholder} />)}
        {activeTab === "projects"      && (projectsLoading       ? <div className="text-center py-12"><div className="text-gray-400 font-bold text-sm animate-pulse">Loading...</div></div> : <ProjectsTab      projects={projects}           onAdd={openCreateProject}      onEdit={openEditProject} />)}
        {activeTab === "opportunities" && (opportunitiesLoading  ? <div className="text-center py-12"><div className="text-gray-400 font-bold text-sm animate-pulse">Loading...</div></div> : <OpportunitiesTab opportunities={opportunities} onAdd={openCreateOpp}          onEdit={openEditOpp} />)}
        {activeTab === "installed"     && (installedLoading      ? <div className="text-center py-12"><div className="text-gray-400 font-bold text-sm animate-pulse">Loading...</div></div> : <InstalledBaseTab assets={installed}           onAdd={openCreateAsset}        onEdit={openEditAsset} />)}
        {activeTab === "activity"      && (
          <ActivityTimeline accountId={accountId} onLogActivity={() => setShowLogActivity(true)} />
        )}
      </div>

      {/* ---- Modals ---- */}

      {/* Edit Account */}
      <FormModal isOpen={showEditAccount} onClose={() => setShowEditAccount(false)} title="Edit Customer" onSubmit={handleUpdateAccount}>
        <div><label className={lbl}>Name *</label><input type="text" value={editAccountName} onChange={(e) => setEditAccountName(e.target.value)} className={inp} autoFocus /></div>
        <div><label className={lbl}>Zone *</label>
          <select value={editAccountZoneId} onChange={(e) => setEditAccountZoneId(e.target.value)} className={inp}>
            <option value="">Select zone</option>
            {zones.map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
        <div><label className={lbl}>Payer Behavior</label>
          <select value={editAccountPayer} onChange={(e) => setEditAccountPayer(e.target.value)} className={inp}>
            <option value="">Select behavior</option>
            <option value="GOOD">Good</option><option value="AVERAGE">Average</option>
            <option value="PROBLEMATIC">Problematic</option><option value="UNKNOWN">Unknown</option>
          </select>
        </div>
      </FormModal>

      {/* Create Stakeholder */}
      <FormModal isOpen={showCreateStakeholder} onClose={() => setShowCreateStakeholder(false)} title="New Stakeholder" onSubmit={handleCreateStakeholder} submitLabel="Create">
        <div><label className={lbl}>Name *</label><input type="text" value={newSName} onChange={(e) => setNewSName(e.target.value)} className={inp} placeholder="Enter stakeholder name" autoFocus /></div>
        <div><label className={lbl}>Designation</label><input type="text" value={newSDesignation} onChange={(e) => setNewSDesignation(e.target.value)} className={inp} placeholder="e.g. Chief Radiologist" /></div>
        <div><label className={lbl}>Email</label><input type="email" value={newSEmail} onChange={(e) => setNewSEmail(e.target.value)} className={inp} placeholder="e.g. doctor@hospital.com" /></div>
        <div><label className={lbl}>Phone</label><input type="tel" value={newSPhone} onChange={(e) => setNewSPhone(e.target.value)} className={inp} placeholder="e.g. +91-9876543210" /></div>
        <div><label className={lbl}>NPS Score</label><input type="number" min="-100" max="100" value={newSNps} onChange={(e) => setNewSNps(e.target.value)} className={inp} placeholder="-100 to 100" /></div>
        <div><label className={lbl}>Sentiment</label>
          <select value={newSSentiment} onChange={(e) => setNewSSentiment(e.target.value)} className={inp}>
            <option value="">Select sentiment</option><option value="PROMOTER">Promoter</option><option value="NEUTRAL">Neutral</option><option value="DETRACTOR">Detractor</option>
          </select>
        </div>
      </FormModal>

      {/* Edit Stakeholder */}
      <FormModal isOpen={editingStakeholder !== null} onClose={() => setEditingStakeholder(null)} title="Edit Stakeholder" onSubmit={handleUpdateStakeholder}>
        <div><label className={lbl}>Name *</label><input type="text" value={editSName} onChange={(e) => setEditSName(e.target.value)} className={inp} autoFocus /></div>
        <div><label className={lbl}>Designation</label><input type="text" value={editSDesignation} onChange={(e) => setEditSDesignation(e.target.value)} className={inp} /></div>
        <div><label className={lbl}>Email</label><input type="email" value={editSEmail} onChange={(e) => setEditSEmail(e.target.value)} className={inp} /></div>
        <div><label className={lbl}>Phone</label><input type="tel" value={editSPhone} onChange={(e) => setEditSPhone(e.target.value)} className={inp} /></div>
        <div><label className={lbl}>NPS Score</label><input type="number" min="-100" max="100" value={editSNps} onChange={(e) => setEditSNps(e.target.value)} className={inp} /></div>
        <div><label className={lbl}>Sentiment</label>
          <select value={editSSentiment} onChange={(e) => setEditSSentiment(e.target.value)} className={inp}>
            <option value="">Select sentiment</option><option value="PROMOTER">Promoter</option><option value="NEUTRAL">Neutral</option><option value="DETRACTOR">Detractor</option>
          </select>
        </div>
      </FormModal>

      {/* Create Project */}
      <FormModal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="New Project" onSubmit={handleCreateProject} submitLabel="Create">
        <div><label className={lbl}>Name *</label><input type="text" value={newPName} onChange={(e) => setNewPName(e.target.value)} className={inp} placeholder="Enter project name" autoFocus /></div>
        <div><label className={lbl}>Status *</label><select value={newPStatusId} onChange={(e) => setNewPStatusId(e.target.value)} className={inp}><option value="">Select status</option>{projectStatuses.map((s: any) => <option key={s.id} value={s.id}>{s.status_name}</option>)}</select></div>
        <div><label className={lbl}>Owner *</label><select value={newPOwnerId} onChange={(e) => setNewPOwnerId(e.target.value)} className={inp}><option value="">Select owner</option>{users.map((u: any) => <option key={u.id} value={u.id}>{u.display_name}</option>)}</select></div>
        <div><label className={lbl}>Bid Submission Date</label><input type="date" value={newPBidDate} onChange={(e) => setNewPBidDate(e.target.value)} className={inp} /></div>
      </FormModal>

      {/* Edit Project */}
      <FormModal isOpen={editingProject !== null} onClose={() => setEditingProject(null)} title="Edit Project" onSubmit={handleUpdateProject}>
        <div><label className={lbl}>Name *</label><input type="text" value={editPName} onChange={(e) => setEditPName(e.target.value)} className={inp} autoFocus /></div>
        <div><label className={lbl}>Status</label><select value={editPStatusId} onChange={(e) => setEditPStatusId(e.target.value)} className={inp}><option value="">Select status</option>{projectStatuses.map((s: any) => <option key={s.id} value={s.id}>{s.status_name}</option>)}</select></div>
        <div><label className={lbl}>Owner</label><select value={editPOwnerId} onChange={(e) => setEditPOwnerId(e.target.value)} className={inp}><option value="">Select owner</option>{users.map((u: any) => <option key={u.id} value={u.id}>{u.display_name}</option>)}</select></div>
        <div><label className={lbl}>Bid Submission Date</label><input type="date" value={editPBidDate} onChange={(e) => setEditPBidDate(e.target.value)} className={inp} /></div>
      </FormModal>

      {/* Create Opportunity */}
      <FormModal isOpen={showCreateOpp} onClose={() => setShowCreateOpp(false)} title="New Opportunity" onSubmit={handleCreateOpp} submitLabel="Create">
        <div><label className={lbl}>Name *</label><input type="text" value={newOName} onChange={(e) => setNewOName(e.target.value)} className={inp} placeholder="Enter opportunity name" autoFocus /></div>
        <div><label className={lbl}>Project</label><select value={newOProjectId} onChange={(e) => setNewOProjectId(e.target.value)} className={inp}><option value="">None</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="flex gap-3">
          <div className="flex-1"><label className={lbl}>Stage *</label>
            <select value={newOStageId} onChange={(e) => { const s: any = stages.find((x: any) => x.id === e.target.value); setNewOStageId(e.target.value); if (s) setNewOWinProb(String(s.default_win_probability)); }} className={inp}>
              <option value="">Select stage</option>{stages.map((s: any) => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
            </select>
          </div>
          <div className="flex-1"><label className={lbl}>Status *</label><select value={newOStatusId} onChange={(e) => setNewOStatusId(e.target.value)} className={inp}><option value="">Select status</option>{oppStatuses.map((s: any) => <option key={s.id} value={s.id}>{s.status_name}</option>)}</select></div>
        </div>
        <div><label className={lbl}>Lead Source</label><select value={newOLeadSourceId} onChange={(e) => setNewOLeadSourceId(e.target.value)} className={inp}><option value="">Select source</option>{leadSources.map((ls: any) => <option key={ls.id} value={ls.id}>{ls.name}</option>)}</select></div>
        <div><label className={lbl}>Owner *</label><select value={newOOwnerId} onChange={(e) => setNewOOwnerId(e.target.value)} className={inp}><option value="">Select owner</option>{users.map((u: any) => <option key={u.id} value={u.id}>{u.display_name}</option>)}</select></div>
        <div><label className={lbl}>Win Probability % *</label><input type="number" min="0" max="100" value={newOWinProb} onChange={(e) => setNewOWinProb(e.target.value)} className={inp} placeholder="0 – 100" /></div>
        <div><label className={lbl}>Indicative Value (Lakhs){newOItems.length > 0 && <span className="ml-1 text-blue-400 font-normal normal-case tracking-normal">(auto)</span>}</label>
          <input type="number" step="any" min="0" value={newOValue} onChange={(e) => setNewOValue(e.target.value)} readOnly={newOItems.length > 0} className={newOItems.length > 0 ? "w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-500 cursor-not-allowed" : inp} placeholder="e.g. 25.50" />
        </div>
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Products</div>
            <button type="button" onClick={() => setShowNewOppItems(true)} className="px-3 py-1.5 rounded-xl text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all uppercase tracking-wider shrink-0">{newOItems.length > 0 ? `Edit (${newOItems.length})` : "+ Add Products"}</button>
          </div>
          {newOItems.length > 0 ? (
            <div className="space-y-1">
              {newOItems.map((i: any, idx: number) => (<div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl text-xs"><div className="flex-1 font-bold truncate">{i.product_name}</div><div className="text-gray-400 shrink-0">{i.quantity}×₹{i.unit_price_lakhs}L{i.discount_lakhs > 0 ? ` −₹${i.discount_lakhs}L` : ""}</div></div>))}
              <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-wider pr-1">Total: ₹{newOItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L</div>
            </div>
          ) : <div className="text-xs text-gray-400 italic">No products added</div>}
        </div>
      </FormModal>

      <FormModal isOpen={showNewOppItems} onClose={() => setShowNewOppItems(false)} title="Products" onSubmit={async () => {}} submitLabel="Done">
        {newOItems.length > 0 && (
          <div className="space-y-2">
            {newOItems.map((item: any, i: number) => (
              <div key={i} className="px-3 py-2 bg-gray-50 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between"><div className="font-bold truncate">{item.product_name}</div><button type="button" onClick={() => setNewOItems(newOItems.filter((_: any, j: number) => j !== i))} className="text-red-400 hover:text-red-600 font-black shrink-0 ml-2">×</button></div>
                <div className="flex gap-2">
                  {(["quantity", "unit_price_lakhs", "discount_lakhs"] as const).map((key) => (
                    <div key={key} className="w-20"><div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{key === "quantity" ? "Qty" : key === "unit_price_lakhs" ? "Price ₹L" : "Disc ₹L"}</div>
                      <input type="number" min="0" step="any" value={item[key]} onChange={(e) => setNewOItems(newOItems.map((it: any, j: number) => j === i ? { ...it, [key]: Number(e.target.value) } : it))} className={inp} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-wider pr-1">Total: ₹{newOItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L</div>
          </div>
        )}
        <OppItemAddRow prodId={newOItemProdId} setProdId={setNewOItemProdId} qty={newOItemQty} setQty={setNewOItemQty} price={newOItemPrice} setPrice={setNewOItemPrice} disc={newOItemDisc} setDisc={setNewOItemDisc} items={newOItems} setItems={setNewOItems} />
      </FormModal>

      {/* Edit Opportunity */}
      <FormModal isOpen={editingOpp !== null} onClose={() => setEditingOpp(null)} title="Edit Opportunity" onSubmit={handleUpdateOpp}>
        <div><label className={lbl}>Name *</label><input type="text" value={editOName} onChange={(e) => setEditOName(e.target.value)} className={inp} autoFocus /></div>
        <div><label className={lbl}>Project</label><select value={editOProjectId} onChange={(e) => setEditOProjectId(e.target.value)} className={inp}><option value="">None</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="flex gap-3">
          <div className="flex-1"><label className={lbl}>Stage</label>
            <select value={editOStageId} onChange={(e) => { const s: any = stages.find((x: any) => x.id === e.target.value); setEditOStageId(e.target.value); if (s) setEditOWinProb(String(s.default_win_probability)); }} className={inp}>
              <option value="">Select stage</option>{stages.map((s: any) => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
            </select>
          </div>
          <div className="flex-1"><label className={lbl}>Status</label><select value={editOStatusId} onChange={(e) => setEditOStatusId(e.target.value)} className={inp}><option value="">Select status</option>{oppStatuses.map((s: any) => <option key={s.id} value={s.id}>{s.status_name}</option>)}</select></div>
        </div>
        <div><label className={lbl}>Lead Source</label><select value={editOLeadSourceId} onChange={(e) => setEditOLeadSourceId(e.target.value)} className={inp}><option value="">Select source</option>{leadSources.map((ls: any) => <option key={ls.id} value={ls.id}>{ls.name}</option>)}</select></div>
        <div><label className={lbl}>Owner</label><select value={editOOwnerId} onChange={(e) => setEditOOwnerId(e.target.value)} className={inp}><option value="">Select owner</option>{users.map((u: any) => <option key={u.id} value={u.id}>{u.display_name}</option>)}</select></div>
        <div><label className={lbl}>Win Probability %</label><input type="number" min="0" max="100" value={editOWinProb} onChange={(e) => setEditOWinProb(e.target.value)} className={inp} /></div>
        <div><label className={lbl}>Indicative Value (Lakhs){editOItems.length > 0 && <span className="ml-1 text-blue-400 font-normal normal-case tracking-normal">(auto)</span>}</label>
          <input type="number" step="any" min="0" value={editOValue} onChange={(e) => setEditOValue(e.target.value)} readOnly={editOItems.length > 0} className={editOItems.length > 0 ? "w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-500 cursor-not-allowed" : inp} />
        </div>
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Products</div>
            <button type="button" onClick={() => setShowEditOppItems(true)} className="px-3 py-1.5 rounded-xl text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all uppercase tracking-wider shrink-0">{editOItems.length > 0 ? `Edit (${editOItems.length})` : "+ Add Products"}</button>
          </div>
          {editOItems.length > 0 ? (
            <div className="space-y-1">
              {editOItems.map((i: any, idx: number) => (<div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl text-xs"><div className="flex-1 font-bold truncate">{i.product_name}</div><div className="text-gray-400 shrink-0">{i.quantity}×₹{i.unit_price_lakhs}L{i.discount_lakhs > 0 ? ` −₹${i.discount_lakhs}L` : ""}</div></div>))}
              <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-wider pr-1">Total: ₹{editOItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L</div>
            </div>
          ) : <div className="text-xs text-gray-400 italic">No products added</div>}
        </div>
      </FormModal>

      <FormModal isOpen={showEditOppItems} onClose={() => setShowEditOppItems(false)} title="Products" onSubmit={async () => {}} submitLabel="Done">
        {editOItems.length > 0 && (
          <div className="space-y-2">
            {editOItems.map((item: any, i: number) => (
              <div key={i} className="px-3 py-2 bg-gray-50 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between"><div className="font-bold truncate">{item.product_name}</div><button type="button" onClick={() => setEditOItems(editOItems.filter((_: any, j: number) => j !== i))} className="text-red-400 hover:text-red-600 font-black shrink-0 ml-2">×</button></div>
                <div className="flex gap-2">
                  {(["quantity", "unit_price_lakhs", "discount_lakhs"] as const).map((key) => (
                    <div key={key} className="w-20"><div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{key === "quantity" ? "Qty" : key === "unit_price_lakhs" ? "Price ₹L" : "Disc ₹L"}</div>
                      <input type="number" min="0" step="any" value={item[key]} onChange={(e) => { const { id: _id, ...rest } = item; setEditOItems(editOItems.map((it: any, j: number) => j === i ? { ...rest, [key]: Number(e.target.value) } : it)); }} className={inp} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-wider pr-1">Total: ₹{editOItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L</div>
          </div>
        )}
        <OppItemAddRow prodId={editOItemProdId} setProdId={setEditOItemProdId} qty={editOItemQty} setQty={setEditOItemQty} price={editOItemPrice} setPrice={setEditOItemPrice} disc={editOItemDisc} setDisc={setEditOItemDisc} items={editOItems} setItems={setEditOItems} />
      </FormModal>

      {/* Create Asset */}
      <FormModal isOpen={showCreateAsset} onClose={() => setShowCreateAsset(false)} title="New Installed Asset" onSubmit={handleCreateAsset} submitLabel="Create">
        <div><label className={lbl}>Equipment Type</label><div className="flex items-center gap-3 py-2"><input type="checkbox" id="newAIsCompetitor" checked={newAIsCompetitor} onChange={(e) => setNewAIsCompetitor(e.target.checked)} className="w-4 h-4 rounded accent-blue-600" /><label htmlFor="newAIsCompetitor" className="text-sm font-bold text-gray-700">Competitor Equipment</label></div></div>
        {newAIsCompetitor
          ? <div><label className={lbl}>Competitor Product Name</label><input type="text" value={newACompetitorName} onChange={(e) => setNewACompetitorName(e.target.value)} className={inp} placeholder="e.g. Siemens SOMATOM" /></div>
          : <div><label className={lbl}>Product *</label><select value={newAProductId} onChange={(e) => setNewAProductId(e.target.value)} className={inp}><option value="">Select product</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}{p.model_number ? ` — ${p.model_number}` : ""}</option>)}</select></div>
        }
        <div><label className={lbl}>Department</label><input type="text" value={newADepartment} onChange={(e) => setNewADepartment(e.target.value)} className={inp} placeholder="e.g. Radiology" /></div>
        <div><label className={lbl}>Installation Date</label><input type="date" value={newAInstallDate} onChange={(e) => setNewAInstallDate(e.target.value)} className={inp} /></div>
      </FormModal>

      {/* Edit Asset */}
      <FormModal isOpen={editingAsset !== null} onClose={() => setEditingAsset(null)} title="Edit Installed Asset" onSubmit={handleUpdateAsset}>
        <div><label className={lbl}>Equipment Type</label><div className="flex items-center gap-3 py-2"><input type="checkbox" id="editAIsCompetitor" checked={editAIsCompetitor} onChange={(e) => setEditAIsCompetitor(e.target.checked)} className="w-4 h-4 rounded accent-blue-600" /><label htmlFor="editAIsCompetitor" className="text-sm font-bold text-gray-700">Competitor Equipment</label></div></div>
        {editAIsCompetitor
          ? <div><label className={lbl}>Competitor Product Name</label><input type="text" value={editACompetitorName} onChange={(e) => setEditACompetitorName(e.target.value)} className={inp} /></div>
          : <div><label className={lbl}>Product *</label><select value={editAProductId} onChange={(e) => setEditAProductId(e.target.value)} className={inp}><option value="">Select product</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}{p.model_number ? ` — ${p.model_number}` : ""}</option>)}</select></div>
        }
        <div><label className={lbl}>Department</label><input type="text" value={editADepartment} onChange={(e) => setEditADepartment(e.target.value)} className={inp} /></div>
        <div><label className={lbl}>Installation Date</label><input type="date" value={editAInstallDate} onChange={(e) => setEditAInstallDate(e.target.value)} className={inp} /></div>
      </FormModal>

      {/* Log Activity */}
      <LogActivityModal
        isOpen={showLogActivity}
        onClose={() => setShowLogActivity(false)}
        accountId={accountId}
        currentUserId={(userProfile as any)?.id}
      />
    </div>
  );
}
