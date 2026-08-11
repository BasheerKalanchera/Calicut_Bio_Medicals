import { useState } from "react";
import { Alert, Autocomplete, Box, Button, Chip, MenuItem, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { DraftOpportunityItem, OpportunityItemMode, ProductOption } from "../types/opportunityItems";

// 3-way add-row: Add Product (New Equipment + Refurbished, sold outright),
// Add Accessory, Buyback (free-text description, subtracted — BR-CAT-03/BR-FIN-03).
// Owns its own transient input state so callers only need to track the
// resulting items list, not a copy of this row's fields.
export default function OpportunityItemAddRow({
  products,
  onAdd,
}: {
  products: ProductOption[];
  onAdd: (item: DraftOpportunityItem) => void;
}) {
  const [addMode, setAddMode] = useState<OpportunityItemMode>("product");
  const [addProdId, setAddProdId] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addQty, setAddQty] = useState("1");
  const [addPrice, setAddPrice] = useState("0");
  const [addDisc, setAddDisc] = useState("0");
  const [addItemError, setAddItemError] = useState<string | null>(null);

  // BR-CAT-02: "Add Product" sells New Equipment or Refurbished stock outright;
  // "Add Accessory" is pre-filtered by product_type. Buyback (BR-CAT-03) is
  // free-text, no catalog picker involved.
  const productModeOptions = products.filter((p) => p.product_type !== "ACCESSORY");
  const accessoryModeOptions = products.filter((p) => p.product_type === "ACCESSORY");
  const modeOptions = addMode === "product" ? productModeOptions : accessoryModeOptions;

  const switchAddMode = (mode: OpportunityItemMode) => {
    setAddMode(mode);
    setAddProdId("");
    setAddDescription("");
    setAddItemError(null);
  };

  const addItem = () => {
    if (addMode === "buyback") {
      if (!addDescription.trim()) { setAddItemError("Enter a description of the traded-in machine"); return; }
    } else if (!addProdId) {
      setAddItemError("Select a product"); return;
    }
    if (Number(addQty) <= 0) { setAddItemError("Quantity must be greater than 0"); return; }
    if (Number(addPrice) <= 0) { setAddItemError("Price must be greater than 0"); return; }
    setAddItemError(null);
    if (addMode === "buyback") {
      onAdd({
        product_id: null, product_name: undefined, product_type: undefined,
        description: addDescription.trim(),
        line_type: "BUYBACK",
        quantity: Number(addQty), unit_price_lakhs: Number(addPrice), discount_lakhs: Number(addDisc || 0),
      });
    } else {
      const prod = products.find((p) => p.id === addProdId);
      onAdd({
        product_id: addProdId, product_name: prod?.name || "", product_type: prod?.product_type,
        description: undefined,
        line_type: "PRODUCT",
        quantity: Number(addQty), unit_price_lakhs: Number(addPrice), discount_lakhs: Number(addDisc || 0),
      });
    }
    setAddProdId(""); setAddDescription(""); setAddQty("1"); setAddPrice("0"); setAddDisc("0");
  };

  return (
    <Box sx={{ bgcolor: "#fff", p: 1.5, borderRadius: "1rem", border: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: 1 }}>
      <ToggleButtonGroup
        value={addMode}
        exclusive
        onChange={(_e, newMode) => { if (newMode) switchAddMode(newMode); }}
        size="small"
        fullWidth
        sx={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", overflow: "hidden" }}
      >
        {(["product", "accessory", "buyback"] as const).map((mode) => (
          <ToggleButton
            key={mode}
            value={mode}
            disableRipple
            sx={{
              fontSize: "0.7rem", fontWeight: 800, textTransform: "none",
              border: "none", color: "#9ca3af", bgcolor: "#fff",
              "&:hover": { bgcolor: "background.default" },
              "&.Mui-selected": {
                bgcolor: mode === "buyback" ? "#dc2626" : "primary.main",
                color: "#fff",
              },
              "&.Mui-selected:hover": { bgcolor: mode === "buyback" ? "#dc2626" : "primary.main" },
            }}
          >
            {mode === "product" ? "Add Product" : mode === "accessory" ? "Add Accessory" : "Buyback"}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {addMode === "product" ? (
        <Autocomplete
          options={modeOptions}
          groupBy={(option) => option.category_name || "Other"}
          getOptionLabel={(option) => option.name}
          value={modeOptions.find((p) => p.id === addProdId) ?? null}
          onChange={(_e, newValue) => { setAddProdId(newValue?.id ?? ""); setAddItemError(null); }}
          renderOption={(optionProps, option) => (
            <Box component="li" {...optionProps} key={option.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <span>{option.name}</span>
              {option.product_type === "REFURBISHED" && <Chip label="Refurbished" size="small" color="warning" />}
            </Box>
          )}
          renderInput={(params) => <TextField {...params} size="small" placeholder="Select product" />}
          size="small"
        />
      ) : addMode === "accessory" ? (
        <TextField
          select
          value={addProdId}
          onChange={(e) => { setAddProdId(e.target.value); setAddItemError(null); }}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true } }}
        >
          <MenuItem value="">Select accessory</MenuItem>
          {modeOptions.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
      ) : (
        <TextField
          label="Machine description"
          value={addDescription}
          onChange={(e) => { setAddDescription(e.target.value); setAddItemError(null); }}
          placeholder="e.g. GE LOGIQ P9 ultrasound, 2018, working condition"
          multiline
          rows={3}
          fullWidth
          size="small"
        />
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        <TextField label="Qty" type="number" size="small" value={addQty} onChange={(e) => { setAddQty(e.target.value); setAddItemError(null); }} slotProps={{ htmlInput: { min: 0, step: "any" } }} sx={{ width: "5rem" }} />
        <TextField label={addMode === "buyback" ? "Credit ₹L" : "Price ₹L"} type="number" size="small" value={addPrice} onChange={(e) => { setAddPrice(e.target.value); setAddItemError(null); }} slotProps={{ htmlInput: { min: 0, step: "any" } }} sx={{ width: "7.5rem" }} />
        <TextField label="Disc ₹L" type="number" size="small" value={addDisc} onChange={(e) => { setAddDisc(e.target.value); setAddItemError(null); }} slotProps={{ htmlInput: { min: 0, step: "any" } }} sx={{ width: "7.5rem" }} />
      </Box>
      {addItemError && <Alert severity="error" sx={{ fontSize: "0.75rem" }}>{addItemError}</Alert>}
      <Button
        onClick={addItem}
        fullWidth
        disableRipple
        sx={{
          py: 1, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
          color: addMode === "buyback" ? "#dc2626" : "primary.main",
          bgcolor: addMode === "buyback" ? "#fef2f2" : "#eff6ff",
          "&:hover": { bgcolor: addMode === "buyback" ? "#fee2e2" : "#dbeafe" },
        }}
      >
        {addMode === "product" ? "+ Add Product" : addMode === "accessory" ? "+ Add Accessory" : "− Add Buyback"}
      </Button>
    </Box>
  );
}
