import type { VisitFrequency } from "../types/targetPlanning";

// Fixed list (Hospital-Wise Target Planning plan, choice 2) -- matches the
// backend VisitFrequency enum and the CHECK constraint in migration 0055.
export const VISIT_FREQUENCY_LABEL: Record<VisitFrequency, string> = {
  WEEKLY: "Weekly",
  BI_WEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  AS_NEEDED: "As needed",
};

export const VISIT_FREQUENCIES = Object.keys(VISIT_FREQUENCY_LABEL) as VisitFrequency[];
