import { useEffect, useState, useCallback } from "react";
import {
  getAccount,
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
  listInstalledAssets,
} from "../services/accounts";
import {
  listZones,
  listProjectStatuses,
  listStages,
  listStatuses,
  listUsers,
} from "../services/masterData";
import FormModal from "../components/FormModal";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "stakeholders", label: "Stakeholders" },
  { id: "projects", label: "Projects" },
  { id: "opportunities", label: "Opportunities" },
  { id: "installed", label: "Installed Base" },
];

function PayerBadge({ behavior }) {
  if (!behavior) return null;
  const styles = {
    GOOD: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PROBLEMATIC: "bg-red-50 text-red-700 border-red-200",
    UNKNOWN: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${styles[behavior] || styles.UNKNOWN}`}
    >
      {behavior}
    </span>
  );
}

function SentimentBadge({ sentiment }) {
  if (!sentiment) return null;
  const styles = {
    POSITIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    NEUTRAL: "bg-amber-50 text-amber-700 border-amber-200",
    NEGATIVE: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${styles[sentiment] || "bg-gray-50 text-gray-600 border-gray-200"}`}
    >
      {sentiment}
    </span>
  );
}

function NpsIndicator({ score }) {
  if (score == null) return <span className="text-gray-300 text-xs">—</span>;
  const color =
    score >= 50
      ? "text-emerald-600"
      : score >= 0
        ? "text-amber-600"
        : "text-red-600";
  return <span className={`font-black text-lg ${color}`}>{score}</span>;
}

function OverviewTab({ account, onEdit }) {
  const fields = [
    { label: "Account Name", value: account.name },
    { label: "Zone", value: account.zone?.name || "—" },
    {
      label: "Payer Behavior",
      value: <PayerBadge behavior={account.payer_behavior} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Account Details
          </h4>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider"
          >
            Edit
          </button>
        </div>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.label}>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                {f.label}
              </div>
              <div className="font-bold text-gray-800">{f.value || "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StakeholdersTab({ stakeholders, onAdd, onEdit }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Stakeholders ({stakeholders.length})
        </h4>
        <button
          onClick={onAdd}
          className="px-3 py-1.5 rounded-xl text-xs font-black text-violet-600 bg-violet-50 hover:bg-violet-100 transition-all uppercase tracking-wider"
        >
          + Add
        </button>
      </div>

      {stakeholders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
          No stakeholders found for this account.
        </div>
      ) : (
        stakeholders.map((s) => (
          <div
            key={s.id}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center font-black text-sm shadow-sm">
                {s.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-gray-800">{s.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <SentimentBadge sentiment={s.sentiment} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">
                  NPS
                </div>
                <NpsIndicator score={s.nps_score} />
              </div>
              <button
                onClick={() => onEdit(s)}
                className="px-3 py-1.5 rounded-xl text-xs font-black text-violet-600 bg-violet-50 hover:bg-violet-100 transition-all uppercase tracking-wider"
              >
                Edit
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ProjectsTab({ projects, onAdd, onEdit }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Projects ({projects.length})
        </h4>
        <button
          onClick={onAdd}
          className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider"
        >
          + Add
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
          No projects found for this account.
        </div>
      ) : (
        projects.map((p) => (
          <div
            key={p.id}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-gray-800">{p.name}</div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-blue-50 text-blue-700 border-blue-200">
                  {p.status.status_name}
                </span>
                <button
                  onClick={() => onEdit(p)}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider"
                >
                  Edit
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <div>
                <span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">
                  Owner:{" "}
                </span>
                <span className="font-bold">{p.owner.display_name}</span>
              </div>
              {p.bid_submission_date && (
                <div>
                  <span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">
                    Bid Date:{" "}
                  </span>
                  <span className="font-bold">{p.bid_submission_date}</span>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function OpportunitiesTab({ opportunities, onAdd, onEdit }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Opportunities ({opportunities.length})
        </h4>
        <button
          onClick={onAdd}
          className="px-3 py-1.5 rounded-xl text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all uppercase tracking-wider"
        >
          + Add
        </button>
      </div>

      {opportunities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
          No opportunities found for this account.
        </div>
      ) : (
        opportunities.map((o) => (
          <div
            key={o.id}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-gray-800">{o.name}</div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-amber-50 text-amber-700 border-amber-200">
                  {o.stage.stage_name}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-blue-50 text-blue-700 border-blue-200">
                  {o.status.status_name}
                </span>
                <button
                  onClick={() => onEdit(o)}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all uppercase tracking-wider"
                >
                  Edit
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <div>
                <span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">
                  Owner:{" "}
                </span>
                <span className="font-bold">{o.owner.display_name}</span>
              </div>
              <div>
                <span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">
                  Win %:{" "}
                </span>
                <span
                  className={`font-black ${
                    Number(o.win_probability) >= 70
                      ? "text-emerald-600"
                      : Number(o.win_probability) >= 40
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {o.win_probability}%
                </span>
              </div>
              {o.indicative_value && (
                <div>
                  <span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">
                    Value:{" "}
                  </span>
                  <span className="font-bold">{o.indicative_value}L</span>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function InstalledBaseTab({ assets }) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
        No installed assets found for this account.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assets.map((a) => {
        const productName = a.is_competitor_equipment
          ? a.competitor_product_name || "Unknown Competitor"
          : a.product?.name || "Unknown Product";
        const modelInfo =
          !a.is_competitor_equipment && a.product?.model_number
            ? a.product.model_number
            : null;
        const oemInfo =
          !a.is_competitor_equipment && a.product?.oem_name
            ? a.product.oem_name
            : null;

        return (
          <div
            key={a.id}
            className={`bg-white p-4 rounded-2xl shadow-sm border ${a.is_competitor_equipment ? "border-red-200" : "border-gray-100"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="font-bold text-gray-800">{productName}</div>
                {a.is_competitor_equipment && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black border bg-red-50 text-red-600 border-red-200">
                    COMPETITOR
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              {oemInfo && (
                <div>
                  <span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">
                    OEM:{" "}
                  </span>
                  <span className="font-bold">{oemInfo}</span>
                </div>
              )}
              {modelInfo && (
                <div>
                  <span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">
                    Model:{" "}
                  </span>
                  <span className="font-bold">{modelInfo}</span>
                </div>
              )}
              {a.department && (
                <div>
                  <span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">
                    Dept:{" "}
                  </span>
                  <span className="font-bold">{a.department}</span>
                </div>
              )}
              {a.installation_date && (
                <div>
                  <span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">
                    Installed:{" "}
                  </span>
                  <span className="font-bold">{a.installation_date}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Customer360Screen({ accountId, onBack }) {
  const [account, setAccount] = useState(null);
  const [stakeholders, setStakeholders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [installed, setInstalled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Edit Account state — must be declared before any early returns
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [zones, setZones] = useState([]);
  const [editAccountName, setEditAccountName] = useState("");
  const [editAccountZoneId, setEditAccountZoneId] = useState("");
  const [editAccountPayer, setEditAccountPayer] = useState("");

  // Create Stakeholder state
  const [showCreateStakeholder, setShowCreateStakeholder] = useState(false);
  const [newStakeholderName, setNewStakeholderName] = useState("");
  const [newStakeholderNps, setNewStakeholderNps] = useState("");
  const [newStakeholderSentiment, setNewStakeholderSentiment] = useState("");

  // Edit Stakeholder state
  const [editingStakeholder, setEditingStakeholder] = useState(null);
  const [editStakeholderName, setEditStakeholderName] = useState("");
  const [editStakeholderNps, setEditStakeholderNps] = useState("");
  const [editStakeholderSentiment, setEditStakeholderSentiment] = useState("");

  // Master data for dropdowns (lazy-loaded)
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [stages, setStages] = useState([]);
  const [oppStatuses, setOppStatuses] = useState([]);
  const [users, setUsers] = useState([]);

  // Create Project state
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectStatusId, setNewProjectStatusId] = useState("");
  const [newProjectOwnerId, setNewProjectOwnerId] = useState("");
  const [newProjectBidDate, setNewProjectBidDate] = useState("");

  // Edit Project state
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectStatusId, setEditProjectStatusId] = useState("");
  const [editProjectOwnerId, setEditProjectOwnerId] = useState("");
  const [editProjectBidDate, setEditProjectBidDate] = useState("");

  // Create Opportunity state
  const [showCreateOpp, setShowCreateOpp] = useState(false);
  const [newOppName, setNewOppName] = useState("");
  const [newOppProjectId, setNewOppProjectId] = useState("");
  const [newOppStageId, setNewOppStageId] = useState("");
  const [newOppStatusId, setNewOppStatusId] = useState("");
  const [newOppOwnerId, setNewOppOwnerId] = useState("");
  const [newOppWinProb, setNewOppWinProb] = useState("");
  const [newOppValue, setNewOppValue] = useState("");

  // Edit Opportunity state
  const [editingOpp, setEditingOpp] = useState(null);
  const [editOppName, setEditOppName] = useState("");
  const [editOppProjectId, setEditOppProjectId] = useState("");
  const [editOppStageId, setEditOppStageId] = useState("");
  const [editOppStatusId, setEditOppStatusId] = useState("");
  const [editOppOwnerId, setEditOppOwnerId] = useState("");
  const [editOppWinProb, setEditOppWinProb] = useState("");
  const [editOppValue, setEditOppValue] = useState("");

  const loadAccount = useCallback(() => {
    setLoading(true);
    setDetailLoading(true);
    setError(null);

    getAccount(accountId)
      .then((data) => {
        setAccount(data);
        setLoading(false);

        Promise.allSettled([
          listStakeholders(accountId),
          listProjects(accountId),
          listOpportunities(accountId),
          listInstalledAssets(accountId),
        ]).then((results) => {
          const [sh, pr, op, as_] = results;
          if (sh.status === "fulfilled") setStakeholders(sh.value);
          if (pr.status === "fulfilled") setProjects(pr.value);
          if (op.status === "fulfilled") setOpportunities(op.value);
          if (as_.status === "fulfilled") setInstalled(as_.value);
          setDetailLoading(false);
        });
      })
      .catch((err) => {
        setError(err.message || "Failed to load account");
        setLoading(false);
        setDetailLoading(false);
      });
  }, [accountId]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  // --- Early returns for loading/error (AFTER all hooks) ---

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50">
        <div className="text-center py-12">
          <div className="text-gray-400 font-bold text-sm animate-pulse">
            Loading Customer 360...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider"
          >
            &larr; Back
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadAccount}
            className="ml-4 shrink-0 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // --- Event handlers ---

  const openEditAccount = async () => {
    setEditAccountName(account.name || "");
    setEditAccountZoneId(account.zone?.id || "");
    setEditAccountPayer(account.payer_behavior || "");
    setShowEditAccount(true);
    if (zones.length === 0) {
      try {
        const data = await listZones();
        setZones(data.items || data);
      } catch {}
    }
  };

  const handleUpdateAccount = async () => {
    if (!editAccountName.trim()) throw new Error("Customer name is required");
    if (!editAccountZoneId) throw new Error("Zone is required");
    const payload = { name: editAccountName.trim(), zone_id: editAccountZoneId };
    if (editAccountPayer) payload.payer_behavior = editAccountPayer;
    await updateAccount(accountId, payload);
    const data = await getAccount(accountId);
    setAccount(data);
  };

  const openCreateStakeholder = () => {
    setNewStakeholderName("");
    setNewStakeholderNps("");
    setNewStakeholderSentiment("");
    setShowCreateStakeholder(true);
  };

  const handleCreateStakeholder = async () => {
    if (!newStakeholderName.trim()) throw new Error("Stakeholder name is required");
    const payload = { name: newStakeholderName.trim() };
    if (newStakeholderNps !== "") payload.nps_score = Number(newStakeholderNps);
    if (newStakeholderSentiment) payload.sentiment = newStakeholderSentiment;
    await createStakeholder(accountId, payload);
    const [sh, acct] = await Promise.all([listStakeholders(accountId), getAccount(accountId)]);
    setStakeholders(sh);
    setAccount(acct);
  };

  const openEditStakeholder = (s) => {
    setEditingStakeholder(s);
    setEditStakeholderName(s.name || "");
    setEditStakeholderNps(s.nps_score != null ? String(s.nps_score) : "");
    setEditStakeholderSentiment(s.sentiment || "");
  };

  const handleUpdateStakeholder = async () => {
    if (!editStakeholderName.trim()) throw new Error("Stakeholder name is required");
    const payload = { name: editStakeholderName.trim() };
    if (editStakeholderNps !== "") payload.nps_score = Number(editStakeholderNps);
    if (editStakeholderSentiment) payload.sentiment = editStakeholderSentiment;
    await updateStakeholder(editingStakeholder.id, payload);
    const sh = await listStakeholders(accountId);
    setStakeholders(sh);
  };

  const loadProjectMasterData = async () => {
    const loads = [];
    if (projectStatuses.length === 0)
      loads.push(listProjectStatuses().then(setProjectStatuses).catch(() => {}));
    if (users.length === 0)
      loads.push(listUsers().then(setUsers).catch(() => {}));
    await Promise.all(loads);
  };

  const loadOpportunityMasterData = async () => {
    const loads = [];
    if (stages.length === 0)
      loads.push(listStages().then(setStages).catch(() => {}));
    if (oppStatuses.length === 0)
      loads.push(listStatuses().then(setOppStatuses).catch(() => {}));
    if (users.length === 0)
      loads.push(listUsers().then(setUsers).catch(() => {}));
    await Promise.all(loads);
  };

  const openCreateProject = async () => {
    setNewProjectName("");
    setNewProjectStatusId("");
    setNewProjectOwnerId("");
    setNewProjectBidDate("");
    setShowCreateProject(true);
    await loadProjectMasterData();
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) throw new Error("Project name is required");
    if (!newProjectOwnerId) throw new Error("Owner is required");
    if (!newProjectStatusId) throw new Error("Status is required");
    const payload = {
      name: newProjectName.trim(),
      owner_id: newProjectOwnerId,
      status_id: newProjectStatusId,
    };
    if (newProjectBidDate) payload.bid_submission_date = newProjectBidDate;
    await createProject(accountId, payload);
    const [pr, acct] = await Promise.all([listProjects(accountId), getAccount(accountId)]);
    setProjects(pr);
    setAccount(acct);
  };

  const openEditProject = async (p) => {
    setEditingProject(p);
    setEditProjectName(p.name || "");
    setEditProjectStatusId(p.status?.id || "");
    setEditProjectOwnerId(p.owner?.id || "");
    setEditProjectBidDate(p.bid_submission_date || "");
    await loadProjectMasterData();
  };

  const handleUpdateProject = async () => {
    if (!editProjectName.trim()) throw new Error("Project name is required");
    const payload = {
      name: editProjectName.trim(),
      owner_id: editProjectOwnerId || undefined,
      status_id: editProjectStatusId || undefined,
    };
    if (editProjectBidDate) payload.bid_submission_date = editProjectBidDate;
    await updateProject(editingProject.id, payload);
    const pr = await listProjects(accountId);
    setProjects(pr);
  };

  const openCreateOpp = async () => {
    setNewOppName("");
    setNewOppProjectId("");
    setNewOppStageId("");
    setNewOppStatusId("");
    setNewOppOwnerId("");
    setNewOppWinProb("");
    setNewOppValue("");
    setShowCreateOpp(true);
    await loadOpportunityMasterData();
  };

  const handleCreateOpp = async () => {
    if (!newOppName.trim()) throw new Error("Opportunity name is required");
    if (!newOppOwnerId) throw new Error("Owner is required");
    if (!newOppStageId) throw new Error("Stage is required");
    if (!newOppStatusId) throw new Error("Status is required");
    if (newOppWinProb === "") throw new Error("Win probability is required");
    const payload = {
      name: newOppName.trim(),
      owner_id: newOppOwnerId,
      stage_id: newOppStageId,
      status_id: newOppStatusId,
      win_probability: Number(newOppWinProb),
    };
    if (newOppProjectId) payload.project_id = newOppProjectId;
    if (newOppValue !== "") payload.indicative_value = Number(newOppValue);
    await createOpportunity(accountId, payload);
    const [op, acct] = await Promise.all([listOpportunities(accountId), getAccount(accountId)]);
    setOpportunities(op);
    setAccount(acct);
  };

  const openEditOpp = async (o) => {
    setEditingOpp(o);
    setEditOppName(o.name || "");
    setEditOppProjectId(o.project_id || "");
    setEditOppStageId(o.stage?.id || "");
    setEditOppStatusId(o.status?.id || "");
    setEditOppOwnerId(o.owner?.id || "");
    setEditOppWinProb(o.win_probability != null ? String(o.win_probability) : "");
    setEditOppValue(o.indicative_value != null ? String(o.indicative_value) : "");
    await loadOpportunityMasterData();
  };

  const handleUpdateOpp = async () => {
    if (!editOppName.trim()) throw new Error("Opportunity name is required");
    const payload = {
      name: editOppName.trim(),
      owner_id: editOppOwnerId || undefined,
      stage_id: editOppStageId || undefined,
      status_id: editOppStatusId || undefined,
      win_probability: editOppWinProb !== "" ? Number(editOppWinProb) : undefined,
    };
    if (editOppProjectId) payload.project_id = editOppProjectId;
    if (editOppValue !== "") payload.indicative_value = Number(editOppValue);
    await updateOpportunity(editingOpp.id, payload);
    const op = await listOpportunities(accountId);
    setOpportunities(op);
  };

  const labelClass =
    "block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1";
  const inputClass =
    "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium";

  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider"
        >
          &larr; Back
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">
            Customer 360
          </h3>
          <h2 className="font-extrabold text-xl text-gray-800 tracking-tight truncate">
            {account.name}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {account.zone && (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-teal-50 text-teal-700 border-teal-200">
              {account.zone.name}
            </span>
          )}
          <PayerBadge behavior={account.payer_behavior} />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-black text-violet-600">
            {account.stakeholder_count}
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">
            Stakeholders
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-black text-blue-600">
            {account.project_count}
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">
            Projects
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-black text-emerald-600">
            {account.opportunity_count}
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">
            Opportunities
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-0 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab account={account} onEdit={openEditAccount} />
      )}
      {activeTab === "stakeholders" && (
        detailLoading
          ? <div className="text-center py-12"><div className="text-gray-400 font-bold text-sm animate-pulse">Loading...</div></div>
          : <StakeholdersTab stakeholders={stakeholders} onAdd={openCreateStakeholder} onEdit={openEditStakeholder} />
      )}
      {activeTab === "projects" && (
        detailLoading
          ? <div className="text-center py-12"><div className="text-gray-400 font-bold text-sm animate-pulse">Loading...</div></div>
          : <ProjectsTab projects={projects} onAdd={openCreateProject} onEdit={openEditProject} />
      )}
      {activeTab === "opportunities" && (
        detailLoading
          ? <div className="text-center py-12"><div className="text-gray-400 font-bold text-sm animate-pulse">Loading...</div></div>
          : <OpportunitiesTab opportunities={opportunities} onAdd={openCreateOpp} onEdit={openEditOpp} />
      )}
      {activeTab === "installed" && (
        detailLoading
          ? <div className="text-center py-12"><div className="text-gray-400 font-bold text-sm animate-pulse">Loading...</div></div>
          : <InstalledBaseTab assets={installed} />
      )}

      {/* Edit Account Modal */}
      <FormModal
        isOpen={showEditAccount}
        onClose={() => setShowEditAccount(false)}
        title="Edit Customer"
        onSubmit={handleUpdateAccount}
      >
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            value={editAccountName}
            onChange={(e) => setEditAccountName(e.target.value)}
            className={inputClass}
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>Zone *</label>
          <select
            value={editAccountZoneId}
            onChange={(e) => setEditAccountZoneId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select zone</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Payer Behavior</label>
          <select
            value={editAccountPayer}
            onChange={(e) => setEditAccountPayer(e.target.value)}
            className={inputClass}
          >
            <option value="">Select behavior</option>
            <option value="GOOD">Good</option>
            <option value="AVERAGE">Average</option>
            <option value="PROBLEMATIC">Problematic</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>
      </FormModal>

      {/* Create Stakeholder Modal */}
      <FormModal
        isOpen={showCreateStakeholder}
        onClose={() => setShowCreateStakeholder(false)}
        title="New Stakeholder"
        onSubmit={handleCreateStakeholder}
        submitLabel="Create"
      >
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            value={newStakeholderName}
            onChange={(e) => setNewStakeholderName(e.target.value)}
            className={inputClass}
            placeholder="Enter stakeholder name"
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>NPS Score</label>
          <input
            type="number"
            min="-100"
            max="100"
            value={newStakeholderNps}
            onChange={(e) => setNewStakeholderNps(e.target.value)}
            className={inputClass}
            placeholder="-100 to 100"
          />
        </div>
        <div>
          <label className={labelClass}>Sentiment</label>
          <select
            value={newStakeholderSentiment}
            onChange={(e) => setNewStakeholderSentiment(e.target.value)}
            className={inputClass}
          >
            <option value="">Select sentiment</option>
            <option value="POSITIVE">Positive</option>
            <option value="NEUTRAL">Neutral</option>
            <option value="NEGATIVE">Negative</option>
          </select>
        </div>
      </FormModal>

      {/* Edit Stakeholder Modal */}
      <FormModal
        isOpen={editingStakeholder !== null}
        onClose={() => setEditingStakeholder(null)}
        title="Edit Stakeholder"
        onSubmit={handleUpdateStakeholder}
      >
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            value={editStakeholderName}
            onChange={(e) => setEditStakeholderName(e.target.value)}
            className={inputClass}
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>NPS Score</label>
          <input
            type="number"
            min="-100"
            max="100"
            value={editStakeholderNps}
            onChange={(e) => setEditStakeholderNps(e.target.value)}
            className={inputClass}
            placeholder="-100 to 100"
          />
        </div>
        <div>
          <label className={labelClass}>Sentiment</label>
          <select
            value={editStakeholderSentiment}
            onChange={(e) => setEditStakeholderSentiment(e.target.value)}
            className={inputClass}
          >
            <option value="">Select sentiment</option>
            <option value="POSITIVE">Positive</option>
            <option value="NEUTRAL">Neutral</option>
            <option value="NEGATIVE">Negative</option>
          </select>
        </div>
      </FormModal>

      {/* Create Project Modal */}
      <FormModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        title="New Project"
        onSubmit={handleCreateProject}
        submitLabel="Create"
      >
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className={inputClass}
            placeholder="Enter project name"
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>Status *</label>
          <select
            value={newProjectStatusId}
            onChange={(e) => setNewProjectStatusId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select status</option>
            {projectStatuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.status_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Owner *</label>
          <select
            value={newProjectOwnerId}
            onChange={(e) => setNewProjectOwnerId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select owner</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Bid Submission Date</label>
          <input
            type="date"
            value={newProjectBidDate}
            onChange={(e) => setNewProjectBidDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </FormModal>

      {/* Edit Project Modal */}
      <FormModal
        isOpen={editingProject !== null}
        onClose={() => setEditingProject(null)}
        title="Edit Project"
        onSubmit={handleUpdateProject}
      >
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            value={editProjectName}
            onChange={(e) => setEditProjectName(e.target.value)}
            className={inputClass}
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={editProjectStatusId}
            onChange={(e) => setEditProjectStatusId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select status</option>
            {projectStatuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.status_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Owner</label>
          <select
            value={editProjectOwnerId}
            onChange={(e) => setEditProjectOwnerId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select owner</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Bid Submission Date</label>
          <input
            type="date"
            value={editProjectBidDate}
            onChange={(e) => setEditProjectBidDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </FormModal>

      {/* Create Opportunity Modal */}
      <FormModal
        isOpen={showCreateOpp}
        onClose={() => setShowCreateOpp(false)}
        title="New Opportunity"
        onSubmit={handleCreateOpp}
        submitLabel="Create"
      >
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            value={newOppName}
            onChange={(e) => setNewOppName(e.target.value)}
            className={inputClass}
            placeholder="Enter opportunity name"
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>Project</label>
          <select
            value={newOppProjectId}
            onChange={(e) => setNewOppProjectId(e.target.value)}
            className={inputClass}
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Stage *</label>
          <select
            value={newOppStageId}
            onChange={(e) => setNewOppStageId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select stage</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.stage_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status *</label>
          <select
            value={newOppStatusId}
            onChange={(e) => setNewOppStatusId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select status</option>
            {oppStatuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.status_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Owner *</label>
          <select
            value={newOppOwnerId}
            onChange={(e) => setNewOppOwnerId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select owner</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Win Probability % *</label>
          <input
            type="number"
            min="0"
            max="100"
            value={newOppWinProb}
            onChange={(e) => setNewOppWinProb(e.target.value)}
            className={inputClass}
            placeholder="0 – 100"
          />
        </div>
        <div>
          <label className={labelClass}>Indicative Value (Lakhs)</label>
          <input
            type="number"
            step="any"
            min="0"
            value={newOppValue}
            onChange={(e) => setNewOppValue(e.target.value)}
            className={inputClass}
            placeholder="e.g. 25.50"
          />
        </div>
      </FormModal>

      {/* Edit Opportunity Modal */}
      <FormModal
        isOpen={editingOpp !== null}
        onClose={() => setEditingOpp(null)}
        title="Edit Opportunity"
        onSubmit={handleUpdateOpp}
      >
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            value={editOppName}
            onChange={(e) => setEditOppName(e.target.value)}
            className={inputClass}
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>Project</label>
          <select
            value={editOppProjectId}
            onChange={(e) => setEditOppProjectId(e.target.value)}
            className={inputClass}
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Stage</label>
          <select
            value={editOppStageId}
            onChange={(e) => setEditOppStageId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select stage</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.stage_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={editOppStatusId}
            onChange={(e) => setEditOppStatusId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select status</option>
            {oppStatuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.status_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Owner</label>
          <select
            value={editOppOwnerId}
            onChange={(e) => setEditOppOwnerId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select owner</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Win Probability %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={editOppWinProb}
            onChange={(e) => setEditOppWinProb(e.target.value)}
            className={inputClass}
            placeholder="0 – 100"
          />
        </div>
        <div>
          <label className={labelClass}>Indicative Value (Lakhs)</label>
          <input
            type="number"
            min="0"
            value={editOppValue}
            onChange={(e) => setEditOppValue(e.target.value)}
            className={inputClass}
            placeholder="e.g. 25.50"
          />
        </div>
      </FormModal>
    </div>
  );
}
