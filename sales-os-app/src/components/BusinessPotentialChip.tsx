import { Box } from "@mui/material";
import { BUSINESS_POTENTIAL_LABEL, BUSINESS_POTENTIAL_STYLE, toBusinessPotential } from "../utils/businessPotential";

// Same pill shape as Customer360Screen's PayerBadge, so the two sit
// side by side in the hospital header without looking mismatched.
export default function BusinessPotentialChip({ value }: { value?: string | null }) {
  const potential = toBusinessPotential(value);
  const s = BUSINESS_POTENTIAL_STYLE[potential];
  return (
    <Box
      component="span"
      title="Business Potential"
      sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid", borderColor: s.border, bgcolor: s.bg, color: s.color, whiteSpace: "nowrap" }}
    >
      {potential === "NOT_CLASSIFIED" ? "Not rated" : `${BUSINESS_POTENTIAL_LABEL[potential]} potential`}
    </Box>
  );
}
