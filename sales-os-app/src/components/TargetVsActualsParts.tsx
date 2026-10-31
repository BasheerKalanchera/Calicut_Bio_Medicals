import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { DASH, noteSx, percent, plural } from "../utils/targetVsActuals";

// Shared by Target vs Actuals' Quarter and Year views.

export function NoPoDateNote({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Box sx={noteSx}>
      {count} {plural(count, "Opportunity past Order has", "Opportunities past Order have")} no PO date, so{" "}
      {plural(count, "it isn't", "they aren't")} counted in PO received.
    </Box>
  );
}

// The boxes at the top: `columns` across on a tablet or laptop, two to a row
// on a phone (D10); a `wide` one takes the phone's full row.
export function TileGrid({ columns, children }: { columns: number; children: ReactNode }) {
  return (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: `repeat(${columns}, minmax(0, 1fr))` } }}>
      {children}
    </Box>
  );
}

export function TileCell({ wide = false, children }: { wide?: boolean; children: ReactNode }) {
  return <Box sx={{ display: "flex", minWidth: 0, ...(wide && { gridColumn: { xs: "1 / -1", sm: "auto" } }) }}>{children}</Box>;
}

const barWidth = (v: string | null): string => `${v === null ? 0 : Math.max(0, Math.min(100, parseFloat(v)))}%`;

// Won (dark) and, where there is one, Likely finish (light) as a share of
// the same base as the % beside it; `basis` says which ("of plan", "of
// target") so the two aren't confused. A dash when there is nothing to compare with.
export function WonBar({ wonPct, likelyPct, basis }: { wonPct: string | null; likelyPct?: string | null; basis?: string }) {
  if (wonPct === null) return <Box component="span" sx={{ color: "text.secondary" }}>{DASH}</Box>;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 130, flex: 1 }}>
      <Box sx={{ position: "relative", flex: 1, height: 8, borderRadius: "4px", bgcolor: "gray.200", overflow: "hidden" }}>
        {likelyPct != null && (
          <Box sx={{ position: "absolute", inset: 0, width: barWidth(likelyPct), bgcolor: "report.bar", opacity: 0.35 }} />
        )}
        <Box sx={{ position: "absolute", inset: 0, width: barWidth(wonPct), bgcolor: "report.bar" }} />
      </Box>
      <Box sx={{ minWidth: 62, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
        {percent(wonPct)}
        {basis && <Box component="span" sx={{ display: "block", ...noteSx, fontWeight: 400, whiteSpace: "nowrap" }}>{basis}</Box>}
      </Box>
    </Box>
  );
}
