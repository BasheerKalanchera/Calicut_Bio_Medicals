import { formatLakhs } from "./formatter";

// Shared by Target vs Actuals' Quarter and Year views.

export const DASH = "—";

// Backend sends Decimals as strings; null means "not applicable" (past
// quarter's Expected, or a percent with nothing to compare with) and shows a dash.
export function lakhs(v: string | null): string {
  return v === null ? DASH : formatLakhs(parseFloat(v));
}
export function percent(v: string | null): string {
  return v === null ? DASH : `${parseFloat(v).toFixed(0)}%`;
}
export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

export const headCellSx = { fontSize: "0.6875rem", fontWeight: 900, textTransform: "uppercase", color: "#6b7280" } as const;
export const numHeadSx = { ...headCellSx, textAlign: "right" } as const;
export const numCellSx = { fontVariantNumeric: "tabular-nums", textAlign: "right" } as const;
export const noteSx = { fontSize: "0.75rem", color: "text.secondary" } as const;
