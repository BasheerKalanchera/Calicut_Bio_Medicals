/* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability --
   Pre-existing debt in this file's manual .then()/SWR-cache pattern, which
   docs/Frontend-Implementation-Standards.md §9 marks superseded (pending
   React Query migration). TODO: delete this disable block when this file
   migrates (§9) — do not hand-fix individually, the rewrite removes the
   pattern that causes these. */
import { useEffect, useState, useCallback, useRef } from "react";
import { listProducts, countProducts, getProduct, createProduct, updateProduct } from "../services/products";
import { listSbus } from "../services/masterData";



import useDebouncedValue from "../hooks/useDebouncedValue";

const CACHE_TTL_MS = 30_000;
const productListCache = new Map();

function getCacheKey(params) {
  return JSON.stringify(params);
}

function getCached(key) {
  const entry = productListCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    productListCache.delete(key);
    return null;
  }
  return entry;
}

function setCache(key, data) {
  productListCache.set(key, { ...data, fetchedAt: Date.now() });
}

const EMPTY_FORM = {
  name: "",
  sbu_id: "",
  oem_name: "",
  model_number: "",
  category_name: "",
  description: "",
};

function ProductFormModal({ mode, initial, onClose, onSaved }) {
  const [sbus, setSbus] = useState([]);
  useEffect(() => {
    listSbus().then(setSbus).catch(() => {});
  }, []);

  const [form, setForm] = useState(
    mode === "edit"
      ? {
          name: initial.name ?? "",
          sbu_id: initial.sbu_id ?? "",
          oem_name: initial.oem_name ?? "",
          model_number: initial.model_number ?? "",
          category_name: initial.category_name ?? "",
          description: initial.description ?? "",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        sbu_id: form.sbu_id,
        oem_name: form.oem_name.trim() || null,
        model_number: form.model_number.trim() || null,
        category_name: form.category_name.trim() || null,
        description: form.description.trim() || null,
      };
      let saved;
      if (mode === "edit") {
        saved = await updateProduct(initial.id, payload);
      } else {
        saved = await createProduct(payload);
      }
      onSaved(saved);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const isValid = form.name.trim() && form.sbu_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="font-extrabold text-lg text-gray-800">
            {mode === "edit" ? "Edit Product" : "Add Product"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Ultrasound Scanner"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
              SBU <span className="text-red-500">*</span>
            </label>
            <select
              value={form.sbu_id}
              onChange={(e) => set("sbu_id", e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select SBU...</option>
              {sbus.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
              OEM / Brand
            </label>
            <input
              type="text"
              value={form.oem_name}
              onChange={(e) => set("oem_name", e.target.value)}
              placeholder="e.g. Siemens"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
              Model Number
            </label>
            <input
              type="text"
              value={form.model_number}
              onChange={(e) => set("model_number", e.target.value)}
              placeholder="e.g. ACUSON-P500"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <input
              type="text"
              value={form.category_name}
              onChange={(e) => set("category_name", e.target.value)}
              placeholder="e.g. Diagnostics"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional product description..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !isValid}
              className="flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-40"
            >
              {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductDetail({ productId, onBack, onEdit }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = useCallback(() => {
    setLoading(true);
    setError(null);
    getProduct(productId)
      .then(setProduct)
      .catch((err) => setError(err.message || "Failed to load product"))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50">
        <div className="text-center py-12">
          <div className="text-gray-400 font-bold text-sm animate-pulse">Loading product...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:bg-gray-200 transition-all mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchProduct} className="ml-4 shrink-0 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const fields = [
    { label: "OEM / Brand", value: product.oem_name },
    { label: "Model Number", value: product.model_number },
    { label: "Category", value: product.category_name },
    { label: "Description", value: product.description },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 animate-in fade-in duration-200">
      {/* Fixed header */}
      <div className="px-4 pt-4 bg-gray-50">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:bg-gray-200 transition-all shrink-0"
            aria-label="Back"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-0.5">
              Product Detail
            </h3>
            <h2 className="font-extrabold text-xl text-gray-800 tracking-tight leading-tight truncate">
              {product.name}
            </h2>
          </div>
          {product.sbu && (
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border shrink-0 ${
              product.sbu.name === "Imaging"
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}>
              {product.sbu.name}
            </span>
          )}
          <button
            onClick={() => onEdit(product)}
            className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider shrink-0"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
            Product Details
          </h4>
          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.label}>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  {f.label}
                </div>
                <div className="font-bold text-gray-800">{f.value || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductCatalogScreen() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [sbuFilter, setSbuFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [sbus, setSbus] = useState([]);

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [modal, setModal] = useState(null); // null | { mode: "create" } | { mode: "edit", product }

  const debouncedSearch = useDebouncedValue(search);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    listSbus().then(setSbus).catch(() => {});
  }, []);

  const fetchProducts = useCallback((opts = {}) => {
    const filters = {};
    if (debouncedSearch) filters.search = debouncedSearch;
    if (sbuFilter) filters.sbu_id = sbuFilter;

    const cacheKey = getCacheKey({ ...filters, page, page_size: pageSize });
    const cached = getCached(cacheKey);
    const isBackground = opts.background === true;

    if (cached && !isBackground) {
      setProducts(cached.items);
      setTotal(cached.total);
      setLoading(false);
      setError(null);
      fetchProducts({ background: true });
      return;
    }

    if (!isBackground) {
      setLoading(true);
      setError(null);
    }

    // Items fire first — no count blocking, loading spinner clears as soon as items arrive.
    // Count fires only after items resolve, by which point the Supabase client has the
    // session cached in memory, eliminating the concurrent localStorage / JWT-parse race.
    listProducts({ ...filters, page, page_size: pageSize, include_count: false })
      .then((data) => {
        if (!isMountedRef.current) return;
        if (!isBackground) {
          setProducts(data.items);
          setLoading(false);
        }
        countProducts(filters)
          .then((total) => {
            if (!isMountedRef.current) return;
            setTotal(total);
            setCache(cacheKey, { items: data.items, total });
            if (isBackground) setProducts(data.items);
          })
          .catch(() => {
            if (!isBackground) setCache(cacheKey, { items: data.items, total: 0 });
          });
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        if (!isBackground) {
          setError(err.message || "Failed to load products");
          setLoading(false);
        }
      });
  }, [debouncedSearch, sbuFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.ceil(total / pageSize);

  function handleSaved(saved) {
    productListCache.clear();
    setModal(null);
    if (selectedProductId) {
      // In detail view — refresh the detail
      setSelectedProductId(null);
      setTimeout(() => setSelectedProductId(saved.id), 0);
    } else {
      fetchProducts();
    }
  }

  if (selectedProductId) {
    return (
      <>
        <ProductDetail
          productId={selectedProductId}
          onBack={() => setSelectedProductId(null)}
          onEdit={(product) => setModal({ mode: "edit", product })}
        />
        {modal?.mode === "edit" && (
          <ProductFormModal
            mode="edit"
            initial={modal.product}
            onClose={() => setModal(null)}
            onSaved={handleSaved}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 animate-in fade-in duration-200">
        {/* Fixed: title + filters */}
        <div className="px-4 pt-4 bg-gray-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">
              Product Catalog
            </h2>
            <button
              onClick={() => setModal({ mode: "create" })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0"
            >
              + Add
            </button>
          </div>

          <div className="flex gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex-1 space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by product, brand or SBU..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  autoComplete="off"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); setPage(1); }}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-xs"
                  >
                    &times;
                  </button>
                )}
              </div>
              {sbus.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setSbuFilter(""); setPage(1); }}
                    className={`px-3 py-1 rounded-full text-xs font-black border transition-all ${
                      sbuFilter === ""
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    All
                  </button>
                  {sbus.map((sbu) => (
                    <button
                      key={sbu.id}
                      onClick={() => { setSbuFilter(sbu.id); setPage(1); }}
                      className={`px-3 py-1 rounded-full text-xs font-black border transition-all ${
                        sbuFilter === sbu.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      {sbu.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable product list */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold mb-4 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchProducts}
                className="ml-4 shrink-0 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
              >
                Retry
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 font-bold text-sm animate-pulse">
                Loading products...
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProductId(product.id)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-sm group-hover:text-blue-900 transition-colors">
                          {product.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                          {product.sbu && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-normal normal-case border ${
                                product.sbu.name === "Imaging"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {product.sbu.name}
                            </span>
                          )}
                          {product.oem_name && (
                            <>
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <span className="text-[10px] font-black text-gray-500 tracking-normal normal-case">
                                {product.oem_name}
                              </span>
                            </>
                          )}
                          {product.model_number && (
                            <>
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <span className="text-[10px] font-bold text-gray-400 tracking-normal normal-case">
                                {product.model_number}
                              </span>
                            </>
                          )}
                          {product.category_name && (
                            <>
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-normal normal-case border bg-gray-50 text-gray-600 border-gray-200">
                                {product.category_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-blue-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              {products.length === 0 && (
                <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
                  {search ? `No products or brands matching "${search}".` : "No products found."}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold text-gray-500">
                    Page {page} of {totalPages} ({total} total)
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {modal?.mode === "create" && (
        <ProductFormModal
          mode="create"
          initial={null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
