import api from "../lib/api";
import type { AuditLogPage } from "../types/api-aliases";

type Params = Record<string, string | number | boolean>;

export async function listAuditLog(
  {
    table_name,
    date_from,
    date_to,
    page = 1,
    page_size = 50,
  }: { table_name?: string; date_from?: string; date_to?: string; page?: number; page_size?: number } = {}
): Promise<AuditLogPage> {
  const params: Params = { page, page_size };
  if (table_name) params.table_name = table_name;
  if (date_from) params.date_from = date_from;
  if (date_to) params.date_to = date_to;
  const response = await api.get("/admin/audit-log", { params });
  return response.data.data;
}
