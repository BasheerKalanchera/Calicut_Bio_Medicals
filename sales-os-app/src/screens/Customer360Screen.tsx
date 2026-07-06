import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
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
  addOpportunityItem,
  deleteOpportunityItem,
  listInstalledAssets,
  createInstalledAsset,
  updateInstalledAsset,
} from "../services/accounts";
import { listOpportunityItems } from "../services/opportunities";
import {
  listZones,
  listProjectStatuses,
  listLeadSources,
  listStages,
  listStatuses,
  listUsers,
  listLossReasons,
  listHoldReasons,
} from "../services/masterData";
import { listProducts } from "../services/products";
import { listActivitiesByAccount } from "../services/activities";
import { isReactivationOverdue } from "../utils/opportunityStatus";
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
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "stakeholders", label: "Stakeholders" },
  { id: "projects", label: "Projects" },
  { id: "opportunities", label: "Opportunities" },
  { id: "installed", label: "Installed Base" },
];

const SHADOW_SM = "0 1px 2px rgba(0,0,0,0.05)";

// ---------------------------------------------------------------------------
// Small presentational components
// ---------------------------------------------------------------------------
function PayerBadge({ behavior }: { behavior?: string | null }) {
  if (!behavior) return null;
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    GOOD: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
    PROBLEMATIC: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
    UNKNOWN: { bg: "#f9fafb", color: "#4b5563", border: "#e5e7eb" },
  };
  const s = styles[behavior] ?? styles.UNKNOWN;
  return (
    <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid", borderColor: s.border, bgcolor: s.bg, color: s.color }}>
      {behavior}
    </Box>
  );
}

function SentimentBadge({ sentiment }: { sentiment?: string | null }) {
  if (!sentiment) return null;
  const config: Record<string, { label: string; bg: string; color: string; border: string }> = {
    PROMOTER: { label: "Promoter", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
    NEUTRAL: { label: "Neutral", bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    DETRACTOR: { label: "Detractor", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  };
  const c = config[sentiment] ?? { label: sentiment, bg: "#f9fafb", color: "#4b5563", border: "#e5e7eb" };
  return (
    <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: "0.375rem", fontSize: "10px", fontWeight: 900, border: "1px solid", borderColor: c.border, bgcolor: c.bg, color: c.color }}>
      {c.label}
    </Box>
  );
}

function NpsIndicator({ score }: { score?: number | null }) {
  if (score == null) return <Box component="span" sx={{ color: "#d1d5db", fontSize: "0.75rem" }}>—</Box>;
  const color = score >= 50 ? "#059669" : score >= 0 ? "#d97706" : "#dc2626";
  return <Box component="span" sx={{ fontWeight: 900, fontSize: "1.125rem", color }}>{score}</Box>;
}

function LoadingRow({ label = "Loading..." }: { label?: string }) {
  return (
    <Box sx={{ textAlign: "center", py: 6 }}>
      <Box
        sx={{
          color: "#9ca3af",
          fontWeight: 700,
          fontSize: "0.875rem",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.5 } },
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Tab components
// ---------------------------------------------------------------------------
function OverviewTab({ account, onEdit }: { account: any; onEdit: () => void }) {
  const fields = [
    { label: "Account Name", value: account.name },
    { label: "Zone", value: account.zone?.name || "—" },
    { label: "Payer Behavior", value: <PayerBadge behavior={account.payer_behavior} /> },
  ];
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ bgcolor: "#fff", borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
            Account Details
          </Typography>
          <Button
            onClick={onEdit}
            sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
          >
            Edit
          </Button>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {fields.map((f) => (
            <Box key={f.label}>
              <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
                {f.label}
              </Typography>
              <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{f.value || "—"}</Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function StakeholdersTab({ stakeholders, onAdd, onEdit }: { stakeholders: any[]; onAdd: () => void; onEdit: (s: any) => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Stakeholders ({stakeholders.length})
        </Typography>
        <Button
          onClick={onAdd}
          sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#7c3aed", bgcolor: "#f5f3ff", "&:hover": { bgcolor: "#ede9fe" } }}
        >
          + Add
        </Button>
      </Box>
      {stakeholders.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" }}>
          No stakeholders found for this account.
        </Box>
      ) : (
        stakeholders.map((s) => (
          <Box key={s.id} sx={{ bgcolor: "#fff", p: 2, borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, bgcolor: "#f5f3ff", color: "#7c3aed", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.875rem", boxShadow: SHADOW_SM }}>
                {s.name.charAt(0)}
              </Box>
              <Box>
                <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{s.name}</Box>
                {s.designation && <Box sx={{ fontSize: "0.75rem", color: "#6b7280", mt: 0.25 }}>{s.designation}</Box>}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}><SentimentBadge sentiment={s.sentiment} /></Box>
                {(s.email || s.phone) && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}>
                    {s.email && <Box component="span" sx={{ fontSize: "10px", color: "#9ca3af" }}>{s.email}</Box>}
                    {s.phone && <Box component="span" sx={{ fontSize: "10px", color: "#9ca3af" }}>{s.phone}</Box>}
                  </Box>
                )}
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: "9px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.25 }}>NPS</Typography>
                <NpsIndicator score={s.nps_score} />
              </Box>
              <Button
                onClick={() => onEdit(s)}
                sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#7c3aed", bgcolor: "#f5f3ff", "&:hover": { bgcolor: "#ede9fe" } }}
              >
                Edit
              </Button>
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}

function ProjectsTab({ projects, onAdd, onEdit }: { projects: any[]; onAdd: () => void; onEdit: (p: any) => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Projects ({projects.length})
        </Typography>
        <Button
          onClick={onAdd}
          sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
        >
          + Add
        </Button>
      </Box>
      {projects.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" }}>
          No projects found for this account.
        </Box>
      ) : (
        projects.map((p) => (
          <Box key={p.id} sx={{ bgcolor: "#fff", p: 2, borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{p.name}</Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #bfdbfe", bgcolor: "#eff6ff", color: "#1d4ed8" }}>
                  {p.status.status_name}
                </Box>
                <Button
                  onClick={() => onEdit(p)}
                  sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
                >
                  Edit
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 2, rowGap: 0.5, fontSize: "0.75rem", color: "#6b7280" }}>
              <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Owner: </Box><Box component="span" sx={{ fontWeight: 700 }}>{p.owner.display_name}</Box></Box>
              {p.bid_submission_date && <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Bid Date: </Box><Box component="span" sx={{ fontWeight: 700 }}>{p.bid_submission_date}</Box></Box>}
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}

function OpportunitiesTab({ opportunities, onAdd, onEdit }: { opportunities: any[]; onAdd: () => void; onEdit: (o: any) => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Opportunities ({opportunities.length})
        </Typography>
        <Button
          onClick={onAdd}
          sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#059669", bgcolor: "#ecfdf5", "&:hover": { bgcolor: "#d1fae5" } }}
        >
          + Add
        </Button>
      </Box>
      {opportunities.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" }}>
          No opportunities found for this account.
        </Box>
      ) : (
        opportunities.map((o) => (
          <Box key={o.id} sx={{ bgcolor: "#fff", p: 2, borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{o.name}</Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #fde68a", bgcolor: "#fffbeb", color: "#b45309" }}>
                  {o.stage.stage_name}
                </Box>
                <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #bfdbfe", bgcolor: "#eff6ff", color: "#1d4ed8" }}>
                  {o.status.status_name}
                </Box>
                {isReactivationOverdue(o.status?.status_code, o.reactivation_date) && (
                  <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #fecaca", bgcolor: "#fef2f2", color: "#dc2626" }}>
                    Reactivation Overdue
                  </Box>
                )}
                <Button
                  onClick={() => onEdit(o)}
                  sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#059669", bgcolor: "#ecfdf5", "&:hover": { bgcolor: "#d1fae5" } }}
                >
                  Edit
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 2, rowGap: 0.5, fontSize: "0.75rem", color: "#6b7280" }}>
              <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Owner: </Box><Box component="span" sx={{ fontWeight: 700 }}>{o.owner.display_name}</Box></Box>
              <Box>
                <Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Win %: </Box>
                <Box component="span" sx={{ fontWeight: 900, color: Number(o.win_probability) >= 70 ? "#059669" : Number(o.win_probability) >= 40 ? "#d97706" : "#dc2626" }}>
                  {o.win_probability}%
                </Box>
              </Box>
              {o.indicative_value && <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Value: </Box><Box component="span" sx={{ fontWeight: 700 }}>{o.indicative_value}L</Box></Box>}
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}

function InstalledBaseTab({ assets, onAdd, onEdit }: { assets: any[]; onAdd: () => void; onEdit: (a: any) => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Installed Base ({assets.length})
        </Typography>
        <Button
          onClick={onAdd}
          sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
        >
          + Add
        </Button>
      </Box>
      {assets.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" }}>
          No installed assets found for this account.
        </Box>
      ) : (
        assets.map((a) => {
          const productName = a.is_competitor_equipment ? a.competitor_product_name || "Unknown Competitor" : a.product?.name || "Unknown Product";
          const modelInfo = !a.is_competitor_equipment && a.product?.model_number ? a.product.model_number : null;
          const oemInfo = !a.is_competitor_equipment && a.product?.oem_name ? a.product.oem_name : null;
          return (
            <Box key={a.id} sx={{ bgcolor: "#fff", p: 2, borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid", borderColor: a.is_competitor_equipment ? "#fecaca" : "#f3f4f6" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{productName}</Box>
                  {a.is_competitor_equipment && (
                    <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: "0.375rem", fontSize: "10px", fontWeight: 900, border: "1px solid #fecaca", bgcolor: "#fef2f2", color: "#dc2626" }}>
                      COMPETITOR
                    </Box>
                  )}
                </Box>
                <Button
                  onClick={() => onEdit(a)}
                  sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
                >
                  Edit
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 2, rowGap: 0.5, fontSize: "0.75rem", color: "#6b7280" }}>
                {oemInfo && <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>OEM: </Box><Box component="span" sx={{ fontWeight: 700 }}>{oemInfo}</Box></Box>}
                {modelInfo && <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Model: </Box><Box component="span" sx={{ fontWeight: 700 }}>{modelInfo}</Box></Box>}
                {a.department && <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Dept: </Box><Box component="span" sx={{ fontWeight: 700 }}>{a.department}</Box></Box>}
                {a.installation_date && <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Installed: </Box><Box component="span" sx={{ fontWeight: 700 }}>{a.installation_date}</Box></Box>}
              </Box>
            </Box>
          );
        })
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function Customer360Screen({ accountId, initialAccount = null, onBack, onAccountUpdate }: Props) {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: account,
    isLoading: loading,
    isError: hasAccountError,
    error: accountError,
    refetch: refetchAccount,
  } = useQuery({
    queryKey: ["account", accountId],
    queryFn: () => getAccount(accountId as any) as Promise<any>,
    initialData: initialAccount ?? undefined,
  });

  const { data: accountCounts } = useQuery({
    queryKey: ["account-counts", accountId],
    queryFn: async () => {
      const countMap: any = await getAccountCounts([accountId] as any);
      return countMap[accountId] || {};
    },
    enabled: initialAccount?.stakeholder_count == null,
  });
  // accountCounts is only a stopgap while `account` still lacks count fields (e.g.
  // initialAccount came from a summary list view) — once the account query itself
  // resolves with real counts, its fields take precedence over the stopgap.
  const mergedAccount = account ? { ...accountCounts, ...account } : account;

  useEffect(() => {
    if (account) onAccountUpdate?.(account);
  }, [account]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: stakeholders = [], isLoading: stakeholdersLoading } = useQuery({
    queryKey: ["stakeholders", "byAccount", accountId],
    queryFn: () => listStakeholders(accountId as any) as Promise<any[]>,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", "byAccount", accountId],
    queryFn: () => listProjects(accountId as any) as Promise<any[]>,
  });

  const { data: opportunities = [], isLoading: opportunitiesLoading } = useQuery({
    queryKey: ["opportunities", "byAccount", accountId],
    queryFn: () => listOpportunities(accountId as any) as Promise<any[]>,
  });

  const { data: installed = [], isLoading: installedLoading } = useQuery({
    queryKey: ["installed-assets", "byAccount", accountId],
    queryFn: () => listInstalledAssets(accountId as any) as Promise<any[]>,
  });

  // Owns the activities fetch — ActivityTimeline is rendered with selfFetch={false}
  // below, so it never fetches on its own; it only reads this query's cached result.
  // Unlike the 4 tabs above, ActivityTimeline is conditionally mounted (only when
  // activeTab === "activity"), so without a query living here (always-mounted,
  // same as the others), its data wouldn't start fetching until the user actually
  // clicked the tab.
  useQuery({
    queryKey: ["activities", "account", accountId],
    queryFn: () => listActivitiesByAccount(accountId as any),
    staleTime: 5 * 60 * 1000,
  });

  const [activeTab, setActiveTab] = useState("overview");

  // Activity tab
  const [showLogActivity, setShowLogActivity] = useState(false);

  // Edit Account
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [editAccountName, setEditAccountName] = useState("");
  const [editAccountZoneId, setEditAccountZoneId] = useState("");
  const [editAccountPayer, setEditAccountPayer] = useState("");

  // Stakeholders
  const [showCreateStakeholder, setShowCreateStakeholder] = useState(false);
  const [newSName, setNewSName] = useState("");
  const [newSDesignation, setNewSDesignation] = useState("");
  const [newSEmail, setNewSEmail] = useState("");
  const [newSPhone, setNewSPhone] = useState("");
  const [newSNps, setNewSNps] = useState("");
  const [newSSentiment, setNewSSentiment] = useState("");
  const [editingStakeholder, setEditingStakeholder] = useState<any | null>(null);
  const [editSName, setEditSName] = useState("");
  const [editSDesignation, setEditSDesignation] = useState("");
  const [editSEmail, setEditSEmail] = useState("");
  const [editSPhone, setEditSPhone] = useState("");
  const [editSNps, setEditSNps] = useState("");
  const [editSSentiment, setEditSSentiment] = useState("");

  // Projects
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newPName, setNewPName] = useState("");
  const [newPStatusId, setNewPStatusId] = useState("");
  const [newPOwnerId, setNewPOwnerId] = useState("");
  const [newPBidDate, setNewPBidDate] = useState("");
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editPName, setEditPName] = useState("");
  const [editPStatusId, setEditPStatusId] = useState("");
  const [editPOwnerId, setEditPOwnerId] = useState("");
  const [editPBidDate, setEditPBidDate] = useState("");

  // Opportunities
  const [showCreateOpp, setShowCreateOpp] = useState(false);
  const [showNewOppItems, setShowNewOppItems] = useState(false);
  const [newOName, setNewOName] = useState("");
  const [newOProjectId, setNewOProjectId] = useState("");
  const [newOStageId, setNewOStageId] = useState("");
  const [newOStatusId, setNewOStatusId] = useState("");
  const [newOLeadSourceId, setNewOLeadSourceId] = useState("");
  const [newOOwnerId, setNewOOwnerId] = useState("");
  const [newOWinProb, setNewOWinProb] = useState("");
  const [newOValue, setNewOValue] = useState("");
  const [newOItems, setNewOItems] = useState<any[]>([]);
  const [newOItemProdId, setNewOItemProdId] = useState("");
  const [newOItemQty, setNewOItemQty] = useState("1");
  const [newOItemPrice, setNewOItemPrice] = useState("0");
  const [newOItemDisc, setNewOItemDisc] = useState("0");
  const [newOItemError, setNewOItemError] = useState<string | null>(null);
  const [editingOpp, setEditingOpp] = useState<any | null>(null);
  const [showEditOppItems, setShowEditOppItems] = useState(false);
  const [editOName, setEditOName] = useState("");
  const [editOProjectId, setEditOProjectId] = useState("");
  const [editOStageId, setEditOStageId] = useState("");
  const [editOStatusId, setEditOStatusId] = useState("");
  const [editOLeadSourceId, setEditOLeadSourceId] = useState("");
  const [editOOwnerId, setEditOOwnerId] = useState("");
  const [editOWinProb, setEditOWinProb] = useState("");
  const [editOValue, setEditOValue] = useState("");
  const [editOItems, setEditOItems] = useState<any[]>([]);
  const [editOOriginalItemIds, setEditOOriginalItemIds] = useState<string[]>([]);
  const [editOItemProdId, setEditOItemProdId] = useState("");
  const [editOItemQty, setEditOItemQty] = useState("1");
  const [editOItemPrice, setEditOItemPrice] = useState("0");
  const [editOItemDisc, setEditOItemDisc] = useState("0");
  const [editOItemError, setEditOItemError] = useState<string | null>(null);
  // Status-gated fields (BR-OP-02/03/05). Prefilled from o.* in openEditOpp — the
  // by-account opportunities list response now includes them (WorkspaceOpportunity).
  // Hold/Loss fields are still only sent when the effective status is ON_HOLD/LOST
  // (see handleUpdateOpp), so editing an opportunity without touching its status
  // never overwrites a previously-set hold/loss reason with an unrelated blank field.
  const [editOPoNumber, setEditOPoNumber] = useState("");
  const [editOHoldReasonId, setEditOHoldReasonId] = useState("");
  const [editOReactivationDate, setEditOReactivationDate] = useState("");
  const [editOLossReasonId, setEditOLossReasonId] = useState("");
  const [editOCompetitorName, setEditOCompetitorName] = useState("");

  // Installed assets
  const [showCreateAsset, setShowCreateAsset] = useState(false);
  const [newAIsCompetitor, setNewAIsCompetitor] = useState(false);
  const [newAProductId, setNewAProductId] = useState("");
  const [newACompetitorName, setNewACompetitorName] = useState("");
  const [newAInstallDate, setNewAInstallDate] = useState("");
  const [newADepartment, setNewADepartment] = useState("");
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [editAIsCompetitor, setEditAIsCompetitor] = useState(false);
  const [editAProductId, setEditAProductId] = useState("");
  const [editACompetitorName, setEditACompetitorName] = useState("");
  const [editAInstallDate, setEditAInstallDate] = useState("");
  const [editADepartment, setEditADepartment] = useState("");

  // Master data (fetched on demand — enabled only while the modal that needs it is open)
  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: async () => { const d: any = await listZones(); return d.items || d; },
    enabled: showEditAccount,
    staleTime: Infinity,
  });

  const { data: projectStatuses = [] } = useQuery({
    queryKey: ["project-statuses"],
    queryFn: () => listProjectStatuses() as Promise<any[]>,
    enabled: showCreateProject || editingProject !== null,
    staleTime: Infinity,
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["stages"],
    queryFn: () => listStages() as Promise<any[]>,
    enabled: showCreateOpp || editingOpp !== null,
    staleTime: Infinity,
  });

  const { data: oppStatuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => listStatuses() as Promise<any[]>,
    enabled: showCreateOpp || editingOpp !== null,
    staleTime: Infinity,
  });

  const { data: leadSources = [] } = useQuery({
    queryKey: ["leadSources"],
    queryFn: () => listLeadSources() as Promise<any[]>,
    enabled: showCreateOpp || editingOpp !== null,
    staleTime: Infinity,
  });

  // Only needed on the Edit Opportunity modal (BR-OP-03/05 status gates) — Create
  // Opportunity can't set these fields at all (OpportunityCreate has no such fields).
  const { data: lossReasons = [] } = useQuery({
    queryKey: ["lossReasons"],
    queryFn: () => listLossReasons() as Promise<any[]>,
    enabled: editingOpp !== null,
    staleTime: Infinity,
  });

  const { data: holdReasons = [] } = useQuery({
    queryKey: ["holdReasons"],
    queryFn: () => listHoldReasons() as Promise<any[]>,
    enabled: editingOpp !== null,
    staleTime: Infinity,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => listUsers() as Promise<any[]>,
    enabled: showCreateProject || editingProject !== null || showCreateOpp || editingOpp !== null,
    staleTime: Infinity,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", "picker", (userProfile as any)?.sbu?.id],
    queryFn: async () => {
      const d: any = await listProducts({ page_size: 100, sbu_id: (userProfile as any)?.sbu?.id } as any);
      return d.items || [];
    },
    enabled: showCreateOpp || editingOpp !== null || showCreateAsset || editingAsset !== null,
  });

  // Edit Opportunity's item list is an editable draft buffer, not a direct render of
  // query data. listOpportunityItems is only fetched on-demand (enabled: editingOpp
  // !== null), so it isn't available the instant the modal opens — it arrives
  // asynchronously. Seed the draft once per editingOpp.id via a ref guard, not a plain
  // [oppItemsData]-keyed effect: otherwise a background refetch (React Query's default
  // refetchOnWindowFocus) while the modal is open would silently clobber unsaved edits.
  const { data: oppItemsData } = useQuery({
    queryKey: ["opp-items", editingOpp?.id],
    queryFn: () => listOpportunityItems(editingOpp!.id),
    enabled: editingOpp !== null,
  });
  const seededOppIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (editingOpp === null) { seededOppIdRef.current = null; return; }
    if (oppItemsData === undefined) return;
    if (seededOppIdRef.current === editingOpp.id) return;
    seededOppIdRef.current = editingOpp.id;
    const mapped = oppItemsData.map((i: any) => ({ id: i.id, product_id: i.product_id, product_name: i.product?.name || "", quantity: i.quantity, unit_price_lakhs: Number(i.unit_price_lakhs), discount_lakhs: Number(i.discount_lakhs) }));
    setEditOItems(mapped);
    setEditOOriginalItemIds(mapped.map((i: any) => i.id));
  }, [editingOpp, oppItemsData]);

  const chipBarRef = useRef<HTMLDivElement>(null);

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

  // --- Loading / error states ---
  if (loading) {
    return (
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, p: 2, bgcolor: "#f9fafb" }}>
        <LoadingRow label="Loading Customer 360..." />
      </Box>
    );
  }
  if (hasAccountError && !account) {
    return (
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, p: 2, bgcolor: "#f9fafb" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Button
            onClick={onBack}
            sx={{ bgcolor: "#f3f4f6", "&:hover": { bgcolor: "#e5e7eb" }, color: "#4b5563", px: 1.5, py: 0.75, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            ← Back
          </Button>
        </Box>
        <Alert
          severity="error"
          action={
            <Button
              onClick={() => refetchAccount()}
              sx={{ bgcolor: "#fee2e2", "&:hover": { bgcolor: "#fecaca" }, color: "#b91c1c", px: 1.5, py: 0.5, borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Retry
            </Button>
          }
        >
          {(accountError as any)?.message || "Failed to load account"}
        </Alert>
      </Box>
    );
  }

  // --- Modal helpers ---
  // Edit account
  const openEditAccount = () => {
    setEditAccountName(account.name || "");
    setEditAccountZoneId(account.zone?.id || "");
    setEditAccountPayer(account.payer_behavior || "");
    setShowEditAccount(true);
  };

  const handleUpdateAccount = async () => {
    if (!editAccountName.trim()) throw new Error("Customer name is required");
    if (!editAccountZoneId) throw new Error("Zone is required");
    const payload: any = { name: editAccountName.trim(), zone_id: editAccountZoneId };
    if (editAccountPayer) payload.payer_behavior = editAccountPayer;
    await updateAccount(accountId as any, payload);
    queryClient.invalidateQueries({ queryKey: ["account", accountId] });
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
    queryClient.invalidateQueries({ queryKey: ["stakeholders", "byAccount", accountId] });
    queryClient.invalidateQueries({ queryKey: ["account", accountId] });
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
    queryClient.invalidateQueries({ queryKey: ["stakeholders", "byAccount", accountId] });
  };

  // Projects
  const openCreateProject = () => {
    setNewPName(""); setNewPStatusId(""); setNewPOwnerId(""); setNewPBidDate("");
    setShowCreateProject(true);
  };

  const handleCreateProject = async () => {
    if (!newPName.trim()) throw new Error("Project name is required");
    if (!newPOwnerId) throw new Error("Owner is required");
    if (!newPStatusId) throw new Error("Status is required");
    const payload: any = { name: newPName.trim(), owner_id: newPOwnerId, status_id: newPStatusId };
    if (newPBidDate) payload.bid_submission_date = newPBidDate;
    await createProject(accountId as any, payload);
    queryClient.invalidateQueries({ queryKey: ["projects", "byAccount", accountId] });
    queryClient.invalidateQueries({ queryKey: ["account", accountId] });
  };

  const openEditProject = (p: any) => {
    setEditingProject(p); setEditPName(p.name || ""); setEditPStatusId(p.status?.id || "");
    setEditPOwnerId(p.owner?.id || ""); setEditPBidDate(p.bid_submission_date || "");
  };

  const handleUpdateProject = async () => {
    if (!editPName.trim()) throw new Error("Project name is required");
    const payload: any = { name: editPName.trim(), owner_id: editPOwnerId || undefined, status_id: editPStatusId || undefined };
    if (editPBidDate) payload.bid_submission_date = editPBidDate;
    await updateProject(editingProject.id, payload);
    queryClient.invalidateQueries({ queryKey: ["projects", "byAccount", accountId] });
  };

  // Opportunities
  const openCreateOpp = () => {
    setNewOName(""); setNewOProjectId(""); setNewOStageId(""); setNewOStatusId(""); setNewOLeadSourceId("");
    setNewOOwnerId(""); setNewOWinProb(""); setNewOValue(""); setNewOItems([]);
    setNewOItemProdId(""); setNewOItemQty("1"); setNewOItemPrice("0"); setNewOItemDisc("0"); setNewOItemError(null);
    setShowCreateOpp(true);
  };

  const handleCreateOpp = async () => {
    if (!newOName.trim()) throw new Error("Opportunity name is required");
    if (!newOOwnerId) throw new Error("Owner is required");
    if (!newOStageId) throw new Error("Stage is required");
    if (!newOStatusId) throw new Error("Status is required");
    if (newOWinProb === "") throw new Error("Win probability is required");
    const _stage = stages.find((s: any) => s.id === newOStageId);
    const _qual = stages.find((s: any) => s.stage_code === "QUALIFIED");
    if (_stage && _qual && _stage.display_order >= _qual.display_order && newOValue === "") {
      throw new Error("Indicative value is required for Qualified stage and above");
    }
    const payload: any = { name: newOName.trim(), owner_id: newOOwnerId, stage_id: newOStageId, status_id: newOStatusId, win_probability: Number(newOWinProb) };
    if (newOProjectId) payload.project_id = newOProjectId;
    if (newOLeadSourceId) payload.lead_source_id = newOLeadSourceId;
    if (newOValue !== "") payload.indicative_value = Number(newOValue);
    if (newOItems.length > 0) payload.items = newOItems.map((i: any) => ({ product_id: i.product_id, quantity: i.quantity, unit_price_lakhs: i.unit_price_lakhs, discount_lakhs: i.discount_lakhs }));
    await createOpportunity(accountId as any, payload);
    queryClient.invalidateQueries({ queryKey: ["opportunities", "byAccount", accountId] });
    queryClient.invalidateQueries({ queryKey: ["account", accountId] });
  };

  const openEditOpp = (o: any) => {
    setEditingOpp(o); setEditOName(o.name || ""); setEditOProjectId(o.project_id || "");
    setEditOStageId(o.stage?.id || ""); setEditOStatusId(o.status?.id || "");
    setEditOLeadSourceId(o.lead_source_id || ""); setEditOOwnerId(o.owner?.id || "");
    setEditOWinProb(o.win_probability != null ? String(o.win_probability) : "");
    setEditOValue(o.indicative_value != null ? String(o.indicative_value) : "");
    setEditOItems([]); setEditOOriginalItemIds([]);
    setEditOItemProdId(""); setEditOItemQty("1"); setEditOItemPrice("0"); setEditOItemDisc("0"); setEditOItemError(null);
    setEditOPoNumber(o.po_number || ""); setEditOHoldReasonId(o.hold_reason_id || "");
    setEditOReactivationDate(o.reactivation_date || ""); setEditOLossReasonId(o.loss_reason_id || "");
    setEditOCompetitorName(o.competitor_name || "");
  };

  const handleUpdateOpp = async () => {
    if (!editOName.trim()) throw new Error("Opportunity name is required");
    const _editStage = stages.find((s: any) => s.id === editOStageId);
    const _qualStage = stages.find((s: any) => s.stage_code === "QUALIFIED");
    if (_editStage && _qualStage && _editStage.display_order >= _qualStage.display_order && editOValue === "") {
      throw new Error("Indicative value is required for Qualified stage and above");
    }
    // BR-OP-02/03/05: status-gated required fields. Re-checked/re-sent on every save
    // while the selected status is On Hold/Lost, since the form has no way to know
    // whether they were already satisfied by a previous save (see field declarations).
    const _newStatus = oppStatuses.find((s: any) => s.id === editOStatusId);
    const _selectedLossReason = lossReasons.find((r: any) => r.id === editOLossReasonId);
    if (_newStatus?.status_code === "ON_HOLD") {
      if (!editOHoldReasonId) throw new Error("Hold Reason is required to put an opportunity On-Hold");
      if (!editOReactivationDate) throw new Error("Reactivation Date is required to put an opportunity On-Hold");
      if (editOReactivationDate <= new Date().toISOString().slice(0, 10)) throw new Error("Reactivation Date must be a future date");
    }
    if (_newStatus?.status_code === "LOST") {
      if (!editOLossReasonId) throw new Error("Loss Reason is required to mark an opportunity as Lost");
      if (_selectedLossReason?.reason_code === "COMPETITOR_WON" && !editOCompetitorName.trim()) {
        throw new Error("Competitor Name is required when Loss Reason is 'Competitor Won'");
      }
    }
    if (_newStatus?.status_code === "WON" && !editOPoNumber.trim()) {
      throw new Error("PO Number is required to mark an opportunity as Won");
    }
    const payload: any = {
      name: editOName.trim(), owner_id: editOOwnerId || undefined,
      stage_id: editOStageId || undefined, status_id: editOStatusId || undefined,
      win_probability: editOWinProb !== "" ? Number(editOWinProb) : undefined,
      lead_source_id: editOLeadSourceId || null,
      indicative_value: editOValue !== "" ? Number(editOValue) : null,
    };
    if (editOProjectId) payload.project_id = editOProjectId;
    payload.po_number = editOPoNumber.trim() || null;
    if (_newStatus?.status_code === "ON_HOLD") {
      payload.hold_reason_id = editOHoldReasonId;
      payload.reactivation_date = editOReactivationDate;
    }
    if (_newStatus?.status_code === "LOST") {
      payload.loss_reason_id = editOLossReasonId;
      if (editOCompetitorName.trim()) payload.competitor_name = editOCompetitorName.trim();
    }
    await updateOpportunity(editingOpp.id, payload);
    const currentIds = editOItems.filter((i: any) => i.id).map((i: any) => i.id);
    const toDelete = editOOriginalItemIds.filter((id) => !currentIds.includes(id));
    const toAdd = editOItems.filter((i: any) => !i.id);
    await Promise.all([
      ...toDelete.map((id) => deleteOpportunityItem(id as any).catch(() => { })),
      ...toAdd.map((i: any) => addOpportunityItem(editingOpp.id, { product_id: i.product_id, quantity: i.quantity, unit_price_lakhs: i.unit_price_lakhs, discount_lakhs: i.discount_lakhs }).catch(() => { })),
    ]);
    queryClient.invalidateQueries({ queryKey: ["opportunities", "byAccount", accountId] });
    queryClient.invalidateQueries({ queryKey: ["opp-items", editingOpp.id] });
  };

  // Installed assets
  const openCreateAsset = () => {
    setNewAIsCompetitor(false); setNewAProductId(""); setNewACompetitorName(""); setNewAInstallDate(""); setNewADepartment("");
    setShowCreateAsset(true);
  };

  const handleCreateAsset = async () => {
    if (!newAIsCompetitor && !newAProductId) throw new Error("Product is required");
    const payload: any = { is_competitor_equipment: newAIsCompetitor, installation_date: newAInstallDate || null, department: newADepartment.trim() || null };
    if (newAIsCompetitor) { payload.competitor_product_name = newACompetitorName.trim() || null; } else { payload.product_id = newAProductId; }
    await createInstalledAsset(accountId as any, payload);
    queryClient.invalidateQueries({ queryKey: ["installed-assets", "byAccount", accountId] });
  };

  const openEditAsset = (a: any) => {
    setEditingAsset(a); setEditAIsCompetitor(a.is_competitor_equipment);
    setEditAProductId(a.product?.id || ""); setEditACompetitorName(a.competitor_product_name || "");
    setEditAInstallDate(a.installation_date || ""); setEditADepartment(a.department || "");
  };

  const handleUpdateAsset = async () => {
    if (!editAIsCompetitor && !editAProductId) throw new Error("Product is required");
    const payload: any = { is_competitor_equipment: editAIsCompetitor, installation_date: editAInstallDate || null, department: editADepartment.trim() || null };
    if (editAIsCompetitor) { payload.competitor_product_name = editACompetitorName.trim() || null; payload.product_id = null; }
    else { payload.product_id = editAProductId; payload.competitor_product_name = null; }
    await updateInstalledAsset(editingAsset.id, payload);
    queryClient.invalidateQueries({ queryKey: ["installed-assets", "byAccount", accountId] });
  };

  // Helper: render the add-product sub-form row
  const OppItemAddRow = ({ prodId, setProdId, qty, setQty, price, setPrice, disc, setDisc, items, setItems, error, setError }: any) => (
    <Box sx={{ borderTop: "1px solid #f3f4f6", pt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
        Add Product
      </Typography>
      <TextField
        select
        value={prodId}
        onChange={(e: any) => { setProdId(e.target.value); setError(null); }}
        fullWidth
        size="small"
        slotProps={{ select: { displayEmpty: true } }}
      >
        <MenuItem value="">Select product</MenuItem>
        {products.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
      </TextField>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        <TextField label="Qty" type="number" size="small" value={qty} onChange={(e: any) => { setQty(e.target.value); setError(null); }} slotProps={{ htmlInput: { min: 1 }, inputLabel: { shrink: true } }} sx={{ width: "5rem" }} />
        <TextField label="Price (₹L)" type="number" size="small" value={price} onChange={(e: any) => { setPrice(e.target.value); setError(null); }} slotProps={{ htmlInput: { min: 0, step: "any" }, inputLabel: { shrink: true } }} sx={{ width: "7.5rem" }} />
        <TextField label="Disc (₹L)" type="number" size="small" value={disc} onChange={(e: any) => { setDisc(e.target.value); setError(null); }} slotProps={{ htmlInput: { min: 0, step: "any" }, inputLabel: { shrink: true } }} sx={{ width: "7.5rem" }} />
      </Box>
      {error && <Alert severity="error" sx={{ fontSize: "0.75rem" }}>{error}</Alert>}
      <Button
        type="button"
        fullWidth
        onClick={() => {
          if (!prodId) { setError("Select a product"); return; }
          if (Number(qty) <= 0) { setError("Quantity must be greater than 0"); return; }
          if (Number(price) <= 0) { setError("Price must be greater than 0"); return; }
          setError(null);
          const prod: any = products.find((p: any) => p.id === prodId);
          setItems([...items, { product_id: prodId, product_name: prod?.name || "", quantity: Number(qty), unit_price_lakhs: Number(price), discount_lakhs: Number(disc || 0) }]);
          setProdId(""); setQty("1"); setPrice("0"); setDisc("0");
        }}
        sx={{ py: 1, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
      >
        + Add Product
      </Button>
    </Box>
  );

  const editOStatusCode = oppStatuses.find((s: any) => s.id === editOStatusId)?.status_code;
  const editOLossReasonCode = lossReasons.find((r: any) => r.id === editOLossReasonId)?.reason_code;

  return (
    <Box
      sx={{
        flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#f9fafb",
        animation: "fadeIn 200ms",
        "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
      }}
    >
      {/* Fixed header */}
      <Box sx={{ px: 2, pt: 2, bgcolor: "#f9fafb" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <IconButton onClick={onBack} aria-label="Back" sx={{ width: 40, height: 40, color: "#4b5563", flexShrink: 0, "&:hover": { bgcolor: "#e5e7eb" } }}>
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#1f2937", letterSpacing: "-0.025em", lineHeight: 1.25 }}>
              {account.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
              {account.zone && (
                <Box component="span" sx={{ px: 1.25, py: 0.25, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #99f6e4", bgcolor: "#f0fdfa", color: "#0f766e" }}>
                  {account.zone.name}
                </Box>
              )}
              <PayerBadge behavior={account.payer_behavior} />
            </Box>
          </Box>
        </Box>

        {/* Count strip */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-around", bgcolor: "#fff", borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", px: 2, py: 1.5, mb: 2 }}>
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ fontSize: "1.25rem", fontWeight: 900, color: "#7c3aed" }}>{mergedAccount.stakeholder_count ?? "—"}</Box>
            <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.25 }}>Stakeholders</Box>
          </Box>
          <Box sx={{ width: "1px", height: 32, bgcolor: "#f3f4f6" }} />
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ fontSize: "1.25rem", fontWeight: 900, color: "primary.main" }}>{mergedAccount.project_count ?? "—"}</Box>
            <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.25 }}>Projects</Box>
          </Box>
          <Box sx={{ width: "1px", height: 32, bgcolor: "#f3f4f6" }} />
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ fontSize: "1.25rem", fontWeight: 900, color: "#059669" }}>{mergedAccount.opportunity_count ?? "—"}</Box>
            <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.25 }}>Opportunities</Box>
          </Box>
        </Box>

        {/* Tab chip bar */}
        <Box sx={{ position: "relative", mb: 2 }}>
          <Box
            ref={chipBarRef}
            sx={{
              display: "flex", gap: 1, overflowX: "auto", pb: 0.5,
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
              pr: "50vw",
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => handleTabChange(tab.id)}
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
          <Box sx={{ position: "absolute", right: 0, top: 0, height: "100%", width: 40, pointerEvents: "none", background: "linear-gradient(to left, #f9fafb, transparent)" }} />
        </Box>
      </Box>

      {/* Scrollable tab content */}
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 2, pb: 2 }}>
        {activeTab === "overview" && <OverviewTab account={account} onEdit={openEditAccount} />}
        {activeTab === "stakeholders" && (stakeholdersLoading ? <LoadingRow /> : <StakeholdersTab stakeholders={stakeholders} onAdd={openCreateStakeholder} onEdit={openEditStakeholder} />)}
        {activeTab === "projects" && (projectsLoading ? <LoadingRow /> : <ProjectsTab projects={projects} onAdd={openCreateProject} onEdit={openEditProject} />)}
        {activeTab === "opportunities" && (opportunitiesLoading ? <LoadingRow /> : <OpportunitiesTab opportunities={opportunities} onAdd={openCreateOpp} onEdit={openEditOpp} />)}
        {activeTab === "installed" && (installedLoading ? <LoadingRow /> : <InstalledBaseTab assets={installed} onAdd={openCreateAsset} onEdit={openEditAsset} />)}
        {activeTab === "activity" && (
          <ActivityTimeline accountId={accountId} onLogActivity={() => setShowLogActivity(true)} totalCount={mergedAccount.activity_count} selfFetch={false} />
        )}
      </Box>

      {/* ---- Modals ---- */}

      {/* Edit Account */}
      <FormModal isOpen={showEditAccount} onClose={() => setShowEditAccount(false)} title="Edit Customer" onSubmit={handleUpdateAccount}>
        <TextField label="Name *" value={editAccountName} onChange={(e) => setEditAccountName(e.target.value)} autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <TextField
          select label="Zone *" value={editAccountZoneId} onChange={(e) => setEditAccountZoneId(e.target.value)}
          fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select zone</MenuItem>
          {zones.map((z: any) => <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>)}
        </TextField>
        <TextField
          select label="Payer Behavior" value={editAccountPayer} onChange={(e) => setEditAccountPayer(e.target.value)}
          fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select behavior</MenuItem>
          <MenuItem value="GOOD">Good</MenuItem>
          <MenuItem value="AVERAGE">Average</MenuItem>
          <MenuItem value="PROBLEMATIC">Problematic</MenuItem>
          <MenuItem value="UNKNOWN">Unknown</MenuItem>
        </TextField>
      </FormModal>

      {/* Create Stakeholder */}
      <FormModal isOpen={showCreateStakeholder} onClose={() => setShowCreateStakeholder(false)} title="New Stakeholder" onSubmit={handleCreateStakeholder} submitLabel="Create">
        <TextField label="Name *" value={newSName} onChange={(e) => setNewSName(e.target.value)} placeholder="Enter stakeholder name" autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <TextField label="Designation" value={newSDesignation} onChange={(e) => setNewSDesignation(e.target.value)} placeholder="e.g. Chief Radiologist" fullWidth size="small" />
        <TextField label="Email" type="email" value={newSEmail} onChange={(e) => setNewSEmail(e.target.value)} placeholder="e.g. doctor@hospital.com" fullWidth size="small" />
        <TextField label="Phone" type="tel" value={newSPhone} onChange={(e) => setNewSPhone(e.target.value)} placeholder="e.g. +91-9876543210" fullWidth size="small" />
        <TextField label="NPS Score" type="number" value={newSNps} onChange={(e) => setNewSNps(e.target.value)} placeholder="-100 to 100" fullWidth size="small" slotProps={{ htmlInput: { min: -100, max: 100 } }} />
        <TextField
          select label="Sentiment" value={newSSentiment} onChange={(e) => setNewSSentiment(e.target.value)}
          fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select sentiment</MenuItem>
          <MenuItem value="PROMOTER">Promoter</MenuItem>
          <MenuItem value="NEUTRAL">Neutral</MenuItem>
          <MenuItem value="DETRACTOR">Detractor</MenuItem>
        </TextField>
      </FormModal>

      {/* Edit Stakeholder */}
      <FormModal isOpen={editingStakeholder !== null} onClose={() => setEditingStakeholder(null)} title="Edit Stakeholder" onSubmit={handleUpdateStakeholder}>
        <TextField label="Name *" value={editSName} onChange={(e) => setEditSName(e.target.value)} autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <TextField label="Designation" value={editSDesignation} onChange={(e) => setEditSDesignation(e.target.value)} fullWidth size="small" />
        <TextField label="Email" type="email" value={editSEmail} onChange={(e) => setEditSEmail(e.target.value)} fullWidth size="small" />
        <TextField label="Phone" type="tel" value={editSPhone} onChange={(e) => setEditSPhone(e.target.value)} fullWidth size="small" />
        <TextField label="NPS Score" type="number" value={editSNps} onChange={(e) => setEditSNps(e.target.value)} fullWidth size="small" slotProps={{ htmlInput: { min: -100, max: 100 } }} />
        <TextField
          select label="Sentiment" value={editSSentiment} onChange={(e) => setEditSSentiment(e.target.value)}
          fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select sentiment</MenuItem>
          <MenuItem value="PROMOTER">Promoter</MenuItem>
          <MenuItem value="NEUTRAL">Neutral</MenuItem>
          <MenuItem value="DETRACTOR">Detractor</MenuItem>
        </TextField>
      </FormModal>

      {/* Create Project */}
      <FormModal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="New Project" onSubmit={handleCreateProject} submitLabel="Create">
        <TextField label="Name *" value={newPName} onChange={(e) => setNewPName(e.target.value)} placeholder="Enter project name" autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <TextField select label="Status *" value={newPStatusId} onChange={(e) => setNewPStatusId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Select status</MenuItem>
          {projectStatuses.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
        </TextField>
        <TextField select label="Owner *" value={newPOwnerId} onChange={(e) => setNewPOwnerId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Select owner</MenuItem>
          {users.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField label="Bid Submission Date" type="date" value={newPBidDate} onChange={(e) => setNewPBidDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
      </FormModal>

      {/* Edit Project */}
      <FormModal isOpen={editingProject !== null} onClose={() => setEditingProject(null)} title="Edit Project" onSubmit={handleUpdateProject}>
        <TextField label="Name *" value={editPName} onChange={(e) => setEditPName(e.target.value)} autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <TextField select label="Status" value={editPStatusId} onChange={(e) => setEditPStatusId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Select status</MenuItem>
          {projectStatuses.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
        </TextField>
        <TextField select label="Owner" value={editPOwnerId} onChange={(e) => setEditPOwnerId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Select owner</MenuItem>
          {users.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField label="Bid Submission Date" type="date" value={editPBidDate} onChange={(e) => setEditPBidDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
      </FormModal>

      {/* Create Opportunity */}
      <FormModal isOpen={showCreateOpp} onClose={() => setShowCreateOpp(false)} title="New Opportunity" onSubmit={handleCreateOpp} submitLabel="Create">
        <TextField label="Name *" value={newOName} onChange={(e) => setNewOName(e.target.value)} placeholder="Enter opportunity name" autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <TextField select label="Project" value={newOProjectId} onChange={(e) => setNewOProjectId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">None</MenuItem>
          {projects.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <TextField
            select label="Stage *" value={newOStageId}
            onChange={(e) => { const s: any = stages.find((x: any) => x.id === e.target.value); setNewOStageId(e.target.value); if (s) setNewOWinProb(String(s.default_win_probability)); }}
            fullWidth size="small" sx={{ flex: 1 }} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select stage</MenuItem>
            {stages.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.stage_name}</MenuItem>)}
          </TextField>
          <TextField select label="Status *" value={newOStatusId} onChange={(e) => setNewOStatusId(e.target.value)} fullWidth size="small" sx={{ flex: 1 }} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
            <MenuItem value="">Select status</MenuItem>
            {oppStatuses.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
          </TextField>
        </Box>
        <TextField select label="Lead Source" value={newOLeadSourceId} onChange={(e) => setNewOLeadSourceId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Select source</MenuItem>
          {leadSources.map((ls: any) => <MenuItem key={ls.id} value={ls.id}>{ls.name}</MenuItem>)}
        </TextField>
        <TextField select label="Owner *" value={newOOwnerId} onChange={(e) => setNewOOwnerId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Select owner</MenuItem>
          {users.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField label="Win Probability % *" type="number" value={newOWinProb} onChange={(e) => setNewOWinProb(e.target.value)} placeholder="Enter Win Probability %" fullWidth size="small" slotProps={{ htmlInput: { min: 0, max: 100 } }} />
        <TextField
          label={`Indicative Value (Lakhs)${newOItems.length > 0 ? " (auto)" : ""}`}
          type="number" value={newOValue} onChange={(e) => setNewOValue(e.target.value)}
          disabled={newOItems.length > 0} placeholder="Enter Indicative Value (Lakhs)"
          fullWidth size="small" slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
        <Box sx={{ borderTop: "1px solid #f3f4f6", pt: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Products</Typography>
            <Button
              type="button"
              onClick={() => setShowNewOppItems(true)}
              sx={{ px: 1.5, py: 0.5, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#059669", bgcolor: "#ecfdf5", "&:hover": { bgcolor: "#d1fae5" } }}
            >
              {newOItems.length > 0 ? `Edit (${newOItems.length})` : "+ Add Products"}
            </Button>
          </Box>
          {newOItems.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              {newOItems.map((i: any, idx: number) => (
                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, bgcolor: "#f9fafb", borderRadius: "0.75rem", fontSize: "0.75rem" }}>
                  <Typography sx={{ flex: 1, fontWeight: 700, fontSize: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.product_name}</Typography>
                  <Typography sx={{ color: "#9ca3af", fontSize: "inherit", flexShrink: 0 }}>{i.quantity}×₹{i.unit_price_lakhs}L{i.discount_lakhs > 0 ? ` −₹${i.discount_lakhs}L` : ""}</Typography>
                </Box>
              ))}
              <Typography sx={{ textAlign: "right", fontSize: "10px", fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", pr: 0.5 }}>
                Total: ₹{newOItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L
              </Typography>
            </Box>
          ) : <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af", fontStyle: "italic" }}>No products added</Typography>}
        </Box>
      </FormModal>

      <FormModal isOpen={showNewOppItems} onClose={() => setShowNewOppItems(false)} title="Products" onSubmit={async () => { }} submitLabel="Done">
        {newOItems.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {newOItems.map((item: any, i: number) => (
              <Box key={i} sx={{ px: 1.5, py: 1, bgcolor: "#f9fafb", borderRadius: "0.75rem", fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product_name}</Typography>
                  <IconButton type="button" size="small" onClick={() => setNewOItems(newOItems.filter((_: any, j: number) => j !== i))} sx={{ ml: 1 }}>
                    <Box component="span" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#f87171", "&:hover": { color: "#dc2626" } }}>×</Box>
                  </IconButton>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  {(["quantity", "unit_price_lakhs", "discount_lakhs"] as const).map((key) => (
                    <TextField
                      key={key}
                      label={key === "quantity" ? "Qty" : key === "unit_price_lakhs" ? "Price ₹L" : "Disc ₹L"}
                      type="number" size="small" value={item[key]}
                      onChange={(e) => setNewOItems(newOItems.map((it: any, j: number) => j === i ? { ...it, [key]: Number(e.target.value) } : it))}
                      slotProps={{ htmlInput: { min: 0, step: "any" }, inputLabel: { shrink: true } }}
                      sx={{ width: key === "quantity" ? "5rem" : "7.5rem" }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
            <Typography sx={{ textAlign: "right", fontSize: "10px", fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", pr: 0.5 }}>
              Total: ₹{newOItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L
            </Typography>
          </Box>
        )}
        <OppItemAddRow prodId={newOItemProdId} setProdId={setNewOItemProdId} qty={newOItemQty} setQty={setNewOItemQty} price={newOItemPrice} setPrice={setNewOItemPrice} disc={newOItemDisc} setDisc={setNewOItemDisc} items={newOItems} setItems={setNewOItems} error={newOItemError} setError={setNewOItemError} />
      </FormModal>

      {/* Edit Opportunity */}
      <FormModal isOpen={editingOpp !== null} onClose={() => setEditingOpp(null)} title="Edit Opportunity" onSubmit={handleUpdateOpp}>
        <TextField label="Name *" value={editOName} onChange={(e) => setEditOName(e.target.value)} autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <TextField select label="Project" value={editOProjectId} onChange={(e) => setEditOProjectId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">None</MenuItem>
          {projects.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <TextField
            select label="Stage" value={editOStageId}
            onChange={(e) => { const s: any = stages.find((x: any) => x.id === e.target.value); setEditOStageId(e.target.value); if (s) setEditOWinProb(String(s.default_win_probability)); }}
            fullWidth size="small" sx={{ flex: 1 }} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select stage</MenuItem>
            {stages.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.stage_name}</MenuItem>)}
          </TextField>
          <TextField select label="Status" value={editOStatusId} onChange={(e) => setEditOStatusId(e.target.value)} fullWidth size="small" sx={{ flex: 1 }} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
            <MenuItem value="">Select status</MenuItem>
            {oppStatuses.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
          </TextField>
        </Box>
        <TextField select label="Lead Source" value={editOLeadSourceId} onChange={(e) => setEditOLeadSourceId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Select source</MenuItem>
          {leadSources.map((ls: any) => <MenuItem key={ls.id} value={ls.id}>{ls.name}</MenuItem>)}
        </TextField>
        <TextField select label="Owner" value={editOOwnerId} onChange={(e) => setEditOOwnerId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Select owner</MenuItem>
          {users.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField label="Win Probability %" type="number" value={editOWinProb} onChange={(e) => setEditOWinProb(e.target.value)} fullWidth size="small" slotProps={{ htmlInput: { min: 0, max: 100 } }} />
        <TextField
          label={`Indicative Value (Lakhs)${editOItems.length > 0 ? " (auto)" : ""}`}
          type="number" value={editOValue} onChange={(e) => setEditOValue(e.target.value)}
          disabled={editOItems.length > 0}
          fullWidth size="small" slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
        <TextField label="PO Number" value={editOPoNumber} onChange={(e) => setEditOPoNumber(e.target.value)} placeholder="e.g. PO-2024-001" fullWidth size="small" />
        {editOStatusCode === "ON_HOLD" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1.5, borderRadius: "0.75rem", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
            <TextField
              select label="Hold Reason *" value={editOHoldReasonId} onChange={(e) => setEditOHoldReasonId(e.target.value)}
              fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Select reason</MenuItem>
              {holdReasons.map((r: any) => <MenuItem key={r.id} value={r.id}>{r.reason_name}</MenuItem>)}
            </TextField>
            <TextField
              label="Reactivation Date *" type="date" value={editOReactivationDate} onChange={(e) => setEditOReactivationDate(e.target.value)}
              fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        )}
        {editOStatusCode === "LOST" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1.5, borderRadius: "0.75rem", bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
            <TextField
              select label="Loss Reason *" value={editOLossReasonId} onChange={(e) => setEditOLossReasonId(e.target.value)}
              fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Select reason</MenuItem>
              {lossReasons.map((r: any) => <MenuItem key={r.id} value={r.id}>{r.reason_name}</MenuItem>)}
            </TextField>
            {editOLossReasonCode === "COMPETITOR_WON" && (
              <TextField label="Competitor Name *" value={editOCompetitorName} onChange={(e) => setEditOCompetitorName(e.target.value)} placeholder="e.g. Siemens" fullWidth size="small" />
            )}
          </Box>
        )}
        <Box sx={{ borderTop: "1px solid #f3f4f6", pt: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Products</Typography>
            <Button
              type="button"
              onClick={() => setShowEditOppItems(true)}
              sx={{ px: 1.5, py: 0.5, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#059669", bgcolor: "#ecfdf5", "&:hover": { bgcolor: "#d1fae5" } }}
            >
              {editOItems.length > 0 ? `Edit (${editOItems.length})` : "+ Add Products"}
            </Button>
          </Box>
          {editOItems.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              {editOItems.map((i: any, idx: number) => (
                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, bgcolor: "#f9fafb", borderRadius: "0.75rem", fontSize: "0.75rem" }}>
                  <Typography sx={{ flex: 1, fontWeight: 700, fontSize: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.product_name}</Typography>
                  <Typography sx={{ color: "#9ca3af", fontSize: "inherit", flexShrink: 0 }}>{i.quantity}×₹{i.unit_price_lakhs}L{i.discount_lakhs > 0 ? ` −₹${i.discount_lakhs}L` : ""}</Typography>
                </Box>
              ))}
              <Typography sx={{ textAlign: "right", fontSize: "10px", fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", pr: 0.5 }}>
                Total: ₹{editOItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L
              </Typography>
            </Box>
          ) : <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af", fontStyle: "italic" }}>No products added</Typography>}
        </Box>
      </FormModal>

      <FormModal isOpen={showEditOppItems} onClose={() => setShowEditOppItems(false)} title="Products" onSubmit={async () => { }} submitLabel="Done">
        {editOItems.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {editOItems.map((item: any, i: number) => (
              <Box key={i} sx={{ px: 1.5, py: 1, bgcolor: "#f9fafb", borderRadius: "0.75rem", fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product_name}</Typography>
                  <IconButton type="button" size="small" onClick={() => setEditOItems(editOItems.filter((_: any, j: number) => j !== i))} sx={{ ml: 1 }}>
                    <Box component="span" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#f87171", "&:hover": { color: "#dc2626" } }}>×</Box>
                  </IconButton>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  {(["quantity", "unit_price_lakhs", "discount_lakhs"] as const).map((key) => (
                    <TextField
                      key={key}
                      label={key === "quantity" ? "Qty" : key === "unit_price_lakhs" ? "Price ₹L" : "Disc ₹L"}
                      type="number" size="small" value={item[key]}
                      onChange={(e) => { const { id: _id, ...rest } = item; setEditOItems(editOItems.map((it: any, j: number) => j === i ? { ...rest, [key]: Number(e.target.value) } : it)); }}
                      slotProps={{ htmlInput: { min: 0, step: "any" }, inputLabel: { shrink: true } }}
                      sx={{ width: key === "quantity" ? "5rem" : "7.5rem" }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
            <Typography sx={{ textAlign: "right", fontSize: "10px", fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", pr: 0.5 }}>
              Total: ₹{editOItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L
            </Typography>
          </Box>
        )}
        <OppItemAddRow prodId={editOItemProdId} setProdId={setEditOItemProdId} qty={editOItemQty} setQty={setEditOItemQty} price={editOItemPrice} setPrice={setEditOItemPrice} disc={editOItemDisc} setDisc={setEditOItemDisc} items={editOItems} setItems={setEditOItems} error={editOItemError} setError={setEditOItemError} />
      </FormModal>

      {/* Create Asset */}
      <FormModal isOpen={showCreateAsset} onClose={() => setShowCreateAsset(false)} title="New Installed Asset" onSubmit={handleCreateAsset} submitLabel="Create">
        <Box>
          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>Equipment Type</Typography>
          <FormControlLabel
            control={<Checkbox color="primary" checked={newAIsCompetitor} onChange={(e) => setNewAIsCompetitor(e.target.checked)} />}
            label={<Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151" }}>Competitor Equipment</Typography>}
          />
        </Box>
        {newAIsCompetitor ? (
          <TextField label="Competitor Product Name" value={newACompetitorName} onChange={(e) => setNewACompetitorName(e.target.value)} placeholder="e.g. Siemens SOMATOM" fullWidth size="small" />
        ) : (
          <TextField select label="Product *" value={newAProductId} onChange={(e) => setNewAProductId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
            <MenuItem value="">Select product</MenuItem>
            {products.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
        )}
        <TextField label="Department" value={newADepartment} onChange={(e) => setNewADepartment(e.target.value)} placeholder="e.g. Radiology" fullWidth size="small" />
        <TextField label="Installation Date" type="date" value={newAInstallDate} onChange={(e) => setNewAInstallDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
      </FormModal>

      {/* Edit Asset */}
      <FormModal isOpen={editingAsset !== null} onClose={() => setEditingAsset(null)} title="Edit Installed Asset" onSubmit={handleUpdateAsset}>
        <Box>
          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>Equipment Type</Typography>
          <FormControlLabel
            control={<Checkbox color="primary" checked={editAIsCompetitor} onChange={(e) => setEditAIsCompetitor(e.target.checked)} />}
            label={<Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151" }}>Competitor Equipment</Typography>}
          />
        </Box>
        {editAIsCompetitor ? (
          <TextField label="Competitor Product Name" value={editACompetitorName} onChange={(e) => setEditACompetitorName(e.target.value)} fullWidth size="small" />
        ) : (
          <TextField select label="Product *" value={editAProductId} onChange={(e) => setEditAProductId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
            <MenuItem value="">Select product</MenuItem>
            {products.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
        )}
        <TextField label="Department" value={editADepartment} onChange={(e) => setEditADepartment(e.target.value)} fullWidth size="small" />
        <TextField label="Installation Date" type="date" value={editAInstallDate} onChange={(e) => setEditAInstallDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
      </FormModal>

      {/* Log Activity */}
      <LogActivityModal
        isOpen={showLogActivity}
        onClose={() => setShowLogActivity(false)}
        accountId={accountId}
        currentUserId={(userProfile as any)?.id}
      />
    </Box>
  );
}
