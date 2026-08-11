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

export async function listOpportunityDocuments(opportunityId: string): Promise<unknown> {
  const response = await api.get(`/opportunities/${opportunityId}/documents`);
  return response.data.data;
}

export async function uploadOpportunityDocument(opportunityId: string, file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file);
  // api's instance default is Content-Type: application/json (see lib/api.ts).
  // Without this override, axios JSON-serializes the FormData instead of
  // sending it as real multipart data -- the backend then sees no "file"
  // field at all. Must override here, not just omit the header, since the
  // instance default otherwise wins.
  const response = await api.post(`/opportunities/${opportunityId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

export async function getDocumentDownloadUrl(documentId: string): Promise<unknown> {
  const response = await api.get(`/documents/${documentId}/download-url`);
  return response.data.data;
}
