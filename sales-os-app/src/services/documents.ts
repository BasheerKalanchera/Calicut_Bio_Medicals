import api from "../lib/api";

export async function listProductDocuments(productId: string): Promise<unknown> {
  const response = await api.get(`/products/${productId}/documents`);
  return response.data.data;
}

export async function createProductDocument(
  productId: string,
  data: { file_name: string; file_type: string; storage_path: string }
): Promise<unknown> {
  const response = await api.post(`/products/${productId}/documents`, data);
  return response.data.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await api.delete(`/documents/${documentId}`);
}
