import api from "../lib/api";

export async function listProducts({ search, sbu_id, brand, page = 1, page_size = 50, include_count = true } = {}) {
  const params = { page, page_size };
  if (search) params.search = search;
  if (sbu_id) params.sbu_id = sbu_id;
  if (brand) params.brand = brand;
  if (!include_count) params.include_count = false;
  const response = await api.get("/products", { params });
  return response.data.data;
}

export async function countProducts({ search, sbu_id, brand } = {}) {
  const params = {};
  if (search) params.search = search;
  if (sbu_id) params.sbu_id = sbu_id;
  if (brand) params.brand = brand;
  const response = await api.get("/products/count", { params });
  return response.data.data;
}

export async function getProduct(productId) {
  const response = await api.get(`/products/${productId}`);
  return response.data.data;
}

export async function createProduct(data) {
  const response = await api.post("/products", data);
  return response.data.data;
}

export async function updateProduct(productId, data) {
  const response = await api.put(`/products/${productId}`, data);
  return response.data.data;
}
