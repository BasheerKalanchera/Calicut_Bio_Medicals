import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listOpportunityItems,
  listOpportunitySplits,
  listOpportunityStakeholders,
} from "../services/opportunities";
import type { PipelineOpportunity } from "../types/api";
import ActivityTimeline from "../components/ActivityTimeline";
import LogActivityModal from "../components/LogActivityModal";

interface Props {
  opportunity: PipelineOpportunity;
  onBack: () => void;
}

const TABS = [
  { id: "overview",      label: "Overview" },
  { id: "products",      label: "Products" },
  { id: "splits",        label: "Splits" },
  { id: "stakeholders",  label: "Stakeholders" },
  { id: "activity",      label: "Activity" },
] as const;

type TabId = typeof TABS[number]["id"];

// ---------------------------------------------------------------------------
// Field row
// ---------------------------------------------------------------------------
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className="text-xs font-medium text-gray-800">{value ?? "—"}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status / stage badges
// ---------------------------------------------------------------------------
function StageBadge({ name }: { name: string }) {
  return (
    <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider">
      {name}
    </span>
  );
}

function StatusBadge({ code, name }: { code: string; name: string }) {
  const colours: Record<string, string> = {
    ACTIVE:  "bg-emerald-50 text-emerald-700",
    ON_HOLD: "bg-amber-50 text-amber-700",
    STALLED: "bg-gray-100 text-gray-500",
    WON:     "bg-blue-50 text-blue-700",
    LOST:    "bg-red-50 text-red-600",
  };
  return (
    <span
      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${colours[code] ?? "bg-gray-100 text-gray-500"}`}
    >
      {name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Tab content
// ---------------------------------------------------------------------------
function OverviewTab({ opp }: { opp: PipelineOpportunity }) {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Account" value={opp.account.name} />
        <Field label="Owner" value={opp.owner.display_name} />
        <Field label="Win Probability" value={`${parseFloat(opp.win_probability).toFixed(0)}%`} />
        <Field
          label="Indicative Value"
          value={opp.indicative_value ? `₹${parseFloat(opp.indicative_value).toFixed(2)}L` : null}
        />
        <Field label="Expected Closure" value={opp.expected_closure_date ?? null} />
        <Field label="Demo Start" value={opp.demo_start_date ?? null} />
        <Field label="PO Number" value={opp.po_number ?? null} />
        <Field label="SBU" value={opp.sbu.name} />
      </div>
      <div>
        <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
          Created
        </div>
        <div className="text-xs text-gray-500">
          {new Date(opp.created_at).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </div>
      </div>
    </div>
  );
}

function ProductsTab({ opportunityId }: { opportunityId: string }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ["opp-items", opportunityId],
    queryFn: () => listOpportunityItems(opportunityId),
  });

  if (isLoading) return <LoadingPlaceholder />;

  if (!items?.length)
    return <EmptyPlaceholder message="No products added to this opportunity." />;

  const total = items.reduce(
    (s, i) => s + parseFloat(i.extended_value_lakhs),
    0,
  );

  return (
    <div className="p-4 space-y-2">
      {items.map((item) => (
        <div key={item.id} className="bg-gray-50 rounded-xl p-3 space-y-0.5">
          <div className="font-bold text-xs text-gray-800">{item.product.name}</div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span>Qty: {item.quantity}</span>
            <span>₹{parseFloat(item.unit_price_lakhs).toFixed(2)}L each</span>
            {parseFloat(item.discount_lakhs) > 0 && (
              <span className="text-red-500">−₹{parseFloat(item.discount_lakhs).toFixed(2)}L disc</span>
            )}
          </div>
          <div className="text-[10px] font-black text-emerald-600">
            ₹{parseFloat(item.extended_value_lakhs).toFixed(2)}L
          </div>
        </div>
      ))}
      <div className="text-right text-xs font-black text-gray-700 pt-2 border-t border-gray-100">
        Total: ₹{total.toFixed(2)}L
      </div>
    </div>
  );
}

function SplitsTab({ opportunityId }: { opportunityId: string }) {
  const { data: splits, isLoading } = useQuery({
    queryKey: ["opp-splits", opportunityId],
    queryFn: () => listOpportunitySplits(opportunityId),
  });

  if (isLoading) return <LoadingPlaceholder />;

  if (!splits?.length)
    return <EmptyPlaceholder message="No contributor splits defined." />;

  return (
    <div className="p-4 space-y-2">
      {splits.map((s) => (
        <div key={s.user_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
          <span className="text-xs font-bold text-gray-800">{s.user.display_name}</span>
          <span className="text-xs font-black text-blue-600">
            {parseFloat(s.split_percentage).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function StakeholdersTab({ opportunityId }: { opportunityId: string }) {
  const { data: links, isLoading } = useQuery({
    queryKey: ["opp-stakeholders", opportunityId],
    queryFn: () => listOpportunityStakeholders(opportunityId),
  });

  if (isLoading) return <LoadingPlaceholder />;

  if (!links?.length)
    return <EmptyPlaceholder message="No stakeholders linked to this opportunity." />;

  return (
    <div className="p-4 space-y-2">
      {links.map((lnk) => (
        <div key={lnk.stakeholder_id} className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-0.5">
          <div className="font-bold text-xs text-gray-800">{lnk.stakeholder.name}</div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            {lnk.influence_level && (
              <span className={`font-black uppercase ${
                lnk.influence_level === "HIGH" ? "text-red-500" :
                lnk.influence_level === "MEDIUM" ? "text-amber-500" : "text-gray-400"
              }`}>
                {lnk.influence_level}
              </span>
            )}
            {lnk.decision_role && <span>{lnk.decision_role}</span>}
          </div>
          {lnk.notes && <div className="text-[10px] text-gray-400 italic">{lnk.notes}</div>}
        </div>
      ))}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Shared placeholders
// ---------------------------------------------------------------------------
function LoadingPlaceholder() {
  return (
    <div className="py-12 flex items-center justify-center text-xs text-gray-300 font-black uppercase tracking-widest animate-pulse">
      Loading…
    </div>
  );
}

function EmptyPlaceholder({ message }: { message: string }) {
  return (
    <div className="py-12 flex items-center justify-center text-xs text-gray-400 text-center px-8">
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function OpportunityDetailScreen({ opportunity: opp, onBack }: Props) {
  const [activeTab, setActiveTab]       = useState<TabId>("overview");
  const [showLogActivity, setShowLogActivity] = useState(false);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-wider mb-2"
        >
          ← Pipeline
        </button>
        <div className="font-extrabold text-lg text-gray-800 leading-tight">{opp.name}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <StageBadge name={opp.stage.stage_name} />
          <StatusBadge code={opp.status.status_code} name={opp.status.status_name} />
          {opp.indicative_value && (
            <span className="text-xs font-black text-emerald-600 ml-auto">
              ₹{parseFloat(opp.indicative_value).toFixed(2)}L
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto bg-white border-b border-gray-100 shrink-0 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview"     && <OverviewTab opp={opp} />}
        {activeTab === "products"     && <ProductsTab opportunityId={opp.id} />}
        {activeTab === "splits"       && <SplitsTab opportunityId={opp.id} />}
        {activeTab === "stakeholders" && <StakeholdersTab opportunityId={opp.id} />}
        {activeTab === "activity"     && (
          <div className="p-4">
            <ActivityTimeline
              opportunityId={opp.id}
              accountId={opp.account.id}
              onLogActivity={() => setShowLogActivity(true)}
            />
          </div>
        )}
      </div>

      <LogActivityModal
        isOpen={showLogActivity}
        onClose={() => setShowLogActivity(false)}
        accountId={opp.account.id}
        opportunityId={opp.id}
      />
    </div>
  );
}
