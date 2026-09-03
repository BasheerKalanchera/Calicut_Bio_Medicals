import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem, TextField, Typography } from "@mui/material";
import FormModal from "./FormModal";
import { listUsers } from "../services/masterData";
import { reassignMarketingLead, type MarketingLead } from "../services/marketingLeads";
import { useAuth } from "../contexts/AuthContext";
import { marketingLeadRef } from "../utils/marketingLeadMilestone";

interface MarketingLeadReassignModalProps {
  lead: MarketingLead | null;
  onClose: () => void;
  onReassigned?: () => void;
}

interface UserOption {
  id: string;
  display_name: string;
  sbu_id: string | null;
  role_name: string;
  manager_id: string | null;
}

// Same scope as the Assign To picker at lead creation (MarketingLeadCreate
// Modal.tsx) -- active reps in the lead's own SBU, excluding roles that
// don't carry pipeline work of their own, and excluding whoever it's
// currently assigned to (reassigning to the same person is a no-op).
// SBU Manager/Area Manager deliberately NOT excluded here -- they weren't
// excluded at creation either (a manager can personally own deals too),
// and this modal should offer the same assignable pool, not a stricter one
// (found live 2026-09-03: this list originally over-excluded, inconsistent
// with MarketingLeadCreateModal's own picker).
const NON_REP_ROLES = new Set(["Admin", "General Manager", "Marketing User"]);

export default function MarketingLeadReassignModal({ lead, onClose, onReassigned }: MarketingLeadReassignModalProps) {
  const [newAssignedToUserId, setNewAssignedToUserId] = useState("");
  const { userProfile } = useAuth();
  const myId = (userProfile as { id?: string } | null)?.id;
  const myRole = (userProfile as { role_name?: string } | null)?.role_name;

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users", "all"],
    enabled: !!lead,
    queryFn: async () => {
      const d = await listUsers("all");
      return Array.isArray(d) ? (d as UserOption[]) : [];
    },
  });

  // Area Manager can only reassign to their OWN reports, not "anyone in the
  // SBU" -- both a product decision (delegation stays within your own
  // reporting line) and a hard backend constraint (marketing_lead_select's
  // Area Manager clause, 0037, only shows leads assigned to the actor's own
  // reports; reassigning outside that set would make the row invisible to
  // the actor, which the database itself refuses -- found live 2026-09-03).
  // SBU Manager/Admin/GM keep the full SBU-wide pool, matching creation.
  const repOptions = allUsers.filter(
    (u) =>
      u.sbu_id === lead?.sbu_id &&
      !NON_REP_ROLES.has(u.role_name) &&
      u.id !== lead?.assigned_to_user_id &&
      (myRole !== "Area Manager" || u.manager_id === myId)
  );

  useEffect(() => {
    if (!lead) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewAssignedToUserId("");
  }, [lead]);

  async function handleSubmit() {
    if (!lead) return;
    if (!newAssignedToUserId) throw new Error("Pick a rep to reassign to");
    await reassignMarketingLead(lead.id, newAssignedToUserId);
    onReassigned?.();
  }

  return (
    <FormModal
      isOpen={!!lead}
      onClose={onClose}
      title={lead ? `Reassign Marketing Lead ${marketingLeadRef(lead.id)}` : "Reassign Marketing Lead"}
      onSubmit={handleSubmit}
      submitLabel="Reassign"
    >
      <Typography sx={{ fontSize: "0.8125rem", color: "#6b7280" }}>
        Currently assigned to {lead?.assigned_to_user.display_name}. The lead resets to "not yet seen" for whoever
        it goes to next.
      </Typography>
      <TextField
        select
        label="Reassign To *"
        value={newAssignedToUserId}
        onChange={(e) => setNewAssignedToUserId(e.target.value)}
        fullWidth
        size="small"
        helperText={
          repOptions.length === 0
            ? myRole === "Area Manager"
              ? "No other reports found for you"
              : "No other reps found for this SBU"
            : undefined
        }
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      >
        <MenuItem value="">Select a rep</MenuItem>
        {repOptions.map((u) => (
          <MenuItem key={u.id} value={u.id}>
            {u.display_name}
          </MenuItem>
        ))}
      </TextField>
    </FormModal>
  );
}
