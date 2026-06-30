import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import FormModal from "./FormModal";
import { logActivity } from "../services/activities";
import { listUsers } from "../services/masterData";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  opportunityId?: string;
  currentUserId?: string;
  onCreated?: () => void;
}

const ACTIVITY_TYPES = [
  { value: "VISIT",        label: "🏥 Visit" },
  { value: "CALL",         label: "📞 Call" },
  { value: "EMAIL",        label: "✉️ Email" },
  { value: "MEETING",      label: "🤝 Meeting" },
  { value: "NOTE",         label: "📝 Note" },
  { value: "MANAGER_NOTE", label: "📋 Manager Note" },
];

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function LogActivityModal({
  isOpen,
  onClose,
  accountId,
  opportunityId,
  currentUserId,
  onCreated,
}: Props) {
  const queryClient = useQueryClient();
  const [users, setUsers]               = useState<any[]>([]);
  const [activityType, setActivityType] = useState("CALL");
  const [activityDate, setActivityDate] = useState(nowLocal());
  const [notes, setNotes]               = useState("");
  const [userId, setUserId]             = useState(currentUserId ?? "");

  useEffect(() => {
    if (!isOpen) return;
    setActivityType("CALL");
    setActivityDate(nowLocal());
    setNotes("");
    setUserId(currentUserId ?? "");
    if (users.length === 0) {
      listUsers().then((d: any) => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (!activityType) throw new Error("Activity type is required");
    if (!activityDate) throw new Error("Date is required");
    await logActivity({
      account_id: accountId,
      opportunity_id: opportunityId,
      user_id: userId || undefined,
      activity_type: activityType,
      activity_date: new Date(activityDate).toISOString(),
      notes: notes.trim() || undefined,
    });
    queryClient.invalidateQueries({ queryKey: ["activities", "account", accountId] });
    if (opportunityId) {
      queryClient.invalidateQueries({ queryKey: ["activities", "opportunity", opportunityId] });
    }
    onCreated?.();
  }

  const cls = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium";
  const lbl = "block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1";

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Log Activity" onSubmit={handleSubmit} submitLabel="Log">
      <div>
        <label className={lbl}>Type *</label>
        <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className={cls}>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={lbl}>Date & Time *</label>
        <input
          type="datetime-local"
          value={activityDate}
          onChange={(e) => setActivityDate(e.target.value)}
          className={cls}
        />
      </div>
      <div>
        <label className={lbl}>Assigned To</label>
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className={cls}>
          <option value="">Me (default)</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.display_name}</option>
          ))}
        </select>
      </div>
      {opportunityId && (
        <div className="px-3 py-2 bg-blue-50 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-wider">
          Linked to this opportunity
        </div>
      )}
      <div>
        <label className={lbl}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={`${cls} resize-none`}
          placeholder="What happened? Key discussion points, next steps…"
        />
      </div>
    </FormModal>
  );
}
