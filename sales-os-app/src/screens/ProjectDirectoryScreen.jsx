import { useEffect, useState, useCallback, useRef } from "react";
import { listAllProjects } from "../services/projects";
import { listAccounts, createProject, updateProject } from "../services/accounts";
import { listProjectStatuses, listUsers } from "../services/masterData";
import FormModal from "../components/FormModal";
import useDebouncedValue from "../hooks/useDebouncedValue";

const CACHE_TTL_MS = 30_000;
const projectListCache = new Map();

function getCacheKey(params) {
  return JSON.stringify(params);
}

function getCached(key) {
  const entry = projectListCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    projectListCache.delete(key);
    return null;
  }
  return entry;
}

function setCache(key, data) {
  projectListCache.set(key, { ...data, fetchedAt: Date.now() });
}

function ProjectDetailView({ project: p, onBack, onEdit }) {
  const fields = [
    { label: "Account", value: p.account?.name },
    { label: "Status", value: p.status?.status_name },
    { label: "Owner", value: p.owner?.display_name },
    { label: "Bid Submission Date", value: p.bid_submission_date || "—" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 animate-in fade-in duration-200">
      {/* Fixed header */}
      <div className="px-4 pt-4 bg-gray-50">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:bg-gray-200 transition-all shrink-0"
            aria-label="Back"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-xl text-gray-800 tracking-tight leading-tight truncate">{p.name}</h2>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-blue-50 text-blue-700 border-blue-200 shrink-0">
            {p.status?.status_name}
          </span>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider shrink-0"
          >
            Edit
          </button>
        </div>
      </div>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
            Project Details
          </h4>
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
    </div>
  );
}

export default function ProjectDirectoryScreen({ onDetailModeChange, openCreateRef }) {
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [selectedProject, setSelectedProject] = useState(null);


  // Master data (lazy-loaded)
  const [accounts, setAccounts] = useState([]);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [users, setUsers] = useState([]);

  // Create form
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectAccountId, setNewProjectAccountId] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectStatusId, setNewProjectStatusId] = useState("");
  const [newProjectOwnerId, setNewProjectOwnerId] = useState("");
  const [newProjectBidDate, setNewProjectBidDate] = useState("");

  // Edit form
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectStatusId, setEditProjectStatusId] = useState("");
  const [editProjectOwnerId, setEditProjectOwnerId] = useState("");
  const [editProjectBidDate, setEditProjectBidDate] = useState("");

  const debouncedSearch = useDebouncedValue(search);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchProjects = useCallback((opts = {}) => {
    const params = { page, page_size: pageSize };
    if (debouncedSearch) params.search = debouncedSearch;

    const cacheKey = getCacheKey(params);
    const cached = getCached(cacheKey);
    const isBackgroundRefresh = opts.background === true;

    if (cached && !isBackgroundRefresh) {
      setProjects(cached.items);
      setTotal(cached.total);
      setLoading(false);
      setError(null);
      fetchProjects({ background: true });
      return;
    }

    if (!isBackgroundRefresh) {
      setLoading(true);
      setError(null);
    }

    listAllProjects(params)
      .then((data) => {
        if (!isMountedRef.current) return;
        setProjects(data.items);
        setTotal(data.total);
        if (!isBackgroundRefresh) setLoading(false);
        setCache(cacheKey, { items: data.items, total: data.total });
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        if (!isBackgroundRefresh) {
          setError(err.message || "Failed to load projects");
          setLoading(false);
        }
      });
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const loadMasterData = async () => {
    const loads = [];
    if (accounts.length === 0)
      loads.push(
        listAccounts({ page_size: 100 })
          .then((d) => setAccounts(d.items || []))
          .catch(() => {})
      );
    if (projectStatuses.length === 0)
      loads.push(listProjectStatuses().then(setProjectStatuses).catch(() => {}));
    if (users.length === 0)
      loads.push(listUsers().then(setUsers).catch(() => {}));
    await Promise.all(loads);
  };

  const openCreateProject = async () => {
    setNewProjectAccountId("");
    setNewProjectName("");
    setNewProjectStatusId("");
    setNewProjectOwnerId("");
    setNewProjectBidDate("");
    setShowCreateProject(true);
    await loadMasterData();
  };
  if (openCreateRef) openCreateRef.current = openCreateProject;

  const handleCreateProject = async () => {
    if (!newProjectAccountId) throw new Error("Account is required");
    if (!newProjectName.trim()) throw new Error("Project name is required");
    if (!newProjectStatusId) throw new Error("Status is required");
    if (!newProjectOwnerId) throw new Error("Owner is required");
    const payload = {
      name: newProjectName.trim(),
      owner_id: newProjectOwnerId,
      status_id: newProjectStatusId,
    };
    if (newProjectBidDate) payload.bid_submission_date = newProjectBidDate;
    await createProject(newProjectAccountId, payload);
    projectListCache.clear();
    fetchProjects({ background: true });
  };

  const openEditProject = async (p) => {
    setEditingProject(p);
    setEditProjectName(p.name || "");
    setEditProjectStatusId(p.status?.id || "");
    setEditProjectOwnerId(p.owner?.id || "");
    setEditProjectBidDate(p.bid_submission_date || "");
    await loadMasterData();
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
    projectListCache.clear();
    fetchProjects({ background: true });
    setSelectedProject(null);
    onDetailModeChange?.(false);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1";
  const inputClass = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium";

  if (selectedProject) {
    return (
      <>
        <ProjectDetailView
          project={selectedProject}
          onBack={() => { setSelectedProject(null); onDetailModeChange?.(false); }}
          onEdit={() => openEditProject(selectedProject)}
        />
        <FormModal
          isOpen={editingProject !== null}
          onClose={() => setEditingProject(null)}
          title="Edit Project"
          onSubmit={handleUpdateProject}
        >
          {editingProject && (
            <div className="px-3 py-2 bg-blue-50 rounded-xl text-xs font-bold text-blue-700 mb-1">
              {editingProject.account?.name}
            </div>
          )}
          <div>
            <label className={labelClass}>Name *</label>
            <input type="text" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} className={inputClass} autoFocus />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={editProjectStatusId} onChange={(e) => setEditProjectStatusId(e.target.value)} className={inputClass}>
              <option value="">Select status</option>
              {projectStatuses.map((s) => <option key={s.id} value={s.id}>{s.status_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Owner</label>
            <select value={editProjectOwnerId} onChange={(e) => setEditProjectOwnerId(e.target.value)} className={inputClass}>
              <option value="">Select owner</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.display_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Bid Submission Date</label>
            <input type="date" value={editProjectBidDate} onChange={(e) => setEditProjectBidDate(e.target.value)} className={inputClass} />
          </div>
        </FormModal>
      </>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 animate-in fade-in duration-200">
      {/* Fixed header */}
      <div className="px-4 pt-4 bg-gray-50">

        <div className="flex gap-3 mb-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by project or hospital..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              autoComplete="off"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchProjects()}
              className="ml-4 shrink-0 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 font-bold text-sm animate-pulse">Loading projects...</div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="space-y-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => { setSelectedProject(p); onDetailModeChange?.(true); }}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-base shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-800 text-sm group-hover:text-blue-900 transition-colors">{p.name}</div>
                        <div className="text-sm font-bold text-blue-600 mt-0.5">{p.account.name}</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-blue-50 transition-colors shrink-0">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-blue-50 text-blue-700 border-blue-200">
                      {p.status.status_name}
                    </span>
                    <div>
                      <span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">Owner: </span>
                      <span className="font-bold">{p.owner.display_name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {projects.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
                {search ? `No projects or hospitals matching "${search}".` : "No projects found."}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all"
                >
                  Prev
                </button>
                <span className="text-xs font-bold text-gray-500">
                  Page {page} of {totalPages} ({total} total)
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Project Modal */}
      <FormModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        title="New Project"
        onSubmit={handleCreateProject}
        submitLabel="Create"
      >
        <div>
          <label className={labelClass}>Account *</label>
          <select
            value={newProjectAccountId}
            onChange={(e) => setNewProjectAccountId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
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
              <option key={s.id} value={s.id}>{s.status_name}</option>
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
              <option key={u.id} value={u.id}>{u.display_name}</option>
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

    </div>
  );
}
