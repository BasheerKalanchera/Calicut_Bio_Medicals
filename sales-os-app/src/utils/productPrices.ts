import type { ProductPricesShape } from "../types/api-aliases";

// Product pricing plan D3 / D5: the server already sends each person only the
// prices they may see (backend/app/domains/product/schemas.py), so "the lowest"
// here is simply the smallest lowest-price that arrived. A rep gets one, an Area
// Manager one, the General Manager and Admin all three (warned against the
// smallest, the CEO's -- Basheer, 2026-11-18).
export function lowestPriceFor(prices: ProductPricesShape | null | undefined): number | null {
  if (!prices) return null;
  const floors = [prices.rep_floor_lakhs, prices.area_manager_floor_lakhs, prices.ceo_floor_lakhs]
    .filter((v): v is string => v != null)
    .map(Number);
  return floors.length > 0 ? Math.min(...floors) : null;
}

const FULL_ACCESS_ROLES = new Set(["General Manager", "Admin"]);

// How each role's lowest price is named: `line` in "Full ₹35L · your lowest ₹33L",
// `warning` in "Below your lowest (₹33L)". The SBU Manager sees the Area
// Manager's lowest for now (D3).
export function lowestWording(roleName: string | undefined): { line: string; warning: string } {
  if (roleName && FULL_ACCESS_ROLES.has(roleName)) return { line: "lowest", warning: "the lowest" };
  if (roleName === "SBU Manager") return { line: "Area Manager's lowest", warning: "the Area Manager's lowest" };
  return { line: "your lowest", warning: "your lowest" };
}

// D5 (and the 18 Nov answer): the lowest is compared after the line's discount,
// because that is what the customer pays. Compared in paise to dodge float noise.
export function isBelowLowest(unitPrice: number, discount: number, quantity: number, lowest: number | null): boolean {
  if (lowest == null || !(unitPrice > 0) || !(quantity > 0)) return false;
  const perUnit = unitPrice - discount / quantity;
  return Math.round(perUnit * 100) < Math.round(lowest * 100);
}
