import api from "../lib/api";
import type { ProductUsageResponse } from "../types/api-aliases";

type Params = Record<string, string | number | boolean>;

export async function listProducts(
  { search, sbu_id, page = 1, page_size = 50, include_count = true, include_inactive = false }: { search?: string; sbu_id?: string; page?: number; page_size?: number; include_count?: boolean; include_inactive?: boolean } = {}
): Promise<unknown> {
  const params: Params = { page, page_size };
  if (search) params.search = search;
  if (sbu_id) params.sbu_id = sbu_id;
  if (!include_count) params.include_count = false;
  // GM/Admin only -- the server ignores it for every other role.
  if (include_inactive) params.include_inactive = true;
  const response = await api.get("/products", { params });
  return response.data.data;
}

export async function countProducts(
  { search, sbu_id, include_inactive = false }: { search?: string; sbu_id?: string; include_inactive?: boolean } = {}
): Promise<unknown> {
  const params: Params = {};
  if (search) params.search = search;
  if (sbu_id) params.sbu_id = sbu_id;
  if (include_inactive) params.include_inactive = true;
  const response = await api.get("/products/count", { params });
  return response.data.data;
}

export async function getProduct(productId: string): Promise<unknown> {
  const response = await api.get(`/products/${productId}`);
  return response.data.data;
}

export async function createProduct(data: Record<string, unknown>): Promise<unknown> {
  const response = await api.post("/products", data);
  return response.data.data;
}

export async function updateProduct(productId: string, data: Record<string, unknown>): Promise<unknown> {
  const response = await api.put(`/products/${productId}`, data);
  return response.data.data;
}

// Product Deactivate / Reactivate (BR-CAT-07): GM and Admin only.
export async function getProductUsage(productId: string): Promise<ProductUsageResponse> {
  const response = await api.get(`/products/${productId}/usage`);
  return response.data.data;
}

export async function deactivateProduct(productId: string): Promise<unknown> {
  const response = await api.post(`/products/${productId}/deactivate`);
  return response.data.data;
}

export async function reactivateProduct(productId: string): Promise<unknown> {
  const response = await api.post(`/products/${productId}/reactivate`);
  return response.data.data;
}
