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

// BR-OP-19 (docs/Business-Rules.md): before Negotiation, an Active Opportunity
// at 50 % or more needs an Expected Closure Date. Message word for word the
// server's (opportunity/validators.py). Shared by QuickLeadModal.tsx (create)
// and OpportunityDetailScreen.tsx (edit form + the notice on the page).
export const HIGH_CHANCE_NEEDS_CLOSURE_DATE_MSG =
  "Win Probability is 50% or more but there's no expected closure date - add one.";
const STAGE_ORDER_NEGOTIATION = 50;

/** True when the chance is high enough, before Negotiation, that a closure date is needed. */
export function needsClosureDateForChance(
  stageOrder: number,
  winProbability: number | string | null | undefined,
): boolean {
  const chance = typeof winProbability === "string" ? parseFloat(winProbability) : winProbability;
  return stageOrder < STAGE_ORDER_NEGOTIATION && chance != null && !Number.isNaN(chance) && chance >= 50;
}

/** True when an Active Opportunity is over the BR-OP-19 limit with no closure date. */
export function breaksHighChanceRule(
  statusCode: string | null | undefined,
  stageOrder: number,
  winProbability: number | string | null | undefined,
  expectedClosureDate: string | null | undefined,
): boolean {
  return statusCode === "ACTIVE" && !expectedClosureDate && needsClosureDateForChance(stageOrder, winProbability);
}
