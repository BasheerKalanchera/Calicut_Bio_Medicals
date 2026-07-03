import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button } from "@mui/material";
import { listReminders, patchReminder } from "../services/activities";
import type { ReminderResponse } from "../types/api";

const ACTIVITY_TYPE_ICONS: Record<string, string> = {
  VISIT: "🏥",
  CALL: "📞",
  EMAIL: "✉️",
  MEETING: "🤝",
  NOTE: "📝",
  MANAGER_NOTE: "📋",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function isOverdue(reminder: ReminderResponse) {
  return !reminder.is_completed && new Date(reminder.due_date) < new Date();
}

function ReminderRow({
  reminder,
  onComplete,
  isCompleting,
}: {
  reminder: ReminderResponse;
  onComplete: (id: string) => void;
  isCompleting: boolean;
}) {
  const overdue = isOverdue(reminder);
  const icon = ACTIVITY_TYPE_ICONS[reminder.activity.activity_type] ?? "📝";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
              reminder.is_completed
                ? "bg-emerald-50 text-emerald-700"
                : overdue
                ? "bg-red-50 text-red-600"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {reminder.is_completed ? "Done" : overdue ? "Overdue" : "Due " + formatDate(reminder.due_date)}
          </span>
        </div>
        {!reminder.is_completed && (
          <label
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all uppercase tracking-wider shrink-0 ${
              isCompleting ? "opacity-40 cursor-default" : "cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              checked={false}
              disabled={isCompleting}
              onChange={() => onComplete(reminder.id)}
              className="w-3.5 h-3.5 rounded accent-emerald-600"
            />
            {isCompleting ? "Completing…" : "Mark to complete"}
          </label>
        )}
      </div>

      <div className="text-sm font-bold text-gray-800 leading-snug">{reminder.reminder_text}</div>

      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
        <span>{icon}</span>
        <span>{reminder.activity.account.name}</span>
        {reminder.activity.opportunity && (
          <>
            <span className="text-gray-300">•</span>
            <span>{reminder.activity.opportunity.name}</span>
          </>
        )}
      </div>

      <div className="text-[10px] text-gray-400 font-medium">
        Owner: {reminder.assigned_to_user.display_name}
      </div>
    </div>
  );
}

export default function NextActionsScreen() {
  const queryClient = useQueryClient();
  const [includeCompleted, setIncludeCompleted] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reminders", includeCompleted],
    queryFn: () => listReminders(includeCompleted),
  });

  const completeMutation = useMutation({
    mutationFn: (reminderId: string) => patchReminder(reminderId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  const reminders = data ?? [];

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
      <div className="px-4 pt-4 pb-2 bg-gray-50 shrink-0">
        <div className="flex rounded-xl overflow-hidden border border-gray-200 w-fit">
          {([
            { id: false, label: "Pending" },
            { id: true, label: "Completed" },
          ] as const).map((tab) => (
            <button
              key={String(tab.id)}
              onClick={() => setIncludeCompleted(tab.id)}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                includeCompleted === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-400 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-gray-400 font-bold text-sm animate-pulse">Loading next actions...</div>
          </div>
        )}

        {isError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
            sx={{ mb: 2 }}
          >
            Couldn't load your next actions. Your list may be incomplete.
          </Alert>
        )}

        {!isLoading && !isError && reminders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
            {includeCompleted ? "No completed actions yet." : "All caught up — no pending actions."}
          </div>
        )}

        {!isLoading && reminders.length > 0 && (
          <div className="space-y-3">
            {reminders.map((r) => (
              <ReminderRow
                key={r.id}
                reminder={r}
                onComplete={(id) => completeMutation.mutate(id)}
                isCompleting={completeMutation.isPending && completeMutation.variables === r.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
