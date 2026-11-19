import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Typography } from "@mui/material";
import { getProduct } from "../services/products";
import { useAuth } from "../contexts/AuthContext";
import { formatPriceLakhs } from "../utils/formatter";
import { isBelowLowest, lowestPriceFor, lowestWording } from "../utils/productPrices";
import type { ProductResponse, ProductPricesShape } from "../types/api-aliases";

// Under a product line on an Opportunity (plan D4, D5): the grey line
// "Full ₹35L · your lowest ₹33L" and, when the price after the line's discount is
// under the person's lowest, a warning. Show only -- the line can still be saved.
// The prices come from the single-product call, which the server trims to what
// this person may see; when none arrive (no prices entered, or a role that sees
// none) nothing is drawn.
export default function ProductPriceNote({
  productId,
  quantity,
  unitPrice,
  discount,
}: {
  productId: string | null | undefined;
  quantity: number;
  unitPrice: number;
  discount: number;
}) {
  const { userProfile } = useAuth();
  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId as string) as Promise<ProductResponse>,
    enabled: !!productId,
  });

  const prices = product?.prices as ProductPricesShape | null | undefined;
  const lowest = lowestPriceFor(prices);
  if (!prices || (prices.full_price_lakhs == null && lowest == null)) return null;

  const wording = lowestWording(userProfile?.role_name);
  const parts = [
    prices.full_price_lakhs != null && `Full ${formatPriceLakhs(prices.full_price_lakhs)}`,
    lowest != null && `${wording.line} ${formatPriceLakhs(lowest)}`,
  ].filter(Boolean);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {parts.join(" · ")}
      </Typography>
      {lowest != null && isBelowLowest(unitPrice, discount, quantity, lowest) && (
        <Alert severity="warning" sx={{ typography: "caption" }}>
          Below {wording.warning} ({formatPriceLakhs(lowest)})
        </Alert>
      )}
    </Box>
  );
}
