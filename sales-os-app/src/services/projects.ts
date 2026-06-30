import api from "../lib/api";

type Params = Record<string, string | number | boolean>;

export async function listAllProjects(
  { search, page = 1, page_size = 50 }: { search?: string; page?: number; page_size?: number } = {}
): Promise<unknown> {
  const params: Params = { page, page_size };
  if (search) params.search = search;
  const response = await api.get("/projects", { params });
  return response.data.data;
}
