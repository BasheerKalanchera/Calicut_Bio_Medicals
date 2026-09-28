// Business Potential rating on a hospital (docs/Hospital-Wise-Target-
// Planning-Implementation-Plan.md). Values match the ck_account_business_
// potential CHECK constraint exactly.
export type BusinessPotential = "HIGH" | "MEDIUM" | "LOW" | "NOT_CLASSIFIED";

export const BUSINESS_POTENTIAL_OPTIONS: BusinessPotential[] = ["HIGH", "MEDIUM", "LOW", "NOT_CLASSIFIED"];

export const BUSINESS_POTENTIAL_LABEL: Record<BusinessPotential, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  NOT_CLASSIFIED: "Not rated",
};

export const BUSINESS_POTENTIAL_STYLE: Record<BusinessPotential, { bg: string; color: string; border: string }> = {
  HIGH: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  MEDIUM: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  LOW: { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  NOT_CLASSIFIED: { bg: "#f9fafb", color: "#9ca3af", border: "#e5e7eb" },
};

export function toBusinessPotential(value?: string | null): BusinessPotential {
  return value && value in BUSINESS_POTENTIAL_LABEL ? (value as BusinessPotential) : "NOT_CLASSIFIED";
}
