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
import { listProducts, countProducts, getProduct, createProduct, updateProduct } from "../services/products";
import { listProductDocuments, createProductDocument, deleteDocument } from "../services/documents";
import { listBrands, createBrand, listModels, createModel, listCategories, createCategory } from "../services/catalogHierarchy";
import { listSbus } from "../services/masterData";
import { useAuth } from "../contexts/AuthContext";
import useDebouncedValue from "../hooks/useDebouncedValue";
import FormModal from "../components/FormModal";
import type { ProductListResponse, ProductResponse, DocumentResponse, BrandResponse, CategoryResponse, ModelResponse } from "../types/api-aliases";

const CATALOG_WRITE_ROLES = new Set(["General Manager", "Admin"]);

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
    ? { bgcolor: "#eef2ff", color: "#4338ca", borderColor: "#c7d2fe" }
    : { bgcolor: "#fff1f2", color: "#be123c", borderColor: "#fecdd3" };
}

function CollateralLinksCard({ productId, canEdit }: { productId: string; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const [showAddLink, setShowAddLink] = useState(false);
  const [form, setForm] = useState(EMPTY_LINK_FORM);
  const [saveError, setSaveError] = useState<string | null>(null);

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
    <Box sx={{ bgcolor: "background.paper", borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6", p: 2.5, mt: 2 }}>
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
          sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2, p: 2, bgcolor: "#f9fafb", borderRadius: "0.75rem" }}
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
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, px: 1.5, py: 1.25, bgcolor: "#f9fafb", borderRadius: "0.75rem" }}
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
                    onClick={() => deleteLinkMutation.mutate(doc.id)}
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
    </Box>
  );
}

function ProductDetail({
  productId,
  onBack,
  onEdit,
  canEdit,
}: {
  productId: string;
  onBack: () => void;
  onEdit: (product: ProductResponse) => void;
  canEdit: boolean;
}) {
  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId) as Promise<ProductResponse>,
  });

  if (isLoading) {
    return (
      <Box sx={{ flex: 1, overflow: "auto", p: 2, bgcolor: "#f9fafb" }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
          Loading product...
        </Typography>
      </Box>
    );
  }

  if (isError || !product) {
    return (
      <Box sx={{ flex: 1, overflow: "auto", p: 2, bgcolor: "#f9fafb" }}>
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
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#f9fafb" }}>
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
          {canEdit && (
            <Button size="small" onClick={() => onEdit(product)}>Edit</Button>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 2, pb: 2 }}>
        <Box sx={{ bgcolor: "background.paper", borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6", p: 2.5 }}>
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

        <CollateralLinksCard productId={productId} canEdit={canEdit} />
      </Box>
    </Box>
  );
}

export default function ProductCatalogScreen() {
  const { userProfile } = useAuth();
  const canEdit = CATALOG_WRITE_ROLES.has(userProfile?.role_name);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sbuFilter, setSbuFilter] = useState("");
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

  const listFilters = { search: debouncedSearch || undefined, sbu_id: sbuFilter || undefined };

  // Items and count fire in parallel — neither depends on the other's result, only on
  // the same filter/page state (Guiding Principle 3, Frontend-Implementation-Standards §3.1).
  const { data: productsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", "list", debouncedSearch, sbuFilter, page],
    queryFn: () =>
      listProducts({ ...listFilters, page, page_size: pageSize, include_count: false }) as Promise<{
        items: ProductListResponse[];
      }>,
  });
  const { data: total = 0 } = useQuery({
    queryKey: ["products", "count", debouncedSearch, sbuFilter],
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
    setForm({
      sbu_id: product.sbu_id,
      brand_id: product.brand_id,
      model_id: product.model_id,
      description: product.description ?? "",
      product_type: product.product_type,
    });
    setDialogMode("edit");
  };

  const closeDialog = () => setDialogMode(null);

  const buildPayload = () => ({
    sbu_id: form.sbu_id,
    model_id: form.model_id,
    description: form.description.trim() || null,
    product_type: form.product_type,
  });

  const handleSaved = () => {
    invalidateProducts();
    if (selectedProductId) {
      queryClient.invalidateQueries({ queryKey: ["product", selectedProductId] });
    }
  };

  const handleCreate = async () => {
    if (!form.sbu_id) throw new Error("SBU is required");
    if (!form.model_id) throw new Error("Model is required");
    await createProduct(buildPayload());
    handleSaved();
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    if (!form.sbu_id) throw new Error("SBU is required");
    if (!form.model_id) throw new Error("Model is required");
    await updateProduct(editingProduct.id, buildPayload());
    handleSaved();
  };

  if (selectedProductId) {
    return (
      <>
        <ProductDetail
          productId={selectedProductId}
          onBack={() => setSelectedProductId(null)}
          onEdit={(product) => openEdit(product)}
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
      </>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#f9fafb" }}>
      <Box sx={{ px: 2, pt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Product Catalog</Typography>
          {canEdit && (
            <Button variant="contained" onClick={openCreate}>+ Add</Button>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, mb: 3, bgcolor: "background.paper", p: 2, borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
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
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    border: "1px solid #f3f4f6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    "&:hover": { borderColor: "#60a5fa", boxShadow: "0 4px 6px rgba(0,0,0,0.07)" },
                    "&:hover [data-part='product-name']": { color: "#1e3a8a" },
                    "&:hover [data-part='product-avatar']": { bgcolor: "#d97706", color: "#fff" },
                    "&:hover [data-part='product-chevron-box']": { bgcolor: "#eff6ff" },
                    "&:hover [data-part='product-chevron-icon']": { color: "primary.main" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      data-part="product-avatar"
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: "#fffbeb",
                        color: "#d97706",
                        borderRadius: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: "0.875rem",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        flexShrink: 0,
                        transition: "background-color 0.15s, color 0.15s",
                      }}
                    >
                      {product.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box>
                      <Typography data-part="product-name" sx={{ fontWeight: 700, fontSize: "0.875rem", color: "#1f2937", transition: "color 0.15s" }}>{product.name}</Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                        {product.sbu && (
                          <Chip label={product.sbu.name} size="small" variant="outlined" sx={{ ...sbuChipSx(product.sbu.name), height: 20, fontSize: "0.6875rem" }} />
                        )}
                        {product.product_type !== "NEW_EQUIPMENT" && (
                          <Chip
                            label={PRODUCT_TYPES.find((t) => t.value === product.product_type)?.label ?? product.product_type}
                            size="small"
                            color={product.product_type === "REFURBISHED" ? "warning" : "secondary"}
                            sx={{ height: 20, fontSize: "0.6875rem" }}
                          />
                        )}
                        {product.brand?.name && (
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>{product.brand.name}</Typography>
                        )}
                        {product.model?.name && (
                          <Typography variant="caption" color="text.secondary">{product.model.name}</Typography>
                        )}
                        {product.category?.name && (
                          <Chip label={product.category.name} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.6875rem" }} />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box data-part="product-chevron-box" sx={{ bgcolor: "background.default", p: 1, borderRadius: "0.75rem", flexShrink: 0, ml: 1, transition: "background-color 0.15s" }}>
                    <ChevronRightIcon data-part="product-chevron-icon" sx={{ fontSize: 18, color: "#9ca3af", transition: "color 0.15s" }} />
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, bgcolor: "#f9fafb", borderRadius: "0.75rem" }}>
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
    </>
  );
}
