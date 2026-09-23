// Shared "do these numbers add up to the target" arithmetic for any
// multi-row allocation editor in this app (Opportunity contributor splits,
// Brand-Level Target Planning's brand splits). Deliberately just the math --
// each screen keeps its own state shape and markup, since a compact popup
// and a full tab panel are different contexts. Written once so the
// tolerance/equality rule can't drift between copies the way it did before
// (/code-review 2026-09-23: Opportunity splits and Brand splits each had
// their own hand-written sum check with different tolerances).

export function roundToPrecision(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function sumAllocation(values: number[]): number {
  return values.reduce((sum, v) => sum + (Number(v) || 0), 0);
}

// decimals should match the backend column's own NUMERIC scale (2 for both
// split_percentage and *_amount_lakhs today) so a total that looks balanced
// on screen is guaranteed to pass the backend's own exact-equality check.
export function isAllocationBalanced(total: number, target: number, decimals: number): boolean {
  return roundToPrecision(total, decimals) === roundToPrecision(target, decimals);
}
