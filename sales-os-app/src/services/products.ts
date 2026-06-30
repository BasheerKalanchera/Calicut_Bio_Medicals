import api from "../lib/api";

type Params = Record<string, string | number | boolean>;

export async function listProducts(
  { search, sbu_id, page = 1, page_size = 50, include_count = true }: { search?: string; sbu_id?: number; page?: number; page_size?: number; include_count?: boolean } = {}
): Promise<unknown> {
  const params: Params = { page, page_size };
  if (search) params.search = search;
  if (sbu_id) params.sbu_id = sbu_id;
  if (!include_count) params.include_count = false;
  const response = await api.get("/products", { params });
  return response.data.data;
}

export async function countProducts(
  { search, sbu_id }: { search?: string; sbu_id?: number } = {}
): Promise<unknown> {
  const params: Params = {};
  if (search) params.search = search;
  if (sbu_id) params.sbu_id = sbu_id;
  const response = await api.get("/products/count", { params });
  return response.data.data;
}

export async function getProduct(productId: number): Promise<unknown> {
  const response = await api.get(`/products/${productId}`);
  return response.data.data;
}

export async function createProduct(data: Record<string, unknown>): Promise<unknown> {
  const response = await api.post("/products", data);
  return response.data.data;
}

export async function updateProduct(productId: number, data: Record<string, unknown>): Promise<unknown> {
  const response = await api.put(`/products/${productId}`, data);
  return response.data.data;
}
