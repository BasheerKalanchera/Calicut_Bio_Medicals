import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import FormModal from "./FormModal";
import { logActivity } from "../services/activities";
import { listAccounts } from "../services/accounts";
import { listUsers } from "../services/masterData";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
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

function nowPlusDaysLocal(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
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
  const [accounts, setAccounts]         = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(accountId ?? "");
  const [activityType, setActivityType] = useState("CALL");
  const [activityDate, setActivityDate] = useState(nowLocal());
  const [notes, setNotes]               = useState("");
  const [userId, setUserId]             = useState(currentUserId ?? "");
  const [nextActionText, setNextActionText]       = useState("");
  const [nextActionDueDate, setNextActionDueDate] = useState(nowPlusDaysLocal(1));
  const [nextActionOwnerId, setNextActionOwnerId] = useState(currentUserId ?? "");
  const [activeTab, setActiveTab] = useState<"details" | "nextAction">("details");

  const isManagerNote = activityType === "MANAGER_NOTE";

  useEffect(() => {
    if (!isOpen) return;
    setActivityType("CALL");
    setActivityDate(nowLocal());
    setNotes("");
    setUserId(currentUserId ?? "");
    setSelectedAccountId(accountId ?? "");
    setNextActionText("");
    setNextActionDueDate(nowPlusDaysLocal(1));
    setNextActionOwnerId(currentUserId ?? "");
    setActiveTab("details");
    if (users.length === 0) {
      listUsers().then((d: any) => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
    }
    if (!accountId && accounts.length === 0) {
      listAccounts({ page_size: 100 } as any)
        .then((d: any) => setAccounts(d.items ?? []))
        .catch(() => {});
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedAccountId = accountId ?? selectedAccountId;

  async function handleSubmit() {
    if (!resolvedAccountId) { setActiveTab("details"); throw new Error("Account is required"); }
    if (!activityType) { setActiveTab("details"); throw new Error("Activity type is required"); }
    if (!activityDate) { setActiveTab("details"); throw new Error("Date is required"); }
    // BR-ACT-04: Next Action is mandatory for every activity_type except
    // MANAGER_NOTE (internal manager-to-rep guidance, not a customer
    // interaction — carries no follow-up commitment).
    if (!isManagerNote) {
      if (!nextActionText.trim()) { setActiveTab("nextAction"); throw new Error("Next Action is required"); }
      if (!nextActionDueDate) { setActiveTab("nextAction"); throw new Error("Next Action Due Date is required"); }
    }
    await logActivity({
      account_id: resolvedAccountId,
      opportunity_id: opportunityId,
      user_id: userId || undefined,
      activity_type: activityType,
      activity_date: new Date(activityDate).toISOString(),
      notes: notes.trim() || undefined,
      ...(!isManagerNote && {
        next_action_text: nextActionText.trim(),
        next_action_due_date: new Date(nextActionDueDate).toISOString(),
        next_action_owner_id: nextActionOwnerId || undefined,
      }),
    });
    queryClient.invalidateQueries({ queryKey: ["activities", "account", resolvedAccountId] });
    if (opportunityId) {
      queryClient.invalidateQueries({ queryKey: ["activities", "opportunity", opportunityId] });
    }
    queryClient.invalidateQueries({ queryKey: ["reminders"] });
    onCreated?.();
  }

  const cls = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium";
  const lbl = "block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1";

  const tabBtn = (active: boolean) =>
    `px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
      active ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Log Activity" onSubmit={handleSubmit} submitLabel="Log">
      <div className="flex gap-2 -mt-1 mb-1">
        <button type="button" onClick={() => setActiveTab("details")} className={tabBtn(activeTab === "details")}>
          Details
        </button>
        {!isManagerNote && (
          <button type="button" onClick={() => setActiveTab("nextAction")} className={tabBtn(activeTab === "nextAction")}>
            Next Action *
          </button>
        )}
      </div>

      {activeTab === "details" && (
        <>
          {!accountId && (
            <div>
              <label className={lbl}>Account *</label>
              <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className={cls}>
                <option value="">Select account</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={lbl}>Type *</label>
            <select
              value={activityType}
              onChange={(e) => {
                setActivityType(e.target.value);
                if (e.target.value === "MANAGER_NOTE") setActiveTab("details");
              }}
              className={cls}
            >
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
        </>
      )}

      {activeTab === "nextAction" && !isManagerNote && (
        <>
          <div>
            <label className={lbl}>Next Action *</label>
            <input
              type="text"
              value={nextActionText}
              onChange={(e) => setNextActionText(e.target.value)}
              className={cls}
              placeholder="e.g. Call to confirm demo date"
            />
          </div>
          <div>
            <label className={lbl}>Next Action Due Date *</label>
            <input
              type="datetime-local"
              value={nextActionDueDate}
              onChange={(e) => setNextActionDueDate(e.target.value)}
              className={cls}
            />
          </div>
          <div>
            <label className={lbl}>Next Action Owner</label>
            <select value={nextActionOwnerId} onChange={(e) => setNextActionOwnerId(e.target.value)} className={cls}>
              <option value="">Me (default)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.display_name}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </FormModal>
  );
}
