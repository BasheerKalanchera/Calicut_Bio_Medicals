import type { DraftOpportunityItem } from "../types/opportunityItems";

// Lakhs to 2 places, as the server stores them (5.005 rounds up to 5.01).
export function roundLakhs(value: number): number {
  return Math.round(Number((value * 100).toFixed(6))) / 100;
}

// BR-FIN-03: Opportunity Value nets BUYBACK lines against PRODUCT/ACCESSORY
// lines rather than adding to them.
export function signedValue(
  item: Pick<DraftOpportunityItem, "line_type" | "quantity" | "unit_price_lakhs" | "discount_lakhs">,
): number {
  return (item.line_type === "BUYBACK" ? -1 : 1) * (item.quantity * item.unit_price_lakhs - item.discount_lakhs);
}

export function itemsTotal(items: DraftOpportunityItem[]): number {
  return items.reduce((sum, item) => sum + signedValue(item), 0);
}
