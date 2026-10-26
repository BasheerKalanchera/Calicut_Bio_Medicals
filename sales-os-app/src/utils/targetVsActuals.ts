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

// A small heading over a list that isn't a table ("Closing date passed").
export const headCellSx = { typography: "caption2", fontWeight: 900, textTransform: "uppercase", color: "gray.500" } as const;
export const numCellSx = { fontVariantNumeric: "tabular-nums" } as const;
export const noteSx = { typography: "caption", color: "text.secondary" } as const;
