import { useEffect, useState, useCallback } from "react";
import {
  getWorkspace,
  updateAccount,
  createStakeholder,
  updateStakeholder,
} from "../services/accounts";
import { listSbus } from "../services/masterData";
import FormModal from "../components/FormModal";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "stakeholders", label: "Stakeholders" },
  { id: "projects", label: "Projects" },
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
    { label: "SBU", value: account.managing_sbu?.name || "—" },
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

function ProjectsTab({ projects }) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
        No projects found for this account.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((p) => (
        <div
          key={p.id}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-gray-800">{p.name}</div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-blue-50 text-blue-700 border-blue-200">
              {p.status.status_name}
            </span>
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
      ))}
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
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchWorkspace = useCallback(() => {
    setLoading(true);
    setError(null);
    getWorkspace(accountId)
      .then(setWorkspace)
      .catch((err) => setError(err.message || "Failed to load workspace"))
      .finally(() => setLoading(false));
  }, [accountId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

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
            onClick={fetchWorkspace}
            className="ml-4 shrink-0 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { account, stakeholders, projects, installed_assets } = workspace;

  // Edit Account state
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [sbus, setSbus] = useState([]);
  const [editAccountName, setEditAccountName] = useState("");
  const [editAccountSbuId, setEditAccountSbuId] = useState("");
  const [editAccountPayer, setEditAccountPayer] = useState("");

  const openEditAccount = async () => {
    setEditAccountName(account.name || "");
    setEditAccountSbuId(account.managing_sbu?.id || "");
    setEditAccountPayer(account.payer_behavior || "");
    setShowEditAccount(true);
    if (sbus.length === 0) {
      try {
        const data = await listSbus();
        setSbus(data.items || data);
      } catch {}
    }
  };

  const handleUpdateAccount = async () => {
    if (!editAccountName.trim()) throw new Error("Customer name is required");
    const payload = { name: editAccountName.trim() };
    if (editAccountSbuId) payload.managing_sbu_id = editAccountSbuId;
    if (editAccountPayer) payload.payer_behavior = editAccountPayer;
    await updateAccount(accountId, payload);
    fetchWorkspace();
  };

  // Create Stakeholder state
  const [showCreateStakeholder, setShowCreateStakeholder] = useState(false);
  const [newStakeholderName, setNewStakeholderName] = useState("");
  const [newStakeholderNps, setNewStakeholderNps] = useState("");
  const [newStakeholderSentiment, setNewStakeholderSentiment] = useState("");

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
    fetchWorkspace();
  };

  // Edit Stakeholder state
  const [editingStakeholder, setEditingStakeholder] = useState(null);
  const [editStakeholderName, setEditStakeholderName] = useState("");
  const [editStakeholderNps, setEditStakeholderNps] = useState("");
  const [editStakeholderSentiment, setEditStakeholderSentiment] = useState("");

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
    fetchWorkspace();
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
          {account.managing_sbu && (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-indigo-50 text-indigo-700 border-indigo-200">
              {account.managing_sbu.name}
            </span>
          )}
          <PayerBadge behavior={account.payer_behavior} />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-black text-violet-600">
            {stakeholders.length}
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">
            Stakeholders
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-black text-blue-600">
            {projects.length}
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">
            Projects
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-black text-amber-600">
            {installed_assets.length}
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">
            Assets
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
        <StakeholdersTab
          stakeholders={stakeholders}
          onAdd={openCreateStakeholder}
          onEdit={openEditStakeholder}
        />
      )}
      {activeTab === "projects" && <ProjectsTab projects={projects} />}
      {activeTab === "installed" && (
        <InstalledBaseTab assets={installed_assets} />
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
          <label className={labelClass}>SBU</label>
          <select
            value={editAccountSbuId}
            onChange={(e) => setEditAccountSbuId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select SBU</option>
            {sbus.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
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
    </div>
  );
}
