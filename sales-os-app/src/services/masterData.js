import api from "../lib/api";

export async function listSbus() {
  const response = await api.get("/master-data/sbus");
  return response.data.data;
}
