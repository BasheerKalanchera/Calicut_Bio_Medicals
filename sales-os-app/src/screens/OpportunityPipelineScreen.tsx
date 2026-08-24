import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  ButtonBase,
  IconButton,
  InputAdornment,
  ListSubheader,
  MenuItem,
  TextField,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { listPipeline } from "../services/opportunities";
import { listStages, listUsers } from "../services/masterData";
import { isReactivationOverdue } from "../utils/opportunityStatus";
import ZonePicker from "../components/ZonePicker";
import type { PipelineOpportunity } from "../types/api-aliases";
import type { ZoneSearchResult } from "../services/masterData";

interface Props {
  onSelectOpportunity: (opp: PipelineOpportunity) => void;
  viewMode: "kanban" | "list";
}

// ---------------------------------------------------------------------------
// Stage order used to build columns — matches seed data display_order values
// ---------------------------------------------------------------------------
const PIPELINE_STAGE_CODES = [
  "LEAD",
  "QUALIFIED",
  "DEMO",
  "CLINICAL_EVALUATION",
  "NEGOTIATION",
  "ORDER",
];

// Local stopgap types — listStages/listUsers return Promise<unknown> today.
// TODO(fix-at-service-layer): give these functions real return types; see
// active_progress.md deferred list. Remove these once fixed.
interface StageOption { stage_code: string; stage_name: string; display_order: number }
interface UserOption { id: string; display_name: string; is_active?: boolean | null }

// ---------------------------------------------------------------------------
// Status badge colours
// ---------------------------------------------------------------------------
function StatusBadge({ code }: { code: string }) {
  const colours: Record<string, { bg: string; color: string }> = {
    ACTIVE:  { bg: "#d1fae5", color: "#047857" },
    ON_HOLD: { bg: "#fef3c7", color: "#b45309" },
    STALLED: { bg: "#f3f4f6", color: "#6b7280" },
    WON:     { bg: "#dbeafe", color: "#1d4ed8" },
    LOST:    { bg: "#fee2e2", color: "#dc2626" },
  };
  const c = colours[code] ?? colours.STALLED;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block", px: 0.75, py: 0.25, borderRadius: "0.25rem",
        fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
        bgcolor: c.bg, color: c.color,
      }}
    >
      {code.replace("_", " ")}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Deal card
// ---------------------------------------------------------------------------
function DealCard({
  opp,
  onClick,
}: {
  opp: PipelineOpportunity;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      focusRipple
      sx={{
        width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "stretch", gap: 0.75,
        bgcolor: "#fff", borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        border: "1px solid #f3f4f6", p: 1.5, transition: "all 0.15s",
        "&:hover": { boxShadow: "0 4px 6px rgba(0,0,0,0.07)", borderColor: "#bfdbfe" },
        "&:active": { transform: "scale(0.98)" },
      }}
    >
      <Box sx={{ fontWeight: 700, fontSize: "0.875rem", color: "#1f2937", lineHeight: 1.375 }}>
        {opp.name}
      </Box>
      <Box sx={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {opp.account.name}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5 }}>
        <StatusBadge code={opp.status.status_code} />
        {opp.indicative_value && (
          <Box component="span" sx={{ fontSize: "10px", fontWeight: 900, color: "#374151" }}>
            ₹{parseFloat(opp.indicative_value).toFixed(1)}L
          </Box>
        )}
      </Box>
      {isReactivationOverdue(opp.status.status_code, opp.reactivation_date) && (
        <Box component="span" sx={{ alignSelf: "flex-start", px: 1, py: 0.25, borderRadius: "0.375rem", fontSize: "9px", fontWeight: 900, border: "1px solid #fecaca", bgcolor: "#fef2f2", color: "#dc2626" }}>
          Reactivation Overdue
        </Box>
      )}
      <Box sx={{ fontSize: "9px", color: "#9ca3af", fontWeight: 500 }}>
        {opp.owner.display_name}
      </Box>
    </ButtonBase>
  );
}

// ---------------------------------------------------------------------------
// Single stage column (used in both mobile pill view and desktop Kanban)
// ---------------------------------------------------------------------------
function StageColumn({
  stageName,
  deals,
  onSelect,
}: {
  stageName: string;
  deals: PipelineOpportunity[];
  onSelect: (opp: PipelineOpportunity) => void;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 0.75, pl: 1.5, pr: 0.5 }}>
        <Box component="span" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {stageName}
        </Box>
        <Box component="span" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", bgcolor: "#f3f4f6", borderRadius: "9999px", px: 0.75 }}>
          {deals.length}
        </Box>
      </Box>
      {deals.length === 0 ? (
        <Box sx={{ fontSize: "10px", color: "#d1d5db", fontStyle: "italic", textAlign: "center", py: 2 }}>No deals</Box>
      ) : (
        deals.map((opp) => (
          <DealCard key={opp.id} opp={opp} onClick={() => onSelect(opp)} />
        ))
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// List card
// ---------------------------------------------------------------------------
function ListRow({
  opp,
  onClick,
}: {
  opp: PipelineOpportunity;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: "#fff", py: 1.5, px: 2, borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        border: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center",
        cursor: "pointer", transition: "all 0.15s",
        "&:hover": { borderColor: "#60a5fa", boxShadow: "0 4px 6px rgba(0,0,0,0.07)" },
        "&:hover [data-part='deal-name']": { color: "#1e3a8a" },
        "&:hover [data-part='deal-avatar']": { bgcolor: "primary.main", color: "#fff" },
        "&:hover [data-part='deal-chevron-box']": { bgcolor: "#eff6ff" },
        "&:hover [data-part='deal-chevron-icon']": { color: "primary.main" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <Box
          data-part="deal-avatar"
          sx={{
            width: 36, height: 36, bgcolor: "#eff6ff", color: "primary.main", borderRadius: "0.75rem",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.875rem",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)", flexShrink: 0, transition: "background-color 0.15s, color 0.15s",
          }}
        >
          {opp.name.charAt(0).toUpperCase()}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box
            data-part="deal-name"
            sx={{ fontWeight: 700, color: "#1f2937", fontSize: "0.875rem", transition: "color 0.15s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {opp.name}
          </Box>
          <Box sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", mt: 0.25 }}>
            {opp.account.name}
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, mt: 0.75 }}>
            <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: "0.375rem", fontSize: "10px", fontWeight: 900, border: "1px solid #bfdbfe", bgcolor: "#eff6ff", color: "#1d4ed8" }}>
              {opp.stage.stage_name}
            </Box>
            <StatusBadge code={opp.status.status_code} />
            {isReactivationOverdue(opp.status.status_code, opp.reactivation_date) && (
              <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: "0.375rem", fontSize: "10px", fontWeight: 900, border: "1px solid #fecaca", bgcolor: "#fef2f2", color: "#dc2626" }}>
                Reactivation Overdue
              </Box>
            )}
            {opp.indicative_value && (
              <Box component="span" sx={{ fontSize: "10px", fontWeight: 900, color: "#059669" }}>
                ₹{parseFloat(opp.indicative_value).toFixed(1)}L
              </Box>
            )}
            <Box component="span" sx={{ fontSize: "10px", color: "#9ca3af" }}>{opp.owner.display_name}</Box>
          </Box>
        </Box>
      </Box>
      <Box data-part="deal-chevron-box" sx={{ bgcolor: "background.default", p: 1, borderRadius: "0.75rem", flexShrink: 0, ml: 1, transition: "background-color 0.15s" }}>
        <ChevronRightIcon data-part="deal-chevron-icon" sx={{ fontSize: 18, color: "#9ca3af", transition: "color 0.15s" }} />
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function OpportunityPipelineScreen({ onSelectOpportunity, viewMode }: Props) {
  const [activeStageCode, setActiveStageCode] = useState<string>("LEAD");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [zoneFilter, setZoneFilter]   = useState<ZoneSearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pillBarRef = useRef<HTMLDivElement>(null);
  const kanbanRowRef = useRef<HTMLDivElement>(null);

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["pipeline", ownerFilter, zoneFilter?.id],
    queryFn: () => listPipeline({ owner_id: ownerFilter || undefined, zone_id: zoneFilter?.id || undefined, page_size: 100 }),
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["stages"],
    queryFn: async () => (await listStages()) as StageOption[],
    staleTime: Infinity,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users", "include-inactive"],
    // include_inactive=true -- this is a filter over existing deals, not an
    // assignment picker, so a deactivated owner's opportunities still need
    // to be findable here (unlike the assignee/reassignment pickers, which
    // correctly stay active-only).
    queryFn: async () => (await listUsers("scoped", true)) as UserOption[],
    staleTime: Infinity,
  });
  const activeOwners = users.filter((u) => u.is_active !== false);
  const inactiveOwners = users.filter((u) => u.is_active === false);

  const allDeals = pipeline?.items ?? [];

  const filteredDeals = searchQuery.trim()
    ? allDeals.filter((d) => {
        const q = searchQuery.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.account.name.toLowerCase().includes(q);
      })
    : allDeals;

  // Sort stages by display_order, filter to pipeline stages only
  const orderedStages = stages
    .filter((s) => PIPELINE_STAGE_CODES.includes(s.stage_code))
    .sort((a, b) => a.display_order - b.display_order);

  const dealsByStage = (stageCode: string) =>
    filteredDeals.filter((d) => d.stage.stage_code === stageCode);

  // getBoundingClientRect-based, not offsetLeft-based: offsetLeft is relative to
  // the nearest *positioned* ancestor, not necessarily the scroll container, so it
  // picks up unrelated ancestor margins (e.g. DemoApp's centered max-width layout on
  // wide screens) and overshoots. getBoundingClientRect gives true viewport-relative
  // geometry regardless of ancestor positioning.
  function centerInScrollContainer(container: HTMLElement, target: HTMLElement) {
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetOffset = targetRect.left - containerRect.left;
    const scrollLeft = container.scrollLeft + targetOffset - containerRect.width / 2 + targetRect.width / 2;
    container.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }

  function scrollToStage(stageCode: string) {
    setActiveStageCode(stageCode);
    const col = columnRefs.current.get(stageCode);
    const kanbanRow = kanbanRowRef.current;
    if (col && kanbanRow) {
      centerInScrollContainer(kanbanRow, col);
    }
    setTimeout(() => {
      const container = pillBarRef.current;
      if (container) {
        const pill = container.querySelector(`[data-stage="${stageCode}"]`) as HTMLElement | null;
        if (pill) {
          centerInScrollContainer(container, pill);
        }
      }
    }, 50);
  }

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* Filter bar */}
      <Box sx={{ px: 2, pt: 2, pb: 1, bgcolor: "background.default", flexShrink: 0 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, bgcolor: "#fff", p: 1.5, borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
          {/* Search */}
          <TextField
            placeholder="Search by opportunity or hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            size="small"
            autoComplete="off"
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end" onClick={() => setSearchQuery("")}>
                      <Box component="span" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#9ca3af" }}>×</Box>
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
          {/* Owner + Zone filters */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">All Owners</MenuItem>
              {activeOwners.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
              ))}
              {inactiveOwners.length > 0 && [
                <ListSubheader key="inactive-header" sx={{ fontWeight: 700 }}>Inactive Owners</ListSubheader>,
                ...inactiveOwners.map((u) => (
                  <MenuItem key={u.id} value={u.id} sx={{ color: "error.main" }}>
                    {u.display_name}
                  </MenuItem>
                )),
              ]}
            </TextField>
            <Box sx={{ flex: 1 }}>
              <ZonePicker label="All Zones" value={zoneFilter} onChange={setZoneFilter} />
            </Box>
          </Box>
        </Box>
      </Box>

      {isLoading && (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Box sx={{ color: "#9ca3af", fontWeight: 700, fontSize: "0.875rem" }}>Loading pipeline...</Box>
        </Box>
      )}

      {!isLoading && viewMode === "list" && (
        <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2, pt: 1 }}>
          {filteredDeals.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" }}>
              {searchQuery ? "No opportunities match your search." : "No opportunities found."}
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {filteredDeals.map((opp) => (
                <ListRow key={opp.id} opp={opp} onClick={() => onSelectOpportunity(opp)} />
              ))}
            </Box>
          )}
        </Box>
      )}

      {!isLoading && viewMode === "kanban" && (
        <>
          {/* Stage pill bar — scrolls the Kanban container to the selected column */}
          <Box
            ref={pillBarRef}
            sx={{
              display: "flex", gap: 0.75, overflowX: "auto", px: 2, py: 1, bgcolor: "background.default", flexShrink: 0,
              "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none",
            }}
          >
            {orderedStages.map((s) => {
              const count = dealsByStage(s.stage_code).length;
              const isActive = s.stage_code === activeStageCode;
              return (
                <Button
                  key={s.stage_code}
                  data-stage={s.stage_code}
                  onClick={() => scrollToStage(s.stage_code)}
                  disableRipple
                  sx={{
                    flexShrink: 0, px: 1.5, py: 0.75,
                    borderRadius: "9999px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
                    bgcolor: isActive ? "primary.main" : "#fff",
                    color: isActive ? "#fff" : "#6b7280",
                    border: isActive ? "none" : "1px solid #e5e7eb",
                    boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    "&:hover": {
                      borderColor: isActive ? "transparent" : "#93c5fd",
                      color: isActive ? "#fff" : "primary.main",
                      bgcolor: isActive ? "primary.main" : "#fff",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75 }}>
                    {s.stage_name}
                    <Box
                      component="span"
                      sx={{
                        width: 16, height: 16, borderRadius: "50%", fontSize: "9px", fontWeight: 900,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        bgcolor: isActive ? "rgba(255,255,255,0.2)" : "#f3f4f6",
                        color: isActive ? "#fff" : "#6b7280",
                      }}
                    >
                      {count}
                    </Box>
                  </Box>
                </Button>
              );
            })}
          </Box>

          {/* Horizontally-scrollable Kanban — 224px columns, pills scroll to selected */}
          <Box
            ref={kanbanRowRef}
            sx={{
              flex: 1, overflowX: "auto", display: "flex", gap: 1.5, p: 2,
              "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none",
            }}
          >
            {orderedStages.map((s) => (
              <Box
                key={s.stage_code}
                ref={(el: HTMLDivElement | null) => { if (el) columnRefs.current.set(s.stage_code, el); }}
                sx={{ width: 224, flexShrink: 0, display: "flex", flexDirection: "column", gap: 1 }}
              >
                <StageColumn
                  stageName={s.stage_name}
                  deals={dealsByStage(s.stage_code)}
                  onSelect={onSelectOpportunity}
                />
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
