import { useEffect, useState } from "react";
import { TextField } from "@mui/material";
import FormModal from "./FormModal";
import { discardMarketingLead, type MarketingLead } from "../services/marketingLeads";
import { marketingLeadRef } from "../utils/marketingLeadMilestone";

interface MarketingLeadDiscardModalProps {
  lead: MarketingLead | null;
  onClose: () => void;
  onDiscarded?: () => void;
}

// No longer asked for in the dialog (Basheer, 2026-11-13). Kept and exported so
// both lead screens can still show a readable label for the category code on
// leads discarded before that change, instead of the raw DUPLICATE/etc enum.
export const REASONS: { value: string; label: string }[] = [
  { value: "DUPLICATE", label: "Duplicate" },
  { value: "NOT_INTERESTED", label: "Not interested" },
  { value: "UNABLE_TO_CONTACT", label: "Unable to contact" },
  { value: "JUNK", label: "Junk" },
];

export default function MarketingLeadDiscardModal({ lead, onClose, onDiscarded }: MarketingLeadDiscardModalProps) {
  // One required free-text Reason, saved as discard_note (Basheer, 2026-11-13).
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!lead) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReason("");
  }, [lead]);

  async function handleSubmit() {
    if (!lead) return;
    if (!reason.trim()) throw new Error("Reason is required");
    await discardMarketingLead(lead.id, { discard_note: reason.trim() });
    onDiscarded?.();
  }

  return (
    <FormModal
      isOpen={!!lead}
      onClose={onClose}
      title={lead ? `Discard Marketing Lead ${marketingLeadRef(lead.id)}` : "Discard Marketing Lead"}
      onSubmit={handleSubmit}
      submitLabel="Discard"
    >
      <TextField
        label="Reason *"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        fullWidth
        size="small"
        multiline
        minRows={2}
        sx={{ mt: 1 }}
      />
    </FormModal>
  );
}
