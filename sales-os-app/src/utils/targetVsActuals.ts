import { formatLakhs } from "./formatter";
import type { TargetVsActualSummaryRow } from "../types/targetPlanning";

// Shared by Target vs Actuals' Quarter and Year views.

export const DASH = "—";

// Backend sends Decimals as strings; null means "not applicable" (past
// quarter's Expected, or a percent with nothing to compare with) and shows a dash.
export function lakhs(v: string | null): string {
  return v === null ? DASH : formatLakhs(parseFloat(v));
}
export function percent(v: string | null): string {
  return v === null ? DASH : `${parseFloat(v).toFixed(2)}%`;
}
// a as a percent of b, as the server sends percents (a string); null when b
// is missing or zero.
export function ratio(a: string | null, b: string | null): string | null {
  if (a === null || b === null) return null;
  const base = parseFloat(b);
  return base > 0 ? String((parseFloat(a) / base) * 100) : null;
}

// The Company row (Admin/GM: against every SBU's target), SBU row (SBU
// Manager and above: against the SBU target, its brands' total) and team row
// (Area Manager: against their own target) -- Annual Target Planning D49.
// Widest first, so the narrowest row sits just above the person rows it sums
// (Basheer, 2026-10-24).
export interface SummaryLine {
  key: string;
  label: string;
  row: TargetVsActualSummaryRow;
  // Shown in place of a target that isn't set yet.
  notSet: string;
}

export function summaryLines(
  companyRow: TargetVsActualSummaryRow | null,
  sbuRow: TargetVsActualSummaryRow | null,
  teamRow: TargetVsActualSummaryRow | null,
): SummaryLine[] {
  const lines: SummaryLine[] = [];
  if (companyRow) lines.push({ key: "company", label: "Company", row: companyRow, notSet: "Waits for every SBU's target" });
  if (sbuRow) lines.push({ key: "sbu", label: "SBU", row: sbuRow, notSet: "Target not set" });
  if (teamRow) lines.push({ key: "team", label: "Your team", row: teamRow, notSet: "Target not set" });
  return lines;
}

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

export const numCellSx = { fontVariantNumeric: "tabular-nums" } as const;
export const noteSx = { typography: "caption", color: "text.secondary" } as const;
