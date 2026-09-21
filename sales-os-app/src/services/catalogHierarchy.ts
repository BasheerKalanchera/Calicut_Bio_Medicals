import api from "../lib/api";

export async function listBrands(sbuId: string): Promise<unknown> {
  const response = await api.get("/reference/brands", { params: { sbu_id: sbuId } });
  return response.data.data;
}

export async function createBrand(data: { sbu_id: string; name: string }): Promise<unknown> {
  const response = await api.post("/reference/brands", data);
  return response.data.data;
}

export async function listCategories(sbuId: string): Promise<unknown> {
  const response = await api.get("/reference/categories", { params: { sbu_id: sbuId } });
  return response.data.data;
}

export async function createCategory(data: { sbu_id: string; name: string }): Promise<unknown> {
  const response = await api.post("/reference/categories", data);
  return response.data.data;
}

export async function listModels(brandId: string): Promise<unknown> {
  const response = await api.get("/reference/models", { params: { brand_id: brandId } });
  return response.data.data;
}

export async function createModel(data: { brand_id: string; category_id: string; name: string }): Promise<unknown> {
  const response = await api.post("/reference/models", data);
  return response.data.data;
}
