import api from "../lib/api";

export async function listAllProjects({ search, page = 1, page_size = 50 } = {}) {
  const params = { page, page_size };
  if (search) params.search = search;
  const response = await api.get("/projects", { params });
  return response.data.data;
}
