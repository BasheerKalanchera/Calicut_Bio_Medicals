import { Box, Chip, IconButton, TextField, Typography } from "@mui/material";
import type { DraftOpportunityItem } from "../types/opportunityItems";
import { itemsTotal } from "../utils/opportunityItems";
import ProductPriceNote from "./ProductPriceNote";

type EditableField = "quantity" | "unit_price_lakhs" | "discount_lakhs";

// Renders an already-added Product/Accessory/Buyback item list plus its
// running total (BR-FIN-03: Buyback nets negative). Two variants:
//   - "summary": compact read-only row (name + qty×price/disc), used in the
//     collapsed Products section of a create/edit modal's main form.
//   - "editable": full row with Refurbished/Buyback chips, editable
//     qty/price/disc fields, and a remove button — used inside a secondary
//     "Products" modal, or inline (OpportunityDetailScreen's Products tab).
export default function OpportunityItemsList({
  items,
  variant,
  onRemove,
  onUpdateField,
  emptyMessage = "No products added",
}: {
  items: DraftOpportunityItem[];
  variant: "summary" | "editable";
  onRemove?: (index: number) => void;
  onUpdateField?: (index: number, field: EditableField, value: number) => void;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <Typography sx={{ typography: "caption", color: "gray.400", fontStyle: "italic", textAlign: variant === "editable" ? "center" : "left", py: variant === "editable" ? 2 : 0 }}>
        {emptyMessage}
      </Typography>
    );
  }

  const total = itemsTotal(items);

  if (variant === "summary") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        {items.map((item, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, bgcolor: "gray.50", borderRadius: "0.75rem", typography: "caption" }}>
            <Typography sx={{ flex: 1, fontWeight: 700, fontSize: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.description || item.product_name}
            </Typography>
            <Typography sx={{ color: "gray.400", fontSize: "inherit", flexShrink: 0 }}>
              {item.quantity}×₹{item.unit_price_lakhs}L{item.discount_lakhs > 0 ? ` −₹${item.discount_lakhs}L` : ""}
            </Typography>
          </Box>
        ))}
        <Typography sx={{ textAlign: "right", typography: "tiny", fontWeight: 900, color: "gray.500", textTransform: "uppercase", letterSpacing: "0.05em", pr: 0.5 }}>
          Total: ₹{total.toFixed(2)}L
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((item, i) => (
        <Box key={i} sx={{ bgcolor: item.line_type === "BUYBACK" ? "red.50" : "background.paper", p: 1.5, borderRadius: "1rem", border: "1px solid", borderColor: "gray.100", display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, overflow: "hidden" }}>
              <Typography sx={{ fontWeight: 700, typography: "caption", color: "gray.800", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.description || item.product_name}
              </Typography>
              {item.product_type === "REFURBISHED" && <Chip label="Refurbished" size="small" color="warning" />}
              {item.line_type === "BUYBACK" && <Chip label="Buyback" size="small" color="error" />}
            </Box>
            {onRemove && (
              <IconButton
                size="small"
                onClick={() => onRemove(i)}
                sx={{ color: "red.400", "&:hover": { color: "red.600" }, ml: 1 }}
              >
                <Box component="span" sx={{ fontWeight: 900, typography: "lead", lineHeight: 1 }}>×</Box>
              </IconButton>
            )}
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
            {(["quantity", "unit_price_lakhs", "discount_lakhs"] as const).map((key) => (
              <TextField
                key={key}
                label={key === "quantity" ? "Qty" : key === "unit_price_lakhs" ? "Price ₹L" : "Disc ₹L"}
                type="number"
                size="small"
                value={item[key]}
                onChange={(e) => onUpdateField?.(i, key, Number(e.target.value))}
                slotProps={{ htmlInput: { min: 0, step: "any" } }}
                sx={{ width: key === "quantity" ? "5rem" : "7.5rem" }}
              />
            ))}
          </Box>
          {item.line_type !== "BUYBACK" && item.product_id && (
            <ProductPriceNote productId={item.product_id} quantity={item.quantity} unitPrice={item.unit_price_lakhs} discount={item.discount_lakhs} />
          )}
        </Box>
      ))}
      <Typography sx={{ textAlign: "right", typography: "tiny", fontWeight: 900, color: "gray.500", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Total: ₹{total.toFixed(2)}L
      </Typography>
    </Box>
  );
}
