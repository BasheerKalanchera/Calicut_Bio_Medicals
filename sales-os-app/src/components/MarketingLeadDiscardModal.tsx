import { useEffect, useState } from "react";
import { MenuItem, TextField } from "@mui/material";
import FormModal from "./FormModal";
import { discardMarketingLead, type MarketingLead } from "../services/marketingLeads";

interface MarketingLeadDiscardModalProps {
  lead: MarketingLead | null;
  onClose: () => void;
  onDiscarded?: () => void;
}

const REASONS: { value: string; label: string }[] = [
  { value: "DUPLICATE", label: "Duplicate" },
  { value: "NOT_INTERESTED", label: "Not interested" },
  { value: "UNABLE_TO_CONTACT", label: "Unable to contact" },
  { value: "JUNK", label: "Junk" },
];

export default function MarketingLeadDiscardModal({ lead, onClose, onDiscarded }: MarketingLeadDiscardModalProps) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!lead) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReason(""); setNote("");
  }, [lead]);

  async function handleSubmit() {
    if (!lead) return;
    if (!reason) throw new Error("Reason is required");
    await discardMarketingLead(lead.id, { discard_reason: reason as any, discard_note: note.trim() || null });
    onDiscarded?.();
  }

  return (
    <FormModal isOpen={!!lead} onClose={onClose} title="Discard Marketing Lead" onSubmit={handleSubmit} submitLabel="Discard">
      <TextField
        select
        label="Reason *"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        fullWidth
        size="small"
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      >
        <MenuItem value="">Select reason</MenuItem>
        {REASONS.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
      </TextField>
      <TextField
        label="Note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional"
        fullWidth
        size="small"
        multiline
        minRows={2}
      />
    </FormModal>
  );
}
