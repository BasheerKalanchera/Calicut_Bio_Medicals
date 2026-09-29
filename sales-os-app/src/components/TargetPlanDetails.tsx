import { Alert, Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import BusinessPotentialChip from "./BusinessPotentialChip";
import type { TargetPlan } from "../types/targetPlanning";
import { VISIT_FREQUENCY_LABEL } from "../utils/visitFrequency";

function lakhs2(v: string | number) {
  return `₹${Number(v).toFixed(2)}L`;
}

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
          <strong>Why it changed:</strong> {target.change_note}
        </Alert>
      )}

      {accounts.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No hospitals on this plan — it was set before hospital-wise planning.
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hospital</TableCell>
                <TableCell>Zone</TableCell>
                <TableCell>Potential</TableCell>
                <TableCell>Visits</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Objective</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.account.name}</TableCell>
                  <TableCell>{a.account.zone.name}</TableCell>
                  <TableCell><BusinessPotentialChip value={a.account.business_potential} /></TableCell>
                  <TableCell>{VISIT_FREQUENCY_LABEL[a.visit_frequency] ?? a.visit_frequency}</TableCell>
                  <TableCell align="right">{lakhs2(a.planned_amount_lakhs)}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{a.strategic_objective || "—"}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ "& td": { fontWeight: 700 } }}>
                <TableCell colSpan={4}>{accounts.length} hospital{accounts.length === 1 ? "" : "s"}</TableCell>
                <TableCell align="right">{lakhs2(target.target_amount_lakhs)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
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
