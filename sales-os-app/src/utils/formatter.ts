import dayjs from "dayjs";

export function formatLakhs(v: number) {
  return `₹${v.toFixed(1)}L`;
}

// A price in Lakhs, keeping its second decimal ("₹35L", "₹33.75L"); formatLakhs
// rounds to one decimal, which would show 33.75 as 33.8.
export function formatPriceLakhs(v: number | string) {
  return `₹${Number(v).toFixed(2).replace(/\.?0+$/, "")}L`;
}

// Lakhs with both decimals, the minus sign ahead of the rupee sign
// ("−₹5.00L") -- Margin Report, where a loss has to read as one (D18).
export function formatLakhsExact(v: number | string) {
  const n = Number(v);
  return `${n < 0 ? "−" : ""}₹${Math.abs(n).toFixed(2)}L`;
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

// Today as "YYYY-MM-DD" in the browser's own time zone (IST for every Cabio
// user) -- not toISOString(), which is UTC and still "yesterday" before 5:30 am
// IST. Used as the `max` of no-future date fields (e.g. PO Date).
export function getTodayIso(): string {
  return dayjs().format("YYYY-MM-DD");
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

// A fiscal year as screens show it: 2026 -> "FY 2026-27".
export function formatFiscalYear(fyStartYear: number): string {
  return `FY ${fyStartYear}-${String((fyStartYear + 1) % 100).padStart(2, "0")}`;
}

const QUARTER_MONTHS = ["Apr–Jun", "Jul–Sep", "Oct–Dec", "Jan–Mar"];

// A "YYYY-Qn" planning period as screens show it (Annual Target Planning
// D39): "2026-Q3" -> "Oct–Dec 2026", "2026-Q4" -> "Jan–Mar 2027". The code
// alone reads as a calendar quarter (Q3 = Jul–Sep), which it isn't.
export function formatPlanningPeriod(period: string): string {
  const match = period.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return period;
  const fyStartYear = parseInt(match[1], 10);
  const q = parseInt(match[2], 10);
  return `${QUARTER_MONTHS[q - 1]} ${q === 4 ? fyStartYear + 1 : fyStartYear}`;
}

// The Period box of the reports that count Won Opportunities by closed date.
export type ReportPeriod = "month" | "quarter" | "all";

export const REPORT_PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "all", label: "All Time" },
];

// The start and end dates sent to the server; All Time sends none.
export function reportPeriodFilters(period: ReportPeriod): { period_start?: string; period_end?: string } {
  if (period === "all") return {};
  if (period === "month") {
    const today = dayjs();
    return {
      period_start: today.startOf("month").format("YYYY-MM-DD"),
      period_end: today.endOf("month").format("YYYY-MM-DD"),
    };
  }
  const { start, end } = getFiscalQuarterBounds();
  return { period_start: start, period_end: end };
}

// The dates the period box covers, spelled out ("This Quarter" alone changes
// meaning on 1 January). Quarter reads like Target vs Actuals ("Oct–Dec 2026").
export function reportPeriodDates(period: ReportPeriod): string {
  if (period === "all") return "All time";
  if (period === "month") return dayjs().format("MMM YYYY");
  return formatPlanningPeriod(getCurrentPlanningPeriod());
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
