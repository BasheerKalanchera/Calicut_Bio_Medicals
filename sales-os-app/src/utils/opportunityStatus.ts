// BR-OP-05 (docs/Business-Rules.md): once an On Hold opportunity's reactivation_date
// has passed, it must be flagged "Reactivation Overdue" in all insights views.
// Shared across Customer360Screen.tsx, OpportunityDetailScreen.tsx, and
// OpportunityPipelineScreen.tsx rather than tripling this check.
export function isReactivationOverdue(
  statusCode: string | null | undefined,
  reactivationDate: string | null | undefined,
): boolean {
  if (statusCode !== "ON_HOLD" || !reactivationDate) return false;
  return reactivationDate <= new Date().toISOString().slice(0, 10);
}
