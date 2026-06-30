import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listActivitiesByAccount, listActivitiesByOpportunity } from "../services/activities";
import type { ActivityResponse, ActivityType } from "../types/api";

interface Props {
  accountId?: string;
  opportunityId?: string;
  onLogActivity?: () => void;
}

const TYPE_CONFIG: Record<ActivityType, { icon: string; label: string; colour: string }> = {
  VISIT:        { icon: "🏥", label: "Visit",        colour: "bg-violet-50 text-violet-700" },
  CALL:         { icon: "📞", label: "Call",          colour: "bg-blue-50 text-blue-700" },
  EMAIL:        { icon: "✉️",  label: "Email",         colour: "bg-sky-50 text-sky-700" },
  MEETING:      { icon: "🤝", label: "Meeting",       colour: "bg-emerald-50 text-emerald-700" },
  NOTE:         { icon: "📝", label: "Note",          colour: "bg-amber-50 text-amber-700" },
  MANAGER_NOTE: { icon: "📋", label: "Manager Note",  colour: "bg-gray-100 text-gray-600" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function ActivityItem({ activity, isLast }: { activity: ActivityResponse; isLast: boolean }) {
  const cfg = TYPE_CONFIG[activity.activity_type] ?? TYPE_CONFIG.NOTE;
  return (
    <div className="flex gap-3">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${cfg.colour}`}>
          {cfg.icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-100 my-1" />}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-4"}`}>
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${cfg.colour}`}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-gray-400">{formatDate(activity.activity_date)}</span>
        </div>
        <div className="text-[10px] font-bold text-gray-500 mb-1">{activity.user.display_name}</div>
        {activity.notes && (
          <div className="text-xs text-gray-700 bg-white border border-gray-100 rounded-xl px-3 py-2 leading-relaxed">
            {activity.notes}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivityTimeline({ accountId, opportunityId, onLogActivity }: Props) {
  const queryClient = useQueryClient();

  const queryKey = opportunityId
    ? ["activities", "opportunity", opportunityId]
    : ["activities", "account", accountId];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      opportunityId
        ? listActivitiesByOpportunity(opportunityId!)
        : listActivitiesByAccount(accountId!),
    enabled: !!(opportunityId || accountId),
  });

  const activities = data?.items ?? [];

  function handleLogActivity() {
    onLogActivity?.();
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Activity ({data?.total ?? "…"})
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { queryClient.invalidateQueries({ queryKey }); refetch(); }}
            className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-wider"
          >
            ↻ Refresh
          </button>
          <button
            onClick={handleLogActivity}
            className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider"
          >
            + Log
          </button>
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-gray-400 font-black uppercase tracking-widest animate-pulse">
          Loading…
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400 italic text-sm">
          No activities logged yet.
        </div>
      ) : (
        <div className="pt-1">
          {activities.map((a, i) => (
            <ActivityItem key={a.id} activity={a} isLast={i === activities.length - 1} />
          ))}
          {(data?.total ?? 0) > activities.length && (
            <div className="text-center text-[10px] text-gray-400 font-black uppercase tracking-wider pt-2">
              Showing {activities.length} of {data?.total}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
