import { useState } from "react";
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
      className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-3 space-y-1.5 hover:shadow-md hover:border-blue-200 active:scale-[0.98] transition-all"
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
// List row
// ---------------------------------------------------------------------------
function ListRow({
  opp,
  onClick,
}: {
  opp: PipelineOpportunity;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-50 hover:bg-blue-50 active:bg-blue-100 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-xs text-gray-800 truncate">{opp.name}</span>
          <StatusBadge code={opp.status.status_code} />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="truncate">{opp.account.name}</span>
          <span className="text-gray-300 shrink-0">·</span>
          <span className="shrink-0">{opp.stage.stage_name}</span>
          <span className="text-gray-300 shrink-0">·</span>
          <span className="shrink-0">{opp.owner.display_name}</span>
        </div>
      </div>
      {opp.indicative_value && (
        <div className="shrink-0 text-xs font-black text-emerald-600">
          ₹{parseFloat(opp.indicative_value).toFixed(1)}L
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function OpportunityPipelineScreen({ onSelectOpportunity }: Props) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [activeStageCode, setActiveStageCode] = useState<string>("LEAD");
  const [ownerFilter, setOwnerFilter] = useState<string>("");

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

  const deals = pipeline?.items ?? [];

  // Sort stages by display_order, filter to pipeline stages only
  const orderedStages = ((stages as any[]) ?? [])
    .filter((s: any) => PIPELINE_STAGE_CODES.includes(s.stage_code))
    .sort((a: any, b: any) => a.display_order - b.display_order);

  const dealsByStage = (stageCode: string) =>
    deals.filter((d) => d.stage.stage_code === stageCode);

  const activeStage = orderedStages.find((s: any) => s.stage_code === activeStageCode);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Filter bar */}
      <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center gap-2 shrink-0">
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Owners</option>
          {((users as any[]) ?? []).map((u: any) => (
            <option key={u.id} value={u.id}>
              {u.display_name}
            </option>
          ))}
        </select>

        {/* View toggle */}
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

      {isLoading && (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 font-black uppercase tracking-widest animate-pulse">
          Loading pipeline…
        </div>
      )}

      {!isLoading && viewMode === "list" && (
        <div className="flex-1 overflow-y-auto">
          {deals.length === 0 ? (
            <div className="py-16 text-center text-xs text-gray-400 font-black uppercase tracking-widest">
              No opportunities
            </div>
          ) : (
            deals.map((opp) => (
              <ListRow key={opp.id} opp={opp} onClick={() => onSelectOpportunity(opp)} />
            ))
          )}
        </div>
      )}

      {!isLoading && viewMode === "kanban" && (
        <>
          {/* Mobile: stage pills — one column at a time */}
          <div className="md:hidden flex-1 overflow-hidden flex flex-col">
            {/* Stage pill bar */}
            <div className="flex gap-1.5 overflow-x-auto px-4 py-2 bg-white border-b border-gray-100 shrink-0 scrollbar-hide">
              {orderedStages.map((s: any) => {
                const count = dealsByStage(s.stage_code).length;
                const isActive = s.stage_code === activeStageCode;
                return (
                  <button
                    key={s.stage_code}
                    onClick={() => setActiveStageCode(s.stage_code)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {s.stage_name}
                    <span
                      className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                        isActive ? "bg-white/20 text-white" : "bg-white text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active column */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeStage && (
                <StageColumn
                  stageName={activeStage.stage_name}
                  deals={dealsByStage(activeStageCode)}
                  onSelect={onSelectOpportunity}
                />
              )}
            </div>
          </div>

          {/* Desktop: all columns side-by-side */}
          <div className="hidden md:flex flex-1 overflow-x-auto gap-3 p-4">
            {orderedStages.map((s: any) => (
              <div key={s.stage_code} className="w-56 shrink-0 flex flex-col gap-2">
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
