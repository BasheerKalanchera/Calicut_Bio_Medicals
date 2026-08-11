export interface ProductOption {
  id: string;
  name: string;
  category_name?: string | null;
  product_type: string;
}

export type OpportunityItemMode = "product" | "accessory" | "buyback";

// Draft/editable-buffer shape used by every opportunity create/edit entry point
// while a rep is adding Product/Accessory/Buyback lines (BR-CAT-02/BR-CAT-03),
// before they're sent to the backend.
export interface DraftOpportunityItem {
  // Present only for rows loaded from an existing Opportunity — used by the
  // diffing edit flows (Customer360Screen.tsx, ProjectDirectoryScreen.jsx) to
  // know what changed since the draft was seeded.
  id?: string;
  product_id: string | null;
  description?: string | null;
  product_name?: string;
  product_type?: string;
  quantity: number;
  unit_price_lakhs: number;
  discount_lakhs: number;
  line_type: "PRODUCT" | "BUYBACK";
}
