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
