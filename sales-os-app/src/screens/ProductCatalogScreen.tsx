import { useState, type Dispatch, type SetStateAction, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Chip,
  Alert,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  listProducts,
  countProducts,
  getProduct,
  createProduct,
  updateProduct,
  getProductUsage,
  deactivateProduct,
  reactivateProduct,
} from "../services/products";
import { listProductDocuments, createProductDocument, deleteDocument } from "../services/documents";
import { listBrands, createBrand, listModels, createModel, listCategories, createCategory } from "../services/catalogHierarchy";
import { listSbus } from "../services/masterData";
import { useAuth } from "../contexts/AuthContext";
import useDebouncedValue from "../hooks/useDebouncedValue";
import FormModal from "../components/FormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { shadows } from "../theme/shadows";
import { formatPriceLakhs } from "../utils/formatter";
import { lowestPriceFor, lowestWording } from "../utils/productPrices";
import type { ProductListResponse, ProductResponse, ProductPricesShape, DocumentResponse, BrandResponse, CategoryResponse, ModelResponse } from "../types/api-aliases";

const CATALOG_WRITE_ROLES = new Set(["General Manager", "Admin"]);

// Price and cost boxes on the Add / Edit pop-ups (GM and Admin only, plan D6, D8).
// The keys are the server's field names; amounts are INR Lakhs.
const PRICE_FIELDS = [
  { key: "full_price_lakhs", label: "Full price" },
  { key: "rep_floor_lakhs", label: "Rep's lowest" },
  { key: "area_manager_floor_lakhs", label: "Area Manager's lowest" },
  { key: "ceo_floor_lakhs", label: "CEO's lowest" },
  { key: "cost_lakhs", label: "Cost" },
] as const;

const LOWEST_KEYS = new Set<string>(["rep_floor_lakhs", "area_manager_floor_lakhs", "ceo_floor_lakhs"]);

// A price box holds a number of lakhs: 0 or more, up to 2 decimals.
const PRICE_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;

// Shared by the inline "+ Add new brand/model/category" mutations below,
// same shape as CollateralLinksCard.handleAddLink's inline catch -- surfaces
// a duplicate-name 409 or an SBU-mismatch 422 instead of failing silently.
function extractApiErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
  return axiosErr.response?.data?.detail ?? axiosErr.message ?? fallback;
}

interface SbuOption {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  sbu_id: "",
  brand_id: "",
  model_id: "",
  description: "",
  product_type: "NEW_EQUIPMENT",
  full_price_lakhs: "",
  rep_floor_lakhs: "",
  area_manager_floor_lakhs: "",
  ceo_floor_lakhs: "",
  cost_lakhs: "",
};

// BR-CAT-02 — Product Lifecycle: Trade-Ins, Refurbished Inventory, Accessories.
const PRODUCT_TYPES = [
  { value: "NEW_EQUIPMENT", label: "New Equipment" },
  { value: "REFURBISHED", label: "Refurbished" },
  { value: "ACCESSORY", label: "Accessory" },
];

const DOCUMENT_TYPES = [
  { value: "BROCHURE", label: "Brochure", icon: "📄" },
  { value: "VIDEO", label: "Video", icon: "🎬" },
  { value: "IMAGE", label: "Image", icon: "🖼️" },
  { value: "OTHER", label: "Other", icon: "🔗" },
];

const EMPTY_LINK_FORM = { file_name: "", file_type: "BROCHURE", storage_path: "" };

// Established app-wide convention (also used in Customer/Opportunity screens): Imaging
// and Critical Care get distinct badge colors so SBU is scannable at a glance.
function sbuChipSx(sbuName: string) {
  return sbuName === "Imaging"
    ? { bgcolor: "indigo.50", color: "indigo.700", borderColor: "indigo.200" }
    : { bgcolor: "rose.50", color: "rose.700", borderColor: "rose.200" };
}

// "Full ₹35L · Cost ₹24L" under a product on the catalog list. The server sends
// prices on the list to General Manager and Admin only, so for everyone else
// `prices` is absent and nothing is drawn. Only entered figures are shown.
function ListPriceLine({ prices }: { prices: ProductPricesShape | null | undefined }) {
  const parts = [
    prices?.full_price_lakhs != null && `Full ${formatPriceLakhs(prices.full_price_lakhs)}`,
    prices?.cost_lakhs != null && `Cost ${formatPriceLakhs(prices.cost_lakhs)}`,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontWeight: 700 }}>
      {parts.join(" · ")}
    </Typography>
  );
}

// One product's page (plan D4): the prices this person may see. General Manager
// and Admin get every level and the cost under their own names; everyone else
// gets the full price and their own lowest. The server sends only what the
// caller may see (BR-CAT-04), so a role that sees none gets no card, and a
// figure not entered yet is left out.
function ProductPricesCard({ prices, roleName }: { prices: ProductPricesShape | null | undefined; roleName: string | undefined }) {
  if (!prices) return null;
  const rows: { label: string; value: string | number | null | undefined }[] = CATALOG_WRITE_ROLES.has(roleName ?? "")
    ? PRICE_FIELDS.map((f) => ({ label: f.label, value: prices[f.key] }))
    : [
        { label: "Full price", value: prices.full_price_lakhs },
        { label: lowestWording(roleName).line.replace(/^./, (c) => c.toUpperCase()), value: lowestPriceFor(prices) },
      ];
  const shown = rows.filter((r) => r.value != null);
  if (shown.length === 0) return null;
  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: "1rem", boxShadow: shadows.sm, border: "1px solid", borderColor: "gray.100", p: 2.5, mt: 2 }}>
      <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 800, letterSpacing: "0.15em", display: "block", mb: 2 }}>
        Prices
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {shown.map((r) => (
          <Box key={r.label}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800, textTransform: "uppercase", display: "block", mb: 0.5 }}>
              {r.label}
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatPriceLakhs(r.value as string | number)}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function CollateralLinksCard({ productId, canEdit }: { productId: string; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const [showAddLink, setShowAddLink] = useState(false);
  const [form, setForm] = useState(EMPTY_LINK_FORM);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<DocumentResponse | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["product-documents", productId],
    queryFn: () => listProductDocuments(productId) as Promise<DocumentResponse[]>,
  });

  const addLinkMutation = useMutation({
    mutationFn: (data: { file_name: string; file_type: string; storage_path: string }) =>
      createProductDocument(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-documents", productId] });
      setForm(EMPTY_LINK_FORM);
      setShowAddLink(false);
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product-documents", productId] }),
    onSettled: () => setLinkToDelete(null),
  });

  function set(field: keyof typeof EMPTY_LINK_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAddLink(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    try {
      await addLinkMutation.mutateAsync({
        file_name: form.file_name.trim(),
        file_type: form.file_type,
        storage_path: form.storage_path.trim(),
      });
    } catch (err) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setSaveError(axiosErr.response?.data?.detail ?? axiosErr.message ?? "Failed to add link");
    }
  }

  const isValid = form.file_name.trim() && form.storage_path.trim();

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: "1rem", boxShadow: shadows.sm, border: "1px solid", borderColor: "gray.100", p: 2.5, mt: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 800, letterSpacing: "0.15em" }}>
          Collateral Links
        </Typography>
        {canEdit && (
          <Button size="small" onClick={() => setShowAddLink((v) => !v)}>
            {showAddLink ? "Cancel" : "+ Add Link"}
          </Button>
        )}
      </Box>

      {canEdit && showAddLink && (
        <Box
          component="form"
          onSubmit={handleAddLink}
          sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2, p: 2, bgcolor: "gray.50", borderRadius: "0.75rem" }}
        >
          {saveError && <Alert severity="error">{saveError}</Alert>}
          <TextField
            label="Label *"
            value={form.file_name}
            onChange={(e) => set("file_name", e.target.value)}
            placeholder="e.g. Product Brochure 2026"
            fullWidth
            size="small"
            autoFocus
          />
          <TextField
            select
            label="Type"
            value={form.file_type}
            onChange={(e) => set("file_type", e.target.value)}
            fullWidth
            size="small"
          >
            {DOCUMENT_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.icon} {t.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="URL *"
            type="url"
            value={form.storage_path}
            onChange={(e) => set("storage_path", e.target.value)}
            placeholder="https://..."
            fullWidth
            size="small"
          />
          <Button type="submit" variant="contained" disabled={addLinkMutation.isPending || !isValid}>
            {addLinkMutation.isPending ? "Adding..." : "Add Link"}
          </Button>
        </Box>
      )}

      {isLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
          Loading links...
        </Typography>
      )}

      {!isLoading && documents.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2, fontStyle: "italic" }}>
          No collateral links yet.
        </Typography>
      )}

      {!isLoading && documents.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {documents.map((doc) => {
            const typeInfo = DOCUMENT_TYPES.find((t) => t.value === doc.file_type) ?? DOCUMENT_TYPES[3];
            return (
              <Box
                key={doc.id}
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, px: 1.5, py: 1.25, bgcolor: "gray.50", borderRadius: "0.75rem" }}
              >
                <Box
                  component="a"
                  href={doc.storage_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1, textDecoration: "none", color: "text.primary", "&:hover": { color: "primary.main" } }}
                >
                  <span>{typeInfo.icon}</span>
                  <Typography variant="body2" sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.file_name}
                  </Typography>
                </Box>
                {canEdit && (
                  <IconButton
                    size="small"
                    onClick={() => setLinkToDelete(doc)}
                    disabled={deleteLinkMutation.isPending && deleteLinkMutation.variables === doc.id}
                    aria-label="Remove link"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      <ConfirmDialog
        open={linkToDelete !== null}
        title="Delete this file?"
        message="This can't be undone."
        busy={deleteLinkMutation.isPending}
        onConfirm={() => { if (linkToDelete) deleteLinkMutation.mutate(linkToDelete.id); }}
        onCancel={() => setLinkToDelete(null)}
      />
    </Box>
  );
}

function ProductDetail({
  productId,
  onBack,
  onEdit,
  onToggleActive,
  toggleBusy,
  canEdit,
}: {
  productId: string;
  onBack: () => void;
  onEdit: (product: ProductResponse) => void;
  // Deactivate (opens the pop-up) or Reactivate (runs at once), by the product's state.
  onToggleActive: (product: { id: string; name: string; is_active: boolean | null }) => void;
  toggleBusy: boolean;
  canEdit: boolean;
}) {
  const { userProfile } = useAuth();
  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId) as Promise<ProductResponse>,
  });

  if (isLoading) {
    return (
      <Box sx={{ flex: 1, overflow: "auto", p: 2, bgcolor: "gray.50" }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
          Loading product...
        </Typography>
      </Box>
    );
  }

  if (isError || !product) {
    return (
      <Box sx={{ flex: 1, overflow: "auto", p: 2, bgcolor: "gray.50" }}>
        <IconButton onClick={onBack} sx={{ mb: 2 }} aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        <Alert
          severity="error"
          action={<Button size="small" onClick={() => refetch()}>Retry</Button>}
        >
          Failed to load product
        </Alert>
      </Box>
    );
  }

  const fields = [
    { label: "Brand", value: product.brand?.name },
    { label: "Model", value: product.model?.name },
    { label: "Category", value: product.category?.name },
    { label: "Product Type", value: PRODUCT_TYPES.find((t) => t.value === product.product_type)?.label ?? product.product_type },
    { label: "Description", value: product.description },
  ];

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "gray.50" }}>
      <Box sx={{ px: 2, pt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <IconButton onClick={onBack} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800, letterSpacing: "0.15em", display: "block" }}>
              Product Detail
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {product.name}
            </Typography>
          </Box>
          {product.sbu && (
            <Chip label={product.sbu.name} size="small" variant="outlined" sx={sbuChipSx(product.sbu.name)} />
          )}
          {product.is_active === false && (
            <Chip label="Inactive" size="small" />
          )}
          {canEdit && (
            <Button size="small" onClick={() => onEdit(product)}>Edit</Button>
          )}
          {canEdit && (
            <Button size="small" disabled={toggleBusy} onClick={() => onToggleActive(product)}>
              {product.is_active === false ? "Reactivate" : "Deactivate"}
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 2, pb: 2 }}>
        <Box sx={{ bgcolor: "background.paper", borderRadius: "1rem", boxShadow: shadows.sm, border: "1px solid", borderColor: "gray.100", p: 2.5 }}>
          <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 800, letterSpacing: "0.15em", display: "block", mb: 2 }}>
            Product Details
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {fields.map((f) => (
              <Box key={f.label}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800, textTransform: "uppercase", display: "block", mb: 0.5 }}>
                  {f.label}
                </Typography>
                <Typography sx={{ fontWeight: 700, whiteSpace: f.label === "Description" ? "pre-wrap" : undefined }}>{f.value || "—"}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <ProductPricesCard prices={product.prices as ProductPricesShape | null | undefined} roleName={userProfile?.role_name} />

        <CollateralLinksCard productId={productId} canEdit={canEdit} />
      </Box>
    </Box>
  );
}

export default function ProductCatalogScreen({
  onDrillToPipeline,
}: {
  // Opens the Opportunity Pipeline list filtered to the given slice (DemoApp.handleDrillToPipeline).
  onDrillToPipeline: (filter: { productId: string; openOnly: boolean; expectedCount: number }, label: string) => void;
}) {
  const { userProfile } = useAuth();
  const canEdit = CATALOG_WRITE_ROLES.has(userProfile?.role_name);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sbuFilter, setSbuFilter] = useState("");
  // "Show inactive" is for the GM and Admin only (BR-CAT-07); the server also ignores it for others.
  const [showInactive, setShowInactive] = useState(false);
  const includeInactive = canEdit && showInactive;
  const [deactivating, setDeactivating] = useState<{ id: string; name: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const debouncedSearch = useDebouncedValue(search);

  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    queryFn: () => listSbus() as Promise<SbuOption[]>,
    staleTime: Infinity,
  });

  const listFilters = {
    search: debouncedSearch || undefined,
    sbu_id: sbuFilter || undefined,
    include_inactive: includeInactive,
  };

  // Items and count fire in parallel — neither depends on the other's result, only on
  // the same filter/page state (Guiding Principle 3, Frontend-Implementation-Standards §3.1).
  const { data: productsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", "list", debouncedSearch, sbuFilter, includeInactive, page],
    queryFn: () =>
      listProducts({ ...listFilters, page, page_size: pageSize, include_count: false }) as Promise<{
        items: ProductListResponse[];
      }>,
  });
  const { data: total = 0 } = useQuery({
    queryKey: ["products", "count", debouncedSearch, sbuFilter, includeInactive],
    queryFn: () => countProducts(listFilters) as Promise<number>,
  });

  const products = productsData?.items ?? [];
  const totalPages = Math.ceil(total / pageSize);

  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingProduct(null);
    setDialogMode("create");
  };

  const openEdit = (product: ProductResponse) => {
    setEditingProduct(product);
    const prices = (product.prices ?? {}) as ProductPricesShape;
    setForm({
      sbu_id: product.sbu_id,
      brand_id: product.brand_id,
      model_id: product.model_id,
      description: product.description ?? "",
      product_type: product.product_type,
      full_price_lakhs: prices.full_price_lakhs ?? "",
      rep_floor_lakhs: prices.rep_floor_lakhs ?? "",
      area_manager_floor_lakhs: prices.area_manager_floor_lakhs ?? "",
      ceo_floor_lakhs: prices.ceo_floor_lakhs ?? "",
      cost_lakhs: prices.cost_lakhs ?? "",
    });
    setDialogMode("edit");
  };

  const closeDialog = () => setDialogMode(null);

  // An empty price box is sent as null: on Add that means "not entered", on
  // Edit it clears the saved figure (the server treats an explicit null so).
  const buildPayload = () => ({
    sbu_id: form.sbu_id,
    model_id: form.model_id,
    description: form.description.trim() || null,
    product_type: form.product_type,
    ...Object.fromEntries(PRICE_FIELDS.map(({ key }) => [key, form[key].trim() || null])),
  });

  const checkPrices = () => {
    for (const { key, label } of PRICE_FIELDS) {
      const value = form[key].trim();
      if (value && !PRICE_PATTERN.test(value)) {
        throw new Error(`${label} must be an amount in lakhs, 0 or more, with up to 2 decimals`);
      }
    }
    // Price order (plan D15) -- the server checks the same rule; this shows the
    // message at once. Full >= Rep's >= Area Manager's >= CEO's >= Cost,
    // equal allowed, the three lowest all-or-none and needing the Full price.
    const entered = PRICE_FIELDS.filter(({ key }) => form[key].trim() !== "");
    const lowestCount = entered.filter(({ key }) => LOWEST_KEYS.has(key)).length;
    if (lowestCount > 0 && lowestCount < LOWEST_KEYS.size) {
      throw new Error("Enter all three lowest prices (Rep's, Area Manager's and CEO's), or leave all three blank");
    }
    if (lowestCount > 0 && form.full_price_lakhs.trim() === "") {
      throw new Error("Enter the Full price too, the lowest prices need it");
    }
    for (let i = 1; i < entered.length; i += 1) {
      if (Number(form[entered[i].key]) > Number(form[entered[i - 1].key])) {
        throw new Error(`${entered[i].label} can't be more than ${entered[i - 1].label}`);
      }
    }
  };

  const handleSaved = () => {
    invalidateProducts();
    if (selectedProductId) {
      queryClient.invalidateQueries({ queryKey: ["product", selectedProductId] });
    }
  };

  const handleCreate = async () => {
    if (!form.sbu_id) throw new Error("SBU is required");
    if (!form.model_id) throw new Error("Model is required");
    checkPrices();
    await createProduct(buildPayload());
    handleSaved();
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    if (!form.sbu_id) throw new Error("SBU is required");
    if (!form.model_id) throw new Error("Model is required");
    checkPrices();
    await updateProduct(editingProduct.id, buildPayload());
    handleSaved();
  };

  // Reactivate runs at once (a refusal, e.g. another active product for the same
  // Model, shows as a plain message); Deactivate first opens the pop-up below.
  const reactivateMutation = useMutation({
    mutationFn: (productId: string) => reactivateProduct(productId),
    onSuccess: () => {
      setActionError(null);
      handleSaved();
    },
    onError: (err) => setActionError(extractApiErrorMessage(err, "Couldn't reactivate this product")),
  });

  const handleToggleActive = (product: { id: string; name: string; is_active: boolean | null }) => {
    setActionError(null);
    if (product.is_active === false) {
      reactivateMutation.mutate(product.id);
    } else {
      setDeactivating({ id: product.id, name: product.name });
    }
  };

  // How many open Opportunities and waiting marketing leads still use the product.
  // Informational only -- it never blocks the Deactivate (plan D3). Fetched fresh
  // each time the pop-up opens (gcTime 0).
  const { data: usage, isError: usageError } = useQuery({
    queryKey: ["product-usage", deactivating?.id],
    queryFn: () => getProductUsage(deactivating!.id),
    enabled: deactivating !== null,
    gcTime: 0,
  });

  const handleDeactivate = async () => {
    if (!deactivating) return;
    await deactivateProduct(deactivating.id);
    handleSaved();
  };

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  const deactivateModal = (
    <FormModal
      isOpen={deactivating !== null}
      onClose={() => setDeactivating(null)}
      title={`Deactivate "${deactivating?.name ?? ""}"?`}
      onSubmit={handleDeactivate}
      submitLabel="Deactivate"
    >
      {usageError ? (
        <Alert severity="error">Couldn't check where this product is used — try again.</Alert>
      ) : !usage ? (
        <Typography color="text.secondary">Checking where this product is used…</Typography>
      ) : (
        <>
          <Typography>
            {usage.open_opportunity_count > 0 && deactivating ? (
              <Button
                type="button"
                variant="text"
                size="small"
                sx={{ p: 0, minWidth: 0, verticalAlign: "baseline", textTransform: "none", fontSize: "inherit" }}
                onClick={() => {
                  onDrillToPipeline(
                    { productId: deactivating.id, openOnly: true, expectedCount: usage.open_opportunity_count },
                    deactivating.name,
                  );
                  setDeactivating(null);
                }}
              >
                {plural(usage.open_opportunity_count, "open Opportunity", "open Opportunities")}
              </Button>
            ) : (
              plural(usage.open_opportunity_count, "open Opportunity", "open Opportunities")
            )}{" "}
            and {plural(usage.waiting_lead_count, "marketing lead", "marketing leads")} waiting for a decision use this
            product.
          </Typography>
          <Alert severity="info">
            They'll keep working exactly as before — deactivating only stops this product from being picked for{" "}
            <strong>new</strong> Opportunity lines and marketing leads. Reactivate any time from "Show inactive" on the
            Product Catalog.
          </Alert>
        </>
      )}
    </FormModal>
  );

  const actionErrorAlert = actionError && (
    <Alert severity="error" sx={{ mx: 2, mt: 2 }} onClose={() => setActionError(null)}>
      {actionError}
    </Alert>
  );

  if (selectedProductId) {
    return (
      <>
        {actionErrorAlert}
        <ProductDetail
          productId={selectedProductId}
          onBack={() => setSelectedProductId(null)}
          onEdit={(product) => openEdit(product)}
          onToggleActive={handleToggleActive}
          toggleBusy={reactivateMutation.isPending}
          canEdit={canEdit}
        />
        <FormModal
          isOpen={dialogMode === "edit"}
          onClose={closeDialog}
          title="Edit Product"
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        >
          <ProductFormFields form={form} setForm={setForm} sbus={sbus} canManageCatalog={canEdit} />
        </FormModal>
        {deactivateModal}
      </>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "gray.50" }}>
      {actionErrorAlert}
      <Box sx={{ px: 2, pt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Product Catalog</Typography>
          {canEdit && (
            <Button variant="contained" onClick={openCreate}>+ Add</Button>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, mb: 3, bgcolor: "background.paper", p: 2, borderRadius: "1rem", boxShadow: shadows.sm, border: "1px solid", borderColor: "gray.100" }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <TextField
              placeholder="Search by product, brand or SBU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearch(""); setPage(1); }}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />
            {sbus.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label="All"
                  size="small"
                  onClick={() => { setSbuFilter(""); setPage(1); }}
                  color={sbuFilter === "" ? "primary" : "default"}
                  variant={sbuFilter === "" ? "filled" : "outlined"}
                />
                {sbus.map((sbu) => (
                  <Chip
                    key={sbu.id}
                    label={sbu.name}
                    size="small"
                    onClick={() => { setSbuFilter(sbu.id); setPage(1); }}
                    color={sbuFilter === sbu.id ? "primary" : "default"}
                    variant={sbuFilter === sbu.id ? "filled" : "outlined"}
                  />
                ))}
                {canEdit && (
                  <Chip
                    label="Show inactive"
                    size="small"
                    onClick={() => { setShowInactive((v) => !v); setPage(1); }}
                    color={showInactive ? "primary" : "default"}
                    variant={showInactive ? "filled" : "outlined"}
                  />
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 2, pb: 2 }}>
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={() => refetch()}>Retry</Button>}>
            Failed to load products
          </Alert>
        )}

        {isLoading && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
            Loading products...
          </Typography>
        )}

        {!isLoading && !isError && (
          <>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {products.map((product) => (
                <Box
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  sx={{
                    bgcolor: "background.paper",
                    p: 2.5,
                    borderRadius: "1rem",
                    boxShadow: shadows.sm,
                    border: "1px solid",
                    borderColor: "gray.100",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    "&:hover": { borderColor: "blue.400", boxShadow: shadows.md },
                    "&:hover [data-part='product-name']": { color: "blue.900" },
                    "&:hover [data-part='product-avatar']": { bgcolor: "amber.600", color: "common.white" },
                    "&:hover [data-part='product-chevron-box']": { bgcolor: "blue.50" },
                    "&:hover [data-part='product-chevron-icon']": { color: "primary.main" },
                  }}
                >
                  {/* Opacity scoped to the info side -- a child can't undo its
                      parent's opacity, so the Reactivate / Deactivate button
                      lives outside this dimmed Box (same as User Directory). */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, opacity: product.is_active === false ? 0.5 : 1 }}>
                    <Box
                      data-part="product-avatar"
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: "amber.50",
                        color: "amber.600",
                        borderRadius: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        typography: "body2",
                        boxShadow: shadows.sm,
                        flexShrink: 0,
                        transition: "background-color 0.15s, color 0.15s",
                      }}
                    >
                      {product.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box>
                      <Typography data-part="product-name" variant="body2" sx={{ fontWeight: 700, color: "gray.800", transition: "color 0.15s" }}>{product.name}</Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                        {product.is_active === false && (
                          <Chip label="Inactive" size="small" sx={{ height: 20, typography: "caption2" }} />
                        )}
                        {product.sbu && (
                          <Chip label={product.sbu.name} size="small" variant="outlined" sx={{ ...sbuChipSx(product.sbu.name), height: 20, typography: "caption2" }} />
                        )}
                        {product.product_type !== "NEW_EQUIPMENT" && (
                          <Chip
                            label={PRODUCT_TYPES.find((t) => t.value === product.product_type)?.label ?? product.product_type}
                            size="small"
                            color={product.product_type === "REFURBISHED" ? "warning" : "secondary"}
                            sx={{ height: 20, typography: "caption2" }}
                          />
                        )}
                        {product.brand?.name && (
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>{product.brand.name}</Typography>
                        )}
                        {product.model?.name && (
                          <Typography variant="caption" color="text.secondary">{product.model.name}</Typography>
                        )}
                        {product.category?.name && (
                          <Chip label={product.category.name} size="small" variant="outlined" sx={{ height: 20, typography: "caption2" }} />
                        )}
                      </Box>
                      <ListPriceLine prices={product.prices as ProductPricesShape | null | undefined} />
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0, ml: 1 }}>
                    {canEdit && (
                      <Button
                        size="small"
                        disabled={reactivateMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(product);
                        }}
                      >
                        {product.is_active === false ? "Reactivate" : "Deactivate"}
                      </Button>
                    )}
                    <Box data-part="product-chevron-box" sx={{ bgcolor: "background.default", p: 1, borderRadius: "0.75rem", transition: "background-color 0.15s" }}>
                      <ChevronRightIcon data-part="product-chevron-icon" sx={{ width: 18, height: 18, color: "gray.400", transition: "color 0.15s" }} />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>

            {products.length === 0 && (
              <Box sx={{ textAlign: "center", py: 6, bgcolor: "background.paper", borderRadius: "1.5rem", border: "2px dashed", borderColor: "divider" }}>
                <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                  {search ? `No products or brands matching "${search}".` : "No products found."}
                </Typography>
              </Box>
            )}

            {totalPages > 1 && (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mt: 3 }}>
                <Button size="small" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Prev
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Page {page} of {totalPages} ({total} total)
                </Typography>
                <Button size="small" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      <FormModal
        isOpen={dialogMode === "create"}
        onClose={closeDialog}
        title="Add Product"
        onSubmit={handleCreate}
        submitLabel="Add Product"
      >
        <ProductFormFields form={form} setForm={setForm} sbus={sbus} canManageCatalog={canEdit} />
      </FormModal>

      {deactivateModal}
    </Box>
  );
}

function ProductFormFields({
  form,
  setForm,
  sbus,
  canManageCatalog,
}: {
  form: typeof EMPTY_FORM;
  setForm: Dispatch<SetStateAction<typeof EMPTY_FORM>>;
  sbus: SbuOption[];
  canManageCatalog: boolean;
}) {
  const queryClient = useQueryClient();
  const set = (field: keyof typeof EMPTY_FORM, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const { data: brands = [] } = useQuery({
    queryKey: ["brands", form.sbu_id],
    queryFn: () => listBrands(form.sbu_id) as Promise<BrandResponse[]>,
    enabled: !!form.sbu_id,
  });
  const { data: models = [] } = useQuery({
    queryKey: ["models", form.brand_id],
    queryFn: () => listModels(form.brand_id) as Promise<ModelResponse[]>,
    enabled: !!form.brand_id,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", form.sbu_id],
    queryFn: () => listCategories(form.sbu_id) as Promise<CategoryResponse[]>,
    enabled: !!form.sbu_id,
  });

  const selectedBrand = brands.find((b) => b.id === form.brand_id) ?? null;
  const selectedModel = models.find((m) => m.id === form.model_id) ?? null;

  // "Just added" confirmations: the inline add forms below collapse back
  // into the screen they're nested in (no modal closes), so a newly
  // created value showing up selected is easy to mistake for one that was
  // already there. A brief named confirmation, cleared after a few
  // seconds, closes that gap without a full toast system (2026-09-22).
  const [brandJustAdded, setBrandJustAdded] = useState<string | null>(null);
  const [categoryJustAdded, setCategoryJustAdded] = useState<string | null>(null);
  const [modelJustAdded, setModelJustAdded] = useState<string | null>(null);

  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [brandError, setBrandError] = useState<string | null>(null);
  const addBrandMutation = useMutation({
    mutationFn: () => createBrand({ sbu_id: form.sbu_id, name: newBrandName.trim() }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["brands", form.sbu_id] });
      const brand = created as BrandResponse;
      setForm((f) => ({ ...f, brand_id: brand.id, model_id: "" }));
      setNewBrandName("");
      setBrandError(null);
      setAddingBrand(false);
      setBrandJustAdded(brand.name);
      setTimeout(() => setBrandJustAdded(null), 4000);
    },
    onError: (err) => setBrandError(extractApiErrorMessage(err, "Failed to add brand")),
  });

  const [addingModel, setAddingModel] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [newModelCategoryId, setNewModelCategoryId] = useState("");
  const [modelError, setModelError] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const addCategoryMutation = useMutation({
    mutationFn: () => createCategory({ sbu_id: form.sbu_id, name: newCategoryName.trim() }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["categories", form.sbu_id] });
      const category = created as CategoryResponse;
      setNewModelCategoryId(category.id);
      setNewCategoryName("");
      setCategoryError(null);
      setAddingCategory(false);
      setCategoryJustAdded(category.name);
      setTimeout(() => setCategoryJustAdded(null), 4000);
    },
    onError: (err) => setCategoryError(extractApiErrorMessage(err, "Failed to add category")),
  });

  const addModelMutation = useMutation({
    mutationFn: () => createModel({ brand_id: form.brand_id, category_id: newModelCategoryId, name: newModelName.trim() }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["models", form.brand_id] });
      const model = created as ModelResponse;
      setForm((f) => ({ ...f, model_id: model.id }));
      setNewModelName("");
      setNewModelCategoryId("");
      setModelError(null);
      setAddingModel(false);
      setModelJustAdded(model.name);
      setTimeout(() => setModelJustAdded(null), 4000);
    },
    onError: (err) => setModelError(extractApiErrorMessage(err, "Failed to add model")),
  });

  return (
    <>
      <TextField
        select
        label="SBU *"
        value={form.sbu_id}
        onChange={(e) => setForm((f) => ({ ...f, sbu_id: e.target.value, brand_id: "", model_id: "" }))}
        fullWidth
        size="small"
        autoFocus
        sx={{ mt: 1.5 }}
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      >
        <MenuItem value="">Select SBU...</MenuItem>
        {sbus.map((s) => (
          <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
        ))}
      </TextField>

      <Autocomplete
        options={brands}
        getOptionLabel={(b) => b.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        value={selectedBrand}
        disabled={!form.sbu_id}
        onChange={(_e, newValue) => setForm((f) => ({ ...f, brand_id: newValue?.id ?? "", model_id: "" }))}
        renderInput={(params) => <TextField {...params} label="Brand *" size="small" placeholder="Select a Brand..." />}
      />
      {canManageCatalog && form.sbu_id && (
        addingBrand ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {brandError && <Alert severity="error" onClose={() => setBrandError(null)}>{brandError}</Alert>}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                label="New brand name"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                size="small"
                fullWidth
                autoFocus
              />
              <Button size="small" variant="contained" disabled={!newBrandName.trim() || addBrandMutation.isPending} onClick={() => addBrandMutation.mutate()}>
                Add
              </Button>
              <Button size="small" onClick={() => { setAddingBrand(false); setNewBrandName(""); setBrandError(null); }}>Cancel</Button>
            </Box>
          </Box>
        ) : (
          <Button size="small" sx={{ alignSelf: "flex-start" }} onClick={() => setAddingBrand(true)}>+ Add new brand</Button>
        )
      )}
      {brandJustAdded && (
        <Alert severity="success" onClose={() => setBrandJustAdded(null)}>
          Brand "{brandJustAdded}" added
        </Alert>
      )}

      <Autocomplete
        options={models}
        getOptionLabel={(m) => m.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        value={selectedModel}
        disabled={!form.brand_id}
        onChange={(_e, newValue) => set("model_id", newValue?.id ?? "")}
        renderInput={(params) => <TextField {...params} label="Model *" size="small" placeholder={form.brand_id ? "Select a Model..." : "Select a Brand first"} />}
      />
      {canManageCatalog && form.brand_id && (
        addingModel ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, bgcolor: "gray.50", borderRadius: "0.75rem" }}>
            {modelError && <Alert severity="error" onClose={() => setModelError(null)}>{modelError}</Alert>}
            <TextField
              label="New model name"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              size="small"
              fullWidth
              autoFocus
            />
            <TextField
              select
              label="Category *"
              value={newModelCategoryId}
              onChange={(e) => setNewModelCategoryId(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Select Category...</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
            {addingCategory ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {categoryError && <Alert severity="error" onClose={() => setCategoryError(null)}>{categoryError}</Alert>}
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    label="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <Button size="small" variant="contained" disabled={!newCategoryName.trim() || addCategoryMutation.isPending} onClick={() => addCategoryMutation.mutate()}>
                    Add
                  </Button>
                  <Button size="small" onClick={() => { setAddingCategory(false); setNewCategoryName(""); setCategoryError(null); }}>Cancel</Button>
                </Box>
              </Box>
            ) : (
              <Button size="small" sx={{ alignSelf: "flex-start" }} onClick={() => setAddingCategory(true)}>+ Add new category</Button>
            )}
            {categoryJustAdded && (
              <Alert severity="success" onClose={() => setCategoryJustAdded(null)}>
                Category "{categoryJustAdded}" added
              </Alert>
            )}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                disabled={!newModelName.trim() || !newModelCategoryId || addModelMutation.isPending}
                onClick={() => addModelMutation.mutate()}
              >
                Add Model
              </Button>
              <Button size="small" onClick={() => { setAddingModel(false); setNewModelName(""); setNewModelCategoryId(""); setModelError(null); }}>Cancel</Button>
            </Box>
          </Box>
        ) : (
          <Button size="small" sx={{ alignSelf: "flex-start" }} onClick={() => setAddingModel(true)}>+ Add new model</Button>
        )
      )}
      {modelJustAdded && (
        <Alert severity="success" onClose={() => setModelJustAdded(null)}>
          Model "{modelJustAdded}" added
        </Alert>
      )}

      <TextField
        label="Category"
        value={selectedModel?.category?.name ?? ""}
        fullWidth
        size="small"
        disabled
        slotProps={{ inputLabel: { shrink: true } }}
        helperText="Set automatically from the selected Model"
      />

      <TextField
        select
        label="Product Type"
        value={form.product_type}
        onChange={(e) => set("product_type", e.target.value)}
        fullWidth
        size="small"
      >
        {PRODUCT_TYPES.map((t) => (
          <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
        ))}
      </TextField>
      <TextField
        label="Description"
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Optional product description..."
        multiline
        rows={3}
        fullWidth
        size="small"
      />

      {canManageCatalog && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, bgcolor: "gray.50", borderRadius: "0.75rem" }}>
          <Box>
            <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 800, letterSpacing: "0.15em", display: "block" }}>
              Prices
            </Typography>
            <Typography variant="caption" color="text.secondary">
              In ₹ Lakhs, up to 2 decimals. Leave a box empty if not set.
            </Typography>
          </Box>
          {PRICE_FIELDS.map(({ key, label }) => (
            <TextField
              key={key}
              label={label}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                htmlInput: { inputMode: "decimal" },
                input: { startAdornment: <InputAdornment position="start">₹</InputAdornment>, endAdornment: <InputAdornment position="end">L</InputAdornment> },
              }}
            />
          ))}
        </Box>
      )}
    </>
  );
}
