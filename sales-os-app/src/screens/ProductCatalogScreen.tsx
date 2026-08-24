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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { listProducts, countProducts, getProduct, createProduct, updateProduct } from "../services/products";
import { listProductDocuments, createProductDocument, deleteDocument } from "../services/documents";
import { listSbus } from "../services/masterData";
import { useAuth } from "../contexts/AuthContext";
import useDebouncedValue from "../hooks/useDebouncedValue";
import FormModal from "../components/FormModal";
import type { ProductListResponse, ProductResponse, DocumentResponse } from "../types/api-aliases";

const CATALOG_WRITE_ROLES = new Set(["General Manager", "Admin"]);

interface SbuOption {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  name: "",
  sbu_id: "",
  oem_name: "",
  model_number: "",
  category_name: "",
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

function CollateralLinksCard({ productId }: { productId: string }) {
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
        <Button size="small" onClick={() => setShowAddLink((v) => !v)}>
          {showAddLink ? "Cancel" : "+ Add Link"}
        </Button>
      </Box>

      {showAddLink && (
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
                <IconButton
                  size="small"
                  onClick={() => deleteLinkMutation.mutate(doc.id)}
                  disabled={deleteLinkMutation.isPending && deleteLinkMutation.variables === doc.id}
                  aria-label="Remove link"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
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
    { label: "OEM / Brand", value: product.oem_name },
    { label: "Model Number", value: product.model_number },
    { label: "Category", value: product.category_name },
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

        <CollateralLinksCard productId={productId} />
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
      name: product.name,
      sbu_id: product.sbu_id,
      oem_name: product.oem_name ?? "",
      model_number: product.model_number ?? "",
      category_name: product.category_name ?? "",
      description: product.description ?? "",
      product_type: product.product_type,
    });
    setDialogMode("edit");
  };

  const closeDialog = () => setDialogMode(null);

  const buildPayload = () => ({
    name: form.name.trim(),
    sbu_id: form.sbu_id,
    oem_name: form.oem_name.trim() || null,
    model_number: form.model_number.trim() || null,
    category_name: form.category_name.trim() || null,
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
    if (!form.name.trim()) throw new Error("Product name is required");
    if (!form.sbu_id) throw new Error("SBU is required");
    await createProduct(buildPayload());
    handleSaved();
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    if (!form.name.trim()) throw new Error("Product name is required");
    if (!form.sbu_id) throw new Error("SBU is required");
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
          <ProductFormFields form={form} setForm={setForm} sbus={sbus} />
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
                        {product.oem_name && (
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>{product.oem_name}</Typography>
                        )}
                        {product.model_number && (
                          <Typography variant="caption" color="text.secondary">{product.model_number}</Typography>
                        )}
                        {product.category_name && (
                          <Chip label={product.category_name} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.6875rem" }} />
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
        <ProductFormFields form={form} setForm={setForm} sbus={sbus} />
      </FormModal>
    </Box>
  );
}

function ProductFormFields({
  form,
  setForm,
  sbus,
}: {
  form: typeof EMPTY_FORM;
  setForm: Dispatch<SetStateAction<typeof EMPTY_FORM>>;
  sbus: SbuOption[];
}) {
  const set = (field: keyof typeof EMPTY_FORM, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <>
      <TextField
        label="Product Name *"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        placeholder="e.g. Ultrasound Scanner"
        fullWidth
        size="small"
        autoFocus
        sx={{ mt: 1.5 }}
      />
      <TextField
        select
        label="SBU *"
        value={form.sbu_id}
        onChange={(e) => set("sbu_id", e.target.value)}
        fullWidth
        size="small"
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      >
        <MenuItem value="">Select SBU...</MenuItem>
        {sbus.map((s) => (
          <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
        ))}
      </TextField>
      <TextField
        label="OEM / Brand"
        value={form.oem_name}
        onChange={(e) => set("oem_name", e.target.value)}
        placeholder="e.g. Siemens"
        fullWidth
        size="small"
      />
      <TextField
        label="Model Number"
        value={form.model_number}
        onChange={(e) => set("model_number", e.target.value)}
        placeholder="e.g. ACUSON-P500"
        fullWidth
        size="small"
      />
      <TextField
        label="Category"
        value={form.category_name}
        onChange={(e) => set("category_name", e.target.value)}
        placeholder="e.g. Diagnostics"
        fullWidth
        size="small"
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
