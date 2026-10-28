import { Alert, Box, Typography } from "@mui/material";
import BusinessPotentialChip from "./BusinessPotentialChip";
import TableOrCards, { TocCell, TocRow } from "./TableOrCards";
import type { TargetPlan } from "../types/targetPlanning";
import { VISIT_FREQUENCY_LABEL } from "../utils/visitFrequency";

function lakhs2(v: string | number) {
  return `₹${Number(v).toFixed(2)}L`;
}

const CHANGE_NOTE_LABEL: Record<string, string> = {
  PENDING_APPROVAL: "Why it changed:",
  APPROVED: "Last change (approved):",
  REJECTED: "Last change (rejected):",
};

// What an approver (or a manager in the team view) sees when a plan row is
// expanded: the latest change note, each hospital, and the brand split
// (Hospital-Wise Target Planning plan, section 8 "Frontend").
export default function TargetPlanDetails({ target }: { target: TargetPlan }) {
  const accounts = [...target.accounts].sort(
    (a, b) => Number(b.planned_amount_lakhs) - Number(a.planned_amount_lakhs),
  );
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}>
      {target.change_note && (
        <Alert severity="info" sx={{ whiteSpace: "pre-wrap" }}>
          {/* The note is kept after approval, so only call it the reason for
              *this* change while the manager is still deciding. */}
          <strong>{CHANGE_NOTE_LABEL[target.status] ?? "Why it changed:"}</strong>{" "}
          {target.change_note}
        </Alert>
      )}

      {target.previous_approved_total_lakhs != null && (
        <Typography variant="body2">
          <strong>Last approved plan:</strong> {lakhs2(target.previous_approved_total_lakhs)}
          {Number(target.target_amount_lakhs) < Number(target.previous_approved_total_lakhs) && (
            <Box component="span" sx={{ color: "warning.main", fontWeight: 700 }}>
              {" "}— this revision is {lakhs2(Number(target.previous_approved_total_lakhs) - Number(target.target_amount_lakhs))} below it
            </Box>
          )}
        </Typography>
      )}

      {accounts.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No hospitals on this plan — it was set before hospital-wise planning.
        </Typography>
      ) : (
        /* On a phone the opened plan is inside the person's card, so each
           hospital is a line in that card (TableOrCards nests them). */
        <Box sx={{ overflowX: "auto" }}>
        <TableOrCards
          columns={[
            { label: "Hospital" },
            { label: "Zone" },
            { label: "Potential" },
            { label: "Visits" },
            { label: "Amount", align: "right" },
            { label: "Objective" },
          ]}
        >
          {accounts.map((a) => (
            <TocRow key={a.id}>
              <TocCell title>{a.account.name}</TocCell>
              <TocCell label="Zone">{a.account.zone.name}</TocCell>
              <TocCell label="Potential"><BusinessPotentialChip value={a.account.business_potential} /></TocCell>
              <TocCell label="Visits">{VISIT_FREQUENCY_LABEL[a.visit_frequency] ?? a.visit_frequency}</TocCell>
              {/* The amount sits right of the name on a phone. */}
              <TocCell action align="right">{lakhs2(a.planned_amount_lakhs)}</TocCell>
              <TocCell label="Objective" sx={{ color: "text.secondary" }}>{a.strategic_objective || "—"}</TocCell>
            </TocRow>
          ))}
          <TocRow total>
            <TocCell title colSpan={4}>{accounts.length} hospital{accounts.length === 1 ? "" : "s"}</TocCell>
            <TocCell action align="right">{lakhs2(target.target_amount_lakhs)}</TocCell>
            <TocCell phone={false} />
          </TocRow>
        </TableOrCards>
        </Box>
      )}

      {target.brand_splits.length > 0 && (
        <Typography variant="body2">
          <strong>Brand split:</strong>{" "}
          {target.brand_splits.map((s) => `${s.brand.name} ${lakhs2(s.split_amount_lakhs)}`).join(" · ")}
        </Typography>
      )}
    </Box>
  );
}
