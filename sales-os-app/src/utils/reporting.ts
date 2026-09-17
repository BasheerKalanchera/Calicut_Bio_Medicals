import dayjs from "dayjs";

export function formatLakhs(v: number) {
  return `₹${v.toFixed(1)}L`;
}

// Cabio's fiscal year is April-March (Indian FY, see CLAUDE.md), not a
// calendar quarter -- Sales Report's "This Quarter" period needs the real
// FY quarter (Q1 Apr-Jun ... Q4 Jan-Mar), computed here client-side rather
// than adding fiscal-date logic to the backend.
export function getFiscalQuarterBounds(date: dayjs.Dayjs = dayjs()): { start: string; end: string } {
  const fyStartYear = date.month() >= 3 ? date.year() : date.year() - 1;
  const fyStart = dayjs(new Date(fyStartYear, 3, 1));
  const quarterIndex = Math.floor(date.diff(fyStart, "month") / 3);
  const quarterStart = fyStart.add(quarterIndex * 3, "month");
  const quarterEnd = quarterStart.add(3, "month").subtract(1, "day");
  return { start: quarterStart.format("YYYY-MM-DD"), end: quarterEnd.format("YYYY-MM-DD") };
}

// Target Planning's planning_period format (Business-Rules.md: YYYY-Qn, Indian
// FY April-March) -- the "YYYY" is the fiscal year's start calendar year, e.g.
// October 2026 (FY2026 Q3) is "2026-Q3", not "2027-Q3".
export function getCurrentPlanningPeriod(date: dayjs.Dayjs = dayjs()): string {
  const fyStartYear = date.month() >= 3 ? date.year() : date.year() - 1;
  const fyStart = dayjs(new Date(fyStartYear, 3, 1));
  const quarterIndex = Math.floor(date.diff(fyStart, "month") / 3);
  return `${fyStartYear}-Q${quarterIndex + 1}`;
}

// The fiscal year's start calendar year embedded in a "YYYY-Qn" period
// string, e.g. "2026-Q3" -> 2026.
export function getFiscalYearOfPeriod(period: string): number {
  return parseInt(period.slice(0, 4), 10);
}

// The 4 planning_period strings making up one fiscal year, e.g. fyStartYear
// 2026 -> ["2026-Q1", ..., "2026-Q4"] (Apr 2026 - Mar 2027).
export function getPlanningYearQuarters(fyStartYear: number): string[] {
  return [1, 2, 3, 4].map((q) => `${fyStartYear}-Q${q}`);
}

// Steps a "YYYY-Qn" planning period forward/backward by `delta` quarters --
// the quarter picker's prev/next arrows. Annual view reuses this with
// delta=+/-4 to step a full fiscal year at a time.
export function shiftPlanningPeriod(period: string, delta: number): string {
  const match = period.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return period;
  const fyStartYear = parseInt(match[1], 10);
  const quarterIndex = parseInt(match[2], 10) - 1;
  const totalQuarters = fyStartYear * 4 + quarterIndex + delta;
  const newFyStartYear = Math.floor(totalQuarters / 4);
  const newQuarterIndex = ((totalQuarters % 4) + 4) % 4;
  return `${newFyStartYear}-Q${newQuarterIndex + 1}`;
}
