import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPipeline } from "../services/opportunities";
import { listStages, listUsers } from "../services/masterData";
import type { PipelineOpportunity } from "../types/api";

interface Props {
  onSelectOpportunity: (opp: PipelineOpportunity) => void;
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

// ---------------------------------------------------------------------------
// Status badge colours
// ---------------------------------------------------------------------------
function StatusBadge({ code }: { code: string }) {
  const colours: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    ON_HOLD: "bg-amber-100 text-amber-700",
    STALLED: "bg-gray-100 text-gray-500",
    WON: "bg-blue-100 text-blue-700",
    LOST: "bg-red-100 text-red-600",
  };
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${colours[code] ?? "bg-gray-100 text-gray-500"}`}
    >
      {code.replace("_", " ")}
    </span>
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
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-3 space-y-1.5 hover:shadow-md hover:border-blue-200 active:scale-[0.98] transition-all"
    >
      <div className="font-bold text-xs text-gray-800 leading-snug">{opp.name}</div>
      <div className="text-[10px] text-gray-500 font-medium truncate">{opp.account.name}</div>
      <div className="flex items-center justify-between gap-1">
        <StatusBadge code={opp.status.status_code} />
        {opp.indicative_value && (
          <span className="text-[10px] font-black text-gray-700">
            ₹{parseFloat(opp.indicative_value).toFixed(1)}L
          </span>
        )}
      </div>
      <div className="text-[9px] text-gray-400 font-medium">{opp.owner.display_name}</div>
    </button>
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
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
          {stageName}
        </span>
        <span className="text-[10px] font-black text-gray-400 bg-gray-100 rounded-full px-1.5">
          {deals.length}
        </span>
      </div>
      {deals.length === 0 ? (
        <div className="text-[10px] text-gray-300 italic text-center py-4">No deals</div>
      ) : (
        deals.map((opp) => (
          <DealCard key={opp.id} opp={opp} onClick={() => onSelect(opp)} />
        ))
      )}
    </div>
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
    <div
      onClick={onClick}
      className="bg-white py-3 px-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
          {opp.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-gray-800 text-sm group-hover:text-blue-900 transition-colors truncate">
            {opp.name}
          </div>
          <div className="text-xs font-medium text-gray-400 truncate mt-0.5">{opp.account.name}</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black border bg-blue-50 text-blue-700 border-blue-200">
              {opp.stage.stage_name}
            </span>
            <StatusBadge code={opp.status.status_code} />
            {opp.indicative_value && (
              <span className="text-[10px] font-black text-emerald-600">
                ₹{parseFloat(opp.indicative_value).toFixed(1)}L
              </span>
            )}
            <span className="text-[10px] text-gray-400">{opp.owner.display_name}</span>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-blue-50 transition-colors shrink-0 ml-2">
        <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function OpportunityPipelineScreen({ onSelectOpportunity }: Props) {
  const [viewMode, setViewMode]       = useState<"kanban" | "list">("kanban");
  const [activeStageCode, setActiveStageCode] = useState<string>("LEAD");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["pipeline", ownerFilter],
    queryFn: () => listPipeline({ owner_id: ownerFilter || undefined, page_size: 100 }),
  });

  const { data: stages } = useQuery({
    queryKey: ["stages"],
    queryFn: listStages,
    staleTime: Infinity,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    staleTime: Infinity,
  });

  const allDeals = pipeline?.items ?? [];

  const filteredDeals = searchQuery.trim()
    ? allDeals.filter((d) => {
        const q = searchQuery.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.account.name.toLowerCase().includes(q);
      })
    : allDeals;

  // Sort stages by display_order, filter to pipeline stages only
  const orderedStages = ((stages as any[]) ?? [])
    .filter((s: any) => PIPELINE_STAGE_CODES.includes(s.stage_code))
    .sort((a: any, b: any) => a.display_order - b.display_order);

  const dealsByStage = (stageCode: string) =>
    filteredDeals.filter((d) => d.stage.stage_code === stageCode);

  function scrollToStage(stageCode: string) {
    setActiveStageCode(stageCode);
    const col = columnRefs.current.get(stageCode);
    col?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
      {/* Filter bar */}
      <div className="px-4 pt-4 pb-2 bg-gray-50 shrink-0">
        <div className="flex flex-col gap-2 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by opportunity or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                ×
              </button>
            )}
          </div>
          {/* Owner filter + view toggle */}
          <div className="flex items-center gap-2">
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Owners</option>
              {((users as any[]) ?? []).map((u: any) => (
                <option key={u.id} value={u.id}>{u.display_name}</option>
              ))}
            </select>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 shrink-0">
              {(["kanban", "list"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                    viewMode === mode
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {mode === "kanban" ? "⬛ Kanban" : "☰ List"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 font-bold text-sm animate-pulse">Loading pipeline...</div>
        </div>
      )}

      {!isLoading && viewMode === "list" && (
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
          {filteredDeals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
              {searchQuery ? "No opportunities match your search." : "No opportunities found."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDeals.map((opp) => (
                <ListRow key={opp.id} opp={opp} onClick={() => onSelectOpportunity(opp)} />
              ))}
            </div>
          )}
        </div>
      )}

      {!isLoading && viewMode === "kanban" && (
        <>
          {/* Stage pill bar — scrolls the Kanban container to the selected column */}
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2 bg-gray-50 shrink-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            {orderedStages.map((s: any) => {
              const count = dealsByStage(s.stage_code).length;
              const isActive = s.stage_code === activeStageCode;
              return (
                <button
                  key={s.stage_code}
                  onClick={() => scrollToStage(s.stage_code)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {s.stage_name}
                  <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Horizontally-scrollable Kanban — w-56 columns, pills scroll to selected */}
          <div className="flex-1 overflow-x-auto flex gap-3 p-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            {orderedStages.map((s: any) => (
              <div
                key={s.stage_code}
                ref={(el) => { if (el) columnRefs.current.set(s.stage_code, el); }}
                className="w-56 shrink-0 flex flex-col gap-2"
              >
                <StageColumn
                  stageName={s.stage_name}
                  deals={dealsByStage(s.stage_code)}
                  onSelect={onSelectOpportunity}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
