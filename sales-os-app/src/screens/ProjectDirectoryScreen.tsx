import { useCallback, useEffect, useState, type RefObject } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Alert, Autocomplete, Box, Button, IconButton, InputAdornment, MenuItem, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckIcon from "@mui/icons-material/Check";
import { listAllProjects } from "../services/projects";
import { listAccounts, createProject, updateProject, listOpportunities } from "../services/accounts";
import { listProjectStatuses, listUsers } from "../services/masterData";
import { useAuth } from "../contexts/AuthContext";
import FormModal from "../components/FormModal";
import QuickLeadModal from "../components/QuickLeadModal";
import ActivityTimeline from "../components/ActivityTimeline";
import NextActionsPanel from "../components/NextActionsPanel";
import { listProjectReminders } from "../services/activities";
import useDebouncedValue from "../hooks/useDebouncedValue";

const SHADOW_SM = "0 1px 2px rgba(0,0,0,0.05)";

// Same chip row as Customer 360 (hospital next-action plan D10).
const DETAIL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "opportunities", label: "Opportunities" },
  { id: "activity", label: "Activity" },
  { id: "next-actions", label: "Next Actions" },
];

// Minimal shape DemoApp.tsx's selectedProject state actually needs — this
// screen's own project rows/queries carry richer objects (see the `any`
// entity typing below), which satisfy this narrower shape structurally.
interface ProjectRef {
  id: string;
  name: string;
  account: { id: string; name: string };
}

function ProjectDetailView({
  project: p,
  onBack,
  onEdit,
  refreshOppsRef,
  openLogActivityRef,
  onSelectOpportunity,
}: {
  project: any;
  onBack: () => void;
  onEdit: () => void;
  refreshOppsRef?: RefObject<(() => void) | null>;
  openLogActivityRef?: RefObject<(() => void) | null>;
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
}) {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  // The one create form (QuickLeadModal), with this project's hospital and
  // the project itself fixed -- Win Probability plan step 2, D10.
  const [showAddOpp, setShowAddOpp] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: opportunities = [], isLoading: oppsLoading } = useQuery({
    queryKey: ["opportunities", "byAccount", p.account.id],
    queryFn: () => listOpportunities(p.account.id as any) as Promise<any[]>,
  });
  const opps = opportunities.filter((o: any) => o.project_id === p.id);
  useEffect(() => {
    if (refreshOppsRef) {
      refreshOppsRef.current = () =>
        queryClient.invalidateQueries({ queryKey: ["opportunities", "byAccount", p.account.id] });
    }
  }, [refreshOppsRef, queryClient, p.account.id]);


  const fields = [
    { label: "Account", value: p.account?.name },
    { label: "Status", value: p.status?.status_name },
    { label: "Owner", value: p.owner?.display_name },
    { label: "Bid Submission Date", value: p.bid_submission_date || "—" },
  ];

  return (
    <>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#f9fafb" }}>
        {/* Fixed header */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <IconButton onClick={onBack} aria-label="Back" sx={{ width: 40, height: 40, color: "#4b5563", flexShrink: 0, "&:hover": { bgcolor: "#e5e7eb" } }}>
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#1f2937", letterSpacing: "-0.025em", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </Typography>
            </Box>
            <Button
              onClick={onEdit}
              sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" }, flexShrink: 0 }}
            >
              Edit
            </Button>
          </Box>

          {/* Tab chip bar */}
          <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5, mb: 2, "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}>
            {DETAIL_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  sx={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: 0.75, px: 2, py: 1,
                    borderRadius: "9999px", fontSize: "0.875rem", fontWeight: 700, whiteSpace: "nowrap",
                    transition: "all 0.2s", border: "1px solid", textTransform: "none",
                    ...(isActive
                      ? { bgcolor: "primary.main", color: "#fff", borderColor: "primary.main", boxShadow: SHADOW_SM }
                      : { bgcolor: "#fff", color: "#6b7280", borderColor: "#e5e7eb", "&:hover": { borderColor: "#93c5fd", color: "primary.main" } }),
                  }}
                >
                  {isActive && <CheckIcon sx={{ fontSize: 14, flexShrink: 0 }} />}
                  {tab.label}
                </Button>
              );
            })}
          </Box>
        </Box>
        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 2, pb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {activeTab === "overview" && (
          <Box sx={{ bgcolor: "#fff", borderRadius: "1.5rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", p: 2.5 }}>
            <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em", mb: 2 }}>
              Project Details
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {fields.map((f) => (
                <Box key={f.label}>
                  <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>{f.label}</Box>
                  <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{f.value || "—"}</Box>
                </Box>
              ))}
            </Box>
          </Box>
          )}

          {/* Opportunities */}
          {activeTab === "opportunities" && (
          <Box sx={{ bgcolor: "#fff", borderRadius: "1.5rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                Opportunities
              </Typography>
              <Button
                onClick={() => setShowAddOpp(true)}
                sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#059669", bgcolor: "#ecfdf5", "&:hover": { bgcolor: "#d1fae5" } }}
              >
                + Add
              </Button>
            </Box>
            {oppsLoading ? (
              <Typography sx={{ textAlign: "center", py: 2, color: "#9ca3af", fontWeight: 700, fontSize: "0.875rem" }}>Loading...</Typography>
            ) : opps.length === 0 ? (
              <Typography sx={{ textAlign: "center", py: 2, color: "#9ca3af", fontStyle: "italic", fontSize: "0.875rem" }}>No opportunities linked to this project.</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {opps.map((opp: any) => (
                  <Box
                    key={opp.id}
                    onClick={() => onSelectOpportunity?.({ id: opp.id, name: opp.name })}
                    sx={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5,
                      p: 1.5, bgcolor: "#f9fafb", borderRadius: "0.75rem",
                      cursor: onSelectOpportunity ? "pointer" : "default",
                      "&:hover": onSelectOpportunity ? { bgcolor: "#f3f4f6" } : undefined,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: "#1f2937", fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {opp.name}
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mt: 0.5 }}>
                        <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #a7f3d0", bgcolor: "#ecfdf5", color: "#047857" }}>
                          {opp.stage?.stage_name}
                        </Box>
                        <Box component="span" sx={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af" }}>{opp.win_probability}% win</Box>
                        {opp.indicative_value != null && (
                          <Box component="span" sx={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af" }}>₹{opp.indicative_value}L</Box>
                        )}
                      </Box>
                    </Box>
                    {onSelectOpportunity && (
                      <Button
                        onClick={(e) => { e.stopPropagation(); onSelectOpportunity({ id: opp.id, name: opp.name }); }}
                        sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" }, flexShrink: 0 }}
                      >
                        Edit
                      </Button>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          )}

          {/* Activity */}
          {activeTab === "activity" && (
          <Box sx={{ bgcolor: "#fff", borderRadius: "1.5rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", p: 2.5 }}>
            <ActivityTimeline projectId={p.id} onLogActivity={() => openLogActivityRef?.current?.()} />
          </Box>
          )}

          {/* Next Actions -- the Project's own and those on its Opportunities (plan D9) */}
          {activeTab === "next-actions" && (
            <NextActionsPanel
              queryKeyPrefix={["project-reminders", p.id]}
              fetchReminders={(includeCompleted) => listProjectReminders(p.id, includeCompleted)}
              emptyPendingMessage="No pending next actions on this Project."
              currentUserId={(userProfile as any)?.id}
              onSelectOpportunity={onSelectOpportunity}
            />
          )}
        </Box>
      </Box>

      {/* New Opportunity -- the one create form, hospital and project fixed */}
      <QuickLeadModal
        isOpen={showAddOpp}
        onClose={() => setShowAddOpp(false)}
        sbuId={userProfile?.sbu?.id}
        initialAccountId={p.account.id}
        initialProjectId={p.id}
        initialName={p.name}
        lockAccount
        lockProject
      />
    </>
  );
}

interface ProjectDirectoryScreenProps {
  onDetailModeChange?: (detail: boolean) => void;
  openCreateRef?: RefObject<(() => void) | null>;
  refreshOppsRef?: RefObject<(() => void) | null>;
  onSelectProject?: (project: ProjectRef | null) => void;
  openLogActivityRef?: RefObject<(() => void) | null>;
  resetDetailRef?: RefObject<(() => void) | null>;
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
  openProjectRef?: RefObject<((p: { id: string; name: string }) => void) | null>;
  onDetailBack?: () => void;
}

export default function ProjectDirectoryScreen({
  onDetailModeChange,
  openCreateRef,
  refreshOppsRef,
  onSelectProject,
  openLogActivityRef,
  resetDetailRef,
  onSelectOpportunity,
  openProjectRef,
  onDetailBack,
}: ProjectDirectoryScreenProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Create form
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectAccountId, setNewProjectAccountId] = useState("");
  const [newProjectAccount, setNewProjectAccount] = useState<{ id: string; name: string } | null>(null);
  const [newProjectAccountSearch, setNewProjectAccountSearch] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectStatusId, setNewProjectStatusId] = useState("");
  const [newProjectOwnerId, setNewProjectOwnerId] = useState("");
  const [newProjectBidDate, setNewProjectBidDate] = useState("");

  // Edit form
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectStatusId, setEditProjectStatusId] = useState("");
  const [editProjectOwnerId, setEditProjectOwnerId] = useState("");
  const [editProjectBidDate, setEditProjectBidDate] = useState("");

  const debouncedSearch = useDebouncedValue(search);

  const { data: listData, isLoading, isError, refetch } = useQuery({
    queryKey: ["projects", "list", { search: debouncedSearch, page }],
    queryFn: () =>
      listAllProjects({ search: debouncedSearch || undefined, page, page_size: pageSize }) as Promise<{ items: any[]; total: number }>,
    placeholderData: keepPreviousData,
  });
  const projects = listData?.items ?? [];
  const total = listData?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const debouncedNewProjectAccountSearch = useDebouncedValue(newProjectAccountSearch);

  // Searches server-side instead of preloading every account -- a plain
  // page_size bump still silently truncates once accounts exceed the
  // backend's page_size cap (le=100, account/router.py), which is exactly
  // what happened in UAT once real hospital count passed 100 (2026-09-08).
  const { data: accounts = [], isFetching: accountsLoading } = useQuery({
    queryKey: ["accounts", "picker", debouncedNewProjectAccountSearch],
    queryFn: async () =>
      (await listAccounts({ search: debouncedNewProjectAccountSearch || undefined, page_size: 20 })).items ?? [],
    enabled: showCreateProject || editingProject !== null,
  });
  const { data: projectStatuses = [] } = useQuery({
    queryKey: ["project-statuses"],
    queryFn: () => listProjectStatuses() as Promise<any[]>,
    enabled: showCreateProject || editingProject !== null,
    staleTime: Infinity,
  });
  const { data: users = [] } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => listUsers() as Promise<any[]>,
    enabled: showCreateProject || editingProject !== null,
    staleTime: Infinity,
  });

  const openCreateProject = useCallback(() => {
    setNewProjectAccountId("");
    setNewProjectAccount(null);
    setNewProjectAccountSearch("");
    setNewProjectName("");
    setNewProjectStatusId("");
    setNewProjectOwnerId("");
    setNewProjectBidDate("");
    setShowCreateProject(true);
  }, []);
  useEffect(() => {
    if (openCreateRef) openCreateRef.current = openCreateProject;
  }, [openCreateRef, openCreateProject]);

  // Called by DemoApp.tsx's navigate() when leaving this screen via the sidebar —
  // this screen stays mounted (hidden via CSS) rather than unmounting like
  // Customer360Screen/OpportunityDetailScreen, so its own detail-mode state
  // doesn't reset for free and needs this explicit nudge from the parent.
  useEffect(() => {
    if (resetDetailRef) {
      resetDetailRef.current = () => {
        setSelectedProject(null);
        onSelectProject?.(null);
      };
    }
  }, [resetDetailRef, onSelectProject]);

  // Called by DemoApp.tsx to jump straight to a specific project's detail
  // view from outside this screen (e.g. clicking a project card on Customer
  // 360) — mirrors what clicking a project row already does internally.
  // DemoApp.tsx's ref type only guarantees {id, name}, but every real caller
  // (Customer360Screen.tsx's Projects tab) actually passes the full project
  // record ProjectDetailView needs (.account, .status, .owner, ...) — same
  // cross-file looseness the 2026-08-01 archive entry already documents and
  // fixed once before; not new here.
  useEffect(() => {
    if (openProjectRef) {
      openProjectRef.current = (p) => {
        setSelectedProject(p);
        onSelectProject?.(p as unknown as ProjectRef);
        onDetailModeChange?.(true);
      };
    }
  }, [openProjectRef, onSelectProject, onDetailModeChange]);

  const handleCreateProject = async () => {
    if (!newProjectAccountId) throw new Error("Account is required");
    if (!newProjectName.trim()) throw new Error("Project name is required");
    if (!newProjectStatusId) throw new Error("Status is required");
    if (!newProjectOwnerId) throw new Error("Owner is required");
    const payload: any = {
      name: newProjectName.trim(),
      owner_id: newProjectOwnerId,
      status_id: newProjectStatusId,
    };
    if (newProjectBidDate) payload.bid_submission_date = newProjectBidDate;
    await createProject(newProjectAccountId as any, payload);
    queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
    queryClient.invalidateQueries({ queryKey: ["projects", "byAccount", newProjectAccountId] });
  };

  const openEditProject = (p: any) => {
    setEditingProject(p);
    setEditProjectName(p.name || "");
    setEditProjectStatusId(p.status?.id || "");
    setEditProjectOwnerId(p.owner?.id || "");
    setEditProjectBidDate(p.bid_submission_date || "");
  };

  const handleUpdateProject = async () => {
    if (!editProjectName.trim()) throw new Error("Project name is required");
    const payload: any = {
      name: editProjectName.trim(),
      owner_id: editProjectOwnerId || undefined,
      status_id: editProjectStatusId || undefined,
    };
    if (editProjectBidDate) payload.bid_submission_date = editProjectBidDate;
    await updateProject(editingProject.id as any, payload);
    queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
    queryClient.invalidateQueries({ queryKey: ["projects", "byAccount", editingProject.account?.id] });
    // Stay on this project's detail view with the edit reflected, instead of
    // bouncing back to the list (a pre-existing gap in the original file --
    // selectedProject was a static local snapshot with no way to refresh in
    // place, so returning to the list was the only way to see the update).
    // The PATCH response is the flat ProjectResponse shape (IDs only), not
    // the nested account/status/owner shape this view renders, so the
    // chosen status/owner are looked up from the already-loaded picker
    // lists instead of a second round trip.
    const updated = {
      ...editingProject,
      name: editProjectName.trim(),
      status: projectStatuses.find((s: any) => s.id === editProjectStatusId) ?? editingProject.status,
      owner: users.find((u: any) => u.id === editProjectOwnerId) ?? editingProject.owner,
      bid_submission_date: editProjectBidDate || null,
    };
    setSelectedProject(updated);
    onSelectProject?.(updated);
  };

  if (selectedProject) {
    return (
      <>
        <ProjectDetailView
          key={selectedProject.id}
          project={selectedProject}
          onBack={() => {
            setSelectedProject(null);
            onSelectProject?.(null);
            onDetailModeChange?.(false);
            onDetailBack?.();
          }}
          onEdit={() => openEditProject(selectedProject)}
          refreshOppsRef={refreshOppsRef}
          openLogActivityRef={openLogActivityRef}
          onSelectOpportunity={onSelectOpportunity}
        />
        <FormModal isOpen={editingProject !== null} onClose={() => setEditingProject(null)} title="Edit Project" onSubmit={handleUpdateProject}>
          {editingProject && (
            <Box sx={{ px: 1.5, py: 1, bgcolor: "#eff6ff", borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 700, color: "primary.main", mb: 0.5 }}>
              {editingProject.account?.name}
            </Box>
          )}
          <TextField label="Name *" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} autoFocus fullWidth size="small" />
          <TextField
            select
            label="Status"
            value={editProjectStatusId}
            onChange={(e) => setEditProjectStatusId(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select status</MenuItem>
            {projectStatuses.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Owner"
            value={editProjectOwnerId}
            onChange={(e) => setEditProjectOwnerId(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select owner</MenuItem>
            {users.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
          </TextField>
          <TextField label="Bid Submission Date" type="date" value={editProjectBidDate} onChange={(e) => setEditProjectBidDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
        </FormModal>
      </>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#f9fafb" }}>
      {/* Fixed header */}
      <Box sx={{ px: 2, pt: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, mb: 3, bgcolor: "#fff", p: 2, borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6" }}>
          <TextField
            placeholder="Search by project or hospital..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            size="small"
            fullWidth
            autoComplete="off"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearch(""); setPage(1); }}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
        </Box>
      </Box>

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 2, pb: 2 }}>
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={() => refetch()}>Retry</Button>}>
            Failed to load projects
          </Alert>
        )}

        {isLoading && (
          <Typography sx={{ textAlign: "center", py: 6, color: "#9ca3af", fontWeight: 700, fontSize: "0.875rem" }}>Loading projects...</Typography>
        )}

        {!isLoading && !isError && (
          <>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {projects.map((p: any) => (
                <Box
                  key={p.id}
                  onClick={() => { setSelectedProject(p); onSelectProject?.(p); onDetailModeChange?.(true); }}
                  sx={{
                    bgcolor: "#fff", py: 1.5, px: 2, borderRadius: "1.5rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6",
                    cursor: "pointer", transition: "all 0.15s",
                    "&:hover": { borderColor: "#60a5fa", boxShadow: "0 4px 6px rgba(0,0,0,0.07)" },
                    "&:hover [data-part='project-avatar']": { bgcolor: "#d97706", color: "#fff" },
                    "&:hover [data-part='project-name']": { color: "#1e3a8a" },
                    "&:hover [data-part='project-chevron']": { color: "primary.main" },
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Box
                      data-part="project-avatar"
                      sx={{
                        width: 36, height: 36, bgcolor: "#fffbeb", color: "#d97706", borderRadius: "0.75rem",
                        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.875rem",
                        boxShadow: SHADOW_SM, flexShrink: 0, alignSelf: "center", transition: "background-color 0.15s, color 0.15s",
                      }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography data-part="project-name" sx={{ fontWeight: 700, color: "#1f2937", fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.15s" }}>
                        {p.name}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mt: 0.25 }}>
                        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.account.name}</Typography>
                        <Box sx={{ bgcolor: "#f9fafb", p: 1, borderRadius: "0.75rem", flexShrink: 0, transition: "background-color 0.15s" }}>
                          <ChevronRightIcon data-part="project-chevron" sx={{ fontSize: 18, color: "#9ca3af", transition: "color 0.15s" }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1.5, rowGap: 0.5, mt: 0.75 }}>
                        <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #99f6e4", bgcolor: "#f0fdfa", color: "#0f766e" }}>
                          {p.status.status_name}
                        </Box>
                        <Box>
                          <Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Owner: </Box>
                          <Box component="span" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{p.owner.display_name}</Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>

            {projects.length === 0 && (
              <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6" }}>
                <Typography sx={{ fontStyle: "italic", color: "#9ca3af" }}>
                  {search ? `No projects or hospitals matching "${search}".` : "No projects found."}
                </Typography>
              </Box>
            )}

            {totalPages > 1 && (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mt: 3 }}>
                <Button size="small" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Prev
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Page {page} of {totalPages} ({total} total)
                </Typography>
                <Button size="small" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Create Project Modal */}
      <FormModal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="New Project" onSubmit={handleCreateProject} submitLabel="Create">
        <Autocomplete
          options={accounts}
          getOptionLabel={(a: any) => a.name}
          isOptionEqualToValue={(a: any, v: any) => a.id === v.id}
          value={newProjectAccount}
          loading={accountsLoading}
          onChange={(_e, newValue: any) => { setNewProjectAccount(newValue); setNewProjectAccountId(newValue?.id ?? ""); }}
          onInputChange={(_e, newInputValue) => setNewProjectAccountSearch(newInputValue)}
          renderInput={(params) => <TextField {...params} label="Account *" size="small" sx={{ mt: 1.5 }} />}
          fullWidth
          size="small"
        />
        <TextField label="Name *" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Enter project name" autoFocus fullWidth size="small" />
        <TextField
          select
          label="Status *"
          value={newProjectStatusId}
          onChange={(e) => setNewProjectStatusId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select status</MenuItem>
          {projectStatuses.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Owner *"
          value={newProjectOwnerId}
          onChange={(e) => setNewProjectOwnerId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select owner</MenuItem>
          {users.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField label="Bid Submission Date" type="date" value={newProjectBidDate} onChange={(e) => setNewProjectBidDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
      </FormModal>
    </Box>
  );
}
