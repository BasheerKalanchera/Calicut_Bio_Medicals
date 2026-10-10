import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { listSbuTargets, setSbuTarget } from "../services/targetPlanning";
import { formatLakhs } from "../utils/formatter";

// The GM-entered target for one SBU and quarter -- what Target vs Actuals'
// SBU and team rows measure against. Admin/GM edit; SBU Manager and Area
// Manager see their own SBU's read-only; the screen hides it from everyone
// else (the backend refuses them anyway).
export default function SbuTargetBox({ sbuId, period, canEdit }: { sbuId: string; period: string; canEdit: boolean }) {
  const queryClient = useQueryClient();
  // null = not editing; otherwise the box's text.
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: targets = [], isLoading, isError } = useQuery({
    queryKey: ["planning", "sbu-targets", period],
    queryFn: () => listSbuTargets(period),
  });
  const current = targets.find((t) => t.sbu_id === sbuId) ?? null;

  const amount = draft === null ? NaN : Number(draft);
  // An empty box isn't an error yet -- it just can't be saved.
  const empty = draft === null || draft.trim() === "";
  const invalid = !empty && (!Number.isFinite(amount) || amount < 0);
  const canSave = !empty && !invalid;

  const handleSave = async () => {
    if (!canSave || draft === null) return;
    setSaving(true);
    setError(null);
    try {
      await setSbuTarget({ sbu_id: sbuId, planning_period: period, target_amount_lakhs: amount });
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["planning", "sbu-targets"] });
      queryClient.invalidateQueries({ queryKey: ["planning", "target-vs-actuals"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the SBU target.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ mb: 2, p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Typography color="text.secondary">SBU target for {period}:</Typography>
        {draft === null ? (
          <>
            <Typography>
              {isLoading
                ? "…"
                : isError
                  ? "Couldn't load the SBU target. Refresh to try again."
                  : current
                    ? (
                      <Typography component="span" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                        {formatLakhs(Number(current.target_amount_lakhs))}
                      </Typography>
                    )
                    : "Not set"}
            </Typography>
            {canEdit && !isLoading && !isError && (
              <Button size="small" variant="contained" onClick={() => setDraft(current ? String(Number(current.target_amount_lakhs)) : "")}>
                {current ? "Change" : "Set target"}
              </Button>
            )}
          </>
        ) : (
          <>
            <TextField
              size="small"
              type="number"
              label="₹ Lakhs"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              error={invalid}
              helperText={invalid ? "Enter 0 or more" : undefined}
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              sx={{ width: "10rem" }}
              autoFocus
            />
            <Button size="small" variant="contained" onClick={handleSave} disabled={!canSave || saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button size="small" onClick={() => { setDraft(null); setError(null); }} disabled={saving}>
              Cancel
            </Button>
          </>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary">
        Set by the GM. Target vs Actuals measures the SBU's Won against it.
      </Typography>
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    </Box>
  );
}
